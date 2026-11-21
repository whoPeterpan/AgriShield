import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle, RefreshCw, Search } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const LOG_TYPES = [
  { value: 'visitor', label: 'Visitor Entry' },
  { value: 'cleaning', label: 'Cleaning & Disinfection' },
  { value: 'mortality', label: 'Mortality Record' },
  { value: 'animal_movement', label: 'Animal Movement' },
  { value: 'observation', label: 'Daily Observation' },
];

export default function FarmRecordsPage() {
  const { store, activeFarm, isOnline, offlineQueue, addFarmLog, syncOfflineQueue } = useApp();

  const [logType, setLogType] = useState('cleaning');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [numericValue, setNumericValue] = useState(0);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const farmLogs = useMemo(() => {
    if (!activeFarm) return [];
    return store.farmLogs
      .filter((l) => l.farm_id === activeFarm.id)
      .filter((l) => filterType === 'all' || l.log_type === filterType)
      .filter((l) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.log_date.includes(q)
        );
      })
      .sort((a, b) => b.log_date.localeCompare(a.log_date));
  }, [store.farmLogs, activeFarm, filterType, searchQuery]);

  if (!activeFarm) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF5F0] text-[#0D3B26] flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          No records yet. Start by registering your first farm.
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Add your farm profile to start logging daily visitors, shed cleaning, mortality counts,
          and animal movements—even offline.
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

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !details.trim()) {
      setError('Please enter both a record title and details.');
      return;
    }

    await addFarmLog({
      farm_id: activeFarm.id,
      log_type: logType,
      log_date: logDate,
      title,
      details,
      numeric_value: Number(numericValue || 0),
    });

    setTitle('');
    setDetails('');
    setNumericValue(0);
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Farm Record Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track visitors, cleaning, mortality, animal movements, and daily observations for{' '}
            {activeFarm.farm_name}.
          </p>
        </div>

        {offlineQueue.length > 0 && (
          <button
            type="button"
            onClick={syncOfflineQueue}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync {offlineQueue.length} Queued Record(s)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Add New Record Form */}
        <section className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#0D3B26]" />
              <span>Add Biosecurity Record</span>
            </h3>
            {!isOnline && (
              <span className="text-[11px] font-medium text-amber-700">Offline Queue Ready</span>
            )}
          </div>

          <form onSubmit={handleAddRecord} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Record Type</label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className={inputClass}
              >
                {LOG_TYPES.map((tOpt) => (
                  <option key={tOpt.value} value={tOpt.value}>
                    {tOpt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className={`${inputClass} tabular-nums`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Summary Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  logType === 'visitor'
                    ? 'e.g. Feed Truck Delivery (Outside Gate)'
                    : logType === 'mortality'
                    ? 'e.g. Grower Pen Mortality Check'
                    : 'e.g. Shed 1 Disinfection & Footbath Refresh'
                }
                className={inputClass}
              />
            </div>

            {(logType === 'mortality' || logType === 'animal_movement' || logType === 'visitor') && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {logType === 'mortality'
                    ? 'Number of Deaths'
                    : logType === 'animal_movement'
                    ? 'Number of Animals Moved'
                    : 'Number of Visitors'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={numericValue}
                  onChange={(e) => setNumericValue(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Details &amp; Action Taken *
              </label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Enter disinfectant used, visitor purpose, or disposal method..."
                className={inputClass}
              />
            </div>

            {error && <p className="text-xs text-rose-700">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#0D3B26] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#145235] transition-colors"
            >
              {isOnline ? 'Save Farm Record' : 'Queue Record Offline'}
            </button>
          </form>
        </section>

        {/* Searchable & Filterable Records Table */}
        <section className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs by title, date, or notes..."
                className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter record type"
              className="rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
            >
              <option value="all">All Record Types</option>
              {LOG_TYPES.map((tOpt) => (
                <option key={tOpt.value} value={tOpt.value}>
                  {tOpt.label}
                </option>
              ))}
            </select>
          </div>

          {farmLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 pr-3 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">Type</th>
                    <th className="py-2.5 px-3 font-medium">Record &amp; Details</th>
                    <th className="py-2.5 pl-3 font-medium text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {farmLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-3 text-xs font-mono-tabular text-slate-600 whitespace-nowrap align-top">
                        {log.log_date}
                        {log.created_offline && (
                          <span className="block text-[10px] text-amber-700 font-sans font-medium">
                            Queued offline
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#0D3B26] font-medium capitalize whitespace-nowrap align-top">
                        {log.log_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 align-top">
                        <p className="font-semibold text-slate-900">{log.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{log.details}</p>
                      </td>
                      <td className="py-3 pl-3 text-right font-mono-tabular text-xs text-slate-900 align-top">
                        {log.numeric_value > 0 ? log.numeric_value : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 bg-[#FAFBF9] rounded-xl text-sm text-slate-500">
              No records match your current filter. Add a new record using the form.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
