import React from 'react';

interface DashboardStatsProps {
  total: number;
  pending: number;
  sentSession: number;
  contactedTotal: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  total, 
  pending, 
  sentSession,
  contactedTotal
}) => {
  
  // Calculate progress percentage
  const progress = total > 0 ? Math.round((contactedTotal / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-up">
      
      {/* Card 1: Total & Progress */}
      <div className="bg-white p-5 rounded-2xl border border-calm-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="text-4xl">📂</span>
        </div>
        <div>
          <p className="text-xs font-medium text-calm-500 uppercase tracking-wider">Base de Datos</p>
          <h3 className="text-2xl font-bold text-calm-800 mt-1">{total} <span className="text-sm font-normal text-calm-400">registros</span></h3>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1 text-calm-500">
            <span>Progreso Total</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-calm-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Card 2: Pending Action */}
      <div className="bg-white p-5 rounded-2xl border border-calm-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="text-4xl">⏳</span>
        </div>
        <div>
          <p className="text-xs font-medium text-calm-500 uppercase tracking-wider">Por Contactar</p>
          <h3 className="text-2xl font-bold text-calm-800 mt-1">{pending}</h3>
        </div>
        <div className="mt-4">
            {pending === 0 && total > 0 ? (
                <span className="text-xs font-medium text-success-600 bg-success-50 px-2 py-1 rounded-md">
                    ¡Todo listo por hoy! 🎉
                </span>
            ) : (
                <p className="text-xs text-calm-400">
                    Oportunidades esperando tu mensaje.
                </p>
            )}
        </div>
      </div>

      {/* Card 3: Session Impact */}
      <div className="bg-gradient-to-br from-white to-success-50 p-5 rounded-2xl border border-success-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <span className="text-4xl">🚀</span>
        </div>
        <div>
          <p className="text-xs font-medium text-success-700 uppercase tracking-wider">Impacto Hoy</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-calm-800">{sentSession}</h3>
            <span className="text-xs text-success-600 font-medium">mensajes enviados</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sentSession > 0 ? 'bg-green-500 animate-pulse' : 'bg-calm-300'}`}></div>
            <p className="text-xs text-calm-500">
                {sentSession > 0 ? 'Tu flujo de trabajo está activo' : 'Listo para comenzar a prospectar'}
            </p>
        </div>
      </div>

    </div>
  );
};