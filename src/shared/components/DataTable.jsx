import { cn } from '../utils/cn'
import { EmptyState } from './EmptyState'
import { FileX } from 'lucide-react'

export const DataTable = ({
  columns,
  data,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyIcon,
  onRowClick,
  className,
  loading = false,
  stickyHeader = false,
}) => {
  if (!loading && data.length === 0) {
    return (
      <div className="rounded-xl border border-surface-700/40 bg-surface-900/80">
        <EmptyState
          icon={emptyIcon || FileX}
          title={emptyTitle}
          description={emptyDescription}
          compact
        />
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-xl border border-surface-700/40 bg-surface-900/80 overflow-hidden shadow-dark-elevated',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn(
              'border-b border-surface-700/40',
              stickyHeader && 'sticky top-0 z-10'
            )}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider',
                    'text-surface-500',
                    'bg-surface-950/50',
                    col.className
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800/50">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`}>
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-5 py-3.5">
                      <div className="h-4 bg-surface-800/50 rounded skeleton" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors duration-150',
                    'hover:bg-surface-800/30',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={cn(
                        'px-5 py-3.5 text-sm text-surface-300',
                        col.cellClassName
                      )}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
