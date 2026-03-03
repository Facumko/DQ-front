import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hace scroll al tope de la página cada vez que cambia la ruta.
 * Se monta una sola vez dentro del <Router> en AppRoutes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;