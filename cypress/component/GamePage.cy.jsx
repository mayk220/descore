import { MemoryRouter } from "react-router-dom";
import { mount } from "cypress/react";
import GamePage from "../../src/pages/GamePage";

describe("GamePage", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept("GET", "**/api/ratings/3498", {
      body: { averageRating: 8.5, votesCount: 2, aspectAverages: {} },
    }).as("getRatings");
  });

  it("prompts unregistered users and opens critic and user details", () => {
    mount(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );
    cy.wait("@getRatings");

    cy.contains("button", "Оцінити").click();
    cy.contains("Зареєструйтесь спочатку").should("be.visible");
    cy.contains("button", "Глянути детально").first().click();
    cy.contains("Оцінки аспектів від критиків").should("be.visible");
    cy.contains("9.4/10").should("be.visible");
    cy.get('button[aria-label="Закрити оцінки критиків"]').click();
    cy.get('button[class*="details-link"]').eq(1).click();
    cy.contains("Оцінки аспектів гри").should("be.visible");
    cy.contains("8.5").should("be.visible");
  });

  it("validates and saves a rating to the API and local history", () => {
    cy.window().then((window) => {
      window.localStorage.setItem("userName", "Player");
      window.localStorage.setItem("descoreToken", "token");
    });
    cy.intercept("GET", "**/api/ratings/me/3498", {
      body: { rating: null },
    });
    cy.intercept("POST", "**/api/ratings", {
      statusCode: 201,
      body: {},
    }).as("saveRating");

    mount(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );
    cy.wait("@getRatings");
    cy.contains("button", "Оцінити").click();
    cy.contains("button", "Надіслати").click();
    cy.contains("Введіть оцінку від 1 до 10").should("be.visible");
    cy.get("#overallScore").clear().type("9");
    cy.contains("button", "Надіслати").click();
    cy.wait("@saveRating").its("request.body.rating").should("eq", 9);
    cy.wait("@getRatings");
    cy.window().then((window) => {
      const ratings = JSON.parse(window.localStorage.getItem("descoreRatings"));
      expect(ratings[0].rating).to.equal(9);
      expect(ratings[0].title).to.equal("Hollow Knight: Silksong");
    });
  });
});
