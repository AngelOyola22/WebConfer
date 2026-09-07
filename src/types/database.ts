export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface Registration {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  age: number;
  email: string;
  phone: string;
  payment_proof_url: string;
  status: RegistrationStatus;
  notes?: string;
}

export interface Contact {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  source?: string;
  tags?: string[];
}

export interface Database {
  public: {
    Tables: {
      registrations: {
        Row: Registration;
        Insert: Omit<Registration, 'id' | 'created_at'>;
        Update: Partial<Omit<Registration, 'id' | 'created_at'>>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'id' | 'created_at'>;
        Update: Partial<Omit<Contact, 'id' | 'created_at'>>;
      };
    };
  };
}
