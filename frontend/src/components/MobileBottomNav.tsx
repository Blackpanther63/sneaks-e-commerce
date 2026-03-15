import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav = () => {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthNav = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      navigate('/auth', { state: { from: path, isLogin: true } });
    }
  };

  // Helper to determine if a route is active including nested paths
  const checkActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (isActive: boolean) =>
    `relative flex flex-col items-center gap-1 transition-all duration-300 px-4 py-2 rounded-xl active:scale-90 ${
      isActive 
        ? 'text-indigo-600 bg-gray-100 shadow-md transform scale-105 font-bold' 
        : 'text-gray-400 font-medium'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-2 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Home */}
        <NavLink 
          to="/" 
          end 
          className={({ isActive }) => navLinkClass(isActive)}
        >
          <Home className={`h-6 w-6 ${checkActive('/', true) ? 'fill-indigo-50/50' : ''}`} />
          <span className="text-[10px] uppercase tracking-tight">Home</span>
        </NavLink>

        {/* Category */}
        <NavLink 
          to="/category" 
          className={({ isActive }) => navLinkClass(isActive || checkActive('/category'))}
        >
          <Grid className={`h-6 w-6 ${checkActive('/category') ? 'fill-indigo-50/50' : ''}`} />
          <span className="text-[10px] uppercase tracking-tight">Category</span>
        </NavLink>

        {/* Cart */}
        <NavLink 
          to="/cart" 
          onClick={(e) => handleAuthNav(e, '/cart')}
          className={({ isActive }) => navLinkClass(isActive || checkActive('/cart'))}
        >
          <div className="relative">
            <ShoppingBag className={`h-6 w-6 ${checkActive('/cart') ? 'fill-indigo-50/50' : ''}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-black text-white ring-2 ring-white">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-tight">Cart</span>
        </NavLink>

        {/* Profile / Login */}
        <NavLink 
          to="/profile" 
          onClick={(e) => handleAuthNav(e, '/profile')}
          className={({ isActive }) => navLinkClass(isActive || checkActive('/profile') || checkActive('/auth'))}
        >
          <User className={`h-6 w-6 ${(checkActive('/profile') || checkActive('/auth')) ? 'fill-indigo-50/50' : ''}`} />
          <span className="text-[10px] uppercase tracking-tight">
            {user ? 'Profile' : 'Login'}
          </span>
        </NavLink>
      </div>
    </div>
  );
};
