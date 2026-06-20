import type { ExerciseType } from '@/types/exercise';
import type { LessonDefinition, LessonKind } from '@/types/lesson';
import type { CEFRLevel, SupportedLanguage } from '@/types/user';
import { LANGUAGE_NAMES } from '@/types/user';
import { getLevelInstruction, getScoreRange } from './difficultyScaler';

// ─── Language-specific addendum ────────────────────────────────────────────

/**
 * Returns language-specific grammar and usage rules to append to the system
 * prompt. Add a new entry here to support additional languages.
 */
function languageSpecificAddendum(language: SupportedLanguage): string {
  const rules: Partial<Record<SupportedLanguage, string>> = {
    cs: `
CZECH-SPECIFIC RULES (apply to every exercise):
- Czech has 7 grammatical cases (nominative, genitive, dative, accusative, vocative, locative, instrumental). Always use the case required by the sentence structure.
- In vocabulary lists (word_bank, options, WORD_MATCH pairs) always list nouns/adjectives in NOMINATIVE singular unless the exercise specifically tests a different case.
- Czech does NOT use articles. Never include or expect "a", "an", or "the" equivalents.
- Verbal aspect is critical: use imperfective for ongoing/habitual actions, perfective for completed actions. The correct aspect must match the context (e.g. "psát" vs "napsat", "dělat" vs "udělat").
- Czech word order is flexible and communicatively driven (topic-comment structure). In TRANSLATE exercises, accept multiple valid word orders in acceptable_translations.
- Watch for false friends with Slovak: while many words are shared, some have subtly different register or frequency. Never produce Slovak-specific forms (e.g. use "jít" not "ísť", "mít" not "mať", "být" not "byť").
- Beware of words that are false friends with English: "eventuálně" = possibly (not "eventually"), "aktuálně" = currently (not "actually"), "ordinální" = ordinal (not "ordinary").`,
  };
  return rules[language] ?? '';
}

export type ExerciseFocus = 'vocabulary' | 'grammar' | 'mixed';

export const SYSTEM_PROMPT = `You are an expert language teacher specialising in CEFR B1–C2 instruction for intermediate-to-advanced adult learners.

Your exercises go well beyond beginner content: you focus on nuanced vocabulary, idiomatic expressions, register awareness, and real-world usage that simple language apps do not cover.

Rules you must follow without exception:
1. Respond with ONLY valid JSON. No markdown, no code fences, no explanatory text outside the JSON.
2. Every sentence must sound like authentic, natural language — not a textbook example.
3. VOCABULARY vs GRAMMAR balance: 70% of exercises must focus on VOCABULARY (word meanings, collocations, synonyms, which word fits the context). Only 30% should test grammar rules directly.
4. Each exercise must test a distinct vocabulary item or grammar point — no repetition within a batch.
5. Contexts must reflect real-world usage: news articles, academic papers, literature, professional communication, everyday adult conversation.
6. grammar_hint and explanation fields must be genuinely educational — explain the rule or meaning, not just restate the answer.
7. Avoid obscure or overly academic vocabulary unless generating C2-level content.
8. ABSOLUTE RULE — CORRECT ANSWER IN CHOICES: The correct_answer, correct option, or correct translation tiles MUST appear exactly as provided in the word_bank, options array, or translated_words list. Before finalising your response, verify for every exercise that the correct answer is present in the choices. If it is not, fix it before responding.
9. NATURAL TRANSLATIONS: Never translate word-by-word. Translations must sound natural to a native speaker of the target language. Use the idiomatic equivalent, not a literal gloss. Example: "Tengo hambre" → "I'm hungry" (NOT "I have hunger").`;

// ─── Focus instruction helper ─────────────────────────────────────────────

