import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Truck, Shield, Ruler, Zap, Loader2, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const isLoggedIn = !!localStorage.getItem('token');
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
        if (res.data) {
          if (res.data.sizes?.length > 0) setSelectedSize(res.data.sizes[0]);
          if (res.data.colors?.length > 0) setSelectedColor(res.data.colors[0]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
          <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:text-indigo-500">
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (selectedSize && selectedColor) {
      addToCart(product, selectedSize, selectedColor);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize || !selectedColor) return;
    
    // Store product data in localStorage for checkout
    const checkoutItem = {
      ...product,
      size: selectedSize,
      color: selectedColor,
      quantity: 1
    };
    localStorage.setItem("checkoutProduct", JSON.stringify([checkoutItem]));

    if (!isLoggedIn) {
      navigate('/auth', { state: { message: 'Please login to place an order.', from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-8 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12 xl:gap-x-16">
          {/* Image gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col-reverse"
          >
            <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
              <div className="grid grid-cols-4 gap-6">
                {[product.image, product.image, product.image, product.image].map((img, idx) => (
                  <button
                    key={idx}
                    className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-gray-100 text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4"
                  >
                    <span className="absolute inset-0 overflow-hidden rounded-md">
                      <img src={img} alt="" className="h-full w-full object-cover object-center" referrerPolicy="no-referrer" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="aspect-h-1 aspect-w-1 w-full rounded-2xl bg-gray-100 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover object-center sm:rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* Product info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-10 px-4 sm:px-0 lg:mt-0"
          >
            <h1 className="font-display text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>
            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">₹{product.price}</p>
            </div>

            {/* Reviews */}
            <div className="mt-3">
              <h3 className="sr-only">Reviews</h3>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <Star
                      key={rating}
                      className="h-5 w-5 flex-shrink-0 text-yellow-400 fill-current"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="sr-only">5 out of 5 stars</p>
                <a href="#" className="ml-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  117 reviews
                </a>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="space-y-6 text-base text-gray-700">
                <p>{product.description}</p>
              </div>
            </div>

            <div className="mt-8">
              {/* Colors */}
              <div>
                <h3 className="text-sm font-medium text-gray-900">Color</h3>
                <div className="mt-4 flex items-center space-x-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none ${
                        selectedColor === color ? 'ring-2 ring-indigo-500 ring-offset-2' : 'ring-1 ring-gray-200'
                      }`}
                    >
                      <span className="sr-only">{color}</span>
                      <span
                        aria-hidden="true"
                        className="h-8 w-8 rounded-full border border-black border-opacity-10"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Size</h3>
                  <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Size guide
                  </a>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-4">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`group relative flex items-center justify-center rounded-md border py-3 px-4 text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-6 ${
                        selectedSize === size
                          ? 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'border-gray-200 bg-white text-gray-900'
                      }`}
                    >
                      <span>{size}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor}
                  className={`flex flex-1 items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full transition-all ${
                    !selectedSize || !selectedColor
                      ? 'bg-gray-300 cursor-not-allowed'
                      : isAdded
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {!selectedSize ? 'Select a Size' : isAdded ? 'Added to Cart!' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedSize || !selectedColor}
                  className={`flex items-center justify-center gap-2 rounded-md border border-transparent px-6 py-3 text-base font-medium transition-all ${
                    !selectedSize || !selectedColor
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Buy Now
                </button>
              </div>
            </div>

            <div className="mt-10 border-t border-gray-200 pt-8">
              <div className="flex items-center gap-4 mb-4">
                <Truck className="h-6 w-6 text-gray-400" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Free Shipping</h4>
                  <p className="text-sm text-gray-500">Free standard shipping on orders over ₹150</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ShieldCheck className="h-6 w-6 text-gray-400" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Free Returns</h4>
                  <p className="text-sm text-gray-500">Return for free within 30 days</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
