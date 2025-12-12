
export interface User {
  id?: string; // UUID from external DB
  email: string;
  name?: string;
  logo_url?: string;
  plan?: string;
  role?: string;
  company_name?: string;
  created_at?: string;
  last_seen?: string;
}

export interface Prospect {
  id: string;
  nombre: string;
  apellido?: string;
  telefono: string;
  empresa?: string;
  estado?: string;
  [key: string]: string | undefined; // For dynamic custom columns
}

export interface Template {
  content: string;
}

export interface ColumnMapping {
  nameColumn: string;
  phoneColumn: string;
  // New configuration arrays
  visibleColumns: string[];   // Columns to show on the card
  filterableColumns: string[]; // Columns to create filters for
}

export interface AppState {
  step: 'connect' | 'configure' | 'dashboard';
  isLoading: boolean;
  workbook: any | null; 
  sheetTabs: string[]; 
  selectedTab: string;
  mapping: ColumnMapping;
  // Active filters state
  activeFilters: Record<string, string>;
  // User Identity
  currentUser: User | null;
  currentFilename?: string; // Track filename for DB
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface ProcessingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}