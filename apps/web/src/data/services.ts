export interface Service {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconImage: string;
}

export const SERVICES: Service[] = [
  {
    id: 's1',
    slug: 'civil-structural',
    nameEn: 'Civil & Structural Works',
    nameAr: 'الأعمال المدنية والإنشائية',
    descriptionEn:
      'Complete civil engineering and structural construction including foundations, concrete works, and framing for residential and commercial projects.',
    descriptionAr:
      'أعمال الهندسة المدنية والإنشائية الشاملة بما في ذلك الأساسات وأعمال الخرسانة والهياكل.',
    iconImage: '/services/civil-structural.webp',
  },
  {
    id: 's2',
    slug: 'mechanical',
    nameEn: 'Mechanical Engineering',
    nameAr: 'الهندسة الميكانيكية',
    descriptionEn:
      'HVAC systems, plumbing, firefighting, and mechanical installations for all building types with certified technicians.',
    descriptionAr:
      'أنظمة التكييف والسباكة ومكافحة الحريق والتركيبات الميكانيكية لجميع أنواع المباني.',
    iconImage: '/services/mechanical.webp',
  },
  {
    id: 's3',
    slug: 'electrical',
    nameEn: 'Electrical Systems',
    nameAr: 'الأنظمة الكهربائية',
    descriptionEn:
      'Full electrical installation, power distribution, lighting design, smart building systems, and solar integration.',
    descriptionAr:
      'التركيبات الكهربائية الكاملة وتوزيع الطاقة وتصميم الإضاءة وأنظمة المباني الذكية.',
    iconImage: '/services/electrical.webp',
  },
  {
    id: 's4',
    slug: 'infrastructure',
    nameEn: 'Infrastructure Development',
    nameAr: 'تطوير البنية التحتية',
    descriptionEn:
      'Road construction, stormwater drainage, underground utilities, retaining walls, and site infrastructure at scale.',
    descriptionAr: 'إنشاء الطرق وصرف مياه الأمطار والمرافق الجوفية وجدران الدعم والبنية التحتية.',
    iconImage: '/services/infrastructure.webp',
  },
  {
    id: 's5',
    slug: 'maintenance',
    nameEn: 'Building Maintenance',
    nameAr: 'صيانة المباني',
    descriptionEn:
      'Preventive and corrective maintenance programs for commercial and residential buildings, 24/7 emergency response.',
    descriptionAr:
      'برامج الصيانة الوقائية والتصحيحية للمباني التجارية والسكنية مع استجابة طوارئ على مدار الساعة.',
    iconImage: '/services/maintenance.webp',
  },
  {
    id: 's6',
    slug: 'fitout',
    nameEn: 'Interior Fit-Out & Renovation',
    nameAr: 'التشطيبات الداخلية والتجديد',
    descriptionEn:
      'Premium interior fit-out, GRC decorative elements, flooring, cladding, and complete renovation services.',
    descriptionAr:
      'تشطيبات داخلية فاخرة وعناصر زخرفية GRC والأرضيات والكسوة وخدمات التجديد الشاملة.',
    iconImage: '/services/fitout.webp',
  },
  {
    id: 's7',
    slug: 'equipment-rental',
    nameEn: 'Equipment Rental & Fleet',
    nameAr: 'تأجير المعدات والأسطول',
    descriptionEn:
      'Hire our modern fleet of bulldozers, loaders, excavators, forklifts, generators, and tower lights for your project.',
    descriptionAr:
      'استأجر أسطولنا الحديث من الجرافات واللوادر والحفارات والرافعات الشوكية والمولدات وأبراج الإضاءة.',
    iconImage: '/services/equipment-rental.webp',
  },
  {
    id: 's8',
    slug: 'cctv-security',
    nameEn: 'CCTV & Security Systems',
    nameAr: 'أنظمة المراقبة والأمن',
    descriptionEn:
      'Professional CCTV camera installation, security monitoring systems, and access control solutions for commercial and residential properties.',
    descriptionAr:
      'تركيب كاميرات المراقبة الاحترافية وأنظمة الأمن ومراقبة الدخول للمنشآت التجارية والسكنية.',
    iconImage: '/services/cctv.webp',
  },
  {
    id: 's9',
    slug: 'networking',
    nameEn: 'Networking & IT Infrastructure',
    nameAr: 'الشبكات والبنية التحتية لتقنية المعلومات',
    descriptionEn:
      'Structured cabling, network installation, server room setup, and full IT infrastructure for offices and commercial buildings.',
    descriptionAr:
      'الكابلات المنظمة وتركيب الشبكات وإعداد غرف الخوادم والبنية التحتية الكاملة لتقنية المعلومات.',
    iconImage: '/services/networking.webp',
  },
  {
    id: 's10',
    slug: 'manpower',
    nameEn: 'Man Power Supply',
    nameAr: 'توفير العمالة',
    descriptionEn:
      'Skilled and semi-skilled workforce supply including civil laborers, technicians, operators, and site supervisors for short and long-term projects.',
    descriptionAr:
      'توفير عمالة ماهرة وشبه ماهرة تشمل عمال المدني والفنيين والمشغلين والمشرفين للمشاريع القصيرة والطويلة الأمد.',
    iconImage: '/services/manpower.webp',
  },
];
