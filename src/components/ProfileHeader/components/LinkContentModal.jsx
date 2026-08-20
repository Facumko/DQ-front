import React, { useState } from "react";
import { X, FileText, Calendar, Search, Check } from "lucide-react";
import styles from "./LinkContentModal.module.css";

const LinkContentModal = ({ isOpen, onClose, posts = [], events = [], currentLinked, onSelect }) => {
  const [tab, setTab] = useState("posts");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredPosts = posts.filter(p =>
    (p.text || p.description || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredEvents = events.filter(e =>
    (e.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (type, item) => {
    onSelect(type, item);
    onClose();
  };

  const isSelected = (type, id) =>
    currentLinked?.type === type && currentLinked?.id === id;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Vincular contenido</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.search}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "posts" ? styles.tabActive : ""}`}
            onClick={() => setTab("posts")}
          >
            <FileText size={14} /> Publicaciones ({posts.length})
          </button>
          <button
            className={`${styles.tab} ${tab === "events" ? styles.tabActive : ""}`}
            onClick={() => setTab("events")}
          >
            <Calendar size={14} /> Eventos ({events.length})
          </button>
        </div>

        <div className={styles.list}>
          {tab === "posts" && (
            filteredPosts.length === 0 ? (
              <div className={styles.empty}>No hay publicaciones</div>
            ) : filteredPosts.map(post => (
              <button
                key={post.id}
                className={`${styles.item} ${isSelected("post", post.id) ? styles.itemSelected : ""}`}
                onClick={() => handleSelect("post", post)}
              >
                {post.images?.[0] && (
                  <img src={post.images[0]} alt="" className={styles.itemThumb} />
                )}
                <div className={styles.itemInfo}>
                  <span className={styles.itemType}>Publicación</span>
                  <p className={styles.itemText}>{(post.text || "").slice(0, 60)}...</p>
                </div>
                {isSelected("post", post.id) && <Check size={16} className={styles.checkIcon} />}
              </button>
            ))
          )}

          {tab === "events" && (
            filteredEvents.length === 0 ? (
              <div className={styles.empty}>No hay eventos</div>
            ) : filteredEvents.map(ev => (
              <button
                key={ev.idEvent}
                className={`${styles.item} ${isSelected("event", ev.idEvent) ? styles.itemSelected : ""}`}
                onClick={() => handleSelect("event", ev)}
              >
                <div className={styles.eventIconWrap}>
                  <Calendar size={18} />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemType}>Evento</span>
                  <p className={styles.itemText}>{ev.title}</p>
                  {ev.startDate && (
                    <span className={styles.itemDate}>{ev.startDate.split("T")[0]}</span>
                  )}
                </div>
                {isSelected("event", ev.idEvent) && <Check size={16} className={styles.checkIcon} />}
              </button>
            ))
          )}
        </div>

        {currentLinked && (
          <div className={styles.footer}>
            <button className={styles.clearBtn} onClick={() => { onSelect(null, null); onClose(); }}>
              Quitar vinculación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkContentModal;