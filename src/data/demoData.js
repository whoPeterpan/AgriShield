/**
 * Demonstration Seed Data & Refined Question Banks for AgriShield
 * ---------------------------------------------------------------------------
 * Farmer demo workspaces start FRESH (0 completed audits, 0 pre-filled logs,
 * 0 completed lessons) so users can test every workflow from a clean slate.
 * An optional SAMPLE_FARM_SCENARIO dataset is also provided if a presenter
 * wishes to populate sample logs with one click.
 */

export const DEMO_USERS = {
  farmer: {
    id: 'demo-farmer-1',
    full_name: 'Rajeshwari Devi',
    role: 'farmer',
    phone_or_email: 'rajeshwari.farm@demo.local',
    preferred_language: 'en',
    district: 'Kamrup Metro',
    state: 'Assam',
  },
  veterinarian: {
    id: 'demo-vet-1',
    full_name: 'Dr. Arvind Sharma (MVSc)',
    role: 'veterinarian',
    phone_or_email: 'dr.sharma@vetdemo.local',
    preferred_language: 'en',
    district: 'Kamrup Metro',
    state: 'Assam',
  },
  authority: {
    id: 'demo-authority-1',
    full_name: 'State Biosecurity Nodal Officer',
    role: 'authority',
    phone_or_email: 'policy.pulse@demo.local',
    preferred_language: 'en',
    district: 'Kamrup Metro',
    state: 'Assam',
  },
};

export const DEMO_DISTRICT_PROFILES = [
  {
    id: 'dist-kamrup',
    district_name: 'Kamrup Metro',
    state_name: 'Assam',
    asf_risk_level: 'High',
    hpai_risk_level: 'Moderate',
    seasonal_risk: 'High',
    environmental_factor: 'Heavy monsoon runoff & peri-urban pig transport corridor',
    is_demo_data: true,
    source_name: 'Demo Data — Simulated District Profile',
    last_updated: '2026-11-15',
  },
  {
    id: 'dist-lakhimpur',
    district_name: 'Lakhimpur',
    state_name: 'Assam',
    asf_risk_level: 'Low',
    hpai_risk_level: 'Low',
    seasonal_risk: 'Moderate',
    environmental_factor: 'Dispersed rural smallholdings with moderate riverine humidity',
    is_demo_data: true,
    source_name: 'Demo Data — Simulated District Profile',
    last_updated: '2026-11-15',
  },
  {
    id: 'dist-namakkal',
    district_name: 'Namakkal',
    state_name: 'Tamil Nadu',
    asf_risk_level: 'Low',
    hpai_risk_level: 'High',
    seasonal_risk: 'Moderate',
    environmental_factor: 'High commercial poultry cluster density & shared egg/feed transport',
    is_demo_data: true,
    source_name: 'Demo Data — Simulated District Profile',
    last_updated: '2026-11-15',
  },
  {
    id: 'dist-pune',
    district_name: 'Pune Rural',
    state_name: 'Maharashtra',
    asf_risk_level: 'Low',
    hpai_risk_level: 'Moderate',
    seasonal_risk: 'Low',
    environmental_factor: 'Semi-intensive poultry units near seasonal migratory wetlands',
    is_demo_data: true,
    source_name: 'Demo Data — Simulated District Profile',
    last_updated: '2026-11-15',
  },
  {
    id: 'dist-ludhiana',
    district_name: 'Ludhiana',
    state_name: 'Punjab',
    asf_risk_level: 'Moderate',
    hpai_risk_level: 'Low',
    seasonal_risk: 'Moderate',
    environmental_factor: 'High commercial feed truck frequency & winter temperature shifts',
    is_demo_data: true,
    source_name: 'Demo Data — Simulated District Profile',
    last_updated: '2026-11-15',
  },
];

