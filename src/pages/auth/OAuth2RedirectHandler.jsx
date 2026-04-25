import { useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import { saveTokens } from "../../Api/Api";

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const { setUser, loadFavorites, loadBusinesses } = useContext(UserContext);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    console.log("🔐 OAuth2RedirectHandler montado");
    console.log("📍 URL completa:", window.location.href);
    console.log("🔑 Hash:", window.location.hash);

    const hash = window.location.hash;
    
    if (!hash || hash === "#") {
      console.error("❌ No hay hash en la URL");
      navigate("/", { replace: true });
      return;
    }

    const params = new URLSearchParams(hash.substring(1));

    const accessToken  = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const idUser       = params.get("idUser");
    const name         = params.get("name");
    const lastname     = params.get("lastname");
    const email        = params.get("email");

    console.log("✅ accessToken:", accessToken ? "existe" : "NULL");
    console.log("✅ refreshToken:", refreshToken ? "existe" : "NULL");
    console.log("✅ idUser:", idUser);
    console.log("✅ email:", email);

    if (!accessToken || !refreshToken) {
      console.error("❌ Faltan tokens en el hash");
      navigate("/", { replace: true });
      return;
    }

    try {
      saveTokens(accessToken, refreshToken);

      const userData = {
        id_user:   idUser,
        email,
        name,
        lastname,
        lastLogin: new Date().toISOString(),
      };

      console.log("👤 userData:", userData);

      setUser?.(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      if (idUser) {
        Promise.all([
          loadFavorites?.(),
          loadBusinesses?.(),
        ]).catch((err) => console.warn("Error cargando favoritos/negocios:", err));
      }

      window.history.replaceState({}, document.title, window.location.pathname);

      const returnTo = sessionStorage.getItem("oauth2_return_to") || "/";
      sessionStorage.removeItem("oauth2_return_to");
      
      console.log("➡️ Redirigiendo a:", returnTo);
      navigate(returnTo, { replace: true });

    } catch (err) {
      console.error("❌ Error en OAuth2RedirectHandler:", err);
      navigate("/", { replace: true });
    }
  }, [navigate, setUser, loadFavorites, loadBusinesses]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "16px",
      color: "#666",
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #B00020",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ margin: 0, fontSize: "15px" }}>Iniciando sesión...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}