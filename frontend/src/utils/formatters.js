/**
 * Monetary & percentage formatting utilities.
 * All monetary amounts are integers in cents.
 * All equity / percentages are integers in basis points (10000 bps = 100.00%).
 */

export function formatMoney(cents) {
  if (cents === null || cents === undefined || isNaN(cents)) return '$0.00';
  const num = typeof cents === 'bigint' ? Number(cents) : Number(cents);
  const dollars = num / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function formatCompactMoney(cents) {
  if (cents === null || cents === undefined || isNaN(cents)) return '$0';
  const num = typeof cents === 'bigint' ? Number(cents) : Number(cents);
  const dollars = num / 100;
  const absDollars = Math.abs(dollars);

  const sign = dollars < 0 ? '-' : '';
  if (absDollars >= 1_000_000) {
    return `${sign}$${(absDollars / 1_000_000).toFixed(2)}M`;
  }
  if (absDollars >= 1_000) {
    return `${sign}$${(absDollars / 1_000).toFixed(1)}k`;
  }
  return `${sign}$${absDollars.toFixed(2)}`;
}

export function formatPercent(bps) {
  if (bps === null || bps === undefined || isNaN(bps)) return '0.00%';
  const num = Number(bps);
  return `${(num / 100).toFixed(2)}%`;
}

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(Number(value));
}

export const ROLE_CONFIG = {
  ENGINEERING: {
    label: 'Engineering',
    salaryCents: 1200000,
    salaryLabel: '$12,000 / mo',
    color: 'indigo',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    description: 'Increases Product Quality Score by √(engineers) * 3 each month.',
  },
  SALES: {
    label: 'Sales',
    salaryCents: 900000,
    salaryLabel: '$9,000 / mo',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Boosts marketing lead-to-customer conversion by √(sales) * 3%.',
  },
  MARKETING: {
    label: 'Marketing',
    salaryCents: 800000,
    salaryLabel: '$8,000 / mo',
    color: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Manages channels & drives campaign effectiveness.',
  },
  SUPPORT: {
    label: 'Support',
    salaryCents: 600000,
    salaryLabel: '$6,000 / mo',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Reduces monthly customer churn by √(support) * 0.5%.',
  },
};
