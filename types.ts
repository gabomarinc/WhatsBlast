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
  // Optional columns
  lastNameColumn?: string;
  companyColumn?: string;
}

export interface AppState {
  step: 'connect' | 'configure' | 'dashboard';
  isLoading: boolean;
  workbook: any | null; // Stores the parsed Excel workbook
  sheetTabs: string[]; // List of tab names available
  selectedTab: string;
  mapping: ColumnMapping;
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