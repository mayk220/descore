import { MemoryRouter } from "react-router-dom";
import { mount } from "cypress/react";
import ProfilePage from "../../src/pages/ProfilePage";

describe("ProfilePage", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("publishes sanitized comments and supports off-topic and delete confirmation", () => {
    cy.window().then((window) => window.localStorage.setItem("userName", "Player"));
    mount(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    cy.get('[contenteditable="true"]').invoke(
      "html",
      '<img src=x onerror="alert(1)"><strong onclick="alert(2)">Hello</strong>',
    );
    cy.contains("button", "Оффтоп").click();
    cy.contains("button", "Написати").click();
    cy.contains("strong", "Hello").should("be.visible");
    cy.contains("em", "Оффтоп").should("be.visible");
    cy.window().then((window) => {
      const [comment] = JSON.parse(window.localStorage.getItem("descoreComments"));
      expect(comment.html).to.equal("<strong>Hello</strong>");
      expect(comment.html).not.to.contain("onerror");
    });

    cy.get('button[aria-label="Видалити коментар"]').click();
    cy.contains("button", "Скасувати").click();
    cy.contains("strong", "Hello").should("be.visible");
    cy.get('button[aria-label="Видалити коментар"]').click();
    cy.contains("button", "Так").click();
    cy.contains("strong", "Hello").should("not.exist");
  });

  it("edits profile details and persists the server response", () => {
    cy.window().then((window) => {
      window.localStorage.setItem("userName", "Player");
      window.localStorage.setItem("descoreToken", "token");
    });
    cy.intercept("PATCH", "**/api/auth/me", {
      body: {
        username: "UpdatedPlayer",
        email: "updated@example.com",
        avatar: "",
        token: "new-token",
      },
    }).as("updateProfile");
    mount(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    cy.contains("button", "Редагувати профіль").click();
    cy.get('input:not([type="file"])').first().clear().type("UpdatedPlayer");
    cy.get('input[type="email"]').clear().type("updated@example.com");
    cy.contains("button", "Зберегти зміни").click();
    cy.wait("@updateProfile");
    cy.contains("h2", "UpdatedPlayer").should("be.visible");
    cy.window().then((window) => {
      expect(window.localStorage.getItem("userEmail")).to.equal("updated@example.com");
      expect(window.localStorage.getItem("descoreToken")).to.equal("new-token");
    });
  });

  it("shows, edits, deletes, and favorites rated games", () => {
    cy.window().then((window) => {
      window.localStorage.setItem("userName", "Player");
      window.localStorage.setItem("descoreToken", "token");
    });
    cy.intercept("GET", "**/api/ratings/me", {
      body: {
        ratings: [
          {
            gameId: 3498,
            rating: 9,
            aspects: { gameplay: 9, story: 8, design: 9, music: 8 },
            reviews: { gameplay: "Great" },
          },
        ],
      },
    }).as("getMyRatings");
    cy.intercept("POST", "**/api/ratings", { statusCode: 201, body: {} });
    cy.intercept("DELETE", "**/api/ratings/3498", { statusCode: 204 });
    mount(
      <MemoryRouter initialEntries={["/profile?view=ratings"]}>
        <ProfilePage />
      </MemoryRouter>,
    );

    cy.wait("@getMyRatings");
    cy.contains("article", "Hollow Knight: Silksong").within(() => {
      cy.contains("button", "Подивитись детально").click();
      cy.contains("Great").should("be.visible");
      cy.contains("button", "Редагувати оцінку").click();
      cy.get("#profileOverallScore").clear().type("11");
      cy.contains("button", "Зберегти").click();
      cy.contains("Заповніть загальну оцінку та всі оцінки аспектів").should("be.visible");
      cy.get("#profileOverallScore").clear().type("8");
      cy.contains("button", "Зберегти").click();
      cy.contains("8").should("be.visible");
      cy.get('button[aria-label*="Hollow Knight: Silksong"]').click();
      cy.contains("button", "Видалити оцінку").click();
      cy.contains("Hollow Knight: Silksong").should("not.exist");
    });
  });
});
