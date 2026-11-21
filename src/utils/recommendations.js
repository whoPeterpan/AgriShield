/**
 * Personalised Action Plan Generator
 * ---------------------------------------------------------------------------
 * Converts the top failing/partial questions from a FarmShield Local
 * assessment into concrete, farmer-friendly corrective actions ranked by
 * local risk weight.
 */

export function generateActionPlanFromScore(scoreResult, farmId) {
  if (!scoreResult || !scoreResult.questionBreakdowns) return [];

  const gaps = scoreResult.questionBreakdowns
    .filter((item) => item.isApplicable && item.weightedRiskPoints > 0)
    .sort((a, b) => b.weightedRiskPoints - a.weightedRiskPoints);

  return gaps.slice(0, 5).map((gap, index) => {
    let priority = 'Medium';
    if (gap.answer === 'No' && (gap.multiplier > 1 || gap.baseWeight >= 15)) {
      priority = 'Critical';
    } else if (gap.answer === 'No' || gap.multiplier > 1) {
      priority = 'High';
    }

    return {
      id: `rec-${farmId}-${gap.question_code}`,
      farm_id: farmId,
      question_code: gap.question_code,
      title: `${gap.category}: ${gap.question_text}`,
      identified_problem:
        gap.answer === 'No'
          ? `Control not yet in place (${gap.category}).`
          : `Control only partially followed (${gap.category}).`,
      why_it_matters:
        gap.multiplierReasons.length > 0
          ? `${gap.explanation} Local note: ${gap.multiplierReasons.join('; ')}.`
          : gap.explanation,
      action_steps: gap.corrective_action,
      priority,
      rank: index + 1,
      weighted_impact: gap.weightedRiskPoints,
      is_completed: false,
    };
  });
}
