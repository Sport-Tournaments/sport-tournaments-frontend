import { describe, expect, it } from 'vitest';
import { internationalDigits, splitPhones, telHref, whatsappHref } from '../crmMeta';

describe('CRM phone helpers', () => {
  it('splits multi-number fields and drops junk', () => {
    expect(splitPhones('+40748938450 / +40720219159')).toEqual(['+40748938450', '+40720219159']);
    expect(splitPhones('+40741120802 / +40752318811 / +40239615008')).toHaveLength(3);
    expect(splitPhones('n/a')).toEqual([]);
    expect(splitPhones(null)).toEqual([]);
  });

  it('normalises to international digits', () => {
    expect(internationalDigits('+40 722 427 901')).toBe('40722427901');
    expect(internationalDigits('0040722427901')).toBe('40722427901');
    expect(internationalDigits('0722 427 901')).toBe('40722427901');
  });

  it('builds call and WhatsApp links', () => {
    expect(telHref('0722 427 901')).toBe('tel:+40722427901');
    expect(whatsappHref('+34 600 000 000')).toBe('https://wa.me/34600000000');
  });
});
