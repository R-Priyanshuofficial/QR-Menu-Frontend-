import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';
import { 
  requestNotificationPermission, 
  getNotificationPermission,
  showNotificationWithSound 
} from '@shared/utils/pushNotifications';
import toast from 'react-hot-toast';

export const NotificationPermission = () => {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    
    if (granted) {
      toast.success('Notifications enabled! 🎉');
      
      // Show test notification
      showNotificationWithSound('Notifications Enabled! 🎉', {
        body: 'You will now receive notifications even when the website is closed.',
        icon: '/favicon.ico',
      });
    } else {
      toast.error('Please enable notifications in your browser settings');
    }
  };

  if (permission === 'unsupported') {
    return (
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="p-4 flex items-start gap-3">
          <BellOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Browser Notifications Not Supported
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Your browser doesn't support notifications. Try using Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="p-4 flex items-start gap-3">
          <BellOff className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Notifications Blocked
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              You've blocked notifications. To enable:
            </p>
            <ol className="text-sm text-red-700 dark:text-red-300 mt-2 ml-4 list-decimal space-y-1">
              <li>Click the lock icon in the address bar</li>
              <li>Find "Notifications" and change to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </div>
        </div>
      </Card>
    );
  }

  if (permission === 'default') {
    return (
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Enable Push Notifications
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Get notified of new orders even when the website is closed or minimized.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleRequestPermission}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Bell className="w-4 h-4 mr-2" />
            Enable Notifications
          </Button>
        </div>
      </Card>
    );
  }

  // Permission granted
  return (
    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Bell className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Notifications Enabled ✅
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              You'll receive notifications even when the website is closed!
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
