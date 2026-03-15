import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on every route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
