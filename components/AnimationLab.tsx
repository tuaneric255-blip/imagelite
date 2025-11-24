import React, { useState, useEffect } from 'react';
import { AnimationFrame, Language } from '../types';
import { UploadZone } from './UploadZone';
import { t } from '../services/translations';
import { Play, Pause, Clock, Film } from 'lucide-react';

interface Props {
  frames: AnimationFrame[];
  onAddFrames: (files: File[]) => void;
  onClear: () => void;
  lang: Language;
}

export const AnimationLab: React.FC<Props> = ({ frames, onAddFrames, onClear, lang }) => {
  const [fps, setFps] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isPlaying && frames.length > 0) {
      interval = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % frames.length);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fps, frames]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Film size={20} className="text-primary" />
                {t(lang, 'anim_title')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t(lang, 'anim_desc')}</p>
        </div>
        <button onClick={onClear} className="text-red-500 text-sm hover:underline">{t(lang, 'anim_clear')}</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Left: Inputs */}
        <div className="space-y-6">
             <UploadZone onFilesSelected={onAddFrames} isProcessing={false} accept="image/*" lang={lang} />
             
             {frames.length > 0 && (
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                        <span>{t(lang, 'anim_speed')}</span>
                        <span>{fps}</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="24" 
                        value={fps} 
                        onChange={(e) => setFps(Number(e.target.value))} 
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="grid grid-cols-4 gap-2 mt-4 max-h-40 overflow-y-auto pr-1">
                        {frames.map((frame, idx) => (
                            <div key={frame.id} className={`relative aspect-square rounded border overflow-hidden ${idx === currentIndex && isPlaying ? 'ring-2 ring-primary' : 'border-slate-200 dark:border-slate-700'}`}>
                                <img src={frame.url} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1">{idx + 1}</div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}
        </div>

        {/* Right: Preview */}
        <div className="bg-slate-900 rounded-xl flex flex-col items-center justify-center min-h-[300px] relative p-4">
            {frames.length > 0 ? (
                <>
                    <img 
                        src={frames[currentIndex].url} 
                        className="max-w-full max-h-[250px] object-contain" 
                        alt="Animation Preview"
                    />
                    <div className="absolute bottom-4 flex items-center gap-4 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20">
                         <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-opacity-80 text-white rounded-full transition-all shadow-lg"
                         >
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                         </button>
                         <span className="text-white text-xs font-mono w-12 text-center">{currentIndex + 1} / {frames.length}</span>
                    </div>
                </>
            ) : (
                <div className="text-slate-500 flex flex-col items-center">
                    <Clock size={48} className="mb-3 opacity-20" />
                    <p className="text-sm">{t(lang, 'anim_preview')}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};