function focusInstruction(focus: ExerciseFocus): string {
  if (focus === 'vocabulary') {
    return 'FOCUS: ALL exercises must test VOCABULARY — word meanings, which word fits the context, synonym/antonym distinctions, collocations, register. Do not test grammar conjugations.';
  }
  if (focus === 'grammar') {
    return 'FOCUS: ALL exercises must test GRAMMAR — verb conjugations, tenses, moods, agreement, sentence structure, word order.';
  }
  return 'FOCUS: Approximately 70% vocabulary (word meaning, synonyms, collocations) and 30% grammar (conjugations, tenses, moods). Prefer vocabulary.';
}

export interface LessonBlueprint {
  count: number;
  focus: ExerciseFocus;
  sequence: ExerciseType[];
}

const LESSON_BLUEPRINTS: Record<LessonKind, LessonBlueprint> = {
  new_vocabulary: {
    count: 8,
    focus: 'vocabulary',
    sequence: [
      'WORD_MATCH',
      'MULTIPLE_CHOICE',
      'WORD_BANK_TRANSLATE',
      'WORD_BANK_TRANSLATE',
      'FILL_BLANK',
      'MULTIPLE_CHOICE',
      'SENTENCE_REORDER',
      'TRANSLATE',
    ],
  },
  new_grammar: {
    count: 8,
    focus: 'grammar',
    sequence: [
      'MULTIPLE_CHOICE',
      'FILL_BLANK',
      'FILL_BLANK',
      'SENTENCE_REORDER',
      'WORD_BANK_TRANSLATE',
      'FILL_BLANK',
      'TRANSLATE',
      'MULTIPLE_CHOICE',
    ],
  },
  skill_practice: {
    count: 8,
    focus: 'mixed',
    sequence: [
      'MULTIPLE_CHOICE',
      'WORD_MATCH',
      'IDIOM_MATCH',
      'WORD_BANK_TRANSLATE',
      'SENTENCE_REORDER',
      'MULTIPLE_CHOICE',
      'TRANSLATE',
      'CONTEXTUAL_VOCAB',
    ],
  },
  review: {
    count: 8,
    focus: 'mixed',
    sequence: [
      'MULTIPLE_CHOICE',
      'ERROR_CORRECTION',
      'FILL_BLANK',
      'CLOZE',
      'SENTENCE_REORDER',
      'MULTIPLE_CHOICE',
      'ERROR_CORRECTION',
      'TRANSLATE',
    ],
  },
  listening: {
    count: 6,
    focus: 'vocabulary' as ExerciseFocus,
    sequence: [
      'LISTENING',
      'MULTIPLE_CHOICE',
      'LISTENING',
      'FILL_BLANK',
      'LISTENING',
      'TRANSLATE',
    ] as ExerciseType[],
  },
};

export function getLessonBlueprint(kind: LessonKind): LessonBlueprint {
  return LESSON_BLUEPRINTS[kind];
}

// ─── Per-type prompt builders ──────────────────────────────────────────────

function fillBlankPrompt(
  lang: string,
  nativeLang: string,
  level: CEFRLevel,
  topic: string,
  count: number,
  focus: ExerciseFocus,
): string {
  const [minScore, maxScore] = getScoreRange(level);
  return `Generate ${count} fill-in-the-blank exercises in ${lang} for a ${nativeLang}-speaking learner at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

${focusInstruction(focus)}

Prefer testing VOCABULARY in context over grammar conjugations: e.g., test whether the learner knows the right word for a concept rather than the right verb form.

Each exercise has a sentence with a blank (___). Include exactly 4 items in word_bank: the correct answer plus 3 distractors.

CRITICAL — distractors must be clearly wrong, not ambiguous alternatives:
- If testing vocabulary, make distractors from a different semantic field or with a different nuance.
- If testing grammar, make distractors use the wrong tense, mood, or agreement.
- Each distractor must have a specific, explainable reason it doesn't fit.
- Provide "distractor_reasons": an object mapping each distractor word to one sentence explaining why it's wrong.

BLANK RULE: The correct answer word must NOT appear anywhere else in the visible sentence text (only in the blank). Before finalising, verify the answer word is not already present in the rest of the sentence.

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "FILL_BLANK",
      "sentence": "Es crucial que el gobierno ___ medidas urgentes para reducir la contaminacion.",
      "word_bank": ["tome", "toma", "tomara", "tomo"],
      "correct_answer": "tome",
      "acceptable_answers": ["tome"],
      "grammar_hint": "After 'es crucial que', use the present subjunctive, not the indicative.",
      "distractor_reasons": {
        "toma": "Present indicative — subjunctive triggers require the subjunctive mood.",
        "tomara": "Future tense — use present subjunctive after nominal clause triggers.",
        "tomo": "Simple past (preterite) — the action has not happened yet."
      },
      "difficulty_score": 58,
      "grammar_point": "present subjunctive in nominal clauses",
      "vocab_topic": "environment and policy"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- All ${count} exercises must be on different vocabulary items or grammar points
- word_bank must always have exactly 4 items (correct answer included), randomly ordered
- acceptable_answers may include regional or stylistic variants of the correct answer
- distractor_reasons: include a key for EVERY distractor (not the correct answer)
- grammar_hint: one or two sentences explaining the rule or meaning, not the answer
- VERIFY: correct_answer must be one of the items in word_bank before submitting
- Do NOT use the example sentence above in your output`;
}

