import { useEffect, useState } from 'react';

/**
 * Hook to detect if the device supports touch input
 * @returns boolean indicating if touch is supported
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for touch support
    const hasTouchSupport =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - for older browsers
      navigator.msMaxTouchPoints > 0;

    setIsTouch(hasTouchSupport);
  }, []);

  return isTouch;
}

/**
 * Hook to detect if device is likely a mobile device based on screen size and touch support
 * This is more accurate than just checking screen width as some laptops have touch screens
 */
export function useIsMobileDevice(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const hasTouchSupport =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;

      const isSmallScreen = window.innerWidth < 768;

      // Device is mobile if it has touch AND small screen
      setIsMobile(hasTouchSupport && isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
