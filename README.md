<<<<<<< HEAD
# descore
=======
# Descore

React-застосунок для перегляду оцінок і матеріалів про відеоігри.

## Архітектура

Проєкт використовує React з Vite без додаткового фреймворку. `App.jsx` виконує просту маршрутизацію за `window.location.pathname`, а сторінки розділені за каталогом `pages/`. Повторно використовувані елементи винесені в `components/`, стилі сторінок зберігаються в `styles/`.

## Стек

- React 19 + React DOM
- Vite
- ESLint
- Prettier
- Cypress component tests і E2E tests
- Husky + lint-staged для Git hooks

## Структура

```text
src/
  components/       Повторно використовувані React-компоненти та component-тести
  pages/            Основні сторінки застосунку
  styles/           Стилі окремих сторінок
  App.jsx           Маршрутизація сторінок
  main.jsx          Точка входу React
cypress/
  e2e/              End-to-end сценарії
  support/          Конфігурація Cypress
eslint.config.js    Конфігурація ESLint
cypress.config.js   Конфігурація Cypress
.prettierrc         Правила форматування
.husky/pre-commit   Перевірки перед commit
```

## Команди

```bash
npm run dev          # локальна розробка
npm run lint         # ESLint
npm run format       # форматування Prettier
npm run format:check # перевірка форматування
npm test             # component + E2E тести
npm run build        # production-збірка
```

Перед кожним commit Husky запускає lint-staged: ESLint і Prettier перевіряють змінені файли.
>>>>>>> c6dd1dd (додав файли у lab3)
