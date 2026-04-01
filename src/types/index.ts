/**
 * ============================================
 * TYPE DEFINITIONS - CareConnect Home Nurse Finder
 * ============================================
 * All TypeScript interfaces and types used across the application.
 * Updated for Supabase — passwords are handled by Supabase Auth.
 */

/** User roles in the system */
export type UserRole = 'user' | 'nurse' | 'admin' | 'shelter';

/** Nurse verification status */
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

/** Booking status */
export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

/** Document forgery detection result */
export type ForgeryResult = 'genuine' | 'suspected_forgery' | 'pending';

/** Base user interface (profile from Supabase profiles table) */
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  created_at: string;
  location?: string;
  google_id?: string;
  profile_photo?: string;
}

/** Nurse professional profile */
export interface NurseProfile {
  id?: string;
  userId: string;
  specializations: string[];
  experience: number;
  baseRate: number;
  rateType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  bio: string;
  location: string;
  serviceAreas: string[];
  availability: boolean;
  verificationStatus: VerificationStatus;
  rating: number;
  totalReviews: number;
  documents: NurseDocument[];
  profilePhoto?: string;
}

/** Uploaded document with AI analysis */
export interface NurseDocument {
  id: string;
  nurseId: string;
  fileName: string;
  fileType: string;
  fileData: string; // base64
  uploadedAt: string;
  documentType: 'certificate' | 'government_id' | 'license' | 'other';
  aiAnalysis?: DocumentAnalysis;
}

/** AI forgery detection analysis result */
export interface DocumentAnalysis {
  result: ForgeryResult;
  confidenceScore: number;
  edgeConsistency: number;
  textureAnalysis: number;
  compressionArtifacts: number;
  ocrConsistency: number;
  fontConsistency: number;
  alignmentScore: number;
  extractedText: string;
  anomalies: string[];
  analyzedAt: string;
}

/** Booking between user and nurse */
export interface Booking {
  id: string;
  userId: string;
  nurseId: string;
  userName: string;
  nurseName: string;
  serviceType: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  paymentMethod: 'cod' | 'online';
  paymentStatus?: 'pending' | 'completed' | 'failed';
  totalAmount: number;
  notes: string;
  createdAt: string;
  feedback?: Feedback;
  nursePhone?: string;
  userPhone?: string;
}

/** User feedback on completed booking */
export interface Feedback {
  rating: number;
  comment: string;
  createdAt: string;
}

/** Homeless individual location report */
export interface ShelterReport {
  id: string;
  reportedBy: string;
  reporterName: string;
  photo: string; // base64
  latitude: number;
  longitude: number;
  locationDescription: string;
  description: string;
  createdAt: string;
  nearbyShelters: Shelter[];
  status: 'reported' | 'notified' | 'assigned' | 'resolved';
  assignedShelterId?: string;
  acceptedAt?: string;
}

/** Shelter information */
export interface Shelter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  capacity: number;
  distanceKm?: number;
  shelterUserId?: string;
}

/** Authentication state */
export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}

/** Notification */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}

/** Admin audit log entry */
export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

/** Result of a registration attempt */
export interface RegistrationResult {
  success: boolean;
  error?: string;
  session?: any;
  user?: any;
}

/** Authentication context state and methods */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (intendedRole?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<RegistrationResult>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User> & any) => Promise<any>;
}
