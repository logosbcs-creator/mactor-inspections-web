export type Lang = 'en' | 'es' | 'zh' | 'hi' | 'tl';

export interface LangMeta {
  code: Lang;
  flag: string;
  name: string;    // native name
  nameEn: string;  // English name
}

export const LANGUAGES: LangMeta[] = [
  { code: 'en', flag: '🇨🇦', name: 'English',  nameEn: 'English'            },
  { code: 'es', flag: '🇲🇽', name: 'Español',  nameEn: 'Spanish'            },
  { code: 'zh', flag: '🇨🇳', name: '中文',      nameEn: 'Chinese (Mandarin)' },
  { code: 'hi', flag: '🇮🇳', name: 'हिंदी',     nameEn: 'Hindi'              },
  { code: 'tl', flag: '🇵🇭', name: 'Filipino', nameEn: 'Filipino (Tagalog)'  },
];

export const LANG_KEY = 'inspector_lang';

// ─── Translation strings ───────────────────────────────────────────────────

interface Strings {
  // Language picker
  chooseLanguage: string;
  chooseSubtitle: string;

  // App header
  appTagline: string;
  tagline: string;

  // Landing
  propertyType: string;
  residential: string;
  residentialDesc: string;
  commercial: string;
  commercialDesc: string;
  howItWorks: string;
  steps: string[];
  startBtn: string;
  starting: string;
  connectionError: string;

  // Inspection page
  inspectionPhotos: string;
  documentDamage: string;
  takePhotos: string;
  addMorePhotos: string;
  maxPhotos: (n: number) => string;
  uploadingPhoto: string;
  aiAnalyzing: string;
  noDamagePhoto: string;
  errorPhoto: string;
  analyzingBar: (done: number, total: number) => string;
  viewReport: (n: number) => string;
  viewPartialReport: string;
  takeDamagePhotos: string;

  // Report page
  inspectionReport: string;
  aiResults: string;
  noDamage: string;
  immediateAttention: string;
  urgentRepair: string;
  maintenanceNeeded: string;
  photosAnalyzedIssues: (photos: number, issues: number) => string;
  criticalHigh: string;
  totalIssues: string;
  photos: string;
  riskAlerts: string;
  ifNotRepaired: string;
  issueDetected: (n: number) => string;
  noDamageDetected: string;
  wantEstimate: string;
  estimateDesc: string;
  requestEstimate: string;
  addMorePhotosBtn: string;

  // Contact form
  yourDetails: string;
  contactInfo: string;
  contactDesc: string;
  fullName: string;
  email: string;
  phone: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  propertyAddress: string;
  privacy: string;
  submitBtn: string;
  sending: string;
  fillAllFields: string;
  sendError: string;

  // Status page
  reportSubmitted: string;
  allDone: string;
  statusDesc: string;
  costEstimateByEmail: string;
  statusAfter: string;
  statusSteps: string[];
  newInspection: string;

  // Accept / decline page
  processing: string;
  accepted: string;
  acceptedMsg: string;
  declined: string;
  declinedMsg: string;
  errorMsg: string;
  backHome: string;
}

