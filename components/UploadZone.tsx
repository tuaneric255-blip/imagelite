import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Language } from '../types';
import { t } from '../services/translations';

interface Props {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  accept?: string;
  lang: Language;
}

export const UploadZone: React.FC<Props> = ({ onFilesSelected, isProcessing, accept = "image/*", lang }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    
    const files = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected, isProcessing]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 h-64 flex flex-col items-center justify-center text-center p-6
        ${isDragging 
          ? 'border-primary bg-sky-50 dark:bg-slate-800 scale-[0.99]' 
          : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="file"
        multiple
        accept={accept}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      
      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-primary group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-sm'}`}>
        <UploadCloud size={32} strokeWidth={1.5} />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1 group-hover:text-primary transition-colors">
        {isDragging ? t(lang, 'upload_title_drag') : t(lang, 'upload_title_click')}
      </h3>
      <p className="text-sm text-slate-400 max-w-xs mx-auto">
        {t(lang, 'upload_support')}
      </p>
    </div>
  );
};