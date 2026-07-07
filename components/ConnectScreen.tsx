import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { User } from '../types';
import { NeonService } from '../services/neon';
import { Footer } from './Footer';

interface ConnectScreenProps {
  onFileSelect: (file: File) => void;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onGuestStart: (email: string) => Promise<boolean>;
  isLoading: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
  onResume?: (uploadId: number) => void;
  onGoToDashboard?: () => void;
}

// View state for the right panel
type AuthView = 'guest' | 'login' | 'forgot' | 'reset' | 'register';

// --- Custom SVG Components for Hand-Drawn Accents ---

const ArrowGreenLeft = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-primary-500 stroke-current overflow-visible" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
    <path d="M80,55 L95,70 L85,85" />
  </svg>
);

const ArrowGreenRight = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-primary-500 stroke-current overflow-visible" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
    <path d="M65,75 L50,80 L55,65" />
  </svg>
);

const ArrowBlack1 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-secondary-800 stroke-current overflow-visible opacity-30" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,80 Q 40,20 80,40" />
    <path d="M60,20 L80,40 L50,60" />
  </svg>
);

const ArrowBlack2 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-secondary-800 stroke-current overflow-visible opacity-30" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,80 Q 40,20 80,40" />
    <path d="M60,20 L80,40 L50,60" />
  </svg>
);

