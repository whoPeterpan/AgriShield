/**
 * FarmShield Local — Transparent Weighted Biosecurity Risk Scoring Engine
 * ---------------------------------------------------------------------------
 * 1. Questions start unanswered (null) until the farmer selects an option.
 * 2. Each question has a base risk weight adjusted by local district pressure
 *    (ASF pressure for Pig farms, HPAI pressure for Poultry, and Seasonal risk).
 * 3. Answer scoring:
 *    - "Yes"            -> 0% of effective weight (0 risk points)
 *    - "Partially"      -> 50% of effective weight
 *    - "No"             -> 100% of effective weight
 *    - "Not Applicable" -> Excluded from both numerator and denominator
 * 4. Overall Risk Score = (Total Weighted Risk Points / Total Applicable Weight) * 100
 */

export const PROTOTYPE_RISK_THRESHOLDS = [
  { min: 0, max: 24, label: 'Low Risk', labelHi: 'कम जोखिम', tone: 'emerald' },
  { min: 25, max: 49, label: 'Moderate Risk', labelHi: 'मध्यम जोखिम', tone: 'amber' },
  { min: 50, max: 74, label: 'High Risk', labelHi: 'उच्च जोखिम', tone: 'orange' },
  { min: 75, max: 100, label: 'Critical Risk', labelHi: 'गंभीर जोखिम', tone: 'rose' },
];

/**
 * Determine the local risk multiplier for a single question based on
 * farm species and the selected demonstration district profile.
 */
export function getLocalMultiplier(question, farmType, districtProfile) {
  if (!districtProfile) {
    return { multiplier: 1, reasons: [] };
  }

  let multiplier = 1;
  const reasons = [];
  const tags = question.risk_tags || [];

  if (farmType === 'Pig' && tags.includes('asf-sensitive')) {
    if (districtProfile.asf_risk_level === 'High') {
      multiplier += 0.5;
      reasons.push(`High simulated ASF pressure in ${districtProfile.district_name} (+50% weight)`);
    } else if (districtProfile.asf_risk_level === 'Moderate') {
      multiplier += 0.25;
      reasons.push(`Moderate simulated ASF pressure in ${districtProfile.district_name} (+25% weight)`);
    }
  }

  if (farmType === 'Poultry' && tags.includes('hpai-sensitive')) {
    if (districtProfile.hpai_risk_level === 'High') {
      multiplier += 0.5;
      reasons.push(`High simulated HPAI pressure in ${districtProfile.district_name} (+50% weight)`);
    } else if (districtProfile.hpai_risk_level === 'Moderate') {
      multiplier += 0.25;
      reasons.push(`Moderate simulated HPAI pressure in ${districtProfile.district_name} (+25% weight)`);
    }
  }

  if (tags.includes('seasonal-sensitive')) {
    if (districtProfile.seasonal_risk === 'High') {
      multiplier += 0.2;
      reasons.push(`High seasonal risk in ${districtProfile.district_name} (+20% weight)`);
    } else if (districtProfile.seasonal_risk === 'Moderate') {
      multiplier += 0.1;
      reasons.push(`Moderate seasonal risk (+10% weight)`);
    }
  }

  return {
    multiplier: Number(multiplier.toFixed(2)),
    reasons,
  };
}

/**
 * Classify a 0-100 risk score using prototype demonstration thresholds.
 */
export function getRiskCategory(score) {
  if (score === null || score === undefined) {
    return { min: 0, max: 0, label: 'Not Assessed', labelHi: 'आकलन बाकी', tone: 'slate' };
  }
  const numericScore = Math.max(0, Math.min(100, Math.round(score)));
  const found =
    PROTOTYPE_RISK_THRESHOLDS.find(
      (tier) => numericScore >= tier.min && numericScore <= tier.max
    ) || PROTOTYPE_RISK_THRESHOLDS[0];
  return found;
}

/**
 * Calculate the complete biosecurity risk assessment breakdown.
 * Unanswered questions do not inflate or skew the score.
 */
