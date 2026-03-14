import React, { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Home } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: number;
  product_id: string;
  product_name: string;
  product_image: string;
  status: 'Ordered' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  tracking_number: string;
  price: string;
  order_date: string;
}

export const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string, currentStatus: string) => {
    const statuses = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    const stepIndex = statuses.indexOf(status);

    const isCompleted = stepIndex <= currentIndex;
    const isCurrent = stepIndex === currentIndex;

    const baseClasses = "flex items-center justify-center w-8 h-8 rounded-full border-2";
    if (isCompleted) {
      if (isCurrent) return `${baseClasses} border-indigo-600 bg-indigo-50 text-indigo-600`;
      return `${baseClasses} border-indigo-600 bg-indigo-600 text-white`;
    }
    return `${baseClasses} border-gray-300 bg-white text-gray-300`;
  };

  const getProgressBarWidth = (status: string) => {
    switch (status) {
      case 'Ordered': return '0%';
      case 'Shipped': return '33%';
      case 'Out for Delivery': return '66%';
      case 'Delivered': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-black tracking-tight text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex py-3 px-6 rounded-lg bg-indigo-600 font-medium text-white hover:bg-indigo-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium mb-1">Order Date</p>
                      <p className="text-gray-900">{new Date(order.order_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium mb-1">TotalAmount</p>
                      <p className="text-gray-900 font-medium">₹{order.price}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-gray-500 font-medium mb-1">Order ID</p>
                      <p className="text-gray-900">#{order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 font-medium mb-1 text-sm">Tracking Number</p>
                    <p className="text-indigo-600 font-mono font-medium">{order.tracking_number}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <img src={order.product_image} alt={order.product_name} className="w-24 h-24 object-cover rounded-lg border border-gray-100" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">{order.product_name}</h4>
                      <p className="text-gray-500 mt-1">Status: <span className="text-gray-900 font-medium">{order.status}</span></p>
                    </div>
                  </div>

                  {/* Tracking UI */}
                  <div className="mt-8 pt-8 border-t border-gray-100 relative">
                    <div className="absolute top-12 left-8 sm:left-12 right-8 sm:right-12 h-1 bg-gray-200 -z-10 rounded-full"></div>
                    <div 
                      className="absolute top-12 left-8 sm:left-12 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-1000 ease-in-out"
                      style={{ width: `calc(${getProgressBarWidth(order.status)} - 4rem)` }}
                    ></div>

                    <div className="flex justify-between relative mt-4">
                      <div className="flex flex-col items-center">
                        <div className={getStatusIcon('Ordered', order.status)}>
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 mt-2">Ordered</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className={getStatusIcon('Shipped', order.status)}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 mt-2">Shipped</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className={getStatusIcon('Out for Delivery', order.status)}>
                          <Home className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 mt-2 hidden sm:block">Out for Delivery</span>
                        <span className="text-xs font-medium text-gray-700 mt-2 sm:hidden text-center">Out for<br/>Delivery</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className={getStatusIcon('Delivered', order.status)}>
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 mt-2">Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
