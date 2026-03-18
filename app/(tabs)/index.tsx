import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-14 pb-6">
        <Text className="text-white text-sm font-medium opacity-80">Good morning 👋</Text>
        <Text className="text-white text-2xl font-bold mt-1">Continue learning</Text>
      </View>

      <View className="px-6 py-6 gap-4">
        {/* Streak + XP + Level row */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-2xl mb-1">🔥</Text>
            <Text className="text-2xl font-bold text-slate-800">0</Text>
            <Text className="text-slate-500 text-sm">day streak</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-2xl mb-1">⭐</Text>
            <Text className="text-2xl font-bold text-slate-800">0</Text>
            <Text className="text-slate-500 text-sm">total XP</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-2xl mb-1">🎯</Text>
            <Text className="text-2xl font-bold text-slate-800">B2</Text>
            <Text className="text-slate-500 text-sm">your level</Text>
          </View>
        </View>

        {/* Daily goal */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-semibold text-base mb-3">Daily Goal</Text>
          <View className="bg-slate-100 rounded-full h-3 mb-2">
            <View className="bg-primary-500 h-3 rounded-full" style={{ width: '0%' }} />
          </View>
          <Text className="text-slate-500 text-sm">0 / 20 XP</Text>
        </View>

        {/* Next lesson CTA */}
        <Pressable
          className="bg-primary-600 rounded-2xl p-5"
          onPress={() => router.push('/lesson/demo')}
        >
          <Text className="text-white font-bold text-lg mb-1">Start Today's Lesson</Text>
          <Text className="text-primary-100 text-sm">Subjunctive Mood — B2 Spanish</Text>
        </Pressable>

        {/* Unit map placeholder */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-semibold text-base mb-4">Your Path</Text>
          <Text className="text-slate-400 text-sm text-center py-6">[Unit map — Phase 1]</Text>
        </View>
      </View>
    </ScrollView>
  );
}
