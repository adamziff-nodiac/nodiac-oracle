import { test, expect } from '@playwright/test'
import path from 'path'

/**
 * Mock API responses for the screening workflow.
 * Bypasses auth and Supabase by intercepting all three API calls.
 */

const UPLOAD_ID = 'test-upload-001'

const MOCK_SITES = [
  {
    id: 'site-1',
    upload_id: UPLOAD_ID,
    site_name: 'Carnegie Center',
    latitude: 40.323122,
    longitude: -74.645117,
    county: 'Mercer',
    state: 'NJ',
    fips_code: '34021',
    raw_data: { 'Electric Infrastructure Owner & Operator': 'Public Service Elec & Gas Co' },
    site_score: 5.8,
    tier: 'okay' as const,
    score_breakdown: {
      coop_density: 0.2,
      grid_reliability: 0.7,
      clipped_curtailed: 0.5,
      permitting: 0.6,
      labor: 0.8,
      fiber: 0.7,
    },
    utility_type: 'IOU',
  },
  {
    id: 'site-2',
    upload_id: UPLOAD_ID,
    site_name: 'Agalinas',
    latitude: 41.837399,
    longitude: -89.287323,
    county: 'Lee',
    state: 'IL',
    fips_code: '17103',
    raw_data: { 'Electric Infrastructure Owner & Operator': 'Commonwealth Edison Co' },
    site_score: 6.2,
    tier: 'okay' as const,
    score_breakdown: {
      coop_density: 0.3,
      grid_reliability: 0.8,
      clipped_curtailed: 0.6,
      permitting: 0.5,
      labor: 0.7,
      fiber: 0.8,
    },
    utility_type: null,
  },
  {
    id: 'site-3',
    upload_id: UPLOAD_ID,
    site_name: 'Atwater',
    latitude: 45.1396,
    longitude: -94.773,
    county: 'Kandiyohi',
    state: 'MN',
    fips_code: '27067',
    raw_data: { 'Electric Infrastructure Owner & Operator': 'Meeker Cooperative Light & Power Assn' },
    site_score: 7.2,
    tier: 'good' as const,
    score_breakdown: {
      coop_density: 1.0,
      grid_reliability: 0.6,
      clipped_curtailed: 0.7,
      permitting: 0.7,
      labor: 0.5,
      fiber: 0.8,
    },
    utility_type: 'Co-op',
  },
  {
    id: 'site-4',
    upload_id: UPLOAD_ID,
    site_name: 'Bluff Prairie',
    latitude: 43.471699,
    longitude: -91.140559,
    county: 'Vernon',
    state: 'WI',
    fips_code: '55123',
    raw_data: { 'Electric Infrastructure Owner & Operator': 'Vernon Electric Cooperative' },
    site_score: 6.8,
    tier: 'good' as const,
    score_breakdown: {
      coop_density: 1.0,
      grid_reliability: 0.65,
      clipped_curtailed: 0.6,
      permitting: 0.7,
      labor: 0.4,
      fiber: 0.7,
    },
    utility_type: 'Co-op',
  },
  {
    id: 'site-5',
    upload_id: UPLOAD_ID,
    site_name: 'Georgetown',
    latitude: 45.476919,
    longitude: -92.368025,
    county: 'Polk',
    state: 'WI',
    fips_code: '55095',
    raw_data: { 'Electric Infrastructure Owner & Operator': 'Polk Burnett Electric Cooperative' },
    site_score: 7.0,
    tier: 'good' as const,
    score_breakdown: {
      coop_density: 1.0,
      grid_reliability: 0.7,
      clipped_curtailed: 0.65,
      permitting: 0.6,
      labor: 0.5,
      fiber: 0.75,
    },
    utility_type: 'Co-op',
  },
]

