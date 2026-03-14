import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { products, categories } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ArrowRight, Search } from 'lucide-react';

export const Home = () => {
  const location = useLocation();

  // Department comes from the Navbar (Men / Women / Sale / All)
  const [activeDept, setActiveDept] = useState(location.state?.department || 'All');
  // Category is the second row on the home page (Lifestyle / Running / etc.)
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    // Current location logic
    const isCategoryPath = location.pathname === '/category';
    const hasScrollState = location.state?.scrollTo === 'collection';
    
    if (location.state?.department !== undefined || isCategoryPath || hasScrollState) {
      if (location.state?.department !== undefined) {
        setActiveDept(location.state.department || 'All');
        setActiveCategory('All');
      }
      setTimeout(() => {
        const el = document.getElementById('collection');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.state?.department, location.state?.scrollTo, location.pathname]);

  const filteredProducts = products.filter(p => {
    const deptMatch =
      activeDept === 'All' ? true :
      activeDept === 'Sale' ? p.isSale :
      p.department === activeDept;
    const catMatch = activeCategory === 'All' ? true : p.category === activeCategory;
    return deptMatch && catMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sticky Search Bar */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search sneakers, brands..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=2000"
            alt="Hero background"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-32 sm:px-6 lg:px-8 lg:py-48 text-center sm:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto sm:mx-0"
          >
            <h1 className="font-display text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-none">
              STEP INTO <br />
              <span className="text-indigo-500">THE FUTURE</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-xl">
              Discover the latest drops, exclusive collaborations, and timeless classics. Elevate your sneaker game with Sneaks.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#collection"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-4 text-base font-bold text-white hover:bg-indigo-500 transition-colors"
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-md hover:bg-white/20 transition-colors"
              >
                View Lookbook
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Categories & Products */}
      <div id="collection" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="font-display text-3xl font-black tracking-tight text-gray-900 sm:text-4xl mb-6">
            LATEST DROPS
          </h2>

          {/* Product type filters: All | Lifestyle | Sports */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap rounded-full px-5 py-1.5 text-sm font-bold shadow-sm border transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-6">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-gray-500">On all orders over ₹150. Fast and reliable delivery worldwide.</p>
            </div>
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-6">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Free Returns</h3>
              <p className="text-gray-500">Not quite right? Return it within 30 days for a full refund.</p>
            </div>
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-6">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Checkout</h3>
              <p className="text-gray-500">Your payment information is processed securely with 256-bit encryption.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
