describe("Game flow", () => {
  it("opens a game from the home page and prompts guests to register before rating", () => {
    cy.visit("/");

    cy.location("pathname").should("eq", "/main");
    cy.contains("h2", "Новинки").should("be.visible");
    cy.contains("a", "Hollow Knight: Silksong").click();

    cy.location("pathname").should("eq", "/game");
    cy.contains("h1", "Hollow Knight: Silksong").should("be.visible");
    cy.contains("button", "Оцінити").click();
    cy.contains("Зареєструйтесь спочатку").should("be.visible");
  });

  it("saves a rating for a signed-in user without requiring a live API", () => {
    cy.intercept("GET", "**/ratings/3498", {
      body: { averageRating: null, votesCount: 0, aspectAverages: {} },
    });
    cy.intercept("GET", "**/ratings/me/3498", {
      body: { rating: null },
    });
    cy.intercept("POST", "**/ratings", {
      statusCode: 201,
      body: {},
    });

    cy.visit("/", {
      onBeforeLoad(window) {
        window.localStorage.setItem("userName", "TestPlayer");
        window.localStorage.setItem("descoreToken", "test-token");
      },
    });
    cy.contains("a", "Hollow Knight: Silksong").click();
    cy.contains("button", "Оцінити").click();
    cy.get("#overallScore").type("9");
    cy.contains("button", "Надіслати").click();

    cy.window().should((window) => {
      const ratings = JSON.parse(window.localStorage.getItem("descoreRatings"));
      expect(ratings[0].rating).to.equal(9);
      expect(ratings[0].title).to.equal("Hollow Knight: Silksong");
    });
  });
});
