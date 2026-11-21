import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  BarChart3,
  BellRing,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Languages,
  ListChecks,
  ShieldCheck,
  Sprout,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { t } from '../utils/translations.js';
import PWAInstallButton from '../components/PWAInstallButton.jsx';
import Auth from '../components/Auth.jsx';

const FIVE_STAGES = [
  {
    num: '01',
    key: 'Assess',
    keyHi: 'आकलन',
    icon: ClipboardCheck,
    title: 'Assess Farm Risk',
    titleHi: 'फार्म जोखिम आकलन',
    desc: 'Answer 10 clear pig or poultry checks weighted by your district’s local ASF or HPAI pressure.',
    descHi: 'अपने जिले के स्थानीय जोखिम दबाव के अनुसार 10 स्पष्ट प्रश्नों का आकलन करें।',
  },
  {
    num: '02',
    key: 'Act',
    keyHi: 'कार्रवाई',
    icon: ListChecks,
    title: 'Act on Priorities',
    titleHi: 'शीर्ष सुधार अपनाएं',
    desc: 'Get your Top 3 immediate biosecurity actions and record visitors, cleaning, and losses offline.',
    descHi: 'शीर्ष 3 प्राथमिकताएं पाएं और बिना इंटरनेट के भी दैनिक स्वच्छता लॉग सहेजें।',
  },
  {
    num: '03',
    key: 'Prove',
    keyHi: 'प्रमाण',
    icon: Award,
    title: 'Prove Readiness',
    titleHi: 'तैयारी प्रमाणित करें',
    desc: 'Upload footbath, mesh, and register photos to unlock Bronze, Silver, and Gold readiness tiers.',
    descHi: 'फ़ोटो प्रमाण जोड़कर कांस्य, रजत और स्वर्ण तैयारी स्तर तक पहुंचें।',
  },
  {
    num: '04',
    key: 'Alert',
    keyHi: 'अलर्ट',
    icon: BellRing,
    title: 'Alert Early',
    titleHi: 'समय पर चेतावनी',
    desc: 'Receive non-diagnostic farm signal warnings and anonymised cluster notices when 3+ farms report.',
    descHi: 'लॉग संकेत और 3+ अनाम फार्मों के क्लस्टर पैटर्न पर शुरुआती चेतावनी पाएं।',
  },
  {
    num: '05',
    key: 'Learn',
    keyHi: 'सीखें',
    icon: BookOpen,
    title: 'Learn Practical Habits',
    titleHi: 'पाठशाला से सीखें',
    desc: 'Browse visual bilingual Pathshala lessons with Do’s, Don’ts, and read-aloud audio support.',
    descHi: 'चित्रों, क्या करें / क्या न करें और ऑडियो के साथ आसान पाठशाला गाइड पढ़ें।',
  },
];

