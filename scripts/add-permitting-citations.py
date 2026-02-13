#!/usr/bin/env python3
"""Enhance permitting_citation_registry with type fields and additional citations."""

import json
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / "public" / "data" / "county-scores.json"

# Type classifications for existing entries (by index)
EXISTING_TYPES = {
    0: "incentive",      # Alabama abatements
    1: "state_policy",   # NCSL Policy Snapshot
    2: "opposition",     # Data Center Watch $64B
    3: "opposition",     # Mother Jones resistance
    4: "incentive",      # H5 Data Centers
    5: "moratorium",     # Environmental groups moratorium
    6: "state_policy",   # CO HB26-1030
    7: "state_policy",   # CO 30-year tax breaks
    8: "regulatory",     # CO skipped due to no incentives
    9: "state_policy",   # NAIOP GA
    10: "incentive",     # GA $296M tax breaks
    11: "moratorium",    # Moratoriums spreading
    12: "opposition",    # MI pushback
    13: "regulatory",    # MN HF16 rollback
    14: "incentive",     # TN incentive programs
    15: "incentive",     # VA JLARC $928M
    16: "incentive",     # VA $730M exemption
    17: "opposition",    # VA opposition electoral issue
    18: "regulatory",    # Loudoun zoning
    19: "incentive",     # WA HB 1846
    20: "incentive",     # WI AB140 TIF
}