export const POULTRY_QUESTIONS = [
  {
    question_code: 'PLT-01',
    category: 'Visitor & Entry Control',
    question_text:
      'Are outside traders, egg buyers, and non-essential visitors kept outside the poultry shed perimeter with every visit logged?',
    question_text_hi:
      'क्या बाहरी व्यापारियों, अंडा खरीदारों और गैर-जरूरी आगंतुकों को शेड की सीमा के बाहर रखा जाता है और हर प्रवेश दर्ज होता है?',
    risk_weight: 15,
    explanation:
      'Buyers visiting multiple poultry farms carry contaminated litter dust on footwear and clothing.',
    corrective_action:
      'Keep perimeter gates locked, log every visitor in Farm Records, and hand over birds/eggs at an outer loading bay.',
    reference_source: 'FAO Poultry Biosecurity Guide — Access Control',
    risk_tags: ['hpai-sensitive'],
  },
  {
    question_code: 'PLT-02',
    category: 'Vehicle & Transport Hygiene',
    question_text:
      'Are feed trucks and live-bird transport vehicles parked away from sheds and sprayed before entering the farm compound?',
    question_text_hi:
      'क्या दाना ट्रक और पक्षी ले जाने वाले वाहन शेड से दूर खड़े होते हैं और अंदर आने से पहले कीटाणुनाशक से धोए जाते हैं?',
    risk_weight: 15,
    explanation:
      'Truck tires and cages travel across markets and neighbouring farms, spreading droplets and dried droppings.',
    corrective_action:
      'Create a boundary unloading point at least 20m from sheds or sanitize tires and wheel arches at the gate.',
    reference_source: 'DAHD Poultry Biosecurity — Transport Protocol',
    risk_tags: ['hpai-sensitive'],
  },
  {
    question_code: 'PLT-03',
    category: 'Wild Bird Exclusion',
    question_text:
      'Are all shed side walls, vents, and roof eaves covered with intact fine wire mesh (<= 2 cm) to block wild birds?',
    question_text_hi:
      'क्या शेड की सभी खिड़कियां, जाली और खुले हिस्से मजबूत बारीक तार की जाली (<= 2 सेमी) से ढके हैं ताकि जंगली पक्षी अंदर न आ सकें?',
    risk_weight: 20,
    explanation:
      'Sparrows, crows, and migratory birds shed pathogens into open drinkers and feed trays.',
    corrective_action:
      'Inspect mesh weekly and patch every gap >= 2 cm immediately; never leave shed curtains unguarded.',
    reference_source: 'DAHD Poultry Biosecurity Advisory — Wild Bird Barrier',
    risk_tags: ['hpai-sensitive'],
  },
  {
    question_code: 'PLT-04',
    category: 'Disinfection & Footbaths',
    question_text:
      'Is a covered disinfectant footbath (refreshed every 24–48 hours) placed at each shed entrance and used before entry?',
    question_text_hi:
      'क्या हर शेड के दरवाजे पर ढका हुआ कीटाणुनाशक फुटबाथ रखा है (हर 24–48 घंटे में बदला जाता है) और अंदर जाने से पहले उपयोग होता है?',
    risk_weight: 15,
    explanation:
      'Muddy or sun-evaporated footbaths lose disinfectant potency and allow contaminated shoes into the litter.',
    corrective_action:
      'Place a boot-scrub brush next to a roof-shaded footbath tray and log solution refreshes in Farm Records.',
    reference_source: 'WOAH Terrestrial Code — Farm Sanitation',
    risk_tags: ['hpai-sensitive', 'seasonal-sensitive'],
  },
  {
    question_code: 'PLT-05',
    category: 'Shed Downtime & Cleaning',
    question_text:
      'Do you follow All-In / All-Out batching with complete litter removal, detergent wash, disinfection, and 10–14 days dry rest between flocks?',
    question_text_hi:
      'क्या आप ऑल-इन / ऑल-आउट प्रणाली का पालन करते हैं और नए बैच से पहले पुराना बिछावन हटाकर शेड को धोकर 10–14 दिन सुखाते हैं?',
    risk_weight: 15,
    explanation:
      'Multi-age sheds or short turnaround times let respiratory and enteric germs survive from old birds to chicks.',
    corrective_action:
      'Empty the entire shed, scrape caked manure, wash with detergent, disinfect walls/floor, and rest dry before restocking.',
    reference_source: 'FAO Good Poultry Production — All-In / All-Out',
    risk_tags: ['seasonal-sensitive'],
  },
  {
    question_code: 'PLT-06',
    category: 'Water Hygiene',
    question_text:
      'Is bird drinking water sourced from a covered borewell/treated tank and sanitized regularly rather than open ponds?',
    question_text_hi:
      'क्या पक्षियों को ढके हुए टैंक या साफ बोरवेल का उपचारित पानी पिलाया जाता है (खुले तालाब का नहीं)?',
    risk_weight: 15,
    explanation:
      'Open surface water shared with wild waterfowl is a documented transmission route for avian infections.',
    corrective_action:
      'Use closed overhead tanks, flush drinker lines weekly, and sanitize drinking water safely.',
    reference_source: 'FAO Water & Feed Hygiene Practice',
    risk_tags: ['hpai-sensitive', 'seasonal-sensitive'],
  },
  {
    question_code: 'PLT-07',
    category: 'Feed & Rodent Control',
    question_text:
      'Is poultry feed stored dry on raised wooden pallets inside a rodent-proof room with spilled feed cleaned promptly?',
    question_text_hi:
      'क्या मुर्गी का दाना सूखे, चूहा-रोधी कमरे में लकड़ी के पट्टों पर ऊंचाई पर रखा जाता है और गिरा दाना तुरंत साफ होता है?',
    risk_weight: 12,
    explanation:
      'Damp mouldy feed weakens flock immunity, and spilled feed attracts rodents and wild birds.',
    corrective_action:
      'Stack bags 15 cm off the floor and away from walls, seal wall holes, and sweep feed spills daily.',
    reference_source: 'ICAR Poultry Feed & Pest Management',
    risk_tags: ['seasonal-sensitive'],
  },
  {
    question_code: 'PLT-08',
    category: 'Equipment Isolation',
    question_text:
      'Are plastic bird crates, egg trays, feeders, and sprayers kept dedicated to your farm without borrowing from neighbours?',
    question_text_hi:
      'क्या क्रेट, अंडे की ट्रे, फीडर और स्प्रेयर केवल आपके फार्म के लिए हैं और पड़ोसी फार्मों से उधार नहीं लिए जाते?',
    risk_weight: 12,
    explanation:
      'Returned buyer crates and shared sprayers frequently carry droppings between farms.',
    corrective_action:
      'Use disposable paper trays or wash/disinfect all plastic crates outside the shed perimeter before reuse.',
    reference_source: 'DAHD Biosecurity Checklist — Equipment Control',
    risk_tags: ['hpai-sensitive'],
  },
  {
    question_code: 'PLT-09',
    category: 'Mortality & Health Logs',
    question_text:
      'Are daily mortality counts, sudden drops in water/feed intake, or egg drops recorded in a daily log?',
    question_text_hi:
      'क्या दैनिक मृत्यु संख्या, दाना-पानी की कमी या अंडा उत्पादन में गिरावट का रोजाना रिकॉर्ड रखा जाता है?',
    risk_weight: 10,
    explanation:
      'Early shifts in water intake or mortality are the earliest warning signs for timely veterinary advice.',
    corrective_action:
      'Record morning mortality and feed/water observations daily in Farm Records.',
    reference_source: 'Farm Recordkeeping Guideline',
    risk_tags: [],
  },
  {
    question_code: 'PLT-10',
    category: 'Waste & Carcass Disposal',
    question_text:
      'Are dead birds buried deeply with lime or composted in an enclosed, dog-proof pit away from sheds and water sources?',
    question_text_hi:
      'क्या मृत पक्षियों को शेड व पानी से दूर बंद और सुरक्षित गहरे गड्ढे (चूने के साथ) या कंपोस्टर में निपटाया जाता है?',
    risk_weight: 16,
    explanation:
      'Dumping carcasses outdoors draws crows and stray dogs that drag infectious material across neighbouring farms.',
    corrective_action:
      'Maintain a fenced burial pit (>= 2m deep) or bio-composter at least 30m away from sheds and wells.',
    reference_source: 'Livestock Waste & Biosecurity Guidance',
    risk_tags: ['hpai-sensitive', 'seasonal-sensitive'],
  },
];

