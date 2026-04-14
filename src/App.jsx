import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@shared/contexts/AuthContext'
import { CartProvider } from '@shared/contexts/CartContext'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { SocketProvider } from '@shared/contexts/SocketContext'
import { ToastProvider } from '@shared/components/Toast'
import { PageLoader } from '@shared/components/Spinner'

// Customer Pages
import { CustomerLayout } from '@customer/layout/CustomerLayout'
import { Welcome } from '@customer/pages/Welcome'
import { MenuPage } from '@customer/pages/MenuPage'
import { Cart } from '@customer/pages/Cart'
import { OrderStatus } from '@customer/pages/OrderStatus'
import { OrderSuccess } from '@customer/pages/OrderSuccess'
import { OrderHistory } from '@customer/pages/OrderHistory'

// Admin Pages
import { AdminLayout } from '@admin/layout/AdminLayout'
import { Dashboard } from '@admin/pages/Dashboard'
import { Analytics } from '@admin/pages/Analytics'
import { Orders } from '@admin/pages/Orders'
import { Billing } from '@admin/pages/Billing'
import { QRGenerator } from '@admin/pages/QRGenerator'
import { QRCustomizer } from '@admin/pages/QRCustomizer'
import { QRDesigner } from '@admin/pages/QRDesigner'
import { MenuEditor } from '@admin/pages/MenuEditor'
import { EditProfile } from '@admin/pages/EditProfile'
import { Settings } from '@admin/pages/Settings'
import { Login } from '@admin/pages/Login'
import { Staff } from '@admin/pages/Staff'
import { Inventory } from '@admin/pages/Inventory'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader message="Preparing your dashboard..." />

  return isAuthenticated ? children : <Navigate to="/owner/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              <ToastProvider />
              <Routes>
            {/* Customer Routes */}
            <Route path="/m/:menuSlug/q/:token" element={<CustomerLayout />}>
              <Route index element={<Welcome />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="cart" element={<Cart />} />
              <Route path="success/:orderId" element={<OrderSuccess />} />
              <Route path="order/:orderId" element={<OrderStatus />} />
              <Route path="history" element={<OrderHistory />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/owner/login" element={<Login />} />
            <Route
              path="/owner"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="billing" element={<Billing />} />
              <Route path="menu" element={<MenuEditor />} />
              <Route path="qr" element={<QRGenerator />} />
              <Route path="qr/customize" element={<QRCustomizer />} />
              <Route path="qr/designer" element={<QRDesigner />} />
              <Route path="profile" element={<EditProfile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="staff" element={<Staff />} />
              <Route path="inventory" element={<Inventory />} />
            </Route>

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/owner/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
