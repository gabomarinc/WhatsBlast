import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { DataService } from '../services/dataService';
import { ColumnMapping } from '../types';
import { Icons } from './Icons';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-4xl bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-secondary-100/50 animate-slide-up border border-secondary-50 relative overflow-hidden">
        
        {/* Decorative background blur */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-primary-300"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-white text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-secondary-50">
            <Icons.Settings className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-secondary-900 tracking-tight">Organiza tus datos</h2>
          <p className="text-secondary-500 mt-2 font-medium">Conecta las columnas de tu Excel con el sistema.</p>
        </div>

        <div className="space-y-8 relative z-10">
          
          {/* 1. Basic Config: Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sheet Select */}
            <div className="group">
               <label className="block text-[11px] font-black uppercase tracking-widest text-secondary-400 mb-2 pl-1">Hoja de trabajo</label>
               <div className="relative">
                 <select
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    className="w-full px-4 py-3.5 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 appearance-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all cursor-pointer hover:bg-white"
                  >
                    {availableTabs.map(tab => <option key={tab} value={tab}>{tab}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-400">
                    <Icons.ChevronDown className="w-5 h-5" />
                  </div>
               </div>
            </div>

            {/* Name Column */}
            <div className="group">
               <label className="block text-[11px] font-black uppercase tracking-widest text-secondary-400 mb-2 pl-1">Columna Nombre</label>
               <div className="relative">
                 <select 
                    value={nameCol}
                    onChange={(e) => setNameCol(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 appearance-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all cursor-pointer shadow-sm hover:border-primary-300"
                  >
                    <option value="">Seleccionar...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-400">
                    <Icons.ChevronDown className="w-5 h-5" />
                  </div>
               </div>
            </div>

            {/* Phone Column */}
            <div className="group">
               <label className="block text-[11px] font-black uppercase tracking-widest text-secondary-400 mb-2 pl-1">Columna WhatsApp</label>
               <div className="relative">
                 <select 
                    value={phoneCol}
                    onChange={(e) => setPhoneCol(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 appearance-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all cursor-pointer shadow-sm hover:border-primary-300"
                  >
                    <option value="">Seleccionar...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-400">
                     <Icons.ChevronDown className="w-5 h-5" />
                  </div>
               </div>
            </div>
          </div>

          <div className="w-full h-px bg-secondary-100"></div>

          {/* 2. Advanced Viz Config */}
          <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-5 gap-2">
                <p className="text-sm font-black uppercase tracking-wider text-secondary-600">
                  Personaliza tarjetas y filtros
                </p>
                <div className="flex items-center gap-2 text-[11px] text-secondary-500 font-medium bg-secondary-50 px-3 py-1.5 rounded-full border border-secondary-100">
                  <span>Datos a mostrar <Icons.Eye className="w-3 h-3 inline ml-0.5" /></span>
                  <span className="text-secondary-300">|</span>
                  <span>Filtros <Icons.Filter className="w-3 h-3 inline ml-0.5" /></span>
                </div>
              </div>

              {availableForExtras.length === 0 ? (
                <div className="text-center p-8 bg-secondary-50/50 rounded-2xl border border-dashed border-secondary-200 text-sm text-secondary-400">
                  No se encontraron columnas adicionales para configurar.
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableForExtras.map(h => {
                    const isVis = visibleCols.has(h);
                    const isFil = filterCols.has(h);
                    
                    return (
                      <div key={h} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-secondary-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/20 transition-all duration-300 group">
                        <div className="flex flex-col overflow-hidden mr-4">
                           <span className="text-sm font-black text-secondary-800 truncate" title={h}>{h}</span>
                           <span className="text-[10px] text-secondary-400 font-medium truncate">Columna Original</span>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          {/* Visible Toggle */}
                          <button 
                            onClick={() => toggleVisible(h)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                              isVis 
                                ? 'bg-primary-500 text-white shadow-md shadow-primary-200 transform scale-105' 
                                : 'bg-secondary-50 text-secondary-300 hover:text-primary-500 hover:bg-primary-50 border border-secondary-200'
                            }`}
                            title="Mostrar en tarjeta"
                          >
                             {isVis ? <Icons.Eye className="w-5 h-5" /> : <Icons.EyeOff className="w-5 h-5" />}
                          </button>
                          
                          {/* Filter Toggle */}
                          <button 
                             onClick={() => toggleFilter(h)}
                             className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                               isFil 
                                 ? 'bg-secondary-800 text-white shadow-md shadow-secondary-200 transform scale-105' 
                                 : 'bg-secondary-50 text-secondary-300 hover:text-secondary-800 hover:bg-secondary-100 border border-secondary-200'
                             }`}
                             title="Usar como filtro"
                          >
                            <Icons.Filter className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          <div className="pt-4">
            <Button 
                className="w-full text-lg font-black h-14"
                disabled={!nameCol || !phoneCol}
                isLoading={isLoading}
                onClick={handleConfirm}
            >
                Continuar al Dashboard
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};