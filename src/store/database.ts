/**
 * ============================================
 * SUPABASE DATABASE LAYER
 * ============================================
 * All CRUD operations backed by Supabase PostgreSQL.
 * Each "DB" object mirrors the old localStorage API
 * but now calls Supabase under the hood.
 *
 * All functions are ASYNC and return Promises.
 */

import { supabase } from '../lib/supabase';
import type {
  User, NurseProfile, NurseDocument, Booking,
  ShelterReport, Shelter, Notification, AdminLog
} from '../types';

/* ─── Helper: map snake_case DB rows to camelCase types ─── */

function mapProfile(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    phone: (row.phone as string) || '',
    role: row.role as User['role'],
    created_at: row.created_at as string,
    location: row.location as string | undefined,
    google_id: row.google_id as string | undefined,
    profile_photo: row.profile_photo as string | undefined,
  };
}

function mapNurseProfile(row: Record<string, unknown>): NurseProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    specializations: (row.specializations as string[]) || [],
    experience: (row.experience as number) || 0,
    // Use base_rate if available, otherwise fallback to hourly_rate (legacy)
    baseRate: (row.base_rate as number) || (row.hourly_rate as number) || 0,
    // Default to 'hourly' if rate_type is missing
    rateType: (row.rate_type as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'hourly',
    bio: (row.bio as string) || '',
    location: (row.location as string) || '',
    serviceAreas: (row.service_areas as string[]) || [],
    availability: row.availability === true,
    verificationStatus: (row.verification_status as NurseProfile['verificationStatus']) || 'pending',
    rating: (row.rating as number) || 0,
    totalReviews: (row.total_reviews as number) || 0,
    documents: [],
    profilePhoto: row.profile_photo as string | undefined,
  };
}

function mapDocument(row: Record<string, unknown>): NurseDocument {
  return {
    id: row.id as string,
    nurseId: row.nurse_id as string,
    fileName: row.file_name as string,
    fileType: row.file_type as string,
    fileData: (row.file_data as string) || '',
    uploadedAt: row.uploaded_at as string,
    documentType: row.document_type as NurseDocument['documentType'],
    aiAnalysis: row.ai_analysis as NurseDocument['aiAnalysis'],
  };
}

function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    nurseId: row.nurse_id as string,
    userName: row.user_name as string,
    nurseName: row.nurse_name as string,
    serviceType: row.service_type as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    status: row.status as Booking['status'],
    paymentMethod: row.payment_method as Booking['paymentMethod'],
    paymentStatus: row.payment_status as Booking['paymentStatus'],
    totalAmount: (row.total_amount as number) || 0,
    notes: (row.notes as string) || '',
    createdAt: row.created_at as string,
    feedback: row.feedback as Booking['feedback'],
    nursePhone: row.nurse_phone as string | undefined,
    userPhone: row.user_phone as string | undefined,
  };
}

function mapShelterReport(row: Record<string, unknown>): ShelterReport {
  return {
    id: row.id as string,
    reportedBy: row.reported_by as string,
    reporterName: row.reporter_name as string,
    photo: (row.photo as string) || '',
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    locationDescription: (row.location_description as string) || '',
    description: (row.description as string) || '',
    createdAt: row.created_at as string,
    nearbyShelters: (row.nearby_shelters as Shelter[]) || [],
    status: row.status as ShelterReport['status'],
    assignedShelterId: (row.assigned_shelter_id as string) || undefined,
    acceptedAt: (row.accepted_at as string) || undefined,
  };
}

function mapShelter(row: Record<string, unknown>): Shelter {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    phone: (row.phone as string) || '',
    email: (row.email as string) || '',
    capacity: (row.capacity as number) || 0,
    shelterUserId: (row.shelter_user_id as string) || undefined,
  };
}

/* ─── Haversine distance (km) ─── */
// Function removed as calculation is now handled by the frontend components.

/* ─── USER / PROFILE operations ─── */

