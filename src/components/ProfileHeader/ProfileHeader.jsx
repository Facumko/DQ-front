import React, { useState, useEffect, useMemo } from "react";
import styles from "./ProfileHeader.module.css";
import {
  MapPin, Clock, Phone, Mail, Star, ArrowRight, Edit2,
  ChevronDown, ChevronUp, User, Camera, Image, Plus, Calendar
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";


const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => phone.replace(/\D/g, "").length === 10;


const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
};


const ProfileHeader = ({ isOwner = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("post");
  const [posts, setPosts] = useState([]);


  const [businessData, setBusinessData] = useState({
    name: "Café Central",
    email: "info@cafecentral.com",
    phone: "(123) 456-7890",
    social: "@cafecentral",
    address: "Calle 12 entre 13 y 15",
    addressDetail: "Frente a la Plaza Central",
    description: "Cafetería tradicional en el centro de la ciudad.",
    profileImage: null,
    coverImage: null,
  });


  const [schedule, setSchedule] = useState({
    Lun: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Mar: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Mie: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Jue: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Vie: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Sab: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "21:00" } },
    Dom: { cerrado: false, deCorrido: false, manana: { open: "08:00", close: "12:00" }, tarde: { open: "16:00", close: "22:00" } },
  });


  const [draft, setDraft] = useState(businessData);
  const [draftSchedule, setDraftSchedule] = useState(schedule);
  const [status, setStatus] = useState("");
  const [showFullSchedule, setShowFullSchedule] = useState(false);


  useEffect(() => {
    const info = getCurrentStatus(schedule);
    setStatus(info.label);
  }, [schedule]);


  const handleEdit = () => {
    setDraft(businessData);
    setDraftSchedule(schedule);
    setIsEditing(true);
  };


  const handleSave = async () => {
    if (!isValidPhone(draft.phone)) return alert("El número debe tener 10 dígitos.");
    if (!isValidEmail(draft.email)) return alert("Correo inválido.");
    if (draft.name.length > 100) return alert("El nombre no puede superar los 100 caracteres.");
    setBusinessData(draft);
    setSchedule(draftSchedule);
    setIsEditing(false);
  };


  const handleCancel = () => setIsEditing(false);


  const sortedPosts = useMemo(() => [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [posts]);


  const handleDeletePost = (id) => {
  if (window.confirm("¿Estás seguro de eliminar esta publicación?")) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }
};


const [editingPost, setEditingPost] = useState(null);


