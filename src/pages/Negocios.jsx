import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import ProfileHeader from "../components/ProfileHeader/ProfileHeader";
import Publications from "../components/Publications/Publications";
import Gallery from "../components/Gallery/Gallery";
import FloatingChat from "../components/FloatingChat/FloatingChat";
import { getBusinessByUserId, getBusinessById } from "../Api/Api";
import { useParams } from "react-router-dom";

const Negocios = () => {
  const { user } = useContext(UserContext);
  const { id } = useParams();
  const isPublic = !!id;
  const isOwner = !isPublic && !!user;

  const [businessData, setBusinessData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("🟢 Iniciando carga de negocio...", { isPublic, id, user: user?.id_user });

        let business;
        
        if (isPublic) {
          console.log("🟢 Cargando perfil público, ID:", id);
          business = await getBusinessById(id);
        } else {
          if (!user?.id_user) {
            console.log("⚠️ Usuario no logueado, no se puede cargar 'Mi negocio'");
            setError("Debes iniciar sesión para ver tu negocio");
            setLoading(false);
            return;
          }
          console.log("🟢 Cargando 'Mi negocio' para usuario:", user.id_user);
          business = await getBusinessByUserId(user.id_user);
        }
        
        if (business) {
          console.log("✅ Negocio cargado:", business.name);
          setBusinessData(business);
          setPosts(business.posts || []);
          setGallery(business.gallery || []);
        } else {
          console.log("❌ No se encontró el negocio");
          setError(isPublic ? "Negocio no encontrado" : "No tienes un negocio creado");
        }
      } catch (err) {
        console.error("❌ Error al cargar datos del negocio:", err);
        setError(err.message || "Error al cargar el negocio");
      } finally {
        setLoading(false);
      }
    };

    loadBusinessData();
  }, [user, id, isPublic]);

  if (loading) {
    return (
      <div style={{ 
        background: "#f4f5f8", 
        minHeight: "100vh", 
        padding: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🔄</div>
          <p>Cargando {isPublic ? "perfil del negocio" : "tu negocio"}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        background: "#f4f5f8", 
        minHeight: "100vh", 
        padding: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ 
          textAlign: "center", 
          background: "white", 
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😕</div>
          <h3 style={{ marginBottom: "1rem", color: "#333" }}>{error}</h3>
          {!user && (
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Inicia sesión para acceder a tu negocio
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f4f5f8", minHeight: "100vh", padding: "24px" }}>
      <ProfileHeader 
        isOwner={isOwner} 
        businessData={isPublic ? businessData : null}  // ← CLAVE: pasar datos solo para perfiles públicos
      />
      <Publications publicaciones={posts} isOwner={isOwner} />
      <Gallery images={gallery} isOwner={isOwner} />
      <FloatingChat />
    </div>
  );
};

export default Negocios;