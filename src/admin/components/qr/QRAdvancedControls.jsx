import { Select } from '@shared/components/Select'

export const QRAdvancedControls = ({ config, updateField }) => {
  return (
    <div className="space-y-6">
      {/* QR Quality */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          QR Quality
        </h4>
        <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
          Higher error correction improves scan reliability (especially with logos) but can reduce density.
        </p>
        <Select
          label="Error Correction Level"
          value={config.qrOptions.errorCorrectionLevel}
          onChange={(e) => updateField('qrOptions', 'errorCorrectionLevel', e.target.value)}
        >
          <option value="L">L — Low</option>
          <option value="M">M — Medium</option>
          <option value="Q">Q — High</option>
          <option value="H">H — Highest</option>
        </Select>
      </div>

      {/* Logo Settings */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.12em]">
          Logo Settings
        </h4>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-surface-600 dark:text-surface-400 font-medium">Logo Size</label>
              <span className="text-xs text-surface-400 dark:text-surface-500 font-mono tabular-nums">{Math.round(config.imageOptions.imageSize * 100)}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="50"
              value={Math.round(config.imageOptions.imageSize * 100)}
              onChange={(e) => updateField('imageOptions', 'imageSize', parseInt(e.target.value) / 100)}
              className="qr-range"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-surface-600 dark:text-surface-400 font-medium">Logo Margin</label>
              <span className="text-xs text-surface-400 dark:text-surface-500 font-mono tabular-nums">{config.imageOptions.margin}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              value={config.imageOptions.margin}
              onChange={(e) => updateField('imageOptions', 'margin', parseInt(e.target.value))}
              className="qr-range"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
