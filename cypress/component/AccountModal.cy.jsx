import { mount } from "cypress/react";
import AccountModal from "../../src/components/AccountModal";

describe("AccountModal", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("validates registration fields and switches to login mode", () => {
    const alert = cy.stub();
    cy.on("window:alert", alert);
    mount(<AccountModal isOpen onClose={cy.stub()} />);

    cy.contains("button", "Зареєструватися").click();
    cy.wrap(alert).should("have.been.calledWith", "Заповніть усі поля!");
    cy.contains('[role="tab"]', "Вхід").click();
    cy.contains("h2", "Вхід у Descore").should("be.visible");
    cy.get("#username").should("not.exist");
    cy.contains("button", "Реєстрація").click();
    cy.get("#username").should("be.visible");
  });

  it("registers successfully and reports server errors", () => {
    const onClose = cy.stub();
    const onRegistered = cy.stub();
    cy.intercept("POST", "**/api/auth/register", {
      statusCode: 201,
      body: { username: "Player1", email: "player@example.com", token: "secret-token" },
    }).as("register");
    mount(<AccountModal isOpen onClose={onClose} onRegistered={onRegistered} />);

    cy.get("#email").type("player@example.com");
    cy.get("#username").type("Player1");
    cy.get("#password").type("pass123!");
    cy.contains("button", "Зареєструватися").click();
    cy.wait("@register");
    cy.wrap(onRegistered).should("have.been.calledOnce");
    cy.wrap(onClose).should("have.been.calledOnce");
    cy.window().then((window) => {
      expect(window.localStorage.getItem("userName")).to.equal("Player1");
      expect(window.localStorage.getItem("descoreToken")).to.equal("secret-token");
    });

    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 401,
      body: { message: "Невірний пароль" },
    });
    mount(<AccountModal isOpen onClose={cy.stub()} mode="login" />);
    cy.get("#email").type("player@example.com");
    cy.get("#password").type("wrong123!");
    cy.contains("button", "Увійти").click();
    cy.contains("Невірний пароль").should("be.visible");
  });
});
