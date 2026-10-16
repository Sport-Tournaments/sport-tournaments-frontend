import { proxySitemap } from '@/utils/seo';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return proxySitemap(request, 'sitemap.xml');
}
