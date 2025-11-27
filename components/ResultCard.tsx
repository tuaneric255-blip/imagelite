
import React, { useState } from 'react';
import { ProcessedImage, ToolType, Language } from '../types';
import { formatBytes, calculateReduction } from '../services/imageUtils';
import { t } from '../services/translations';
import { Download, Copy, Check } from 'lucide-react';

interface Props {
  image: ProcessedImage;
  activeTool: ToolType;
  lang: Language;
}

export const ResultCard: React.FC<Props> = ({ image, activeTool, lang }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'seo'>('preview');

  const reduction = calculateReduction(image.originalSize, image.processedSize);
  const isGain = reduction < 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine file extension correctly based on the PROCESSED mime type
  const getExtension = () => {
      // Prioritize the actual result type if available
      if (image.type === 'image/webp') return 'webp';
      if (image.type === 'image/avif') return 'avif';
      if (image.type === 'image/jpeg') return 'jpg';
      if (image.type === 'image/png') return 'png';
      if (image.type === 'image/svg+xml') return 'svg';
      
      // Fallback: If activeTool explicitly dictates format (but didn't update image.type for some reason)
      if (activeTool === ToolType.CONVERT_WEBP) return 'webp';
      if (activeTool === ToolType.CONVERT_AVIF) return 'avif';
      if (activeTool === ToolType.SVG) return 'svg';
      
      // Last resort: Original extension
      return image.originalName.split('.').pop() || 'jpg';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-4 transition-all hover:shadow-md">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <img src={image.originalUrl} className="w-full h-full object-cover" alt="thumb" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{image.originalName}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
               <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase">{image.type.split('/')[1]}</span>
               <span>{formatBytes(image.originalSize)}</span>
            </div>
          </div>
        </div>

        {image.status === 'done' && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`text-sm font-bold ${isGain ? 'text-orange-500' : 'text-emerald-600'}`}>
                 {isGain ? '+' : '-'}{Math.abs(reduction)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(image.processedSize)}</div>
            </div>
            <a 
              href={image.processedUrl} 
              download={`optimized-${image.originalName.split('.')[0]}.${getExtension()}`}
              className="p-2 bg-primary hover:bg-opacity-90 text-white rounded-lg transition-colors shadow-sm shadow-primary/20"
              title={t(lang, 'res_download')}
            >
              <Download size={18} />
            </a>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800 mb-4">
            <button 
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'preview' ? 'border-primary text-primary bg-sky-50 dark:bg-slate-800' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                {t(lang, 'res_visual')}
            </button>
             {(activeTool === ToolType.BASE64 || activeTool === ToolType.CONVERT_WEBP || activeTool === ToolType.CONVERT_AVIF || activeTool === ToolType.SVG) && (
                <button 
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'code' ? 'border-primary text-primary bg-sky-50 dark:bg-slate-800' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    {t(lang, 'res_embed')}
                </button>
             )}
             <button 
                onClick={() => setActiveTab('seo')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'seo' ? 'border-primary text-primary bg-sky-50 dark:bg-slate-800' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                {t(lang, 'res_seo')}
            </button>
        </div>

        {/* Content */}
        {activeTab === 'preview' && (
            <div className="grid grid-cols-2 gap-4 h-48">
                <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm z-10">{t(lang, 'res_before')}</span>
                    <img src={image.originalUrl} className="w-full h-full object-contain p-2" alt="Original" />
                </div>
                <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <span className="absolute top-2 left-2 bg-primary/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm z-10">{t(lang, 'res_after')}</span>
                    <img src={image.processedUrl} className="w-full h-full object-contain p-2" alt="Processed" />
                </div>
            </div>
        )}

        {activeTab === 'code' && image.base64 && (
            <div className="relative bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 h-48 overflow-y-auto">
                 <button 
                    onClick={() => copyToClipboard(image.base64!)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                 >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                 </button>
                 <div className="break-all">
                    {activeTool === ToolType.SVG && image.base64.startsWith('data:image/svg+xml;base64,') ? (
                         <>
                             <span className="text-pink-400">&lt;object</span> <span className="text-sky-400">data</span>=<span className="text-green-400">"{image.base64.substring(0, 100)}..."</span> <span className="text-sky-400">type</span>=<span className="text-green-400">"image/svg+xml"</span><span className="text-pink-400">&gt;&lt;/object&gt;</span>
                         </>
                    ) : (
                         <>
                            <span className="text-pink-400">&lt;img</span> <span className="text-sky-400">src</span>=<span className="text-green-400">"{image.base64.substring(0, 100)}..."</span> <span className="text-pink-400">/&gt;</span>
                         </>
                    )}
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-800 text-slate-500 italic">
                    Full Base64 string is ready to copy.
                 </div>
            </div>
        )}

        {activeTab === 'seo' && (
            <div className="space-y-3 h-48 overflow-y-auto">
                <div className="bg-sky-50 dark:bg-slate-800 p-3 rounded-lg border border-sky-100 dark:border-slate-700">
                    <h5 className="text-xs font-bold text-primary mb-1">{t(lang, 'res_suggested_alt')}</h5>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{image.seoData?.alt || t(lang, 'res_analyzing')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                     <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t(lang, 'res_caption')}</h5>
                     <p className="text-sm text-slate-600 dark:text-slate-300">{image.seoData?.desc || t(lang, 'res_waiting')}</p>
                </div>
                <div className="text-xs text-slate-400 text-center mt-2">
                    {t(lang, 'res_generated_by')}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
