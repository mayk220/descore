import { useRef, useState } from "react";

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
      <div className="search-bar">
        <div className="left-icons">
          <i className="menu-icon fa-solid fa-bars"></i>
          <span className="logo">ds</span>
        </div>
        <input ref={searchInputRef} type="text" placeholder="Search" className="search-input" />
        <div className="right-icons">
          <i className="search-icon fa-solid fa-magnifying-glass" onClick={focusSearch}></i>
          {isRegistered ? (
            <div
              className={`profile-menu ${isProfileMenuOpen ? "is-open" : ""}`}
              onMouseEnter={() => setIsProfileMenuOpen(true)}
              onMouseLeave={() => setIsProfileMenuOpen(false)}
            >
              <button type="button" className="profile-trigger" aria-label="Меню профілю">
                <i className="profile-icon fa-solid fa-circle-user"></i>
              </button>
              <div className="profile-menu-items">
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
            <button type="button" className="register-btn" onClick={onAccountClick}>
              Реєстрація
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