export const UserDB = {
  getAll: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) { console.error('UserDB.getAll:', error); return []; }
    return (data || []).map(mapProfile);
  },

  getById: async (id: string): Promise<User | undefined> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return mapProfile(data);
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    const { data, error } = await supabase
      .from('profiles').select('*')
      .ilike('email', email)
      .single();
    if (error || !data) return undefined;
    return mapProfile(data);
  },

  create: async (profile: Partial<User> & { id: string, email: string, name: string, role: string }): Promise<User | undefined> => {
    const { data, error } = await supabase.from('profiles').insert([profile]).select().single();
    if (error || !data) { console.error('UserDB.create:', error); return undefined; }
    return mapProfile(data);
  },

  update: async (id: string, updates: Partial<User>): Promise<User | undefined> => {
    const mapped: Record<string, unknown> = { id };
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.phone !== undefined) mapped.phone = updates.phone;
    if (updates.role !== undefined) mapped.role = updates.role;
    if (updates.location !== undefined) mapped.location = updates.location;
    if (updates.google_id !== undefined) mapped.google_id = updates.google_id;
    if (updates.profile_photo !== undefined) mapped.profile_photo = updates.profile_photo;
    if (updates.email !== undefined) mapped.email = updates.email;

    const { data, error } = await supabase
      .from('profiles').upsert(mapped).select().single();
    if (error || !data) { console.error('UserDB.update:', error); return undefined; }
    return mapProfile(data);
  },

  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    return !error;
  },
};

/* ─── NURSE PROFILE operations ─── */

export const NurseProfileDB = {
  // Now that images are stored as URLs (not base64), the overview can safely select all columns.
  getAllOverview: async (): Promise<NurseProfile[]> => {
    const { data, error } = await supabase
      .from('nurse_profiles')
      .select('*');
    if (error) return [];
    return (data || []).map(mapNurseProfile);
  },

  getAll: async (): Promise<NurseProfile[]> => {
    const { data, error } = await supabase.from('nurse_profiles').select('*');
    if (error) { console.error('NurseProfileDB.getAll:', error); return []; }
    return (data || []).map(mapNurseProfile);
  },

  getByUserId: async (userId: string): Promise<NurseProfile | undefined> => {
    const { data, error } = await supabase
      .from('nurse_profiles').select('*').eq('user_id', userId).single();
    if (error || !data) return undefined;
    return mapNurseProfile(data);
  },

  getApproved: async (): Promise<NurseProfile[]> => {
    const { data, error } = await supabase
      .from('nurse_profiles').select('*').eq('verification_status', 'approved');
    if (error) return [];
    return (data || []).map(mapNurseProfile);
  },

  create: async (profile: Omit<NurseProfile, 'id' | 'createdAt' | 'rating' | 'totalReviews'>): Promise<NurseProfile | null> => {
    const payload = {
      user_id: profile.userId,
      specializations: profile.specializations,
      experience: profile.experience,
      base_rate: profile.baseRate,
      hourly_rate: profile.baseRate, // Legacy compatibility
      rate_type: profile.rateType,
      bio: profile.bio,
      location: profile.location,
      service_areas: profile.serviceAreas,
      availability: profile.availability,
      verification_status: profile.verificationStatus || 'pending',
    };

    const { data, error } = await supabase.from('nurse_profiles').insert(payload).select().single();

    if (error) {
      console.error('Error creating nurse profile:', error);
      // Fallback for missing columns
      if (error.message?.includes('column') || error.message?.includes('schema cache')) {
        console.warn('Retrying insert without new columns...');
        const legacyPayload = { ...payload } as any;
        delete legacyPayload.base_rate;
        delete legacyPayload.rate_type;
        const { data: lData, error: lErr } = await supabase.from('nurse_profiles').insert(legacyPayload).select().single();
        if (lErr) return null;
        return mapNurseProfile(lData!);
      }
      return null;
    }
    return mapNurseProfile(data);
  },

  update: async (userId: string, updates: Partial<NurseProfile>): Promise<NurseProfile | undefined> => {
    const mapped: Record<string, unknown> = {};
    if (updates.specializations !== undefined) mapped.specializations = updates.specializations;
    if (updates.experience !== undefined) mapped.experience = updates.experience;
    if (updates.baseRate !== undefined) {
      mapped.base_rate = updates.baseRate;
      mapped.hourly_rate = updates.baseRate; // Sync old column
    }
    if (updates.rateType !== undefined) mapped.rate_type = updates.rateType;
    if (updates.bio !== undefined) mapped.bio = updates.bio;
    if (updates.location !== undefined) mapped.location = updates.location;
    if (updates.serviceAreas !== undefined) mapped.service_areas = updates.serviceAreas;
    if (updates.availability !== undefined) mapped.availability = updates.availability;
    if (updates.verificationStatus !== undefined) mapped.verification_status = updates.verificationStatus;
    if (updates.rating !== undefined) mapped.rating = updates.rating;
    if (updates.totalReviews !== undefined) mapped.total_reviews = updates.totalReviews;
    if (updates.profilePhoto !== undefined) mapped.profile_photo = updates.profilePhoto;

    // Sync location to the main user profile if it changed
    if (updates.location !== undefined) {
      await UserDB.update(userId, { location: updates.location });
    }

    const { data, error } = await supabase
      .from('nurse_profiles').update(mapped).eq('user_id', userId).select().single();
    if (error) {
      console.error('NurseProfileDB.update failed:', error);
      // Fallback if columns are missing in DB
      if (error.message?.includes('column') || error.message?.includes('schema cache')) {
        console.warn('Database schema out of sync. Retrying with legacy columns.');
        const legacy = { ...mapped };
        delete legacy.base_rate;
        delete legacy.rate_type;
        const { data: lData, error: lErr } = await supabase.from('nurse_profiles').update(legacy).eq('user_id', userId).select().single();
        if (lErr) throw lErr;
        return mapNurseProfile(lData!);
      }
      throw error;
    }
    if (!data) throw new Error('Failed to update: No data returned');
    return mapNurseProfile(data);
  },

  delete: async (userId: string): Promise<boolean> => {
    const { error } = await supabase.from('nurse_profiles').delete().eq('user_id', userId);
    return !error;
  },

  search: async (location?: string, service?: string): Promise<NurseProfile[]> => {
    // Fetch specifically approved nurses for the user-facing search
    const [{ data, error }, { data: activeBookings }] = await Promise.all([
      supabase.from('nurse_profiles').select('*').eq('verification_status', 'approved'),
      supabase.from('bookings').select('nurse_id').eq('status', 'accepted')
    ]);

    if (error) {
      console.error('Nurse search error:', error);
      return [];
    }

    const busyNurseIds = new Set(activeBookings?.map(b => b.nurse_id) || []);
    let results = (data || []).map(mapNurseProfile).filter(p => !busyNurseIds.has(p.userId));

    if (location) {
      const loc = location.toLowerCase();
      results = results.filter(p =>
        p.location.toLowerCase().includes(loc) ||
        p.serviceAreas.some(a => a.toLowerCase().includes(loc))
      );
    }

    if (service) {
      const svc = service.toLowerCase();
      results = results.filter(p =>
        p.specializations.some(s => s.toLowerCase().includes(svc))
      );
    }

    return results;
  },
};

