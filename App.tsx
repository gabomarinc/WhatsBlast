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
import { AppState, Notification, Prospect, Template, ColumnMapping } from './types';
import { APP_NAME } from './constants';

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
  // Track IDs of prospects messaged during this session
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  
  const [template, setTemplate] = useState<Template>({ content: '' });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'template'>('list');
  
  // New State for Sub-tab in List view
  const [viewFilter, setViewFilter] = useState<'active' | 'sent'>('active');

  // Load initial template from local storage
  useEffect(() => {
    const tpl = DataService.getTemplate();
    setTemplate(tpl);
    
    // Attempt to init DB schema on load
    if (NeonService.isConnected()) {
        NeonService.initSchema().catch(err => {
            console.error("DB Init failed. Check connection string.", err);
        });
    } else {
      console.log("App starting in offline mode (No DB connection)");
    }
  }, []);

  // 1. Base Filtering (Column Filters only)
  const prospectsFilteredByColumns = useMemo(() => {
    if (Object.keys(state.activeFilters).length === 0) return prospects;

    return prospects.filter(p => {
      // Check if prospect matches ALL active filters
      return Object.entries(state.activeFilters).every(([col, val]) => {
        if (!val) return true;
        return String(p[col]) === val;
      });
    });
  }, [prospects, state.activeFilters]);

  // 2. Display Filtering (Active vs Sent)
  const displayProspects = useMemo(() => {
    return prospectsFilteredByColumns.filter(p => {
        const status = (p.estado || p['Estado'] || p['status'] || '').toLowerCase();
        
        // Define what constitutes "Done/Sent"
        const isDone = sentIds.has(p.id) || 
                       status.includes('contactado') || 
                       status.includes('éxito') || 
                       status.includes('cliente') || 
                       status.includes('ganado');

        if (viewFilter === 'active') {
            return !isDone;
        } else {
            return isDone;
        }
    });
  }, [prospectsFilteredByColumns, viewFilter, sentIds]);

  // Calculate Dashboard Metrics
  const stats = useMemo(() => {
    const total = prospectsFilteredByColumns.length;
    const totalDatabase = prospects.length;
    const sessionSentCount = sentIds.size;
    
    const contactedTotal = prospectsFilteredByColumns.filter(p => {
        const status = (p.estado || '').toLowerCase();
        const isSheetContacted = status.includes('contactado') || status.includes('éxito') || status.includes('cliente');
        const isSessionSent = sentIds.has(p.id);
        return isSheetContacted || isSessionSent;
    }).length;

    const pending = total - contactedTotal;

    return { total, pending, sessionSentCount, contactedTotal, totalDatabase };
  }, [prospectsFilteredByColumns, prospects, sentIds]);


  const addNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Step 1: Login & Upload File -> Parse -> Go to Configure
  const handleFileSelect = async (file: File, email: string, password: string) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      currentUser: { email }, // Temp user
      currentFilename: file.name 
    }));
    
    // 1. Authenticate against DB (Async await to ensure user exists before moving on)
    let userProfile = { email };
    let loginSuccess = false;
    
    // Only enforce strict auth if Auth DB is connected, otherwise assume demo/offline
    if (NeonService.isAuthConnected()) {
        try {
          const fetchedProfile = await NeonService.loginUser(email, password);
          if (fetchedProfile) {
            userProfile = fetchedProfile;
            loginSuccess = true;
            
            setState(prev => ({ ...prev, currentUser: fetchedProfile }));
            
            if (fetchedProfile.name) {
              addNotification(`¡Hola de nuevo, ${fetchedProfile.name}! 👋`, "success");
            }
          } else {
              // Explicit failure from DB
              addNotification("Credenciales inválidas. Acceso denegado.", "error");
              setState(prev => ({ ...prev, isLoading: false }));
              return; // STOP EXECUTION
          }
        } catch(e) {
          console.error("Login error:", e);
          addNotification("Error de conexión al servidor de autenticación.", "error");
          setState(prev => ({ ...prev, isLoading: false }));
          return; // STOP EXECUTION
        }
    } else {
        // Fallback for demo/offline
        loginSuccess = true;
        addNotification("Modo Demo/Offline (Sin validación estricta)", "info");
    }

    // 2. Process File only if login succeeded
    if (loginSuccess) {
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
        }, 500);
    }
  };

  // Step 2: Configure -> Extract Prospects -> SAVE TO NEON -> Go to Dashboard
  const handleConfigurationConfirm = async (tabName: string, mapping: ColumnMapping) => {
    if (!state.workbook) return;

    setState(prev => ({ ...prev, isLoading: true, selectedTab: tabName, mapping }));
    
    // 1. Extract data locally
    const data = DataService.getProspects(state.workbook, tabName, mapping);
    setProspects(data);

    // 2. Persist to Neon DB
    if (NeonService.isConnected() && state.currentUser?.email) {
        try {
            addNotification("Sincronizando con base de datos...", "info");
            
            await NeonService.saveSession(
                state.currentUser.email,
                state.currentFilename || 'unknown.xlsx',
                tabName,
                mapping,
                data
            );
            
            addNotification("¡Datos guardados exitosamente! ☁️", "success");
        } catch (e) {
            console.error(e);
            addNotification("Error al guardar en la nube (Datos locales activos)", "error");
        }
    }

    setState(prev => ({ ...prev, step: 'dashboard', isLoading: false }));
  };

  const handleSaveTemplate = async (content: string) => {
    setTemplate({ content });
    DataService.saveTemplate(content);
    addNotification("Plantilla guardada (Local) 🎯");
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

    // Mark as sent in session
    setSentIds(prev => new Set(prev).add(prospect.id));

    // Update Status in DB
    if (NeonService.isConnected()) {
        NeonService.updateProspectStatus(prospect.id, 'Contactado').catch(err => console.error("Failed to update status in DB", err));
    }

    // Update local state to reflect change immediately if viewFilter is active
    setProspects(prev => prev.map(p => {
        if (p.id === prospect.id) return { ...p, estado: 'Contactado' };
        return p;
    }));

    window.open(url, 'HumanFlowWhatsApp');
    addNotification("Abriendo WhatsApp... 🚀", "success");
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

  // --- Views ---

  if (state.step === 'connect') {
    return (
      <>
        <ConnectScreen onFileSelect={handleFileSelect} isLoading={state.isLoading} />
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

  // Dashboard View
  const variableKeys = prospects.length > 0 
    ? Object.keys(prospects[0]).filter(k => k !== 'id') 
    : ['nombre', 'telefono'];

  return (
    <div className="min-h-screen bg-calm-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-calm-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img 
               src={state.currentUser?.logo_url || "https://konsul.digital/wp-content/uploads/2025/07/Logo-original-e1751717849441.png"}
               alt="Logo" 
               className="h-8 w-auto object-contain"
             />
             <div className="h-6 w-px bg-calm-200 mx-1"></div>
             <span className="font-black text-calm-800 hidden sm:inline text-lg tracking-tight">
               {state.currentUser?.company_name || APP_NAME}
             </span>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs text-calm-400 font-mono bg-calm-50 px-2 py-1 rounded flex items-center gap-1 font-medium">
              <span className={`w-2 h-2 rounded-full ${NeonService.isConnected() ? 'bg-green-400' : 'bg-orange-400'}`}></span>
              {state.currentUser?.name || state.currentUser?.email}
              {state.currentUser?.plan && (
                 <span className="ml-1 px-1 bg-primary-100 text-primary-700 rounded text-[10px] uppercase">
                   {state.currentUser.plan}
                 </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        <DashboardStats 
            total={stats.total} 
            pending={stats.pending} 
            sentSession={stats.sessionSentCount} 
            contactedTotal={stats.contactedTotal}
        />

        {/* Navigation Tabs (Main) */}
        <div className="flex justify-center mb-10 mt-8">
          <div className="bg-calm-100/80 p-1.5 rounded-2xl flex w-full max-w-md shadow-inner border border-calm-200/50 relative">
            
            <button 
              onClick={() => setActiveTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 ${
                activeTab === 'list' 
                  ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5 transform scale-[1.02]' 
                  : 'text-calm-500 hover:text-calm-700 hover:bg-calm-200/50'
              }`}
            >
              <svg className={`w-4 h-4 ${activeTab === 'list' ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Lista ({activeTab === 'list' && viewFilter === 'active' ? stats.pending : stats.contactedTotal})
            </button>
            
            <button 
              onClick={() => setActiveTab('template')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 ${
                activeTab === 'template' 
                  ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5 transform scale-[1.02]' 
                  : 'text-calm-500 hover:text-calm-700 hover:bg-calm-200/50'
              }`}
            >
              <svg className={`w-4 h-4 ${activeTab === 'template' ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Mensaje
            </button>

          </div>
        </div>

        {/* Content Area */}
        <div className="animate-fade-in">
          {activeTab === 'list' && (
            <>
              {/* Active/Sent Sub-Filters Toggle */}
              <div className="flex items-center gap-4 mb-6">
                 <div className="flex p-1 bg-calm-100 rounded-xl">
                    <button 
                        onClick={() => setViewFilter('active')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-200 ${
                            viewFilter === 'active' 
                            ? 'bg-white text-calm-800 shadow-sm' 
                            : 'text-calm-400 hover:text-calm-600'
                        }`}
                    >
                        Pendientes
                    </button>
                    <button 
                        onClick={() => setViewFilter('sent')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-200 ${
                            viewFilter === 'sent' 
                            ? 'bg-white text-success-600 shadow-sm' 
                            : 'text-calm-400 hover:text-calm-600'
                        }`}
                    >
                        Enviados / Historial
                    </button>
                 </div>
                 
                 {/* Count Badge */}
                 <span className="text-xs font-bold text-calm-400 bg-white px-3 py-1.5 rounded-lg border border-calm-100">
                    Mostrando: {displayProspects.length}
                 </span>
              </div>

              {/* Dynamic Filter Bar */}
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
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-calm-300">
                  <p className="font-black text-xl text-calm-500">
                      {viewFilter === 'active' ? '¡Estás al día! 🎉' : 'Aún no hay mensajes enviados.'}
                  </p>
                  <p className="text-sm text-calm-400 mt-2 font-medium">
                      {viewFilter === 'active' 
                        ? 'No hay prospectos pendientes con los filtros actuales.' 
                        : 'Comienza a contactar para ver tu historial aquí.'}
                  </p>
                  {Object.keys(state.activeFilters).length > 0 && (
                     <button onClick={handleClearFilters} className="mt-4 text-primary-600 text-sm font-bold hover:underline">
                         Limpiar filtros de columnas
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
            <div className="max-w-5xl mx-auto">
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