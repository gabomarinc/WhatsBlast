import React from 'react';
import { Prospect } from '../types';
import { Button } from './Button';

interface ProspectCardProps {
  prospect: Prospect;
  onSend: (prospect: Prospect) => void;
}

export const ProspectCard: React.FC<ProspectCardProps> = ({ prospect, onSend }) => {
  // Determine status color
  const status = prospect.estado?.toLowerCase() || 'nuevo';
  let statusColor = 'bg-calm-100 text-calm-600';
  if (status.includes('contactado')) statusColor = 'bg-blue-100 text-blue-600';
  if (status.includes('pendiente')) statusColor = 'bg-yellow-100 text-yellow-600';
  if (status.includes('éxito') || status.includes('cliente')) statusColor = 'bg-green-100 text-green-600';

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-calm-100 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-100 to-indigo-100 flex items-center justify-center text-primary-600 font-bold text-lg">
            {prospect.nombre.charAt(0)}
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${statusColor}`}>
            {prospect.estado || 'Nuevo'}
          </span>
        </div>
        
        <h3 className="font-semibold text-calm-800 text-lg">
          {prospect.nombre} {prospect.apellido}
        </h3>
        
        {prospect.empresa && (
          <p className="text-sm text-calm-500 mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            {prospect.empresa}
          </p>
        )}
        
        <p className="text-xs text-calm-400 font-mono mt-2 tracking-wide">
          {prospect.telefono}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-calm-50">
        <Button 
          variant="outline" 
          onClick={() => onSend(prospect)} 
          className="w-full !py-2 !text-xs group-hover:bg-primary-600 group-hover:text-white group-hover:border-transparent transition-all"
        >
          <span className="flex items-center gap-2">
            Enviar Mensaje
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </span>
        </Button>
      </div>
    </div>
  );
};