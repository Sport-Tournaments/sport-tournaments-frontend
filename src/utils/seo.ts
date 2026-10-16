/**
 * Origin of the backend that generates the sitemap files. The backend serves
 * them at its host root (outside the `/api` prefix), so strip the path from
 * NEXT_PUBLIC_API_URL unless SITEMAP_SOURCE_URL is set explicitly.
 */
export function getSitemapSourceOrigin(): string {
  const explicit = process.env.SITEMAP_SOURCE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
  try {
    return new URL(apiUrl).origin;
  } catch {
    return 'http://localhost:4001';
  }
}

/** Public origin of this site, from NEXT_PUBLIC_SITE_URL or the incoming request. */
export function getSiteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  return `${proto}://${host}`;
}

/**
 * Serves a backend-generated sitemap file from the public domain, so
 * `https://<site>/sitemap.xml` works and Search Console sees the same host.
 */
export async function proxySitemap(request: Request, file: string): Promise<Response> {
  const search = new URL(request.url).search;
  try {
    const upstream = await fetch(`${getSitemapSourceOrigin()}/${file}${search}`, {
      headers: { Accept: 'application/xml' },
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!upstream.ok) {
      return new Response('Sitemap unavailable', { status: 502 });
    }
    return new Response(await upstream.text(), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Sitemap unavailable', { status: 502 });
  }
}

export function buildRobotsTxt(siteOrigin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard',
    'Disallow: /auth',
    `Sitemap: ${siteOrigin}/sitemap.xml`,
    '',
  ].join('\n');
}
