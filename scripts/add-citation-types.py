#!/usr/bin/env python3
"""Add 'type' field to all permitting_citation_registry entries and deduplicate."""

import json
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / "public" / "data" / "county-scores.json"

# Keywords to classify citations
def classify(entry: dict) -> str:
    title = entry.get("title", "").lower()
    relevance = entry.get("relevance", "").lower()
    url = entry.get("url", "").lower()
    text = f"{title} {relevance}"

    if any(w in text for w in ["moratorium", "freeze", "pause", "prohibit"]):
        return "moratorium"
    if any(w in text for w in ["opposition", "blocked", "delayed", "resistance", "pushback", "withdrawn", "community"]):
        return "opposition"
    if any(w in text for w in ["exemption", "abatement", "incentive", "tax break", "tax credit", "refund"]):
        return "incentive"
    if any(w in text for w in ["rollback", "regulation", "regulatory", "reform", "zoning", "restrict", "tighten"]):
        return "regulatory"
    if any(w in text for w in ["legislation", "bill", "hb", "sb", "policy", "ncsl", "act "]):
        return "state_policy"
    # Default based on URL
    if "ncsl.org" in url or "leg." in url or "legis" in url or "revisor" in url:
        return "state_policy"
    if "revenue" in url or "comptroller" in url or "wedc" in url:
        return "incentive"
    if "datacenterwatch" in url:
        return "opposition"
    return "state_policy"


