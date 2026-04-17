# Frontend Agent Guidelines

These instructions apply to all work under this folder.

## Build And Validation

- Install: npm install --legacy-peer-deps
- Start dev server: npm start
- Run Android: npm run android
- Run iOS: npm run ios
- Run web: npm run web
- Lint: npm run lint
- Typecheck: npx tsc --noEmit
- Tests are not configured yet in package scripts. Do not invent or reference a test command.

## Architecture Boundaries

- Use feature-based modular architecture under src.
- Keep app as the routing layer only (Expo Router pages).
- Keep UI components dumb: no business logic in components.
- Put reusable logic in hooks.
- Put global state in Context providers only.
- Route all API calls through the services layer.
- Avoid prop drilling; prefer context plus hooks.

## Folder Responsibilities

- app: routes and navigation composition only.
- src/components: presentational and reusable UI.
- src/hooks: reusable domain logic.
- src/contexts: global app state.
- src/services: API and external integration layer.
- src/theme: tokens, schemes, and theme adapters.
- src/utils: pure helpers with no UI concerns.

## TypeScript And Naming

- Use strict typing and avoid any.
- Use interface for reusable object shapes.
- Use type for unions and utility compositions.
- Reusable shared types belong in src/types.
- Component names: PascalCase.
- Hook names: useCamelCase.
- Service names: CamelCaseService.
- Context file names: SomethingContext.

## Theme Rules

- Do not hardcode colors in components.
- Always consume themed values via useTheme.
- Support light, dark, and system modes through ThemeContext.
- Keep token definitions centralized in src/theme.

## API And Environment Rules

- Do not call fetch or axios from components.
- Keep request setup and auth token behavior in service abstractions.
- Use EXPO_PUBLIC_ prefixed environment variables for runtime client access.
- Respect existing API base URL fallback behavior in src/services/api.ts.

## Known Pitfalls

- In tsx files, generic arrow functions can parse as JSX. Prefer async <T,>(...) => over async <T>(...) =>.
- On web, Firebase may throw missing default app errors if startup auth listeners run before initialization. Guard listener startup paths.
- In this Windows Expo workspace, npm install may need --legacy-peer-deps.
- For React Native style typing, use literal fontWeight values such as '500' or '700' when required by StyleSheet types.

## Link References

- Architecture and coding standards: AGENT-INSTRUCTION.md
- Theme system details: THEME-COLOR.md
- Frontend overview and structure: README.md
- Screen behavior docs: docs/HOME_FEED_TAB.md, docs/EXPLORE_TAB.md, docs/PROFILE_TAB.md, docs/REELS_TAB.md, docs/TRACKING_SCREEN.md, docs/NOTIFICATIONS_SCREEN.md