function multipleChoicePrompt(
  lang: string,
  nativeLang: string,
  level: CEFRLevel,
  topic: string,
  count: number,
  focus: ExerciseFocus,
): string {
  const [minScore, maxScore] = getScoreRange(level);
  return `Generate ${count} multiple-choice exercises in ${lang} for a ${nativeLang}-speaking learner at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

${focusInstruction(focus)}

Primarily test VOCABULARY: word meanings, synonym/antonym selection, which word fits the context, collocations. Only occasionally test grammar rules.

Each exercise has exactly 4 options. Exactly ONE option must be unambiguously correct. The other three must be definitively wrong for a specific, explainable reason.

Provide "why_wrong": an object mapping each WRONG option's text to one sentence explaining why it's wrong.

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "MULTIPLE_CHOICE",
      "question": "Which word best completes this sentence? 'The committee reached a ___ after hours of debate.'",
      "options": ["consensus", "consent", "concession", "conjecture"],
      "correct_index": 0,
      "explanation": "'Consensus' means a general agreement reached by a group. The others are false friends or unrelated.",
      "why_wrong": {
        "consent": "Means individual permission, not a group decision.",
        "concession": "Means giving something up, not reaching agreement.",
        "conjecture": "Means speculation or guesswork — opposite of a firm conclusion."
      },
      "difficulty_score": 62,
      "grammar_point": "near-synonym distinction",
      "vocab_topic": "formal discussion and negotiation"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- correct_index: 0, 1, 2, or 3 — vary it across exercises (do not always put the answer at index 0)
- options: exactly 4 distinct strings
- why_wrong: keys must be the exact text of the 3 wrong options
- explanation: explain why the correct answer is right and why distractors fail
- All ${count} exercises must test different vocabulary items or grammar concepts
- Do NOT use the example above in your output`;
}

