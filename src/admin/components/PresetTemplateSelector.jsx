import { getAllTemplates } from '../constants/QRTemplates'

export const PresetTemplateSelector = ({ selectedTemplateId, onSelectTemplate }) => {
  const templates = getAllTemplates()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Choose a Template
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select a preset color scheme or create your own custom design
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={`group relative p-5 border-2 rounded-xl transition-all duration-200 ${ selectedTemplateId === template.id
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
            }`}
          >
            {/* Template Icon */}
            <div className="text-3xl mb-3 text-center">{template.icon}</div>

            {/* Template Name */}
            <div className="text-center mb-2">
              <div className={`font-semibold ${
                selectedTemplateId === template.id
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {template.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {template.description}
              </div>
            </div>

            {/* Color Preview */}
            {template.id !== 'custom' && (
              <div className="flex justify-center gap-1 mt-3">
                <div
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: template.qrColor }}
                  title="QR Color"
                />
                <div
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: template.backgroundColor }}
                  title="Background"
                />
                <div
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: template.borderColor }}
                  title="Border"
                />
              </div>
            )}

            {template.id === 'custom' && (
              <div className="flex justify-center gap-1 mt-3">
                <div className="w-6 h-6 rounded border border-gray-300 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" title="Custom Colors" />
              </div>
            )}

            {/* Selected Indicator */}
            {selectedTemplateId === template.id && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
