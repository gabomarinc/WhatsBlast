import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-secondary-800 py-12 md:py-16 mt-auto relative z-20">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-start gap-10">
        
        {/* Brand / Info */}
        <div className="flex flex-col max-w-xs">
          <img 
            src="https://konsul.digital/images/Konsul%20logo%20general.png"
            alt="Kônsul Logo" 
            className="h-10 w-auto object-contain mb-4 self-start"
          />
          <p className="text-sm text-secondary-500 font-medium leading-relaxed">
            Potencia tus ventas y reactiva a tus prospectos con automatizaciones inteligentes y envíos orgánicos por WhatsApp.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col">
          <h4 className="text-secondary-800 font-bold uppercase tracking-wider text-sm mb-4">Nuestra Agencia</h4>
          <ul className="flex flex-col gap-3">
            <li>
              <a href="https://konsul.digital/" target="_blank" rel="noreferrer" className="text-secondary-500 hover:text-primary-500 font-medium text-sm transition-colors">
                Kônsul Digital
              </a>
            </li>
          </ul>
        </div>

        {/* Links Column: Nuestras Herramientas */}
        <div className="flex flex-col">
          <h4 className="text-secondary-800 font-bold uppercase tracking-wider text-sm mb-4">Nuestras Herramientas</h4>
          <ul className="flex flex-col gap-3">
            <li>
              <a href="https://process.konsul.digital/" target="_blank" rel="noreferrer" className="text-secondary-500 hover:text-primary-500 font-medium text-sm transition-colors">
                Process by Kônsul
              </a>
            </li>
            <li>
              <a href="https://bills.konsul.digital/" target="_blank" rel="noreferrer" className="text-secondary-500 hover:text-primary-500 font-medium text-sm transition-colors">
                Bills by Kônsul
              </a>
            </li>
            <li>
              <a href="https://kredit.konsul.digital/" target="_blank" rel="noreferrer" className="text-secondary-500 hover:text-primary-500 font-medium text-sm transition-colors">
                Kredit by Kônsul
              </a>
            </li>
            <li>
              <a href="https://agentes.konsul.digital/" target="_blank" rel="noreferrer" className="text-secondary-500 hover:text-primary-500 font-medium text-sm transition-colors">
                LeadsHUB
              </a>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col">
          <h4 className="text-secondary-800 font-bold uppercase tracking-wider text-sm mb-4">ReactivaLeads</h4>
          <ul className="flex flex-col gap-3">
            <li>
              <span className="text-secondary-500 font-medium text-sm">
                Automatización de Ventas
              </span>
            </li>
            <li>
              <span className="text-secondary-500 font-medium text-sm">
                Seguimiento por WhatsApp
              </span>
            </li>
            <li>
              <span className="text-secondary-500 font-medium text-sm">
                Gestión de Leads
              </span>
            </li>
          </ul>
        </div>

      </div>
      
      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-12 pt-8 border-t border-secondary-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs font-medium text-secondary-400">
          © {new Date().getFullYear()} ReactivaLeads by Kônsul. Todos los derechos reservados.
        </p>
        <p className="text-xs font-medium text-secondary-400">
          Made with <span className="text-red-500">❤️</span> by <a href="https://konsul.digital" target="_blank" rel="noreferrer" className="hover:text-primary-500 transition-colors font-bold">Kônsul Digital</a>
        </p>
      </div>
    </footer>
  );
};
