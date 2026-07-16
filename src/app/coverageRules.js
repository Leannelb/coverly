// Mirrors the `coverage_rules` table from the product spec (§5, §6.1).
// No insurer publishes this as data — it has to be curated and kept current by hand.
// Populated for Laya, Vhi and Irish Life across the outpatient categories that matter
// for referral-driven care. Treat this as the seed for an admin-maintained table, not
// a permanent source of truth.

export const INSURERS = ['Laya', 'Vhi', 'Irish Life'];

export const CATEGORIES = [
  'gp',
  'consultant',
  'physio',
  'diagnostics',
  'counselling',
];

export const CATEGORY_LABELS = {
  gp: 'GP visits',
  consultant: 'Consultant / specialist',
  physio: 'Physiotherapy',
  diagnostics: 'Diagnostics & scans',
  counselling: 'Counselling',
};

// planName -> { insurer, excessDefault, rules: { category -> rule } }
export const COVERAGE_RULES = {
  'Laya Company Plan Plus Level 1.3': {
    insurer: 'Laya',
    excessDefault: 100,
    rules: {
      gp: { annualCap: 300, perVisitCap: 25, requiresPreauth: false },
      consultant: { annualCap: 600, perVisitCap: 75, requiresPreauth: false },
      physio: { annualCap: 400, perVisitCap: 35, requiresPreauth: false },
      diagnostics: { annualCap: 500, perVisitCap: 250, requiresPreauth: true },
      counselling: { annualCap: 250, perVisitCap: 50, requiresPreauth: false },
    },
  },
  'Laya One Plan': {
    insurer: 'Laya',
    excessDefault: 150,
    rules: {
      gp: { annualCap: 200, perVisitCap: 20, requiresPreauth: false },
      consultant: { annualCap: 450, perVisitCap: 60, requiresPreauth: false },
      physio: { annualCap: 300, perVisitCap: 30, requiresPreauth: false },
      diagnostics: { annualCap: 400, perVisitCap: 200, requiresPreauth: true },
      counselling: { annualCap: 150, perVisitCap: 40, requiresPreauth: false },
    },
  },
  'Vhi Company Plan Level 1': {
    insurer: 'Vhi',
    excessDefault: 100,
    rules: {
      gp: { annualCap: 320, perVisitCap: 25, requiresPreauth: false },
      consultant: { annualCap: 650, perVisitCap: 80, requiresPreauth: true },
      physio: { annualCap: 420, perVisitCap: 35, requiresPreauth: false },
      diagnostics: { annualCap: 550, perVisitCap: 275, requiresPreauth: true },
      counselling: { annualCap: 260, perVisitCap: 50, requiresPreauth: false },
    },
  },
  'Vhi Healthplan Extra': {
    insurer: 'Vhi',
    excessDefault: 75,
    rules: {
      gp: { annualCap: 400, perVisitCap: 30, requiresPreauth: false },
      consultant: { annualCap: 800, perVisitCap: 90, requiresPreauth: true },
      physio: { annualCap: 500, perVisitCap: 40, requiresPreauth: false },
      diagnostics: { annualCap: 650, perVisitCap: 300, requiresPreauth: true },
      counselling: { annualCap: 300, perVisitCap: 55, requiresPreauth: false },
    },
  },
  'Irish Life Health Signature Level 1': {
    insurer: 'Irish Life',
    excessDefault: 100,
    rules: {
      gp: { annualCap: 280, perVisitCap: 25, requiresPreauth: false },
      consultant: { annualCap: 550, perVisitCap: 70, requiresPreauth: false },
      physio: { annualCap: 350, perVisitCap: 30, requiresPreauth: false },
      diagnostics: { annualCap: 450, perVisitCap: 225, requiresPreauth: true },
      counselling: { annualCap: 220, perVisitCap: 45, requiresPreauth: false },
    },
  },
  'Irish Life Health Total Health Proactive': {
    insurer: 'Irish Life',
    excessDefault: 50,
    rules: {
      gp: { annualCap: 360, perVisitCap: 30, requiresPreauth: false },
      consultant: { annualCap: 700, perVisitCap: 85, requiresPreauth: false },
      physio: { annualCap: 450, perVisitCap: 40, requiresPreauth: false },
      diagnostics: { annualCap: 600, perVisitCap: 280, requiresPreauth: true },
      counselling: { annualCap: 280, perVisitCap: 55, requiresPreauth: false },
    },
  },
};

export function plansForInsurer(insurer) {
  return Object.keys(COVERAGE_RULES).filter((name) => COVERAGE_RULES[name].insurer === insurer);
}

export function getPlanRules(planName) {
  return COVERAGE_RULES[planName] ?? null;
}

// Claim submission windows per insurer — used for reminders and reconciliation guidance (§2D, §3).
export const CLAIM_SUBMISSION = {
  Laya: {
    windowMonths: 12,
    windowLabel: '12 months from the end of your policy year',
    channel: 'the Laya Healthcare member app',
  },
  Vhi: {
    windowMonths: 9,
    windowLabel: '9 months from the end of your policy year (confirm current terms with Vhi)',
    channel: "Vhi's online member portal or app",
  },
  'Irish Life': {
    windowMonths: 6,
    windowLabel: '6 months from the end of your policy year',
    channel: 'the Irish Life Health member portal',
  },
};
