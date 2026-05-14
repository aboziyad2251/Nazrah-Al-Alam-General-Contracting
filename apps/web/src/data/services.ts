export interface Service {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
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
    icon: '🏛️',
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
    icon: '⚙️',
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
    icon: '⚡',
  },
  {
    id: 's4',
    slug: 'infrastructure',
    nameEn: 'Infrastructure Development',
    nameAr: 'تطوير البنية التحتية',
    descriptionEn:
      'Road construction, stormwater drainage, underground utilities, retaining walls, and site infrastructure at scale.',
    descriptionAr: 'إنشاء الطرق وصرف مياه الأمطار والمرافق الجوفية وجدران الدعم والبنية التحتية.',
    icon: '🛣️',
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
    icon: '🔧',
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
    icon: '🏠',
  },
  {
    id: 's7',
    slug: 'equipment-rental',
    nameEn: 'Equipment Rental & Fleet',
    nameAr: 'تأجير المعدات والأسطول',
    descriptionEn:
      'Hire our modern fleet of bulldozers, loaders, excavators, generators, and tower lights for your project.',
    descriptionAr: 'استأجر أسطولنا الحديث من الجرافات واللوادر والحفارات والمولدات وأبراج الإضاءة.',
    icon: '🚜',
  },
];
