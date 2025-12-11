import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { DEFAULT_VARIABLES } from '../constants';
import { Prospect } from '../types';

interface TemplateEditorProps {
  initialTemplate: string;
  onSave: (template: string) => void;
  variables?: string[];
  sampleProspect?: Prospect;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ 
  initialTemplate, 
  onSave,
  variables = DEFAULT_VARIABLES,
  sampleProspect
}) => {
  const [content, setContent] = useState(initialTemplate);
  const [isSaved, setIsSaved] = useState(true);
  const [preview, setPreview] = useState('');

  // Update preview whenever content or sample data changes
  useEffect(() => {
    if (!sampleProspect) {
      setPreview(content);
      return;
    }

    let msg = content;
    msg = msg.replace(/{{(.*?)}}/g, (match, p1) => {
      const key = p1.trim();
      // @ts-ignore - dynamic access
      const value = sampleProspect[key];
      return value ? String(value) : match;
    });
    setPreview(msg);
  }, [content, sampleProspect]);

  const handleInsertVariable = (variable: string) => {
    setContent(prev => `${prev} {{${variable}}} `);
    setIsSaved(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(content);
    setIsSaved(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      
      {/* Main Editor Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-calm-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-calm-800">Diseña tu mensaje</h2>
            <span className={`text-xs px-2 py-1 rounded-full transition-colors ${isSaved ? 'text-success-600 bg-success-50' : 'text-orange-500 bg-orange-50'}`}>
              {isSaved ? 'Guardado' : 'Cambios sin guardar'}
            </span>
          </div>

          <textarea
            value={content}
            onChange={handleChange}
            className="w-full h-48 p-4 bg-calm-50 border border-calm-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none text-calm-800 resize-none text-sm leading-relaxed font-sans"
            placeholder="Hola {{nombre}}, me gustaría hablar sobre..."
          />

          <div className="mt-4 flex justify-between items-center">
            <p className="text-xs text-calm-400">
              Usa las variables de la derecha para personalizar.
            </p>
            <Button variant="primary" onClick={handleSave} disabled={isSaved} className="min-w-[120px]">
              {isSaved ? 'Listo' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Vista Previa (Primer Prospecto)</h3>
          <div className="bg-white p-4 rounded-xl rounded-tl-none border border-indigo-50 shadow-sm relative">
             {/* WhatsApp Speech Bubble Tail */}
             <div className="absolute -top-2 left-0 w-4 h-4 bg-white border-t border-l border-indigo-50 transform rotate-45"></div>
             <p className="text-sm text-calm-700 whitespace-pre-wrap leading-relaxed">
               {preview}
             </p>
          </div>
        </div>
      </div>

      {/* Data Structure / Variables Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-calm-100 sticky top-24">
          <div className="mb-4">
            <h3 className="font-medium text-calm-800 flex items-center gap-2">
              <span className="text-lg">📊</span> Estructura de Datos
            </h3>
            <p className="text-xs text-calm-500 mt-1">
              Columnas detectadas en tu hoja. Haz clic para insertar.
            </p>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {variables.map(v => {
              // @ts-ignore
              const exampleValue = sampleProspect ? sampleProspect[v] : '';
              
              return (
                <button
                  key={v}
                  onClick={() => handleInsertVariable(v)}
                  className="w-full text-left group hover:bg-calm-50 p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-calm-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded font-mono group-hover:bg-white group-hover:shadow-sm">
                      {`{{${v}}}`}
                    </span>
                    <span className="text-[10px] text-calm-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Insertar +
                    </span>
                  </div>
                  {exampleValue && (
                    <p className="text-[11px] text-calm-500 mt-1 truncate pl-1 border-l-2 border-calm-200 ml-1">
                      Ej: <span className="italic text-calm-600">{exampleValue}</span>
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-calm-100">
             <div className="text-[10px] text-calm-400 bg-calm-50 p-2 rounded-lg">
               💡 <strong>Tip:</strong> Si agregas nuevas columnas en Google Sheets, recarga la página para verlas aquí.
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};