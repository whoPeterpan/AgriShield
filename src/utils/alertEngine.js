/**
 * Alerts & Silent Signals Engine
 * ---------------------------------------------------------------------------
 * Evaluates three strictly separated alert categories:
 * 1. Official Alerts (Demo simulated bulletins with source & date)
 * 2. Community Pattern Alerts (Anonymised — displayed ONLY when >= 3 distinct
 *    farms in the same district report a similar pattern)
 * 3. Farm Signal Alerts (Rule-based checks on the farmer's own logs)
 *
 * SAFETY RULE: Never diagnose ASF, HPAI, or any specific disease from app data.
 * Always use non-diagnostic advisory wording recommending veterinary advice.
 */

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  const diffMs = Math.abs(b.getTime() - a.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generate rule-based Farm Signal Alerts from a farm's daily logs.
 */
export function evaluateFarmSignalAlerts(farm, logs = [], reviewedAlertIds = []) {
  if (!farm) return [];
  const today = new Date().toISOString().slice(0, 10);
  const signals = [];

  // Rule 1: Unusual mortality pattern in the last 7 days
  const recentMortalityLogs = logs.filter(
    (l) => l.log_type === 'mortality' && daysBetween(l.log_date, today) <= 7
  );
  const totalRecentMortality = recentMortalityLogs.reduce(
    (sum, item) => sum + Number(item.numeric_value || 0),
    0
  );
  const herdThreshold = Math.max(3, Math.ceil(Number(farm.animal_count || 50) * 0.02));

  if (totalRecentMortality >= herdThreshold) {
    const id = `signal-mortality-${farm.id}`;
    signals.push({
      id,
      farm_id: farm.id,
      alert_category: 'farm_signal',
      severity: 'High',
      title: 'Unusual Mortality Pattern Logged',
      message:
        'An unusual pattern has been observed in recent farm mortality logs. Please contact a veterinarian for advice.',
      trigger_reason: `${totalRecentMortality} deaths recorded in the last 7 days (rule threshold: ${herdThreshold} for herd/flock size ${farm.animal_count}).`,
      next_step:
        'Isolate any unwell animals or birds, secure carcass disposal away from scavengers, and submit a Veterinarian Case for professional advice.',
      source_name: 'Farm Signal Rule Engine (Local Records)',
      is_simulated: false,
      is_reviewed: reviewedAlertIds.includes(id),
      issued_date: today,
    });
  }

  // Rule 2: Missed cleaning & disinfection (> 3 days since last cleaning log)
  const cleaningLogs = [...logs]
    .filter((l) => l.log_type === 'cleaning')
    .sort((a, b) => b.log_date.localeCompare(a.log_date));
  const lastCleaning = cleaningLogs[0];
  const daysSinceCleaning = lastCleaning ? daysBetween(lastCleaning.log_date, today) : 99;

  if (daysSinceCleaning > 3) {
    const id = `signal-cleaning-${farm.id}`;
    signals.push({
      id,
      farm_id: farm.id,
      alert_category: 'farm_signal',
      severity: 'Advisory',
      title: 'Missed Cleaning & Disinfection Schedule',
      message:
        'An unusual gap has been observed in your shed cleaning and disinfection records. Routine sanitation helps lower farm risk.',
      trigger_reason: lastCleaning
        ? `Last cleaning log was ${daysSinceCleaning} days ago (${lastCleaning.log_date}); rule threshold is 3 days.`
        : 'No cleaning or disinfection record has been logged yet.',
      next_step:
        'Complete shed cleaning and footbath disinfectant refresh today, then log the activity in Farm Records.',
      source_name: 'Farm Signal Rule Engine (Local Records)',
      is_simulated: false,
      is_reviewed: reviewedAlertIds.includes(id),
      issued_date: today,
    });
  }

  // Rule 3: Missing visitor register entries (> 5 days)
  const visitorLogs = [...logs]
    .filter((l) => l.log_type === 'visitor')
    .sort((a, b) => b.log_date.localeCompare(a.log_date));
  const lastVisitor = visitorLogs[0];
  const daysSinceVisitor = lastVisitor ? daysBetween(lastVisitor.log_date, today) : 99;

  if (daysSinceVisitor > 5) {
    const id = `signal-visitor-${farm.id}`;
    signals.push({
      id,
      farm_id: farm.id,
      alert_category: 'farm_signal',
      severity: 'Info',
      title: 'Visitor Register Needs Update',
      message:
        'No visitor entry or "zero-visitor check" has been logged in the last 5 days. Keeping entry records supports compartment readiness.',
      trigger_reason: lastVisitor
        ? `Last visitor entry recorded ${daysSinceVisitor} days ago (${lastVisitor.log_date}).`
        : 'No visitor entry records found.',
      next_step:
        'Record all feed vehicle, trader, or technician entries (or log "No external visitors today") in Farm Records.',
      source_name: 'Farm Signal Rule Engine (Local Records)',
      is_simulated: false,
      is_reviewed: reviewedAlertIds.includes(id),
      issued_date: today,
    });
  }

  // Rule 4: Concerning daily observation keywords
  const recentObservations = logs.filter(
    (l) =>
      l.log_type === 'observation' &&
      daysBetween(l.log_date, today) <= 7 &&
      /drop|letharg|cough|fever|refus|discharge|swelling|weak/i.test(
        `${l.title} ${l.details}`
      )
  );

  if (recentObservations.length > 0) {
    const id = `signal-obs-${farm.id}`;
    signals.push({
      id,
      farm_id: farm.id,
      alert_category: 'farm_signal',
      severity: 'High',
      title: 'Concerning Farm Observation Logged',
      message:
        'An unusual pattern has been observed in your daily observations. Please contact a veterinarian for advice.',
      trigger_reason: `Recent observation note flagged: "${recentObservations[0].title}" (${recentObservations[0].log_date}).`,
      next_step:
        'Avoid moving animals off the farm and open a Veterinarian Case with observation details.',
      source_name: 'Farm Signal Rule Engine (Local Records)',
      is_simulated: false,
      is_reviewed: reviewedAlertIds.includes(id),
      issued_date: today,
    });
  }

  return signals;
}

/**
 * Aggregate anonymised community reports.
 * PRIVACY RULE: Never expose individual farm IDs or names.
 * THRESHOLD RULE: Only surface a Community Pattern Alert when >= 3 distinct
 * farms in the same district report the same pattern within 14 days.
 */
export function evaluateCommunityPatternAlerts(communityReports = [], reviewedAlertIds = []) {
  const today = new Date().toISOString().slice(0, 10);
  const buckets = {};

  for (const rep of communityReports) {
    if (daysBetween(rep.reported_date, today) > 14) continue;
    const key = `${rep.district}::${rep.species}::${rep.pattern_type}`;
    if (!buckets[key]) {
      buckets[key] = {
        district: rep.district,
        species: rep.species,
        patternType: rep.pattern_type,
        farmIds: new Set(),
        latestDate: rep.reported_date,
      };
    }
    buckets[key].farmIds.add(rep.farm_id);
    if (rep.reported_date > buckets[key].latestDate) {
      buckets[key].latestDate = rep.reported_date;
    }
  }

  const aggregatedAlerts = [];
  const suppressedClusters = [];

  for (const [key, bucket] of Object.entries(buckets)) {
    const count = bucket.farmIds.size;
    if (count >= 3) {
      const id = `community-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      aggregatedAlerts.push({
        id,
        alert_category: 'community',
        severity: 'Advisory',
        district: bucket.district,
        species: bucket.species,
        distinctFarmCount: count,
        title: `Community Pattern Notice (${bucket.district} · ${bucket.species})`,
        message: `An unusual pattern (${bucket.patternType}) has been observed across ${count} anonymised farms in ${bucket.district}. Please contact a veterinarian for advice if your herd or flock shows similar signs.`,
        trigger_reason: `Privacy threshold met: ${count} distinct farms in ${bucket.district} submitted anonymised reports within 14 days (minimum required: 3).`,
        next_step:
          'Tighten gate visitor restrictions, verify disinfectant footbaths, and consult your assigned veterinarian for preventive advice.',
        source_name: 'Anonymised Community Pattern Engine (Demo Threshold >= 3 Farms)',
        is_simulated: true,
        is_reviewed: reviewedAlertIds.includes(id),
        issued_date: bucket.latestDate,
      });
    } else {
      suppressedClusters.push({
        district: bucket.district,
        species: bucket.species,
        patternType: bucket.patternType,
        count,
      });
    }
  }

  return {
    aggregatedAlerts,
    suppressedClusters,
  };
}
