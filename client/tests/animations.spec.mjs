import { test, expect } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'http://localhost:5177';

test('animations smoke: modal opens and card scales', async ({ page }) => {
  await page.goto(`${BASE}/animations-test`);

  // Wait for page content
  await page.waitForSelector('text=Animations test');

  // Click the animated Open modal button
  const openBtn = page.getByRole('button', { name: /open modal/i });
  await openBtn.click();

  // Modal should be visible and contain title
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: /animated modal/i })).toBeVisible();

  // Check card hover scale by hovering and reading transform style
  const card = page.locator('text=Card').first();
  await card.hover();
  // Allow animation frame
  await page.waitForTimeout(300);
  const transform = await card.evaluate((el) => window.getComputedStyle(el).transform || 'none');
  // transform should not be 'none' (some browsers report matrix) — assert it exists
  expect(transform).not.toBe('none');

  // Close modal
  await page.getByRole('button', { name: /close/i }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});
