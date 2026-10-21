import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";

function Header({ isRegistered, onAccountClick }) {
  const searchInputRef = useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  function focusSearch() {
    searchInputRef.current?.focus();
  }

  function openProfile() {
    navigate("/profile");
  }

  function openRatings() {
    navigate("/profile?view=ratings");
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
          <Link to="/main" className={styles["logo"]} aria-label="Головна сторінка">
            ds
          </Link>
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
                <button type="button" onClick={openProfile}>
                  Зайти на профіль
                </button>
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
