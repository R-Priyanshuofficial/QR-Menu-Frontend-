/**
 * QR Design Config - Central schema and category-based theme generator.
 * This file is the single source of truth for enum validation and defaults.
 */

export const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
  { value: 'bar', label: 'Bar', icon: '🍸' },
  { value: 'bakery', label: 'Bakery', icon: '🧁' },
  { value: 'cloud-kitchen', label: 'Cloud Kitchen', icon: '🏭' },
  { value: 'food-truck', label: 'Food Truck', icon: '🚚' },
  { value: 'other', label: 'Other', icon: '🏪' },
]

export const DOT_STYLES = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
]

export const CORNER_SQUARE_STYLES = [
  { value: 'square', label: 'Square' },
  { value: 'extra-rounded', label: 'Rounded' },
  { value: 'dot', label: 'Dot' },
]

export const CORNER_DOT_STYLES = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
]

export const FRAME_STYLES = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid Border' },
  { value: 'dashed', label: 'Dashed Border' },
]

export const VALID_DOT_TYPES = DOT_STYLES.map((style) => style.value)
export const VALID_CORNER_SQUARE_TYPES = CORNER_SQUARE_STYLES.map((style) => style.value)
export const VALID_CORNER_DOT_TYPES = CORNER_DOT_STYLES.map((style) => style.value)
export const VALID_BORDER_STYLES = FRAME_STYLES.map((style) => style.value)

const VALID_ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H']
const VALID_CATEGORIES = CATEGORIES.map((category) => category.value)
const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}){1,2}$/

const LEGACY_BORDER_STYLE_MAP = {
  simple: 'solid',
  basic: 'solid',
  default: 'solid',
  square: 'solid',
  rounded: 'solid',
  elegant: 'solid',
  shadow: 'dashed',
  circular: 'dashed',
}

const CATEGORY_THEMES = {
  restaurant: {
    dotsOptions: { type: 'classy', color: '#8B0000' },
    cornersSquareOptions: { type: 'extra-rounded', color: '#D4AF37' },
    cornersDotOptions: { type: 'dot', color: '#D4AF37' },
    backgroundOptions: { type: 'single', color: '#FFFDF5' },
    frame: { style: 'solid', color: '#D4AF37', padding: 20, shadow: true, glow: false },
  },
  cafe: {
    dotsOptions: { type: 'rounded', color: '#4E342E' },
    cornersSquareOptions: { type: 'extra-rounded', color: '#795548' },
    cornersDotOptions: { type: 'dot', color: '#795548' },
    backgroundOptions: { type: 'single', color: '#FFF8E1' },
    frame: { style: 'solid', color: '#A1887F', padding: 16, shadow: true, glow: false },
  },
  bar: {
    dotsOptions: { type: 'dots', color: '#1A1A2E' },
    cornersSquareOptions: { type: 'dot', color: '#E94560' },
    cornersDotOptions: { type: 'dot', color: '#E94560' },
    backgroundOptions: { type: 'single', color: '#0F0F1A' },
    frame: { style: 'dashed', color: '#E94560', padding: 18, shadow: false, glow: true },
  },
  bakery: {
    dotsOptions: { type: 'extra-rounded', color: '#D84315' },
    cornersSquareOptions: { type: 'extra-rounded', color: '#FF8A65' },
    cornersDotOptions: { type: 'dot', color: '#FF8A65' },
    backgroundOptions: { type: 'single', color: '#FFF3E0' },
    frame: { style: 'solid', color: '#FFAB91', padding: 16, shadow: true, glow: false },
  },
  'cloud-kitchen': {
    dotsOptions: { type: 'classy-rounded', color: '#1565C0' },
    cornersSquareOptions: { type: 'extra-rounded', color: '#42A5F5' },
    cornersDotOptions: { type: 'square', color: '#42A5F5' },
    backgroundOptions: { type: 'single', color: '#E3F2FD' },
    frame: { style: 'solid', color: '#90CAF9', padding: 14, shadow: false, glow: false },
  },
  'food-truck': {
    dotsOptions: { type: 'rounded', color: '#E65100' },
    cornersSquareOptions: { type: 'dot', color: '#FF6D00' },
    cornersDotOptions: { type: 'dot', color: '#FF6D00' },
    backgroundOptions: { type: 'single', color: '#FFF9C4' },
    frame: { style: 'dashed', color: '#FFB300', padding: 16, shadow: true, glow: false },
  },
  other: {
    dotsOptions: { type: 'square', color: '#212121' },
    cornersSquareOptions: { type: 'square', color: '#424242' },
    cornersDotOptions: { type: 'square', color: '#424242' },
    backgroundOptions: { type: 'single', color: '#FFFFFF' },
    frame: { style: 'solid', color: '#9E9E9E', padding: 14, shadow: false, glow: false },
  },
}

