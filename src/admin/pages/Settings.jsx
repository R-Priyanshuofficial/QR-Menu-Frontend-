import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Receipt,
  Percent,
  ToggleLeft,
  ToggleRight,
  Save,
  Info,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Printer,
  Wifi,
  Usb,
  Bluetooth,
  Check,
  Bell,
  Volume2,
  VolumeX,
  X as XIcon
} from 'lucide-react';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import toast from 'react-hot-toast';
import { useSocket } from '@shared/contexts/SocketContext';
import { playNotificationSound } from '@shared/utils/pushNotifications';

const DEFAULT_SETTINGS = {
  gst: {
    enabled: true,
    rate: 5,
    cgst: 2.5,
    sgst: 2.5,
    showBreakdown: true
  },
  restaurant: {
    name: 'QR Menu Restaurant',
    address: '',
    phone: '',
    gstNumber: '',
    logo: ''
  },
  printer: {
    enabled: false,
    mode: 'browser', // 'browser' or 'direct'
    type: 'usb', // 'usb', 'network', 'bluetooth'
    connection: {
      usbPort: 'COM1',
      networkIp: '192.168.1.100',
      networkPort: 9100,
      bluetoothDevice: ''
    },
    autoPrint: {
      onOrderComplete: false,
      onOrderReceived: false
    },
    printers: {
      billing: { enabled: true, name: 'Billing Printer' },
      kitchen: { enabled: false, name: 'Kitchen Printer' }
    }
  }
};

