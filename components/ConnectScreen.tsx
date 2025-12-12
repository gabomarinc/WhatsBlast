import React, { useState, useRef, useEffect } from 'react';
import { User, UploadRecord } from '../types';
import { NeonService } from '../services/neon';
import { Button } from './Button';

interface ConnectScreenProps {
  onFileSelect: (file: File, email?: string, password?: string) => void;
  isLoading: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
  onResume?: (uploadId: number) => void; // New prop
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ 
  onFileSelect, 
  isLoading,
  currentUser,
  onLogout,
  onResume
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    if (!currentUser && (!email || !password)) return; 
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    // If guest, validate fields
    if (!currentUser && !validateCredentials()) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!currentUser && !validateCredentials()) return;

    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateCredentials = () => {
    if (!email) {
      setError("Por favor identifícate con tu correo.");
      return false;
    }
    if (!validateEmail(email)) {
        setError("Ese correo no parece válido.");
        return false;
    }
    if (!password) {
        setError("Necesitamos tu contraseña para continuar.");
        return false;
    }
    return true;
  };

  const validateEmail = (e: string) => {
    return /\S+@\S+\.\S+/.test(e);
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
      if (currentUser) {
          onFileSelect(file);
      } else {
          onFileSelect(file, email, password);
      }
    } else {
      setError("Solo entendemos archivos Excel (.xlsx, .xls) o CSV.");
    }
  };

  const triggerFileSelect = () => {
      if (!currentUser && !validateCredentials()) return;
      fileInputRef.current?.click();
  }

  const isFormValid = currentUser ? true : (email.length > 0 && password.length > 0);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f4f6] relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-3xl animate-pulse-soft"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/30 blur-3xl animate-pulse-soft" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-white z-10 overflow-hidden transition-all duration-500">
        
        {/* Left Side: Brand & History */}
        <div className="p-10 flex flex-col justify-center bg-white/40 border-r border-white/50">
           <div className="mb-8">
              <img 
                src={currentUser?.logo_url || "https://konsul.digital/wp-content/uploads/2025/07/Logo-original-e1751717849441.png"}
                alt="Logo" 
                className="h-10 w-auto object-contain mb-6"
              />
              <h1 className="text-3xl font-black text-slate-800 mb-2 leading-tight tracking-tight">
                {currentUser ? (
                    <>
                        ¡Hola, <span className="text-indigo-600">{currentUser.name?.split(' ')[0] || 'Partner'}</span>!
                    </>
                ) : (
                    <>
                        Tu flujo de ventas,<br />
                        <span className="text-indigo-600">más humano.</span>
                    </>
                )}
              </h1>
              <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm">
                {currentUser 
                    ? 'Puedes cargar una nueva base de datos o continuar con una campaña anterior.'
                    : 'Conecta tus hojas de cálculo, personaliza tus mensajes y gestiona tus prospectos de WhatsApp.'
                }
              </p>
           </div>
           
           {/* HISTORY SECTION */}
           {currentUser && NeonService.isConnected() && (
             <div className="mt-4 flex-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Continuar Prospección</h3>
                
                {isLoadingHistory ? (
                   <div className="space-y-2">
                      <div className="h-12 bg-slate-100/50 rounded-xl animate-pulse"></div>
                      <div className="h-12 bg-slate-100/50 rounded-xl animate-pulse"></div>
                   </div>
                ) : history.length === 0 ? (
                   <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
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
                               className="w-full text-left p-3 bg-white hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl transition-all group shadow-sm hover:shadow-md flex items-center justify-between"
                            >
                                <div className="flex-1 min-w-0 mr-3">
                                   <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700">{record.filename}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{new Date(record.created_at).toLocaleDateString()}</span>
                                      <span className="text-[10px] text-slate-400">{record.contacted_count}/{record.total_prospects} contactados</span>
                                   </div>
                                </div>
                                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                   {/* Circular Progress */}
                                   <svg className="w-10 h-10 transform -rotate-90">
                                      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
                                      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={100} strokeDashoffset={100 - percent} className="text-indigo-500 transition-all duration-1000" />
                                   </svg>
                                   <span className="absolute text-[9px] font-bold text-slate-600">{percent}%</span>
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
        <div className="p-10 bg-white md:rounded-l-[2.5rem] shadow-lg flex flex-col justify-center relative">
            
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-black text-slate-800 mb-1">
                        {currentUser ? 'Nueva Carga' : 'Acceso'}
                    </h2>
                    <p className="text-sm text-slate-400">
                        {currentUser ? 'Sube un Excel para iniciar una nueva campaña.' : 'Ingresa tus credenciales para comenzar.'}
                    </p>
                </div>
                {currentUser && onLogout && (
                    <button onClick={onLogout} className="text-xs font-bold text-red-500 hover:text-red-700 underline">
                        Cerrar sesión
                    </button>
                )}
            </div>

            {!currentUser && (
                <div className="space-y-4 mb-8">
                    <div className="group">
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Correo electrónico"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-300 placeholder:font-semibold"
                        />
                    </div>
                    <div className="group">
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-300 placeholder:font-semibold"
                        />
                    </div>
                </div>
            )}

            {/* Drop Zone */}
            <div 
              onClick={triggerFileSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative h-48 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
                ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
                ${!isFormValid ? 'opacity-50 cursor-not-allowed grayscale' : ''}
              `}
            >
               <input 
                 type="file" 
                 ref={fileInputRef}
                 onChange={handleFileInput}
                 className="hidden"
                 accept=".xlsx, .xls, .csv"
                 disabled={!isFormValid || isLoading}
               />

               {isLoading ? (
                  <div className="flex flex-col items-center animate-pulse z-10">
                     <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                     <p className="text-sm font-bold text-indigo-700">Procesando...</p>
                  </div>
               ) : (
                  <div className="z-10 px-6">
                     <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm transition-all ${isFormValid ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>
                        {isFormValid ? '📂' : '🔒'}
                     </div>
                     <p className="text-sm font-black text-slate-700 mb-1">
                        {isFormValid ? (currentUser ? 'Sube tu nuevo Excel' : 'Sube tu Excel aquí') : 'Completa el formulario'}
                     </p>
                     <p className="text-xs text-slate-400 font-medium">
                        {isFormValid ? 'Haz clic o arrastra el archivo' : 'Ingresa tus datos para desbloquear'}
                     </p>
                  </div>
               )}

               {/* Background Texture for Dropzone */}
               {isFormValid && !isLoading && (
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
               )}
            </div>

            {error && (
              <div className="absolute bottom-4 left-0 w-full px-10">
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2 animate-slide-up border border-red-100">
                    <span>⚠️</span> {error}
                  </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};