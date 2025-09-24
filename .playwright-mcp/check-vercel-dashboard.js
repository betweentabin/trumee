const { chromium } = require('playwright');

(async () => {
  const url = 'https://trumeee.vercel.app/dashboard';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Opening:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Wait for key texts
    await page.getByText('Trumeeならそのお悩み、解決できます').first().waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByText('職務経歴書のよくある悩み').first().waitFor({ state: 'visible', timeout: 30_000 });

    // Assert CTA link is visible and href
    const cta = page.getByRole('link', { name: 'Webで簡単！添削サービスに申し込む' }).first();
    await cta.waitFor({ state: 'visible', timeout: 30_000 });
    const href = await cta.getAttribute('href');
    if (!href || !href.startsWith('/auth/register')) {
      throw new Error(`CTA href mismatch: got ${href}`);
    }

    // Click and verify navigation
    await cta.click();
    await page.waitForURL(/\/auth\/register\/?/, { timeout: 30_000 });

    // Go back and verify section
    await page.goBack();
    await page.waitForURL(/\/dashboard\/?/, { timeout: 30_000 });
    const flow = page.getByText('ご利用の流れ').first();
    await flow.scrollIntoViewIfNeeded();
    await flow.waitFor({ state: 'visible', timeout: 30_000 });

    // Full page screenshot
    await page.screenshot({ path: '.playwright-mcp/vercel-dashboard.png', fullPage: true });
    console.log('Saved .playwright-mcp/vercel-dashboard.png');

    // Additional services checks
    const services = [
      '職務職務の添削・作成支援',
      '面接対策',
      '企業と直接マッチング',
    ];
    for (const text of services) {
      const loc = page.getByText(text).first();
      await loc.scrollIntoViewIfNeeded();
      await loc.waitFor({ state: 'visible', timeout: 30_000 });
    }

    // Viewport screenshot around services section (after scrolling to last one)
    await page.screenshot({ path: '.playwright-mcp/vercel-dashboard-services.png', fullPage: false });
    console.log('Saved .playwright-mcp/vercel-dashboard-services.png');

  } finally {
    await context.close();
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
