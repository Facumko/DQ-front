import { useEffect } from "react";

export const useParallaxEffect = (carouselRef) => {
  useEffect(() => {
    if (!carouselRef.current) return;
    const overlay = carouselRef.current.querySelector(".overlay");
    const info = carouselRef.current.querySelector(".info");

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      requestAnimationFrame(() => {
        if (overlay) overlay.style.transform = `translateY(${scrollTop * 0.03}px)`;
        if (info) info.style.transform = `translateY(${scrollTop * 0.07}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [carouselRef]);
};
