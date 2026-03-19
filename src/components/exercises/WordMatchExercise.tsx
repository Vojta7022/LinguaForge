import { View, Text, Pressable } from 'react-native';
import { useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import type { WordMatchContent } from '@/types/exercise';
import { shuffle } from '@/utils/exerciseHelpers';

interface Props {
  content: WordMatchContent;
  onComplete: () => void;
}

interface Tile {
  word: string;
  pairIndex: number; // index into content.pairs
}

export default function WordMatchExercise({ content, onComplete }: Props) {
  const leftTiles = useMemo<Tile[]>(
    () => shuffle(content.pairs.map((p, i) => ({ word: p.target, pairIndex: i }))),
    [],
  );
  const rightTiles = useMemo<Tile[]>(
    () => shuffle(content.pairs.map((p, i) => ({ word: p.native, pairIndex: i }))),
    [],
  );

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongLeft, setWrongLeft] = useState<number | null>(null);
  const [wrongRight, setWrongRight] = useState<number | null>(null);

  function attempt(leftIdx: number, rightIdx: number) {
    const leftPair = leftTiles[leftIdx].pairIndex;
    const rightPair = rightTiles[rightIdx].pairIndex;

    if (leftPair === rightPair) {
      // Correct
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = new Set(matched);
      next.add(leftPair);
      setMatched(next);
      setSelectedLeft(null);
      setSelectedRight(null);

      if (next.size === content.pairs.length) {
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete();
        }, 300);
      }
    } else {
      // Wrong — flash red then clear
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrongLeft(leftIdx);
      setWrongRight(rightIdx);
      setTimeout(() => {
        setWrongLeft(null);
        setWrongRight(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    }
  }

  function handleLeft(idx: number) {
    if (matched.has(leftTiles[idx].pairIndex) || wrongLeft !== null) return;
    if (selectedRight !== null) {
      attempt(idx, selectedRight);
    } else {
      setSelectedLeft(idx === selectedLeft ? null : idx);
    }
  }

  function handleRight(idx: number) {
    if (matched.has(rightTiles[idx].pairIndex) || wrongRight !== null) return;
    if (selectedLeft !== null) {
      attempt(selectedLeft, idx);
    } else {
      setSelectedRight(idx === selectedRight ? null : idx);
    }
  }

  const matchedCount = matched.size;
  const total = content.pairs.length;

  return (
    <View className="flex-1">
      <Text className="text-slate-700 font-semibold text-base mb-1">Match the pairs</Text>
      <Text className="text-slate-400 text-xs mb-5">
        {matchedCount}/{total} matched · Tap one from each column
      </Text>

      <View className="flex-row gap-3">
        {/* Left column — target language */}
        <View className="flex-1 gap-2">
          {leftTiles.map((tile, idx) => {
            const isMatched = matched.has(tile.pairIndex);
            const isSelected = selectedLeft === idx;
            const isWrong = wrongLeft === idx;
            return (
              <Pressable
                key={idx}
                onPress={() => handleLeft(idx)}
                disabled={isMatched}
                className={`rounded-2xl px-3 py-3.5 border-2 items-center justify-center
                  ${isMatched
                    ? 'bg-green-50 border-green-300 opacity-50'
                    : isWrong
                    ? 'bg-red-50 border-red-400'
                    : isSelected
                    ? 'bg-primary-50 border-primary-500'
                    : 'bg-white border-slate-200 active:border-slate-400'
                  }`}
              >
                <Text
                  className={`text-sm font-semibold text-center
                    ${isMatched ? 'text-green-600' : isWrong ? 'text-red-600' : isSelected ? 'text-primary-700' : 'text-slate-700'}`}
                >
                  {isMatched ? '✓ ' : ''}{tile.word}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Right column — native language */}
        <View className="flex-1 gap-2">
          {rightTiles.map((tile, idx) => {
            const isMatched = matched.has(tile.pairIndex);
            const isSelected = selectedRight === idx;
            const isWrong = wrongRight === idx;
            return (
              <Pressable
                key={idx}
                onPress={() => handleRight(idx)}
                disabled={isMatched}
                className={`rounded-2xl px-3 py-3.5 border-2 items-center justify-center
                  ${isMatched
                    ? 'bg-green-50 border-green-300 opacity-50'
                    : isWrong
                    ? 'bg-red-50 border-red-400'
                    : isSelected
                    ? 'bg-primary-50 border-primary-500'
                    : 'bg-white border-slate-200 active:border-slate-400'
                  }`}
              >
                <Text
                  className={`text-sm font-semibold text-center
                    ${isMatched ? 'text-green-600' : isWrong ? 'text-red-600' : isSelected ? 'text-primary-700' : 'text-slate-700'}`}
                >
                  {isMatched ? '✓ ' : ''}{tile.word}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {matchedCount === total ? (
        <View className="mt-6 bg-green-50 rounded-2xl p-4 border border-green-200 items-center">
          <Text className="text-green-700 font-bold text-base">🎉 All matched!</Text>
        </View>
      ) : null}
    </View>
  );
}
