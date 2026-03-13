/**
 * Playwright Markdown Reporter
 *
 * After each test finishes, writes a `STEPS.md` file into the test's
 * output directory (alongside its screenshots and video).
 *
 * The markdown file contains:
 *   - Test metadata table (suite, status, duration, browser, etc.)
 *   - Inline screenshot per page navigation  (captured by fixtures/index.ts)
 *   - Link to the video recording (.webm)
 *   - Link to the trace archive (.zip) when available
 *   - Explicit test.step() hierarchy if the test uses them
 *   - Error details on failure
 */

import type { Reporter, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeText(s: string): string {
  return s.replace(/[`|]/g, ' ').trim();
}

function formatDuration(ms: number): string {
  if (ms < 0) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatDate(d: Date): string {
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

/** Walk up the parent chain to find the project-level suite (direct child of root). */
function getProjectName(test: TestCase): string {
  let suite: Suite | undefined = test.parent;
  // Root suite has no parent; its direct children are project suites.
  while (suite?.parent?.parent) {
    suite = suite.parent;
  }
  return suite?.title || '—';
}

/**
 * Renders explicit `test.step()` nodes (category: 'test') and their assertion
 * children (category: 'expect') recursively, skipping fixture / hook noise.
 */
function renderSteps(steps: TestStep[], depth = 0): string {
  const visible = steps.filter((s) => s.category === 'test' || s.category === 'expect');
  if (!visible.length) return '';

  return visible
    .map((s) => {
      const indent = '  '.repeat(depth);
      const icon = s.error ? '❌' : '✅';
      const dur = s.duration > 0 ? ` *(${formatDuration(s.duration)})*` : '';
      let line = `${indent}- ${icon} **${sanitizeText(s.title)}**${dur}\n`;
      if (s.steps?.length) line += renderSteps(s.steps, depth + 1);
      return line;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Reporter
// ---------------------------------------------------------------------------

class MarkdownReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    // Skip — no output directory to write into.
    if (result.status === 'skipped') return;

    // Playwright stores attachments either directly in <outputDir> (video, trace)
    // or in <outputDir>/attachments/ (files passed to testInfo.attach()).
    // Derive the root output dir from any attachment that has a path.
    const firstWithPath = result.attachments.find((a) => Boolean(a.path));
    if (!firstWithPath?.path) return;

    const rawParent = path.dirname(firstWithPath.path);
    // If the file lives in an `attachments/` subfolder, step up one level.
    const outputDir =
      path.basename(rawParent) === 'attachments' ? path.dirname(rawParent) : rawParent;

    // ---------------------------------------------------------------------------
    // Categorise attachments
    // ---------------------------------------------------------------------------
    const navigationScreenshots = result.attachments.filter(
      (a) => a.contentType === 'image/png' && a.path && /^Navigation \d+:/i.test(a.name ?? ''),
    );
    // Step screenshots attached via the `step` fixture — name: "Step N: <title>"
    const stepScreenshots = result.attachments.filter(
      (a) => a.contentType === 'image/png' && a.path && /^Step \d+:/i.test(a.name ?? ''),
    );
    // Playwright's own end-of-test screenshot (screenshot:'on') — name: "screenshot"
    const finalScreenshot = result.attachments.find(
      (a) => a.contentType === 'image/png' && a.path && a.name === 'screenshot',
    );
    const video = result.attachments.find(
      (a) => (a.contentType === 'video/webm' || a.name === 'video') && a.path,
    );
    const trace = result.attachments.find(
      (a) => (a.contentType === 'application/zip' || a.name === 'trace') && a.path,
    );

    // Helper: relative path from the STEPS.md file (in outputDir) to an attachment.
    const rel = (absPath: string) =>
      path.relative(outputDir, absPath).replace(/\\/g, '/');

    // ---------------------------------------------------------------------------
    // Build STEPS.md
    // ---------------------------------------------------------------------------
    const titlePath = test.titlePath(); // ['', file, ...suites, testTitle]
    // titlePath[0] is always empty (root); [1] is the spec file path; middle are describe blocks.
    const suites = titlePath.slice(1, -1); // include file + describe blocks
    const title = test.title;
    const projectName = getProjectName(test);

    const statusEmoji: Record<string, string> = {
      passed: '✅',
      failed: '❌',
      timedOut: '⏱️',
      interrupted: '🛑',
    };
    const emoji = statusEmoji[result.status] ?? '❓';

    let md = `# ${emoji} ${title}\n\n`;

    // Metadata table
    md += `| Property | Value |\n|---|---|\n`;
    md += `| **Suite** | ${suites.join(' › ') || '—'} |\n`;
    md += `| **Browser / Project** | ${projectName} |\n`;
    md += `| **Status** | \`${result.status}\` |\n`;
    md += `| **Duration** | ${formatDuration(result.duration)} |\n`;
    md += `| **Started** | ${formatDate(result.startTime)} |\n`;
    md += '\n';

    // Error details
    if (result.error) {
      const msg = (result.error.message ?? '').slice(0, 2000);
      md += `## ❌ Error\n\n\`\`\`\n${msg}\n\`\`\`\n\n`;
    }

    // Video
    if (video?.path) {
      const r = rel(video.path);
      md += `## 🎥 Video Recording\n\n`;
      md += `> The video captures the entire test run from start to finish.\n\n`;
      md += `[▶ Open ${path.basename(video.path)}](./${r})\n\n`;
    }

    // Trace
    if (trace?.path) {
      const r = rel(trace.path);
      md += `## 🔍 Trace Archive\n\n`;
      md += `\`\`\`sh\npnpm exec playwright show-trace ./${r}\n\`\`\`\n\n`;
    }

    // Step screenshots — per test.step() call with screenshot attached
    if (stepScreenshots.length) {
      md += `## 📸 Step Screenshots\n\n`;
      md += `Each screenshot was captured at the end of a named test step.\n\n`;
      for (const att of stepScreenshots) {
        const r = rel(att.path!);
        const label = att.name ?? path.basename(att.path!);
        md += `### ${label}\n\n`;
        md += `![${label}](./${r})\n\n`;
      }
    }

    // Navigation screenshots — captured automatically after page.goto/reload/back/forward
    if (navigationScreenshots.length) {
      md += `## 🧭 Navigation Screenshots\n\n`;
      md += `These screenshots were captured automatically after navigation completed.\n\n`;
      for (const att of navigationScreenshots) {
        const r = rel(att.path!);
        const label = att.name ?? path.basename(att.path!);
        md += `### ${label}\n\n`;
        md += `![${label}](./${r})\n\n`;
      }
    }

    // Final screenshot (added by Playwright's built-in screenshot:'on')
    if (finalScreenshot?.path) {
      const r = rel(finalScreenshot.path);
      md += `## 🏁 Final State Screenshot\n\n`;
      md += `![Final state](./${r})\n\n`;
    }

    // Explicit test.step() hierarchy
    const explicitSteps = result.steps.filter((s) => s.category === 'test');
    if (explicitSteps.length) {
      md += `## 📋 Test Steps\n\n`;
      md += renderSteps(result.steps);
      md += '\n';
    }

    // Write
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, 'STEPS.md'), md, 'utf-8');
    } catch {
      // Never crash the test run over a documentation file.
    }
  }
}

export default MarkdownReporter;