def main():
    data = json.loads(DATA_PATH.read_text())
    registry = data["permitting_citation_registry"]

    # Deduplicate by URL
    seen_urls = {}
    deduped = []
    old_to_new = {}
    for i, entry in enumerate(registry):
        url = entry["url"]
        if url in seen_urls:
            old_to_new[i] = seen_urls[url]
        else:
            new_idx = len(deduped)
            seen_urls[url] = new_idx
            old_to_new[i] = new_idx
            entry["type"] = classify(entry)
            deduped.append(entry)

    print(f"Registry: {len(registry)} -> {len(deduped)} (deduped)")

    # Remap county citation IDs
    for county in data["counties"]:
        old_ids = county.get("permitting_citation_ids", [])
        new_ids = list(dict.fromkeys(old_to_new[i] for i in old_ids if i in old_to_new))
        county["permitting_citation_ids"] = new_ids

    data["permitting_citation_registry"] = deduped

    # Now add the extra citations we researched
    extra = [
        {
            "title": "Texas Comptroller: Data Center Sales Tax Exemption",
            "url": "https://comptroller.texas.gov/taxes/data-centers/",
            "relevance": "TX offers 6.25% state sales/use tax exemption on equipment for qualifying data centers",
            "type": "incentive",
        },
        {
            "title": "Iowa Dept. of Revenue: Data Center Sales & Use Tax Incentives",
            "url": "https://revenue.iowa.gov/taxes/tax-guidance/sales-use-excise-tax/data-centers",
            "relevance": "IA offers full sales tax exemption or partial refund for qualifying data center purchases",
            "type": "incentive",
        },
        {
            "title": "Iowa HF 976: Data Center Sales Tax Changes (2025)",
            "url": "https://www.brownwinick.com/insights/iowa-sales-tax-changes-for-data-centers",
            "relevance": "Modified qualifying thresholds for IA data center tax exemptions",
            "type": "regulatory",
        },
        {
            "title": "Minnesota Dept. of Revenue: Qualified Data Centers",
            "url": "https://www.revenue.state.mn.us/qualified-data-centers",
            "relevance": "MN removed electricity from DC sales tax exemption effective July 1, 2025",
            "type": "regulatory",
        },
        {
            "title": "Minnesota House: Data Center Regulation & Tax Bill (2025)",
            "url": "https://www.house.mn.gov/sessiondaily/Story/18838",
            "relevance": "MN set new environmental/energy requirements and modified sales tax exemptions for DCs",
            "type": "regulatory",
        },
        {
            "title": "Alabama Dept. of Revenue: Chapter 9B Abatements",
            "url": "https://www.revenue.alabama.gov/tax-incentives/chapter-9b-abatements/",
            "relevance": "AL data processing centers get up to 30 years of property/sales tax abatement",
            "type": "incentive",
        },
        {
            "title": "Georgia Dept. of Economic Development: Tax Exemptions",
            "url": "https://georgia.org/competitive-advantages/incentives/tax-exemptions",
            "relevance": "GA DCs investing $100M-$250M+ qualify for full sales/use tax exemption",
            "type": "incentive",
        },
        {
            "title": "WEDC: Wisconsin Data Center Sales & Use Tax Exemption",
            "url": "https://wedc.org/programs/data-center-sales-and-use-tax-exemption/",
            "relevance": "WI offers sales/use tax exemption for qualifying data center equipment",
            "type": "incentive",
        },
        {
            "title": "Wisconsin Act 16: TIF Exception for Data Centers (2025)",
            "url": "https://www.thecentersquare.com/wisconsin/article_6e8df7b1-9e0d-4dda-a5cf-46a91dc88f6c.html",
            "relevance": "WI grants TIF district exception for certified data center projects",
            "type": "incentive",
        },
        {
            "title": "WEAU: Community Seeks Transparency on Dunn County Data Center",
            "url": "https://www.weau.com/2025/09/05/community-member-calls-more-transparency-over-proposed-data-center-dunn-county/",
            "relevance": "Menomonie City Council approved annexation/rezoning of 300+ acres; community pushback",
            "type": "opposition",
        },
        {
            "title": "Residents Seek Moratorium on Menomonie Data Center",
            "url": "https://citizenportal.ai/articles/6428592/Dunn-County/Wisconsin/Residents-seek-moratorium-on-proposed-Menomonie-data-center-Dunn-County-committee-discusses-zoning-authority",
            "relevance": "Dunn County committee discusses zoning authority limits; moratorium requested",
            "type": "moratorium",
        },
        {
            "title": "Tech Giant Considering $1.6B Data Center in Dunn County",
            "url": "https://volumeone.org/articles/2025/08/26/370164-tech-giant-is-considering-16-billion-data-center-dunn-county",
            "relevance": "'Stop the Menomonie Data Center' opposition group formed with significant membership",
            "type": "opposition",
        },
        {
            "title": "CBS: Weld County Embraces Data/AI Centers as Economic Future",
            "url": "https://www.cbsnews.com/colorado/news/data-ai-centers-colorado-globalai-windsor/",
            "relevance": "Weld County actively welcoming DC/AI facilities; diversifying from oil & gas",
            "type": "incentive",
        },
        {
            "title": "Colorado Newsline: Data Center Tax Breaks Bill (Jan 2026)",
            "url": "https://coloradonewsline.com/2026/01/21/tax-breaks-for-data-centers-colorado/",
            "relevance": "HB26-1030 would offer 100% sales/use tax exemption for 20+ years",
            "type": "state_policy",
        },
        {
            "title": "VPM: Virginia Data Center Reform Bills (2026)",
            "url": "https://www.vpm.org/generalassembly/2026-01-16/2026-data-center-bills-thomas-hb155-mcauliff-hb503-pjm-dominion-energy",
            "relevance": "Multiple VA reform bills targeting DC energy/environmental impacts",
            "type": "regulatory",
        },
        {
            "title": "WTOP: Prince William Digital Gateway Blocked by Court",
            "url": "https://wtop.com/prince-william-county/2025/11/digital-gateway-data-center-builders-barred-from-beginning-construction-until-legal-challenge-plays-out/",
            "relevance": "VA Court of Appeals blocked construction pending citizen legal challenge",
            "type": "opposition",
        },
        {
            "title": "Data Center Watch Q2 2025: $98B Blocked/Delayed",
            "url": "https://www.datacenterwatch.org/q22025",
            "relevance": "53 active opposition groups across 17 states; 66% of protested projects blocked",
            "type": "opposition",
        },
        {
            "title": "DCD: $1.3B Data Center Withdrawn in Chesterton, Indiana",
            "url": "https://www.datacenterdynamics.com/en/news/application-for-13bn-data-center-in-chesterton-indiana-withdrawn/",
            "relevance": "Resident opposition forced withdrawal of major DC project",
            "type": "opposition",
        },
        {
            "title": "Chicago Tribune: DC Proposals — Welcomed in LaPorte, Blocked in Chesterton",
            "url": "https://www.chicagotribune.com/2024/06/16/different-receptions-for-1-billion-investments-data-center-proposals-welcomed-in-laporte-but-not-in-chesterton/",
            "relevance": "Contrasting receptions for $1B+ DC proposals in neighboring IN communities",
            "type": "opposition",
        },
        {
            "title": "NCSL: 2026 Legislative Agendas on Data Center Incentives",
            "url": "https://www.ncsl.org/state-legislatures-news/details/2026-legislative-agendas-put-data-center-incentives-in-the-spotlight",
            "relevance": "37 states offer DC tax incentives as of June 2025; overview of 2026 trends",
            "type": "state_policy",
        },
        {
            "title": "WPR: Wisconsin Data Centers — Revenue vs. Subsidy Debate",
            "url": "https://www.wpr.org/news/wisconsin-data-centers-revenue-tax-subsidy-microsoft",
            "relevance": "Analysis of WI DC subsidy programs and local fiscal impacts",
            "type": "regulatory",
        },
    ]

    # Add extras, dedup by URL
    registry = data["permitting_citation_registry"]
    existing_urls = {r["url"] for r in registry}
    new_ids_by_url = {}
    for e in extra:
        if e["url"] not in existing_urls:
            new_idx = len(registry)
            registry.append(e)
            existing_urls.add(e["url"])
            new_ids_by_url[e["url"]] = new_idx
        else:
            new_ids_by_url[e["url"]] = next(i for i, r in enumerate(registry) if r["url"] == e["url"])

    print(f"After extras: {len(registry)} entries")

    # Map extra IDs to states/counties
    state_extras = {
        "TX": ["https://comptroller.texas.gov/taxes/data-centers/"],
        "IA": [
            "https://revenue.iowa.gov/taxes/tax-guidance/sales-use-excise-tax/data-centers",
            "https://www.brownwinick.com/insights/iowa-sales-tax-changes-for-data-centers",
        ],
        "MN": [
            "https://www.revenue.state.mn.us/qualified-data-centers",
            "https://www.house.mn.gov/sessiondaily/Story/18838",
        ],
        "AL": ["https://www.revenue.alabama.gov/tax-incentives/chapter-9b-abatements/"],
        "GA": ["https://georgia.org/competitive-advantages/incentives/tax-exemptions"],
        "WI": [
            "https://wedc.org/programs/data-center-sales-and-use-tax-exemption/",
            "https://www.thecentersquare.com/wisconsin/article_6e8df7b1-9e0d-4dda-a5cf-46a91dc88f6c.html",
            "https://www.wpr.org/news/wisconsin-data-centers-revenue-tax-subsidy-microsoft",
        ],
        "CO": ["https://coloradonewsline.com/2026/01/21/tax-breaks-for-data-centers-colorado/"],
        "VA": [
            "https://www.vpm.org/generalassembly/2026-01-16/2026-data-center-bills-thomas-hb155-mcauliff-hb503-pjm-dominion-energy",
            "https://wtop.com/prince-william-county/2025/11/digital-gateway-data-center-builders-barred-from-beginning-construction-until-legal-challenge-plays-out/",
            "https://www.datacenterwatch.org/q22025",
        ],
        "IN": [
            "https://www.datacenterdynamics.com/en/news/application-for-13bn-data-center-in-chesterton-indiana-withdrawn/",
            "https://www.chicagotribune.com/2024/06/16/different-receptions-for-1-billion-investments-data-center-proposals-welcomed-in-laporte-but-not-in-chesterton/",
        ],
    }

    # General extras for all
    general_urls = [
        "https://www.ncsl.org/state-legislatures-news/details/2026-legislative-agendas-put-data-center-incentives-in-the-spotlight",
    ]
    general_ids = [new_ids_by_url[u] for u in general_urls if u in new_ids_by_url]

    # County-specific (by FIPS)
    county_extras = {
        "55033": [  # Dunn WI
            "https://www.weau.com/2025/09/05/community-member-calls-more-transparency-over-proposed-data-center-dunn-county/",
            "https://citizenportal.ai/articles/6428592/Dunn-County/Wisconsin/Residents-seek-moratorium-on-proposed-Menomonie-data-center-Dunn-County-committee-discusses-zoning-authority",
            "https://volumeone.org/articles/2025/08/26/370164-tech-giant-is-considering-16-billion-data-center-dunn-county",
        ],
        "55123": [  # Vernon WI
            "https://www.weau.com/2025/09/05/community-member-calls-more-transparency-over-proposed-data-center-dunn-county/",
            "https://citizenportal.ai/articles/6428592/Dunn-County/Wisconsin/Residents-seek-moratorium-on-proposed-Menomonie-data-center-Dunn-County-committee-discusses-zoning-authority",
        ],
        "08123": [  # Weld CO
            "https://www.cbsnews.com/colorado/news/data-ai-centers-colorado-globalai-windsor/",
        ],
    }

    for county in data["counties"]:
        state = county["state_abbr"]
        fips = county["fips_code"]
        ids = county.get("permitting_citation_ids", [])
        ids_set = set(ids)

        # Add general
        for gid in general_ids:
            if gid not in ids_set:
                ids.append(gid)
                ids_set.add(gid)

        # Add state-specific
        for url in state_extras.get(state, []):
            cid = new_ids_by_url.get(url)
            if cid is not None and cid not in ids_set:
                ids.append(cid)
                ids_set.add(cid)

        # Add county-specific
        for url in county_extras.get(fips, []):
            cid = new_ids_by_url.get(url)
            if cid is not None and cid not in ids_set:
                ids.append(cid)
                ids_set.add(cid)

        county["permitting_citation_ids"] = ids

    DATA_PATH.write_text(json.dumps(data, separators=(",", ":")))
    print("Done!")

    # Verify
    for fips, label in [("55033", "Dunn WI"), ("55123", "Vernon WI"), ("08123", "Weld CO")]:
        for c in data["counties"]:
            if c["fips_code"] == fips:
                ids = c["permitting_citation_ids"]
                print(f"\n{label}: {len(ids)} citations")
                for cid in ids:
                    e = registry[cid]
                    print(f"  [{e.get('type','?')}] {e['title']}")
                break

    # Type distribution
    from collections import Counter
    types = Counter(r.get("type","?") for r in registry)
    print(f"\nType distribution: {dict(types)}")


if __name__ == "__main__":
    main()
