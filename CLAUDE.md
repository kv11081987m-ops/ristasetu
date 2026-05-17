# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build to dist/
npm run lint      # Run ESLint
npm run preview   # Preview the production build locally
```

There are no tests in this project.

## Environment Setup

Copy `.env.example` to `.env` and fill in all values before running:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

## Architecture

**RistaSetu** is a matrimony (matchmaking) web app built with React 19 + Vite + Tailwind CSS v4, using Firebase as its backend and Cloudinary for image storage.

### Context Layer (the real state management)

There are two parallel context providers that serve different concerns — understanding their split is essential:

- **`AuthContext`** (`src/context/AuthContext.jsx`): Wraps Firebase Auth. Tracks `currentUser` (Firebase auth object), `userProfile` (Firestore `users/{uid}` document), and `isProfileComplete` (boolean flag stored on the Firestore doc). This is the source of truth for who is logged in.

- **`AppContext`** (`src/context/AppContext.jsx`): The main data layer. Opens Firestore `onSnapshot` listeners for `users`, `interests`, `shortlists`, and `chats` collections. Exposes all CRUD actions (`sendInterest`, `acceptInterest`, `declineInterest`, `toggleShortlist`, `sendMessage`). Also contains a legacy `currentUser` that duplicates `AuthContext` — prefer `AuthContext`'s `currentUser` and `userProfile` in components that need the Firebase UID.

- **`NotificationContext`** / **`ToastContext`**: Utility contexts for in-app notifications and toast messages.

Provider nesting order in `main.jsx`: `AuthProvider > AppProvider > NotificationProvider > ToastProvider`.

### Auth & Routing Flow

Authentication uses **Firebase Phone Auth with OTP** (`src/pages/Login.jsx`). Phone numbers default to the `+91` prefix if not prefixed with `+`.

Route guards in `App.jsx`:
- `PublicRoute`: Redirects logged-in users → `/complete-profile` if profile incomplete, → `/dashboard` if complete.
- `ProtectedRoute`: Redirects unauthenticated → `/splash`. Allows incomplete profiles to view `/dashboard` in read-only mode.
- `AdminRoute` (`src/components/AdminRoute.jsx`): Checks `userProfile.role === 'admin'` from Firestore; redirects non-admins to `/dashboard`.

### User Registration Flow

1. User lands on `/splash`, clicks **Create Profile** → `/register`  
2. `src/Register.jsx` (note: at `src/Register.jsx`, not `src/pages/Register.jsx` — the pages version uses the old `AppContext` flow) handles email/password signup via Firebase Auth.
3. After auth, user is redirected to `/complete-profile` (`src/pages/CompleteProfile.jsx`), which collects profile fields and uploads a photo to Cloudinary, then writes the full profile to Firestore `users/{uid}` with `isProfileComplete: true`.

### Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | One doc per user, keyed by Firebase UID. Fields: `name`, `age`, `gender`, `religion`, `caste`, `community`, `city`, `state`, `occupation`/`profession`, `about`, `photoUrl`, `isVerified`, `kycStatus`, `isProfileComplete`, `role`. |
| `interests` | Interest requests. Fields: `senderId`, `receiverId`, `status` (`pending`/`accepted`/`declined`), `createdAt`. Accepting one auto-creates a `chats` doc. |
| `shortlists` | Saved profiles. Fields: `userId`, `profileId`, `createdAt`. |
| `chats` | Chat threads. Fields: `participants` (array of UIDs), `messages` (array of `{id, senderId, text, timestamp}`). |

### Match Scoring

`src/utils/matchUtils.js` `calculateMatchPercentage(user, profile)` scores matches 0–100 with a minimum floor of 60 applied via `Math.max(60, ...)`. Factors: Age proximity (30%), Religion (25%), Location (20%), Community/Caste (15%), Profession (10%). Dashboard sorts profiles by this score descending.

### Profile Completeness

`src/utils/calculateCompleteness.js` computes a score shown via `src/components/CompletenessMeter.jsx` on the Dashboard. Incomplete profiles can browse but all interactive actions (send interest, shortlist) are disabled.

### Admin

Admin access requires `role: 'admin'` on the Firestore user doc. The admin dashboard (`src/pages/AdminDashboard.jsx`) allows toggling `isVerified` / `kycStatus` on user documents. The `VerifiedBadge` component (`src/components/VerifiedBadge.jsx`) renders based on the `isVerified` field.

### Image Uploads

Cloudinary is used directly from the browser (unsigned upload preset). The upload logic appears in both `src/components/Upload.jsx` (standalone component) and inline in `src/pages/CompleteProfile.jsx`. Both POST to `https://api.cloudinary.com/v1_1/${VITE_CLOUDINARY_CLOUD_NAME}/image/upload`.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. Custom CSS variables for the color theme (`--primary`, `--secondary`, `--surface`, `--border`, `--text-light`) are defined in `src/App.css`. Utility class names like `form-input`, `form-label`, `form-select`, `form-textarea`, `page-transition`, `app-layout`, `app-main` are defined there as well.
