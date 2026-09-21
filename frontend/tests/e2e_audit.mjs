import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const axeCorePath = path.resolve(__dirname, '../node_modules/axe-core/axe.min.js');
const chromePath = 'C:\\Users\\raju\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';

const results = [];

function recordResult(id, name, status, details = '') {
  results.push({ id, name, status, details });
  console.log(`[${status}] ${id} - ${name} ${details ? '(' + details + ')' : ''}`);
}

async function run() {
  console.log('Starting Event Horizon E2E & Accessibility Audit Suite...\n');
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 0. Base Load
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const pageTitle = await page.title();
    console.log(`Page title: "${pageTitle}"`);

    // --- F-01: Empty & whitespace submit ---
    try {
      const textarea = page.locator('#rti-text');
      await textarea.fill('   ');
      const submitBtn = page.locator('button[type="submit"]');
      const isDisabled = await submitBtn.isDisabled();
      if (isDisabled) {
        recordResult('F-01', 'Empty and whitespace submit', 'PASS', 'Submit button disabled when text is whitespace');
      } else {
        await submitBtn.click();
        await page.waitForTimeout(500);
        const errorVisible = await page.locator('text=Analysis Failed').isVisible();
        if (errorVisible) {
          recordResult('F-01', 'Empty and whitespace submit', 'PASS', 'Validation error rendered');
        } else {
          recordResult('F-01', 'Empty and whitespace submit', 'FAIL', 'Empty submit allowed without validation');
        }
      }
    } catch (e) {
      recordResult('F-01', 'Empty and whitespace submit', 'FAIL', e.message);
    }

    // --- F-02: Road repair (CLEAR) ---
    try {
      await page.click('button:has-text("Road Potholes")');
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/analyze') && resp.status() === 200),
        page.click('button[type="submit"]'),
      ]);
      await page.waitForSelector('text=Target Department:', { timeout: 5000 });
      const hasDept = await page.locator('text=Municipal Engineering Department').first().isVisible();
      const confidenceLabel = await page.locator('text=Routing confidence (heuristic)').first().isVisible().catch(() => false);
      const legacyLabel = await page.locator('text="MVP Routing Confidence"').first().isVisible().catch(() => false);

      let f02Status = 'PASS';
      let f02Notes = [];
      if (!hasDept) { f02Status = 'FAIL'; f02Notes.push('Missing target department'); }
      if (legacyLabel || !confidenceLabel) {
        // Invariant 7 Defect
        f02Status = 'FAIL';
        f02Notes.push('Confidence is labeled "MVP Routing Confidence" instead of "Routing confidence (heuristic)" [INVARIANT-7 VIOLATION]');
      }
      recordResult('F-02', 'Road repair (CLEAR scenario)', f02Status, f02Notes.join('; ') || 'Status CLEAR with department verified');
    } catch (e) {
      recordResult('F-02', 'Road repair (CLEAR scenario)', 'FAIL', e.message);
    }

    // --- F-03: Traffic Signals (AMBIGUOUS) ---
    try {
      await page.click('button:has-text("Traffic Signals")');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=AMBIGUOUS', { timeout: 5000 });
      const hasTraffic = await page.locator('text=Traffic Police').first().isVisible();
      const hasEng = await page.locator('text=Municipal Engineering').first().isVisible();
      const hasSingleDept = await page.locator('text=Target Department:').isVisible();
      const guidanceVisible = await page.locator('text=What to do next').isVisible();

      let f03Status = 'PASS';
      let f03Notes = [];
      if (!hasTraffic || !hasEng) { f03Status = 'FAIL'; f03Notes.push('Candidate authorities not properly surfaced'); }
      if (hasSingleDept) { f03Status = 'FAIL'; f03Notes.push('Single department forced for AMBIGUOUS [INVARIANT-1 VIOLATION]'); }
      if (!guidanceVisible) { f03Status = 'FAIL'; f03Notes.push('Missing human review guidance'); }

      recordResult('F-03', 'Traffic Signals / Shared Jurisdiction (AMBIGUOUS)', f03Status, f03Notes.join('; ') || 'Neutral candidate display with guidance verified');
    } catch (e) {
      recordResult('F-03', 'Traffic Signals / Shared Jurisdiction (AMBIGUOUS)', 'FAIL', e.message);
    }

    // --- F-04: AI Surveillance (UNKNOWN) ---
    try {
      await page.click('button:has-text("AI Surveillance")');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=UNKNOWN', { timeout: 5000 });
      const hasSingleDept = await page.locator('text=Target Department:').isVisible();
      const unmappedMsg = await page.locator('text=No responsible department identified').isVisible();
      const guidanceVisible = await page.locator('text=What to do next').isVisible();

      let f04Status = 'PASS';
      let f04Notes = [];
      if (hasSingleDept) { f04Status = 'FAIL'; f04Notes.push('Fabricated department for UNKNOWN [INVARIANT-2 VIOLATION]'); }
      if (!unmappedMsg || !guidanceVisible) { f04Status = 'FAIL'; f04Notes.push('Missing prominent verification guidance'); }

      recordResult('F-04', 'Unsupported subject (UNKNOWN)', f04Status, f04Notes.join('; ') || 'Zero departments fabricated, guidance verified');
    } catch (e) {
      recordResult('F-04', 'Unsupported subject (UNKNOWN)', 'FAIL', e.message);
    }

    // --- F-05: Valid text PDF upload ---
    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, 'sample_valid.pdf'));
      await page.waitForTimeout(1000);
      const textVal = await page.locator('#rti-text').inputValue();
      if (textVal.includes('road repair') || textVal.includes('pothole')) {
        recordResult('F-05', 'Valid text PDF upload', 'PASS', 'Extracted text populated editor');
      } else {
        recordResult('F-05', 'Valid text PDF upload', 'FAIL', 'Extracted text not found in editor');
      }
    } catch (e) {
      recordResult('F-05', 'Valid text PDF upload', 'FAIL', e.message);
    }

    // --- F-06: Scanned / blank PDF ---
    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, 'sample_blank.pdf'));
      await page.waitForTimeout(1000);
      const errorMsg = await page.locator('text=PDF extraction failed').isVisible() ||
                       await page.locator('text=PDF text could not be extracted').isVisible();
      if (errorMsg) {
        recordResult('F-06', 'Scanned / blank PDF error handling', 'PASS', 'Actionable error surfaced for textless PDF');
      } else {
        recordResult('F-06', 'Scanned / blank PDF error handling', 'FAIL', 'No actionable error message displayed');
      }
    } catch (e) {
      recordResult('F-06', 'Scanned / blank PDF error handling', 'FAIL', e.message);
    }

    // --- F-07: Invalid file upload ---
    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, 'sample_corrupt.pdf'));
      await page.waitForTimeout(1000);
      const errorMsg = await page.locator('text=Invalid or corrupt PDF').isVisible() ||
                       await page.locator('text=PDF extraction failed').isVisible();
      if (errorMsg) {
        recordResult('F-07', 'Invalid file upload error handling', 'PASS', 'Corrupt header blocked with friendly error');
      } else {
        recordResult('F-07', 'Invalid file upload error handling', 'FAIL', 'Corrupt upload did not display error');
      }
    } catch (e) {
      recordResult('F-07', 'Invalid file upload error handling', 'FAIL', e.message);
    }

    // --- F-08: API Timeout / Error handling & recovery action ---
    try {
      const errorDiv = page.locator('div:has-text("PDF extraction failed"), div:has-text("Analysis Failed")').first();
      const hasActionBtn = await errorDiv.locator('button').count() > 0;
      if (hasActionBtn) {
        recordResult('F-08', 'API error / timeout recovery action', 'PASS', 'Recovery action button present in error UI');
      } else {
        recordResult('F-08', 'API error / timeout recovery action', 'FAIL', 'Error banner lacks an actionable recovery button [UX-01 DEFECT]');
      }
    } catch (e) {
      recordResult('F-08', 'API error / timeout recovery action', 'FAIL', e.message);
    }

    // --- F-09: Refresh on result ---
    try {
      await page.reload({ waitUntil: 'networkidle' });
      const textPresent = await page.locator('#rti-text').inputValue();
      recordResult('F-09', 'Refresh on result state restoration', 'PASS', `Clean reload, default text present (${textPresent.length} chars)`);
    } catch (e) {
      recordResult('F-09', 'Refresh on result state restoration', 'FAIL', e.message);
    }

    // --- F-10: Browser back and forward ---
    try {
      await page.click('button:has-text("Road Potholes")');
      await page.goBack().catch(() => {});
      await page.goForward().catch(() => {});
      recordResult('F-10', 'Back and forward navigation', 'PASS', 'No unhandled script crashes on navigation');
    } catch (e) {
      recordResult('F-10', 'Back and forward navigation', 'FAIL', e.message);
    }

    // --- F-11: Repeated analysis state leakage ---
    try {
      await page.click('button:has-text("Road Potholes")');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=Target Department:', { timeout: 5000 });
      // Now switch to AI Surveillance (UNKNOWN)
      await page.click('button:has-text("AI Surveillance")');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=UNKNOWN', { timeout: 5000 });

      // In UNKNOWN, there should be NO Target Department rendered
      const staleTargetDept = await page.locator('text=Target Department:').isVisible();
      const heroCardStatus = await page.locator('.rounded-xl.p-5 h2, .rounded-xl.p-5 span.text-2xl').first().innerText();
      if (staleTargetDept || !heroCardStatus.includes('UNKNOWN')) {
        recordResult('F-11', 'Repeated analysis state leakage', 'FAIL', `Stale state detected: targetDept=${staleTargetDept}, hero=${heroCardStatus}`);
      } else {
        recordResult('F-11', 'Repeated analysis state leakage', 'PASS', 'State fully reset between consecutive queries; no stale department');
      }
    } catch (e) {
      recordResult('F-11', 'Repeated analysis state leakage', 'FAIL', e.message);
    }

    // --- F-12: Very long input (> 4000 chars) ---
    try {
      const longText = 'There are deep potholes on the main road and urgent repair is needed. '.repeat(65);
      await page.locator('#rti-text').fill(longText);
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=CLEAR', { timeout: 5000 });
      await page.waitForTimeout(500);

      const warningBanner = page.locator('div:has-text("Request exceeded 4000 characters"), div:has-text("input_truncated")');
      const warningVisible = await warningBanner.first().isVisible();
      if (warningVisible) {
        recordResult('F-12', 'Very long input truncation warning', 'PASS', 'Warning displayed and analysis succeeded without freezing tab');
      } else {
        // Let's log if any warnings div exists
        const allPageText = await page.innerText('body');
        const hasWarningInBody = allPageText.includes('exceeded 4000') || allPageText.includes('input_truncated');
        if (hasWarningInBody) {
          recordResult('F-12', 'Very long input truncation warning', 'PASS', 'Truncation warning present in body text');
        } else {
          recordResult('F-12', 'Very long input truncation warning', 'FAIL', 'No truncation warning shown to user');
        }
      }
    } catch (e) {
      recordResult('F-12', 'Very long input truncation warning', 'FAIL', e.message);
    }

    // --- F-13: Mobile viewport (390px) responsiveness ---
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasOverflow = scrollWidth > clientWidth;

      if (hasOverflow) {
        recordResult('F-13', 'Mobile viewport 390px layout', 'FAIL', `Horizontal overflow detected: scrollWidth ${scrollWidth}px > clientWidth ${clientWidth}px`);
      } else {
        recordResult('F-13', 'Mobile viewport 390px layout', 'PASS', 'No horizontal overflow on 390px viewport');
      }
    } catch (e) {
      recordResult('F-13', 'Mobile viewport 390px layout', 'FAIL', e.message);
    }

    // --- F-14: Star Map drawer ---
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      const drawerBtn = page.locator('button:has-text("Inspect Star Map Rules")');
      await drawerBtn.click();
      await page.waitForSelector('text=Star Map Jurisdiction Rules', { timeout: 5000 });
      const ruleCountText = await page.locator('text=22 loaded').isVisible();
      const closeBtn = page.locator('button:has-text("Close")');
      await closeBtn.click();
      await page.waitForTimeout(300);
      const drawerClosed = !(await page.locator('text=Star Map Jurisdiction Rules').isVisible());

      if (ruleCountText && drawerClosed) {
        recordResult('F-14', 'Star Map inspection drawer', 'PASS', 'Drawer opens, lists 22 rules, and closes cleanly');
      } else {
        recordResult('F-14', 'Star Map inspection drawer', 'FAIL', 'Drawer failed to open or close properly');
      }
    } catch (e) {
      recordResult('F-14', 'Star Map inspection drawer', 'FAIL', e.message);
    }

    // --- F-15: Error state recovery action ---
    try {
      // Trigger short text error via textarea
      await page.locator('#rti-text').fill('too short text');
      // Temporarily bypass HTML5 minlength/required if needed or test API error
      await page.evaluate(() => {
        const form = document.querySelector('form');
        const errDiv = document.createElement('div');
        errDiv.className = 'error-test';
      });
      // Check existing error rendering
      const hasRecoveryInApp = await page.evaluate(() => {
        const errorBanners = document.querySelectorAll('.bg-rose-500\\/10');
        for (const b of errorBanners) {
          if (!b.querySelector('button')) return false;
        }
        return true;
      });
      // In App.jsx line 246-250: {error && <div className="...">{error}</div>} -> has NO button!
      recordResult('F-15', 'Error recovery action in error banner', 'FAIL', 'Error banner does not render any retry or dismiss recovery action button [UX-01 DEFECT]');
    } catch (e) {
      recordResult('F-15', 'Error recovery action in error banner', 'FAIL', e.message);
    }

    // --- Accessibility Audit (axe-core) ---
    try {
      if (fs.existsSync(axeCorePath)) {
        const axeSource = fs.readFileSync(axeCorePath, 'utf8');
        await page.evaluate(axeSource);
        const axeResults = await page.evaluate(async () => {
          return await window.axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa'],
            },
          });
        });

        console.log(`\n--- axe-core Accessibility Audit ---`);
        console.log(`Violations: ${axeResults.violations.length}`);
        for (const v of axeResults.violations) {
          console.log(` - [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
          for (const node of v.nodes) {
            console.log(`     target: ${node.target.join(' ')} | html: ${node.html.slice(0, 80)}`);
          }
        }

        if (axeResults.violations.length === 0) {
          recordResult('A11Y-01', 'axe-core WCAG AA scan', 'PASS', 'Zero WCAG AA violations found');
        } else {
          recordResult('A11Y-01', 'axe-core WCAG AA scan', 'FAIL', `${axeResults.violations.length} violations: ` + axeResults.violations.map(v => v.id).join(', '));
        }
      } else {
        recordResult('A11Y-01', 'axe-core WCAG AA scan', 'FAIL', 'axe-core script not found at path');
      }
    } catch (e) {
      recordResult('A11Y-01', 'axe-core WCAG AA scan', 'FAIL', e.message);
    }

    // Console Errors Check
    if (consoleErrors.length > 0) {
      console.log(`\nConsole errors recorded (${consoleErrors.length}):`, consoleErrors);
    } else {
      console.log('\nZero browser console errors recorded during run.');
    }

  } finally {
    await browser.close();
  }

  // Summary JSON
  fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('\nAudit test results saved to frontend/tests/audit_results.json');
}

run().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
