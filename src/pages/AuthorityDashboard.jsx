import { useMemo, useState } from 'react';
import { BarChart3, Lock, PlusCircle, ShieldCheck } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { evaluateCompartmentReadiness } from '../utils/readinessLadder.js';
import { evaluateCommunityPatternAlerts } from '../utils/alertEngine.js';

const READINESS_COLORS = {
  Starter: '#94a3b8',
  Bronze: '#d97706',
  Silver: '#64748b',
  Gold: '#0D3B26',
};

export default function AuthorityDashboard() {
  const {
    store,
    districtProfiles,
    lessons,
    getQuestionsForFarmType,
    upsertDistrictProfile,
    addLesson,
  } = useApp();

  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [viewMode, setViewMode] = useState('analytics');

  const [distForm, setDistForm] = useState({
    district_name: 'Kamrup Metro',
    state_name: 'Assam',
    asf_risk_level: 'High',
    hpai_risk_level: 'Moderate',
    seasonal_risk: 'High',
    environmental_factor: 'Heavy monsoon runoff & peri-urban pig transport corridor',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    species: 'Both',
    summary: '',
    dosText: '',
    dontsText: '',
  });

  const aggregate = useMemo(() => {
    const filteredFarms =
      selectedDistrict === 'All'
        ? store.farms
        : store.farms.filter((f) => f.district === selectedDistrict);

    const totalFarms = filteredFarms.length;
    const pigFarms = filteredFarms.filter((f) => f.farm_type === 'Pig');
    const poultryFarms = filteredFarms.filter((f) => f.farm_type === 'Poultry');

    const farmIds = new Set(filteredFarms.map((f) => f.id));
    const latestAuditByFarm = {};
    for (const audit of store.audits) {
      if (farmIds.has(audit.farm_id) && !latestAuditByFarm[audit.farm_id]) {
        latestAuditByFarm[audit.farm_id] = audit;
      }
    }

    const assessedAudits = Object.values(latestAuditByFarm);
    const assessedPercent =
      totalFarms > 0 ? Math.round((assessedAudits.length / totalFarms) * 100) : 0;

    const avgRiskScore =
      assessedAudits.length > 0
        ? Math.round(
            assessedAudits.reduce((s, a) => s + Number(a.overall_risk_score), 0) /
              assessedAudits.length
          )
        : null;

    const avgSpeciesScore = (farmsSubset) => {
      const scores = farmsSubset
        .map((f) => latestAuditByFarm[f.id]?.overall_risk_score)
        .filter((v) => v !== undefined && v !== null);
      if (scores.length === 0) return null;
      return Math.round(scores.reduce((a, b) => a + Number(b), 0) / scores.length);
    };

    const speciesComparison = [
      {
        species: 'Pig Farms',
        avgRisk: avgSpeciesScore(pigFarms),
        farms: pigFarms.length,
      },
      {
        species: 'Poultry Farms',
        avgRisk: avgSpeciesScore(poultryFarms),
        farms: poultryFarms.length,
      },
    ];

    const failureCounts = {};
    for (const farm of filteredFarms) {
      const audit = latestAuditByFarm[farm.id];
      if (!audit?.answers) continue;
      const qs = getQuestionsForFarmType(farm.farm_type);
      for (const q of qs) {
        const ans = audit.answers[q.question_code];
        if (ans === 'No' || ans === 'Partially') {
          failureCounts[q.category] = (failureCounts[q.category] || 0) + 1;
        }
      }
    }
    const topFailures = Object.entries(failureCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const tierCounts = { Starter: 0, Bronze: 0, Silver: 0, Gold: 0 };
    for (const farm of filteredFarms) {
      const r = evaluateCompartmentReadiness({
        farm,
        audits: store.audits.filter((a) => a.farm_id === farm.id),
        logs: store.farmLogs.filter((l) => l.farm_id === farm.id),
        evidence: store.evidenceItems.filter((e) => e.farm_id === farm.id),
      });
      tierCounts[r.currentLevel] = (tierCounts[r.currentLevel] || 0) + 1;
    }
    const readinessData = Object.entries(tierCounts).map(([name, value]) => ({
      name,
      value,
      color: READINESS_COLORS[name],
    }));

    const { aggregatedAlerts } = evaluateCommunityPatternAlerts(
      store.communityReports,
      store.reviewedAlertIds
    );
    const openAlerts =
      store.officialAlerts.filter(
        (a) => selectedDistrict === 'All' || !a.district || a.district === selectedDistrict
      ).length +
      aggregatedAlerts.filter(
        (a) => selectedDistrict === 'All' || a.district === selectedDistrict
      ).length;

    const reportedCases = store.vetCases.filter((c) =>
      selectedDistrict === 'All' ? true : farmIds.has(c.farm_id)
    ).length;

    return {
      totalFarms,
      pigCount: pigFarms.length,
      poultryCount: poultryFarms.length,
      completedAuditsCount: assessedAudits.length,
      avgRiskScore,
      assessedPercent,
      speciesComparison,
      topFailures,
      readinessData,
      openAlerts,
      reportedCases,
    };
  }, [store, selectedDistrict, getQuestionsForFarmType]);

  const handleSaveDistrict = (e) => {
    e.preventDefault();
    upsertDistrictProfile({
      id: `dist-${distForm.district_name.toLowerCase().replace(/\s+/g, '-')}`,
      ...distForm,
      is_demo_data: true,
      source_name: 'Demo Data — Authority Updated Profile',
      last_updated: new Date().toISOString().slice(0, 10),
    });
  };

  const handleCreateLesson = (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim() || !lessonForm.summary.trim()) return;
    addLesson({
      title: lessonForm.title,
      species: lessonForm.species,
      summary: lessonForm.summary,
      dos: lessonForm.dosText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      donts: lessonForm.dontsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setLessonForm({ title: '', species: 'Both', summary: '', dosText: '', dontsText: '' });
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0D3B26]" />
            <span>Policy Pulse — Authority Dashboard</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Anonymised district biosecurity trends and demonstration content management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F1F5F2] rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('analytics')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Regional Trends
            </button>
            <button
              type="button"
              onClick={() => setViewMode('content')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'content'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manage Profiles &amp; Lessons ({lessons.length})
            </button>
          </div>

          {viewMode === 'analytics' && (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              aria-label="Filter by district"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
            >
              <option value="All">All Districts</option>
              {districtProfiles.map((d) => (
                <option key={d.district_name} value={d.district_name}>
                  {d.district_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Privacy Protection Notice */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-[#0D3B26] shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-900">Farmer Privacy Protected:</strong> Authority views show
          strictly aggregated, anonymised metrics. Individual farmer names, contacts, and exact farm
          addresses are never exposed.
        </p>
      </div>

      {viewMode === 'analytics' ? (
        <>
          {/* 5 Aggregate KPI Cards (All 0 initially in fresh demo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Registered Farms</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900 mt-1.5">
                {aggregate.totalFarms}
              </p>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                {aggregate.pigCount} Pig · {aggregate.poultryCount} Poultry
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Completed Assessments</p>
              <p className="text-3xl font-bold tabular-nums text-[#0D3B26] mt-1.5">
                {aggregate.completedAuditsCount}
              </p>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                {aggregate.assessedPercent}% completion rate
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Average Risk Score</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900 mt-1.5">
                {aggregate.avgRiskScore !== null ? aggregate.avgRiskScore : '—'}
                <span className="text-xs font-normal text-slate-400"> / 100</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {aggregate.avgRiskScore !== null ? 'Anonymised mean' : 'No assessments yet'}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Active Alerts</p>
              <p className="text-3xl font-bold tabular-nums text-amber-700 mt-1.5">
                {aggregate.openAlerts}
              </p>
              <p className="text-xs text-slate-500 mt-1">&ge;3 farm cluster threshold</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Reported Cases</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900 mt-1.5">
                {aggregate.reportedCases}
              </p>
              <p className="text-xs text-slate-500 mt-1">Veterinary escalations</p>
            </div>
          </div>

          {/* Charts Row with Informative Empty States */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Most Frequently Failed Biosecurity Controls */}
            <section className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Most Frequently Failed Controls
                </h3>
                <p className="text-xs text-slate-500">
                  Count of anonymised units answering &ldquo;No&rdquo; or &ldquo;Partially&rdquo;
                </p>
              </div>

              {aggregate.topFailures.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={aggregate.topFailures}
                      layout="vertical"
                      margin={{ top: 8, right: 20, left: 20, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#475569' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
                        width={130}
                        tick={{ fontSize: 11, fill: '#334155' }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl bg-[#FAFBF9] p-6">
                  <BarChart3 className="w-7 h-7 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No assessment data recorded yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Anonymised control gap trends will populate dynamically once farms complete
                    biosecurity assessments.
                  </p>
                </div>
              )}
            </section>

            {/* Pig vs Poultry Comparison + Readiness Pie */}
            <section className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pig vs Poultry Risk Comparison
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {aggregate.speciesComparison.map((item) => (
                    <div
                      key={item.species}
                      className="rounded-xl bg-[#FAFBF9] border border-slate-200 p-4"
                    >
                      <p className="text-xs text-slate-500">
                        {item.species} ({item.farms})
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
                        {item.avgRisk !== null ? item.avgRisk : '—'}
                        <span className="text-xs font-normal text-slate-500">
                          {item.avgRisk !== null ? ' avg risk' : ' no audits'}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  Compartment-Readiness Distribution
                </h4>
                {aggregate.totalFarms > 0 ? (
                  <div className="h-44 flex items-center">
                    <ResponsiveContainer width="55%" height="100%">
                      <PieChart>
                        <Pie
                          data={aggregate.readinessData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={38}
                          outerRadius={64}
                        >
                          {aggregate.readinessData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 text-xs">
                      {aggregate.readinessData.map((tier) => (
                        <div key={tier.name} className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: tier.color }}
                          />
                          <span className="text-slate-700 font-medium">{tier.name}:</span>
                          <span className="font-mono-tabular text-slate-900">{tier.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-36 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl bg-[#FAFBF9] p-4">
                    <p className="text-xs font-semibold text-slate-700">
                      0 farms registered in this view
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Readiness distribution appears here once farms register and build proof.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      ) : (
        /* Authority Demo Content Manager */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0D3B26]" />
              <span>Manage District Epidemiology Profile (Demo Data)</span>
            </h3>
            <form onSubmit={handleSaveDistrict} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    District Name
                  </label>
                  <input
                    type="text"
                    required
                    value={distForm.district_name}
                    onChange={(e) => setDistForm({ ...distForm, district_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={distForm.state_name}
                    onChange={(e) => setDistForm({ ...distForm, state_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'asf_risk_level', label: 'ASF Risk (Pig)' },
                  { key: 'hpai_risk_level', label: 'HPAI Risk (Poultry)' },
                  { key: 'seasonal_risk', label: 'Seasonal Risk' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {field.label}
                    </label>
                    <select
                      value={distForm[field.key]}
                      onChange={(e) => setDistForm({ ...distForm, [field.key]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                    >
                      <option value="Low">Low</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Environmental / Farm-Location Factor
                </label>
                <input
                  type="text"
                  required
                  value={distForm.environmental_factor}
                  onChange={(e) =>
                    setDistForm({ ...distForm, environmental_factor: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-[#0D3B26] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#145235] transition-colors"
              >
                Save Demo District Profile
              </button>
            </form>
          </section>

          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#0D3B26]" />
              <span>Publish Biosecurity Pathshala Lesson</span>
            </h3>
            <form onSubmit={handleCreateLesson} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="e.g. Safe Feed Bag Storage"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Species
                  </label>
                  <select
                    value={lessonForm.species}
                    onChange={(e) => setLessonForm({ ...lessonForm, species: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Both">Both</option>
                    <option value="Pig">Pig</option>
                    <option value="Poultry">Poultry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Simple Summary *
                </label>
                <textarea
                  rows={2}
                  required
                  value={lessonForm.summary}
                  onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Do&apos;s (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={lessonForm.dosText}
                    onChange={(e) => setLessonForm({ ...lessonForm, dosText: e.target.value })}
                    placeholder="Stack bags on wooden pallets"
                    className={`${inputClass} text-xs`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Don&apos;ts (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={lessonForm.dontsText}
                    onChange={(e) => setLessonForm({ ...lessonForm, dontsText: e.target.value })}
                    placeholder="Do not leave feed sacks near drains"
                    className={`${inputClass} text-xs`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-[#0D3B26] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#145235] transition-colors"
              >
                Publish Lesson
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