/* ─── DOCUMENT operations ─── */

export const DocumentDB = {
  getAllOverview: async (): Promise<NurseDocument[]> => {
    // Omits file_data to prevent massive payload timeouts on Admin Dashboard
    const { data, error } = await supabase
      .from('nurse_documents')
      .select('id, nurse_id, file_name, file_type, document_type, ai_analysis, uploaded_at');
    if (error) return [];
    return (data || []).map(mapDocument);
  },

  getAll: async (): Promise<NurseDocument[]> => {
    const { data, error } = await supabase.from('nurse_documents').select('*');
    if (error) return [];
    return (data || []).map(mapDocument);
  },

  getByNurseId: async (nurseId: string): Promise<NurseDocument[]> => {
    const { data, error } = await supabase
      .from('nurse_documents').select('*').eq('nurse_id', nurseId);
    if (error) return [];
    return (data || []).map(mapDocument);
  },

  getById: async (id: string): Promise<NurseDocument | undefined> => {
    const { data, error } = await supabase
      .from('nurse_documents').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return mapDocument(data);
  },

  create: async (doc: Omit<NurseDocument, 'id' | 'uploadedAt'>): Promise<NurseDocument> => {
    const row = {
      nurse_id: doc.nurseId,
      file_name: doc.fileName,
      file_type: doc.fileType,
      file_data: doc.fileData,
      document_type: doc.documentType,
      ai_analysis: doc.aiAnalysis,
    };
    const { data, error } = await supabase.from('nurse_documents').insert(row).select().single();
    if (error || !data) {
      console.error('DocumentDB.create:', error);
      return { ...doc, id: 'temp', uploadedAt: new Date().toISOString() } as NurseDocument;
    }
    return mapDocument(data);
  },

  update: async (id: string, updates: Partial<NurseDocument>): Promise<NurseDocument | undefined> => {
    const mapped: Record<string, unknown> = {};
    if (updates.aiAnalysis !== undefined) mapped.ai_analysis = updates.aiAnalysis;
    if (updates.fileName !== undefined) mapped.file_name = updates.fileName;
    if (updates.fileType !== undefined) mapped.file_type = updates.fileType;
    if (updates.fileData !== undefined) mapped.file_data = updates.fileData;
    if (updates.documentType !== undefined) mapped.document_type = updates.documentType;

    const { data, error } = await supabase
      .from('nurse_documents').update(mapped).eq('id', id).select().single();
    if (error || !data) return undefined;
    return mapDocument(data);
  },

  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('nurse_documents').delete().eq('id', id);
    return !error;
  },
};

