import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AccountModal from "../components/AccountModal";
import heroImage from "../assets/hero.png";
import { useApi } from "../hooks/useApi";
import styles from "../styles/ProfilePage.module.css";

const avatarUrl =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR15psFaVkvp5kMTV8iP7FVpJdoK81GUN4ES3GHd4xPSwPpp4XDIRFPMjWa&s=10";
const gameCoverImages = {
  "Resident Evil 3":
    "https://cdn.cloudflare.steamstatic.com/steam/apps/952060/library_600x900_2x.jpg",
  "Resident Evil 2":
    "https://cdn.cloudflare.steamstatic.com/steam/apps/883710/library_600x900_2x.jpg",
  "Shotgun King: The Final Checkmate":
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1972440/library_600x900_2x.jpg",
  "The Witcher 3: Wild Hunt - Blood and Wine":
    "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg",
  "Hollow Knight: Silksong":
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1030300/library_600x900_2x.jpg",
};
const backendGames = {
  3498: {
    title: "Hollow Knight: Silksong",
    image: gameCoverImages["Hollow Knight: Silksong"],
  },
};
const defaultHistoryGames = [
  {
    title: "Resident Evil 3",
    image: gameCoverImages["Resident Evil 3"],
    date: "23 вересня 2026",
    rating: 10,
    details: { Геймплей: 10, Сюжет: 9, Графіка: 10, Звук: 9 },
  },
  {
    title: "Resident Evil 2",
    image: gameCoverImages["Resident Evil 2"],
    date: "12 вересня 2026",
    rating: 10,
    details: { Геймплей: 10, Сюжет: 10, Графіка: 9, Звук: 9 },
  },
  {
    title: "Shotgun King: The Final Checkmate",
    image: gameCoverImages["Shotgun King: The Final Checkmate"],
    date: "4 вересня 2026",
    rating: 8,
    details: { Геймплей: 9, Сюжет: 7, Графіка: 8, Звук: 8 },
  },
  {
    title: "The Witcher 3: Wild Hunt - Blood and Wine",
    image: gameCoverImages["The Witcher 3: Wild Hunt - Blood and Wine"],
    date: "1 вересня 2026",
    rating: 10,
    details: { Геймплей: 10, Сюжет: 10, Графіка: 10, Звук: 9 },
  },
];
const ratingsStorageKey = "descoreRatings";
const favoritesStorageKey = "descoreFavorites";
const deletedGamesStorageKey = "descoreDeletedGames";
const commentsStorageKey = "descoreComments";
const franchises = [
  {
    name: "Hollow Knight",
    image: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_600x900_2x.jpg",
  },
  {
    name: "Resident Evil",
    image: "https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900_2x.jpg",
  },
  {
    name: "The Witcher",
    image: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg",
  },
];
const aspectLabels = {
  Геймплей: ["Gameplay", "gameplay"],
  Сюжет: ["Story", "story"],
  "Графіка/Дизайн": ["Design/Graphics", "design"],
  Графіка: ["Design/Graphics", "design"],
  Музика: ["Music", "music"],
  Звук: ["Sound", "music"],
};

function sanitizeCommentHtml(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("*").forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    if (!["b", "strong", "i", "em", "u", "br"].includes(tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
  });
  return container.innerHTML;
}

function getSavedComments() {
  try {
    const savedComments = JSON.parse(localStorage.getItem(commentsStorageKey) || "[]");
    return Array.isArray(savedComments) ? savedComments : [];
  } catch {
    return [];
  }
}

function getHistoryGames() {
  let savedRatings;
  let deletedGames;
  try {
    const parsedRatings = JSON.parse(localStorage.getItem(ratingsStorageKey) || "[]");
    savedRatings = Array.isArray(parsedRatings) ? parsedRatings : [];
  } catch {
    savedRatings = [];
  }
  try {
    const parsedDeletedGames = JSON.parse(localStorage.getItem(deletedGamesStorageKey) || "[]");
    deletedGames = new Set(Array.isArray(parsedDeletedGames) ? parsedDeletedGames : []);
  } catch {
    deletedGames = new Set();
  }

  const activeRatings = savedRatings
    .filter((game) => !deletedGames.has(game.title))
    .map((game) => ({ ...game, image: gameCoverImages[game.title] || game.image }));
  const savedByTitle = new Map(activeRatings.map((game) => [game.title, game]));
  const remainingDefaults = defaultHistoryGames.filter(
    (game) => !savedByTitle.has(game.title) && !deletedGames.has(game.title),
  );

  return [...activeRatings, ...remainingDefaults];
}

