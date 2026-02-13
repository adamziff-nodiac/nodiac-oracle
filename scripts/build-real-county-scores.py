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
    - Fiber:             Census ACS 5-Year (2023) — Broadband subscriptions proxy
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

# EIA Form 860 (renewable capacity / curtailment proxy)
EIA_860_URL = "https://www.eia.gov/electricity/data/eia860/xls/eia8602024.zip"

# Census CBP (IT labor)
CBP_API_BASE = "https://api.census.gov/data/2023/cbp"
CBP_NAICS_CODES = ["5182", "5415", "517"]

# Census population estimates
POP_URL = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/counties/totals/co-est2024-alldata.csv"

# Census ACS 5-Year broadband (fiber proxy)
ACS_BROADBAND_URL = "https://api.census.gov/data/2023/acs/acs5"

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

def compute_grid_reliability(tmpdir: str, fips_lookup: dict) -> dict[str, float]:
    """Compute grid reliability score per county from EIA-861 Reliability data.

    File structure (Reliability_2024.xlsx, sheet 'Reliability_States'):
    - Row 0: Category headers (merged cells)
    - Row 1: Subcategory headers
    - Row 2: Column headers (Data Year, Utility Number, ..., SAIDI, SAIFI, ...)
    - Row 3+: Data rows

    Key columns (0-indexed):
    - 1: Utility Number
    - 3: State
    - 5: SAIDI (IEEE, All Events with MED)
    - 8: SAIDI (IEEE, Without Major Event Days) <- preferred
    - 17: SAIDI (Other Standard, All Events)
    Missing values are represented as "." (period string).
    """
    print("\n=== Computing Grid Reliability (EIA-861) ===", flush=True)

    reliability_path = os.path.join(tmpdir, "reliability.xlsx")
    if not os.path.exists(reliability_path):
        log("WARNING: Reliability file not found, using fallback estimates")
        return {}

    territory_path = os.path.join(tmpdir, "territory.xlsx")

    # First build utility -> counties mapping
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

    # Parse Reliability data
    log("Parsing Reliability data (SAIDI)...")
    wb_rel = openpyxl.load_workbook(reliability_path, read_only=True)
    ws_rel = wb_rel["Reliability_States"]

    util_saidi: dict[int, float] = {}
    parsed_count = 0

    for i, row in enumerate(ws_rel.iter_rows(values_only=True)):
        if i < 3:
            continue  # Skip 3 header rows (category, subcategory, column names)

        vals = list(row)
        if len(vals) < 18:
            continue

        # Column 1: Utility Number
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
    log(f"Parsed {parsed_count} utility rows, {len(util_saidi)} with SAIDI data")

    if len(util_saidi) == 0:
        log("WARNING: Could not parse SAIDI data, using fallback")
        return {}

    # Map SAIDI to counties (average across utilities serving each county)
    county_saidi: dict[str, list[float]] = defaultdict(list)
    for util_num, saidi in util_saidi.items():
        for fips in util_to_counties.get(util_num, set()):
            county_saidi[fips].append(saidi)

    log(f"Counties with SAIDI data: {len(county_saidi)}")

    # Compute reliability score: lower SAIDI = higher reliability
    # SAIDI is in minutes of outage per year. Typical range: 30-600 minutes
    county_avg_saidi: dict[str, float] = {}
    for fips, values in county_saidi.items():
        county_avg_saidi[fips] = sum(values) / len(values)

    if not county_avg_saidi:
        return {}

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
    log(f"Counties scored: {len(scores)} | Median SAIDI: {median_saidi:.0f} min/yr")
    return scores


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

def compute_fiber_proxy() -> dict[str, float]:
    """Compute fiber availability proxy from Census ACS broadband subscriptions."""
    print("\n=== Computing Fiber Proxy (Census ACS Broadband) ===", flush=True)

    # ACS Table B28002: Presence and Types of Internet Subscriptions
    # B28002_001E = Total households
    # B28002_007E = Broadband (any type)
    # We want broadband subscription rate as a proxy for infrastructure availability
    #
    # Alternative: S2801 has more detail but B28002 is simpler

    variables = "B28002_001E,B28002_004E,B28002_007E"
    url = f"{ACS_BROADBAND_URL}?get=NAME,{variables}&for=county:*&in=state:*"

    log("Fetching ACS broadband subscription data...")
    try:
        resp = requests.get(url, timeout=120)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        log(f"WARNING: Failed to fetch ACS broadband data: {e}")
        log("Falling back to default scores")
        return {}

    if not data or len(data) < 2:
        log("WARNING: No ACS broadband data returned")
        return {}

    headers = data[0]
    log(f"ACS columns: {headers}")

    # Parse: compute broadband subscription rate per county
    broadband_rates: dict[str, float] = {}

    for row in data[1:]:
        try:
            total_hh = int(row[1]) if row[1] else 0
            # B28002_004E: Cable/fiber/DSL subscriptions
            cable_fiber = int(row[2]) if row[2] else 0
            # B28002_007E: Broadband of any type
            broadband_any = int(row[3]) if row[3] else 0

            state_fips = row[-2]
            county_fips = row[-1]
            fips = state_fips + county_fips

            if total_hh > 0:
                # Use cable/fiber/DSL rate as proxy (more indicative of wired infrastructure)
                rate = cable_fiber / total_hh
                broadband_rates[fips] = rate
        except (ValueError, TypeError, IndexError):
            continue

    log(f"Counties with broadband data: {len(broadband_rates)}")

    if not broadband_rates:
        return {}

    # Percentile rank normalization
    fips_list = sorted(broadband_rates.keys())
    rate_vals = [broadband_rates[f] for f in fips_list]
    ranks = percentile_rank(rate_vals)

    scores: dict[str, float] = {}
    for fips, rank in zip(fips_list, ranks):
        scores[fips] = round(rank, 4)

    # Stats
    median_rate = sorted(broadband_rates.values())[len(broadband_rates) // 2]
    log(f"Median broadband rate: {median_rate:.1%}")
    return scores


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
        county_name = parts[3].strip()

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
        if grid is not None:
            sources["grid"] = "EIA Form 861 Reliability (2024 actual)"
        else:
            # State-level fallback for grid (moderate default)
            grid = 0.5
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
            sources["fiber"] = "Census ACS 2023 (broadband subscription proxy)"
        else:
            fiber = 0.3  # Conservative default
            sources["fiber"] = "Default estimate (no ACS data)"

        counties.append({
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
        })

    log(f"Total counties assembled: {len(counties)}")

    # Stats
    real_data_counts = {
        "coop": sum(1 for c in counties if "actual" in c["data_sources"]["coop"]),
        "grid": sum(1 for c in counties if "actual" in c["data_sources"]["grid"]),
        "curtail": sum(1 for c in counties if "860" in c["data_sources"]["curtail"]),
        "labor": sum(1 for c in counties if "CBP" in c["data_sources"]["labor"]),
        "fiber": sum(1 for c in counties if "ACS" in c["data_sources"]["fiber"]),
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
        grid_scores = compute_grid_reliability(tmpdir, fips_lookup)
        curtail_scores = compute_curtailment_proxy(tmpdir, fips_lookup)
        labor_scores = compute_labor_score()
        fiber_scores = compute_fiber_proxy()

        # Assemble final scores
        counties = assemble_scores(
            fips_lookup,
            coop_scores,
            grid_scores,
            curtail_scores,
            labor_scores,
            fiber_scores,
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
