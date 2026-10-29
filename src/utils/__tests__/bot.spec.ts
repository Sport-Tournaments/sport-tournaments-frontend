import { describe, it, expect } from 'vitest';
import { isLikelyBot } from '../bot';

const human = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  webdriver: false,
  languages: ['en-US', 'en'],
};

describe('isLikelyBot', () => {
  it('treats a normal browser as human', () => {
    expect(isLikelyBot(human)).toBe(false);
  });

  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0 Safari/537.36',
    'curl/8.4.0',
    'python-requests/2.31',
    'facebookexternalhit/1.1',
    'Lighthouse',
  ])('flags %s', (ua) => {
    expect(isLikelyBot({ ...human, userAgent: ua })).toBe(true);
  });

  it('flags webdriver automation', () => {
    expect(isLikelyBot({ ...human, webdriver: true })).toBe(true);
  });

  it('flags a browser with no languages', () => {
    expect(isLikelyBot({ ...human, languages: [] })).toBe(true);
  });
});
