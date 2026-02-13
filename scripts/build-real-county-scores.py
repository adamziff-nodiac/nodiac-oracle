# /// script
# requires-python = ">=3.12"
# dependencies = ["openpyxl", "requests"]
# ///
"""
Real county scores data pipeline.

Downloads and processes public datasets to compute per-county scores
for the Regional Hub Strategy heat map.

Usage:
    uv run scripts/build-real-county-scores.py

Data Sources:
    - Co-op Density:     EIA Form 861 (2024) — Service Territory + Frame
    - Grid Reliability:  EIA Form 861 (2024) — Reliability metrics
    - Curtailment Proxy: EIA Form 860 (2024) — Variable renewable MW per county
    - Labor:             Census County Business Patterns (2023) — NAICS 5182/5415/517
    - Fiber:             FCC BDC Dec 2024 (primary) — Fiber availability at BSLs via ArcGIS
                         Census ACS 5-Year 2023 (fallback) — Broadband subscriptions proxy
    - Permitting:        State DC incentive data (NCSL, SDI Alliance, H5, NAIOP, Data Center Watch)

Output:
    - public/data/county-scores.json (static fallback for frontend)
    - Optional: Supabase upsert (if SUPABASE_URL and SUPABASE_SECRET_KEY set)
"""

import csv
import io
import json
import math
import os
import sys
import tempfile
import zipfile
from collections import defaultdict
from pathlib import Path

import openpyxl
import requests

# ============================================================
# Configuration
# ============================================================

# County FIPS reference from Census
FIPS_URL = "https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt"

# EIA Form 861 (co-op density + grid reliability)
EIA_861_URL = "https://www.eia.gov/electricity/data/eia861/zip/f8612024.zip"

# EIA Form 861 multi-year reliability data (2013-2024, reliability reporting started 2013)
EIA_861_RELIABILITY_YEARS = list(range(2013, 2025))  # 2013 through 2024
EIA_861_ARCHIVE_URL_TEMPLATE = "https://www.eia.gov/electricity/data/eia861/archive/zip/f861{year}.zip"
EIA_861_CURRENT_URL = "https://www.eia.gov/electricity/data/eia861/zip/f8612024.zip"

# EIA Form 860 (renewable capacity / curtailment proxy)
EIA_860_URL = "https://www.eia.gov/electricity/data/eia860/xls/eia8602024.zip"

# Census CBP (IT labor)
CBP_API_BASE = "https://api.census.gov/data/2023/cbp"
CBP_NAICS_CODES = ["5182", "5415", "517"]

# Census population estimates
POP_URL = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/counties/totals/co-est2024-alldata.csv"

# Census ACS 5-Year broadband (fiber fallback)
ACS_BROADBAND_URL = "https://api.census.gov/data/2023/acs/acs5"

# FCC BDC (primary fiber source) — via ArcGIS Living Atlas county summaries
# Data: FCC Broadband Data Collection, Dec 2024 vintage
# Fields: TotalBSLs, ServedBSLsFiber, UnderservedBSLsFiber, UniqueProvidersFiber
FCC_BDC_ARCGIS_URL = (
    "https://services8.arcgis.com/peDZJliSvYims39Q/arcgis/rest/services/"
    "FCC_Broadband_Data_Collection_December_2024_View/FeatureServer/1/query"
)

# FIPS crosswalk for EIA data
FIPS_CROSSWALK_URL = "https://raw.githubusercontent.com/kjhealy/fips-codes/master/state_and_county_fips_master.csv"

# Skip US territories
SKIP_STATES = {"AS", "GU", "MP", "PR", "VI"}

# Variable renewable technologies (for curtailment score)
VARIABLE_RENEWABLES = {
    "Solar Photovoltaic",
    "Solar Thermal with Energy Storage",
    "Solar Thermal without Energy Storage",
    "Onshore Wind Turbine",
    "Offshore Wind Turbine",
}

# Congestion-prone balancing authorities (proxy for curtailment)
CONGESTION_BAS = {"CISO", "ERCO", "MISO", "SPP", "BPAT", "IID", "NEVP"}

# Output path
OUTPUT_PATH = Path("public/data/county-scores.json")


# ============================================================
# Utility functions
# ============================================================

def log(msg: str):
    print(f"  {msg}", flush=True)


def download(url: str, desc: str) -> bytes:
    """Download a URL with progress indication."""
    print(f"\n>>> Downloading {desc}...", flush=True)
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()
    size_mb = len(resp.content) / 1024 / 1024
    log(f"Downloaded {size_mb:.1f} MB")
    return resp.content


def percentile_rank(values: list[float]) -> list[float]:
    """Convert values to percentile ranks (0-1)."""
    n = len(values)
    if n == 0:
        return []
    indexed = sorted(enumerate(values), key=lambda x: x[1])
    ranks = [0.0] * n
    for rank, (orig_idx, _) in enumerate(indexed):
        ranks[orig_idx] = rank / max(n - 1, 1)
    return ranks


def normalize_county_name(name: str) -> str:
    """Normalize county name for FIPS matching."""
    name = name.strip()
    # Fix double spaces
    while "  " in name:
        name = name.replace("  ", " ")
    # St -> St.
    if name.startswith("St "):
        name = "St. " + name[3:]
    # Ste -> Ste.
    if name.startswith("Ste "):
        name = "Ste. " + name[4:]
    return name


# Manual FIPS overrides for known mismatches
MANUAL_FIPS: dict[tuple[str, str], str] = {
    ("FL", "Miami Dade"): "12086",
    ("FL", "miami dade"): "12086",
    ("MD", "Prince Georges"): "24033",
    ("MD", "prince georges"): "24033",
    ("MD", "Queen Annes"): "24035",
    ("MD", "queen annes"): "24035",
    ("LA", "DeSoto"): "22031",
    ("LA", "desoto"): "22031",
    ("IL", "DeWitt"): "17039",
    ("IL", "dewitt"): "17039",
    ("NM", "Dona Ana"): "35013",
    ("NM", "dona ana"): "35013",
    ("SD", "Oglala Lakota"): "46102",
    ("SD", "oglala lakota"): "46102",
    # Alaska census areas (old names -> current FIPS)
    ("AK", "Juneau"): "02110",
    ("AK", "juneau"): "02110",
    ("AK", "Sitka"): "02220",
    ("AK", "sitka"): "02220",
    ("AK", "Yakutat"): "02282",
    ("AK", "yakutat"): "02282",
    ("AK", "Kusilvak"): "02158",
    ("AK", "kusilvak"): "02158",
    ("AK", "Matanuska Susitna"): "02170",
    ("AK", "matanuska susitna"): "02170",
    ("AK", "Prince of Wales Ketchikan"): "02198",
    ("AK", "prince of wales ketchikan"): "02198",
    ("AK", "Skagway Hoonah Angoon"): "02105",
    ("AK", "skagway hoonah angoon"): "02105",
    ("AK", "Valdez Cordova"): "02261",
    ("AK", "valdez cordova"): "02261",
    ("AK", "Wrangell Petersburg"): "02275",
    ("AK", "wrangell petersburg"): "02275",
    ("AK", "Yukon Koyukuk"): "02290",
    ("AK", "yukon koyukuk"): "02290",
    # St. Mary's MD special case
    ("MD", "St Marys"): "24037",
    ("MD", "st marys"): "24037",
    # Louisiana double-space fix
    ("LA", "St  Helena"): "22091",
    ("LA", "st  helena"): "22091",
}


