import BloodUnit from '../models/BloodUnit.js';

export async function generateUnitId(bloodGroup, component) {
  const bgMap = {
    'A+': 'A_POS', 'A-': 'A_NEG',
    'B+': 'B_POS', 'B-': 'B_NEG',
    'AB+': 'AB_POS', 'AB-': 'AB_NEG',
    'O+': 'O_POS', 'O-': 'O_NEG'
  };
  const compMap = {
    'Whole Blood': 'WB',
    'RBC': 'RBC',
    'Platelets': 'PLT',
    'Plasma': 'PLS'
  };
  const year = new Date().getFullYear();
  const bg = bgMap[bloodGroup] || 'UNK';
  const comp = compMap[component] || 'UNK';
  
  const count = await BloodUnit.countDocuments();
  const seq = String(count + 1).padStart(6, '0');
  
  return `BU-${bg}-${comp}-${year}-${seq}`;
}
