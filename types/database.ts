export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'citizen' | 'responder' | 'admin';
export type EmergencyStatus = 'pending' | 'accepted' | 'dispatched' | 'on_scene' | 'resolved' | 'cancelled';
export type EmergencyType = 'fire' | 'medical' | 'police' | 'accident';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: string;
          department: string | null;
          avatar_url: string | null;
          is_online: boolean | null;
          last_seen: string | null;
          created_at: string;
          updated_at: string;
          date_of_birth: string | null;
          gender: string | null;
          blood_type: string | null;
          allergies: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: string;
          avatar_url?: string | null;
          is_online?: boolean | null;
          last_seen?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          blood_type?: string | null;
          allergies?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_online?: boolean | null;
          last_seen?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          blood_type?: string | null;
          allergies?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
        };
      };
      emergencies: {
        Row: {
          id: string;
          citizen_id: string;
          responder_id: string | null;
          emergency_type: EmergencyType;
          description: string | null;
          status: EmergencyStatus;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          photo_url: string | null;
          priority: number;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          citizen_id: string;
          responder_id?: string | null;
          emergency_type: EmergencyType;
          description?: string | null;
          status?: EmergencyStatus;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          photo_url?: string | null;
          priority?: number;
        };
        Update: {
          responder_id?: string | null;
          status?: EmergencyStatus;
          description?: string | null;
          resolved_at?: string | null;
        };
      };
      emergency_messages: {
        Row: {
          id: string;
          emergency_id: string;
          sender_id: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          emergency_id: string;
          sender_id: string;
          message: string;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
      tracking_logs: {
        Row: {
          id: string;
          emergency_id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          created_at: string;
        };
        Insert: {
          emergency_id: string;
          user_id: string;
          latitude: number;
          longitude: number;
        };
        Update: {};
      };
      first_aid_guides: {
        Row: {
          id: string;
          title: string;
          category: string;
          content: string;
          image_url: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          title: string;
          category: string;
          content: string;
          image_url?: string | null;
          display_order?: number;
        };
        Update: {
          title?: string;
          category?: string;
          content?: string;
          image_url?: string | null;
          display_order?: number;
        };
      };
      emergency_contacts: {
        Row: {
          id: string;
          name: string;
          role: string;
          phone_number: string;
          email: string | null;
          department: string | null;
          is_primary: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          name: string;
          role: string;
          phone_number: string;
          email?: string | null;
          department?: string | null;
          is_primary?: boolean;
          display_order?: number;
        };
        Update: {
          name?: string;
          role?: string;
          phone_number?: string;
          email?: string | null;
          department?: string | null;
          is_primary?: boolean;
          display_order?: number;
        };
      };
      incidents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          severity: string;
          status: string;
          incident_type: string;
          incident_date: string;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description: string;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          severity?: string;
          status?: string;
          incident_type: string;
          incident_date?: string;
          photo_url?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          location?: string | null;
          severity?: string;
          status?: string;
          photo_url?: string | null;
        };
      };
      hazards: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          risk_level: string;
          status: string;
          hazard_category: string;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description: string;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          risk_level?: string;
          status?: string;
          hazard_category: string;
          photo_url?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          location?: string | null;
          risk_level?: string;
          status?: string;
          photo_url?: string | null;
        };
      };
      checklists: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          is_template: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          category: string;
          is_template?: boolean;
          created_by?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          checklist_id: string;
          question: string;
          order_index: number;
          is_required: boolean;
          created_at: string;
        };
        Insert: {
          checklist_id: string;
          question: string;
          order_index?: number;
          is_required?: boolean;
        };
        Update: {
          question?: string;
          order_index?: number;
          is_required?: boolean;
        };
      };
      checklist_responses: {
        Row: {
          id: string;
          checklist_id: string;
          item_id: string;
          user_id: string;
          response: boolean | null;
          notes: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          checklist_id: string;
          item_id: string;
          user_id: string;
          response?: boolean | null;
          notes?: string | null;
          photo_url?: string | null;
        };
        Update: {
          response?: boolean | null;
          notes?: string | null;
          photo_url?: string | null;
        };
      };
      checklist_audits: {
        Row: {
          id: string;
          checklist_id: string;
          user_id: string;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          score: number;
          total_items: number;
          status: string;
          notes: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          checklist_id: string;
          user_id: string;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          score?: number;
          total_items?: number;
          status?: string;
          notes?: string | null;
        };
        Update: {
          score?: number;
          total_items?: number;
          status?: string;
          notes?: string | null;
          completed_at?: string | null;
        };
      };
      training_modules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          content_url: string | null;
          duration_minutes: number;
          is_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          category: string;
          content_url?: string | null;
          duration_minutes?: number;
          is_required?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string;
          content_url?: string | null;
          duration_minutes?: number;
          is_required?: boolean;
        };
      };
      user_training_progress: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          status: string;
          progress_percent: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          module_id: string;
          status?: string;
          progress_percent?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          status?: string;
          progress_percent?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      safety_metrics: {
        Row: {
          id: string;
          metric_date: string;
          total_incidents: number;
          total_hazards: number;
          hazards_resolved: number;
          audits_completed: number;
          training_completed: number;
          created_at: string;
        };
        Insert: {
          metric_date: string;
          total_incidents?: number;
          total_hazards?: number;
          hazards_resolved?: number;
          audits_completed?: number;
          training_completed?: number;
        };
        Update: {
          total_incidents?: number;
          total_hazards?: number;
          hazards_resolved?: number;
          audits_completed?: number;
          training_completed?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Emergency = Database['public']['Tables']['emergencies']['Row'];
export type EmergencyMessage = Database['public']['Tables']['emergency_messages']['Row'];
export type TrackingLog = Database['public']['Tables']['tracking_logs']['Row'];
export type FirstAidGuide = Database['public']['Tables']['first_aid_guides']['Row'];
export type EmergencyContact = Database['public']['Tables']['emergency_contacts']['Row'];
export type Incident = Database['public']['Tables']['incidents']['Row'];
export type Hazard = Database['public']['Tables']['hazards']['Row'];
export type Checklist = Database['public']['Tables']['checklists']['Row'];
export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
export type ChecklistAudit = Database['public']['Tables']['checklist_audits']['Row'];
export type TrainingModule = Database['public']['Tables']['training_modules']['Row'];
export type UserTrainingProgress = Database['public']['Tables']['user_training_progress']['Row'];
