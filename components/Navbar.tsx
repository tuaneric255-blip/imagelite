import React from 'react';
import { Zap, Settings } from 'lucide-react';
import { Language } from '../types';
import { t } from '../services/translations';

interface Props {
  onOpenSettings: () => void;
  lang: Language;
}

export const Navbar: React.FC<Props> = ({ onOpenSettings, lang }) => {
  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 h-16 flex items-center px-4 lg:px-8 transition-colors">
      <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
        <div className="p-1.5 bg-primary text-white rounded-lg shadow-sm">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
            <span className="text-slate-800 dark:text-slate-100">{t(lang, 'app_title')}</span>
            <span className="text-slate-400 font-normal text-sm md:text-base">{t(lang, 'app_subtitle')}</span>
        </div>
        <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            v2.1
        </span>
      </div>
      <div className="ml-auto flex gap-4 items-center text-sm font-medium text-slate-600 dark:text-slate-300">
        <span className="hidden sm:block">{t(lang, 'client_secure')}</span>
        <button 
          onClick={onOpenSettings}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300"
          title={t(lang, 'set_title')}
        >
          <Settings size={20} />
        </button>
      </div>
    </nav>
  );
};