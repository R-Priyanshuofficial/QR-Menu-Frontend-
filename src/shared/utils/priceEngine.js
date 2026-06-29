/**
 * Centralized Price Engine — Frontend (ES Module)
 * 
 * Shared pricing logic used by CartContext and UI components.
 * The backend has an identical CommonJS version.
 */

/**
 * Get effective price (offer price if valid, else selling price)
 */
export function getEffectivePrice(sellingPrice, offerPrice) {
  if (offerPrice && offerPrice > 0 && offerPrice < sellingPrice) {
    return offerPrice
  }
  return sellingPrice || 0
}

const isComboItem = (item) => {
  if (!item) return false
  if (String(item.itemType || '').toUpperCase() === 'COMBO') return true
  return (Array.isArray(item.comboItems) && item.comboItems.length > 0) || Boolean(item.comboRules)
}

/**
 * Calculate unit price: variant/base price + addons
 */
export function calculateUnitPrice(item, selectedVariant, selectedAddons) {
  let base = 0

  if (isComboItem(item)) {
    base = getEffectivePrice(item.sellingPrice ?? item.price ?? 0, item.offerPrice)
  } else if (selectedVariant && selectedVariant.price != null) {
    // Use variant price (with offer if applicable)
    base = getEffectivePrice(selectedVariant.price, selectedVariant.offerPrice)
  } else if (item) {
    // Simple product — use item selling price
    const selling = item.sellingPrice ?? item.price ?? 0
    base = getEffectivePrice(selling, item.offerPrice)
  }

  const addonsTotal = (selectedAddons || []).reduce((sum, addon) => {
    return sum + (addon.price || 0)
  }, 0)

  return base + addonsTotal
}

/**
 * Calculate subtotal = unitPrice × quantity
 */
export function calculateSubtotal(unitPrice, quantity) {
  return (unitPrice || 0) * (quantity || 1)
}

/**
 * Calculate tax amount from subtotal
 */
export function calculateTax(subtotal, taxPercent) {
  if (!taxPercent || taxPercent <= 0) return 0
  return subtotal * (taxPercent / 100)
}

/**
 * Calculate final total = subtotal + tax
 */
export function calculateTotal(subtotal, taxAmount) {
  return subtotal + (taxAmount || 0)
}

/**
 * Get display price for an item (for menu cards)
 * Returns { display, original, hasOffer, hasVariants, minPrice, maxPrice }
 */
export function getDisplayPriceInfo(item) {
  const variants = Array.isArray(item?.variants) ? item.variants : []
  const hasVariants = variants.length > 0
  const hasAddons = item?.addons?.length > 0

  if (hasVariants) {
    const validVariants = variants.filter(v => v.isAvailable !== false && (v.price || 0) > 0)

    if (validVariants.length === 0 || validVariants.length !== variants.length) {
      return {
        display: 0,
        original: null,
        hasOffer: false,
        hasVariants: true,
        variantCount: 0,
        minPrice: 0,
        maxPrice: 0,
        hasAddons,
        isValid: false,
      }
    }

    const allVariantPrices = validVariants.map(v => getEffectivePrice(v.price, v.offerPrice))
    const minPrice = Math.min(...allVariantPrices)
    const maxPrice = Math.max(...allVariantPrices)

    return {
      display: minPrice,
      original: null,
      hasOffer: false,
      hasVariants: true,
      variantCount: validVariants.length,
      minPrice,
      maxPrice,
      hasAddons,
      isValid: minPrice > 0,
    }
  }

  const selling = item?.sellingPrice ?? item?.price ?? 0
  if (!(selling > 0)) {
    // Custom combos are dynamically priced — they don't store a sellingPrice
    if (isComboItem(item) && item.comboType === 'custom') {
      return {
        display: 0,
        original: null,
        strikePrice: null,
        hasOffer: false,
        hasVariants: false,
        hasAddons: false,
        minPrice: 0,
        maxPrice: 0,
        isValid: true,
        isCustomCombo: true,
      }
    }
    return {
      display: 0,
      original: null,
      strikePrice: null,
      hasOffer: false,
      hasVariants: false,
      hasAddons,
      minPrice: 0,
      maxPrice: 0,
      isValid: false,
    }
  }
  const hasOffer = item.offerPrice > 0 && item.offerPrice < selling
  const display = hasOffer ? item.offerPrice : selling
  const showOriginalMarket = (item.originalMarketPrice || item.comparePrice || 0) > display

  return {
    display,
    original: showOriginalMarket ? (item.originalMarketPrice || item.comparePrice) : null,
    strikePrice: hasOffer ? selling : null,
    hasOffer,
    hasVariants: false,
    hasAddons,
    minPrice: display,
    maxPrice: display,
    isValid: true,
  }
}
