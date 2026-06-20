import { View, Text, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import type { ClozeBlank, ClozeContent } from '@/types/exercise';

interface Props {
  content: ClozeContent;
  selectedAnswer: string | null;
  onAnswerChange: (answer: string) => void;
  isChecked: boolean;
  isCorrect?: boolean;
}

function parseMap(raw: string | null): Record<number, string> {
  try {
    return JSON.parse(raw ?? '{}') as Record<number, string>;
  } catch {
    return {};
  }
}

function isBlankCorrect(blank: ClozeBlank, map: Record<number, string>): boolean {
  const given = (map[blank.index] ?? '').trim().toLowerCase();
  return blank.acceptable_answers.map((a) => a.trim().toLowerCase()).includes(given);
}

function blankContainerStyle(
  isEmpty: boolean,
  isChecked: boolean,
  correct: boolean
): string {
  if (!isChecked) {
    return isEmpty
      ? 'border border-dashed border-slate-300 bg-slate-50'
      : 'border border-primary-300 bg-primary-100';
  }
  return correct
    ? 'border border-green-300 bg-green-100'
    : 'border border-red-300 bg-red-100';
}

function blankLabelStyle(
  isEmpty: boolean,
  isChecked: boolean,
  correct: boolean
): string {
  if (!isChecked) {
    return isEmpty ? 'text-slate-400' : 'text-primary-700';
  }
  return correct ? 'text-green-700' : 'text-red-700';
}

function BlankChip({
  blank,
  map,
  isActive,
  isChecked,
  onTap,
}: {
  blank: ClozeBlank;
  map: Record<number, string>;
  isActive: boolean;
  isChecked: boolean;
  onTap: (index: number) => void;
}) {
  const chosenWord = map[blank.index];
  const isEmpty = chosenWord === undefined;
  const correct = isBlankCorrect(blank, map);

  return (
    <View className="items-center mx-1 mb-1">
      <Pressable
        onPress={() => onTap(blank.index)}
        disabled={isChecked}
        className={`rounded-md px-3 py-1 ${blankContainerStyle(isEmpty, isChecked, correct)}
          ${isActive && !isChecked ? 'opacity-80' : ''}`}
      >
        <Text className={`font-semibold text-base ${blankLabelStyle(isEmpty, isChecked, correct)}`}>
          {isEmpty ? '___' : chosenWord}
        </Text>
      </Pressable>
      {isChecked && !correct && (
        <Text className="text-green-600 text-xs mt-0.5">{blank.correct_answer}</Text>
      )}
    </View>
  );
}

export default function ClozeExercise({
  content,
  selectedAnswer,
  onAnswerChange,
  isChecked,
}: Props) {
  const map = parseMap(selectedAnswer);

  // Default active blank: first empty blank
  const firstEmpty = content.blanks.find((b) => map[b.index] === undefined);
  const [activeBlankIndex, setActiveBlankIndex] = useState<number>(
    firstEmpty?.index ?? content.blanks[0]?.index ?? 0
  );

  const availableWords = useMemo(() => {
    const placed = new Set(Object.values(parseMap(selectedAnswer)));
    const allWords = content.blanks.flatMap((b) => b.word_bank);
    return [...new Set(allWords)].filter((w) => !placed.has(w));
  }, [content.blanks, selectedAnswer]);

  // Split passage on ___ — yields N+1 segments for N blanks
  const passageSegments = content.passage.split('___');

  function handleBlankTap(blankIndex: number) {
    if (isChecked) return;
    const chosenWord = map[blankIndex];
    if (chosenWord !== undefined) {
      // Clear the filled blank and make it active
      const next = { ...map };
      delete next[blankIndex];
      setActiveBlankIndex(blankIndex);
      onAnswerChange(JSON.stringify(next));
    } else {
      setActiveBlankIndex(blankIndex);
    }
  }

  function handleWordTap(word: string) {
    if (isChecked) return;
    const next = { ...map, [activeBlankIndex]: word };
    onAnswerChange(JSON.stringify(next));
    // Advance to the next empty blank
    const nextEmpty = content.blanks.find(
      (b) => b.index !== activeBlankIndex && next[b.index] === undefined
    );
    if (nextEmpty !== undefined) {
      setActiveBlankIndex(nextEmpty.index);
    }
  }

  return (
    <View className="flex-1">
      <Text className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-3">
        Fill in the blanks
      </Text>

      {/* Passage rendered as flex-row flex-wrap to allow inline blank chips */}
      <View className="flex-row flex-wrap items-end mb-6">
        {passageSegments.map((segment, segIdx) => {
          const blank = content.blanks[segIdx];
          return (
            <View key={segIdx} className="flex-row flex-wrap items-end">
              {/* Text segment — split into words so wrapping is natural */}
              {segment.split(/(\s+)/).map((token, tIdx) =>
                token.trim().length === 0 ? null : (
                  <Text key={tIdx} className="text-slate-800 text-lg font-semibold leading-9 mr-1">
                    {token}
                  </Text>
                )
              )}
              {/* Blank chip for this position (if a blank exists at segIdx) */}
              {blank !== undefined && (
                <BlankChip
                  blank={blank}
                  map={map}
                  isActive={blank.index === activeBlankIndex}
                  isChecked={isChecked}
                  onTap={handleBlankTap}
                />
              )}
            </View>
          );
        })}
        {/* Append extra blanks when the passage has fewer ___ than blanks */}
        {content.blanks.slice(passageSegments.length - 1).map((blank) => (
          <BlankChip
            key={`extra-${blank.index}`}
            blank={blank}
            map={map}
            isActive={blank.index === activeBlankIndex}
            isChecked={isChecked}
            onTap={handleBlankTap}
          />
        ))}
      </View>

      {/* Word bank */}
      <View className="flex-row flex-wrap gap-3">
        {availableWords.map((word, idx) => (
          <Pressable
            key={`${word}-${idx}`}
            onPress={() => handleWordTap(word)}
            disabled={isChecked}
            className="rounded-2xl px-5 py-3 border-2 bg-white border-slate-200 active:border-slate-400"
          >
            <Text className="font-semibold text-base text-slate-700">{word}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