/* ─── BOOKING operations ─── */

export const BookingDB = {
  getAll: async (): Promise<Booking[]> => {
    const { data, error } = await supabase.from('bookings').select('*');
    if (error) return [];
    return (data || []).map(mapBooking);
  },

  getRecent: async (limit: number = 5): Promise<Booking[]> => {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) return [];
    return (data || []).map(mapBooking);
  },

  getById: async (id: string): Promise<Booking | undefined> => {
    const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return mapBooking(data);
  },

  getByUserId: async (userId: string): Promise<Booking[]> => {
    const { data, error } = await supabase.from('bookings').select('*').eq('user_id', userId);
    if (error) return [];
    return (data || []).map(mapBooking);
  },

  getByNurseId: async (nurseId: string): Promise<Booking[]> => {
    const { data, error } = await supabase.from('bookings').select('*').eq('nurse_id', nurseId);
    if (error) return [];
    return (data || []).map(mapBooking);
  },

  create: async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    let nursePhone = booking.nursePhone;
    let userPhone = booking.userPhone;

    if (!nursePhone || !userPhone) {
      const { data: profiles } = await supabase.from('profiles').select('id, phone').in('id', [booking.userId, booking.nurseId]);
      if (profiles) {
        if (!nursePhone) nursePhone = profiles.find(p => p.id === booking.nurseId)?.phone;
        if (!userPhone) userPhone = profiles.find(p => p.id === booking.userId)?.phone;
      }
    }

    const row = {
      user_id: booking.userId,
      nurse_id: booking.nurseId,
      user_name: booking.userName,
      nurse_name: booking.nurseName,
      service_type: booking.serviceType,
      start_date: booking.startDate,
      end_date: booking.endDate,
      status: booking.status,
      payment_method: booking.paymentMethod,
      total_amount: booking.totalAmount,
      notes: booking.notes,
      nurse_phone: nursePhone,
      user_phone: userPhone,
    };
    const { data, error } = await supabase.from('bookings').insert(row).select().single();
    if (error || !data) {
      console.error('BookingDB.create:', error);
      return { ...booking, id: 'temp', createdAt: new Date().toISOString() } as Booking;
    }
    return mapBooking(data);
  },

  update: async (id: string, updates: Partial<Booking>): Promise<Booking | undefined> => {
    const mapped: Record<string, unknown> = {};
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.paymentStatus !== undefined) mapped.payment_status = updates.paymentStatus;
    if (updates.feedback !== undefined) mapped.feedback = updates.feedback;
    if (updates.nursePhone !== undefined) mapped.nurse_phone = updates.nursePhone;
    if (updates.notes !== undefined) mapped.notes = updates.notes;

    const { data, error } = await supabase
      .from('bookings').update(mapped).eq('id', id).select().single();
    if (error || !data) return undefined;
    return mapBooking(data);
  },
};

/* ─── SHELTER REPORT operations ─── */

