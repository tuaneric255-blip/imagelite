import React, { useState, useEffect } from 'react';
import { Settings as SettingsType, Language, ThemeMode } from '../types';
import { t } from '../services/translations';
import { X, Monitor, Moon, Sun, Globe, Key, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsType;
  onUpdate: (newSettings: SettingsType) => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local state when prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const colors = [
    '#0EA5E9', // Sky (Default)
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Key className="text-primary" size={20} />
            {t(localSettings.language, 'set_title')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Globe size={16} /> {t(localSettings.language, 'set_lang')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setLocalSettings({ ...localSettings, language: 'vi' })}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${localSettings.language === 'vi' ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                🇻🇳 Tiếng Việt
              </button>
              <button 
                onClick={() => setLocalSettings({ ...localSettings, language: 'en' })}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${localSettings.language === 'en' ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Monitor size={16} /> {t(localSettings.language, 'set_theme')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setLocalSettings({ ...localSettings, themeMode: 'light' })}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${localSettings.themeMode === 'light' ? 'bg-slate-200 text-slate-900 border-slate-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                <Sun size={16} /> Light
              </button>
              <button 
                onClick={() => setLocalSettings({ ...localSettings, themeMode: 'dark' })}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${localSettings.themeMode === 'dark' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                <Moon size={16} /> Dark
              </button>
            </div>
          </div>

           {/* Color Picker */}
           <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Palette size={16} /> {t(localSettings.language, 'set_color')}
            </label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setLocalSettings({...localSettings, primaryColor: c})}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${localSettings.primaryColor === c ? 'border-slate-500 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input 
                type="color" 
                value={localSettings.primaryColor} 
                onChange={(e) => setLocalSettings({...localSettings, primaryColor: e.target.value})}
                className="w-8 h-8 rounded-full overflow-hidden border-0 cursor-pointer p-0"
              />
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Key size={16} /> {t(localSettings.language, 'set_api')}
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {t(localSettings.language, 'set_api_desc')}
            </p>
            <input 
              type="password" 
              value={localSettings.userApiKey} 
              onChange={(e) => setLocalSettings({ ...localSettings, userApiKey: e.target.value })}
              placeholder={t(localSettings.language, 'set_api_placeholder')}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
             <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              {t(localSettings.language, 'set_api_help')} &rarr;
            </a>
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-primary hover:bg-opacity-90 text-white rounded-lg font-medium shadow-lg shadow-primary/20 transition-all"
          >
            {t(localSettings.language, 'set_save')}
          </button>
        </div>
      </div>
    </div>
  );
};