function translatePrompt(
  lang: string,
  nativeLang: string,
  level: CEFRLevel,
  topic: string,
  count: number,
): string {
  const [minScore, maxScore] = getScoreRange(level);
  return `Generate ${count} translation exercises for a ${nativeLang}-speaking learner translating INTO ${lang} at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

Each exercise provides a sentence in ${nativeLang} that the learner must translate into ${lang}.

NATURALNESS RULE: Translations must be natural and idiomatic in ${lang}, exactly as a native ${lang} speaker would say it. NEVER translate word-by-word — use the natural equivalent. Consider the specific grammar and idiom patterns of ${lang}. For example: "I'm hungry" in ${lang} is how a native speaker says it, not a literal word-for-word gloss.

For "acceptable_translations": provide 3-4 accepted translations including formal/informal variants, different valid word orders, and common contractions. The first entry is the most natural answer.

For "key_words": list 2-4 essential words or short phrases that MUST appear (in some form) in any correct answer.

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "TRANSLATE",
      "source_text": "It is vital that all employees be informed of the new policy before it takes effect.",
      "source_language": "en",
      "reference_translation": "Es fundamental que todos los empleados sean informados de la nueva politica antes de que entre en vigor.",
      "acceptable_translations": [
        "Es fundamental que todos los empleados esten informados de la nueva politica antes de que entre en vigor.",
        "Es vital que se informe a todos los empleados de la nueva politica antes de que entre en vigor.",
        "Es esencial informar a todos los empleados sobre la nueva politica antes de que entre en vigor."
      ],
      "key_words": ["empleados", "politica", "informados"],
      "context_note": "The English subjunctive 'be informed' maps to Spanish subjunctive 'sean/esten informados'.",
      "difficulty_score": 68,
      "grammar_point": "passive subjunctive in nominal clauses",
      "vocab_topic": "workplace communication"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- source_language: ISO 639-1 code for ${nativeLang}
- acceptable_translations: at minimum 2, ideally 3-4 valid alternatives
- key_words: 2-4 words that are non-negotiable in any correct answer
- context_note: note on the tricky grammar or vocabulary
- All ${count} exercises must test different constructions
- Do NOT use the example above in your output`;
}

function wordMatchPrompt(
  lang: string,
  nativeLang: string,
  level: CEFRLevel,
  topic: string,
  count: number,
): string {
  const [minScore, maxScore] = getScoreRange(level);
  return `Generate ${count} word-matching exercises pairing ${lang} vocabulary with ${nativeLang} translations at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

Each exercise contains EXACTLY 5 word pairs. The pairs MUST satisfy ALL of the following:

VOCABULARY RULES — apply before finalising:
1. UNAMBIGUOUS MATCH: Each ${lang} word must have one clear primary ${nativeLang} translation. Avoid polysemous words (words with multiple common meanings) unless the context pins down the meaning.
2. DISTINCT SEMANTIC FIELDS: The 5 words within one exercise must come from different semantic sub-areas of the topic. Do NOT cluster synonyms or near-synonyms together (e.g. do not include both "imprescindible" and "esencial" in the same exercise).
3. NO SHARED TRANSLATIONS: No two ${lang} words may share the same ${nativeLang} translation or near-synonym translation.
4. HIGH-FREQUENCY: Choose words learners genuinely encounter at ${level} level — not obscure specialised terms.
5. VERIFY COUNT: Count to confirm there are exactly 5 pairs before responding.

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "WORD_MATCH",
      "pairs": [
        { "target": "imprescindible", "native": "essential" },
        { "target": "conllevar", "native": "to entail" },
        { "target": "pautas", "native": "guidelines" },
        { "target": "reivindicar", "native": "to demand" },
        { "target": "efimero", "native": "ephemeral" }
      ],
      "difficulty_score": 64,
      "grammar_point": null,
      "vocab_topic": "${topic}"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- Each exercise MUST have EXACTLY 5 pairs — not 4, not 6
- Target: individual words or very short phrases (not full sentences)
- Native: single clear translation — one word or short phrase
- No duplicate target words or native translations within an exercise
- All ${count} exercises must cover different vocabulary sets
- Do NOT use the example pairs above in your output`;
}

