import type { ExerciseType } from '@/types/exercise';
import type { CEFRLevel, SupportedLanguage } from '@/types/user';
import { LANGUAGE_NAMES } from '@/types/user';
import { getLevelInstruction, getScoreRange } from './difficultyScaler';

export const SYSTEM_PROMPT = `You are an expert language teacher specialising in CEFR B1–C2 instruction for intermediate-to-advanced adult learners.

Your exercises go well beyond beginner content: you focus on nuanced grammar, idiomatic expressions, register awareness, and complex sentence structures that simple language apps do not cover.

Rules you must follow without exception:
1. Respond with ONLY valid JSON. No markdown, no code fences, no explanatory text outside the JSON.
2. Every sentence must sound like authentic, natural language — not a textbook example.
3. Distractors in fill-blank and multiple-choice exercises must be plausible enough to challenge a genuine B2–C2 learner, not obviously wrong.
4. Each exercise must test a distinct grammar point or vocabulary item — no repetition within a batch.
5. Contexts must reflect real-world usage: news articles, academic papers, literature, professional communication, everyday adult conversation.
6. grammar_hint and explanation fields must be genuinely educational — explain the rule, not just restate the answer.`;

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

Each exercise tests a different grammar point relevant to the topic. The blank (___) replaces exactly one word or short phrase. Include exactly 4 items in word_bank: the correct answer plus 3 distractors that share the same grammatical form class and look plausible to a ${level} learner.

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "FILL_BLANK",
      "sentence": "Es crucial que el gobierno ___ medidas urgentes para reducir la contaminación.",
      "word_bank": ["tome", "toma", "tomará", "tomase"],
      "correct_answer": "tome",
      "acceptable_answers": ["tome"],
      "grammar_hint": "After 'es crucial que', use the present subjunctive (presente de subjuntivo), not the indicative.",
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

Each exercise has exactly 4 options. Exactly one is correct; the other three are plausible distractors that a ${level} learner might choose if they have a gap in their knowledge. Distractors must not be obviously wrong — they should look or sound right at first glance.

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "MULTIPLE_CHOICE",
      "question": "Which word best completes the following sentence? 'The committee reached a ___ after hours of heated debate.'",
      "options": ["consensus", "consent", "concession", "concession"],
      "correct_index": 0,
      "explanation": "'Consensus' means a general agreement reached by a group. 'Consent' is individual permission. 'Concession' means giving something up. 'Compromise' would also work but it is not one of the options.",
      "difficulty_score": 62,
      "grammar_point": "near-synonym distinction",
      "vocab_topic": "formal discussion and negotiation"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- correct_index: 0, 1, 2, or 3 — vary it across exercises, do not always put the answer at index 0
- options: exactly 4 distinct strings
- explanation: explain WHY each distractor is wrong as well as why the correct answer is right
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

Each exercise provides a sentence in ${nativeLang} that the learner must translate into ${lang}. Choose sentences that contain a grammatical feature likely to challenge learners at this level (e.g. subjunctive, passive voice with agent, complex relative clauses, idiomatic expressions). Provide a reference translation and 1–3 acceptable alternatives that differ in phrasing but retain the meaning.

Return this exact JSON (no other text):
{
  "exercises": [
    {
      "type": "TRANSLATE",
      "source_text": "It is vital that all employees be informed of the new policy before it comes into effect.",
      "source_language": "${nativeLang === LANGUAGE_NAMES['en'] ? 'en' : 'en'}",
      "reference_translation": "Es fundamental que todos los empleados sean informados de la nueva política antes de que entre en vigor.",
      "acceptable_translations": [
        "Es fundamental que todos los empleados estén informados de la nueva política antes de que entre en vigor.",
        "Es vital que se informe a todos los empleados de la nueva política antes de que entre en vigor."
      ],
      "context_note": "The English subjunctive 'be informed' maps to the Spanish subjunctive 'sean/estén informados'. Both present and passive constructions are acceptable.",
      "difficulty_score": 68,
      "grammar_point": "passive subjunctive in nominal clauses",
      "vocab_topic": "workplace communication"
    }
  ]
}

Requirements:
- difficulty_score: integer between ${minScore} and ${maxScore}
- source_language: always "${nativeLang === 'English' ? 'en' : nativeLang}"
- acceptable_translations: include at least 1, up to 3 valid alternatives
- context_note: brief note on the tricky grammar or vocabulary in this sentence
- All ${count} exercises must test different constructions
- Do NOT use the example above in your output`;
}

// ─── Stub prompts for Phase 2 types ───────────────────────────────────────

function notImplementedPrompt(type: ExerciseType): string {
  return `Generate 10 ${type} exercises. Return JSON: { "exercises": [] }`;
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
    default:
      user = notImplementedPrompt(type);
  }

  return { system: SYSTEM_PROMPT, user };
}
