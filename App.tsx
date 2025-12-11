import React, { useState, useEffect, useMemo } from 'react';
import { ConnectScreen } from './components/ConnectScreen';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { TemplateEditor } from './components/TemplateEditor';
import { ProspectCard } from './components/ProspectCard';
import { DashboardStats } from './components/DashboardStats';
import { ToastContainer } from './components/Toast';
import { DataService } from './services/dataService';
import { AppState, Notification, Prospect, Template, ColumnMapping } from './types';
import { APP_NAME } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'connect',
    isLoading: false,
    workbook: null,
    sheetTabs: [],
    selectedTab: '',
    mapping: { nameColumn: '', phoneColumn: '' }
  });

  const [prospects, setProspects] = useState<Prospect[]>([]);
  // Track IDs of prospects messaged during this session
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  
  const [template, setTemplate] = useState<Template>({ content: '' });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'template'>('list');

  // Load initial template from local storage
  useEffect(() => {
    const tpl = DataService.getTemplate();
    setTemplate(tpl);
  }, []);

  // Calculate Dashboard Metrics
  const stats = useMemo(() => {
    const total = prospects.length;
    const sessionSentCount = sentIds.size;
    
    // Count how many are marked as contacted in the sheet OR sent in this session
    const contactedTotal = prospects.filter(p => {
        const status = (p.estado || '').toLowerCase();
        const isSheetContacted = status.includes('contactado') || status.includes('éxito') || status.includes('cliente');
        const isSessionSent = sentIds.has(p.id);
        return isSheetContacted || isSessionSent;
    }).length;

    const pending = total - contactedTotal;

    return { total, pending, sessionSentCount, contactedTotal };
  }, [prospects, sentIds]);


  const addNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Step 1: Upload File -> Parse -> Go to Configure
  const handleFileSelect = async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Artificial small delay for UX so the spinner is visible
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
        addNotification("Archivo procesado correctamente 📂", "info");
      } else {
        addNotification(result.error || "Error al leer archivo", "error");
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, 800);
  };

  // Step 2: Configure -> Extract Prospects from specific sheet
  const handleConfigurationConfirm = async (tabName: string, mapping: ColumnMapping) => {
    if (!state.workbook) return;

    setState(prev => ({ ...prev, isLoading: true, selectedTab: tabName, mapping }));
    
    // Synchronous operation usually, but kept async pattern if needed later
    setTimeout(() => {
        const data = DataService.getProspects(state.workbook, tabName, mapping);
        
        setProspects(data);
        setState(prev => ({ ...prev, step: 'dashboard', isLoading: false }));
        
        if (data.length === 0) {
            addNotification("La hoja seleccionada parece vacía.", "info");
        } else {
            addNotification(`¡${data.length} prospectos listos! 🚀`, "success");
        }
    }, 500);
  };

  const handleSaveTemplate = async (content: string) => {
    setTemplate({ content });
    DataService.saveTemplate(content);
    addNotification("Plantilla guardada (Local) 🎯");
  };

  const handleSendMessage = (prospect: Prospect) => {
    let msg = template.content;
    
    // Replace variables logic
    msg = msg.replace(/{{(.*?)}}/g, (match, p1) => {
      const key = p1.trim();
      const value = prospect[key as keyof Prospect];
      return value ? String(value) : match;
    });

    const encodedMsg = encodeURIComponent(msg);
    const url = `https://wa.me/${prospect.telefono}?text=${encodedMsg}`;

    // Mark as sent in session
    setSentIds(prev => new Set(prev).add(prospect.id));

    // UX IMPROVEMENT: Use a named window target
    window.open(url, 'HumanFlowWhatsApp');
    
    addNotification("Abriendo WhatsApp... 🚀", "success");
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
    : ['nombre', 'empresa', 'telefono'];

  return (
    <div className="min-h-screen bg-calm-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-calm-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">H</div>
            <span className="font-semibold text-calm-800">{APP_NAME}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs text-calm-400 font-mono bg-calm-50 px-2 py-1 rounded flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Archivo Local / {state.selectedTab}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Dashboard Stats (Always visible in dashboard view) */}
        <DashboardStats 
            total={stats.total} 
            pending={stats.pending} 
            sentSession={stats.sessionSentCount} 
            contactedTotal={stats.contactedTotal}
        />

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-10 mt-8">
          <div className="bg-calm-100/80 p-1.5 rounded-2xl flex w-full max-w-md shadow-inner border border-calm-200/50 relative">
            
            {/* Tab 1: List */}
            <button 
              onClick={() => setActiveTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'list' 
                  ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5 transform scale-[1.02]' 
                  : 'text-calm-500 hover:text-calm-700 hover:bg-calm-200/50'
              }`}
            >
              <svg className={`w-4 h-4 ${activeTab === 'list' ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Mis Prospectos
            </button>
            
            {/* Tab 2: Template */}
            <button 
              onClick={() => setActiveTab('template')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'template' 
                  ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5 transform scale-[1.02]' 
                  : 'text-calm-500 hover:text-calm-700 hover:bg-calm-200/50'
              }`}
            >
              <svg className={`w-4 h-4 ${activeTab === 'template' ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
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
              {prospects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-calm-300">
                  <p className="text-calm-500">No hay prospectos cargados.</p>
                  <p className="text-sm text-calm-400 mt-2">Revisa que tu archivo Excel tenga datos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prospects.map(p => (
                    <ProspectCard 
                        key={p.id} 
                        prospect={p} 
                        onSend={handleSendMessage} 
                        isSentInSession={sentIds.has(p.id)}
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
                sampleProspect={prospects[0]} // Pass the first prospect for live preview
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