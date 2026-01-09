import React, { useState, useRef, useEffect } from 'react';
import { User, UploadRecord } from '../types';
import { NeonService } from '../services/neon';

interface ConnectScreenProps {
  onFileSelect: (file: File) => void;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  isLoading: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
  onResume?: (uploadId: number) => void;
}

// View state for the right panel
type AuthView = 'login' | 'forgot' | 'reset';

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ 
  onFileSelect, 
  onLogin,
  isLoading,
  currentUser,
  onLogout,
  onResume
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Recovery State
  const [authView, setAuthView] = useState<AuthView>('login');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (currentUser && NeonService.isConnected()) {
        setIsLoadingHistory(true);
        NeonService.getUserUploads(currentUser.email)
            .then(data => setHistory(data))
            .catch(console.error)
            .finally(() => setIsLoadingHistory(false));
    }
  }, [currentUser]);

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

  const handleRequestRecovery = async () => {
      if (!email || !email.includes('@')) {
          setError("Ingresa un correo válido para recuperar.");
          return;
      }
      setError(null);
      
      // Simulate Email Sending
      const res = await NeonService.requestPasswordRecovery(email);
      if (res.success && res.code) {
          setAuthView('reset');
          setSuccessMsg(`📧 [SIMULACIÓN] Tu código es: ${res.code}`);
          // Clear success msg after 10 seconds
          setTimeout(() => setSuccessMsg(null), 10000);
      } else {
          setError(res.error || "No se pudo enviar el código.");
      }
  };

  const handleResetConfirm = async () => {
      if (!recoveryCode || newPassword.length < 4) {
          setError("Código o contraseña inválidos (min 4 chars).");
          return;
      }
      if (newPassword !== confirmPassword) {
          setError("Las contraseñas no coinciden.");
          return;
      }

      const res = await NeonService.confirmPasswordReset(email, recoveryCode, newPassword);
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-50 blur-3xl opacity-60"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary-100 blur-3xl opacity-40"></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 bg-white rounded-[2.5rem] shadow-2xl shadow-secondary-100 z-10 overflow-hidden border border-secondary-50">
        
        {/* Left Side: Brand & History */}
        <div className="p-10 flex flex-col justify-center bg-white">
           <div className="mb-8">
              <img 
                src={currentUser?.logo_url || "https://konsul.digital/wp-content/uploads/2025/07/Logo-original-e1751717849441.png"}
                alt="Logo" 
                className="h-12 w-auto object-contain mb-8"
              />
              <h1 className="text-4xl font-black text-secondary-800 mb-3 leading-tight tracking-tight">
                {currentUser ? (
                    <>
                        ¡Hola, <span className="text-primary-500">{currentUser.name?.split(' ')[0] || 'Partner'}</span>!
                    </>
                ) : (
                    <>
                        Tu flujo de ventas,<br />
                        <span className="text-primary-500">más humano.</span>
                    </>
                )}
              </h1>
              <p className="text-secondary-400 font-medium text-base leading-relaxed max-w-sm">
                {currentUser 
                    ? 'Puedes cargar una nueva base de datos o continuar con una campaña anterior.'
                    : 'Conecta tus hojas de cálculo, personaliza tus mensajes y gestiona tus prospectos de WhatsApp.'
                }
              </p>
           </div>
           
           {/* HISTORY SECTION - Only visible if logged in */}
           {currentUser && NeonService.isConnected() && (
             <div className="mt-6 flex-1 animate-slide-up">
                <h3 className="text-xs font-black text-secondary-300 uppercase tracking-widest mb-4">Continuar Prospección</h3>
                
                {isLoadingHistory ? (
                   <div className="space-y-3">
                      <div className="h-14 bg-secondary-50 rounded-xl animate-pulse"></div>
                      <div className="h-14 bg-secondary-50 rounded-xl animate-pulse"></div>
                   </div>
                ) : history.length === 0 ? (
                   <div className="p-6 bg-secondary-50 rounded-xl border border-dashed border-secondary-200 text-sm text-secondary-400 text-center">
                      No hay campañas guardadas aún.
                   </div>
                ) : (
                   <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {history.map((record) => {
                         const percent = record.total_prospects ? Math.round((record.contacted_count || 0) / record.total_prospects * 100) : 0;
                         
                         return (
                            <button 
                               key={record.id}
                               onClick={() => onResume && onResume(record.id)}
                               disabled={isLoading}
                               className="w-full text-left p-4 bg-white hover:bg-primary-50 border border-secondary-100 hover:border-primary-200 rounded-xl transition-all group shadow-sm hover:shadow-md flex items-center justify-between"
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                   <p className="text-sm font-bold text-secondary-700 truncate group-hover:text-primary-600">{record.filename}</p>
                                   <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-[10px] text-secondary-400 bg-secondary-50 px-2 py-0.5 rounded border border-secondary-100 font-bold">{new Date(record.created_at).toLocaleDateString()}</span>
                                      <span className="text-[10px] text-secondary-400 font-medium">{record.contacted_count}/{record.total_prospects} contactados</span>
                                   </div>
                                </div>
                                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                   <svg className="w-12 h-12 transform -rotate-90">
                                      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-secondary-100" />
                                      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={113} strokeDashoffset={113 - (percent * 1.13)} className="text-primary-500 transition-all duration-1000" />
                                   </svg>
                                   <span className="absolute text-[10px] font-black text-secondary-600">{percent}%</span>
                                </div>
                            </button>
                         )
                      })}
                   </div>
                )}
             </div>
           )}
        </div>

        {/* Right Side: Action Card */}
        <div className="p-10 bg-secondary-50 md:bg-white flex flex-col justify-center relative">
            
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-black text-secondary-800 mb-1">
                        {currentUser ? 'Nueva Carga' : authView === 'login' ? 'Acceso' : 'Recuperación'}
                    </h2>
                    <p className="text-sm text-secondary-400 font-medium">
                        {currentUser 
                           ? 'Sube un Excel para iniciar una nueva campaña.' 
                           : authView === 'login' 
                              ? 'Ingresa tus credenciales para continuar.'
                              : authView === 'forgot'
                                ? 'Ingresa tu correo para recibir un código.'
                                : 'Establece tu nueva contraseña.'
                        }
                    </p>
                </div>
                {currentUser && onLogout && (
                    <button onClick={onLogout} className="text-xs font-bold text-red-400 hover:text-red-600 underline">
                        Cerrar sesión
                    </button>
                )}
            </div>

            {/* --- AUTH FORMS --- */}
            {!currentUser && (
                <div className="space-y-5 mb-8 animate-slide-up">
                    
                    {/* VIEW: LOGIN */}
                    {authView === 'login' && (
                        <>
                            <div className="group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Correo Electrónico</label>
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all placeholder:text-secondary-300 placeholder:font-semibold"
                                    placeholder="demo@humanflow.com"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Contraseña</label>
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all placeholder:text-secondary-300 placeholder:font-semibold"
                                    placeholder="••••••"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button onClick={() => { setAuthView('forgot'); setError(null); }} className="text-xs font-bold text-primary-600 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleLoginClick}
                                    disabled={isLoading || !isFormValid}
                                    className={`w-full py-4 rounded-xl font-black text-sm transition-all transform active:scale-[0.98] ${isLoading || !isFormValid ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600 shadow-xl shadow-primary-500/30'}`}
                                >
                                    {isLoading ? 'Verificando...' : 'Iniciar Sesión →'}
                                </button>
                            </div>
                        </>
                    )}

                    {/* VIEW: FORGOT PASSWORD */}
                    {authView === 'forgot' && (
                        <>
                             <div className="group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Correo Electrónico</label>
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all placeholder:text-secondary-300 placeholder:font-semibold"
                                    placeholder="tucorreo@empresa.com"
                                />
                            </div>
                            <div className="pt-2 flex flex-col gap-3">
                                <button
                                    onClick={handleRequestRecovery}
                                    className="w-full py-4 rounded-xl font-black text-sm bg-primary-500 text-white hover:bg-primary-600 shadow-xl shadow-primary-500/30 transition-all active:scale-[0.98]"
                                >
                                    Enviar Código
                                </button>
                                <button
                                    onClick={() => { setAuthView('login'); setError(null); }}
                                    className="w-full py-3 rounded-xl font-bold text-xs text-secondary-500 hover:bg-secondary-100 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </>
                    )}

                    {/* VIEW: RESET PASSWORD */}
                    {authView === 'reset' && (
                        <>
                             <div className="group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Código (Recibido en Correo)</label>
                                <input 
                                    type="text"
                                    value={recoveryCode}
                                    onChange={(e) => setRecoveryCode(e.target.value)}
                                    className="w-full px-5 py-4 bg-secondary-50 border border-secondary-200 rounded-xl text-lg font-black tracking-widest text-center text-primary-600 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                                    placeholder="0000"
                                    maxLength={4}
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Nueva Contraseña</label>
                                <input 
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                                    placeholder="Nueva contraseña"
                                />
                            </div>
                            <div className="group">
                                <input 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-secondary-50 border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                                    placeholder="Confirmar contraseña"
                                />
                            </div>

                            <div className="pt-2 flex flex-col gap-3">
                                <button
                                    onClick={handleResetConfirm}
                                    className="w-full py-4 rounded-xl font-black text-sm bg-primary-500 text-white hover:bg-primary-600 shadow-xl shadow-primary-500/30 transition-all active:scale-[0.98]"
                                >
                                    Actualizar Contraseña
                                </button>
                                <button
                                    onClick={() => { setAuthView('login'); setError(null); }}
                                    className="w-full py-3 rounded-xl font-bold text-xs text-secondary-500 hover:bg-secondary-100 transition-all"
                                >
                                    Volver al Login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* STATE 2: LOGGED IN - SHOW DROP ZONE */}
            {currentUser && (
                <div 
                onClick={triggerFileSelect}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative h-72 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden animate-slide-up
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
                        <div className="w-14 h-14 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold text-primary-600">Procesando archivo...</p>
                    </div>
                ) : (
                    <div className="z-10 px-8">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg shadow-primary-500/20 transition-all bg-primary-500 text-white`}>
                            📂
                        </div>
                        <p className="text-base font-black text-secondary-800 mb-1">
                            Sube tu nuevo Excel
                        </p>
                        <p className="text-xs text-secondary-400 font-bold">
                            Haz clic o arrastra el archivo aquí
                        </p>
                    </div>
                )}

                {/* Background Texture for Dropzone */}
                {!isLoading && (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#27bea5_1px,transparent_1px)] [background-size:16px_16px]"></div>
                )}
                </div>
            )}

            {/* Notifications */}
            {error && (
              <div className="absolute bottom-6 left-0 w-full px-10">
                  <div className="p-4 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-3 animate-slide-up border border-red-100 shadow-sm">
                    <span className="text-lg">⚠️</span> {error}
                  </div>
              </div>
            )}
            
            {successMsg && (
              <div className="absolute top-6 left-0 w-full px-10 z-50">
                  <div className="p-4 bg-green-50 text-green-700 text-xs font-bold rounded-xl flex items-center gap-3 animate-slide-up border border-green-100 shadow-lg shadow-green-100/50">
                    <span className="text-lg">📩</span> {successMsg}
                  </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};