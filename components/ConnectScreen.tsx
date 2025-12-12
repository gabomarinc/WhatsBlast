import React, { useState, useRef } from 'react';
import { WELCOME_MSG } from '../constants';

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
    if (!email || !password) return; // Disable drag if incomplete credentials
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
      setError("Por favor ingresa tu correo.");
      return false;
    }
    if (!validateEmail(email)) {
        setError("Ingresa un correo válido.");
        return false;
    }
    if (!password) {
        setError("Por favor ingresa tu contraseña.");
        return false;
    }
    return true;
  };

  const validateEmail = (e: string) => {
    return /\S+@\S+\.\S+/.test(e);
  };

  const validateAndUpload = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    const name = file.name.toLowerCase();
    const isValidExt = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');

    if (isValidExt || validTypes.includes(file.type)) {
      onFileSelect(file, email, password);
    } else {
      setError("Por favor sube un archivo Excel (.xlsx, .xls) o CSV.");
    }
  };

  const triggerFileSelect = () => {
      if (!validateCredentials()) return;
      fileInputRef.current?.click();
  }

  const isFormValid = email && password;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 animate-fade-in border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
             <img 
               src="https://konsul.digital/wp-content/uploads/2025/07/Logo-original-e1751717849441.png" 
               alt="Konsul Logo" 
               className="h-20 w-auto object-contain transform transition-transform hover:scale-105 duration-500"
             />
          </div>
          <h1 className="text-3xl font-black text-calm-800 mb-3 tracking-tight">Bienvenido</h1>
          <p className="text-calm-500 text-base font-normal leading-relaxed">
            Ingresa tus credenciales para conectar.
          </p>
        </div>

        {/* Credentials Form */}
        <div className="space-y-4 mb-8">
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-calm-400 mb-2 pl-1">Correo Electrónico</label>
                <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    className="w-full px-4 py-3 bg-calm-50 border border-calm-200 rounded-xl text-sm font-bold text-calm-800 outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all placeholder:font-medium placeholder:text-calm-300"
                />
            </div>
            
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-calm-400 mb-2 pl-1">Contraseña</label>
                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-calm-50 border border-calm-200 rounded-xl text-sm font-bold text-calm-800 outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all placeholder:font-medium placeholder:text-calm-300"
                />
            </div>
        </div>

        {/* Drag & Drop Area */}
        <div 
          className={`
            border-2 border-dashed rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[200px] relative
            ${isDragging 
              ? 'border-primary-500 bg-primary-50 scale-[1.02]' 
              : 'border-calm-200'
            }
            ${isFormValid ? 'hover:border-primary-300 hover:bg-calm-50' : 'opacity-50 cursor-not-allowed bg-calm-50/50'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
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
             <div className="flex flex-col items-center animate-pulse">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-calm-600">Verificando y procesando...</p>
             </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-2xl text-calm-400">
                {isFormValid ? '🔓' : '🔒'}
              </div>
              <p className="text-base font-black text-calm-700 mb-1">
                {isFormValid ? 'Carga tu archivo Excel' : 'Completa el formulario'}
              </p>
              <p className="text-sm text-calm-400 font-medium text-center">
                {isFormValid 
                    ? 'Haz clic o arrastra aquí para iniciar sesión' 
                    : 'Debes ingresar correo y contraseña para desbloquear'
                }
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-5 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-2 animate-slide-up border border-red-100">
             <span>⚠️</span> {error}
          </div>
        )}

        <div className="mt-8 flex justify-center">
            <p className="text-[10px] text-calm-400 uppercase tracking-widest font-black">
                Validación segura vía Neon DB
            </p>
        </div>
      </div>
    </div>
  );
};