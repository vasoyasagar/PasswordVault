/**
 * Calculate interest cycle info for a money entry.
 * Returns: { expectedAmount, nextDueDate, status, daysUntilDue, paidThisCycle, remaining, currentCycleStart, currentCycleEnd }
 */
export function getInterestCycleInfo(entry) {
  if (!entry.dateGiven || !entry.interestPeriod || !entry.amount || !entry.interestRate) {
    return null;
  }

  const principal = parseFloat(entry.amount) || 0;
  const ratePercent = parseFloat(entry.interestRate) || 0;
  const period = parseInt(entry.interestPeriod) || 0;
  const unit = entry.interestPeriodUnit || 'month';

  if (!principal || !ratePercent || !period) return null;

  // Calculate expected amount per cycle (rate is per month)
  const periodInMonths = unit === 'year' ? period * 12 : period;
  const expectedAmount = Math.round(principal * (ratePercent / 100) * periodInMonths);

  // Calculate all cycle boundaries from dateGiven
  const startDate = new Date(entry.dateGiven);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the current cycle
  let cycleStart = new Date(startDate);
  let cycleEnd = addPeriod(cycleStart, period, unit);

  while (cycleEnd <= today) {
    cycleStart = new Date(cycleEnd);
    cycleEnd = addPeriod(cycleStart, period, unit);
  }

  // cycleStart -> cycleEnd is the current cycle
  // The due date is cycleEnd (when payment should come)
  const nextDueDate = cycleEnd;

  // Calculate payments made in this cycle window
  const payments = entry.payments || [];
  const paidThisCycle = payments
    .filter((p) => {
      const pDate = new Date(p.date);
      return pDate >= cycleStart && pDate < cycleEnd;
    })
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const remaining = Math.max(0, expectedAmount - paidThisCycle);

  // Days until due
  const diffMs = nextDueDate.getTime() - today.getTime();
  const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Status
  let status = 'upcoming'; // normal
  if (remaining === 0) {
    status = 'paid';
  } else if (daysUntilDue < 0) {
    status = 'overdue';
  } else if (daysUntilDue <= 7) {
    status = 'due-soon';
  }

  return {
    expectedAmount,
    nextDueDate: formatDate(nextDueDate),
    nextDueDateRaw: nextDueDate,
    status,
    daysUntilDue,
    paidThisCycle,
    remaining,
    currentCycleStart: formatDate(cycleStart),
    currentCycleEnd: formatDate(cycleEnd),
    periodLabel: `${period} ${unit}${period > 1 ? 's' : ''}`,
  };
}

function addPeriod(date, period, unit) {
  const d = new Date(date);
  if (unit === 'year') {
    d.setFullYear(d.getFullYear() + period);
  } else {
    d.setMonth(d.getMonth() + period);
  }
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get all upcoming dues sorted by urgency (overdue first, then soonest)
 */
export function getUpcomingDues(entries) {
  const moneyEntries = entries.filter((e) => e.category === 'money');
  const dues = [];

  for (const entry of moneyEntries) {
    const info = getInterestCycleInfo(entry);
    if (!info || info.status === 'paid') continue;
    dues.push({ entry, ...info });
  }

  // Sort: overdue first (most negative days), then by days ascending
  dues.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  return dues;
}
