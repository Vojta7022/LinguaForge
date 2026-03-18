import { View, Pressable, Text } from 'react-native';
import ProgressBar from '@/components/ui/ProgressBar';
import type { Exercise } from '@/types/exercise';

interface ExerciseShellProps {
  exercise: Exercise;
  progress: number;     // 0–1
  heartsLeft: number;   // 0–5
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Shared wrapper around all exercise types.
 * Provides: progress bar, heart display, close button, exercise type label.
 * The specific exercise UI goes in children.
 */
export default function ExerciseShell({
  exercise,
  progress,
  heartsLeft,
  onClose,
  children,
}: ExerciseShellProps) {
  const hearts = '❤️'.repeat(heartsLeft) + '🖤'.repeat(5 - heartsLeft);

  return (
    <View className="flex-1 bg-white">
      {/* Progress */}
      <View className="px-4 pt-14 pb-2">
        <ProgressBar progress={progress} />
      </View>

      {/* Header row */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={onClose} hitSlop={12}>
          <Text className="text-slate-400 text-2xl font-light">✕</Text>
        </Pressable>
        <Text className="text-slate-500 text-sm font-medium">{hearts}</Text>
      </View>

      {/* Exercise type label */}
      <View className="px-5 mb-2">
        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {exercise.type.replace(/_/g, ' ')}
        </Text>
      </View>

      {/* Exercise content */}
      <View className="flex-1 px-5">{children}</View>
    </View>
  );
}
