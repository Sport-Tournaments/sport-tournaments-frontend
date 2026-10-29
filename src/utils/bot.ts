// Heuristic "is this a robot?" check, used to avoid billable Google Maps loads.
// Client-side only (needs navigator). Declared crawlers, headless browsers and
// automation frameworks are treated as bots; anything unknown is treated as human.
const BOT_UA =
  /bot|crawl|spider|slurp|scrape|fetch|archive|preview|monitor|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|facebookexternalhit|whatsapp|telegram|discord|slack|curl|wget|python|java\/|go-http|okhttp|axios|node-fetch|libwww|httpclient|phantom|puppeteer|playwright|selenium|webdriver|cypress/i;

export function isLikelyBot(nav?: Pick<Navigator, 'userAgent' | 'webdriver' | 'languages'>): boolean {
  const n = nav ?? (typeof navigator !== 'undefined' ? navigator : undefined);
  if (!n) return true; // no navigator = not a real browser
  if (BOT_UA.test(n.userAgent || '')) return true;
  if (n.webdriver) return true;
  if (!n.languages || n.languages.length === 0) return true;
  return false;
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
