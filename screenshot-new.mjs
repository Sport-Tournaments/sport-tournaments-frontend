import { firefox } from '@playwright/test';
import fs from 'fs';

const BASE_URL = 'http://localhost:4000';
const NOTES_DIR = '/home/gion/Distros/fedora-core/Dev/Sport-Tournaments/notes';

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shot(browser, url, outPath, viewport = { width: 1280, height: 900 }, fullPage = false) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2500);
    await page.screenshot({ path: outPath, fullPage });
    console.log('  ✓', outPath.replace(/.*notes\//, 'notes/'));
  } catch (e) {
    console.warn('  ✗', outPath.replace(/.*notes\//, 'notes/'), e.message.split('\n')[0]);
  } finally {
    await ctx.close();
  }
}

async function run() {
  const browser = await firefox.launch({ headless: true });
  const NOTES = NOTES_DIR;

  // FE-09 / FE-08
  console.log('\n[FE-09 / FE-08]');
  ensureDir(`${NOTES}/FE-09`); ensureDir(`${NOTES}/FE-08`);
  await shot(browser, `${BASE_URL}/main/tournaments/mallorca-cup`, `${NOTES}/FE-09/desktop.png`, { width: 1280, height: 900 }, true);
  await shot(browser, `${BASE_URL}/main/tournaments/mallorca-cup`, `${NOTES}/FE-08/desktop.png`, { width: 1280, height: 900 }, true);
  await shot(browser, `${BASE_URL}/main/tournaments/mallorca-cup`, `${NOTES}/FE-09/mobile.png`, { width: 390, height: 844 }, true);
  await shot(browser, `${BASE_URL}/main/tournaments/mallorca-cup`, `${NOTES}/FE-08/mobile.png`, { width: 390, height: 844 }, true);

  // FE-18
  console.log('\n[FE-18]');
  ensureDir(`${NOTES}/FE-18`);
  await shot(browser, `${BASE_URL}/main/tournaments`, `${NOTES}/FE-18/desktop-list.png`);
  await shot(browser, `${BASE_URL}/main/tournaments/mallorca-cup`, `${NOTES}/FE-18/desktop-detail.png`, { width: 1280, height: 900 }, true);
  await shot(browser, `${BASE_URL}/main/tournaments`, `${NOTES}/FE-18/mobile-list.png`, { width: 390, height: 844 });

  // BE-04 / BE-05
  console.log('\n[BE-04 / BE-05]');
  ensureDir(`${NOTES}/BE-04`); ensureDir(`${NOTES}/BE-05`);
  await shot(browser, `${BASE_URL}/main/tournaments/e632b368-c854-4241-be2b-6232f8472e19`, `${NOTES}/BE-04/desktop.png`);
  await shot(browser, `${BASE_URL}/main/tournaments/mallorca-cup`, `${NOTES}/BE-04/desktop-mallorca.png`);
  await shot(browser, `${BASE_URL}/main/tournaments/e632b368-c854-4241-be2b-6232f8472e19`, `${NOTES}/BE-04/mobile.png`, { width: 390, height: 844 });
  await shot(browser, `${BASE_URL}/main/tournaments/e632b368-c854-4241-be2b-6232f8472e19`, `${NOTES}/BE-05/desktop.png`, { width: 1280, height: 900 }, true);
  await shot(browser, `${BASE_URL}/main/tournaments/e632b368-c854-4241-be2b-6232f8472e19`, `${NOTES}/BE-05/mobile.png`, { width: 390, height: 844 }, true);

  await browser.close();
  console.log('\n✅ Done!');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
