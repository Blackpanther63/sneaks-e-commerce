import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Search, ArrowRight, Home as HomeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../utils/api';

interface OrderDetails {
  id: number;
  product_name: string;
  product_image: string;
  status: 'Ordered' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  tracking_number: string;
  price: string;
  created_at: string;
  expected_delivery?: string;
}

interface TrackOrderSectionProps {
  orders: any[]; // User's past orders
}

export const TrackOrderSection: React.FC<TrackOrderSectionProps> = ({ orders }) => {
  const [searchType, setSearchType] = useState<'order_id' | 'tracking_id'>('tracking_id');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter orders to extract only the strings needed for the datalist auto-fill
  const trackingIds = orders.map(o => o.tracking_number).filter(Boolean);
  const orderIds = orders.map(o => o.id).filter(Boolean);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setTrackedOrder(null);

    try {
      const params = new URLSearchParams();
      params.append(searchType, searchValue.trim());

      const response = await api.get(`/orders/track?${params.toString()}`);
      if (response.data.success && response.data.order) {
        setTrackedOrder(response.data.order);
      } else {
        setError('Order not found. Please check your ID and try again.');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Order not found. Please check your ID and try again.');
      } else {
        setError('Something went wrong. Please try again later.');
      }
      console.error('Tracking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, currentStatus: string) => {
    const statuses = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    const stepIndex = statuses.indexOf(status);
    const isCompleted = stepIndex <= currentIndex;
    const isCurrent = stepIndex === currentIndex;

    const baseClasses = "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 z-10 mx-auto";
    if (isCompleted) {
      if (isCurrent) return `${baseClasses} border-indigo-600 bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50`;
      return `${baseClasses} border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200`;
    }
    return `${baseClasses} border-gray-200 bg-white text-gray-400`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h2 className="text-2xl font-black text-gray-900">Track Your Order</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your Tracking ID or Order ID below to get real-time updates on your delivery status.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-gray-50 rounded-3xl p-2 mb-8 border border-gray-100">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <select
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value as any);
              setSearchValue(''); // Clear input when switching
            }}
            className="bg-white border-2 border-transparent outline-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-700 cursor-pointer focus:border-indigo-100 transition-colors sm:w-48 appearance-none shadow-sm"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="tracking_id">Tracking ID</option>
            <option value="order_id">Order ID</option>
          </select>
          
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              list="order-history-list"
              placeholder={searchType === 'tracking_id' ? 'e.g. TRK12345678' : 'e.g. 1042'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full bg-white border-2 border-transparent outline-none pl-12 pr-6 py-4 rounded-2xl text-gray-900 font-medium placeholder:text-gray-400 focus:border-indigo-100 transition-colors shadow-sm"
              required
            />
            {/* Native HTML Datalist for dropdown auto-suggest functionality */}
            <datalist id="order-history-list">
              {searchType === 'tracking_id' 
                ? trackingIds.map((id, i) => <option key={i} value={id} />)
                : orderIds.map((id, i) => <option key={i} value={id} />)
              }
            </datalist>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Track Order <ArrowRight className="h-5 w-5" /></>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl text-center font-medium text-sm flex items-center justify-center gap-2"
          >
            <div className="h-2 w-2 rounded-full bg-red-600 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracking Results */}
      <AnimatePresence>
        {trackedOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
          >
            {/* Header */}
            <div className="border-b border-gray-50 p-6 sm:p-8 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Tracking ID</p>
                  <p className="text-xl font-bold text-indigo-600">{trackedOrder.tracking_number}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm self-start sm:self-auto">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900">{trackedOrder.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <img src={trackedOrder.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200'} alt={trackedOrder.product_name} className="h-16 w-16 object-cover rounded-xl bg-gray-50" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{trackedOrder.product_name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    <p>Order #{trackedOrder.id}</p>
                    <p className="hidden sm:block">•</p>
                    <p>Placed on {new Date(trackedOrder.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Timeline */}
            <div className="p-6 sm:p-10">
              <h3 className="font-bold text-gray-900 mb-8 text-lg">Delivery Status</h3>
              
              <div className="relative">
                {/* Progress Line Background */}
                <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-gray-100 rounded-full" />
                
                {/* Progress Line Fill */}
                <div 
                  className="absolute top-6 left-[10%] h-1 bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: 
                    trackedOrder.status === 'Ordered' ? '0%' : 
                    trackedOrder.status === 'Shipped' ? '26.66%' : 
                    trackedOrder.status === 'Out for Delivery' ? '53.33%' : '80%' 
                  }}
                />

                <div className="relative flex justify-between items-start">
                  {[
                    { label: 'Ordered', icon: Package, desc: 'Processing' },
                    { label: 'Shipped', icon: Truck, desc: 'In transit' },
                    { label: 'Out for Delivery', icon: HomeIcon, desc: 'Arriving soon' },
                    { label: 'Delivered', icon: CheckCircle, desc: 'Completed' }
                  ].map((step) => {
                    const Icon = step.icon;
                    const statuses = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'];
                    const isCompleted = statuses.indexOf(step.label) <= statuses.indexOf(trackedOrder.status);
                    
                    return (
                      <div key={step.label} className="flex flex-col items-center w-1/4 relative z-10">
                        <div className={getStatusIcon(step.label, trackedOrder.status)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-center">
                          <h4 className={`text-sm font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1 hidden sm:block">
                            {isCompleted ? step.desc : 'Pending'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {trackedOrder.status !== 'Delivered' && (
                <div className="mt-10 bg-indigo-50/50 rounded-2xl p-6 text-center border border-indigo-100">
                  <p className="text-sm font-medium text-gray-600">Estimated Delivery</p>
                  <p className="text-xl font-bold text-indigo-600 mt-1">
                    {trackedOrder.expected_delivery || '3 - 5 Business Days'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
