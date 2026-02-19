export interface GoogleDataCenter {
  name: string
  region: 'North America' | 'Europe' | 'Asia' | 'South America'
  status: 'active' | 'in_development'
  coordinates: [number, number] // [longitude, latitude]
}

export const googleDataCenters: GoogleDataCenter[] = [
  // North America — Active
  { name: 'Council Bluffs, Iowa', region: 'North America', status: 'active', coordinates: [-95.86, 41.26] },
  { name: 'The Dalles, Oregon', region: 'North America', status: 'active', coordinates: [-121.18, 45.60] },
  { name: 'Douglas County, Georgia', region: 'North America', status: 'active', coordinates: [-84.75, 33.75] },
  { name: 'Ellis County, Texas', region: 'North America', status: 'active', coordinates: [-96.79, 32.35] },
  { name: 'Henderson, Nevada', region: 'North America', status: 'active', coordinates: [-114.98, 36.04] },
  { name: 'Jackson County, Alabama', region: 'North America', status: 'active', coordinates: [-86.05, 34.77] },
  { name: 'Lenoir, North Carolina', region: 'North America', status: 'active', coordinates: [-81.54, 35.91] },
  { name: 'The Lowcountry, South Carolina', region: 'North America', status: 'active', coordinates: [-79.95, 33.18] },
  { name: 'Mayes County, Oklahoma', region: 'North America', status: 'active', coordinates: [-95.21, 36.30] },
  { name: 'Midlothian, Texas', region: 'North America', status: 'active', coordinates: [-96.99, 32.48] },
  { name: 'Montgomery County, Tennessee', region: 'North America', status: 'active', coordinates: [-87.36, 36.53] },
  { name: 'Northern Virginia', region: 'North America', status: 'active', coordinates: [-77.49, 39.04] },
  { name: 'Omaha, Nebraska', region: 'North America', status: 'active', coordinates: [-95.94, 41.26] },
  { name: 'Papillion, Nebraska', region: 'North America', status: 'active', coordinates: [-96.04, 41.15] },
  { name: 'Storey County, Nevada', region: 'North America', status: 'active', coordinates: [-119.53, 39.57] },
  { name: 'Central Ohio', region: 'North America', status: 'active', coordinates: [-82.99, 39.96] },
  { name: 'Indiana', region: 'North America', status: 'active', coordinates: [-86.16, 39.77] },
  // North America — In Development
  { name: 'Armstrong County, Texas', region: 'North America', status: 'in_development', coordinates: [-101.35, 34.95] },
  { name: 'Cedar Rapids, Iowa', region: 'North America', status: 'in_development', coordinates: [-91.67, 41.98] },
  { name: 'Chesterfield County, Virginia', region: 'North America', status: 'in_development', coordinates: [-77.51, 37.38] },
  { name: 'Dorchester County, South Carolina', region: 'North America', status: 'in_development', coordinates: [-80.41, 33.08] },
  { name: 'Haskell County, Texas', region: 'North America', status: 'in_development', coordinates: [-99.73, 33.16] },
  { name: 'Kansas City, Missouri', region: 'North America', status: 'in_development', coordinates: [-94.58, 39.10] },
  { name: 'Lincoln, Nebraska', region: 'North America', status: 'in_development', coordinates: [-96.68, 40.81] },
  { name: 'Mesa, Arizona', region: 'North America', status: 'in_development', coordinates: [-111.83, 33.42] },
  { name: 'Muskogee County, Oklahoma', region: 'North America', status: 'in_development', coordinates: [-95.37, 35.75] },
  { name: 'West Memphis, Arkansas', region: 'North America', status: 'in_development', coordinates: [-90.18, 35.15] },
  { name: 'Red Oak, Texas', region: 'North America', status: 'in_development', coordinates: [-96.81, 32.52] },
  { name: 'Stillwater, Oklahoma', region: 'North America', status: 'in_development', coordinates: [-97.06, 36.12] },

  // Europe — Active
  { name: 'Dublin, Ireland', region: 'Europe', status: 'active', coordinates: [-6.26, 53.35] },
  { name: 'Eemshaven, Netherlands', region: 'Europe', status: 'active', coordinates: [6.83, 53.45] },
  { name: 'Fredericia, Denmark', region: 'Europe', status: 'active', coordinates: [9.75, 55.57] },
  { name: 'Hamina, Finland', region: 'Europe', status: 'active', coordinates: [27.20, 60.57] },
  { name: 'Hanau, Germany', region: 'Europe', status: 'active', coordinates: [8.92, 50.13] },
  { name: 'Middenmeer, Netherlands', region: 'Europe', status: 'active', coordinates: [4.99, 52.81] },
  { name: 'St. Ghislain, Belgium', region: 'Europe', status: 'active', coordinates: [3.82, 50.45] },
  { name: 'Waltham Cross, United Kingdom', region: 'Europe', status: 'active', coordinates: [-0.02, 51.69] },
  { name: 'Winschoten, Netherlands', region: 'Europe', status: 'active', coordinates: [7.03, 53.14] },
  // Europe — In Development
  { name: 'Dietzenbach, Germany', region: 'Europe', status: 'in_development', coordinates: [8.78, 50.01] },
  { name: 'Farciennes, Belgium', region: 'Europe', status: 'in_development', coordinates: [4.55, 50.40] },
  { name: 'Groningen, Netherlands', region: 'Europe', status: 'in_development', coordinates: [6.57, 53.22] },
  { name: 'Skien, Norway', region: 'Europe', status: 'in_development', coordinates: [9.60, 59.21] },

  // Asia — Active
  { name: 'Changhua County, Taiwan', region: 'Asia', status: 'active', coordinates: [120.54, 24.08] },
  { name: 'Inzai, Japan', region: 'Asia', status: 'active', coordinates: [140.13, 35.83] },
  { name: 'Singapore', region: 'Asia', status: 'active', coordinates: [103.82, 1.35] },
  // Asia — In Development
  { name: 'Andhra Pradesh, India', region: 'Asia', status: 'in_development', coordinates: [79.74, 15.91] },
  { name: 'Chonburi, Thailand', region: 'Asia', status: 'in_development', coordinates: [100.98, 13.36] },
  { name: 'Selangor, Malaysia', region: 'Asia', status: 'in_development', coordinates: [101.52, 3.07] },

  // South America — Active
  { name: 'Quilicura, Chile', region: 'South America', status: 'active', coordinates: [-70.73, -33.35] },
  // South America — In Development
  { name: 'Canelones, Uruguay', region: 'South America', status: 'in_development', coordinates: [-56.28, -34.52] },
]
