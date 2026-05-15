import { toPng, toSvg } from 'html-to-image'
import toast from 'react-hot-toast'

/**
 * Convert all <canvas> and <svg> inside a cloned node to <img> elements
 * so that html-to-image can reliably capture them.
 */
function replaceCanvasAndSvgWithImages(clonedRoot) {
  // Handle canvas elements
  // Note: We can't use canvas.toDataURL on cloned canvases (they lose context),
  // so this is handled separately in the export functions by pre-rendering the QR as an image.
}

/**
 * Export a DOM element as a PNG or SVG image file.
 * Handles canvas elements (from qr-code-styling) by converting them to images first.
 *
 * @param {HTMLElement} element  – The DOM node to capture (the full preview card)
 * @param {'png'|'svg'} format  – Output format
 * @param {string} filename     – Download filename (without extension)
 * @param {object} [options]    – Optional overrides
 * @param {number} [options.pixelRatio]     – Resolution multiplier (default 4)
 * @param {string} [options.backgroundColor] – Fallback bg if element has none
 * @param {number} [options.quality]        – JPEG/PNG quality 0-1 (default 1)
 */
export async function exportCardAsImage(element, format = 'png', filename = 'qr-code', options = {}) {
  if (!element) {
    toast.error('Nothing to export')
    return
  }

  const {
    pixelRatio = 4,
    backgroundColor,
    quality = 1,
  } = options

  const toastId = toast.loading('Preparing download…')

  try {
    // Step 1: Find all canvas elements and convert them to img BEFORE cloning
    const canvases = element.querySelectorAll('canvas')
    const replacements = []

    canvases.forEach((canvas) => {
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const img = document.createElement('img')
        img.src = dataUrl
        img.style.width = (canvas.style.width || `${canvas.offsetWidth}px`)
        img.style.height = (canvas.style.height || `${canvas.offsetHeight}px`)
        img.setAttribute('data-replaced-canvas', 'true')

        canvas.parentNode.insertBefore(img, canvas)
        canvas.style.display = 'none'
        replacements.push({ canvas, img })
      } catch (e) {
        console.warn('Could not convert canvas:', e)
      }
    })

    // Wait for images to load
    await new Promise((r) => setTimeout(r, 200))

    // Step 2: Capture with html-to-image
    const commonOpts = {
      cacheBust: true,
      pixelRatio,
      quality,
      backgroundColor: backgroundColor || getComputedBgColor(element) || '#ffffff',
      filter: (node) => {
        // Skip elements marked for export ignore
        if (node?.dataset?.exportIgnore === 'true') return false
        // Skip hidden canvases (we replaced them with imgs)
        if (node?.tagName === 'CANVAS' && node?.style?.display === 'none') return false
        return true
      },
      style: {
        transition: 'none',
        animation: 'none',
      },
    }

    let dataUrl

    if (format === 'svg') {
      await toSvg(element, { ...commonOpts, pixelRatio: 1 }) // Prime cache
      dataUrl = await toSvg(element, commonOpts)
    } else {
      await toPng(element, { ...commonOpts, pixelRatio: 1 }) // Prime cache
      dataUrl = await toPng(element, commonOpts)
    }

    // Step 3: Download
    triggerDownload(dataUrl, `${filename}.${format}`)

    toast.success('Downloaded!', { id: toastId })
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export image', { id: toastId })
  } finally {
    // Step 4: Restore original canvases using tracked replacements
    replacements.forEach(({ canvas, img }) => {
      canvas.style.display = ''
      if (img.parentNode) {
        img.parentNode.removeChild(img)
      }
    })
  }
}

/**
 * Walk up the DOM tree to find the first non-transparent background color.
 */
function getComputedBgColor(el) {
  let node = el
  while (node && node !== document.body) {
    const bg = window.getComputedStyle(node).backgroundColor
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      return bg
    }
    node = node.parentElement
  }
  return null
}

/**
 * Trigger a browser file download from a data URL.
 */
function triggerDownload(dataUrl, filename) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Render a full-size QR card off-screen, capture it, and download.
 * Used by the dashboard where the visible card is small.
 *
 * This works by:
 * 1. Rendering the QR with qr-code-styling
 * 2. Waiting for it to paint on the canvas
 * 3. Extracting the canvas as a PNG data URL
 * 4. Building a pure HTML/img card layout
 * 5. Capturing with html-to-image
 */
