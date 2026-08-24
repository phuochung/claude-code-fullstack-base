# base-nextjs-dashboard

**An admin dashboard starter you can clone and ship** — Next.js 16, React 19,
TypeScript, and Tailwind CSS v4, with authentication, i18n, dark mode, and
ready-made CRUD pages already wired to a real API contract.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

> 🔌 **Pairs with [base-nestjs-backend](../base-nestjs-backend)** — the NestJS API
> in this same workspace that this dashboard speaks to out of the box: auth,
> blogs, categories, tags, customers, custom fields, users, file storage, and
> statistics.
>
> This service is one folder of a workspace. See the
> [root README](../../README.md) for the whole picture, and
> [docs/tickets/G01](../../docs/tickets/G01-get-it-running.md) for a setup that
> checks its own work.

## Highlights

- **Next.js 16 App Router** with React 19 Server Components and TypeScript
  throughout
- **Authentication built in** — httpOnly cookie sessions, sign-in page, and a
  [middleware](src/middleware.ts) that protects every route and redirects back
  after login
- **Ready-made CRUD pages** — blogs (with CKEditor 5 rich text and image
  upload), categories, tags, customers, custom field definitions, users, and
  profile
- **Typed API layer** — one service module per resource with automatic auth
  token handling and a shared [`ApiException`](src/api/base.ts)
- **Internationalization** — English + Vietnamese via `next-intl`, translations
  in [`src/locales/`](src/locales/)
- **Dark / light mode** — theme context with persisted preference
- **Tailwind CSS v4** — configured via CSS (`globals.css`), no config file
  needed
- **UI toolkit included** — ApexCharts, React Select, React Dropzone, Flatpickr
  date picker, toast notifications, image viewer, and HTML sanitized with
  DOMPurify before rendering

## Quick Start

Prerequisites: Node.js 22+.

```bash
cd src/base-nextjs-dashboard
npm install
cp .env.example .env.local
npm run dev
```

