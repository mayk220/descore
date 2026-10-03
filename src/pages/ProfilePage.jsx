import { useRef, useState } from "react";
import Header from "../components/Header";
import AccountModal from "../components/AccountModal";
import heroImage from "../assets/hero.png";
import "../styles/profile.css";

const avatarUrl =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR15psFaVkvp5kMTV8iP7FVpJdoK81GUN4ES3GHd4xPSwPpp4XDIRFPMjWa&s=10";
const gameCoverImages = {
  "Resident Evil 3": "https://cdn.cloudflare.steamstatic.com/steam/apps/952060/library_600x900_2x.jpg",
  "Resident Evil 2": "https://cdn.cloudflare.steamstatic.com/steam/apps/883710/library_600x900_2x.jpg",
  "Shotgun King: The Final Checkmate":
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1972440/library_600x900_2x.jpg",
  "The Witcher 3: Wild Hunt - Blood and Wine":
    "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg",
  "Hollow Knight: Silksong":
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1030300/library_600x900_2x.jpg",
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
const deletedGamesStorageKey = "descoreDeletedGames";
const commentsStorageKey = "descoreComments";
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
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(() => Boolean(localStorage.getItem("userName")));
  const commentEditorRef = useRef(null);
  const [comments, setComments] = useState(getSavedComments);
  const [isOfftopic, setIsOfftopic] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(
    () => new URLSearchParams(window.location.search).get("view") === "ratings",
  );
  const [expandedGame, setExpandedGame] = useState(null);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [historyGames, setHistoryGames] = useState(getHistoryGames);
  const username = localStorage.getItem("userName") || "Username";
  const ratedGamesCount = historyGames.filter(hasRating).length;
  const reviewedGamesCount = historyGames.filter(hasReview).length;

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
    const updatedComments = comments.filter((publishedComment) => publishedComment.id !== commentId);
    setComments(updatedComments);
    localStorage.setItem(commentsStorageKey, JSON.stringify(updatedComments));
    setPendingDeleteCommentId(null);
  }

  function editRating(game) {
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

  function saveEditedRating(game) {
    const scoredValues = Object.values(editingForm.scores).filter(Boolean);
    const averageScore =
      scoredValues.reduce((total, score) => total + Number(score), 0) / scoredValues.length || 0;
    const updatedGame = {
      ...game,
      date: new Date().toLocaleDateString("uk-UA"),
      rating: Number(editingForm.overall || averageScore.toFixed(1)),
      details: {
        Геймплей: editingForm.scores.gameplay || "—",
        Сюжет: editingForm.scores.story || "—",
        "Графіка/Дизайн": editingForm.scores.design || "—",
        Музика: editingForm.scores.music || "—",
      },
      scores: editingForm.scores,
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
  }

  function deleteRating(title) {
    let savedRatings;
    try {
      const parsedRatings = JSON.parse(localStorage.getItem(ratingsStorageKey) || "[]");
      savedRatings = Array.isArray(parsedRatings) ? parsedRatings : [];
    } catch {
      savedRatings = [];
    }
    const updatedRatings = savedRatings.filter((game) => game.title !== title);
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
      JSON.stringify([...new Set([...deletedGames, title])]),
    );
    setHistoryGames(getHistoryGames());
    setEditingTitle(null);
    setEditingForm(null);
  }

  return (
    <div className="profile-page">
      <Header
        isRegistered={isRegistered}
        onAccountClick={() => setIsAccountOpen(true)}
        onProfileClick={() => {
          window.location.href = "/profile";
        }}
        onLogoClick={() => {
          window.location.href = "/main";
        }}
      />
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onRegistered={() => setIsRegistered(true)}
      />

      <main className="main-content">
        <section className="profile-card" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="profile-card-content">
            <div className="avatar">
              <img src={avatarUrl} alt="Аватар" className="avatar-img" />
              <i className="fa-solid fa-circle-user fa-5x"></i>
            </div>
            <div className="profile-info">
              <h2>{username}</h2>
              <p className="profile-activity">Активність: 3 тижні і 6 днів</p>
              <p className="joined">Приєднався: вересень 2026</p>
            </div>
          </div>
        </section>

        {isHistoryOpen ? (
          <section className="game-history">
            <div className="history-heading">
              <button type="button" className="back-button" onClick={() => setIsHistoryOpen(false)}>
                ← Профіль
              </button>
              <h1>Мої оцінки та відгуки</h1>
            </div>
            <p className="history-count">{historyGames.length} оцінки в іграх</p>
            <div className="history-grid">
              {historyGames.map((game) => (
                <article className="history-card" key={game.title}>
                  <div className="history-card-main">
                    <button
                      type="button"
                      className={`favorite-button ${favoriteGames.includes(game.title) ? "is-favorite" : ""}`}
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
                      <p className="review-date">{formatRatedDate(game.date)}</p>
                      <div className="rating-line">
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
                          }}
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            className="details-button"
                            onClick={() =>
                              setExpandedGame(expandedGame === game.title ? null : game.title)
                            }
                          >
                            Подивитись детально
                          </button>
                          {expandedGame === game.title && (
                            <div className="rating-details">
                              {Object.entries(game.details).map(([aspect, rating]) => {
                                const [label, reviewKey] = aspectLabels[aspect] || [aspect, ""];
                                const review = game.reviews?.[reviewKey]?.trim();
                                return (
                                  <div className="rating-detail-group" key={aspect}>
                                    <div className="rating-detail">
                                      <span>{label}</span>
                                      <strong>{rating}/10</strong>
                                    </div>
                                    {review && (
                                      <p className="aspect-review">{review}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="history-card-actions">
                    <button type="button" onClick={() => editRating(game)}>
                      Редагувати оцінку
                    </button>
                    <button type="button" onClick={() => deleteRating(game.title)}>
                      Видалити оцінку
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="profile-stats">
              <h2>Моя активність</h2>
              <ul>
                <li>
                  Оцінок ігор: <span className="value">{ratedGamesCount}</span>
                </li>
                <li>
                  Відгуків: <span className="value">{reviewedGamesCount}</span>
                </li>
                <li>
                  Улюблені жанри: <span className="value">RPG, Metroidvania</span>
                </li>
              </ul>
              <button
                type="button"
                className="history-button"
                onClick={() => setIsHistoryOpen(true)}
              >
                Історія ігор
              </button>
            </section>

            <section className="favorites">
              <h2>Улюблене</h2>
              {favoriteGames.length === 0 ? (
                <p>Список улюбленого пустий</p>
              ) : (
                <div className="favorite-games">
                  {historyGames
                    .filter((game) => favoriteGames.includes(game.title))
                    .map((game) => (
                      <div className="favorite-game" key={game.title}>
                        <img src={game.image} alt={game.title} />
                        <span>{game.title}</span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="achievements">
              <h2>Досягнення</h2>
              <div className="achievements-block">
                <h3>Загальні</h3>
                <div className="achievement-card">
                  <img
                    src="https://images.stopgame.ru/uploads/users/2021/161162/00799.tcDEah-.jpg"
                    alt="Досягнення"
                  />
                  <p>50 оцінених ігор</p>
                </div>
              </div>
              <div className="achievements-block">
                <h3>Жанрові</h3>
                <p>Немає досягнень</p>
              </div>
            </section>

            <section className="franchises">
              <h2>Франшизи</h2>
              <div className="franchise-grid">
                <div className="franchise-card">[Картинка франшизи]</div>
                <div className="franchise-card">[Картинка франшизи]</div>
                <div className="franchise-card">[Картинка франшизи]</div>
              </div>
            </section>
            <section className="comment-box">
              <h2>Твій коментар</h2>
              <div className="comment-tools">
                <button type="button" title="Жирний" aria-label="Жирний" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormatting("bold")}>
                  <b>B</b>
                </button>
                <button type="button" title="Курсив" aria-label="Курсив" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormatting("italic")}>
                  <i>I</i>
                </button>
                <button type="button" title="Підкреслений" aria-label="Підкреслений" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormatting("underline")}>
                  <u>U</u>
                </button>
              </div>
              <div
                ref={commentEditorRef}
                className="comment-editor"
                contentEditable
                role="textbox"
                aria-label="Текст коментаря"
                data-placeholder="Текст коментаря"
                suppressContentEditableWarning
              />
              <div className="comment-actions">
                <button type="button" className="write-btn" onClick={submitComment}>
                  Написати
                </button>
                <button
                  type="button"
                  className={`offtopic-btn ${isOfftopic ? "is-active" : ""}`}
                  onClick={() => setIsOfftopic((current) => !current)}
                >
                  Оффтоп
                </button>
              </div>
              {comments.length > 0 && (
                <div className="published-comments">
                  <h3>Коментарі</h3>
                  {comments.map((publishedComment) => (
                    <article className="published-comment" key={publishedComment.id}>
                      <button
                        type="button"
                        className="delete-comment-button"
                        aria-label="Видалити коментар"
                        title="Видалити коментар"
                        onClick={() => setPendingDeleteCommentId(publishedComment.id)}
                      >
                        &times;
                      </button>
                      {pendingDeleteCommentId === publishedComment.id && (
                        <div className="comment-delete-confirm">
                          <span>Видалити?</span>
                          <button type="button" onClick={() => deleteComment(publishedComment.id)}>
                            Так
                          </button>
                          <button type="button" onClick={() => setPendingDeleteCommentId(null)}>
                            Скасувати
                          </button>
                        </div>
                      )}
                      <div className="published-comment-meta">
                        <img src={avatarUrl} alt="" className="comment-avatar" />
                        <strong>{publishedComment.author}</strong>
                        <span>{publishedComment.date}</span>
                        {publishedComment.isOfftopic && <em>Оффтоп</em>}
                      </div>
                      <div
                        className="published-comment-body"
                        dangerouslySetInnerHTML={{ __html: sanitizeCommentHtml(publishedComment.html) }}
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p>&copy; 2026 Descore. Всі права захищені.</p>
      </footer>
    </div>
  );
}

function RatingEditor({ form, onOverallChange, onScoreChange, onReviewChange, onSave, onCancel }) {
  const fields = [
    ["gameplay", "Gameplay", "Опишіть геймплей"],
    ["story", "Story", "Опишіть сюжет"],
    ["design", "Design/Graphics", "Опишіть дизайн і графіку"],
    ["music", "Music", "Опишіть музику"],
  ];

  return (
    <div className="rating-editor">
      <label htmlFor="profileOverallScore">Загальна оцінка</label>
      <input
        id="profileOverallScore"
        type="number"
        min="1"
        max="10"
        value={form.overall}
        onChange={(event) => onOverallChange(event.target.value)}
      />
      {fields.map(([name, label, placeholder]) => (
        <div className="rating-editor-field" key={name}>
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
      <div className="rating-editor-actions">
        <button type="button" className="save-rating-button" onClick={onSave}>
          Зберегти
        </button>
        <button type="button" className="cancel-rating-button" onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
