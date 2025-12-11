import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { DataService } from '../services/dataService';
import { ColumnMapping } from '../types';

interface ConfigurationScreenProps {
  workbook: any;
  availableTabs: string[];
  onConfirm: (tabName: string, mapping: ColumnMapping) => void;
  isLoading: boolean;
}

export const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({ 
  workbook,
  availableTabs, 
  onConfirm,
  isLoading 
}) => {
  const [selectedTab, setSelectedTab] = useState(availableTabs[0] || '');
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Mandatory Mapping
  const [nameCol, setNameCol] = useState('');
  const [phoneCol, setPhoneCol] = useState('');

  // Optional Mapping (Sets of column names)
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set());
  const [filterCols, setFilterCols] = useState<Set<string>>(new Set());
  
  // Extract headers when tab changes
  useEffect(() => {
    if (!selectedTab || !workbook) return;
    
    const extractedHeaders = DataService.getHeaders(workbook, selectedTab);
    setHeaders(extractedHeaders);
    autoDetectColumns(extractedHeaders);
    
    // Reset optionals
    setVisibleCols(new Set());
    setFilterCols(new Set());

  }, [selectedTab, workbook]);

  // Logic to guess columns
  const autoDetectColumns = (cols: string[]) => {
    const lowerCols = cols.map(c => c.toLowerCase());
    
    setNameCol('');
    setPhoneCol('');

    const nameIndex = lowerCols.findIndex(c => 
      c.includes('nombre') || c.includes('name') || c.includes('cliente')
    );
    if (nameIndex >= 0) setNameCol(cols[nameIndex]);

    const phoneIndex = lowerCols.findIndex(c => 
      c.includes('tel') || c.includes('cel') || c.includes('phone') || c.includes('whatsapp')
    );
    if (phoneIndex >= 0) setPhoneCol(cols[phoneIndex]);
  };

  const toggleVisible = (col: string) => {
    const next = new Set(visibleCols);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setVisibleCols(next);
  };

  const toggleFilter = (col: string) => {
    const next = new Set(filterCols);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setFilterCols(next);
  };

  const handleConfirm = () => {
    if (!nameCol || !phoneCol) return;
    onConfirm(selectedTab, {
      nameColumn: nameCol,
      phoneColumn: phoneCol,
      visibleColumns: Array.from(visibleCols),
      filterableColumns: Array.from(filterCols)
    });
  };

  // Get headers that are NOT selected as name or phone
  const availableForExtras = headers.filter(h => h !== nameCol && h !== phoneCol);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 animate-slide-up border border-white/50 backdrop-blur-sm">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">
            ⚙️
          </div>
          <h2 className="text-2xl font-black text-calm-800">Organiza tus datos</h2>
        </div>

        <div className="space-y-6">
          
          {/* 1. Basic Config */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-calm-100">
            <div className="md:col-span-1">
               <label className="block text-xs font-black uppercase tracking-wider text-calm-500 mb-2">Hoja</label>
               <select
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(e.target.value)}
                  className="w-full px-3 py-2 bg-calm-50 border border-calm-200 rounded-lg text-sm font-medium"
                >
                  {availableTabs.map(tab => <option key={tab} value={tab}>{tab}</option>)}
                </select>
            </div>
            <div>
               <label className="block text-xs font-black uppercase tracking-wider text-calm-500 mb-2">Columna Nombre</label>
               <select 
                  value={nameCol}
                  onChange={(e) => setNameCol(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-calm-200 rounded-lg text-sm font-medium focus:border-primary-500 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
            </div>
            <div>
               <label className="block text-xs font-black uppercase tracking-wider text-calm-500 mb-2">Columna WhatsApp</label>
               <select 
                  value={phoneCol}
                  onChange={(e) => setPhoneCol(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-calm-200 rounded-lg text-sm font-medium focus:border-primary-500 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
            </div>
          </div>

          {/* 2. Advanced Viz Config */}
          <div className="animate-fade-in">
              <div className="flex justify-between items-end mb-3">
                <p className="text-xs font-black uppercase tracking-wider text-calm-500">
                  Personaliza tarjetas y filtros
                </p>
                <p className="text-[10px] text-calm-400 font-medium">
                  Selecciona qué datos ver (👁️) y cuáles filtrar (🌪️)
                </p>
              </div>

              {availableForExtras.length === 0 ? (
                <div className="text-center p-4 bg-calm-50 rounded-xl text-sm text-calm-400">
                  No hay columnas adicionales disponibles.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableForExtras.map(h => (
                    <div key={h} className="flex items-center justify-between p-3 bg-calm-50 rounded-xl border border-calm-100 hover:border-calm-200 transition-colors">
                      <span className="text-sm font-bold text-calm-700 truncate max-w-[120px]" title={h}>{h}</span>
                      <div className="flex gap-2">
                        {/* Visible Toggle */}
                        <button 
                          onClick={() => toggleVisible(h)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${visibleCols.has(h) ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'bg-white text-calm-300 hover:bg-calm-100'}`}
                          title="Mostrar en tarjeta"
                        >
                          👁️
                        </button>
                        {/* Filter Toggle */}
                        <button 
                           onClick={() => toggleFilter(h)}
                           className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${filterCols.has(h) ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'bg-white text-calm-300 hover:bg-calm-100'}`}
                           title="Usar como filtro"
                        >
                          🌪️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          <Button 
            className="w-full font-bold"
            disabled={!nameCol || !phoneCol}
            isLoading={isLoading}
            onClick={handleConfirm}
          >
            Continuar al Dashboard
          </Button>

        </div>
      </div>
    </div>
  );
};