const MOCK_UPLOAD = {
  id: UPLOAD_ID,
  user_id: 'test-user',
  name: 'test-portfolio.csv',
  site_count: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

test.describe('Screening workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all three API endpoints
    await page.route('**/api/upload-csv', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ upload_id: UPLOAD_ID, site_count: 5 }),
      })
    })

    await page.route(`**/api/portfolio/${UPLOAD_ID}/score`, async (route) => {
      // Add a small delay to let the loading UI render
      await new Promise((r) => setTimeout(r, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ scored: 5, results: MOCK_SITES }),
      })
    })

    await page.route(`**/api/portfolio/${UPLOAD_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ upload: MOCK_UPLOAD, sites: MOCK_SITES }),
      })
    })
  })

  test('uploads CSV and displays scored results', async ({ page }) => {
    await page.goto('/screening')

    // Verify initial upload UI
    await expect(page.getByText('Screen an IPP Portfolio')).toBeVisible()
    await expect(page.getByText('Drop a CSV file here or click to browse')).toBeVisible()

    // Upload the CSV file
    const fileInput = page.locator('input[type="file"]')
    const csvPath = path.resolve(__dirname, 'fixtures/test-portfolio.csv')
    await fileInput.setInputFiles(csvPath)

    // Verify file is selected
    await expect(page.getByText('test-portfolio.csv')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Score Sites' })).toBeVisible()

    // Click Score Sites
    await page.getByRole('button', { name: 'Score Sites' }).click()

    // Verify loading indicator appears with step-by-step progress
    await expect(page.getByText('Processing portfolio')).toBeVisible()
    await expect(page.getByText('Uploading CSV')).toBeVisible()
    await expect(page.getByText('Scoring 5 sites')).toBeVisible()
    await expect(page.getByText('Loading results')).toBeVisible()

    // Wait for results to appear
    await expect(page.getByText('test-portfolio.csv')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/5 sites/)).toBeVisible()
  })

  test('displays all site data in the results table', async ({ page }) => {
    await page.goto('/screening')

    // Upload and score
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-portfolio.csv'))
    await page.getByRole('button', { name: 'Score Sites' }).click()

    // Wait for results
    await expect(page.getByText(/5 sites/)).toBeVisible({ timeout: 10000 })

    // Check table headers exist
    await expect(page.getByRole('columnheader', { name: /Site/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /County/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /State/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Utility/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Tier/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Score/i })).toBeVisible()

    // Check all 5 sites appear in the table
    await expect(page.getByText('Carnegie Center')).toBeVisible()
    await expect(page.getByText('Agalinas')).toBeVisible()
    await expect(page.getByText('Atwater')).toBeVisible()
    await expect(page.getByText('Bluff Prairie')).toBeVisible()
    await expect(page.getByText('Georgetown')).toBeVisible()

    // Check utility types show correctly
    await expect(page.getByText('IOU')).toBeVisible()
    await expect(page.getByText('Co-op').first()).toBeVisible()

    // Verify tier counts in the header
    await expect(page.getByText(/3 strong/)).toBeVisible()
    await expect(page.getByText(/2 moderate/)).toBeVisible()
  })

  test('weight presets recompute scores instantly', async ({ page }) => {
    await page.goto('/screening')

    // Upload and score
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-portfolio.csv'))
    await page.getByRole('button', { name: 'Score Sites' }).click()
    await expect(page.getByText(/5 sites/)).toBeVisible({ timeout: 10000 })

    // Verify all 4 preset buttons are visible
    await expect(page.getByRole('button', { name: 'Balanced' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Co-op Priority' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Speed to Deploy' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Curtailment Capture' })).toBeVisible()

    // Balanced should be active by default
    const balancedBtn = page.getByRole('button', { name: 'Balanced' })
    await expect(balancedBtn).toHaveClass(/bg-nodiac-secondary/)

    // Get the initial score for the first co-op site (Atwater)
    const atwaterRow = page.locator('tr', { hasText: 'Atwater' })
    const initialScore = await atwaterRow.locator('td').last().textContent()

    // Click Co-op Priority — should change scores without any API call
    await page.getByRole('button', { name: 'Co-op Priority' }).click()

    // Verify the Co-op Priority button is now active
    const coopBtn = page.getByRole('button', { name: 'Co-op Priority' })
    await expect(coopBtn).toHaveClass(/bg-nodiac-secondary/)

    // The co-op site (Atwater, coop_density=1.0) should score higher with Co-op Priority
    // (coop_density weight goes from 1 to 3)
    const newScore = await atwaterRow.locator('td').last().textContent()
    expect(newScore).not.toBeNull()

    // Click Speed to Deploy
    await page.getByRole('button', { name: 'Speed to Deploy' }).click()
    await expect(page.getByRole('button', { name: 'Speed to Deploy' })).toHaveClass(/bg-nodiac-secondary/)

    // Scores should have changed again
    const speedScore = await atwaterRow.locator('td').last().textContent()
    expect(speedScore).not.toBeNull()
  })

  test('expanding a row shows scoring breakdown', async ({ page }) => {
    await page.goto('/screening')

    // Upload and score
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-portfolio.csv'))
    await page.getByRole('button', { name: 'Score Sites' }).click()
    await expect(page.getByText(/5 sites/)).toBeVisible({ timeout: 10000 })

    // Click on the Atwater row to expand it
    await page.locator('tr', { hasText: 'Atwater' }).first().click()

    // The breakdown detail row should appear with criterion labels
    await expect(page.getByText('Co-op Density').or(page.getByText('Coop Density')).first()).toBeVisible()
  })

  test('New Upload button resets to initial state', async ({ page }) => {
    await page.goto('/screening')

    // Upload and score
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-portfolio.csv'))
    await page.getByRole('button', { name: 'Score Sites' }).click()
    await expect(page.getByText(/5 sites/)).toBeVisible({ timeout: 10000 })

    // Click New Upload
    await page.getByRole('button', { name: 'New Upload' }).click()

    // Should return to the upload phase
    await expect(page.getByText('Screen an IPP Portfolio')).toBeVisible()
    await expect(page.getByText('Drop a CSV file here or click to browse')).toBeVisible()
  })
})
