export interface EquipmentModel {
  id: string;
  brand: string;
  model: string;
  nameEn: string;
  nameAr: string;
  specs: { labelEn: string; labelAr: string; value: string }[];
  image: string;
}

export interface EquipmentCategory {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  models: EquipmentModel[];
}

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    slug: 'bulldozers',
    nameEn: 'Bulldozers',
    nameAr: 'الجرافات',
    descriptionEn: 'Heavy-duty bulldozers for earthmoving and site preparation.',
    descriptionAr: 'جرافات ثقيلة لأعمال تحريك التراب وتهيئة المواقع.',
    icon: '🏗️',
    models: [
      {
        id: 'D475',
        brand: 'Komatsu',
        model: 'D475',
        nameEn: 'Komatsu D475',
        nameAr: 'كوماتسو D475',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=Komatsu+D475',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '108,000 kg' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '410 kW' },
          { labelEn: 'Blade Capacity', labelAr: 'سعة الشفرة', value: '37.6 m³' },
        ],
      },
      {
        id: 'D9N',
        brand: 'Caterpillar',
        model: 'D9N',
        nameEn: 'CAT D9N',
        nameAr: 'كاتربيلر D9N',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=CAT+D9N',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '49,574 kg' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '305 kW' },
          { labelEn: 'Blade Type', labelAr: 'نوع الشفرة', value: 'Semi-U' },
        ],
      },
      {
        id: 'D8K',
        brand: 'Caterpillar',
        model: 'D8K',
        nameEn: 'CAT D8K',
        nameAr: 'كاتربيلر D8K',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=CAT+D8K',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '38,102 kg' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '180 kW' },
          { labelEn: 'Blade Capacity', labelAr: 'سعة الشفرة', value: '12.5 m³' },
        ],
      },
      {
        id: 'D155',
        brand: 'Komatsu',
        model: 'D155',
        nameEn: 'Komatsu D155',
        nameAr: 'كوماتسو D155',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=Komatsu+D155',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '37,850 kg' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '228 kW' },
          { labelEn: 'Blade Capacity', labelAr: 'سعة الشفرة', value: '12.0 m³' },
        ],
      },
    ],
  },
  {
    slug: 'wheel-loaders',
    nameEn: 'Wheel Loaders',
    nameAr: 'اللوادر الإطارية',
    descriptionEn: 'Versatile wheel loaders for material handling and loading operations.',
    descriptionAr: 'لوادر إطارية متعددة الاستخدامات لمناولة المواد وأعمال التحميل.',
    icon: '⚙️',
    models: [
      {
        id: '966E',
        brand: 'Caterpillar',
        model: '966E',
        nameEn: 'CAT 966E',
        nameAr: 'كاتربيلر 966E',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=CAT+966E',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '18,144 kg' },
          { labelEn: 'Bucket Capacity', labelAr: 'سعة الدلو', value: '3.1 m³' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '160 kW' },
        ],
      },
      {
        id: '950E',
        brand: 'Caterpillar',
        model: '950E',
        nameEn: 'CAT 950E',
        nameAr: 'كاتربيلر 950E',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=CAT+950E',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '14,969 kg' },
          { labelEn: 'Bucket Capacity', labelAr: 'سعة الدلو', value: '2.5 m³' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '130 kW' },
        ],
      },
      {
        id: '928G',
        brand: 'Caterpillar',
        model: '928G',
        nameEn: 'CAT 928G',
        nameAr: 'كاتربيلر 928G',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=CAT+928G',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '10,886 kg' },
          { labelEn: 'Bucket Capacity', labelAr: 'سعة الدلو', value: '1.9 m³' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '95 kW' },
        ],
      },
      {
        id: '926E',
        brand: 'Caterpillar',
        model: '926E',
        nameEn: 'CAT 926E',
        nameAr: 'كاتربيلر 926E',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=CAT+926E',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '9,752 kg' },
          { labelEn: 'Bucket Capacity', labelAr: 'سعة الدلو', value: '1.5 m³' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '85 kW' },
        ],
      },
      {
        id: '910',
        brand: 'Caterpillar',
        model: '910',
        nameEn: 'CAT 910',
        nameAr: 'كاتربيلر 910',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=CAT+910',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '8,165 kg' },
          { labelEn: 'Bucket Capacity', labelAr: 'سعة الدلو', value: '1.2 m³' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '70 kW' },
        ],
      },
      {
        id: 'XCMG-958',
        brand: 'XCMG',
        model: '958',
        nameEn: 'XCMG 958',
        nameAr: 'اكس سي ام جي 958',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=XCMG+958',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '17,000 kg' },
          { labelEn: 'Bucket Capacity', labelAr: 'سعة الدلو', value: '3.0 m³' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '147 kW' },
        ],
      },
    ],
  },
  {
    slug: 'excavators',
    nameEn: 'Excavators',
    nameAr: 'الحفارات',
    descriptionEn: 'Powerful excavators for precision digging and earthmoving.',
    descriptionAr: 'حفارات قوية للحفر الدقيق وتحريك التراب.',
    icon: '⛏️',
    models: [
      {
        id: 'CAT-320',
        brand: 'Caterpillar',
        model: '320',
        nameEn: 'CAT 320',
        nameAr: 'كاتربيلر 320',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=CAT+320',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '20,000 kg' },
          { labelEn: 'Bucket Capacity', labelAr: 'سعة الدلو', value: '0.9 m³' },
          { labelEn: 'Max Dig Depth', labelAr: 'أقصى عمق حفر', value: '6.77 m' },
        ],
      },
    ],
  },
  {
    slug: 'backhoe-loaders',
    nameEn: 'Backhoe Loaders',
    nameAr: 'اللوادر الخلفية',
    descriptionEn: 'Versatile backhoe loaders for construction and utility work.',
    descriptionAr: 'لوادر خلفية متعددة الاستخدامات لأعمال البناء والمرافق.',
    icon: '🔧',
    models: [
      {
        id: 'JCB-3CX',
        brand: 'JCB',
        model: '3CX',
        nameEn: 'JCB 3CX',
        nameAr: 'جي سي بي 3CX',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=JCB+3CX',
        specs: [
          { labelEn: 'Operating Weight', labelAr: 'وزن التشغيل', value: '8,460 kg' },
          { labelEn: 'Engine Power', labelAr: 'قوة المحرك', value: '74 kW' },
          { labelEn: 'Max Dig Depth', labelAr: 'أقصى عمق حفر', value: '5.88 m' },
        ],
      },
    ],
  },
  {
    slug: 'telehandlers',
    nameEn: 'Telehandlers',
    nameAr: 'الرافعات التلسكوبية',
    descriptionEn: 'Boom trucks and telehandlers for elevated material handling.',
    descriptionAr: 'شاحنات رافعة ومعدات تلسكوبية لمناولة المواد في الارتفاعات.',
    icon: '🏭',
    models: [
      {
        id: 'telehandler-boom',
        brand: 'Mixed Fleet',
        model: 'Boom Truck',
        nameEn: 'Telehandler Boom Truck',
        nameAr: 'شاحنة الرافعة التلسكوبية',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=Telehandler',
        specs: [
          { labelEn: 'Max Lift Height', labelAr: 'أقصى ارتفاع رفع', value: '14 m' },
          { labelEn: 'Max Capacity', labelAr: 'أقصى حمولة', value: '3.5 t' },
          { labelEn: 'Drive', labelAr: 'نظام الدفع', value: '4WD' },
        ],
      },
    ],
  },
  {
    slug: 'tower-lights',
    nameEn: 'Tower Lights',
    nameAr: 'أبراج الإضاءة',
    descriptionEn: '10-meter mobile lighting towers for night operations.',
    descriptionAr: 'أبراج إضاءة متنقلة 10 أمتار لعمليات الليل.',
    icon: '💡',
    models: [
      {
        id: 'tower-light-10m',
        brand: 'Mixed Fleet',
        model: '10m Tower',
        nameEn: '10 Meter Tower Lights',
        nameAr: 'أبراج إضاءة 10 أمتار',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=Tower+Lights',
        specs: [
          { labelEn: 'Height', labelAr: 'الارتفاع', value: '10 m' },
          { labelEn: 'Lamps', labelAr: 'المصابيح', value: '4 × 1000W Metal Halide' },
          { labelEn: 'Coverage', labelAr: 'التغطية', value: '5,000 m²' },
        ],
      },
    ],
  },
  {
    slug: 'power-generators',
    nameEn: 'Power Generators',
    nameAr: 'المولدات الكهربائية',
    descriptionEn: 'CAT & Perkins diesel generators from 25 kW to 600 kW.',
    descriptionAr: 'مولدات ديزل كاتربيلر وبيركنز من 25 كيلوواط إلى 600 كيلوواط.',
    icon: '⚡',
    models: [
      {
        id: 'gen-25-600',
        brand: 'CAT / Perkins',
        model: '25–600 kW',
        nameEn: 'CAT/Perkins Generators',
        nameAr: 'مولدات كاتربيلر/بيركنز',
        image: 'https://placehold.co/600x400/0E1F3A/E8B339?text=Generator',
        specs: [
          { labelEn: 'Power Range', labelAr: 'نطاق الطاقة', value: '25 kW – 600 kW' },
          { labelEn: 'Fuel Type', labelAr: 'نوع الوقود', value: 'Diesel' },
          { labelEn: 'Brands', labelAr: 'الماركات', value: 'CAT / Perkins' },
        ],
      },
    ],
  },
];
