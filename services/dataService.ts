import { Prospect, Template, BackendResponse, ColumnMapping } from '../types';
import { MOCK_PROSPECTS, DEFAULT_TEMPLATE } from '../constants';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to wrap google.script.run in a Promise
 */
const runBackend = <T>(functionName: string, ...args: any[]): Promise<BackendResponse<T>> => {
  return new Promise((resolve) => {
    if (!window.google?.script) {
      // Logic for LOCAL DEV ENVIRONMENT (Mock)
      console.warn(`[DEV MODE] Calling mocked backend function: ${functionName}`);
      resolve({ success: false, error: "ENV_LOCAL" }); 
      return;
    }

    window.google.script.run
      .withSuccessHandler((response: any) => {
        resolve(response as BackendResponse<T>);
      })
      .withFailureHandler((error: Error) => {
        resolve({ success: false, error: error.message });
      })
      [functionName](...args);
  });
};

export const DataService = {
  
  // 1. Validate ID and get available Tabs
  async getSheetTabs(sheetId: string): Promise<BackendResponse<string[]>> {
    const result = await runBackend<string[]>('getSheetTabs', sheetId);
    
    if (result.error === "ENV_LOCAL") {
      await delay(800);
      if (sheetId.length < 5) return { success: false, error: "ID Inválido (Demo)" };
      return { success: true, data: ['Prospectos', 'Leads Marzo', 'Clientes'] };
    }
    return result;
  },

  // 2. Get headers for a specific tab to let user map columns
  async getSheetHeaders(sheetId: string, tabName: string): Promise<BackendResponse<string[]>> {
    const result = await runBackend<string[]>('getSheetHeaders', sheetId, tabName);

    if (result.error === "ENV_LOCAL") {
      await delay(600);
      // Return mock headers
      return { success: true, data: ['Nombre Completo', 'WhatsApp', 'Empresa', 'Estado', 'Notas'] };
    }
    return result;
  },

  // 3. Get Prospects using the specific configuration
  async getProspects(sheetId: string, tabName: string, mapping: ColumnMapping): Promise<BackendResponse<Prospect[]>> {
    const result = await runBackend<Prospect[]>('getProspects', sheetId, tabName, mapping);

    if (result.error === "ENV_LOCAL") {
      await delay(1000);
      return { success: true, data: MOCK_PROSPECTS };
    }

    return result;
  },

  async getTemplate(): Promise<BackendResponse<Template>> {
    const result = await runBackend<Template>('getTemplate');

    if (result.error === "ENV_LOCAL") {
      await delay(500);
      const saved = localStorage.getItem('hf_template');
      return { success: true, data: { content: saved || DEFAULT_TEMPLATE } };
    }

    return result;
  },

  async saveTemplate(content: string): Promise<BackendResponse<boolean>> {
    const result = await runBackend<boolean>('saveTemplate', content);

    if (result.error === "ENV_LOCAL") {
      await delay(600);
      localStorage.setItem('hf_template', content);
      return { success: true, data: true };
    }

    return result;
  }
};