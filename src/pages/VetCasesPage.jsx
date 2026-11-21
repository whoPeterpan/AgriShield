import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Info, Send, Stethoscope } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const CASE_STATUSES = ['New', 'Under Review', 'Response Sent', 'Closed'];

export default function VetCasesPage() {
  const { user, store, activeFarm, submitVetCase, updateVetCase } = useApp();
  const isVet = user?.role === 'veterinarian';

  const [concernTitle, setConcernTitle] = useState('');
  const [concernDesc, setConcernDesc] = useState('');
  const [obsDate, setObsDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [farmObs, setFarmObs] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [formError, setFormError] = useState('');

  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCaseId, setSelectedCaseId] = useState(store.vetCases[0]?.id || null);
  const [vetReply, setVetReply] = useState('');
  const [nextStatus, setNextStatus] = useState('Response Sent');

  const baseCases = useMemo(() => {
    if (isVet) return store.vetCases;
    if (!activeFarm) return [];
    return store.vetCases.filter((c) => c.farm_id === activeFarm.id);
  }, [isVet, store.vetCases, activeFarm]);

  const visibleCases = useMemo(
    () => baseCases.filter((c) => statusFilter === 'All' || c.status === statusFilter),
    [baseCases, statusFilter]
  );

  const vetMetrics = useMemo(() => {
    const pending = baseCases.filter((c) => c.status === 'New').length;
    const underReview = baseCases.filter((c) => c.status === 'Under Review').length;
    const resolved = baseCases.filter(
      (c) => c.status === 'Response Sent' || c.status === 'Closed'
    ).length;
    return {
      total: baseCases.length,
      pending,
      open: pending + underReview,
      resolved,
    };
  }, [baseCases]);

  const selectedCase =
    visibleCases.find((c) => c.id === selectedCaseId) || visibleCases[0] || null;
  const selectedCaseFarm = selectedCase
    ? store.farms.find((f) => f.id === selectedCase.farm_id)
    : null;
  const selectedCaseLogs = selectedCaseFarm
    ? store.farmLogs
        .filter((l) => l.farm_id === selectedCaseFarm.id)
        .sort((a, b) => b.log_date.localeCompare(a.log_date))
        .slice(0, 5)
    : [];

  const assignedFarms = useMemo(
    () => store.farms.filter((f) => f.assigned_vet_id === 'demo-vet-1' || isVet),
    [store.farms, isVet]
  );

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFarmerSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!activeFarm) {
      setFormError('Register or select a farm first before sending a case.');
      return;
    }
    if (!concernTitle.trim() || !concernDesc.trim()) {
      setFormError('Please provide a concern summary and description.');
      return;
    }

    const created = submitVetCase({
      farm_id: activeFarm.id,
      concern_title: concernTitle,
      concern_description: concernDesc,
      observation_date: obsDate,
      farm_observations: farmObs,
      photo_url: photoPreview,
    });
    setSelectedCaseId(created.id);
    setConcernTitle('');
    setConcernDesc('');
    setFarmObs('');
    setPhotoPreview('');
  };

  const handleVetResponseSubmit = (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    updateVetCase(selectedCase.id, {
      status: nextStatus,
      vet_response: vetReply.trim() || selectedCase.vet_response,
    });
    setVetReply('');
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15';

  if (!isVet && !activeFarm) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF5F0] text-[#0D3B26] flex items-center justify-center mx-auto">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          No records yet. Start by registering your first farm.
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Register your pig or poultry unit first so your veterinarian receives full herd context
          and sanitation logs with your consultation request.
        </p>
        <Link
          to="/farm-profile"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D3B26] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#145235] transition-colors"
        >
          Register Farm Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#0D3B26]" />
            <span>{isVet ? 'Veterinarian Case & Advisory Desk' : 'Veterinarian Support'}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isVet
              ? 'Review assigned farm observations, update case statuses, and send practical guidance.'
              : 'Submit farm observations and photos to your assigned veterinarian and track advice.'}
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F5F2] rounded-xl self-start">
          {['All', ...CASE_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Explicit Non-Diagnostic Governance Note */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#0D3B26] shrink-0 mt-0.5" />
        <p>
          Advisory workflow only: AgriShield supports communication between farmers and
          veterinarians. The application never automatically confirms or diagnoses a disease without
          clinical inspection and laboratory confirmation.
        </p>
      </div>

      {/* Veterinarian 4-Card KPI Strip (Starts at 0 when fresh) */}
      {isVet && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500">Assigned Cases</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900 mt-1.5">
              {vetMetrics.total}
            </p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {assignedFarms.length} assigned farm(s)
            </p>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500">Pending (New)</p>
            <p className="text-3xl font-bold tabular-nums text-amber-700 mt-1.5">
              {vetMetrics.pending}
            </p>
            <p className="text-xs text-slate-500 mt-1">Awaiting initial review</p>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500">Open Cases</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900 mt-1.5">
              {vetMetrics.open}
            </p>
            <p className="text-xs text-slate-500 mt-1">New + Under Review</p>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500">Resolved / Responded</p>
            <p className="text-3xl font-bold tabular-nums text-emerald-700 mt-1.5">
              {vetMetrics.resolved}
            </p>
            <p className="text-xs text-slate-500 mt-1">Guidance sent or closed</p>
          </div>
        </div>
      )}

      {/* Veterinarian Assigned Farms Strip */}
      {isVet && (
        <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Assigned Farms Requiring Monitoring ({assignedFarms.length})
          </h3>
          {assignedFarms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedFarms.slice(0, 6).map((farm) => {
                const latestAudit = store.audits.find((a) => a.farm_id === farm.id);
                const openCount = store.vetCases.filter(
                  (c) => c.farm_id === farm.id && c.status !== 'Closed'
                ).length;
                return (
                  <div
                    key={farm.id}
                    className="bg-[#FAFBF9] border border-slate-200 rounded-xl p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 truncate">{farm.farm_name}</span>
                      <span className="tabular-nums font-semibold text-[#0D3B26]">
                        {farm.farm_type}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {farm.district} · Risk:{' '}
                      <strong className="tabular-nums text-slate-900">
                        {latestAudit ? `${latestAudit.overall_risk_score}/100` : 'Not assessed'}
                      </strong>{' '}
                      · Open cases: <strong className="tabular-nums text-slate-900">{openCount}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">
              No assigned farms in this demo session yet. Farms registered in the Farmer workspace
              appear here dynamically.
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Farmer Submission Form OR Veterinarian Case Queue */}
        <div className="lg:col-span-5 space-y-6">
          {!isVet && (
            <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Submit New Vet Case</h3>
              <form onSubmit={handleFarmerSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Concern Summary *
                  </label>
                  <input
                    type="text"
                    required
                    value={concernTitle}
                    onChange={(e) => setConcernTitle(e.target.value)}
                    placeholder="e.g. Reduced feed intake in Shed 2"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date of Observation *
                  </label>
                  <input
                    type="date"
                    required
                    value={obsDate}
                    onChange={(e) => setObsDate(e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={concernDesc}
                    onChange={(e) => setConcernDesc(e.target.value)}
                    placeholder="Describe observed behaviour, duration, and affected pen/shed..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Recent Farm Observations (Mortality / Feed / Visitors)
                  </label>
                  <input
                    type="text"
                    value={farmObs}
                    onChange={(e) => setFarmObs(e.target.value)}
                    placeholder="e.g. 2 mortalities yesterday; footbath refreshed"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Optional Photo Attachment
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border file:border-slate-200 file:bg-[#EEF5F0] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0D3B26]"
                  />
                </div>

                {formError && <p className="text-xs text-rose-700">{formError}</p>}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D3B26] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#145235] transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Case to Veterinarian</span>
                </button>
              </form>
            </section>
          )}

          {/* Case List */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              {isVet ? 'Farmer Case Queue' : 'Your Submitted Cases'} ({visibleCases.length})
            </h3>
            {visibleCases.length > 0 ? (
              <div className="space-y-2">
                {visibleCases.map((c) => {
                  const farm = store.farms.find((f) => f.id === c.farm_id);
                  const active = selectedCase?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        setNextStatus(c.status === 'New' ? 'Under Review' : c.status);
                      }}
                      className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                        active
                          ? 'border-emerald-700 bg-[#EEF5F0]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-bold text-[#0D3B26]">{c.status}</span>
                        <span className="tabular-nums">{c.observation_date}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1">{c.concern_title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">
                        {farm ? `${farm.farm_name} (${farm.farm_type})` : 'Farm'}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-[#FAFBF9] py-8 px-4 text-center text-xs text-slate-500">
                {isVet
                  ? 'Your cases will appear here when farmers request assistance.'
                  : 'No cases submitted yet. Use the form above if you notice an issue on your farm.'}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Case Detail & Veterinarian Response Workspace */}
        <section className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5">
          {selectedCase ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">
                    Case ID: {selectedCase.id} · Observed{' '}
                    <span className="tabular-nums">{selectedCase.observation_date}</span>
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedCase.concern_title}
                  </h3>
                  {selectedCaseFarm && (
                    <p className="text-xs text-slate-600 mt-1">
                      {selectedCaseFarm.farm_name} · {selectedCaseFarm.farm_type} (
                      {selectedCaseFarm.animal_count} head/birds) · {selectedCaseFarm.district}
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold text-[#0D3B26] whitespace-nowrap">
                  Status: {selectedCase.status}
                </span>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Reported Description</p>
                  <p className="mt-1 leading-relaxed">{selectedCase.concern_description}</p>
                </div>

                {selectedCase.farm_observations && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Farm Observations</p>
                    <p className="mt-1 text-xs text-slate-600">{selectedCase.farm_observations}</p>
                  </div>
                )}

                {selectedCase.photo_url && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Attached Photo</p>
                    <img
                      src={selectedCase.photo_url}
                      alt="Farmer attached case observation"
                      referrerPolicy="no-referrer"
                      className="max-h-56 rounded-xl border border-slate-200 object-cover"
                    />
                  </div>
                )}
              </div>

              {selectedCaseLogs.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-900">
                    Recent Farm Logs ({selectedCaseFarm?.farm_name})
                  </p>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl px-3.5 bg-[#FAFBF9]">
                    {selectedCaseLogs.map((log) => (
                      <div key={log.id} className="py-2.5 text-xs flex justify-between gap-3">
                        <div>
                          <span className="font-semibold text-[#0D3B26] capitalize">
                            {log.log_type}:
                          </span>{' '}
                          <span className="text-slate-700">{log.title}</span>
                        </div>
                        <span className="font-mono-tabular text-slate-500 shrink-0">
                          {log.log_date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Veterinarian Guidance</span>
                </p>
                {selectedCase.vet_response ? (
                  <div className="rounded-xl bg-[#EEF5F0] border border-emerald-200 p-4 text-sm text-slate-800 leading-relaxed">
                    {selectedCase.vet_response}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Awaiting veterinarian response. Keep affected animals isolated in the meantime.
                  </p>
                )}
              </div>

              {isVet && (
                <form
                  onSubmit={handleVetResponseSubmit}
                  className="pt-4 border-t border-slate-100 space-y-3"
                >
                  <h4 className="text-sm font-bold text-slate-900">
                    Update Status &amp; Send Advice
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Case Status
                      </label>
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value)}
                        className={inputClass}
                      >
                        {CASE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Advisory Response to Farmer
                    </label>
                    <textarea
                      rows={3}
                      value={vetReply}
                      onChange={(e) => setVetReply(e.target.value)}
                      placeholder="Write practical biosecurity and isolation guidance or schedule a farm visit..."
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#0D3B26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#145235] transition-colors"
                  >
                    Save Case Update
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="py-16 text-center space-y-2">
              <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900">
                {isVet
                  ? 'Your cases will appear here when farmers request assistance.'
                  : 'Select or submit a case to view veterinarian guidance.'}
              </p>
              <p className="text-xs text-slate-500">
                {isVet
                  ? 'Pending, open, and resolved farmer consultations all begin at zero in a fresh demo.'
                  : 'Attach observations and optional photos to get preventive feedback.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
