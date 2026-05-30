# Skills, Tech Stack & Project Architecture

## Core Technologies
- **Frontend (`apps/frontend`):** Next.js (App Router), React, TypeScript. Dodatkowo mocny nacisk na grafikę 3D (Three.js / React Three Fiber).
- **Backend (`apps/backend`):** NestJS, TypeScript.
- **Infrastruktura:** Docker (docker-compose).

## Coding Philosophy & Conventions
- **DRY (Don't Repeat Yourself):** Absolutny priorytet. Szukaj możliwości reużycia kodu wewnątrz frontendu, ale także pamiętaj o współdzieleniu typów między `apps/frontend` a `apps/backend`, aby unikać redundancji.
- **Naming Convention:** Maksymalnie krótkie, zwięzłe, ale w pełni czytelne nazwy zmiennych i funkcji.
- **Typing:** Strict TypeScript. Brak `any`.

## Repository Structure (Monorepo)
- Główny podział to `apps/frontend` oraz `apps/backend`.
- We frontendzie kluczowe obszary to `app/[locale]/...` (poszczególne mini-projekty) oraz dedykowane foldery dla eksperymentów z Three.js (np. `three/examples/...`).