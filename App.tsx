import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Navbar } from './components/Navbar';
import { ToolSelector } from './components/ToolSelector';
import { MobileBottomNav } from './components/MobileBottomNav';
import { UploadZone } from './components/UploadZone';
import { ResultCard } from './components/ResultCard';
import { AnimationLab } from './components/AnimationLab';
import { Decoder } from './components/Decoder';
import { SettingsModal } from './components/SettingsModal';
import { Footer } from './components/Footer';
import { AppState, ToolType, ProcessedImage, Settings } from './types';
import { compressSimple, convertToWebP, convertToAVIF, fileToBase64 } from './services/imageUtils'; // Updated import
import { generateSeoMetadata } from './services/geminiService';
import { t } from './services/translations';

const DEFAULT_SETTINGS: Settings = {
  language: 'vi', // Default to Vietnamese as requested
  themeMode: 'light',
  primaryColor: '#0EA5E9',
  userApiKey: ''
};

export default function App() {
  // Load settings from localStorage or use default
  const [state, setState] = useState<AppState>(() => {
    const savedSettings = localStorage.getItem('imageLiteSettings');
    return {
      activeTool: ToolType.COMPRESS,
      images: [],
      animationFrames: [],
      isProcessing: false,
      settings: savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Persist Settings & Apply Theme
  useEffect(() => {
    localStorage.setItem('imageLiteSettings', JSON.stringify(state.settings));

    // Apply Dark Mode
    if (state.settings.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply Primary Color
    document.documentElement.style.setProperty('--color-primary', state.settings.primaryColor);

  }, [state.settings]);

  const handleToolChange = (tool: ToolType) => {
    setState(prev => ({ ...prev, activeTool: tool, images: [] }));
    // Scroll to top on mobile when changing tools
    if (window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const processFiles = async (files: File[]) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    const newImages: ProcessedImage[] = [];

    for (const file of files) {
      const id = uuidv4();
      const objectUrl = URL.createObjectURL(file);
      
      const imgEntry: ProcessedImage = {
        id,
        originalName: file.name,
        originalSize: file.size,
        originalUrl: objectUrl,
        processedUrl: objectUrl,
        processedSize: file.size,
        type: file.type,
        status: 'processing'
      };
      
      newImages.push(imgEntry);
    }

    setState(prev => ({ ...prev, images: [...newImages, ...prev.images] }));

    for (let i = 0; i < newImages.length; i++) {
      const imgEntry = newImages[i];
      const file = files[i];
      
      try {
        let resultBlob: Blob = file;
        let base64Str: string | undefined;

        switch (state.activeTool) {
            case ToolType.COMPRESS:
                // Use smart compression which keeps original format but resizes/optimizes
                resultBlob = await compressSimple(file);
                break;
            case ToolType.CONVERT_WEBP:
                resultBlob = await convertToWebP(file);
                base64Str = await fileToBase64(new File([resultBlob], "temp", { type: 'image/webp' }));
                break;
            case ToolType.CONVERT_AVIF:
                resultBlob = await convertToAVIF(file);
                base64Str = await fileToBase64(new File([resultBlob], "temp", { type: resultBlob.type }));
                break;
            case ToolType.BASE64:
                // Optimize before base64 to keep string length manageable
                resultBlob = await compressSimple(file);
                base64Str = await fileToBase64(new File([resultBlob], "temp", { type: resultBlob.type }));
                break;
            default:
                break;
        }

        const apiKeyToUse = state.settings.userApiKey || process.env.API_KEY || '';
        
        let seoData = { alt: '', desc: '' };
        if (apiKeyToUse) {
             seoData = await generateSeoMetadata(file.name, file.type, apiKeyToUse);
        }

        const processedUrl = URL.createObjectURL(resultBlob);

        setState(prev => ({
            ...prev,
            images: prev.images.map(img => img.id === imgEntry.id ? {
                ...img,
                processedUrl,
                processedSize: resultBlob.size,
                status: 'done',
                type: resultBlob.type, 
                base64: base64Str,
                seoData: {
                    alt: seoData.alt || (apiKeyToUse ? '' : 'API Key Required for AI'),
                    desc: seoData.desc
                }
            } : img)
        }));

      } catch (error) {
        console.error(error);
        setState(prev => ({
            ...prev,
            images: prev.images.map(img => img.id === imgEntry.id ? { ...img, status: 'error' } : img)
        }));
      }
    }

    setState(prev => ({ ...prev, isProcessing: false }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        lang={state.settings.language}
      />
      
      {/* Main container with extra bottom padding for mobile nav */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 flex-1 w-full pb-24 lg:pb-12">
        
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            {t(state.settings.language, 'app_title')} <span className="text-primary">{t(state.settings.language, 'app_subtitle')}</span>
          </h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0">
             {t(state.settings.language, 'results_empty_desc')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar for Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 z-30">
            <ToolSelector 
                activeTool={state.activeTool} 
                onSelect={handleToolChange} 
                lang={state.settings.language}
            />
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-2">{t(state.settings.language, 'did_you_know_title')}</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                    {t(state.settings.language, 'did_you_know_desc')}
                </p>
            </div>
          </aside>

          <div className="flex-1 w-full min-w-0">
            
            {state.activeTool === ToolType.ANIMATION ? (
                <AnimationLab 
                    frames={state.animationFrames} 
                    onAddFrames={(files) => setState(p => ({ ...p, animationFrames: [...p.animationFrames, ...files.map(f => ({ id: uuidv4(), url: URL.createObjectURL(f), file: f }))]}))}
                    onClear={() => setState(prev => ({...prev, animationFrames: []}))}
                    lang={state.settings.language}
                />
            ) : state.activeTool === ToolType.DECODE ? (
                <Decoder lang={state.settings.language} />
            ) : (
                <div className="space-y-6">
                    <UploadZone 
                        onFilesSelected={processFiles} 
                        isProcessing={state.isProcessing} 
                        lang={state.settings.language}
                    />

                    <div className="space-y-4">
                        {state.isProcessing && state.images.filter(i => i.status === 'processing').length > 0 && (
                            <div className="flex items-center justify-center py-8 text-slate-400 animate-pulse">
                                <div className="mr-3 h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                {t(state.settings.language, 'processing')}
                            </div>
                        )}

                        {state.images.length > 0 ? (
                            state.images.map((img) => (
                                <ResultCard 
                                    key={img.id} 
                                    image={img} 
                                    activeTool={state.activeTool} 
                                    lang={state.settings.language}
                                />
                            ))
                        ) : (
                            !state.isProcessing && (
                                <div className="text-center py-12 opacity-30 select-none pointer-events-none">
                                    <div className="text-6xl mb-4 grayscale">✨</div>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">{t(state.settings.language, 'results_empty_title')}</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

          </div>
        </div>
      </main>
      
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTool={state.activeTool} 
        onSelect={handleToolChange} 
        lang={state.settings.language}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={state.settings}
        onUpdate={(newSettings) => setState(prev => ({ ...prev, settings: newSettings }))}
      />
    </div>
  );
}
