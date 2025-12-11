import * as XLSX from 'xlsx';
import { Prospect, ColumnMapping, ProcessingResult, Template } from '../types';
import { DEFAULT_TEMPLATE } from '../constants';

// Helper for local storage of template
const TEMPLATE_STORAGE_KEY = 'hf_template_local';

export const DataService = {
  
  /**
   * Parses an uploaded file (Excel/CSV) and returns the workbook object and sheet names.
   */
  async processFile(file: File): Promise<ProcessingResult<{ workbook: XLSX.WorkBook, sheets: string[] }>> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheets = workbook.SheetNames;
          
          if (!sheets || sheets.length === 0) {
            resolve({ success: false, error: "El archivo no contiene hojas visibles." });
            return;
          }

          resolve({ 
            success: true, 
            data: { workbook, sheets } 
          });
        } catch (error) {
          console.error("Error parsing file:", error);
          resolve({ success: false, error: "No pudimos leer el archivo. Asegúrate que sea un Excel válido." });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, error: "Error de lectura del archivo." });
      };

      reader.readAsBinaryString(file);
    });
  },

  /**
   * Extracts headers (first row) from a specific sheet in the workbook.
   */
  getHeaders(workbook: XLSX.WorkBook, sheetName: string): string[] {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return [];

    // Convert sheet to JSON array of arrays to get just the first row
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (json && json.length > 0) {
      // First row contains headers
      return (json[0] as string[]).map(h => String(h).trim()).filter(h => h);
    }
    return [];
  },

  /**
   * Converts the sheet data into Prospect objects based on column mapping.
   */
  getProspects(workbook: XLSX.WorkBook, sheetName: string, mapping: ColumnMapping): Prospect[] {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return [];

    // Get raw JSON data
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    return rawData.map((row, index) => {
      // Extract core fields based on mapping
      const nombre = row[mapping.nameColumn] ? String(row[mapping.nameColumn]).trim() : 'Sin Nombre';
      let telefono = row[mapping.phoneColumn] ? String(row[mapping.phoneColumn]).replace(/[^0-9]/g, '') : '';
      
      // Basic phone sanitization (example logic)
      if (telefono && !telefono.startsWith('52') && telefono.length === 10) {
        // Assume country code if missing (optional heuristic)
        // telefono = '52' + telefono; 
      }

      // Identify other potential fields for dynamic variables
      const otherFields: Record<string, string> = {};
      Object.keys(row).forEach(key => {
        if (key !== mapping.nameColumn && key !== mapping.phoneColumn) {
          otherFields[key] = String(row[key]);
        }
      });
      
      // Try to find status or company smartly if not mapped (or use raw row data)
      // This spreads all row properties so they can be used as {{variables}}
      
      return {
        id: `row-${index}`,
        nombre,
        telefono,
        // Default standard fields if they match common names in "otherFields", otherwise undefined
        ...otherFields
      };
    }).filter(p => p.telefono && p.telefono.length > 5); // Filter out rows without valid phone
  },

  // Template is now stored in LocalStorage as we don't have a backend DB
  getTemplate(): Template {
    const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return { content: saved || DEFAULT_TEMPLATE };
  },

  saveTemplate(content: string): boolean {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, content);
    return true;
  }
};