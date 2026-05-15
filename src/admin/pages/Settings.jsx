import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Receipt, Percent, Save, Info,
  DollarSign, AlertCircle, Printer, Wifi, Usb, Bluetooth,
  Check, Bell, Volume2, VolumeX, Image as ImageIcon
} from 'lucide-react';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Input, TextArea } from '@shared/components/Input';
import { PageHeader } from '@shared/components/PageHeader';
import { Toggle } from '@shared/components/Toggle';
import toast from 'react-hot-toast';
import { useSocket } from '@shared/contexts/SocketContext';
import { playNotificationSound } from '@shared/utils/pushNotifications';

const DEFAULT_SETTINGS = {
  gst: { enabled: true, rate: 5, cgst: 2.5, sgst: 2.5, showBreakdown: true },
  restaurant: { name: 'QR Menu Restaurant', address: '', phone: '', gstNumber: '', logo: '' },
  printer: {
    enabled: false, mode: 'browser', type: 'usb',
    connection: { usbPort: 'COM1', networkIp: '192.168.1.100', networkPort: 9100, bluetoothDevice: '' },
    autoPrint: { onOrderComplete: false, onOrderReceived: false },
    printers: { billing: { enabled: true, name: 'Billing Printer' }, kitchen: { enabled: false, name: 'Kitchen Printer' } }
  }
};