# ============================================================
# Step 1: Build FIPS lookup
# ============================================================

def build_fips_lookup() -> dict[tuple[str, str], str]:
    """Build (state_abbr, county_name_lower) -> 5-digit FIPS lookup."""
    print("\n=== Building FIPS lookup ===", flush=True)

    data = download(FIPS_CROSSWALK_URL, "FIPS crosswalk")
    reader = csv.DictReader(io.StringIO(data.decode("utf-8")))

    lookup: dict[tuple[str, str], str] = {}
    for row in reader:
        state = row["state"]
        name = row["name"]
        fips = row["fips"].zfill(5)
        if state == "NA":
            continue

        # Strip common suffixes
        for suffix in [" County", " Parish", " Borough", " Census Area",
                       " Municipality", " city"]:
            name = name.replace(suffix, "")
        name = name.strip()

        lookup[(state, name.lower())] = fips

    log(f"FIPS lookup: {len(lookup)} entries")
    return lookup


def resolve_fips(state: str, county: str, fips_lookup: dict) -> str | None:
    """Resolve (state, county_name) to 5-digit FIPS code."""
    # Try manual override first
    manual = MANUAL_FIPS.get((state, county))
    if manual:
        return manual
    manual = MANUAL_FIPS.get((state, county.lower()))
    if manual:
        return manual

    # Normalize and try
    normalized = normalize_county_name(county)
    fips = fips_lookup.get((state, normalized.lower()))
    if fips:
        return fips

    # Try original (no normalization)
    fips = fips_lookup.get((state, county.lower().strip()))
    if fips:
        return fips

    return None


# ============================================================
# Step 2: Co-op Density from EIA-861
# ============================================================

def compute_coop_density(tmpdir: str, fips_lookup: dict) -> dict[str, float]:
    """Compute co-op density score per county from EIA Form 861."""
    print("\n=== Computing Co-op Density (EIA-861) ===", flush=True)

    # Download and extract
    zipdata = download(EIA_861_URL, "EIA Form 861 (2024)")
    zf = zipfile.ZipFile(io.BytesIO(zipdata))
    names = zf.namelist()
    log(f"ZIP contains {len(names)} files")

    # Extract needed files
    frame_file = [n for n in names if "Frame" in n and n.endswith(".xlsx")][0]
    territory_file = [n for n in names if "Service_Territory" in n and n.endswith(".xlsx")][0]

    frame_path = os.path.join(tmpdir, "frame.xlsx")
    territory_path = os.path.join(tmpdir, "territory.xlsx")

    with open(frame_path, "wb") as f:
        f.write(zf.read(frame_file))
    with open(territory_path, "wb") as f:
        f.write(zf.read(territory_file))

    # Also extract Reliability file for grid score
    reliability_files = [n for n in names if "Reliability" in n and n.endswith(".xlsx")]
    reliability_path = None
    if reliability_files:
        reliability_path = os.path.join(tmpdir, "reliability.xlsx")
        with open(reliability_path, "wb") as f:
            f.write(zf.read(reliability_files[0]))
        log(f"Extracted reliability file: {reliability_files[0]}")

    zf.close()

    # Build ownership lookup from Frame
    log("Parsing Frame (ownership types)...")
    wb_frame = openpyxl.load_workbook(frame_path, read_only=True)
    ws_frame = wb_frame["Frame"]

    ownership_map: dict[int, str] = {}
    for i, row in enumerate(ws_frame.iter_rows(values_only=True)):
        if i == 0:
            continue  # Skip header
        util_num = row[1]
        ownership = row[5] if len(row) > 5 else None
        if util_num and ownership:
            ownership_map[util_num] = str(ownership)
    wb_frame.close()
    log(f"Ownership map: {len(ownership_map)} utilities")

    # Parse Service Territory
    log("Parsing Service Territory (county mapping)...")
    wb_terr = openpyxl.load_workbook(territory_path, read_only=True)
    ws_terr = wb_terr["Counties_States"]

    county_utils: dict[str, list[str]] = defaultdict(list)
    matched = 0
    missed = 0

    for i, row in enumerate(ws_terr.iter_rows(values_only=True)):
        if i == 0:
            continue  # Skip header
        util_num = row[1]
        state = str(row[4]).strip() if row[4] else ""
        county = str(row[5]).strip() if row[5] else ""

        if not state or not county or county == "Not Applicable":
            continue
        if state in SKIP_STATES:
            continue

        ownership = ownership_map.get(util_num, "Unknown")
        fips = resolve_fips(state, county, fips_lookup)

        if fips:
            matched += 1
            county_utils[fips].append(ownership)
        else:
            missed += 1

    wb_terr.close()
    log(f"FIPS match rate: {matched}/{matched + missed} ({100 * matched / max(matched + missed, 1):.1f}%)")

    # Compute co-op density per county
    scores: dict[str, float] = {}
    for fips, ownerships in county_utils.items():
        total = len(ownerships)
        coops = sum(1 for o in ownerships if o == "Cooperative")
        scores[fips] = round(coops / total, 4) if total > 0 else 0.0

    pure_coop = sum(1 for s in scores.values() if s == 1.0)
    zero_coop = sum(1 for s in scores.values() if s == 0.0)
    log(f"Counties scored: {len(scores)} | Pure co-op: {pure_coop} | Zero co-op: {zero_coop}")

    return scores


# ============================================================
# Step 3: Grid Reliability from EIA-861
# ============================================================

def _download_reliability_year(year: int, tmpdir: str) -> str | None:
    """Download EIA 861 ZIP for a single year and extract the Reliability xlsx.

    Returns the path to the extracted reliability file, or None on failure.
    """
    if year == 2024:
        url = EIA_861_CURRENT_URL
    else:
        url = EIA_861_ARCHIVE_URL_TEMPLATE.format(year=year)

    try:
        resp = requests.get(url, timeout=120)
        resp.raise_for_status()
    except Exception as e:
        log(f"  {year}: download failed ({e})")
        return None

    try:
        zf = zipfile.ZipFile(io.BytesIO(resp.content))
        names = zf.namelist()
        reliability_files = [n for n in names if "Reliability" in n and n.endswith(".xlsx")]
        if not reliability_files:
            # Older years might use .xls or different naming
            reliability_files = [n for n in names if "eliability" in n.lower() and (n.endswith(".xlsx") or n.endswith(".xls"))]
        if not reliability_files:
            log(f"  {year}: no reliability file in ZIP ({len(names)} files)")
            zf.close()
            return None
        rel_path = os.path.join(tmpdir, f"reliability_{year}.xlsx")
        with open(rel_path, "wb") as f:
            f.write(zf.read(reliability_files[0]))
        zf.close()
        size_mb = os.path.getsize(rel_path) / 1024 / 1024
        log(f"  {year}: OK ({size_mb:.1f} MB, {reliability_files[0]})")
        return rel_path
    except Exception as e:
        log(f"  {year}: extraction failed ({e})")
        return None


