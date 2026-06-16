import React, { useState } from 'react';
import { NeonService } from '../services/neon';
import { User } from '../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpgradeSuccess: (user: User) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, currentUser, onUpgradeSuccess }) => {
  const [step, setStep] = useState<'pitch' | 'upgrade' | 'success'>('pitch');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgradeClick = async () => {
      if (!name || !company || !password) {
          setError("Por favor completa todos los campos.");
          return;
      }
      if (password.length < 5) {
          setError("La contraseña debe tener al menos 5 caracteres.");
          return;
      }

      setError(null);
      setIsLoading(true);

      // Upgrade guest to pro
      const res = await NeonService.upgradeGuestToPro(currentUser.email, password, name, company);
      
      if (res.success && res.user) {
          onUpgradeSuccess(res.user);
          setStep('success');
      } else {
          setError(res.error || "Hubo un error al procesar tu cuenta.");
      }
      setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all">
            
            {/* Header / Graphic */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_10%,transparent_60%)] animate-spin-slow pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-xl shadow-indigo-900/50">
                        🚀
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">¡Llegaste al Límite!</h2>
                    <p className="text-indigo-100 text-sm font-medium">Has contactado a 10 prospectos con éxito.</p>
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                {step === 'pitch' && (
                    <div className="animate-slide-up">
                        <p className="text-secondary-600 mb-6 text-center leading-relaxed">
                            Acabas de experimentar lo rápido que es prospectar con <strong className="text-secondary-900">HumanFlow</strong>. Imagina lo que harías sin límites.
                        </p>
                        
                        <div className="bg-secondary-50 rounded-2xl p-6 mb-8 border border-secondary-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-black text-secondary-800">Plan PRO Ilimitado</span>
                                <span className="font-black text-2xl text-primary-600">$7<span className="text-sm text-secondary-400 font-bold">/mes</span></span>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm text-secondary-600 font-medium">
                                    <span className="text-green-500">✓</span> Contactos ilimitados
                                </li>
                                <li className="flex items-center gap-3 text-sm text-secondary-600 font-medium">
                                    <span className="text-green-500">✓</span> Plantillas ilimitadas
                                </li>
                                <li className="flex items-center gap-3 text-sm text-secondary-600 font-medium">
                                    <span className="text-green-500">✓</span> Historial y exportación Excel
                                </li>
                            </ul>
                        </div>

                        <button 
                            onClick={() => setStep('upgrade')}
                            className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-black shadow-lg shadow-primary-500/30 hover:scale-[1.02] transition-transform flex justify-center items-center gap-2"
                        >
                            ¡Quiero Ilimitado! 🔓
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full mt-3 py-2 text-secondary-400 text-xs font-bold hover:text-secondary-600 transition-colors"
                        >
                            Quizás más tarde
                        </button>
                    </div>
                )}

                {step === 'upgrade' && (
                    <div className="animate-slide-up">
                        <h3 className="font-black text-lg text-secondary-800 mb-1">Completa tu cuenta</h3>
                        <p className="text-xs text-secondary-500 mb-6">Para actualizar a PRO, necesitamos asegurar tu cuenta vinculada a <strong>{currentUser.email}</strong>.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div className="group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Tu Nombre</label>
                                <input 
                                    type="text" value={name} onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Empresa</label>
                                <input 
                                    type="text" value={company} onChange={e => setCompany(e.target.value)}
                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                                    placeholder="Mi Negocio"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Crea una Contraseña</label>
                                <input 
                                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs font-bold text-red-500 mb-4">{error}</p>}

                        <button 
                            onClick={handleUpgradeClick}
                            disabled={isLoading}
                            className={`w-full py-4 text-white rounded-xl font-black shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 ${isLoading ? 'bg-secondary-300' : 'bg-green-500 shadow-green-500/30'}`}
                        >
                            {isLoading ? 'Procesando...' : 'Pagar $7/mes (Simulado) 💳'}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center animate-slide-up py-4">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-white shadow-xl">
                            🎉
                        </div>
                        <h3 className="font-black text-xl text-secondary-800 mb-2">¡Bienvenido a PRO!</h3>
                        <p className="text-sm text-secondary-500 mb-6">Tu cuenta ha sido actualizada exitosamente. Ahora no tienes límites.</p>
                        
                        <button 
                            onClick={onClose}
                            className="w-full py-4 bg-secondary-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-colors"
                        >
                            Continuar Prospectando
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
