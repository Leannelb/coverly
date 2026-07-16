// Simulates the Document AI pipeline (OCR + LLM extraction, §4). Real extraction is out
// of scope for a frontend-only prototype, but the product requirement it stands in for is
// real: every extraction is an editable draft the patient must confirm, never silent fact.

import { COVERAGE_RULES } from './coverageRules';
import { SPECIALTIES } from './specialists';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickByFilename(name, map, fallback) {
  const lower = (name ?? '').toLowerCase();
  const hit = Object.keys(map).find((key) => lower.includes(key));
  return hit ? map[hit] : fallback;
}

export async function extractPolicyDocument(file) {
  await delay(1100);

  const planByHint = pickByFilename(
    file?.name,
    {
      laya: 'Laya Company Plan Plus Level 1.3',
      vhi: 'Vhi Company Plan Level 1',
      'irish life': 'Irish Life Health Signature Level 1',
      irishlife: 'Irish Life Health Signature Level 1',
    },
    null
  );

  const planName = planByHint ?? randomFrom(Object.keys(COVERAGE_RULES));
  const plan = COVERAGE_RULES[planName];
  const policyNumber = `${plan.insurer.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 899999)}`;

  return {
    insurer: plan.insurer,
    planName,
    policyNumber,
    excess: plan.excessDefault,
    confidence: 'medium',
  };
}

const URGENCY_OPTIONS = ['Routine', 'Semi-urgent', 'Urgent'];
const GP_NAMES = ['Dr. John Smith', 'Dr. Emma Kelly', 'Dr. Rajiv Patel', 'Dr. Claire Murphy'];

export async function extractReferralLetter(file) {
  await delay(1300);

  const specialtyByHint = pickByFilename(
    file?.name,
    {
      cardio: 'Cardiology',
      derma: 'Dermatology',
      skin: 'Dermatology',
      gyna: 'Gynaecology',
      ortho: 'Orthopaedics',
      ent: 'ENT',
      physio: 'Physiotherapy',
      gastro: 'Gastroenterology',
      endo: 'Endocrinology',
    },
    null
  );

  return {
    specialty: specialtyByHint ?? randomFrom(SPECIALTIES),
    gpName: randomFrom(GP_NAMES),
    urgency: randomFrom(URGENCY_OPTIONS),
    namedSpecialist: '',
    confidence: 'medium',
  };
}

export async function extractReceipt(file, expectedFee) {
  await delay(900);
  // Simulate real-world variance from the pre-visit fee estimate.
  const variance = Math.round((Math.random() - 0.3) * 30);
  const actualFee = Math.max(20, (expectedFee ?? 150) + variance);
  return {
    actualFee,
    visitDate: new Date().toISOString().slice(0, 10),
    confidence: 'medium',
    fileName: file?.name ?? 'receipt',
  };
}
