import { View } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0–1
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean; // TODO: wire up Reanimated
}

export default function ProgressBar({
  progress,
  height = 8,
  color = '#0D9488',
  backgroundColor = '#E2E8F0',
}: ProgressBarProps) {
  const pct = Math.min(1, Math.max(0, progress)) * 100;

  return (
    <View
      style={{ height, backgroundColor, borderRadius: height / 2, overflow: 'hidden' }}
    >
      <View
        style={{
          width: `${pct}%`,
          height,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
