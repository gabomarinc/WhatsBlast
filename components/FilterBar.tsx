import React, { useMemo } from 'react';
import { Prospect } from '../types';

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
    <div className="bg-white p-4 rounded-2xl border border-calm-200 mb-6 shadow-sm animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🌪️</span>
        <h3 className="text-sm font-black text-calm-700 tracking-wide">Filtrar Prospectos</h3>
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="ml-auto text-xs text-red-500 hover:text-red-600 font-bold hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {columns.map(col => (
          <div key={col} className="relative group">
            <select
              value={activeFilters[col] || ''}
              onChange={(e) => onFilterChange(col, e.target.value)}
              className={`
                appearance-none pl-3 pr-8 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary-100
                ${activeFilters[col] 
                  ? 'bg-primary-50 border-primary-200 text-primary-700' 
                  : 'bg-calm-50 border-calm-200 text-calm-600 hover:border-calm-300'}
              `}
            >
              <option value="">{col}: Todos</option>
              {filterOptions[col]?.map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};