# New citations to add to registry
NEW_CITATIONS = [
    # 21: Texas Comptroller
    {
        "title": "Texas Comptroller: Data Center Sales Tax Exemption",
        "url": "https://comptroller.texas.gov/taxes/data-centers/",
        "relevance": "TX offers 6.25% state sales/use tax exemption on equipment for qualifying data centers",
        "type": "incentive",
    },
    # 22: Iowa DOR
    {
        "title": "Iowa Dept. of Revenue: Data Center Sales & Use Tax Incentives",
        "url": "https://revenue.iowa.gov/taxes/tax-guidance/sales-use-excise-tax/data-centers",
        "relevance": "IA offers full sales tax exemption or partial refund for qualifying data center purchases",
        "type": "incentive",
    },
    # 23: Iowa HF 976
    {
        "title": "Iowa HF 976: Data Center Sales Tax Changes (2025)",
        "url": "https://www.brownwinick.com/insights/iowa-sales-tax-changes-for-data-centers",
        "relevance": "Modified qualifying thresholds for IA data center tax exemptions",
        "type": "regulatory",
    },
    # 24: MN Revenue
    {
        "title": "Minnesota Dept. of Revenue: Qualified Data Centers (electricity exemption removed July 2025)",
        "url": "https://www.revenue.state.mn.us/qualified-data-centers",
        "relevance": "MN removed electricity from DC sales tax exemption effective July 1, 2025",
        "type": "regulatory",
    },
    # 25: MN House bill
    {
        "title": "Minnesota House: Data Center Regulation & Tax Bill (2025 Special Session)",
        "url": "https://www.house.mn.gov/sessiondaily/Story/18838",
        "relevance": "MN set new environmental/energy requirements and modified sales tax exemptions for DCs",
        "type": "regulatory",
    },
    # 26: AL Revenue
    {
        "title": "Alabama Dept. of Revenue: Chapter 9B Data Center Abatements",
        "url": "https://www.revenue.alabama.gov/tax-incentives/chapter-9b-abatements/",
        "relevance": "AL data processing centers can get up to 30 years of property/sales tax abatement",
        "type": "incentive",
    },
    # 27: GA tax exemptions
    {
        "title": "Georgia Dept. of Economic Development: Data Center Tax Exemptions",
        "url": "https://georgia.org/competitive-advantages/incentives/tax-exemptions",
        "relevance": "GA DCs investing $100M-$250M+ qualify for full sales/use tax exemption",
        "type": "incentive",
    },
    # 28: WEDC Wisconsin
    {
        "title": "WEDC: Wisconsin Data Center Sales & Use Tax Exemption",
        "url": "https://wedc.org/programs/data-center-sales-and-use-tax-exemption/",
        "relevance": "WI offers sales/use tax exemption for qualifying data center equipment",
        "type": "incentive",
    },
    # 29: WI Act 16 TIF
    {
        "title": "Wisconsin Act 16: TIF Exception for Data Centers (2025)",
        "url": "https://www.thecentersquare.com/wisconsin/article_6e8df7b1-9e0d-4dda-a5cf-46a91dc88f6c.html",
        "relevance": "WI grants TIF district exception for certified data center projects",
        "type": "incentive",
    },
    # 30: Dunn County transparency
    {
        "title": "WEAU: Community Calls for Transparency on Proposed Dunn County Data Center",
        "url": "https://www.weau.com/2025/09/05/community-member-calls-more-transparency-over-proposed-data-center-dunn-county/",
        "relevance": "Menomonie City Council approved annexation/rezoning of 300+ acres; community pushback emerging",
        "type": "opposition",
    },
    # 31: Dunn County moratorium
    {
        "title": "Residents Seek Moratorium on Proposed Menomonie Data Center",
        "url": "https://citizenportal.ai/articles/6428592/Dunn-County/Wisconsin/Residents-seek-moratorium-on-proposed-Menomonie-data-center-Dunn-County-committee-discusses-zoning-authority",
        "relevance": "Dunn County committee discusses zoning authority limits; moratorium requested",
        "type": "moratorium",
    },
    # 32: Dunn County $1.6B
    {
        "title": "Volume One: Tech Giant Considering $1.6B Data Center in Dunn County",
        "url": "https://volumeone.org/articles/2025/08/26/370164-tech-giant-is-considering-16-billion-data-center-dunn-county",
        "relevance": "Major proposed DC project in Dunn County; 'Stop the Menomonie Data Center' opposition group formed",
        "type": "opposition",
    },
    # 33: Weld County CBS
    {
        "title": "CBS Colorado: Weld County Sees Data/AI Centers as Major Economic Future (Feb 2026)",
        "url": "https://www.cbsnews.com/colorado/news/data-ai-centers-colorado-globalai-windsor/",
        "relevance": "Weld County actively welcoming DC/AI facilities; diversifying from oil & gas economy",
        "type": "incentive",
    },
    # 34: CO Newsline
    {
        "title": "Colorado Newsline: Tax Breaks for Data Centers Bill Reintroduced (Jan 2026)",
        "url": "https://coloradonewsline.com/2026/01/21/tax-breaks-for-data-centers-colorado/",
        "relevance": "HB26-1030 would offer 100% sales/use tax exemption for qualified DCs for 20+ years",
        "type": "state_policy",
    },
    # 35: VA VPM reform
    {
        "title": "VPM: Virginia Lawmakers Propose Data Center Reform Bills (2026)",
        "url": "https://www.vpm.org/generalassembly/2026-01-16/2026-data-center-bills-thomas-hb155-mcauliff-hb503-pjm-dominion-energy",
        "relevance": "Multiple VA reform bills targeting DC energy/environmental impacts",
        "type": "regulatory",
    },
    # 36: VA PW Digital Gateway blocked
    {
        "title": "WTOP: Prince William Digital Gateway Construction Blocked Pending Legal Challenge",
        "url": "https://wtop.com/prince-william-county/2025/11/digital-gateway-data-center-builders-barred-from-beginning-construction-until-legal-challenge-plays-out/",
        "relevance": "VA Court of Appeals prohibited construction on PW Digital Gateway until citizen legal challenge concludes",
        "type": "opposition",
    },
    # 37: DCW Q2 2025
    {
        "title": "Data Center Watch Q2 2025: $98B Blocked/Delayed in One Quarter",
        "url": "https://www.datacenterwatch.org/q22025",
        "relevance": "53 active opposition groups across 17 states; 66% of protested projects blocked in Q2",
        "type": "opposition",
    },
    # 38: IN Chesterton DCD
    {
        "title": "DCD: $1.3B Data Center Application Withdrawn in Chesterton, Indiana",
        "url": "https://www.datacenterdynamics.com/en/news/application-for-13bn-data-center-in-chesterton-indiana-withdrawn/",
        "relevance": "Resident opposition forced withdrawal of major DC project in Chesterton, IN",
        "type": "opposition",
    },
    # 39: IN Chesterton Tribune
    {
        "title": "Chicago Tribune: Data Center Proposals — Welcomed in LaPorte, Blocked in Chesterton",
        "url": "https://www.chicagotribune.com/2024/06/16/different-receptions-for-1-billion-investments-data-center-proposals-welcomed-in-laporte-but-not-in-chesterton/",
        "relevance": "Contrasting receptions for billion-dollar DC proposals in neighboring IN communities",
        "type": "opposition",
    },
    # 40: NCSL 2026 legislative agendas
    {
        "title": "NCSL: 2026 Legislative Agendas Put Data Center Incentives in the Spotlight",
        "url": "https://www.ncsl.org/state-legislatures-news/details/2026-legislative-agendas-put-data-center-incentives-in-the-spotlight",
        "relevance": "37 states now offer DC tax incentives as of June 2025; overview of 2026 legislative trends",
        "type": "state_policy",
    },
    # 41: Stream Data Centers market guide
    {
        "title": "Stream Data Centers: Tax Incentives by Market",
        "url": "https://www.streamdatacenters.com/resource-library/glossary/tax-incentives-for-data-centers/",
        "relevance": "State-by-state summary of DC tax incentive programs across major markets",
        "type": "state_policy",
    },
    # 42: WPR WI revenue vs subsidy
    {
        "title": "WPR: Wisconsin Data Centers — Revenue Boon vs. Subsidy Concerns",
        "url": "https://www.wpr.org/news/wisconsin-data-centers-revenue-tax-subsidy-microsoft",
        "relevance": "Analysis of WI DC subsidy programs and local fiscal impacts",
        "type": "regulatory",
    },
    # 43: SDI Alliance
    {
        "title": "SDI Alliance: US Tax Incentives for Data Centers by State",
        "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state",
        "relevance": "Comprehensive state-by-state database of DC tax incentives",
        "type": "state_policy",
    },
]

