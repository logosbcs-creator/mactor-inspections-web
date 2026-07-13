/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  INSPECTOR MACTOR — Central Character Module
 *  FixMyProperty · Virtual Property Inspector · GTA Toronto
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Single source of truth for:
 *    • Identity & personality
 *    • Conversational phrases (5 languages)
 *    • Issue categories + follow-up questions
 *    • AI photo analysis prompt builder
 *    • Category auto-detection from text
 *    • Report helpers
 *
 *  Import: import { MACTOR, M, CATEGORIES, detectCategory, buildPhotoPrompt } from '@/inspector-mactor/character'
 */

import type { Lang } from '../i18n/translations';

// ─── Identity ─────────────────────────────────────────────────────────────────
export const MACTOR = {
  name:      'Inspector MacTor',
  role:      'Virtual Property Inspector',
  brand:     'FixMyProperty',
  avatar:    '🔍',
  tagline:   { en: "Show me what's going on.", es: 'Muéstrame qué está pasando.', zh: '告诉我发生了什么。', hi: 'मुझे दिखाइए क्या हो रहा है।', tl: 'Ipakita mo sa akin ang nangyayari.' } as Record<Lang, string>,
  /**
   * Personality pillars — used to calibrate AI prompts and UI tone.
   * MacTor sounds like a trusted tech, not a salesman or chatbot.
   */
  personality: [
    'Experienced residential & commercial property technician — 20+ years GTA',
    'Calm, practical, no sales pressure',
    'Honest assessment — tells you the bad news clearly',
    'Plain-language explanations, zero jargon unless necessary',
    'Gets straight to the point',
    'Cares about the client\'s safety more than the job',
  ],
};

// ─── Issue Categories ──────────────────────────────────────────────────────────
export type IssueCategory =
  | 'plumbing' | 'electrical' | 'structural' | 'hvac'
  | 'roofing' | 'water_damage' | 'pests' | 'doors_windows'
  | 'exterior' | 'other';

export interface CategoryDef {
  icon: string;
  name:              Record<Lang, string>;
  photoHint:         Record<Lang, string>;        // contextual photo guidance
  followUpQuestions: Record<Lang, string[]>;      // 3 targeted questions per category
}

