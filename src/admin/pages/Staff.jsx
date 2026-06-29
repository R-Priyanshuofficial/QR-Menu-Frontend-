import { useEffect, useMemo, useState } from 'react'
import {
  Users, Mail, Phone, Shield, Briefcase, Plus, UserCheck, UserX,
  SlidersHorizontal, ArrowUpDown, Clock, Eye, EyeOff, Sparkles,
  LayoutDashboard, ShoppingCart, CreditCard, BookOpen, QrCode,
  BarChart3, Package, Settings, CheckCheck, X, ChevronDown, Activity
} from 'lucide-react'
import { Card } from '@shared/components/Card'
import { Input } from '@shared/components/Input'
import { Button } from '@shared/components/Button'
import { Select } from '@shared/components/Select'
import { Badge } from '@shared/components/Badge'
import { PageHeader } from '@shared/components/PageHeader'
import { EmptyState } from '@shared/components/EmptyState'
import { SearchInput } from '@shared/components/SearchInput'
import { staffAPI } from '@shared/api/endpoints'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { cn } from '@shared/utils/cn'

/* ─── Constants ─── */
const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'menu', label: 'Menu Editor', icon: BookOpen },
  { id: 'qr', label: 'QR Codes', icon: QrCode },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'manager-control', label: 'Manager Control', icon: Activity },
]

const ROLES = {
  admin: { label: 'Admin', color: 'primary', permissions: ['dashboard', 'orders', 'billing', 'menu', 'qr', 'analytics', 'inventory'] },
  manager: { label: 'Manager', color: 'violet', permissions: ['dashboard', 'orders', 'billing', 'menu', 'qr', 'inventory'] },
  waiter: { label: 'Waiter', color: 'info', permissions: ['orders'] },
  kitchen: { label: 'Kitchen', color: 'warning', permissions: ['orders'] },
  cashier: { label: 'Cashier', color: 'success', permissions: ['orders', 'billing'] },
}

/* ─── Stat Card ─── */
const MiniStat = ({ icon: Icon, label, value, color = 'surface' }) => {
  const colors = {
    surface: 'bg-surface-100 dark:bg-surface-800/40 text-surface-500',
    primary: 'bg-primary-500/10 text-primary-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    violet: 'bg-violet-500/10 text-violet-500',
    amber: 'bg-amber-500/10 text-amber-500',
  }
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-surface-900/50 border border-surface-200/80 dark:border-surface-700/40">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-surface-900 dark:text-surface-50 leading-tight">{value}</p>
        <p className="text-[11px] text-surface-400 dark:text-surface-500 font-medium">{label}</p>
      </div>
    </div>
  )
}

/* ─── Permission Chip (Premium) ─── */
const PermissionChip = ({ id, label, icon: Icon, checked, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(id)}
    className={cn(
      'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border text-sm font-medium transition-all duration-200 group',
      checked
        ? 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/30 shadow-sm shadow-primary-500/5 ring-1 ring-primary-500/10'
        : 'bg-white dark:bg-surface-900/30 text-surface-500 dark:text-surface-400 border-surface-200/80 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-800/40 hover:border-surface-300 dark:hover:border-surface-600'
    )}
    aria-pressed={checked}
  >
    <Icon className={cn('w-4 h-4 flex-shrink-0 transition-colors', checked ? 'text-primary-500' : 'text-surface-400 group-hover:text-surface-500')} />
    <span className="flex-1 text-left truncate text-xs">{label}</span>
    <div className={cn(
      'w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0',
      checked
        ? 'bg-primary-500 text-white'
        : 'bg-surface-200/80 dark:bg-surface-700/50'
    )}>
      {checked && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  </button>
)

/* ─── Role Preset Button ─── */
const RolePreset = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border',
      active
        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/30'
        : 'bg-surface-50 dark:bg-surface-800/30 text-surface-500 border-surface-200/80 dark:border-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-800/50 hover:text-surface-700 dark:hover:text-surface-300'
    )}
  >
    {label}
  </button>
)