function hasReview(game) {
  return Object.values(game.reviews || {}).some(
    (review) => typeof review === "string" && review.trim().length > 0,
  );
}

function hasRating(game) {
  return Number.isFinite(Number(game.rating)) && Number(game.rating) >= 1;
}

function formatRatedDate(date) {
  if (!date) return "Оцінено";
  const parsedDate = new Date(date);
  const formattedDate = Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
  return `Оцінено ${formattedDate}`;
}

function ProfilePage() {
  const { request } = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(
    () => Boolean(localStorage.getItem("userName") && localStorage.getItem("descoreToken")),
  );
  const [accountMode, setAccountMode] = useState("register");
  const commentEditorRef = useRef(null);
  const [comments, setComments] = useState(getSavedComments);
  const [isOfftopic, setIsOfftopic] = useState(false);
  const isHistoryOpen = new URLSearchParams(location.search).get("view") === "ratings";
  const [expandedGame, setExpandedGame] = useState(null);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [ratingError, setRatingError] = useState("");
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("descoreUser") || "null");
      return {
        username: savedUser?.username || localStorage.getItem("userName") || "",
        email: savedUser?.email || localStorage.getItem("userEmail") || "",
        avatar: savedUser?.avatar || "",
      };
    } catch {
      return {
        username: localStorage.getItem("userName") || "",
        email: localStorage.getItem("userEmail") || "",
        avatar: "",
      };
    }
  });
  const [profileError, setProfileError] = useState("");
  const [favoriteGames, setFavoriteGames] = useState(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");
      return Array.isArray(savedFavorites) ? savedFavorites : [];
    } catch {
      return [];
    }
  });
  const [historyGames, setHistoryGames] = useState(getHistoryGames);
  const username = profileForm.username || "Username";
  const profileAvatar = profileForm.avatar || avatarUrl;
  const ratedGamesCount = historyGames.filter(hasRating).length;
  const reviewedGamesCount = historyGames.filter(hasReview).length;

  useEffect(() => {
    localStorage.setItem(favoritesStorageKey, JSON.stringify(favoriteGames));
  }, [favoriteGames]);

  useEffect(() => {
    const token = localStorage.getItem("descoreToken");
    if (!token) return;

    request("/ratings/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ ratings }) => {
        const backendRatings = ratings
          .map((item) => {
            const game = backendGames[item.gameId];
            if (!game) return null;

            const aspects = item.aspects || {};
            return {
              ...game,
              gameId: item.gameId,
              rating: item.rating,
              scores: aspects,
              reviews: item.reviews || {},
              details: {
                Геймплей: aspects.gameplay ?? item.rating,
                Сюжет: aspects.story ?? item.rating,
                "Графіка/Дизайн": aspects.design ?? item.rating,
                Музика: aspects.music ?? item.rating,
              },
            };
          })
          .filter(Boolean);

        setHistoryGames((current) => {
          const games = new Map(current.map((game) => [game.title, game]));
            backendRatings.forEach((game) => {
              const localGame = games.get(game.title);
              const reviews = Object.fromEntries(
                ["gameplay", "story", "design", "music"].map((aspect) => [
                  aspect,
                  game.reviews?.[aspect] || localGame?.reviews?.[aspect] || "",
                ]),
              );
              games.set(game.title, { ...localGame, ...game, reviews });
            });
          return [...games.values()];
        });
      })
      .catch((error) => console.error("Не вдалося завантажити оцінки профілю", error));
  }, [request]);

  function submitComment() {
    const editor = commentEditorRef.current;
    const text = editor?.textContent?.trim();
    if (!text) return;

    const newComment = {
      id: Date.now(),
      author: username,
      html: sanitizeCommentHtml(editor.innerHTML),
      date: new Date().toLocaleDateString("uk-UA"),
      isOfftopic,
    };
    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(commentsStorageKey, JSON.stringify(updatedComments));
    editor.innerHTML = "";
    setIsOfftopic(false);
  }

  function applyFormatting(command) {
    commentEditorRef.current?.focus();
    document.execCommand(command);
  }

  function deleteComment(commentId) {
    const updatedComments = comments.filter(
      (publishedComment) => publishedComment.id !== commentId,
    );
    setComments(updatedComments);
    localStorage.setItem(commentsStorageKey, JSON.stringify(updatedComments));
    setPendingDeleteCommentId(null);
  }

  function editRating(game) {
    setRatingError("");
    setEditingTitle(game.title);
    setEditingForm({
      overall: game.rating || "",
      scores: {
        gameplay: game.scores?.gameplay ?? game.details?.Геймплей ?? "",
        story: game.scores?.story ?? game.details?.Сюжет ?? "",
        design:
          game.scores?.design ?? game.details?.["Графіка/Дизайн"] ?? game.details?.Графіка ?? "",
        music: game.scores?.music ?? game.details?.Музика ?? game.details?.Звук ?? "",
      },
      reviews: {
        gameplay: game.reviews?.gameplay || "",
        story: game.reviews?.story || "",
        design: game.reviews?.design || "",
        music: game.reviews?.music || "",
      },
    });
  }

  function updateEditingScore(name, value) {
    const nextValue = value === "" ? "" : Math.max(1, Math.min(10, Number(value)));
    setEditingForm((current) => ({
      ...current,
      scores: { ...current.scores, [name]: nextValue },
    }));
  }

  async function saveEditedRating(game) {
    const scoredValues = Object.values(editingForm.scores).filter(Boolean);
    const averageScore =
      scoredValues.reduce((total, score) => total + Number(score), 0) / scoredValues.length || 0;
    const rating = Number(editingForm.overall || Math.round(averageScore));
    const aspects = Object.fromEntries(
      Object.entries(editingForm.scores).map(([name, score]) => [name, Number(score)]),
    );
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 10 ||
      Object.values(aspects).some((score) => !Number.isInteger(score) || score < 1 || score > 10)
    ) {
      setRatingError("Заповніть загальну оцінку та всі оцінки аспектів від 1 до 10");
      return;
    }

    const gameId =
      game.gameId ||
      Object.entries(backendGames).find(([, backendGame]) => backendGame.title === game.title)?.[0];

    if (gameId) {
      try {
        await request("/ratings", {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("descoreToken")}` },
          body: JSON.stringify({
            gameId: Number(gameId),
            rating,
            aspects,
            reviews: editingForm.reviews,
          }),
        });
      } catch (error) {
        setRatingError(error.message || "Не вдалося оновити оцінку гри");
        return;
      }
    }

    const updatedGame = {
      ...game,
      gameId: gameId ? Number(gameId) : game.gameId,
      date: new Date().toLocaleDateString("uk-UA"),
      rating,
      details: {
        Геймплей: editingForm.scores.gameplay || "—",
        Сюжет: editingForm.scores.story || "—",
        "Графіка/Дизайн": editingForm.scores.design || "—",
        Музика: editingForm.scores.music || "—",
      },
      scores: aspects,
      reviews: Object.fromEntries(
        Object.entries(editingForm.reviews).map(([name, review]) => [name, review.trim()]),
      ),
    };

    let savedRatings;
    try {
      const parsedRatings = JSON.parse(localStorage.getItem(ratingsStorageKey) || "[]");
      savedRatings = Array.isArray(parsedRatings) ? parsedRatings : [];
    } catch {
      savedRatings = [];
    }
    const updatedRatings = [
      updatedGame,
      ...savedRatings.filter((savedGame) => savedGame.title !== game.title),
    ];
    localStorage.setItem(ratingsStorageKey, JSON.stringify(updatedRatings));
    setHistoryGames(getHistoryGames());
    setEditingTitle(null);
    setEditingForm(null);
    setRatingError("");
  }

  async function deleteRating(game) {
    setRatingError("");
    const mappedGameId = Object.entries(backendGames).find(
      ([, backendGame]) => backendGame.title === game.title,
    )?.[0];
    const gameId = Number(game.gameId || mappedGameId);
    if (gameId && import.meta.env.VITE_API_URL) {
      const token = localStorage.getItem("descoreToken");
      if (!token) {
        setRatingError("Увійдіть в акаунт, щоб видалити оцінку з бази");
        return;
      }

      try {
        await request(`/ratings/${gameId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        setRatingError(error.message || "Не вдалося видалити оцінку");
        return;
      }
    }

    let savedRatings;
    try {
      const parsedRatings = JSON.parse(localStorage.getItem(ratingsStorageKey) || "[]");
      savedRatings = Array.isArray(parsedRatings) ? parsedRatings : [];
    } catch {
      savedRatings = [];
    }
    const updatedRatings = savedRatings.filter((savedGame) => savedGame.title !== game.title);
    let deletedGames;
    try {
      const parsedDeletedGames = JSON.parse(localStorage.getItem(deletedGamesStorageKey) || "[]");
      deletedGames = Array.isArray(parsedDeletedGames) ? parsedDeletedGames : [];
    } catch {
      deletedGames = [];
    }
    localStorage.setItem(ratingsStorageKey, JSON.stringify(updatedRatings));
    localStorage.setItem(
      deletedGamesStorageKey,
      JSON.stringify([...new Set([...deletedGames, game.title])]),
    );
    setHistoryGames(getHistoryGames());
    setEditingTitle(null);
    setEditingForm(null);
    setRatingError("");
  }

  function chooseProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("Оберіть файл зображення");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Фото завелике. Максимальний розмір — 2 МБ");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((current) => ({ ...current, avatar: String(reader.result) }));
      setProfileError("");
    };
    reader.onerror = () => setProfileError("Не вдалося прочитати фото");
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setProfileError("");
    try {
      const updatedUser = await request("/auth/me", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("descoreToken")}` },
        body: JSON.stringify(profileForm),
      });
      localStorage.setItem("descoreUser", JSON.stringify(updatedUser));
      localStorage.setItem("userName", updatedUser.username);
      localStorage.setItem("userEmail", updatedUser.email);
      localStorage.setItem("descoreToken", updatedUser.token);
      setProfileForm({
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar || "",
      });
      setIsProfileEditing(false);
    } catch (error) {
      setProfileError(error.message || "Не вдалося зберегти профіль");
    }
  }

  return (
    <div className={styles["profile-page"]}>
      <Header
        isRegistered={isRegistered}
        onRegisterClick={() => {
          setAccountMode("register");
          setIsAccountOpen(true);
        }}
        onLoggedOut={() => {
          setIsRegistered(false);
          navigate("/", { replace: true });
        }}
      />
      <AccountModal
        key={accountMode}
        isOpen={isAccountOpen}
        mode={accountMode}
        onClose={() => setIsAccountOpen(false)}
        onRegistered={() => setIsRegistered(true)}
      />

      <main className={styles["main-content"]}>
        <section
          className={styles["profile-card"]}
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className={styles["profile-card-content"]}>
            <div className={styles["avatar"]}>
              <img src={profileAvatar} alt="Аватар" className={styles["avatar-img"]} />
              <i
                className={
                  styles["fa-solid"] + " " + styles["fa-circle-user"] + " " + styles["fa-5x"]
                }
              ></i>
            </div>
            <div className={styles["profile-info"]}>
              <h2>{username}</h2>
              <p>{profileForm.email}</p>
              <p className={styles["profile-activity"]}>Активність: 3 тижні і 6 днів</p>
              <p className={styles["joined"]}>Приєднався: вересень 2026</p>
              <button
                type="button"
                className={styles["edit-profile-button"]}
                onClick={() => {
                  setProfileError("");
                  setIsProfileEditing((current) => !current);
                }}
              >
                {isProfileEditing ? "Скасувати" : "Редагувати профіль"}
              </button>
            </div>
          </div>
          {isProfileEditing && (
            <div className={styles["profile-edit-form"]}>
              <label>
                Нік
                <input
                  value={profileForm.username}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, username: event.target.value }))
                  }
                />
              </label>
              <label>
                Gmail
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label>
                Фото профілю
                <input type="file" accept="image/*" onChange={chooseProfilePhoto} />
              </label>
              {profileError && <p className={styles["profile-edit-error"]}>{profileError}</p>}
              <button type="button" onClick={saveProfile}>
                Зберегти зміни
              </button>
            </div>
          )}
        </section>

        {isHistoryOpen ? (
          <section className={styles["game-history"]}>
            <div className={styles["history-heading"]}>
              <button
                type="button"
                className={styles["back-button"]}
                onClick={() => navigate("/profile")}
              >
                ← Профіль
              </button>
              <h1>Мої оцінки та відгуки</h1>
            </div>
            <p className={styles["history-count"]}>{historyGames.length} оцінки в іграх</p>
            {ratingError && !editingTitle && (
              <p className={styles["rating-editor-error"]}>{ratingError}</p>
            )}
            <div className={styles["history-grid"]}>
              {historyGames.map((game) => (
                <article className={styles["history-card"]} key={game.title}>
                  <div className={styles["history-card-main"]}>
                    <button
                      type="button"
                      className={`${styles["favorite-button"]} ${favoriteGames.includes(game.title) ? styles["is-favorite"] : ""}`}
                      aria-label={
                        favoriteGames.includes(game.title)
                          ? `Прибрати ${game.title} з улюбленого`
                          : `Додати ${game.title} в улюблене`
                      }
                      onClick={() =>
                        setFavoriteGames((current) =>
                          current.includes(game.title)
                            ? current.filter((title) => title !== game.title)
                            : [...current, game.title],
                        )
                      }
                    >
                      ★
                    </button>
                    <img src={game.image} alt={game.title} />
                    <div>
                      <h2>{game.title}</h2>
                      <p className={styles["review-date"]}>{formatRatedDate(game.date)}</p>
                      <div className={styles["rating-line"]}>
                        <span>{game.rating}</span> Моя оцінка
                      </div>
                      {editingTitle === game.title && editingForm ? (
                        <RatingEditor
                          form={editingForm}
                          onOverallChange={(value) =>
                            setEditingForm((current) => ({ ...current, overall: value }))
                          }
                          onScoreChange={updateEditingScore}
                          onReviewChange={(name, value) =>
                            setEditingForm((current) => ({
                              ...current,
                              reviews: { ...current.reviews, [name]: value },
                            }))
                          }
                          onSave={() => saveEditedRating(game)}
                          onCancel={() => {
                            setEditingTitle(null);
                            setEditingForm(null);
                            setRatingError("");
                          }}
                          error={ratingError}
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles["details-button"]}
                            onClick={() =>
                              setExpandedGame(expandedGame === game.title ? null : game.title)
                            }
                          >
                            Подивитись детально
                          </button>
                          {expandedGame === game.title && (
                            <div className={styles["rating-details"]}>
                              {Object.entries(game.details).map(([aspect, rating]) => {
                                const [label, reviewKey] = aspectLabels[aspect] || [aspect, ""];
                                const review = game.reviews?.[reviewKey]?.trim();
                                return (
                                  <div className={styles["rating-detail-group"]} key={aspect}>
                                    <div className={styles["rating-detail"]}>
                                      <span>{label}</span>
                                      <strong>{rating}/10</strong>
                                    </div>
                                    {review && <p className={styles["aspect-review"]}>{review}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className={styles["history-card-actions"]}>
                    <button type="button" onClick={() => editRating(game)}>
                      Редагувати оцінку
                    </button>
                    <button type="button" onClick={() => deleteRating(game)}>
                      Видалити оцінку
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className={styles["profile-stats"]}>
              <h2>Моя активність</h2>
              <ul>
                <li>
                  Оцінок ігор: <span className={styles["value"]}>{ratedGamesCount}</span>
                </li>
                <li>
                  Відгуків: <span className={styles["value"]}>{reviewedGamesCount}</span>
                </li>
                <li>
                  Улюблені жанри: <span className={styles["value"]}>RPG, Metroidvania</span>
                </li>
              </ul>
              <button
                type="button"
                className={styles["history-button"]}
                onClick={() => navigate("/profile?view=ratings")}
              >
                Історія ігор
              </button>
            </section>

            <section className={styles["favorites"]}>
              <h2>Улюблене</h2>
              {favoriteGames.length === 0 ? (
                <p>Список улюбленого пустий</p>
              ) : (
                <div className={styles["favorite-games"]}>
                  {historyGames
                    .filter((game) => favoriteGames.includes(game.title))
                    .map((game) => (
                      <div className={styles["favorite-game"]} key={game.title}>
                        <img src={game.image} alt={game.title} />
                        <span>{game.title}</span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className={styles["franchises"]}>
              <h2>Франшизи</h2>
              <div className={styles["franchise-grid"]}>
                {franchises.map((franchise) => (
                  <article className={styles["franchise-card"]} key={franchise.name}>
                    <img src={franchise.image} alt={franchise.name} />
                    <span>{franchise.name}</span>
                  </article>
                ))}
              </div>
            </section>
            <section className={styles["comment-box"]}>
              <h2>Твій коментар</h2>
              <div className={styles["comment-tools"]}>
                <button
                  type="button"
                  title="Жирний"
                  aria-label="Жирний"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyFormatting("bold")}
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  title="Курсив"
                  aria-label="Курсив"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyFormatting("italic")}
                >
                  <i>I</i>
                </button>
                <button
                  type="button"
                  title="Підкреслений"
                  aria-label="Підкреслений"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyFormatting("underline")}
                >
                  <u>U</u>
                </button>
              </div>
              <div
                ref={commentEditorRef}
                className={styles["comment-editor"]}
                contentEditable
                role="textbox"
                aria-label="Текст коментаря"
                data-placeholder="Текст коментаря"
                suppressContentEditableWarning
              />
              <div className={styles["comment-actions"]}>
                <button type="button" className={styles["write-btn"]} onClick={submitComment}>
                  Написати
                </button>
                <button
                  type="button"
                  className={`${styles["offtopic-btn"]} ${isOfftopic ? styles["is-active"] : ""}`}
                  onClick={() => setIsOfftopic((current) => !current)}
                >
                  Оффтоп
                </button>
              </div>
              {comments.length > 0 && (
                <div className={styles["published-comments"]}>
                  <h3>Коментарі</h3>
                  {comments.map((publishedComment) => (
                    <article className={styles["published-comment"]} key={publishedComment.id}>
                      <button
                        type="button"
                        className={styles["delete-comment-button"]}
                        aria-label="Видалити коментар"
                        title="Видалити коментар"
                        onClick={() => setPendingDeleteCommentId(publishedComment.id)}
                      >
                        &times;
                      </button>
                      {pendingDeleteCommentId === publishedComment.id && (
                        <div className={styles["comment-delete-confirm"]}>
                          <span>Видалити?</span>
                          <button type="button" onClick={() => deleteComment(publishedComment.id)}>
                            Так
                          </button>
                          <button type="button" onClick={() => setPendingDeleteCommentId(null)}>
                            Скасувати
                          </button>
                        </div>
                      )}
                      <div className={styles["published-comment-meta"]}>
                        <img src={profileAvatar} alt="" className={styles["comment-avatar"]} />
                        <strong>{publishedComment.author}</strong>
                        <span>{publishedComment.date}</span>
                        {publishedComment.isOfftopic && <em>Оффтоп</em>}
                      </div>
                      <div
                        className={styles["published-comment-body"]}
                        dangerouslySetInnerHTML={{
                          __html: sanitizeCommentHtml(publishedComment.html),
                        }}
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className={styles["footer"]}>
        <p>&copy; 2026 Descore. Всі права захищені.</p>
      </footer>
    </div>
  );
}

function RatingEditor({
  form,
  onOverallChange,
  onScoreChange,
  onReviewChange,
  onSave,
  onCancel,
  error,
}) {
  const fields = [
    ["gameplay", "Gameplay", "Опишіть геймплей"],
    ["story", "Story", "Опишіть сюжет"],
    ["design", "Design/Graphics", "Опишіть дизайн і графіку"],
    ["music", "Music", "Опишіть музику"],
  ];

  return (
    <div className={styles["rating-editor"]}>
      <label htmlFor="profileOverallScore">Загальна оцінка</label>
      <input
        id="profileOverallScore"
        type="number"
        min="1"
        max="10"
        value={form.overall}
        onChange={(event) => onOverallChange(event.target.value)}
      />
      {error && <p className={styles["rating-editor-error"]}>{error}</p>}
      {fields.map(([name, label, placeholder]) => (
        <div className={styles["rating-editor-field"]} key={name}>
          <label htmlFor={`profile-${name}-score`}>{label}</label>
          <input
            id={`profile-${name}-score`}
            type="number"
            min="1"
            max="10"
            value={form.scores[name]}
            onChange={(event) => onScoreChange(name, event.target.value)}
          />
          <textarea
            value={form.reviews[name]}
            onChange={(event) => onReviewChange(name, event.target.value)}
            placeholder={placeholder}
            maxLength="1000"
          />
        </div>
      ))}
      <div className={styles["rating-editor-actions"]}>
        <button type="button" className={styles["save-rating-button"]} onClick={onSave}>
          Зберегти
        </button>
        <button type="button" className={styles["cancel-rating-button"]} onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
