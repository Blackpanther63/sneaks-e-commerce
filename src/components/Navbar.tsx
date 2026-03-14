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

          </div>
        </div>
      </div>
    </nav>
  );
};
