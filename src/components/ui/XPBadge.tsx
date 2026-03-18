import { View, Text } from 'react-native';

interface XPBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'px-2 py-1', text: 'text-xs' },
  md: { container: 'px-3 py-1.5', text: 'text-sm' },
  lg: { container: 'px-4 py-2', text: 'text-base' },
};

export default function XPBadge({ amount, size = 'md' }: XPBadgeProps) {
  const s = sizeMap[size];
  return (
    <View className={`bg-accent rounded-full flex-row items-center gap-1 ${s.container}`}>
      <Text className="text-white">⭐</Text>
      <Text className={`text-white font-bold ${s.text}`}>+{amount} XP</Text>
    </View>
  );
}
