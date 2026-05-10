# @nazrah/mobile

React Native + Expo companion mobile app for Nazrah Al Alam clients.

## Features

- **Splash + Auth**: Phone OTP & Biometric login.
- **Home**: Active rentals and quick actions.
- **Equipment Catalog**: Offline caching via React Query.
- **Quote Builder**: Simple form to start quote requests.
- **Site Survey**: Camera capture and photo upload to AI gateway.
- **Notifications**: Expo Push notifications integration.
- **Chat Assistant**: AI helper for general inquiries.
- **Bilingual & RTL**: English and Arabic supported with UI flipping.

## Getting Started

1. Install dependencies from the monorepo root:

   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm --filter @nazrah/mobile start
   ```

## EAS Build & Submit

This project is configured for Expo Application Services (EAS).

### Building

To build the app for both platforms (Preview profile):

```bash
pnpm --filter @nazrah/mobile build:preview
```

To build for Production:

```bash
pnpm --filter @nazrah/mobile build:prod
```

### Submitting to Stores

After a successful production build, you can submit to the App Store and Google Play:

**iOS (App Store):**

```bash
pnpm --filter @nazrah/mobile submit:ios
```

**Android (Google Play):**

```bash
pnpm --filter @nazrah/mobile submit:android
```

## Structure

- `app/`: Expo Router screens and navigation setup.
- `src/components/`: Reusable UI components.
- `src/stores/`: Zustand state management (Auth, UI, Cart).
- `src/lib/`: Utilities (Supabase, React Query, i18n, SSE streaming).
- `src/theme/`: Design tokens (colors, typography).
