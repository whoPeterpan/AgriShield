import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';
import {
  DEMO_DISTRICT_PROFILES,
  DEMO_LESSONS,
  DEMO_USERS,
  INITIAL_DEMO_STATE,
  PIG_QUESTIONS,
  POULTRY_QUESTIONS,
} from '../data/demoData.js';
import { generateActionPlanFromScore } from '../utils/recommendations.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

const STORAGE_KEYS = {
  DEMO_STATE: 'suraksha_sathi_demo_state_v3',
  DEMO_DRAFTS: 'suraksha_sathi_demo_drafts_v3',
  DEMO_QUEUE: 'suraksha_sathi_demo_queue_v3',
  AUTH_STATE: 'suraksha_sathi_auth_state_v3',
  AUTH_DRAFTS: 'suraksha_sathi_auth_drafts_v3',
  AUTH_QUEUE: 'suraksha_sathi_auth_queue_v3',
  USER: 'suraksha_sathi_user_v3',
  LANG: 'suraksha_sathi_lang_v1',
};

const AppContext = createContext(null);

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function emptyStateClone() {
  return {
    farms: [],
    audits: [],
    farmLogs: [],
    evidenceItems: [],
    officialAlerts: [],
    communityReports: [],
    vetCases: [],
    recommendations: [],
    completedLessonIds: [],
    completedRecommendationIds: [],
    reviewedAlertIds: [],
  };
}

