import { mount } from "cypress/react";
import Header from "./Header";

describe("Header", () => {
  it("focuses the search field when the search icon is clicked", () => {
    mount(<Header isRegistered={false} />);

    cy.get(".search-icon").click({ force: true });
    cy.get(".search-input").should("have.focus");
  });

  it("shows the registration action for a guest", () => {
    const onAccountClick = cy.stub().as("onAccountClick");

    mount(<Header isRegistered={false} onAccountClick={onAccountClick} />);
    cy.contains("Реєстрація").click();

    cy.get("@onAccountClick").should("have.been.calledOnce");
  });
});
