import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface DeveloperSettingsProps {
  currentUser: User;
}

interface ApiToken {
  id: number;
  name: string;
  token: string;
  created_at: string;
  last_used_at: string | null;
}

export const DeveloperSettings: React.FC<DeveloperSettingsProps> = ({ currentUser }) => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load tokens
  const fetchTokens = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/developer/tokens', {
        headers: {
          'x-user-email': currentUser.email
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTokens(data);
      } else {
        setError('No se pudieron cargar las llaves de API');
      }
    } catch (e) {
      setError('Error al conectar con el servidor');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, [currentUser.email]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/developer/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify({ name: newTokenName })
      });

      if (response.ok) {
        await response.json();
        setSuccess('¡Llave de API creada con éxito!');
        setNewTokenName('');
        // Automatically fetch to update list
        fetchTokens();
      } else {
        const errData = await response.json();
        setError(errData.error || 'Error al crear la llave de API');
      }
    } catch (e) {
      setError('Error de conexión');
    }
    setIsLoading(false);
  };

  const handleDeleteToken = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas revocar esta llave de API? Las herramientas externas que la utilicen perderán el acceso.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/developer/tokens?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': currentUser.email
        }
      });

      if (response.ok) {
        setSuccess('Llave de API revocada con éxito');
        fetchTokens();
      } else {
        setError('No se pudo revocar la llave de API');
      }
    } catch (e) {
      setError('Error de conexión');
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-secondary-100 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-secondary-800 uppercase tracking-wide">Desarrollador & Integraciones API</h2>
        <p className="text-sm text-secondary-400 mt-1 font-semibold">
          Estandariza tu conexión con la suite Kônsul (Process, LeadsHUB) y automatiza el inicio de campañas programáticamente.
        </p>
      </div>

      {/* API Key Creation Form */}
      <form onSubmit={handleCreateToken} className="mb-10 bg-secondary-50/50 p-6 rounded-2xl border border-secondary-100/60">
        <h3 className="text-sm font-black uppercase text-secondary-700 tracking-wider mb-4">Generar Nueva Llave de API</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 group">
            <label className="text-[10px] uppercase font-black tracking-widest text-secondary-400 ml-1 mb-1 block">Nombre de la Llave (ej. LeadsHUB)</label>
            <input 
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl text-sm font-bold text-secondary-800 outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
              placeholder="Ej. Integración CRM"
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !newTokenName.trim()}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              isLoading || !newTokenName.trim()
                ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20 active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Generando...' : 'Generar Llave'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100">
            ✓ {success}
          </div>
        )}
      </form>

      {/* Token List */}
      <div>
        <h3 className="text-sm font-black uppercase text-secondary-700 tracking-wider mb-4">Mis Llaves de API Activas</h3>
        
        {isLoading && tokens.length === 0 ? (
          <div className="text-center py-8 text-secondary-400 text-sm font-bold animate-pulse">Cargando tokens...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12 bg-secondary-50/20 rounded-2xl border border-dashed border-secondary-200">
            <span className="text-3xl">🔑</span>
            <p className="font-bold text-sm text-secondary-500 mt-2">No tienes llaves de API activas</p>
            <p className="text-xs text-secondary-400 mt-1 font-medium">Genera una llave de API arriba para conectar tus herramientas externas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-secondary-100">
                  <th className="pb-3 text-[10px] uppercase font-black tracking-wider text-secondary-400">Nombre</th>
                  <th className="pb-3 text-[10px] uppercase font-black tracking-wider text-secondary-400">Llave de API</th>
                  <th className="pb-3 text-[10px] uppercase font-black tracking-wider text-secondary-400">Creada</th>
                  <th className="pb-3 text-[10px] uppercase font-black tracking-wider text-secondary-400">Último uso</th>
                  <th className="pb-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} className="border-b border-secondary-100/50 hover:bg-secondary-50/20 transition-colors">
                    <td className="py-4 text-sm font-black text-secondary-800">{t.name}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-secondary-50 border border-secondary-150 px-2.5 py-1 rounded-lg text-secondary-600 block max-w-[200px] truncate select-all">
                          {t.token}
                        </code>
                        <button
                          onClick={() => copyToClipboard(t.token, t.id)}
                          className={`p-1.5 rounded-lg border transition-all text-xs font-bold ${
                            copiedTokenId === t.id
                              ? 'bg-green-50 border-green-200 text-green-600'
                              : 'bg-white border-secondary-200 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50'
                          }`}
                          title="Copiar al portapapeles"
                        >
                          {copiedTokenId === t.id ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-bold text-secondary-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-xs font-bold text-secondary-400">
                      {t.last_used_at ? new Date(t.last_used_at).toLocaleDateString() : 'Nunca'}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDeleteToken(t.id)}
                        className="text-xs font-black text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
                        title="Revocar llave de API"
                      >
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* API Documentation Quick Reference */}
      <div className="mt-12 pt-8 border-t border-secondary-100">
        <h4 className="text-xs font-black uppercase text-secondary-500 tracking-wider mb-4">Guía Rápida para Desarrolladores</h4>
        <div className="bg-secondary-900 rounded-2xl p-5 text-white font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
          <p className="text-secondary-400">// Cabecera requerida para peticiones públicas:</p>
          <p className="text-primary-400">x-api-key: <span className="text-white">TU_API_KEY</span></p>
          <br />
          <p className="text-secondary-400">// Endpoint 1: Obtener plantillas de mensajes (GET)</p>
          <p className="text-emerald-400">GET <span className="text-white">https://reactivaleads.com/api/v1/templates</span></p>
          <br />
          <p className="text-secondary-400">// Endpoint 2: Iniciar una campaña / Inyectar prospectos (POST)</p>
          <p className="text-emerald-400">POST <span className="text-white">https://reactivaleads.com/api/v1/executions</span></p>
          <p className="text-secondary-400">Body JSON:</p>
          <p>{"{"}</p>
          <p className="pl-4">"filename": <span className="text-amber-300">"CRM_Export.xlsx"</span>,</p>
          <p className="pl-4">"sheet_name": <span className="text-amber-300">"Prospectos"</span>,</p>
          <p className="pl-4">"mapping": {"{ \"nameColumn\": \"Nombre\", \"phoneColumn\": \"Telefono\" }"}</p>
          <p className="pl-4">"prospects": [</p>
          <p className="pl-8">{"{ \"Nombre\": \"Juan Pérez\", \"Telefono\": \"34600112233\" }"}</p>
          <p className="pl-4">]</p>
          <p>{"}"}</p>
        </div>
      </div>
    </div>
  );
};
