import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Info,
  MapPin,
  RotateCcw,
  Save,
  Volume2,
  VolumeX,
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
import { calculateBiosecurityScore } from '../utils/riskScoring.js';
import { isSpeechSupported, speakText, stopSpeaking, t } from '../utils/translations.js';

const ANSWER_OPTIONS = ['Yes', 'Partially', 'No', 'Not Applicable'];

export default function AssessmentPage() {
  const {
    language,
    store,
    activeFarm,
    districtProfiles,
    getQuestionsForFarmType,
    saveAssessmentDraft,
    loadAssessmentDraft,
    submitAssessment,
  } = useApp();

  const navigate = useNavigate();
  const isHi = language === 'hi';

  const questions = useMemo(
    () => getQuestionsForFarmType(activeFarm?.farm_type || 'Pig'),
    [activeFarm?.farm_type, getQuestionsForFarmType]
  );

  const [selectedDistrict, setSelectedDistrict] = useState(
    activeFarm?.district || districtProfiles[0]?.district_name || 'Kamrup Metro'
  );
  const [answers, setAnswers] = useState({});
  const [speakingId, setSpeakingId] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Load saved draft or latest completed answers; otherwise start completely fresh ({})
  useEffect(() => {
    if (!activeFarm) return;
    setValidationError('');
    const draft = loadAssessmentDraft(activeFarm.id);
    if (draft) {
      setSelectedDistrict(draft.districtName || activeFarm.district);
      setAnswers(draft.answers || {});
      return;
    }
    const latestAudit = store.audits.find((a) => a.farm_id === activeFarm.id);
    setSelectedDistrict(activeFarm.district);
    if (latestAudit?.answers) {
      setAnswers(latestAudit.answers);
    } else {
      setAnswers({});
    }
  }, [activeFarm?.id]);

  const currentDistrictProfile = useMemo(
    () =>
      districtProfiles.find((d) => d.district_name === selectedDistrict) || districtProfiles[0],
    [districtProfiles, selectedDistrict]
  );

  // Live dynamic risk calculation reacting immediately to answers AND district selection
  const liveScore = useMemo(
    () =>
      calculateBiosecurityScore(
        questions,
        answers,
        activeFarm?.farm_type || 'Pig',
        currentDistrictProfile
      ),
    [questions, answers, activeFarm?.farm_type, currentDistrictProfile]
  );

  // Side-by-side Low vs High epidemiological district comparison for the exact current answers
  const districtComparison = useMemo(() => {
    if (liveScore.overallScore === null) return null;
    const farmType = activeFarm?.farm_type || 'Pig';
    const lowDistrict =
      districtProfiles.find((d) =>
        farmType === 'Pig' ? d.asf_risk_level === 'Low' : d.hpai_risk_level === 'Low'
      ) || districtProfiles[0];
    const highDistrict =
      districtProfiles.find((d) =>
        farmType === 'Pig' ? d.asf_risk_level === 'High' : d.hpai_risk_level === 'High'
      ) || districtProfiles[0];

    if (!lowDistrict || !highDistrict || lowDistrict.district_name === highDistrict.district_name) {
      return null;
    }

    const lowScore = calculateBiosecurityScore(questions, answers, farmType, lowDistrict);
    const highScore = calculateBiosecurityScore(questions, answers, farmType, highDistrict);
    return {
      lowDistrict,
      highDistrict,
      lowScore: lowScore.overallScore,
      highScore: highScore.overallScore,
      lowPoints: lowScore.totalWeightedRiskPoints,
      highPoints: highScore.totalWeightedRiskPoints,
    };
  }, [liveScore.overallScore, activeFarm?.farm_type, districtProfiles, questions, answers]);

  const handleSelectAnswer = (code, opt) => {
    setValidationError('');
    setAnswers((prev) => ({ ...prev, [code]: opt }));
  };

  const handleClearAnswers = () => {
    setAnswers({});
    setValidationError('');
  };

  const handleToggleSpeak = (q) => {
    if (speakingId === q.question_code) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    const textToRead = isHi && q.question_text_hi ? q.question_text_hi : q.question_text;
    setSpeakingId(q.question_code);
    speakText(textToRead, language, () => setSpeakingId(null));
  };

  const handleSaveAndFinish = async () => {
    if (!activeFarm) return;
    if (liveScore.unansweredCount > 0) {
      setValidationError(
        isHi
          ? `कृपया सहेजने से पहले सभी ${liveScore.unansweredCount} बकाया प्रश्नों के उत्तर दें।`
          : `Please answer all ${liveScore.unansweredCount} remaining question(s) before submitting.`
      );
      const firstUnanswered = liveScore.questionBreakdowns.find((q) => !q.isAnswered);
      if (firstUnanswered) {
        const el = document.getElementById(`question-card-${firstUnanswered.question_code}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    await submitAssessment(activeFarm.id, selectedDistrict, answers, liveScore);
    navigate('/action-plan');
  };

  if (!activeFarm) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center space-y-3">
        <ClipboardCheck className="w-8 h-8 text-[#0D3B26] mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">
          No records yet. Start by registering your first farm.
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Register your pig or poultry unit so FarmShield Local can load the matching 10-control
          checklist and district risk weights.
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

  const completionPct =
    liveScore.totalCount > 0
      ? Math.round((liveScore.answeredCount / liveScore.totalCount) * 100)
      : 0;

  const scoreToneClass =
    liveScore.overallScore === null
      ? 'text-slate-400'
      : liveScore.overallScore <= 24
      ? 'text-emerald-700'
      : liveScore.overallScore <= 49
      ? 'text-amber-700'
      : liveScore.overallScore <= 74
      ? 'text-orange-700'
      : 'text-rose-700';

  return (
    <div className="space-y-6">
      {/* Header & Local Epidemiology Selector */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">
              FarmShield Local · {activeFarm.farm_type} Biosecurity Assessment
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{activeFarm.farm_name}</h2>
          </div>

          <div className="w-full lg:w-80">
            <label
              htmlFor="district-epi-select"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t(language, 'districtLabel')}</span>
            </label>
            <select
              id="district-epi-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {districtProfiles.map((d) => (
                <option key={d.district_name} value={d.district_name}>
                  {d.district_name} ({d.state_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Simulated District Profile Strip */}
        {currentDistrictProfile && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-slate-500">Demo ASF Pressure (Pigs)</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {currentDistrictProfile.asf_risk_level}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Demo HPAI Pressure (Poultry)</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {currentDistrictProfile.hpai_risk_level}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Seasonal Hygiene Risk</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {currentDistrictProfile.seasonal_risk}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Source &amp; Last Updated</p>
              <p className="font-medium text-slate-700 mt-0.5">
                {currentDistrictProfile.source_name} · {currentDistrictProfile.last_updated}
              </p>
            </div>
            <p className="md:col-span-4 text-slate-600 pt-2 border-t border-slate-200">
              Local context: {currentDistrictProfile.environmental_factor}. Switch districts above to
              see how local disease pressure adjusts question weights and score priorities.
            </p>
          </div>
        )}

        {/* Completion Progress Bar */}
        <div className="pt-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-700">
              {isHi ? 'प्रश्नावली प्रगति' : 'Assessment Progress'}:{' '}
              <strong className="tabular-nums text-slate-900">
                {liveScore.answeredCount} / {liveScore.totalCount}
              </strong>{' '}
              ({completionPct}%)
            </span>
            {liveScore.answeredCount > 0 && (
              <button
                type="button"
                onClick={handleClearAnswers}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isHi ? 'सभी उत्तर साफ़ करें' : 'Clear Answers'}</span>
              </button>
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-[#EEF5F0] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0D3B26] transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Split: Questions on Left, Live Explainable Score on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Questionnaire */}
        <div className="lg:col-span-7 space-y-4">
          {liveScore.questionBreakdowns.map((item, idx) => {
            const fullQ = questions[idx];
            const displayQuestion =
              isHi && item.question_text_hi ? item.question_text_hi : item.question_text;

            return (
              <div
                key={item.question_code}
                id={`question-card-${item.question_code}`}
                className={`bg-white border rounded-2xl p-5 space-y-3 transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${
                  item.isAnswered ? 'border-slate-200' : 'border-slate-300/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      {item.question_code} · {item.category} · Base Weight{' '}
                      <span className="tabular-nums">{item.baseWeight}</span>
                      {item.multiplier > 1 && (
                        <span className="text-amber-700 font-semibold">
                          {' '}
                          · Local Multiplier x{item.multiplier}
                        </span>
                      )}
                      {!item.isAnswered && (
                        <span className="text-slate-400 font-medium"> · Unanswered</span>
                      )}
                    </p>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      {displayQuestion}
                    </h3>
                  </div>

                  {isSpeechSupported() && (
                    <button
                      type="button"
                      onClick={() => handleToggleSpeak(fullQ)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                      aria-label={t(language, 'speak')}
                      title={t(language, 'speak')}
                    >
                      {speakingId === item.question_code ? (
                        <VolumeX className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Answer Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ANSWER_OPTIONS.map((opt) => {
                    const active = item.answer === opt;
                    const label =
                      opt === 'Yes'
                        ? t(language, 'yes')
                        : opt === 'Partially'
                        ? t(language, 'partially')
                        : opt === 'No'
                        ? t(language, 'no')
                        : t(language, 'na');

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAnswer(item.question_code, opt)}
                        className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-colors min-h-[44px] ${
                          active
                            ? opt === 'Yes'
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                              : opt === 'Partially'
                              ? 'border-amber-600 bg-amber-50 text-amber-900'
                              : opt === 'No'
                              ? 'border-rose-600 bg-rose-50 text-rose-900'
                              : 'border-slate-700 bg-slate-100 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Reference */}
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <p>{item.explanation}</p>
                  {item.multiplierReasons.length > 0 && (
                    <p className="text-amber-800 font-medium">
                      Local adjustment: {item.multiplierReasons.join(' · ')}
                    </p>
                  )}
                  <p className="text-slate-400">
                    Reference: {item.reference_source} · Risk contribution:{' '}
                    <span className="font-mono-tabular text-slate-700">
                      {item.isAnswered
                        ? item.isApplicable
                          ? `${item.weightedRiskPoints} / ${item.effectiveWeight} pts`
                          : 'Excluded (N/A)'
                        : `Pending (max ${item.effectiveWeight} pts)`}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Live Score & Explainability Panel */}
        <aside className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Live Weighted Risk Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-4xl font-bold tabular-nums ${scoreToneClass}`}>
                    {liveScore.overallScore !== null ? liveScore.overallScore : '—'}
                  </span>
                  <span className="text-sm text-slate-400 tabular-nums">/ 100</span>
                </div>
                <p className={`text-sm font-semibold mt-1 ${scoreToneClass}`}>
                  {liveScore.riskCategory}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono-tabular">
                <p>Answered: {liveScore.answeredCount}/{liveScore.totalCount}</p>
                <p>Weighted Pts: {liveScore.totalWeightedRiskPoints}</p>
                <p>Base Weight: {liveScore.totalApplicableBaseWeight}</p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>{t(language, 'disclaimerThreshold')}</span>
            </div>

            {liveScore.overallScore === null ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center space-y-1.5">
                <p className="text-sm font-medium text-slate-700">
                  {isHi ? 'आकलन शुरू करने के लिए उत्तर चुनें' : 'Select answers to start live scoring'}
                </p>
                <p className="text-xs text-slate-500">
                  {isHi
                    ? 'फार्मशील्ड प्रत्येक उत्तर के साथ वास्तविक समय में जोखिम की गणना करता है।'
                    : 'FarmShield starts from a clean slate and updates scores as you answer each control.'}
                </p>
              </div>
            ) : (
              <>
                {/* Category Scores Mini Chart */}
                {liveScore.categoryScores.length > 0 && (
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={liveScore.categoryScores.map((c) => ({
                          name: c.category.split(' ')[0],
                          score: c.score,
                        }))}
                        margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#475569' }} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Risk']} />
                        <Bar dataKey="score" fill="#15803d" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Transparent Explanation: Why Score Was Generated */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-900">
                    {t(language, 'whyScoreTitle')}
                  </h4>
                  <p className="text-xs text-slate-600">
                    Formula: min(100, ({liveScore.totalWeightedRiskPoints} ÷{' '}
                    {liveScore.totalApplicableBaseWeight}) × 100) ={' '}
                    <strong className="tabular-nums">{liveScore.overallScore}%</strong>
                  </p>

                  {liveScore.topThreeFactors.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-medium text-slate-700">
                        Top {liveScore.topThreeFactors.length} Contributing Risk(s):
                      </p>
                      {liveScore.topThreeFactors.map((factor, idx) => (
                        <div
                          key={factor.question_code}
                          className="text-xs rounded-lg bg-slate-50 border border-slate-200 p-2.5"
                        >
                          <div className="flex items-center justify-between font-medium text-slate-900">
                            <span>
                              {idx + 1}. {factor.category}
                            </span>
                            <span className="font-mono-tabular text-amber-800">
                              +{factor.weightedRiskPoints} pts
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1">{factor.corrective_action}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 font-medium">
                      All answered controls are currently satisfied!
                    </p>
                  )}
                </div>

                {/* District Impact Comparison */}
                {districtComparison && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-900">
                      Local Epidemiology Sensitivity (Same Answers)
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-slate-500 truncate">
                          Low-Risk ({districtComparison.lowDistrict.district_name})
                        </p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                          {districtComparison.lowScore}/100{' '}
                          <span className="text-[11px] font-normal text-slate-500">
                            ({districtComparison.lowPoints} pts)
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
                        <p className="text-amber-900 truncate">
                          High-Risk ({districtComparison.highDistrict.district_name})
                        </p>
                        <p className="text-sm font-bold text-amber-950 tabular-nums mt-0.5">
                          {districtComparison.highScore}/100{' '}
                          <span className="text-[11px] font-normal text-amber-800">
                            ({districtComparison.highPoints} pts)
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {validationError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() =>
                  saveAssessmentDraft(activeFarm.id, selectedDistrict, answers)
                }
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>{t(language, 'saveDraft')}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndFinish}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D3B26] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#145335] transition-colors min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t(language, 'submitAudit')}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
