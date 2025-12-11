import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { DataService } from '../services/dataService';
import { ColumnMapping } from '../types';

interface ConfigurationScreenProps {
  sheetId: string;
  availableTabs: string[];
  onConfirm: (tabName: string, mapping: ColumnMapping) => void;
  isLoading: boolean;
}

export const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({ 
  sheetId, 
  availableTabs, 
  onConfirm,
  isLoading 
}) => {
  const [selectedTab, setSelectedTab] = useState(availableTabs[0] || '');
  const [headers, setHeaders] = useState<string[]>([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  
  // Mapping State
  const [nameCol, setNameCol] = useState('');
  const [phoneCol, setPhoneCol] = useState('');
  
  // Fetch headers when tab changes
  useEffect(() => {
    if (!selectedTab) return;
    
    const fetchHeaders = async () => {
      setLoadingHeaders(true);
      const res = await DataService.getSheetHeaders(sheetId, selectedTab);
      if (res.success && res.data) {
        setHeaders(res.data);
        autoDetectColumns(res.data);
      }
      setLoadingHeaders(false);
    };

    fetchHeaders();
  }, [selectedTab, sheetId]);

  // Logic to guess columns
  const autoDetectColumns = (cols: string[]) => {
    const lowerCols = cols.map(c => c.toLowerCase());
    
    // Guess Name
    const nameIndex = lowerCols.findIndex(c => 
      c.includes('nombre') || c.includes('name') || c.includes('cliente') || c.includes('lead')
    );
    if (nameIndex >= 0) setNameCol(cols[nameIndex]);

    // Guess Phone
    const phoneIndex = lowerCols.findIndex(c => 
      c.includes('tel') || c.includes('cel') || c.includes('phone') || c.includes('whatsapp') || c.includes('movil')
    );
    if (phoneIndex >= 0) setPhoneCol(cols[phoneIndex]);
  };

  const handleConfirm = () => {
    if (!nameCol || !phoneCol) return;
    onConfirm(selectedTab, {
      nameColumn: nameCol,
      phoneColumn: phoneCol
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 animate-slide-up border border-white/50 backdrop-blur-sm">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚙️
          </div>
          <h2 className="text-xl font-semibold text-calm-800">Configura tus datos</h2>
          <p className="text-calm-500 text-sm mt-1">
            Ayúdanos a entender tu hoja de cálculo.
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Tab Selector */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-calm-500 mb-2">
              1. Selecciona la pestaña (hoja)
            </label>
            <div className="relative">
              <select
                value={selectedTab}
                onChange={(e) => setSelectedTab(e.target.value)}
                className="w-full appearance-none px-4 py-3 bg-calm-50 border border-calm-200 rounded-xl focus:ring-2 focus:ring-primary-100 outline-none text-calm-800"
              >
                {availableTabs.map(tab => (
                  <option key={tab} value={tab}>{tab}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-calm-400">
                ▼
              </div>
            </div>
          </div>

          {loadingHeaders ? (
            <div className="py-8 text-center text-calm-400 text-sm animate-pulse">
              Leyendo columnas...
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs font-medium uppercase tracking-wider text-calm-500">
                2. Indica qué columnas usar
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Mapping */}
                <div className="bg-calm-50 p-4 rounded-xl border border-calm-100">
                  <label className="block text-xs text-calm-500 mb-1">Nombre del Prospecto</label>
                  <select 
                    value={nameCol}
                    onChange={(e) => setNameCol(e.target.value)}
                    className="w-full bg-white border border-calm-200 rounded-lg p-2 text-sm text-calm-800 focus:border-primary-500 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Phone Mapping */}
                <div className="bg-calm-50 p-4 rounded-xl border border-calm-100">
                  <label className="block text-xs text-calm-500 mb-1">Número de WhatsApp</label>
                  <select 
                    value={phoneCol}
                    onChange={(e) => setPhoneCol(e.target.value)}
                    className="w-full bg-white border border-calm-200 rounded-lg p-2 text-sm text-calm-800 focus:border-primary-500 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {!nameCol || !phoneCol ? (
                <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-600 rounded-lg text-xs mt-2">
                  <span>⚠️</span>
                  Selecciona las columnas de Nombre y Teléfono para continuar.
                </div>
              ) : (
                 <div className="flex items-center gap-2 p-3 bg-success-50 text-success-600 rounded-lg text-xs mt-2">
                  <span>✅</span>
                  ¡Todo listo! Usaremos estas columnas.
                </div>
              )}
            </div>
          )}

          <Button 
            className="w-full mt-4"
            disabled={!nameCol || !phoneCol || loadingHeaders}
            isLoading={isLoading}
            onClick={handleConfirm}
          >
            Confirmar y Cargar
          </Button>

        </div>
      </div>
    </div>
  );
};