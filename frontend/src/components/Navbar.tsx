import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex items-center justify-center h-9 w-9 rounded-xl hover:bg-gray-100 transition-all text-gray-600 hover:text-indigo-600"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-black text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <>
                {/* Profile link */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all text-sm font-semibold text-gray-700 hover:text-indigo-600"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-black">
                    {user.first_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <span className="hidden md:block">{user.first_name}</span>
                </Link>
                {/* Logout */}
                <button
                  onClick={logout}
                  title="Logout"
                  className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              /* Login / Sign Up button */
              <Link
                to="/auth"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-bold text-white transition-all shadow-sm hover:shadow-md"
              >
                <User className="h-4 w-4" />
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
