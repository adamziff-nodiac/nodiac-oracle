#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "geopandas>=1.0",
#     "shapely>=2.0",
#     "requests>=2.31",
#     "pyproj>=3.6",
# ]
# ///
"""
Enrich substations with utility ownership via spatial join against
HIFLD Electric Retail Service Territories (ArcGIS FeatureServer).

Reads:  public/data/prospective-substations.json
Writes: public/data/prospective-substations.json (overwrite, enriched)

Run: uv run scripts/enrich-substations.py
"""

import json
import math
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
import requests
from shapely.geometry import Point, Polygon, MultiPolygon

DATA_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
SUBS_PATH = DATA_DIR / "prospective-substations.json"

# HIFLD Electric Retail Service Territories — ArcGIS FeatureServer (polygons)
TERRITORIES_URL = (
    "https://services3.arcgis.com/OYP7N6mAJJCyH6hd/arcgis/rest/services/"
    "Electric_Retail_Service_Territories_HIFLD/FeatureServer/0/query"
)

# ArcGIS fields to request
ARCGIS_OUT_FIELDS = "NAME,TYPE,HOLDING_CO,CUSTOMERS,SUMMR_PEAK"

# Compact field mapping: ArcGIS field name → our output key
TERRITORY_FIELDS = ["NAME", "TYPE", "HOLDING_CO", "CUSTOMERS", "SUMMR_PEAK"]

# Max distance (meters) for nearest-territory fallback
NEAREST_FALLBACK_M = 10_000  # 10 km

# Sentinel for missing numeric data in HIFLD
HIFLD_SENTINEL = -999999


def load_substations() -> list[dict]:
    print(f"Loading substations from {SUBS_PATH}...")
    with open(SUBS_PATH) as f:
        subs = json.load(f)
    print(f"  Loaded {len(subs)} substations")
    return subs


def rings_to_shapely(rings: list[list[list[float]]]) -> Polygon | MultiPolygon:
    """Convert ArcGIS rings to Shapely geometry.

    ArcGIS polygon rings: outer rings are clockwise, holes are counter-clockwise.
    Shapely expects exterior ring + list of holes per polygon.
    """
    if not rings:
        return Polygon()

    # Determine ring orientation: clockwise = exterior, CCW = hole
    def signed_area(ring):
        """Shoelace formula — positive = CW (exterior in ArcGIS)."""
        area = 0.0
        n = len(ring)
        for i in range(n):
            j = (i + 1) % n
            area += ring[i][0] * ring[j][1]
            area -= ring[j][0] * ring[i][1]
        return area / 2.0

    exteriors = []
    holes = []
    for ring in rings:
        coords = [(pt[0], pt[1]) for pt in ring]
        if signed_area(ring) >= 0:
            exteriors.append(coords)
        else:
            holes.append(coords)

    if len(exteriors) == 0:
        # All rings are CCW — treat as single exterior (some data quirk)
        return Polygon([(pt[0], pt[1]) for pt in rings[0]])

    if len(exteriors) == 1:
        return Polygon(exteriors[0], holes)

    # Multiple exterior rings → MultiPolygon
    # Simple heuristic: assign holes to the exterior that contains them
    polys = []
    for ext in exteriors:
        ext_poly = Polygon(ext)
        matching_holes = [h for h in holes if ext_poly.contains(Point(h[0]))]
        polys.append(Polygon(ext, matching_holes))
    return MultiPolygon(polys) if len(polys) > 1 else polys[0]


def download_territories() -> gpd.GeoDataFrame:
    """Download utility territory polygons from HIFLD ArcGIS, paginated."""
    print("Downloading Electric Retail Service Territories from HIFLD ArcGIS...")
    page_size = 500
    offset = 0
    rows = []

    while True:
        params = {
            "where": "1=1",
            "outFields": ARCGIS_OUT_FIELDS,
            "returnGeometry": "true",
            "outSR": "4326",
            "resultOffset": str(offset),
            "resultRecordCount": str(page_size),
            "f": "json",
        }
        print(f"  Fetching offset={offset}...")
        resp = requests.get(TERRITORIES_URL, params=params, timeout=120)
        resp.raise_for_status()
        data = resp.json()

        if "error" in data:
            print(f"  API error: {data['error']}")
            sys.exit(1)

        features = data.get("features", [])
        if not features:
            break

        for feat in features:
            geom_data = feat.get("geometry", {})
            rings = geom_data.get("rings")
            if not rings:
                continue
            geom = rings_to_shapely(rings)
            if geom.is_empty:
                continue

            attrs = feat.get("attributes", {})
            row = {"geometry": geom}
            for field in TERRITORY_FIELDS:
                val = attrs.get(field)
                # Clean sentinel values
                if isinstance(val, (int, float)) and val == HIFLD_SENTINEL:
                    val = None
                row[field] = val
            rows.append(row)

        offset += len(features)
        if not data.get("exceededTransferLimit") and len(features) < page_size:
            break

    print(f"  Downloaded {len(rows)} territory polygons")
    if not rows:
        print("ERROR: No territories downloaded")
        sys.exit(1)

    gdf = gpd.GeoDataFrame(rows, crs="EPSG:4326")
    return gdf


