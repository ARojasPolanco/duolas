import { createContext, useContext } from 'react';
import { Toaster, toast } from 'sonner';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  return (
    <ToastContext.Provider value={{ toast }}>
      <Toaster position="top-center" theme="dark" richColors closeButton />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}
