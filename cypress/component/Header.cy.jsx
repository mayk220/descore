import { MemoryRouter, useLocation } from "react-router-dom";
import { mount } from "cypress/react";
import Header from "../../src/components/Header";

function CurrentPath() {
  const location = useLocation();
  return <output>{location.pathname + location.search}</output>;
}

describe("Header", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("focuses search and opens the registration callback", () => {
    const onRegisterClick = cy.stub();
    mount(
      <MemoryRouter>
        <Header isRegistered={false} onRegisterClick={onRegisterClick} />
      </MemoryRouter>,
    );

    cy.get('input[placeholder="Search"]').as("search");
    cy.get('i[class*="search-icon"]').click({ force: true });
    cy.get("@search").should("have.focus");
    cy.contains("button", "Реєстрація").click();
    cy.wrap(onRegisterClick).should("have.been.calledOnce");
  });

  it("navigates from the profile menu and clears the session on logout", () => {
    cy.window().then((window) => {
      window.localStorage.setItem("userName", "Player");
      window.localStorage.setItem("userEmail", "player@example.com");
      window.localStorage.setItem("descoreToken", "token");
      window.localStorage.setItem("descoreUser", "{}");
    });
    const onLoggedOut = cy.stub();

    mount(
      <MemoryRouter initialEntries={["/main"]}>
        <Header isRegistered onLoggedOut={onLoggedOut} />
        <CurrentPath />
      </MemoryRouter>,
    );

    cy.get('button[aria-label="Меню профілю"]').focus();
    cy.contains("Зайти на оцінки ігор").click();
    cy.get("output").should("have.text", "/profile?view=ratings");
    cy.get('button[aria-label="Меню профілю"]').focus();
    cy.contains("button", "Вихід").click();
    cy.wrap(onLoggedOut).should("have.been.calledOnce");
    cy.window().then((window) => {
      expect(window.localStorage.getItem("userName")).to.be.null;
      expect(window.localStorage.getItem("descoreToken")).to.be.null;
      expect(window.localStorage.getItem("descoreUser")).to.be.null;
    });
  });
});