export const CATEGORIES: Record<IssueCategory, CategoryDef> = {
  plumbing: {
    icon: '🔧',
    name:     { en: 'Plumbing', es: 'Plomería', zh: '管道', hi: 'प्लंबिंग', tl: 'Tubero' },
    photoHint: {
      en: "Show me the leak, drain, pipe, or fixture. Include surrounding area so I can gauge the extent.",
      es: "Muéstrame la fuga, desagüe, tubería o accesorio. Incluye el área circundante.",
      zh: "拍摄漏水点、管道或水龙头，包括周围区域以便评估范围。",
      hi: "रिसाव, नाली, पाइप या फिटिंग दिखाएं। आसपास का क्षेत्र भी शामिल करें।",
      tl: "Ipakita ang tubo, drain, o leak. Isama ang paligid para makita ang lawak ng problema.",
    },
    followUpQuestions: {
      en: ["How long has this been happening?", "Is the water damage spreading or contained?", "Have you shut off the water supply to this area?"],
      es: ["¿Cuánto tiempo lleva pasando esto?", "¿El daño por agua se está expandiendo?", "¿Has cerrado el suministro de agua en esta zona?"],
      zh: ["这种情况持续多久了？", "水损是否在扩散？", "是否已关闭该区域供水？"],
      hi: ["यह कब से हो रहा है?", "क्या पानी का नुकसान फैल रहा है?", "क्या आपने पानी की सप्लाई बंद की है?"],
      tl: ["Gaano katagal na itong nangyayari?", "Lumalawak ba ang pinsala ng tubig?", "Isinara mo na ba ang supply ng tubig?"],
    },
  },

  electrical: {
    icon: '⚡',
    name:     { en: 'Electrical', es: 'Eléctrico', zh: '电气', hi: 'बिजली', tl: 'Kuryente' },
    photoHint: {
      en: "Show me the outlet, panel, fixture, or wiring. Keep distance if there's any sparking or burning smell — safety first.",
      es: "Muéstrame el enchufe, panel, accesorio o cableado. Mantén distancia si hay chispas.",
      zh: "拍摄插座、电箱或电线。如有火花或烧焦气味请保持距离。",
      hi: "आउटलेट, पैनल या तार दिखाएं। चिंगारी या जलने की गंध हो तो दूर से फोटो लें।",
      tl: "Ipakita ang outlet, panel, o wire. Magpanatili ng distansya kung may sparks o amoy sunog.",
    },
    followUpQuestions: {
      en: ["Is there a burning smell or visible scorch marks?", "Has the circuit breaker tripped for this area?", "When did you first notice this issue?"],
      es: ["¿Hay olor a quemado o marcas de chamuscado?", "¿Se ha disparado el disyuntor de esta área?", "¿Cuándo notaste este problema por primera vez?"],
      zh: ["是否有烧焦气味或烧痕？", "该区域的断路器是否跳闸？", "您什么时候第一次注意到这个问题？"],
      hi: ["जलने की गंध या निशान है?", "क्या सर्किट ब्रेकर ट्रिप हुआ?", "यह समस्या कब पहली बार देखी?"],
      tl: ["May amoy sunog o tanda ng pagkasusunog?", "Na-trip na ba ang circuit breaker?", "Kailan mo unang napansin ito?"],
    },
  },

  structural: {
    icon: '🏗️',
    name:     { en: 'Structural', es: 'Estructural', zh: '结构', hi: 'संरचनात्मक', tl: 'Istruktura' },
    photoHint: {
      en: "Show me the crack, settlement, or damage in context. A coin or ruler next to it helps me judge scale.",
      es: "Muéstrame la grieta o daño. Una moneda al lado ayuda para medir la escala.",
      zh: "拍摄裂缝或损坏，放一枚硬币作比例参照效果更好。",
      hi: "दरार या क्षति दिखाएं। पैमाने के लिए एक सिक्का पास रखें।",
      tl: "Ipakita ang bitak o pinsala. Lagyan ng barya para sa scale.",
    },
    followUpQuestions: {
      en: ["Is this crack growing? When did you first see it?", "Are there doors or windows that no longer close properly nearby?", "Is the building on a slab, crawl space, or basement foundation?"],
      es: ["¿Está creciendo esta grieta? ¿Cuándo la viste por primera vez?", "¿Hay puertas o ventanas que ya no cierran bien?", "¿El edificio tiene losa, espacio angosto o sótano?"],
      zh: ["这条裂缝在扩大吗？你什么时候第一次看到的？", "附近有门窗关不上吗？", "建筑是板式、爬行空间还是地下室基础？"],
      hi: ["क्या यह दरार बढ़ रही है? पहली बार कब देखा?", "क्या पास के दरवाजे/खिड़कियां ठीक से बंद नहीं होते?", "बिल्डिंग स्लैब, क्रॉल स्पेस या बेसमेंट पर है?"],
      tl: ["Lumalaki ba ang bitak? Kailan mo unang nakita?", "May mga pinto o bintana bang hindi maayos na nagsasara?", "Slab, crawl space, o basement foundation ba?"],
    },
  },

  hvac: {
    icon: '🌡️',
    name:     { en: 'HVAC / Heating & Cooling', es: 'Calefacción / Aire Acondicionado', zh: '暖通空调', hi: 'हीटिंग/कूलिंग', tl: 'HVAC' },
    photoHint: {
      en: "Show me the unit, vents, thermostat, or ductwork — any visible damage, rust, or leaking.",
      es: "Muéstrame la unidad, conductos, termostato o rejillas. Cualquier daño, óxido o fuga visible.",
      zh: "拍摄空调机组、通风口、温控器或管道，包括可见损坏或锈蚀。",
      hi: "यूनिट, वेंट, थर्मोस्टेट या डक्टवर्क दिखाएं।",
      tl: "Ipakita ang unit, vents, thermostat, o ductwork.",
    },
    followUpQuestions: {
      en: ["Is it not heating/cooling at all, or just underperforming?", "Is it making unusual noises? Describe them.", "When was the last filter change or service?"],
      es: ["¿No calienta/enfría en absoluto, o solo tiene bajo rendimiento?", "¿Hace ruidos inusuales? Descríbelos.", "¿Cuándo fue el último cambio de filtro o servicio?"],
      zh: ["是完全不制热/冷，还是只是效果差？", "是否有异常声音？描述一下。", "上次更换过滤器或维修是什么时候？"],
      hi: ["यह बिल्कुल काम नहीं कर रहा, या बस कम चल रहा है?", "क्या असामान्य शोर हो रहा है?", "आखिरी बार फिल्टर कब बदला था?"],
      tl: ["Hindi talaga gumagana, o mababa lang ang performance?", "May kakaibang ingay ba? Ilarawan.", "Kailan nag-palit ng filter o nagpaayos?"],
    },
  },

  roofing: {
    icon: '🏠',
    name:     { en: 'Roofing', es: 'Techo', zh: '屋顶', hi: 'छत', tl: 'Bubong' },
    photoHint: {
      en: "Show me the damaged shingles, flashing, gutters, or ceiling stains inside. Safety first — don't climb if unsafe.",
      es: "Muéstrame las tejas dañadas, sellado o manchas en el techo interior. Seguridad primero.",
      zh: "拍摄受损瓦片、防水板或室内天花板水渍。安全第一，不要冒险攀爬。",
      hi: "टूटी टाइल, फ्लैशिंग या अंदरूनी छत के दाग दिखाएं। ऊपर चढ़ना असुरक्षित हो तो मत जाएं।",
      tl: "Ipakita ang sirang shingles, flashing, o water stains sa loob. Safety muna.",
    },
    followUpQuestions: {
      en: ["Is there active leaking or water stains on interior ceilings?", "How old is the roof approximately?", "Any recent heavy storm or hail event?"],
      es: ["¿Hay goteras activas o manchas de agua en techos interiores?", "¿Qué edad tiene el techo aproximadamente?", "¿Hubo alguna tormenta fuerte o granizo reciente?"],
      zh: ["室内天花板是否有活跃漏水或水渍？", "屋顶大概多少年了？", "最近有暴风雨或冰雹吗？"],
      hi: ["अंदर छत पर पानी के दाग या सक्रिय रिसाव है?", "छत कितनी पुरानी है?", "हाल में तूफान या ओले पड़े?"],
      tl: ["May aktibong leakage o water stains sa loob?", "Gaano katagal na ang bubong?", "May malakas na ulan o hail kamakailan?"],
    },
  },

  water_damage: {
    icon: '💧',
    name:     { en: 'Water Damage / Mold', es: 'Daño por Agua / Moho', zh: '水损/霉菌', hi: 'पानी की क्षति/फफूंद', tl: 'Water Damage / Amag' },
    photoHint: {
      en: "Show me the stained or damaged area. If there's mold, take one wide shot then a close-up.",
      es: "Muéstrame el área manchada. Si hay moho, toma una foto amplia y luego un primer plano.",
      zh: "拍摄受损或有污渍的区域。如有霉菌，先拍广角再拍特写。",
      hi: "दाग या क्षतिग्रस्त क्षेत्र दिखाएं। फफूंद हो तो पहले चौड़ा फोटो, फिर क्लोज-अप।",
      tl: "Ipakita ang may mantsa o nasirang lugar. Kung may amag, kumuha ng malawak at close-up na larawan.",
    },
    followUpQuestions: {
      en: ["Do you know where the water is coming from? (roof, pipe, condensation, flooding?)", "How long has the moisture been present?", "Is there a musty smell in this area?"],
      es: ["¿Sabes de dónde viene el agua? (techo, tubería, condensación, inundación?)", "¿Cuánto tiempo lleva la humedad?", "¿Hay olor a humedad en esta zona?"],
      zh: ["你知道水从哪里来吗？（屋顶、管道、冷凝、洪水？）", "湿气存在多久了？", "这个区域有霉味吗？"],
      hi: ["पानी का स्रोत पता है? (छत, पाइप, कंडेनसेशन, बाढ़?)", "नमी कितने समय से है?", "इस क्षेत्र में सीलन की गंध है?"],
      tl: ["Alam mo ba ang pinagmulan ng tubig?", "Gaano katagal na ang kahalumigmigan?", "May amoy amag sa lugar na ito?"],
    },
  },

  pests: {
    icon: '🦟',
    name:     { en: 'Pests / Infestation', es: 'Plagas / Infestación', zh: '害虫', hi: 'कीट', tl: 'Peste' },
    photoHint: {
      en: "Show me droppings, damage, entry points, or nests. Don't disturb an active nest — photo from a distance.",
      es: "Muéstrame los excrementos, daños, puntos de entrada o nidos. No molestes un nido activo.",
      zh: "拍摄排泄物、损坏或巢穴。不要惊扰活动中的巢穴。",
      hi: "बूंद, क्षति या घोंसले दिखाएं। सक्रिय घोंसले को दूर से फोटो लें।",
      tl: "Ipakita ang dumi, pinsala, entry points, o pugad. Huwag guluhin ang aktibong pugad.",
    },
    followUpQuestions: {
      en: ["What type? (rodents, cockroaches, ants, bedbugs, wasps, other?)", "Which rooms or areas are affected?", "Have you tried any treatments already?"],
      es: ["¿Qué tipo? (roedores, cucarachas, hormigas, chinches, avispas, otra?)", "¿Qué áreas están afectadas?", "¿Has intentado algún tratamiento?"],
      zh: ["是哪种害虫？（鼠类、蟑螂、蚂蚁、床虱、黄蜂、其他？）", "哪些区域受影响？", "您尝试过任何处理方法吗？"],
      hi: ["किस प्रकार के कीट? (चूहे, तिलचट्टे, चींटियां, खटमल?)", "कौन से क्षेत्र प्रभावित हैं?", "क्या आपने कोई उपाय किया है?"],
      tl: ["Anong uri? (daga, ipis, langgam, surot, putakti, iba?)", "Aling mga lugar ang apektado?", "Nasubukan mo na bang magtamot?"],
    },
  },

  doors_windows: {
    icon: '🚪',
    name:     { en: 'Doors & Windows', es: 'Puertas y Ventanas', zh: '门窗', hi: 'दरवाजे और खिड़कियां', tl: 'Pinto at Bintana' },
    photoHint: {
      en: "Show me the full door or window, then a close-up of the problem area (broken seal, damaged frame, gap, hardware).",
      es: "Muéstrame la puerta o ventana completa, luego un primer plano del problema.",
      zh: "先拍完整的门或窗，再拍问题区域特写（密封、框架、缝隙、五金）。",
      hi: "पूरा दरवाजा या खिड़की दिखाएं, फिर समस्या क्षेत्र का क्लोज-अप।",
      tl: "Ipakita ang buong pinto o bintana, pagkatapos ay close-up ng problema.",
    },
    followUpQuestions: {
      en: ["Is this a draft/air leak, a security issue, or visible damage?", "Does it still open and close?", "Is there condensation or fogging between the glass panes?"],
      es: ["¿Es corriente de aire, problema de seguridad o daño visible?", "¿Todavía abre y cierra?", "¿Hay condensación entre los vidrios?"],
      zh: ["这是通风漏气、安全问题还是可见损坏？", "还能开关吗？", "玻璃之间是否有冷凝或雾气？"],
      hi: ["यह ड्राफ्ट, सुरक्षा या दृश्य क्षति की समस्या है?", "क्या यह खुलता-बंद होता है?", "कांच के बीच भाप/धुंध है?"],
      tl: ["Draft, seguridad, o nakikitang pinsala ba ito?", "Bumubukas at nagsasara pa rin ba?", "May condensation sa pagitan ng salamin?"],
    },
  },

  exterior: {
    icon: '🧱',
    name:     { en: 'Exterior / Siding', es: 'Exterior / Revestimiento', zh: '外墙', hi: 'बाहरी दीवार', tl: 'Labas / Siding' },
    photoHint: {
      en: "Step back for a wide shot, then close-ups of the damaged siding, paint, steps, driveway, or fencing.",
      es: "Toma una foto amplia primero, luego primeros planos del revestimiento, pintura, escalones o cerca dañados.",
      zh: "先拍广角，再拍受损护墙板、油漆、台阶或围栏的特写。",
      hi: "पहले चौड़ा फोटो, फिर क्षतिग्रस्त साइडिंग, पेंट, सीढ़ियों का क्लोज-अप।",
      tl: "Lumayo muna para sa malawak na shot, pagkatapos ay close-up ng sirang siding, pintura, o hagdan.",
    },
    followUpQuestions: {
      en: ["Is water getting through, or is this mostly cosmetic?", "Has this gotten noticeably worse recently?", "What material is the exterior? (brick, vinyl, wood, stucco, fiber cement?)"],
      es: ["¿Entra agua, o es principalmente cosmético?", "¿Ha empeorado notablemente recientemente?", "¿Qué material es el exterior? (ladrillo, vinilo, madera, estuco?)"],
      zh: ["是有水渗入，还是主要是外观问题？", "最近是否明显变得更糟？", "外墙是什么材料？（砖、乙烯基、木材、灰泥？）"],
      hi: ["पानी अंदर आ रहा है, या यह ज्यादातर सौंदर्य क्षति है?", "यह हाल में और बुरा हुआ है?", "बाहरी सामग्री क्या है? (ईंट, विनाइल, लकड़ी?)"],
      tl: ["Tumatawid ba ang tubig, o cosmetic lang?", "Lumala ba ito kamakailan?", "Anong materyales ang exterior?"],
    },
  },

  other: {
    icon: '❓',
    name:     { en: "Other / Not Sure", es: 'Otro / No Estoy Seguro', zh: '其他/不确定', hi: 'अन्य/निश्चित नहीं', tl: 'Iba / Hindi Sigurado' },
    photoHint: {
      en: "Show me the problem from multiple angles. Include the surrounding area for context.",
      es: "Muéstrame el problema desde varios ángulos. Incluye el área circundante.",
      zh: "从多个角度拍摄问题，包括周围区域以提供背景信息。",
      hi: "समस्या को अलग-अलग कोणों से दिखाएं।",
      tl: "Ipakita ang problema mula sa iba't ibang anggulo. Isama ang paligid.",
    },
    followUpQuestions: {
      en: ["How long has this been an issue?", "Is it getting worse over time?", "Has anyone looked at it before?"],
      es: ["¿Cuánto tiempo lleva siendo un problema?", "¿Está empeorando con el tiempo?", "¿Alguien lo ha revisado antes?"],
      zh: ["这个问题存在多久了？", "随着时间推移是否在恶化？", "以前有人检查过吗？"],
      hi: ["यह कब से समस्या है?", "क्या यह समय के साथ बिगड़ रही है?", "क्या किसी ने पहले इसे देखा है?"],
      tl: ["Gaano katagal nang ito ay problema?", "Lumalala ba ito sa paglipas ng panahon?", "May nakatingin na ba dito noon?"],
    },
  },
};

