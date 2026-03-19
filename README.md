# 🔥 LinguaForge

**AI-powered language learning for people who outgrew Duolingo.**

LinguaForge dynamically generates exercises at B2–C2 difficulty using free AI APIs (Groq + Gemini), so you never run out of challenging content. It's built for intermediate-to-advanced learners who want harder vocabulary, nuanced grammar, and real-world language — not another "the cat sits on the mat" app.

---

## ✨ Features

**AI-Generated Exercises** — Every exercise is created on-the-fly by LLaMA 3.3 70B (via Groq) or Gemini Flash, targeting your exact CEFR level. No static content, no running out of lessons.

**6 Exercise Types**
- **Fill in the Blank** — contextual vocabulary and grammar in real sentences
- **Multiple Choice** — nuanced questions with plausible distractors
- **Translate** — full sentence translation with multiple accepted answers
- **Word Match** — pair words with their translations (dictionary-accurate)
- **Word Bank Translate** — arrange word tiles to build translations
- **Sentence Reorder** — unscramble words into correct target-language order

**Smart Difficulty Scaling** — Exercises adapt across four CEFR levels:
- **B1** — Everyday vocabulary, common tenses
- **B2** — Abstract topics, conditionals, phrasal verbs
- **C1** — Idiomatic expressions, formal vs. informal register
- **C2** — Literary language, rare constructions, cultural references

**Gamification** — XP system with difficulty multipliers, daily goals, streaks with freeze protection, and milestone achievements.

**Offline-First** — Exercises are pre-generated and cached in SQLite. No internet? No problem — you keep learning from your cache.

**Dual AI Fallback** — Groq is the primary engine. If it's unavailable, Gemini takes over. If both fail, cached exercises are served. You always have something to practice.

**Infinite Lessons** — Complete all available lessons and new ones are auto-generated from curated topic pools. The path never ends.

**Placement Test** — AI-generated proficiency assessment during onboarding sets your starting level accurately.

**Smart Explanations** — Get wrong? Tap "Explain why" for an AI-generated breakdown in your native language explaining exactly what went wrong and why.

**Guest Mode** — Start learning immediately without creating an account. Sign up later to sync across devices.

---

## 📱 Screenshots

> *Coming soon — add your own screenshots to `/docs/screenshots/`*

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 52 |
| Language | TypeScript (strict) |
| Routing | Expo Router (file-based) |
| Styling | NativeWind (Tailwind CSS) |
| State | Zustand (9 store slices) |
| Local DB | expo-sqlite |
| Remote DB | Supabase (auth + sync) |
| AI Primary | Groq API — LLaMA 3.3 70B |
| AI Fallback | Google Gemini API — gemini-2.0-flash |
| Validation | Zod (all AI responses) |
| Animations | React Native Reanimated + Lottie |
| Auth | Supabase Auth (email, Google, Apple) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npx expo` — no global install needed)
- iOS Simulator (Xcode) or Android Emulator, or [Expo Go](https://expo.dev/go) on your phone
- API keys (all free):
  - [Groq](https://console.groq.com) — sign up, create API key
  - [Google Gemini](https://aistudio.google.com) — get API key
  - [Supabase](https://supabase.com) — create project, get URL + anon key

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/linguaforge.git
cd linguaforge

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your API keys to .env.local
# EXPO_PUBLIC_GROQ_API_KEY=gsk_...
# EXPO_PUBLIC_GEMINI_API_KEY=AI...
# EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Start the dev server
npx expo start
```

### Running on Your Device

**Expo Go (fastest):**
1. Install Expo Go on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Run `npx expo start`
3. Scan the QR code with your camera (iOS) or Expo Go (Android)

**Development Build (full native module support):**
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform ios   # or android
```

**Simulators:**
```bash
npx expo start --ios      # Launches iOS Simulator
npx expo start --android  # Launches Android Emulator
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers** and enable:
   - Email (enabled by default)
   - Google (requires Google Cloud OAuth client ID)
   - Apple (requires Apple Developer account)
3. Copy the project URL and anon key to your `.env.local`

---

## 📁 Project Structure

