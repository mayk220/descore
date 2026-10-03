describe("Main page navigation", () => {
  it("opens the Silksong game page from the new releases list", () => {
    cy.visit("/main");
    cy.get("#silksong a").click();
    cy.location("pathname").should("eq", "/game");
  });

  it("saves a rating and overwrites it when the game is rated again", () => {
    cy.visit("/game");
    cy.get(".rate-btn").click();
    cy.get("#overallScore").type("9");
    cy.get("#gameplayScore").type("8");
    cy.get("#storyScore").type("7");
    cy.get("#designScore").type("9");
    cy.get("#musicScore").type("10");
    cy.get("#submitRating").click();

    cy.location("pathname").should("eq", "/game");
    cy.get("#submitRating").should("not.exist");
    cy.get(".myscore .value").should("have.text", "9");
    cy.visit("/profile");
    cy.get(".profile-stats").should("contain.text", "Оцінок ігор: 5");
    cy.visit("/game");
    cy.contains("Оцінка критиків").parent().find(".details-link").click();
    cy.contains("Оцінки аспектів від критиків").should("be.visible");
    cy.get(".details-modal .close").click();
    cy.window().then((window) => {
      const ratings = JSON.parse(window.localStorage.getItem("descoreRatings"));
      cy.wrap(ratings).should("have.length", 1);
      cy.wrap(ratings[0].rating).should("equal", 9);
      cy.wrap(ratings[0].details.Музика).should("equal", 10);
    });

    cy.visit("/game");
    cy.contains("Оцінка користувачів").parent().find(".details-link").click();
    cy.contains("Оцінки аспектів гри").should("be.visible");
    cy.contains("Музика").should("be.visible");
    cy.get(".details-modal .close").click();
    cy.get(".rate-btn").click();
    cy.get("#overallScore").clear().type("6");
    cy.get("#gameplayScore").clear().type("6");
    cy.get("#storyScore").clear().type("6");
    cy.get("#designScore").clear().type("6");
    cy.get("#musicScore").clear().type("6");
    cy.get("#submitRating").click();

    cy.get(".myscore .value").should("have.text", "6");
    cy.window().then((window) => {
      const ratings = JSON.parse(window.localStorage.getItem("descoreRatings"));
      cy.wrap(ratings).should("have.length", 1);
      cy.wrap(ratings[0].rating).should("equal", 6);
      cy.wrap(ratings[0].details.Музика).should("equal", 6);
    });
  });

  it("publishes formatted profile comments", () => {
    cy.visit("/profile");
    cy.get(".comment-editor").type("Мій коментар");
    cy.get(".comment-editor").type("{selectall}");
    cy.get('.comment-tools button[aria-label="Жирний"]').click();
    cy.get(".comment-editor").should("contain.text", "Мій коментар");
    cy.get(".write-btn").click();

    cy.get(".published-comments").should("contain.text", "Мій коментар");
    cy.get(".published-comment-body strong, .published-comment-body b").should(
      "contain.text",
      "Мій коментар",
    );
    cy.get(".offtopic-btn").click().should("have.class", "is-active");
    cy.get(".delete-comment-button").click();
    cy.contains("Видалити?").should("be.visible");
    cy.contains("Видалити?").parent().find("button").first().click();
    cy.get(".published-comment").should("not.exist");
  });

  it("edits and deletes a game rating from the profile", () => {
    cy.visit("/profile");
    cy.get(".history-button").click();
    cy.get(".review-date").should("have.length.at.least", 4);
    cy.get(".review-date").each(($date) => {
      cy.wrap($date.text()).should("match", /^Оцінено /);
    });
    cy.contains("Resident Evil 3")
      .parents(".history-card")
      .within(() => {
        cy.contains("Редагувати оцінку").click();
        cy.get("#profileOverallScore").clear().type("7");
        cy.get("#profile-gameplay-score").clear().type("8");
        cy.get("textarea").first().type("Сильний і динамічний геймплей");
        cy.contains("Зберегти").click();
        cy.contains("Подивитись детально").click();
        cy.contains("Сильний і динамічний геймплей").should("be.visible");
        cy.contains("Видалити оцінку").click();
      });
    cy.contains("Resident Evil 3").should("not.exist");
  });

  it("opens profile actions on hover", () => {
    cy.visit("/main", {
      onBeforeLoad(window) {
        window.localStorage.setItem("userName", "TestUser");
      },
    });
    cy.get(".profile-menu").trigger("mouseover");
    cy.get(".profile-menu-items").should("be.visible");
    cy.get(".profile-menu-items").should("contain.text", "Зайти на профіль");
    cy.get(".profile-menu-items").should("contain.text", "Зайти на оцінки ігор");
    cy.get(".profile-menu-items").should("contain.text", "Вихід");
    cy.contains("Зайти на оцінки ігор").click();
    cy.location("pathname").should("eq", "/profile");
    cy.location("search").should("eq", "?view=ratings");
    cy.contains("Мої оцінки та відгуки").should("be.visible");

    cy.visit("/main");
    cy.get(".profile-menu").trigger("mouseover");
    cy.contains("Вихід").click();
    cy.location("pathname").should("eq", "/main");
    cy.window().its("localStorage.userName").should("not.exist");
  });
});
