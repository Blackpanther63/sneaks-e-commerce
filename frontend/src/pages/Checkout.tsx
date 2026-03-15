import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CreditCard, CheckCircle, MapPin, Plus, Trash2, Package, Truck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../utils/api';

interface Address {
  id: number;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
}

// State → City mapping for address dropdowns
const stateCityMap: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Saket', 'Karol Bagh'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Alappuzha'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Puri'],
  'Punjab': ['Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Noida'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Nainital', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Kharagpur'],
};

export const Checkout = () => {
  const { items: cartItems, totalPrice: cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Strict Authentication Guard
  if (!localStorage.getItem('token') || !localStorage.getItem('user')) {
    window.location.href = '/auth';
    return null;
  }

  const [checkoutProduct] = useState<any[] | null>(() => {
    try {
      const stored = localStorage.getItem('checkoutProduct');
      const parsed = stored ? JSON.parse(stored) : null;
      console.log("Checkout page loaded");
      console.log(parsed);
      return parsed;
    } catch (e) {
      console.error("Checkout Error", e);
      return null;
    }
  });

  const items = checkoutProduct || cartItems;
  const totalPrice = checkoutProduct ? checkoutProduct.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0) : cartTotal;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  
  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  
  // New Address Form toggle
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '', phone: '', address_line: '', city: '', state: '', pincode: ''
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'UPI' | 'Credit/Debit Card' | 'Net Banking'>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>('PhonePe');
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState<string | null>(null);
  const [isUpiVerified, setIsUpiVerified] = useState(false);

  // Order Calculations
  const subtotal = totalPrice;
  const shipping = subtotal > 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    // Fetch addresses
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/profile/get-addresses');
        if (res.data.success && res.data.addresses) {
          setAddresses(res.data.addresses);
          if (res.data.addresses.length > 0) {
            setSelectedAddressId(res.data.addresses[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [navigate]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setPincodeError(null);

    let hasError = false;

    if (newAddress.phone.length !== 10) {
      setPhoneError("Invalid phone number. Must be 10 digits.");
      hasError = true;
    }

    if (newAddress.pincode.length !== 6) {
      setPincodeError("Invalid pincode. Must be 6 digits.");
      hasError = true;
    }

    if (hasError) return;

    try {
      const res = await api.post('/profile/add-address', newAddress);
      if (res.data.success) {
        // Refresh addresses
        const refreshRes = await api.get('/profile/get-addresses');
        setAddresses(refreshRes.data.addresses);
        setSelectedAddressId(res.data.id || refreshRes.data.addresses[0].id);
        setShowAddAddress(false);
        setNewAddress({ name: '', phone: '', address_line: '', city: '', state: '', pincode: '' });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save address');
    }
  };

  const { user } = useAuth();

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
    }

    if (!user) {
      alert("You must be logged in to place an order.");
      return;
    }

    setIsProcessing(true);

    if (paymentMethod === 'UPI' && !selectedUpiApp) {
      if (!isUpiVerified) {
        setUpiError("Please verify your UPI ID first.");
        setIsProcessing(false);
        return;
      }
    }
    const createOrderInFlask = async () => {
      try {
        const orderData = {
          items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            size: item.selectedSize || item.size,
            color: item.selectedColor || item.color
          })),
          total: total.toFixed(2),
          address_id: selectedAddressId,
          payment_method: paymentMethod
        };

        const res = await api.post('/orders/create', orderData);
        if (res.data.success) {
          finalizeOrder(res.data.order_id, res.data.tracking_number);
        } else {
          throw new Error('Failed to create order on server');
        }
      } catch (err: any) {
        console.error('Error creating order:', err);
        alert('Failed to place order. ' + (err.message || ''));
        setIsProcessing(false);
      }
    };

    if (paymentMethod === 'Cash on Delivery') {
      await createOrderInFlask();
    } else {
      // Razorpay Mock / Integration
      try {
        const res = await api.post('/orders/create-razorpay-order', { amount: total });
        if (res.data.success) {
          const options = {
            key: (import.meta as any).env.VITE_RAZORPAY_KEY || 'rzp_test_rYqQ3t0R7u5t1h',
            amount: res.data.order.amount,
            currency: 'INR',
            name: 'Sneaks',
            description: 'Order Payment',
            order_id: res.data.order.id,
            handler: async function (response: any) {
              // Payment successful, now create real order
              await createOrderInFlask();
            },
            prefill: {
              name: user?.name,
              email: user?.email,
              contact: user?.phone
            },
            theme: { color: '#4f46e5' },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            alert('Payment Failed!');
            setIsProcessing(false);
          });
          rzp.open();
        } else {
          // Fallback mock if Razorpay route isn't up
          setTimeout(async () => {
            await createOrderInFlask();
          }, 1500);
        }
      } catch (err) {
        console.error('Razorpay Error:', err);
        // Fallback mock
        setTimeout(async () => {
          await createOrderInFlask();
        }, 1500);
      }
    }
  };

  const finalizeOrder = (oId?: number | string, tNum?: string) => {
    setIsProcessing(false);
    if (oId) setOrderId(oId as number);
    if (tNum) setTrackingNumber(tNum);
    setIsSuccess(true);
    if (checkoutProduct) {
      localStorage.removeItem('checkoutProduct');
    } else {
      clearCart();
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center bg-gray-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-6 rounded-full bg-green-100 p-6"
        >
          <CheckCircle className="h-16 w-16 text-green-600" />
        </motion.div>
        <h2 className="mb-4 text-3xl font-black text-gray-900">Order Placed Successfully!</h2>
        
        <div className="mb-8 w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</span>
            <span className="text-lg font-black text-indigo-600">#{orderId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tracking ID</span>
            <span className="text-sm font-bold text-gray-900">{trackingNumber}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            A confirmation email has been sent to your registered address. You can track your order using the ID above.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/profile?section=orders')}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700 shadow-md shadow-indigo-100"
          >
            View Order History
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 px-8 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center bg-gray-50">
        <h2 className="mb-4 text-3xl font-black text-gray-900">No product selected for checkout</h2>
        <p className="mb-8 text-gray-500 max-w-md">Please add items to your cart or select 'Buy Now' on a product to proceed here.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
        >
          Go back to shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f2f4f8] min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Checkout
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-500">
            <Lock className="h-4 w-4" />
            Secure Checkout
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8">
          
          {/* Main Content Sections */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 1. Delivery Address */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">1</div>
                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
              </div>
              
              <div className="p-6">
                {loadingAddresses ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-gray-100 rounded-xl w-full"></div>
                    <div className="h-20 bg-gray-100 rounded-xl w-full"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((addr) => (
                      <label 
                        key={addr.id} 
                        className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddressId === addr.id 
                            ? 'border-indigo-600 bg-indigo-50/30' 
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex h-5 items-center mr-4">
                          <input
                            type="radio"
                            name="address"
                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{addr.name} <span className="font-normal text-gray-500 ml-2">{addr.phone}</span></p>
                          <p className="text-sm text-gray-600 mt-1">
                            {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      </label>
                    ))}

                    {addresses.length === 0 && !showAddAddress && (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">No addresses saved.</p>
                      </div>
                    )}

                    {!showAddAddress ? (
                      <button
                        onClick={() => setShowAddAddress(true)}
                        className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        <Plus className="h-4 w-4" /> Add a new address
                      </button>
                    ) : (
                      <form onSubmit={handleAddAddress} className="mt-6 border-t border-gray-100 pt-6">
                        <h3 className="font-bold text-gray-900 mb-4">Enter New Address</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <input required type="text" placeholder="Full Name" className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} />
                          <div className="flex flex-col gap-1">
                            <input 
                              required 
                              type="tel" 
                              placeholder="Phone Number" 
                              className={`p-3 bg-gray-50 border ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-sm transition-all`}
                              value={newAddress.phone} 
                              maxLength={10}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, ''); // Allow digits only
                                if (val.length <= 10) {
                                  setNewAddress({...newAddress, phone: val});
                                  if (val.length === 10) setPhoneError(null);
                                }
                              }} 
                            />
                            {phoneError && <span className="text-[10px] font-bold text-red-500 ml-1">{phoneError}</span>}
                          </div>
                          <input required type="text" placeholder="Address Line (Street, Area)" className="sm:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={newAddress.address_line} onChange={e => setNewAddress({...newAddress, address_line: e.target.value})} />
                          
                          {/* State Dropdown */}
                          <select
                            required
                            className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700"
                            value={newAddress.state}
                            onChange={e => setNewAddress({...newAddress, state: e.target.value, city: ''})}
                          >
                            <option value="">Select State</option>
                            {Object.keys(stateCityMap).sort().map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>

                          {/* City Dropdown (depends on state) */}
                          <select
                            required
                            className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700"
                            value={newAddress.city}
                            onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                            disabled={!newAddress.state}
                          >
                            <option value="">Select City</option>
                            {(stateCityMap[newAddress.state] || []).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>

                           <div className="sm:col-span-2 flex flex-col gap-1">
                             <input 
                               required 
                               type="text" 
                               placeholder="Pincode" 
                               className={`w-full p-3 bg-gray-50 border ${pincodeError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-sm transition-all`}
                               value={newAddress.pincode} 
                               maxLength={6}
                               onChange={e => {
                                 const val = e.target.value.replace(/\D/g, ''); // Allow digits only
                                 if (val.length <= 6) {
                                   setNewAddress({...newAddress, pincode: val});
                                   if (val.length === 6) setPincodeError(null);
                                 }
                               }} 
                             />
                             {pincodeError && <span className="text-[10px] font-bold text-red-500 ml-1">{pincodeError}</span>}
                           </div>
                         </div>

                         <AnimatePresence>
                         </AnimatePresence>

                        <div className="flex gap-3">
                          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm">Save Address</button>
                          <button type="button" onClick={() => setShowAddAddress(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all ${!selectedAddressId ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">2</div>
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { id: 'UPI', label: 'UPI (Recommended)', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg' },
                    { id: 'Net Banking', label: 'Net Banking', lucide: Package },
                    { id: 'Cash on Delivery', label: 'Cash on Delivery', lucide: Truck }
                  ].map((method) => (
                    <div key={method.id}>
                      <label 
                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === method.id 
                            ? 'border-indigo-600 bg-indigo-50/30' 
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 mr-4"
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id as any)}
                        />
                        <div className="flex items-center gap-3">
                          {method.lucide ? <method.lucide className="h-5 w-5 text-gray-400" /> : <img src={method.icon} className="h-5 w-5 object-contain" alt="" />}
                          <span className="font-bold text-gray-900 text-sm">{method.label}</span>
                        </div>
                      </label>

                      <AnimatePresence>
                        {paymentMethod === 'UPI' && method.id === 'UPI' && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-8 mt-4 space-y-4 overflow-hidden"
                          >
                            <div className="flex flex-wrap gap-3">
                              {[
                                { name: 'PhonePe', logo: 'https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png' },
                                { name: 'Google Pay', logo: 'https://download.logo.wine/logo/Google_Pay/Google_Pay-Logo.wine.png' },
                                { name: 'Paytm', logo: 'https://download.logo.wine/logo/Paytm/Paytm-Logo.wine.png' }
                              ].map(app => (
                                <button
                                  key={app.name}
                                  onClick={() => setSelectedUpiApp(app.name)}
                                  className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${
                                    selectedUpiApp === app.name ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                                  }`}
                                >
                                  <img src={app.logo} className="h-6 w-auto object-contain" alt={app.name} />
                                  <span className={`text-xs font-bold ${selectedUpiApp === app.name ? 'text-indigo-600' : 'text-gray-500'}`}>{app.name}</span>
                                </button>
                              ))}
                              <button
                                onClick={() => setSelectedUpiApp(null)}
                                className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl border-2 text-xs font-bold transition-all ${
                                  selectedUpiApp === null ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                                }`}
                              >
                                Other UPI ID
                              </button>
                            </div>
                            <div className="relative">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">Enter UPI ID</label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input 
                                    type="text"
                                    placeholder="username@upi"
                                    className={`w-full p-3 bg-gray-50 border ${upiError ? 'border-red-500 ring-1 ring-red-500' : isUpiVerified ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'} rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all`}
                                    value={upiId}
                                    onChange={(e) => {
                                      setUpiId(e.target.value);
                                      setIsUpiVerified(false);
                                      if (upiError) setUpiError(null);
                                    }}
                                  />
                                  {isUpiVerified && <CheckCircle className="absolute right-3 top-3.5 h-4 w-4 text-green-500" />}
                                </div>
                                <button
                                  type="button"
                                  disabled={!upiId || isUpiVerified}
                                  onClick={() => {
                                    if (upiId.includes('@')) {
                                      setIsUpiVerified(true);
                                      setUpiError(null);
                                    } else {
                                      setUpiError("Invalid UPI ID - must contain @");
                                      setIsUpiVerified(false);
                                    }
                                  }}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    isUpiVerified 
                                      ? 'bg-green-100 text-green-600 border border-green-200' 
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                  } disabled:opacity-50`}
                                >
                                  {isUpiVerified ? 'Verified' : 'Verify'}
                                </button>
                              </div>
                              {upiError && <p className="mt-1 text-[10px] text-red-500 font-bold ml-1">{upiError}</p>}
                              {!upiError && !isUpiVerified && <p className="mt-1 text-[10px] text-gray-400 font-medium ml-1">Example: 9876543210@ybl, name@oksbi</p>}
                            </div>

                            {/* Conditional Pay Now for UPI */}
                            {(selectedUpiApp || isUpiVerified) && (
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="pt-2"
                              >
                                <button
                                  type="button"
                                  onClick={handlePlaceOrder}
                                  disabled={isProcessing}
                                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                  {isProcessing ? (
                                    <>
                                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-4 w-4" />
                                      Pay Now ₹{total.toFixed(2)}
                                    </>
                                  )}
                                </button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Order Items Summary (Mobile View mostly, or descriptive) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">3</div>
                <h2 className="text-xl font-bold text-gray-900">Items and Delivery</h2>
              </div>
              
              <ul className="divide-y divide-gray-100 px-6">
                {items.map((item, index) => (
                  <li key={`${item.id}-${item.size}-${item.color}-${index}`} className="flex py-6">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-2">
                      <img src={item.image} alt={item.name} className="h-full w-full object-contain object-center" />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-center">
                      <div className="flex justify-between text-sm font-bold text-gray-900">
                        <h3>{item.name}</h3>
                        <p className="ml-4">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                       <p className="mt-1 text-sm text-gray-500">Size {item.selectedSize ?? item.size} • Qty {item.quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </section>

          {/* Sticky Order Summary Sidebar */}
          <section className="mt-8 lg:col-span-4 lg:mt-0">
            <div className="sticky top-24 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <h2 className="text-xl font-black text-gray-900 mb-6">Order Summary</h2>

              <dl className="space-y-4 text-sm text-gray-600">
                <div className="flex justify-between items-center">
                  <dt>Subtotal ({items.length} items)</dt>
                  <dd className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt>Shipping estimate</dt>
                  <dd className="font-medium text-gray-900">{shipping === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${shipping.toFixed(2)}`}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt>Tax estimate</dt>
                  <dd className="font-medium text-gray-900">₹{tax.toFixed(2)}</dd>
                </div>
                <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center text-lg font-black text-gray-900">
                  <dt>Order Total</dt>
                  <dd className="text-indigo-600">₹{total.toFixed(2)}</dd>
                </div>
              </dl>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={!selectedAddressId || isProcessing}
                  className="w-full rounded-2xl border border-transparent bg-[#ffd814] px-4 py-4 text-base font-bold text-gray-900 shadow-sm transition-all hover:bg-[#d8b500] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ffd814] focus:ring-offset-2 flex justify-center items-center"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Place Your Order"
                  )}
                </button>
                {!selectedAddressId && (
                  <p className="mt-3 text-center text-xs text-red-500 font-bold">Please select a delivery address first</p>
                )}
                <div className="mt-6 border-t border-gray-100 pt-6 text-center text-xs text-gray-500">
                  By placing your order, you agree to Sneaks' privacy notice and conditions of use.
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