/* ─── Main Component ─── */
export const Staff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [showPin, setShowPin] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', pin: '',
    staffRole: 'waiter', permissions: ROLES.waiter.permissions,
  })

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await staffAPI.list()
      setStaff(response.data.staff || [])
    } catch (error) {
      toast.error('Failed to load staff list')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (role) => {
    setForm((prev) => ({ ...prev, staffRole: role, permissions: ROLES[role].permissions }))
  }

  const togglePermission = (id) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter((p) => p !== id)
        : [...prev.permissions, id],
    }))
  }

  const selectAllPermissions = () => {
    setForm((prev) => ({ ...prev, permissions: ALL_PERMISSIONS.map(p => p.id) }))
  }

  const clearAllPermissions = () => {
    setForm((prev) => ({ ...prev, permissions: [] }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.email.trim() && !form.phone.trim()) { toast.error('Provide at least email or phone'); return }
    if (!/^\d{6}$/.test(form.pin)) { toast.error('PIN must be a 6-digit number'); return }

    try {
      setCreating(true)
      const response = await staffAPI.create(form)
      const { user, tempPassword } = response.data
      toast.success(`Staff created. Temporary PIN: ${tempPassword}`)
      setForm({ name: '', email: '', phone: '', pin: '', staffRole: 'waiter', permissions: ROLES.waiter.permissions })
      setStaff((prev) => [...prev, user])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create staff')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (user) => {
    try {
      const updated = await staffAPI.update(user._id || user.id, { isActive: !user.isActive })
      setStaff((prev) => prev.map((s) => (s._id === user._id ? updated.data.user : s)))
      toast.success(`Staff ${user.isActive ? 'deactivated' : 'activated'}`)
    } catch (error) {
      toast.error('Failed to update staff')
    }
  }

  const visibleStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = (staff || [])
      .filter((m) => {
        if (statusFilter === 'active') return !!m.isActive
        if (statusFilter === 'inactive') return !m.isActive
        return true
      })
      .filter((m) => (roleFilter === 'all' ? true : (m?.staffRole || '') === roleFilter))
      .filter((m) => {
        if (!q) return true
        return (
          m?.name?.toLowerCase().includes(q) ||
          m?.email?.toLowerCase().includes(q) ||
          m?.phone?.toLowerCase().includes(q) ||
          m?.staffRole?.toLowerCase().includes(q)
        )
      })

    const sorted = [...filtered]
    if (sortBy === 'name') sorted.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''))
    if (sortBy === 'role') sorted.sort((a, b) => (a?.staffRole || '').localeCompare(b?.staffRole || ''))
    if (sortBy === 'recent') sorted.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0))
    return sorted
  }, [roleFilter, search, sortBy, staff, statusFilter])

  const totalStaff = staff.length
  const activeStaff = staff.filter((s) => s.isActive).length
  const managerCount = staff.filter((s) => s.staffRole === 'manager' || s.staffRole === 'admin').length

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', pin: '', staffRole: 'waiter', permissions: ROLES.waiter.permissions })
    setShowPin(false)
  }

  return (
    <div className="space-y-6 lg:space-y-7 max-w-[1500px] mx-auto">
      {/* ═══ Page Header ═══ */}
      <PageHeader
        title="Staff Management"
        subtitle="Create staff accounts and manage access permissions"
        icon={Users}
        actions={
          <Button variant="gradient" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => document.getElementById('staff-name-input')?.focus()}>
            Add Staff
          </Button>
        }
      />

      {/* ═══ Stats Row ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <MiniStat icon={Users} label="Total Staff" value={totalStaff} color="primary" />
        <MiniStat icon={UserCheck} label="Active Today" value={activeStaff} color="emerald" />
        <MiniStat icon={Briefcase} label="Managers" value={managerCount} color="violet" />
        <MiniStat icon={Shield} label="Permissions" value={`${ALL_PERMISSIONS.length} pages`} color="amber" />
      </motion.div>

      {/* ═══ 2-Column Layout ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 lg:gap-7 items-start">

        {/* ── LEFT: Team Directory ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="overflow-hidden">
            {/* Directory Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-surface-200/80 dark:border-surface-700/40">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Team Directory</h2>
                  <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-0.5">Search, filter, and manage your team</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="gray" size="sm">{totalStaff} members</Badge>
                  <Badge variant="success" size="sm" dot>{activeStaff} active</Badge>
                </div>
              </div>

              {/* Search + Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  placeholder="Search name, email, phone…"
                  className="sm:col-span-5"
                />
                <Select label="" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} leftIcon={<Briefcase className="w-3.5 h-3.5" />} containerClassName="sm:col-span-3">
                  <option value="all">All roles</option>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <option key={key} value={key}>{role.label}</option>
                  ))}
                </Select>
                <Select label="" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />} containerClassName="sm:col-span-2">
                  <option value="all">Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
                <Select label="" value={sortBy} onChange={(e) => setSortBy(e.target.value)} leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />} containerClassName="sm:col-span-2">
                  <option value="recent">Recent</option>
                  <option value="name">Name</option>
                  <option value="role">Role</option>
                </Select>
              </div>
            </div>

            {/* Staff List */}
            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-[72px] rounded-2xl skeleton" />
                  ))}
                </div>
              ) : visibleStaff.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No matching staff"
                  description={staff.length === 0
                    ? 'Create your first team member using the form on the right.'
                    : 'Try changing your search or filters.'}
                  compact
                  onAction={staff.length === 0 ? () => document.getElementById('staff-name-input')?.focus() : undefined}
                  actionLabel="Add First Staff"
                />
              ) : (
                <div className="space-y-2">
                  {visibleStaff.map((member, idx) => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-surface-200/80 dark:border-surface-700/40 bg-white/70 dark:bg-surface-900/[0.35] hover:bg-surface-50 dark:hover:bg-surface-800/30 hover:border-surface-300 dark:hover:border-surface-600/50 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white grid place-items-center font-bold text-sm shadow-sm shadow-primary-500/20 flex-shrink-0">
                          {member.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">{member.name}</p>
                            {member.staffRole && (
                              <Badge variant={ROLES[member.staffRole]?.color || 'info'} size="sm">
                                {ROLES[member.staffRole]?.label || member.staffRole}
                              </Badge>
                            )}
                            <span className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              member.isActive ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-surface-400'
                            )} />
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-surface-400 dark:text-surface-500">
                            {member.email && <span className="truncate">{member.email}</span>}
                            {member.email && member.phone && <span className="text-surface-300 dark:text-surface-700">·</span>}
                            {member.phone && <span>{member.phone}</span>}
                            {(member.email || member.phone) && <span className="text-surface-300 dark:text-surface-700">·</span>}
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant={member.isActive ? 'outline' : 'primary'}
                          size="xs"
                          onClick={() => toggleActive(member)}
                          leftIcon={member.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── RIGHT: Create Staff Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="xl:sticky xl:top-20"
        >
          <Card className="overflow-hidden">
            {/* Form Header */}
            <div className="px-5 py-4 border-b border-surface-200/80 dark:border-surface-700/40 bg-surface-50/50 dark:bg-surface-800/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/15 to-violet-500/10 border border-primary-500/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50 font-display">Add Staff Member</h2>
                  <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-0.5">Assign role & page access</p>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-5">
              <form onSubmit={handleCreate} className="space-y-4">
                {/* Row 1: Name + Role */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="staff-name-input"
                    label="Full Name"
                    placeholder="Staff name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    leftIcon={<Users className="w-4 h-4" />}
                    required
                  />
                  <Select
                    label="Role"
                    value={form.staffRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    leftIcon={<Briefcase className="w-4 h-4" />}
                  >
                    {Object.entries(ROLES).map(([key, role]) => (
                      <option key={key} value={key}>{role.label}</option>
                    ))}
                  </Select>
                </div>

                {/* Row 2: Email + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="staff@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>

                {/* Row 3: PIN */}
                <div className="relative">
                  <Input
                    label="6-digit PIN"
                    type={showPin ? 'text' : 'password'}
                    placeholder="Enter 6-digit PIN"
                    value={form.pin}
                    onChange={(e) => {
                      if (!/^\d*$/.test(e.target.value) || e.target.value.length > 6) return
                      setForm({ ...form, pin: e.target.value })
                    }}
                    leftIcon={<Shield className="w-4 h-4" />}
                    required
                    helperText="Used by the staff member to sign in."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-[34px] p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-surface-800 dark:text-surface-200">
                      <Shield className="w-4 h-4 text-surface-400" />
                      Permissions
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={selectAllPermissions}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        Select All
                      </button>
                      <span className="text-surface-300 dark:text-surface-700 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={clearAllPermissions}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Role Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mr-1">Presets:</span>
                    {Object.entries(ROLES).map(([key, role]) => (
                      <RolePreset
                        key={key}
                        label={role.label}
                        active={form.staffRole === key}
                        onClick={() => handleRoleChange(key)}
                      />
                    ))}
                  </div>

                  {/* Permission Chips Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map((perm) => (
                      <PermissionChip
                        key={perm.id}
                        id={perm.id}
                        label={perm.label}
                        icon={perm.icon}
                        checked={form.permissions.includes(perm.id)}
                        onToggle={togglePermission}
                      />
                    ))}
                  </div>

                  <p className="text-[11px] text-surface-400 dark:text-surface-500">
                    {form.permissions.length} of {ALL_PERMISSIONS.length} permissions selected
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex gap-2.5">
                  <Button type="submit" variant="gradient" className="flex-1" loading={creating} leftIcon={<Plus className="w-4 h-4" />}>
                    Create Staff
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Reset
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
