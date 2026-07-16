// Deterministic rebate calculator (§2D, §4). Deliberately NOT LLM-generated — this has
// to be auditable and reproducible from the coverage_rules table. If a plan isn't in the
// curated table, we say so rather than fabricating a number.

import { getPlanRules, CATEGORY_LABELS } from './coverageRules';

export function estimateRebate({ planName, category, fee, allowanceUsedThisYear = 0 }) {
  const plan = getPlanRules(planName);
  const rule = plan?.rules?.[category];

  if (!plan || !rule) {
    return {
      matched: false,
      categoryLabel: CATEGORY_LABELS[category] ?? category,
      fee,
      message: `We don't have confirmed coverage rules for "${planName}" yet, so we can't estimate a rebate for this visit. You can still book — just check the per-visit cap with your insurer before you go.`,
    };
  }

  const allowanceRemaining = Math.max(0, rule.annualCap - allowanceUsedThisYear);
  const estimatedRebate = Math.max(0, Math.min(rule.perVisitCap, fee, allowanceRemaining));
  const estimatedOutOfPocket = Math.max(0, fee - estimatedRebate);

  return {
    matched: true,
    categoryLabel: CATEGORY_LABELS[category] ?? category,
    fee,
    annualCap: rule.annualCap,
    perVisitCap: rule.perVisitCap,
    allowanceUsedThisYear,
    allowanceRemaining,
    requiresPreauth: rule.requiresPreauth,
    estimatedRebate,
    estimatedOutOfPocket,
    assumptions: [
      `Plan rule used: ${planName} → ${CATEGORY_LABELS[category] ?? category}`,
      `Per-visit rebate cap: €${rule.perVisitCap}`,
      `Annual allowance remaining before this visit: €${allowanceRemaining} of €${rule.annualCap}`,
      `Typical fee assumed: €${fee}`,
    ],
  };
}

export function midpointFee(specialist) {
  return Math.round((specialist.typicalFeeMin + specialist.typicalFeeMax) / 2);
}