export function calculateBiosecurityScore(questions, answersMap = {}, farmType, districtProfile) {
  let totalWeightedRiskPoints = 0;
  let totalApplicableWeight = 0;
  let totalApplicableBaseWeight = 0;
  let answeredCount = 0;
  let applicableCount = 0;
  const categoryAccumulator = {};
  const questionBreakdowns = [];

  for (const q of questions) {
    const answer = answersMap[q.question_code] || null;
    const baseWeight = Number(q.risk_weight || 10);
    const { multiplier, reasons } = getLocalMultiplier(q, farmType, districtProfile);
    const effectiveWeight = Number((baseWeight * multiplier).toFixed(2));

    let answerFactor = 0;
    let isApplicable = false;

    if (answer) {
      answeredCount += 1;
      if (answer === 'Yes') {
        answerFactor = 0;
        isApplicable = true;
      } else if (answer === 'Partially') {
        answerFactor = 0.5;
        isApplicable = true;
      } else if (answer === 'No') {
        answerFactor = 1;
        isApplicable = true;
      }
      // "Not Applicable" keeps isApplicable = false (excluded from calculation)
    }

    const weightedRiskPoints = isApplicable
      ? Number((effectiveWeight * answerFactor).toFixed(2))
      : 0;

    if (isApplicable) {
      applicableCount += 1;
      totalWeightedRiskPoints += weightedRiskPoints;
      totalApplicableWeight += effectiveWeight;
      totalApplicableBaseWeight += baseWeight;

      if (!categoryAccumulator[q.category]) {
        categoryAccumulator[q.category] = {
          category: q.category,
          riskPoints: 0,
          baseWeight: 0,
          applicableWeight: 0,
          questionCount: 0,
        };
      }
      categoryAccumulator[q.category].riskPoints += weightedRiskPoints;
      categoryAccumulator[q.category].baseWeight += baseWeight;
      categoryAccumulator[q.category].applicableWeight += effectiveWeight;
      categoryAccumulator[q.category].questionCount += 1;
    }

    questionBreakdowns.push({
      question_code: q.question_code,
      category: q.category,
      question_text: q.question_text,
      question_text_hi: q.question_text_hi,
      answer,
      isAnswered: Boolean(answer),
      isApplicable,
      baseWeight,
      multiplier,
      multiplierReasons: reasons,
      effectiveWeight,
      weightedRiskPoints,
      explanation: q.explanation,
      corrective_action: q.corrective_action,
      reference_source: q.reference_source,
    });
  }

  const overallScore =
    answeredCount > 0 && totalApplicableBaseWeight > 0
      ? Math.min(100, Math.round((totalWeightedRiskPoints / totalApplicableBaseWeight) * 100))
      : answeredCount > 0 && applicableCount === 0
      ? 0
      : null;

  const categoryScores = Object.values(categoryAccumulator).map((cat) => ({
    category: cat.category,
    score:
      cat.baseWeight > 0
        ? Math.min(100, Math.round((cat.riskPoints / cat.baseWeight) * 100))
        : 0,
    riskPoints: Number(cat.riskPoints.toFixed(1)),
    applicableWeight: Number(cat.applicableWeight.toFixed(1)),
    baseWeight: Number(cat.baseWeight.toFixed(1)),
    questionCount: cat.questionCount,
  }));

  const topThreeFactors = [...questionBreakdowns]
    .filter((item) => item.isApplicable && item.weightedRiskPoints > 0)
    .sort((a, b) => b.weightedRiskPoints - a.weightedRiskPoints)
    .slice(0, 3);

  const riskTier = getRiskCategory(overallScore);

  return {
    overallScore,
    riskCategory: riskTier.label,
    riskCategoryInfo: riskTier,
    answeredCount,
    totalCount: questions.length,
    unansweredCount: questions.length - answeredCount,
    applicableCount,
    totalWeightedRiskPoints: Number(totalWeightedRiskPoints.toFixed(1)),
    totalApplicableBaseWeight: Number(totalApplicableBaseWeight.toFixed(1)),
    totalApplicableWeight: Number(totalApplicableWeight.toFixed(1)),
    categoryScores,
    topThreeFactors,
    questionBreakdowns,
  };
}
