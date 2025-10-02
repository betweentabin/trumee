const { chromium } = require('playwright');

const BASE = 'https://trumeee.vercel.app';
const ADMIN = { email: 'admin@truemee.jp', password: 'admin123' };
const USER = { email: 'betweentabin@gmail.jp', password: 'taiga123' };
const TARGET_USER_ID = '92a8ccf6-431c-4a55-8b5f-b2678cd55393';

async function login(page, email, password) {
  await page.goto(`${BASE}/auth/login`);
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード').fill(password);
  const form = page.locator('form');
  await Promise.all([
    page.waitForLoadState('networkidle'),
    form.getByRole('button', { name: 'ログイン' }).click(),
  ]).catch(async () => {
    // Fallback: click first submit in form
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.locator('form button[type="submit"]').first().click(),
    ]);
  });
}

async function measureMarks(page) {
  // returns { marker: number, underline: number, anchors: { marker: string[], underline: string[] } }
  return await page.evaluate(() => {
    const scope = document.querySelector('[data-annot-scope="resume-preview"]');
    const result = { marker: 0, underline: 0, anchors: { marker: [], underline: [] } };
    if (!scope) return result;
    scope.querySelectorAll('mark[data-annot-ref]').forEach((el) => {
      const bc = (el).style.backgroundColor || '';
      const bs = (el).style.boxShadow || '';
      const ref = el.getAttribute('data-annot-ref') || '';
      const anchorId = ref.replace(/^ann-/, '');
      if (bc && bc !== 'transparent') { result.marker++; result.anchors.marker.push(anchorId); }
      else if (bs && bs.includes('inset')) { result.underline++; result.anchors.underline.push(anchorId); }
    });
    return result;
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Admin view
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, ADMIN.email, ADMIN.password);
  await admin.goto(`${BASE}/admin/seekers/${TARGET_USER_ID}`);
  // wait for preview render
  await admin.waitForSelector('[data-annot-scope="resume-preview"] mark', { timeout: 15000 }).catch(() => {});
  const adminMeasures = await measureMarks(admin);
  await admin.screenshot({ path: 'admin_preview_check.png', fullPage: true });

  // User view
  const userCtx = await browser.newContext();
  const user = await userCtx.newPage();
  await login(user, USER.email, USER.password);
  // advice viewer (simple)
  await user.goto(`${BASE}/users/${TARGET_USER_ID}/advice/resume`);
  await user.waitForSelector('[data-annot-scope="resume-preview"] mark', { timeout: 15000 }).catch(() => {});
  const userMeasures = await measureMarks(user);
  await user.screenshot({ path: 'user_preview_check.png', fullPage: true });

  // Try a light edit+publish on the owner's edit screen to produce a marker
  // This may fail safely if the UI differs in production
  try {
    await user.goto(`${BASE}/resume-advice/review`);
    // switch to 編集
    const editBtn = await user.getByRole('button', { name: '編集' }).first();
    await editBtn.click({ timeout: 5000 }).catch(() => {});
    // type a tiny change into a textarea if present
    const firstTextarea = user.locator('textarea').first();
    const exists = await firstTextarea.count();
    if (exists > 0) {
      await firstTextarea.fill('（テスト編集 ' + new Date().toISOString() + '）');
      // publish
      await user.getByRole('button', { name: '公開反映（基準更新）' }).click({ timeout: 5000 }).catch(() => {});
      await user.waitForLoadState('networkidle');
    }
  } catch {}

  await browser.close();

  console.log('Admin preview:', adminMeasures);
  console.log('User preview:', userMeasures);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
