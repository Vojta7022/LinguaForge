import { Pressable, Text, ActivityIndicator } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary:   { container: 'bg-primary-600', text: 'text-white' },
  secondary: { container: 'bg-slate-100 border border-slate-200', text: 'text-slate-700' },
  ghost:     { container: 'bg-transparent', text: 'text-primary-600' },
  danger:    { container: 'bg-red-500', text: 'text-white' },
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2 rounded-xl', text: 'text-sm font-semibold' },
  md: { container: 'px-6 py-3 rounded-2xl', text: 'text-base font-bold' },
  lg: { container: 'px-8 py-4 rounded-2xl', text: 'text-lg font-bold' },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const v = variantClasses[variant];
  const s = sizeClasses[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${v.container} ${s.container} items-center justify-center flex-row gap-2
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50' : 'active:opacity-80'}`}
    >
      {loading && <ActivityIndicator size="small" color="white" />}
      <Text className={`${v.text} ${s.text}`}>{label}</Text>
    </Pressable>
  );
}
