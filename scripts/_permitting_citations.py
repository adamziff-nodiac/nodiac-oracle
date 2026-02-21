"""
Permitting citation database for county-scores.json.

Used by build-real-county-scores.py to attach source citations to each
county's permitting score.  Edit this file to add/update citations.

Structure:
  - STATE_CITS: {state_abbr: [citation, ...]} — applied to all counties in state
  - COUNTY_CITS: {fips_code: [citation, ...]} — applied to specific counties
  - UNIVERSAL_CITS: [citation, ...] — applied to ALL counties

Each citation is: {"title": str, "url": str, "relevance": str}
"""

STATE_CITS: dict[str, list[dict]] = {
    "AL": [
        {"title": "Alabama: 30-Year DC Tax Abatements", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "AL offers up to 30-year tax abatements for DCs investing $400M+ and creating 20+ jobs"},
        {"title": "NCSL: AL Among States with Property Tax Relief for DCs", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "Alabama is one of 5 states offering property tax relief specifically for data centers"},
    ],
    "AZ": [
        {"title": "Arizona: Transaction Privilege Tax Abatement for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "AZ offers 20-year tax abatement at $25-50M minimum investment depending on location"},
        {"title": "$14B Tract DC Project Blocked in Goodyear AZ", "url": "https://www.datacenterwatch.org/report", "relevance": "Major project withdrawn May 2024 after resident opposition; new project near Phoenix airport announced"},
    ],
    "AR": [
        {"title": "Arkansas: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "AR has no known data center-specific tax incentive legislation"},
    ],
    "CA": [
        {"title": "California: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "CA has no DC-specific tax incentives and heavy environmental regulation (CEQA)"},
        {"title": "Environmental Groups Push for DC Moratorium", "url": "https://carboncredits.com/environmental-groups-urge-u-s-congress-to-pause-data-center-growth-as-federal-ai-rule-looms/", "relevance": "CA among states where communities evaluating energy/water impacts before DC approvals"},
    ],
    "CO": [
        {"title": "Colorado HB26-1030: Pending 100% Sales Tax Exemption for DCs", "url": "https://leg.colorado.gov/bills/HB26-1030", "relevance": "Would offer 100% state sales/use tax exemption for certified DCs — not yet enacted"},
        {"title": "Colorado Lawmakers Consider 30-Year DC Tax Breaks", "url": "https://www.datacenterdynamics.com/en/news/colorado-lawmakers-consider-30-year-tax-breaks-for-data-centers/", "relevance": "20-year exemptions with 10-year extension potential under consideration (Apr 2025)"},
        {"title": "Rocky Mountain DC Boom Skips Colorado", "url": "https://www.bisnow.com/national/news/data-center/big-tech-tax-break-has-rocky-mountain-data-center-boom-skipping-colorado-130767", "relevance": "CO lacks incentives; DC investment flowing to neighboring states with better programs"},
    ],
    "CT": [
        {"title": "Connecticut: 20-30 Year Sales/Use Tax Exemption for DCs", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "20-year exemption standard, 30 years if investment exceeds $200-400M"},
    ],
    "DE": [
        {"title": "Delaware: No Sales or Property Tax (Structural Benefit)", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "DE has no property or sales tax — structural benefit for DCs, though no DC-specific programs"},
    ],
    "FL": [
        {"title": "Florida: Full Sales/Use Tax Exemption for DCs", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "FL eliminates sales/use tax on DC infrastructure, equipment, personal property, and electricity"},
    ],
    "GA": [
        {"title": "Georgia: $15M Sales Tax Exemption for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "GA exempts state+local sales/use tax on DC equipment — low $15M annual investment threshold"},
        {"title": "NAIOP: Georgia DC Tax Incentive Structure", "url": "https://www.naiop.org/research-and-publications/magazine/2024/Winter-2024-2025/development-ownership/an-overview-of-state-data-center-related-tax-incentives/", "relevance": "Details GA's exemption structure with different subsections and triggers"},
        {"title": "Georgia: $296M in DC Tax Breaks Expected by 2025", "url": "https://abitos.com/tax-incentives-data-centers-2025/", "relevance": "Scale of GA's DC incentive program — significant state revenue commitment"},
    ],
    "HI": [
        {"title": "Hawaii: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "HI has no DC-specific incentives; island geography constrains large-scale development"},
    ],
    "ID": [
        {"title": "Idaho: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "ID has no known DC-specific tax incentive legislation"},
    ],
    "IL": [
        {"title": "Illinois: Carbon Neutrality Required for DC Incentives", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "IL requires DCs to achieve carbon neutrality within 2 years to receive any tax incentives"},
        {"title": "Local DC Moratoriums Spreading to Illinois", "url": "https://www.datacenterdynamics.com/en/news/virginia-house-of-delegates-may-consider-temporary-data-center-moratorium/", "relevance": "IL among states where local jurisdictions are introducing DC construction moratoriums"},
    ],
    "IN": [
        {"title": "Indiana: 100% Sales Tax Exemption at $10M Threshold", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "IN offers complete sales tax exemption on power, equipment, and physical plant at very low $10M threshold"},
        {"title": "$1.3B DC Project Blocked in Chesterton IN", "url": "https://www.datacenterwatch.org/report", "relevance": "Provident Realty project canceled June 2024 after pushback on air, water, wildlife, property values"},
    ],
    "IA": [
        {"title": "Iowa: DC Incentives Restructured (2025)", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "IA imposed 10-15 year limits on sales tax exemptions but added new property tax exemption starting 2027"},
        {"title": "Iowa: 100% Sales/Use Tax Abatement for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "100% abatement on sales/use tax covering equipment, cooling infrastructure, and purchased electricity"},
        {"title": "Iowa: DC Incentives Starting at $1M Investment", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "One of the lowest thresholds nationally — larger incentives available at $200M+"},
    ],
    "KS": [
        {"title": "Kansas: 37th State to Enact DC Incentives (July 2025)", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "New sales tax exemption for DCs investing $250M+ and creating 20+ jobs"},
    ],
    "KY": [
        {"title": "Kentucky: Sales Tax Refund at $100M Threshold", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "KY offers sales tax refund for computer system equipment at $100M investment threshold"},
        {"title": "Local DC Moratoriums Spreading to Kentucky", "url": "https://www.datacenterdynamics.com/en/news/virginia-house-of-delegates-may-consider-temporary-data-center-moratorium/", "relevance": "KY among states where local DC moratoriums are being introduced"},
    ],
    "LA": [
        {"title": "Louisiana: Industrial Purpose Designation for DCs (2025)", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "New law enables cooperative public-private partnerships for DCs; requires $200M capital investment"},
    ],
    "ME": [
        {"title": "Maine: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "ME has no known DC-specific tax incentive legislation"},
    ],
    "MD": [
        {"title": "Maryland: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "MD has no DC-specific incentives despite proximity to Virginia's DC market"},
    ],
    "MA": [
        {"title": "Massachusetts: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "MA has no DC-specific incentives; high cost environment"},
    ],
    "MI": [
        {"title": "Michigan: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "MI has no DC-specific tax incentive legislation"},
        {"title": "Community Pushback Blocks DC Projects in Michigan (2025)", "url": "https://www.datacenterknowledge.com/build-design/calls-for-us-data-center-freeze-grow-as-local-enthusiasm-melts", "relevance": "MI among states where community pushback stymied large DC projects in 2025"},
    ],
    "MN": [
        {"title": "Minnesota Rolls Back DC Electricity Exemption (2025)", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "MN removed electricity from sales tax exemption; computer equipment purchases remain exempt"},
        {"title": "MN HF16: DC Incentive Rollback Bill Text", "url": "https://www.revisor.mn.gov/bills/94/2025/1/HF/16/versions/latest/?list=open", "relevance": "Actual legislation removing electricity exemption from DC incentive program"},
        {"title": "Minnesota: 20-Year Equipment Sales Tax Exemption", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "DCs of 25K+ sqft, $30M+ still get 20-year equipment exemption and permanent property tax exemption"},
    ],
    "MS": [
        {"title": "Mississippi: $50M DC Sales Tax Exemption", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales/use tax exemption for DCs investing $50M+ and creating 50 jobs at 150% average state wage"},
        {"title": "Mississippi: $32M Job Training Investment for AWS DCs", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "State invested $32M in workforce training for two Amazon DC facilities (2024)"},
    ],
    "MO": [
        {"title": "Missouri: $25M Sales Tax Exemption for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales/use tax exemption at $25M investment and 10 jobs; existing DCs qualify at $5M+5 jobs"},
        {"title": "Peculiar MO Zoning Amended to Prohibit Data Centers", "url": "https://www.datacenterwatch.org/report", "relevance": "$1.5B project blocked; 'Don't Dump Data in Peculiar' campaign led to DCs removed from zoning (Oct 2024)"},
    ],
    "MT": [
        {"title": "Montana: No State Sales Tax (Structural Benefit)", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "MT has no state-wide sales tax — structural benefit, but no DC-specific programs"},
    ],
    "NE": [
        {"title": "Nebraska: Multi-Tier Sales/Property Tax Breaks for DCs", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "Tiered incentives starting at $3M/30 employees or $37M with steady employment"},
        {"title": "Nebraska Advantage Act for Data Centers", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Comprehensive tax abatement and credit structure for qualifying DCs"},
    ],
    "NV": [
        {"title": "Nevada: Up to 75% Tax Abatement for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Up to 75% abatement on personal property, sales, and use taxes at $25M+ investment"},
        {"title": "NCSL: Nevada Among States with DC Property Tax Relief", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "One of 5 states (AL, IA, MT, NV, OK) offering property tax relief for DCs"},
    ],
    "NH": [
        {"title": "New Hampshire: No State Sales Tax (Structural Benefit)", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "No state-wide sales tax — structural benefit, but no DC-specific programs"},
    ],
    "NJ": [
        {"title": "New Jersey: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "NJ has no DC-specific incentives; high cost environment"},
    ],
    "NM": [
        {"title": "New Mexico: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "NM has no known DC-specific tax incentive legislation"},
    ],
    "NY": [
        {"title": "New York: Sales Tax Exemption for Internet DC Equipment", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales tax exemption for equipment used by Internet data centers"},
        {"title": "NY: DC Development Programs in Certain Areas", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "Equipment sales tax exemption plus programs promoting DC development in specific regions"},
    ],
    "NC": [
        {"title": "North Carolina: Sales+Electricity Exemption for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales+electricity exemption at $150M (poorer counties) or $225M (wealthier counties)"},
        {"title": "Community Pushback Against DCs in North Carolina (2025)", "url": "https://www.datacenterknowledge.com/build-design/calls-for-us-data-center-freeze-grow-as-local-enthusiasm-melts", "relevance": "NC among states experiencing community pushback against large DC projects in 2025"},
    ],
    "ND": [
        {"title": "North Dakota: Sales Tax Exemption for DC Equipment", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "Sales tax exemption on computer equipment for DCs of at least 16,000 sqft"},
    ],
    "OH": [
        {"title": "Ohio: $100M Sales Tax Abatement for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales tax abatement at $100M investment, $1.5M annual payroll; no tangible personal property tax"},
    ],
    "OK": [
        {"title": "Oklahoma: Sales Tax Exemption for Computer Services", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "Sales tax exemption on equipment for data processing companies with majority out-of-state revenue"},
        {"title": "NCSL: Oklahoma DC Property Tax Relief", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "One of 5 states offering property tax relief specifically for data centers"},
    ],
    "OR": [
        {"title": "Oregon: No Sales Tax + Enterprise Zone Property Exemptions", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "No sales tax statewide; property tax exemptions available in local enterprise zones"},
        {"title": "Cascade Locks OR: $100M DC Blocked After Official Recall", "url": "https://www.datacenterwatch.org/report", "relevance": "Residents recalled two officials who approved Roundhouse Digital project (July 2023)"},
    ],
    "PA": [
        {"title": "Pennsylvania: No Specific DC Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "No specific DC incentives; limited aid through general economic development programs"},
    ],
    "RI": [
        {"title": "Rhode Island: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "RI has no known DC-specific tax incentive legislation"},
    ],
    "SC": [
        {"title": "South Carolina: Sales+Electricity Exemption at $50M", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales tax exemption on equipment and electricity for DCs investing $25M+ and hiring 50 people"},
    ],
    "SD": [
        {"title": "South Dakota: General ED Programs for DCs", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "No specific DC incentives but has aided DC projects through general economic development programs"},
    ],
    "TN": [
        {"title": "Tennessee: $250M Sales+Electricity Tax Break for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales tax breaks on equipment and electricity at $250M investment threshold plus jobs tax credit"},
        {"title": "TN DC Tax Incentive Details", "url": "https://windhambrannon.com/blog/data-center-related-tax-incentives-2025/", "relevance": "Detailed breakdown of Tennessee's qualifying criteria and exemption scope"},
    ],
    "TX": [
        {"title": "Texas: 10-15 Year Sales Tax Abatement at $200M", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "10-15 year sales tax abatement for DCs investing $200M+, creating 20+ jobs, 100K+ sqft"},
        {"title": "Fort Worth $750M DC Delayed by Zoning Opposition", "url": "https://www.datacenterwatch.org/report", "relevance": "Rock Creek DC rejected by zoning commission then approved by city council; ongoing regulatory hurdles"},
    ],
    "UT": [
        {"title": "Utah: Case-by-Case General Incentives for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Uses general incentive programs on case-by-case basis; no DC-specific legislation"},
    ],
    "VT": [
        {"title": "Vermont: No DC-Specific Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "VT has no known DC-specific tax incentive legislation"},
    ],
    "VA": [
        {"title": "Virginia: $150M Sales/Use Tax Exemption for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales/use tax abatement at $150M investment with job creation and wage requirements"},
        {"title": "VA JLARC: $928M in DC Tax Relief (FY2023)", "url": "https://jlarc.virginia.gov/landing-2024-data-centers-in-virginia.asp", "relevance": "Virginia's DC incentive provided $928M tax relief in FY2023; 90% of DC industry uses the exemption"},
        {"title": "Virginia: $730M+ Annual DC Tax Exemption (FY2024)", "url": "https://www.cnbc.com/2025/06/20/tax-breaks-for-tech-giants-data-centers-mean-less-income-for-states.html", "relevance": "Largest DC tax incentive in the nation — estimated $730M+ lump-sum exemption for FY2024"},
        {"title": "$64B+ in VA DC Projects Blocked/Delayed", "url": "https://www.datacenterwatch.org/report", "relevance": "Prince William ($24.7B), Culpeper ($12B), King George ($6B), Midlothian ($3B), Richmond ($500M), Catlett ($400M), Alexandria ($165M)"},
        {"title": "Virginia House May Consider Temporary DC Moratorium", "url": "https://www.datacenterdynamics.com/en/news/virginia-house-of-delegates-may-consider-temporary-data-center-moratorium/", "relevance": "State-level moratorium under consideration as of early 2026; no state has enacted one yet"},
        {"title": "DC Opposition as Electoral Issue in Virginia", "url": "https://www.techpolicy.press/the-real-race-for-an-ai-moratorium-stopping-data-centers/", "relevance": "DC opposition emerged as decisive electoral issue cutting across political spectrum in VA races"},
        {"title": "Loudoun County Tightening DC Zoning Rules", "url": "https://www.multistate.us/insider/2026/1/15/state-data-center-legislation-faces-local-zoning-battles", "relevance": "Home to 643 DCs; resident concerns prompting tighter zoning despite significant tax revenue"},
    ],
    "WA": [
        {"title": "Washington: Sales Tax Exemption in Rural/Developing Areas", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Sales tax exemption for server equipment and power infrastructure in rural/empowerment zones"},
        {"title": "WA HB 1846: Expanded DC Incentives (2022)", "url": "https://www.streamdatacenters.com/resource-library/glossary/tax-incentives-for-data-centers/", "relevance": "Program expanded to include both rural and urban counties with annual certificate limits"},
    ],
    "WV": [
        {"title": "West Virginia: New DC Tax Incentives (2025)", "url": "https://www.streamdatacenters.com/resource-library/glossary/tax-incentives-for-data-centers/", "relevance": "New sales/use tax exemption + property tax at salvage value (~5%) for qualifying DC equipment"},
        {"title": "Community Pushback in West Virginia (2025)", "url": "https://www.datacenterknowledge.com/build-design/calls-for-us-data-center-freeze-grow-as-local-enthusiasm-melts", "relevance": "WV among states with some community pushback against DC projects in 2025"},
    ],
    "WI": [
        {"title": "Wisconsin: Limited TIF District Expansion for DCs (2025)", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "Removed TIF limitations for qualified DCs in two municipalities; $50M threshold for counties <50K population"},
        {"title": "WI AB140: TIF District Legislation for DCs", "url": "https://docs.legis.wisconsin.gov/2025/proposals/ab140", "relevance": "Actual bill text — lower capital investment threshold for data centers in less populous counties"},
        {"title": "Wisconsin: No Broad DC Tax Incentives", "url": "https://h5datacenters.com/tax-incentives.html", "relevance": "WI has no comprehensive DC-specific tax incentive legislation beyond limited TIF expansion"},
        {"title": "Community Pushback in Wisconsin (2025)", "url": "https://www.datacenterknowledge.com/build-design/calls-for-us-data-center-freeze-grow-as-local-enthusiasm-melts", "relevance": "WI among states where community pushback stymied some large DC projects in 2025"},
    ],
    "WY": [
        {"title": "Wyoming: Tiered Sales Tax Exemption for DCs", "url": "https://knowledge.sdialliance.org/policies/us-tax-incentives-for-data-centers-by-state", "relevance": "Equipment exemption at $5M; power/cooling at $50M; additional breaks for multi-tenant DCs"},
    ],
}

COUNTY_CITS: dict[str, list[dict]] = {
    "51153": [{"title": "Prince William VA: $24.7B Digital Gateway Delayed", "url": "https://www.datacenterwatch.org/report", "relevance": "QTS/Compass project contested in 3+ lawsuits; opposition over environment, noise, power grid, historic sites"}],
    "51047": [{"title": "Culpeper VA: $12B DC Unanimously Denied", "url": "https://www.datacenterwatch.org/report", "relevance": "426-acre rezoning denied June 2024; rural preservation and Battlefields State Park concerns"}],
    "51099": [{"title": "King George VA: $6B Amazon DC — Board Renegotiating", "url": "https://www.datacenterwatch.org/report", "relevance": "New board renegotiating Dec 2023 deal; threatened rezoning reversal to agricultural use"}],
    "51061": [{"title": "Fauquier VA: $400M Catlett Station DC Withdrawn", "url": "https://www.datacenterwatch.org/report", "relevance": "Headwaters withdrew before hearing; organized opposition over noise, water, power, environment"}],
    "51107": [{"title": "Loudoun County VA: DC Market Saturated, Zoning Tightening", "url": "https://www.multistate.us/insider/2026/1/15/state-data-center-legislation-faces-local-zoning-battles", "relevance": "643 DCs already; new zoning/permitting rules despite tax revenue; community pushback growing"}],
    "51059": [{"title": "Fairfax VA: Bren Mar $165M DC Deferred Then Contested", "url": "https://www.datacenterwatch.org/report", "relevance": "'Save Bren Mar' campaign; deferred 2022, re-filed 2024; substation/transmission battle ongoing at SCC"}],
    "51087": [{"title": "Henrico VA: $500M DC Blox Withdrawn, Revised Smaller", "url": "https://www.datacenterwatch.org/report", "relevance": "Project deferred July 2024, withdrawn Nov 2024, revised single-story 65K sqft filed Feb 2025"}],
    "29037": [{"title": "Cass County MO (Peculiar): Zoning Amended to Prohibit DCs", "url": "https://www.datacenterwatch.org/report", "relevance": "$1.5B Diode Ventures blocked; 'Don't Dump Data in Peculiar'; DCs removed from zoning Oct 2024"}],
    "18127": [{"title": "Porter County IN (Chesterton): $1.3B DC Blocked", "url": "https://www.datacenterwatch.org/report", "relevance": "Provident Realty canceled June 2024; resident concerns about air, water, wildlife, property values"}],
    "04013": [{"title": "Maricopa AZ: $14B Tract Project Blocked in Goodyear", "url": "https://www.datacenterwatch.org/report", "relevance": "Withdrawn May 2024 after opposition; but new 18GW project announced near Phoenix airport Aug 2024"}],
    "41027": [{"title": "Hood River OR: $100M Cascade Locks DC Blocked", "url": "https://www.datacenterwatch.org/report", "relevance": "Residents recalled officials who approved it; concerns over utility rates and developer credibility (2023)"}],
    "55033": [{"title": "Dunn County WI: Rural Co-op Territory, Lower TIF Threshold", "url": "https://docs.legis.wisconsin.gov/2025/proposals/ab140", "relevance": "Qualifies for WI's lower $50M investment threshold for DC TIF districts in counties <50K population"}],
    "55123": [{"title": "Vernon County WI: Rural Co-op Territory, Lower TIF Threshold", "url": "https://docs.legis.wisconsin.gov/2025/proposals/ab140", "relevance": "Qualifies for WI's lower $50M investment threshold for DC TIF districts in counties <50K population"}],
    "08123": [{"title": "Weld County CO: Industrial-Friendly, Pending State Incentives", "url": "https://leg.colorado.gov/bills/HB26-1030", "relevance": "Large industrial county with oil & gas precedent; would benefit from HB26-1030 if enacted"}],
}

# County-level DC ordinance data — noise limits, setbacks, water caps, etc.
# These counties have adopted DC-specific zoning or land-use regulations.
# Keyed by FIPS; each entry has structured fields + citation.
COUNTY_ORDINANCES: dict[str, dict] = {
    "51107": {  # Loudoun County VA
        "has_dc_ordinance": True,
        "noise_limit_dba": 55,
        "setback_ft": 200,
        "moratorium": False,
        "notes": "2024 zoning overlay limits DC height to 55ft, requires 200ft setback from residential, 55dBA noise at property line",
        "citation": {"title": "Loudoun County DC Zoning Overlay (2024)", "url": "https://www.loudoun.gov/5856/Data-Centers", "relevance": "Comprehensive DC-specific zoning with noise, setback, height, and landscaping requirements"},
    },
    "51153": {  # Prince William County VA
        "has_dc_ordinance": True,
        "noise_limit_dba": 55,
        "setback_ft": 300,
        "moratorium": False,
        "notes": "Digital Gateway overlay requires 300ft setback, noise monitoring, stormwater management",
        "citation": {"title": "Prince William Digital Gateway Overlay", "url": "https://www.pwcva.gov/department/planning-office/data-centers", "relevance": "Special overlay district with stringent environmental and community impact requirements"},
    },
    "51047": {  # Culpeper County VA
        "has_dc_ordinance": True,
        "noise_limit_dba": None,
        "setback_ft": None,
        "moratorium": True,
        "notes": "Effectively blocked DC development after unanimous denial of 426-acre rezoning (June 2024)",
        "citation": {"title": "Culpeper County Denies DC Rezoning", "url": "https://www.datacenterwatch.org/report", "relevance": "Board unanimously denied rezoning citing rural preservation and Battlefields State Park proximity"},
    },
    "29037": {  # Cass County MO (Peculiar)
        "has_dc_ordinance": True,
        "noise_limit_dba": None,
        "setback_ft": None,
        "moratorium": True,
        "notes": "Zoning code amended October 2024 to completely prohibit data centers",
        "citation": {"title": "Peculiar MO: Zoning Amended to Prohibit DCs", "url": "https://www.datacenterwatch.org/report", "relevance": "City removed DCs from permitted uses after community campaign"},
    },
    "36087": {  # Rockland County NY
        "has_dc_ordinance": True,
        "noise_limit_dba": 45,
        "setback_ft": 500,
        "moratorium": True,
        "notes": "18-month moratorium on new DC construction adopted 2024; 45dBA noise limit, 500ft setback from residential",
        "citation": {"title": "Rockland County NY: DC Moratorium", "url": "https://www.lohud.com/story/news/local/rockland/2024/03/19/rockland-county-data-center-moratorium/73034212007/", "relevance": "One of first NY counties to impose DC-specific moratorium with noise and setback rules"},
    },
    "42091": {  # Montgomery County PA
        "has_dc_ordinance": True,
        "noise_limit_dba": 50,
        "setback_ft": 150,
        "moratorium": False,
        "notes": "DC-specific conditional use requirements adopted 2024; noise, impervious surface, landscaping standards",
        "citation": {"title": "Montgomery County PA DC Conditional Use Rules", "url": "https://www.montcopa.org/planning", "relevance": "Conditional use permit required with environmental impact assessment for DCs >10MW"},
    },
    "17031": {  # Cook County IL
        "has_dc_ordinance": True,
        "noise_limit_dba": None,
        "setback_ft": None,
        "moratorium": False,
        "notes": "Carbon neutrality required within 2 years per state law; Chicago zoning treats DCs as industrial use",
        "citation": {"title": "Illinois Carbon Neutrality Requirement for DCs", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "State-level requirement affecting all IL counties — DCs must achieve carbon neutrality in 2 years"},
    },
    "48439": {  # Tarrant County TX (Fort Worth)
        "has_dc_ordinance": True,
        "noise_limit_dba": 65,
        "setback_ft": 100,
        "moratorium": False,
        "notes": "DC-specific overlay adopted after Rock Creek controversy; 65dBA at property line, conditional use in some zones",
        "citation": {"title": "Fort Worth DC Zoning Updates (2024)", "url": "https://www.datacenterwatch.org/report", "relevance": "New DC overlay after $750M project was initially rejected by zoning commission"},
    },
}

UNIVERSAL_CITS: list[dict] = [
    {"title": "NCSL: State Data Center Incentive Legislation Tracker", "url": "https://www.ncsl.org/fiscal/policy-snapshot-data-center-incentives", "relevance": "Primary source for state-by-state DC incentive legislation; 37 states offer incentives as of 2026"},
    {"title": "Data Center Watch: Blocked & Delayed Projects Report", "url": "https://www.datacenterwatch.org/report", "relevance": "Tracks $64B+ in community-opposed DC projects; primary source for moratorium and opposition risk data"},
    {"title": "Demands for DC Moratoriums Surge (Dec 2025)", "url": "https://prospect.org/2025/12/22/demands-for-data-center-moratoriums-surge/", "relevance": "Overview of growing nationwide DC opposition movement and local moratorium adoption"},
]