export const DEFAULT_DESIGN_CONFIG = {
  dotsOptions: { type: 'rounded', color: '#2D2D2D', gradient: null },
  cornersSquareOptions: { type: 'extra-rounded', color: '#2D2D2D' },
  cornersDotOptions: { type: 'dot', color: '#2D2D2D' },
  backgroundOptions: { type: 'single', color: '#FFFFFF', gradient: null },
  imageOptions: { imageSize: 0.35, margin: 4 },
  qrOptions: { errorCorrectionLevel: 'H' },
  frame: { style: 'solid', color: '#2D2D2D', padding: 16, shadow: true, glow: false },
  meta: { restaurantName: '', tagline: '', category: 'restaurant' },
  logo: null,
  avatarId: null,
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function isHexColor(value) {
  return typeof value === 'string' && HEX_COLOR_REGEX.test(value.trim())
}

function sanitizeColor(value, fallback) {
  return isHexColor(value) ? value : fallback
}

function sanitizeGradient(gradient, fallbackStart, fallbackEnd) {
  if (!gradient || typeof gradient !== 'object') return null
  const type = gradient.type === 'radial' ? 'radial' : 'linear'
  const rotation = Math.round(clamp(Number(gradient.rotation), 0, 360, 0))
  const stops = Array.isArray(gradient.colorStops) ? gradient.colorStops : []
  const startStop = stops[0] || {}
  const endStop = stops[1] || {}

  return {
    type,
    rotation,
    colorStops: [
      {
        offset: clamp(Number(startStop.offset), 0, 1, 0),
        color: sanitizeColor(startStop.color, fallbackStart),
      },
      {
        offset: clamp(Number(endStop.offset), 0, 1, 1),
        color: sanitizeColor(endStop.color, fallbackEnd),
      },
    ],
  }
}

export function sanitizeBorderStyle(borderStyle) {
  const normalized = typeof borderStyle === 'string' ? borderStyle.toLowerCase().trim() : ''
  const mapped = LEGACY_BORDER_STYLE_MAP[normalized] || normalized
  return VALID_BORDER_STYLES.includes(mapped) ? mapped : 'none'
}

export function sanitizeDesignConfig(rawConfig = {}) {
  const source = rawConfig && typeof rawConfig === 'object' ? rawConfig : {}
  const merged = {
    ...DEFAULT_DESIGN_CONFIG,
    ...source,
    dotsOptions: { ...DEFAULT_DESIGN_CONFIG.dotsOptions, ...(source.dotsOptions || {}) },
    cornersSquareOptions: { ...DEFAULT_DESIGN_CONFIG.cornersSquareOptions, ...(source.cornersSquareOptions || {}) },
    cornersDotOptions: { ...DEFAULT_DESIGN_CONFIG.cornersDotOptions, ...(source.cornersDotOptions || {}) },
    backgroundOptions: { ...DEFAULT_DESIGN_CONFIG.backgroundOptions, ...(source.backgroundOptions || {}) },
    imageOptions: { ...DEFAULT_DESIGN_CONFIG.imageOptions, ...(source.imageOptions || {}) },
    qrOptions: { ...DEFAULT_DESIGN_CONFIG.qrOptions, ...(source.qrOptions || {}) },
    frame: { ...DEFAULT_DESIGN_CONFIG.frame, ...(source.frame || {}) },
    meta: { ...DEFAULT_DESIGN_CONFIG.meta, ...(source.meta || {}) },
  }

  const dotsColor = sanitizeColor(merged.dotsOptions.color, DEFAULT_DESIGN_CONFIG.dotsOptions.color)
  const cornerSqColor = sanitizeColor(
    merged.cornersSquareOptions.color,
    DEFAULT_DESIGN_CONFIG.cornersSquareOptions.color
  )
  const cornerDotColor = sanitizeColor(merged.cornersDotOptions.color, cornerSqColor)
  const bgColor = sanitizeColor(merged.backgroundOptions.color, DEFAULT_DESIGN_CONFIG.backgroundOptions.color)
  const frameColor = sanitizeColor(merged.frame.color, DEFAULT_DESIGN_CONFIG.frame.color)
  const category = VALID_CATEGORIES.includes(merged.meta.category)
    ? merged.meta.category
    : DEFAULT_DESIGN_CONFIG.meta.category

  return {
    dotsOptions: {
      type: VALID_DOT_TYPES.includes(merged.dotsOptions.type)
        ? merged.dotsOptions.type
        : DEFAULT_DESIGN_CONFIG.dotsOptions.type,
      color: dotsColor,
      gradient: sanitizeGradient(merged.dotsOptions.gradient, dotsColor, cornerSqColor),
    },
    cornersSquareOptions: {
      type: VALID_CORNER_SQUARE_TYPES.includes(merged.cornersSquareOptions.type)
        ? merged.cornersSquareOptions.type
        : DEFAULT_DESIGN_CONFIG.cornersSquareOptions.type,
      color: cornerSqColor,
    },
    cornersDotOptions: {
      type: VALID_CORNER_DOT_TYPES.includes(merged.cornersDotOptions.type)
        ? merged.cornersDotOptions.type
        : DEFAULT_DESIGN_CONFIG.cornersDotOptions.type,
      color: cornerDotColor,
    },
    backgroundOptions: {
      type: 'single',
      color: bgColor,
      gradient: sanitizeGradient(merged.backgroundOptions.gradient, bgColor, bgColor),
    },
    imageOptions: {
      imageSize: clamp(
        Number(merged.imageOptions.imageSize),
        0.2,
        0.5,
        DEFAULT_DESIGN_CONFIG.imageOptions.imageSize
      ),
      margin: Math.round(
        clamp(Number(merged.imageOptions.margin), 0, 12, DEFAULT_DESIGN_CONFIG.imageOptions.margin)
      ),
    },
    qrOptions: {
      errorCorrectionLevel: VALID_ERROR_CORRECTION_LEVELS.includes(merged.qrOptions.errorCorrectionLevel)
        ? merged.qrOptions.errorCorrectionLevel
        : DEFAULT_DESIGN_CONFIG.qrOptions.errorCorrectionLevel,
    },
    frame: {
      style: sanitizeBorderStyle(merged.frame.style),
      color: frameColor,
      padding: Math.round(clamp(Number(merged.frame.padding), 4, 40, DEFAULT_DESIGN_CONFIG.frame.padding)),
      shadow: Boolean(merged.frame.shadow),
      glow: Boolean(merged.frame.glow),
    },
    meta: {
      restaurantName: typeof merged.meta.restaurantName === 'string' ? merged.meta.restaurantName : '',
      tagline: typeof merged.meta.tagline === 'string' ? merged.meta.tagline : '',
      category,
    },
    logo: typeof merged.logo === 'string' ? merged.logo : null,
    avatarId: typeof merged.avatarId === 'string' ? merged.avatarId : null,
  }
}

export function buildSafeQRStylingOptions(config, data, imageUrl, size = 280) {
  const safeConfig = sanitizeDesignConfig(config)
  const backgroundOptions = safeConfig.backgroundOptions.gradient
    ? { gradient: safeConfig.backgroundOptions.gradient }
    : { color: safeConfig.backgroundOptions.color }

  return {
    width: size,
    height: size,
    data,
    image: imageUrl || safeConfig.logo || undefined,
    dotsOptions: {
      type: safeConfig.dotsOptions.type,
      color: safeConfig.dotsOptions.gradient ? undefined : safeConfig.dotsOptions.color,
      gradient: safeConfig.dotsOptions.gradient || undefined,
    },
    cornersSquareOptions: {
      type: safeConfig.cornersSquareOptions.type,
      color: safeConfig.cornersSquareOptions.color,
    },
    cornersDotOptions: {
      type: safeConfig.cornersDotOptions.type,
      color: safeConfig.cornersDotOptions.color,
    },
    backgroundOptions,
    imageOptions: {
      crossOrigin: 'anonymous',
      imageSize: safeConfig.imageOptions.imageSize,
      margin: safeConfig.imageOptions.margin,
    },
    qrOptions: {
      errorCorrectionLevel: safeConfig.qrOptions.errorCorrectionLevel,
    },
  }
}

export function generateThemeForCategory(category) {
  const theme = CATEGORY_THEMES[category] || CATEGORY_THEMES.other
  return sanitizeDesignConfig({
    ...DEFAULT_DESIGN_CONFIG,
    ...theme,
    meta: { ...DEFAULT_DESIGN_CONFIG.meta, category },
  })
}

const RANDOM_DOT_TYPES = [...VALID_DOT_TYPES]
const RANDOM_CORNER_SQ = [...VALID_CORNER_SQUARE_TYPES]
const RANDOM_CORNER_DOT = [...VALID_CORNER_DOT_TYPES]
const RANDOM_FRAME_STYLES = [...VALID_BORDER_STYLES]

const COLOR_PALETTES = [
  { dots: '#1B1F3B', cornerSq: '#E63946', cornerDot: '#E63946', bg: '#F1FAEE', frame: '#457B9D' },
  { dots: '#2D3436', cornerSq: '#D63031', cornerDot: '#D63031', bg: '#DFE6E9', frame: '#636E72' },
  { dots: '#0C2461', cornerSq: '#E58E26', cornerDot: '#E58E26', bg: '#FFEAA7', frame: '#0C2461' },
  { dots: '#2C3E50', cornerSq: '#16A085', cornerDot: '#16A085', bg: '#ECF0F1', frame: '#2C3E50' },
  { dots: '#4A0E4E', cornerSq: '#C850C0', cornerDot: '#C850C0', bg: '#FAF0FF', frame: '#4A0E4E' },
  { dots: '#1A1A2E', cornerSq: '#E94560', cornerDot: '#E94560', bg: '#FAFAFA', frame: '#16213E' },
  { dots: '#2B2D42', cornerSq: '#EF233C', cornerDot: '#EF233C', bg: '#EDF2F4', frame: '#8D99AE' },
  { dots: '#3D0C02', cornerSq: '#C1440E', cornerDot: '#C1440E', bg: '#FFF5E4', frame: '#3D0C02' },
  { dots: '#1D3557', cornerSq: '#E76F51', cornerDot: '#E76F51', bg: '#FEFAE0', frame: '#264653' },
  { dots: '#370617', cornerSq: '#DC2F02', cornerDot: '#DC2F02', bg: '#FFF0F5', frame: '#6A040F' },
]

export function smartGenerate(category) {
  const palette = pick(COLOR_PALETTES)
  const dotType = pick(RANDOM_DOT_TYPES)
  const cornerSqType = pick(RANDOM_CORNER_SQ)
  const cornerDotType = pick(RANDOM_CORNER_DOT)
  const frameStyle = pick(RANDOM_FRAME_STYLES)
  const useGradient = Math.random() > 0.65

  return sanitizeDesignConfig({
    dotsOptions: {
      type: dotType,
      color: palette.dots,
      gradient: useGradient
        ? {
            type: Math.random() > 0.5 ? 'linear' : 'radial',
            rotation: Math.floor(Math.random() * 360),
            colorStops: [
              { offset: 0, color: palette.dots },
              { offset: 1, color: palette.cornerSq },
            ],
          }
        : null,
    },
    cornersSquareOptions: { type: cornerSqType, color: palette.cornerSq },
    cornersDotOptions: { type: cornerDotType, color: palette.cornerDot },
    backgroundOptions: { type: 'single', color: palette.bg, gradient: null },
    imageOptions: {
      imageSize: 0.3 + Math.random() * 0.15,
      margin: 3 + Math.floor(Math.random() * 4),
    },
    qrOptions: { errorCorrectionLevel: 'H' },
    frame: {
      style: frameStyle,
      color: palette.frame,
      padding: 12 + Math.floor(Math.random() * 14),
      shadow: Math.random() > 0.4,
      glow: Math.random() > 0.8,
    },
    meta: { restaurantName: '', tagline: '', category: category || 'restaurant' },
  })
}
