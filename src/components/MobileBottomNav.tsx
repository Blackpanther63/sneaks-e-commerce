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

  const navLinkClass = ({ isActive, isAuthActive = false }: { isActive: boolean, isAuthActive?: boolean }) => {
    const active = isActive || isAuthActive;
    return `relative flex flex-col items-center gap-1 transition-all duration-300 px-4 py-2 rounded-xl active:scale-95 ${
      active 
        ? 'text-indigo-600 bg-gray-100 shadow-md' 
        : 'text-gray-400 hover:text-gray-600'
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-2 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <NavLink to="/" end className={navLinkClass}>
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Home</span>
        </NavLink>

        <NavLink to="/category" className={navLinkClass}>
          <Grid className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Category</span>
        </NavLink>

        <NavLink 
          to="/cart" 
          onClick={(e) => handleAuthNav(e, '/cart')}
          className={navLinkClass}
        >
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-black text-white ring-2 ring-white">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight">Cart</span>
        </NavLink>

        <NavLink 
          to="/profile" 
          onClick={(e) => handleAuthNav(e, '/profile')}
          className={(props) => navLinkClass({ ...props, isAuthActive: location.pathname === '/auth' })}
        >
          <User className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-tight">
            {user ? 'Profile' : 'Login'}
          </span>
        </NavLink>
      </div>
    </div>
  );
};