export const CATEGORY_LIST = Object.keys(CATEGORIES) as IssueCategory[];

// ─── MacTor Script — Conversational UI phrases ────────────────────────────────
export interface MacTorScript {
  tagline:        string;
  subtitle:       string;

  // Landing
  welcomeTagline:         string;
  whatDoYouNeed:          string;
  serviceRepairLabel:     string;
  serviceRepairDesc:      string;
  serviceNewProjectLabel: string;
  serviceNewProjectDesc:  string;
  repairContextMsg:       string;
  newProjectContextMsg:   string;

  // Step: Describe (repair)
  describeTitle:       string;
  describePrompt:      string;
  describePlaceholder: string;
  describeHint:        string;
  describeNext:        string;

  // Step: Describe (new project)
  newProjectDescribeTitle:       string;
  newProjectDescribePrompt:      string;
  newProjectDescribePlaceholder: string;
  newProjectDescribeHint:        string;

  // Step: Category
  categoryTitle:    string;
  categoryDetected: (cat: string) => string;
  categoryConfirm:  string;
  categoryChange:   string;
  categorySelect:   string;

  // Step: Photos
  photoTitle:    string;
  photoPrompt:   string;
  addPhoto:      string;
  addMore:       string;
  uploading:     string;
  analyzing:     string;
  maxPhotos:     (n: number) => string;
  noDamage:      string;
  photoError:    string;
  progress:      (done: number, total: number) => string;
  takePhoto:     string;
  uploadPhoto:   string;

  // New project specific
  newProjectPhotoPrompt:    string;
  newProjectPhotoSub:       string;
  siteRecorded:             string;
  siteObservations:         string;
  projectEstimateHeader:    string;
  sitePhotosLabel:          string;
  projectRequestLabel:      string;
  newProjectReportGreeting: string;
  newProjectReportSub:      string;
  requestProjectEstimate:   string;
  projectFollowupIntro:     string;
  projectFollowupSub:       string;
  newProjectFollowUpQs:     string[];
  projectEstimateReady:     string;
  projectEstimateSub:       string;
  newProjectLabel:          string;
  sitePhotoCount:           (n: number) => string;

  // CTA to report
  reportCTA:     (n: number) => string;
  partialCTA:    string;

  // Report — MacTor presents findings
  reportGreeting: (n: number) => string;
  reportNoIssues: string;
  criticalAlert:  string;

  // Follow-up
  followupTitle:  string;
  followupIntro:  string;
  followupSkip:   string;
  followupNext:   string;
  answerHint:     string;

  // Estimate offer
  estimateTitle:  string;
  estimateText:   string;
  estimateYes:    string;
  estimateNo:     string;

  // Contact (only when estimate requested)
  contactTitle:   string;
  contactIntro:   string;

  // Property type (landing)
  propertyLabel:  string;
  residential:    string;
  residentialDesc: string;
  commercial:     string;
  commercialDesc: string;
  startBtn:       string;
  starting:       string;
  connectionError: string;

  // Misc
  back:    string;
  next:    string;
  skip:    string;
  confirm: string;
  free:    string;

  // Hero (landing v2)
  heroEyebrow:          string;
  heroHeadlinePre:      string;
  heroHeadlineHighlight: string;
  heroSubtitle:         string;
  heroBadgeFree:        string;
  heroBadgeInstant:     string;
  heroBadgeLocation:    string;
  heroSpeechBubble:     string;
  heroStepLabel:        (n: number) => string;
  heroStepService:      string;
  heroStepProperty:     string;
  heroStepPhotos:       string;
  heroCtaMain:          string;
  heroCtaSub:           string;
  heroFeature1Title:    string;
  heroFeature1Desc:     string;
  heroFeature2Title:    string;
  heroFeature2Desc:     string;
  heroFeature3Title:    string;
  heroFeature3Desc:     string;
  heroFeature4Title:    string;
  heroFeature4Desc:     string;
  heroScrollCue:        string;
  heroLockedHint:       string;
}

