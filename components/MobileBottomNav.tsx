import React from 'react';
import { ToolType, Language } from '../types';
import { t } from '../services/translations';
import { Minimize2, Globe, FileCode, Film, ImageMinus } from 'lucide-react';

interface Props {
  activeTool: ToolType;
  onSelect: (tool: ToolType) => void;
  lang: Language;
}

export const MobileBottomNav: React.FC<Props> = ({ activeTool, onSelect, lang }) => {
  const tools = [
    { id: ToolType.COMPRESS, label: t(lang, 'tool_compress'), icon: Minimize2 },
    { id: ToolType.CONVERT_WEBP, label: 'WebP', icon: Globe }, // Shortened label for mobile
    { id: ToolType.BASE64, label: 'Base64', icon: FileCode },
    { id: ToolType.ANIMATION, label: 'GIF', icon: Film },
    { id: ToolType.DECODE, label: t(lang, 'tool_decode'), icon: ImageMinus },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-40 px-2 pb-safe pt-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center pb-1">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelect(tool.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 w-full max-w-[70px] active:scale-95
                ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
              `}
            >
              <div className={`mb-1 p-1 rounded-lg transition-colors ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
                <tool.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium truncate w-full text-center ${isActive ? 'text-primary' : ''}`}>
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};