def enrich(subs: list[dict], territories: gpd.GeoDataFrame) -> list[dict]:
    """Spatial join substations to utility territories."""
    print("\nBuilding substation points...")
    points = [Point(s["x"], s["y"]) for s in subs]
    subs_gdf = gpd.GeoDataFrame(
        {"idx": range(len(subs))},
        geometry=points,
        crs="EPSG:4326",
    )

    # Spatial join: point within polygon
    print("Running spatial join (point-in-polygon)...")
    joined = gpd.sjoin(subs_gdf, territories, how="left", predicate="within")

    # Handle duplicates from overlapping territories — keep first match
    joined = joined[~joined.index.duplicated(keep="first")]

    matched = joined["NAME"].notna().sum()
    unmatched_mask = joined["NAME"].isna()
    unmatched_count = unmatched_mask.sum()
    print(f"  Matched: {matched} ({matched / len(subs) * 100:.1f}%)")
    print(f"  Unmatched: {unmatched_count}")

    # Nearest-territory fallback for unmatched substations
    if unmatched_count > 0:
        print(f"\nRunning nearest-territory fallback (within {NEAREST_FALLBACK_M / 1000:.0f}km)...")
        unmatched_indices = joined[unmatched_mask].index

        # Project to a metric CRS for distance calculations
        territories_proj = territories.to_crs("EPSG:5070")
        unmatched_points = subs_gdf.loc[unmatched_indices].to_crs("EPSG:5070")

        nearest_matched = 0
        total_unmatched = len(unmatched_indices)
        for count, idx in enumerate(unmatched_indices):
            if count % 5000 == 0 and count > 0:
                print(f"    Progress: {count}/{total_unmatched}...")
            pt = unmatched_points.loc[idx, "geometry"]
            distances = territories_proj.geometry.distance(pt)
            min_dist = distances.min()
            if min_dist <= NEAREST_FALLBACK_M:
                nearest_idx = distances.idxmin()
                for field in TERRITORY_FIELDS:
                    joined.loc[idx, field] = territories.loc[nearest_idx, field]
                nearest_matched += 1

        print(f"  Nearest fallback matched: {nearest_matched}")
        total_matched = matched + nearest_matched
        print(f"  Total matched: {total_matched} ({total_matched / len(subs) * 100:.1f}%)")

    # Write enriched fields back to substations
    print("\nWriting enriched fields to substations...")

    def safe_str(val) -> str | None:
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return None
        s = str(val).strip()
        return s if s else None

    def safe_int(val) -> int | None:
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return None
        try:
            v = int(val)
            return v if v > 0 else None
        except (ValueError, TypeError):
            return None

    def safe_float(val) -> float | None:
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return None
        try:
            v = float(val)
            return round(v, 1) if v > 0 else None
        except (ValueError, TypeError):
            return None

    for i, sub in enumerate(subs):
        row = joined.loc[i]
        utility_name = safe_str(row.get("NAME"))
        if utility_name:
            sub["u"] = utility_name
            sub["ut"] = safe_str(row.get("TYPE")) or ""
            sub["hc"] = safe_str(row.get("HOLDING_CO"))
            sub["cust"] = safe_int(row.get("CUSTOMERS"))
            sub["sp"] = safe_float(row.get("SUMMR_PEAK"))
        else:
            sub["u"] = None
            sub["ut"] = None
            sub["hc"] = None
            sub["cust"] = None
            sub["sp"] = None

    return subs


def main():
    subs = load_substations()
    territories = download_territories()
    enriched = enrich(subs, territories)

    print(f"\nWriting enriched data to {SUBS_PATH}...")
    with open(SUBS_PATH, "w") as f:
        json.dump(enriched, f, separators=(",", ":"))

    # Stats
    with_utility = sum(1 for s in enriched if s.get("u"))
    file_size_mb = SUBS_PATH.stat().st_size / (1024 * 1024)
    print(f"  Wrote {len(enriched)} substations ({file_size_mb:.1f}MB)")
    print(f"  With utility: {with_utility} ({with_utility / len(enriched) * 100:.1f}%)")
    print("\nDone!")


if __name__ == "__main__":
    main()
