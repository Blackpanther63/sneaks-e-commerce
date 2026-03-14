import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 rounded-full bg-indigo-50 p-6">
          <ShoppingBag className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mb-4 text-3xl font-black text-gray-900">Your cart is empty</h2>
        <p className="mb-8 text-gray-500">Looks like you haven't added any sneakers to your cart yet.</p>
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-indigo-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
        >
          Start Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-black tracking-tight text-gray-900 sm:text-4xl mb-12">Shopping Cart</h1>

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              Items in your shopping cart
            </h2>

            <ul role="list" className="divide-y divide-gray-200 border-b border-t border-gray-200">
              {items.map((item, itemIdx) => (
                <motion.li 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: itemIdx * 0.1 }}
                  key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} 
                  className="flex py-6 sm:py-10"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm">
                            <Link to={`/product/${item.id}`} className="font-medium text-gray-700 hover:text-gray-800">
                              {item.name}
                            </Link>
                          </h3>
                        </div>
                        <div className="mt-1 flex text-sm">
                          <p className="text-gray-500">Color: </p>
                          <div
                            className="ml-2 h-4 w-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: item.selectedColor }}
                          />
                          <p className="ml-4 border-l border-gray-200 pl-4 text-gray-500">Size: {item.selectedSize}</p>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-900">₹{item.price}</p>
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <div className="flex items-center border border-gray-300 rounded-md w-min">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                            className="p-2 text-gray-400 hover:text-gray-500"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 text-gray-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                            className="p-2 text-gray-400 hover:text-gray-500"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="absolute right-0 top-0">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                            className="-m-2 inline-flex p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <span className="sr-only">Remove</span>
                            <Trash2 className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 flex space-x-2 text-sm text-gray-700">
                      <span>In stock</span>
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </section>

          {/* Order summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-2xl bg-white px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8 shadow-sm border border-gray-100"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Order summary
            </h2>

            <dl className="mt-6 space-y-4 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd className="text-gray-900">₹{totalPrice.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="flex items-center text-sm">
                  <span>Shipping estimate</span>
                </dt>
                <dd className="text-gray-900">{totalPrice > 150 ? 'Free' : '₹15.00'}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="flex text-sm">
                  <span>Tax estimate</span>
                </dt>
                <dd className="text-gray-900">₹{(totalPrice * 0.08).toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">
                  ₹{(totalPrice + (totalPrice > 150 ? 0 : 15) + totalPrice * 0.08).toFixed(2)}
                </dd>
              </div>
            </dl>

            {/* Checkout button with auth guard */}
            <div className="mt-6">
              {!isLoggedIn && (
                <div className="mb-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  <LogIn className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Login required</p>
                    <p className="mt-0.5">Please login to proceed to checkout and place your order.</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    navigate('/auth', { state: { message: 'Please login to checkout and place your order.', from: { pathname: '/checkout' } } });
                  } else {
                    navigate('/checkout');
                  }
                }}
                className={`w-full rounded-md border border-transparent px-4 py-3 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 transition-colors ${
                  isLoggedIn
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {isLoggedIn ? 'Checkout' : 'Login to Checkout'}
              </button>
            </div>
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                or{' '}
                <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Continue Shopping
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
