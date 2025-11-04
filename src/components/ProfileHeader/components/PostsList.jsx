import React from "react";
import { Loader, Calendar, Clock, MapPin, User } from "lucide-react";
import PostGallery from "../PostGallery";
import styles from "../ProfileHeader.module.css";

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

const PostsList = ({ activeTab, posts, events, isOwner, loadingStates, onEditPost, onDeletePost }) => {
  const renderPosts = () => (
    <div className={styles.postsCenteredWrapper}>
      {loadingStates.posts ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Loader size={32} className={styles.spinnerIcon} />
          <p style={{ marginTop: "1rem", color: "#666" }}>Cargando publicaciones...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className={styles.noPostsModern}>
          {isOwner ? "Aún no hay publicaciones. ¡Crea la primera!" : "Este negocio no tiene publicaciones todavía"}
        </div>
      ) : (
        <div className={styles.postsStackModern}>
          {posts.map((post) => (
            <div key={post.id} className={styles.postCardModern}>
              {post.images && post.images.length > 0 && (
                <PostGallery images={post.images} showThumbnails={true} />
              )}
              <div className={styles.postContentModern}>
                <p className={styles.postTextModern}>{post.text}</p>
                <span className={styles.postDateModern}>{timeAgo(post.createdAt)}</span>
                {isOwner && (
                  <div className={styles.postActionsModern}>
                    <button 
                      onClick={() => onEditPost(post)} 
                      className={styles.editPostButtonModern}
                      disabled={loadingStates.deletingPost}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => onDeletePost(post.id)} 
                      className={styles.deletePostButtonModern}
                      disabled={loadingStates.deletingPost}
                    >
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
  );

  const renderEvents = () => (
    <div className={styles.eventsCenteredWrapper}>
      {events.length === 0 ? (
        <div className={styles.noPostsModern}>
          {isOwner ? "Aún no hay eventos. ¡Crea el primero!" : "Este negocio no tiene eventos todavía"}
        </div>
      ) : (
        <div className={styles.eventsStackModern}>
          {events.map((event) => (
            <div key={event.id} className={styles.eventCardModern}>
              {event.images && event.images.length > 0 && (
                <PostGallery images={event.images} showThumbnails={true} />
              )}
              <div className={styles.eventContentModern}>
                <h3 className={styles.eventTitleModern}>{event.text}</h3>
                <div className={styles.eventMetaModern}>
                  {event.date && <span><Calendar size={14} /> {event.date}</span>}
                  {event.time && <span><Clock size={14} /> {event.time}</span>}
                  {event.location && <span><MapPin size={14} /> {event.location}</span>}
                  {event.taggedBusiness && <span><User size={14} /> Con: {event.taggedBusiness}</span>}
                </div>
                <span className={styles.eventDateModern}>{timeAgo(event.createdAt)}</span>
                {isOwner && (
                  <div className={styles.eventActionsModern}>
                    <button 
                      onClick={() => onEditPost(event)} 
                      className={styles.editPostButtonModern}
                      disabled={loadingStates.deletingPost}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => onDeletePost(event.id)} 
                      className={styles.deletePostButtonModern}
                      disabled={loadingStates.deletingPost}
                    >
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
  );

  return (
    <div className={styles.tabContentModern}>
      {activeTab === "posts" ? renderPosts() : renderEvents()}
    </div>
  );
};

export default PostsList;