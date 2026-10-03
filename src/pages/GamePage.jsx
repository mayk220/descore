import { useState } from "react";
import Header from "../components/Header";
import AccountModal from "../components/AccountModal";
import "../styles/game.css";

const initialScores = {
  gameplay: "",
  story: "",
  design: "",
  music: "",
};

const initialReviews = {
  gameplay: "",
  story: "",
  design: "",
  music: "",
};

const ratingsStorageKey = "descoreRatings";
const deletedGamesStorageKey = "descoreDeletedGames";
const gameTitle = "Hollow Knight: Silksong";
const gameImage =
  "https://cdn.cloudflare.steamstatic.com/steam/apps/1030300/library_600x900_2x.jpg";
const userAspectScores = {
  Геймплей: 8.8,
  Сюжет: 8.4,
  "Графіка/Дизайн": 8.7,
  Музика: 8.5,
};
const criticAspectScores = {
  Геймплей: 9.4,
  Сюжет: 9.1,
  "Графіка/Дизайн": 9.3,
  Музика: 8.9,
};

function getScoreClass(value) {
  const score = Number(value);
  if (!value) return "";
  if (score >= 9) return "score-blue";
  if (score >= 5) return "score-green";
  return "score-red";
}

function getSavedRating() {
  try {
    const savedRatings = JSON.parse(localStorage.getItem(ratingsStorageKey) || "[]");
    const savedRating = Array.isArray(savedRatings)
      ? savedRatings.find((rating) => rating.title === gameTitle)
      : null;
    return savedRating || null;
  } catch {
    return null;
  }
}