export const Settings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { soundEnabled, setNotificationSoundEnabled } = useSocket();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('restaurantSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with default settings to ensure all properties exist
        setSettings({
          gst: { ...DEFAULT_SETTINGS.gst, ...parsed.gst },
          restaurant: { ...DEFAULT_SETTINGS.restaurant, ...parsed.restaurant },
          printer: { 
            ...DEFAULT_SETTINGS.printer, 
            ...parsed.printer,
            connection: {
              ...DEFAULT_SETTINGS.printer.connection,
              ...(parsed.printer?.connection || {})
            },
            autoPrint: {
              ...DEFAULT_SETTINGS.printer.autoPrint,
              ...(parsed.printer?.autoPrint || {})
            },
            printers: {
              ...DEFAULT_SETTINGS.printer.printers,
              ...(parsed.printer?.printers || {})
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set default settings on error
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Validate GST rate
      if (settings.gst.rate < 0 || settings.gst.rate > 100) {
        toast.error('GST rate must be between 0% and 100%');
        return;
      }

      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem('restaurantSettings', JSON.stringify(settings));
      
      toast.success('Settings saved successfully!', {
        icon: '✅',
        duration: 3000
      });
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGSTToggle = () => {
    setSettings(prev => ({
      ...prev,
      gst: { ...prev.gst, enabled: !prev.gst.enabled }
    }));
    setHasChanges(true);
  };

  const handleGSTRateChange = (rate) => {
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return;
    
    setSettings(prev => ({
      ...prev,
      gst: {
        ...prev.gst,
        rate: numRate,
        cgst: numRate / 2,
        sgst: numRate / 2
      }
    }));
    setHasChanges(true);
  };

  const handleBreakdownToggle = () => {
    setSettings(prev => ({
      ...prev,
      gst: { ...prev.gst, showBreakdown: !prev.gst.showBreakdown }
    }));
    setHasChanges(true);
  };

  const handleRestaurantInfoChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      restaurant: { ...prev.restaurant, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettings(prev => ({
        ...prev,
        restaurant: { ...prev.restaurant, logo: reader.result }
      }));
      setHasChanges(true);
    };
    reader.onerror = () => {
      toast.error('Failed to read logo file');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleLogoRemove = () => {
    setSettings(prev => ({
      ...prev,
      restaurant: { ...prev.restaurant, logo: '' }
    }));
    setHasChanges(true);
  };

  const resetToDefault = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    toast.success('Settings reset to default');
  };

  const handleNotificationSoundToggle = () => {
    const nextValue = !soundEnabled;
    setNotificationSoundEnabled(nextValue);
    toast.success(`Notification sound ${nextValue ? 'enabled' : 'muted'}`);
  };

  const handleTestNotificationSound = () => {
    playNotificationSound();
    toast.success('Playing notification sound');
  };

  // Printer handlers
  const handlePrinterModeChange = (mode) => {
    setSettings(prev => ({
      ...prev,
      printer: { ...prev.printer, mode, enabled: mode === 'direct' }
    }));
    setHasChanges(true);
  };

  const handlePrinterTypeChange = (type) => {
    setSettings(prev => ({
      ...prev,
      printer: { ...prev.printer, type }
    }));
    setHasChanges(true);
  };

  const handleConnectionChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      printer: {
        ...prev.printer,
        connection: { ...prev.printer.connection, [field]: value }
      }
    }));
    setHasChanges(true);
  };

  const handleAutoPrintToggle = (field) => {
    setSettings(prev => ({
      ...prev,
      printer: {
        ...prev.printer,
        autoPrint: { ...prev.printer.autoPrint, [field]: !prev.printer.autoPrint[field] }
      }
    }));
    setHasChanges(true);
  };

  const handlePrinterToggle = (printerType) => {
    setSettings(prev => ({
      ...prev,
      printer: {
        ...prev.printer,
        printers: {
          ...prev.printer.printers,
          [printerType]: {
            ...prev.printer.printers[printerType],
            enabled: !prev.printer.printers[printerType].enabled
          }
        }
      }
    }));
    setHasChanges(true);
  };

  const testPrinter = async () => {
    try {
      setLoading(true);
      toast.loading('Testing printer connection...', { id: 'printer-test' });
      
      // Get API base URL
      const API_URL = import.meta.env.VITE_API_URL || 'https://qr-menu-backend-lwba.onrender.com/api';
      
      // Call backend test API
      const response = await fetch(`${API_URL}/printer/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: settings.printer.type,
          connection: settings.printer.connection
        })
      });

      const data = await response.json();
      
      toast.dismiss('printer-test');
      
      if (!response.ok) {
        throw new Error(data.message || 'Printer test failed');
      }
      
      toast.success('✅ Test print successful!', {
        icon: '🖨️',
        duration: 4000,
        description: 'Check your printer for test receipt'
      });
    } catch (error) {
      toast.dismiss('printer-test');
      console.error('Printer test error:', error);
      toast.error(`❌ Printer test failed: ${error.message}`, {
        duration: 5000,
        description: 'Check connection settings and try again'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-primary-600" />
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Configure your restaurant settings and GST preferences
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              onClick={resetToDefault}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              Reset to Default
            </Button>
          )}
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || loading}
            size="sm"
            className={`gap-2 ${
              hasChanges 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                : ''
            }`}
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notifications & Alerts
              </h2>
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Play sound for new orders
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                  Hear a chime whenever a new order notification arrives. Disable this if you prefer silent alerts.
                </p>
                {!soundEnabled && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1">
                    <VolumeX className="w-4 h-4" />
                    Sound is muted. You will still see in-app and browser notifications.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNotificationSoundToggle}
                  className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors ${
                    soundEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center h-7 w-7 transform rounded-full bg-white text-gray-600 transition-transform ${
                      soundEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </span>
                </button>
                <Button
                  variant="outline"
                  onClick={handleTestNotificationSound}
                  disabled={!soundEnabled}
                  className="gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  Test Sound
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Changes Indicator */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">You have unsaved changes. Click "Save Changes" to apply them.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Receipt className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  GST Configuration
                </h2>
              </div>

              <div className="space-y-6">
                {/* Enable/Disable GST */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Enable GST
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Apply GST to all bills
                    </p>
                  </div>
                  <button
                    onClick={handleGSTToggle}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      settings.gst.enabled
                        ? 'bg-green-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        settings.gst.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* GST Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.gst.rate}
                      onChange={(e) => handleGSTRateChange(e.target.value)}
                      disabled={!settings.gst.enabled}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Standard restaurant GST rate in India is 5%
                  </p>
                </div>

                {/* CGST/SGST Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CGST (%)
                    </label>
                    <input
                      type="number"
                      value={settings.gst.cgst}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SGST (%)
                    </label>
                    <input
                      type="number"
                      value={settings.gst.sgst}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Show Breakdown Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Show CGST/SGST Breakdown
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Display separate CGST and SGST on receipts
                    </p>
                  </div>
                  <button
                    onClick={handleBreakdownToggle}
                    disabled={!settings.gst.enabled}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      settings.gst.showBreakdown
                        ? 'bg-primary-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        settings.gst.showBreakdown ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* GST Status Preview */}
                <div className={`p-4 rounded-lg border-2 ${
                  settings.gst.enabled
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {settings.gst.enabled ? (
                      <ToggleRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={`font-semibold ${
                      settings.gst.enabled
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      GST {settings.gst.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {settings.gst.enabled && (
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        Total Rate: <span className="font-bold">{settings.gst.rate}%</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        CGST: {settings.gst.cgst}% | SGST: {settings.gst.sgst}%
                      </p>
                    </div>
                  )}
                </div>

                {/* GST Help Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 dark:text-blue-400 space-y-2">
                      <p className="font-semibold">📌 GST Quick Guide:</p>
                      <ul className="space-y-1 ml-4 list-disc">
                        <li><strong>Enable GST:</strong> Required if your annual turnover exceeds ₹40 lakhs</li>
                        <li><strong>Standard Rate:</strong> 5% for restaurants (CGST 2.5% + SGST 2.5%)</li>
                        <li><strong>Show Breakdown:</strong> Enable for B2B customers who need tax details</li>
                        <li><strong>AC Restaurant:</strong> May require 18% GST (check with tax consultant)</li>
                      </ul>
                      <p className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                        <strong>⚠️ Legal:</strong> If GST registered, you MUST display GSTIN on all bills and file GST returns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Restaurant Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Restaurant Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={settings.restaurant.name}
                    onChange={(e) => handleRestaurantInfoChange('name', e.target.value)}
                    placeholder="Enter restaurant name"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Restaurant Logo
                  </label>
                  <div className="flex flex-col lg:flex-row items-start gap-4">
                    <div className="w-28 h-28 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                      {settings.restaurant.logo ? (
                        <img
                          src={settings.restaurant.logo}
                          alt="Restaurant logo preview"
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <span className="text-xs text-gray-400 text-center px-2">
                          No logo
                        </span>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 text-sm">
                          Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </label>
                        {settings.restaurant.logo && (
                          <Button variant="outline" size="sm" onClick={handleLogoRemove}>
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={settings.restaurant.logo || ''}
                        onChange={(e) => handleRestaurantInfoChange('logo', e.target.value)}
                        placeholder="Paste image URL"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        This logo appears on customer receipts and welcome screens. Recommended size: square PNG with transparent background.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={settings.restaurant.address}
                    onChange={(e) => handleRestaurantInfoChange('address', e.target.value)}
                    placeholder="Enter restaurant address"
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.restaurant.phone}
                    onChange={(e) => handleRestaurantInfoChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={settings.restaurant.gstNumber}
                    onChange={(e) => handleRestaurantInfoChange('gstNumber', e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength="15"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 uppercase"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    15-digit GST registration number
                  </p>
                </div>

                {/* Restaurant Info Help */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-green-800 dark:text-green-400 space-y-2">
                      <p className="font-semibold">🏪 Receipt Information Guide:</p>
                      <ul className="space-y-1 ml-4 list-disc">
                        <li><strong>Restaurant Name:</strong> Appears at top of every receipt (use official business name)</li>
                        <li><strong>Address:</strong> Required for tax invoices. Format: "Street, Area, City - PIN"</li>
                        <li><strong>Phone Number:</strong> For customer queries. Include country code (+91 for India)</li>
                        <li><strong>GSTIN:</strong> Required ONLY if you're GST registered. Leave empty if not registered</li>
                      </ul>
                      <p className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                        <strong>💡 Tip:</strong> This info appears on EVERY customer receipt, so double-check spelling and accuracy!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Bill Preview
                  </h3>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 font-mono text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">₹1,000.00</span>
                  </div>
                  {settings.gst.enabled && (
                    <>
                      {settings.gst.showBreakdown ? (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">CGST ({settings.gst.cgst}%):</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              ₹{((1000 * settings.gst.cgst) / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">SGST ({settings.gst.sgst}%):</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              ₹{((1000 * settings.gst.sgst) / 100).toFixed(2)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">GST ({settings.gst.rate}%):</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            ₹{((1000 * settings.gst.rate) / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold">
                        <span className="text-gray-900 dark:text-gray-100">Total:</span>
                        <span className="text-green-600">
                          ₹{(1000 + (1000 * settings.gst.rate) / 100).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  {!settings.gst.enabled && (
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold">
                      <span className="text-gray-900 dark:text-gray-100">Total:</span>
                      <span className="text-green-600">₹1,000.00</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Printer Configuration - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Printer className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Thermal Printer Configuration
                </h2>
              </div>
              {settings.printer?.mode === 'direct' && (
                <Button
                  onClick={testPrinter}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Test Print
                </Button>
              )}
            </div>

            {/* Printer Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Printing Mode
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handlePrinterModeChange('browser')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.printer?.mode === 'browser'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Receipt className={`w-5 h-5 ${
                      settings.printer?.mode === 'browser' ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Browser Print
                    </h3>
                    {settings.printer?.mode === 'browser' && (
                      <Check className="w-5 h-5 text-primary-600 ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                    Simple setup, works with any printer. Manual print dialog.
                  </p>
                </button>

                <button
                  onClick={() => handlePrinterModeChange('direct')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.printer?.mode === 'direct'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Printer className={`w-5 h-5 ${
                      settings.printer?.mode === 'direct' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Direct Thermal Print
                    </h3>
                    {settings.printer?.mode === 'direct' && (
                      <Check className="w-5 h-5 text-purple-600 ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                    Auto-print, no dialog. Requires setup. Professional workflow.
                  </p>
                </button>
              </div>
            </div>

            {/* Direct Printing Configuration */}
            {settings.printer?.mode === 'direct' && (
              <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                {/* Connection Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Connection Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => handlePrinterTypeChange('usb')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.printer?.type === 'usb'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Usb className={`w-5 h-5 ${
                          settings.printer?.type === 'usb' ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className="font-medium text-gray-900 dark:text-gray-100">USB</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePrinterTypeChange('network')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.printer?.type === 'network'
                          ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Wifi className={`w-5 h-5 ${
                          settings.printer?.type === 'network' ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <span className="font-medium text-gray-900 dark:text-gray-100">Network</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePrinterTypeChange('bluetooth')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.printer?.type === 'bluetooth'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Bluetooth className={`w-5 h-5 ${
                          settings.printer?.type === 'bluetooth' ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        <span className="font-medium text-gray-900 dark:text-gray-100">Bluetooth</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Connection Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.printer?.type === 'usb' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        USB Port
                      </label>
                      <input
                        type="text"
                        value={settings.printer?.connection?.usbPort || ''}
                        onChange={(e) => handleConnectionChange('usbPort', e.target.value)}
                        placeholder="COM1, COM2, /dev/usb/lp0"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Windows: COM1, COM2 | Linux: /dev/usb/lp0
                      </p>
                    </div>
                  )}

                  {settings.printer?.type === 'network' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Printer IP Address
                        </label>
                        <input
                          type="text"
                          value={settings.printer?.connection?.networkIp || ''}
                          onChange={(e) => handleConnectionChange('networkIp', e.target.value)}
                          placeholder="192.168.1.100"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Port
                        </label>
                        <input
                          type="number"
                          value={settings.printer?.connection?.networkPort || 9100}
                          onChange={(e) => handleConnectionChange('networkPort', e.target.value)}
                          placeholder="9100"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Default: 9100 (RAW printing)
                        </p>
                      </div>
                    </>
                  )}

                  {settings.printer?.type === 'bluetooth' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bluetooth Device Name
                      </label>
                      <input
                        type="text"
                        value={settings.printer?.connection?.bluetoothDevice || ''}
                        onChange={(e) => handleConnectionChange('bluetoothDevice', e.target.value)}
                        placeholder="BlueTooth Printer"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}
                </div>

                {/* Auto-Print Settings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Auto-Print Options
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Auto-print on Order Complete
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Automatically print bill when marking order as completed
                        </p>
                      </div>
                      <button
                        onClick={() => handleAutoPrintToggle('onOrderComplete')}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          settings.printer?.autoPrint?.onOrderComplete
                            ? 'bg-green-600'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            settings.printer?.autoPrint?.onOrderComplete ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Auto-print Kitchen Order (Coming Soon)
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Print order details when new order arrives
                        </p>
                      </div>
                      <button
                        onClick={() => handleAutoPrintToggle('onOrderReceived')}
                        disabled
                        className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-300 dark:bg-gray-600 opacity-50 cursor-not-allowed"
                      >
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multiple Printers */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Printer Stations (Advanced)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Billing Printer</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Customer receipts</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePrinterToggle('billing')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.printer?.printers?.billing?.enabled
                            ? 'bg-green-600'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.printer?.printers?.billing?.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg opacity-50">
                      <div className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Kitchen Printer</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Coming soon</p>
                        </div>
                      </div>
                      <button
                        disabled
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detailed Setup Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 text-base">
                        📋 Detailed Setup Instructions
                      </h3>
                      
                      {/* USB Setup */}
                      {settings.printer?.type === 'usb' && (
                        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded p-3">
                            <p className="font-semibold mb-2">🔌 USB Printer Setup:</p>
                            <ol className="list-decimal list-inside space-y-1.5 text-xs ml-2">
                              <li><strong>Connect printer:</strong> Plug USB cable from printer to computer, turn printer ON</li>
                              <li>
                                <strong>Find COM Port:</strong>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                                  <li><strong>Windows:</strong> Device Manager → Ports (COM & LPT) → Note COM number (e.g., COM3)</li>
                                  <li><strong>Linux:</strong> Terminal → Run: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ls /dev/usb/lp*</code> → Note path (e.g., /dev/usb/lp0)</li>
                                </ul>
                              </li>
                              <li><strong>Enter port above:</strong> Type the COM port or device path in "USB Port" field</li>
                              <li><strong>Test connection:</strong> Click "Test Print" button (top-right)</li>
                              <li><strong>Verify:</strong> Printer should print a test page</li>
                              <li><strong>Save:</strong> Click "Save Changes" at the top of page</li>
                            </ol>
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs">
                              <strong>💡 Troubleshooting:</strong> If not working, try different USB port, reinstall drivers, or check cable connection.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Network Setup */}
                      {settings.printer?.type === 'network' && (
                        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded p-3">
                            <p className="font-semibold mb-2">🌐 Network Printer Setup:</p>
                            <ol className="list-decimal list-inside space-y-1.5 text-xs ml-2">
                              <li>
                                <strong>Connect printer to network:</strong>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                                  <li><strong>Ethernet:</strong> Plug cable from router to printer</li>
                                  <li><strong>WiFi:</strong> Use printer menu to connect to your WiFi network</li>
                                </ul>
                              </li>
                              <li>
                                <strong>Find printer IP address:</strong>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                                  <li><strong>Method 1:</strong> Print network info page from printer menu (usually hold Feed button)</li>
                                  <li><strong>Method 2:</strong> Check router admin panel → Connected Devices</li>
                                  <li><strong>Method 3:</strong> Use network scanner app (e.g., Advanced IP Scanner)</li>
                                </ul>
                              </li>
                              <li><strong>Enter IP above:</strong> Type IP address (e.g., 192.168.1.100) in "Printer IP Address" field</li>
                              <li><strong>Port:</strong> Use 9100 (default for thermal printers) or check printer manual</li>
                              <li><strong>Test connection:</strong> Click "Test Print" button</li>
                              <li><strong>Save settings:</strong> Click "Save Changes" at top</li>
                            </ol>
                            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs">
                              <strong>✅ Pro Tip:</strong> Assign static IP in router settings to prevent IP from changing!
                            </div>
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs">
                              <strong>💡 Troubleshooting:</strong> Ping printer IP (<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ping 192.168.1.100</code>), check firewall, ensure same network.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bluetooth Setup */}
                      {settings.printer?.type === 'bluetooth' && (
                        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded p-3">
                            <p className="font-semibold mb-2">📶 Bluetooth Printer Setup:</p>
                            <ol className="list-decimal list-inside space-y-1.5 text-xs ml-2">
                              <li><strong>Enable Bluetooth:</strong> Turn on printer, enable Bluetooth mode (check printer manual)</li>
                              <li><strong>Put in pairing mode:</strong> LED should blink (usually blue)</li>
                              <li>
                                <strong>Pair with computer:</strong>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                                  <li><strong>Windows:</strong> Settings → Bluetooth & devices → Add device → Bluetooth</li>
                                  <li><strong>Linux:</strong> Bluetooth settings → + Add device</li>
                                </ul>
                              </li>
                              <li><strong>Select printer:</strong> Choose printer from list, confirm pairing (PIN: usually 0000 or 1234)</li>
                              <li><strong>Note device name:</strong> After pairing, note the device name (e.g., "Thermal Printer" or "POS-80")</li>
                              <li><strong>Enter name above:</strong> Type device name in "Bluetooth Device Name" field</li>
                              <li><strong>Test:</strong> Click "Test Print" button</li>
                              <li><strong>Save:</strong> Click "Save Changes"</li>
                            </ol>
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs">
                              <strong>💡 Troubleshooting:</strong> Keep within 10 meters, remove old pairings, re-pair device, check Bluetooth is ON.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* General Tips */}
                      <div className="mt-4 space-y-2">
                        <div className="bg-white/60 dark:bg-gray-800/60 rounded p-3">
                          <p className="font-semibold text-xs text-blue-900 dark:text-blue-300 mb-2">
                            🎯 Auto-Print Options:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-400 ml-2">
                            <li><strong>Auto-print on Order Complete:</strong> Bills print automatically when you mark order as "Completed" (saves clicks!)</li>
                            <li><strong>Kitchen Printer:</strong> Coming soon - will print order tickets for kitchen automatically</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded p-3">
                          <p className="font-semibold text-xs text-purple-900 dark:text-purple-300 mb-2">
                            ⚡ Quick Start Guide:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="font-semibold text-purple-800 dark:text-purple-400 mb-1">Beginners (Easy):</p>
                              <ol className="list-decimal list-inside space-y-0.5 ml-2 text-purple-700 dark:text-purple-400">
                                <li>Select "Browser Print" mode</li>
                                <li>Click "Save Changes"</li>
                                <li>Done! Print via browser dialog</li>
                              </ol>
                            </div>
                            <div>
                              <p className="font-semibold text-blue-800 dark:text-blue-400 mb-1">Professional (Advanced):</p>
                              <ol className="list-decimal list-inside space-y-0.5 ml-2 text-blue-700 dark:text-blue-400">
                                <li>Select "Direct Thermal Print"</li>
                                <li>Choose connection type</li>
                                <li>Enter connection details</li>
                                <li>Test Print → Save</li>
                              </ol>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                          <p className="font-semibold text-xs text-red-900 dark:text-red-300 mb-2">
                            ⚠️ Important Notes:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-red-800 dark:text-red-400 ml-2">
                            <li>Always click <strong>"Test Print"</strong> before saving settings</li>
                            <li>Direct printing requires <strong>backend API setup</strong> (see documentation)</li>
                            <li>For production use, assign <strong>static IP</strong> to network printers</li>
                            <li>Keep printer <strong>paper loaded</strong> and powered ON</li>
                            <li>Recommended paper: <strong>80mm thermal paper rolls</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