export const ShelterReportDB = {
  // Now that photos are stored as URLs (not base64), the overview can safely select all columns.
  getAllOverview: async (): Promise<ShelterReport[]> => {
    const { data, error } = await supabase
      .from('shelter_reports')
      .select('*');
    if (error) return [];
    return (data || []).map(mapShelterReport);
  },

  getAll: async (): Promise<ShelterReport[]> => {
    const { data, error } = await supabase.from('shelter_reports').select('*');
    if (error) return [];
    return (data || []).map(mapShelterReport);
  },

  getByReporterId: async (userId: string): Promise<ShelterReport[]> => {
    const { data, error } = await supabase
      .from('shelter_reports').select('*').eq('reported_by', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(mapShelterReport);
  },

  getById: async (id: string): Promise<ShelterReport | undefined> => {
    const { data, error } = await supabase.from('shelter_reports').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return mapShelterReport(data);
  },

  getByShelterId: async (shelterId: string): Promise<ShelterReport[]> => {
    const { data, error } = await supabase
      .from('shelter_reports').select('*').eq('assigned_shelter_id', shelterId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(mapShelterReport);
  },

  create: async (report: Omit<ShelterReport, 'id' | 'createdAt'>): Promise<ShelterReport> => {
    // Auto-assign nearest shelter using pre-calculated nearbyShelters
    let assignedShelterId: string | undefined = report.assignedShelterId;
    if (!assignedShelterId && report.nearbyShelters && report.nearbyShelters.length > 0) {
      const closest = report.nearbyShelters[0];
      if ((closest.distanceKm ?? Infinity) <= 50) { // 50km radius
        assignedShelterId = closest.id;
      }
    }

    const row = {
      reported_by: report.reportedBy,
      reporter_name: report.reporterName,
      photo: report.photo,
      latitude: report.latitude,
      longitude: report.longitude,
      location_description: report.locationDescription,
      description: report.description,
      // Omit nearby_shelters from row as it might not be a valid DB column and causes hangs
      // nearby_shelters: report.nearbyShelters,
      status: report.status,
      assigned_shelter_id: assignedShelterId || null,
    };
    const { data, error } = await supabase.from('shelter_reports').insert(row).select().single();
    if (error || !data) {
      console.error('ShelterReportDB.create:', error);
      return { ...report, id: 'temp', createdAt: new Date().toISOString() } as ShelterReport;
    }

    // Notify shelter user if assigned (fire and forget)
    if (assignedShelterId) {
      ShelterDB.getAll().then(shelters => {
        const shelter = shelters.find(s => s.id === assignedShelterId);
        if (shelter?.shelterUserId) {
          NotificationDB.create({
            userId: shelter.shelterUserId,
            title: 'New Help Report',
            message: `New humanitarian report assigned to your shelter at ${report.locationDescription || 'a nearby location'}.`,
            type: 'warning',
          }).catch(console.error);
        }
      }).catch(console.error);
    }

    return mapShelterReport(data);
  },

  update: async (id: string, updates: Partial<ShelterReport>): Promise<ShelterReport | undefined> => {
    const mapped: Record<string, unknown> = {};
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.acceptedAt !== undefined) mapped.accepted_at = updates.acceptedAt;
    if (updates.assignedShelterId !== undefined) mapped.assigned_shelter_id = updates.assignedShelterId;

    const { data, error } = await supabase
      .from('shelter_reports').update(mapped).eq('id', id).select().single();
    if (error || !data) return undefined;
    return mapShelterReport(data);
  },
};

/* ─── SHELTER operations ─── */

export const ShelterDB = {
  getAll: async (): Promise<Shelter[]> => {
    const { data, error } = await supabase.from('shelters').select('*');
    if (error) return [];
    return (data || []).map(mapShelter);
  },

  getByUserId: async (userId: string): Promise<Shelter | undefined> => {
    const { data, error } = await supabase
      .from('shelters').select('*').eq('shelter_user_id', userId).single();
    if (error || !data) return undefined;
    return mapShelter(data);
  },

  getById: async (id: string): Promise<Shelter | undefined> => {
    const { data, error } = await supabase
      .from('shelters').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return mapShelter(data);
  },

  getByEmail: async (email: string): Promise<Shelter | undefined> => {
    const { data, error } = await supabase
      .from('shelters').select('*').ilike('email', email).single();
    if (error || !data) return undefined;
    return mapShelter(data);
  },

  create: async (shelter: Omit<Shelter, 'id'>): Promise<Shelter | undefined> => {
    const row = {
      name: shelter.name,
      address: shelter.address,
      latitude: shelter.latitude,
      longitude: shelter.longitude,
      phone: shelter.phone,
      email: shelter.email,
      capacity: shelter.capacity,
      shelter_user_id: shelter.shelterUserId || null,
    };
    const { data, error } = await supabase.from('shelters').insert(row).select().single();
    if (error || !data) { console.error('ShelterDB.create:', error); return undefined; }
    return mapShelter(data);
  },

  update: async (id: string, updates: Partial<Shelter>): Promise<Shelter | undefined> => {
    const row: Record<string, any> = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.address !== undefined) row.address = updates.address;
    if (updates.latitude !== undefined) row.latitude = updates.latitude;
    if (updates.longitude !== undefined) row.longitude = updates.longitude;
    if (updates.phone !== undefined) row.phone = updates.phone;
    if (updates.email !== undefined) row.email = updates.email;
    if (updates.capacity !== undefined) row.capacity = updates.capacity;
    if (updates.shelterUserId !== undefined) row.shelter_user_id = updates.shelterUserId;

    const { data, error } = await supabase
      .from('shelters').update(row).eq('id', id).select().single();
    if (error || !data) { console.error('ShelterDB.update:', error); return undefined; }
    return mapShelter(data);
  },

  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('shelters').delete().eq('id', id);
    if (error) { console.error('ShelterDB.delete:', error); return false; }
    return true;
  },
};


