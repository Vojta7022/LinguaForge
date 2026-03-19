import { View, Text, Pressable, ScrollView } from 'react-native';
import { useMemo, useState } from 'react';
import type { WordBankTranslateContent } from '@/types/exercise';
import type { SupportedLanguage } from '@/types/user';
import { LANGUAGE_NAMES } from '@/types/user';
import { shuffle } from '@/utils/exerciseHelpers';

interface Props {
  content: WordBankTranslateContent;
  nativeLanguage: SupportedLanguage;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string | null) => void;
  isChecked: boolean;
}

interface Tile {
  word: string;
  id: number;
}

export default function WordBankTranslateExercise({
  content,
  nativeLanguage,
  selectedAnswer: _selectedAnswer,
  onAnswerChange,
  isChecked,
}: Props) {
  const allTiles = useMemo<Tile[]>(() =>
    shuffle([
      ...content.translated_words,
      ...content.distractor_words,
    ].map((word, id) => ({ word, id }))),
    [],
  );

  const [placed, setPlaced] = useState<Tile[]>([]);
  const [available, setAvailable] = useState<Tile[]>(allTiles);

  const nativeLangName = LANGUAGE_NAMES[nativeLanguage];

  function tapAvailable(tile: Tile) {
    if (isChecked) return;
    const nextPlaced = [...placed, tile];
    const nextAvailable = available.filter((t) => t.id !== tile.id);
    setPlaced(nextPlaced);
    setAvailable(nextAvailable);
    onAnswerChange(nextPlaced.map((t) => t.word).join(' '));
  }

  function tapPlaced(tile: Tile) {
    if (isChecked) return;
    const nextPlaced = placed.filter((t) => t.id !== tile.id);
    const nextAvailable = [...available, tile];
    setPlaced(nextPlaced);
    setAvailable(nextAvailable);
    onAnswerChange(nextPlaced.length > 0 ? nextPlaced.map((t) => t.word).join(' ') : null);
  }

  return (
    <View className="flex-1">
      {/* Source sentence (target language) */}
      <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-200">
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">
          {LANGUAGE_NAMES[content.source_language as SupportedLanguage] ?? content.source_language}
        </Text>
        <Text className="text-slate-800 text-lg font-medium leading-7">
          {content.source_sentence}
        </Text>
      </View>

      {/* Direction hint */}
      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
        Translate to {nativeLangName} →
      </Text>

      {/* Placed tiles area */}
      <View className="min-h-[72px] border-b-2 border-slate-200 pb-3 mb-4">
        {placed.length === 0 ? (
          <Text className="text-slate-300 text-sm mt-3">Tap words below to build the translation…</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row flex-wrap gap-2">
              {placed.map((tile) => (
                <Pressable
                  key={tile.id}
                  onPress={() => tapPlaced(tile)}
                  disabled={isChecked}
                  className={`rounded-xl px-3 py-2 border-2
                    ${isChecked ? 'border-slate-200 bg-slate-50' : 'border-primary-400 bg-primary-50 active:opacity-70'}`}
                >
                  <Text className={`font-semibold text-sm ${isChecked ? 'text-slate-600' : 'text-primary-700'}`}>
                    {tile.word}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Available tiles */}
      <View className="flex-row flex-wrap gap-2">
        {available.map((tile) => (
          <Pressable
            key={tile.id}
            onPress={() => tapAvailable(tile)}
            disabled={isChecked}
            className="rounded-xl px-3 py-2 border-2 border-slate-200 bg-white active:border-slate-400"
          >
            <Text className="font-semibold text-sm text-slate-700">{tile.word}</Text>
          </Pressable>
        ))}
      </View>

      {/* Post-check: show correct sentence */}
      {isChecked ? (
        <View className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <Text className="text-slate-500 text-xs font-semibold mb-1">Correct translation:</Text>
          <Text className="text-slate-800 text-sm font-medium leading-5">
            {content.correct_sentence}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
