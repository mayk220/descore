const gameTitle = "Hollow Knight: Silksong";
const gameRating = {
  gameId: 3498,
  rating: 7,
  aspects: { gameplay: 7, story: 8, design: 7, music: 8 },
  reviews: {
    gameplay: "Initial gameplay review",
    story: "Initial story review",
    design: "Initial design review",
    music: "Initial music review",
  },
};

function visitProfile(path = "/profile", ratings = [], comments = []) {
  cy.intercept("GET", "**/ratings/me", { body: { ratings } });

  cy.visit(path, {
    onBeforeLoad(window) {
      window.localStorage.setItem("userName", "TestPlayer");
      window.localStorage.setItem("descoreToken", "test-token");
      window.localStorage.setItem(
        "descoreRatings",
        JSON.stringify(
          ratings.map((rating) => ({
            ...rating,
            title: gameTitle,
            image: "https://example.com/silksong.jpg",
            scores: rating.aspects,
            details: {
              Геймплей: rating.aspects.gameplay,
              Сюжет: rating.aspects.story,
              "Графіка/Дизайн": rating.aspects.design,
              Музика: rating.aspects.music,
            },
          })),
        ),
      );
      window.localStorage.setItem("descoreComments", JSON.stringify(comments));
    },
  });
}

describe("Profile flow", () => {
  it("publishes a profile comment and keeps it after reload", () => {
    const comment = "Мій коментар у профілі";
    visitProfile();

    cy.get('[aria-label="Текст коментаря"]').type(comment);
    cy.contains("button", "Написати").click();
    cy.get('[class*="published-comments"]').contains(comment).should("be.visible");
    cy.get('[class*="published-comment-meta"]').contains("TestPlayer").should("be.visible");

    cy.reload();

    cy.get('[class*="published-comments"]').contains(comment).should("be.visible");
  });

  it("edits a rated game's score and review in profile history", () => {
    cy.intercept("POST", "**/ratings", { statusCode: 201, body: {} });
    visitProfile("/profile?view=ratings", [gameRating]);

    cy.contains("article", gameTitle).within(() => {
      cy.contains("button", "Подивитись детально").click();
      cy.contains("Initial gameplay review").should("be.visible");
      cy.contains("button", "Редагувати оцінку").click();
      cy.get("#profileOverallScore").clear().type("8");
      cy.get('textarea[placeholder="Опишіть геймплей"]').clear().type("Updated gameplay review");
      cy.contains("button", "Зберегти").click();
      cy.contains("button", "Редагувати оцінку").should("be.visible");
      cy.contains("Updated gameplay review").should("be.visible");
    });

    cy.window().should((window) => {
      const [savedRating] = JSON.parse(window.localStorage.getItem("descoreRatings"));
      expect(savedRating.rating).to.equal(8);
      expect(savedRating.reviews.gameplay).to.equal("Updated gameplay review");
    });
  });

  it("deletes a rated game from profile history", () => {
    cy.intercept("DELETE", "**/ratings/3498", { statusCode: 204 });
    visitProfile("/profile?view=ratings", [gameRating]);

    cy.contains("article", gameTitle).within(() => {
      cy.contains("button", "Видалити оцінку").click();
    });

    cy.contains("article", gameTitle).should("not.exist");
    cy.window().should((window) => {
      const deletedGames = JSON.parse(window.localStorage.getItem("descoreDeletedGames"));
      expect(deletedGames).to.include(gameTitle);
    });
  });

  it("protects the profile route and logs the user out", () => {
    cy.visit("/profile");
    cy.location("pathname").should("eq", "/main");

    cy.intercept("GET", "**/ratings/me", { body: { ratings: [] } });
    cy.visit("/profile", {
      onBeforeLoad(window) {
        window.localStorage.setItem("userName", "TestPlayer");
        window.localStorage.setItem("descoreToken", "test-token");
      },
    });
    cy.contains("button", "Редагувати профіль").should("be.visible");
    cy.get('button[aria-label="Меню профілю"]').focus();
    cy.contains("button", "Вихід").click();

    cy.location("pathname").should("eq", "/main");
    cy.window().should((window) => {
      expect(window.localStorage.getItem("userName")).to.be.null;
      expect(window.localStorage.getItem("descoreToken")).to.be.null;
    });
    cy.visit("/profile");
    cy.location("pathname").should("eq", "/main");
  });

  it("adds and removes a favorite game and persists the change", () => {
    visitProfile("/profile", [gameRating]);

    cy.contains("button", "Історія ігор").click();
    cy.contains("article", gameTitle)
      .find(`button[aria-label="Додати ${gameTitle} в улюблене"]`)
      .click();
    cy.contains("button", "← Профіль").click();
    cy.contains('[class*="favorites"]', gameTitle).should("be.visible");

    cy.reload();
    cy.contains('[class*="favorites"]', gameTitle).should("be.visible");
    cy.contains("button", "Історія ігор").click();
    cy.contains("article", gameTitle)
      .find(`button[aria-label="Прибрати ${gameTitle} з улюбленого"]`)
      .click();
    cy.contains("button", "← Профіль").click();
    cy.contains("Список улюбленого пустий").should("be.visible");
  });

  it("deletes a profile comment only after confirmation", () => {
    const comment = {
      id: 1,
      author: "TestPlayer",
      html: "Comment to delete",
      date: "26 листопада 2026",
      isOfftopic: false,
    };
    visitProfile("/profile", [], [comment]);

    cy.contains("article", comment.html).within(() => {
      cy.get('button[aria-label="Видалити коментар"]').click();
      cy.contains("button", "Скасувати").click();
      cy.contains(comment.html).should("be.visible");
      cy.get('button[aria-label="Видалити коментар"]').click();
      cy.contains("button", "Так").click();
    });

    cy.contains("article", comment.html).should("not.exist");
    cy.window().should((window) => {
      expect(JSON.parse(window.localStorage.getItem("descoreComments"))).to.deep.equal([]);
    });
  });
});
