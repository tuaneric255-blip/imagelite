import React from 'react';
import { ToolType, Language } from '../types';
import { t } from '../services/translations';
import { Minimize2, Globe, FileCode, Film, ImageMinus, Zap } from 'lucide-react';

interface Props {
  activeTool: ToolType;
  onSelect: (tool: ToolType) => void;
  lang: Language;
}

export const ToolSelector: React.FC<Props> = ({ activeTool, onSelect, lang }) => {
  
  const tools = [
    { id: ToolType.COMPRESS, label: t(lang, 'tool_compress'), icon: Minimize2, desc: t(lang, 'tool_compress_desc') },
    { id: ToolType.CONVERT_WEBP, label: t(lang, 'tool_convert'), icon: Globe, desc: t(lang, 'tool_convert_desc') },
    { id: ToolType.CONVERT_AVIF, label: t(lang, 'tool_avif'), icon: Zap, desc: t(lang, 'tool_avif_desc') },
    { id: ToolType.BASE64, label: t(lang, 'tool_base64'), icon: FileCode, desc: t(lang, 'tool_base64_desc') },
    { id: ToolType.ANIMATION, label: t(lang, 'tool_anim'), icon: Film, desc: t(lang, 'tool_anim_desc') },
    { id: ToolType.DECODE, label: t(lang, 'tool_decode'), icon: ImageMinus, desc: t(lang, 'tool_decode_desc') },
  ];

  return (
    <div className="hidden lg:flex flex-col gap-2">
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            className={`
              flex flex-row items-start gap-3 p-4 rounded-xl transition-all duration-200 w-full text-left border
              ${isActive 
                ? 'bg-sky-50 dark:bg-slate-800 border-sky-200 dark:border-slate-600 shadow-sm' 
                : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
            `}
          >
            <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              <tool.icon size={20} />
            </div>
            <div>
              <div className={`font-semibold text-sm ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                {tool.label}
              </div>
              <div className="text-xs text-slate-400 font-light mt-0.5">
                {tool.desc}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};