function wordBankTranslatePrompt(
  lang: string,
  nativeLang: string,
  level: CEFRLevel,
  topic: string,
  count: number,
): string {
  const [minScore, maxScore] = getScoreRange(level);
  return `Generate ${count} word-bank translation exercises where learners read a sentence in ${nativeLang} and arrange ${lang} word tiles to build the translation, at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

The learner sees a sentence in ${nativeLang} (their native language) and must arrange ${lang} (target language) tiles to translate it. This is the standard direction: native → target.

NATURALNESS RULE: The ${lang} sentence in "correct_sentence" must be perfectly natural and idiomatic, exactly as a native ${lang} speaker would say it. Never produce a word-for-word gloss.

"translated_words": the correct ${lang} translation split into individual word tokens (keep punctuation attached to the preceding word).
"distractor_words": 2-3 plausible but incorrect ${lang} words that look like they could belong.
"correct_sentence": the full ${lang} translation (exactly the translated_words joined with spaces).
"direction": always "to_target" for this prompt.

TILE RULE: Every word in correct_sentence MUST appear in translated_words. Verify this before responding.

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "WORD_BANK_TRANSLATE",
      "source_sentence": "It is important that everyone understands the consequences.",
      "source_language": "en",
      "translated_words": ["Es", "importante", "que", "todos", "comprendan", "las", "consecuencias."],
      "distractor_words": ["algunos", "conocen", "sus"],
      "correct_sentence": "Es importante que todos comprendan las consecuencias.",
      "direction": "to_target",
      "difficulty_score": 55,
      "grammar_point": "subjunctive comprehension",
      "vocab_topic": "${topic}"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- source_language: ISO 639-1 code for ${nativeLang}
- translated_words: split at word boundaries; keep punctuation attached to its word
- distractor_words: exactly 2-3 ${lang} words that look plausible but are clearly wrong in context
- correct_sentence: MUST equal translated_words joined with spaces — verify this
- direction: "to_target"
- All ${count} exercises must use different source sentences
- Do NOT use the example above in your output`;
}

function sentenceReorderPrompt(
  lang: string,
  nativeLang: string,
  level: CEFRLevel,
  topic: string,
  count: number,
): string {
  const [minScore, maxScore] = getScoreRange(level);
  return `Generate ${count} sentence-reorder exercises for a ${nativeLang}-speaking learner at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

The learner sees "native_sentence" in ${nativeLang} (their native language) as context, and must arrange scrambled ${lang} word tiles to produce the correct ${lang} translation.

"native_sentence": the complete sentence in ${nativeLang}.
"words": the correct ${lang} translation split into individual tokens, then SHUFFLED (do NOT list them in the correct order).
"correct_sentence": the ${lang} sentence with words in the correct order (= words joined correctly with spaces).

NATURALNESS RULE: correct_sentence must sound perfectly natural in ${lang}, not a word-for-word gloss.
ORDER RULE: The "words" array MUST be randomly shuffled — never match the correct order.
PUNCTUATION RULE: Keep punctuation attached to the word it follows (e.g. "generaciones." not "generaciones" + ".").

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "SENTENCE_REORDER",
      "native_sentence": "It is essential that we protect the environment for future generations.",
      "words": ["generaciones.", "el", "que", "medioambiente", "futuras", "esencial", "Es", "protejamos", "para"],
      "correct_sentence": "Es esencial que protejamos el medioambiente para futuras generaciones.",
      "grammar_note": "The present subjunctive 'protejamos' follows the nominal trigger 'Es esencial que'.",
      "difficulty_score": 62,
      "grammar_point": "present subjunctive — nominal clause",
      "vocab_topic": "${topic}"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- words: MUST be shuffled — never in the correct sentence order
- correct_sentence MUST equal words (in the right order) joined with spaces
- All ${count} exercises must use different sentence constructions
- Do NOT use the example above in your output`;
}

