import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import ProfileHeader from "../components/ProfileHeader/ProfileHeader";
import FloatingChat from "../components/FloatingChat/FloatingChat";
import { getMyBusiness, getBusinessById } from "../Api/Api";
import { useParams, useNavigate } from "react-router-dom";

const Negocios = () => {
  const { user } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const isPublic = !!id;

  const [businessData, setBusinessData] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  const isOwner = !!user && !!businessData && Number(businessData.id_user) === Number(user.id_user);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        let business;

        if (isPublic) {
          business = await getBusinessById(id);
        } else {
          if (!user?.id_user) {
            navigate("/login");
            return;
          }
          business = await getMyBusiness();
          if (!business) {
            navigate("/registro-negocio");
            return;
          }
        }

        if (business) {
          setBusinessData({
            ...business,
            id:          business.id_business || business.idCommerce || business.id,
            id_business: business.id_business || business.idCommerce,
            idowner:     business.id_user     || business.idOwner    || user?.id_user,
          });
        } else {
          setError(isPublic ? "Negocio no encontrado" : "No tenés un negocio creado");
        }
      } catch (err) {
        setError(err.message || "Error al cargar el negocio");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id_user, id]);

  if (loading) {
    return (
      <div style={{ background: "#f4f5f8", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🔄</div>
          <p>Cargando {isPublic ? "perfil del negocio" : "tu negocio"}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "#f4f5f8", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😕</div>
          <h3 style={{ marginBottom: "1rem", color: "#333" }}>{error}</h3>
          {!user && (
            <>
              <p style={{ color: "#666", marginBottom: "1.5rem" }}>Iniciá sesión para acceder a tu negocio</p>
              <button onClick={() => navigate("/login")} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", cursor: "pointer", marginRight: "10px", background: "#B00020", color: "#fff" }}>
                Iniciar sesión
              </button>
            </>
          )}
          <button onClick={() => navigate("/")} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer", background: "#fff" }}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f4f5f8", minHeight: "100vh", padding: "24px" }}>
      <ProfileHeader isOwner={isOwner} businessData={businessData} />
      <FloatingChat />
    </div>
  );
};

export default Negocios;