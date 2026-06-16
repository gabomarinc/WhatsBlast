import React, { useState } from 'react';
import { NeonService } from '../services/neon';
import { User } from '../types';
import { STRIPE_MONTHLY_LINK, STRIPE_ANNUAL_LINK } from '../constants';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpgradeSuccess: (user: User) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, currentUser, onUpgradeSuccess }) => {
  const [step, setStep] = useState<'pitch' | 'upgrade' | 'success'>('pitch');
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly');
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
      const res = await NeonService.upgradeGuestToPro(currentUser?.email || '', password, name, company);
      
      if (res.success && res.user) {
          onUpgradeSuccess(res.user);
          // Redirect to Stripe checkout
          window.open(plan === 'monthly' ? STRIPE_MONTHLY_LINK : STRIPE_ANNUAL_LINK, '_blank');
          setStep('success');
      } else {
          setError(res.error || "Hubo un error al procesar tu cuenta.");
      }
      setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/80 backdrop-blur-md animate-fade-in select-none">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-secondary-100">
            
            {/* Header / Graphic */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-xl shadow-primary-950/20">
                        🚀
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">¡Límite Alcanzado!</h2>
                    <p className="text-primary-100 text-sm font-medium">Has enviado los 10 mensajes de prueba gratuitos.</p>
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                {step === 'pitch' && (
                    <div className="animate-slide-up">
                        <p className="text-secondary-600 mb-6 text-center text-sm font-medium leading-relaxed">
                            Únete a cientos de negocios que reactivan sus bases de datos a través de WhatsApp de forma rápida y medible.
                        </p>
                        
                        {/* Selector de Planes */}
                        <div className="space-y-4 mb-8">
                            {/* Option 1: Monthly */}
                            <div 
                              onClick={() => setPlan('monthly')}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                plan === 'monthly' 
                                  ? 'border-primary-500 bg-primary-50/20 shadow-md' 
                                  : 'border-secondary-150 bg-white hover:border-secondary-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${plan === 'monthly' ? 'border-primary-500' : 'border-secondary-300'}`}>
                                  {plan === 'monthly' && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>}
                                </div>
                                <div className="text-left">
                                  <p className="font-black text-secondary-800 text-sm">Plan Mensual</p>
                                  <p className="text-xs text-secondary-400 font-bold">Acceso Ilimitado</p>
                                </div>
                              </div>
                              <span className="font-black text-lg text-secondary-800">$5<span className="text-xs text-secondary-400 font-bold">/mes</span></span>
                            </div>

                            {/* Option 2: Annual */}
                            <div 
                              onClick={() => setPlan('annual')}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between relative ${
                                plan === 'annual' 
                                  ? 'border-primary-500 bg-primary-50/20 shadow-md' 
                                  : 'border-secondary-150 bg-white hover:border-secondary-300'
                              }`}
                            >
                              <span className="absolute -top-2.5 right-6 bg-primary-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm tracking-wider">
                                Ahorra 17%
                              </span>
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${plan === 'annual' ? 'border-primary-500' : 'border-secondary-300'}`}>
                                  {plan === 'annual' && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>}
                                </div>
                                <div className="text-left">
                                  <p className="font-black text-secondary-800 text-sm">Plan Anual</p>
                                  <p className="text-xs text-secondary-400 font-bold">Un año de ventas</p>
                                </div>
                              </div>
                              <span className="font-black text-lg text-secondary-800">$50<span className="text-xs text-secondary-400 font-bold">/año</span></span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setStep('upgrade')}
                            className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-black shadow-lg shadow-primary-500/30 hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 select-none"
                        >
                            Comenzar Ahora 🔓
                        </button>
                    </div>
                )}

                {step === 'upgrade' && (
                    <div className="animate-slide-up">
                        <h3 className="font-black text-base text-secondary-800 mb-1">Completa tu cuenta</h3>
                        <p className="text-xs text-secondary-500 mb-6">Completa tus datos para registrar tu cuenta PRO e ir a la pasarela de pago.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-[9px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Tu Nombre</label>
                                <input 
                                    type="text" value={name} onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Empresa</label>
                                <input 
                                    type="text" value={company} onChange={e => setCompany(e.target.value)}
                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                                    placeholder="Mi Negocio"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Crea una Contraseña</label>
                                <input 
                                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs font-bold text-red-500 mb-4">{error}</p>}

                        <button 
                            onClick={handleUpgradeClick}
                            disabled={isLoading}
                            className={`w-full py-4 text-white rounded-xl font-black shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 ${isLoading ? 'bg-secondary-300' : 'bg-primary-500 shadow-primary-500/30'}`}
                        >
                            {isLoading ? 'Procesando...' : `Pagar $${plan === 'monthly' ? '5' : '50'} con Stripe 💳`}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center animate-slide-up py-4">
                        <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-white shadow-xl">
                            🎉
                        </div>
                        <h3 className="font-black text-xl text-secondary-800 mb-2">¡Bienvenido a PRO!</h3>
                        <p className="text-sm text-secondary-500 mb-6">Tu cuenta ha sido actualizada exitosamente. Ya puedes seguir prospectando sin límites.</p>
                        
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-secondary-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-colors"
                        >
                            Continuar
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
