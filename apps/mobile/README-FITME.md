# FitMe Mobile

React Native client built with Expo SDK 57 and Expo Router.

## Requirements

- Node.js 20.19.4 or newer
- pnpm 10.30.3 (managed by Corepack)
- iOS Simulator, Android Emulator, or an Expo development build

## Run

From the repository root:

```bash
corepack enable
pnpm install
cp apps/mobile/.env.example apps/mobile/.env.local
pnpm --filter @fitness-me/mobile ios
# or: pnpm --filter @fitness-me/mobile android
```

Set `EXPO_PUBLIC_API_URL` to an address reachable from the target device. `localhost` works for the iOS Simulator; Android Emulator commonly uses `http://10.0.2.2:3001`. A physical device needs the computer's LAN address.

JWT access and refresh tokens are stored with Expo SecureStore. The client refreshes an expired access token once and signs out if refresh fails.

## Implemented routes

- `(auth)/login`, `(auth)/register`
- `(tabs)/index` dashboard
- `(tabs)/workouts` and `workouts/[id]` set logger
- `(tabs)/exercises`
- `(tabs)/metrics`