// ─── English ──────────────────────────────────────────────────────────────────
const en: MacTorScript = {
  tagline:  "Show me what's going on.",
  subtitle: 'Free AI property inspection · GTA Toronto',

  welcomeTagline:         "Hi! How can we help you today?",
  whatDoYouNeed:          "What do you need?",
  serviceRepairLabel:     "Repair",
  serviceRepairDesc:      "Fix a problem or damage",
  serviceNewProjectLabel: "New project",
  serviceNewProjectDesc:  "Build, install, or renovate",
  repairContextMsg:       "Tell me what's wrong and share a photo — I'll assess it right away.",
  newProjectContextMsg:   "Tell me what you have in mind. Include measurements and materials if you can.",

  describeTitle:       "What's the issue?",
  describePrompt:      "Describe the problem in a few words. I'll guide you from there.",
  describePlaceholder: 'e.g. "Water stain on ceiling", "Crack in wall", "Heater not working"…',
  describeHint:        "No need for technical terms — just tell me what you're seeing.",
  describeNext:        'Got it →',

  newProjectDescribeTitle:       "Tell us about your project",
  newProjectDescribePrompt:      "What do you have in mind? The more details, the better.",
  newProjectDescribePlaceholder: 'e.g. "Paint living room ceiling, 30×10 ft, popcorn texture. Want it smooth."',
  newProjectDescribeHint:        "Include measurements, materials, or timeline if possible.",

  categoryTitle:    'Issue category',
  categoryDetected: (cat) => `Looks like a ${cat} issue. Is that right?`,
  categoryConfirm:  "Yes, that's it",
  categoryChange:   'Choose a different category',
  categorySelect:   'Select the category that fits best',

  photoTitle:   'Show me the problem',
  photoPrompt:  "Now I need to see it. Take photos of the affected area and I'll analyze them.",
  addPhoto:     'Take or upload photo',
  addMore:      'Add another photo',
  uploading:    'Uploading…',
  analyzing:    'Analyzing…',
  maxPhotos:    (n) => `${n} photos max · AI analyzing`,
  noDamage:     '✓ No damage detected in this photo',
  photoError:   '✗ Could not process this photo',
  progress:     (done, total) => `Reviewing… ${done} of ${total} done`,
  takePhoto:    'Take photo',
  uploadPhoto:  'Upload photo',

  newProjectPhotoPrompt:    'Share photos of the site or space where the work will be done.',
  newProjectPhotoSub:       "I'll use them as context — the main guide is your written description.",
  siteRecorded:             'Site recorded',
  siteObservations:         'SITE OBSERVATIONS',
  projectEstimateHeader:    'PROJECT ESTIMATE',
  sitePhotosLabel:          'SITE PHOTOS',
  projectRequestLabel:      'PROJECT REQUEST',
  newProjectReportGreeting: "I've reviewed your request and the site photos. Here's a summary for planning and quoting.",
  newProjectReportSub:      "Request an estimate below and I'll get back to you with pricing.",
  requestProjectEstimate:   'Request a project estimate →',
  projectFollowupIntro:     'A few quick details will help me give you a more accurate quote.',
  projectFollowupSub:       "Optional — skip anything that doesn't apply.",
  newProjectFollowUpQs: [
    "What's your target timeline for this project?",
    'Do you have a budget range in mind?',
    'Any specific materials, finishes, or requirements?',
  ],
  projectEstimateReady: 'Ready to send your project request to MacTor?',
  projectEstimateSub:   "Free — no commitment. You'll get a quote within 24 hours.",
  newProjectLabel:      'New project',
  sitePhotoCount:       (n) => `${n} site photo${n !== 1 ? 's' : ''}`,

  reportCTA:  (n) => n > 0 ? `See my report → (${n} issue${n > 1 ? 's' : ''} found)` : 'See my report →',
  partialCTA: 'Review findings so far →',

  reportGreeting: (n) => n > 0
    ? `I found ${n} issue${n > 1 ? 's' : ''} that need${n === 1 ? 's' : ''} your attention.`
    : "Good news — I didn't find any significant issues.",
  reportNoIssues: 'Everything looks okay based on the photos you shared.',
  criticalAlert:  '⚠ This needs immediate attention.',

  followupTitle: 'A couple more questions',
  followupIntro: "To give you a more accurate estimate, I have a few quick questions about what you're seeing.",
  followupSkip:  'Skip — just give me the estimate',
  followupNext:  'Done →',
  answerHint:    'Optional — the more you tell me, the better the estimate',

  estimateTitle: 'Want a repair estimate?',
  estimateText:  "I'll email you a detailed cost estimate. Free, no commitment, no sales calls.",
  estimateYes:   'Yes, email me the estimate',
  estimateNo:    'No thanks — just the report',

  contactTitle:   'Where should I send it?',
  contactIntro:   "I'll have your estimate ready within a few hours.",

  propertyLabel:  'Property type',
  residential:    'Residential',
  residentialDesc: 'House, condo, apartment',
  commercial:     'Commercial',
  commercialDesc: 'Office, retail, building',
  startBtn:       'Start Inspection →',
  starting:       'Starting…',
  connectionError: 'Connection error. Please check your internet.',

  back:    '← Back',
  next:    'Next →',
  skip:    'Skip',
  confirm: 'Confirm',
  free:    'Free',

  heroEyebrow:           'Free AI Property Inspection',
  heroHeadlinePre:       "What needs",
  heroHeadlineHighlight: 'done?',
  heroSubtitle:          'Upload a photo and get an AI inspection in under 60 seconds.',
  heroBadgeFree:         '100% Free',
  heroBadgeInstant:      'Instant Results',
  heroBadgeLocation:     'GTA Toronto',
  heroSpeechBubble:      "Hi, I'm Inspector MacTor. I'll help you inspect it!",
  heroStepLabel:         (n) => `Step ${n} of 3`,
  heroStepService:       'Choose service',
  heroStepProperty:      'Property type',
  heroStepPhotos:        'Upload photos',
  heroCtaMain:           'Start Free AI Inspection',
  heroCtaSub:            'Takes less than 60 seconds',
  heroFeature1Title:     'Private & Secure',
  heroFeature1Desc:      'Your photos are safe and never shared',
  heroFeature2Title:     'AI Powered',
  heroFeature2Desc:      'Advanced AI + expert construction knowledge',
  heroFeature3Title:     'Instant Results',
  heroFeature3Desc:      'Get your inspection in seconds',
  heroFeature4Title:     'Trusted Local',
  heroFeature4Desc:      'Built by MacTor for GTA homeowners',
  heroScrollCue:         'Start your free estimate below',
  heroLockedHint:        'Complete the selections above to continue',
};

// ─── Spanish ──────────────────────────────────────────────────────────────────
const es: MacTorScript = {
  tagline:  'Muéstrame qué está pasando.',
  subtitle: 'Inspección de propiedad con IA · Gratis · GTA Toronto',

  welcomeTagline:         '¡Hola! ¿En qué podemos ayudarte hoy?',
  whatDoYouNeed:          '¿Qué necesitas?',
  serviceRepairLabel:     'Reparación',
  serviceRepairDesc:      'Arreglar un problema o daño',
  serviceNewProjectLabel: 'Nuevo proyecto',
  serviceNewProjectDesc:  'Construir, instalar o renovar',
  repairContextMsg:       'Cuéntame qué está pasando y comparte una foto — lo evalúo de inmediato.',
  newProjectContextMsg:   'Cuéntame qué tienes en mente. Incluye medidas y materiales si puedes.',

  describeTitle:       '¿Cuál es el problema?',
  describePrompt:      'Describe el problema en pocas palabras. Yo te guío desde ahí.',
  describePlaceholder: 'Ej: "Mancha de agua en el techo", "Grieta en la pared", "Calefacción no funciona"…',
  describeHint:        'Sin términos técnicos — solo dime qué estás viendo.',
  describeNext:        'Listo →',

  newProjectDescribeTitle:       'Cuéntanos sobre tu proyecto',
  newProjectDescribePrompt:      '¿Qué tienes en mente? Cuantos más detalles, mejor.',
  newProjectDescribePlaceholder: 'Ej: "Pintar el techo del living, 30×10 pies, textura popcorn. Quiero que quede liso."',
  newProjectDescribeHint:        'Incluye medidas, materiales o fecha límite si puedes.',

  categoryTitle:    'Categoría del problema',
  categoryDetected: (cat) => `Parece un problema de ${cat}. ¿Es correcto?`,
  categoryConfirm:  'Sí, es correcto',
  categoryChange:   'Elegir categoría diferente',
  categorySelect:   'Selecciona la categoría que mejor aplica',

  photoTitle:   'Muéstrame el problema',
  photoPrompt:  'Ahora necesito verlo. Toma fotos del área afectada — yo las analizo.',
  addPhoto:     'Tomar o subir foto',
  addMore:      'Agregar otra foto',
  uploading:    'Subiendo…',
  analyzing:    'Analizando…',
  maxPhotos:    (n) => `Máximo ${n} fotos · IA analizando`,
  noDamage:     '✓ No se detectó daño en esta foto',
  photoError:   '✗ No se pudo procesar esta foto',
  progress:     (done, total) => `Revisando… ${done} de ${total} listas`,
  takePhoto:    'Tomar foto',
  uploadPhoto:  'Subir foto',

  newProjectPhotoPrompt:    'Comparte fotos del lugar o espacio donde se realizará el trabajo.',
  newProjectPhotoSub:       'Las uso como contexto — la guía principal es tu descripción escrita.',
  siteRecorded:             'Sitio registrado',
  siteObservations:         'OBSERVACIONES DEL SITIO',
  projectEstimateHeader:    'ESTIMADO DE PROYECTO',
  sitePhotosLabel:          'FOTOS DEL SITIO',
  projectRequestLabel:      'SOLICITUD DE PROYECTO',
  newProjectReportGreeting: 'Revisé tu solicitud y las fotos del sitio. Aquí hay un resumen para planificación y presupuesto.',
  newProjectReportSub:      'Solicita un estimado abajo y te respondo con precios.',
  requestProjectEstimate:   'Solicitar estimado de proyecto →',
  projectFollowupIntro:     'Algunos detalles me ayudarán a darte un presupuesto más preciso.',
  projectFollowupSub:       'Opcional — omite lo que no aplique.',
  newProjectFollowUpQs: [
    '¿Cuál es tu fecha límite para este proyecto?',
    '¿Tienes un presupuesto aproximado en mente?',
    '¿Algún material, acabado o requisito específico?',
  ],
  projectEstimateReady: '¿Listo para enviar tu solicitud de proyecto a MacTor?',
  projectEstimateSub:   'Gratis — sin compromiso. Recibirás un presupuesto en 24 horas.',
  newProjectLabel:      'Nuevo proyecto',
  sitePhotoCount:       (n) => `${n} foto${n !== 1 ? 's' : ''} del sitio`,

  reportCTA:  (n) => n > 0 ? `Ver mi reporte → (${n} problema${n > 1 ? 's' : ''} encontrado${n > 1 ? 's' : ''})` : 'Ver mi reporte →',
  partialCTA: 'Ver hallazgos hasta ahora →',

  reportGreeting: (n) => n > 0
    ? `Encontré ${n} problema${n > 1 ? 's' : ''} que necesita${n > 1 ? 'n' : ''} atención.`
    : 'Buenas noticias — no encontré problemas significativos.',
  reportNoIssues: 'Todo se ve bien según las fotos que compartiste.',
  criticalAlert:  '⚠ Esto necesita atención inmediata.',

  followupTitle: 'Unas preguntas más',
  followupIntro: 'Para darte un estimado más preciso, tengo unas preguntas rápidas sobre lo que estás viendo.',
  followupSkip:  'Omitir — solo dame el estimado',
  followupNext:  'Listo →',
  answerHint:    'Opcional — mientras más me digas, mejor el estimado',

  estimateTitle: '¿Quieres un estimado de reparación?',
  estimateText:  'Te envío un estimado detallado por email. Gratis, sin compromiso, sin llamadas de ventas.',
  estimateYes:   'Sí, envíame el estimado',
  estimateNo:    'No gracias — solo el reporte',

  contactTitle:   '¿A dónde te lo envío?',
  contactIntro:   'Tendré tu estimado listo en pocas horas.',

  propertyLabel:  'Tipo de propiedad',
  residential:    'Residencial',
  residentialDesc: 'Casa, condo, apartamento',
  commercial:     'Comercial',
  commercialDesc: 'Oficina, local, edificio',
  startBtn:       'Comenzar Inspección →',
  starting:       'Iniciando…',
  connectionError: 'Error de conexión. Verifica tu internet.',

  back:    '← Atrás',
  next:    'Siguiente →',
  skip:    'Omitir',
  confirm: 'Confirmar',
  free:    'Gratis',

  heroEyebrow:           'Inspección Gratis con IA',
  heroHeadlinePre:       '¿Qué necesitas',
  heroHeadlineHighlight: 'arreglar?',
  heroSubtitle:          'Sube una foto y recibe una inspección con IA en menos de 60 segundos.',
  heroBadgeFree:         '100% Gratis',
  heroBadgeInstant:      'Resultados al instante',
  heroBadgeLocation:     'GTA Toronto',
  heroSpeechBubble:      'Hola, soy el Inspector MacTor. ¡Te ayudo a inspeccionarla!',
  heroStepLabel:         (n) => `Paso ${n} de 3`,
  heroStepService:       'Elige el servicio',
  heroStepProperty:      'Tipo de propiedad',
  heroStepPhotos:        'Sube fotos',
  heroCtaMain:           'Comenzar Inspección Gratis con IA',
  heroCtaSub:            'Toma menos de 60 segundos',
  heroFeature1Title:     'Privado y Seguro',
  heroFeature1Desc:      'Tus fotos están seguras y nunca se comparten',
  heroFeature2Title:     'Con IA',
  heroFeature2Desc:      'IA avanzada + conocimiento experto en construcción',
  heroFeature3Title:     'Resultados al Instante',
  heroFeature3Desc:      'Recibe tu inspección en segundos',
  heroFeature4Title:     'Confianza Local',
  heroFeature4Desc:      'Hecho por MacTor para propietarios del GTA',
  heroScrollCue:         'Comienza tu estimado gratis abajo',
  heroLockedHint:        'Completa las selecciones de arriba para continuar',
};