/* ─── ADMIN LOG operations ─── */

function mapAdminLog(row: Record<string, unknown>): AdminLog {
  return {
    id: row.id as string,
    adminId: row.admin_id as string,
    adminName: row.admin_name as string,
    action: row.action as string,
    target: row.target as string,
    details: row.details as string,
    createdAt: row.created_at as string,
  };
}

export const AdminLogDB = {
  getAll: async (): Promise<AdminLog[]> => {
    const { data, error } = await supabase
      .from('admin_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) return [];
    return (data || []).map(mapAdminLog);
  },

  create: async (log: Omit<AdminLog, 'id' | 'createdAt'>): Promise<void> => {
    await supabase.from('admin_logs').insert({
      admin_id: log.adminId,
      admin_name: log.adminName,
      action: log.action,
      target: log.target,
      details: log.details,
    });
  },
};

/* ─── NOTIFICATIONS operations ─── */

function mapNotification(row: Record<string, unknown>): Notification {
  // We added title and link to the DB but the UI type hasn't been updated yet.
  // We'll map them carefully.
  return {
    id: row.id as string,
    userId: row.user_id as string,
    message: row.message as string,
    type: row.type as 'info' | 'success' | 'warning' | 'error',
    read: row.read as boolean,
    createdAt: row.created_at as string,
    // @ts-ignore - extending type on the fly
    title: row.title as string,
    // @ts-ignore
    link: row.link as string | undefined,
  };
}

export const NotificationDB = {
  getByUserId: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return (data || []).map(mapNotification);
  },

  markAsRead: async (id: string): Promise<void> => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  },

  delete: async (id: string): Promise<void> => {
    await supabase.from('notifications').delete().eq('id', id);
  },

  create: async (notif: { userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', link?: string }): Promise<void> => {
    await supabase.from('notifications').insert({
      user_id: notif.userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      link: notif.link,
    });
  }
};

export function initializeDatabase(): void {
  // No-op — Supabase handles data persistence
}

export const StatsDB = {
  getOverview: async () => {
    const getCount = async (table: string, match?: Record<string, any>, filter?: (q: any) => any) => {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      if (match) {
        query = query.match(match);
      }
      if (filter) {
        query = filter(query);
      }
      const { count } = await query;
      return count || 0;
    };

    const [
      totalUsers,
      totalNurses,
      pendingVerification,
      approvedNurses,
      totalBookings,
      activeBookings,
      totalShelters,
      totalReports,
      resolvedReports,
      documentsUploaded,
      genuineDocuments,
      suspectedForgery,
    ] = await Promise.all([
      getCount('profiles', { role: 'user' }),
      getCount('nurse_profiles'),
      getCount('nurse_profiles', { verification_status: 'pending' }),
      getCount('nurse_profiles', { verification_status: 'approved' }),
      getCount('bookings'),
      getCount('bookings', { status: 'accepted' }),
      getCount('shelters'),
      getCount('shelter_reports'),
      getCount('shelter_reports', { status: 'resolved' }),
      getCount('nurse_documents'),
      // For JSON fields, we use customized query filtering via the filter callback
      // We are finding documents where ai_analysis->result is genuine or suspected_forgery
      getCount('nurse_documents', undefined, q => q.contains('ai_analysis', { result: 'genuine' })),
      getCount('nurse_documents', undefined, q => q.contains('ai_analysis', { result: 'suspected_forgery' })),
    ]);

    return {
      totalUsers,
      totalNurses,
      pendingVerification,
      approvedNurses,
      totalBookings,
      activeBookings,
      totalShelters,
      totalReports,
      activeReports: totalReports - resolvedReports,
      documentsUploaded,
      genuineDocuments,
      suspectedForgery,
    };
  }
};

