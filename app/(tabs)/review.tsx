import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useSRSStore } from '@/stores/srsStore';
import { useProgressStore } from '@/stores/progressStore';
import { getExercisesByIds } from '@/repositories/exerciseRepository';
import type { Exercise, ExerciseContent } from '@/types/exercise';

interface WrongItem {
  progress_id: string;
  exercise: Exercise;
}

function getQuestionAndAnswer(content: ExerciseContent): { question: string; answer: string } {
  switch (content.type) {
    case 'FILL_BLANK':
      return { question: content.sentence, answer: content.correct_answer };
    case 'MULTIPLE_CHOICE':
      return { question: content.question, answer: content.options[content.correct_index] };
    case 'TRANSLATE':
      return { question: content.source_text, answer: content.reference_translation };
    case 'SENTENCE_REORDER':
      return { question: content.words.join(' · '), answer: content.correct_sentence };
    case 'ERROR_CORRECTION':
      return { question: content.incorrect_sentence, answer: content.correct_sentence };
    case 'CLOZE':
      return {
        question: content.passage.length > 80 ? content.passage.slice(0, 80) + '…' : content.passage,
        answer: content.blanks.map((b) => b.correct_answer).join(', '),
      };
    case 'IDIOM_MATCH':
      return { question: content.idioms[0] ?? '—', answer: content.meanings[content.correct_pairs[0]?.[1] ?? 0] ?? '—' };
    case 'CONTEXTUAL_VOCAB':
      return { question: content.question, answer: content.options[content.correct_index] };
    case 'LISTENING':
      return { question: content.question, answer: content.options[content.correct_index] };
    case 'WORD_MATCH':
      return { question: content.pairs.map((p) => p.target).join(', '), answer: content.pairs.map((p) => p.native).join(', ') };
    case 'WORD_BANK_TRANSLATE':
      return { question: content.source_sentence, answer: content.correct_sentence };
  }
}

function ExerciseTypeTag({ type }: { type: string }) {
  const label: Record<string, string> = {
    FILL_BLANK: 'Fill blank',
    MULTIPLE_CHOICE: 'Multiple choice',
    TRANSLATE: 'Translate',
    SENTENCE_REORDER: 'Reorder',
    ERROR_CORRECTION: 'Error fix',
    CLOZE: 'Cloze',
    IDIOM_MATCH: 'Idioms',
    CONTEXTUAL_VOCAB: 'Vocab',
    LISTENING: 'Listening',
    WORD_MATCH: 'Word match',
    WORD_BANK_TRANSLATE: 'Word bank',
  };
  return (
    <View className="bg-slate-100 rounded-full px-2 py-0.5 self-start mb-1">
      <Text className="text-slate-500 text-xs">{label[type] ?? type}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const dueCount = useSRSStore((s) => s.dueCount);
  const recentProgress = useProgressStore((s) => s.recentProgress);
  const [wrongItems, setWrongItems] = useState<WrongItem[]>([]);

  useEffect(() => {
    const wrongProgress = recentProgress.filter((p) => !p.is_correct).slice(0, 10);
    if (wrongProgress.length === 0) {
      setWrongItems([]);
      return;
    }
    const ids = wrongProgress.map((p) => p.exercise_id);
    getExercisesByIds(ids)
      .then((exercises) => {
        const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
        const items: WrongItem[] = wrongProgress
          .map((p) => {
            const exercise = exerciseMap.get(p.exercise_id);
            if (!exercise) return null;
            return { progress_id: p.id, exercise };
          })
          .filter((item): item is WrongItem => item !== null);
        setWrongItems(items);
      })
      .catch(() => setWrongItems([]));
  }, [recentProgress]);

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="bg-white px-6 pt-14 pb-5 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-800">Review</Text>
        <Text className="text-slate-500 text-sm mt-1">Spaced repetition queue</Text>
      </View>

      <View className="px-5 py-5 gap-4">
        {/* SRS Queue Card */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 items-center">
          <Text className="text-5xl mb-3">🔁</Text>
          {dueCount > 0 ? (
            <>
              <Text className="text-3xl font-bold text-slate-800">{dueCount}</Text>
              <Text className="text-slate-500 text-sm mt-1">cards due for review</Text>
            </>
          ) : (
            <Text className="text-3xl font-bold text-slate-800">0</Text>
          )}
          <View className="mt-4 bg-slate-100 rounded-xl px-4 py-2">
            <Text className="text-slate-500 text-xs font-semibold text-center">
              Coming soon — full spaced repetition
            </Text>
          </View>
          <Text className="text-slate-400 text-xs text-center mt-2 leading-4">
            After completing more lessons, your weak exercises will appear here for SM-2 review sessions.
          </Text>
        </View>

        {/* Recent Mistakes */}
        {wrongItems.length > 0 ? (
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <Text className="text-slate-800 font-bold text-base mb-1">Recent Mistakes</Text>
            <Text className="text-slate-400 text-xs mb-4">
              Exercises you got wrong — review the correct answers
            </Text>
            {wrongItems.map((item, index) => {
              const { question, answer } = getQuestionAndAnswer(item.exercise.content);
              return (
                <View
                  key={item.progress_id}
                  className={`py-3 ${index < wrongItems.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <ExerciseTypeTag type={item.exercise.type} />
                  <Text className="text-slate-700 text-sm mb-1.5" numberOfLines={2}>
                    {question}
                  </Text>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-green-600 text-xs font-semibold">✓</Text>
                    <Text className="text-green-700 text-xs flex-1">{answer}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-5 border border-slate-100 items-center">
            <Text className="text-3xl mb-2">✅</Text>
            <Text className="text-slate-600 font-semibold text-sm">No mistakes yet</Text>
            <Text className="text-slate-400 text-xs mt-1 text-center">
              Complete some lessons and your incorrect answers will appear here.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
