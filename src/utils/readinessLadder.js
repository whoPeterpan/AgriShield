/**
 * Compartment-Ready Ladder Calculator
 * ---------------------------------------------------------------------------
 * Computes internal application readiness tiers (Bronze, Silver, Gold) from
 * real farmer activity: farm registration, completed assessments, cleaning &
 * visitor logs, and uploaded evidence items.
 *
 * IMPORTANT: These levels track internal farm readiness only and do NOT
 * represent official government certification or legal compartment status.
 */

export function evaluateCompartmentReadiness({ farm, audits = [], logs = [], evidence = [] }) {
  const hasRegisteredFarm = Boolean(farm && farm.farm_name && farm.district && farm.animal_count > 0);
  const completedAudits = audits.filter((a) => a.status === 'completed');
  const latestAudit = completedAudits[0] || null;

  const cleaningLogs = logs.filter((l) => l.log_type === 'cleaning');
  const visitorLogs = logs.filter((l) => l.log_type === 'visitor');

  const checklist = [
    // BRONZE
    {
      id: 'bronze-reg',
      level: 'Bronze',
      title: 'Complete basic farm profile & species registration',
      completed: hasRegisteredFarm,
      detail: hasRegisteredFarm
        ? `${farm.farm_name} (${farm.farm_type}) registered in ${farm.district}`
        : 'Register farm size, animal count, and district.',
      reference: 'Application Readiness Baseline (Internal)',
    },
    {
      id: 'bronze-audit',
      level: 'Bronze',
      title: 'Complete initial FarmShield Local biosecurity check',
      completed: completedAudits.length >= 1,
      detail:
        completedAudits.length >= 1
          ? `${completedAudits.length} assessment(s) completed`
          : 'Submit your first species-specific biosecurity assessment.',
      reference: 'FAO / WOAH Good Farm Biosecurity Principles (Guidance)',
    },
    {
      id: 'bronze-cleaning',
      level: 'Bronze',
      title: 'Maintain at least 1 cleaning & disinfection record',
      completed: cleaningLogs.length >= 1,
      detail: `${cleaningLogs.length} cleaning record(s) logged`,
      reference: 'Basic Shed Hygiene Practice',
    },

    // SILVER
    {
      id: 'silver-visitors',
      level: 'Silver',
      title: 'Maintain visitor entry logs (at least 2 entries)',
      completed: visitorLogs.length >= 2,
      detail: `${visitorLogs.length} / 2 visitor records logged`,
      reference: 'DAHD Biosecurity Guidelines — Entry Control Reference',
    },
    {
      id: 'silver-cleaning-schedule',
      level: 'Silver',
      title: 'Maintain regular cleaning schedule (at least 3 entries)',
      completed: cleaningLogs.length >= 3,
      detail: `${cleaningLogs.length} / 3 cleaning records logged`,
      reference: 'Routine Sanitation Schedule Reference',
    },
    {
      id: 'silver-evidence',
      level: 'Silver',
      title: 'Upload at least 1 supporting photo or document in Evidence Locker',
      completed: evidence.length >= 1,
      detail: `${evidence.length} evidence item(s) stored`,
      reference: 'Documented Compliance Evidence Practice',
    },

    // GOLD
    {
      id: 'gold-consistent-logs',
      level: 'Gold',
      title: 'Consistent multi-category farm record keeping (6+ total logs)',
      completed: logs.length >= 6,
      detail: `${logs.length} / 6 total farm records logged`,
      reference: 'Continuous Farm Recordkeeping Standard',
    },
    {
      id: 'gold-low-risk',
      level: 'Gold',
      title: 'Achieve Low or Moderate Risk assessment performance (Score <= 35)',
      completed: Boolean(latestAudit && Number(latestAudit.overall_risk_score) <= 35),
      detail: latestAudit
        ? `Latest score: ${latestAudit.overall_risk_score}/100`
        : 'Complete an assessment to evaluate score',
      reference: 'Prototype Internal Readiness Threshold (<= 35)',
    },
    {
      id: 'gold-evidence-suite',
      level: 'Gold',
      title: 'Maintain 3+ supporting evidence files across farm controls',
      completed: evidence.length >= 3,
      detail: `${evidence.length} / 3 evidence files uploaded`,
      reference: 'Compartment Readiness Documentation Practice',
    },
  ];

  const bronzeItems = checklist.filter((i) => i.level === 'Bronze');
  const silverItems = checklist.filter((i) => i.level === 'Silver');
  const goldItems = checklist.filter((i) => i.level === 'Gold');

  const bronzeDone = bronzeItems.every((i) => i.completed);
  const silverDone = bronzeDone && silverItems.every((i) => i.completed);
  const goldDone = silverDone && goldItems.every((i) => i.completed);

  let currentLevel = 'Starter';
  let nextLevel = 'Bronze';
  if (goldDone) {
    currentLevel = 'Gold';
    nextLevel = 'Gold Maintained';
  } else if (silverDone) {
    currentLevel = 'Silver';
    nextLevel = 'Gold';
  } else if (bronzeDone) {
    currentLevel = 'Bronze';
    nextLevel = 'Silver';
  }

  const completedCount = checklist.filter((i) => i.completed).length;
  const readinessPercentage = Math.round((completedCount / checklist.length) * 100);

  return {
    currentLevel,
    nextLevel,
    readinessPercentage,
    completedCount,
    totalCount: checklist.length,
    completedRequirements: checklist.filter((i) => i.completed),
    pendingRequirements: checklist.filter((i) => !i.completed),
    checklist,
    disclaimer:
      'Bronze, Silver, and Gold represent internal Compartment Readiness milestones inside AgriShield only. They do not grant official government certification or statutory compartment approval.',
  };
}
