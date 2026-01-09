import React, { useState, useEffect, useMemo } from 'react';
import { ConnectScreen } from './components/ConnectScreen';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { TemplateEditor } from './components/TemplateEditor';
import { ProspectCard } from './components/ProspectCard';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { ToastContainer } from './components/Toast';
import { DataService } from './services/dataService';
import { NeonService } from './services/neon';
import { AppState, Notification, Prospect, Template, ColumnMapping, User } from './types';
import { APP_NAME } from './constants';

const SESSION_KEY = 'hf_user_session_v1';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'connect',
    isLoading: false,
    workbook: null,
    sheetTabs: [],
    selectedTab: '',
    mapping: { nameColumn: '', phoneColumn: '', visibleColumns: [], filterableColumns: [] },
    activeFilters: {},
    currentUser: null,
    currentFilename: ''
  });

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState<Template>({ content: '' });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'template'>('list');
  const [viewFilter, setViewFilter] = useState<'active' | 'sent'>('active');

  // Load resources and check session on mount
  useEffect(() => {
    // 1. Load Template
    const tpl = DataService.getTemplate();
    setTemplate(tpl);
    
    // 2. Check DB Connection
    if (NeonService.isConnected()) {
        NeonService.initSchema().catch(err => {
            console.error("DB Init failed", err);
        });
    }

    // 3. Check LocalStorage Session
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const user: User = JSON.parse(savedSession);
        setState(prev => ({ ...prev, currentUser: user }));
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const addNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setState(prev => ({
      ...prev,
      currentUser: null,
      step: 'connect',
      workbook: null
    }));
    addNotification("Sesión cerrada correctamente", "info");
  };

  // STRICT LOGIN HANDLER - NOW VALIDATES EVERYONE AGAINST DB
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
          // Strict check: We must be connected to the DB
          if (!NeonService.isConnected()) {
              addNotification("Error: No hay conexión a la base de datos.", "error");
              setState(prev => ({ ...prev, isLoading: false }));
              return false;
          }

          const fetchedProfile = await NeonService.loginUser(email, password);
          
          if (fetchedProfile) {
              // Success
              localStorage.setItem(SESSION_KEY, JSON.stringify(fetchedProfile));
              setState(prev => ({ ...prev, currentUser: fetchedProfile, isLoading: false }));
              addNotification(`¡Bienvenido, ${fetchedProfile.name || email}! 👋`, "success");
              return true;
          } else {
              // Failed credentials
              addNotification("Credenciales incorrectas.", "error");
              setState(prev => ({ ...prev, isLoading: false }));
              return false;
          }

      } catch (error) {
          console.error(error);
          addNotification("Error de conexión al servidor.", "error");
          setState(prev => ({ ...prev, isLoading: false }));
          return false;
      }
  };

  const handleResumeSession = async (uploadId: number) => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
          const { prospects, mapping } = await NeonService.getSessionProspects(uploadId);
          
          setProspects(prospects);
          setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              step: 'dashboard',
              mapping: mapping as ColumnMapping
          }));
          addNotification("Sesión recuperada con éxito ✨", "success");
      } catch (error) {
          console.error(error);
          addNotification("No se pudo recuperar la sesión", "error");
          setState(prev => ({ ...prev, isLoading: false }));
      }
  };

  const handleFileSelect = async (file: File) => {
    // Security Check: strictly require currentUser
    if (!state.currentUser) {
        addNotification("Debes iniciar sesión primero.", "error");
        return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      currentFilename: file.name 
    }));
    
    // Slight delay for UX
    setTimeout(async () => {
      const result = await DataService.processFile(file);
      if (result.success && result.data) {
        setState(prev => ({ 
          ...prev, 
          step: 'configure',
          workbook: result.data!.workbook,
          sheetTabs: result.data!.sheets,
          isLoading: false 
        }));
      } else {
        addNotification(result.error || "Error al leer archivo", "error");
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, 800);
  };

  const prospectsFilteredByColumns = useMemo(() => {
    if (Object.keys(state.activeFilters).length === 0) return prospects;
    return prospects.filter(p => {
      return Object.entries(state.activeFilters).every(([col, val]) => {
        if (!val) return true;
        return String(p[col]) === val;
      });
    });
  }, [prospects, state.activeFilters]);

  const displayProspects = useMemo(() => {
    return prospectsFilteredByColumns.filter(p => {
        const status = (p.estado || p['Estado'] || p['status'] || '').toLowerCase();
        const isDone = sentIds.has(p.id) || 
                       status.includes('contactado') || 
                       status.includes('éxito') || 
                       status.includes('cliente') ||
                       status.includes('ganado');

        return viewFilter === 'active' ? !isDone : isDone;
    });
  }, [prospectsFilteredByColumns, viewFilter, sentIds]);

  const stats = useMemo(() => {
    const total = prospectsFilteredByColumns.length;
    const totalDatabase = prospects.length;
    const sessionSentCount = sentIds.size;
    
    const contactedTotal = prospectsFilteredByColumns.filter(p => {
        const status = (p.estado || '').toLowerCase();
        const isSheetContacted = status.includes('contactado') || status.includes('éxito') || status.includes('cliente') || status.includes('ganado');
        const isSessionSent = sentIds.has(p.id);
        return isSheetContacted || isSessionSent;
    }).length;

    const pending = total - contactedTotal;
    return { total, pending, sessionSentCount, contactedTotal, totalDatabase };
  }, [prospectsFilteredByColumns, prospects, sentIds]);

  const handleConfigurationConfirm = async (tabName: string, mapping: ColumnMapping) => {
    if (!state.workbook) return;
    setState(prev => ({ ...prev, isLoading: true, selectedTab: tabName, mapping }));
    
    const data = DataService.getProspects(state.workbook, tabName, mapping);
    setProspects(data);

    // Try to save to DB, but don't block if it fails (Offline Mode)
    if (state.currentUser?.email) {
        try {
            await NeonService.saveSession(
                state.currentUser.email,
                state.currentFilename || 'unknown.xlsx',
                tabName,
                mapping,
                data
            );
            if (NeonService.isConnected()) {
                addNotification("Datos sincronizados ☁️", "success");
            } else {
                 addNotification("Modo Local: Datos listos", "info");
            }
        } catch {
            addNotification("Modo Local (Sin conexión)", "info");
        }
    }

    setState(prev => ({ ...prev, step: 'dashboard', isLoading: false }));
  };

  const handleSaveTemplate = async (content: string) => {
    setTemplate({ content });
    DataService.saveTemplate(content);
    addNotification("Mensaje actualizado ✍️");
  };

  const handleSendMessage = (prospect: Prospect) => {
    let msg = template.content;
    
    msg = msg.replace(/{{(.*?)}}/g, (match, p1) => {
      const key = p1.trim();
      const value = prospect[key as keyof Prospect];
      return value ? String(value) : match;
    });

    const encodedMsg = encodeURIComponent(msg);
    const url = `https://wa.me/${prospect.telefono}?text=${encodedMsg}`;

    setSentIds(prev => new Set(prev).add(prospect.id));

    if (NeonService.isConnected()) {
        NeonService.updateProspectStatus(prospect.id, 'Contactado').catch(() => {});
    }

    setProspects(prev => prev.map(p => {
        if (p.id === prospect.id) return { ...p, estado: 'Contactado' };
        return p;
    }));

    window.open(url, 'HumanFlowWhatsApp');
  };

  const handleFilterChange = (col: string, val: string) => {
    setState(prev => ({
      ...prev,
      activeFilters: { ...prev.activeFilters, [col]: val }
    }));
  };

  const handleClearFilters = () => {
    setState(prev => ({ ...prev, activeFilters: {} }));
  };

  // --- RENDERING ---

  if (state.step === 'connect') {
    return (
      <>
        <ConnectScreen 
            onFileSelect={handleFileSelect}
            onLogin={handleLogin}
            isLoading={state.isLoading} 
            currentUser={state.currentUser}
            onLogout={handleLogout}
            onResume={handleResumeSession}
        />
        <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      </>
    );
  }

  if (state.step === 'configure') {
    return (
      <>
        <ConfigurationScreen 
          workbook={state.workbook}
          availableTabs={state.sheetTabs}
          isLoading={state.isLoading}
          onConfirm={handleConfigurationConfirm}
        />
        <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      </>
    );
  }

  const variableKeys = prospects.length > 0 
    ? Object.keys(prospects[0]).filter(k => k !== 'id') 
    : ['nombre', 'telefono'];

  return (
    <div className="min-h-screen bg-white pb-20 font-sans text-secondary-800">
      <header className="bg-white border-b border-secondary-100 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-default">
             <div className="relative">
                <img 
                  src={state.currentUser?.logo_url || "https://konsul.digital/wp-content/uploads/2025/07/Logo-original-e1751717849441.png"}
                  alt="Logo" 
                  className="h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                />
             </div>
             <div className="h-8 w-px bg-secondary-200 hidden sm:block"></div>
             <span className="font-black text-secondary-800 hidden sm:inline text-xl tracking-tight">
               {state.currentUser?.company_name || APP_NAME}
             </span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${NeonService.isConnected() ? 'bg-primary-50 text-primary-700 border-primary-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                <span className={`w-2 h-2 rounded-full ${NeonService.isConnected() ? 'bg-primary-500' : 'bg-amber-500'}`}></span>
                {NeonService.isConnected() ? 'Conectado' : 'Modo Local'}
             </div>
             
             <button 
                onClick={handleLogout}
                className="ml-2 text-secondary-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                title="Cerrar Sesión"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-12">
            <h1 className="text-4xl font-black text-secondary-900 tracking-tight mb-2">Hola, {state.currentUser?.name?.split(' ')[0] || 'Partner'} 👋</h1>
            <p className="text-lg text-secondary-500 font-medium max-w-2xl">
                Hoy es un buen día para crear conexiones significativas. Aquí tienes el pulso de tu prospección.
            </p>
        </div>

        <DashboardStats 
            total={stats.total} 
            pending={stats.pending} 
            sentSession={stats.sessionSentCount} 
            contactedTotal={stats.contactedTotal}
        />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 mt-12">
            <div className="bg-secondary-50 p-1.5 rounded-2xl flex w-full md:w-auto shadow-inner border border-secondary-100">
                <button 
                  onClick={() => setActiveTab('list')}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'list' 
                      ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  <span>📋</span> Lista de Contactos
                </button>
                <button 
                  onClick={() => setActiveTab('template')}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'template' 
                      ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  <span>💬</span> Personalizar Mensaje
                </button>
            </div>
        </div>

        <div className="animate-fade-in min-h-[400px]">
          {activeTab === 'list' && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-secondary-100 shadow-sm">
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => setViewFilter('active')}
                        className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            viewFilter === 'active' 
                            ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-100' 
                            : 'text-secondary-400 hover:bg-secondary-50'
                        }`}
                    >
                        Pendientes
                    </button>
                    <button 
                        onClick={() => setViewFilter('sent')}
                        className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            viewFilter === 'sent' 
                            ? 'bg-secondary-50 text-secondary-700 ring-1 ring-secondary-200' 
                            : 'text-secondary-400 hover:bg-secondary-50'
                        }`}
                    >
                        Historial
                    </button>
                 </div>
                 
                 <span className="text-xs font-bold text-secondary-400 bg-secondary-50 px-3 py-1.5 rounded-lg border border-secondary-100">
                    {displayProspects.length} registros visibles
                 </span>
              </div>

              {state.mapping.filterableColumns.length > 0 && (
                <FilterBar 
                  columns={state.mapping.filterableColumns}
                  prospects={prospects}
                  activeFilters={state.activeFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
              )}

              {displayProspects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-secondary-200">
                  <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center text-3xl mb-4 text-secondary-300">
                     {viewFilter === 'active' ? '🎉' : '📭'}
                  </div>
                  <p className="font-black text-xl text-secondary-600">
                      {viewFilter === 'active' ? '¡Todo limpio!' : 'Nada por aquí aún'}
                  </p>
                  <p className="text-sm text-secondary-400 mt-2 font-medium max-w-xs text-center">
                      {viewFilter === 'active' 
                        ? 'Has gestionado todos los prospectos pendientes bajo estos filtros.' 
                        : 'Tu historial de mensajes enviados aparecerá aquí.'}
                  </p>
                  {Object.keys(state.activeFilters).length > 0 && (
                     <button onClick={handleClearFilters} className="mt-6 text-primary-600 text-sm font-bold hover:underline">
                         Limpiar filtros activos
                     </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProspects.map(p => (
                    <ProspectCard 
                        key={p.id} 
                        prospect={p} 
                        onSend={handleSendMessage} 
                        isSentInSession={sentIds.has(p.id)}
                        visibleColumns={state.mapping.visibleColumns}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'template' && (
            <div className="max-w-5xl mx-auto pt-4">
              <TemplateEditor 
                initialTemplate={template.content} 
                onSave={handleSaveTemplate}
                variables={variableKeys}
                sampleProspect={prospects[0]} 
              />
            </div>
          )}
        </div>
      </main>

      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
    </div>
  );
};

export default App;