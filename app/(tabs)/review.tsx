import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function ReviewScreen() {
  const dueCount = 0; // TODO: read from srsStore

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-6 pt-14 pb-5 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-800">Review</Text>
        <Text className="text-slate-500 text-sm mt-1">Spaced repetition queue</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        {dueCount === 0 ? (
          <View className="items-center">
            <Text className="text-6xl mb-6">✅</Text>
            <Text className="text-xl font-bold text-slate-800 mb-2">All caught up!</Text>
            <Text className="text-slate-500 text-center text-base">
              No cards due for review right now. Come back tomorrow!
            </Text>
          </View>
        ) : (
          <View className="w-full items-center">
            <Text className="text-6xl mb-4">🔁</Text>
            <Text className="text-4xl font-bold text-slate-800 mb-2">{dueCount}</Text>
            <Text className="text-slate-500 mb-8">cards due for review</Text>
            <Pressable
              className="bg-primary-600 rounded-2xl px-8 py-4 w-full items-center"
              onPress={() => router.push('/lesson/review')}
            >
              <Text className="text-white font-bold text-lg">Start Review</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