export async function exportDashboardCard({
  safeConfig,
  url,
  buildOptions,
  format = 'png',
  filename = 'qr-code',
  tableNumber = null,
  QRCodeStyling,
}) {
  const toastId = toast.loading('Preparing download…')

  try {
    // ── Step 1: Render QR code in a temporary container to get canvas data ──
    const tempQrWrapper = document.createElement('div')
    tempQrWrapper.style.cssText = 'position:fixed;left:-99999px;top:-99999px;z-index:-1;pointer-events:none;'
    document.body.appendChild(tempQrWrapper)

    const qrSize = 400
    const options = buildOptions(safeConfig, url, safeConfig.logo || undefined, qrSize)
    const qrInstance = new QRCodeStyling(options)
    qrInstance.append(tempQrWrapper)

    // Wait for QR to fully render (including logo image loading)
    await new Promise((r) => setTimeout(r, 1200))

    // Extract canvas data
    const qrCanvas = tempQrWrapper.querySelector('canvas')
    let qrDataUrl = ''
    if (qrCanvas) {
      qrDataUrl = qrCanvas.toDataURL('image/png')
    } else {
      // Fallback: try SVG
      const qrSvg = tempQrWrapper.querySelector('svg')
      if (qrSvg) {
        const svgData = new XMLSerializer().serializeToString(qrSvg)
        qrDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
      }
    }

    // Clean up temp QR
    document.body.removeChild(tempQrWrapper)

    if (!qrDataUrl) {
      throw new Error('Could not render QR code')
    }

    // ── Step 2: Build a pure HTML card with <img> for the QR (no canvas) ──
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:fixed;left:-99999px;top:-99999px;z-index:-1;pointer-events:none;'
    document.body.appendChild(wrapper)

    const bgColor = safeConfig.backgroundOptions?.color || '#FFFFFF'
    const dotColor = safeConfig.dotsOptions?.color || '#2D2D2D'
    const frameConfig = safeConfig.frame || {}

    // Build frame CSS
    let borderCSS = ''
    let borderRadius = '18px'
    const padding = `${Math.max(frameConfig.padding || 24, 24)}px`

    switch (frameConfig.style) {
      case 'solid':
        borderCSS = `border: 4px solid ${frameConfig.color || '#2D2D2D'};`
        borderRadius = '22px'
        break
      case 'dashed':
        borderCSS = `border: 4px dashed ${frameConfig.color || '#2D2D2D'};`
        break
      default:
        break
    }

    const shadowCSS = frameConfig.shadow
      ? 'filter: drop-shadow(0 4px 20px rgba(0,0,0,0.15));'
      : ''

    const glowCSS = frameConfig.glow
      ? `box-shadow: 0 0 30px ${frameConfig.color || '#E94560'}40, 0 0 60px ${frameConfig.color || '#E94560'}20;`
      : ''

    // Build card using innerHTML (all images, no canvas)
    const card = document.createElement('div')
    card.style.cssText = `
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: ${padding};
      border-radius: ${borderRadius};
      background-color: ${bgColor};
      ${borderCSS}
      ${shadowCSS}
      ${glowCSS}
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `

    let cardHTML = ''

    // Restaurant name
    if (safeConfig.meta?.restaurantName) {
      cardHTML += `
        <div style="text-align:center;margin-bottom:16px;">
          <h3 style="font-size:22px;font-weight:700;letter-spacing:3px;color:${dotColor};margin:0;">
            ${safeConfig.meta.restaurantName.toUpperCase()}
          </h3>
          ${safeConfig.meta?.tagline ? `<p style="font-size:12px;color:${dotColor};opacity:0.7;margin:4px 0 0 0;">${safeConfig.meta.tagline}</p>` : ''}
        </div>
      `
    }

    // QR code as an <img> — this is the key fix!
    cardHTML += `
      <div style="display:flex;justify-content:center;">
        <img src="${qrDataUrl}" width="${qrSize}" height="${qrSize}" style="width:${qrSize}px;height:${qrSize}px;" />
      </div>
    `

    // Table number badge
    if (tableNumber) {
      cardHTML += `
        <div style="text-align:center;margin-top:12px;">
          <span style="display:inline-block;padding:4px 16px;border-radius:999px;font-size:12px;font-weight:700;background-color:${frameConfig.color || '#2D2D2D'}15;color:${frameConfig.color || '#2D2D2D'};border:1px solid ${frameConfig.color || '#2D2D2D'}30;">
            Table ${tableNumber}
          </span>
        </div>
      `
    }

    // Footer — Premium Signature
    cardHTML += `
      <div style="text-align:center;margin-top:14px;display:flex;justify-content:center;">
        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:8px;font-weight:600;letter-spacing:0.08em;color:${dotColor};opacity:0.3;border:1px solid ${dotColor}18;background:${dotColor}06;">
          <svg width="8" height="8" viewBox="0 0 16 16" fill="${dotColor}" style="opacity:0.7;"><path d="M8 0l1.796 5.528h5.813l-4.703 3.416 1.796 5.528L8 11.056l-4.702 3.416 1.796-5.528L.391 5.528h5.813z"/></svg>
          POWERED BY QRMENU
        </span>
      </div>
    `

    card.innerHTML = cardHTML
    wrapper.appendChild(card)

    // Wait for img to load
    const qrImg = card.querySelector('img')
    if (qrImg && !qrImg.complete) {
      await new Promise((resolve) => {
        qrImg.onload = resolve
        qrImg.onerror = resolve
        setTimeout(resolve, 2000) // Safety timeout
      })
    }
    await new Promise((r) => setTimeout(r, 200))

    // ── Step 3: Capture with html-to-image ──
    const commonOpts = {
      cacheBust: true,
      pixelRatio: 3,
      quality: 1,
      backgroundColor: bgColor,
      style: { transition: 'none', animation: 'none' },
    }

    let dataUrl
    if (format === 'svg') {
      await toSvg(card, { ...commonOpts, pixelRatio: 1 })
      dataUrl = await toSvg(card, commonOpts)
    } else {
      await toPng(card, { ...commonOpts, pixelRatio: 1 })
      dataUrl = await toPng(card, commonOpts)
    }

    // ── Step 4: Download & cleanup ──
    triggerDownload(dataUrl, `${filename}.${format}`)
    document.body.removeChild(wrapper)

    toast.success('Downloaded!', { id: toastId })
  } catch (error) {
    console.error('Dashboard export error:', error)
    toast.error('Failed to export image', { id: toastId })
  }
}
