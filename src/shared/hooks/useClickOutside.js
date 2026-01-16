import { useEffect, useRef } from 'react'

/**
 * Hook to detect clicks outside of a specified element
 * @param {Function} handler - Callback function to execute when click outside is detected
 * @returns {React.RefObject} - Ref to attach to the element
 */
export const useClickOutside = (handler) => {
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler()
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      // Unbind the event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handler])

  return ref
}
