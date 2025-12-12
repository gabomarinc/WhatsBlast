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
  
  const progress = total > 0 ? Math.round((contactedTotal / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
      
      {/* Card 1: Total & Progress */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Base Total</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{total}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl text-slate-400">
                📂
            </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-xs mb-2 text-slate-500 font-bold">
            <span>Progreso de campaña</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Card 2: Pending Action */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
         <div className="flex justify-between items-start">
            <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Por Contactar</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{pending}</h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-colors ${pending > 0 ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {pending > 0 ? '⏳' : '✨'}
            </div>
        </div>
        
        <div className="mt-6">
            {pending === 0 && total > 0 ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black">
                   <span>Misión cumplida</span>
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
            ) : (
                <p className="text-xs text-slate-400 font-medium">
                    Personas esperando saber de ti.
                </p>
            )}
        </div>
      </div>

      {/* Card 3: Session Impact */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl shadow-xl shadow-indigo-200 flex flex-col justify-between text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
        
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
                <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">Impacto Hoy</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black tracking-tight">{sentSession}</h3>
                    <span className="text-sm font-bold text-indigo-200">mensajes</span>
                </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
                🚀
            </div>
          </div>
        </div>

        <div className="mt-6 relative z-10">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg w-fit backdrop-blur-md border border-white/10">
                <div className={`w-2 h-2 rounded-full ${sentSession > 0 ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
                <p className="text-xs font-bold text-indigo-100">
                    {sentSession > 0 ? 'Flujo activo' : 'Listo para iniciar'}
                </p>
            </div>
        </div>
      </div>

    </div>
  );
};