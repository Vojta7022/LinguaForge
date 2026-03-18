# CLAUDE.md

## Project: LinguaForge

AI-powered language learning mobile app for intermediate-to-advanced learners (B2-C2). Like Duolingo but harder — dynamically generates exercises using free AI APIs. Targets people who've finished Duolingo and want more challenging content.

## Tech Stack

- **Framework**: React Native + Expo SDK 52+
- **Language**: TypeScript (strict mode)
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS for RN)
- **State**: Zustand (9 store slices)
- **Local DB**: expo-sqlite (offline source of truth)
- **Remote DB**: Supabase (sync-only, auth + user data)
- **AI Primary**: Groq API free tier (LLaMA 3.3 70B)
- **AI Fallback**: Gemini API free tier (gemini-2.0-flash)
- **Validation**: Zod (all AI responses validated before use)
- **Animations**: React Native Reanimated + Lottie
- **Audio/TTS**: expo-speech, expo-av
- **Haptics**: expo-haptics
- **Build**: EAS Build

## Architecture

Three-layer: **UI → Zustand stores → Services**

```
┌─────────────┐
│   UI Layer   │  Expo Router screens + exercise components
├─────────────┤
│   Stores     │  9 Zustand slices (auth, user, lesson, exercise,
│              │  progress, srs, gamification, settings, sync)
├─────────────┤
│  Services    │  AI engine, SRS, sync, database repos
├─────────────┤
│  Data Layer  │  SQLite (local) ←→ Supabase (remote sync)
└─────────────┘
```

### AI Engine Priority Queue
Request flow: **Groq → Gemini fallback → SQLite cache → stale cache**
- 2000ms minimum gap between Groq requests
- 4000ms minimum gap between Gemini requests
- Three-tier caching: exact prompt-hash hit → batch over-generation of 10 → background WiFi prefetch
- Expected: 5–15 Groq calls/user/day (vs. 14,400/day free limit)

### Offline Strategy
- SQLite is the source of truth, never Supabase
- Exercises NEVER sync to Supabase (biggest payload win)
- Offline mutations queue in sync_queue table
- Conflict resolution: MAX for progress counts, UNION for streak dates

## Code Standards

- All files TypeScript: `.tsx` for components, `.ts` for logic
- Functional components only, with hooks
- Use NativeWind `className` for styling (not StyleSheet unless performance-critical)
- Absolute imports from `@/` mapping to `src/`
- Keep components under 200 lines — extract into smaller components
- All AI API calls go through `src/services/ai/`
- All database operations go through `src/repositories/`
- All state management in `src/stores/`
- Every AI response validated with Zod before rendering
- No hardcoded API keys — use `.env` for dev, expo-secure-store for production

## File Structure

```
app/
  _layout.tsx                    # Root layout with auth check
  (auth)/
    login.tsx
    register.tsx
  (onboarding)/
    _layout.tsx
    welcome.tsx
    select-native.tsx
    select-target.tsx
    placement-test.tsx
    daily-goal.tsx
    ready.tsx
  (tabs)/
    _layout.tsx                  # Bottom tab bar (Home, Practice, Review, Profile)
    index.tsx                    # Home — lesson tree/path
    practice.tsx                 # Weak areas, grammar focus, challenge mode
    review.tsx                   # SRS review queue, flashcards
    profile.tsx                  # Stats, level progress, settings
  lesson/
    [id].tsx                     # Fullscreen exercise flow (modal)
  lesson-complete/
    [id].tsx                     # Summary screen after lesson

src/
  components/
    ui/                          # Button, Card, ProgressBar, XPBadge, StreakCounter,
                                 # ExerciseHeader, BottomSheet, AnimatedFeedback
    exercises/                   # One component per exercise type:
      FillBlankExercise.tsx
      SentenceReorderExercise.tsx
      TranslateExercise.tsx
      MultipleChoiceExercise.tsx
      ErrorCorrectionExercise.tsx
      ClozeExercise.tsx
      IdiomMatchExercise.tsx
      ContextualVocabExercise.tsx
      ListeningExercise.tsx
      ExerciseShell.tsx          # Shared wrapper (progress bar, feedback, continue)
  services/
    ai/
      groqClient.ts              # Groq API wrapper with rate limiting
      geminiClient.ts            # Gemini API wrapper (fallback)
      exerciseGenerator.ts       # Orchestrator with priority queue + fallback
      promptTemplates.ts         # Prompt templates per exercise type + difficulty
      difficultyScaler.ts        # CEFR level → prompt parameters mapping
      responseSchemas.ts         # Zod schemas for all AI response shapes
    database/
      db.ts                      # SQLite initialization
      migrations.ts              # Schema migrations
    srs/
      spacedRepetition.ts        # SM-2 algorithm implementation
    sync/
      syncManager.ts             # Supabase ↔ SQLite sync with conflict resolution
  stores/
    authStore.ts
    userStore.ts
    lessonStore.ts
    exerciseStore.ts
    progressStore.ts
    srsStore.ts
    gamificationStore.ts
    settingsStore.ts
    syncStore.ts
  repositories/
    userRepository.ts
    lessonRepository.ts
    exerciseRepository.ts
    progressRepository.ts
    srsRepository.ts
    cacheRepository.ts
    syncQueueRepository.ts
  types/
    user.ts
    exercise.ts                  # Type-discriminated ExerciseContent union
    lesson.ts
    progress.ts
    srs.ts
    gamification.ts
    api.ts                       # API request/response types
  theme/
    colors.ts                    # Deep teal primary #0D9488, orange accent #F97316
    typography.ts
    spacing.ts
    shadows.ts
  hooks/
    useExercise.ts
    useLesson.ts
    useSRS.ts
    useNetwork.ts
    useAIGeneration.ts
  utils/
    xpCalculator.ts
    streakManager.ts
    exerciseHelpers.ts
    formatters.ts
  assets/
    lottie/                      # correct.json, incorrect.json, levelup.json, etc.
    sounds/                      # correct.mp3, incorrect.mp3, complete.mp3
    images/                      # flags, icons, onboarding illustrations
```

