import React, { useState } from 'react';
import { Button } from './Button';
import { WELCOME_MSG } from '../constants';

interface ConnectScreenProps {
  onConnect: (id: string) => void;
  isLoading: boolean;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onConnect, isLoading }) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const extractSheetId = (url: string): string | null => {
    // Caso 1: Es una URL completa de Google Sheets
    // Ejemplo: https://docs.google.com/spreadsheets/d/1BxiMVs.../edit
    const match = url.match(/\/d\/(.+?)(\/|$)/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Caso 2: El usuario pegó el ID directamente (cadena larga sin espacios ni slashes)
    if (url.length > 20 && !url.includes('/') && !url.includes('.')) {
      return url;
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = inputVal.trim();
    if (!cleanInput) return;

    const extractedId = extractSheetId(cleanInput);

    if (extractedId) {
      onConnect(extractedId);
    } else {
      setError("Hmm, ese enlace no parece válido. Asegúrate de copiar la URL completa de tu Google Sheet.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 animate-fade-in border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
            👋
          </div>
          <h1 className="text-2xl font-semibold text-calm-800 mb-2">Bienvenido</h1>
          <p className="text-calm-500 text-sm leading-relaxed">
            {WELCOME_MSG}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="sheetUrl" className="block text-xs font-medium uppercase tracking-wider text-calm-500 ml-1">
              URL de Google Sheet
            </label>
            <input
              id="sheetUrl"
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setError(null);
              }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className={`w-full px-4 py-3 bg-calm-50 border rounded-xl focus:ring-2 focus:ring-primary-100 outline-none transition-all text-calm-800 placeholder:text-calm-400 ${
                error ? 'border-red-300 focus:border-red-500' : 'border-calm-200 focus:border-primary-500'
              }`}
              autoFocus
            />
            {error ? (
               <p className="text-[11px] text-red-500 ml-1 font-medium animate-slide-up">
                 {error}
               </p>
            ) : (
              <p className="text-[10px] text-calm-400 ml-1">
                Copia y pega el enlace completo de tu navegador.
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isLoading}
            disabled={!inputVal}
          >
            Conectar Hoja
          </Button>
        </form>
      </div>
      
      <p className="mt-8 text-xs text-calm-400 font-medium">
        Diseñado para humanos, no para robots 🤍
      </p>
    </div>
  );
};