export const PIG_QUESTIONS = [
  {
    question_code: 'PIG-01',
    category: 'Visitor Restrictions',
    question_text:
      'Are pig traders, middlemen, and outside visitors barred from entering pig pens, with farm-only boots provided if entry is essential?',
    question_text_hi:
      'क्या सूअर व्यापारियों और बाहरी लोगों का बाड़ों में प्रवेश बंद है और जरूरी होने पर केवल फार्म के जूते दिए जाते हैं?',
    risk_weight: 15,
    explanation:
      'Pig traders visit multiple backyards and slaughter points daily, carrying tough viruses on boots and clothes.',
    corrective_action:
      'Lock pen gates, log all visitors in Farm Records, and require clean farm-dedicated boots and handwashing.',
    reference_source: 'FAO ASF Biosecurity Manual — Visitor Control',
    risk_tags: ['asf-sensitive'],
  },
  {
    question_code: 'PIG-02',
    category: 'Animal Movement & Quarantine',
    question_text:
      'Are newly purchased or returning pigs isolated in a separate quarantine pen for 21–30 days before joining the main herd?',
    question_text_hi:
      'क्या नए खरीदे गए या वापस लाए गए सूअरों को मुख्य झुंड में मिलाने से पहले 21–30 दिन अलग क्वारंटाइन बाड़े में रखा जाता है?',
    risk_weight: 20,
    explanation:
      'Market-bought pigs can look healthy during incubation while shedding virus to pregnant sows and growers.',
    corrective_action:
      'Maintain a separate quarantine pen >= 15m from main pens and service it LAST every day.',
    reference_source: 'DAHD National Action Plan on ASF — Quarantine',
    risk_tags: ['asf-sensitive'],
  },
  {
    question_code: 'PIG-03',
    category: 'Swill Feeding Control',
    question_text:
      'Do you strictly avoid feeding untreated kitchen, hotel, or slaughterhouse food waste containing meat scraps to pigs?',
    question_text_hi:
      'क्या आप सूअरों को होटल, घर या कसाईखाने का बिना पका मांस युक्त जूठन (स्विल) खिलाने से पूरी तरह बचते हैं?',
    risk_weight: 25,
    explanation:
      'Untreated pork scraps in swill are one of the highest-risk pathways for severe pig herd mortality events.',
    corrective_action:
      'Feed balanced commercial pellets, maize/bran, or safely boiled plant-only rations; ban raw meat waste.',
    reference_source: 'WOAH / FAO ASF Prevention — Swill Ban Guidance',
    risk_tags: ['asf-sensitive'],
  },
  {
    question_code: 'PIG-04',
    category: 'Cleaning & Disinfection',
    question_text:
      'Are pig pens scraped clean of manure daily, washed, and disinfected with an active gate boot-dip footbath maintained?',
    question_text_hi:
      'क्या सूअर बाड़ों से रोजाना गोबर साफ कर धुलाई व कीटाणुशोधन किया जाता है और गेट पर सक्रिय फुटबाथ रखा है?',
    risk_weight: 15,
    explanation:
      'Organic manure shields pathogens from disinfectants; a clean concrete pen and boot-dip drastically lower risk.',
    corrective_action:
      'Scrape manure before spraying disinfectant and refresh gate footbaths every 24–48 hours.',
    reference_source: 'FAO Good Piggery Sanitation Practices',
    risk_tags: ['asf-sensitive', 'seasonal-sensitive'],
  },
  {
    question_code: 'PIG-05',
    category: 'Perimeter & Stray Pig Barrier',
    question_text:
      'Is your piggery enclosed by solid walls or double fencing so farm pigs have zero contact with free-roaming or wild pigs?',
    question_text_hi:
      'क्या आपका फार्म पक्की दीवार या दोहरी बाड़ से घिरा है ताकि आवारा या जंगली सूअरों से कोई संपर्क न हो?',
    risk_weight: 20,
    explanation:
      'Nose-to-nose contact across weak fences with scavenging or wild pigs spreads infection rapidly.',
    corrective_action:
      'Repair fence gaps immediately and ensure perimeter barriers prevent stray pigs from reaching pens.',
    reference_source: 'DAHD Pig Perimeter Biosecurity Guidance',
    risk_tags: ['asf-sensitive'],
  },
  {
    question_code: 'PIG-06',
    category: 'Water & Drainage Hygiene',
    question_text:
      'Do pigs receive clean covered water and are pens protected from monsoon runoff or stagnant wastewater from nearby yards?',
    question_text_hi:
      'क्या सूअरों को साफ ढका हुआ पानी मिलता है और बाड़े बारिश के बहते गंदे पानी से सुरक्षित हैं?',
    risk_weight: 12,
    explanation:
      'Monsoon runoff carrying neighbouring pig waste into troughs or floor drains contaminates the herd.',
    corrective_action:
      'Raise pen floor thresholds, divert external rainwater drains away from pens, and use clean nipple/trough drinkers.',
    reference_source: 'ICAR Piggery Drainage & Water Hygiene',
    risk_tags: ['seasonal-sensitive'],
  },
  {
    question_code: 'PIG-07',
    category: 'Carcass Disposal',
    question_text:
      'Are dead pigs buried >= 2m deep with quicklime inside a fenced pit rather than discarded in rivers, bushes, or sold?',
    question_text_hi:
      'क्या मृत सूअरों को नदी या झाड़ियों में फेंकने या बेचने के बजाय चूने के साथ 2 मीटर गहरे बंद गड्ढे में दबाया जाता है?',
    risk_weight: 18,
    explanation:
      'Discarded or emergency-sold sick/dead pigs trigger rapid village-to-village spread via scavengers and traders.',
    corrective_action:
      'Use a fenced deep-burial pit covered with quicklime and compacted soil away from water channels.',
    reference_source: 'FAO Safe Carcass Disposal Standard',
    risk_tags: ['asf-sensitive', 'seasonal-sensitive'],
  },
  {
    question_code: 'PIG-08',
    category: 'Dedicated Tools & Needles',
    question_text:
      'Are shovels, buckets, boots, and veterinary syringes kept dedicated to this farm (with single-use needles per pig)?',
    question_text_hi:
      'क्या फावड़े, बाल्टी, जूते और सुई केवल इसी फार्म तक सीमित हैं (और हर सूअर के लिए नई सुई उपयोग होती है)?',
    risk_weight: 12,
    explanation:
      'Reusing needles or sharing manure shovels transfers blood-borne and faecal pathogens between pens.',
    corrective_action:
      'Color-code tools per zone, use sterile disposable needles per animal, and sanitize equipment regularly.',
    reference_source: 'WOAH Herd Health & Injection Hygiene',
    risk_tags: ['asf-sensitive'],
  },
  {
    question_code: 'PIG-09',
    category: 'Loading & Transport Control',
    question_text:
      'Are market pigs loaded at an outer ramp outside the farm boundary so buyer trucks never enter the pen yard?',
    question_text_hi:
      'क्या सूअरों को बेचते समय व्यापारी के वाहन को बाड़े से बाहर रखकर बाहरी लोडिंग रैंप से चढ़ाया जाता है?',
    risk_weight: 15,
    explanation:
      'Buyer trucks carrying pigs from multiple farms often have contaminated bedding inside the cargo deck.',
    corrective_action:
      'Build a simple outer loading chute at the gate and wash down the chute immediately after pickup.',
    reference_source: 'FAO Pig Transport Biosecurity',
    risk_tags: ['asf-sensitive'],
  },
  {
    question_code: 'PIG-10',
    category: 'Mortality & Observation Logs',
    question_text:
      'Are daily pig mortality, fever/lethargy signs, and feed-intake changes logged consistently every day?',
    question_text_hi:
      'क्या दैनिक मृत्यु दर, सुस्ती/बुखार के लक्षण और दाने की खपत में बदलाव का रिकॉर्ड रोज़ दर्ज किया जाता है?',
    risk_weight: 10,
    explanation:
      'Daily observation logs catch sudden appetite drops early so you can isolate pens and call a veterinarian.',
    corrective_action:
      'Log daily mortality and feeding observations every morning in Farm Records.',
    reference_source: 'Farm Biosecurity Recordkeeping Practice',
    risk_tags: [],
  },
];

