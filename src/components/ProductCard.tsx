import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../data/products';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const wishlisted = isWishlisted(product.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm hover:shadow-xl"
    >
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden rounded-xl bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-64 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        {/* SALE badge */}
        {product.isSale && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md tracking-wide uppercase">
            🔥 Sale
          </div>
        )}

        {/* ── Wishlist Heart Button ── */}
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product, () => navigate('/auth', { state: { message: 'Please login to add items to your wishlist.' } }));
          }}
          whileTap={{ scale: 1.4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className={`absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-colors duration-200 ${
            wishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={wishlisted ? 'filled' : 'empty'}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Heart
                className="h-4 w-4"
                fill={wishlisted ? 'currentColor' : 'none'}
                strokeWidth={2.5}
              />
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </Link>

      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            <Link to={`/product/${product.id}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-gray-400 font-medium uppercase tracking-wide">{product.department}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold text-gray-900">₹{product.price}</p>
          <div className="flex space-x-1">
            {product.colors.slice(0, 3).map((color, idx) => (
              <div
                key={idx}
                className="h-4 w-4 rounded-full border border-gray-200"
                style={{ backgroundColor: color }}
              />
            ))}
            {product.colors.length > 3 && (
              <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
