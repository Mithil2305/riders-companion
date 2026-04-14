# 🎨 THEME SYSTEM (DARK / LIGHT MODE) — PRODUCTION GRADE

## GOAL
Implement a scalable, bug-free theming system with:
- System default (device theme)
- Manual override (user preference)
- Zero UI inconsistency
- Centralized color + typography control

---

# 🌗 THEME ARCHITECTURE

## RULES (STRICT)
- No hardcoded colors anywhere
- Always use `useTheme()` hook
- Theme must be globally accessible via Context
- Support:
  - "light"
  - "dark"
  - "system" (default)

---

# 📁 FILE STRUCTURE (EXTEND EXISTING)

src/
├── theme/
│   ├── colors.ts
│   ├── light.ts
│   ├── dark.ts
│   ├── index.ts
├── contexts/
│   └── ThemeContext.tsx
├── hooks/
│   └── useTheme.ts

---

# 🎨 COLOR SYSTEM (FROM PROJECT)

## Base Palette (MANDATORY)

```ts
// src/theme/colors.ts

export const BaseColors = {
  primary: '#D84040',
  primaryDark: '#A31D1D',

  backgroundDark: '#181515',
  surfaceDark: '#2B2525',

  textPrimaryDark: '#F8F2DE',
  textSecondaryDark: '#ECDCBF',

  success: '#4CAF50',
  danger: '#D84040',

  white: '#FFFFFF',
  black: '#000000'
};