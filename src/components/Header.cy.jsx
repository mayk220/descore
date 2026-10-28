import { mount } from "cypress/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import Header from "./Header";

function LocationPath() {
  const location = useLocation();
  return <span data-testid="location-path">{location.pathname}</span>;
}

describe("Header", () => {
  it("focuses the search field when the search icon is clicked", () => {
    mount(
      <MemoryRouter>
        <Header isRegistered={false} />
      </MemoryRouter>,
    );

    cy.get('i[class*="search-icon"]').click({ force: true });
    cy.get('input[class*="search-input"]').should("have.focus");
  });

  it("shows the registration action for a guest", () => {
    const onAccountClick = cy.stub().as("onAccountClick");

    mount(
      <MemoryRouter>
        <Header isRegistered={false} onAccountClick={onAccountClick} />
      </MemoryRouter>,
    );
    cy.contains("Реєстрація").click();

    cy.get("@onAccountClick").should("have.been.calledOnce");
  });

  it("navigates to the profile from the profile menu", () => {
    mount(
      <MemoryRouter initialEntries={["/main"]}>
        <Header isRegistered />
        <LocationPath />
      </MemoryRouter>,
    );

    cy.get('div[class*="profile-menu"]').first().trigger("mouseover", { force: true });
    cy.contains("Зайти на профіль").click();
    cy.get("[data-testid=location-path]").should("have.text", "/profile");
  });

  it("navigates to the main page when the logo is clicked", () => {
    mount(
      <MemoryRouter initialEntries={["/profile"]}>
        <Header isRegistered={false} />
        <LocationPath />
      </MemoryRouter>,
    );

    cy.get('a[class*="logo"]').click();
    cy.get("[data-testid=location-path]").should("have.text", "/main");
  });
});
