export type Language = 'en' | 'hi' | 'mr' | 'pa' | 'gu';

export interface Farmer {
  id: string;
  user_id?: string;
  full_name: string;
  mobile_number: string;
  village: string;
  district: string;
  state: string;
  land_plot_id: string;
  preferred_language: Language;
  created_at: string;
}

export interface ContactSubmission {
  id?: string;
  farmer_name: string;
  mobile_number: string;
  message_type: 'Query' | 'Suggestion' | 'Grievance';
  message: string;
  synced_to_sheet: boolean;
  created_at?: string;
}

export type AuthMode = 'login' | 'register';
export type UserRole = 'farmer' | 'mandi';
export type LoginStep = 'mobile' | 'otp';
export type RegisterStep = 'details' | 'otp' | 'language';

export interface ChatResponsePayload {
  success: boolean;
  answer?: string;
  message?: string;
  grounded?: boolean;
  source?: string;
  commodityData?: {
    commodity: string;
    market: string;
    modalPrice: number;
    minPrice?: number;
    maxPrice?: number;
    arrivalDate?: string;
    arrivalQuantity?: number;
  }[];
}

export type SlotStatus = 'waiting' | 'active' | 'completed' | 'no-show' | 'cancelled' | 'waitlisted';

export interface Mandi {
  id: string;
  name: string;
  code: string;
  license_no?: string;
  district: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  slot_capacity: number;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  distance_km?: number;
  created_at?: string;
}

export interface SlotBooking {
  id: string;
  token_number: string;
  mandi_id: string;
  mandi_name: string;
  farmer_id?: string;
  farmer_name: string;
  farmer_phone: string;
  crop_name: string;
  quantity_quintals: number;
  vehicle_number?: string;
  booking_date: string; // YYYY-MM-DD
  slot_start_time: string; // HH:MM
  slot_end_time: string; // HH:MM (30 min window)
  status: SlotStatus;
  waitlist_position?: number;
  cancellation_reason?: string;
  cancelled_at?: string;
  is_walkin: boolean;
  arrival_time?: string;
  completion_time?: string;
  delay_minutes?: number;
  created_at: string;
}

export interface FarmerDelay {
  id: string;
  booking_id?: string;
  farmer_phone: string;
  farmer_name: string;
  mandi_id: string;
  mandi_name: string;
  delay_type: 'late_arrival' | 'no_show' | 'cancellation_late';
  delay_minutes: number;
  penalty_points: number;
  reason?: string;
  reported_by?: string;
  created_at: string;
}

export interface MandiSession {
  mandi: Mandi;
  loggedInAt: string;
}

export interface MandiRegistrationInput {
  name: string;
  code: string;
  license_no?: string;
  district: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  password?: string;
  slot_capacity: number;
  opening_time: string;
  closing_time: string;
}