export const Settings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { soundEnabled, setNotificationSoundEnabled } = useSocket();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('restaurantSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({
          gst: { ...DEFAULT_SETTINGS.gst, ...parsed.gst },
          restaurant: { ...DEFAULT_SETTINGS.restaurant, ...parsed.restaurant },
          printer: {
            ...DEFAULT_SETTINGS.printer, ...parsed.printer,
            connection: { ...DEFAULT_SETTINGS.printer.connection, ...(parsed.printer?.connection || {}) },
            autoPrint: { ...DEFAULT_SETTINGS.printer.autoPrint, ...(parsed.printer?.autoPrint || {}) },
            printers: { ...DEFAULT_SETTINGS.printer.printers, ...(parsed.printer?.printers || {}) }
          }
        });
      }
    } catch (e) { console.error('Failed to load settings:', e); setSettings(DEFAULT_SETTINGS); }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      if (settings.gst.rate < 0 || settings.gst.rate > 100) return toast.error('GST rate must be between 0% and 100%');
      localStorage.setItem('restaurantSettings', JSON.stringify(settings));
      toast.success('Settings saved successfully!');
      setHasChanges(false);
    } catch (e) { toast.error('Failed to save settings'); } finally { setLoading(false); }
  };

  const handleGSTToggle = () => { setSettings(p => ({ ...p, gst: { ...p.gst, enabled: !p.gst.enabled } })); setHasChanges(true); };
  const handleGSTRateChange = (rate) => {
    const numRate = parseFloat(rate); if (isNaN(numRate)) return;
    setSettings(p => ({ ...p, gst: { ...p.gst, rate: numRate, cgst: numRate / 2, sgst: numRate / 2 } }));
    setHasChanges(true);
  };
  const handleBreakdownToggle = () => { setSettings(p => ({ ...p, gst: { ...p.gst, showBreakdown: !p.gst.showBreakdown } })); setHasChanges(true); };
  const hUpdate = (group, field, value) => { setSettings(p => ({ ...p, [group]: { ...p[group], [field]: value } })); setHasChanges(true); };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => hUpdate('restaurant', 'logo', reader.result);
    reader.onerror = () => toast.error('Failed to read logo file');
    reader.readAsDataURL(file); e.target.value = '';
  };

  const resetToDefault = () => { setSettings(DEFAULT_SETTINGS); setHasChanges(true); toast.success('Settings reset to default'); };
  const toggleSound = () => { setNotificationSoundEnabled(!soundEnabled); toast.success(`Notification sound ${!soundEnabled ? 'enabled' : 'muted'}`); };
  const handleTestNotificationSound = () => { playNotificationSound(); toast.success('Playing notification sound'); };

  const hPrinterUpdate = (field, val) => { setSettings(p => ({ ...p, printer: { ...p.printer, [field]: val } })); setHasChanges(true); };
  const hConnectionUpdate = (field, val) => { setSettings(p => ({ ...p, printer: { ...p.printer, connection: { ...p.printer.connection, [field]: val } } })); setHasChanges(true); };
  const toggleAutoPrint = (field) => { setSettings(p => ({ ...p, printer: { ...p.printer, autoPrint: { ...p.printer.autoPrint, [field]: !p.printer.autoPrint[field] } } })); setHasChanges(true); };

  const testPrinter = async () => {
    try {
      setLoading(true); toast.loading('Testing printer connection...', { id: 'printer-test' });
      const API_URL = import.meta.env.VITE_API_URL || 'https://qr-menu-backend-lwba.onrender.com/api';
      const res = await fetch(`${API_URL}/printer/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ type: settings.printer.type, connection: settings.printer.connection })
      });
      const data = await res.json();
      toast.dismiss('printer-test');
      if (!res.ok) throw new Error(data.message || 'Printer test failed');
      toast.success('✅ Test print successful!');
    } catch (e) { toast.dismiss('printer-test'); toast.error(`❌ Printer test failed: ${e.message}`); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      <PageHeader title="Store Settings" subtitle="Preferences, tax settings, and hardware configuration" icon={SettingsIcon} actions={
        <div className="flex gap-2">
          {hasChanges && <Button onClick={resetToDefault} variant="outline">Reset to Default</Button>}
          <Button onClick={saveSettings} disabled={!hasChanges || loading} variant={hasChanges ? 'gradient' : 'primary'} leftIcon={<Save className="w-4 h-4" />}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      } />

      {hasChanges && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-400">You have unsaved changes. Don't forget to save!</p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Notifications */}
          <Card accent="primary">
            <div className="px-6 py-4 border-b border-surface-700/40 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-400" />
              <h2 className="text-base font-semibold text-surface-100 font-display">Notifications</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-surface-200">Order Alerts Sound</h3>
                  <p className="text-sm text-surface-500 mt-1">Play an audio chime for new orders</p>
                </div>
                <div className="flex items-center gap-4">
                  <Toggle checked={soundEnabled} onChange={toggleSound} />
                  <Button variant="outline" size="sm" onClick={handleTestNotificationSound} leftIcon={<Volume2 className="w-4 h-4" />}>Test</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* GST */}
          <Card accent="sky">
            <div className="px-6 py-4 border-b border-surface-700/40 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-semibold text-surface-100 font-display">GST Configuration</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-surface-800/30 rounded-xl border border-surface-700/30">
                <div>
                  <h3 className="font-semibold text-surface-100 mb-0.5">Enable GST</h3>
                  <p className="text-sm text-surface-500">Apply GST to all customer bills</p>
                </div>
                <Toggle checked={settings.gst.enabled} onChange={handleGSTToggle} />
              </div>

              <div className={`space-y-4 transition-opacity ${!settings.gst.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <Input label="GST Rate (%)" type="number" step="0.1" value={settings.gst.rate} onChange={(e) => handleGSTRateChange(e.target.value)} disabled={!settings.gst.enabled} leftIcon={<Percent className="w-4 h-4" />} />
                  <p className="mt-1.5 text-xs text-surface-500">Standard rate is 5% in India.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="CGST (%)" value={settings.gst.cgst} disabled />
                  <Input label="SGST (%)" value={settings.gst.sgst} disabled />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-surface-200 mb-0.5">Show Breakdown</h3>
                    <p className="text-xs text-surface-500">Display separate CGST and SGST on receipts</p>
                  </div>
                  <Toggle checked={settings.gst.showBreakdown} onChange={handleBreakdownToggle} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Billing */}
          <Card accent="emerald">
            <div className="px-6 py-4 border-b border-surface-700/40 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-surface-100 font-display">Billing Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Business Name" value={settings.restaurant.name} onChange={(e) => hUpdate('restaurant', 'name', e.target.value)} placeholder="Appears on bills" />

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Business Logo</label>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-surface-600 flex items-center justify-center bg-surface-800/50 overflow-hidden shrink-0">
                    {settings.restaurant.logo ? <img src={settings.restaurant.logo} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-surface-500" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer">
                        <span className="px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg text-sm font-medium transition-colors">Upload Logo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                      {settings.restaurant.logo && <Button variant="outline" size="sm" onClick={() => hUpdate('restaurant', 'logo', '')}>Remove</Button>}
                    </div>
                    <Input placeholder="Or paste image URL" value={settings.restaurant.logo || ''} onChange={(e) => hUpdate('restaurant', 'logo', e.target.value)} />
                  </div>
                </div>
              </div>

              <TextArea label="Business Address" value={settings.restaurant.address} onChange={(e) => hUpdate('restaurant', 'address', e.target.value)} rows={2} />
              <Input label="Phone Number" type="tel" value={settings.restaurant.phone} onChange={(e) => hUpdate('restaurant', 'phone', e.target.value)} />
              <Input label="GSTIN" value={settings.restaurant.gstNumber} onChange={(e) => hUpdate('restaurant', 'gstNumber', e.target.value.toUpperCase())} placeholder="15-digit GST registration" />
              <Input label="UPI ID" value={settings.restaurant.upiId || ''} onChange={(e) => hUpdate('restaurant', 'upiId', e.target.value)} placeholder="yourname@upi" />
            </div>
          </Card>
        </div>

        {/* Printer Config — Full Width */}
        <div className="lg:col-span-2">
          <Card accent="violet">
            <div className="px-6 py-4 border-b border-surface-700/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-violet-400" />
                <h2 className="text-base font-semibold text-surface-100 font-display">Thermal Printer Config</h2>
              </div>
              {settings.printer.mode === 'direct' && <Button size="sm" variant="outline" onClick={testPrinter} disabled={loading}>Test Print</Button>}
            </div>

            <div className="p-6 space-y-8">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-3">Printing Mode</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div onClick={() => hPrinterUpdate('mode', 'browser')} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${settings.printer.mode === 'browser' ? 'border-primary-500 bg-primary-500/10' : 'border-surface-700/40 hover:border-surface-600/50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                        <Receipt className="w-4 h-4" /> Browser Print
                      </h3>
                      {settings.printer.mode === 'browser' && <Check className="w-4 h-4 text-primary-400" />}
                    </div>
                    <p className="text-sm text-surface-500 font-medium">Standard browser print dialog. Best for regular printers.</p>
                  </div>
                  <div onClick={() => hPrinterUpdate('mode', 'direct')} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${settings.printer.mode === 'direct' ? 'border-primary-500 bg-primary-500/10' : 'border-surface-700/40 hover:border-surface-600/50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Direct Thermal Print
                      </h3>
                      {settings.printer.mode === 'direct' && <Check className="w-4 h-4 text-primary-400" />}
                    </div>
                    <p className="text-sm text-surface-500 font-medium">Auto-print via local network. Professional workflow.</p>
                  </div>
                </div>
              </div>

              {settings.printer.mode === 'direct' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-3">Connection Type</label>
                    <div className="flex gap-2">
                      {['usb', 'network', 'bluetooth'].map(type => (
                        <button key={type} onClick={() => hPrinterUpdate('type', type)} className={`px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wide transition-all border ${settings.printer.type === type ? 'bg-white text-surface-950 border-white' : 'bg-transparent text-surface-400 border-surface-700/40 hover:bg-surface-800/50 hover:text-surface-300'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {settings.printer.type === 'usb' && <Input label="USB Port" value={settings.printer.connection.usbPort} onChange={(e) => hConnectionUpdate('usbPort', e.target.value)} placeholder="COM1 or /dev/usb/lp0" />}
                    {settings.printer.type === 'network' && (
                      <>
                        <Input label="IP Address" value={settings.printer.connection.networkIp} onChange={(e) => hConnectionUpdate('networkIp', e.target.value)} placeholder="192.168.1.100" />
                        <Input label="Port Number" type="number" value={settings.printer.connection.networkPort} onChange={(e) => hConnectionUpdate('networkPort', e.target.value)} placeholder="9100" />
                      </>
                    )}
                    {settings.printer.type === 'bluetooth' && <Input label="Bluetooth Device Name" value={settings.printer.connection.bluetoothDevice} onChange={(e) => hConnectionUpdate('bluetoothDevice', e.target.value)} placeholder="POS-80" />}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-800/30 rounded-xl border border-surface-700/30">
                    <div>
                      <h3 className="font-semibold text-surface-100 mb-0.5">Auto-Print Receipts</h3>
                      <p className="text-sm text-surface-500">Automatically print the receipt when an order is marked ready.</p>
                    </div>
                    <Toggle checked={settings.printer.autoPrint.onOrderComplete} onChange={() => toggleAutoPrint('onOrderComplete')} />
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
