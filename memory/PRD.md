# Ansh's Puzzle World — PRD

## Original Problem Statement
Build a cute Android mobile app: a replica of a "custom photo slide puzzle" game
(ref: com.acmustudio.custompuzzleslide). It's a gift for the user's sister based on
her newborn baby boy named Ansh, using 5 attached baby photos.

## User Choices
- Grid difficulties: **3x3 & 4x4**
- Modes: **Relaxed** (no timer) and **Timed** (countdown)
- Photo source: 5 built-in Ansh photos **+ pick from device gallery**
- Visual vibe: **Soft pastel baby-blue & cream, playful & cute**
- Welcome title: **"Ansh's Puzzle World"**

## Architecture
- Frontend: Expo Router (stack nav) — `index` (Welcome) → `setup` → `game`
- Backend: FastAPI + MongoDB (best-score persistence)
- Fonts: Fredoka (display) + Nunito (text) via expo-font
- Photos: user's real photos optimized to 900x900 in `assets/puzzle_photos/`

## User Personas
- Primary: the user's sister (casual player, sentimental gift recipient)
- Secondary: family members playing with baby Ansh's photos

## Core Requirements (static)
- Sliding-tile puzzle (tap tile adjacent to empty slot to slide)
- Solvable shuffle, move counter, timer, win detection
- Relaxed (count up) vs Timed (count down, game-over at 0)
- Photo picker with 5 built-ins + gallery (with permission handling)

## Implemented (2026-06)
- [x] Welcome screen with floating photo hero + Play Now
- [x] Setup: photo picker (horizontal scroll), grid & mode selection, gallery pick w/ permission + Open Settings fallback
- [x] Game board: reanimated tile sliding, moves counter, timer, shuffle/restart
- [x] Win overlay with reanimated confetti + stats; Timed game-over overlay
- [x] Haptics (tile slide, select, win/lose)
- [x] Backend: POST /api/scores, GET /api/scores/best, GET /api/scores/recent
- [x] Full-flow tested (backend 8/8, frontend navigation & mechanics)

## Backlog
- P1: Show "Best" moves/time on setup & win screens (fetch getBestScore)
- P1: Preview-full-image "peek" button during play
- P2: More grid sizes (5x5), sound effects, unlockable photo frames
- P2: Local best-score cache via storage util for offline display

## Next Tasks
- Wire getBestScore into the win overlay to celebrate new records
- Optional: add a gentle background music toggle
