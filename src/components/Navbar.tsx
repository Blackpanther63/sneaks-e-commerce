import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, User, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const activeDept = location.pathname === '/' ? (location.state?.department || 'All') : '';

  const getLinkClass = (dept: string) => {
    return activeDept === dept
      ? "bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm font-bold shadow-sm transition-all drop-shadow-sm"
      : "text-gray-500 hover:text-indigo-600 px-4 py-2 rounded-md text-sm font-medium transition-all";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl">
                S
              </div>
              <span className="font-display text-2xl font-black tracking-tighter text-gray-900">
                SNEAKS
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" state={{ department: 'All' }} className={getLinkClass('All')}>
                New Arrivals
              </Link>
              <Link to="/" state={{ department: 'Men' }} className={getLinkClass('Men')}>
                Men
              </Link>
              <Link to="/" state={{ department: 'Women' }} className={getLinkClass('Women')}>
                Women
              </Link>
              <Link to="/" state={{ department: 'Sale' }} className={getLinkClass('Sale')}>
                Sale
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
              <Search className="h-5 w-5" />
            </button>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="text-gray-500 hover:text-gray-900 transition-colors hidden sm:flex items-center gap-1">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.first_name || 'Profile'}</span>
                </Link>
                <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors hidden sm:block" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link to="/auth" state={{ isLogin: true }} className="text-gray-700 hover:text-indigo-600 font-medium text-sm transition-colors">
                  Log in
                </Link>
                <Link to="/auth" state={{ isLogin: false }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors">
                  Sign up
                </Link>
              </div>
            )}
            <Link to="/cart" className="relative text-gray-900 hover:text-indigo-600 transition-colors">
              <ShoppingBag className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
            <button className="text-gray-500 hover:text-gray-900 md:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
