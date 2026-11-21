import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Circle, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { generateActionPlanFromScore } from '../utils/recommendations.js';
import { calculateBiosecurityScore } from '../utils/riskScoring.js';
import { isSpeechSupported, speakText, stopSpeaking, t } from '../utils/translations.js';

export default function ActionPlanAndPathshala() {
  const {
    language,
    store,
    activeFarm,
    districtProfiles,
    lessons,
    getQuestionsForFarmType,
    toggleRecommendationComplete,
    toggleLessonComplete,
  } = useApp();

  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [speakingLessonId, setSpeakingLessonId] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  const recommendations = useMemo(() => {
    if (!activeFarm) return [];
    const saved = (store.recommendations || []).filter((r) => r.farm_id === activeFarm.id);
    if (saved.length > 0) return saved;

    const latestAudit = store.audits.find((a) => a.farm_id === activeFarm.id);
    if (!latestAudit?.answers) return [];
    const profile = districtProfiles.find((d) => d.district_name === activeFarm.district);
    const questions = getQuestionsForFarmType(activeFarm.farm_type);
    const score = calculateBiosecurityScore(
      questions,
      latestAudit.answers,
      activeFarm.farm_type,
      profile
    );
    return generateActionPlanFromScore(score, activeFarm.id);
  }, [activeFarm, store.recommendations, store.audits, districtProfiles, getQuestionsForFarmType]);

  const filteredLessons = lessons.filter(
    (lesson) => speciesFilter === 'All' || lesson.species === speciesFilter || lesson.species === 'Both'
  );

  const completedLessonsCount = lessons.filter((l) =>
    store.completedLessonIds.includes(l.id)
  ).length;

  const handleReadLesson = (lesson) => {
    if (speakingLessonId === lesson.id) {
      stopSpeaking();
      setSpeakingLessonId(null);
      return;
    }
    const title = language === 'hi' && lesson.title_hi ? lesson.title_hi : lesson.title;
    const summary = language === 'hi' && lesson.summary_hi ? lesson.summary_hi : lesson.summary;
    const text = `${title}. ${summary}. Do: ${lesson.dos.join('. ')}. Avoid: ${lesson.donts.join('. ')}`;
    setSpeakingLessonId(lesson.id);
    speakText(text, language, () => setSpeakingLessonId(null));
  };

  return (
    <div className="space-y-8">
      {/* Personalised Action Plan Section */}
      {activeFarm && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Personalised Action Plan</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Top priority improvements generated from {activeFarm.farm_name}&apos;s latest
                biosecurity assessment.
              </p>
            </div>
            <p className="text-xs text-slate-500 tabular-nums">
              {recommendations.filter((r) => r.is_completed).length} / {recommendations.length}{' '}
              completed
            </p>
          </div>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map((rec, index) => (
                <article
                  key={rec.id}
                  className={`bg-white border rounded-xl p-5 flex flex-col justify-between gap-4 ${
                    rec.is_completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        Action 0{index + 1} · {rec.priority} Priority
                      </span>
                      <span className="font-mono-tabular">{rec.weighted_impact} pts</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                      {rec.title}
                    </h3>

                    <div className="space-y-2 text-xs text-slate-600">
                      <p>
                        <strong className="text-slate-800">Problem:</strong> {rec.identified_problem}
                      </p>
                      <p>
                        <strong className="text-slate-800">Why it matters:</strong> {rec.why_it_matters}
                      </p>
                      <p>
                        <strong className="text-slate-800">What to do:</strong> {rec.action_steps}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRecommendationComplete(rec.id)}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors min-h-[40px] ${
                      rec.is_completed
                        ? 'bg-[#0D3B26] text-white hover:bg-[#145235]'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {rec.is_completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        <span>Mark Action Complete</span>
                      </>
                    )}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-sm text-slate-600">
              Complete a FarmShield Local assessment to generate personalised actions for this farm.
            </div>
          )}
        </section>
      )}

      {/* Biosecurity Pathshala Learning Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0D3B26]" />
              <span>Biosecurity Pathshala</span>
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Short visual lessons with Do&apos;s, Don&apos;ts, and optional read-aloud audio. (
              <span className="tabular-nums">
                {completedLessonsCount}/{lessons.length}
              </span>{' '}
              completed)
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F1F5F2] rounded-xl self-start">
            {['All', 'Pig', 'Poultry'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSpeciesFilter(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  speciesFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLessons.map((lesson) => {
            const isDone = store.completedLessonIds.includes(lesson.id);
            const title = language === 'hi' && lesson.title_hi ? lesson.title_hi : lesson.title;
            const summary =
              language === 'hi' && lesson.summary_hi ? lesson.summary_hi : lesson.summary;

            return (
              <article
                key={lesson.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <div>
                  <div className="h-44 bg-slate-100 overflow-hidden">
                    {!failedImages[lesson.id] && lesson.image_url ? (
                      <img
                        src={lesson.image_url}
                        alt={title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [lesson.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col items-center justify-center p-4 text-slate-500">
                        <BookOpen className="w-8 h-8 text-emerald-700 mb-2" />
                        <span className="text-xs font-medium">{lesson.species} Biosecurity</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{lesson.species === 'Both' ? 'Pig & Poultry' : `${lesson.species} Farm`}</span>
                      <span className="truncate">{lesson.reference_source}</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <p className="font-semibold text-emerald-800 mb-1">Do&apos;s</p>
                        <ul className="space-y-1 text-slate-600 list-disc pl-4">
                          {lesson.dos.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-rose-800 mb-1">Don&apos;ts</p>
                        <ul className="space-y-1 text-slate-600 list-disc pl-4">
                          {lesson.donts.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  {isSpeechSupported() ? (
                    <button
                      type="button"
                      onClick={() => handleReadLesson(lesson)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors min-h-[40px]"
                    >
                      {speakingLessonId === lesson.id ? (
                        <>
                          <VolumeX className="w-4 h-4 text-emerald-700" />
                          <span>{t(language, 'stopSpeaking')}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-emerald-700" />
                          <span>{t(language, 'speak')}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Text lesson ready</span>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleLessonComplete(lesson.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors min-h-[40px] ${
                      isDone
                        ? 'bg-[#0D3B26] text-white hover:bg-[#145335]'
                        : 'border border-slate-200 bg-white text-slate-800 hover:bg-[#EEF5F0]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isDone ? 'Lesson Completed' : 'Mark Complete'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
