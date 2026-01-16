import { useEffect, useState } from 'react'
import { Users, Mail, Phone, Shield, Briefcase } from 'lucide-react'
import { Card } from '@shared/components/Card'
import { Input } from '@shared/components/Input'
import { Button } from '@shared/components/Button'
import { staffAPI } from '@shared/api/endpoints'
import toast from 'react-hot-toast'

const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Orders' },
  { id: 'billing', label: 'Billing' },
  { id: 'menu', label: 'Menu Editor' },
  { id: 'qr', label: 'QR Codes' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'inventory', label: 'Inventory' },
]

const ROLES = {
  admin: {
    label: 'Admin',
    permissions: ['dashboard', 'orders', 'billing', 'menu', 'qr', 'analytics', 'inventory'],
  },
  manager: {
    label: 'Manager',
    permissions: ['dashboard', 'orders', 'billing', 'menu', 'qr', 'inventory'],
  },
  waiter: {
    label: 'Waiter',
    permissions: ['orders'],
  },
  kitchen: {
    label: 'Kitchen',
    permissions: ['orders'],
  },
  cashier: {
    label: 'Cashier',
    permissions: ['orders', 'billing'],
  },
}

export const Staff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    pin: '',
    staffRole: 'waiter',
    permissions: ROLES.waiter.permissions,
  })

  useEffect(() => {
    fetchStaff()
  }, [])

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
    setForm((prev) => ({
      ...prev,
      staffRole: role,
      permissions: ROLES[role].permissions,
    }))
  }

  const togglePermission = (id) => {
    setForm((prev) => {
      const has = prev.permissions.includes(id)
      return {
        ...prev,
        permissions: has
          ? prev.permissions.filter((p) => p !== id)
          : [...prev.permissions, id],
      }
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (!form.email.trim() && !form.phone.trim()) {
      toast.error('Provide at least email or phone')
      return
    }

    if (!/^\d{6}$/.test(form.pin)) {
      toast.error('PIN must be a 6-digit number')
      return
    }

    try {
      setCreating(true)
      const response = await staffAPI.create(form)
      const { user, tempPassword } = response.data
      toast.success(`Staff created. Temporary PIN: ${tempPassword}`)
      setForm({
        name: '',
        email: '',
        phone: '',
        pin: '',
        staffRole: 'waiter',
        permissions: ROLES.waiter.permissions,
      })
      setStaff((prev) => [...prev, user])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create staff')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (user) => {
    try {
      const updated = await staffAPI.update(user._id || user.id, {
        isActive: !user.isActive,
      })
      setStaff((prev) =>
        prev.map((s) => (s._id === user._id ? updated.data.user : s))
      )
      toast.success(`Staff ${user.isActive ? 'deactivated' : 'activated'}`)
    } catch (error) {
      toast.error('Failed to update staff')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Staff Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create staff accounts and choose which pages they can access.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Staff */}
        <Card className="lg:col-span-1">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-primary-50 text-primary-600">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Add Staff</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Name *"
                name="name"
                placeholder="Staff name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                leftIcon={<Users className="w-4 h-4" />}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={form.staffRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {Object.entries(ROLES).map(([key, role]) => (
                      <option key={key} value={key}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="staff@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Phone"
                name="phone"
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                leftIcon={<Phone className="w-4 h-4" />}
              />

              <Input
                label="6-digit PIN *"
                name="pin"
                type="password"
                placeholder="Enter 6-digit PIN"
                value={form.pin}
                onChange={(e) => {
                  const value = e.target.value
                  if (!/^\d*$/.test(value) || value.length > 6) return
                  setForm({ ...form, pin: value })
                }}
                leftIcon={<Shield className="w-4 h-4" />}
                required
              />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Allowed Pages
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" loading={creating}>
                Create Staff
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                This PIN will be used by the staff member to log in.
              </p>
            </form>
          </div>
        </Card>

        {/* Staff List */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Existing Staff
            </h2>

            {loading ? (
              <p className="text-sm text-gray-500">Loading staff...</p>
            ) : staff.length === 0 ? (
              <p className="text-sm text-gray-500">No staff members yet.</p>
            ) : (
              <div className="space-y-3">
                {staff.map((member) => (
                  <div
                    key={member._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {member.name}
                        </p>
                        {member.staffRole && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                            {member.staffRole}
                          </span>
                        )}
                        {!member.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mt-1">
                        {member.email && <p>Email: {member.email}</p>}
                        {member.phone && <p>Phone: {member.phone}</p>}
                        {member.staffPin && <p>PIN: {member.staffPin}</p>}
                        <p className="flex flex-wrap gap-1 items-center">
                          <span className="mr-1">Pages:</span>
                          {(member.permissions && member.permissions.length > 0
                            ? member.permissions
                            : ['orders']
                          ).map((perm) => {
                            const permLabel =
                              ALL_PERMISSIONS.find((p) => p.id === perm)?.label || perm
                            return (
                              <span
                                key={perm}
                                className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-2 py-0.5 text-[11px] font-medium"
                              >
                                {permLabel}
                              </span>
                            )
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={member.isActive ? 'secondary' : 'primary'}
                        onClick={() => toggleActive(member)}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
