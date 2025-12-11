import React, { useState, useEffect } from 'react';
import { ConnectScreen } from './components/ConnectScreen';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { TemplateEditor } from './components/TemplateEditor';
import { ProspectCard } from './components/ProspectCard';
import { ToastContainer } from './components/Toast.tsx';
import { DataService } from './services/dataService';
import { AppState, Notification, Prospect, Template, ColumnMapping } from './types';
import { APP_NAME } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'connect',
    isLoading: false,
    sheetId: '',
    sheetTabs: [],
    selectedTab: '',
    mapping: { nameColumn: '', phoneColumn: '' }
  });

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [template, setTemplate] = useState<Template>({ content: '' });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'template'>('list');

  // Load initial template
  useEffect(() => {
    DataService.getTemplate().then(res => {
      if(res.success && res.data) setTemplate(res.data);
    });
  }, []);

  const addNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Step 1: Connect -> Get Tabs
  const handleConnect = async (sheetId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await DataService.getSheetTabs(sheetId);
      if (res.success && res.data) {
        setState(prev => ({ 
          ...prev, 
          step: 'configure', // Move to config step
          sheetId, 
          sheetTabs: res.data || [],
          isLoading: false 
        }));
        addNotification("Hoja conectada. Configura tus datos 🛠", "info");
      } else {
        addNotification(res.error || "No pudimos acceder a la hoja.", "error");
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (e) {
      addNotification("Error de conexión", "error");
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Step 2: Configure -> Get Prospects
  const handleConfigurationConfirm = async (tabName: string, mapping: ColumnMapping) => {
    setState(prev => ({ ...prev, isLoading: true, selectedTab: tabName, mapping }));
    
    const res = await DataService.getProspects(state.sheetId, tabName, mapping);
    
    if (res.success && res.data) {
      setProspects(res.data);
      setState(prev => ({ ...prev, step: 'dashboard', isLoading: false }));
      
      if (res.data.length === 0) {
        addNotification("La pestaña parece vacía, pero estamos conectados.", "info");
      } else {
        addNotification(`¡Cargamos ${res.data.length} prospectos! 🚀`, "success");
      }
    } else {
      addNotification(res.error || "Error al leer datos", "error");
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveTemplate = async (content: string) => {
    setTemplate({ content });
    await DataService.saveTemplate(content);
    addNotification("Plantilla guardada correctamente 🎯");
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

    window.open(url, '_blank');
    addNotification("Abriendo WhatsApp... 🚀", "success");
    
    setTimeout(() => {
        addNotification("Mensaje preparado. ¡Tú tienes el control! 💬", "info");
    }, 1500);
  };

  // --- Views ---

  if (state.step === 'connect') {
    return (
      <>
        <ConnectScreen onConnect={handleConnect} isLoading={state.isLoading} />
        <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      </>
    );
  }

  if (state.step === 'configure') {
    return (
      <>
        <ConfigurationScreen 
          sheetId={state.sheetId} 
          availableTabs={state.sheetTabs}
          isLoading={state.isLoading}
          onConfirm={handleConfigurationConfirm}
        />
        <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      </>
    );
  }

  // Dashboard View
  // Extract variable keys for suggestions (exclude internal fields)
  const variableKeys = prospects.length > 0 
    ? Object.keys(prospects[0]).filter(k => k !== 'id' && k !== 'telefono' && k !== 'estado') 
    : ['nombre', 'empresa'];

  // Add the mapped name if not present
  if (!variableKeys.includes('nombre')) variableKeys.unshift('nombre');

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
            <div className="text-xs text-calm-400 font-mono bg-calm-50 px-2 py-1 rounded">
              {state.sheetId.substring(0,6)}... / {state.selectedTab}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-6 border-b border-calm-200 mb-8">
          <button 
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'list' ? 'text-primary-600' : 'text-calm-500 hover:text-calm-700'}`}
          >
            Mis Prospectos ({prospects.length})
            {activeTab === 'list' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('template')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'template' ? 'text-primary-600' : 'text-calm-500 hover:text-calm-700'}`}
          >
            Editar Mensaje
            {activeTab === 'template' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* Content Area */}
        <div className="animate-fade-in">
          {activeTab === 'list' && (
            <>
              {prospects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-calm-300">
                  <p className="text-calm-500">No hay prospectos cargados.</p>
                  <p className="text-sm text-calm-400 mt-2">Verifica la pestaña seleccionada en tu Google Sheet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prospects.map(p => (
                    <ProspectCard key={p.id} prospect={p} onSend={handleSendMessage} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'template' && (
            <div className="max-w-2xl mx-auto">
              <TemplateEditor 
                initialTemplate={template.content} 
                onSave={handleSaveTemplate}
                variables={variableKeys}
              />
              <div className="mt-8 bg-blue-50 p-4 rounded-xl text-sm text-blue-700 flex gap-3">
                <span className="text-xl">💡</span>
                <p>
                  Recuerda: {{'{nombre}'}} se reemplazará por la columna <strong>{state.mapping.nameColumn}</strong> que seleccionaste.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
    </div>
  );
};

export default App;