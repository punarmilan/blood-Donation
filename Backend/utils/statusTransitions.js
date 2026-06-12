export const validTransitions = {
  'Collected': ['Testing Pending', 'Discarded'],
  'Testing Pending': ['Available', 'Discarded'],
  'Available': ['Reserved', 'Expired', 'Discarded'],
  'Reserved': ['Issued', 'Available', 'Discarded'], // unreserve allowed
  'Issued': ['Used', 'Transfused', 'Discarded'],
  'Used': [],       // terminal
  'Transfused': [], // terminal
  'Expired': ['Discarded'],
  'Discarded': []   // terminal
};

export function isValidTransition(from, to) {
  return validTransitions[from]?.includes(to) || false;
}
