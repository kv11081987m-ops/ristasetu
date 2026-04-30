import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToastContext = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-8 right-8 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 duration-500 z-[100] flex items-center gap-3 min-w-[300px]">
          <div className={`p-2 rounded-lg ${
            toast.type === 'success' ? 'bg-green-100 text-green-600' : 
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 
            'bg-blue-100 text-blue-600'
          }`}>
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
          </div>
          <span className="font-bold text-sm text-gray-800 flex-1">{toast.message}</span>
          <button onClick={hideToast} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
};
