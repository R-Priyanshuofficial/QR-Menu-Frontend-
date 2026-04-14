import { useState, useCallback } from 'react'
import {
  DEFAULT_DESIGN_CONFIG,
  buildSafeQRStylingOptions,
  generateThemeForCategory,
  sanitizeDesignConfig,
  smartGenerate,
} from '../constants/designConfigDefaults'

/**
 * Custom hook for managing QR design configuration state.
 * Single source of truth for preview rendering and save operations.
 */
export function useQRDesignConfig(initialConfig = null) {
  const [config, setConfig] = useState(() => {
    if (initialConfig) return sanitizeDesignConfig(initialConfig)
    return sanitizeDesignConfig(DEFAULT_DESIGN_CONFIG)
  })

  // Update a nested config path — e.g. updateConfig('dotsOptions', { type: 'dots', color: '#000' })
  const updateConfig = useCallback((key, value) => {
    setConfig(prev => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return sanitizeDesignConfig({ ...prev, [key]: { ...prev[key], ...value } })
      }
      return sanitizeDesignConfig({ ...prev, [key]: value })
    })
  }, [])

  // Update a deeply nested field — e.g. updateField('dotsOptions', 'type', 'dots')
  const updateField = useCallback((section, field, value) => {
    setConfig(prev => sanitizeDesignConfig({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
  }, [])

  // Reset to defaults
  const resetConfig = useCallback(() => {
    setConfig(sanitizeDesignConfig(DEFAULT_DESIGN_CONFIG))
  }, [])

  // Apply a category theme while preserving meta
  const applyTheme = useCallback((category) => {
    setConfig(prev => {
      const theme = generateThemeForCategory(category)
      return sanitizeDesignConfig({
        ...theme,
        imageOptions: prev.imageOptions,
        meta: { ...prev.meta, category },
      })
    })
  }, [])

  // Smart generate — random but harmonious design
  const randomize = useCallback((category) => {
    setConfig(prev => {
      const random = smartGenerate(category || prev.meta.category)
      return sanitizeDesignConfig({
        ...random,
        imageOptions: prev.imageOptions,
        meta: { ...prev.meta, ...random.meta, restaurantName: prev.meta.restaurantName, tagline: prev.meta.tagline },
      })
    })
  }, [])

  // Load a saved config (for editing existing QR)
  const loadConfig = useCallback((savedConfig) => {
    setConfig(sanitizeDesignConfig(savedConfig || DEFAULT_DESIGN_CONFIG))
  }, [])

  // Get the qr-code-styling compatible options object (strips our custom frame/meta)
  const getQRStylingOptions = useCallback((data, imageUrl) => {
    return buildSafeQRStylingOptions(config, data, imageUrl, 280)
  }, [config])

  return {
    config,
    setConfig,
    updateConfig,
    updateField,
    resetConfig,
    applyTheme,
    randomize,
    loadConfig,
    getQRStylingOptions,
  }
}
