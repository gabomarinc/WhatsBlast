import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  total: number;
  pending: number;
  sentSession: number;
  contactedTotal: number;
}

// Icons
const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M14 3l-4.9 4.9M8.5 14l-.8-.8c-.7-.7-.7-1.8 0-2.5l5.8-5.8c.7-.7 1.8-.7 2.5 0l.8.8c.7.7.7 1.8 0 2.5L11 14.1c-.7.7-1.8.7-2.5 0zM19 8l2.5-2.5M14 3h7v7M9 15l-3.5 3.5M6 21h3"></path>
  </svg>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  total, 
  pending, 
  sentSession,
  contactedTotal
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = total > 0 ? Math.round((contactedTotal / total) * 100) : 0;
  const pendingProgress = total > 0 ? Math.round((pending / total) * 100) : 0;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex md:hidden w-full items-center justify-between px-5 py-4 bg-secondary-50 border border-secondary-200 rounded-2xl font-black text-xs text-secondary-700 hover:bg-secondary-100 transition-colors shadow-sm select-none"
      >
        <span className="flex items-center gap-2">
          📊 Estadísticas de la Campaña 
          <span className="bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded text-[10px]">
            Progreso: {progress}%
          </span>
        </span>
        <span className="text-secondary-400 font-bold">
          {isExpanded ? '▲ Ocultar' : '▼ Mostrar'}
        </span>
      </button>

      {/* Grid Container */}
      <div className={`${isExpanded ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-3 gap-6`}>
        
        {/* Card 1: Base Total */}
        <motion.div
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          className="flex w-full rounded-2xl overflow-hidden bg-white border border-secondary-200 shadow-xl shadow-secondary-100/10 min-h-[140px]"
        >
          {/* Left Panel */}
          <div className="w-2/5 p-5 flex flex-col justify-between text-white bg-gradient-to-br from-primary-500 to-primary-700">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <FolderIcon />
            </div>
            <div>
              <p className="text-3xl font-black">{progress}%</p>
              <p className="text-[10px] uppercase font-black tracking-wider opacity-85">Progreso</p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-3/5 p-5 flex flex-col justify-between bg-white text-secondary-800">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase font-black text-secondary-400 tracking-wider mb-1">Base Total</p>
                  <h3 className="text-3xl font-black text-secondary-800 tracking-tight">{total}</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">
                  +{contactedTotal} envíos
                </span>
              </div>
              <p className="text-xs text-secondary-500 font-medium mt-1">Prospectos en Excel</p>
            </div>
            
            <div className="w-full bg-secondary-100 rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-primary-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Por Contactar */}
        <motion.div
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          className="flex w-full rounded-2xl overflow-hidden bg-white border border-secondary-200 shadow-xl shadow-secondary-100/10 min-h-[140px]"
        >
          {/* Left Panel */}
          <div className={`w-2/5 p-5 flex flex-col justify-between text-white bg-gradient-to-br ${pending > 0 ? 'from-amber-500 to-amber-600' : 'from-primary-500 to-primary-700'}`}>
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ClockIcon />
            </div>
            <div>
              <p className="text-3xl font-black">{pendingProgress}%</p>
              <p className="text-[10px] uppercase font-black tracking-wider opacity-85">{pending > 0 ? 'Pendiente' : 'Completo'}</p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-3/5 p-5 flex flex-col justify-between bg-white text-secondary-800">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase font-black text-secondary-400 tracking-wider mb-1">Por Contactar</p>
                  <h3 className="text-3xl font-black text-secondary-800 tracking-tight">{pending}</h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pending > 0 ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                  {pending > 0 ? 'En cola' : 'Listo'}
                </span>
              </div>
              <p className="text-xs text-secondary-500 font-medium mt-1">Contactos restantes</p>
            </div>

            <div className="w-full bg-secondary-100 rounded-full h-2 mt-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${pending > 0 ? 'bg-amber-500' : 'bg-primary-500'}`} style={{ width: `${pendingProgress}%` }}></div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Impacto Hoy */}
        <motion.div
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          className="flex w-full rounded-2xl overflow-hidden bg-white border border-secondary-200 shadow-xl shadow-secondary-100/10 min-h-[140px]"
        >
          {/* Left Panel */}
          <div className="w-2/5 p-5 flex flex-col justify-between text-white bg-gradient-to-br from-indigo-500 to-purple-600">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <RocketIcon />
            </div>
            <div>
              <p className="text-3xl font-black">{sentSession}</p>
              <p className="text-[10px] uppercase font-black tracking-wider opacity-85">Enviados</p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-3/5 p-5 flex flex-col justify-between bg-white text-secondary-800">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase font-black text-secondary-400 tracking-wider mb-1">Impacto Hoy</p>
                  <h3 className="text-3xl font-black text-secondary-800 tracking-tight">{sentSession}</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 animate-pulse">
                  Activo
                </span>
              </div>
              <p className="text-xs text-secondary-500 font-medium mt-1">Mensajes esta sesión</p>
            </div>

            <div className="w-full bg-secondary-100 rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${sentSession > 0 ? 100 : 0}%` }}></div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};