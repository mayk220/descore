import { MemoryRouter } from "react-router-dom";
import { mount } from "cypress/react";
import App from "../../src/App";
import MainPage from "../../src/pages/MainPage";

describe("App routes", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("redirects the root route to the main page", () => {
    mount(<App />);

    cy.contains("h2", "Новинки").should("be.visible");
    cy.location("pathname").should("eq", "/main");
  });

  it("redirects guests away from the protected profile route", () => {
    cy.window().then((window) => window.history.replaceState({}, "", "/profile"));
    mount(<App />);

    cy.contains("h2", "Новинки").should("be.visible");
    cy.location("pathname").should("eq", "/main");
  });

  it("allows registered users to open their profile", () => {
    cy.window().then((window) => {
      window.history.replaceState({}, "", "/profile");
      window.localStorage.setItem("userName", "Player");
      window.localStorage.setItem("descoreToken", "token");
    });
    cy.intercept("GET", "**/api/ratings/me", { body: { ratings: [] } });
    mount(<App />);

    cy.contains("button", "Редагувати профіль").should("be.visible");
  });

  it("renders the main page game and editorial collections", () => {
    mount(
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>,
    );

    cy.contains("Hollow Knight: Silksong").should("be.visible");
    cy.get("img").should("have.length", 10);
    cy.contains("Game Of The Year 2025").should("be.visible");
    cy.contains("button", "Реєстрація").click();
    cy.contains("Реєстрація в Descore").should("be.visible");
  });
});
