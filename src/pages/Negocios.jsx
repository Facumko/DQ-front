import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import ProfileHeader from "../components/ProfileHeader/ProfileHeader";
import Publications from "../components/Publications/Publications";
import Gallery from "../components/Gallery/Gallery";
import FloatingChat from "../components/FloatingChat/FloatingChat";
import { getBusinessByUserId } from "../Api/Api";


const Negocios = () => {
  const { user } = useContext(UserContext);
  const isOwner = !!user;


  const [posts, setPosts] = useState([]);
  const [gallery, setGallery] = useState([]);


  useEffect(() => {
    if (!user?.id_user) return;


    const loadBusinessData = async () => {
      try {
        const business = await getBusinessByUserId(user.id_user);
        if (business) {
          setPosts(business.posts || []);
          setGallery(business.gallery || []);
        }
      } catch (err) {
        console.error("Error al cargar datos del negocio:", err);
      }
    };


    loadBusinessData();
  }, [user]);


  return (
    <div style={{ background: "#f4f5f8", minHeight: "100vh", padding: "24px" }}>
      <ProfileHeader isOwner={isOwner} />
      <Publications publicaciones={posts} isOwner={isOwner} />
      <Gallery images={gallery} isOwner={isOwner} />
      <FloatingChat />
    </div>
  );
};


export default Negocios;
		

