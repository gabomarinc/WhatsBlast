import React from 'react';
import { Prospect } from '../types';
import { Button } from './Button';

interface ProspectCardProps {
  prospect: Prospect;
  onSend: (prospect: Prospect) => void;
  isSentInSession?: boolean;
}

export const ProspectCard: React.FC<ProspectCardProps> = ({ prospect, onSend, isSentInSession = false }) => {
  // Determine status color
  const status = prospect.estado?.toLowerCase() || 'nuevo';
  let statusColor = 'bg-calm-100 text-calm-600';
  
  if (isSentInSession) {
      statusColor = 'bg-success-100 text-success-600';
  } else if (status.includes('contactado')) {
      statusColor = 'bg-blue-100 text-blue-600';
  } else if (status.includes('pendiente')) {
      statusColor = 'bg-yellow-100 text-yellow-600';
  } else if (status.includes('éxito') || status.includes('cliente')) {
      statusColor = 'bg-green-100 text-green-600';
  }

  const isDone = isSentInSession || status.includes('contactado') || status.includes('éxito');

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all duration-300 flex flex-col justify-between group ${isDone ? 'border-success-100 opacity-90' : 'border-calm-100 hover:shadow-md'}`}>
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${isDone ? 'bg-success-100 text-success-600' : 'bg-gradient-to-tr from-primary-100 to-indigo-100 text-primary-600'}`}>
            {isDone ? '✓' : prospect.nombre.charAt(0)}
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full transition-colors ${statusColor}`}>
            {isSentInSession ? 'Enviado Reciente' : (prospect.estado || 'Nuevo')}
          </span>
        </div>
        
        <h3 className={`font-semibold text-lg transition-colors ${isDone ? 'text-calm-500 line-through decoration-calm-300' : 'text-calm-800'}`}>
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
          variant={isDone ? "ghost" : "outline"} 
          onClick={() => onSend(prospect)} 
          className={`w-full !py-2 !text-xs transition-all ${isDone ? 'bg-calm-50 text-calm-400 hover:bg-calm-100 cursor-default' : 'group-hover:bg-primary-600 group-hover:text-white group-hover:border-transparent'}`}
        >
          <span className="flex items-center gap-2">
            {isDone ? (
                <>
                <span>Reenviar Mensaje</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </>
            ) : (
                <>
                <span>Enviar Mensaje</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
            )}
          </span>
        </Button>
      </div>
    </div>
  );
};