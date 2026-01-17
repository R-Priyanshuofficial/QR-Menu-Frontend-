import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import {
  requestNotificationPermission,
  showNotificationWithSound,
  showBrowserNotification
} from '@shared/utils/pushNotifications';

const SocketContext = createContext(null);
const SOUND_PREF_KEY = 'notification_sound_enabled';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    return stored !== 'off';
  });
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    localStorage.setItem(SOUND_PREF_KEY, soundEnabled ? 'on' : 'off');
  }, [soundEnabled]);

  const pushNotification = (notification) => {
    setNotifications((prev) => {
      const entry = {
        id: notification.id || `${Date.now()}-${Math.random()}`,
        title: notification.title || 'New Activity',
        message: notification.message,
        type: notification.type,
        timestamp: notification.timestamp || new Date().toISOString(),
        data: notification.data,
        read: false,
      };
      return [entry, ...prev].slice(0, 15);
    });
  };
  const markNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      })),
    );
  };
  const clearNotifications = () => setNotifications([]);

  useEffect(() => {
    // Request browser notification permission on mount
    requestNotificationPermission().then(granted => {
      if (granted) {
        console.log('✅ Browser notification permission granted');
      } else {
        console.log('❌ Browser notification permission denied');
      }
    });

    // Connect socket for both authenticated users and customers
    // Customers will join order rooms even without authentication

    // Create socket connection (adaptive): use current page host for LAN access
    const { protocol, hostname } = window.location;
    const envApi = import.meta.env.VITE_API_URL || 'https://qr-menu-backend-lwba.onrender.com/api';
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const derivedBase = `${protocol}//${hostname}:5000`;
    const baseUrl = (!isLocalHost && envApi.includes('localhost'))
      ? derivedBase
      : envApi.replace('/api', '');
    console.log('🔌 Connecting to Socket.io:', baseUrl);

    const socketInstance = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      console.log('   Socket ID:', socketInstance.id);
      console.log('   Transport:', socketInstance.io.engine.transport.name);
      setConnected(true);

      // Show success toast
      // toast.success('Connected to server! 🎉', {
      //   duration: 2000,
      //   position: 'bottom-right',
      // });
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      setConnected(false);

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('   Make sure backend is running on:', baseUrl);
      setConnected(false);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts!`);
      toast.success('Reconnected! 🎉', { duration: 2000, position: 'bottom-right' });
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect to server');
      toast.error('Cannot connect to server. Please check if backend is running.', {
        duration: 5000,
      });
    });

    // Handle notifications
    const triggerBrowserNotification = (title, options) => {
      if (soundEnabled) {
        showNotificationWithSound(title, options);
      } else {
        showBrowserNotification(title, options);
      }
    };

    socketInstance.on('notification', (notification) => {
      console.log('📢 Notification received:', notification);

      // Show toast notification (in-app)
      if (notification.type === 'new_order') {
        toast.success(notification.message, {
          duration: 5000,
          icon: '🎉',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });

        triggerBrowserNotification(notification.title || 'New Order! 🎉', {
          body: notification.message,
          icon: '/favicon.ico',
          tag: 'new-order',
          data: notification.data,
        });
        pushNotification(notification);
      } else if (notification.type === 'order_ready') {
        toast.success(notification.message, {
          duration: 5000,
          icon: '🎉',
          style: {
            background: '#3B82F6',
            color: '#fff',
          },
        });

        triggerBrowserNotification(notification.title || 'Order Ready! 🎉', {
          body: notification.message,
          icon: '/favicon.ico',
          tag: 'order-ready',
          data: notification.data,
          requireInteraction: true, // Keeps notification visible
        });
        pushNotification(notification);
      } else if (notification.type === 'order_status') {
        toast.info(notification.message, {
          duration: 4000,
        });

        triggerBrowserNotification(notification.title || 'Order Update', {
          body: notification.message,
          icon: '/favicon.ico',
          tag: 'order-status',
          data: notification.data,
        });
        pushNotification(notification);
      } else if (notification.type === 'test') {
        // Test notifications
        toast.success(notification.message, {
          duration: 4000,
        });

        triggerBrowserNotification(notification.title || 'Test', {
          body: notification.message,
          icon: '/favicon.ico',
        });
        pushNotification(notification);
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []); // Only initialize once on mount

  // Join owner room when authenticated
  useEffect(() => {
    if (socket && connected && isAuthenticated && user) {
      const ownerId = user.id || user._id;
      if (ownerId) {
        socket.emit('owner:join', ownerId);
        console.log('👨‍💼 Owner joined room:', ownerId);
      } else {
        console.warn('⚠️ Owner ID missing on user object - cannot join socket room');
      }
    }
  }, [socket, connected, isAuthenticated, user]);

  const joinOrderRoom = (orderId, phone) => {
    if (socket && connected) {
      socket.emit('customer:join', { orderId, phone });
      console.log('👤 Customer joined order room:', orderId);
    }
  };

  const value = {
    socket,
    connected,
    joinOrderRoom,
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    markNotificationsRead,
    clearNotifications,
    soundEnabled,
    setNotificationSoundEnabled: setSoundEnabled,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