function lessonTypeSpecs(language: SupportedLanguage, nativeLanguage: SupportedLanguage): string {
  return `
TYPE SPECS:

1. WORD_MATCH
- Fields: type, pairs, difficulty_score, grammar_point, vocab_topic
- Use exactly 5 pairs. Each pair is { "target": "...", "native": "..." }.
- Target-language words must be short, high-frequency for the lesson, and unambiguous.

2. MULTIPLE_CHOICE
- Fields: type, question, options, correct_index, explanation, why_wrong, difficulty_score, grammar_point, vocab_topic
- Exactly 4 options, exactly 1 correct.
- why_wrong must include a reason for each wrong option text.

3. WORD_BANK_TRANSLATE
- Fields: type, source_sentence, source_language, translated_words, distractor_words, correct_sentence, direction, difficulty_score, grammar_point, vocab_topic
- source_language must be "${nativeLanguage}" when direction is "to_target".
- translated_words joined with spaces must exactly equal correct_sentence.
- Use 2-3 distractor_words.

4. FILL_BLANK
- Fields: type, sentence, word_bank, correct_answer, acceptable_answers, grammar_hint, distractor_reasons, difficulty_score, grammar_point, vocab_topic
- sentence must contain exactly one blank written as ___.
- word_bank must have exactly 4 items and include correct_answer.
- distractor_reasons must explain each wrong option.

5. SENTENCE_REORDER
- Fields: type, native_sentence, words, correct_sentence, grammar_note, difficulty_score, grammar_point, vocab_topic
- native_sentence is in the learner's native language.
- words must be SHUFFLED and must reconstruct correct_sentence.

6. TRANSLATE
- Fields: type, source_text, source_language, reference_translation, acceptable_translations, key_words, context_note, difficulty_score, grammar_point, vocab_topic
- source_language must be "${nativeLanguage}".
- acceptable_translations should contain 2-4 valid target-language answers.
- Keep translations natural, never word-for-word.

LANGUAGE PAIR:
- Target language ISO code: "${language}"
- Native language ISO code: "${nativeLanguage}"`;
}

export function buildRoadmapPrompt(
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  unitCount = 10,
): { system: string; user: string } {
  const lang = LANGUAGE_NAMES[language];
  const nativeLang = LANGUAGE_NAMES[nativeLanguage];

  return {
    system: `You are a curriculum designer creating a Duolingo-style language path for adult learners. Respond with ONLY valid JSON.`,
    user: `Create a forward-looking course roadmap for a ${nativeLang}-speaking learner studying ${lang} at CEFR ${level}.

Design the roadmap like a bite-size app path:
- Keep lessons short and focused.
- Every unit should make it obvious what the learner is about to practice.
- Alternate between new vocabulary, new grammar, mixed practice, and review.
- Make the progression feel coherent over the next ${unitCount} units.
- Keep the content suitable for adult learners and real-world language, not childlike beginner content.

Each unit MUST contain exactly 4 lessons in this order:
1. "new_vocabulary" — introduce useful words/phrases for the unit theme
2. "new_grammar" — teach one bite-size grammar pattern tied to the same theme
3. "skill_practice" — mixed practice using the words + grammar already introduced
4. "review" — retrieval practice only, no new material

Return this exact JSON structure:
{
  "title": "Course roadmap title",
  "summary": "One-paragraph overview of what the next 10 units build toward.",
  "units": [
    {
      "title": "Unit 1 title",
      "description": "What the unit covers and why it matters.",
      "theme": "Broad theme label",
      "grammar_focus": ["item 1", "item 2"],
      "vocabulary_focus": ["item 1", "item 2", "item 3"],
      "can_do": ["Learner outcome 1", "Learner outcome 2"],
      "lessons": [
        {
          "title": "Lesson title",
          "description": "Short lesson description",
          "topic": "Prompt-ready topic string for exercise generation",
          "lesson_kind": "new_vocabulary",
          "skill_type": "vocabulary",
          "focus_label": "New words",
          "objective": "What the learner should achieve in this lesson",
          "grammar_focus": ["item 1"],
          "vocabulary_focus": ["item 1", "item 2"]
        }
      ]
    }
  ]
}

Requirements:
- Exactly ${unitCount} units.
- Exactly 4 lessons per unit.
- Every lesson must include at least 1 item in grammar_focus and at least 1 item in vocabulary_focus.
- If a lesson is mainly vocabulary, repeat the supporting grammar focus from the unit instead of leaving grammar_focus empty.
- If a lesson is mainly grammar, repeat the supporting vocabulary set from the unit instead of leaving vocabulary_focus empty.
- Titles should be concise: 2-5 words for lessons, 2-6 words for units.
- "review" lessons must explicitly avoid introducing new material.
- The roadmap must feel cumulative from Unit 1 through Unit ${unitCount}.
- Use real adult contexts: work, travel, news, relationships, study, culture, public life.
- Keep the progression aligned with ${level}.
- Return JSON only. No markdown, no notes, no commentary.`,
  };
}