export function AppProvider({ children }) {
  const browserOnline = useOnlineStatus();
  const [simulateOffline, setSimulateOffline] = useState(false);
  const isOnline = browserOnline && !simulateOffline;

  const [language, setLanguage] = useState(() => loadJson(STORAGE_KEYS.LANG, 'en'));
  const [user, setUser] = useState(() => loadJson(STORAGE_KEYS.USER, null));
  const isDemoMode = Boolean(user?.id?.startsWith('demo-'));

  const [offlineQueue, setOfflineQueue] = useState(() =>
    loadJson(
      user?.id && !user.id.startsWith('demo-')
        ? STORAGE_KEYS.AUTH_QUEUE
        : STORAGE_KEYS.DEMO_QUEUE,
      []
    )
  );

  const [districtProfiles, setDistrictProfiles] = useState(DEMO_DISTRICT_PROFILES);
  const [lessons, setLessons] = useState(DEMO_LESSONS);

  const [store, setStore] = useState(() => {
    const key =
      user?.id && !user.id.startsWith('demo-')
        ? STORAGE_KEYS.AUTH_STATE
        : STORAGE_KEYS.DEMO_STATE;
    return loadJson(key, emptyStateClone());
  });

  const [activeFarmId, setActiveFarmId] = useState(() => store?.farms?.[0]?.id || null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Persist active workspace state separately for Demo vs Authenticated Supabase users
  useEffect(() => {
    try {
      const key = isDemoMode || !user ? STORAGE_KEYS.DEMO_STATE : STORAGE_KEYS.AUTH_STATE;
      localStorage.setItem(key, JSON.stringify(store));
    } catch {
      // Ignore quota errors
    }
  }, [store, isDemoMode, user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch {
      // Ignore
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, JSON.stringify(language));
    } catch {
      // Ignore
    }
  }, [language]);

  useEffect(() => {
    try {
      const key = isDemoMode || !user ? STORAGE_KEYS.DEMO_QUEUE : STORAGE_KEYS.AUTH_QUEUE;
      localStorage.setItem(key, JSON.stringify(offlineQueue));
    } catch {
      // Ignore
    }
  }, [offlineQueue, isDemoMode, user]);

  const ensureProfileForAuthUser = async (authUser) => {
    if (!authUser || !supabase) return null;
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existing) return existing;

    const pendingRole = localStorage.getItem('suraksha_pending_oauth_role') || 'farmer';
    localStorage.removeItem('suraksha_pending_oauth_role');

    const newProfile = {
      id: authUser.id,
      full_name:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Suraksha User',
      role: ['farmer', 'veterinarian', 'authority'].includes(pendingRole) ? pendingRole : 'farmer',
      phone_or_email: authUser.email || '',
      preferred_language: language,
    };

    const { data: inserted } = await supabase
      .from('profiles')
      .upsert(newProfile)
      .select('*')
      .single();

    return inserted || newProfile;
  };

  // Listen for real Supabase Auth sessions
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (data?.session?.user) {
        const profile = await ensureProfileForAuthUser(data.session.user);
        if (profile) {
          setUser(profile);
          setStore(loadJson(STORAGE_KEYS.AUTH_STATE, emptyStateClone()));
          setOfflineQueue(loadJson(STORAGE_KEYS.AUTH_QUEUE, []));
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await ensureProfileForAuthUser(session.user);
        if (profile) {
          setUser(profile);
          setStore(loadJson(STORAGE_KEYS.AUTH_STATE, emptyStateClone()));
          setOfflineQueue(loadJson(STORAGE_KEYS.AUTH_QUEUE, []));
        }
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const notify = (text, type = 'success') => {
    setStatusMessage({ text, type, id: Date.now() });
    setTimeout(() => {
      setStatusMessage((prev) => (prev && Date.now() - prev.id >= 3800 ? null : prev));
    }, 4000);
  };

  // Fresh Demo Entry from landing page OR seamless role switch within current demo session
  const enterDemoRole = (role, options = {}) => {
    const demoUser = DEMO_USERS[role] || DEMO_USERS.farmer;
    const enteringFresh = options.fresh !== undefined ? options.fresh : !isDemoMode;

    if (enteringFresh) {
      localStorage.removeItem(STORAGE_KEYS.DEMO_STATE);
      localStorage.removeItem(STORAGE_KEYS.DEMO_QUEUE);
      localStorage.removeItem(STORAGE_KEYS.DEMO_DRAFTS);
      const fresh = emptyStateClone();
      setStore(fresh);
      setOfflineQueue([]);
      setDistrictProfiles(DEMO_DISTRICT_PROFILES);
      setLessons(DEMO_LESSONS);
      setActiveFarmId(null);
      setUser(demoUser);
      notify(`Started fresh ${role} demo session (0 records).`);
      return;
    }

    setUser(demoUser);
    if (role === 'farmer') {
      const owned = store.farms.find((f) => f.owner_id === demoUser.id);
      setActiveFarmId(owned?.id || null);
    }
    notify(`Switched demo view to ${demoUser.full_name} (${role}).`);
  };

  const signInWithSupabase = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase is not configured. Use Instant Demo Access above.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data?.user) {
      const profile = await ensureProfileForAuthUser(data.user);
      if (profile) {
        setUser(profile);
        setStore(loadJson(STORAGE_KEYS.AUTH_STATE, emptyStateClone()));
        setOfflineQueue(loadJson(STORAGE_KEYS.AUTH_QUEUE, []));
      }
    }
    notify('Signed in with Supabase.');
    return { error: null };
  };

  const signUpWithSupabase = async ({ email, password, fullName, role }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase is not configured. Use Instant Demo Access above.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    if (error) return { error: error.message };

    if (data?.user && data?.session) {
      const profilePayload = {
        id: data.user.id,
        full_name: fullName,
        role,
        phone_or_email: email,
        preferred_language: language,
      };
      await supabase.from('profiles').upsert(profilePayload);
      setUser(profilePayload);
      setStore(loadJson(STORAGE_KEYS.AUTH_STATE, emptyStateClone()));
      setOfflineQueue(loadJson(STORAGE_KEYS.AUTH_QUEUE, []));
      notify('Account created and signed in.');
      return { error: null, needsEmailConfirmation: false };
    }

    return { error: null, needsEmailConfirmation: true };
  };

  const signInWithGoogle = async (selectedRole = 'farmer') => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error:
          'Google sign-up requires Supabase Auth (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) with Google OAuth enabled.',
      };
    }
    localStorage.setItem('suraksha_pending_oauth_role', selectedRole);
    const redirectTo = window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) return { error: error.message };
    if (!data?.url) {
      return {
        error: 'Google OAuth URL could not be generated. Ensure Google provider is enabled in Supabase.',
      };
    }

    const inIframe = window.self !== window.top;
    if (!inIframe) {
      window.location.assign(data.url);
      return { error: null, url: data.url, isIframe: false, redirectTo };
    }

    return { error: null, url: data.url, isIframe: true, redirectTo };
  };

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem(STORAGE_KEYS.DEMO_STATE);
      localStorage.removeItem(STORAGE_KEYS.DEMO_QUEUE);
      localStorage.removeItem(STORAGE_KEYS.DEMO_DRAFTS);
      setStore(emptyStateClone());
      setOfflineQueue([]);
      setActiveFarmId(null);
    } else if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  // Resets ONLY demonstration records (never touches real authenticated Supabase data)
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.DEMO_STATE);
    localStorage.removeItem(STORAGE_KEYS.DEMO_QUEUE);
    localStorage.removeItem(STORAGE_KEYS.DEMO_DRAFTS);
    if (isDemoMode || !user) {
      setStore({ ...INITIAL_DEMO_STATE, ...emptyStateClone() });
      setOfflineQueue([]);
      setActiveFarmId(null);
    }
    setDistrictProfiles(DEMO_DISTRICT_PROFILES);
    setLessons(DEMO_LESSONS);
    notify('All demonstration data has been reset to zero across all roles.');
  };

  // Farms owned by current farmer (or all demo farms in Farmer view; all session farms in Vet/Authority view)
  const myFarms = useMemo(() => {
    if (!user) return [];
    if (user.role === 'farmer') {
      return store.farms.filter((f) => f.owner_id === user.id);
    }
    return store.farms;
  }, [store.farms, user]);

  const activeFarm = useMemo(() => {
    if (myFarms.length === 0) return null;
    return myFarms.find((f) => f.id === activeFarmId) || myFarms[0];
  }, [myFarms, activeFarmId]);

  const registerOrUpdateFarm = async (farmInput) => {
    const isEdit = Boolean(farmInput.id);
    const newFarm = {
      id: farmInput.id || `farm-${Date.now()}`,
      owner_id: user?.id || 'demo-farmer-1',
      assigned_vet_id: farmInput.assigned_vet_id || 'demo-vet-1',
      farmer_name: farmInput.farmer_name.trim(),
      farm_name: farmInput.farm_name.trim(),
      contact: farmInput.contact.trim(),
      state: farmInput.state.trim(),
      district: farmInput.district,
      farm_type: farmInput.farm_type,
      animal_count: Number(farmInput.animal_count),
      farm_size: farmInput.farm_size.trim(),
      notes: farmInput.notes?.trim() || '',
      created_at: farmInput.created_at || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && isOnline && user && !isDemoMode) {
      await supabase.from('farms').upsert(newFarm);
    }

    setStore((prev) => {
      const exists = prev.farms.some((f) => f.id === newFarm.id);
      return {
        ...prev,
        farms: exists
          ? prev.farms.map((f) => (f.id === newFarm.id ? newFarm : f))
          : [newFarm, ...prev.farms],
      };
    });
    setActiveFarmId(newFarm.id);
    notify(isEdit ? 'Farm profile updated.' : 'Farm registered successfully.');
    return newFarm;
  };

  const getDraftKey = () => (isDemoMode || !user ? STORAGE_KEYS.DEMO_DRAFTS : STORAGE_KEYS.AUTH_DRAFTS);

  const saveAssessmentDraft = (farmId, districtName, answers) => {
    const draftsKey = getDraftKey();
    const drafts = loadJson(draftsKey, {});
    drafts[farmId] = {
      districtName,
      answers,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftsKey, JSON.stringify(drafts));
    notify('Assessment draft saved locally on this device.');
  };

  const loadAssessmentDraft = (farmId) => {
    const drafts = loadJson(getDraftKey(), {});
    return drafts[farmId] || null;
  };

  const submitAssessment = async (farmId, districtName, answers, scoreResult) => {
    const auditRecord = {
      id: `audit-${Date.now()}`,
      farm_id: farmId,
      district_name: districtName,
      overall_risk_score: scoreResult.overallScore,
      risk_category: scoreResult.riskCategory,
      category_scores: scoreResult.categoryScores,
      answers,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    const generatedPlan = generateActionPlanFromScore(scoreResult, farmId);

    if (isSupabaseConfigured && supabase && isOnline && user && !isDemoMode) {
      await supabase.from('audits').insert({
        id: auditRecord.id,
        farm_id: farmId,
        district_name: districtName,
        overall_risk_score: scoreResult.overallScore,
        risk_category: scoreResult.riskCategory,
        category_scores: scoreResult.categoryScores,
        status: 'completed',
      });
    }

    const draftsKey = getDraftKey();
    const drafts = loadJson(draftsKey, {});
    delete drafts[farmId];
    localStorage.setItem(draftsKey, JSON.stringify(drafts));

    setStore((prev) => ({
      ...prev,
      audits: [auditRecord, ...prev.audits],
      recommendations: [
        ...generatedPlan,
        ...(prev.recommendations || []).filter((r) => r.farm_id !== farmId),
      ],
    }));

    notify(`Assessment saved — Risk Score: ${scoreResult.overallScore}/100 (${scoreResult.riskCategory}).`);
    return auditRecord;
  };

  const toggleRecommendationComplete = (recId) => {
    setStore((prev) => ({
      ...prev,
      recommendations: (prev.recommendations || []).map((r) =>
        r.id === recId ? { ...r, is_completed: !r.is_completed } : r
      ),
    }));
  };

  const toggleLessonComplete = (lessonId) => {
    setStore((prev) => {
      const exists = prev.completedLessonIds.includes(lessonId);
      return {
        ...prev,
        completedLessonIds: exists
          ? prev.completedLessonIds.filter((id) => id !== lessonId)
          : [...prev.completedLessonIds, lessonId],
      };
    });
  };

  const addFarmLog = async (logInput) => {
    const newLog = {
      id: `log-${Date.now()}`,
      farm_id: logInput.farm_id,
      log_type: logInput.log_type,
      log_date: logInput.log_date,
      title: logInput.title.trim(),
      details: logInput.details.trim(),
      numeric_value: Number(logInput.numeric_value || 0),
      created_offline: !isOnline,
      created_at: new Date().toISOString(),
    };

    if (!isOnline) {
      setOfflineQueue((prev) => [
        ...prev,
        { kind: 'farm_log', payload: newLog, queuedAt: new Date().toISOString() },
      ]);
      setStore((prev) => ({
        ...prev,
        farmLogs: [newLog, ...prev.farmLogs],
      }));
      notify('Offline: Record saved locally and queued for sync.', 'info');
      return newLog;
    }

    if (isSupabaseConfigured && supabase && user && !isDemoMode) {
      await supabase.from('farm_logs').insert(newLog);
    }

    setStore((prev) => ({
      ...prev,
      farmLogs: [newLog, ...prev.farmLogs],
    }));
    notify('Farm record saved.');
    return newLog;
  };

  const syncOfflineQueue = async () => {
    if (!isOnline) {
      notify('Still offline. Reconnect to the internet to sync queued records.', 'error');
      return;
    }
    if (offlineQueue.length === 0) {
      notify('All records are already synced.');
      return;
    }

    if (isSupabaseConfigured && supabase && user && !isDemoMode) {
      for (const item of offlineQueue) {
        if (item.kind === 'farm_log') {
          await supabase.from('farm_logs').upsert({ ...item.payload, created_offline: false });
        }
      }
    }

    const syncedIds = new Set(offlineQueue.map((q) => q.payload.id));
    setStore((prev) => ({
      ...prev,
      farmLogs: prev.farmLogs.map((l) =>
        syncedIds.has(l.id) ? { ...l, created_offline: false } : l
      ),
    }));
    const count = offlineQueue.length;
    setOfflineQueue([]);
    notify(`Successfully synced ${count} offline record(s).`);
  };

  const uploadEvidence = async (farmId, { title, category, file }) => {
    let fileUrl = '';
    const fileName = file ? file.name : 'compliance-note.txt';

    if (file) {
      if (isSupabaseConfigured && supabase && isOnline && user && !isDemoMode) {
        const path = `${farmId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from('farm-evidence')
          .upload(path, file);
        if (!error) {
          const { data: signed } = await supabase.storage
            .from('farm-evidence')
            .createSignedUrl(path, 3600);
          fileUrl = signed?.signedUrl || '';
        }
      }

      if (!fileUrl) {
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }
    }

    const newItem = {
      id: `ev-${Date.now()}`,
      farm_id: farmId,
      title: title.trim(),
      category,
      file_name: fileName,
      file_url: fileUrl,
      uploaded_at: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      evidenceItems: [newItem, ...prev.evidenceItems],
    }));
    notify('Evidence item added to locker.');
    return newItem;
  };

  const markAlertReviewed = (alertId) => {
    setStore((prev) => ({
      ...prev,
      reviewedAlertIds: prev.reviewedAlertIds.includes(alertId)
        ? prev.reviewedAlertIds
        : [...prev.reviewedAlertIds, alertId],
      officialAlerts: prev.officialAlerts.map((a) =>
        a.id === alertId ? { ...a, is_reviewed: true } : a
      ),
    }));
    notify('Alert marked as reviewed.');
  };

  const submitCommunityReport = (reportInput) => {
    const report = {
      id: `comm-${Date.now()}`,
      farm_id: reportInput.farm_id,
      district: reportInput.district,
      species: reportInput.species,
      pattern_type: reportInput.pattern_type,
      reported_date: new Date().toISOString().slice(0, 10),
    };
    setStore((prev) => ({
      ...prev,
      communityReports: [report, ...prev.communityReports],
    }));
    notify('Anonymised community observation recorded.');
  };

  const submitVetCase = (caseInput) => {
    const newCase = {
      id: `case-${Date.now()}`,
      farm_id: caseInput.farm_id,
      vet_id: 'demo-vet-1',
      concern_title: caseInput.concern_title.trim(),
      concern_description: caseInput.concern_description.trim(),
      observation_date: caseInput.observation_date,
      farm_observations: caseInput.farm_observations?.trim() || '',
      photo_url: caseInput.photo_url || '',
      status: 'New',
      vet_response: '',
      responded_at: null,
      created_at: new Date().toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      vetCases: [newCase, ...prev.vetCases],
    }));
    notify('Case submitted to assigned veterinarian.');
    return newCase;
  };

  const updateVetCase = (caseId, { status, vet_response }) => {
    setStore((prev) => ({
      ...prev,
      vetCases: prev.vetCases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status,
              vet_response: vet_response !== undefined ? vet_response : c.vet_response,
              responded_at: vet_response ? new Date().toISOString() : c.responded_at,
            }
          : c
      ),
    }));
    notify(`Case updated to "${status}".`);
  };

  const upsertDistrictProfile = (profile) => {
    setDistrictProfiles((prev) => {
      const exists = prev.some((d) => d.district_name === profile.district_name);
      if (exists) {
        return prev.map((d) => (d.district_name === profile.district_name ? profile : d));
      }
      return [profile, ...prev];
    });
    notify(`District profile "${profile.district_name}" updated.`);
  };

  const addLesson = (lessonInput) => {
    const newLesson = {
      id: `lesson-${Date.now()}`,
      slug: lessonInput.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      species: lessonInput.species,
      title: lessonInput.title.trim(),
      title_hi: lessonInput.title_hi?.trim() || lessonInput.title.trim(),
      summary: lessonInput.summary.trim(),
      summary_hi: lessonInput.summary_hi?.trim() || lessonInput.summary.trim(),
      dos: lessonInput.dos,
      donts: lessonInput.donts,
      image_url:
        lessonInput.species === 'Poultry'
          ? '/src/assets/images/lesson_poultry_hygiene_1795259026906.jpg'
          : '/src/assets/images/lesson_pig_biosecurity_1795259027608.jpg',
      reference_source: lessonInput.reference_source || 'Authority Demo Lesson',
    };
    setLessons((prev) => [newLesson, ...prev]);
    notify('New Biosecurity Pathshala lesson published.');
  };

  const getQuestionsForFarmType = (farmType) => {
    return farmType === 'Pig' ? PIG_QUESTIONS : POULTRY_QUESTIONS;
  };

  const value = {
    user,
    isDemoMode,
    language,
    setLanguage,
    isOnline,
    simulateOffline,
    setSimulateOffline,
    offlineQueue,
    isSupabaseConfigured,
    statusMessage,
    store,
    districtProfiles,
    lessons,
    myFarms,
    activeFarm,
    activeFarmId,
    setActiveFarmId,
    enterDemoRole,
    signInWithSupabase,
    signUpWithSupabase,
    signInWithGoogle,
    signOut,
    resetDemoData,
    registerOrUpdateFarm,
    saveAssessmentDraft,
    loadAssessmentDraft,
    submitAssessment,
    toggleRecommendationComplete,
    toggleLessonComplete,
    addFarmLog,
    syncOfflineQueue,
    uploadEvidence,
    markAlertReviewed,
    submitCommunityReport,
    submitVetCase,
    updateVetCase,
    upsertDistrictProfile,
    addLesson,
    getQuestionsForFarmType,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