function GamePage() {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(() => Boolean(localStorage.getItem("userName")));
  const [isRatingOpen, setIsRatingOpen] = useState(
    () => new URLSearchParams(window.location.search).get("edit") === "1",
  );
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isCriticDetailsOpen, setIsCriticDetailsOpen] = useState(false);
  const savedRating = getSavedRating();
  const [myRating, setMyRating] = useState(savedRating?.rating ?? "");
  const [overallScore, setOverallScore] = useState(savedRating?.rating ?? "");
  const [scores, setScores] = useState(savedRating?.scores || initialScores);
  const [reviews, setReviews] = useState(savedRating?.reviews || initialReviews);

  function updateScore(name, value) {
    const nextValue = value === "" ? "" : Math.max(1, Math.min(10, Number(value)));
    setScores((current) => ({ ...current, [name]: nextValue }));
  }

  function updateReview(name, value) {
    setReviews((current) => ({ ...current, [name]: value }));
  }

  function submitRating(event) {
    event.preventDefault();
    const scoredValues = Object.values(scores).filter(Boolean);
    const averageScore =
      scoredValues.reduce((total, score) => total + Number(score), 0) / scoredValues.length || 0;
    const finalRating = overallScore || (averageScore ? Number(averageScore.toFixed(1)) : "");
    const rating = {
      title: gameTitle,
      image: gameImage,
      date: new Date().toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      rating: finalRating,
      details: {
        Геймплей: scores.gameplay || "—",
        Сюжет: scores.story || "—",
        "Графіка/Дизайн": scores.design || "—",
        Музика: scores.music || "—",
      },
      scores,
      reviews: Object.fromEntries(
        Object.entries(reviews).map(([name, review]) => [name, review.trim()]),
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
      rating,
      ...savedRatings.filter((savedRating) => savedRating.title !== gameTitle),
    ];
    localStorage.setItem(ratingsStorageKey, JSON.stringify(updatedRatings));
    const deletedGames = JSON.parse(localStorage.getItem(deletedGamesStorageKey) || "[]");
    localStorage.setItem(
      deletedGamesStorageKey,
      JSON.stringify(deletedGames.filter((title) => title !== gameTitle)),
    );
    setMyRating(rating.rating);
    setIsRatingOpen(false);
  }

  return (
    <div className="game-page">
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

      <header className="header">
        <h1>Hollow Knight: Silksong</h1>
        <div className="rate-class">
          <button className="rate-btn" onClick={() => setIsRatingOpen(true)}>
            Оцінити
          </button>
        </div>
        <p className="platform">PC | Доступна на: Всі платформи</p>
        <p className="release">Реліз: 4 вересня 2025</p>
      </header>

      <main className="main-content">
        <section className="top-section">
          <div className="video-box">
            <iframe
              src="https://www.youtube.com/embed/pFAknD_9U7c"
              title="Silksong - trailer"
              allowFullScreen
            />
          </div>
          <div className="score-panel">
            <div className="score metascore">
              <span className="label">Оцінка критиків</span>
              <span className="value">90</span>
              <button
                type="button"
                className="details-link"
                onClick={() => setIsCriticDetailsOpen(true)}
              >
                Глянути детально
              </button>
              <span className="user-count">199 оглядів</span>
            </div>
            <div className="score userscore">
              <span className="label">Оцінка користувачів</span>
              <span className="value">8.6</span>
              <button type="button" className="details-link" onClick={() => setIsUserDetailsOpen(true)}>
                Глянути детально
              </button>
              <span className="user-count">6939 оцінок</span>
            </div>
            <div className="score myscore">
              <span className="label">Моя оцінка</span>
              <span className="value">{myRating || "—"}</span>
              <p className="note"></p>
            </div>
          </div>
        </section>

        <section className="description">
          <h2>Опис гри</h2>
          <p>
            Hollow Knight: Silksong — продовження культової метроїдванії від Team Cherry. Ви граєте
            за Хорнет, принцесу-захисницю, яка опинилася в новому королівстві. Досліджуйте
            величезний світ, наповнений новими ворогами, союзниками та викликами. Вас чекають сотні
            унікальних ворогів, нові здібності, крафт предметів і епічні битви з босами.
          </p>
        </section>

        <ReviewSection
          title="Огляди критиків"
          reviews={[
            [
              "GamePro",
              95,
              "Silksong піднімає планку метроїдваній. Вражаючий дизайн світу та бойова система.",
            ],
            ["IGN", 92, "Неймовірна атмосфера, складні боси та глибокий геймплей."],
            ["GameSpot", 90, "Team Cherry знову створили шедевр, який захоплює з перших хвилин."],
          ]}
        />
        <ReviewSection
          title="Відгуки користувачів"
          reviews={[
            ["HornetFan", 10, "Найкраща метроїдванія. Бої та музика — просто магія."],
            [
              "BugKnight",
              8,
              "Дуже гарна гра, але складність висока навіть для ветеранів Hollow Knight.",
            ],
            ["SilkLover", 9, "Світ величезний і красивий. Кожна локація — витвір мистецтва."],
          ]}
        />
      </main>

      <footer className="footer">
        <p>&copy; 2025 Descore. Всі права захищені.</p>
      </footer>

      {isRatingOpen && (
        <div
          className="modal rating-modal"
          onClick={(event) =>
            event.target.className.includes("rating-modal") && setIsRatingOpen(false)
          }
        >
          <form className="modal-content" onSubmit={submitRating}>
            <button type="button" className="close" onClick={() => setIsRatingOpen(false)}>
              &times;
            </button>
            <h2>🎮 Оцінка гри</h2>
            <div className="overall-rating-field">
              <label htmlFor="overallScore">Загальна оцінка гри (1–10)</label>
              <input
                id="overallScore"
                type="number"
                min="1"
                max="10"
                value={overallScore}
                onChange={(event) =>
                  setOverallScore(
                    event.target.value === ""
                      ? ""
                      : Math.max(1, Math.min(10, Number(event.target.value))),
                  )
                }
                placeholder="Ваша загальна оцінка"
              />
              <div className="score-display">
                Оцінка: <span className={getScoreClass(overallScore)}>{overallScore}</span>
              </div>
            </div>
            <RatingField
              name="gameplay"
              label="Gameplay Score (1–10)"
              placeholder="Опишіть механіки, управління, бойову систему..."
              score={scores.gameplay}
              review={reviews.gameplay}
              onScoreChange={updateScore}
              onReviewChange={updateReview}
            />
            <RatingField
              name="story"
              label="Story Score (1–10)"
              placeholder="Опишіть сюжет, персонажів, атмосферу..."
              score={scores.story}
              review={reviews.story}
              onScoreChange={updateScore}
              onReviewChange={updateReview}
            />
            <RatingField
              name="design"
              label="Design/Graphics Score (1–10)"
              placeholder="Опишіть візуальний стиль, анімацію, дизайн світу..."
              score={scores.design}
              review={reviews.design}
              onScoreChange={updateScore}
              onReviewChange={updateReview}
            />
            <RatingField
              name="music"
              label="Music Score (1–10)"
              placeholder="Опишіть музику, звукові ефекти та озвучення..."
              score={scores.music}
              review={reviews.music}
              onScoreChange={updateScore}
              onReviewChange={updateReview}
            />
            <button id="submitRating" type="submit">
              Надіслати
            </button>
          </form>
        </div>
      )}
      {isUserDetailsOpen && (
        <div
          className="modal details-modal"
          onClick={(event) =>
            event.target.className.includes("details-modal") && setIsUserDetailsOpen(false)
          }
        >
          <div className="modal-content">
            <button type="button" className="close" onClick={() => setIsUserDetailsOpen(false)}>
              &times;
            </button>
            <h2>Оцінки аспектів гри</h2>
            {Object.entries(userAspectScores).map(([aspect, score]) => (
              <div className="rating-detail" key={aspect}>
                <span>{aspect}</span>
                <strong>{score}/10</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      {isCriticDetailsOpen && (
        <div
          className="modal details-modal"
          onClick={(event) =>
            event.target.className.includes("details-modal") && setIsCriticDetailsOpen(false)
          }
        >
          <div className="modal-content">
            <button type="button" className="close" onClick={() => setIsCriticDetailsOpen(false)}>
              &times;
            </button>
            <h2>Оцінки аспектів від критиків</h2>
            {Object.entries(criticAspectScores).map(([aspect, score]) => (
              <div className="rating-detail" key={aspect}>
                <span>{aspect}</span>
                <strong>{score}/10</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RatingField({ name, label, placeholder, score, review, onScoreChange, onReviewChange }) {
  return (
    <div className="rating-field">
      <label htmlFor={`${name}Score`}>{label}</label>
      <input
        id={`${name}Score`}
        type="number"
        min="1"
        max="10"
        value={score}
        onChange={(event) => onScoreChange(name, event.target.value)}
        placeholder="Введіть оцінку"
      />
      <div className="score-display">
        Оцінка: <span className={getScoreClass(score)}>{score}</span>
      </div>
      <label htmlFor={`${name}Review`}>
        {name === "design" ? "Design Review" : `${name[0].toUpperCase()}${name.slice(1)} Review`}
      </label>
      <textarea
        id={`${name}Review`}
        maxLength="1000"
        value={review}
        onChange={(event) => onReviewChange(name, event.target.value)}
        placeholder={placeholder}
      />
      <div className="char-count">{review.length}/1000 символів</div>
    </div>
  );
}

function ReviewSection({ title, reviews }) {
  return (
    <section className={title === "Огляди критиків" ? "critic-reviews" : "user-reviews"}>
      <h2>{title}</h2>
      <ul>
        {reviews.map(([author, score, text]) => (
          <li key={author}>
            <strong>{author}:</strong> {score} — “{text}”
          </li>
        ))}
      </ul>
    </section>
  );
}

export default GamePage;
