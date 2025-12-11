import React, { useMemo } from 'react';
import { Prospect } from '../types';
import { Icons } from './Icons';

interface FilterBarProps {
  columns: string[];
  prospects: Prospect[];
  activeFilters: Record<string, string>;
  onFilterChange: (column: string, value: string) => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  columns, 
  prospects, 
  activeFilters, 
  onFilterChange,
  onClearFilters
}) => {
  
  // Calculate unique values for each filterable column
  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    
    columns.forEach(col => {
      // Get all values, trim whitespace, filter empty
      const values = prospects
        .map(p => p[col])
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
        .map(v => String(v));
      
      // Unique values sorted
      options[col] = (Array.from(new Set(values)) as string[]).sort();
    });
    
    return options;
  }, [columns, prospects]);

  if (columns.length === 0) return null;

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="mb-8 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Icons.Filter className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-calm-800 tracking-wide uppercase">Filtros Activos</h3>
        </div>
        
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Limpiar todo</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {columns.map(col => {
            const isActive = !!activeFilters[col];
            
            return (
              <div key={col} className="relative group">
                <div className={`
                    flex items-center h-10 rounded-xl border transition-all duration-200 overflow-hidden relative
                    ${isActive 
                        ? 'bg-primary-50 border-primary-200 shadow-sm' 
                        : 'bg-white border-calm-200 hover:border-calm-300'
                    }
                `}>
                    <div className={`px-3 py-2 text-xs font-black uppercase tracking-wider border-r ${isActive ? 'text-primary-700 border-primary-100' : 'text-calm-500 border-calm-100'}`}>
                        {col}
                    </div>
                    <select
                      value={activeFilters[col] || ''}
                      onChange={(e) => onFilterChange(col, e.target.value)}
                      className={`
                        appearance-none pl-3 pr-9 py-2 text-xs font-bold bg-transparent outline-none cursor-pointer min-w-[120px]
                        ${isActive ? 'text-primary-800' : 'text-calm-700'}
                      `}
                    >
                      <option value="">Todos</option>
                      {filterOptions[col]?.map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                    
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-calm-400">
                      <Icons.ChevronDown className="w-3.5 h-3.5" />
                    </div>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};