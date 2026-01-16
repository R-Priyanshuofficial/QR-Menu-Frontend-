import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@shared/components/Button'

export const DesignPreviewSlider = ({ designs, selectedDesignId, onSelectDesign, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? designs.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === designs.length - 1 ? 0 : prev + 1))
  }

  const handleSelect = () => {
    onSelectDesign(designs[currentIndex])
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">AI is generating design variations...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">This takes about 5-10 seconds</p>
      </div>
    )
  }

  if (!designs || designs.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No designs available
      </div>
    )
  }

  const currentDesign = designs[currentIndex]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Choose Your Favorite Design
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Swipe through {designs.length} AI-generated designs and select the one you like best
        </p>
      </div>

      {/* Slider Container */}
      <div className="relative">
        {/* Design Preview - Large Center */}
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 shadow-2xl">
          {/* Current Design */}
          <div className="flex flex-col items-center">
            {/* Design Name & Description */}
            <div className="text-center mb-4">
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {currentDesign.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentDesign.description}
              </p>
            </div>

            {/* QR Placeholder Preview */}
            <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-md w-full">
              <img
                src={currentDesign.preview}
                alt={currentDesign.name}
                className="w-full h-auto rounded"
              />
              
              {/* Selected Indicator */}
              {selectedDesignId === currentDesign.id && (
                <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 shadow-lg">
                  <Check className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Select Button */}
            <Button
              onClick={handleSelect}
              className="mt-6 px-8"
              variant={selectedDesignId === currentDesign.id ? 'primary' : 'outline'}
            >
              {selectedDesignId === currentDesign.id ? 'Selected ✓' : 'Select This Design'}
            </Button>
          </div>

          {/* Navigation Arrows */}
          {designs.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Previous design"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Next design"
              >
                <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {designs.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {designs.map((design, index) => (
              <button
                key={design.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-red-500 w-8'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                }`}
                aria-label={`Go to design ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Design Counter */}
        <div className="text-center mt-2 text-sm text-gray-500">
          Design {currentIndex + 1} of {designs.length}
        </div>
      </div>
    </div>
  )
}