```
app/                              # Expo Router screens
  (auth)/                         # Login, register
  (onboarding)/                   # Welcome → language select → placement → ready
  (tabs)/                         # Home, Practice, Review, Profile
  lesson/[id].tsx                 # Fullscreen exercise flow
  lesson-complete/[id].tsx        # Results screen

src/
  components/
    ui/                           # Button, Card, ProgressBar, etc.
    exercises/                    # One component per exercise type + ExerciseShell
  services/
    ai/                           # Groq client, Gemini client, exercise generator,
                                  # prompt templates, Zod schemas, difficulty scaler
    database/                     # SQLite init + migrations
    srs/                          # SM-2 spaced repetition algorithm
    sync/                         # Supabase ↔ SQLite sync manager
  stores/                         # 9 Zustand stores
  repositories/                   # SQLite query layer (1 per table)
  types/                          # TypeScript interfaces
  theme/                          # Colors, typography, spacing
  hooks/                          # useExercise, useLesson, useNetwork, etc.
  utils/                          # XP calculator, streak manager, helpers
```

---

## 🧠 How the AI Engine Works

```
User requests exercises
        │
        ▼
┌─ Cache hit? ──── YES ──→ Return cached exercises (instant)
│       │
│      NO
│       │
│       ▼
│   Try Groq API (LLaMA 3.3 70B)
│       │
│   Success? ── YES ──→ Validate with Zod → Cache → Return
│       │
│      NO (rate limit / network error)
│       │
│       ▼
│   Try Gemini API (gemini-2.0-flash)
│       │
│   Success? ── YES ──→ Validate with Zod → Cache → Return
│       │
│      NO
│       │
│       ▼
│   Serve stale cache (if available)
│       │
│      NO cache at all
│       │
│       ▼
└── Show friendly error + retry button
```

Every AI response is validated with Zod schemas before reaching the UI. Exercises where the correct answer isn't in the options, or where translations are malformed, are automatically discarded and regenerated.

---

## 🌍 Supported Languages

Currently supported as both native and target languages:

Arabic, Chinese (Simplified), Czech, Dutch, English, French, German, Hindi, Italian, Japanese, Korean, Polish, Portuguese, Russian, Spanish, Swedish, Turkish

Adding a new language requires only adding its code, name, and flag emoji to `src/types/user.ts`. The AI handles exercise generation for any language pair.

---

## 🎮 Gamification

| Action | XP Earned |
|--------|-----------|
| Correct answer | +10 (base) |
| Consecutive correct | +5 per streak |
| Perfect lesson (100%) | +50 bonus |
| Daily goal reached | +25 (once/day) |
| **Difficulty multiplier** | B1: 1.0x · B2: 1.2x · C1: 1.5x · C2: 2.0x |

Streaks track consecutive days. One free streak freeze per week (replenishes Monday).

---

## 📋 Roadmap

- [x] **Phase 0** — Project setup, navigation, SQLite, Supabase
- [x] **Phase 1** — AI engine, 6 exercise types, gamification, onboarding, guest mode, social auth
- [ ] **Phase 2** — Remaining exercise types (Error Correction, Cloze, Idiom Match, Contextual Vocab, Listening), full SRS reviews, offline sync
- [ ] **Phase 3** — Server-side API proxy, push notifications, social features, leaderboards
- [ ] **Phase 4** — App Store / Play Store release

---

## 🔑 API Free Tier Limits

| Provider | Free Tier | Enough For |
|----------|-----------|------------|
| Groq | ~30 RPM, ~500K tokens/day | ~5,000 exercises/day |
| Gemini | 15 RPM, ~1M tokens/day | ~5,000 exercises/day |
| Supabase | 50K MAU, 500MB DB | Initial launch |

The dual-API strategy with aggressive caching means the free tiers comfortably support ~100+ daily active users.

---

## 🤝 Contributing

Contributions welcome! Areas where help is especially appreciated:

- **New exercise types** — See `src/components/exercises/` for the pattern
- **Language-specific prompt rules** — See `languageSpecificAddendum()` in `promptTemplates.ts`
- **UI/UX polish** — Animations, transitions, accessibility
- **Spaced repetition** — Improving the SM-2 implementation

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Exercise generation powered by [Groq](https://groq.com) and [Google Gemini](https://ai.google.dev)
- Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
- Auth and backend by [Supabase](https://supabase.com)
- Inspired by the gap that Duolingo leaves for advanced learners

---

<p align="center">
  <strong>Stop reviewing "the cat drinks milk." Start learning real language.</strong>
</p>