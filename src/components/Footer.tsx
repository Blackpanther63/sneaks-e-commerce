import React from 'react';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl">
                S
              </div>
              <span className="font-display text-2xl font-black tracking-tighter text-white">
                SNEAKS
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Your ultimate destination for the freshest kicks and timeless classics.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">New Arrivals</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Men's Shoes</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Women's Shoes</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Sale</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Support & Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Shipping Info</a></li>
              <li className="pt-2 text-gray-400 flex flex-col gap-1">
                <span>Email: <a href="mailto:support@sneaks.com" className="text-indigo-400 hover:text-indigo-300">support@sneaks.com</a></span>
                <span>Phone: <a href="tel:+919876543210" className="text-indigo-400 hover:text-indigo-300">+91 98765 43210</a></span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="flex max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-l-md border-0 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                className="rounded-r-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Sneaks Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