// ─── Chinese (Simplified) ─────────────────────────────────────────────────────
const zh: MacTorScript = {
  tagline:  '告诉我发生了什么。',
  subtitle: 'AI驱动的房产检测 · 免费 · 大多伦多地区',

  welcomeTagline:         '您好！今天我们能帮您什么？',
  whatDoYouNeed:          '您需要什么？',
  serviceRepairLabel:     '维修',
  serviceRepairDesc:      '修复问题或损坏',
  serviceNewProjectLabel: '新项目',
  serviceNewProjectDesc:  '建造、安装或翻新',
  repairContextMsg:       '告诉我出了什么问题并分享一张照片——我会立即评估。',
  newProjectContextMsg:   '告诉我您的想法，尽量包括尺寸和材料。',

  describeTitle:       '问题是什么？',
  describePrompt:      '用几个词描述问题，我来引导您完成接下来的步骤。',
  describePlaceholder: '例如："天花板有水渍"、"墙壁有裂缝"、"暖气不工作"…',
  describeHint:        '不用担心专业术语——只需告诉我您看到的。',
  describeNext:        '好的 →',

  newProjectDescribeTitle:       '告诉我们您的项目',
  newProjectDescribePrompt:      '您有什么想法？细节越多越好。',
  newProjectDescribePlaceholder: '例如："粉刷客厅天花板，30×10英尺，爆米花纹理，想要平整效果。"',
  newProjectDescribeHint:        '如有可能，请包括尺寸、材料或时间要求。',

  categoryTitle:    '问题类别',
  categoryDetected: (cat) => `听起来像是${cat}问题，对吗？`,
  categoryConfirm:  '是的，就是这个',
  categoryChange:   '选择不同类别',
  categorySelect:   '选择最合适的类别',

  photoTitle:   '给我看看问题',
  photoPrompt:  '现在我需要看到它。拍几张受影响区域的照片，我来分析。',
  addPhoto:     '拍照或上传',
  addMore:      '添加更多照片',
  uploading:    '上传中…',
  analyzing:    '分析中…',
  maxPhotos:    (n) => `最多${n}张照片 · AI分析中`,
  noDamage:     '✓ 此照片中未检测到损坏',
  photoError:   '✗ 无法处理此照片',
  progress:     (done, total) => `检查中… ${done}/${total} 已完成`,
  takePhoto:    '拍照',
  uploadPhoto:  '上传照片',

  newProjectPhotoPrompt:    '分享施工地点或空间的照片。',
  newProjectPhotoSub:       '照片作为参考——主要依据是您的文字描述。',
  siteRecorded:             '场地已记录',
  siteObservations:         '场地观察',
  projectEstimateHeader:    '项目估算',
  sitePhotosLabel:          '场地照片',
  projectRequestLabel:      '项目申请',
  newProjectReportGreeting: '我已审阅您的申请和场地照片，以下是规划报价的摘要。',
  newProjectReportSub:      '在下方申请估算，我会尽快回复报价。',
  requestProjectEstimate:   '申请项目估算 →',
  projectFollowupIntro:     '几个简短问题有助于提供更准确的报价。',
  projectFollowupSub:       '可选——不适用的跳过即可。',
  newProjectFollowUpQs: [
    '您的项目目标完工时间是？',
    '您有预算范围吗？',
    '有特定材料、工艺或要求吗？',
  ],
  projectEstimateReady: '准备好向MacTor发送项目申请了吗？',
  projectEstimateSub:   '免费——无需承诺。您将在24小时内收到报价。',
  newProjectLabel:      '新项目',
  sitePhotoCount:       (n) => `${n}张场地照片`,

  reportCTA:  (n) => n > 0 ? `查看报告 → (发现${n}个问题)` : '查看报告 →',
  partialCTA: '查看当前发现 →',

  reportGreeting: (n) => n > 0 ? `我发现了${n}个需要您注意的问题。` : '好消息——我没有发现重大问题。',
  reportNoIssues: '根据您分享的照片，一切看起来都正常。',
  criticalAlert:  '⚠ 这需要立即处理。',

  followupTitle: '还有几个问题',
  followupIntro: '为了给您提供更准确的估价，我有几个简单的问题。',
  followupSkip:  '跳过——直接给我估价',
  followupNext:  '完成 →',
  answerHint:    '可选——信息越多，估价越准确',

  estimateTitle: '需要维修费用估算吗？',
  estimateText:  '我会将详细的费用估算发送到您的邮箱。免费，无需承诺，无销售电话。',
  estimateYes:   '是的，发给我估算',
  estimateNo:    '不用了，只要报告',

  contactTitle:   '发到哪里？',
  contactIntro:   '我会在几小时内发送您的估算。',

  propertyLabel:  '物业类型',
  residential:    '住宅',
  residentialDesc: '房屋、公寓、共管公寓',
  commercial:     '商业',
  commercialDesc: '办公室、零售、楼宇',
  startBtn:       '开始检测 →',
  starting:       '开始中…',
  connectionError: '连接错误。请检查您的网络。',

  back:    '← 返回',
  next:    '下一步 →',
  skip:    '跳过',
  confirm: '确认',
  free:    '免费',

  heroEyebrow:           '免费AI房产检测',
  heroHeadlinePre:       '需要',
  heroHeadlineHighlight: '修什么？',
  heroSubtitle:          '上传照片，60秒内获得AI检测结果。',
  heroBadgeFree:         '100% 免费',
  heroBadgeInstant:      '即时结果',
  heroBadgeLocation:     '大多伦多地区',
  heroSpeechBubble:      '您好，我是Inspector MacTor，我来帮您检测！',
  heroStepLabel:         (n) => `第 ${n} 步，共 3 步`,
  heroStepService:       '选择服务',
  heroStepProperty:      '物业类型',
  heroStepPhotos:        '上传照片',
  heroCtaMain:           '开始免费AI检测',
  heroCtaSub:            '不到60秒即可完成',
  heroFeature1Title:     '私密安全',
  heroFeature1Desc:      '您的照片安全存储，绝不外泄',
  heroFeature2Title:     'AI驱动',
  heroFeature2Desc:      '先进AI + 专业建筑知识',
  heroFeature3Title:     '即时结果',
  heroFeature3Desc:      '几秒钟内获得检测结果',
  heroFeature4Title:     '本地信赖',
  heroFeature4Desc:      'MacTor为大多伦多地区业主打造',
  heroScrollCue:         '向下开始免费估算',
  heroLockedHint:        '请先完成上方的选择以继续',
};