export function buildLessonPrompt(
  lesson: LessonDefinition,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
): { system: string; user: string; blueprint: LessonBlueprint } {
  const lang = LANGUAGE_NAMES[language];
  const nativeLang = LANGUAGE_NAMES[nativeLanguage];
  const blueprint = getLessonBlueprint(lesson.lessonKind);
  const sequence = blueprint.sequence.map((type, index) => `${index + 1}. ${type}`).join('\n');

  return {
    system: SYSTEM_PROMPT + languageSpecificAddendum(language),
    user: `Generate one complete mobile language lesson for a ${nativeLang}-speaking learner studying ${lang} at CEFR ${level}.

Lesson context:
- Unit: ${lesson.unitTitle}
- Lesson title: ${lesson.title}
- Lesson kind: ${lesson.lessonKind}
- Focus label shown to learner: ${lesson.focusLabel}
- Lesson objective: ${lesson.objective}
- Topic prompt: ${lesson.topic}
- Grammar focus: ${lesson.grammarFocus.join(', ')}
- Vocabulary focus: ${lesson.vocabularyFocus.join(', ')}
- Learner outcomes: ${lesson.canDo.join(' | ')}

This lesson should feel like a Duolingo-style run:
- Start with fast recognition when appropriate.
- Move into guided production with tiles and short transformations.
- Finish with slightly more demanding recall.
- Keep it brisk, clear, and game-like.
- Use ONLY the material appropriate for this lesson kind.
- For "review", do NOT introduce new vocabulary or grammar beyond the provided focus.

${focusInstruction(blueprint.focus)}

You MUST return exactly ${blueprint.count} exercises in this exact order and type sequence:
${sequence}

${lessonTypeSpecs(language, nativeLanguage)}

Return JSON only in this shape:
{
  "lesson_summary": "One short sentence about what this lesson practices.",
  "exercises": [
    {
      "type": "WORD_MATCH"
    }
  ]
}

Hard rules:
- The exercises array length must be exactly ${blueprint.count}.
- The type at each position must exactly match the required sequence above.
- Keep every exercise on-topic for "${lesson.topic}".
- Recycle the same small set of words/structures inside the lesson so it feels cohesive.
- Do not repeat the exact same sentence pattern twice.
- difficulty_score must stay appropriate for ${level}.
- Every correct answer must be present in the choices/tiles for that exercise.
- why_wrong and distractor_reasons must be JSON OBJECTS keyed by option text, never arrays.
- Return JSON only.`,
    blueprint,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function buildExercisePrompt(
  type: ExerciseType,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  topic: string,
  count = 10,
  focus: ExerciseFocus = 'mixed',
): { system: string; user: string } {
  const lang = LANGUAGE_NAMES[language];
  const nativeLang = LANGUAGE_NAMES[nativeLanguage];

  let user: string;
  switch (type) {
    case 'FILL_BLANK':
      user = fillBlankPrompt(lang, nativeLang, level, topic, count, focus);
      break;
    case 'MULTIPLE_CHOICE':
      user = multipleChoicePrompt(lang, nativeLang, level, topic, count, focus);
      break;
    case 'TRANSLATE':
      user = translatePrompt(lang, nativeLang, level, topic, count);
      break;
    case 'WORD_MATCH':
      user = wordMatchPrompt(lang, nativeLang, level, topic, count);
      break;
    case 'WORD_BANK_TRANSLATE':
      user = wordBankTranslatePrompt(lang, nativeLang, level, topic, count);
      break;
    case 'SENTENCE_REORDER':
      user = sentenceReorderPrompt(lang, nativeLang, level, topic, count);
      break;
    default:
      user = `Generate 6 ${type} exercises. Return JSON: { "exercises": [] }`;
  }

  return { system: SYSTEM_PROMPT + languageSpecificAddendum(language), user };
}
