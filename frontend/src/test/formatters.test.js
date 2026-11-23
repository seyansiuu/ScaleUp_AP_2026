import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatCompactMoney,
  formatPercent,
  formatNumber,
  ROLE_CONFIG,
} from '../utils/formatters';

describe('formatters utility', () => {
  it('correctly formats integer cents to dollar string', () => {
    expect(formatMoney(50000000)).toBe('$500,000.00');
    expect(formatMoney(4900)).toBe('$49.00');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(-150000)).toBe('-$1,500.00');
    expect(formatMoney(null)).toBe('$0.00');
  });

  it('correctly formats compact dollar string for millions and thousands', () => {
    expect(formatCompactMoney(200000000)).toBe('$2.00M');
    expect(formatCompactMoney(50000000)).toBe('$500.0k');
    expect(formatCompactMoney(4900)).toBe('$49.00');
    expect(formatCompactMoney(-2500000)).toBe('-$25.0k');
  });

  it('correctly formats basis points to percentage string', () => {
    expect(formatPercent(10000)).toBe('100.00%');
    expect(formatPercent(2000)).toBe('20.00%');
    expect(formatPercent(2500)).toBe('25.00%');
    expect(formatPercent(500)).toBe('5.00%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('verifies standard role configuration salaries matching turnEngine', () => {
    expect(ROLE_CONFIG.ENGINEERING.salaryCents).toBe(1200000); // $12,000
    expect(ROLE_CONFIG.SALES.salaryCents).toBe(900000);       // $9,000
    expect(ROLE_CONFIG.MARKETING.salaryCents).toBe(800000);   // $8,000
    expect(ROLE_CONFIG.SUPPORT.salaryCents).toBe(600000);     // $6,000
  });
});
