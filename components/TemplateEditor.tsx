import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { DEFAULT_VARIABLES } from '../constants';
import { Prospect, Template } from '../types';

interface TemplateEditorProps {
  templates: Template[];
  onSave: (templates: Template[]) => void;
  variables?: string[];
  sampleProspect?: Prospect;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ 
  templates, 
  onSave,
  variables = DEFAULT_VARIABLES,
  sampleProspect
}) => {
  const [localTemplates, setLocalTemplates] = useState<Template[]>(templates);
  const [activeIndex, setActiveIndex] = useState(0);
  const [content, setContent] = useState(templates[0]?.content || '');
  const [isSaved, setIsSaved] = useState(true);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    setLocalTemplates(templates);
    if (!templates[activeIndex]) {
        setActiveIndex(0);
        setContent(templates[0]?.content || '');
    }
  }, [templates]);

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
    const updated = [...localTemplates];
    updated[activeIndex] = { ...updated[activeIndex], content };
    setLocalTemplates(updated);
    onSave(updated);
    setIsSaved(true);
  };

  const handleAddTemplate = () => {
    const newTemplate: Template = {
        id: crypto.randomUUID(),
        name: `Plantilla ${localTemplates.length + 1}`,
        content: 'Hola {{nombre}}, '
    };
    const updated = [...localTemplates, newTemplate];
    setLocalTemplates(updated);
    setActiveIndex(updated.length - 1);
    setContent(newTemplate.content);
    onSave(updated);
  };

  const handleDeleteTemplate = () => {
    if (localTemplates.length <= 1) return;
    const updated = localTemplates.filter((_, i) => i !== activeIndex);
    setLocalTemplates(updated);
    setActiveIndex(0);
    setContent(updated[0].content);
    onSave(updated);
  };

  const handleRename = (newName: string) => {
      const updated = [...localTemplates];
      updated[activeIndex] = { ...updated[activeIndex], name: newName };
      setLocalTemplates(updated);
      onSave(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      
      {/* Main Editor Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                    <select 
                        value={activeIndex}
                        onChange={(e) => {
                            setActiveIndex(Number(e.target.value));
                            setContent(localTemplates[Number(e.target.value)].content);
                            setIsSaved(true);
                        }}
                        className="bg-secondary-50 border border-secondary-200 text-secondary-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-bold outline-none"
                    >
                        {localTemplates.map((tpl, i) => (
                            <option key={tpl.id} value={i}>{tpl.name}</option>
                        ))}
                    </select>
                    <button onClick={handleAddTemplate} className="bg-primary-50 text-primary-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors">
                        + Nueva
                    </button>
                    {localTemplates.length > 1 && (
                        <button onClick={handleDeleteTemplate} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors" title="Eliminar plantilla">
                            🗑️
                        </button>
                    )}
                </div>
                <input 
                    type="text" 
                    value={localTemplates[activeIndex]?.name || ''}
                    onChange={(e) => handleRename(e.target.value)}
                    className="text-lg font-black text-secondary-800 tracking-tight bg-transparent border-none p-0 focus:ring-0 w-full outline-none"
                    placeholder="Nombre de plantilla"
                />
             </div>
             
            <span className={`text-xs px-2 py-1 rounded-full font-bold transition-colors whitespace-nowrap ${isSaved ? 'text-primary-600 bg-primary-50' : 'text-orange-500 bg-orange-50'}`}>
              {isSaved ? 'Guardado' : 'Cambios sin guardar'}
            </span>
          </div>

          <textarea
            value={content}
            onChange={handleChange}
            className="w-full h-48 p-5 bg-secondary-50 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none text-secondary-800 resize-none text-sm leading-relaxed font-normal"
            placeholder="Hola {{nombre}}, me gustaría hablar sobre..."
          />

          <div className="mt-4 flex justify-between items-center">
            <p className="text-xs text-secondary-400 font-medium">
              Usa las variables de la derecha para personalizar.
            </p>
            <Button variant="primary" onClick={handleSave} disabled={isSaved} className="min-w-[120px] font-bold">
              {isSaved ? 'Listo' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-2xl border border-primary-100 shadow-sm">
          <h3 className="text-xs font-black text-primary-400 uppercase tracking-wider mb-3">Vista Previa (Primer Prospecto)</h3>
          <div className="bg-white p-5 rounded-xl rounded-tl-none border border-primary-50 shadow-sm relative">
             {/* WhatsApp Speech Bubble Tail */}
             <div className="absolute -top-2 left-0 w-4 h-4 bg-white border-t border-l border-primary-50 transform rotate-45"></div>
             <p className="text-sm text-secondary-700 whitespace-pre-wrap leading-relaxed font-normal">
               {preview}
             </p>
          </div>
        </div>
      </div>

      {/* Data Structure / Variables Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 sticky top-24">
          <div className="mb-5">
            <h3 className="font-black text-secondary-800 flex items-center gap-2 text-lg tracking-tight">
              <span className="text-xl">📊</span> Estructura
            </h3>
            <p className="text-xs text-secondary-500 mt-1 font-medium">
              Columnas detectadas en tu hoja.
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
                  className="w-full text-left group hover:bg-secondary-50 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-secondary-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded font-mono group-hover:bg-white group-hover:shadow-sm">
                      {`{{${v}}}`}
                    </span>
                    <span className="text-[10px] text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      Insertar +
                    </span>
                  </div>
                  {exampleValue && (
                    <p className="text-[11px] text-secondary-500 mt-1 truncate pl-1 border-l-2 border-secondary-200 ml-1 font-medium">
                      Ej: <span className="italic text-secondary-600 font-normal">{exampleValue}</span>
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-5 pt-5 border-t border-secondary-100">
             <div className="text-[10px] text-secondary-500 bg-secondary-50 p-3 rounded-lg font-medium leading-relaxed">
               💡 <strong>Tip:</strong> Si agregas nuevas columnas en Google Sheets, recarga la página para verlas aquí.
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};