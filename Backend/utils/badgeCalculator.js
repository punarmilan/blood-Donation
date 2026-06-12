export function calculateBadge(totalDonations) {
  if (totalDonations >= 50) return 'Hero';
  if (totalDonations >= 20) return 'Platinum';
  if (totalDonations >= 10) return 'Gold';
  if (totalDonations >= 3)  return 'Silver';
  if (totalDonations === 2) return 'Regular Donor';
  if (totalDonations === 1) return 'Donor';
  return 'New Donor';
}

export function getNextEligibleDate(lastDonationDate, gender = 'Male') {
  const gapDays = gender === 'Female' ? 120 : 90;
  const next = new Date(lastDonationDate);
  next.setDate(next.getDate() + gapDays);
  return next;
}

export function calculateDonationEligibility(gender, lastDonationDate) {
  const gapDays = gender === "Female" ? 120 : 90;
  
  if (!lastDonationDate) {
    return {
      status: "Eligible to Donate",
      lastDonationDate: null,
      nextEligibleDate: null,
      daysRemaining: 0,
      gapDays,
      progressPercentage: 100,
      message: "You can donate blood now and help save lives."
    };
  }

  const lastDate = new Date(lastDonationDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + gapDays);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const nextDateClear = new Date(nextDate);
  nextDateClear.setHours(0, 0, 0, 0);

  const diffTime = nextDateClear.getTime() - todayDate.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return {
      status: "Eligible to Donate",
      lastDonationDate: lastDate.toISOString().split('T')[0],
      nextEligibleDate: nextDate.toISOString().split('T')[0],
      daysRemaining: 0,
      gapDays,
      progressPercentage: 100,
      message: "You can donate blood now and help save lives."
    };
  } else {
    const lastDateClear = new Date(lastDate);
    lastDateClear.setHours(0, 0, 0, 0);
    const diffPassed = todayDate.getTime() - lastDateClear.getTime();
    const daysPassed = Math.floor(diffPassed / (1000 * 60 * 60 * 24));
    let progressPercentage = Math.round((daysPassed / gapDays) * 100);
    if (progressPercentage > 100) progressPercentage = 100;
    if (progressPercentage < 0) progressPercentage = 0;

    return {
      status: "Temporary Hold",
      lastDonationDate: lastDate.toISOString().split('T')[0],
      nextEligibleDate: nextDate.toISOString().split('T')[0],
      daysRemaining,
      gapDays,
      progressPercentage,
      message: `You recently donated blood. You can donate again after ${daysRemaining} days.`
    };
  }
}