def _parse_reliability_file(rel_path: str) -> dict[int, float]:
    """Parse a single Reliability xlsx and return {utility_number: saidi}."""
    wb_rel = openpyxl.load_workbook(rel_path, read_only=True)

    # Try common sheet names
    sheet_name = None
    for candidate in ["Reliability_States", "Reliability States", "Reliability"]:
        if candidate in wb_rel.sheetnames:
            sheet_name = candidate
            break
    if sheet_name is None:
        # Fall back to first sheet
        sheet_name = wb_rel.sheetnames[0]

    ws_rel = wb_rel[sheet_name]

    util_saidi: dict[int, float] = {}
    parsed_count = 0

    for i, row in enumerate(ws_rel.iter_rows(values_only=True)):
        if i < 3:
            continue  # Skip header rows

        vals = list(row)
        if len(vals) < 6:
            continue

        try:
            util_num = int(vals[1])
        except (ValueError, TypeError):
            continue

        parsed_count += 1

        # Try SAIDI sources in priority order:
        # 1. Col 8: IEEE Without Major Event Days (cleanest metric)
        # 2. Col 5: IEEE All Events with MED
        # 3. Col 17: Other Standard All Events
        saidi = None
        for col_idx in [8, 5, 17]:
            raw = vals[col_idx] if col_idx < len(vals) else None
            if raw is None or str(raw).strip() in (".", "", "None"):
                continue
            try:
                val = float(raw)
                if val >= 0:
                    saidi = val
                    break
            except (ValueError, TypeError):
                continue

        if saidi is not None:
            util_saidi[util_num] = saidi

    wb_rel.close()
    return util_saidi