// ─── Hindi ────────────────────────────────────────────────────────────────────
const hi: MacTorScript = {
  tagline:  'मुझे दिखाइए क्या हो रहा है।',
  subtitle: 'AI-संचालित संपत्ति निरीक्षण · मुफ्त · GTA टोरंटो',

  welcomeTagline:         'नमस्ते! आज हम आपकी कैसे मदद कर सकते हैं?',
  whatDoYouNeed:          'आपको क्या चाहिए?',
  serviceRepairLabel:     'मरम्मत',
  serviceRepairDesc:      'किसी समस्या या नुकसान को ठीक करें',
  serviceNewProjectLabel: 'नया प्रोजेक्ट',
  serviceNewProjectDesc:  'निर्माण, स्थापना या नवीनीकरण',
  repairContextMsg:       'मुझे बताएं क्या हुआ है और एक फोटो शेयर करें — मैं तुरंत आकलन करूंगा।',
  newProjectContextMsg:   'मुझे बताएं आपके मन में क्या है। माप और सामग्री शामिल करें यदि हो सके।',

  describeTitle:       'क्या समस्या है?',
  describePrompt:      'समस्या को कुछ शब्दों में बताएं। मैं आपको आगे गाइड करूंगा।',
  describePlaceholder: 'जैसे: "छत पर पानी का दाग", "दीवार में दरार", "हीटर काम नहीं कर रहा"…',
  describeHint:        'तकनीकी शब्दों की चिंता न करें — बस बताएं क्या दिख रहा है।',
  describeNext:        'ठीक है →',

  newProjectDescribeTitle:       'अपने प्रोजेक्ट के बारे में बताएं',
  newProjectDescribePrompt:      'आपके मन में क्या है? जितने अधिक विवरण, उतना बेहतर।',
  newProjectDescribePlaceholder: 'जैसे: "लिविंग रूम की छत पेंट करनी है, 30×10 फीट, पॉपकॉर्न टेक्सचर।"',
  newProjectDescribeHint:        'माप, सामग्री या समय-सीमा शामिल करें यदि संभव हो।',

  categoryTitle:    'समस्या की श्रेणी',
  categoryDetected: (cat) => `यह ${cat} की समस्या लगती है। क्या यह सही है?`,
  categoryConfirm:  'हां, यही है',
  categoryChange:   'दूसरी श्रेणी चुनें',
  categorySelect:   'सबसे उपयुक्त श्रेणी चुनें',

  photoTitle:   'मुझे समस्या दिखाएं',
  photoPrompt:  'अब मुझे देखना होगा। प्रभावित क्षेत्र की फोटो लें — मैं विश्लेषण करूंगा।',
  addPhoto:     'फोटो लें या अपलोड करें',
  addMore:      'और फोटो जोड़ें',
  uploading:    'अपलोड हो रहा है…',
  analyzing:    'विश्लेषण हो रहा है…',
  maxPhotos:    (n) => `अधिकतम ${n} फोटो · AI विश्लेषण कर रहा है`,
  noDamage:     '✓ इस फोटो में कोई नुकसान नहीं मिला',
  photoError:   '✗ इस फोटो को प्रोसेस नहीं किया जा सका',
  progress:     (done, total) => `समीक्षा… ${done}/${total} पूरा`,
  takePhoto:    'फोटो लें',
  uploadPhoto:  'फोटो अपलोड करें',

  newProjectPhotoPrompt:    'जहां काम होगा उस जगह की फोटो शेयर करें।',
  newProjectPhotoSub:       'फोटो संदर्भ के लिए है — मुख्य आधार आपका लिखित विवरण है।',
  siteRecorded:             'साइट दर्ज की गई',
  siteObservations:         'साइट अवलोकन',
  projectEstimateHeader:    'प्रोजेक्ट अनुमान',
  sitePhotosLabel:          'साइट की फोटो',
  projectRequestLabel:      'प्रोजेक्ट अनुरोध',
  newProjectReportGreeting: 'मैंने आपका अनुरोध और साइट की फोटो देखी। यहाँ योजना और कोटेशन के लिए सारांश है।',
  newProjectReportSub:      'नीचे अनुमान के लिए अनुरोध करें और मैं कीमत के साथ वापस आऊंगा।',
  requestProjectEstimate:   'प्रोजेक्ट अनुमान का अनुरोध करें →',
  projectFollowupIntro:     'कुछ त्वरित विवरण मुझे अधिक सटीक कोटेशन देने में मदद करेंगे।',
  projectFollowupSub:       'वैकल्पिक — जो लागू न हो उसे छोड़ें।',
  newProjectFollowUpQs: [
    'इस प्रोजेक्ट के लिए आपकी समय-सीमा क्या है?',
    'क्या आपके मन में कोई बजट है?',
    'कोई विशेष सामग्री, फिनिश या आवश्यकताएं?',
  ],
  projectEstimateReady: 'MacTor को अपना प्रोजेक्ट अनुरोध भेजने के लिए तैयार हैं?',
  projectEstimateSub:   'मुफ्त — बिना प्रतिबद्धता। 24 घंटे में कोटेशन मिलेगा।',
  newProjectLabel:      'नया प्रोजेक्ट',
  sitePhotoCount:       (n) => `${n} साइट फोटो`,

  reportCTA:  (n) => n > 0 ? `मेरी रिपोर्ट देखें → (${n} समस्या मिली)` : 'मेरी रिपोर्ट देखें →',
  partialCTA: 'अब तक के निष्कर्ष देखें →',

  reportGreeting: (n) => n > 0
    ? `मुझे ${n} समस्या${n > 1 ? 'एं' : ''} मिली जिन पर ध्यान देने की जरूरत है।`
    : 'अच्छी खबर — मुझे कोई बड़ी समस्या नहीं मिली।',
  reportNoIssues: 'आपकी शेयर की गई फोटो के आधार पर सब ठीक लगता है।',
  criticalAlert:  '⚠ इसे तुरंत ध्यान देने की जरूरत है।',

  followupTitle: 'कुछ और सवाल',
  followupIntro: 'अधिक सटीक अनुमान के लिए, मेरे पास कुछ त्वरित सवाल हैं।',
  followupSkip:  'छोड़ें — सीधे अनुमान दें',
  followupNext:  'हो गया →',
  answerHint:    'वैकल्पिक — जितना बताएंगे, उतना बेहतर अनुमान',

  estimateTitle: 'मरम्मत का अनुमान चाहिए?',
  estimateText:  'मैं विस्तृत लागत अनुमान आपके ईमेल पर भेजूंगा। मुफ्त, बिना प्रतिबद्धता।',
  estimateYes:   'हां, मुझे अनुमान भेजें',
  estimateNo:    'नहीं धन्यवाद — केवल रिपोर्ट',

  contactTitle:   'कहां भेजूं?',
  contactIntro:   'कुछ घंटों में आपका अनुमान तैयार होगा।',

  propertyLabel:  'संपत्ति का प्रकार',
  residential:    'आवासीय',
  residentialDesc: 'मकान, कोंडो, अपार्टमेंट',
  commercial:     'व्यावसायिक',
  commercialDesc: 'कार्यालय, दुकान, इमारत',
  startBtn:       'निरीक्षण शुरू करें →',
  starting:       'शुरू हो रहा है…',
  connectionError: 'कनेक्शन त्रुटि। अपना इंटरनेट जांचें।',

  back:    '← वापस',
  next:    'अगला →',
  skip:    'छोड़ें',
  confirm: 'पुष्टि करें',
  free:    'मुफ्त',

  heroEyebrow:           'मुफ्त AI संपत्ति निरीक्षण',
  heroHeadlinePre:       'क्या',
  heroHeadlineHighlight: 'करवाना है?',
  heroSubtitle:          'एक फोटो अपलोड करें और 60 सेकंड से कम में AI निरीक्षण पाएं।',
  heroBadgeFree:         '100% मुफ्त',
  heroBadgeInstant:      'तुरंत परिणाम',
  heroBadgeLocation:     'GTA टोरंटो',
  heroSpeechBubble:      'नमस्ते, मैं Inspector MacTor हूं। मैं आपकी मदद करूंगा!',
  heroStepLabel:         (n) => `चरण ${n} / 3`,
  heroStepService:       'सेवा चुनें',
  heroStepProperty:      'संपत्ति का प्रकार',
  heroStepPhotos:        'फोटो अपलोड करें',
  heroCtaMain:           'मुफ्त AI निरीक्षण शुरू करें',
  heroCtaSub:            '60 सेकंड से भी कम समय लगता है',
  heroFeature1Title:     'निजी और सुरक्षित',
  heroFeature1Desc:      'आपकी फोटो सुरक्षित हैं और कभी साझा नहीं होतीं',
  heroFeature2Title:     'AI-संचालित',
  heroFeature2Desc:      'उन्नत AI + विशेषज्ञ निर्माण ज्ञान',
  heroFeature3Title:     'तुरंत परिणाम',
  heroFeature3Desc:      'सेकंडों में अपना निरीक्षण पाएं',
  heroFeature4Title:     'स्थानीय भरोसा',
  heroFeature4Desc:      'GTA के घर मालिकों के लिए MacTor द्वारा निर्मित',
  heroScrollCue:         'नीचे अपना मुफ्त अनुमान शुरू करें',
  heroLockedHint:        'जारी रखने के लिए ऊपर की चयन पूरी करें',
};

