import React, { useState, useEffect } from 'react';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Headphones, 
  LifeBuoy, 
  Settings, 
  LogOut, 
  Pencil, 
  Save, 
  Truck, 
  CheckCircle, 
  Home as HomeIcon,
  ChevronRight,
  Clock,
  Trash2,
  Plus,
  ChevronDown,
  Mail as MailIcon,
  PhoneCall,
  PhoneIncoming,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { TrackOrderSection } from '../components/TrackOrderSection';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'motion/react';

type Section = 'profile' | 'orders' | 'tracking' | 'wishlist' | 'addresses' | 'support' | 'care' | 'settings';

// ─── Wishlist Section Component ───────────────────────────────────────────────
const WishlistSection: React.FC = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-10 w-10 text-rose-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Your Wishlist is Empty</h3>
        <p className="text-gray-500 mt-2 max-w-xs">Found something you like? Heart it to save it here for later!</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
          Browse Products
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-900">My Wishlist</h2>
          <p className="text-sm text-gray-500 mt-1">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
        </div>
        <button
          onClick={() => wishlist.forEach(p => toggleWishlist(p))}
          className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-600 hover:underline transition"
        >
          Clear All
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
};


interface Order {
  id: number;
  product_id: string;
  product_name: string;
  product_image: string;
  status: 'Ordered' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  tracking_number: string;
  price: string;
  created_at: string;
}

