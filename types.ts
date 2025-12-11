export interface Prospect {
  id: string;
  nombre: string;
  apellido?: string;
  telefono: string;
  empresa?: string;
  estado?: string;
  [key: string]: string | undefined; // For dynamic custom columns
}

export interface SheetConfig {
  sheetId: string;
  sheetName: string;
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
  sheetId: string;
  sheetTabs: string[]; // List of tab names available
  selectedTab: string;
  mapping: ColumnMapping;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

// Represents the response from the backend
export interface BackendResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Global definition for Google Apps Script interaction
declare global {
  interface Window {
    google?: {
      script: {
        run: {
          withSuccessHandler: (callback: (response: any, userObject?: any) => void) => {
            withFailureHandler: (callback: (error: Error, userObject?: any) => void) => {
              [key: string]: (arg?: any) => void;
            };
          };
        };
      };
    };
  }
}