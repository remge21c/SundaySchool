import { test, expect } from '@playwright/test';

test('홈페이지 로드 확인', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '차세대 주일학교 교적부' })).toBeVisible();
});
