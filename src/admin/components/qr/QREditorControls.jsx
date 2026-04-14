import { useState } from 'react'
import { Card } from '@shared/components/Card'
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
    className="flex items-center gap-2 group"
    title={label}
  >
    <div
      className={`w-8 h-8 rounded-lg border-2 cursor-pointer shadow-sm transition-all ${
        active ? 'border-red-500 scale-110' : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'
      }`}
      style={{ backgroundColor: color }}
    />
    <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
  </button>
)

const StyleGrid = ({ options, value, onChange, cols = 3 }) => (
  <div className={`grid grid-cols-${cols} gap-1.5`}>
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-2 py-1.5 border-2 rounded-lg text-xs font-medium transition-all ${
          value === opt.value
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
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
    <div className="space-y-4">
      {/* Dot Style */}
      <Card>
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Dot Style
          </h3>
          <StyleGrid
            options={DOT_STYLES}
            value={config.dotsOptions.type}
            onChange={(v) => updateField('dotsOptions', 'type', v)}
          />
        </div>
      </Card>

      {/* Corner Styles */}
      <Card>
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Corner Style
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Square</label>
              <StyleGrid
                options={CORNER_SQUARE_STYLES}
                value={config.cornersSquareOptions.type}
                onChange={(v) => updateField('cornersSquareOptions', 'type', v)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Dot</label>
              <StyleGrid
                options={CORNER_DOT_STYLES}
                value={config.cornersDotOptions.type}
                onChange={(v) => updateField('cornersDotOptions', 'type', v)}
                cols={2}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Colors */}
      <Card>
        <div className="p-4 relative" ref={colorPickerRef}>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            Colors
          </h3>
          <div className="space-y-3">
            {/* QR Dots Color */}
            <div className="flex items-center justify-between">
              <ColorSwatch
                color={config.dotsOptions.color}
                onClick={() => setActiveColorPicker(activeColorPicker === 'dots' ? null : 'dots')}
                label="QR Dots"
                active={activeColorPicker === 'dots'}
              />
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!!config.dotsOptions.gradient}
                  onChange={() => toggleGradient('dotsOptions')}
                  className="w-3.5 h-3.5 rounded text-red-500"
                />
                <span className="text-xs text-gray-500">Gradient</span>
              </label>
            </div>
            {activeColorPicker === 'dots' && (
              <div className="z-20 relative">
                <HexColorPicker
                  color={config.dotsOptions.color}
                  onChange={(c) => updateField('dotsOptions', 'color', c)}
                />
              </div>
            )}
            {config.dotsOptions.gradient && (
              <div className="flex gap-2 pl-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Start</label>
                  <input
                    type="color"
                    value={config.dotsOptions.gradient.colorStops[0].color}
                    onChange={(e) => updateGradientColor('dotsOptions', 0, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">End</label>
                  <input
                    type="color"
                    value={config.dotsOptions.gradient.colorStops[1].color}
                    onChange={(e) => updateGradientColor('dotsOptions', 1, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <div className="ml-2">
                  <label className="text-[10px] text-gray-400 block mb-1">Type</label>
                  <select
                    value={config.dotsOptions.gradient.type}
                    onChange={(e) => updateConfig('dotsOptions', { ...config.dotsOptions, gradient: { ...config.dotsOptions.gradient, type: e.target.value } })}
                    className="text-xs border rounded px-1 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
              </div>
            )}

            {/* Corner Color */}
            <div className="flex items-center justify-between">
              <ColorSwatch
                color={config.cornersSquareOptions.color}
                onClick={() => setActiveColorPicker(activeColorPicker === 'corner' ? null : 'corner')}
                label="Corners"
                active={activeColorPicker === 'corner'}
              />
            </div>
            {activeColorPicker === 'corner' && (
              <div className="z-20 relative">
                <HexColorPicker
                  color={config.cornersSquareOptions.color}
                  onChange={(c) => {
                    updateField('cornersSquareOptions', 'color', c)
                    updateField('cornersDotOptions', 'color', c)
                  }}
                />
              </div>
            )}

            {/* Background Color */}
            <div className="flex items-center justify-between">
              <ColorSwatch
                color={config.backgroundOptions.color}
                onClick={() => setActiveColorPicker(activeColorPicker === 'bg' ? null : 'bg')}
                label="Background"
                active={activeColorPicker === 'bg'}
              />
            </div>
            {activeColorPicker === 'bg' && (
              <div className="z-20 relative">
                <HexColorPicker
                  color={config.backgroundOptions.color}
                  onChange={(c) => updateField('backgroundOptions', 'color', c)}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Frame */}
      <Card>
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Frame
          </h3>
          <StyleGrid
            options={FRAME_STYLES}
            value={config.frame?.style || 'none'}
            onChange={(v) => updateField('frame', 'style', v)}
            cols={3}
          />

          {config.frame?.style && config.frame.style !== 'none' && (
            <div className="mt-3 space-y-3">
              {/* Frame Color */}
              <div className="flex items-center justify-between">
                <ColorSwatch
                  color={config.frame.color}
                  onClick={() => setActiveColorPicker(activeColorPicker === 'frame' ? null : 'frame')}
                  label="Frame Color"
                  active={activeColorPicker === 'frame'}
                />
              </div>
              {activeColorPicker === 'frame' && (
                <div className="z-20 relative">
                  <HexColorPicker
                    color={config.frame.color}
                    onChange={(c) => updateField('frame', 'color', c)}
                  />
                </div>
              )}

              {/* Padding */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-500">Padding</label>
                  <span className="text-xs text-gray-400">{config.frame.padding}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="40"
                  value={config.frame.padding}
                  onChange={(e) => updateField('frame', 'padding', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Shadow & Glow */}
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={!!config.frame.shadow}
                    onChange={(e) => updateField('frame', 'shadow', e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-red-500"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Shadow</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={!!config.frame.glow}
                    onChange={(e) => updateField('frame', 'glow', e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-red-500"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Glow</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Logo Size */}
      <Card>
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Logo Settings
          </h3>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-500">Logo Size</label>
              <span className="text-xs text-gray-400">{Math.round(config.imageOptions.imageSize * 100)}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="50"
              value={Math.round(config.imageOptions.imageSize * 100)}
              onChange={(e) => updateField('imageOptions', 'imageSize', parseInt(e.target.value) / 100)}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-500">Logo Margin</label>
              <span className="text-xs text-gray-400">{config.imageOptions.margin}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={config.imageOptions.margin}
              onChange={(e) => updateField('imageOptions', 'margin', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
