import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FilePlus2,
  ShieldAlert,
  Sprout,
  Stethoscope,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { evaluateCompartmentReadiness } from '../utils/readinessLadder.js';
import {
  evaluateCommunityPatternAlerts,
  evaluateFarmSignalAlerts,
} from '../utils/alertEngine.js';
import { generateActionPlanFromScore } from '../utils/recommendations.js';
import { calculateBiosecurityScore } from '../utils/riskScoring.js';
import { t } from '../utils/translations.js';

export default function FarmerDashboard() {
  const {
    language,
    store,
    myFarms,
    activeFarm,
    districtProfiles,
    getQuestionsForFarmType,
  } = useApp();

  // Zero-farm initial state for a fresh Farmer Demo or new user
  if (!activeFarm) {
    return (
      <div className="space-y-6">
        {/* Zero-State KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500">Registered Farms</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900 mt-2">
              {myFarms.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">Add a pig or poultry farm</p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500">{t(language, 'riskScore')}</p>
            <p className="text-2xl font-bold text-slate-400 mt-2">Not completed</p>
            <p className="text-xs text-slate-500 mt-2">0 completed assessments</p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500">{t(language, 'readiness')}</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900 mt-2">0%</p>
            <p className="text-xs text-slate-500 mt-2">0 evidence files uploaded</p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500">Active Alerts &amp; Logs</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900 mt-2">0</p>
            <p className="text-xs text-slate-500 mt-2">0 visitor · 0 cleaning logs</p>
          </div>
        </div>

        {/* Clean Empty State Hero Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF5F0] text-[#0D3B26] flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-slate-900">
              No records yet. Start by registering your first farm.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Add your pig or poultry unit to unlock weighted FarmShield Local risk assessments,
              offline visitor &amp; cleaning logs, Compartment Readiness tracking, and vet support.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/farm-profile"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D3B26] px-5 py-3 text-sm font-semibold text-white hover:bg-[#145235] transition-colors whitespace-nowrap"
            >
              <Building2 className="w-4 h-4" />
              <span>Register Your First Farm</span>
            </Link>
            <Link
              to="/action-plan"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <span>Browse Pathshala Lessons</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const farmAudits = store.audits.filter((a) => a.farm_id === activeFarm.id);
  const latestAudit = farmAudits[0] || null;
  const farmLogs = store.farmLogs
    .filter((l) => l.farm_id === activeFarm.id)
    .sort((a, b) => b.log_date.localeCompare(a.log_date));
  const farmEvidence = store.evidenceItems.filter((e) => e.farm_id === activeFarm.id);
  const farmVetCases = store.vetCases.filter((c) => c.farm_id === activeFarm.id);

  // Compute readiness
  const readiness = evaluateCompartmentReadiness({
    farm: activeFarm,
    audits: farmAudits,
    logs: farmLogs,
    evidence: farmEvidence,
  });

  // Compute pending recommendations from stored recommendations or latest audit
  const storedRecs = (store.recommendations || []).filter((r) => r.farm_id === activeFarm.id);
  let activeRecommendations = storedRecs;
  if (activeRecommendations.length === 0 && latestAudit?.answers) {
    const profile = districtProfiles.find((d) => d.district_name === activeFarm.district);
    const questions = getQuestionsForFarmType(activeFarm.farm_type);
    const computed = calculateBiosecurityScore(
      questions,
      latestAudit.answers,
      activeFarm.farm_type,
      profile
    );
    activeRecommendations = generateActionPlanFromScore(computed, activeFarm.id);
  }
  const pendingRecommendations = activeRecommendations.filter((r) => !r.is_completed);

  // Compute Alerts
  const farmSignals = evaluateFarmSignalAlerts(activeFarm, farmLogs, store.reviewedAlertIds);
  const { aggregatedAlerts } = evaluateCommunityPatternAlerts(
    store.communityReports,
    store.reviewedAlertIds
  );
  const relevantOfficialAlerts = store.officialAlerts.filter(
    (a) => !a.district || a.district === activeFarm.district
  );
  const allAlerts = [...farmSignals, ...aggregatedAlerts, ...relevantOfficialAlerts];
  const unreviewedAlerts = allAlerts.filter((a) => !a.is_reviewed);

  const recentVisitorAndCleaning = farmLogs
    .filter((l) => l.log_type === 'visitor' || l.log_type === 'cleaning')
    .slice(0, 5);

  const chartData = (latestAudit?.category_scores || []).map((c) => ({
    name: c.category.split(' ').slice(0, 2).join(' '),
    risk: c.score,
  }));

  const riskScore = latestAudit ? latestAudit.overall_risk_score : null;
  const riskCategory = latestAudit ? latestAudit.risk_category : 'Not completed';

  const riskColorClass =
    riskScore === null
      ? 'text-slate-400'
      : riskScore <= 24
      ? 'text-emerald-700'
      : riskScore <= 49
      ? 'text-amber-700'
      : riskScore <= 74
      ? 'text-orange-700'
      : 'text-rose-700';

  return (
    <div className="space-y-6">
      {/* Farm Context Summary Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            {activeFarm.farm_type} Farm · {activeFarm.district}, {activeFarm.state} ·{' '}
            <span className="tabular-nums">{activeFarm.animal_count}</span>{' '}
            {activeFarm.farm_type === 'Pig' ? 'Pigs' : 'Birds'} · {activeFarm.farm_size}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {activeFarm.farm_name}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/audit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0D3B26] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#145235] transition-colors whitespace-nowrap"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{t(language, 'startAudit')}</span>
          </Link>
          <Link
            to="/records"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>{t(language, 'addRecord')}</span>
          </Link>
          <Link
            to="/vet-support"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Stethoscope className="w-4 h-4" />
            <span>{t(language, 'askVet')}</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">{t(language, 'riskScore')}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${riskColorClass}`}>
              {riskScore !== null ? `${riskScore}` : '—'}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">/ 100</span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-700">
            {riskCategory} · Demo Threshold
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">{t(language, 'readiness')}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-[#0D3B26]">
              {readiness.readinessPercentage}%
            </span>
            <span className="text-xs font-medium text-slate-600">{readiness.currentLevel}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {readiness.completedCount} of {readiness.totalCount} internal checks met
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">{t(language, 'completedChecks')}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-slate-900">
              {farmAudits.length}
            </span>
            <span className="text-xs text-slate-500">audits saved</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {farmLogs.length} daily records · {farmEvidence.length} evidence files
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">{t(language, 'pendingActions')}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-amber-700">
              {pendingRecommendations.length}
            </span>
            <span className="text-xs text-slate-500">action items</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {unreviewedAlerts.length} unreviewed alert(s) · {farmVetCases.length} vet case(s)
          </p>
        </div>
      </div>

      {/* Main Content Split: Chart + Pending Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Risk Breakdown Chart */}
        <section className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Category Risk Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Higher bar indicates greater biosecurity gap in that control area
              </p>
            </div>
            <Link
              to="/audit"
              className="text-xs font-semibold text-[#0D3B26] hover:underline whitespace-nowrap"
            >
              {latestAudit ? 'Recalculate →' : 'Start Audit →'}
            </Link>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(val) => [`${val}% Risk`, 'Category Risk']}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="risk" fill="#0D3B26" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl p-6 bg-[#FAFBF9]">
              <p className="text-sm font-semibold text-slate-700">
                No assessment completed yet for {activeFarm.farm_name}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Complete the 10-control FarmShield Local checklist to see your risk profile by
                category.
              </p>
              <Link
                to="/audit"
                className="mt-4 rounded-xl bg-[#0D3B26] px-4 py-2 text-xs font-semibold text-white hover:bg-[#145235] transition-colors"
              >
                Start First Biosecurity Check
              </Link>
            </div>
          )}
        </section>

        {/* Top Pending Recommendations */}
        <section className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-bold text-slate-900">Priority Action Plan</h3>
              <Link
                to="/action-plan"
                className="text-xs font-semibold text-[#0D3B26] hover:underline whitespace-nowrap"
              >
                View All →
              </Link>
            </div>

            {pendingRecommendations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingRecommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-amber-700">{rec.priority} Priority</span>
                      <span className="tabular-nums">Impact {rec.weighted_impact} pts</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{rec.title}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{rec.action_steps}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                {latestAudit
                  ? 'All current action items completed. Keep logging daily checks!'
                  : 'Action items will generate automatically once you save your first assessment.'}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-700" />
              Next Milestone: {readiness.nextLevel}
            </span>
            <Link to="/readiness" className="text-[#0D3B26] font-semibold hover:underline">
              Readiness Ladder
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom Split: Recent Visitor/Cleaning Records + Latest Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">
              {t(language, 'recentRecords')}
            </h3>
            <Link
              to="/records"
              className="text-xs font-semibold text-[#0D3B26] hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentVisitorAndCleaning.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentVisitorAndCleaning.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 capitalize">
                      {log.log_type} · <span className="tabular-nums">{log.log_date}</span>
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{log.title}</p>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">
              No visitor or cleaning logs recorded yet.
            </p>
          )}
        </section>

        <section className="bg-white border border-slate-200/90 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">
              {t(language, 'latestAlerts')}
            </h3>
            <Link
              to="/alerts"
              className="text-xs font-semibold text-[#0D3B26] hover:underline flex items-center gap-1"
            >
              <span>All Alerts ({allAlerts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {allAlerts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {allAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {alert.severity === 'High' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-700">
                      {alert.alert_category === 'farm_signal'
                        ? 'Farm Signal'
                        : alert.alert_category === 'community'
                        ? 'Community Pattern'
                        : 'Official Demo Alert'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{alert.issued_date}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{alert.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">
              You&apos;re all caught up. No active alerts.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
