import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Home from "../pages/Home";
import Negocios from "../pages/Negocios";
import Eventos from "../pages/Eventos";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import Favorites from "../components/Favorites/Favorites";
import FormCommerce from "../components/FormCommerce/FormCommerce";
import ProfileHeader from "../components/ProfileHeader/ProfileHeader";
import SearchPage from "../pages/SearchPage";
import Planes from "../components/Plans/Plans";
import PoliticaPrivacidad from "../pages/legal/PoliticaPrivacidad";
import TerminosUso from "../pages/legal/TerminosUso";
import Arrepentimiento from "../pages/legal/Arrepentimiento";
import Contacto from "../pages/Contacto";
import PreguntasFrecuentes from "../pages/PreguntasFrecuentes";
import ComoFunciona from "../pages/ComoFunciona";
import MapaPage from "../pages/MapaPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import CheckoutPage from "../pages/checkout/CheckoutPage";
import PagoExitoso from "../pages/checkout/PagoExitoso";
import PagoFallido from "../pages/checkout/PagoFallido";
import PagoPendiente from "../pages/checkout/PagoPendiente";
// ── OAuth2 ────────────────────────────────────────────────────────────────────
import OAuth2RedirectHandler from "../pages/auth/OAuth2RedirectHandler";

const AppRoutes = () => {
  return (
    <Router>
      {/* Sube al tope en cada cambio de ruta */}
      <ScrollToTop />

      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />

        {/* El main crece para empujar el footer al fondo */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Negocios */}
            <Route path="/negocios/:id" element={<Negocios />} />
            <Route path="/mi-negocio" element={<Negocios />} />
            {/* Redirect rutas viejas */}
            <Route path="/Mycommerce" element={<Navigate to="/mi-negocio" replace />} />
            <Route path="/registro-negocio" element={<FormCommerce />} />
            <Route path="/register-commerce" element={<Navigate to="/registro-negocio" replace />} />

            {/* Usuario */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile-header" element={<ProfileHeader isOwner={true} />} />

            {/* Secciones */}
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* ── OAuth2 callback — debe coincidir con app.oauth2.redirect-uri ── */}
            <Route path="/oauth2/success" element={<OAuth2RedirectHandler />} />

            {/* Checkout y retornos de Mercado Pago */}
            <Route path="/checkout/:planId" element={<CheckoutPage />} />
            <Route path="/pago/exitoso"     element={<PagoExitoso />} />
            <Route path="/pago/fallido"     element={<PagoFallido />} />
            <Route path="/pago/pendiente"   element={<PagoPendiente />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/planes" element={<Planes />} />

            {/* Mapa */}
            <Route path="/mapa" element={<MapaPage />} />

            {/* Servicio al cliente */}
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentes />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />

            {/* Legal — todas bajo /legal/ para consistencia */}
            <Route path="/legal/politica-de-privacidad" element={<PoliticaPrivacidad />} />
            <Route path="/legal/terminos-de-uso" element={<TerminosUso />} />
            <Route path="/legal/arrepentimiento" element={<Arrepentimiento />} />

            {/* Redirecciones de rutas viejas por si quedaron links */}
            <Route path="/politica-de-privacidad" element={<Navigate to="/legal/politica-de-privacidad" replace />} />
            <Route path="/terminos-de-uso" element={<Navigate to="/legal/terminos-de-uso" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default AppRoutes;