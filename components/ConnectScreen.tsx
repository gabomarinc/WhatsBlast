import React, { useState, useRef } from 'react';
import { WELCOME_MSG } from '../constants';

interface ConnectScreenProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
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
      onFileSelect(file);
    } else {
      setError("Por favor sube un archivo Excel (.xlsx, .xls) o CSV.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 animate-fade-in border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
             <img 
               src="https://konsul.digital/wp-content/uploads/2025/07/Logo-original-e1751717849441.png" 
               alt="Konsul Logo" 
               className="h-20 w-auto object-contain transform transition-transform hover:scale-105 duration-500"
             />
          </div>
          <h1 className="text-3xl font-black text-calm-800 mb-3 tracking-tight">Comencemos</h1>
          <p className="text-calm-500 text-base font-normal leading-relaxed">
            {WELCOME_MSG}
          </p>
        </div>

        <div 
          className={`
            border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[220px]
            ${isDragging 
              ? 'border-primary-500 bg-primary-50 scale-[1.02]' 
              : 'border-calm-200 hover:border-primary-300 hover:bg-calm-50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileInput}
            className="hidden"
            accept=".xlsx, .xls, .csv"
          />
          
          {isLoading ? (
             <div className="flex flex-col items-center animate-pulse">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-calm-600">Procesando archivo...</p>
             </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-3xl text-calm-400">
                📎
              </div>
              <p className="text-base font-black text-calm-700 mb-1">
                Arrastra tu Excel aquí
              </p>
              <p className="text-sm text-calm-400 font-medium">
                o haz clic para buscar en tu equipo
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
                Soporta .XLSX .XLS .CSV
            </p>
        </div>
      </div>
    </div>
  );
};