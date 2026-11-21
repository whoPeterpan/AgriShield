/**
 * English & Hindi Translations + Browser Web Speech API Helper
 * ---------------------------------------------------------------------------
 * Provides bilingual labels for essential navigation and farmer-facing
 * instructions, plus an optional read-aloud helper with graceful fallback.
 */

export const TRANSLATIONS = {
  en: {
    brand: 'AgriShield',
    tagline: 'Assess. Act. Prove. Stay Safe.',
    navDashboard: 'Dashboard',
    navAssessment: 'FarmShield Audit',
    navActionPlan: 'Action & Pathshala',
    navReadiness: 'Readiness & Evidence',
    navRecords: 'Farm Records',
    navAlerts: 'Alerts & Signals',
    navVetCases: 'Vet Support',
    navAuthority: 'Policy Pulse',
    navRegister: 'Farm Profile',
    offlineBanner: 'Offline Mode — Changes saved locally until synced',
    syncNow: 'Sync Queued Records',
    queuedLabel: 'queued offline',
    demoModeTag: 'Demo Data Mode',
    supabaseLiveTag: 'Supabase Connected',
    speak: 'Read Aloud',
    stopSpeaking: 'Stop Audio',
    riskScore: 'Overall Risk Score',
    readiness: 'Compartment Readiness',
    completedChecks: 'Completed Checks',
    pendingActions: 'Pending Actions',
    quickActions: 'Quick Actions',
    startAudit: 'Run Biosecurity Audit',
    addRecord: 'Log Daily Record',
    askVet: 'Consult Veterinarian',
    recentRecords: 'Recent Visitor & Cleaning Records',
    latestAlerts: 'Latest Alerts',
    yes: 'Yes',
    partially: 'Partially',
    no: 'No',
    na: 'Not Applicable',
    saveDraft: 'Save Offline Draft',
    submitAudit: 'Calculate & Save Assessment',
    districtLabel: 'Local Epidemiology District (Demo Data)',
    whyScoreTitle: 'Why Your Risk Score Was Generated',
    disclaimerThreshold:
      'Prototype demonstration thresholds only (0–24 Low, 25–49 Moderate, 50–74 High, 75–100 Critical). Not a clinical diagnostic tool.',
    disclaimerReadiness:
      'Internal Compartment Readiness milestone only. Does not grant official government certification.',
  },
  hi: {
    brand: 'एग्रीशील्ड',
    tagline: 'आकलन करें। कार्रवाई करें। प्रमाणित करें। सुरक्षित रहें।',
    navDashboard: 'डैशबोर्ड',
    navAssessment: 'फार्मशील्ड जांच',
    navActionPlan: 'कार्य योजना व पाठशाला',
    navReadiness: 'तैयारी व प्रमाण',
    navRecords: 'फार्म रिकॉर्ड',
    navAlerts: 'अलर्ट व संकेत',
    navVetCases: 'पशु चिकित्सक सहायता',
    navAuthority: 'अधिकारी डैशबोर्ड',
    navRegister: 'फार्म प्रोफ़ाइल',
    offlineBanner: 'ऑफ़लाइन मोड — सिंक होने तक डेटा स्थानीय रूप से सुरक्षित है',
    syncNow: 'रिकॉर्ड सिंक करें',
    queuedLabel: 'ऑफ़लाइन कतार में',
    demoModeTag: 'डेमो डेटा मोड',
    supabaseLiveTag: 'Supabase जुड़ा है',
    speak: 'सुनें (ऑडियो)',
    stopSpeaking: 'ऑडियो रोकें',
    riskScore: 'कुल जोखिम स्कोर',
    readiness: 'कम्पार्टमेंट तैयारी',
    completedChecks: 'पूर्ण जांच',
    pendingActions: 'बकाया कार्य',
    quickActions: 'त्वरित कार्य',
    startAudit: 'बायोसिक्योरिटी जांच शुरू करें',
    addRecord: 'दैनिक रिकॉर्ड जोड़ें',
    askVet: 'पशु चिकित्सक से सलाह लें',
    recentRecords: 'हाल के आगंतुक और सफाई रिकॉर्ड',
    latestAlerts: 'नवीनतम अलर्ट',
    yes: 'हाँ',
    partially: 'आंशिक रूप से',
    no: 'नहीं',
    na: 'लागू नहीं',
    saveDraft: 'ऑफ़लाइन ड्राफ्ट सहेजें',
    submitAudit: 'स्कोर गणना व सहेजें',
    districtLabel: 'स्थानीय जिला प्रोफ़ाइल (डेमो डेटा)',
    whyScoreTitle: 'आपका जोखिम स्कोर क्यों बना',
    disclaimerThreshold:
      'केवल प्रोटोटाइप डेमो सीमा (0–24 कम, 25–49 मध्यम, 50–74 उच्च, 75–100 गंभीर)। यह रोग निदान नहीं है।',
    disclaimerReadiness:
      'केवल आंतरिक तैयारी स्तर। यह सरकारी प्रमाणपत्र नहीं है।',
  },
};

export function t(lang, key) {
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
}

/**
 * Optional Browser Web Speech API text-to-speech helper.
 * Falls back silently if speechSynthesis is unavailable.
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakText(text, lang = 'en', onEnd = () => {}) {
  if (!isSpeechSupported() || !text) {
    onEnd();
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    onEnd();
    return false;
  }
}

export function stopSpeaking() {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
