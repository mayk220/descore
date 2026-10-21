import { useRef, useState } from "react";
import styles from "./Header.module.css";

function Header({ isRegistered, onAccountClick }) {
  const searchInputRef = useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  function focusSearch() {
    searchInputRef.current?.focus();
  }

  function openRatings() {
    return undefined;
  }

  function logout() {
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
  }

  return (
    <header>
      <div className={styles["search-bar"]}>
        <div className={styles["left-icons"]}>
          <i className={`${styles["menu-icon"]} fa-solid fa-bars`}></i>
          <span className={styles["logo"]}>ds</span>
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search"
          className={styles["search-input"]}
        />
        <div className={styles["right-icons"]}>
          <i
            className={`${styles["search-icon"]} fa-solid fa-magnifying-glass`}
            onClick={focusSearch}
          ></i>
          {isRegistered ? (
            <div
              className={`${styles["profile-menu"]} ${isProfileMenuOpen ? styles["is-open"] : ""}`}
              onMouseEnter={() => setIsProfileMenuOpen(true)}
              onMouseLeave={() => setIsProfileMenuOpen(false)}
            >
              <button type="button" className={styles["profile-trigger"]} aria-label="Меню профілю">
                <i className={`${styles["profile-icon"]} fa-solid fa-circle-user`}></i>
              </button>
              <div className={styles["profile-menu-items"]}>
                <button type="button">Зайти на профіль</button>
                <button type="button" onClick={openRatings}>
                  Зайти на оцінки ігор
                </button>
                <button type="button" onClick={logout}>
                  Вихід
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles["register-btn"]} onClick={onAccountClick}>
              Реєстрація
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
