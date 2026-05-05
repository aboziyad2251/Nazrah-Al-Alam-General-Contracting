// ─── Locale & Direction ────────────────────────────────────────────────────
export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

// ─── Company ────────────────────────────────────────────────────────────────
export interface Company {
  id: string;
  nameEn: string;
  nameAr: string;
  logoUrl: string;
  crNumber: string;
  vatNumber?: string;
  address: Address;
  contactInfo: ContactInfo;
  establishedYear: number;
}

export interface Address {
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  mapUrl?: string;
}

export interface ContactInfo {
  phone: string;
  mobile?: string;
  email: string;
  website?: string;
}

// ─── Services ───────────────────────────────────────────────────────────────
export type ServiceCategory =
  | 'civil'
  | 'mechanical'
  | 'electrical'
  | 'infrastructure'
  | 'maintenance'
  | 'fitout';

export interface Service {
  id: string;
  slug: string;
  category: ServiceCategory;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconUrl?: string;
  imageUrl?: string;
  featured: boolean;
  sortOrder: number;
}

// ─── Projects ───────────────────────────────────────────────────────────────
export type ProjectStatus = 'completed' | 'ongoing' | 'upcoming';

export interface Project {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  status: ProjectStatus;
  clientEn?: string;
  clientAr?: string;
  locationEn: string;
  locationAr: string;
  value?: number;
  startDate?: string;
  endDate?: string;
  coverImageUrl: string;
  galleryUrls: string[];
  services: ServiceCategory[];
  featured: boolean;
}

// ─── Equipment ──────────────────────────────────────────────────────────────
export interface Equipment {
  id: string;
  nameEn: string;
  nameAr: string;
  brand: string;
  model?: string;
  quantity: number;
  imageUrl?: string;
  category: string;
}

// ─── Team ───────────────────────────────────────────────────────────────────
export interface TeamMember {
  id: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  bio?: string;
  photoUrl?: string;
  linkedin?: string;
  sortOrder: number;
}

// ─── Contact Form ────────────────────────────────────────────────────────────
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceInterest?: ServiceCategory;
  message: string;
  locale: Locale;
}

// ─── Navigation ─────────────────────────────────────────────────────────────
export interface NavItem {
  labelEn: string;
  labelAr: string;
  href: string;
  children?: NavItem[];
}

// ─── API Responses ───────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ─── Auth (Portal) ───────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
}
