import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav = () => {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path: string, requiresAuth: boolean = false) => {
    if (requiresAuth && !user) {
      navigate('/auth', { state: { from: path, isLogin: true } });
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-lg border-t border-gray-100 px-2 py-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/') ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <Home className={`h-6 w-6 ${isActive('/') ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Home</span>
        </button>

        <button
          onClick={() => {
            navigate('/');
            setTimeout(() => {
                const el = document.getElementById('collection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/categories') ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <Grid className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Category</span>
        </button>

        <button
          onClick={() => handleNavClick('/cart', true)}
          className={`relative flex flex-col items-center gap-1 transition-colors ${
            isActive('/cart') ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`h-6 w-6 ${isActive('/cart') ? 'fill-current' : ''}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-black text-white ring-2 ring-white">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight">Cart</span>
        </button>

        <button
          onClick={() => handleNavClick('/profile', true)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/profile') ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <User className={`h-6 w-6 ${isActive('/profile') ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tight">
            {user ? 'Profile' : 'Login'}
          </span>
        </button>
      </div>
    </div>
  );
};
