import type { ExerciseType } from '@/types/exercise';
import type { CEFRLevel, SupportedLanguage } from '@/types/user';
import { LANGUAGE_NAMES } from '@/types/user';
import { getLevelInstruction, getScoreRange } from './difficultyScaler';

export const SYSTEM_PROMPT = `You are an expert language teacher specialising in CEFR B1–C2 instruction for intermediate-to-advanced adult learners.

Your exercises go well beyond beginner content: you focus on nuanced grammar, idiomatic expressions, register awareness, and complex sentence structures that simple language apps do not cover.

Rules you must follow without exception:
1. Respond with ONLY valid JSON. No markdown, no code fences, no explanatory text outside the JSON.
2. Every sentence must sound like authentic, natural language — not a textbook example.
3. Focus heavily on practical, high-frequency vocabulary appropriate for the CEFR level. Every exercise should teach or test at least one useful word or phrase that learners will actually encounter.
4. Each exercise must test a distinct grammar point or vocabulary item — no repetition within a batch.
5. Contexts must reflect real-world usage: news articles, academic papers, literature, professional communication, everyday adult conversation.
6. grammar_hint and explanation fields must be genuinely educational — explain the rule, not just restate the answer.
7. Avoid obscure or overly academic vocabulary unless generating C2-level content.`;

// ─── Per-type prompt builders ──────────────────────────────────────────────

function fillBlankPrompt(
  lang: string,
  nativeLang: string,
  level: CEFRLevel,
  topic: string,
  count: number,
): string {
  const [minScore, maxScore] = getScoreRange(level);
  return `Generate ${count} fill-in-the-blank exercises in ${lang} for a ${nativeLang}-speaking learner at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

Each exercise tests a different grammar point relevant to the topic. The blank (___) replaces exactly one word or short phrase. Include exactly 4 items in word_bank: the correct answer plus 3 distractors.

CRITICAL — distractors must be clearly wrong, not just less common alternatives:
- If the blank tests grammar, make distractors use the wrong tense, mood, or agreement.
- If the blank tests vocabulary, make distractors from a different semantic field.
- Each distractor must have a specific, explainable reason it doesn't fit.
- Provide "distractor_reasons": an object mapping each distractor word to one sentence explaining why it's wrong.

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
- All ${count} exercises must be on different grammar points
- word_bank must always have exactly 4 items (correct answer included), randomly ordered
- acceptable_answers may include regional or stylistic variants of the correct answer
- distractor_reasons: include a key for EVERY distractor (not the correct answer)
- grammar_hint: one or two sentences explaining the rule, not the answer
- Do NOT use the example sentence above in your output`;
}

function multipleChoicePrompt(
  lang: string,
  nativeLang: string,
  level: CEFRLevel,
  topic: string,
  count: number,
): string {
  const [minScore, maxScore] = getScoreRange(level);
  return `Generate ${count} multiple-choice vocabulary and grammar exercises in ${lang} for a ${nativeLang}-speaking learner at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

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
- correct_index: 0, 1, 2, or 3 — vary it across exercises
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

Each exercise contains EXACTLY 5 word pairs. Choose high-frequency vocabulary learners at this level genuinely need. Pairs must be unambiguous — no two ${lang} words should share a ${nativeLang} translation.

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
- Each exercise must have EXACTLY 5 pairs
- Target words: individual words or very short phrases (not full sentences)
- Native translations: clear, unambiguous single words or short phrases
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
  return `Generate ${count} word-bank translation exercises where learners read a sentence in ${lang} and arrange ${nativeLang} word tiles to build the translation, at CEFR level ${level}.

Level ${level} means: use ${getLevelInstruction(level)}

Topic focus: ${topic}

"translated_words": the correct ${nativeLang} translation split into individual word tokens (keep punctuation attached to the preceding word).
"distractor_words": 2-3 plausible but incorrect ${nativeLang} words.
"correct_sentence": the full ${nativeLang} translation (exactly the translated_words joined with spaces).

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "WORD_BANK_TRANSLATE",
      "source_sentence": "Es importante que todos comprendan las consecuencias.",
      "source_language": "es",
      "translated_words": ["It", "is", "important", "that", "everyone", "understands", "the", "consequences."],
      "distractor_words": ["some", "knew", "their"],
      "correct_sentence": "It is important that everyone understands the consequences.",
      "difficulty_score": 55,
      "grammar_point": "subjunctive comprehension",
      "vocab_topic": "${topic}"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- source_language: ISO 639-1 code for ${lang}
- translated_words: split at word boundaries; keep punctuation attached to its word
- distractor_words: exactly 2-3 words that look plausible but are clearly wrong in context
- correct_sentence: exactly the joined translated_words
- All ${count} exercises must use different source sentences
- Do NOT use the example above in your output`;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function buildExercisePrompt(
  type: ExerciseType,
  language: SupportedLanguage,
  nativeLanguage: SupportedLanguage,
  level: CEFRLevel,
  topic: string,
  count = 10,
): { system: string; user: string } {
  const lang = LANGUAGE_NAMES[language];
  const nativeLang = LANGUAGE_NAMES[nativeLanguage];

  let user: string;
  switch (type) {
    case 'FILL_BLANK':
      user = fillBlankPrompt(lang, nativeLang, level, topic, count);
      break;
    case 'MULTIPLE_CHOICE':
      user = multipleChoicePrompt(lang, nativeLang, level, topic, count);
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
    default:
      user = `Generate 6 ${type} exercises. Return JSON: { "exercises": [] }`;
  }

  return { system: SYSTEM_PROMPT, user };
}
