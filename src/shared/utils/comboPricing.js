import { getDisplayPriceInfo } from './priceEngine'

const toId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return String(value.id || value._id || '')
}

const toNumber = (value, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const isComboItem = (item) => {
  if (!item) return false

  if (String(item.itemType || '').toUpperCase() === 'COMBO') {
    return true
  }

  const hasComboItems = Array.isArray(item.comboItems) && item.comboItems.length > 0
  const hasComboRules = Boolean(item.comboRules && typeof item.comboRules === 'object')

  return hasComboItems || hasComboRules
}

const priceOf = (item) => {
  const info = getDisplayPriceInfo(item)
  if (info.hasVariants) return info.minPrice || 0
  return info.display || 0
}

const cloneSelection = (selection) => {
  const ids = Array.isArray(selection) ? selection : [selection]
  return ids.map(toId).filter(Boolean)
}

export const normalizeComboGroups = (item) => {
  const rawGroups = Array.isArray(item?.comboRules?.groups) ? item.comboRules.groups : []

  return rawGroups
    .map((group, index) => {
      const rawOptions = Array.isArray(group.options) ? group.options : []
      const fallbackOptions = Array.isArray(group.itemIds)
        ? group.itemIds.map(option => ({ itemId: option }))
        : []

      const options = [...rawOptions, ...fallbackOptions]
        .map((option) => {
          const itemId = toId(option.itemId || option.id)
          if (!itemId) return null

          const source = option.itemId && typeof option.itemId === 'object' ? option.itemId : null
          const price = toNumber(option.price, source ? priceOf(source) : 0)

          return {
            itemId,
            name: option.name || source?.name || 'Option',
            category: option.category || source?.category || '',
            price,
          }
        })
        .filter(Boolean)

      const minSelections = Math.max(1, parseInt(group.minSelections ?? group.quantity ?? 1, 10) || 1)
      const maxSelections = Math.max(
        minSelections,
        parseInt(group.maxSelections ?? group.quantity ?? minSelections, 10) || minSelections
      )
      const defaultSelection = toId(
        group.selectedItemId || group.defaultItemId || group.defaultItem || options[0]?.itemId
      )

      return {
        id: group.id || `group_${index}`,
        name: group.name || `Group ${index + 1}`,
        order: parseInt(group.order ?? index, 10) || index,
        minSelections,
        maxSelections,
        quantity: minSelections,
        options,
        selectedItemId: options.some(option => option.itemId === defaultSelection)
          ? defaultSelection
          : (options[0]?.itemId || ''),
      }
    })
    .sort((a, b) => a.order - b.order)
}

const sumCheapestSelections = (options, count) => {
  if (!Array.isArray(options) || options.length === 0 || count <= 0) return 0
  const sorted = [...options].sort((a, b) => (a.price || 0) - (b.price || 0))
  return sorted.slice(0, Math.min(count, sorted.length)).reduce((sum, option) => sum + (option.price || 0), 0)
}

const sumMostExpensiveSelections = (options, count) => {
  if (!Array.isArray(options) || options.length === 0 || count <= 0) return 0
  const sorted = [...options].sort((a, b) => (b.price || 0) - (a.price || 0))
  return sorted.slice(0, Math.min(count, sorted.length)).reduce((sum, option) => sum + (option.price || 0), 0)
}

export const getCustomComboRange = (item) => {
  const groups = normalizeComboGroups(item)
  const startingFrom = groups.reduce((sum, group) => sum + sumCheapestSelections(group.options, group.minSelections), 0)
  const highestPossible = groups.reduce((sum, group) => sum + sumMostExpensiveSelections(group.options, group.maxSelections), 0)
  const availableChoiceCount = groups.reduce((sum, group) => sum + group.options.length, 0)

  return {
    groups,
    startingFrom,
    highestPossible,
    availableChoiceCount,
    groupCount: groups.length,
    totalCombinations: getTotalCombinations(groups),
  }
}

export const getTotalCombinations = (groups) => {
  if (!Array.isArray(groups) || groups.length === 0) return 0
  return groups.reduce((product, group) => product * Math.max(1, group.options?.length || 1), 1)
}

export const formatCombinationCount = (count) => {
  if (!count || count <= 1) return '1 combination'
  if (count >= 100) return `${Math.floor(count / 100) * 100}+ combinations`
  return `${count} combinations`
}

export const hasExplicitComboSelections = (selectedSelections = {}) =>
  Object.values(selectedSelections).some(selection => Array.isArray(selection) && selection.length > 0)

export const getComboPresentation = (item, selectedSelections = {}, options = {}) => {
  const { useDefaults = true } = options
  if (!item) {
    return {
      comboType: 'fixed',
      comboPrice: 0,
      currentPrice: 0,
      startingFrom: 0,
      highestPossible: 0,
      regularTotal: 0,
      savings: 0,
      discountPercent: 0,
      selectedItems: [],
      groups: [],
      fixedItems: [],
      availableChoiceCount: 0,
      groupCount: 0,
    }
  }

  const comboType = item.comboType || 'fixed'
  const fixedItems = Array.isArray(item.comboItems)
    ? item.comboItems.map((entry) => {
        const quantity = Math.max(1, parseInt(entry.quantity, 10) || 1)
        const resolvedItem = entry.itemId && typeof entry.itemId === 'object' ? entry.itemId : null
        const name = resolvedItem?.name || entry.name || 'Included item'
        const price = toNumber(entry.price, priceOf(resolvedItem))
        return {
          id: toId(entry.itemId || entry.id || entry.menuItemId),
          name,
          category: resolvedItem?.category || entry.category || '',
          image: resolvedItem?.image || entry.image || '',
          quantity,
          price,
        }
      })
    : []

  const range = getCustomComboRange(item)
  const groups = range.groups
  const selectedItems = []
  let regularTotal = 0
  let upcharges = 0

  if (comboType === 'custom') {
    for (const group of groups) {
      const defaultOption = group.options.find(option => option.itemId === group.selectedItemId) || group.options[0] || null
      const selectedIds = cloneSelection(selectedSelections[group.id])
      const hasExplicitSelection = selectedIds.length > 0
      const effectiveSelectionIds = hasExplicitSelection
        ? selectedIds
        : (useDefaults && defaultOption ? [defaultOption.itemId] : [])

      const selectedOptions = effectiveSelectionIds
        .map(itemId => group.options.find(option => option.itemId === itemId))
        .filter(Boolean)

      if (hasExplicitSelection) {
        selectedOptions.forEach((option) => {
          regularTotal += option.price
          const defaultPrice = defaultOption?.price || 0
          upcharges += Math.max(0, option.price - defaultPrice)
          selectedItems.push({
            groupId: group.id,
            groupName: group.name,
            itemId: option.itemId,
            name: option.name,
            price: option.price,
            quantity: 1,
          })
        })
      } else if (useDefaults) {
        const currentSelections = selectedOptions.length > 0 ? [...selectedOptions] : (defaultOption ? [defaultOption] : [])
        while (currentSelections.length < group.minSelections && defaultOption) {
          currentSelections.push(defaultOption)
        }

        currentSelections.slice(0, Math.max(group.minSelections, Math.min(group.maxSelections, currentSelections.length))).forEach((option) => {
          regularTotal += option.price
          const defaultPrice = defaultOption?.price || 0
          upcharges += Math.max(0, option.price - defaultPrice)
          selectedItems.push({
            groupId: group.id,
            groupName: group.name,
            itemId: option.itemId,
            name: option.name,
            price: option.price,
            quantity: 1,
          })
        })
      } else {
        regularTotal += sumCheapestSelections(group.options, group.minSelections)
      }
    }
  } else {
    for (const entry of fixedItems) {
      regularTotal += entry.price * entry.quantity
      selectedItems.push({
        groupId: 'fixed',
        groupName: 'Included Items',
        itemId: entry.id,
        name: entry.name,
        price: entry.price,
        quantity: entry.quantity,
      })
    }
  }

  const baseComboPrice = comboType === 'custom'
    ? range.startingFrom
    : toNumber(item.sellingPrice ?? item.price, 0)

  const explicitSelections = hasExplicitComboSelections(selectedSelections)
  const currentPrice = comboType === 'custom'
    ? (explicitSelections || useDefaults ? regularTotal : range.startingFrom)
    : baseComboPrice

  const startingFrom = comboType === 'custom'
    ? range.startingFrom
    : baseComboPrice

  const highestPossible = comboType === 'custom'
    ? Math.max(range.highestPossible, currentPrice, startingFrom)
    : Math.max(regularTotal, baseComboPrice)

  const savings = comboType === 'custom'
    ? Math.max(0, highestPossible - currentPrice)
    : Math.max(0, regularTotal - currentPrice)
  const discountPercent = comboType === 'custom'
    ? 0
    : (regularTotal > 0 ? Math.round((savings / regularTotal) * 100) : 0)
  const summaryText = comboType === 'custom'
    ? groups.map(group => group.name).filter(Boolean).join(' + ')
    : fixedItems.map(entry => entry.name).filter(Boolean).join(' + ')

  return {
    comboType,
    comboPrice: baseComboPrice,
    currentPrice,
    startingFrom,
    highestPossible,
    regularTotal,
    savings,
    discountPercent,
    summaryText,
    selectedItems,
    groups,
    fixedItems,
    upcharges,
    availableChoiceCount: range.availableChoiceCount,
    groupCount: range.groupCount,
    totalCombinations: range.totalCombinations,
    minimumPrice: range.startingFrom,
    maximumPrice: range.highestPossible,
    hasExplicitSelections: explicitSelections,
  }
}

export const getComboTagList = (item) => {
  const tags = Array.isArray(item?.tags) ? item.tags : []
  return tags.filter(Boolean)
}