The dashboard runs at [http://localhost:3001](http://localhost:3001).

It needs an API to talk to. The fastest way is the companion backend:

```bash
cd ../base-nestjs-backend
docker compose up                          # API + MongoDB at localhost:8080
docker compose exec api node dist/seed.js  # create the first admin account
```

Then sign in at `http://localhost:3001/signin` with the seeded admin account.

> Use `npm install --legacy-peer-deps` if you hit a peer-dependency error.

## Starting your own product

Renaming is a **workspace-level** job, not a per-service one — `AUTH_COOKIE_NAME`
here has to change together with the backend's `COOKIE_NAME`, or login appears to
succeed and every request after it is anonymous. The workspace root has both the
checklist and a ticket that executes it:

- [SETUP.md](../../SETUP.md) — every template default that must change
- [docs/tickets/G02](../../docs/tickets/G02-make-it-yours.md) — hand it to Claude
  Code and it does the above

## Configuration

Copy the example file and configure:

```bash
cp .env.example .env.local
```

```env
# Embedded at BUILD TIME — rebuild after changing them
NEXT_PUBLIC_API_URL=http://localhost:8080/api   # your backend API, /api prefix included
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3002   # public site linked from previews
```

The `NEXT_PUBLIC_` prefix is required for variables read in the browser, and
they are inlined at build time — a production build must be rebuilt to pick up
new values.

## Available Scripts

- `npm run dev` — development server on port **3001**
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint over `src/`, clean
- `npm test` — Vitest; tests are colocated `*.test.ts` files
- `npm run type-check` — TypeScript check, no emit

## Project Structure

```
base-nextjs-dashboard/
├── public/
│   └── images/                    # Static images (error pages, favicon)
├── src/
│   ├── api/
│   │   ├── base.ts                # Request helper, auth token, ApiException
│   │   └── services/              # One module per resource:
│   │                              #   auth, blog, category, tag, customer,
│   │                              #   custom-field-definition, storage,
│   │                              #   user, statistic
│   ├── app/
│   │   ├── (admin)/               # Protected admin routes
│   │   │   ├── page.tsx           # Dashboard home
│   │   │   └── (others-pages)/    # blogs, categories, tags, customers,
│   │   │                          # custom-field-definitions, users, profile
│   │   └── (full-width-pages)/
│   │       └── (auth)/signin/     # Sign-in page
│   ├── components/                # auth, common, form, header, home,
│   │                              # profile, tables, ui, user-profile
│   ├── constants/                 # auth (cookie name), common, toast
│   ├── context/                   # Theme, Sidebar, Toast, I18n, ImageViewer
│   ├── hooks/                     # useAsyncAction, useAuth, useGoBack,
│   │                              # useListPage, useModal, useSearchKeyword
│   ├── icons/                     # SVG icon components
│   ├── layout/                    # AppHeader, AppSidebar, Backdrop, Logo
│   ├── locales/                   # en.json, vi.json
│   ├── types/                     # blog, category, custom-field, customer,
│   │                              # tag, user
│   ├── utils/                     # blog, dateTime, query helpers
│   ├── i18n.ts                    # next-intl configuration
│   └── middleware.ts              # Route protection
├── .env.example
├── Dockerfile
├── eslint.config.mjs
├── next.config.ts
└── tsconfig.json
```

## Development Workflow

### Adding a New Page

1. Create a route in `src/app/(admin)/(others-pages)/`:

   ```bash
   mkdir -p "src/app/(admin)/(others-pages)/products"
   touch "src/app/(admin)/(others-pages)/products/page.tsx"
   ```

2. Add the page component:

   ```typescript
   export default function ProductsPage() {
     return <div>Products</div>;
   }
   ```

3. Add it to the sidebar in [`src/layout/AppSidebar.tsx`](src/layout/AppSidebar.tsx)

The middleware protects it automatically — every route outside the auth pages
requires a session.

### Adding a New API Service

1. Create a service in `src/api/services/` following the existing modules:

   ```typescript
   // src/api/services/product.ts
   import { apiClient } from '@/api/base';
   import { Product } from '@/types/product';

   export const productService = {
     getProducts: (): Promise<Product[]> =>
       apiClient.get<Product[]>('/admin/products'),

     createProduct: (data: Partial<Product>): Promise<Product> =>
       apiClient.post<Product>('/admin/products', data),
   };
   ```

2. Define the types in `src/types/product.ts`

3. Call it through [`useAsyncAction`](src/hooks/useAsyncAction.ts) for loading
   and error handling, or [`useListPage`](src/hooks/useListPage.ts) for a full
   paginated list page.

### Adding Translations

1. Add the keys to both [`src/locales/en.json`](src/locales/en.json) and
   [`src/locales/vi.json`](src/locales/vi.json)

2. Use them in components:

   ```typescript
   import { useTranslations } from 'next-intl';

   const t = useTranslations('common');
   return <h1>{t('welcome')}</h1>;
   ```

### Working with Contexts

```typescript
// Theme
import { useTheme } from '@/context/ThemeContext';
const { theme, toggleTheme } = useTheme();

// Toast notifications
import { useToast } from '@/context/ToastContext';
const { showToast } = useToast();
showToast('Success!', 'success');
```

## Building for Production

```bash
npm run build
npm run start
```

A multi-stage [Dockerfile](Dockerfile) is included, plus a
[cloudbuild.yaml](cloudbuild.yaml) example for Google Cloud Build.

## Support

If you find this project helpful, please consider giving it a ⭐ on GitHub.
Your support helps us continue developing and maintaining this template.

## License

MIT — see [LICENSE](LICENSE). Free to use, modify, and distribute;
just keep the copyright notice.

The UI is derived in part from
[TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard) (MIT).

**One dependency is not MIT:** the rich-text editor,
[CKEditor 5](https://ckeditor.com/ckeditor-5/), is used under its free
GPL-2.0-or-later license (`licenseKey: "GPL"`). Running the dashboard —
internally or as a hosted service — is unaffected. But if you *distribute a
built copy* (ship it to a customer, sell an on-prem product), the bundle
contains GPL code and MIT terms alone do not cover it: comply with the GPL,
buy a [CKEditor commercial license](https://ckeditor.com/pricing/), or swap
the editor out.
