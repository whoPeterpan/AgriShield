import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, Circle, FileImage, Info, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { evaluateCompartmentReadiness } from '../utils/readinessLadder.js';
import { t } from '../utils/translations.js';

const EVIDENCE_CATEGORIES = [
  'Footbath Setup',
  'Cleaning Log',
  'Visitor Register',
  'Fencing & Netting',
  'Waste Disposal',
  'Other',
];

export default function ReadinessAndEvidence() {
  const { language, store, activeFarm, uploadEvidence } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Footbath Setup');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!activeFarm) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center space-y-3">
        <Award className="w-8 h-8 text-[#0D3B26] mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">
          Compartment Readiness: 0% — Register your first farm
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Add a pig or poultry unit to unlock Bronze, Silver, and Gold biosecurity readiness
          milestones and upload proof photos.
        </p>
        <Link
          to="/farm-profile"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D3B26] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#145235]"
        >
          Register Farm Now
        </Link>
      </div>
    );
  }

  const farmAudits = store.audits.filter((a) => a.farm_id === activeFarm.id);
  const farmLogs = store.farmLogs.filter((l) => l.farm_id === activeFarm.id);
  const farmEvidence = store.evidenceItems.filter((e) => e.farm_id === activeFarm.id);

  const readiness = evaluateCompartmentReadiness({
    farm: activeFarm,
    audits: farmAudits,
    logs: farmLogs,
    evidence: farmEvidence,
  });

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Please enter a title describing this evidence item.');
      return;
    }
    setUploading(true);
    await uploadEvidence(activeFarm.id, {
      title,
      category,
      file: selectedFile,
    });
    setTitle('');
    setSelectedFile(null);
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* Compartment Readiness Overview */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">
              Compartment-Ready Ladder · {activeFarm.farm_name}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0D3B26]" />
              <span>Current Readiness Tier: {readiness.currentLevel}</span>
            </h2>
          </div>

          <div className="text-left md:text-right">
            <p className="text-3xl font-bold tabular-nums text-[#0D3B26]">
              {readiness.readinessPercentage}%
            </p>
            <p className="text-xs text-slate-500">
              {readiness.completedCount} of {readiness.totalCount} milestones met · Next:{' '}
              {readiness.nextLevel}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#EEF5F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0D3B26] transition-all duration-300"
            style={{ width: `${readiness.readinessPercentage}%` }}
          />
        </div>

        {/* Explicit Internal Readiness Disclaimer */}
        <div className="rounded-xl bg-[#FAFBF9] border border-slate-200 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>{t(language, 'disclaimerReadiness')} {readiness.disclaimer}</p>
        </div>

        {/* 3-Tier Ladder Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {['Bronze', 'Silver', 'Gold'].map((tier) => {
            const items = readiness.checklist.filter((c) => c.level === tier);
            const done = items.filter((c) => c.completed).length;
            return (
              <div key={tier} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900">{tier} Readiness</h3>
                  <span className="text-xs font-mono-tabular text-slate-600">
                    {done}/{items.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-xs">
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={item.completed ? 'font-medium text-slate-900' : 'text-slate-600'}>
                          {item.title}
                        </p>
                        <p className="text-slate-500 mt-0.5">{item.detail}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ref: {item.reference}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Evidence Locker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#15803D]" />
            <h3 className="text-base font-semibold text-slate-900">Upload Evidence</h3>
          </div>
          <p className="text-xs text-slate-500">
            Attach photos of footbaths, perimeter wire mesh, cleaning logs, or waste pits to build
            your Silver and Gold Compartment Readiness portfolio.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Evidence Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. East Shed Bird-Proof Wire Mesh"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Control Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {EVIDENCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Photo or Document File
              </label>
              <input
                type="file"
                accept="image/*,.pdf,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            {error && <p className="text-xs text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-xl bg-[#0D3B26] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#145335] disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Saving Evidence...' : 'Add to Evidence Locker'}
            </button>
          </form>
        </section>

        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Evidence Locker ({farmEvidence.length})
            </h3>
            <span className="text-xs text-slate-500">Stored locally or in Supabase Storage</span>
          </div>

          {farmEvidence.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {farmEvidence.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50"
                >
                  <div className="h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {item.file_url &&
                    (item.file_url.startsWith('data:image') ||
                      item.file_url.endsWith('.jpg') ||
                      item.file_url.endsWith('.png') ||
                      item.file_url.startsWith('http')) ? (
                      <img
                        src={item.file_url}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileImage className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-500">
                      {item.category} ·{' '}
                      <span className="tabular-nums">
                        {new Date(item.uploaded_at).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.file_name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg text-sm text-slate-500">
              No evidence files uploaded yet for this farm.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
