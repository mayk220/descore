# Descore

React-застосунок для перегляду оцінок і матеріалів про відеоігри.

## Архітектура

Проєкт використовує React з Vite та `react-router-dom`. `App.jsx` налаштовує маршрути для головної сторінки, гри й профілю, а сторінки розділені за каталогом `pages/`. Повторно використовувані елементи винесені в `components/`, стилі сторінок зберігаються в `styles/`. Для роботи з обліковими записами та оцінками додано окремий Node.js/Express-бекенд у каталозі `backend/`.

## Стек

- React 19 + React DOM
- Vite
- Cypress end-to-end and Component Testing + Istanbul coverage
- ESLint
- Prettier
- Husky + lint-staged для Git hooks

## Звіт про доданий бекенд

Бекенд реалізовано як окремий Express-сервер. Він:

- запускається на `http://localhost:3000` і приймає JSON-запити з React;
- надає `POST /auth/register`, `POST /auth/login` і `PATCH /auth/me` для реєстрації, входу та оновлення профілю;
- захищає приватні маршрути за допомогою JWT-токенів;
- хешує паролі через `bcryptjs`, тому пароль не зберігається у відкритому вигляді;
- зберігає користувачів та оцінки у `backend/data/users.json` і `backend/data/ratings.json`;
- надає `POST /ratings`, `GET /ratings/me`, `GET /ratings/me/:gameId` та `GET /ratings/:gameId`;
- перевіряє вхідні дані та повертає зрозумілі HTTP-помилки для некоректних запитів.

Приклад підключення маршруту оцінок і перевірки авторизації:

```js
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/ratings", ratingRoutes);

router.post("/", requireAuth, (req, res) => {
  const gameId = Number(req.body.gameId);
  const rating = Number(req.body.rating);

  if (!Number.isInteger(gameId) || gameId < 1 || rating < 1 || rating > 10) {
    return res.status(400).json({ message: "Некоректні дані оцінки" });
  }

  // Оцінка зберігається для користувача з req.user.userId.
  return res.json({ message: "Оцінку збережено" });
});
```

Для запуску бекенду:

```bash
cd backend
npm install
npm run dev
```

React звертається до API через `VITE_API_URL` у `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Структура

```text
src/
  components/       Повторно використовувані React-компоненти
  pages/            Основні сторінки застосунку
  styles/           Стилі окремих сторінок
  App.jsx           Маршрутизація сторінок
  main.jsx          Точка входу React
backend/
  middleware/       JWT middleware для захищених запитів
  routes/           Маршрути авторизації та оцінок
  data/             JSON-файли локального сховища
  server.js         Express-сервер і підключення API
cypress/
  component/        Cypress-компонентні тести
  support/          Налаштування Cypress і React mount
eslint.config.js    Конфігурація ESLint
.prettierrc         Правила форматування
.husky/pre-commit   Перевірки перед commit
```

## Команди

```bash
npm run dev                 # локальна розробка
npm run lint                # ESLint
npm run format              # форматування Prettier
npm run format:check        # перевірка форматування
npm run build               # production-збірка
npm run test:e2e            # E2E-тести Cypress
npm run test:e2e:open       # інтерактивний режим E2E-тестів
npm run test:component      # компонентні тести Cypress і звіт coverage
npm run test:component:open # інтерактивний режим Cypress
```

Для E2E-тестів спочатку запустіть застосунок командою `npm run dev:test` в одному терміналі, а потім виконайте `npm run test:e2e` або `npm run test:e2e:open` в іншому. Тести використовують адресу `http://localhost:4173` і підмінюють відповіді API, тому тестовий акаунт, база даних або запущений бекенд не потрібні. Перевіряються переходи між сторінками, реєстрація та вхід, захист профілю, оцінки й відгуки, улюблені ігри, коментарі та помилки API.

Звіт code coverage генерується в `coverage/index.html`.

Перед кожним commit Husky запускає lint-staged: ESLint і Prettier перевіряють змінені файли.
