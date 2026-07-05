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

  const startDate = new Date(entry.dateGiven);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const payments = entry.payments || [];

  // Cycle starts from the last payment date, or dateGiven if no payments
  let cycleStart;
  if (payments.length > 0) {
    const sortedPayments = [...payments].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    cycleStart = new Date(sortedPayments[0].date);
  } else {
    cycleStart = new Date(startDate);
  }
  cycleStart.setHours(0, 0, 0, 0);

  // Next due date is one period after the cycle start
  const cycleEnd = addPeriod(cycleStart, period, unit);
  const nextDueDate = cycleEnd;

  // Payments made in this cycle (strictly after the last payment that started the cycle)
  const paidThisCycle = payments
    .filter((p) => {
      const pDate = new Date(p.date);
      pDate.setHours(0, 0, 0, 0);
      return pDate > cycleStart && pDate < cycleEnd;
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
