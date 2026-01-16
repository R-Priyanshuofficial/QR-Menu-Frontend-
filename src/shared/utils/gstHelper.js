// GST Helper Functions

const DEFAULT_GST_SETTINGS = {
  enabled: true,
  rate: 5,
  cgst: 2.5,
  sgst: 2.5,
  showBreakdown: true
};

/**
 * Get GST settings from localStorage
 */
export const getGSTSettings = () => {
  try {
    const savedSettings = localStorage.getItem('restaurantSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.gst || DEFAULT_GST_SETTINGS;
    }
    return DEFAULT_GST_SETTINGS;
  } catch (error) {
    console.error('Failed to load GST settings:', error);
    return DEFAULT_GST_SETTINGS;
  }
};

/**
 * Get restaurant info from localStorage
 */
export const getRestaurantInfo = () => {
  try {
    const savedSettings = localStorage.getItem('restaurantSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.restaurant || {
        name: 'QR Menu Restaurant',
        address: '',
        phone: '',
        gstNumber: '',
        logo: ''
      };
    }
    return {
      name: 'QR Menu Restaurant',
      address: '',
      phone: '',
      gstNumber: '',
      logo: ''
    };
  } catch (error) {
    console.error('Failed to load restaurant info:', error);
    return {
      name: 'QR Menu Restaurant',
      address: '',
      phone: '',
      gstNumber: '',
      logo: ''
    };
  }
};

/**
 * Calculate GST amount based on subtotal
 */
export const calculateGST = (subtotal) => {
  const gstSettings = getGSTSettings();
  
  if (!gstSettings.enabled) {
    return {
      cgst: 0,
      sgst: 0,
      total: 0,
      enabled: false
    };
  }

  const cgstAmount = (subtotal * gstSettings.cgst) / 100;
  const sgstAmount = (subtotal * gstSettings.sgst) / 100;
  const totalGST = cgstAmount + sgstAmount;

  return {
    cgst: cgstAmount,
    sgst: sgstAmount,
    total: totalGST,
    cgstRate: gstSettings.cgst,
    sgstRate: gstSettings.sgst,
    totalRate: gstSettings.rate,
    showBreakdown: gstSettings.showBreakdown,
    enabled: true
  };
};

/**
 * Calculate final total with GST
 */
export const calculateTotalWithGST = (subtotal) => {
  const gst = calculateGST(subtotal);
  return subtotal + gst.total;
};

/**
 * Format GST details for display
 */
export const formatGSTDetails = (subtotal) => {
  const gst = calculateGST(subtotal);
  const restaurantInfo = getRestaurantInfo();

  return {
    subtotal,
    gst,
    total: subtotal + gst.total,
    restaurantInfo
  };
};
