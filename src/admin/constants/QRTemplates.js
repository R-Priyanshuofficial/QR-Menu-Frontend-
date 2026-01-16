export const QR_TEMPLATES = {
  royal: {
    id: 'royal',
    name: 'Royal',
    description: 'Purple & Gold - Sophisticated and regal',
    qrColor: '#4A148C',          // Deep purple
    backgroundColor: '#F3E5F5',   // Light purple
    borderColor: '#FFD700',       // Gold
    borderStyle: 'rounded',
    accentColor: '#9C27B0',      // Purple accent
    icon: '👑'
  },
  classy: {
    id: 'classy',
    name: 'Classy',
    description: 'Black, White & Gold - Elegant and timeless',
    qrColor: '#000000',          // Black
    backgroundColor: '#FFFFFF',   // White
    borderColor: '#D4AF37',       // Metallic gold
    borderStyle: 'square',
    accentColor: '#1A1A1A',      // Dark gray
    icon: '🎩'
  },
  fresh: {
    id: 'fresh',
    name: 'Fresh',
    description: 'Green & White - Organic and healthy',
    qrColor: '#1B5E20',          // Dark green
    backgroundColor: '#E8F5E9',   // Light green
    borderColor: '#4CAF50',       // Medium green
    borderStyle: 'rounded',
    accentColor: '#2E7D32',      // Forest green
    icon: '🌿'
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    description:'Red & Orange - Energetic and bold',
    qrColor: '#B71C1C',          // Dark red
    backgroundColor: '#FFEBEE',   // Light pink
    borderColor: '#FF5722',       // Deep orange
    borderStyle: 'circular',
    accentColor: '#D32F2F',      // Bright red
    icon: '🔥'
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Blue & Teal - Calm and professional',
    qrColor: '#01579B',          // Dark blue
    backgroundColor: '#E1F5FE',   // Light blue
    borderColor: '#00BCD4',       // Cyan
    borderStyle: 'rounded',
    accentColor: '#0277BD',      // Ocean blue
    icon: '🌊'
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Choose your own colors',
    qrColor: '#000000',
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderStyle: 'none',
    accentColor: '#666666',
    icon: '🎨'
  }
}

export const DEFAULT_TEMPLATE = 'royal'

// Helper to get template by ID
export const getTemplate = (id) => QR_TEMPLATES[id] || QR_TEMPLATES[DEFAULT_TEMPLATE]

// Get all templates as an array
export const getAllTemplates = () => Object.values(QR_TEMPLATES)
