import { useMemo, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { useClickOutside } from '@shared/hooks/useClickOutside'
import {
  DOT_STYLES,
  CORNER_SQUARE_STYLES,
  CORNER_DOT_STYLES,
  FRAME_STYLES,
} from '../../constants/designConfigDefaults'

const ColorSwatch = ({ color, onClick, label, active }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2.5 group w-full"
    title={label}
  >
    <div
      className={`w-9 h-9 rounded-xl border-2 cursor-pointer shadow-sm transition-all flex-shrink-0 ${
        active
          ? 'border-primary-500 ring-4 ring-primary-500/10 scale-105'
          : 'border-surface-200/80 dark:border-surface-700/60 group-hover:border-surface-300 dark:group-hover:border-surface-600 group-hover:scale-105'
      }`}
      style={{ backgroundColor: color }}
    />
    <div className="min-w-0">
      <span className="text-xs font-medium text-surface-700 dark:text-surface-300">{label}</span>
      <span className="text-[10px] text-surface-400 dark:text-surface-500 block font-mono">{color}</span>
    </div>
  </button>
)

const StyleGrid = ({ options, value, onChange, cols = 3 }) => (
  <div
    className={
      cols === 2
        ? 'grid grid-cols-2 gap-2'
        : cols === 4
          ? 'grid grid-cols-4 gap-2'
          : 'grid grid-cols-3 gap-2'
    }
  >
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-2.5 py-2.5 border rounded-xl text-xs font-medium transition-all ${
          value === opt.value
            ? 'border-primary-500/60 bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
            : 'border-surface-200/80 dark:border-surface-700/60 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50/70 dark:hover:bg-surface-800/40'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
)

export const QREditorControls = ({ config, updateConfig, updateField }) => {
  const [activeColorPicker, setActiveColorPicker] = useState(null)

  const colorPickerRef = useClickOutside(() => setActiveColorPicker(null))

  const frameStyle = config.frame?.style || 'none'

  const toggleGradient = (section) => {
    const current = config[section]
    if (current.gradient) {
      updateConfig(section, { ...current, gradient: null })
    } else {
      updateConfig(section, {
        ...current,
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            { offset: 0, color: current.color },
            { offset: 1, color: '#666666' },
          ],
        },
      })
    }
  }

  const updateGradientColor = (section, stopIndex, color) => {
    const current = config[section]
    if (!current.gradient) return
    const newStops = [...current.gradient.colorStops]
    newStops[stopIndex] = { ...newStops[stopIndex], color }
    updateConfig(section, {
      ...current,
      gradient: { ...current.gradient, colorStops: newStops },
    })
  }

  return (
    <div className="space-y-6" ref={colorPickerRef}>
      {/* ── Colors ── */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Colors
        </h4>
        <div className="space-y-3">
          {/* QR Dots Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <ColorSwatch
                color={config.dotsOptions.color}
                onClick={() => setActiveColorPicker(activeColorPicker === 'dots' ? null : 'dots')}
                label="QR Dots"
                active={activeColorPicker === 'dots'}
              />
              <label className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={!!config.dotsOptions.gradient}
                  onChange={() => toggleGradient('dotsOptions')}
                  className="w-3.5 h-3.5 rounded text-primary-500 focus:ring-primary-500/20"
                />
                <span className="text-xs text-surface-500 dark:text-surface-400">Gradient</span>
              </label>
            </div>
            {activeColorPicker === 'dots' && (
              <div className="qr-color-picker rounded-xl overflow-hidden border border-surface-200/80 dark:border-surface-700/60">
                <HexColorPicker
                  color={config.dotsOptions.color}
                  onChange={(c) => updateField('dotsOptions', 'color', c)}
                />
              </div>
            )}
            {config.dotsOptions.gradient && (
              <div className="flex gap-3 items-end p-3 rounded-xl bg-surface-50/70 dark:bg-surface-900/30 border border-surface-200/60 dark:border-surface-700/40">
                <div>
                  <label className="text-[10px] text-surface-500 dark:text-surface-400 block mb-1 font-medium">Start</label>
                  <input
                    type="color"
                    value={config.dotsOptions.gradient.colorStops[0].color}
                    onChange={(e) => updateGradientColor('dotsOptions', 0, e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-surface-200 dark:border-surface-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-surface-500 dark:text-surface-400 block mb-1 font-medium">End</label>
                  <input
                    type="color"
                    value={config.dotsOptions.gradient.colorStops[1].color}
                    onChange={(e) => updateGradientColor('dotsOptions', 1, e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-surface-200 dark:border-surface-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-surface-500 dark:text-surface-400 block mb-1 font-medium">Type</label>
                  <select
                    value={config.dotsOptions.gradient.type}
                    onChange={(e) => updateConfig('dotsOptions', { ...config.dotsOptions, gradient: { ...config.dotsOptions.gradient, type: e.target.value } })}
                    className="text-xs border rounded-lg px-2 py-1.5 bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Corner Color */}
          <div className="space-y-2">
            <ColorSwatch
              color={config.cornersSquareOptions.color}
              onClick={() => setActiveColorPicker(activeColorPicker === 'corner' ? null : 'corner')}
              label="Corners"
              active={activeColorPicker === 'corner'}
            />
            {activeColorPicker === 'corner' && (
              <div className="qr-color-picker rounded-xl overflow-hidden border border-surface-200/80 dark:border-surface-700/60">
                <HexColorPicker
                  color={config.cornersSquareOptions.color}
                  onChange={(c) => {
                    updateField('cornersSquareOptions', 'color', c)
                    updateField('cornersDotOptions', 'color', c)
                  }}
                />
              </div>
            )}
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <ColorSwatch
              color={config.backgroundOptions.color}
              onClick={() => setActiveColorPicker(activeColorPicker === 'bg' ? null : 'bg')}
              label="Background"
              active={activeColorPicker === 'bg'}
            />
            {activeColorPicker === 'bg' && (
              <div className="qr-color-picker rounded-xl overflow-hidden border border-surface-200/80 dark:border-surface-700/60">
                <HexColorPicker
                  color={config.backgroundOptions.color}
                  onChange={(c) => updateField('backgroundOptions', 'color', c)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dot Style ── */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Dot Style
        </h4>
        <StyleGrid
          options={DOT_STYLES}
          value={config.dotsOptions.type}
          onChange={(v) => updateField('dotsOptions', 'type', v)}
        />
      </div>

      {/* ── Corner Style ── */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Corner Style
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-surface-500 dark:text-surface-400 mb-1.5 block">Square</label>
            <StyleGrid
              options={CORNER_SQUARE_STYLES}
              value={config.cornersSquareOptions.type}
              onChange={(v) => updateField('cornersSquareOptions', 'type', v)}
            />
          </div>
          <div>
            <label className="text-xs text-surface-500 dark:text-surface-400 mb-1.5 block">Dot</label>
            <StyleGrid
              options={CORNER_DOT_STYLES}
              value={config.cornersDotOptions.type}
              onChange={(v) => updateField('cornersDotOptions', 'type', v)}
              cols={2}
            />
          </div>
        </div>
      </div>

      {/* ── Frame ── */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Frame & Effects
        </h4>
        <StyleGrid
          options={FRAME_STYLES}
          value={frameStyle}
          onChange={(v) => updateField('frame', 'style', v)}
          cols={3}
        />

        {frameStyle !== 'none' && (
          <div className="space-y-3 pt-2">
            {/* Frame Color */}
            <div className="space-y-2">
              <ColorSwatch
                color={config.frame.color}
                onClick={() => setActiveColorPicker(activeColorPicker === 'frame' ? null : 'frame')}
                label="Frame Color"
                active={activeColorPicker === 'frame'}
              />
              {activeColorPicker === 'frame' && (
                <div className="qr-color-picker rounded-xl overflow-hidden border border-surface-200/80 dark:border-surface-700/60">
                  <HexColorPicker
                    color={config.frame.color}
                    onChange={(c) => updateField('frame', 'color', c)}
                  />
                </div>
              )}
            </div>

            {/* Padding */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-surface-600 dark:text-surface-400 font-medium">Padding</label>
                <span className="text-xs text-surface-400 dark:text-surface-500 font-mono tabular-nums">{config.frame.padding}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="40"
                value={config.frame.padding}
                onChange={(e) => updateField('frame', 'padding', parseInt(e.target.value))}
                className="qr-range"
              />
            </div>

            {/* Shadow & Glow */}
            <div className="flex gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.frame.shadow}
                  onChange={(e) => updateField('frame', 'shadow', e.target.checked)}
                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500/20 border-surface-300 dark:border-surface-600"
                />
                <span className="text-xs text-surface-600 dark:text-surface-400 font-medium">Shadow</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.frame.glow}
                  onChange={(e) => updateField('frame', 'glow', e.target.checked)}
                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500/20 border-surface-300 dark:border-surface-600"
                />
                <span className="text-xs text-surface-600 dark:text-surface-400 font-medium">Glow</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
