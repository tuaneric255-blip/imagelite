import React, { useState } from 'react';
import { ImageMinus, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { t } from '../services/translations';

interface Props {
    lang: Language;
}

export const Decoder: React.FC<Props> = ({ lang }) => {
    const [base64, setBase64] = useState('');
    const [error, setError] = useState('');

    const handleDecode = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setBase64(val);
        setError('');
    };

    const getSrc = () => {
        if (!base64) return null;
        if (base64.startsWith('data:image')) return base64;
        return `data:image/png;base64,${base64}`;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
                <ImageMinus className="text-primary" size={24} />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t(lang, 'dec_title')}</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t(lang, 'dec_paste')}</label>
                    <textarea
                        className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                        placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
                        value={base64}
                        onChange={handleDecode}
                    />
                </div>
                
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t(lang, 'dec_preview')}</label>
                    <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative">
                         {base64 ? (
                             <img 
                                src={getSrc() || ''} 
                                onError={() => setError(t(lang, 'dec_invalid'))}
                                className="max-w-full max-h-full object-contain shadow-lg" 
                                alt="Decoded"
                            />
                         ) : (
                             <span className="text-slate-400 dark:text-slate-500 text-sm">{t(lang, 'dec_placeholder')}</span>
                         )}
                         
                         {error && (
                             <div className="absolute bottom-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-100 dark:border-red-900 flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    )
}