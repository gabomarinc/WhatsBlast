import React, { useState, useEffect } from 'react';
import { User, UploadRecord } from '../types';
import { NeonService } from '../services/neon';

interface CampaignsDashboardProps {
  currentUser: User | null;
  onResumeSession: (uploadId: number) => void;
}

export const CampaignsDashboard: React.FC<CampaignsDashboardProps> = ({ 
  currentUser, 
  onResumeSession 
}) => {
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser && NeonService.isConnected()) {
        setIsLoading(true);
        NeonService.getUserUploads(currentUser.email)
            .then(data => setHistory(data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  if (!currentUser || !NeonService.isConnected()) {
      return (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-secondary-200">
              <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center text-3xl mb-4">⚠️</div>
              <p className="font-black text-xl text-secondary-600">Modo Local</p>
              <p className="text-sm text-secondary-400 mt-2 font-medium max-w-xs text-center">
                  El historial de campañas solo está disponible si inicias sesión y te conectas a la base de datos.
              </p>
          </div>
      );
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-secondary-800 tracking-tight">Tus Campañas</h2>
        <p className="text-secondary-500 font-medium mt-1">
          Retoma el contacto donde lo dejaste en tus cargas anteriores.
        </p>
      </div>

      {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-secondary-50 rounded-2xl animate-pulse"></div>
              ))}
          </div>
      ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-secondary-200">
              <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center text-3xl mb-4">📭</div>
              <p className="font-black text-xl text-secondary-600">No hay campañas aún</p>
              <p className="text-sm text-secondary-400 mt-2 font-medium max-w-xs text-center">
                  Sube tu primer archivo Excel para empezar a ver tus resultados aquí.
              </p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((record) => {
                  const percent = record.total_prospects ? Math.round((record.contacted_count || 0) / record.total_prospects * 100) : 0;
                  
                  return (
                      <div key={record.id} className="bg-white border border-secondary-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                          <div className="flex justify-between items-start mb-4">
                              <div className="min-w-0 pr-4">
                                  <h3 className="font-black text-secondary-800 text-lg truncate group-hover:text-primary-600 transition-colors" title={record.filename}>
                                      {record.filename}
                                  </h3>
                                  <p className="text-xs font-bold text-secondary-400 mt-1">
                                      {new Date(record.created_at).toLocaleDateString()}
                                  </p>
                              </div>
                              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                                  <svg className="w-14 h-14 transform -rotate-90">
                                      <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-secondary-50" />
                                      <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (percent * 1.5)} className="text-primary-500 transition-all duration-1000" />
                                  </svg>
                                  <span className="absolute text-xs font-black text-secondary-700">{percent}%</span>
                              </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-6">
                              <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  <span className="text-xs font-bold text-secondary-600">{record.contacted_count} Contactados</span>
                              </div>
                              <div className="text-xs font-medium text-secondary-400">
                                  de {record.total_prospects}
                              </div>
                          </div>

                          <button 
                              onClick={() => onResumeSession(record.id)}
                              className="w-full mt-5 py-2.5 bg-secondary-50 hover:bg-primary-50 text-secondary-600 hover:text-primary-700 rounded-xl font-bold text-sm transition-colors"
                          >
                              Retomar Campaña
                          </button>
                      </div>
                  );
              })}
          </div>
      )}
    </div>
  );
};
