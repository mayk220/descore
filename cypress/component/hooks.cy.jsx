import { useState } from "react";
import { mount } from "cypress/react";
import { useApi } from "../../src/hooks/useApi";
import { useAuth } from "../../src/hooks/useAuth";

function ApiHarness() {
  const { request, isLoading, error } = useApi();
  const [result, setResult] = useState("");

  async function load(path) {
    try {
      const response = await request(path, { headers: { Authorization: "Bearer token" } });
      setResult(response ? JSON.stringify(response) : "No content");
    } catch (requestError) {
      setResult(requestError.message);
    }
  }

  return (
    <>
      <button onClick={() => load("/ok")}>Load</button>
      <button onClick={() => load("/empty")}>Load empty</button>
      <button onClick={() => load("/fail")}>Load failure</button>
      <output>{isLoading ? "Loading" : result}</output>
      {error && <p role="alert">{error.message}</p>}
    </>
  );
}

function AuthHarness() {
  const { user, isAuthenticated, register, login, logout } = useAuth();

  return (
    <>
      <button
        onClick={() =>
          register({ email: "player@example.com", username: "Player", password: "pass123!" })
        }
      >
        Register
      </button>
      <button onClick={() => login({ email: "player@example.com", password: "pass123!" })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <output>{isAuthenticated ? user.username : "Guest"}</output>
    </>
  );
}

describe("API and authentication hooks", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("sends JSON requests, handles empty responses, and exposes API errors", () => {
    cy.intercept("GET", "**/api/ok", {
      body: { message: "Loaded" },
    }).as("ok");
    cy.intercept("GET", "**/api/empty", { statusCode: 204 }).as("empty");
    cy.intercept("GET", "**/api/fail", {
      statusCode: 503,
      body: { message: "Service unavailable" },
    }).as("fail");
    mount(<ApiHarness />);

    cy.contains("button", "Load").click();
    cy.wait("@ok").then(({ request }) => {
      expect(request.headers["content-type"]).to.contain("application/json");
      expect(request.headers.authorization).to.equal("Bearer token");
    });
    cy.contains("Loaded").should("be.visible");
    cy.contains("button", "Load empty").click();
    cy.wait("@empty");
    cy.contains("No content").should("be.visible");
    cy.contains("button", "Load failure").click();
    cy.wait("@fail");
    cy.contains("Service unavailable").should("be.visible");
    cy.get('[role="alert"]').should("contain.text", "Service unavailable");
  });

  it("registers, logs in, and clears stored credentials on logout", () => {
    cy.intercept("POST", "**/api/auth/register", {
      body: { username: "Player", email: "player@example.com", token: "register-token" },
    });
    cy.intercept("POST", "**/api/auth/login", {
      body: { username: "Player", email: "player@example.com", token: "login-token" },
    });
    mount(<AuthHarness />);

    cy.contains("button", "Register").click();
    cy.contains("Player").should("be.visible");
    cy.window().then((window) => {
      expect(window.localStorage.getItem("descoreToken")).to.equal("register-token");
    });
    cy.contains("button", "Login").click();
    cy.window().then((window) => {
      expect(window.localStorage.getItem("descoreToken")).to.equal("login-token");
    });
    cy.contains("button", "Logout").click();
    cy.contains("Guest").should("be.visible");
    cy.window().then((window) => {
      expect(window.localStorage.getItem("descoreUser")).to.be.null;
      expect(window.localStorage.getItem("userName")).to.be.null;
      expect(window.localStorage.getItem("userEmail")).to.be.null;
      expect(window.localStorage.getItem("descoreToken")).to.be.null;
    });
  });
});