interface Address {
  id: number;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳', label: 'India' },
  { code: '+1', country: 'US', flag: '🇺🇸', label: 'United States' },
  { code: '+44', country: 'GB', flag: '🇬🇧', label: 'United Kingdom' },
  { code: '+61', country: 'AU', flag: '🇦🇺', label: 'Australia' },
  { code: '+971', country: 'AE', flag: '🇦🇪', label: 'United Arab Emirates' },
  { code: '+966', country: 'SA', flag: '🇸🇦', label: 'Saudi Arabia' },
  { code: '+49', country: 'DE', flag: '🇩🇪', label: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', label: 'France' },
  { code: '+81', country: 'JP', flag: '🇯🇵', label: 'Japan' },
  { code: '+1', country: 'CA', flag: '🇨🇦', label: 'Canada' },
];

export const Profile = () => {
  // Strict Authentication Guard
  if (!localStorage.getItem('token') || !localStorage.getItem('user')) {
    window.location.href = '/auth';
    return null;
  }

  const { user, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as Section;
  
  const [activeSection, setActiveSection] = useState<Section>(sectionParam || 'profile');
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Settings State
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Help Center State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Callback State
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [callbackNumber, setCallbackNumber] = useState('');
  const [callbackIssue, setCallbackIssue] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      // Fetch fresh profile data
      api.get('/profile')
        .then(res => {
          setFormData({
            first_name: res.data.first_name || '',
            last_name: res.data.last_name || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            address: res.data.address || '',
          });
        })
        .catch(err => console.error('Error fetching profile', err));
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeSection === 'orders' && user) {
      setLoadingOrders(true);
      api.get('/orders')
        .then(res => setOrders(res.data))
        .catch(err => console.error('Error fetching orders', err))
        .finally(() => setLoadingOrders(false));
    }
    
    if (activeSection === 'addresses' && user) {
      fetchAddresses();
    }
  }, [activeSection, user]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/profile/get-addresses');
      if (res.data.success) {
        setAddresses(res.data.addresses);
      }
    } catch (err) {
      console.error('Error fetching addresses', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setPincodeError(null);

    let hasError = false;

    if (editingAddress?.phone?.length !== 10) {
      setPhoneError("Invalid phone number. Must be 10 digits.");
      hasError = true;
    }

    if (editingAddress?.pincode?.length !== 6) {
      setPincodeError("Invalid pincode. Must be 6 digits.");
      hasError = true;
    }

    if (hasError) return;

    try {
      if (editingAddress?.id) {
        const res = await api.put(`/profile/update-address/${editingAddress.id}`, editingAddress);
        if (res.data.success) {
          alert('Address updated successfully!');
        }
      } else {
        const res = await api.post('/profile/add-address', editingAddress);
        if (res.data.success) {
          alert('Address added successfully!');
        }
      }
      setShowAddressModal(false);
      setEditingAddress(null);
      fetchAddresses();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save address';
      alert(errorMsg);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.delete(`/profile/delete-address/${id}`);
      if (res.data.success) {
        fetchAddresses();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete address';
      alert(errorMsg);
    }
  };

  const handleRequestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackNumber.trim()) {
      alert('Please enter a valid phone number');
      return;
    }
    try {
      await api.post('/request-callback', { phone_number: callbackNumber, issue: callbackIssue });
      
      alert('Your callback request has been submitted. A confirmation email has been sent.');
      setShowCallbackForm(false);
      setCallbackNumber('');
      setCallbackIssue('');
    } catch (err: any) {
      console.error('Callback error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit callback request. Please try again later.';
      alert(errorMsg);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.put('/profile', formData);
      if (res.data.success && res.data.user) {
        // Update auth context with new user data
        updateUserProfile({ ...res.data.user });
      }
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic frontend check before sending
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    try {
      console.log("[FRONTEND] Sending password change request...");
      const response = await api.post('/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      });

      if (response.data.success) {
        alert('Password updated successfully!');
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(response.data.message || 'Failed to update password');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Server error while updating password';
      console.error("[FRONTEND] Password update error:", errorMsg);
      alert(errorMsg);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile/delete-account');
      alert('Account deleted successfully.');
      logout();
      navigate('/');
    } catch (error) {
      alert('Failed to delete account');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  // Type definition for menu items to allow optional isLink/path properties
  interface MenuItem {
    id: string;
    label: string;
    icon: any;
    isLink?: boolean;
    path?: string;
  }

  const menuItems: MenuItem[] = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'tracking', label: 'Track Orders', icon: Truck },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'support', label: 'Customer Support', icon: LifeBuoy },
    { id: 'care', label: 'Customer Care', icon: Headphones },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  const getStatusIcon = (status: string, currentStatus: string) => {
    const statuses = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    const stepIndex = statuses.indexOf(status);
    const isCompleted = stepIndex <= currentIndex;
    const isCurrent = stepIndex === currentIndex;

    const baseClasses = "flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all";
    if (isCompleted) {
      if (isCurrent) return `${baseClasses} border-indigo-600 bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50`;
      return `${baseClasses} border-indigo-600 bg-indigo-600 text-white`;
    }
    return `${baseClasses} border-gray-200 bg-white text-gray-300`;
  };

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* ── Sidebar ── */}
          <aside className="w-full md:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 bg-indigo-600">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xl text-center uppercase">
                    {formData.first_name[0] || '?'}
                  </div>
                  <div className="text-white">
                    <p className="text-xs text-indigo-100 font-medium">Hello,</p>
                    <p className="font-bold truncate max-w-[140px]">{formData.first_name} {formData.last_name}</p>
                  </div>
                </div>
              </div>
              
              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  if (item.isLink) {
                    return (
                      <Link
                        key={item.id}
                        to={item.path!}
                        className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id as Section);
                        setSearchParams({ section: item.id });
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        isActive 
                        ? 'bg-indigo-50 text-indigo-600 font-bold' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {isActive && <motion.div layoutId="active" className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                    </button>
                  );
                })}
                <div className="h-px bg-gray-100 my-2 mx-3" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[600px]"
              >
                
                {/* ── Section: Profile Details ── */}
                {activeSection === 'profile' && (
                  <>
                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">Profile Details</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
                      </div>
                      {isEditing ? (
                        <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                           Save Changes
                        </button>
                      ) : (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition">
                          <Pencil className="h-4 w-4" /> Edit Profile
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={e => setFormData({...formData, first_name: e.target.value})}
                            readOnly={!isEditing}
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${isEditing ? 'border-indigo-100 bg-white focus:border-indigo-500 focus:outline-none' : 'border-transparent bg-gray-50 text-gray-900 font-semibold'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                          <input
                            type="email"
                            value={formData.email}
                            readOnly
                            className="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={e => setFormData({...formData, last_name: e.target.value})}
                            readOnly={!isEditing}
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${isEditing ? 'border-indigo-100 bg-white focus:border-indigo-500 focus:outline-none' : 'border-transparent bg-gray-50 text-gray-900 font-semibold'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            readOnly={!isEditing}
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${isEditing ? 'border-indigo-100 bg-white focus:border-indigo-500 focus:outline-none' : 'border-transparent bg-gray-50 text-gray-900 font-semibold'}`}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Shipping Address</label>
                        <textarea
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                          readOnly={!isEditing}
                          rows={4}
                          className={`w-full px-4 py-4 rounded-xl border-2 transition-all resize-none ${isEditing ? 'border-indigo-100 bg-white focus:border-indigo-500 focus:outline-none' : 'border-transparent bg-gray-50 text-gray-900 font-semibold'}`}
                          placeholder="Your full delivery address..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Section: Order History ── */}
                {activeSection === 'orders' && (
                  <>
                    <div className="mb-10">
                      <h2 className="text-2xl font-black text-gray-900">Order History</h2>
                      <p className="text-sm text-gray-500 mt-1">Track and manage your recent purchases</p>
                    </div>

                    {loadingOrders ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium tracking-wide">Syncing your orders...</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                          <Package className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No orders yet</h3>
                        <p className="text-gray-500 mt-2 max-w-xs mx-auto">Looks like you haven't placed any orders. Start shopping to see them here!</p>
                        <button onClick={() => navigate('/')} className="mt-8 bg-black text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition shadow-xl shadow-gray-200">
                          Shop Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {orders.map((order) => (
                          <div key={order.id} className="group border border-gray-100 rounded-2xl overflow-hidden hover:border-indigo-100 transition-all hover:shadow-xl hover:shadow-indigo-50/50">
                            <div className="bg-gray-50/50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="text-xs">
                                  <p className="text-gray-400 font-black uppercase tracking-tighter mb-0.5">Order ID</p>
                                  <p className="text-gray-900 font-bold">#{order.id}</p>
                                </div>
                                <div className="h-8 w-px bg-gray-200" />
                                <div className="text-xs">
                                  <p className="text-gray-400 font-black uppercase tracking-tighter mb-0.5">Date</p>
                                  <p className="text-gray-900 font-bold">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{order.order_status}</span>
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="flex gap-6">
                                <img src={order.product_image} alt={order.product_name} className="h-20 w-20 object-cover rounded-xl bg-gray-50 border border-gray-100" />
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{order.product_name}</h4>
                                  <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1 text-gray-500">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span className="text-xs font-medium">₹{order.total_price}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-indigo-600">
                                      <Truck className="h-3.5 w-3.5" />
                                      <span className="text-xs font-mono font-bold tracking-tight">{order.tracking_number}</span>
                                    </div>
                                  </div>
                                </div>
                                <button className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all self-center">
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </div>

                              {/* Tracking Progress */}
                              <div className="mt-8 pt-8 border-t border-gray-50 px-2 lg:px-6">
                                <div className="relative">
                                  <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 rounded-full" />
                                  <div 
                                    className="absolute top-4 left-0 h-1 bg-indigo-600 rounded-full transition-all duration-1000"
                                    style={{ width: 
                                      order.order_status === 'Ordered' ? '0%' : 
                                      order.order_status === 'Shipped' ? '33%' : 
                                      order.order_status === 'Out for Delivery' ? '66%' : '100%' 
                                    }}
                                  />
                                  <div className="relative flex justify-between items-start">
                                    {['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'].map((label) => (
                                      <div key={label} className="flex flex-col items-center">
                                        <div className={getStatusIcon(label, order.status)}>
                                          {label === 'Ordered' && <Package className="h-3.5 w-3.5" />}
                                          {label === 'Shipped' && <Truck className="h-3.5 w-3.5" />}
                                          {label === 'Out for Delivery' && <HomeIcon className="h-3.5 w-3.5" />}
                                          {label === 'Delivered' && <CheckCircle className="h-3.5 w-3.5" />}
                                        </div>
                                        <span className={`text-[10px] mt-2 font-black uppercase tracking-tighter text-center max-w-[60px] leading-tight ${
                                          ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'].indexOf(label) <= ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'].indexOf(order.order_status)
                                          ? 'text-gray-900' : 'text-gray-300'
                                        }`}>
                                          {label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ── Section: Wishlist ── */}
                {activeSection === 'wishlist' && (
                  <WishlistSection />
                )}

                {/* ── Section: Track Orders ── */}
                {activeSection === 'tracking' && (
                  <TrackOrderSection orders={orders} />
                )}

                {/* ── Section: Addresses ── */}
                {activeSection === 'addresses' && (
                  <>
                    <div className="mb-10 flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">Saved Addresses</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage where your kicks get delivered</p>
                      </div>
                      <button 
                        onClick={() => { setEditingAddress({}); setShowAddressModal(true); }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                      >
                        <Plus className="h-4 w-4" /> Add New Address
                      </button>
                    </div>

                    {loadingAddresses ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium tracking-wide">Fetching addresses...</p>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <MapPin className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No addresses saved</h3>
                        <p className="text-sm text-gray-500 mt-1">Add an address to speed up your checkout process.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                          <div key={addr.id} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                <MapPin className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingAddress(addr); setShowAddressModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600">
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => deleteAddress(addr.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-bold text-gray-900">{addr.name}</h4>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{addr.phone}</p>
                            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                              {addr.address_line}<br />
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Address Modal */}
                    <AnimatePresence>
                      {showAddressModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                          >
                            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                              <h3 className="text-xl font-black uppercase tracking-tight">{editingAddress?.id ? 'Edit Address' : 'Add New Address'}</h3>
                              <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="h-5 w-5" /></button>
                            </div>
                            <form onSubmit={handleAddressSubmit} className="p-6 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Full Name</label>
                                  <input 
                                    required 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                                    value={editingAddress?.name || ''} 
                                    onChange={e => setEditingAddress({...editingAddress, name: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Phone Number</label>
                                  <input 
                                    required 
                                    type="tel"
                                    maxLength={10}
                                    className={`w-full px-4 py-3 bg-gray-50 border ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-100'} rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all`}
                                    value={editingAddress?.phone || ''} 
                                    onChange={e => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      if (val.length <= 10) {
                                        setEditingAddress({...editingAddress, phone: val});
                                        if (val.length === 10) setPhoneError(null);
                                      }
                                    }}
                                  />
                                  {phoneError && <span className="text-[10px] font-bold text-red-500 ml-1">{phoneError}</span>}
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Address line</label>
                                <textarea 
                                  required 
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all resize-none"
                                  value={editingAddress?.address_line || ''} 
                                  onChange={e => setEditingAddress({...editingAddress, address_line: e.target.value})}
                                />
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">City</label>
                                  <input 
                                    required 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                                    value={editingAddress?.city || ''} 
                                    onChange={e => setEditingAddress({...editingAddress, city: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">State</label>
                                  <input 
                                    required 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                                    value={editingAddress?.state || ''} 
                                    onChange={e => setEditingAddress({...editingAddress, state: e.target.value})}
                                  />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Pincode</label>
                                  <input 
                                    required 
                                    type="text"
                                    maxLength={6}
                                    className={`w-full px-4 py-3 bg-gray-50 border ${pincodeError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-100'} rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all`}
                                    value={editingAddress?.pincode || ''} 
                                    onChange={e => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      if (val.length <= 6) {
                                        setEditingAddress({...editingAddress, pincode: val});
                                        if (val.length === 6) setPincodeError(null);
                                      }
                                    }}
                                  />
                                  {pincodeError && <span className="text-[10px] font-bold text-red-500 ml-1">{pincodeError}</span>}
                                </div>
                              </div>

                              <AnimatePresence>
                              </AnimatePresence>

                              <div className="flex gap-3 pt-4">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 font-bold">
                                  {editingAddress?.id ? 'Update Address' : 'Save Address'}
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setShowAddressModal(false)}
                                  className="px-8 bg-gray-100 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* ── Section: Support (Help Center) ── */}
                {activeSection === 'support' && (
                  <div className="space-y-8">
                    <div className="mb-10">
                      <h2 className="text-2xl font-black text-gray-900">Help Center</h2>
                      <p className="text-sm text-gray-500 mt-1">Find answers to common questions</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { q: 'When will my order arrive?', a: 'Typically within 3-5 business days depending on your location. You can track your order in real-time under the "Order History" section of your profile.' },
                        { q: 'How do I return a product?', a: 'You can initiate a return within 30 days of delivery. The item must be unworn and in its original packaging. Please contact our support team or use our AI Chat to start the process.' },
                        { q: 'Are your sneakers authentic?', a: 'Yes, 100% genuine products. Every pair of sneakers on Sneaks undergoes a multi-point authentication process by our experts before being shipped to you.' },
                        { q: 'Can I cancel my order?', a: 'Orders can only be canceled within 1 hour of placement or before they are processed for shipping. Once "Shipped", the order cannot be canceled but can be returned.' }
                      ].map((faq, i) => (
                        <div 
                          key={i} 
                          className={`rounded-2xl border transition-all overflow-hidden ${expandedFaq === i ? 'border-indigo-200 bg-indigo-50/20 ring-4 ring-indigo-50/50' : 'border-gray-100 bg-white hover:border-indigo-100 hover:bg-gray-50/30'}`}
                        >
                          <button 
                            onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                            className="w-full flex items-center justify-between p-5 text-left"
                          >
                            <p className="font-bold text-sm text-gray-900">{faq.q}</p>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${expandedFaq === i ? 'rotate-180 text-indigo-600' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {expandedFaq === i && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                              >
                                <div className="px-5 pb-5 pt-0">
                                  <div className="h-px bg-indigo-100 mb-4 opacity-50" />
                                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{faq.a}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Section: Customer Care ── */}
                {activeSection === 'care' && (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-8">
                      <Headphones className="h-10 w-10 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Customer Care</h2>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm text-center font-medium">We're here to help you 24/7. Reach out via any of these channels.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl mt-12">
                      <a href="tel:+919876543210" className="group p-6 rounded-3xl border border-gray-100 text-center hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-xl transition-all">
                        <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                          <PhoneCall className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Call Us</p>
                        <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">+91 98765 43210</p>
                      </a>
                      
                      <a href="mailto:support@sneaks.com" className="group p-6 rounded-3xl border border-gray-100 text-center hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-xl transition-all">
                        <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                          <MailIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Email Us</p>
                        <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">support@sneaks.com</p>
                      </a>

                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('openAIChat'))}
                        className="group p-6 rounded-3xl border border-gray-100 text-center hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-xl transition-all"
                      >
                        <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                          <MessageSquare className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">AI Chat</p>
                        <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">24/7 Support</p>
                      </button>

                      <button 
                        onClick={() => {
                          setShowCallbackForm(!showCallbackForm);
                          if (!callbackNumber && user?.phone) setCallbackNumber(user.phone);
                        }}
                        className={`group p-6 rounded-3xl border text-center transition-all ${showCallbackForm ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-xl'}`}
                      >
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${showCallbackForm ? 'bg-indigo-600' : 'bg-gray-50 group-hover:bg-white'}`}>
                          <PhoneIncoming className={`h-5 w-5 ${showCallbackForm ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${showCallbackForm ? 'text-indigo-600' : 'text-gray-400'}`}>Request Call</p>
                        <p className={`text-sm font-black transition-colors ${showCallbackForm ? 'text-indigo-900' : 'text-gray-900 group-hover:text-indigo-600'}`}>Callback</p>
                      </button>
                    </div>

                    <AnimatePresence>
                      {showCallbackForm && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -20 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -20 }}
                          className="w-full max-w-md mt-6 overflow-hidden"
                        >
                          <div className="bg-white border border-indigo-100 p-6 rounded-3xl shadow-xl shadow-indigo-50 ring-4 ring-indigo-50/50">
                            <h4 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-tight">Where should we call you?</h4>
                            <p className="text-xs text-gray-400 mb-4 font-medium">Enter the phone number you'd like us to reach you on.</p>
                            <form onSubmit={handleRequestCall} className="space-y-4">
                              <div className="flex gap-3">
                                <div className="w-[130px] flex-shrink-0 relative flex items-center bg-gray-50 border border-gray-100 rounded-2xl pl-3 pr-8 py-3 transition-all hover:bg-white hover:border-indigo-200 group/select">
                                  <span className="text-xl mr-2 pointer-events-none">
                                    {COUNTRY_CODES.find(c => c.code === selectedCountryCode)?.flag}
                                  </span>
                                  <select 
                                    value={selectedCountryCode}
                                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                                    className="appearance-none bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer h-full w-full"
                                  >
                                    {COUNTRY_CODES.map(c => (
                                      <option key={`${c.country}-${c.code}`} value={c.code}>
                                        {c.flag} {c.code}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-hover/select:text-indigo-600 transition-colors" />
                                </div>
                                <input 
                                  type="tel"
                                  required
                                  value={callbackNumber}
                                  onChange={(e) => setCallbackNumber(e.target.value)}
                                  placeholder="Enter phone number"
                                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all min-w-0"
                                />
                              </div>
                              <div className="w-full">
                                <textarea 
                                  value={callbackIssue}
                                  onChange={(e) => setCallbackIssue(e.target.value)}
                                  placeholder="Describe your issue (Optional)"
                                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none h-20"
                                ></textarea>
                              </div>
                              <button 
                                type="submit"
                                className="w-full bg-indigo-600 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-indigo-100"
                              >
                                Request Callback
                              </button>
                            </form>
                            <button 
                              onClick={() => setShowCallbackForm(false)}
                              className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-12 p-6 bg-gray-50 rounded-3xl border border-gray-100 max-w-md w-full text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Service Hours (IST)</p>
                      <div className="flex justify-between items-center text-xs text-gray-600 font-black">
                        <span>Mon - Sat</span>
                        <span className="text-indigo-600">09:00 AM - 08:00 PM</span>
                      </div>
                      <div className="mt-2 text-[10px] text-gray-400 font-medium">Chat is available 24/7 for urgent queries</div>
                    </div>
                  </div>
                )}

                {/* ── Section: Account Settings ── */}
                {activeSection === 'settings' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="mb-10">
                      <h2 className="text-2xl font-black text-gray-900">Account Settings</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage your security and preferences</p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Change Password */}
                      <div className={`p-6 rounded-2xl border transition-all ${isChangingPassword ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-100 bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="font-bold text-gray-900">Change Password</p>
                            <p className="text-xs text-gray-500 mt-0.5">Keep your account safe with a strong password</p>
                          </div>
                          {!isChangingPassword && (
                            <button 
                              onClick={() => setIsChangingPassword(true)}
                              className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              Update
                            </button>
                          )}
                        </div>

                        {isChangingPassword && (
                          <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <input
                              type="password"
                              placeholder="Current Password"
                              required
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all text-sm"
                              value={passwordData.currentPassword}
                              onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input
                                type="password"
                                placeholder="New Password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all text-sm"
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                              />
                              <input
                                type="password"
                                placeholder="Confirm New Password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all text-sm"
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                                Save New Password
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setIsChangingPassword(false)}
                                className="bg-white text-gray-500 border border-gray-200 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                      {/* Notifications Toggle */}
                      <div className="flex justify-between items-center p-6 rounded-2xl border border-gray-100 bg-white">
                        <div>
                          <p className="font-bold text-gray-900">Push Notifications</p>
                          <p className="text-xs text-gray-500 mt-0.5">Manage alerts about drops and orders</p>
                        </div>
                        <button 
                          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                          className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${notificationsEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                          <motion.div 
                            animate={{ x: notificationsEnabled ? 26 : 4 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm" 
                          />
                        </button>
                      </div>

                      {/* Delete Account */}
                      <div className={`p-6 rounded-2xl border transition-all ${showDeleteConfirm ? 'border-red-500 bg-red-50/30' : 'border-gray-100 bg-white'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-red-500">Delete Account</p>
                            <p className="text-xs text-gray-400 mt-0.5">Permanently remove your account and data</p>
                          </div>
                          {!showDeleteConfirm && (
                            <button 
                              onClick={() => setShowDeleteConfirm(true)}
                              className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-600 hover:underline"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>

                        {showDeleteConfirm && (
                          <div className="mt-6 p-4 bg-white rounded-xl border border-red-100 animate-in fade-in zoom-in-95 duration-300">
                            <p className="text-sm font-bold text-gray-900 mb-2">Are you absolutely sure?</p>
                            <p className="text-xs text-gray-500 mb-6 font-medium">This action cannot be undone. All your order history and saved data will be permanently deleted.</p>
                            <div className="flex gap-3">
                              <button 
                                onClick={handleDeleteAccount}
                                className="bg-red-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-100"
                              >
                                Yes, Delete My Account
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="bg-white text-gray-500 border border-gray-200 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition"
                              >
                                I've changed my mind
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

