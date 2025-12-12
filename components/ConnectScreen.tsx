import React, { useState, useRef } from 'react';

interface ConnectScreenProps {
  onFileSelect: (file: File, email: string, password: string) => void;
  isLoading: boolean;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!email || !password) return; 
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (!validateCredentials()) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!validateCredentials()) return;

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
      onFileSelect(file, email, password);
    } else {
      setError("Solo entendemos archivos Excel (.xlsx, .xls) o CSV.");
    }
  };

  const triggerFileSelect = () => {
      if (!validateCredentials()) return;
      fileInputRef.current?.click();
  }

  const isFormValid = email.length > 0 && password.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f4f6] relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-3xl animate-pulse-soft"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/30 blur-3xl animate-pulse-soft" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-white z-10 overflow-hidden">
        
        {/* Left Side: Brand & Welcome */}
        <div className="p-10 flex flex-col justify-center bg-white/40">
           <div className="mb-10">
              <img 
                src="https://konsul.digital/wp-content/uploads/2025/07/Logo-original-e1751717849441.png" 
                alt="Konsul Logo" 
                className="h-12 w-auto object-contain mb-6"
              />
              <h1 className="text-4xl font-black text-slate-800 mb-4 leading-tight tracking-tight">
                Tu flujo de ventas,<br />
                <span className="text-indigo-600">más humano.</span>
              </h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                Conecta tus hojas de cálculo, personaliza tus mensajes y gestiona tus prospectos de WhatsApp en un entorno diseñado para la calma y la productividad.
              </p>
           </div>
           
           <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Seguro</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Rápido</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Simple</span>
           </div>
        </div>

        {/* Right Side: Action Card */}
        <div className="p-10 bg-white md:rounded-l-[2.5rem] shadow-lg flex flex-col justify-center relative">
            
            <div className="mb-6">
                <h2 className="text-xl font-black text-slate-800 mb-1">Acceso</h2>
                <p className="text-sm text-slate-400">Ingresa tus credenciales para comenzar.</p>
            </div>

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
                     <p className="text-sm font-bold text-indigo-700">Validando datos...</p>
                  </div>
               ) : (
                  <div className="z-10 px-6">
                     <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm transition-all ${isFormValid ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>
                        {isFormValid ? '📂' : '🔒'}
                     </div>
                     <p className="text-sm font-black text-slate-700 mb-1">
                        {isFormValid ? 'Sube tu Excel aquí' : 'Completa el formulario'}
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