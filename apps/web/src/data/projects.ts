export type ProjectCategory = 'residential' | 'commercial' | 'maintenance';

export interface Project {
  id: string;
  category: ProjectCategory;
  typeEn: string;
  typeAr: string;
  locationEn: string;
  locationAr: string;
  ownerEn?: string;
  ownerAr?: string;
  area?: string;
}

export const PROJECTS: Project[] = [
  // ── Residential ─────────────────────────────────────────────────────────
  {
    id: 'res-1',
    category: 'residential',
    typeEn: 'Residential Area',
    typeAr: 'منطقة سكنية',
    locationEn: 'Jeddah – Al Sagr',
    locationAr: 'جدة – الصقر',
    ownerEn: 'Hani Abu Al-Farj',
    ownerAr: 'هاني أبو الفرج',
    area: '2,940 m²',
  },
  {
    id: 'res-2',
    category: 'residential',
    typeEn: 'Residential Area',
    typeAr: 'منطقة سكنية',
    locationEn: 'Jeddah – Al Nuzlah Al Sharqia',
    locationAr: 'جدة – النزلة الشرقية',
    ownerEn: 'Muhammad Abu Al-Farj',
    ownerAr: 'محمد أبو الفرج',
  },
  {
    id: 'res-3',
    category: 'residential',
    typeEn: 'Residential Area – 20 Villas',
    typeAr: 'منطقة سكنية – 20 فيلا',
    locationEn: 'Jeddah – Al Johara Al Mohammadiah',
    locationAr: 'جدة – الجوهرة المحمدية',
    ownerEn: 'Eng. Talal Al Ameer',
    ownerAr: 'م. طلال الأمير',
    area: '7,200 m²',
  },
  // ── Commercial ──────────────────────────────────────────────────────────
  {
    id: 'com-1',
    category: 'commercial',
    typeEn: 'Commercial Area Decor GRC',
    typeAr: 'منطقة تجارية – ديكور GRC',
    locationEn: 'Jeddah – Alameer Fawaz',
    locationAr: 'جدة – الأمير فواز',
    ownerEn: 'Shaikh Nawaz Al-Refai',
    ownerAr: 'الشيخ نواز الرفاعي',
  },
  {
    id: 'com-2',
    category: 'commercial',
    typeEn: 'Commercial Offices',
    typeAr: 'مكاتب تجارية',
    locationEn: 'Jeddah – Al Zahra, Kutbi Street',
    locationAr: 'جدة – الزهراء، شارع كتبي',
    ownerEn: 'Al Abood',
    ownerAr: 'العبود',
  },
  {
    id: 'com-3',
    category: 'commercial',
    typeEn: 'Commercial & Residential',
    typeAr: 'تجاري وسكني',
    locationEn: 'Jeddah – Al Medain',
    locationAr: 'جدة – المدائن',
    ownerEn: 'Hani Abdullah Abu-Farj',
    ownerAr: 'هاني عبدالله أبو الفرج',
  },
  {
    id: 'com-4',
    category: 'commercial',
    typeEn: 'Petrol Station',
    typeAr: 'محطة وقود',
    locationEn: 'Jeddah – Al Nahda',
    locationAr: 'جدة – النهضة',
    ownerEn: 'Al Itwad Holding Group',
    ownerAr: 'مجموعة الاتحاد القابضة',
  },
  {
    id: 'com-5',
    category: 'commercial',
    typeEn: 'Mosque',
    typeAr: 'مسجد',
    locationEn: 'Jeddah – Al Rawdah',
    locationAr: 'جدة – الروضة',
    ownerEn: 'Fayal Jyer',
    ownerAr: 'فيصل جير',
  },
  {
    id: 'com-6',
    category: 'commercial',
    typeEn: 'Commercial Center',
    typeAr: 'مركز تجاري',
    locationEn: 'Jeddah – Tahliyah Street',
    locationAr: 'جدة – شارع التحلية',
    ownerEn: 'Shaikh Umer Abu Bakar Balbi',
    ownerAr: 'الشيخ عمر أبو بكر البلبي',
  },
];
