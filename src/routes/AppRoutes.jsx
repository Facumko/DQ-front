import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Home from "../pages/Home";
import Negocios from "../pages/Negocios";
import Eventos from "../pages/Eventos";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import Favorites from "../components/Favorites/Favorites";
import FormCommerce from "../components/FormCommerce/FormCommerce";
import ProfileHeader from "../components/ProfileHeader/ProfileHeader";

const AppRoutes = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* RUTA PÚBLICA de negocios (con ID) */}
        <Route path="/negocios/:id" element={<Negocios />} />
        {/* RUTA PRIVADA "Mi negocio" (sin ID, usa el usuario logueado) */}
        <Route path="/Mycommerce" element={<Negocios />} />
        {/* Formulario de creación de comercio */}
        <Route path="/register-commerce" element={<FormCommerce />} />
        {/* Perfil de usuario (ajusta según tu componente Profile) */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/favorites" element={<Favorites />} />
        {/* Ruta para el header del perfil (si es necesario) */}
        <Route path="/profile-header" element={<ProfileHeader isOwner={true} />} />
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;