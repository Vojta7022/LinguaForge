import { View, Text, Pressable } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import type { IdiomMatchContent } from '@/types/exercise';

interface Props {
  content: IdiomMatchContent;
  onComplete: () => void;
}

interface FlashState {
  idiom: number;
  meaning: number;
}

export default function IdiomMatchExercise({ content, onComplete }: Props) {
  const [selectedIdiomIndex, setSelectedIdiomIndex] = useState<number | null>(null);
  const [matchedIdiomIndices, setMatchedIdiomIndices] = useState<Set<number>>(new Set());
  const [matchedMeaningIndices, setMatchedMeaningIndices] = useState<Set<number>>(new Set());
  const [flashState, setFlashState] = useState<FlashState | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up flash timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  function handleIdiomPress(idiomIdx: number) {
    // Ignore matched cards and cards during a flash
    if (matchedIdiomIndices.has(idiomIdx) || flashState !== null) return;
    setSelectedIdiomIndex((prev) => (prev === idiomIdx ? null : idiomIdx));
  }

  function handleMeaningPress(meaningIdx: number) {
    // Ignore if no idiom selected, meaning already matched, or during a flash
    if (selectedIdiomIndex === null || matchedMeaningIndices.has(meaningIdx) || flashState !== null) return;

    const isCorrect = content.correct_pairs.some(
      ([iIdx, mIdx]) => iIdx === selectedIdiomIndex && mIdx === meaningIdx,
    );

    if (isCorrect) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const nextIdioms = new Set(matchedIdiomIndices);
      nextIdioms.add(selectedIdiomIndex);
      const nextMeanings = new Set(matchedMeaningIndices);
      nextMeanings.add(meaningIdx);

      setMatchedIdiomIndices(nextIdioms);
      setMatchedMeaningIndices(nextMeanings);
      setSelectedIdiomIndex(null);

      if (nextIdioms.size === content.idioms.length) {
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete();
        }, 300);
      }
    } else {
      // Wrong pair — flash red for 600ms then reset
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFlashState({ idiom: selectedIdiomIndex, meaning: meaningIdx });
      flashTimerRef.current = setTimeout(() => {
        setFlashState(null);
        setSelectedIdiomIndex(null);
        flashTimerRef.current = null;
      }, 600);
    }
  }

  const matchedCount = matchedIdiomIndices.size;
  const total = content.idioms.length;

  return (
    <View className="flex-1">
      <Text className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">
        Match the idioms
      </Text>
      <Text className="text-slate-700 font-semibold text-base mb-1">Match each idiom to its meaning</Text>
      <Text className="text-slate-400 text-xs mb-5">
        {matchedCount}/{total} matched · Tap an idiom, then its meaning
      </Text>

      <View className="flex-row gap-3">
        {/* Left column — idioms */}
        <View className="flex-1 gap-2">
          {content.idioms.map((idiom, idx) => {
            const isMatched = matchedIdiomIndices.has(idx);
            const isSelected = selectedIdiomIndex === idx;
            const isFlashing = flashState?.idiom === idx;
            return (
              <Pressable
                key={idx}
                onPress={() => handleIdiomPress(idx)}
                disabled={isMatched}
                className={`rounded-2xl px-3 py-3.5 border-2 items-center justify-center
                  ${isMatched
                    ? 'bg-green-50 border-green-300 opacity-50'
                    : isFlashing
                    ? 'bg-red-50 border-red-400'
                    : isSelected
                    ? 'bg-primary-100 border-primary-400'
                    : 'bg-white border-slate-200 active:border-slate-400'
                  }`}
              >
                <Text
                  className={`text-sm font-semibold text-center
                    ${isMatched
                      ? 'text-green-600'
                      : isFlashing
                      ? 'text-red-600'
                      : isSelected
                      ? 'text-primary-700'
                      : 'text-slate-700'
                    }`}
                >
                  {isMatched ? '✓ ' : ''}{idiom}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Right column — meanings */}
        <View className="flex-1 gap-2">
          {content.meanings.map((meaning, idx) => {
            const isMatched = matchedMeaningIndices.has(idx);
            const isFlashing = flashState?.meaning === idx;
            return (
              <Pressable
                key={idx}
                onPress={() => handleMeaningPress(idx)}
                disabled={isMatched}
                className={`rounded-2xl px-3 py-3.5 border-2 items-center justify-center
                  ${isMatched
                    ? 'bg-green-50 border-green-300 opacity-50'
                    : isFlashing
                    ? 'bg-red-50 border-red-400'
                    : 'bg-white border-slate-200 active:border-slate-400'
                  }`}
              >
                <Text
                  className={`text-sm font-semibold text-center
                    ${isMatched
                      ? 'text-green-600'
                      : isFlashing
                      ? 'text-red-600'
                      : 'text-slate-700'
                    }`}
                >
                  {isMatched ? '✓ ' : ''}{meaning}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {matchedCount === total ? (
        <View className="mt-6 bg-green-50 rounded-2xl p-4 border border-green-200 items-center">
          <Text className="text-green-700 font-bold text-base">All matched!</Text>
        </View>
      ) : null}
    </View>
  );
}
