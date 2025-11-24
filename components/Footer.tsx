import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-8 border-t border-slate-200 dark:border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Copyright &copy; 2024 Eric Nguyen - Odinflows | Teamentors.com
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-mono">
          0982005840 - ericnguyen@teamentors.com
        </p>
      </div>
    </footer>
  );
};