const handleEditPost = (post) => {
  setEditingPost(post);
  setModalType(post.type);
  setShowModal(true);
};


  /* ----------  Helpers de estado  ---------- */
  const getCurrentStatus = (sch) => {
    const now = new Date();
    const day = now.toLocaleDateString("es-ES", { weekday: "short" });
    const dayMap = { lun: "Lun", mar: "Mar", mié: "Mie", jue: "Jue", vie: "Vie", sáb: "Sab", dom: "Dom" };
    const today = dayMap[day.toLowerCase()];
    if (!today) return { isOpen: false, label: "Cerrado", color: "statusClosed" };
    const hoy = sch[today];
    if (hoy.cerrado) return { isOpen: false, label: "Cerrado", color: "statusClosed" };
    const ahora = now.toTimeString().slice(0, 5);
    let isOpen = false, label = "";
    if (hoy.deCorrido) {
      isOpen = ahora >= hoy.open && ahora <= hoy.close;
      label = isOpen ? `Abierto` : `Abre a las ${hoy.open}`;
    } else {
      const openM = ahora >= hoy.manana.open && ahora <= hoy.manana.close;
      const openT = ahora >= hoy.tarde.open && ahora <= hoy.tarde.close;
      isOpen = openM || openT;
      if (openM) label = `Abierto`;
      else if (openT) label = `Abierto`;
      else if (ahora < hoy.manana.open) label = `Abre a las ${hoy.manana.open}`;
      else if (ahora < hoy.tarde.open) label = `Abre a las ${hoy.tarde.open}`;
      else label = `Abre a las ${hoy.manana.open}`;
    }
    return { isOpen, label, color: isOpen ? "statusOpen" : "statusNeutral" };
  };


  return (
    <>
      <div className={styles.headerContainer}>
        {isOwner && (
          <div className={styles.editButtonContainer}>
            {!isEditing ? (
              <button className={styles.editButtonModern} onClick={handleEdit}>
                <Edit2 size={16} /> Editar
              </button>
            ) : (
              <div className={styles.editActionsModern}>
                <button className={styles.saveButtonModern} onClick={handleSave}>Guardar</button>
                <button className={styles.cancelButtonModern} onClick={handleCancel}>Cancelar</button>
              </div>
            )}
          </div>
        )}


        <div className={styles.layoutModern}>
          {/* ----------  IZQUIERDA  ---------- */}
          <div className={styles.leftColumnModern}>
            <div className={styles.profileHeaderModern}>
              {/* FOTO DE PERFIL */}
              {isEditing ? (
                <label className={styles.profilePicEditModern}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDraft({ ...draft, profileImage: URL.createObjectURL(e.target.files[0]) })}
                    className={styles.fileInputModern}
                  />
                  {draft.profileImage ? (
                    <img src={draft.profileImage} alt="Perfil" className={styles.profilePicModern} />
                  ) : (
                    <Camera size={28} color="#999" />
                  )}
                </label>
              ) : (
                <div className={styles.profilePicDisplayModern}>
                  {businessData.profileImage ? (
                    <img src={businessData.profileImage} alt="Perfil" className={styles.profilePicModern} />
                  ) : (
                    <User size={40} color="#999" />
                  )}
                </div>
              )}


              <div className={styles.nameStatusModern}>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value.slice(0, 100) })}
                    className={styles.editInputModern}
                  />
                ) : (
                  <h1 className={styles.businessNameModern}>{businessData.name}</h1>
                )}
                <span className={styles[getCurrentStatus(schedule).color]}>{status}</span>
              </div>
            </div>


            {/* DESCRIPCIÓN */}
            <div className={styles.descriptionSectionModern}>
              {isEditing ? (
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value.slice(0, 500) })}
                  className={styles.textareaModern}
                  placeholder="Descripción del negocio"
                  maxLength={500}
                />
              ) : (
                <p className={styles.descriptionTextModern}>{businessData.description}</p>
              )}
            </div>


            {/* HORARIOS (solo lectura) */}
            {!isEditing && (
              <div className={styles.horarioClienteModern}>
                <button
                  className={styles.toggleScheduleModern}
                  onClick={() => setShowFullSchedule(!showFullSchedule)}
                >
                  <Clock size={16} />
                  Ver horarios
                </button>
                {showFullSchedule && (
                  <div className={styles.tablaHorariosModern}>
                    {Object.entries(schedule).map(([day, hoy]) => (
                      <div key={day} className={styles.filaClienteModern}>
                        <span className={styles.diaClienteModern}>{day}</span>
                        <span className={styles.horarioClienteTextModern}>
                          {hoy.cerrado ? "Cerrado" : hoy.deCorrido ? `${hoy.open} – ${hoy.close}` : `Mañana: ${hoy.manana.open} – ${hoy.manana.close} | Tarde: ${hoy.tarde.open} – ${hoy.tarde.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* CONTACTO */}
            <div className={styles.contactInfoModern}>
              <div className={styles.rowModern}>
                <MapPin color="#333" size={18} />
                {isEditing ? (
                  <div className={styles.editColumnModern}>
                    <input
                      type="text"
                      value={draft.address}
                      onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                      className={styles.editInputModern}
                      placeholder="Dirección"
                    />
                    <input
                      type="text"
                      value={draft.addressDetail}
                      onChange={(e) => setDraft({ ...draft, addressDetail: e.target.value })}
                      className={styles.editInputSmallModern}
                      placeholder="Detalle de ubicación"
                    />
                  </div>
                ) : (
                  <div className={styles.addressModern}>
                    {businessData.address}
                    <span className={styles.addressDetailModern}>{businessData.addressDetail}</span>
                  </div>
                )}
              </div>


              <div className={styles.rowModern}>
                <Phone color="#333" size={18} />
                {isEditing ? (
                  <>
                    {!isValidPhone(draft.phone) && draft.phone !== "" && <span className={styles.errorMsgModern}>Número incompleto (faltan dígitos)</span>}
                    <input
                      type="tel"
                      value={draft.phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                        const formatted = raw.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
                        setDraft({ ...draft, phone: formatted });
                      }}
                      className={`${styles.editInputModern} ${!isValidPhone(draft.phone) && draft.phone !== "" ? styles.invalidModern : ""}`}
                      placeholder="(123) 456-7890"
                    />
                  </>
                ) : (
                  <span>{businessData.phone}</span>
                )}
              </div>


              <div className={styles.rowModern}>
                <Mail color="#333" size={18} />
                {isEditing ? (
                  <>
                    {!isValidEmail(draft.email) && draft.email !== "" && <span className={styles.errorMsgModern}>Correo inválido</span>}
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value.slice(0, 100) })}
                      className={`${styles.editInputModern} ${!isValidEmail(draft.email) && draft.email !== "" ? styles.invalidModern : ""}`}
                      placeholder="ejemplo@dominio.com"
                      maxLength={100}
                    />
                  </>
                ) : (
                  <span>{businessData.email}</span>
                )}
              </div>
            </div>


            {/* EDICIÓN DE HORARIOS */}
            {isEditing && (
              <div className={styles.horarioSectionModern}>
                <div className={styles.horarioHeaderModern}>
                  <Clock size={16} />
                  <span>Ver horarios</span>
                  <span className={styles.editHintModern}>Marcá “Cerrado” si no abrís ese día</span>
                </div>
                <div className={styles.horarioEditModern}>
                  {Object.entries(draftSchedule).map(([day, hoy]) => (
                    <div key={day} className={styles.diaFilaModern}>
                      <span className={styles.diaNombreModern}>{day}</span>
                      <div className={styles.diaContenidoModern}>
                        <label className={styles.chkCerradoModern}>
                          <input type="checkbox" checked={hoy.cerrado} onChange={(e) =>
                            setDraftSchedule((s) => ({ ...s, [day]: { ...s[day], cerrado: e.target.checked } }))} />
                          Cerrado
                        </label>
                        {!hoy.cerrado && (
                          <div className={styles.turnosDiaModern}>
                            {hoy.deCorrido ? (
                              <div className={styles.corridoFilaModern}>
                                <span className={styles.turnoLabelModern}>De corrido</span>
                                <input type="time" value={hoy.open} onChange={(e) =>
                                  setDraftSchedule((s) => ({ ...s, [day]: { ...s[day], open: e.target.value } }))} />
                                <span className={styles.sepModern}>a</span>
                                <input type="time" value={hoy.close} onChange={(e) =>
                                  setDraftSchedule((s) => ({ ...s, [day]: { ...s[day], close: e.target.value } }))} />
                              </div>
                            ) : (
                              <>
                                <div className={styles.turnoFilaModern}>
                                  <span className={styles.turnoLabelModern}>Mañana</span>
                                  <input type="time" value={hoy.manana.open} onChange={(e) =>
                                    setDraftSchedule((s) => ({ ...s, [day]: { ...s[day], manana: { ...s[day].manana, open: e.target.value } } }))} />
                                  <span className={styles.sepModern}>a</span>
                                  <input type="time" value={hoy.manana.close} onChange={(e) =>
                                    setDraftSchedule((s) => ({ ...s, [day]: { ...s[day], manana: { ...s[day].manana, close: e.target.value } } }))} />
                                </div>
                                <div className={styles.turnoFilaModern}>
                                  <span className={styles.turnoLabelModern}>Tarde</span>
                                  <input type="time" value={hoy.tarde.open} onChange={(e) =>
                                    setDraftSchedule((s) => ({ ...s, [day]: { ...s[day], tarde: { ...s[day].tarde, open: e.target.value } } }))} />
                                  <span className={styles.sepModern}>a</span>
                                  <input type="time" value={hoy.tarde.close} onChange={(e) =>
                                    setDraftSchedule((s) => ({ ...s, [day]: { ...s[day], tarde: { ...s[day].tarde, close: e.target.value } } }))} />
                                </div>
                              </>
                            )}
                            <label className={styles.chkCorridoModern}>
                              <input type="checkbox" checked={hoy.deCorrido} onChange={(e) =>
                                setDraftSchedule((s) => ({ ...s, [day]: { ...s[day], deCorrido: e.target.checked } }))} />
                              De corrido
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* ----------  DERECHA: PORTADA  ---------- */}
          <div className={styles.rightColumnModern}>
            {isEditing && (
              <div className={styles.coverEditToolsModern}>
                <label className={styles.coverButtonModern}>
                  <Image size={20} />
                  {draft.coverImage ? "Cambiar portada" : "Subir portada"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setDraft({ ...draft, coverImage: URL.createObjectURL(file) });
                    }}
                    className={styles.fileInputModern}
                  />
                </label>
                {draft.coverImage && (
                  <button className={styles.removeCoverButtonModern} onClick={() => setDraft({ ...draft, coverImage: null })}>
                    Eliminar portada
                  </button>
                )}
              </div>
            )}


            <div className={styles.coverDisplayModern}>
              {businessData.coverImage ? (
                <img src={businessData.coverImage} alt="Portada" className={styles.coverImageModern} />
              ) : (
                <div className={styles.coverPlaceholderModern}>
                  <Image size={48} color="#ccc" />
                  <span>Sin portada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* ----------  ACCIONES EXTERNAS  ---------- */}
      <div className={styles.externalActionsModern}>
        {!isEditing && (
          <div className={styles.actionsModern}>
            <button className={styles.favButtonModern}><Star color="#e74c3c" /> Favorito</button>
            <button className={styles.socialButtonModern}>
              {businessData.social} <ArrowRight size={16} />
            </button>
          </div>
        )}


        {isOwner && (
          <div className={styles.createActionsModern}>
            <button className={styles.createButtonModern} onClick={() => { setModalType("post"); setShowModal(true); }}>
              <Plus size={16} /> <span>Publicación</span>
            </button>
            <button className={styles.createButtonModern} onClick={() => { setModalType("event"); setShowModal(true); }}>
              <Plus size={16} /> <span>Evento</span>
            </button>
          </div>
        )}
      </div>


      {/* ----------  PUBLICACIONES  ---------- */}
      <div className={styles.postsSectionModern}>
        <h3 className={styles.postsTitleModern}>Publicaciones y Eventos</h3>
        {sortedPosts.length === 0 ? (
          <p className={styles.noPostsModern}>Aún no hay publicaciones.</p>
        ) : (
         
          <div className={styles.postsGridModern}>
            {sortedPosts.map((post) => (
              <div key={post.id} className={styles.postCardModern}>
                {post.images && post.images.length > 0 && (
                  <img src={URL.createObjectURL(post.images[0])} alt="Publicación" className={styles.postImageModern} />
                )}
                <div className={styles.postContentModern}>
                  <p className={styles.postTextModern}>{post.text}</p>


                  {/* ✅ Mostrar datos si es evento */}
                  {post.type === "event" && (
                    <div className={styles.eventDetailsModern}>
                      {post.date && <span><Calendar size={14} /> {post.date}</span>}
                      {post.time && <span><Clock size={14} /> {post.time}</span>}
                      {post.location && <span><MapPin size={14} /> {post.location}</span>}
                      {post.taggedBusiness && <span><User size={14} /> Con: {post.taggedBusiness}</span>}
                    </div>
                  )}


                  <span className={styles.postDateModern}>{timeAgo(post.createdAt)}</span>


                  {/* ✅ Botones de edición/eliminación (solo dueño) */}
                  {isOwner && (
                    <div className={styles.postActionsModern}>
                      <button onClick={() => handleEditPost(post)} className={styles.editPostButtonModern}>
                        Editar
                      </button>
                      <button onClick={() => handleDeletePost(post.id)} className={styles.deletePostButtonModern}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      <CreatePostModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPost(null);
        }}
        onSubmit={(data) => {
          if (editingPost) {
            // Editar
            setPosts((prev) =>
              prev.map((p) => (p.id === editingPost.id ? { ...p, ...data } : p))
            );
          } else {
            // Nueva
            const newPost = { ...data, businessName: businessData.name, createdAt: new Date().toISOString(), id: Date.now() };
            setPosts((prev) => [newPost, ...prev]);
          }
          setEditingPost(null);
        }}
        type={modalType}
        initialData={editingPost}
      />
    </>
  );
};


export default ProfileHeader;

