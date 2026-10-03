import { useState } from "react";
import Header from "../components/Header";
import AccountModal from "../components/AccountModal";

const games = [
  {
    id: "MGS",
    title: "Metal Gear Solid Delta: Snake Eater",
    image:
      "https://www.gaming.net/wp-content/uploads/2023/05/metal-gear-solid-delta-snake-eater-remake-edition-pc-game-cover.jpg",
    alt: "Metal gear",
    genre: "action-adventure",
    score: 78,
  },
  {
    id: "dying_light",
    title: "Dying Light: The Beast",
    image:
      "https://freakelitex.com/wp-content/uploads/2025/09/Dying-Light-The-Beast-ya-disponible.webp",
    alt: "Dying light DLC",
    genre: "Survival Horror",
    score: 86,
  },
  {
    id: "silksong",
    title: "Hollow Knight: Silksong",
    image:
      "https://static0.gamerantimages.com/wordpress/wp-content/uploads/wm/2025/02/hollow-knight-silksong-hornet-trailer.jpg",
    alt: "Silksong",
    genre: "Metroidvania",
    score: 100,
    link: "/game",
  },
  {
    id: "BF6",
    title: "Battlefield 6",
    image: "https://www.thesouthafrican.com/wp-content/uploads/2020/11/e75cf647-battlefield-6.jpg",
    alt: "BF6",
    genre: "FP shooter",
    score: 100,
  },
];

const editorials = [
  [
    "https://cdn.cloudflare.steamstatic.com/steam/apps/489830/header.jpg",
    "Skyrim autoleveling",
    "Why people hate autoleveling",
  ],
  [
    "https://static1.thegamerimages.com/wordpress/wp-content/uploads/2023/06/the-best-2000s-games-that-aged-well.jpg",
    "Old games",
    "BEST games before 2000",
  ],
  [
    "https://tse2.mm.bing.net/th/id/OIP.KEzW61eoYwMgQ_ZyjqtPMAHaDt?rs=1&pid=ImgDetMain&o=7&rm=3",
    "Ubisoft",
    "Best 5 UBISOFT games",
  ],
  [
    "https://i.ytimg.com/vi/bq9SrCW9wJY/maxresdefault.jpg",
    "Final Fantasy",
    "Final Fantasy Roundup: Every FF Game Ranked",
  ],
  [
    "https://static.wixstatic.com/media/52610a_d9d849e8afae400db9088a4e71e5a852~mv2.png/v1/fill/w_980,h_551,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/52610a_d9d849e8afae400db9088a4e71e5a852~mv2.png",
    "Game of the Year 2025",
    "Game Of The Year 2025",
  ],
  [
    "https://static1.srcdn.com/wordpress/wp-content/uploads/2025/04/hollow-knight-art-silksong-gameplay.jpg",
    "Silksong vs Hollow Knight",
    "Silksong vs Hollow Knight",
  ],
];

function MainPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(() => Boolean(localStorage.getItem("userName")));

  return (
    <>
      <Header
        isRegistered={isRegistered}
        onAccountClick={() => setIsModalOpen(true)}
        onProfileClick={() => {
          window.location.href = "/profile";
        }}
        onLogoClick={() => {
          window.location.href = "/main";
        }}
      />
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegistered={() => setIsRegistered(true)}
      />

      <div className="section">
        <h2>Новинки</h2>
        <div className="games-grid">
          {games.map((game) => {
            const scoreClass = game.score >= 90 ? "acclaim" : "favorable";
            const image = <img src={game.image} alt={game.alt} />;

            return (
              <div className="game-card" data-score={game.score} key={game.id}>
                <div id={game.id} className="game-title">
                  {game.title}
                  {game.link ? <a href={game.link}>{image}</a> : image}
                </div>
                <div className="game-genre">Genre: {game.genre}</div>
                <div className={`score ${scoreClass}`} data-score={game.score}></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <h2>Цікавинки</h2>
        <div className="editorial-grid">
          {editorials.map(([image, alt, title]) => (
            <div className="editorial-card" key={title}>
              <img src={image} alt={alt} />
              <div className="editorial-title">{title}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default MainPage;
