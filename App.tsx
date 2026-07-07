import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ConnectScreen } from './components/ConnectScreen';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { TemplateEditor } from './components/TemplateEditor';
import { ProspectCard } from './components/ProspectCard';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { ToastContainer } from './components/Toast';
import { CampaignsDashboard } from './components/CampaignsDashboard';
import { LeadsHubUpsell } from './components/LeadsHubUpsell';
import { PaywallModal } from './components/PaywallModal';
import { DataService } from './services/dataService';
import { NeonService } from './services/neon';
import { AppState, Notification, Prospect, Template, ColumnMapping, User } from './types';
import { APP_NAME } from './constants';
import { AnimatedDock } from './components/ui/animated-dock';
import { Banner } from './components/ui/banner';
import { ExpandableTabs } from './components/ui/expandable-tabs';
import { Users, MessageSquare, BarChart3, Zap } from 'lucide-react';

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
    currentFilename: '',
    globalSentCount: 0
  });

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      const email = savedSession ? JSON.parse(savedSession)?.email : 'guest';
      const saved = localStorage.getItem(`hf_sent_ids_${email || 'guest'}`);
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids)) return new Set(ids);
      }
    } catch (e) {
      console.error("Error loading sent IDs from localStorage", e);
    }
    return new Set();
  });

  // Persist sentIds to localStorage
  useEffect(() => {
    const email = state.currentUser?.email || 'guest';
    localStorage.setItem(`hf_sent_ids_${email}`, JSON.stringify(Array.from(sentIds)));
  }, [sentIds, state.currentUser?.email]);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'template' | 'campaigns' | 'automate'>('list');
  const [viewFilter, setViewFilter] = useState<'active' | 'sent'>('active');

  // Load resources and check session on mount
  useEffect(() => {
    // 1. Load Templates
    const tpls = DataService.getTemplates();
    setTemplates(tpls);
    if (tpls.length > 0) setSelectedTemplateId(tpls[0].id);
    
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
        let initialCount = 0;
        const saved = localStorage.getItem(`hf_sent_ids_${user.email || 'guest'}`);
        if (saved) {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) {
            initialCount = ids.length;
          }
        }
        setState(prev => ({ ...prev, currentUser: user, step: 'dashboard', globalSentCount: initialCount }));
        
        if (NeonService.isConnected() && user.email) {
          NeonService.getSentCount(user.email).then(count => {
            setState(prev => ({ ...prev, globalSentCount: Math.max(count, initialCount) }));
          }).catch(console.error);
        }
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Synchronize state with URL Hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      
      // If user is NOT logged in:
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (!savedSession) {
        if (hash !== '#home' && hash !== '#login' && hash !== '#connect') {
          window.location.hash = '#home';
          return;
        }
        setState(prev => {
          if (prev.step !== 'connect') {
            return { ...prev, step: 'connect' };
          }
          return prev;
        });
        return;
      }

      // If user IS logged in:
      if (hash === '#home' || hash === '#login' || hash === '#connect') {
        window.location.hash = '#dashboard';
        return;
      }

      if (hash === '#dashboard') {
        setState(prev => {
          if (prev.step !== 'dashboard') {
            return { ...prev, step: 'dashboard' };
          }
          return prev;
        });
        setActiveTab('list');
      } else if (hash === '#templates') {
        setState(prev => {
          if (prev.step !== 'dashboard') {
            return { ...prev, step: 'dashboard' };
          }
          return prev;
        });
        setActiveTab('template');
      } else if (hash === '#campaigns') {
        setState(prev => {
          if (prev.step !== 'dashboard') {
            return { ...prev, step: 'dashboard' };
          }
          return prev;
        });
        setActiveTab('campaigns');
      } else if (hash === '#automate') {
        setState(prev => {
          if (prev.step !== 'dashboard') {
            return { ...prev, step: 'dashboard' };
          }
          return prev;
        });
        setActiveTab('automate');
      } else if (hash === '#configure') {
        setState(prev => {
          if (prev.step !== 'configure') {
            if (prev.workbook) {
              return { ...prev, step: 'configure' };
            } else {
              window.location.hash = '#dashboard';
            }
          }
          return prev;
        });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [state.workbook]);

  const addNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(`hf_sent_ids_${state.currentUser?.email || 'guest'}`);
    setState(prev => ({
      ...prev,
      currentUser: null,
      step: 'connect',
      workbook: null
    }));
    setSentIds(new Set());
    window.location.hash = '#home';
    addNotification("Sesión cerrada correctamente", "info");
  };
  // STRICT LOGIN HANDLER
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
          if (!NeonService.isConnected()) {
              addNotification("Error: No hay conexión a la base de datos.", "error");
              setState(prev => ({ ...prev, isLoading: false }));
              return false;
          }

          const fetchedProfile = await NeonService.loginUser(email, password);
          
          if (fetchedProfile) {
              localStorage.setItem(SESSION_KEY, JSON.stringify(fetchedProfile));
              setState(prev => ({ ...prev, currentUser: fetchedProfile, step: 'dashboard', isLoading: false }));
              window.location.hash = '#dashboard';
              addNotification(`¡Bienvenido, ${fetchedProfile.name || email}! 👋`, "success");
              
              // Microsoft Clarity Identify
              if (typeof window !== 'undefined' && (window as any).clarity) {
                  (window as any).clarity("identify", email);
                  (window as any).clarity("set", "user_type", fetchedProfile.plan || 'free');
                  if (fetchedProfile.name) {
                      (window as any).clarity("set", "name", fetchedProfile.name);
                  }
              }

              // Google Analytics Event
              if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'login', {
                      'method': 'credentials',
                      'user_email': email,
                      'user_plan': fetchedProfile.plan || 'free'
                  });
                  // Set user properties
                  (window as any).gtag('set', 'user_properties', {
                      'user_type': fetchedProfile.plan || 'free'
                  });
              }

              return true;
          } else {
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




  // GUEST START HANDLER
  const handleGuestStart = async (email: string): Promise<boolean> => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
          const result = await NeonService.registerGuest(email);
          if (result.success && result.user) {
              const sentCount = await NeonService.getSentCount(email);
              localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
              setState(prev => ({ 
                  ...prev, 
                  currentUser: result.user!, 
                  step: 'dashboard',
                  globalSentCount: sentCount,
                  isLoading: false 
              }));
              window.location.hash = '#dashboard';
              addNotification("¡Modo de prueba activado! 🚀", "success");
              
              // Microsoft Clarity Identify for Guest/Free Trial
              if (typeof window !== 'undefined' && (window as any).clarity) {
                  (window as any).clarity("identify", email);
                  (window as any).clarity("set", "user_type", "guest_free_trial");
              }

              // Google Analytics Event for Free Trial
              if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'sign_up', {
                      'method': 'free_trial',
                      'user_email': email
                  });
                  (window as any).gtag('set', 'user_properties', {
                      'user_type': 'guest_free_trial'
                  });
              }

              return true;
          } else {
              addNotification(result.error || "Error al iniciar prueba", "error");
              setState(prev => ({ ...prev, isLoading: false }));
              return false;
          }
      } catch (error) {
          addNotification("Error de conexión.", "error");
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
          setActiveTab('list');
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
        setSentIds(new Set());
        localStorage.removeItem(`hf_sent_ids_${state.currentUser?.email || 'guest'}`);
        setState(prev => ({ 
          ...prev, 
          step: 'configure',
          workbook: result.data!.workbook,
          sheetTabs: result.data!.sheets,
          isLoading: false 
        }));
        window.location.hash = '#configure';
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

  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [isBurstMode, setIsBurstMode] = useState<boolean>(true);

  // Detect mobile screen to disable burst mode
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setIsBurstMode(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-select the first prospect in the displayed list if none or invalid is selected
  useEffect(() => {
    if (displayProspects.length > 0) {
      const exists = displayProspects.some(p => p.id === selectedProspectId);
      if (!exists) {
        setSelectedProspectId(displayProspects[0].id);
      }
    } else {
      setSelectedProspectId(null);
    }
  }, [displayProspects, selectedProspectId]);

  const scrollToSelectedCard = (id: string) => {
    setTimeout(() => {
      const element = document.getElementById(`card-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.step !== 'dashboard' || activeTab !== 'list' || displayProspects.length === 0) {
        return;
      }

      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'SELECT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const currentIndex = displayProspects.findIndex(p => p.id === selectedProspectId);

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % displayProspects.length;
        const nextId = displayProspects[nextIndex].id;
        setSelectedProspectId(nextId);
        scrollToSelectedCard(nextId);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + displayProspects.length) % displayProspects.length;
        const prevId = displayProspects[prevIndex].id;
        setSelectedProspectId(prevId);
        scrollToSelectedCard(prevId);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedProspectId) {
          const currentProspect = displayProspects.find(p => p.id === selectedProspectId);
          if (currentProspect) {
            handleSendMessage(currentProspect);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.step, activeTab, displayProspects, selectedProspectId]);

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
    window.location.hash = '#dashboard';
  };

  const handleSaveTemplates = (updated: Template[]) => {
    setTemplates(updated);
    DataService.saveTemplates(updated);
    addNotification("Plantillas actualizadas ✍️");
  };

  const handleSendMessage = (prospect: Prospect) => {
    // Check Limits for Guests/Free Users
    if (state.currentUser?.plan !== 'pro') {
        if (state.globalSentCount >= 10 || sentIds.size >= 10) {
            setIsPaywallOpen(true);
            return;
        }
    }

    const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
    let msg = activeTemplate ? activeTemplate.content : '';
    
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

    // Increment local counter and check emotional milestones
    setState(prev => {
        const newCount = prev.globalSentCount + 1;
        if (prev.currentUser?.plan !== 'pro') {
            if (newCount === 5) {
                setTimeout(() => addNotification("¡Excelente ritmo! Te quedan 5 envíos gratuitos.", "info"), 1000);
            }
        }
        return { ...prev, globalSentCount: newCount };
    });

    setProspects(prev => prev.map(p => {
        if (p.id === prospect.id) return { ...p, estado: 'Contactado' };
        return p;
    }));

    // If burst mode is on, advance selection automatically to the next pending prospect
    if (isBurstMode) {
      const currentIndex = displayProspects.findIndex(p => p.id === prospect.id);
      const remainingProspects = displayProspects.filter(p => p.id !== prospect.id);
      if (remainingProspects.length > 0) {
        const nextIndex = currentIndex < displayProspects.length - 1 ? currentIndex : 0;
        const nextProspect = remainingProspects[Math.min(nextIndex, remainingProspects.length - 1)];
        if (nextProspect) {
          setSelectedProspectId(nextProspect.id);
          scrollToSelectedCard(nextProspect.id);
        }
      }
    }

    window.open(url, 'ReactivaLeadsWhatsApp');
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

  const handleExportExcel = () => {
    if (prospects.length === 0) return;
    
    // Prepare data (remove unnecessary fields if needed, but returning all is usually better)
    const worksheet = XLSX.utils.json_to_sheet(prospects);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prospectos");
    
    const filename = `Resultados_${state.currentFilename || 'export'}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    addNotification(`Exportado como ${filename}`, "success");
  };

  // --- RENDERING ---

  const contactedCount = displayProspects.filter(p => {
      const est = (p.estado || '').toLowerCase();
      const dbContacted = est.includes('contactado') || est.includes('éxito') || est.includes('cliente') || est.includes('ganado');
      const localContacted = sentIds.has(p.id);
      return dbContacted || localContacted;
  }).length;

  const isLimitReached = (state.currentUser?.plan !== 'pro') && (state.globalSentCount >= 10 || sentIds.size >= 10 || contactedCount >= 10);

  if (state.currentUser && isLimitReached) {
    return (
      <>
        <PaywallModal 
            isOpen={true}
            onClose={() => setIsPaywallOpen(false)}
            currentUser={state.currentUser}
            onUpgradeSuccess={(updatedUser) => {
                setState(prev => ({ ...prev, currentUser: updatedUser }));
                localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
            }}
        />
        <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      </>
    );
  }

  if (state.step === 'connect') {
    return (
      <>
        <ConnectScreen 
            onFileSelect={handleFileSelect}
            onLogin={handleLogin}
            onGuestStart={handleGuestStart}
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
      <input 
        type="file" 
        id="dashboard-file-input"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
        accept=".xlsx, .xls, .csv"
        disabled={state.isLoading}
      />
      <header className="bg-white border-b border-secondary-100 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-default">
             <div className="relative">
                <img 
                  src={state.currentUser?.logo_url || "https://konsul.digital/images/Konsul%20logo%20general.png"}
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

      <Banner
        variant="rainbow"
        className="w-full text-center relative border-b border-secondary-100"
        height="3.5rem"
      >
        <span className="flex items-center gap-2 justify-center text-xs md:text-sm font-bold text-secondary-800">
          🚀 <strong className="text-secondary-900 font-black">¿Listo para automatizar?</strong> Pasa al siguiente nivel integrando la API oficial de WhatsApp con <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-extrabold">LeadsHub</span>
          <button 
            onClick={() => window.open('https://agentes.konsul.digital/register', '_blank')}
            className="ml-3 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-[10px] md:text-xs font-black shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            Saber Más ➔
          </button>
        </span>
      </Banner>

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
            <ExpandableTabs
              className="hidden md:flex"
              activeTabId={activeTab}
              onChangeTab={(id) => {
                const tab = id as any;
                setActiveTab(tab);
                if (tab === 'list') window.location.hash = '#dashboard';
                else if (tab === 'template') window.location.hash = '#templates';
                else if (tab === 'campaigns') window.location.hash = '#campaigns';
                else if (tab === 'automate') window.location.hash = '#automate';
              }}
              tabs={[
                {
                  id: "list",
                  icon: Users,
                  label: "Contactos",
                  color: "bg-primary-600",
                },
                {
                  id: "template",
                  icon: MessageSquare,
                  label: "Plantillas",
                  color: "bg-secondary-800",
                },
                {
                  id: "campaigns",
                  icon: BarChart3,
                  label: "Campañas",
                  color: "bg-secondary-800",
                },
                {
                  id: "automate",
                  icon: Zap,
                  label: "Automatizar (PRO)",
                  color: "bg-gradient-to-r from-indigo-500 to-purple-600",
                },
              ]}
            />
            
            {activeTab === 'list' && (
                <div className="flex gap-4">
                  <select 
                    value={selectedTemplateId} 
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="px-4 py-2 bg-white border border-secondary-200 text-secondary-800 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 font-bold outline-none shadow-sm"
                  >
                    {templates.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                    ))}
                  </select>
                   <button 
                    onClick={handleExportExcel} 
                    className="px-4 py-2 bg-white border border-secondary-200 text-secondary-600 rounded-xl font-bold text-sm hover:text-secondary-800 hover:border-secondary-300 hover:bg-secondary-50/50 transition-all flex items-center gap-2 shadow-sm active:scale-97 select-none outline-none"
                  >
                      <span>⬇️</span> Exportar Excel
                  </button>
                </div>
            )}
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
                  
                  <div className="flex items-center gap-4">
                     <label className="hidden md:flex items-center gap-2 cursor-pointer select-none">
                       <span className="text-xs font-black text-secondary-500 uppercase tracking-wider">⚡ Modo Ráfaga</span>
                       <div className="relative text-left">
                         <input 
                           type="checkbox" 
                           className="sr-only" 
                           checked={isBurstMode}
                           onChange={() => setIsBurstMode(!isBurstMode)}
                         />
                         <div className={`w-9 h-5 rounded-full transition-colors ${isBurstMode ? 'bg-primary-500' : 'bg-secondary-200'}`}></div>
                         <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${isBurstMode ? 'translate-x-4' : ''}`}></div>
                       </div>
                     </label>
                     
                     <span className="text-xs font-bold text-secondary-400 bg-secondary-50 px-3 py-1.5 rounded-lg border border-secondary-100">
                        {displayProspects.length} registros visibles
                     </span>
                  </div>
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
                     {prospects.length === 0 ? '📁' : (viewFilter === 'active' ? '🎉' : '📭')}
                  </div>
                  <p className="font-black text-xl text-secondary-600">
                      {prospects.length === 0 
                        ? 'No hay base de datos activa' 
                        : (viewFilter === 'active' ? '¡Todo limpio!' : 'Nada por aquí aún')}
                  </p>
                  <p className="text-sm text-secondary-400 mt-2 font-medium max-w-xs text-center">
                      {prospects.length === 0 
                        ? 'Para comenzar a prospectar, sube un archivo Excel o retoma una campaña anterior.' 
                        : (viewFilter === 'active' 
                          ? 'Has gestionado todos los prospectos pendientes bajo estos filtros.' 
                          : 'Tu historial de mensajes enviados aparecerá aquí.')}
                  </p>
                  {prospects.length === 0 ? (
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => document.getElementById('dashboard-file-input')?.click()}
                        className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xs shadow-md shadow-primary-500/10 transition-colors"
                      >
                        Subir Archivo 📁
                      </button>
                      <button 
                        onClick={() => setActiveTab('campaigns')}
                        className="px-4 py-2.5 bg-secondary-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md transition-colors"
                      >
                        Ir a Mis Campañas ➔
                      </button>
                    </div>
                  ) : (
                    Object.keys(state.activeFilters).length > 0 && (
                       <button onClick={handleClearFilters} className="mt-6 text-primary-600 text-sm font-bold hover:underline">
                           Limpiar filtros activos
                       </button>
                    )
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
                        isSelected={p.id === selectedProspectId}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'template' && (
            <div className="max-w-5xl mx-auto pt-4">
              <TemplateEditor 
                templates={templates} 
                onSave={handleSaveTemplates}
                variables={variableKeys}
                sampleProspect={prospects[0]} 
              />
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="max-w-5xl mx-auto pt-4">
              <CampaignsDashboard 
                currentUser={state.currentUser}
                onResumeSession={handleResumeSession}
              />
            </div>
          )}

          {activeTab === 'automate' && (
            <div className="max-w-5xl mx-auto pt-4">
              <LeadsHubUpsell />
            </div>
          )}
        </div>
      </main>

      {state.currentUser && (
          <PaywallModal 
              isOpen={isPaywallOpen || isLimitReached}
              onClose={() => setIsPaywallOpen(false)}
              currentUser={state.currentUser}
              onUpgradeSuccess={(updatedUser) => {
                  setState(prev => ({ ...prev, currentUser: updatedUser }));
                  localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
              }}
          />
      )}

      {/* Floating keyboard hint bar */}
      {state.step === 'dashboard' && activeTab === 'list' && displayProspects.length > 0 && (
        <div className="hidden md:flex fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-secondary-900/90 backdrop-blur-md text-white py-3 px-6 rounded-full shadow-2xl border border-secondary-800 items-center gap-4 text-xs font-medium z-40 transition-all duration-300">
          <span className="flex items-center gap-1.5 text-primary-400">
            <span className="bg-primary-500/20 text-primary-300 border border-primary-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">Enter</span>
            <span>Enviar</span>
          </span>
          <span className="text-secondary-600">|</span>
          <span className="flex items-center gap-1.5 text-secondary-300">
            <span className="bg-secondary-800 border border-secondary-750 px-1.5 py-0.5 rounded text-[10px] font-mono">↑ ↓</span>
            <span>Navegar</span>
          </span>
          <span className="text-secondary-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isBurstMode ? 'bg-primary-400 animate-pulse' : 'bg-secondary-500'}`}></span>
            <span className="text-secondary-300">Modo Ráfaga: <strong className={isBurstMode ? 'text-primary-400' : 'text-secondary-400'}>{isBurstMode ? 'ACTIVO' : 'DESACTIVADO'}</strong></span>
          </span>
        </div>
      )}

      {/* Mobile Bottom Dock Menu */}
      {state.step === 'dashboard' && (
        <div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto">
          <AnimatedDock 
            items={[
              {
                label: "Contactos",
                Icon: <Users size={20} />,
                onClick: () => {
                  setActiveTab('list');
                  window.location.hash = '#dashboard';
                },
                isActive: activeTab === 'list'
              },
              {
                label: "Plantillas",
                Icon: <MessageSquare size={20} />,
                onClick: () => {
                  setActiveTab('template');
                  window.location.hash = '#templates';
                },
                isActive: activeTab === 'template'
              },
              {
                label: "Campañas",
                Icon: <BarChart3 size={20} />,
                onClick: () => {
                  setActiveTab('campaigns');
                  window.location.hash = '#campaigns';
                },
                isActive: activeTab === 'campaigns'
              },
              {
                label: "Automatizar",
                Icon: <Zap size={20} />,
                onClick: () => {
                  setActiveTab('automate');
                  window.location.hash = '#automate';
                },
                isActive: activeTab === 'automate'
              }
            ]}
          />
        </div>
      )}

      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
    </div>
  );
};

export default App;