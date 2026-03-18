import { View, Text } from 'react-native';

// TODO Phase 2: replace with Reanimated entrance animation

interface AnimatedFeedbackProps {
  type: 'correct' | 'incorrect' | 'hint';
  message?: string;
  explanation?: string;
}

const config = {
  correct:   { emoji: '✅', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  incorrect: { emoji: '❌', bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700' },
  hint:      { emoji: '💡', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
};

export default function AnimatedFeedback({ type, message, explanation }: AnimatedFeedbackProps) {
  const c = config[type];
  const defaultMessage = type === 'correct' ? 'Correct!' : type === 'incorrect' ? 'Not quite.' : 'Hint';

  return (
    <View className={`${c.bg} ${c.border} border rounded-2xl p-4`}>
      <Text className={`${c.text} font-bold text-base mb-1`}>
        {c.emoji} {message ?? defaultMessage}
      </Text>
      {explanation && (
        <Text className="text-slate-600 text-sm leading-5">{explanation}</Text>
      )}
    </View>
  );
}
