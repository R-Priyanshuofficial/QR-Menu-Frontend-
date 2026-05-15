import { Toaster } from 'react-hot-toast'

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        top: 16,
        right: 16,
      }}
      toastOptions={{
        duration: 3000,
        style: {
          background: 'rgba(17, 24, 39, 0.95)',
          color: '#f1f5f9',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '500',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          maxWidth: '380px',
        },
        success: {
          duration: 2500,
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            borderLeft: '3px solid #10b981',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            borderLeft: '3px solid #ef4444',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
        loading: {
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            borderLeft: '3px solid #0ea5e9',
          },
          iconTheme: {
            primary: '#0ea5e9',
            secondary: '#fff',
          },
        },
      }}
    />
  )
}
