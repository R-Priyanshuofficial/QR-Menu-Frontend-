import { Outlet } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'

export const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  )
}