// ─── Filipino (Tagalog) ───────────────────────────────────────────────────────
const tl: MacTorScript = {
  tagline:  'Ipakita mo sa akin ang nangyayari.',
  subtitle: 'Libreng AI na inspeksyon · GTA Toronto',

  welcomeTagline:         'Kumusta! Paano namin kayo matutulungan ngayon?',
  whatDoYouNeed:          'Ano ang kailangan mo?',
  serviceRepairLabel:     'Pagkukumpuni',
  serviceRepairDesc:      'Ayusin ang isang problema o pinsala',
  serviceNewProjectLabel: 'Bagong proyekto',
  serviceNewProjectDesc:  'Magtayo, mag-install, o mag-renovate',
  repairContextMsg:       'Sabihin mo kung ano ang problema at magbahagi ng larawan — susuriin ko agad.',
  newProjectContextMsg:   'Sabihin mo kung ano ang nasa isip mo. Isama ang sukat at materyales kung maaari.',

  describeTitle:       'Ano ang problema?',
  describePrompt:      'Ilarawan ang problema sa ilang salita. Gagabayan kita mula doon.',
  describePlaceholder: 'Hal: "Water stain sa kisame", "Bitak sa dingding", "Hindi gumagana ang heater"…',
  describeHint:        'Huwag mag-alala sa technical terms — sabihin mo lang kung ano ang nakikita mo.',
  describeNext:        'Naintindihan →',

  newProjectDescribeTitle:       'Sabihin mo sa amin ang iyong proyekto',
  newProjectDescribePrompt:      'Ano ang nasa isip mo? Mas maraming detalye, mas mabuti.',
  newProjectDescribePlaceholder: 'Hal: "Pinturahan ang kisame ng sala, 30×10 talampakan, popcorn texture."',
  newProjectDescribeHint:        'Isama ang sukat, materyales, o timeline kung posible.',

  categoryTitle:    'Kategorya ng problema',
  categoryDetected: (cat) => `Parang ${cat} problema ito. Tama ba?`,
  categoryConfirm:  'Oo, tama iyan',
  categoryChange:   'Pumili ng ibang kategorya',
  categorySelect:   'Piliin ang pinaka-angkop na kategorya',

  photoTitle:   'Ipakita mo sa akin ang problema',
  photoPrompt:  'Kailangan ko na itong makita. Kumuha ng mga larawan ng apektadong lugar — susuriin ko ang mga ito.',
  addPhoto:     'Kumuha o mag-upload ng larawan',
  addMore:      'Magdagdag ng larawan',
  uploading:    'Ina-upload…',
  analyzing:    'Sinusuri…',
  maxPhotos:    (n) => `Max ${n} larawan · Sinusuri ng AI`,
  noDamage:     '✓ Walang pinsalang natuklasan sa larawang ito',
  photoError:   '✗ Hindi maiproseso ang larawang ito',
  progress:     (done, total) => `Tinitingnan… ${done} sa ${total} tapos na`,
  takePhoto:    'Kumuha ng larawan',
  uploadPhoto:  'Mag-upload ng larawan',

  newProjectPhotoPrompt:    'Magbahagi ng mga larawan ng lugar kung saan gagawin ang trabaho.',
  newProjectPhotoSub:       'Gagamitin ko ito bilang konteksto — ang pangunahing gabay ay ang iyong nakasulat na paglalarawan.',
  siteRecorded:             'Naitala ang lugar',
  siteObservations:         'MGA OBSERBASYON SA LUGAR',
  projectEstimateHeader:    'TANTYA NG PROYEKTO',
  sitePhotosLabel:          'MGA LARAWAN NG LUGAR',
  projectRequestLabel:      'KAHILINGAN SA PROYEKTO',
  newProjectReportGreeting: 'Nasuri ko ang iyong kahilingan at mga larawan ng lugar. Narito ang buod para sa pagpaplano at pagpepresyo.',
  newProjectReportSub:      'Humiling ng tantya sa ibaba at babalikan kita na may pagpepresyo.',
  requestProjectEstimate:   'Humiling ng tantya ng proyekto →',
  projectFollowupIntro:     'Ilang mabilis na detalye ang makakatulong sa akin na magbigay ng mas tumpak na quote.',
  projectFollowupSub:       'Opsyonal — laktawan ang hindi naaangkop.',
  newProjectFollowUpQs: [
    'Ano ang iyong target na timeline para sa proyektong ito?',
    'Mayroon ka bang budget range sa isip?',
    'Anumang partikular na materyales, tapusin, o mga kinakailangan?',
  ],
  projectEstimateReady: 'Handa ka na bang ipadala ang iyong kahilingan sa proyekto kay MacTor?',
  projectEstimateSub:   'Libre — walang pangako. Makakatanggap ka ng quote sa loob ng 24 oras.',
  newProjectLabel:      'Bagong proyekto',
  sitePhotoCount:       (n) => `${n} larawang panglarawan`,

  reportCTA:  (n) => n > 0 ? `Tingnan ang aking ulat → (${n} isyung natagpuan)` : 'Tingnan ang aking ulat →',
  partialCTA: 'Tingnan ang mga natuklasan →',

  reportGreeting: (n) => n > 0
    ? `Natagpuan ko ang ${n} isyu na kailangan mong asikasuhin.`
    : 'Magandang balita — wala akong natagpuang malaking problema.',
  reportNoIssues: 'Okay naman ang lahat base sa mga larawang ibinahagi mo.',
  criticalAlert:  '⚠ Kailangan ito ng agarang pansin.',

  followupTitle: 'Ilang tanong pa',
  followupIntro: 'Para sa mas tumpak na tantya, mayroon akong ilang mabilis na tanong.',
  followupSkip:  'Laktawan — bigyan mo na ako ng tantya',
  followupNext:  'Tapos na →',
  answerHint:    'Opsyonal — mas maraming impormasyon, mas tumpak ang tantya',

  estimateTitle: 'Gusto mo bang makakuha ng tantya ng gastos?',
  estimateText:  'Magpapadala ako ng detalyadong tantya sa iyong email. Libre, walang pangako.',
  estimateYes:   'Oo, ipadala mo sa akin',
  estimateNo:    'Hindi salamat — ulat na lang',

  contactTitle:   'Saan ko ipapadala?',
  contactIntro:   'Ipapadala ko ang iyong tantya sa loob ng ilang oras.',

  propertyLabel:  'Uri ng ari-arian',
  residential:    'Tirahan',
  residentialDesc: 'Bahay, kondo, apartment',
  commercial:     'Komersyal',
  commercialDesc: 'Opisina, tindahan, gusali',
  startBtn:       'Simulan ang Inspeksyon →',
  starting:       'Nagsisimula…',
  connectionError: 'Error sa koneksyon. Suriin ang iyong internet.',

  back:    '← Bumalik',
  next:    'Susunod →',
  skip:    'Laktawan',
  confirm: 'Kumpirmahin',
  free:    'Libre',

  heroEyebrow:           'Libreng AI Property Inspection',
  heroHeadlinePre:       'Ano ang kailangang',
  heroHeadlineHighlight: 'gawin?',
  heroSubtitle:          'Mag-upload ng larawan at makakuha ng AI inspection sa loob ng 60 segundo.',
  heroBadgeFree:         '100% Libre',
  heroBadgeInstant:      'Instant na Resulta',
  heroBadgeLocation:     'GTA Toronto',
  heroSpeechBubble:      'Kumusta, ako si Inspector MacTor. Tutulungan kitang suriin ito!',
  heroStepLabel:         (n) => `Hakbang ${n} sa 3`,
  heroStepService:       'Pumili ng serbisyo',
  heroStepProperty:      'Uri ng ari-arian',
  heroStepPhotos:        'Mag-upload ng larawan',
  heroCtaMain:           'Simulan ang Libreng AI Inspection',
  heroCtaSub:            'Mas mababa sa 60 segundo lang',
  heroFeature1Title:     'Pribado at Ligtas',
  heroFeature1Desc:      'Ligtas ang iyong mga larawan at hindi ibabahagi',
  heroFeature2Title:     'May AI',
  heroFeature2Desc:      'Advanced AI + eksperto sa konstruksiyon',
  heroFeature3Title:     'Instant na Resulta',
  heroFeature3Desc:      'Makuha ang inspection sa segundo lang',
  heroFeature4Title:     'Pinagkakatiwalaan Lokal',
  heroFeature4Desc:      'Ginawa ng MacTor para sa mga may-ari sa GTA',
  heroScrollCue:         'Simulan ang libreng tantya sa ibaba',
  heroLockedHint:        'Kumpletuhin ang mga pinili sa itaas para magpatuloy',
};

