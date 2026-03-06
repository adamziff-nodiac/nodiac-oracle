# Utility Assignment Conflicts — HIFLD vs Current

These 132 sites already have a utility assigned that differs from what HIFLD's territory map says. The backfill script did NOT change these — they need manual review.

**Common patterns:**

- Trade name vs legal subsidiary (e.g., "Xcel Energy" vs "PUBLIC SERVICE CO OF COLORADO") — usually keep the trade name
- Territory boundary edge cases where actual interconnection differs from the HIFLD polygon

---

## Xcel Energy vs HIFLD Subsidiary Names (49 sites)

### Xcel = PUBLIC SERVICE CO OF COLORADO (32 sites)


| Site                               | Current     | HIFLD                         |
| ---------------------------------- | ----------- | ----------------------------- |
| Adams State University             | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Alamosa Solar South                | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Cameo                              | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Denver Int'l Airport               | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DIA 1                              | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DIA 2                              | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DIA 8                              | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DIA 9                              | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DIA9                               | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - East HS                      | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - Fallis (Denver Green School) | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - Grant Ranch                  | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - Green Valley Ranch           | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - Lowry                        | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - Manual High School           | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - MLK                          | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - Place Bridge Academy         | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - Randolph Elementary          | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - South High School            | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| DPS - Thomas Jefferson             | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Green Valley Elementary            | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Greeley-Weld Airport               | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Greenwood Elementary               | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Lantz-Chaffee                      | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Linnebur                           | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Lowry                              | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| McCormick                          | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Rachel B. Noel Middle School       | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Rifle                              | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Tebo 1                             | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Tebo 2                             | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |
| Wiescamp                           | Xcel Energy | PUBLIC SERVICE CO OF COLORADO |


### Xcel = NORTHERN STATES POWER CO - MINNESOTA (10 sites)


| Site           | Current     | HIFLD                                |
| -------------- | ----------- | ------------------------------------ |
| Chisago        | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| Hastings       | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| Lake Pulaski   | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| Lawrence Creek | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| Montrose       | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| Paynesville    | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| Pine Island    | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| Waseca         | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| West Faribault | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |
| West Waconia   | Xcel Energy | NORTHERN STATES POWER CO - MINNESOTA |


### Xcel but HIFLD says different utility entirely (7 sites) — REVIEW


| Site               | Current     | HIFLD                                    |
| ------------------ | ----------- | ---------------------------------------- |
| Albany - MN        | Xcel Energy | STEARNS COOPERATIVE ELEC ASSN            |
| Alden              | Xcel Energy | WAPA-- WESTERN AREA POWER ADMINISTRATION |
| Anderson           | Xcel Energy | UNITED POWER, INC                        |
| Annandale          | Xcel Energy | WRIGHT-HENNEPIN COOP ELEC ASSN           |
| CWS                | Xcel Energy | CITY OF BIGELOW - (MN)                   |
| Dodge Center       | Xcel Energy | PEOPLE'S COOPERATIVE SERVICES            |
| Eastwood           | Xcel Energy | BENCO ELECTRIC COOPERATIVE               |
| Lake Emily         | Xcel Energy | MINNESOTA VALLEY ELECTRIC COOP           |
| Monte Vista 2      | Xcel Energy | SAN LUIS VALLEY R E C, INC               |
| Platteville        | Xcel Energy | UNITED POWER, INC                        |
| Ridgewind          | Xcel Energy | SIOUX VALLEY SW ELEC COOP                |
| Rock Creek 2       | Xcel Energy | SAN LUIS VALLEY R E C, INC               |
| Sterling Community | Xcel Energy | WAPA-- WESTERN AREA POWER ADMINISTRATION |
| WindShare          | Xcel Energy | NOBLES COOPERATIVE ELECTRIC              |


---

## PSE&G vs HIFLD Name (5 sites)

Same utility, different name format. Keep "PSE&G".


| Site                | Current | HIFLD                        |
| ------------------- | ------- | ---------------------------- |
| 101 Carnegie Center | PSE&G   | PUBLIC SERVICE ELEC & GAS CO |
| 510 Carnegie Center | PSE&G   | PUBLIC SERVICE ELEC & GAS CO |
| 701 Carnegie Center | PSE&G   | PUBLIC SERVICE ELEC & GAS CO |
| BNB Camden          | PSE&G   | PUBLIC SERVICE ELEC & GAS CO |


---

## Pepco vs HIFLD Name (4 sites)

Same utility, different name format. Keep "Pepco".


| Site                 | Current | HIFLD                     |
| -------------------- | ------- | ------------------------- |
| Catholic Charities   | Pepco   | POTOMAC ELECTRIC POWER CO |
| Oaks Landfill - ANEM | Pepco   | POTOMAC ELECTRIC POWER CO |
| Oaks Landfill - CS 2 | Pepco   | POTOMAC ELECTRIC POWER CO |
| Phoenix              | Pepco   | POTOMAC ELECTRIC POWER CO |