## Data Models (SQLite Tables)

### users
id, display_name, native_language, target_language, current_level (B1-C2), xp, streak_count, streak_last_date, daily_goal, created_at

### lessons
id, unit_id, language, topic, level, order_index, title, description, icon_name, is_unlocked, is_completed

### exercises
id, lesson_id, type (FILL_BLANK | SENTENCE_REORDER | TRANSLATE | MULTIPLE_CHOICE | ERROR_CORRECTION | CLOZE | IDIOM_MATCH | CONTEXTUAL_VOCAB | LISTENING), content (JSON), difficulty_score (1-100), language, grammar_point, vocab_topic, times_shown, times_correct, is_cached, generated_at

### user_progress
id, user_id, exercise_id, is_correct, answer_given, time_spent_ms, attempted_at

### spaced_repetition
id, user_id, exercise_id, next_review_date, interval_days, ease_factor (SM-2), repetitions

### exercise_cache_meta
id, prompt_hash, language, level, topic, exercise_type, exercise_count, cached_at, is_stale

### sync_queue
id, table_name, record_id, operation (INSERT | UPDATE | DELETE), payload (JSON), created_at, synced_at

## Exercise Types & Difficulty

### Types
1. **FILL_BLANK**: Sentence with blank, word bank with distractors
2. **SENTENCE_REORDER**: Scrambled words → correct sentence
3. **TRANSLATE**: Source → target language (contextual)
4. **MULTIPLE_CHOICE**: 4-option vocabulary/grammar questions
5. **ERROR_CORRECTION**: Find and fix the grammatical error
6. **CLOZE**: Paragraph with multiple blanks
7. **IDIOM_MATCH**: Match idioms to meanings
8. **CONTEXTUAL_VOCAB**: Choose word fitting the context
9. **LISTENING**: TTS playback + comprehension questions

### CEFR Difficulty Scaling
- **B1**: Common vocabulary, simple tenses, straightforward context
- **B2**: Abstract topics, conditional, subjunctive, phrasal verbs
- **C1**: Nuanced vocabulary, complex grammar, idiomatic expressions
- **C2**: Literary language, subtle distinctions, rare constructions

### Lesson Topics (harder than Duolingo)
Subjunctive Mood Mastery, Idiomatic Expressions, Register & Formality, Complex Relative Clauses, Hypothesis & Speculation, Academic Writing Patterns, Nuanced Synonyms, Cultural References & Wordplay, Passive Voice Variations, Discourse Markers

## Gamification

### XP System
- Correct answer: +10 XP (base)
- Streak bonus: +5 per consecutive correct
- Perfect lesson: +50 bonus
- Daily goal: +25
- Difficulty multiplier: B2=1.2x, C1=1.5x, C2=2x

### Streaks
- Consecutive days tracked
- 1 free freeze per week
- Milestones: 7, 30, 100, 365 days

## Development Phases

- **Phase 0** (Wk 1–2): Auth + navigation + SQLite + Supabase setup
- **Phase 1 MVP** (Wk 3–6): AI engine + 3 exercise types (FillBlank, MultipleChoice, Translate) + lesson flow + onboarding + gamification
- **Phase 2 v1.0** (Wk 7–12): All 9 exercise types + SRS + offline sync → App Store
- **Phase 3 v2.0** (Wk 13+): Social features, push notifications, server-side API proxy

## Key Decisions
- SQLite offline-first (exercises never sync to Supabase)
- SM-2 over FSRS (no training data needed for new users)
- Exercises always batched 10 per API call regardless of need
- Conflict resolution: MAX for progress counts, UNION for streak dates
- API keys in client for dev; server-side proxy (Supabase Edge Function) before public launch

## Commands
```bash
npx expo start           # Dev server
npx expo start -c        # Dev server (clear cache)
eas build --profile development --platform ios
eas build --profile development --platform android
```
