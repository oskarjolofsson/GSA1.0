import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://lopp.shrewdly.se/');

  // Expect a title "to contain" a substring.
  await expect(
    page.getByRole('heading', { name: 'Tidtagning' })
  ).toBeVisible();
});

test('has a button', async ({ page }) => {
  await page.goto('https://lopp.shrewdly.se/');

  const buttons = page.getByRole('button');
  await expect(buttons).toHaveCount(1);
});
