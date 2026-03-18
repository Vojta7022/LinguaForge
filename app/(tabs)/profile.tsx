import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="bg-primary-600 px-6 pt-14 pb-8 items-center">
        <View className="w-20 h-20 bg-primary-400 rounded-full items-center justify-center mb-3">
          <Text className="text-4xl">👤</Text>
        </View>
        <Text className="text-white text-xl font-bold">Your Name</Text>
        <Text className="text-primary-100 text-sm mt-1">B2 Spanish learner</Text>
      </View>

      <View className="px-6 py-6 gap-4">
        {/* Stats */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-slate-800 font-semibold text-base mb-4">Your Stats</Text>
          <View className="flex-row justify-around">
            <StatItem value="0" label="Total XP" />
            <StatItem value="0" label="Streak" />
            <StatItem value="0" label="Lessons" />
            <StatItem value="0" label="Accuracy" />
          </View>
        </View>

        {/* Settings */}
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <SettingsRow label="Daily Goal" value="20 XP" />
          <SettingsRow label="Target Language" value="Spanish" />
          <SettingsRow label="Current Level" value="B2" />
          <SettingsRow label="Notifications" value="On" />
        </View>

        {/* Account */}
        <Pressable
          className="bg-red-50 rounded-2xl p-4 items-center border border-red-100"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-red-500 font-semibold">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-xl font-bold text-slate-800">{value}</Text>
      <Text className="text-slate-500 text-xs mt-1">{label}</Text>
    </View>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center px-5 py-4 border-b border-slate-100 last:border-b-0">
      <Text className="text-slate-700 font-medium">{label}</Text>
      <Text className="text-slate-400 text-sm">{value}</Text>
    </View>
  );
}