// ─── English ───────────────────────────────────────────────────────────────
const en: Strings = {
  chooseLanguage: 'Choose your language',
  chooseSubtitle: 'Select the language for your inspection',

  appTagline: 'AI-Powered Property Inspections',
  tagline: 'AI detects damage · Instant estimate · GTA Toronto',

  propertyType: 'PROPERTY TYPE',
  residential: 'Residential',
  residentialDesc: 'House, condo,\napartment',
  commercial: 'Commercial',
  commercialDesc: 'Office, retail,\nbuilding',
  howItWorks: 'HOW IT WORKS',
  steps: [
    'Take up to 10 photos of the damage',
    'AI analyzes and detects issues instantly',
    'View the report with risk alerts',
    'Receive a cost estimate by email',
    'Accept and we schedule the repair',
  ],
  startBtn: 'Start Inspection →',
  starting: 'Starting…',
  connectionError: 'Connection error. Please check your internet.',

  inspectionPhotos: 'INSPECTION PHOTOS',
  documentDamage: 'Document the damage',
  takePhotos: 'Take or upload photos',
  addMorePhotos: 'Add more photos',
  maxPhotos: (n) => `Max ${n} photos · AI analyzes automatically`,
  uploadingPhoto: 'Uploading photo…',
  aiAnalyzing: 'AI analyzing…',
  noDamagePhoto: '✓ No damage detected in this photo',
  errorPhoto: '✕ Error processing this photo',
  analyzingBar: (done, total) => `Analyzing with AI… ${done}/${total} completed`,
  viewReport: (n) => n > 0 ? `View Report → (${n} issues found)` : 'View Report → (No damage found)',
  viewPartialReport: 'View Partial Report →',
  takeDamagePhotos: 'Take photos of the damage you want to report.\nAI will detect issues automatically.',

  inspectionReport: 'INSPECTION REPORT',
  aiResults: 'AI Analysis Results',
  noDamage: 'No significant damage found',
  immediateAttention: 'Immediate attention required',
  urgentRepair: 'Urgent repair recommended',
  maintenanceNeeded: 'Maintenance needed',
  photosAnalyzedIssues: (p, i) => `${p} photo(s) analyzed · ${i} issue(s) detected`,
  criticalHigh: 'Critical/High',
  totalIssues: 'Total issues',
  photos: 'Photos',
  riskAlerts: '⚠ RISK ALERTS',
  ifNotRepaired: 'If not repaired:',
  issueDetected: (n) => `${n} issue(s) detected`,
  noDamageDetected: 'No damage detected in the analyzed photos.',
  wantEstimate: 'Want a cost estimate?',
  estimateDesc: 'Enter your details and MacTor will review the report. You will receive the estimate by email.',
  requestEstimate: 'Request Cost Estimate →',
  addMorePhotosBtn: '← Add more photos',

  yourDetails: 'YOUR DETAILS',
  contactInfo: 'Contact information',
  contactDesc: 'We will review your report and send you a cost estimate by email.',
  fullName: 'FULL NAME',
  email: 'EMAIL',
  phone: 'PHONE',
  namePlaceholder: 'John Smith',
  emailPlaceholder: 'john@email.com',
  phonePlaceholder: '+1 (416) 000-0000',
  propertyAddress: 'PROPERTY ADDRESS',
  privacy: '🔒 Your information is confidential and only used for the estimate.',
  submitBtn: 'Submit and Request Estimate →',
  sending: 'Sending…',
  fillAllFields: 'Please fill in all fields.',
  sendError: 'Error sending. Please try again.',

  reportSubmitted: 'REPORT SUBMITTED',
  allDone: 'All done!',
  statusDesc: 'We received your inspection. Our team will review it and send you the',
  costEstimateByEmail: 'cost estimate by email',
  statusAfter: 'within the next few hours.',
  statusSteps: [
    'MacTor will review the pricing before sending',
    'If you accept, we will call you to schedule',
  ],
  newInspection: 'New Inspection',

  processing: 'Processing…',
  accepted: 'Estimate Accepted!',
  acceptedMsg: 'We will call you soon to schedule the visit. Thank you for choosing MacTor!',
  declined: 'Noted',
  declinedMsg: 'Thank you for your response. If you change your mind, feel free to contact us.',
  errorMsg: 'Something went wrong. Please contact MacTor directly.',
  backHome: 'Back to home',
};