const CircularBadge = ({ onClick }: { onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className="relative w-24 h-24 md:w-32 md:h-32 bg-primary-500 rounded-full flex items-center justify-center shadow-xl rotate-12 hover:scale-105 hover:rotate-0 transition-transform cursor-pointer border-[3px] border-white/20 z-40"
  >
    <div className="absolute inset-1 animate-[spin_12s_linear_infinite]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path id="circlePath" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
        <text className="text-[10px] font-black tracking-[0.16em] uppercase" fill="white">
          <textPath href="#circlePath" startOffset="0%">
            PRUÉBALO GRATIS • REACTIVALEADS • 
          </textPath>
        </text>
      </svg>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-8 h-8 text-white stroke-current overflow-visible" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20,80 Q 40,50 30,30 T 80,20" />
        <path d="M60,10 L80,20 L70,40" />
      </svg>
    </div>
  </div>
);

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ 
  onFileSelect, 
  onLogin,
  onGuestStart,
  isLoading,
  currentUser,
  onLogout,
  onGoToDashboard
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Recovery State
  const [authView, setAuthView] = useState<AuthView>('guest');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Counter animation states
  const [companyCount, setCompanyCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCompanyCount(10);
      setLeadsCount(5000);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!currentUser) return; 
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!currentUser) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const handleLoginClick = async () => {
     if (!email || !password) {
         setError("Por favor ingresa correo y contraseña.");
         return;
     }
     setError(null);
     await onLogin(email, password);
  };

  const handleGuestStartClick = async () => {
      if (!email || !email.includes('@')) {
          setError("Por favor ingresa un correo válido.");
          return;
      }
      setError(null);
      await onGuestStart(email);
  };

  const handleRequestRecovery = async () => {
      if (!email || !email.includes('@')) {
          setError("Ingresa un correo válido para recuperar.");
          return;
      }
      setError(null);
      
      const res = await NeonService.requestPasswordRecovery(email);
      if (res.success && res.code) {
          setAuthView('reset');
          if (res.simulated) {
              setSuccessMsg(`📧 [SIMULACIÓN] Tu código es: ${res.code}`);
          } else {
              setSuccessMsg("📧 Hemos enviado un código de recuperación a tu correo electrónico.");
          }
          setTimeout(() => setSuccessMsg(null), 10000);
      } else {
          setError(res.error || "No se pudo enviar el código.");
      }
  };

  const handleResetConfirm = async () => {
      if (!recoveryCode || resetPassword.length < 4) {
          setError("Código o contraseña inválidos (min 4 chars).");
          return;
      }
      if (resetPassword !== resetConfirm) {
          setError("Las contraseñas no coinciden.");
          return;
      }

      const res = await NeonService.confirmPasswordReset(email, recoveryCode, resetPassword);
      if (res.success) {
          setSuccessMsg("¡Contraseña actualizada! Inicia sesión.");
          setAuthView('login');
          setPassword(''); 
          setTimeout(() => setSuccessMsg(null), 5000);
      } else {
          setError(res.error || "Código inválido o expirado.");
      }
  };

  const validateAndUpload = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'application/vnd.ms-excel', 
      'text/csv'
    ];

    const name = file.name.toLowerCase();
    const isValidExt = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');

    if (isValidExt || validTypes.includes(file.type)) {
      onFileSelect(file);
    } else {
      alert("Solo archivos Excel (.xlsx) o CSV.");
    }
  };

  const triggerFileSelect = () => {
      if (!currentUser) return;
      fileInputRef.current?.click();
  }

  const isFormValid = email.length > 0 && password.length > 0;
  
  const switchView = (view: AuthView) => {
      setAuthView(view);
      setError(null);
      setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-secondary-800 flex flex-col font-sans selection:bg-primary-500 selection:text-white relative overflow-hidden w-full">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

      {/* Top Header/Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-8 max-w-7xl mx-auto w-full">
        {/* Logo Kônsul */}
        <div className="flex items-center gap-3">
          <img 
            src="https://konsul.digital/images/Konsul%20logo%20general.png"
            alt="Logo" 
            className="h-14 md:h-16 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Dynamic header options */}
        <div className="flex items-center gap-3">
          {!currentUser ? (
            <>
              {authView !== 'login' ? (
                <button 
                  onClick={() => switchView('login')} 
                  className="px-5 py-2 rounded-full border border-white/30 text-white text-xs md:text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Iniciar Sesión
                </button>
              ) : (
                <button 
                  onClick={() => switchView('guest')} 
                  className="px-5 py-2 rounded-full bg-primary-500 text-white text-xs md:text-sm font-black hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
                >
                  Probar Gratis
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              {onGoToDashboard && (
                <button 
                  onClick={onGoToDashboard} 
                  className="px-5 py-2 rounded-full bg-primary-500 text-white text-xs md:text-sm font-black hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
                >
                  Panel de control
                </button>
              )}
              {onLogout && (
                <button 
                  onClick={onLogout} 
                  className="px-5 py-2 rounded-full border border-red-400 text-red-400 text-xs md:text-sm font-bold hover:bg-red-500/10 transition-all"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Content Section */}
      <main className="flex-1 relative z-10 pt-6 pb-24 md:pt-10 md:pb-32 px-4 flex flex-col items-center justify-center w-full max-w-7xl mx-auto">
        
         {/* Title Stack with original content */}
         <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center z-10 mb-12">
          
          <div className="w-full flex flex-col items-center relative z-10 space-y-2 md:space-y-4">
            {/* Line 1: REACTIVA TUS LEADS */}
            <div className="w-full flex justify-center relative z-30">
              <h1 
                className="text-[clamp(1.8rem,5.5vw,60px)] font-black leading-[0.9] tracking-tighter text-white m-0 p-0 uppercase"
                style={{ 
                  fontFamily: '"Satoshi", "Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #131c26, 2px 2px 0 #131c26, 3px 3px 0 #131c26'
                }}
              >
                REACTIVA TUS LEADS
              </h1>
            </div>
            
            {/* Line 2: Y CRECE TUS VENTAS */}
            <div className="w-full flex justify-center relative z-20">
              <h1 
                className="text-[clamp(2rem,6.5vw,75px)] font-black leading-[0.9] tracking-tighter text-primary-500 m-0 p-0 uppercase"
                style={{ 
                  fontFamily: '"Satoshi", "Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #131c26, 2px 2px 0 #131c26, 3px 3px 0 #131c26'
                }}
              >
                Y CRECE TUS VENTAS
              </h1>
            </div>

            {/* Line 3: DESDE WHATSAPP */}
            <div className="w-full flex justify-center relative z-10">
              <h1 
                className="text-[clamp(1.8rem,5.5vw,60px)] font-black leading-[0.9] tracking-tighter text-white m-0 p-0 uppercase"
                style={{ 
                  fontFamily: '"Satoshi", "Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #131c26, 2px 2px 0 #131c26, 3px 3px 0 #131c26'
                }}
              >
                DESDE WHATSAPP
              </h1>
            </div>

            {/* Subtext description */}
            <p className="text-secondary-300 font-bold text-sm md:text-base max-w-xl mx-auto mt-4 leading-relaxed px-4">
              {currentUser 
                ? '¡Hola! Gestiona tu campaña cargando un nuevo archivo o retomando uno de la lista a continuación.' 
                : 'Sube tu base de datos de prospectos que no te compraron y vuelve a conectar con ellos por WhatsApp de forma masiva y 100% personalizada.'
              }
            </p>

            {/* Floating Action Cards & Accent SVGs - Only shown on larger screens to keep mobile neat and uncrowded */}
            <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-20">
            
              {/* Floating Auth Card (Left) */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[10%] lg:left-[-12%] xl:left-[-18%] z-30 pointer-events-auto"
              >
                <div className="w-56 aspect-[3/3.2] bg-white/10 backdrop-blur-lg border border-white/20 rounded-[2rem] p-5 flex flex-col justify-between rotate-[-6deg] shadow-2xl hover:rotate-0 transition-all duration-500">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black tracking-widest text-primary-400 uppercase">
                      {authView === 'guest' ? 'PRUEBA GRATUITA' : 'ACCEDER'}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-ping"></div>
                  </div>

                  <div className="my-3">
                    <h3 className="text-white font-black text-sm leading-tight mb-2">
                      {authView === 'guest' ? 'Empieza con 10 prospectos gratis' : 'Continúa con tus envíos'}
                    </h3>
                    <p className="text-[10px] text-secondary-300 font-medium leading-relaxed">
                      Visualiza y contacta al instante. Sin registros complejos ni tarjeta.
                    </p>
                  </div>

                  <button 
                    onClick={() => switchView(authView === 'guest' ? 'login' : 'guest')} 
                    className="w-full py-2 bg-white text-secondary-800 font-black text-xs rounded-xl hover:bg-primary-500 hover:text-white transition-colors"
                  >
                    {authView === 'guest' ? '¿Ya tienes Pro? Entrar' : 'Usar modo gratuito'}
                  </button>
                </div>
              </motion.div>

              {/* Floating App Preview Card (Right) */}
              <motion.div 
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[10%] lg:right-[-12%] xl:right-[-18%] z-30 pointer-events-auto"
              >
                <div className="w-56 aspect-[3/3.2] bg-white/10 backdrop-blur-lg border border-white/20 rounded-[2rem] p-5 flex flex-col justify-between rotate-[6deg] shadow-2xl hover:rotate-0 transition-all duration-500">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-2xl font-black text-white leading-none">100%</p>
                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mt-1">ORGANIC RATE</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div className="bg-primary-500 h-full w-[80%] rounded-full"></div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-3 text-left">
                    <p className="text-[10px] font-bold text-white">Consola ReactivaLeads</p>
                    <p className="text-[8px] text-secondary-300 mt-0.5">Retornos dinámicos inteligentes</p>
                  </div>
                </div>
              </motion.div>

              {/* Decorative Arrow Left */}
              <div className="absolute bottom-[-15%] left-[20%] w-24 h-24 md:w-28 md:h-28 z-20">
                <ArrowGreenLeft />
              </div>

              {/* Decorative Arrow Right (placed next to LEADS) */}
              <div className="absolute top-[3%] left-[64%] w-24 h-24 md:w-28 md:h-28 z-20">
                <ArrowGreenRight />
              </div>

              {/* Circular Badge */}
              <div className="absolute bottom-[-20%] right-[-5%] md:right-[5%] z-40 pointer-events-auto">
                <CircularBadge onClick={() => {
                  if (authView !== 'guest') switchView('guest');
                  const element = document.getElementById('auth-form-card');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }} />
              </div>

            </div>
          </div>
         </div>

        {/* INPUT / AUTH FORM CARD SECTION */}
        <div id="auth-form-card" className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 shadow-2xl relative z-30 mt-6 border border-secondary-100">
          
          <div className="mb-6 flex justify-between items-end">
              <div>
                  <h2 className="text-lg font-black text-secondary-800 uppercase tracking-wider mb-1">
                      {currentUser 
                          ? 'Nueva Carga' 
                          : authView === 'login' 
                              ? 'Acceso' 
                              : authView === 'register' 
                                  ? 'Crear Cuenta'
                                  : authView === 'guest'
                                      ? 'Pruébalo Gratis'
                                      : 'Recuperación'}
                  </h2>
                  <p className="text-xs text-secondary-400 font-semibold">
                      {currentUser 
                         ? 'Sube un Excel para iniciar una nueva campaña.' 
                         : authView === 'guest'
                            ? 'Ingresa tu correo para probar la herramienta gratis.'
                            : authView === 'login' 
                             ? 'Ingresa tus credenciales para continuar.'
                             : authView === 'register'
                               ? 'Completa tus datos para empezar.'
                               : authView === 'forgot'
                                   ? 'Ingresa tu correo para recibir un código.'
                                   : 'Establece tu nueva contraseña.'
                      }
                  </p>
              </div>
          </div>

          {/* --- ACTIVE FORMS CONTENT --- */}
          {!currentUser ? (
              <div className="space-y-4">
                  {/* GUEST VIEW */}
                  {authView === 'guest' && (
                      <>
                          <div className="group">
                              <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Correo Electrónico</label>
                              <input 
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full px-4 py-3.5 bg-secondary-50 border border-secondary-200 rounded-xl text-base font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all placeholder:text-secondary-300"
                                  placeholder="tucorreo@ejemplo.com"
                              />
                          </div>

                          <div className="pt-2">
                              <button
                                  onClick={handleGuestStartClick}
                                  disabled={isLoading || !email.includes('@')}
                                  className={`w-full py-4 rounded-xl font-black text-sm transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 ${isLoading || !email.includes('@') ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600 shadow-xl shadow-primary-500/20 hover:scale-[1.01]'}`}
                              >
                                  <span>🚀</span> {isLoading ? 'Preparando...' : 'Comenzar Ahora Mismo'}
                              </button>
                          </div>

                           <div className="text-center pt-2">
                              <button onClick={() => switchView('login')} className="text-xs font-bold text-secondary-500 hover:text-primary-500 transition-colors">
                                  ¿Ya tienes cuenta Pro? Inicia Sesión
                              </button>
                           </div>

                            {/* Elemento de Confianza (Social Proof) */}
                            <div className="mt-6 pt-4 border-t border-secondary-100/80">
                                <div className="flex items-center gap-3 bg-secondary-50/50 border border-secondary-200/40 p-3 rounded-2xl">
                                    {/* Client Avatars Group */}
                                    <div className="flex -space-x-2 shrink-0">
                                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&crop=faces&q=80" alt="Cliente" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&crop=faces&q=80" alt="Cliente" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&crop=faces&q=80" alt="Cliente" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                                        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&crop=faces&q=80" alt="Cliente" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                                    </div>
                                    
                                    {/* Ratings and Stats */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black text-secondary-800">4.5/5</span>
                                            <div className="flex text-amber-500 text-[10px]">
                                                ★ ★ ★ ★ ★
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-secondary-400 font-black tracking-wider uppercase leading-normal">
                                            de satisfacción en nuestros clientes
                                        </p>
                                    </div>
                                </div>
                            </div>
                       </>
                  )}

                  {/* LOGIN VIEW */}
                  {authView === 'login' && (
                      <>
                          <div className="group">
                              <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Correo Electrónico</label>
                              <input 
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder:text-secondary-300"
                                  placeholder="demo@reactivaleads.com"
                              />
                          </div>
                          <div className="group">
                              <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Contraseña</label>
                              <input 
                                  type="password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500 placeholder:text-secondary-300"
                                  placeholder="••••••"
                              />
                          </div>

                          <div className="flex justify-between items-center text-xs mt-1">
                              <button onClick={() => switchView('guest')} className="font-bold text-secondary-500 hover:text-primary-500">
                                  ← Volver
                              </button>
                              <button onClick={() => switchView('forgot')} className="font-bold text-primary-500 hover:underline">
                                  ¿Olvidaste tu contraseña?
                              </button>
                          </div>

                          <div className="pt-2">
                              <button
                                  onClick={handleLoginClick}
                                  disabled={isLoading || !isFormValid}
                                  className={`w-full py-3.5 rounded-xl font-black text-sm transition-all transform active:scale-[0.98] ${isLoading || !isFormValid ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600 shadow-xl shadow-primary-500/20'}`}
                              >
                                  {isLoading ? 'Verificando...' : 'Iniciar Sesión →'}
                              </button>
                          </div>
                      </>
                  )}

                  {/* FORGOT PASSWORD */}
                  {authView === 'forgot' && (
                      <>
                          <div className="group">
                              <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Correo Electrónico</label>
                              <input 
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200"
                                  placeholder="tu@correo.com"
                              />
                          </div>
                          <div className="pt-2 flex flex-col gap-2">
                              <button onClick={handleRequestRecovery} className="w-full py-3.5 rounded-xl font-black text-sm bg-primary-500 text-white hover:bg-primary-600 shadow-xl">
                                  Enviar Código
                              </button>
                              <button onClick={() => switchView('login')} className="w-full py-2 rounded-xl font-bold text-xs text-secondary-500 hover:bg-secondary-100">
                                  Cancelar
                              </button>
                          </div>
                      </>
                  )}

                  {/* RESET PASSWORD */}
                  {authView === 'reset' && (
                      <>
                          <div className="group">
                              <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Código</label>
                              <input 
                                  type="text"
                                  value={recoveryCode}
                                  onChange={(e) => setRecoveryCode(e.target.value)}
                                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-lg font-black tracking-widest text-center text-primary-500"
                                  placeholder="0000"
                                  maxLength={4}
                              />
                          </div>
                          <div className="group">
                              <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Nueva Contraseña</label>
                              <input 
                                  type="password"
                                  value={resetPassword}
                                  onChange={(e) => setResetPassword(e.target.value)}
                                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800"
                                  placeholder="Nueva contraseña"
                              />
                          </div>
                          <div className="group">
                              <input 
                                  type="password"
                                  value={resetConfirm}
                                  onChange={(e) => setResetConfirm(e.target.value)}
                                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800"
                                  placeholder="Confirmar contraseña"
                              />
                          </div>
                          <div className="pt-2 flex flex-col gap-2">
                              <button onClick={handleResetConfirm} className="w-full py-3.5 rounded-xl font-black text-sm bg-primary-500 text-white">
                                  Actualizar Contraseña
                              </button>
                              <button onClick={() => switchView('login')} className="w-full py-2 rounded-xl font-bold text-xs text-secondary-500">
                                  Volver
                              </button>
                          </div>
                      </>
                  )}
              </div>
          ) : (
              /* LOGGED IN: DROPZONE */
              <div 
                  onClick={triggerFileSelect}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                      relative h-56 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
                      ${isDragging ? 'border-primary-500 bg-primary-50/50 scale-[1.01]' : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'}
                  `}
              >
                  <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileInput}
                      className="hidden"
                      accept=".xlsx, .xls, .csv"
                      disabled={isLoading}
                  />

                  {isLoading ? (
                      <div className="flex flex-col items-center animate-pulse z-10">
                          <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-3"></div>
                          <p className="text-xs font-bold text-primary-600">Procesando archivo...</p>
                      </div>
                  ) : (
                      <div className="z-10 px-6">
                          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl mb-3 shadow-lg bg-primary-500 text-white">
                              📂
                          </div>
                          <p className="text-sm font-black text-secondary-800 mb-0.5">
                              Sube tu nuevo Excel
                          </p>
                          <p className="text-[10px] text-secondary-400 font-bold">
                              Haz clic o arrastra el archivo aquí
                          </p>
                      </div>
                  )}
              </div>
          )}

          {/* Error and Success notifications inside card for context */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-2">
              <span>📩</span> {successMsg}
            </div>
          )}
        </div>

        {/* Contadores animados de confianza debajo del cuadro */}
        {!currentUser && (
          <div className="w-full max-w-md mx-auto mt-6 px-4 flex items-center justify-between gap-6 relative z-30">
            {/* Empresa Counter */}
            <div className="flex-1 bg-primary-500 border border-primary-600/30 p-4 rounded-2xl flex flex-col items-center text-center shadow-lg shadow-primary-500/20">
              <span className="text-primary-100/90 text-[10px] font-black tracking-widest uppercase mb-1">Empresas Activas</span>
              <div className="text-2xl font-black text-white flex items-center gap-0.5">
                <span>+</span>
                <NumberFlow value={companyCount} />
              </div>
            </div>

            {/* Leads Counter */}
            <div className="flex-1 bg-primary-500 border border-primary-600/30 p-4 rounded-2xl flex flex-col items-center text-center shadow-lg shadow-primary-500/20">
              <span className="text-primary-100/90 text-[10px] font-black tracking-widest uppercase mb-1">Leads Reactivados</span>
              <div className="text-2xl font-black text-white flex items-center gap-0.5">
                <span>+</span>
                <NumberFlow value={leadsCount} format={{ useGrouping: true }} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Features/PLG Details Section */}
      <section className="bg-white text-secondary-800 rounded-t-[2.5rem] md:rounded-t-[3.5rem] px-6 py-12 md:px-10 md:py-16 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] mt-auto w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* Feature Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-secondary-50 rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-secondary-100/50 hover:shadow-lg transition-all duration-300 pointer-events-auto"
          >
            <span className="text-primary-500 text-xs font-black tracking-widest uppercase mb-1">01 • VELOCIDAD</span>
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-secondary-800">
              DE 0 A 100 EN SEGUNDOS
            </h3>
            <p className="text-xs text-secondary-400 font-bold mb-auto">
              Sube tu base de datos de Excel o CSV y empieza a contactar al instante de forma automatizada.
            </p>
            
            {/* Action pill preview */}
            <div className="relative w-full flex justify-center mt-6">
              <div className="flex items-center bg-secondary-800 rounded-2xl p-2 pr-16 text-white shadow-lg relative z-10 text-xs">
                <div className="w-6 h-6 bg-primary-500 rounded-full mr-2 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </div>
                <div className="text-left leading-none">
                  <p className="font-bold">Listado.xlsx</p>
                  <p className="text-[8px] text-secondary-300">Campaña Activa</p>
                </div>
              </div>
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-primary-500 text-white font-black text-[10px] px-3 py-1.5 rounded-xl z-20 shadow-md">
                100 Leads
              </div>
            </div>

            <div className="hidden md:block absolute -right-12 bottom-8 w-16 h-16 z-30">
              <ArrowBlack1 />
            </div>
          </motion.div>

          {/* Feature Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="bg-secondary-50 rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-secondary-100/50 hover:shadow-lg transition-all duration-300 pointer-events-auto"
          >
            <span className="text-primary-500 text-xs font-black tracking-widest uppercase mb-1">02 • PERSONALIZACIÓN</span>
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-secondary-800">
              MENSAJES MUY HUMANOS
            </h3>
            <p className="text-xs text-secondary-400 font-bold mb-auto">
              Utiliza variables dinámicas de tu Excel para que cada lead reciba un saludo único y orgánico.
            </p>
            
            {/* Custom Pill Graphic */}
            <div className="relative w-full flex justify-center mt-6">
              <div className="flex items-center bg-secondary-800 rounded-full py-1.5 px-4 text-white shadow-lg text-xs font-bold gap-2">
                <span className="text-primary-400">¡Hola {'{Nombre}'}!</span>
                <span className="opacity-60">Enviar</span>
              </div>
              
              <div className="absolute -bottom-4 right-1/3 bg-primary-500 rounded-full p-2 shadow-lg transform rotate-12 z-20">
                 <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white stroke-current" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                 </svg>
              </div>
            </div>

            <div className="hidden md:block absolute -right-12 bottom-8 w-16 h-16 z-30">
              <ArrowBlack2 />
            </div>
          </motion.div>

          {/* Feature Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            className="bg-secondary-50 rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-secondary-100/50 hover:shadow-lg transition-all duration-300 pointer-events-auto"
          >
            <span className="text-primary-500 text-xs font-black tracking-widest uppercase mb-1">03 • SEGURIDAD</span>
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-secondary-800">
              MÁXIMA ORGANICIDAD
            </h3>
            <p className="text-xs text-secondary-400 font-bold mb-auto">
              El envío se hace de forma directa mediante tu propio WhatsApp Web para mitigar bloqueos.
            </p>
            
            <div className="flex flex-col items-center bg-primary-500 rounded-[2rem] px-5 py-3.5 text-white shadow-lg mt-6 relative w-full max-w-[200px]">
              <p className="text-[8px] font-bold uppercase tracking-wider mb-0.5">ESTADO DEL ENVÍO</p>
              <p className="text-base font-black">SEGURO & ACTIVO</p>
              
              <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-primary-500 transform rotate-45"></div>
            </div>
          </motion.div>

        </div>

      </section>

      <Footer />
    </div>
  );
};