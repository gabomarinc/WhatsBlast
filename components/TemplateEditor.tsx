import React, { useState } from 'react';
import { Button } from './Button';
import { DEFAULT_VARIABLES } from '../constants';

interface TemplateEditorProps {
  initialTemplate: string;
  onSave: (template: string) => void;
  variables?: string[];
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ 
  initialTemplate, 
  onSave,
  variables = DEFAULT_VARIABLES
}) => {
  const [content, setContent] = useState(initialTemplate);
  const [isSaved, setIsSaved] = useState(true);

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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-calm-100 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-calm-800">Diseña tu mensaje</h2>
        <span className={`text-xs px-2 py-1 rounded-full transition-colors ${isSaved ? 'text-success-600 bg-success-50' : 'text-orange-500 bg-orange-50'}`}>
          {isSaved ? 'Guardado' : 'Cambios sin guardar'}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs text-calm-500 mb-2 uppercase tracking-wide font-medium">Variables disponibles</p>
        <div className="flex flex-wrap gap-2">
          {variables.map(v => (
            <button
              key={v}
              onClick={() => handleInsertVariable(v)}
              className="px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-lg hover:bg-primary-100 transition-colors border border-primary-100 active:scale-95"
            >
              + {v}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        className="w-full h-40 p-4 bg-calm-50 border border-calm-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none text-calm-800 resize-none text-sm leading-relaxed"
        placeholder="Escribe tu mensaje aquí..."
      />

      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={isSaved} className="min-w-[120px]">
          {isSaved ? 'Listo' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
};