// ─── Spanish ───────────────────────────────────────────────────────────────
const es: Strings = {
  chooseLanguage: 'Selecciona tu idioma',
  chooseSubtitle: 'Elige el idioma para tu inspección',

  appTagline: 'Inspecciones con Inteligencia Artificial',
  tagline: 'IA detecta daños · Estimado instantáneo · GTA Toronto',

  propertyType: 'TIPO DE PROPIEDAD',
  residential: 'Residencial',
  residentialDesc: 'Casa, condo,\napartamento',
  commercial: 'Comercial',
  commercialDesc: 'Oficina, local,\nedificio',
  howItWorks: 'CÓMO FUNCIONA',
  steps: [
    'Tomas hasta 10 fotos de los daños',
    'La IA analiza y detecta problemas al instante',
    'Ves el reporte con alertas de riesgo',
    'Recibes un estimado de costo por email',
    'Aceptas y agendamos la reparación',
  ],
  startBtn: 'Comenzar Inspección →',
  starting: 'Iniciando…',
  connectionError: 'Error de conexión. Verifica tu internet.',

  inspectionPhotos: 'FOTOS DE INSPECCIÓN',
  documentDamage: 'Documenta los daños',
  takePhotos: 'Tomar o subir fotos',
  addMorePhotos: 'Agregar más fotos',
  maxPhotos: (n) => `Máx ${n} fotos · IA analiza automáticamente`,
  uploadingPhoto: 'Subiendo foto…',
  aiAnalyzing: 'IA analizando…',
  noDamagePhoto: '✓ Sin daños detectados en esta foto',
  errorPhoto: '✕ Error al procesar esta foto',
  analyzingBar: (done, total) => `Analizando con IA… ${done}/${total} completadas`,
  viewReport: (n) => n > 0 ? `Ver Reporte → (${n} daños detectados)` : 'Ver Reporte → (Sin daños)',
  viewPartialReport: 'Ver Reporte Parcial →',
  takeDamagePhotos: 'Toma fotos de los daños que quieres reportar.\nLa IA detectará los problemas automáticamente.',

  inspectionReport: 'REPORTE DE INSPECCIÓN',
  aiResults: 'Resultados del Análisis IA',
  noDamage: 'Sin daños significativos',
  immediateAttention: 'Atención inmediata requerida',
  urgentRepair: 'Reparación urgente recomendada',
  maintenanceNeeded: 'Mantenimiento necesario',
  photosAnalyzedIssues: (p, i) => `${p} foto(s) analizadas · ${i} daño(s) detectado(s)`,
  criticalHigh: 'Críticos/Altos',
  totalIssues: 'Total daños',
  photos: 'Fotos',
  riskAlerts: '⚠ ALERTAS DE RIESGO',
  ifNotRepaired: 'Si no se repara:',
  issueDetected: (n) => `${n} problema(s) detectado(s)`,
  noDamageDetected: 'No se detectaron daños en las fotos analizadas.',
  wantEstimate: '¿Quieres un estimado de costo?',
  estimateDesc: 'Ingresa tus datos y MacTor revisará el reporte. Recibirás el estimado por email.',
  requestEstimate: 'Solicitar Estimado de Costo →',
  addMorePhotosBtn: '← Agregar más fotos',

  yourDetails: 'TUS DATOS',
  contactInfo: 'Información de contacto',
  contactDesc: 'Revisaremos tu reporte y te enviaremos un estimado de costo por email.',
  fullName: 'NOMBRE COMPLETO',
  email: 'EMAIL',
  phone: 'TELÉFONO',
  namePlaceholder: 'Juan García',
  emailPlaceholder: 'juan@email.com',
  phonePlaceholder: '+1 (416) 000-0000',
  propertyAddress: 'DIRECCIÓN DE LA PROPIEDAD',
  privacy: '🔒 Tu información es confidencial y solo se usa para el estimado.',
  submitBtn: 'Enviar y Solicitar Estimado →',
  sending: 'Enviando…',
  fillAllFields: 'Por favor completa todos los campos.',
  sendError: 'Error al enviar. Intenta de nuevo.',

  reportSubmitted: 'REPORTE ENVIADO',
  allDone: '¡Listo!',
  statusDesc: 'Recibimos tu inspección. Nuestro equipo la revisará y te enviará el',
  costEstimateByEmail: 'estimado de costo por email',
  statusAfter: 'en las próximas horas.',
  statusSteps: [
    'MacTor revisará los precios antes de enviarte',
    'Si aceptas, te llamamos para agendar',
  ],
  newInspection: 'Nueva Inspección',

  processing: 'Procesando…',
  accepted: '¡Estimado Aceptado!',
  acceptedMsg: 'Te llamaremos pronto para agendar la visita. ¡Gracias por confiar en MacTor!',
  declined: 'Recibido',
  declinedMsg: 'Gracias por tu respuesta. Si cambias de opinión, contáctanos.',
  errorMsg: 'Hubo un problema. Contacta a MacTor directamente.',
  backHome: 'Volver al inicio',
};

