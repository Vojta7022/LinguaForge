import { View, Text, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import type { SentenceReorderContent } from '@/types/exercise';
import type { SupportedLanguage } from '@/types/user';
import { LANGUAGE_NAMES } from '@/types/user';
import { shuffle } from '@/utils/exerciseHelpers';

interface Props {
  content: SentenceReorderContent;
  targetLanguage: SupportedLanguage;
  onAnswerChange: (answer: string | null) => void;
  isChecked: boolean;
  isCorrect: boolean;
}

function stripPunctuation(word: string): string {
  return word.replace(/[.,!?;:'"()¡¿]/g, '').trim();
}

export default function SentenceReorderExercise({
  content,
  targetLanguage,
  onAnswerChange,
  isChecked,
  isCorrect,
}: Props) {
  const targetLangName = LANGUAGE_NAMES[targetLanguage];

  // Clean tiles once: strip punctuation, filter empties, then shuffle
  const initialTiles = useMemo(() => {
    const cleaned = content.words
      .map(stripPunctuation)
      .filter((w) => w.length > 0);
    return shuffle(cleaned);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [selected, setSelected] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>(initialTiles);

  function addWord(fromIdx: number) {
    if (isChecked) return;
    const word = remaining[fromIdx];
    const newSelected = [...selected, word];
    const newRemaining = remaining.filter((_, i) => i !== fromIdx);
    setSelected(newSelected);
    setRemaining(newRemaining);
    onAnswerChange(newSelected.join(' '));
  }

  function removeWord(fromIdx: number) {
    if (isChecked) return;
    const word = selected[fromIdx];
    const newSelected = selected.filter((_, i) => i !== fromIdx);
    const newRemaining = [...remaining, word];
    setSelected(newSelected);
    setRemaining(newRemaining);
    onAnswerChange(newSelected.length > 0 ? newSelected.join(' ') : null);
  }

  return (
    <View>
      {/* Instruction */}
      <Text className="text-slate-700 font-semibold text-base mb-3">
        Arrange the words in {targetLangName}:
      </Text>

      {/* Native sentence context */}
      {content.native_sentence ? (
        <View className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200">
          <Text className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Meaning
          </Text>
          <Text className="text-slate-800 text-base font-medium leading-6">
            {content.native_sentence}
          </Text>
        </View>
      ) : null}

      {/* Answer tray */}
      <View className="min-h-[64px] bg-slate-50 rounded-2xl p-3 border border-slate-200 flex-row flex-wrap gap-2 mb-5">
        {selected.length === 0 ? (
          <Text className="text-slate-300 italic text-sm self-center px-1">
            Tap words below to build the sentence…
          </Text>
        ) : null}
        {selected.map((word, i) => (
          <Pressable
            key={`sel-${i}`}
            onPress={() => removeWord(i)}
            disabled={isChecked}
            className={`px-3 py-2 rounded-xl border
              ${isChecked
                ? isCorrect
                  ? 'bg-green-100 border-green-300'
                  : 'bg-red-100 border-red-300'
                : 'bg-primary-100 border-primary-200 active:bg-primary-200'
              }`}
          >
            <Text
              className={`font-semibold text-sm
                ${isChecked
                  ? isCorrect ? 'text-green-700' : 'text-red-700'
                  : 'text-primary-700'
                }`}
            >
              {word}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Word bank */}
      <View className="flex-row flex-wrap gap-2">
        {remaining.map((word, i) => (
          <Pressable
            key={`rem-${i}`}
            onPress={() => addWord(i)}
            disabled={isChecked}
            className="px-3 py-2 bg-white rounded-xl border border-slate-200 active:bg-slate-100"
          >
            <Text className="text-slate-700 font-medium text-sm">{word}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
