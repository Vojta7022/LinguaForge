import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="select-native" />
      <Stack.Screen name="select-target" />
      <Stack.Screen name="placement-test" />
      <Stack.Screen name="daily-goal" />
      <Stack.Screen name="ready" />
    </Stack>
  );
}