# Additional citation IDs per state (on top of existing)
STATE_EXTRA_IDS: dict[str, list[int]] = {
    "TX": [21, 41],
    "IA": [22, 23],
    "MN": [24, 25],
    "AL": [26],
    "GA": [27],
    "WI": [28, 29, 42],
    "CO": [34],
    "VA": [35, 36, 37],
    "IN": [38, 39],
}

# Additional citation IDs per county FIPS
COUNTY_EXTRA_IDS: dict[str, list[int]] = {
    "55033": [30, 31, 32],  # Dunn County, WI
    "55123": [30, 31, 32],  # Vernon County, WI (nearby, same dynamics)
    "08123": [33],           # Weld County, CO
}

# General citations to add to ALL counties
GENERAL_EXTRA_IDS = [40, 43]


def main():
    data = json.loads(DATA_PATH.read_text())
    registry = data["permitting_citation_registry"]

    # Add type to existing entries
    for i, entry in enumerate(registry):
        if "type" not in entry:
            entry["type"] = EXISTING_TYPES.get(i, "state_policy")

    # Add new citations
    registry.extend(NEW_CITATIONS)

    # Update county citation IDs
    for county in data["counties"]:
        state = county["state_abbr"]
        fips = county["fips_code"]
        ids = county.get("permitting_citation_ids", [])

        # Add general extras
        for cid in GENERAL_EXTRA_IDS:
            if cid not in ids:
                ids.append(cid)

        # Add state extras
        for cid in STATE_EXTRA_IDS.get(state, []):
            if cid not in ids:
                ids.append(cid)

        # Add county extras
        for cid in COUNTY_EXTRA_IDS.get(fips, []):
            if cid not in ids:
                ids.append(cid)

        county["permitting_citation_ids"] = ids

    data["permitting_citation_registry"] = registry

    DATA_PATH.write_text(json.dumps(data, separators=(",", ":")))
    print(f"Registry now has {len(registry)} entries (was 21)")
    print(f"Updated {len(data['counties'])} counties")

    # Show priority counties
    for fips_target, label in [("55033", "Dunn WI"), ("55123", "Vernon WI"), ("08123", "Weld CO")]:
        for c in data["counties"]:
            if c["fips_code"] == fips_target:
                ids = c["permitting_citation_ids"]
                print(f"\n{label}: {len(ids)} citations")
                for cid in ids:
                    entry = registry[cid]
                    print(f"  [{entry['type']}] {entry['title']}")
                break


if __name__ == "__main__":
    main()