// ─── Chinese (Simplified) ──────────────────────────────────────────────────
const zh: Strings = {
  chooseLanguage: '请选择您的语言',
  chooseSubtitle: '选择检查报告的语言',

  appTagline: 'AI智能房产检查',
  tagline: 'AI检测损坏 · 即时报价 · 多伦多GTA',

  propertyType: '房产类型',
  residential: '住宅',
  residentialDesc: '房屋、公寓\n住宅单元',
  commercial: '商业',
  commercialDesc: '办公室、商铺\n商业建筑',
  howItWorks: '如何运作',
  steps: [
    '拍摄最多10张损坏照片',
    'AI即时分析并检测问题',
    '查看带有风险提示的报告',
    '通过电子邮件收到费用估算',
    '接受后我们安排维修',
  ],
  startBtn: '开始检查 →',
  starting: '启动中…',
  connectionError: '连接错误，请检查您的网络连接。',

  inspectionPhotos: '检查照片',
  documentDamage: '记录损坏情况',
  takePhotos: '拍照或上传',
  addMorePhotos: '添加更多照片',
  maxPhotos: (n) => `最多${n}张照片 · AI自动分析`,
  uploadingPhoto: '上传中…',
  aiAnalyzing: 'AI分析中…',
  noDamagePhoto: '✓ 此照片未发现损坏',
  errorPhoto: '✕ 处理此照片时出错',
  analyzingBar: (done, total) => `AI正在分析… ${done}/${total} 已完成`,
  viewReport: (n) => n > 0 ? `查看报告 → (发现${n}个问题)` : '查看报告 → (未发现损坏)',
  viewPartialReport: '查看部分报告 →',
  takeDamagePhotos: '拍摄您想报告的损坏照片。\nAI将自动检测问题。',

  inspectionReport: '检查报告',
  aiResults: 'AI分析结果',
  noDamage: '未发现重大损坏',
  immediateAttention: '需要立即处理',
  urgentRepair: '建议紧急修复',
  maintenanceNeeded: '需要维护',
  photosAnalyzedIssues: (p, i) => `已分析${p}张照片 · 发现${i}个问题`,
  criticalHigh: '严重/高',
  totalIssues: '总问题',
  photos: '照片',
  riskAlerts: '⚠ 风险警告',
  ifNotRepaired: '如不修复：',
  issueDetected: (n) => `发现${n}个问题`,
  noDamageDetected: '分析的照片中未检测到损坏。',
  wantEstimate: '需要费用估算吗？',
  estimateDesc: '输入您的信息，MacTor将审核报告并通过电子邮件发送估算。',
  requestEstimate: '申请费用估算 →',
  addMorePhotosBtn: '← 添加更多照片',

  yourDetails: '您的信息',
  contactInfo: '联系方式',
  contactDesc: '我们将审核您的报告并通过电子邮件发送费用估算。',
  fullName: '全名',
  email: '电子邮件',
  phone: '电话',
  namePlaceholder: '张伟',
  emailPlaceholder: 'zhang@email.com',
  phonePlaceholder: '+1 (416) 000-0000',
  propertyAddress: '房产地址',
  privacy: '🔒 您的信息保密，仅用于估算目的。',
  submitBtn: '提交并申请估算 →',
  sending: '发送中…',
  fillAllFields: '请填写所有字段。',
  sendError: '发送错误，请重试。',

  reportSubmitted: '报告已提交',
  allDone: '完成！',
  statusDesc: '我们已收到您的检查报告。团队将审核并通过电子邮件发送',
  costEstimateByEmail: '费用估算',
  statusAfter: '（几小时内）。',
  statusSteps: [
    'MacTor将在发送前审核价格',
    '如果您接受，我们将致电安排',
  ],
  newInspection: '新检查',

  processing: '处理中…',
  accepted: '估算已接受！',
  acceptedMsg: '我们将很快联系您安排上门服务。感谢您选择MacTor！',
  declined: '已收到',
  declinedMsg: '感谢您的回复。如果您改变主意，请随时联系我们。',
  errorMsg: '出现问题，请直接联系MacTor。',
  backHome: '返回首页',
};

