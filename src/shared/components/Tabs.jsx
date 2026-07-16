import { useId } from 'react'
import { cn } from '../utils/cn'
import { motion } from 'framer-motion'

export const Tabs = ({ tabs, activeTab, onChange, variant = 'pills', className }) => {
  const instanceId = useId()
  const variants = {
    pills: 'bg-surface-100/90 dark:bg-surface-800/40 p-1 rounded-xl border border-surface-300/80 dark:border-surface-700/30',
    underline: 'border-b border-surface-300/80 dark:border-surface-700/40',
    segment: 'bg-surface-100/90 dark:bg-surface-800/40 p-1 rounded-xl border border-surface-300/80 dark:border-surface-700/30',
  }

  return (
    <div className={cn(
      'flex overflow-x-auto scrollbar-hide',
      variants[variant],
      className
    )}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.value}
          tab={tab}
          isActive={activeTab === tab.value}
          onClick={() => onChange(tab.value)}
          variant={variant}
          instanceId={instanceId}
        />
      ))}
    </div>
  )
}

const TabButton = ({ tab, isActive, onClick, variant, instanceId }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap',
        variant === 'underline' && 'pb-3',
        variant === 'pills' && 'rounded-lg',
        variant === 'segment' && 'rounded-lg flex-1',
        isActive
          ? 'text-surface-900 dark:text-white'
          : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300',
      )}
    >
      {/* Active indicator */}
      {isActive && variant === 'pills' && (
        <motion.div
          layoutId={`tab-pill-${instanceId}`}
          className="absolute inset-0 bg-white dark:bg-surface-700/80 rounded-lg shadow-sm border border-surface-300/90 dark:border-surface-600/30"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      {isActive && variant === 'underline' && (
        <motion.div
          layoutId={`tab-underline-${instanceId}`}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      {isActive && variant === 'segment' && (
        <motion.div
          layoutId={`tab-segment-${instanceId}`}
          className="absolute inset-0 bg-white dark:bg-surface-700/80 rounded-lg shadow-sm border border-surface-300/90 dark:border-surface-600/30"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {tab.icon && <tab.icon className="w-4 h-4" />}
        {tab.label}
        {tab.count !== undefined && tab.count > 0 && (
          <span className={cn(
            'px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[18px] text-center',
            isActive
              ? 'bg-primary-500/15 text-primary-500 dark:text-primary-400'
              : 'bg-surface-200/90 dark:bg-surface-700/60 text-surface-500 dark:text-surface-400'
          )}>
            {tab.count}
          </span>
        )}
      </span>
    </button>
  )
}
