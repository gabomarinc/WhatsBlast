import React, { useState } from 'react';

export const LeadsHubUpsell: React.FC = () => {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'success'>('idle');

  const handleConnect = () => {
    setConnectionState('connecting');
    // Simulate connection delay
    setTimeout(() => {
      setConnectionState('success');
    }, 2500);
  };

  return (
    <div className="animate-slide-up max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl border border-slate-800">
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500 blur-[120px] opacity-20"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-500 blur-[120px] opacity-20"></div>
          <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-500 blur-[100px] opacity-20"></div>
        </div>

        <div className="relative z-10 p-10 md:p-16">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-indigo-300 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              HumanFlow x LeadsHub
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
              Lleva tu prospección al <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">
                Siguiente Nivel
              </span>
            </h2>
            
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              ¿Cansado de hacer clic en "Enviar" uno por uno? Conecta tu cuenta con <strong>LeadsHub</strong> y desbloquea el poder de la automatización total con Inteligencia Artificial.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Feature 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-2xl mb-5 shadow-lg shadow-green-500/20">
                💬
              </div>
              <h3 className="text-lg font-black mb-2 text-white">API Oficial META</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Envíos masivos 100% seguros. Olvídate de los bloqueos y envía cientos de mensajes con un solo clic.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-2xl mb-5 shadow-lg shadow-indigo-500/20">
                🤖
              </div>
              <h3 className="text-lg font-black mb-2 text-white">Agentes de IA</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Tus leads responden y nuestra IA los atiende 24/7, respondiendo dudas y perfilando prospectos en automático.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-2xl mb-5 shadow-lg shadow-blue-500/20">
                📊
              </div>
              <h3 className="text-lg font-black mb-2 text-white">CRM Inteligente</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Categoriza, etiqueta y programa seguimientos sin esfuerzo. Mantén el control total de tu embudo de ventas.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden">
             {/* CTA Glow */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-indigo-500/30 blur-[50px] pointer-events-none"></div>
             
             {connectionState === 'idle' && (
                <>
                  <h4 className="text-xl font-black mb-2 relative z-10">¿Listo para escalar?</h4>
                  <p className="text-sm text-slate-400 mb-6 relative z-10">Conecta tu cuenta en un solo clic y descubre la plataforma completa.</p>
                  
                  <button 
                    onClick={handleConnect}
                    className="relative z-10 bg-white text-slate-900 px-8 py-4 rounded-xl font-black text-lg hover:scale-105 transition-transform duration-300 shadow-xl shadow-white/10 flex items-center gap-3 mx-auto"
                  >
                    <span>🚀</span> Conectar con LeadsHub
                  </button>
                </>
             )}

             {connectionState === 'connecting' && (
                <div className="flex flex-col items-center justify-center py-4 relative z-10">
                   <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
                   <p className="text-indigo-300 font-bold animate-pulse">Preparando tu entorno en LeadsHub...</p>
                </div>
             )}

             {connectionState === 'success' && (
                <div className="flex flex-col items-center justify-center py-4 relative z-10 animate-fade-in">
                   <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-2xl mb-4 border border-green-500/30">
                      ✅
                   </div>
                   <h4 className="text-xl font-black text-white mb-2">¡Solicitud Registrada!</h4>
                   <p className="text-sm text-slate-400 max-w-sm">
                      Tu cuenta está lista para ser migrada. Un especialista de LeadsHub se pondrá en contacto contigo muy pronto para habilitar tu entorno.
                   </p>
                </div>
             )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
