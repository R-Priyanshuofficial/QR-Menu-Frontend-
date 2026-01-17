// Thermal Printer Service
import { formatCurrency } from './formatters';
import { getRestaurantInfo } from './gstHelper';
import toast from 'react-hot-toast';

/**
 * Get printer settings from localStorage
 */
export const getPrinterSettings = () => {
  try {
    const savedSettings = localStorage.getItem('restaurantSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.printer || {
        enabled: false,
        mode: 'browser',
        type: 'usb',
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
      };
    }
    return {
      enabled: false,
      mode: 'browser'
    };
  } catch (error) {
    console.error('Failed to load printer settings:', error);
    return {
      enabled: false,
      mode: 'browser'
    };
  }
};

/**
 * Print bill using configured method
 */
export const printBill = async (bill) => {
  const printerSettings = getPrinterSettings();

  if (printerSettings.mode === 'direct' && printerSettings.enabled) {
    // Use direct thermal printing
    return await printDirect(bill, printerSettings);
  } else {
    // Use browser print (default)
    return await printBrowser(bill);
  }
};

/**
 * Browser print method (opens print dialog)
 */
const printBrowser = async (bill) => {
  try {
    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML(bill);
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 250);

    return { success: true, method: 'browser' };
  } catch (error) {
    console.error('Browser print failed:', error);
    toast.error('Failed to open print dialog');
    return { success: false, method: 'browser', error };
  }
};

/**
 * Direct thermal print method (sends to backend API)
 */