---

## Eversource vs HIFLD Name (4 sites)

Same utility (Eversource owns NSTAR). Keep "Eversource".


| Site                        | Current                               | HIFLD                  |
| --------------------------- | ------------------------------------- | ---------------------- |
| Pine Hill                   | Eversource                            | NSTAR ELECTRIC COMPANY |
| Ring Road                   | Eversource                            | NSTAR ELECTRIC COMPANY |
| Upland                      | Eversource                            | NSTAR ELECTRIC COMPANY |
| Holiday Hill Community Wind | Eversource Energy (NSTAR GAS COMPANY) | NSTAR ELECTRIC COMPANY |


---

## National Grid / Niagara Mohawk (5 sites)


| Site        | Current                                              | HIFLD                      |
| ----------- | ---------------------------------------------------- | -------------------------- |
| Albany 1    | Niagara Mohawk Power Corporation d/b/a National Grid | NIAGARA MOHAWK POWER CORP. |
| Albany 2    | Niagara Mohawk Power Corporation d/b/a National Grid | NIAGARA MOHAWK POWER CORP. |
| Kosa        | Niagara Mohawk Power Corporation d/b/a National Grid | NIAGARA MOHAWK POWER CORP. |
| Stockbridge | Niagara Mohawk Power Corporation d/b/a National Grid | NIAGARA MOHAWK POWER CORP. |
| Cider       | New York Power Authority                             | NIAGARA MOHAWK POWER CORP. |


---

## Narragansett / National Grid (3 sites)


| Site           | Current                                             | HIFLD                        |
| -------------- | --------------------------------------------------- | ---------------------------- |
| Cov 5          | Narragansett Electric Company (d/b/a National Grid) | THE NARRAGANSETT ELECTRIC CO |
| Cov 6          | Narragansett Electric Company (d/b/a National Grid) | THE NARRAGANSETT ELECTRIC CO |
| Portsmouth One | Narragansett Electric Company (d/b/a National Grid) | THE NARRAGANSETT ELECTRIC CO |


---

## PG&E (2 sites)

Same utility. Keep current name.


| Site                       | Current                                 | HIFLD                      |
| -------------------------- | --------------------------------------- | -------------------------- |
| Altamont (aka Summit Wind) | Pacific Gas and Electric Company (PG&E) | PACIFIC GAS & ELECTRIC CO. |
| Lake Herman                | Pacific Gas and Electric Company (PG&E) | PACIFIC GAS & ELECTRIC CO. |


---

## Northwestern Energy (4 sites)


| Site            | Current                 | HIFLD                                    |
| --------------- | ----------------------- | ---------------------------------------- |
| Fairfield Wind  | Northwestern Energy     | WAPA-- WESTERN AREA POWER ADMINISTRATION |
| Greenfield Wind | Northwestern Energy     | WAPA-- WESTERN AREA POWER ADMINISTRATION |
| MTSun           | Northwestern Energy     | YELLOWSTONE VALLEY ELEC CO-OP            |
| Trident Solar   | Northwestern Energy LLC | NORTHWESTERN ENERGY LLC - (MT)           |


---

## Jump River Electric vs NSP (6 sites)


| Site         | Current                         | HIFLD                    |
| ------------ | ------------------------------- | ------------------------ |
| Conrath      | Jump River Electric Cooperative | NORTHERN STATES POWER CO |
| Flambeau     | Jump River Electric Cooperative | NORTHERN STATES POWER CO |
| Gilman       | Jump River Electric Cooperative | NORTHERN STATES POWER CO |
| Hannibal     | Jump River Electric Cooperative | NORTHERN STATES POWER CO |
| Hawkins      | Jump River Electric Cooperative | NORTHERN STATES POWER CO |
| Weyerhaeuser | Jump River Electric Cooperative | NORTHERN STATES POWER CO |


---

## Commonwealth Edison vs Local Co-ops (9 sites)


| Site                 | Current                     | HIFLD                     |
| -------------------- | --------------------------- | ------------------------- |
| Agrimony 1           | Commonwealth Edison Company | SCENIC RIVERS ENERGY COOP |
| Agrimony 2           | Commonwealth Edison Company | SCENIC RIVERS ENERGY COOP |
| Armstrong 1          | Commonwealth Edison Company | ROCK ENERGY COOPERATIVE   |
| Lobelia 1            | Commonwealth Edison Company | ROCK ENERGY COOPERATIVE   |
| Marengo I            | Commonwealth Edison Company | ROCK ENERGY COOPERATIVE   |
| Marengo II           | Commonwealth Edison Company | ROCK ENERGY COOPERATIVE   |
| N Baker Road         | Commonwealth Edison Company | SCENIC RIVERS ENERGY COOP |
| N Solon Road (North) | Commonwealth Edison Company | ROCK ENERGY COOPERATIVE   |
| N Solon Road (South) | Commonwealth Edison Company | ROCK ENERGY COOPERATIVE   |


