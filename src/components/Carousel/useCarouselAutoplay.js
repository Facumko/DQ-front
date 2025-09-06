import { useEffect, useRef } from "react";

export const useCarouselAutoplay = (isPaused, slidesLength, setCurrent, interval = 5000) => {
  const autoplayRef = useRef();

  useEffect(() => {
    if (isPaused) return;
    autoplayRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % slidesLength);
    }, interval);

    return () => clearInterval(autoplayRef.current);
  }, [isPaused, slidesLength, setCurrent, interval]);
};