def compute_grid_reliability(tmpdir: str, fips_lookup: dict) -> tuple[dict[str, float], dict[str, dict]]:
    """Compute grid reliability score per county from multi-year EIA-861 Reliability data.

    Downloads reliability data for all available years (2013-2024), averages SAIDI
    across years per county, and returns both scores and metadata about data coverage.

    Returns:
        (scores, metadata) where:
        - scores: {fips: reliability_score}
        - metadata: {fips: {years: [2019, 2020, ...], avg_saidi: 123.4, year_count: 5}}
    """
    print("\n=== Computing Grid Reliability (EIA-861, Multi-Year) ===", flush=True)

    territory_path = os.path.join(tmpdir, "territory.xlsx")
    if not os.path.exists(territory_path):
        log("WARNING: Territory file not found, using fallback estimates")
        return {}, {}

    # Build utility -> counties mapping from 2024 territory data
    log("Building utility-to-county mapping...")
    wb_terr = openpyxl.load_workbook(territory_path, read_only=True)
    ws_terr = wb_terr["Counties_States"]

    util_to_counties: dict[int, set[str]] = defaultdict(set)
    for i, row in enumerate(ws_terr.iter_rows(values_only=True)):
        if i == 0:
            continue
        util_num = row[1]
        state = str(row[4]).strip() if row[4] else ""
        county = str(row[5]).strip() if row[5] else ""
        if not state or not county or state in SKIP_STATES:
            continue
        fips = resolve_fips(state, county, fips_lookup)
        if fips and util_num:
            util_to_counties[util_num].add(fips)
    wb_terr.close()
    log(f"Utilities mapped to counties: {len(util_to_counties)}")

    # Download and parse reliability data for each year
    log(f"Downloading reliability data for {len(EIA_861_RELIABILITY_YEARS)} years...")

    # Per-year SAIDI by utility: {year: {util_num: saidi}}
    yearly_util_saidi: dict[int, dict[int, float]] = {}
    successful_years: list[int] = []

    # 2024 reliability file may already be extracted from the coop density step
    existing_2024 = os.path.join(tmpdir, "reliability.xlsx")
    if os.path.exists(existing_2024):
        log("  2024: using already-extracted file")
        saidi_data = _parse_reliability_file(existing_2024)
        if saidi_data:
            yearly_util_saidi[2024] = saidi_data
            successful_years.append(2024)
            log(f"  2024: {len(saidi_data)} utilities with SAIDI")

    for year in EIA_861_RELIABILITY_YEARS:
        if year in yearly_util_saidi:
            continue  # Already have 2024

        rel_path = _download_reliability_year(year, tmpdir)
        if rel_path is None:
            continue

        saidi_data = _parse_reliability_file(rel_path)
        if saidi_data:
            yearly_util_saidi[year] = saidi_data
            successful_years.append(year)
            log(f"  {year}: {len(saidi_data)} utilities with SAIDI")
        else:
            log(f"  {year}: no SAIDI data parsed")

    successful_years.sort()
    log(f"Successfully loaded {len(successful_years)} years: {successful_years}")

    if not yearly_util_saidi:
        log("WARNING: Could not parse any SAIDI data, using fallback")
        return {}, {}

    # Map SAIDI to counties per year, then average across years
    # county_yearly_saidi: {fips: {year: avg_saidi_for_that_year}}
    county_yearly_saidi: dict[str, dict[int, float]] = defaultdict(dict)

    for year, util_saidi in yearly_util_saidi.items():
        # For each year, average SAIDI across utilities serving each county
        county_year_values: dict[str, list[float]] = defaultdict(list)
        for util_num, saidi in util_saidi.items():
            for fips in util_to_counties.get(util_num, set()):
                county_year_values[fips].append(saidi)

        for fips, values in county_year_values.items():
            county_yearly_saidi[fips][year] = sum(values) / len(values)

    log(f"Counties with any SAIDI data: {len(county_yearly_saidi)}")

    # Compute multi-year average SAIDI per county
    county_avg_saidi: dict[str, float] = {}
    grid_metadata: dict[str, dict] = {}

    for fips, yearly in county_yearly_saidi.items():
        years_with_data = sorted(yearly.keys())
        avg_saidi = sum(yearly.values()) / len(yearly)
        county_avg_saidi[fips] = avg_saidi
        grid_metadata[fips] = {
            "years": years_with_data,
            "year_count": len(years_with_data),
            "min_year": min(years_with_data),
            "max_year": max(years_with_data),
            "avg_saidi": round(avg_saidi, 1),
        }

    if not county_avg_saidi:
        return {}, {}

    # Use percentile-based inverse: accounts for extreme outliers
    fips_list = sorted(county_avg_saidi.keys())
    saidi_vals = [county_avg_saidi[f] for f in fips_list]
    ranks = percentile_rank(saidi_vals)

    scores: dict[str, float] = {}
    for fips, rank in zip(fips_list, ranks):
        # Invert: lowest SAIDI (best reliability) gets highest score
        scores[fips] = round(1.0 - rank, 4)

    # Stats
    saidi_sorted = sorted(county_avg_saidi.values())
    median_saidi = saidi_sorted[len(saidi_sorted) // 2]
    year_counts = [m["year_count"] for m in grid_metadata.values()]
    avg_years = sum(year_counts) / len(year_counts)
    log(f"Counties scored: {len(scores)} | Median SAIDI: {median_saidi:.0f} min/yr")
    log(f"Avg years of data per county: {avg_years:.1f} | Range: {min(year_counts)}-{max(year_counts)}")
    return scores, grid_metadata


# ============================================================
# Step 4: Curtailment Proxy from EIA-860
# ============================================================

def compute_curtailment_proxy(tmpdir: str, fips_lookup: dict) -> dict[str, float]:
    """Compute curtailment proxy score from EIA Form 860 renewable capacity."""
    print("\n=== Computing Curtailment Proxy (EIA-860) ===", flush=True)

    # Download and extract
    zipdata = download(EIA_860_URL, "EIA Form 860 (2024)")
    zf = zipfile.ZipFile(io.BytesIO(zipdata))
    names = zf.namelist()
    log(f"ZIP contains {len(names)} files")

    plant_file = [n for n in names if "Plant" in n and n.endswith(".xlsx")][0]
    gen_file = [n for n in names if "Generator" in n and "3_1" in n and n.endswith(".xlsx")][0]

    plant_path = os.path.join(tmpdir, "plant.xlsx")
    gen_path = os.path.join(tmpdir, "generator.xlsx")

    with open(plant_path, "wb") as f:
        f.write(zf.read(plant_file))
    with open(gen_path, "wb") as f:
        f.write(zf.read(gen_file))
    zf.close()

    # Parse Plant file for location data
    log("Parsing Plant data (locations)...")
    wb_plant = openpyxl.load_workbook(plant_path, read_only=True)
    ws_plant = wb_plant["Plant"]

    plant_info: dict[int, dict] = {}  # plant_code -> {state, county, ba_code}
    for i, row in enumerate(ws_plant.iter_rows(values_only=True)):
        if i <= 1:
            continue  # Skip title + header rows
        vals = list(row)
        try:
            plant_code = int(vals[2])
        except (ValueError, TypeError):
            continue

        state = str(vals[6]).strip() if vals[6] else ""
        county = str(vals[8]).strip() if vals[8] else ""
        ba_code = str(vals[12]).strip() if vals[12] else ""

        plant_info[plant_code] = {
            "state": state,
            "county": county,
            "ba_code": ba_code,
        }
    wb_plant.close()
    log(f"Plants loaded: {len(plant_info)}")

    # Parse Generator file for renewable capacity
    log("Parsing Generator data (renewable capacity)...")
    wb_gen = openpyxl.load_workbook(gen_path, read_only=True)
    ws_op = wb_gen["Operable"]

    # Find column indices from header row (row 2)
    headers = None
    county_renewable_mw: dict[str, float] = defaultdict(float)
    county_proposed_mw: dict[str, float] = defaultdict(float)
    county_ba_codes: dict[str, set[str]] = defaultdict(set)

    for i, row in enumerate(ws_op.iter_rows(values_only=True)):
        vals = list(row)
        if i == 0:
            continue  # Title row
        if i == 1:
            headers = [str(v).strip() if v else "" for v in vals]
            continue

        if headers is None:
            continue

        # Find needed columns
        tech_idx = next((j for j, h in enumerate(headers) if h == "Technology"), None)
        cap_idx = next((j for j, h in enumerate(headers) if h == "Nameplate Capacity (MW)"), None)
        plant_idx = next((j for j, h in enumerate(headers) if h == "Plant Code"), None)
        status_idx = next((j for j, h in enumerate(headers) if h == "Status"), None)

        if any(idx is None for idx in [tech_idx, cap_idx, plant_idx]):
            continue

        tech = str(vals[tech_idx]) if vals[tech_idx] else ""
        if tech not in VARIABLE_RENEWABLES:
            continue

        status = str(vals[status_idx]) if status_idx and vals[status_idx] else "OP"
        if status not in ("OP", "SB"):
            continue

        try:
            cap = float(vals[cap_idx]) if vals[cap_idx] else 0
        except (ValueError, TypeError):
            cap = 0

        try:
            plant_code = int(vals[plant_idx])
        except (ValueError, TypeError):
            continue

        # Look up county from plant data
        pinfo = plant_info.get(plant_code, {})
        state = pinfo.get("state", "")
        county = pinfo.get("county", "")
        ba_code = pinfo.get("ba_code", "")

        if not state or not county or state in SKIP_STATES:
            continue

        fips = resolve_fips(state, county, fips_lookup)
        if fips:
            county_renewable_mw[fips] += cap
            if ba_code:
                county_ba_codes[fips].add(ba_code)

    wb_gen.close()

    # Also parse Proposed sheet for pipeline pressure
    log("Parsing Proposed generators...")
    wb_gen2 = openpyxl.load_workbook(gen_path, read_only=True)
    ws_prop = wb_gen2["Proposed"]

    prop_headers = None
    for i, row in enumerate(ws_prop.iter_rows(values_only=True)):
        vals = list(row)
        if i == 0:
            continue
        if i == 1:
            prop_headers = [str(v).strip() if v else "" for v in vals]
            continue
        if prop_headers is None:
            continue

        tech_idx = next((j for j, h in enumerate(prop_headers) if h == "Technology"), None)
        cap_idx = next((j for j, h in enumerate(prop_headers) if h == "Nameplate Capacity (MW)"), None)
        plant_idx = next((j for j, h in enumerate(prop_headers) if h == "Plant Code"), None)

        if any(idx is None for idx in [tech_idx, cap_idx, plant_idx]):
            continue

        tech = str(vals[tech_idx]) if vals[tech_idx] else ""
        if tech not in VARIABLE_RENEWABLES:
            continue

        try:
            cap = float(vals[cap_idx]) if vals[cap_idx] else 0
            plant_code = int(vals[plant_idx])
        except (ValueError, TypeError):
            continue

        pinfo = plant_info.get(plant_code, {})
        state = pinfo.get("state", "")
        county = pinfo.get("county", "")
        if state and county and state not in SKIP_STATES:
            fips = resolve_fips(state, county, fips_lookup)
            if fips:
                county_proposed_mw[fips] += cap

    wb_gen2.close()

    log(f"Counties with renewable MW: {len(county_renewable_mw)}")
    log(f"Counties with proposed MW: {len(county_proposed_mw)}")

    # Compute composite curtailment score
    # Components: renewable density (50%), pipeline pressure (20%),
    #             plant count density (15%), congestion BA flag (15%)
    all_fips = set(county_renewable_mw.keys()) | set(county_proposed_mw.keys())

    if not all_fips:
        return {}

    # Normalize renewable MW using log transform (very skewed distribution)
    mw_values = {f: county_renewable_mw.get(f, 0) for f in all_fips}
    log_mw = {f: math.log1p(mw) for f, mw in mw_values.items()}
    max_log_mw = max(log_mw.values()) if log_mw else 1
    norm_mw = {f: v / max_log_mw for f, v in log_mw.items()}

    # Pipeline pressure: proposed / (existing + 1)
    pipeline = {f: county_proposed_mw.get(f, 0) / (county_renewable_mw.get(f, 0) + 1)
                for f in all_fips}
    max_pipeline = max(pipeline.values()) if pipeline else 1
    norm_pipeline = {f: min(v / max(max_pipeline, 1), 1.0) for f, v in pipeline.items()}

    # Congestion flag from BA
    congestion = {}
    for f in all_fips:
        bas = county_ba_codes.get(f, set())
        congestion[f] = 1.0 if bas & CONGESTION_BAS else 0.0

    # Combine
    scores: dict[str, float] = {}
    for fips in all_fips:
        score = (
            0.55 * norm_mw.get(fips, 0) +
            0.20 * norm_pipeline.get(fips, 0) +
            0.25 * congestion.get(fips, 0)
        )
        scores[fips] = round(min(max(score, 0), 1), 4)

    log(f"Counties with curtailment scores: {len(scores)}")
    return scores


# ============================================================
# Step 5: IT Labor from Census CBP
# ============================================================

def compute_labor_score() -> dict[str, float]:
    """Compute IT labor score from Census County Business Patterns."""
    print("\n=== Computing IT Labor Score (Census CBP) ===", flush=True)

    # Fetch CBP data for each NAICS code
    county_emp: dict[str, int] = defaultdict(int)

    for naics in CBP_NAICS_CODES:
        url = f"{CBP_API_BASE}?get=EMP&for=county:*&in=state:*&NAICS2017={naics}&LFO=001&EMPSZES=001"
        log(f"Fetching NAICS {naics}...")

        try:
            resp = requests.get(url, timeout=60)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            log(f"WARNING: Failed to fetch NAICS {naics}: {e}")
            continue

        if not data or len(data) < 2:
            log(f"WARNING: No data for NAICS {naics}")
            continue

        for row in data[1:]:
            emp_str = row[0]
            state_fips = row[-2]
            county_fips = row[-1]
            fips = state_fips + county_fips

            try:
                emp = int(emp_str)
            except (ValueError, TypeError):
                continue

            county_emp[fips] += emp

        log(f"  NAICS {naics}: {len(data) - 1} counties")

    log(f"Total counties with IT employment: {len(county_emp)}")

    # Fetch population data
    log("Fetching population estimates...")
    pop_data = download(POP_URL, "Census population estimates")
    pop_text = pop_data.decode("latin-1")
    reader = csv.DictReader(io.StringIO(pop_text))

    county_pop: dict[str, int] = {}
    for row in reader:
        if row["SUMLEV"] != "050":
            continue
        state = row["STATE"].zfill(2)
        county = row["COUNTY"].zfill(3)
        fips = state + county
        try:
            pop = int(row["POPESTIMATE2023"])
        except (ValueError, KeyError):
            try:
                pop = int(row["POPESTIMATE2024"])
            except (ValueError, KeyError):
                continue
        county_pop[fips] = pop

    log(f"Counties with population: {len(county_pop)}")

    # Compute per-capita IT density and normalize via percentile rank
    all_fips = set(county_pop.keys())
    densities: dict[str, float] = {}

    for fips in all_fips:
        emp = county_emp.get(fips, 0)
        pop = county_pop.get(fips, 1)
        if pop > 0:
            densities[fips] = emp / pop * 10000  # per 10K residents
        else:
            densities[fips] = 0.0

    # Percentile rank normalization
    fips_list = sorted(densities.keys())
    density_vals = [densities[f] for f in fips_list]
    ranks = percentile_rank(density_vals)

    scores: dict[str, float] = {}
    for fips, rank in zip(fips_list, ranks):
        scores[fips] = round(rank, 4)

    positive = sum(1 for f in scores if county_emp.get(f, 0) > 0)
    log(f"Counties scored: {len(scores)} | With IT employment: {positive}")
    return scores


# ============================================================
# Step 6: Fiber / Broadband from Census ACS
# ============================================================

def compute_fiber_fcc_bdc() -> tuple[dict[str, float], dict[str, dict]]:
    """Compute fiber availability from FCC BDC county-level data (Dec 2024).

    Primary fiber source: ISP-reported fiber-to-the-premises availability
    at the location level, aggregated to county via ArcGIS Living Atlas.

    Returns:
        (scores, metadata) where:
        - scores: {fips: fiber_score}
        - metadata: {fips: {pct_fiber: 0.53, total_bsls: 12345, fiber_bsls: 6543, providers: 3}}
    """
    print("\n=== Computing Fiber Score (FCC BDC, Dec 2024) ===", flush=True)

    fields = "GEOID,TotalBSLs,ServedBSLsFiber,UnderservedBSLsFiber,UnservedBSLsFiber,UniqueProvidersFiber"
    all_features: list[dict] = []

    # ArcGIS paginates at 2000 records max; total is ~3234
    offset = 0
    batch_size = 2000
    while True:
        url = (
            f"{FCC_BDC_ARCGIS_URL}?where=1%3D1&outFields={fields}"
            f"&resultRecordCount={batch_size}&resultOffset={offset}"
            f"&f=json&returnGeometry=false"
        )
        log(f"Fetching BDC county data (offset {offset})...")
        try:
            resp = requests.get(url, timeout=120)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            log(f"WARNING: FCC BDC fetch failed: {e}")
            break

        features = data.get("features", [])
        if not features:
            break
        all_features.extend(features)
        if len(features) < batch_size:
            break
        offset += batch_size

    log(f"FCC BDC counties fetched: {len(all_features)}")

    if not all_features:
        log("WARNING: No FCC BDC data, will fall back to ACS")
        return {}, {}

    # Compute fiber availability rate per county
    # "Fiber available" = locations where fiber is served OR underserved (i.e., fiber exists but < 100/20)
    # This captures actual fiber infrastructure presence, not just high-speed fiber
    fiber_rates: dict[str, float] = {}
    fiber_metadata: dict[str, dict] = {}

    for feat in all_features:
        a = feat["attributes"]
        geoid = str(a.get("GEOID", "")).zfill(5)
        total_bsls = a.get("TotalBSLs") or 0
        served_fiber = a.get("ServedBSLsFiber") or 0
        underserved_fiber = a.get("UnderservedBSLsFiber") or 0
        providers = a.get("UniqueProvidersFiber") or 0

        if total_bsls <= 0:
            continue

        # Fiber-available locations = served + underserved (fiber exists at location)
        fiber_bsls = served_fiber + underserved_fiber
        pct = fiber_bsls / total_bsls

        fiber_rates[geoid] = pct
        fiber_metadata[geoid] = {
            "pct_fiber": round(pct, 4),
            "total_bsls": total_bsls,
            "fiber_bsls": fiber_bsls,
            "fiber_providers": providers,
        }

    log(f"Counties with FCC BDC fiber data: {len(fiber_rates)}")

    if not fiber_rates:
        return {}, {}

    # Composite score: 80% fiber availability rate + 20% provider competition
    # Provider competition matters: 1 provider = monopoly, 3+ = healthy market
    max_providers = max((m["fiber_providers"] for m in fiber_metadata.values()), default=1)

    fips_list = sorted(fiber_rates.keys())
    raw_scores: list[float] = []
    for fips in fips_list:
        rate = fiber_rates[fips]
        providers = fiber_metadata[fips]["fiber_providers"]
        # Normalize providers: diminishing returns after ~5
        provider_score = min(providers / 5.0, 1.0)
        composite = 0.80 * rate + 0.20 * provider_score
        raw_scores.append(composite)

    # Percentile rank normalization
    ranks = percentile_rank(raw_scores)
    scores: dict[str, float] = {}
    for fips, rank in zip(fips_list, ranks):
        scores[fips] = round(rank, 4)

    # Stats
    rates_sorted = sorted(fiber_rates.values())
    median_rate = rates_sorted[len(rates_sorted) // 2]
    zero_fiber = sum(1 for r in fiber_rates.values() if r == 0)
    high_fiber = sum(1 for r in fiber_rates.values() if r > 0.8)
    log(f"Median fiber availability: {median_rate:.1%}")
    log(f"Zero fiber: {zero_fiber} counties | >80% fiber: {high_fiber} counties")

    return scores, fiber_metadata


def compute_fiber_acs_fallback() -> dict[str, float]:
    """Compute fiber proxy from Census ACS broadband subscriptions (fallback only)."""
    print("\n=== Computing Fiber Fallback (Census ACS Broadband) ===", flush=True)

    variables = "B28002_001E,B28002_004E,B28002_007E"
    url = f"{ACS_BROADBAND_URL}?get=NAME,{variables}&for=county:*&in=state:*"

    log("Fetching ACS broadband subscription data...")
    try:
        resp = requests.get(url, timeout=120)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        log(f"WARNING: Failed to fetch ACS broadband data: {e}")
        return {}

    if not data or len(data) < 2:
        return {}

    broadband_rates: dict[str, float] = {}
    for row in data[1:]:
        try:
            total_hh = int(row[1]) if row[1] else 0
            cable_fiber = int(row[2]) if row[2] else 0
            state_fips = row[-2]
            county_fips = row[-1]
            fips = state_fips + county_fips
            if total_hh > 0:
                broadband_rates[fips] = cable_fiber / total_hh
        except (ValueError, TypeError, IndexError):
            continue

    if not broadband_rates:
        return {}

    fips_list = sorted(broadband_rates.keys())
    rate_vals = [broadband_rates[f] for f in fips_list]
    ranks = percentile_rank(rate_vals)

    scores: dict[str, float] = {}
    for fips, rank in zip(fips_list, ranks):
        scores[fips] = round(rank, 4)

    log(f"ACS fallback counties: {len(scores)}")
    return scores


def compute_fiber_score() -> tuple[dict[str, float], dict[str, dict], dict[str, str]]:
    """Compute fiber score using FCC BDC as primary, ACS as fallback.

    Returns:
        (scores, metadata, source_map) where:
        - scores: {fips: fiber_score}
        - metadata: {fips: {...}} (only for BDC counties)
        - source_map: {fips: "FCC BDC Dec 2024" | "Census ACS 2023 (fallback)"}
    """
    # Primary: FCC BDC
    bdc_scores, bdc_metadata = compute_fiber_fcc_bdc()

    # Fallback: Census ACS
    acs_scores = compute_fiber_acs_fallback()

    # Merge: BDC takes priority
    scores: dict[str, float] = {}
    source_map: dict[str, str] = {}

    all_fips = set(bdc_scores.keys()) | set(acs_scores.keys())
    bdc_used = 0
    acs_used = 0

    for fips in all_fips:
        if fips in bdc_scores:
            scores[fips] = bdc_scores[fips]
            source_map[fips] = "FCC BDC Dec 2024 (fiber availability at BSLs via ArcGIS Living Atlas)"
            bdc_used += 1
        elif fips in acs_scores:
            scores[fips] = acs_scores[fips]
            source_map[fips] = "Census ACS 2023 (broadband subscription fallback)"
            acs_used += 1

    log(f"\nFiber scoring summary: {bdc_used} BDC + {acs_used} ACS fallback = {len(scores)} total")
    return scores, bdc_metadata, source_map


# ============================================================
# Step 6b: Permitting Score (state policy + risk + county adjustments)
# ============================================================

# State-level data center policy scores (tax incentives, exemptions)
# Sources: NCSL Policy Snapshot, SDI Alliance, H5 Data Centers, NAIOP (2025-2026)
_STATE_DC_POLICY = {
    "AL": 0.85, "AZ": 0.70, "CT": 0.80, "FL": 0.85, "GA": 0.85,
    "IA": 0.80, "IN": 0.85, "KS": 0.65, "KY": 0.65, "LA": 0.55,
    "MN": 0.65, "MS": 0.70, "MO": 0.75, "NB": 0.75, "NE": 0.75,
    "NV": 0.80, "NY": 0.60, "NC": 0.80, "ND": 0.65, "OH": 0.75,
    "OK": 0.65, "SC": 0.80, "TN": 0.75, "TX": 0.80, "VA": 0.80,
    "WA": 0.70, "WV": 0.80, "WY": 0.75,
    # Limited / no DC-specific incentives
    "CO": 0.45, "WI": 0.40, "OR": 0.55, "DE": 0.55, "MT": 0.50,
    "NH": 0.50, "SD": 0.45, "UT": 0.45, "PA": 0.35, "IL": 0.30,
    "ID": 0.30, "AK": 0.40, "AR": 0.25, "CA": 0.20, "HI": 0.15,
    "ME": 0.25, "MD": 0.30, "MA": 0.25, "MI": 0.30, "NJ": 0.25,
    "NM": 0.30, "RI": 0.20, "VT": 0.20,
}

# Regulatory environment (lower burden = higher score)
_STATE_REGULATORY = {
    "TX": 0.90, "FL": 0.85, "GA": 0.85, "TN": 0.85, "AL": 0.80,
    "SC": 0.80, "NC": 0.80, "IN": 0.85, "OH": 0.75, "MO": 0.80,
    "MS": 0.80, "OK": 0.80, "AR": 0.75, "LA": 0.70, "KY": 0.75,
    "WV": 0.75, "KS": 0.80, "NE": 0.80, "SD": 0.85, "ND": 0.80,
    "WY": 0.85, "MT": 0.75, "ID": 0.80, "UT": 0.80, "AZ": 0.75,
    "NV": 0.80, "IA": 0.80,
    "VA": 0.65, "PA": 0.55, "MI": 0.60, "WI": 0.65, "MN": 0.60,
    "CO": 0.60, "NM": 0.60, "WA": 0.55, "OR": 0.50, "DE": 0.65,
    "MD": 0.55, "NH": 0.70, "AK": 0.65,
    "NY": 0.45, "NJ": 0.40, "CT": 0.50, "MA": 0.40, "IL": 0.45,
    "CA": 0.25, "HI": 0.30, "VT": 0.45, "ME": 0.55, "RI": 0.40,
}

# Risk factors inverted (1.0 = low risk). Sources: Data Center Watch 2025
_STATE_RISK = {
    "TX": 0.85, "GA": 0.80, "TN": 0.85, "AL": 0.85, "SC": 0.80,
    "NC": 0.75, "FL": 0.80, "MS": 0.85, "OK": 0.85, "AR": 0.85,
    "LA": 0.80, "WV": 0.75, "NE": 0.85, "SD": 0.90, "ND": 0.85,
    "WY": 0.90, "MT": 0.85, "ID": 0.80, "UT": 0.80, "NV": 0.80,
    "KS": 0.75, "NM": 0.80, "AK": 0.85, "DE": 0.80, "NH": 0.80,
    "IA": 0.80, "KY": 0.70, "OH": 0.70, "PA": 0.70, "MI": 0.65,
    "WI": 0.70, "MN": 0.60, "CO": 0.70, "WA": 0.65, "MD": 0.70,
    "CT": 0.70, "IN": 0.65, "MO": 0.60, "NY": 0.60,
    "VA": 0.40, "AZ": 0.55, "OR": 0.50, "CA": 0.50, "IL": 0.55,
    "NJ": 0.60, "MA": 0.55, "VT": 0.65, "ME": 0.70, "RI": 0.60,
    "HI": 0.50,
}

# Zoning favorability
_STATE_ZONING = {
    "TX": 0.90, "WY": 0.90, "MT": 0.85, "SD": 0.85, "ND": 0.85,
    "NE": 0.85, "KS": 0.85, "OK": 0.85, "IA": 0.85, "ID": 0.80,
    "NV": 0.80, "UT": 0.80, "AR": 0.80, "MS": 0.80, "AL": 0.80,
    "NM": 0.75, "AK": 0.70, "WI": 0.75, "MN": 0.75, "CO": 0.75,
    "GA": 0.75, "SC": 0.75, "NC": 0.75, "TN": 0.75, "IN": 0.75,
    "OH": 0.70, "MO": 0.70, "KY": 0.75, "WV": 0.75, "LA": 0.70,
    "FL": 0.70, "VA": 0.65, "PA": 0.65, "MI": 0.70, "WA": 0.65,
    "OR": 0.60, "AZ": 0.70, "ME": 0.70, "NH": 0.65, "VT": 0.65,
    "DE": 0.60, "NY": 0.50, "NJ": 0.45, "CT": 0.55, "MA": 0.50,
    "MD": 0.55, "IL": 0.60, "CA": 0.45, "HI": 0.35, "RI": 0.45,
}

# County-level adjustments (blocked projects, moratoriums, local factors)
_COUNTY_ADJUSTMENTS = {
    "51153": -0.15, "51047": -0.10, "51099": -0.10, "51061": -0.10,
    "51107": -0.08, "51059": -0.08, "51087": -0.05,  # Virginia opposition
    "29037": -0.15,  # Cass County MO (Peculiar moratorium)
    "18127": -0.10,  # Porter County IN (Chesterton blocked)
    "04013": -0.05,  # Maricopa AZ (mixed)
    "41027": -0.10,  # Hood River OR (Cascade Locks)
    "55033": 0.05, "55123": 0.05,  # Dunn/Vernon WI (rural co-op friendly)
    "08123": 0.03,  # Weld CO (industrial-friendly)
}


def compute_permitting_score(state: str, fips: str) -> float:
    """Compute permitting score from state policy, regulation, risk, and zoning."""
    policy = _STATE_DC_POLICY.get(state, 0.35)
    regulatory = _STATE_REGULATORY.get(state, 0.50)
    risk = _STATE_RISK.get(state, 0.70)
    zoning = _STATE_ZONING.get(state, 0.60)

    base = 0.40 * policy + 0.25 * regulatory + 0.20 * risk + 0.15 * zoning
    adj = _COUNTY_ADJUSTMENTS.get(fips, 0.0)
    return round(max(0.05, min(0.95, base + adj)), 4)


# ============================================================
# Step 7: Assemble final scores
# ============================================================

def assemble_scores(
    fips_lookup: dict,
    coop_scores: dict[str, float],
    grid_scores: dict[str, float],
    curtail_scores: dict[str, float],
    labor_scores: dict[str, float],
    fiber_scores: dict[str, float],
    grid_metadata: dict[str, dict] | None = None,
    fiber_metadata: dict[str, dict] | None = None,
    fiber_source_map: dict[str, str] | None = None,
) -> list[dict]:
    """Assemble all criterion scores into final county records."""
    print("\n=== Assembling Final Scores ===", flush=True)

    # Get base county list from Census FIPS file
    fips_data = download(FIPS_URL, "Census FIPS codes")
    text = fips_data.decode("utf-8")
    lines = text.strip().split("\n")

    counties = []

    for line in lines[1:]:  # Skip header
        parts = line.split("|")
        if len(parts) < 4:
            continue

        state_abbr = parts[0].strip()
        state_fips = parts[1].strip()
        county_fips_3 = parts[2].strip()
        county_name = parts[4].strip()

        if not state_fips or not county_fips_3:
            continue
        if state_abbr in SKIP_STATES or state_abbr == "DC":
            continue

        fips = state_fips + county_fips_3
        clean_name = county_name.replace(" County", "").replace(" Parish", "")

        # Determine data sources for this county
        sources: dict[str, str] = {}

        # Co-op density
        coop = coop_scores.get(fips)
        if coop is not None:
            sources["coop"] = "EIA Form 861 (2024 actual)"
        else:
            coop = 0.0  # No utility data = no co-ops
            sources["coop"] = "Default (no utility data)"

        # Grid reliability
        grid = grid_scores.get(fips)
        gm = (grid_metadata or {}).get(fips)
        if grid is not None and gm:
            year_range = f"{gm['min_year']}-{gm['max_year']}" if gm['min_year'] != gm['max_year'] else str(gm['min_year'])
            sources["grid"] = f"EIA Form 861 Reliability ({year_range}, {gm['year_count']}yr avg SAIDI)"
        elif grid is not None:
            sources["grid"] = "EIA Form 861 Reliability (actual)"
        else:
            # State-level fallback for grid (moderate default)
            grid = 0.5
            gm = None
            sources["grid"] = "Default estimate (no SAIDI data)"

        # Curtailment
        curtail = curtail_scores.get(fips)
        if curtail is not None:
            sources["curtail"] = "EIA Form 860 (2024 renewable MW + BA proxy)"
        else:
            curtail = 0.0  # No renewables = no curtailment opportunity
            sources["curtail"] = "Default (no renewable generation)"

        # Permitting
        permitting = compute_permitting_score(state_abbr, fips)
        sources["permitting"] = (
            "State DC incentive programs (NCSL, SDI Alliance, H5 2025-2026), "
            "moratorium/opposition data (Data Center Watch 2025), "
            "county-level adjustments where data exists"
        )

        # Labor
        labor = labor_scores.get(fips)
        if labor is not None:
            sources["labor"] = "Census CBP 2023 (NAICS 5182/5415/517)"
        else:
            labor = 0.0
            sources["labor"] = "Default (no CBP data)"

        # Fiber
        fiber = fiber_scores.get(fips)
        if fiber is not None:
            sources["fiber"] = (fiber_source_map or {}).get(fips, "FCC BDC Dec 2024")
        else:
            fiber = 0.3  # Conservative default
            sources["fiber"] = "Default estimate (no fiber data)"

        county_record = {
            "fips_code": fips,
            "state_fips": state_fips,
            "county_name": clean_name,
            "state_abbr": state_abbr,
            "coop_density_score": round(coop, 4),
            "grid_reliability_score": round(grid, 4),
            "clipped_curtailed_score": round(curtail, 4),
            "permitting_score": round(permitting, 4),
            "labor_score": round(labor, 4),
            "fiber_score": round(fiber, 4),
            "data_sources": sources,
            "permitting_citation_ids": [],  # Populated by build_permitting_citations()
        }

        # Add fiber metadata if available (FCC BDC data)
        fm = (fiber_metadata or {}).get(fips)
        if fm:
            county_record["fiber_pct_availability"] = fm["pct_fiber"]
            county_record["fiber_bsls"] = fm["fiber_bsls"]
            county_record["fiber_total_bsls"] = fm["total_bsls"]
            county_record["fiber_providers"] = fm["fiber_providers"]

        # Add grid reliability metadata if available
        if gm:
            county_record["grid_reliability_years"] = gm["year_count"]
            county_record["grid_reliability_data_range"] = (
                f"{gm['min_year']}-{gm['max_year']}" if gm['min_year'] != gm['max_year']
                else str(gm['min_year'])
            )
            county_record["grid_reliability_avg_saidi"] = gm["avg_saidi"]

        counties.append(county_record)

    log(f"Total counties assembled: {len(counties)}")

    # Stats
    real_data_counts = {
        "coop": sum(1 for c in counties if "actual" in c["data_sources"]["coop"]),
        "grid": sum(1 for c in counties if "EIA" in c["data_sources"]["grid"]),
        "curtail": sum(1 for c in counties if "860" in c["data_sources"]["curtail"]),
        "labor": sum(1 for c in counties if "CBP" in c["data_sources"]["labor"]),
        "fiber": sum(1 for c in counties if "Default" not in c["data_sources"]["fiber"]),
    }
    for criterion, count in real_data_counts.items():
        pct = count / len(counties) * 100
        log(f"  {criterion}: {count}/{len(counties)} counties with real data ({pct:.0f}%)")

    return counties


# ============================================================
# Step 8: Write output
# ============================================================

def build_permitting_citations(counties: list[dict]) -> list[dict]:
    """Build permitting citation registry and assign IDs to each county.

    Returns the citation registry (list of {title, url, relevance} dicts).
    Mutates counties in place to set permitting_citation_ids.

    Citation architecture:
    - State-level citations: every county in a state gets its state's citations
    - County-level citations: specific counties with known opposition/moratoriums
    - Universal citations: methodology sources appended to all counties
    - Registry is deduplicated; counties reference by integer ID for compact JSON
    """
    print("\n=== Building Permitting Citations ===", flush=True)

    # Import citation data from the permitting module
    # (Defined inline to keep the pipeline self-contained)
    from _permitting_citations import STATE_CITS, COUNTY_CITS, UNIVERSAL_CITS

    registry: list[dict] = []
    key_to_id: dict[tuple[str, str], int] = {}

    def get_id(cit: dict) -> int:
        key = (cit["title"], cit["url"])
        if key not in key_to_id:
            key_to_id[key] = len(registry)
            registry.append(cit)
        return key_to_id[key]

    for county in counties:
        state = county["state_abbr"]
        fips = county["fips_code"]

        ids: list[int] = []
        for cit in STATE_CITS.get(state, []):
            ids.append(get_id(cit))
        for cit in COUNTY_CITS.get(fips, []):
            ids.append(get_id(cit))
        for cit in UNIVERSAL_CITS:
            ids.append(get_id(cit))

        # Deduplicate preserving order
        seen: set[int] = set()
        deduped: list[int] = []
        for i in ids:
            if i not in seen:
                seen.add(i)
                deduped.append(i)
        county["permitting_citation_ids"] = deduped

    log(f"Citation registry: {len(registry)} unique citations")
    avg = sum(len(c["permitting_citation_ids"]) for c in counties) / max(len(counties), 1)
    log(f"Average citations per county: {avg:.1f}")
    return registry


def write_output(counties: list[dict], citation_registry: list[dict] | None = None):
    """Write county scores to JSON file and optionally to Supabase."""
    print("\n=== Writing Output ===", flush=True)

    # Ensure output directory exists
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Wrap with citation registry if provided
    if citation_registry:
        output = {
            "permitting_citation_registry": citation_registry,
            "counties": counties,
        }
    else:
        output = counties

    # Write static JSON (compact for smaller file size)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, separators=(",", ":"))

    file_size = OUTPUT_PATH.stat().st_size / 1024
    log(f"Wrote {OUTPUT_PATH} ({file_size:.0f} KB, {len(counties)} counties)")

    # Optional Supabase upsert
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

    if supabase_url and supabase_key:
        log("Upserting to Supabase...")
        try:
            from supabase import create_client
            client = create_client(supabase_url, supabase_key)

            batch_size = 500
            inserted = 0
            for i in range(0, len(counties), batch_size):
                batch = counties[i:i + batch_size]
                result = client.table("county_scores").upsert(
                    batch, on_conflict="fips_code"
                ).execute()
                inserted += len(batch)
                log(f"  Batch {i // batch_size + 1}: {inserted}/{len(counties)}")

            log(f"Supabase upsert complete: {inserted} counties")
        except ImportError:
            log("WARNING: supabase-py not installed, skipping DB upsert")
            log("  Run: uv add supabase to enable")
        except Exception as e:
            log(f"WARNING: Supabase upsert failed: {e}")
    else:
        log("Supabase credentials not found, skipping DB upsert")
        log("  Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to enable")


# ============================================================
# Main
# ============================================================

def main():
    print("=" * 60)
    print("  NODIAC REGIONAL HUB STRATEGY — REAL DATA PIPELINE")
    print("=" * 60)

    with tempfile.TemporaryDirectory(prefix="nodiac-data-") as tmpdir:
        log(f"Temp directory: {tmpdir}")

        # Build FIPS lookup
        fips_lookup = build_fips_lookup()

        # Compute each criterion score
        coop_scores = compute_coop_density(tmpdir, fips_lookup)
        grid_scores, grid_metadata = compute_grid_reliability(tmpdir, fips_lookup)
        curtail_scores = compute_curtailment_proxy(tmpdir, fips_lookup)
        labor_scores = compute_labor_score()
        fiber_scores, fiber_metadata, fiber_source_map = compute_fiber_score()

        # Assemble final scores
        counties = assemble_scores(
            fips_lookup,
            coop_scores,
            grid_scores,
            curtail_scores,
            labor_scores,
            fiber_scores,
            grid_metadata,
            fiber_metadata,
            fiber_source_map,
        )

        # Build permitting citations
        try:
            citation_registry = build_permitting_citations(counties)
        except ImportError:
            log("WARNING: _permitting_citations module not found, skipping citations")
            log("  Citations will be empty. See scripts/_permitting_citations.py")
            citation_registry = None

        # Write output
        write_output(counties, citation_registry)

    print("\n" + "=" * 60)
    print("  PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