const printDirect = async (bill, settings) => {
  try {
    toast.loading('Sending to printer...', { id: 'direct-print' });

    // Get API base URL from environment or default to localhost
    const API_URL = import.meta.env.VITE_API_URL || 'https://qr-menu-backend-lwba.onrender.com/api';

    // Prepare bill data with restaurant info
    const billData = {
      ...bill,
      restaurantInfo: {
        name: bill.restaurantInfo?.name || getRestaurantInfo().name,
        address: bill.restaurantInfo?.address || getRestaurantInfo().address,
        phone: bill.restaurantInfo?.phone || getRestaurantInfo().phone,
        gstNumber: bill.restaurantInfo?.gstNumber || getRestaurantInfo().gstNumber
      }
    };

    const response = await fetch(`${API_URL}/printer/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        bill: billData,
        printerSettings: settings,
        type: 'billing'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Print request failed');
    }

    toast.success('✅ Printed successfully!', { 
      id: 'direct-print',
      icon: '🖨️',
      duration: 3000
    });

    return { success: true, method: 'direct', data };
  } catch (error) {
    console.error('Direct print failed:', error);
    
    // Fallback to browser print
    toast.dismiss('direct-print');
    toast.error(`Direct print failed: ${error.message}. Opening browser print...`, {
      duration: 5000
    });
    
    return await printBrowser(bill);
  }
};

/**
 * Generate ESC/POS commands for thermal printer
 * This would be used by the backend service
 */
export const generateESCPOSCommands = (bill) => {
  const ESC = '\x1B';
  const GS = '\x1D';
  
  const commands = [];
  const restaurantInfo = getRestaurantInfo();
  
  // Initialize printer
  commands.push(ESC + '@'); // Initialize
  commands.push(ESC + 'a' + '\x01'); // Center align
  
  // Restaurant name (large, bold)
  commands.push(ESC + '!' + '\x30'); // Double height + width + bold
  commands.push(restaurantInfo.name.toUpperCase() + '\n');
  
  // Reset to normal
  commands.push(ESC + '!' + '\x00');
  
  // Restaurant details
  if (restaurantInfo.address) {
    commands.push(restaurantInfo.address + '\n');
  }
  if (restaurantInfo.phone) {
    commands.push('Ph: ' + restaurantInfo.phone + '\n');
  }
  if (restaurantInfo.gstNumber) {
    commands.push('GSTIN: ' + restaurantInfo.gstNumber + '\n');
  }
  
  commands.push('Thank you for your order!\n');
  commands.push('--- TAX INVOICE ---\n');
  commands.push('================================\n');
  
  // Left align for details
  commands.push(ESC + 'a' + '\x00');
  
  // Bill details
  commands.push('Date: ' + new Date(bill.lastOrderDate).toLocaleDateString() + '\n');
  commands.push('Time: ' + new Date(bill.lastOrderDate).toLocaleTimeString() + '\n');
  commands.push('Bill #: ' + bill.id.slice(-8).toUpperCase() + '\n');
  commands.push('--------------------------------\n');
  
  // Customer info
  commands.push('Customer: ' + bill.customerName + '\n');
  commands.push('Phone: ' + bill.customerPhone + '\n');
  commands.push('Orders: ' + bill.orders.length + '\n');
  commands.push('================================\n');
  
  // Items
  commands.push(ESC + '!' + '\x08'); // Bold
  commands.push('ITEMS:\n');
  commands.push(ESC + '!' + '\x00'); // Reset
  
  const allItems = bill.orders.flatMap(order => order.items);
  allItems.forEach(item => {
    const itemName = item.name.padEnd(20, ' ');
    const itemQty = `${item.quantity} x ${formatCurrency(item.price)}`;
    const itemTotal = formatCurrency(item.price * item.quantity);
    
    commands.push(itemName.substring(0, 20) + '\n');
    commands.push('  ' + itemQty.padEnd(18, ' ') + itemTotal.padStart(10, ' ') + '\n');
  });
  
  commands.push('================================\n');
  
  // Totals
  commands.push('Subtotal:'.padEnd(22, ' ') + formatCurrency(bill.subtotal).padStart(10, ' ') + '\n');
  
  if (bill.gst.enabled) {
    if (bill.gst.showBreakdown) {
      commands.push(`CGST (${bill.gst.cgstRate}%):`.padEnd(22, ' ') + formatCurrency(bill.gst.cgst).padStart(10, ' ') + '\n');
      commands.push(`SGST (${bill.gst.sgstRate}%):`.padEnd(22, ' ') + formatCurrency(bill.gst.sgst).padStart(10, ' ') + '\n');
    } else {
      commands.push(`GST (${bill.gst.totalRate}%):`.padEnd(22, ' ') + formatCurrency(bill.gst.total).padStart(10, ' ') + '\n');
    }
  }
  
  commands.push('--------------------------------\n');
  
  // Total (bold, large)
  commands.push(ESC + '!' + '\x20'); // Double height + bold
  commands.push('TOTAL:'.padEnd(16, ' ') + formatCurrency(bill.totalAmount).padStart(10, ' ') + '\n');
  commands.push(ESC + '!' + '\x00'); // Reset
  
  commands.push('================================\n');
  
  // Footer
  commands.push(ESC + 'a' + '\x01'); // Center
  commands.push('Total Items: ' + bill.itemCount + '\n');
  
  if (bill.gst.enabled) {
    commands.push(`Tax: ${bill.gst.totalRate}% (CGST: ${bill.gst.cgstRate}% + SGST: ${bill.gst.sgstRate}%)\n`);
  }
  
  commands.push('\n');
  commands.push('*** Thank You! Visit Again ***\n');
  commands.push('Powered by QR Menu System\n');
  commands.push('\n\n\n');
  
  // Cut paper
  commands.push(GS + 'V' + '\x00');
  
  return commands.join('');
};

/**
 * Generate HTML receipt for browser printing
 */
const generateReceiptHTML = (bill) => {
  const allItems = bill.orders.flatMap(order => 
    order.items.map(item => ({
      ...item,
      orderId: order._id,
      orderTime: order.createdAt
    }))
  );

  const restaurantInfo = getRestaurantInfo();

  // Generate GST rows
  let gstRows = '';
  if (bill.gst.enabled) {
    if (bill.gst.showBreakdown) {
      gstRows = `
        <div class="row">
          <span>CGST (${bill.gst.cgstRate}%):</span>
          <span>${formatCurrency(bill.gst.cgst)}</span>
        </div>
        <div class="row">
          <span>SGST (${bill.gst.sgstRate}%):</span>
          <span>${formatCurrency(bill.gst.sgst)}</span>
        </div>
      `;
    } else {
      gstRows = `
        <div class="row">
          <span>GST (${bill.gst.totalRate}%):</span>
          <span>${formatCurrency(bill.gst.total)}</span>
        </div>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${bill.customerName}</title>
        <style>
          @media print {
            @page { 
              margin: 0;
              size: 80mm auto;
            }
            body { margin: 0.5cm; }
          }
          body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          .restaurant-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .restaurant-logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
            margin: 0 auto 6px;
          }
          .receipt-title {
            font-size: 14px;
            margin: 10px 0;
          }
          .section {
            margin: 12px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          .item-row {
            margin: 6px 0;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-left: 8px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .total-section {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 8px 0;
            margin: 12px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 10px;
          }
          .gst-info {
            font-size: 9px;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${restaurantInfo.logo ? `<img src="${restaurantInfo.logo}" class="restaurant-logo" alt="${(restaurantInfo.name || 'Restaurant')} logo" />` : ''}
          <div class="restaurant-name">${(restaurantInfo.name || 'QR MENU RESTAURANT').toUpperCase()}</div>
          ${restaurantInfo.address ? `<div style="font-size: 10px;">${restaurantInfo.address}</div>` : ''}
          ${restaurantInfo.phone ? `<div style="font-size: 10px;">Ph: ${restaurantInfo.phone}</div>` : ''}
          ${restaurantInfo.gstNumber ? `<div class="gst-info">GSTIN: ${restaurantInfo.gstNumber}</div>` : ''}
          <div>Thank you for your order!</div>
          <div class="receipt-title">--- TAX INVOICE ---</div>
        </div>

        <div class="section">
          <div class="row">
            <span>Date:</span>
            <span>${new Date(bill.lastOrderDate).toLocaleDateString()}</span>
          </div>
          <div class="row">
            <span>Time:</span>
            <span>${new Date(bill.lastOrderDate).toLocaleTimeString()}</span>
          </div>
          <div class="row">
            <span>Bill #:</span>
            <span>${bill.id.slice(-8).toUpperCase()}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="row">
            <span>Customer:</span>
            <span>${bill.customerName}</span>
          </div>
          <div class="row">
            <span>Phone:</span>
            <span>${bill.customerPhone}</span>
          </div>
          <div class="row">
            <span>Orders:</span>
            <span>${bill.orders.length}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div style="font-weight: bold; margin-bottom: 8px;">ITEMS:</div>
          ${allItems.map(item => `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              <div class="item-details">
                <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="total-section">
          <div class="row">
            <span>Subtotal:</span>
            <span>${formatCurrency(bill.subtotal)}</span>
          </div>
          ${gstRows}
          <div class="divider"></div>
          <div class="total-row">
            <span>TOTAL:</span>
            <span>${formatCurrency(bill.totalAmount)}</span>
          </div>
        </div>

        <div class="footer">
          <div>Total Items: ${bill.itemCount}</div>
          ${bill.gst.enabled ? `<div style="margin-top: 8px; font-size: 9px;">Tax: ${bill.gst.totalRate}% (CGST: ${bill.gst.cgstRate}% + SGST: ${bill.gst.sgstRate}%)</div>` : ''}
          <div style="margin-top: 12px;">*** Thank You! Visit Again ***</div>
          <div style="margin-top: 8px;">Powered by QR Menu System</div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Auto-print on order complete (if enabled)
 */
export const autoPrintOnComplete = async (bill) => {
  const printerSettings = getPrinterSettings();
  
  if (printerSettings.autoPrint?.onOrderComplete && printerSettings.mode === 'direct') {
    return await printBill(bill);
  }
  
  return { success: false, reason: 'Auto-print not enabled' };
};
