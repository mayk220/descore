import { useEffect, useState } from "react";
import Header from "../components/Header";
import AccountModal from "../components/AccountModal";
import { useApi } from "../hooks/useApi";
import styles from "../styles/GamePage.module.css";

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
const gameId = 3498;
const gameTitle = "Hollow Knight: Silksong";
const gameImage =
  "https://cdn.cloudflare.steamstatic.com/steam/apps/1030300/library_600x900_2x.jpg";
const criticAspectScores = {
  Геймплей: 9.4,
  Сюжет: 9.1,
  "Графіка/Дизайн": 9.3,
  Музика: 8.9,
};

function getScoreClass(value) {
  const score = Number(value);
  if (!value) return "";
  if (score >= 9) return styles["score-blue"];
  if (score >= 5) return styles["score-green"];
  return styles["score-red"];
}

function GamePage() {
  const { request } = useApi();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState("register");
  const [isRegistered, setIsRegistered] = useState(
    () => Boolean(localStorage.getItem("userName") && localStorage.getItem("descoreToken")),
  );
  const [authNotice, setAuthNotice] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(
    () => new URLSearchParams(window.location.search).get("edit") === "1",
  );
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isCriticDetailsOpen, setIsCriticDetailsOpen] = useState(false);
  const [myRating, setMyRating] = useState("");
  const [overallScore, setOverallScore] = useState("");
  const [scores, setScores] = useState(initialScores);
  const [reviews, setReviews] = useState(initialReviews);
  const [userStats, setUserStats] = useState({
    averageRating: null,
    votesCount: 0,
    aspectAverages: {},
  });
  const [ratingError, setRatingError] = useState("");

  useEffect(() => {
    if (!import.meta.env.VITE_API_URL) return;

    const token = localStorage.getItem("descoreToken");
    request(`/ratings/${gameId}`)
      .then(setUserStats)
      .catch((error) => setRatingError(error.message));

    if (token) {
      request(`/ratings/me/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((mine) => {
          if (mine.rating !== null) {
            setMyRating(mine.rating);
            setOverallScore(mine.rating);
            setScores({
              gameplay: mine.aspects?.gameplay ?? "",
              story: mine.aspects?.story ?? "",
              design: mine.aspects?.design ?? "",
              music: mine.aspects?.music ?? "",
            });
            setReviews(mine.reviews || initialReviews);
          }
        })
        .catch((error) => setRatingError(error.message));
    }
  }, [request]);

  function updateScore(name, value) {
    const nextValue = value === "" ? "" : Math.max(1, Math.min(10, Number(value)));
    setScores((current) => ({ ...current, [name]: nextValue }));
  }

  function updateReview(name, value) {
    setReviews((current) => ({ ...current, [name]: value }));
  }

  async function submitRating(event) {
    event.preventDefault();
    const token = localStorage.getItem("descoreToken");
    if (import.meta.env.VITE_API_URL && !token) {
      setAuthNotice(true);
      return;
    }

    const scoredValues = Object.values(scores).filter(Boolean);
    const averageScore =
      scoredValues.reduce((total, score) => total + Number(score), 0) / scoredValues.length || 0;
    const finalRating = Number(overallScore) || Math.round(averageScore);
    if (!Number.isInteger(finalRating) || finalRating < 1 || finalRating > 10) {
      setRatingError("Введіть оцінку від 1 до 10");
      return;
    }
    const rating = {
      gameId,
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

    try {
      if (import.meta.env.VITE_API_URL) {
        await request("/ratings", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            gameId,
            rating: Number(finalRating),
            aspects: {
              gameplay: Number(scores.gameplay) || finalRating,
              story: Number(scores.story) || finalRating,
              design: Number(scores.design) || finalRating,
              music: Number(scores.music) || finalRating,
            },
            reviews: rating.reviews,
          }),
        });
        setUserStats(await request(`/ratings/${gameId}`));
      }

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
      setOverallScore("");
      setScores(initialScores);
      setReviews(initialReviews);
      setIsRatingOpen(false);
    } catch (error) {
      setRatingError(error.message);
    }
  }

  return (
    <div className={styles["game-page"]}>
      <Header
        isRegistered={isRegistered}
        onRegisterClick={() => {
          setAccountMode("register");
          setIsAccountOpen(true);
        }}
        onLoggedOut={() => {
          setIsRegistered(false);
          setMyRating("");
          setOverallScore("");
        }}
        onProfileClick={() => {}}
        onLogoClick={() => {}}
      />
      <AccountModal
        key={accountMode}
        isOpen={isAccountOpen}
        mode={accountMode}
        onClose={() => setIsAccountOpen(false)}
        onRegistered={() => {
          setIsRegistered(true);
          setAuthNotice(false);
        }}
      />

      <header className={styles["header"]}>
        <h1>Hollow Knight: Silksong</h1>
        <div className={styles["rate-class"]}>
          {authNotice && (
            <p className={styles["auth-notice"]} role="alert">
              Зареєструйтесь спочатку
            </p>
          )}
          <button
            className={styles["rate-btn"]}
            onClick={() => {
              if (!isRegistered) {
                setAuthNotice(true);
                return;
              }
              setAuthNotice(false);
              setIsRatingOpen(true);
            }}
          >
            Оцінити
          </button>
        </div>
        <p className={styles["platform"]}>PC | Доступна на: Всі платформи</p>
        <p className={styles["release"]}>Реліз: 4 вересня 2025</p>
        {ratingError && <p className={styles["auth-notice"]}>{ratingError}</p>}
      </header>

      <main className={styles["main-content"]}>
        <section className={styles["top-section"]}>
          <div className={styles["video-box"]}>
            <iframe
              src="https://www.youtube.com/embed/pFAknD_9U7c"
              title="Silksong - trailer"
              allowFullScreen
            />
          </div>
          <div className={styles["score-panel"]}>
            <div className={styles["score"] + " " + styles["metascore"]}>
              <span className={styles["label"]}>Оцінка критиків</span>
              <span className={styles["value"]}>90</span>
              <button
                type="button"
                className={styles["details-link"]}
                onClick={() => setIsCriticDetailsOpen(true)}
              >
                Глянути детально
              </button>
              <span className={styles["user-count"]}>199 оглядів</span>
            </div>
            <div className={styles["score"] + " " + styles["userscore"]}>
              <span className={styles["label"]}>Оцінка користувачів</span>
              <span className={styles["value"]}>{userStats.averageRating ?? "—"}</span>
              <button
                type="button"
                className={styles["details-link"]}
                onClick={() => setIsUserDetailsOpen(true)}
              >
                Глянути детально
              </button>
              <span className={styles["user-count"]}>{userStats.votesCount} оцінок</span>
            </div>
            <div className={styles["score"] + " " + styles["myscore"]}>
              <span className={styles["label"]}>Моя оцінка</span>
              <span className={styles["value"]}>{isRegistered && myRating ? myRating : "—"}</span>
              <p className={styles["note"]}></p>
            </div>
          </div>
        </section>

        <section className={styles["description"]}>
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

      <footer className={styles["footer"]}>
        <p>&copy; 2025 Descore. Всі права захищені.</p>
      </footer>

      {isRatingOpen && (
        <div
          className={styles["modal"] + " " + styles["rating-modal"]}
          onClick={(event) => event.target === event.currentTarget && setIsRatingOpen(false)}
        >
          <form className={styles["modal-content"]} onSubmit={submitRating}>
            <button
              type="button"
              className={styles["close"]}
              aria-label="Закрити форму оцінювання"
              onClick={() => setIsRatingOpen(false)}
            >
              &times;
            </button>
            <h2>Оцінка гри</h2>
            {ratingError && (
              <p className={styles["auth-notice"]} role="alert">
                {ratingError}
              </p>
            )}
            <div className={styles["overall-rating-field"]}>
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
              <div className={styles["score-display"]}>
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
            <button className={styles["submit-rating-button"]} type="submit">
              Надіслати
            </button>
          </form>
        </div>
      )}
      {isUserDetailsOpen && (
        <div
          className={styles["modal"] + " " + styles["details-modal"]}
          onClick={(event) => event.target === event.currentTarget && setIsUserDetailsOpen(false)}
        >
          <div className={styles["modal-content"]}>
            <button
              type="button"
              className={styles["close"]}
              aria-label="Закрити оцінки користувачів"
              onClick={() => setIsUserDetailsOpen(false)}
            >
              &times;
            </button>
            <h2>Оцінки аспектів гри</h2>
            {[
              ["Геймплей", userStats.aspectAverages.gameplay],
              ["Сюжет", userStats.aspectAverages.story],
              ["Графіка/Дизайн", userStats.aspectAverages.design],
              ["Музика", userStats.aspectAverages.music],
            ].map(([aspect, score]) => (
              <div className={styles["rating-detail"]} key={aspect}>
                <span>{aspect}</span>
                <strong>{score ?? "—"}/10</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      {isCriticDetailsOpen && (
        <div
          className={styles["modal"] + " " + styles["details-modal"]}
          onClick={(event) => event.target === event.currentTarget && setIsCriticDetailsOpen(false)}
        >
          <div className={styles["modal-content"]}>
            <button
              type="button"
              className={styles["close"]}
              aria-label="Закрити оцінки критиків"
              onClick={() => setIsCriticDetailsOpen(false)}
            >
              &times;
            </button>
            <h2>Оцінки аспектів від критиків</h2>
            {Object.entries(criticAspectScores).map(([aspect, score]) => (
              <div className={styles["rating-detail"]} key={aspect}>
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
    <div className={styles["rating-field"]}>
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
      <div className={styles["score-display"]}>
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
      <div className={styles["char-count"]}>{review.length}/1000 символів</div>
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