const USER_GROUPS = [
  {
    role: 'farmer',
    icon: UserCheck,
    badge: 'Primary Field Workspace',
    badgeHi: 'मुख्य किसान कार्यक्षेत्र',
    title: 'Pig & Poultry Farmers',
    titleHi: 'सूअर और मुर्गी पालक किसान',
    summary:
      'Start from a clean slate to audit shed barriers, keep offline daily logs, build readiness proof, and consult assigned vets.',
    summaryHi:
      'शुरुआत से शेड सुरक्षा की जांच करें, ऑफ़लाइन दैनिक लॉग रखें, प्रमाण अपलोड करें और पशु चिकित्सक से सलाह लें।',
    points: [
      'Weighted FarmShield Local scoring with transparent point breakdown',
      'Offline-queued visitor, sanitation, and mortality logs',
      'Direct photo-backed consultation with assigned veterinarians',
    ],
    pointsHi: [
      'पारदर्शी गणना के साथ फार्मशील्ड लोकल जोखिम स्कोर',
      'ऑफ़लाइन आगंतुक, सफाई और मृत्यु दर रिकॉर्ड',
      'पशु चिकित्सकों के साथ फ़ोटो-आधारित सीधी सलाह',
    ],
  },
  {
    role: 'veterinarian',
    icon: Stethoscope,
    badge: 'Clinical & Advisory Desk',
    badgeHi: 'चिकित्सा सलाह डेस्क',
    title: 'Field Veterinarians',
    titleHi: 'पशु चिकित्सक',
    summary:
      'Monitor assigned farms, inspect recent mortality and cleaning context alongside case photos, and send actionable guidance.',
    summaryHi:
      'फार्मों के हालिया रिकॉर्ड और फ़ोटो देखकर समय पर निवारक सलाह व केस अपडेट भेजें।',
    points: [
      'Structured case queue filterable by New, Under Review, and Closed',
      'Recent sanitation and mortality log timeline inside each case',
      'Status tracking and written preventive biosecurity guidance',
    ],
    pointsHi: [
      'नए, विचाराधीन और पूर्ण केस के लिए व्यवस्थित कतार',
      'हर केस के साथ फार्म के हालिया सफाई और मृत्यु लॉग',
      'निवारक जैव-सुरक्षा मार्गदर्शन और स्थिति अपडेट',
    ],
  },
  {
    role: 'authority',
    icon: BarChart3,
    badge: 'Privacy-Safe Policy Pulse',
    badgeHi: 'गोपनीयता-सुरक्षित नीति पल्स',
    title: 'Livestock Authorities',
    titleHi: 'पशुपालन अधिकारी',
    summary:
      'Review strictly anonymised district biosecurity trends, recurring control gaps, and publish bilingual Pathshala advisories.',
    summaryHi:
      'किसानों की पहचान गोपनीय रखते हुए जिला स्तर के रुझान देखें और नई पाठशाला गाइड प्रकाशित करें।',
    points: [
      'Aggregated district metrics without exposing individual farmer identities',
      'Privacy threshold suppressing community clusters below 3 distinct farms',
      'Content manager for district risk profiles and Pathshala lessons',
    ],
    pointsHi: [
      'किसान की पहचान छिपाकर जिला स्तर के समग्र आंकड़े',
      '3 अलग-अलग फार्मों की सीमा वाला गोपनीय क्लस्टर नियम',
      'जिला जोखिम प्रोफ़ाइल और पाठशाला सामग्री प्रबंधन',
    ],
  },
];

const HERO_EASE = [0.22, 1, 0.36, 1];

const heroContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.1,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: HERO_EASE,
    },
  },
};

const heroActionsVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
    },
  },
};

const heroButtonVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: HERO_EASE,
    },
  },
};

const accessColumnVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const accessCardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.52,
      ease: HERO_EASE,
    },
  },
};

