import { useState, useId, useRef, FormEvent } from 'react';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { CheckCheck, Zap, Lock } from 'lucide-react';
import { NeonService } from '../services/neon';
import { User } from '../types';
import { STRIPE_MONTHLY_LINK, STRIPE_ANNUAL_LINK } from '../constants';
import { TimelineContent } from './ui/timeline-animation';
import { VerticalCutReveal } from './ui/vertical-cut-reveal';
import { cn } from '../lib/utils';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpgradeSuccess: (user: User) => void;
}

const PricingSwitch = ({
  button1,
  button2,
  onSwitch,
  className,
  layoutId,
}: {
  button1: string;
  button2: string;
  onSwitch: (value: string) => void;
  className?: string;
  layoutId?: string;
}) => {
  const [selected, setSelected] = useState("0");
  const uniqueId = useId();
  const switchLayoutId = layoutId || `switch-${uniqueId}`;

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div
      className={cn(
        "relative z-10 w-full flex rounded-full bg-secondary-100/80 border border-secondary-200/50 p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => handleSwitch("0")}
        className={cn(
          "relative z-10 flex-1 sm:h-12 h-10 flex items-center justify-center rounded-full text-xs font-black uppercase tracking-wider transition-colors focus:outline-none",
          selected === "0"
            ? "text-white"
            : "text-secondary-600 hover:text-secondary-900"
        )}
      >
        {selected === "0" && (
          <motion.span
            layoutId={switchLayoutId}
            className="absolute inset-0 rounded-full border-[3px] shadow-sm shadow-secondary-900 border-secondary-950 bg-gradient-to-t from-secondary-900 via-secondary-800 to-secondary-900"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-20">{button1}</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch("1")}
        className={cn(
          "relative z-10 flex-1 sm:h-12 h-10 flex items-center justify-center rounded-full text-xs font-black uppercase tracking-wider transition-colors focus:outline-none",
          selected === "1"
            ? "text-white"
            : "text-secondary-600 hover:text-secondary-900"
        )}
      >
        {selected === "1" && (
          <motion.span
            layoutId={switchLayoutId}
            className="absolute inset-0 rounded-full border-[3px] shadow-sm shadow-secondary-900 border-secondary-950 bg-gradient-to-t from-secondary-900 via-secondary-800 to-secondary-900"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-20 flex justify-center items-center gap-2">
          {button2}
        </span>
      </button>
    </div>
  );
};

export const PaywallModal = ({ isOpen, currentUser, onUpgradeSuccess }: PaywallModalProps) => {
  const [step, setStep] = useState<'pitch' | 'success'>('pitch');
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleUpgradeClick = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !company || !password || !confirmPassword) {
        setError("Por favor completa todos los campos.");
        return;
    }
    if (password.length < 5) {
        setError("La contraseña debe tener al menos 5 caracteres.");
        return;
    }
    if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
    }

    setError(null);
    setIsLoading(true);

    const userEmail = currentUser?.email || '';
    const res = await NeonService.saveGuestCredentialsAwaitingPayment(userEmail, password, name, company);
    
    if (res.success && res.user) {
        const stripeBaseLink = plan === 'monthly' ? STRIPE_MONTHLY_LINK : STRIPE_ANNUAL_LINK;
        // Prefill email and set client_reference_id to user's email for secure webhook mapping
        const checkoutUrl = `${stripeBaseLink}?client_reference_id=${encodeURIComponent(userEmail)}&prefilled_email=${encodeURIComponent(userEmail)}`;
        
        window.open(checkoutUrl, '_blank');
        setStep('success');
    } else {
        setError(res.error || "Hubo un error al procesar tu cuenta.");
    }
    setIsLoading(false);
  };

  const handleVerifyPayment = async () => {
    const userEmail = currentUser?.email || '';
    if (!userEmail) return;

    setVerificationError(null);
    setIsVerifying(true);

    // Give it a brief delay to simulate verification and fetch profile from Neon
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updatedUser = await NeonService.getUserProfile(userEmail);

    if (updatedUser && (updatedUser.plan === 'pro' || updatedUser.role === 'user')) {
      onUpgradeSuccess(updatedUser);
      window.location.reload();
    } else {
      setVerificationError("Aún no hemos detectado tu pago de Stripe. Si ya lo realizaste, espera unos segundos y presiona Verificar de nuevo.");
    }
    setIsVerifying(false);
  };

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const timelineVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -15,
      opacity: 0,
    },
  };

  const currentPrice = plan === 'monthly' ? 5 : 50;

  const features = [
    "Contactos y envíos ilimitados",
    "Plantillas personalizables ilimitadas",
    "Atajos de teclado y Modo Ráfaga ⚡",
    "Exportación Excel de reportes instantánea",
    "Soporte Premium prioritario",
    "Consistencia de datos y offline local",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white min-h-screen font-sans text-secondary-800 flex flex-col justify-between" ref={pricingRef}>
      {/* Background radial gradient corresponding to brand primary color */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 100%, #fff 40%, #e9fbf8 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10 w-full flex-grow flex flex-col justify-center">
        {step === 'pitch' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            
            {/* Left Panel - Features */}
            <div className="md:col-span-7 space-y-6">
              <TimelineContent
                as="div"
                animationNum={0}
                timelineRef={pricingRef}
                customVariants={revealVariants}
                className="flex items-center gap-2 text-primary-600 font-bold"
              >
                <Zap className="h-5 w-5 text-primary-500 fill-primary-500" />
                <span className="text-xs uppercase tracking-widest font-black">Límite alcanzado</span>
              </TimelineContent>

              <h1 className="text-4xl md:text-5xl font-black text-secondary-900 leading-tight tracking-tight">
                <VerticalCutReveal
                  splitBy="words"
                  staggerDuration={0.1}
                  staggerFrom="first"
                  reverse={true}
                  transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 40,
                    delay: 0.2,
                  }}
                >
                  Reactiva tus ventas hoy mismo
                </VerticalCutReveal>
              </h1>

              <TimelineContent
                as="p"
                animationNum={1}
                timelineRef={pricingRef}
                customVariants={revealVariants}
                className="text-lg text-secondary-500 font-medium"
              >
                Has visto lo rápido que es prospectar con WhatsBlast. Consigue la licencia PRO y continúa enviando sin límites.
              </TimelineContent>

              <div className="space-y-4 pt-4">
                {features.map((feature, index) => (
                  <TimelineContent
                    key={index}
                    as="div"
                    animationNum={2 + index}
                    timelineRef={pricingRef}
                    customVariants={timelineVariants}
                    className="flex items-center"
                  >
                    <div className="w-6 h-6 bg-primary-500 shadow-md shadow-primary-500/20 rounded-full flex items-center justify-center mr-3 shrink-0">
                      <CheckCheck className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-secondary-700 font-bold text-sm">{feature}</span>
                  </TimelineContent>
                ))}
              </div>
            </div>

            {/* Right Panel - Plan Switcher & Register Form */}
            <div className="md:col-span-5 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-secondary-200/60 shadow-xl space-y-6">
              <div>
                <h3 className="font-black text-secondary-800 text-lg mb-4 text-center md:text-left">Selecciona tu Plan</h3>
                <PricingSwitch
                  button1="Mensual"
                  button2="Anual (2 Meses GRATIS)"
                  onSwitch={(val) => setPlan(val === "0" ? "monthly" : "annual")}
                  className="w-full"
                />
              </div>

              {/* Secure account details */}
              <form onSubmit={handleUpgradeClick} className="space-y-4">
                <div className="border-t border-secondary-100 pt-4 space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-secondary-400">Datos de tu Cuenta</h4>
                  
                  {/* Account Email (Prefilled, Read-Only) */}
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Tu Correo Electrónico</label>
                    <input 
                      type="email" 
                      readOnly
                      disabled
                      value={currentUser?.email || ''}
                      className="w-full px-4 py-3 bg-secondary-100/50 border border-secondary-200 rounded-xl text-xs font-bold text-secondary-500 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Nombre Completo</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      autoComplete="name"
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-secondary-50/50 border border-secondary-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Empresa</label>
                    <input 
                      type="text" 
                      name="organization"
                      required
                      autoComplete="organization"
                      value={company} 
                      onChange={e => setCompany(e.target.value)}
                      className="w-full px-4 py-3 bg-secondary-50/50 border border-secondary-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                      placeholder="Mi Negocio"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Contraseña</label>
                      <input 
                        type="password" 
                        name="new-password"
                        required
                        autoComplete="new-password"
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-secondary-50/50 border border-secondary-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                        placeholder="••••••"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Confirmar Contraseña</label>
                      <input 
                        type="password" 
                        name="confirm-password"
                        required
                        autoComplete="new-password"
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-secondary-50/50 border border-secondary-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                        placeholder="••••••"
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-xs font-black text-red-500">{error}</p>}

                {/* Price and CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-secondary-100 pt-6 gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1 text-secondary-800">
                      <span className="text-3xl font-black">$</span>
                      <NumberFlow
                        value={currentPrice}
                        className="text-4xl font-black"
                      />
                      <span className="text-xs text-secondary-500 font-bold">/{plan === 'monthly' ? 'mes' : 'año'}</span>
                      {plan === 'annual' && (
                        <span className="text-sm text-secondary-400 line-through ml-2 font-medium">
                          $60
                        </span>
                      )}
                    </div>
                    {plan === 'annual' && (
                      <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md mt-1 self-start">
                        ¡2 MESES GRATIS!
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="text-white text-xs font-black uppercase tracking-wider h-12 px-8 rounded-full border-[3px] shadow-sm shadow-primary-600 border-primary-600 bg-gradient-to-t from-primary-600 via-primary-500 to-primary-600 hover:from-primary-700 hover:to-primary-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Procesando...' : 'Pagar 💳'}
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-12 animate-fade-in bg-white p-8 rounded-3xl border border-secondary-200 shadow-2xl relative z-10 space-y-4">
            <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-white shadow-xl">
              💳
            </div>
            <h3 className="font-black text-2xl text-secondary-800">Pasarela de Stripe Abierta</h3>
            <p className="text-sm text-secondary-500 leading-relaxed">
              Hemos guardado tus credenciales. Por favor completa tu pago en la pestaña de Stripe que se acaba de abrir. Una vez finalizado, verifica tu activación aquí abajo.
            </p>
            
            {verificationError && (
              <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                {verificationError}
              </p>
            )}

            <div className="pt-2 space-y-2">
              <button 
                onClick={handleVerifyPayment}
                disabled={isVerifying}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-black shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? 'Verificando con Stripe...' : 'Verificar Activación 🔄'}
              </button>

              <button 
                onClick={() => {
                  const stripeBaseLink = plan === 'monthly' ? STRIPE_MONTHLY_LINK : STRIPE_ANNUAL_LINK;
                  const userEmail = currentUser?.email || '';
                  window.open(`${stripeBaseLink}?client_reference_id=${encodeURIComponent(userEmail)}&prefilled_email=${encodeURIComponent(userEmail)}`, '_blank');
                }}
                className="w-full py-2 bg-secondary-50 text-secondary-500 rounded-xl font-bold text-xs hover:bg-secondary-100 transition-colors"
              >
                Volver a abrir ventana de pago ↗
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="py-8 text-center text-xs text-secondary-400 font-bold border-t border-secondary-100 relative z-10">
        <span className="flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-secondary-400" />
          Pago 100% seguro a través de Stripe Checkout.
        </span>
      </div>
    </div>
  );
};

