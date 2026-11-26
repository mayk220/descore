describe("Registration flow", () => {
  it("sends registration details and starts an authenticated session", () => {
    cy.intercept("POST", "**/auth/register", {
      statusCode: 201,
      body: {
        id: 42,
        email: "e2e-player@example.com",
        username: "E2EPlayer",
        avatar: "",
        token: "test-jwt-token",
      },
    }).as("register");

    cy.visit("/main");
    cy.contains("button", "Реєстрація").click();
    cy.get("#email").type("e2e-player@example.com");
    cy.get("#username").type("E2EPlayer");
    cy.get("#password").type("Pass123!");
    cy.contains("button", "Зареєструватися").click();

    cy.wait("@register").then(({ request, response }) => {
      expect(request.body).to.deep.equal({
        email: "e2e-player@example.com",
        username: "E2EPlayer",
        password: "Pass123!",
      });
      expect(response.statusCode).to.equal(201);
    });

    cy.get('[aria-label="Меню профілю"]').should("be.visible");
    cy.window().should((window) => {
      expect(window.localStorage.getItem("userName")).to.equal("E2EPlayer");
      expect(window.localStorage.getItem("userEmail")).to.equal("e2e-player@example.com");
      expect(window.localStorage.getItem("descoreToken")).to.equal("test-jwt-token");
    });
  });

  it("shows a registration error returned by the API", () => {
    cy.intercept("POST", "**/auth/register", {
      statusCode: 409,
      body: { message: "Цей email уже використовується" },
    }).as("register");

    cy.visit("/main");
    cy.contains("button", "Реєстрація").click();
    cy.get("#email").type("existing@example.com");
    cy.get("#username").type("ExistingPlayer");
    cy.get("#password").type("Pass123!");
    cy.contains("button", "Зареєструватися").click();

    cy.wait("@register").its("response.statusCode").should("eq", 409);
    cy.get('[role="alert"]').should("contain.text", "Цей email уже використовується");
    cy.get('[aria-label="Меню профілю"]').should("not.exist");
  });

  it("rejects an empty registration form", () => {
    const alert = cy.stub();
    cy.on("window:alert", alert);
    cy.visit("/main");
    cy.contains("button", "Реєстрація").click();
    cy.contains("button", "Зареєструватися").click();

    cy.wrap(alert).should("have.been.calledWith", "Заповніть усі поля!");
    cy.get('[aria-label="Меню профілю"]').should("not.exist");
  });

  it("rejects an invalid email and a password shorter than six characters", () => {
    const alert = cy.stub();
    cy.on("window:alert", alert);
    cy.intercept("POST", "**/auth/register").as("register");
    cy.visit("/main");
    cy.contains("button", "Реєстрація").click();
    cy.get("#email").type("invalid-email");
    cy.get("#username").type("E2EPlayer");
    cy.get("#password").type("Pass123!");
    cy.contains("button", "Зареєструватися").click();
    cy.get("#email").should(($email) => {
      expect($email[0].validity.typeMismatch).to.equal(true);
    });

    cy.get("#email").clear().type("valid@example.com");
    cy.get("#password").clear().type("123");
    cy.contains("button", "Зареєструватися").click();
    cy.get("#password").should(($password) => {
      expect($password[0].minLength).to.equal(6);
      expect($password[0].value.length).to.be.lessThan($password[0].minLength);
    });
    cy.wrap(alert).should("have.been.calledWith", "Пароль має містити щонайменше 6 символів");
    cy.get("@register.all").should("have.length", 0);
  });

  it("logs in successfully and stores the authenticated session", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 200,
      body: {
        id: 42,
        email: "e2e-player@example.com",
        username: "E2EPlayer",
        avatar: "",
        token: "login-jwt-token",
      },
    }).as("login");

    cy.visit("/main");
    cy.contains("button", "Реєстрація").click();
    cy.contains('[role="tab"]', "Вхід").click();
    cy.get("#email").type("e2e-player@example.com");
    cy.get("#password").type("Pass123!");
    cy.contains("button", "Увійти").click();

    cy.wait("@login").then(({ request, response }) => {
      expect(request.body).to.deep.equal({
        email: "e2e-player@example.com",
        password: "Pass123!",
      });
      expect(response.statusCode).to.equal(200);
    });
    cy.get('[aria-label="Меню профілю"]').should("be.visible");
    cy.window().should((window) => {
      expect(window.localStorage.getItem("userName")).to.equal("E2EPlayer");
      expect(window.localStorage.getItem("descoreToken")).to.equal("login-jwt-token");
    });
  });

  it("shows an API error for an incorrect password", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 401,
      body: { message: "Неправильний email або пароль" },
    }).as("login");

    cy.visit("/main");
    cy.contains("button", "Реєстрація").click();
    cy.contains('[role="tab"]', "Вхід").click();
    cy.get("#email").type("e2e-player@example.com");
    cy.get("#password").type("Wrong123!");
    cy.contains("button", "Увійти").click();

    cy.wait("@login").its("response.statusCode").should("eq", 401);
    cy.get('[role="alert"]').should("contain.text", "Неправильний email або пароль");
    cy.get('[aria-label="Меню профілю"]').should("not.exist");
  });
});
