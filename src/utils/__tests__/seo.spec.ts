import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRobotsTxt, getSiteOrigin, getSitemapSourceOrigin } from '../seo';

describe('seo helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('derives the sitemap source from the API URL origin (sitemaps live outside /api)', () => {
    vi.stubEnv('SITEMAP_SOURCE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.tournamente.com/api');
    expect(getSitemapSourceOrigin()).toBe('https://api.tournamente.com');
  });

  it('prefers SITEMAP_SOURCE_URL', () => {
    vi.stubEnv('SITEMAP_SOURCE_URL', 'http://backend:4001/');
    expect(getSitemapSourceOrigin()).toBe('http://backend:4001');
  });

  it('builds robots.txt pointing at the public sitemap', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const origin = getSiteOrigin(
      new Request('http://internal:3000/robots.txt', {
        headers: { 'x-forwarded-host': 'tournamente.com', 'x-forwarded-proto': 'https' },
      }),
    );
    expect(origin).toBe('https://tournamente.com');
    const robots = buildRobotsTxt(origin);
    expect(robots).toContain('Sitemap: https://tournamente.com/sitemap.xml');
    expect(robots).toContain('Disallow: /dashboard');
  });
});