// ─── Hindi ─────────────────────────────────────────────────────────────────
const hi: Strings = {
  chooseLanguage: 'अपनी भाषा चुनें',
  chooseSubtitle: 'निरीक्षण के लिए भाषा चुनें',

  appTagline: 'AI-आधारित संपत्ति निरीक्षण',
  tagline: 'AI नुकसान पहचानता है · तुरंत अनुमान · GTA टोरंटो',

  propertyType: 'संपत्ति का प्रकार',
  residential: 'आवासीय',
  residentialDesc: 'घर, कॉन्डो,\nअपार्टमेंट',
  commercial: 'व्यावसायिक',
  commercialDesc: 'कार्यालय, दुकान,\nव्यावसायिक इमारत',
  howItWorks: 'यह कैसे काम करता है',
  steps: [
    'नुकसान की 10 फ़ोटो लें',
    'AI तुरंत समस्याएं ढूंढता है',
    'जोखिम अलर्ट के साथ रिपोर्ट देखें',
    'ईमेल द्वारा लागत अनुमान पाएं',
    'स्वीकार करें और हम मरम्मत शेड्यूल करेंगे',
  ],
  startBtn: 'निरीक्षण शुरू करें →',
  starting: 'शुरू हो रहा है…',
  connectionError: 'कनेक्शन त्रुटि। इंटरनेट जांचें।',

  inspectionPhotos: 'निरीक्षण फ़ोटो',
  documentDamage: 'नुकसान का दस्तावेज़ बनाएं',
  takePhotos: 'फ़ोटो लें या अपलोड करें',
  addMorePhotos: 'और फ़ोटो जोड़ें',
  maxPhotos: (n) => `अधिकतम ${n} फ़ोटो · AI स्वचालित विश्लेषण`,
  uploadingPhoto: 'अपलोड हो रहा है…',
  aiAnalyzing: 'AI विश्लेषण कर रहा है…',
  noDamagePhoto: '✓ इस फ़ोटो में कोई नुकसान नहीं',
  errorPhoto: '✕ फ़ोटो प्रोसेस करने में त्रुटि',
  analyzingBar: (done, total) => `AI विश्लेषण… ${done}/${total} पूर्ण`,
  viewReport: (n) => n > 0 ? `रिपोर्ट देखें → (${n} समस्याएं)` : 'रिपोर्ट देखें → (कोई नुकसान नहीं)',
  viewPartialReport: 'आंशिक रिपोर्ट देखें →',
  takeDamagePhotos: 'नुकसान की फ़ोटो लें।\nAI समस्याएं स्वचालित रूप से ढूंढेगा।',

  inspectionReport: 'निरीक्षण रिपोर्ट',
  aiResults: 'AI विश्लेषण परिणाम',
  noDamage: 'कोई महत्वपूर्ण नुकसान नहीं',
  immediateAttention: 'तत्काल ध्यान आवश्यक',
  urgentRepair: 'तत्काल मरम्मत की सिफारिश',
  maintenanceNeeded: 'रखरखाव आवश्यक',
  photosAnalyzedIssues: (p, i) => `${p} फ़ोटो का विश्लेषण · ${i} समस्या(एं)`,
  criticalHigh: 'गंभीर/उच्च',
  totalIssues: 'कुल समस्याएं',
  photos: 'फ़ोटो',
  riskAlerts: '⚠ जोखिम अलर्ट',
  ifNotRepaired: 'मरम्मत न हो तो:',
  issueDetected: (n) => `${n} समस्या(एं) मिलीं`,
  noDamageDetected: 'फ़ोटो में कोई नुकसान नहीं मिला।',
  wantEstimate: 'लागत अनुमान चाहिए?',
  estimateDesc: 'अपनी जानकारी दर्ज करें, MacTor समीक्षा करेगा और ईमेल पर अनुमान भेजेगा।',
  requestEstimate: 'लागत अनुमान मांगें →',
  addMorePhotosBtn: '← और फ़ोटो जोड़ें',

  yourDetails: 'आपकी जानकारी',
  contactInfo: 'संपर्क जानकारी',
  contactDesc: 'हम रिपोर्ट की समीक्षा करेंगे और ईमेल से लागत अनुमान भेजेंगे।',
  fullName: 'पूरा नाम',
  email: 'ईमेल',
  phone: 'फ़ोन',
  namePlaceholder: 'राज शर्मा',
  emailPlaceholder: 'raj@email.com',
  phonePlaceholder: '+1 (416) 000-0000',
  propertyAddress: 'संपत्ति का पता',
  privacy: '🔒 आपकी जानकारी गोपनीय है, केवल अनुमान के लिए।',
  submitBtn: 'सबमिट करें और अनुमान मांगें →',
  sending: 'भेज रहा है…',
  fillAllFields: 'कृपया सभी फ़ील्ड भरें।',
  sendError: 'भेजने में त्रुटि। पुनः प्रयास करें।',

  reportSubmitted: 'रिपोर्ट सबमिट हुई',
  allDone: 'हो गया!',
  statusDesc: 'हमें आपका निरीक्षण मिला। टीम समीक्षा करके',
  costEstimateByEmail: 'ईमेल से लागत अनुमान',
  statusAfter: 'कुछ घंटों में भेजेगी।',
  statusSteps: [
    'MacTor कीमतों की समीक्षा करेगा',
    'स्वीकृति पर हम शेड्यूल के लिए कॉल करेंगे',
  ],
  newInspection: 'नया निरीक्षण',

  processing: 'प्रसंस्करण…',
  accepted: 'अनुमान स्वीकृत!',
  acceptedMsg: 'हम जल्द ही यात्रा शेड्यूल करेंगे। MacTor को चुनने के लिए धन्यवाद!',
  declined: 'नोट किया',
  declinedMsg: 'धन्यवाद। मन बदलें तो हमसे संपर्क करें।',
  errorMsg: 'कुछ गलत हुआ। MacTor से सीधे संपर्क करें।',
  backHome: 'होम पर वापस',
};

