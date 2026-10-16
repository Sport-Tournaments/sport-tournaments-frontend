import { buildRobotsTxt, getSiteOrigin } from '@/utils/seo';

export function GET(request: Request) {
  return new Response(buildRobotsTxt(getSiteOrigin(request)), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
