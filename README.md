# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# API Reference

Add `https://productservice-1nk8.onrender.com/swagger-ui/index.html#/` to your bookmarks for the full Swagger contract. It exposes every `/api/products/orders/*` route that the app calls, so you can quickly confirm payloads, responses, and auth requirements while building or testing the frontend.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# API Reference

Add `https://productservice-1nk8.onrender.com/swagger-ui/index.html#/` to your bookmarks for the full Swagger contract. It exposes every `/api/products/orders/*` route that the app calls, so you can quickly confirm payloads, responses, and auth requirements while building or testing the frontend.

## Connecting to the real backend

1. Update the proxy target inside `vite.config.ts`:
   ```ts
   const API_GATE_WAY = "https://productservice-1nk8.onrender.com";
   ```
   That lets `axios` requests that start with `/api` be forwarded to the live service during `npm run dev`.
2. When running builds outside of the dev proxy (e.g., `npm run build` or `npm run preview`), set `VITE_API_BASE_URL=https://productservice-1nk8.onrender.com` so `src/api/axios.ts` uses the correct host.
3. Log in through `POST /auth/login` (see Swagger) to get a bearer token; store it as `token` or `auth_token` in `localStorage`/`sessionStorage` so the axios interceptor can attach it automatically.
4. Start the dev server with `npm run dev -- --host 0.0.0.0 --port 5173`, open `http://localhost:5173/admin/orders`, and the Order Management screen now hits the real APIs via `OrderService`.
5. Use the Swagger UI to send requests (list/detail/status/cancel/flag) while watching the UI update, or mock inputs in the "Create New Order" modal to verify request payloads match the backend contract.