// ─── Filipino (Tagalog) ────────────────────────────────────────────────────
const tl: Strings = {
  chooseLanguage: 'Pumili ng Wika',
  chooseSubtitle: 'Piliin ang wika para sa iyong inspeksyon',

  appTagline: 'AI na Inspeksyon ng Ari-arian',
  tagline: 'Natutukoy ng AI ang pinsala · Agarang tantya · GTA Toronto',

  propertyType: 'URI NG ARI-ARIAN',
  residential: 'Tirahan',
  residentialDesc: 'Bahay, kondo,\napartamento',
  commercial: 'Komersyal',
  commercialDesc: 'Opisina, tindahan,\ngusali',
  howItWorks: 'PAANO ITO GUMAGANA',
  steps: [
    'Kumuha ng hanggang 10 larawan ng pinsala',
    'Sinusuri ng AI ang mga isyu kaagad',
    'Tingnan ang ulat na may mga babala sa panganib',
    'Tumatanggap ng tantya ng gastos sa email',
    'Tanggapin at mag-iskedyul ng pagkukumpuni',
  ],
  startBtn: 'Simulan ang Inspeksyon →',
  starting: 'Nagsisimula…',
  connectionError: 'Error sa koneksyon. Suriin ang iyong internet.',

  inspectionPhotos: 'MGA LARAWAN NG INSPEKSYON',
  documentDamage: 'I-dokumento ang pinsala',
  takePhotos: 'Kumuha o mag-upload ng larawan',
  addMorePhotos: 'Magdagdag ng larawan',
  maxPhotos: (n) => `Max ${n} larawan · Awtomatikong sinusuri ng AI`,
  uploadingPhoto: 'Ina-upload ang larawan…',
  aiAnalyzing: 'Sinusuri ng AI…',
  noDamagePhoto: '✓ Walang pinsala na nakita sa larawang ito',
  errorPhoto: '✕ Error sa pagproseso ng larawan',
  analyzingBar: (done, total) => `Sinusuri ng AI… ${done}/${total} na kumpleto`,
  viewReport: (n) => n > 0 ? `Tingnan ang Ulat → (${n} isyu)` : 'Tingnan ang Ulat → (Walang pinsala)',
  viewPartialReport: 'Tingnan ang Bahagyang Ulat →',
  takeDamagePhotos: 'Kumuha ng larawan ng pinsalang gusto mong iulat.\nAwtomatikong matutukoy ng AI ang mga isyu.',

  inspectionReport: 'ULAT NG INSPEKSYON',
  aiResults: 'Mga Resulta ng Pagsusuri ng AI',
  noDamage: 'Walang makabuluhang pinsala ang natagpuan',
  immediateAttention: 'Kailangan ng agarang pansin',
  urgentRepair: 'Inirerekomenda ang agarang pagkukumpuni',
  maintenanceNeeded: 'Kailangan ng pagpapanatili',
  photosAnalyzedIssues: (p, i) => `${p} larawang nasuri · ${i} isyung natagpuan`,
  criticalHigh: 'Kritikal/Mataas',
  totalIssues: 'Kabuuang isyu',
  photos: 'Mga larawan',
  riskAlerts: '⚠ MGA BABALA SA PANGANIB',
  ifNotRepaired: 'Kung hindi kukumpunihin:',
  issueDetected: (n) => `${n} isyung natagpuan`,
  noDamageDetected: 'Walang pinsala na natukoy sa mga sinuring larawan.',
  wantEstimate: 'Gusto ng tantya ng gastos?',
  estimateDesc: 'Ilagay ang iyong mga detalye at susuriin ng MacTor ang ulat. Makakatanggap ka ng tantya sa email.',
  requestEstimate: 'Humiling ng Tantya ng Gastos →',
  addMorePhotosBtn: '← Magdagdag ng larawan',

  yourDetails: 'ANG IYONG MGA DETALYE',
  contactInfo: 'Impormasyon sa pakikipag-ugnayan',
  contactDesc: 'Susuriin namin ang iyong ulat at magpapadala ng tantya ng gastos sa email.',
  fullName: 'BUONG PANGALAN',
  email: 'EMAIL',
  phone: 'TELEPONO',
  namePlaceholder: 'Juan dela Cruz',
  emailPlaceholder: 'juan@email.com',
  phonePlaceholder: '+1 (416) 000-0000',
  propertyAddress: 'ADDRESS NG ARI-ARIAN',
  privacy: '🔒 Ang iyong impormasyon ay kumpidensyal at para lamang sa tantya.',
  submitBtn: 'Isumite at Humiling ng Tantya →',
  sending: 'Nagpapadala…',
  fillAllFields: 'Pakipunan ang lahat ng mga field.',
  sendError: 'Error sa pagpapadala. Subukan ulit.',

  reportSubmitted: 'NAISUMITE ANG ULAT',
  allDone: 'Tapos na!',
  statusDesc: 'Natanggap namin ang iyong inspeksyon. Susuriin ito ng aming koponan at magpapadala ng',
  costEstimateByEmail: 'tantya ng gastos sa email',
  statusAfter: 'sa loob ng ilang oras.',
  statusSteps: [
    'Susuriin ng MacTor ang mga presyo bago magpadala',
    'Kung tatanggap ka, tatawagan ka namin para mag-iskedyul',
  ],
  newInspection: 'Bagong Inspeksyon',

  processing: 'Pinoproseso…',
  accepted: 'Tinanggap ang Tantya!',
  acceptedMsg: 'Malapit na kaming makipag-ugnayan para mag-iskedyul ng pagbisita. Salamat sa pagpili ng MacTor!',
  declined: 'Natanggap',
  declinedMsg: 'Salamat sa iyong tugon. Kung magbabago ang isip mo, makipag-ugnayan sa amin.',
  errorMsg: 'May nagkamali. Makipag-ugnayan sa MacTor nang direkta.',
  backHome: 'Bumalik sa simula',
};

export const T: Record<Lang, Strings> = { en, es, zh, hi, tl };

const VALID_LANGS = ['en', 'es', 'zh', 'hi', 'tl'];

// Helper: read language from localStorage (client-side only)
export function getSavedLang(): Lang | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(LANG_KEY) as Lang;
  return saved && VALID_LANGS.includes(saved) ? saved : null;
}

// Helper: read language from URL search params (client-side only, no Suspense needed)
export function getLangFromUrl(): Lang | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('lang') as Lang;
  return param && VALID_LANGS.includes(param) ? param : null;
}

export function saveLang(lang: Lang): void {
  if (typeof window !== 'undefined') localStorage.setItem(LANG_KEY, lang);
}
