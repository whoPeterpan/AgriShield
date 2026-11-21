import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, PlusCircle, Sprout } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function FarmRegistration() {
  const { user, myFarms, activeFarm, setActiveFarmId, districtProfiles, registerOrUpdateFarm } =
    useApp();
  const navigate = useNavigate();

  const [editingFarmId, setEditingFarmId] = useState(activeFarm?.id || null);
  const [form, setForm] = useState(() => ({
    farmer_name: activeFarm?.farmer_name || user?.full_name || '',
    farm_name: activeFarm?.farm_name || '',
    contact: activeFarm?.contact || user?.phone_or_email || '',
    state: activeFarm?.state || 'Assam',
    district: activeFarm?.district || districtProfiles[0]?.district_name || 'Kamrup Metro',
    farm_type: activeFarm?.farm_type || 'Pig',
    animal_count: activeFarm?.animal_count || 50,
    farm_size: activeFarm?.farm_size || '1 Acre',
    notes: activeFarm?.notes || '',
  }));

  const [error, setError] = useState('');

  const handleSelectFarmForEdit = (farm) => {
    setEditingFarmId(farm.id);
    setActiveFarmId(farm.id);
    setForm({
      farmer_name: farm.farmer_name,
      farm_name: farm.farm_name,
      contact: farm.contact,
      state: farm.state,
      district: farm.district,
      farm_type: farm.farm_type,
      animal_count: farm.animal_count,
      farm_size: farm.farm_size,
      notes: farm.notes || '',
    });
    setError('');
  };

  const handleStartNewFarm = () => {
    setEditingFarmId(null);
    setForm({
      farmer_name: user?.full_name || '',
      farm_name: '',
      contact: user?.phone_or_email || '',
      state: 'Assam',
      district: districtProfiles[0]?.district_name || 'Kamrup Metro',
      farm_type: 'Poultry',
      animal_count: 500,
      farm_size: '1 Shed',
      notes: '',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.farmer_name.trim() || !form.farm_name.trim() || !form.contact.trim()) {
      setError('Farmer name, farm name, and contact are required.');
      return;
    }
    if (Number(form.animal_count) < 1) {
      setError('Number of animals or birds must be at least 1.');
      return;
    }

    await registerOrUpdateFarm({
      id: editingFarmId || undefined,
      ...form,
    });
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Farm Registration &amp; Profiles
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Register a pig or poultry farm, or update your existing farm specifications.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartNewFarm}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D3B26] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#145235] transition-colors whitespace-nowrap shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Farm</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Registered Farms List */}
        <section className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Your Registered Farms</h3>
            <span className="text-xs tabular-nums text-slate-500">{myFarms.length}</span>
          </div>

          {myFarms.length > 0 ? (
            <div className="space-y-2">
              {myFarms.map((farm) => {
                const isSelected = editingFarmId === farm.id;
                return (
                  <button
                    key={farm.id}
                    type="button"
                    onClick={() => handleSelectFarmForEdit(farm)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-emerald-700 bg-[#EEF5F0]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {farm.farm_name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#0D3B26] shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {farm.farm_type} · {farm.district} ·{' '}
                      <span className="tabular-nums">{farm.animal_count}</span> head/birds
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-[#FAFBF9] p-6 text-center space-y-2">
              <Sprout className="w-6 h-6 text-[#0D3B26] mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No farms registered yet</p>
              <p className="text-xs text-slate-500">
                Complete the form on the right to register your first unit.
              </p>
            </div>
          )}
        </section>

        {/* Registration Form */}
        <section className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-[#0D3B26]" />
            <h3 className="text-base font-bold text-slate-900">
              {editingFarmId ? 'Edit Farm Details' : 'Register New Pig or Poultry Farm'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Farmer Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.farmer_name}
                  onChange={(e) => setForm({ ...form, farmer_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Farm Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.farm_name}
                  onChange={(e) => setForm({ ...form, farm_name: e.target.value })}
                  placeholder="e.g. Green Valley Piggery"
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number or Email *
                </label>
                <input
                  type="text"
                  required
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Farm Type (Species) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Pig', 'Poultry'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, farm_type: type })}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors ${
                        form.farm_type === type
                          ? 'border-emerald-700 bg-[#EEF5F0] text-[#0D3B26]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {type} Farm
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  District (Local Epidemiology Profile) *
                </label>
                <select
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                >
                  {districtProfiles.map((d) => (
                    <option key={d.district_name} value={d.district_name}>
                      {d.district_name} ({d.state_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Number of {form.farm_type === 'Pig' ? 'Pigs' : 'Birds'} *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.animal_count}
                  onChange={(e) => setForm({ ...form, animal_count: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm tabular-nums focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Farm Size / Shed Capacity *
                </label>
                <input
                  type="text"
                  required
                  value={form.farm_size}
                  onChange={(e) => setForm({ ...form, farm_size: e.target.value })}
                  placeholder="e.g. 1.5 Acres / 2 Sheds"
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Basic Farm Information (Sheds, Fencing, Water Source)
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Describe shed structure, fencing, and water setup..."
                className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="rounded-xl bg-[#0D3B26] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#145235] transition-colors"
              >
                {editingFarmId ? 'Save Farm Changes' : 'Register Farm & Open Dashboard'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