export const DEMO_LESSONS = [
  {
    id: 'lesson-1',
    slug: 'boot-dip-footbath',
    species: 'Both',
    title: 'How to Maintain an Effective Footbath',
    title_hi: 'सही कीटाणुनाशक फुटबाथ कैसे बनाए रखें',
    summary:
      'Boots carry mud, manure, and unseen germs from roads straight into your sheds. A clean two-step boot dip stops most footwear transfer.',
    summary_hi:
      'जूते सड़क और बाहर से कीचड़ व कीटाणु शेड के अंदर लाते हैं। दो-चरणीय फुटबाथ इसे रोकता है।',
    dos: [
      'Wash off mud with water and a brush before stepping into disinfectant.',
      'Keep the footbath covered from rain and direct sun.',
      'Replace the disinfectant solution every 24–48 hours.',
    ],
    donts: [
      'Do not dip muddy boots directly into disinfectant (mud cancels the chemical).',
      'Do not leave the tray dry or overflowing with rainwater.',
    ],
    image_url: '/src/assets/images/lesson_pig_biosecurity_1795259027608.jpg',
    reference_source: 'FAO Practical Farm Sanitation Guide',
  },
  {
    id: 'lesson-2',
    slug: 'no-untreated-swill',
    species: 'Pig',
    title: 'Why Untreated Kitchen Swill Endangers Pigs',
    title_hi: 'बिना उबला रसोई जूठन सूअरों के लिए खतरनाक क्यों है',
    summary:
      'Leftover meat scraps from hotels or households can carry tough viruses for months. Feeding raw swill is the fastest way herds fall sick.',
    summary_hi:
      'होटल या घर के बचे हुए मांस के टुकड़ों में खतरनाक कीटाणु महीनों तक जीवित रह सकते हैं।',
    dos: [
      'Feed balanced commercial pellets, maize, or properly cooked crop byproducts.',
      'Store all pig feed in sealed, rat-proof bins.',
    ],
    donts: [
      'Never feed raw meat scraps or unboiled hotel waste to pigs.',
      'Do not allow pigs to forage in open garbage dumps.',
    ],
    image_url: '/src/assets/images/lesson_pig_biosecurity_1795259027608.jpg',
    reference_source: 'DAHD ASF Prevention Guidance',
  },
  {
    id: 'lesson-3',
    slug: 'wild-bird-netting',
    species: 'Poultry',
    title: 'Wild Bird Exclusion for Poultry Sheds',
    title_hi: 'मुर्गी शेड को जंगली पक्षियों से सुरक्षित रखना',
    summary:
      'Sparrows, pigeons, and migratory birds look for easy feed and water inside sheds and can drop contamination into poultry litter.',
    summary_hi:
      'गौरैया, कबूतर और प्रवासी पक्षी दाने-पानी के लिए शेड में आकर संक्रमण फैला सकते हैं।',
    dos: [
      'Cover all side openings with strong 1-inch or smaller wire mesh.',
      'Clear spilled feed outside sheds promptly.',
      'Inspect netting corners weekly for holes.',
    ],
    donts: [
      'Do not leave feed bags open outdoors.',
      'Do not share pond water used by wild ducks.',
    ],
    image_url: '/src/assets/images/lesson_poultry_hygiene_1795259026906.jpg',
    reference_source: 'FAO Poultry Biosecurity Manual',
  },
  {
    id: 'lesson-4',
    slug: 'quarantine-new-stock',
    species: 'Pig',
    title: '21-Day Quarantine for New Pigs',
    title_hi: 'नए सूअरों के लिए 21-दिन का क्वारंटाइन नियम',
    summary:
      'An animal bought at a market may look healthy today while carrying an illness that shows up 10 days later. Isolation protects your main herd.',
    summary_hi:
      'बाज़ार से लाया गया नया सूअर दिखने में स्वस्थ लग सकता है पर बीमारी छिपी हो सकती है। अलग रखना मुख्य झुंड को बचाता है।',
    dos: [
      'Keep new or returning pigs in a separate pen for 21–30 days.',
      'Feed and clean the quarantine pen LAST each day.',
    ],
    donts: [
      'Do not mix new pigs directly with pregnant sows or growers.',
      'Do not use the same shovel or bucket across both pens.',
    ],
    image_url: '/src/assets/images/lesson_pig_biosecurity_1795259027608.jpg',
    reference_source: 'WOAH Herd Health Guidance',
  },
  {
    id: 'lesson-5',
    slug: 'visitor-gate-protocol',
    species: 'Both',
    title: 'Controlled Entry & Visitor Register',
    title_hi: 'नियंत्रित प्रवेश और आगंतुक रजिस्टर',
    summary:
      'Every trader, feed truck, or neighbour entering your yard brings risk from the last farm they visited. Logging visits keeps your farm traceable.',
    summary_hi:
      'हर व्यापारी या बाहर से आने वाला व्यक्ति पिछले फार्म से खतरा ला सकता है। एंट्री लिखना सुरक्षा की पहली सीढ़ी है।',
    dos: [
      'Park buyer vehicles outside the farm boundary.',
      'Write down visitor name, date, and purpose in Farm Records.',
      'Provide clean farm-only slippers or boot covers if entry is essential.',
    ],
    donts: [
      'Do not let livestock buyers walk inside active sheds.',
      'Do not skip visitor logging during busy harvest or sale days.',
    ],
    image_url: '/src/assets/images/hero_farm_biosecurity_1795259029019.jpg',
    reference_source: 'Farm Biosecurity Standard Operating Practice',
  },
  {
    id: 'lesson-6',
    slug: 'safe-carcass-disposal',
    species: 'Both',
    title: 'Safe Mortality & Carcass Disposal',
    title_hi: 'मृत पशुओं और पक्षियों का सुरक्षित निपटान',
    summary:
      'Leaving dead birds or pigs near bushes or drains invites stray dogs and crows to scatter infectious material to nearby farms.',
    summary_hi:
      'मृत पशु या पक्षी खुले में छोड़ने से कुत्ते और कौवे बीमारी को आसपास के फार्मों में फैलाते हैं।',
    dos: [
      'Use a deep covered burial pit (with quicklime) or enclosed bio-composter.',
      'Log every death immediately in Farm Records.',
      'Contact a veterinarian promptly if mortality rises unexpectedly.',
    ],
    donts: [
      'Never throw carcasses into rivers, ponds, or roadside bushes.',
      'Never sell or consume animals that died from sudden unknown illness.',
    ],
    image_url: '/src/assets/images/lesson_poultry_hygiene_1795259026906.jpg',
    reference_source: 'Livestock Waste & Biosecurity Reference',
  },
  {
    id: 'lesson-7',
    slug: 'clean-water-lines',
    species: 'Poultry',
    title: 'Clean Water Lines & Dry Litter Management',
    title_hi: 'स्वच्छ पेयजल पाइप और सूखा बिछावन प्रबंधन',
    summary:
      'Wet caked litter breeds harmful microbes and ammonia. Sanitized water pipes keep birds hydrated and resilient.',
    summary_hi:
      'गीला बिछावन और गंदी पानी की पाइप पक्षियों में संक्रमण और कमज़ोरी बढ़ाती है।',
    dos: [
      'Flush drinker lines weekly and use covered water tanks.',
      'Turn litter regularly and replace wet patches around drinkers.',
    ],
    donts: [
      'Do not use untreated pond or open canal water for poultry.',
      'Do not allow leaking nipples to soak floor litter.',
    ],
    image_url: '/src/assets/images/lesson_poultry_hygiene_1795259026906.jpg',
    reference_source: 'Poultry Shed Hygiene Reference',
  },
  {
    id: 'lesson-8',
    slug: 'all-in-all-out-batching',
    species: 'Both',
    title: 'All-In / All-Out & Shed Rest Period',
    title_hi: 'ऑल-इन / ऑल-आउट और शेड विश्राम अवधि',
    summary:
      'Mixing old and young batches in the same shed keeps silent infections circulating forever. Resting the empty shed breaks the cycle.',
    summary_hi:
      'एक ही शेड में पुराने और नए बैच मिलाने से संक्रमण लगातार बना रहता है। खाली शेड को आराम देने से चक्र टूटता है।',
    dos: [
      'Empty the entire shed, scrub with detergent, disinfect, and dry for 10–14 days.',
      'Keep different age groups in separate sheds whenever possible.',
    ],
    donts: [
      'Do not place new chicks or piglets onto old uncleaned bedding.',
    ],
    image_url: '/src/assets/images/hero_farm_biosecurity_1795259029019.jpg',
    reference_source: 'FAO Compartment Readiness Practice',
  },
];

// Clean zero-record starting state for ALL three demo roles (Farmer, Veterinarian, Authority)
export const INITIAL_DEMO_STATE = {
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
