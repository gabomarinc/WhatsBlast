import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-secondary-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-black text-secondary-900 tracking-tight mb-4">
              ReactivaLeads <span className="text-primary-500">by Kônsul</span>
            </h3>
            <p className="text-sm text-secondary-600 leading-relaxed mb-6">
              Potenciamos tus ventas a través de flujos de prospección ágiles y eficientes. 
              Diseñado para equipos que buscan resultados reales.
            </p>
          </div>

          {/* Links Column */}
          <div className="col-span-1 md:col-span-1">
            <h4 className="text-xs uppercase font-bold tracking-widest text-secondary-900 mb-4">
              Nuestra Agencia
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="https://konsul.digital/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-secondary-600 hover:text-primary-500 transition-colors">
                  Kônsul Digital (Inicio)
                </a>
              </li>
              <li>
                <a href="https://konsul.digital/servicios" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-secondary-600 hover:text-primary-500 transition-colors">
                  Nuestros Servicios
                </a>
              </li>
              <li>
                <a href="https://konsul.digital/nosotros" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-secondary-600 hover:text-primary-500 transition-colors">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="https://konsul.digital/contacto" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-secondary-600 hover:text-primary-500 transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Resources / Legal Column */}
          <div className="col-span-1 md:col-span-1">
            <h4 className="text-xs uppercase font-bold tracking-widest text-secondary-900 mb-4">
              Legal y Soporte
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:somos@konsul.digital" className="text-sm font-medium text-secondary-600 hover:text-primary-500 transition-colors">
                  Soporte Técnico
                </a>
              </li>
              <li>
                <a href="#" className="text-sm font-medium text-secondary-600 hover:text-primary-500 transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-sm font-medium text-secondary-600 hover:text-primary-500 transition-colors">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>
          
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-secondary-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-secondary-500">
            &copy; {new Date().getFullYear()} ReactivaLeads by Kônsul. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <a href="https://konsul.digital/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-secondary-400 hover:text-primary-500 transition-colors">
              www.konsul.digital
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
