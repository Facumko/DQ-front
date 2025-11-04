import React from "react";
import styles from "../ProfileHeader.module.css";

const PostsTabs = ({ activeTab, onTabChange, postsCount, eventsCount }) => {
  return (
    <div className={styles.tabBarModern}>
      <button
        className={`${styles.tabButtonModern} ${activeTab === "posts" ? styles.activeTabModern : ""}`}
        onClick={() => onTabChange("posts")}
      >
        Publicaciones ({postsCount})
      </button>
      <button
        className={`${styles.tabButtonModern} ${activeTab === "events" ? styles.activeTabModern : ""}`}
        onClick={() => onTabChange("events")}
      >
        Eventos ({eventsCount})
      </button>
    </div>
  );
};

export default PostsTabs;