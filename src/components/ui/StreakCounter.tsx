import { View, Text } from 'react-native';

interface StreakCounterProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakCounter({ count, size = 'md' }: StreakCounterProps) {
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl';
  const labelSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View className="items-center">
      <Text className={`${textSize} font-bold text-slate-800`}>🔥 {count}</Text>
      <Text className={`${labelSize} text-slate-500 mt-0.5`}>day streak</Text>
    </View>
  );
}
