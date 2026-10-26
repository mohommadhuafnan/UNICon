import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgColor = 'bg-white border-campus-border text-campus-text';
          let icon = <Info className="w-5 h-5 text-status-info flex-shrink-0" />;

          if (toast.type === 'success') {
            bgColor = 'bg-white border-green-200 text-green-900';
            icon = <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />;
          } else if (toast.type === 'error') {
            bgColor = 'bg-white border-red-200 text-red-900';
            icon = <AlertCircle className="w-5 h-5 text-status-danger flex-shrink-0" />;
          } else if (toast.type === 'warning') {
            bgColor = 'bg-white border-amber-200 text-amber-900';
            icon = <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all transform duration-200 ${bgColor}`}
            >
              {icon}
              <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
