const gameTitle = "Hollow Knight: Silksong";

describe("Rating API errors", () => {
  it("shows a save error and does not store a failed game rating", () => {
    cy.intercept("GET", "**/ratings/3498", {
      body: { averageRating: null, votesCount: 0, aspectAverages: {} },
    });
    cy.intercept("GET", "**/ratings/me/3498", { body: { rating: null } });
    cy.intercept("POST", "**/ratings", {
      statusCode: 500,
      body: { message: "Не вдалося зберегти оцінку" },
    }).as("saveRating");

    cy.visit("/game", {
      onBeforeLoad(window) {
        window.localStorage.setItem("userName", "TestPlayer");
        window.localStorage.setItem("descoreToken", "test-token");
      },
    });
    cy.contains("button", "Оцінити").click();
    cy.get("#overallScore").type("9");
    cy.contains("button", "Надіслати").click();

    cy.wait("@saveRating").its("response.statusCode").should("eq", 500);
    cy.get('[role="alert"]').should("contain.text", "Не вдалося зберегти оцінку");
    cy.window().should((window) => {
      expect(window.localStorage.getItem("descoreRatings")).to.be.null;
    });
  });

  it("shows a delete error and keeps the rating in profile history", () => {
    const rating = {
      gameId: 3498,
      title: gameTitle,
      image: "https://example.com/silksong.jpg",
      date: "26 листопада 2026",
      rating: 7,
      details: { Геймплей: 7, Сюжет: 8, "Графіка/Дизайн": 7, Музика: 8 },
      scores: { gameplay: 7, story: 8, design: 7, music: 8 },
      reviews: { gameplay: "Initial review" },
    };
    cy.intercept("GET", "**/ratings/me", { body: { ratings: [] } });
    cy.intercept("DELETE", "**/ratings/3498", {
      statusCode: 500,
      body: { message: "Не вдалося видалити оцінку" },
    }).as("deleteRating");

    cy.visit("/profile?view=ratings", {
      onBeforeLoad(window) {
        window.localStorage.setItem("userName", "TestPlayer");
        window.localStorage.setItem("descoreToken", "test-token");
        window.localStorage.setItem("descoreRatings", JSON.stringify([rating]));
      },
    });
    cy.contains("article", gameTitle).within(() => {
      cy.contains("button", "Видалити оцінку").click();
    });

    cy.wait("@deleteRating").its("response.statusCode").should("eq", 500);
    cy.contains("Не вдалося видалити оцінку").should("be.visible");
    cy.contains("article", gameTitle).should("be.visible");
    cy.window().should((window) => {
      const savedRatings = JSON.parse(window.localStorage.getItem("descoreRatings"));
      expect(savedRatings).to.have.length(1);
      expect(savedRatings[0].title).to.equal(gameTitle);
    });
  });
});
