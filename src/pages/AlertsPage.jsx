import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Megaphone,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import {
  evaluateCommunityPatternAlerts,
  evaluateFarmSignalAlerts,
} from '../utils/alertEngine.js';

export default function AlertsPage() {
  const {
    user,
    store,
    activeFarm,
    districtProfiles,
    markAlertReviewed,
    submitCommunityReport,
  } = useApp();

  const [activeTab, setActiveTab] = useState('all');
  const [reportDistrict, setReportDistrict] = useState(
    activeFarm?.district || districtProfiles[0]?.district_name || 'Namakkal'
  );
  const [reportSpecies, setReportSpecies] = useState(activeFarm?.farm_type || 'Poultry');
  const [reportPattern, setReportPattern] = useState('Mild drop in water & feed intake');

  const farmLogs = activeFarm
    ? store.farmLogs.filter((l) => l.farm_id === activeFarm.id)
    : [];

  const farmSignals =
    user?.role === 'farmer' && activeFarm
      ? evaluateFarmSignalAlerts(activeFarm, farmLogs, store.reviewedAlertIds)
      : [];

  const { aggregatedAlerts, suppressedClusters } = evaluateCommunityPatternAlerts(
    store.communityReports,
    store.reviewedAlertIds
  );

  const officialAlerts = store.officialAlerts;

  const combinedAlerts =
    activeTab === 'official'
      ? officialAlerts
      : activeTab === 'community'
      ? aggregatedAlerts
      : activeTab === 'farm_signal'
      ? farmSignals
      : [...farmSignals, ...aggregatedAlerts, ...officialAlerts];

  const handleCommunitySubmit = (e) => {
    e.preventDefault();
    submitCommunityReport({
      farm_id: activeFarm?.id || `demo-farm-${Date.now()}`,
      district: reportDistrict,
      species: reportSpecies,
      pattern_type: reportPattern,
    });
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Alerts &amp; Silent Signals
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Separated Official Bulletins (Demo), Anonymised Community Patterns (&ge; 3 farms rule),
            and Farm Signal Alerts.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F5F2] rounded-xl self-start">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'farm_signal', label: `Farm Signals (${farmSignals.length})` },
            { id: 'community', label: `Community (${aggregatedAlerts.length})` },
            { id: 'official', label: `Official Demo (${officialAlerts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Non-diagnostic Safety Notice */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          AgriShield does <strong className="text-slate-900">not</strong> diagnose ASF, HPAI, or
          any livestock disease. Signal alerts highlight unusual patterns in logs or anonymised
          clusters and advise consulting a qualified veterinarian.
        </p>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {combinedAlerts.length > 0 ? (
          combinedAlerts.map((alert) => {
            const categoryTitle =
              alert.alert_category === 'farm_signal'
                ? 'Farm Signal Alert'
                : alert.alert_category === 'community'
                ? 'Community Pattern Alert (Anonymised)'
                : 'Official Alert (Simulated Demo)';

            return (
              <article
                key={alert.id}
                className={`bg-white border rounded-2xl p-5 space-y-3 ${
                  alert.is_reviewed ? 'border-slate-200 opacity-75' : 'border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {alert.alert_category === 'official' ? (
                      <Megaphone className="w-4 h-4 text-[#0D3B26] shrink-0" />
                    ) : alert.alert_category === 'community' ? (
                      <Users className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-900">{categoryTitle}</span>
                    <span aria-hidden="true">·</span>
                    <span>{alert.severity}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{alert.issued_date}</span>
                    {alert.is_simulated && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-700 font-medium">Demo Data</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => markAlertReviewed(alert.id)}
                    disabled={alert.is_reviewed}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      alert.is_reviewed
                        ? 'bg-slate-100 text-slate-500 cursor-default'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{alert.is_reviewed ? 'Reviewed' : 'Mark as Reviewed'}</span>
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900">{alert.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{alert.message}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">Why this alert was generated</p>
                    <p className="text-slate-600 mt-0.5">{alert.trigger_reason}</p>
                    <p className="text-slate-500 mt-1">Source: {alert.source_name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Recommended Next Step</p>
                    <p className="text-slate-600 mt-0.5">{alert.next_step}</p>
                    {user?.role === 'farmer' && (
                      <Link
                        to="/vet-support"
                        className="inline-block mt-1.5 text-[#0D3B26] font-semibold hover:underline"
                      >
                        Consult Assigned Veterinarian →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-1.5">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">
              You&apos;re all caught up. No active alerts.
            </p>
            <p className="text-xs text-slate-500">
              Farm signals and anonymised 3-farm community patterns will appear here when triggered.
            </p>
          </div>
        )}
      </div>

      {/* Community Privacy Threshold Demonstrator */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            Community Pattern Privacy Rule (&ge; 3 Farms Threshold)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            To protect farmer privacy, single-farm community observations are never broadcast. An
            anonymised Community Pattern Alert only appears when at least{' '}
            <strong className="text-slate-900">3 distinct farms</strong> in the same district report a
            similar pattern within 14 days.
          </p>

          {suppressedClusters.length > 0 ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-slate-700">
                Currently Suppressed Clusters (Below 3-Farm Threshold):
              </p>
              {suppressedClusters.map((c, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#FAFBF9] border border-slate-200 px-3 py-2 text-xs text-slate-700 flex items-center justify-between"
                >
                  <span>
                    {c.district} · {c.species} · {c.patternType}
                  </span>
                  <span className="font-mono-tabular font-semibold text-amber-700">
                    {c.count} / 3 farms
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-700">
              All active regional clusters have met the 3-farm anonymity threshold.
            </p>
          )}
        </div>

        <form
          onSubmit={handleCommunitySubmit}
          className="lg:col-span-6 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6"
        >
          <h4 className="text-sm font-bold text-slate-900">
            Log Anonymised Community Observation (Demo)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">District</label>
              <select
                value={reportDistrict}
                onChange={(e) => setReportDistrict(e.target.value)}
                className={inputClass}
              >
                {districtProfiles.map((d) => (
                  <option key={d.district_name} value={d.district_name}>
                    {d.district_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Species</label>
              <select
                value={reportSpecies}
                onChange={(e) => setReportSpecies(e.target.value)}
                className={inputClass}
              >
                <option value="Poultry">Poultry</option>
                <option value="Pig">Pig</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observed Pattern
            </label>
            <input
              type="text"
              required
              value={reportPattern}
              onChange={(e) => setReportPattern(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#0D3B26] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#145235] transition-colors"
          >
            Submit Anonymised Report
          </button>
        </form>
      </section>
    </div>
  );
}
