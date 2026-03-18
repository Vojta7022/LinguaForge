import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-white">
      {/* Progress bar */}
      <View className="bg-slate-100 h-2 mt-14">
        <View className="bg-primary-500 h-2" style={{ width: '30%' }} />
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-slate-500 text-2xl">✕</Text>
        </Pressable>
        <Text className="text-slate-600 font-semibold">3 / 10</Text>
        <Text className="text-red-500">❤️❤️❤️❤️❤️</Text>
      </View>

      {/* Exercise area */}
      <View className="flex-1 px-6 pt-6">
        <Text className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-2">
          Fill in the blank
        </Text>
        <Text className="text-slate-800 text-xl font-semibold mb-8 leading-8">
          Es importante que ella ___ la verdad. {'\n'}
          <Text className="text-slate-400 text-base">(subjunctive)</Text>
        </Text>

        {/* Word bank */}
        <View className="flex-row flex-wrap gap-3 mb-8">
          {['diga', 'dice', 'diría', 'dijera'].map((word) => (
            <Pressable key={word} className="bg-slate-100 rounded-xl px-5 py-3 border-2 border-slate-200">
              <Text className="text-slate-800 font-medium text-base">{word}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Answer area */}
      <View className="px-6 pb-10">
        <Text className="text-slate-400 text-sm text-center mb-4">
          [Exercise engine — Phase 1] · Lesson: {id}
        </Text>
        <Pressable
          className="bg-primary-600 rounded-2xl py-4 items-center"
          onPress={() => router.push(`/lesson-complete/${id}`)}
        >
          <Text className="text-white font-bold text-lg">Check Answer</Text>
        </Pressable>
      </View>
    </View>
  );
}