---

## ITC Midwest vs Local Co-ops (3 sites)


| Site    | Current                                  | HIFLD                          |
| ------- | ---------------------------------------- | ------------------------------ |
| Elk     | ITC Midwest LLC & Midwest Independent... | MAQUOKETA VALLEY RRL ELEC COOP |
| Hawkeye | ITC Midwest LLC & Midwest Independent... | ALLAMAKEE-CLAYTON EL COOP, INC |
| Rippey  | ITC Midwest LLC & Midwest Independent... | MIDLAND POWER COOP             |


---

## Platte River Power Authority (1 site)


| Site                                     | Current                      | HIFLD                                    |
| ---------------------------------------- | ---------------------------- | ---------------------------------------- |
| CO29 Buffalo Flats (aka Rawhide Prairie) | Platte River Power Authority | WAPA-- WESTERN AREA POWER ADMINISTRATION |


---

## Remaining One-offs (29 sites)


| Site                             | Current                                   | HIFLD                                    |
| -------------------------------- | ----------------------------------------- | ---------------------------------------- |
| 115 / G. Fisher                  | Middleborough Gas & Electric Department   | TOWN OF MIDDLEBOROUGH - (MA)             |
| 154 / D. Fisher                  | Middleborough Gas & Electric Department   | TOWN OF MIDDLEBOROUGH - (MA)             |
| Black Hills Electric Cooperative | Fall River                                | WAPA-- WESTERN AREA POWER ADMINISTRATION |
| Bluestar                         | Delmarva Power & Light Company            | CHOPTANK ELECTRIC COOPERATIVE, INC       |
| Bluff Prairie (Vernon)           | Vernon Electric Cooperative               | SCENIC RIVERS ENERGY COOP                |
| Consumers Energy                 | Lake City                                 | WOLVERINE POWER SUPPLY COOP              |
| Consumers Energy                 | Morey Road                                | WOLVERINE POWER SUPPLY COOP              |
| Consumers Energy                 | Surrey Road                               | DTE ELECTRIC COMPANY                     |
| Dominion Energy                  | Sun Farm V                                | ALBEMARLE ELECTRIC MEMBER CORP           |
| Dominion Energy                  | Sun Farm VI                               | ALBEMARLE ELECTRIC MEMBER CORP           |
| Dunn Electric Co-op              | Hay River                                 | NORTHERN STATES POWER CO                 |
| Dunn Electric Co-op              | Walleye                                   | NORTHERN STATES POWER CO                 |
| Electric City Solar              | The City of Sturgis, MI                   | CITY OF STURGIS                          |
| Black Hills Energy               | Fremont                                   | WAPA-- WESTERN AREA POWER ADMINISTRATION |
| Georgetown (Polk Burnett)        | Polk Burnett Electric Cooperative         | NORTHWESTERN WISCONSIN ELEC CO           |
| Gliden (Op Zone)                 | Virginia Electric and Power Company       | VIRGINIA ELECTRIC & POWER CO             |
| Howard                           | New York State Electric & Gas Corp        | STEUBEN RURAL ELEC COOP, INC             |
| ISO New England Inc.             | Weaver Wind                               | VERSANT POWER                            |
| Lawrence Brook                   | Village of Morrisville Water & Light Dept | VERMONT ELECTRIC COOPERATIVE, INC        |
| Ledgeview                        | Wisconsin Power and Light                 | WPPI ENERGY                              |
| Littleton                        | Littleton Electric Light Department       | MASSACHUSETTS ELECTRIC CO                |
| Mahany                           | New York State Electric & Gas Corp        | STEUBEN RURAL ELEC COOP, INC             |
| MDU / NVSS-II                    | Valley Electric Association, Inc.         | VALLEY ELECTRIC ASSN, INC                |
| NV Energy                        | Turquoise                                 | SIERRA PACIFIC POWER CO                  |
| Our Katahdin                     | Versant Power                             | EASTERN MAINE ELECTRIC COOP              |
| Panther Creek                    | Prairie Power                             | AMEREN ILLINOIS COMPANY                  |
| Rocky Mountain Power Inc         | Smithfield 1                              | PACIFICORP                               |
| South Street - Middlebury        | Agricultural Community Solar              | GREEN MOUNTAIN POWER CORP                |
| Trimbelle (Pierce Pepin)         | Pierce Pepin Cooperative Services         | WPPI ENERGY                              |