/** M[lang] — MacTor script in the user's language */
export const M: Record<Lang, MacTorScript> = { en, es, zh, hi, tl };

// ─── Category Detection ───────────────────────────────────────────────────────
/** Keyword map for auto-detecting issue category from free-text description */
const KEYWORDS: Partial<Record<IssueCategory, string[]>> = {
  plumbing:      ['water', 'leak', 'pipe', 'drain', 'faucet', 'sink', 'toilet', 'shower', 'drip', 'flood', 'plumb', 'agua', 'fuga', 'tubería', 'grifo', 'inodoro', '管道', '漏水', '水管', '水', 'नल', 'पाइप', 'रिसाव', 'tubo', 'gripo'],
  electrical:    ['electric', 'outlet', 'switch', 'light', 'breaker', 'wire', 'circuit', 'spark', 'power', 'wiring', 'eléctrico', 'enchufe', 'luz', 'corriente', '电', '插座', '断路器', '灯', 'बिजली', 'आउटलेट', 'kuryente', 'ilaw'],
  structural:    ['crack', 'wall', 'foundation', 'floor', 'ceiling', 'sag', 'settle', 'lean', 'collapse', 'grieta', 'pared', 'techo', 'piso', '裂缝', '墙', '地基', 'दरार', 'दीवार', 'bitak', 'dingding'],
  hvac:          ['heat', 'cool', 'ac', 'furnace', 'hvac', 'vent', 'air', 'temperature', 'thermostat', 'calor', 'frío', 'aire', 'calefacción', '暖气', '空调', '通风', 'हीटर', 'एसी', 'palamig', 'mainit'],
  roofing:       ['roof', 'shingle', 'gutter', 'attic', 'flashing', 'techo', 'tejado', 'gotera', '屋顶', '瓦片', '排水沟', 'छत', 'bubong'],
  water_damage:  ['mold', 'mould', 'damp', 'moisture', 'stain', 'wet', 'musty', 'moho', 'humedad', 'mancha', 'mojado', '霉', '潮湿', '水渍', '水损', 'फफूंद', 'नमी', 'amag', 'basa'],
  pests:         ['mouse', 'rat', 'roach', 'cockroach', 'ant', 'bug', 'pest', 'insect', 'nest', 'termite', 'ratón', 'cucaracha', 'hormiga', 'bicho', '鼠', '蟑螂', '虫', 'चूहा', 'कीट', 'daga', 'ipis'],
  doors_windows: ['door', 'window', 'frame', 'seal', 'lock', 'gap', 'draft', 'puerta', 'ventana', '门', '窗', 'दरवाजा', 'खिड़की', 'pinto', 'bintana'],
  exterior:      ['siding', 'paint', 'fence', 'driveway', 'step', 'porch', 'deck', 'exterior', '外墙', '围栏', 'बाहर', 'siding', 'bakod'],
};

/**
 * Auto-detect the most likely IssueCategory from a free-text description.
 * Falls back to 'other' when nothing matches.
 */
export function detectCategory(description: string): IssueCategory {
  if (!description || description.trim().length < 3) return 'other';
  const lower = description.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORDS)) {
    if (keywords?.some(kw => lower.includes(kw))) {
      return cat as IssueCategory;
    }
  }
  return 'other';
}

// ─── AI Prompt Builder ────────────────────────────────────────────────────────
/**
 * Builds the Claude Vision prompt for a single photo analysis.
 * Incorporates the client's description and detected category
 * so the AI is context-aware, not generic.
 */
export function buildPhotoPrompt(
  category: IssueCategory,
  problemDescription: string,
): string {
  const catName = CATEGORIES[category]?.name.en ?? 'general maintenance';
  return `You are Inspector MacTor, an experienced property inspector for FixMyProperty in the Greater Toronto Area (GTA), Canada.

The client described their problem as: "${problemDescription}"
Identified issue category: ${catName}

Analyze this property photo and return ONLY valid JSON with this exact structure:

{
  "area_detected": "kitchen|bathroom|bedroom|living_room|hallway|exterior|basement|electrical|plumbing|hvac|floor|window|wall_ceiling|roof|other",
  "overall_condition": "excellent|good|needs_maintenance|needs_renovation|critical",
  "observed_defects": [
    {
      "defect_type": "specific name of the defect in English",
      "location": "exactly where it appears in the image",
      "severity": "low|medium|high|critical",
      "estimated_size": "approximate dimension or 'unknown'",
      "confidence": "confirmed|possible|inconclusive",
      "danger_if_ignored": "plain-language consequence if not repaired"
    }
  ],
  "priority_level": "no_issues|low|medium|high|critical",
  "recommended_action": "single most important repair action",
  "inspector_note": "one sentence honest plain-language observation in MacTor's voice"
}

RULES:
- Focus on ${catName} issues but flag any other visible safety concerns
- observed_defects: max 2 items — the most important ones only
- If no real problem visible: empty observed_defects array, priority_level "no_issues"
- No text outside the JSON`;
}

// ─── Report Helpers ───────────────────────────────────────────────────────────
/** Severity sort order (highest first) */
const SEV_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, no_issues: 0 };

/** Sort defects from most to least severe */
export function sortDefectsBySeverity<T extends { severity: string }>(defects: T[]): T[] {
  return [...defects].sort((a, b) => (SEV_ORDER[b.severity] ?? 0) - (SEV_ORDER[a.severity] ?? 0));
}

/** True if any defect is critical or high severity */
export function hasUrgentIssues(defects: Array<{ severity: string }>): boolean {
  return defects.some(d => d.severity === 'critical' || d.severity === 'high');
}