export default function AuthAndWelcome() {
  const { user, language, setLanguage, enterDemoRole } = useApp();
  const navigate = useNavigate();
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [selectedGroupRole, setSelectedGroupRole] = useState('farmer');

  const isHi = language === 'hi';

  const handleEnterDemo = (role) => {
    enterDemoRole(role, { fresh: true });
    navigate('/dashboard');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });

    const sectionIds = ['how-it-works', 'species', 'roles'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -55% 0px' }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  const activeGroup = USER_GROUPS.find((g) => g.role === selectedGroupRole) || USER_GROUPS[0];

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="min-h-screen bg-[#FAFBF9] text-slate-900 flex flex-col overflow-x-hidden">
      {/* Top Bar — Strict 3-Zone Contract, Scroll Reactive */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs'
            : 'bg-[#FAFBF9]/90 backdrop-blur-sm border-b border-slate-200/70'
        }`}
      >
        <div className="w-[95%] max-w-[1920px] mx-auto h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Mark */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Go to home page"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0D3B26] text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {t(language, 'brand')}
            </span>
          </Link>

          {/* Zone 2: Single-line Smooth Nav Links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600"
          >
            {[
              { id: 'how-it-works', label: isHi ? 'कैसे काम करता है' : 'How It Works' },
              { id: 'species', label: isHi ? 'सूअर व मुर्गी' : 'Pig & Poultry' },
              { id: 'roles', label: isHi ? 'कौन उपयोग करता है' : 'Who Uses It' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeSection === item.id
                    ? 'text-[#0D3B26] font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.span
                    layoutId="landing-nav-underline"
                    className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-emerald-700"
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Zone 3: Workspace Return (if signed in) + Language + Install Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D3B26] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#145235] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <span>{isHi ? 'डैशबोर्ड खोलें' : 'Open Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setLanguage(isHi ? 'en' : 'hi')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <Languages className="w-4 h-4 text-emerald-700" />
              <span>{isHi ? 'English' : 'हिंदी'}</span>
            </button>
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Band 1: Full 95% Viewport Balanced Two-Column Hero & Access Panel */}
      <section className="w-[95%] max-w-[1920px] mx-auto py-4 sm:py-5 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-7 items-stretch">
          {/* Left Hero Canvas */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: HERO_EASE }}
            className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-slate-200/80 bg-[#0D3B26] min-h-[500px] lg:min-h-[600px] flex flex-col justify-between"
          >
            {!heroImgFailed ? (
              <motion.img
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: HERO_EASE }}
                src="/src/assets/images/hero_farm_biosecurity_1795259029019.jpg"
                alt="Clean pig and poultry biosecurity farmyard with gated perimeter and disinfection path"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0D3B26] to-[#062014]" />
            )}

            {/* Deep Forest Scrim for 4.5:1+ AA Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#061E13]/95 via-[#09291A]/55 to-[#061E13]/45" />

            {/* Top Hero Platform Capabilities Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: HERO_EASE }}
              className="relative z-10 p-6 sm:p-8 lg:px-10 lg:pt-8"
            >
              <div className="inline-flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-[#061E13]/60 backdrop-blur-md border border-white/15 px-4 py-2.5 text-xs text-slate-100">
                <span className="font-semibold text-lime-300">
                  {isHi ? 'फार्मशील्ड लोकल इंजन' : 'FarmShield Local Engine'}
                </span>
                <span className="text-white/30" aria-hidden="true">
                  |
                </span>
                <span>{isHi ? 'जिला-भारित जोखिम स्कोर' : 'District-Weighted ASF & HPAI Scoring'}</span>
                <span className="hidden sm:inline text-white/30" aria-hidden="true">
                  |
                </span>
                <span className="hidden sm:inline">
                  {isHi ? 'ऑफ़लाइन-तैयार फार्म रिकॉर्ड' : 'Offline-Ready Daily Logs'}
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={heroContentVariants}
              initial="hidden"
              animate="visible"
              className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-5 max-w-3xl text-white"
            >
              <motion.div
                variants={heroItemVariants}
                className="flex items-center gap-2.5 text-xs font-semibold text-lime-300"
              >
                <span className="h-0.5 w-6 bg-lime-400 rounded-full" aria-hidden="true" />
                <span>
                  {isHi
                    ? 'सूअर और मुर्गी बायोसिक्योरिटी प्लेटफ़ॉर्म'
                    : 'Digital Biosecurity Platform for Pig & Poultry Farms'}
                </span>
              </motion.div>

              <motion.h1
                variants={heroItemVariants}
                className="text-3xl sm:text-4xl xl:text-[52px] font-bold tracking-tight leading-[1.08] text-balance"
              >
                {isHi ? (
                  <>
                    हर दिन की बायोसिक्योरिटी,
                    <br />
                    सरल और प्रमाणित।
                  </>
                ) : (
                  <>
                    Assess farm risk early.
                    <br />
                    Act daily. Prove readiness.
                  </>
                )}
              </motion.h1>

              <motion.p
                variants={heroItemVariants}
                className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-2xl leading-relaxed"
              >
                {isHi
                  ? 'जिला-आधारित जोखिम स्कोर जांचें, बिना इंटरनेट दैनिक रिकॉर्ड रखें और पशु चिकित्सकों से तुरंत मार्गदर्शन प्राप्त करें।'
                  : 'Score shed biosecurity against local ASF and HPAI pressure, keep offline visitor and cleaning logs, and share photo-backed cases with veterinarians.'}
              </motion.p>

              <motion.div
                variants={heroActionsVariants}
                className="flex flex-wrap items-center gap-3 pt-1"
              >
                <motion.button
                  type="button"
                  variants={heroButtonVariants}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEnterDemo('farmer', { fresh: true })}
                  className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-3.5 text-sm font-bold text-[#062014] hover:bg-lime-300 transition-colors whitespace-nowrap"
                >
                  <span>{isHi ? 'नया किसान डेमो शुरू करें' : 'Start Fresh Farmer Demo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.a
                  href="#how-it-works"
                  variants={heroButtonVariants}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 backdrop-blur-xs px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap"
                >
                  <span>{isHi ? '5 चरण देखें' : 'See 5-Stage Workflow'}</span>
                  <ArrowDown className="w-4 h-4 text-lime-300" />
                </motion.a>
              </motion.div>

              <motion.div
                variants={heroItemVariants}
                className="pt-4 border-t border-white/15 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300"
              >
                <span>{t(language, 'tagline')}</span>
                <span aria-hidden="true">·</span>
                <span>{isHi ? 'ऑफ़लाइन PWA समर्थित' : 'Works Offline (PWA)'}</span>
                <span aria-hidden="true">·</span>
                <span>{isHi ? 'सभी डेमो शून्य रिकॉर्ड से शुरू' : 'Clean Zero-Record Demo Start'}</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Column: Instant Demo Role Cards + Account Access */}
          <motion.div
            variants={accessColumnVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 flex flex-col gap-5"
          >
            {/* Instant Demo Role Selection Cards */}
            <motion.section
              variants={accessCardVariants}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isHi ? 'तुरंत डेमो खोलें' : 'Instant Demo Access'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHi
                      ? 'हर भूमिका शून्य डेटा के साथ ताज़ा शुरू होती है'
                      : 'Every role starts fresh with zero pre-filled records'}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-emerald-800 whitespace-nowrap">
                  {isHi ? 'लॉगिन आवश्यक नहीं' : 'No login needed'}
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Prominent Farmer Demo Card */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => handleEnterDemo('farmer', { fresh: true })}
                  className="group w-full flex items-center justify-between gap-4 rounded-xl bg-[#0D3B26] p-4 text-left text-white hover:bg-[#145235] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-lime-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">
                          {isHi ? 'किसान डेमो' : 'Farmer'}
                        </p>
                        <span className="text-[11px] text-lime-300 font-medium">
                          · {isHi ? 'प्राथमिक' : 'Primary'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100/90 truncate mt-0.5">
                        {isHi
                          ? 'फार्म पंजीकरण, जांच, रिकॉर्ड, तैयारी व अलर्ट'
                          : 'Register farm, run audits, log daily checks & readiness'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-lime-300 shrink-0 transition-transform group-hover:translate-x-1" />
                </motion.button>

                {/* Veterinarian & Authority Interactive Role Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => handleEnterDemo('veterinarian', { fresh: true })}
                    className="group w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#FAFBF9] p-3.5 text-left hover:bg-[#EEF5F0] hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#EEF5F0] text-[#0D3B26] flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {isHi ? 'पशु चिकित्सक' : 'Veterinarian'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {isHi ? 'केस कतार व सलाह' : 'Case queue & farm advice'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => handleEnterDemo('authority', { fresh: true })}
                    className="group w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#FAFBF9] p-3.5 text-left hover:bg-[#EEF5F0] hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#EEF5F0] text-[#0D3B26] flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {isHi ? 'अधिकारी' : 'Authority'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {isHi ? 'अनाम जिला विश्लेषण' : 'District stats & Pathshala'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </motion.button>
                </div>
              </div>
            </motion.section>

            {/* Sign In / Sign Up with Google & Email */}
            <motion.div variants={accessCardVariants} className="flex-1 flex flex-col">
              <Auth />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Band 2: How It Works — 5 Connected Stages (Assess, Act, Prove, Alert, Learn) */}
      <section
        id="how-it-works"
        className="w-full bg-white border-y border-slate-200/90 py-12 lg:py-16"
      >
        <div className="w-[95%] max-w-[1920px] mx-auto space-y-9">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
          >
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold tracking-wide text-emerald-700">
                {isHi ? 'पांच-चरणीय बायोसिक्योरिटी चक्र' : 'How AgriShield Works'}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                {isHi
                  ? 'आकलन से लेकर प्रमाण और प्रशिक्षण तक पांच स्पष्ट चरण'
                  : 'Five connected stages built for everyday farm safety'}
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              {isHi
                ? 'हर कदम एक-दूसरे से जुड़ा है—बिना जटिल शब्दावली के स्पष्ट और उपयोगी मार्गदर्शन।'
                : 'Every stage connects directly to real records—translating biosecurity checklists into practical daily habits.'}
            </p>
          </motion.div>

          {/* 5-Column Connected Grid */}
          <div className="relative">
            {/* Horizontal connecting line on desktop */}
            <div
              className="hidden lg:block absolute top-11 left-[8%] right-[8%] h-px bg-slate-200"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {FIVE_STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <motion.article
                    key={stage.num}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.42,
                      delay: idx * 0.07,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ y: -4 }}
                    className="relative bg-[#FAFBF9] hover:bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="relative z-10 w-11 h-11 rounded-xl bg-[#0D3B26] text-lime-300 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-mono-tabular font-semibold text-slate-400">
                          {stage.num} · {isHi ? stage.keyHi : stage.key}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {isHi ? stage.titleHi : stage.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {isHi ? stage.descHi : stage.desc}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Band 3: Pig & Poultry Biosecurity Showcase */}
      <section id="species" className="w-[95%] max-w-[1920px] mx-auto py-12 lg:py-16 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-bold tracking-wide text-emerald-700">
              {isHi ? 'प्रजाति-आधारित सुरक्षा मॉडल' : 'Pig & Poultry Specialization'}
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 text-balance">
              {isHi
                ? 'सूअर और मुर्गी फार्म के खतरों के लिए अलग-अलग नियंत्रण'
                : 'Tailored risk models for Pig and Poultry operations'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleEnterDemo('farmer', { fresh: true })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0D3B26] hover:text-emerald-700 transition-colors whitespace-nowrap self-start md:self-auto"
          >
            <span>{isHi ? 'फार्म जोड़कर जांच शुरू करें' : 'Register a farm & assess now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pig Farm Biosecurity Card */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col transition-all"
          >
            <div className="h-64 sm:h-72 bg-slate-100 overflow-hidden relative">
              <img
                src="/src/assets/images/lesson_pig_biosecurity_1795259027608.jpg"
                alt="Fenced piggery unit with clean gate disinfection tray and quarantine separation"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-emerald-700">
                  {isHi ? 'सूअर फार्म बायोसिक्योरिटी · ASF सुरक्षा' : 'Pig Farm Biosecurity · ASF Focused Controls'}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isHi ? 'स्विल रोकथाम, 21-दिन क्वारंटाइन और बाड़' : 'Swill Control, Quarantine & Perimeter'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isHi
                    ? 'होटल/रसोई के बिना उबले मांस युक्त भोजन पर रोक, नए सूअरों के लिए अलग बाड़ा और बाहरी लोडिंग रैंप के लिए 10 भारित जांच।'
                    : 'Dedicated 10-control audit weighting kitchen swill bans, 21–30 day isolation for new pigs, double-fence perimeters, and outer loading chutes.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isHi ? 'कच्चे स्विल से बचाव' : 'Zero untreated meat swill'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isHi ? 'सक्रिय गेट फुटबाथ' : 'Gate boot-dip disinfection'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isHi ? 'एकल-उपयोग सुई स्वच्छता' : 'Dedicated tools & needles'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isHi ? 'गहरे गड्ढे में सुरक्षित निपटान' : 'Fenced deep-burial disposal'}</span>
                </span>
              </div>
            </div>
          </motion.article>

          {/* Poultry Farm Biosecurity Card */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col transition-all"
          >
            <div className="h-64 sm:h-72 bg-slate-100 overflow-hidden relative">
              <img
                src="/src/assets/images/lesson_poultry_hygiene_1795259026906.jpg"
                alt="Protected poultry shed fitted with fine wire mesh blocking wild birds"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-emerald-700">
                  {isHi ? 'मुर्गी फार्म बायोसिक्योरिटी · HPAI सुरक्षा' : 'Poultry Farm Biosecurity · HPAI Focused Controls'}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isHi ? 'पक्षी-रोधी जाली, स्वच्छ जल और ऑल-इन/ऑल-आउट' : 'Wild-Bird Mesh, Water Hygiene & Turnaround'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isHi
                    ? 'जंगली पक्षियों को रोकने वाली बारीक जाली, ढके हुए जल टैंक, अलग क्रेट और बैच विश्राम अवधि का सटीक आकलन।'
                    : 'Evaluates 2 cm bird-exclusion netting, covered treated drinking water, farm-dedicated egg/bird crates, and 10–14 day shed rest periods.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isHi ? 'मजबूत बारीक तार की जाली' : 'Intact <= 2 cm wire mesh'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isHi ? 'उपचारित ढका पेयजल' : 'Covered sanitized drinkers'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isHi ? 'ऑल-इन / ऑल-आउट स्वच्छता' : 'All-In / All-Out litter clean'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isHi ? 'चूहा-रोधी दाना भंडारण' : 'Rodent-proof raised feed'}</span>
                </span>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {/* Band 4: Who Uses It — Interactive 3-Group Showcase */}
      <section
        id="roles"
        className="w-full bg-white border-t border-slate-200/90 py-12 lg:py-16"
      >
        <div className="w-[95%] max-w-[1920px] mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
          >
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold tracking-wide text-emerald-700">
                {isHi ? 'सभी हितधारकों के लिए एक मंच' : 'Who Uses AgriShield'}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                {isHi
                  ? 'किसानों, पशु चिकित्सकों और अधिकारियों के लिए समर्पित कार्यक्षेत्र'
                  : 'Purpose-built views for Farmers, Veterinarians, and Authorities'}
              </h2>
            </div>
          </motion.div>

          {/* 3 Clean Role Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {USER_GROUPS.map((group, idx) => {
              const Icon = group.icon;
              const isSelected = selectedGroupRole === group.role;
              return (
                <motion.div
                  key={group.role}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.42,
                    delay: idx * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedGroupRole(group.role)}
                  className={`cursor-pointer rounded-2xl border p-6 sm:p-7 flex flex-col justify-between gap-6 transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-[#EEF5F0]/60 shadow-xs'
                      : 'border-slate-200 bg-[#FAFBF9] hover:bg-white'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#0D3B26] text-lime-300'
                            : 'bg-white border border-slate-200 text-[#0D3B26]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-emerald-800">
                        {isHi ? group.badgeHi : group.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {isHi ? group.titleHi : group.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                        {isHi ? group.summaryHi : group.summary}
                      </p>
                    </div>

                    <ul className="space-y-2 pt-3 border-t border-slate-200/70 text-xs text-slate-700">
                      {(isHi ? group.pointsHi : group.points).map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnterDemo(group.role, { fresh: true });
                    }}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-[#0D3B26] text-white hover:bg-[#145235]'
                        : 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      {isHi
                        ? `${group.titleHi} डेमो खोलें`
                        : `Open ${group.title.split(' ')[0]} Demo`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Interactive Role Spotlight Strip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGroup.role}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl border border-slate-200 bg-[#FAFBF9] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600"
            >
              <span>
                <strong className="text-slate-900">
                  {isHi ? activeGroup.titleHi : activeGroup.title}:
                </strong>{' '}
                {isHi ? activeGroup.summaryHi : activeGroup.summary}
              </span>
              <span className="font-medium text-emerald-800 whitespace-nowrap shrink-0">
                {isHi ? '0 प्रारंभिक रिकॉर्ड से शुरुआत' : 'Starts at 0 records · Reset anytime'}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Closing CTA Banner */}
      <section className="w-full bg-[#0D3B26] text-white py-12 lg:py-14">
        <div className="w-[95%] max-w-[1920px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              {isHi
                ? 'आज ही स्वच्छ, सुरक्षित फार्म प्रबंधन शुरू करें।'
                : 'Ready to evaluate your farm biosecurity from a clean slate?'}
            </h2>
            <p className="text-sm text-emerald-100/90">
              {isHi
                ? 'त्वरित डेमो आज़माएं या अपने डेटा को सुरक्षित रखने के लिए Google / ईमेल से साइन इन करें।'
                : 'Launch any role demo with zero pre-filled sample data, or sign in with Google or email to persist your farm records.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleEnterDemo('farmer', { fresh: true })}
              className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-bold text-[#062014] hover:bg-lime-300 transition-colors whitespace-nowrap"
            >
              <span>{isHi ? 'किसान डेमो खोलें' : 'Launch Farmer Demo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <span>{isHi ? 'साइन इन करें' : 'Sign In / Sign Up'}</span>
              <ArrowUp className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Quiet Professional Footer */}
      <footer className="bg-white border-t border-slate-200 py-7">
        <div className="w-[95%] max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#0D3B26]" />
            <span>{t(language, 'brand')}</span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="font-normal text-slate-500">{t(language, 'tagline')}</span>
          </div>

          <p className="text-center md:text-left">
            {isHi
              ? 'केवल बायोसिक्योरिटी मार्गदर्शन प्रोटोटाइप · यह पशु चिकित्सा निदान या सरकारी प्रमाणपत्र नहीं है।'
              : 'Biosecurity management prototype · Not a clinical diagnostic tool or official certification.'}
          </p>

          <div className="flex items-center gap-5 shrink-0">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              {isHi ? 'प्रक्रिया' : 'Workflow'}
            </a>
            <a href="#species" className="hover:text-slate-900 transition-colors">
              {isHi ? 'फार्म प्रकार' : 'Species'}
            </a>
            <a
              href="#top"
              className="inline-flex items-center gap-1 font-semibold text-[#0D3B26] hover:text-emerald-700 transition-colors"
            >
              <span>{isHi ? 'ऊपर' : 'Top'}</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
      </div>
    </MotionConfig>
  );
}
