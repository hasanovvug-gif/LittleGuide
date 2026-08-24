import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { typography as t, fonts, type Theme } from '@/constants/theme';
import { Eyebrow } from '@/components/ui';

/** Два поля и никакого аккаунта: имя и дата рождения — всё, что нужно приложению. */
export default function OnboardingScreen() {
  const theme = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const setChild = useAppStore((s) => s.setChild);
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const birth = toISO(day, month, year);
  const ready = name.trim().length > 0 && birth !== null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 40, paddingHorizontal: 26, gap: 28 }}>
      <View style={{ gap: 10 }}>
        <Text style={[t.h1, { color: theme.text }]}>{tr.onboarding.title}</Text>
        <Text style={[t.body, { color: theme.textSecondary }]}>{tr.onboarding.subtitle}</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow color={theme.captionWarm}>{tr.onboarding.nameLabel}</Eyebrow>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={tr.onboarding.namePlaceholder}
          placeholderTextColor={theme.caption}
          style={{
            height: 54, borderRadius: theme.radius.md, backgroundColor: theme.card,
            borderWidth: 1, borderColor: theme.line, paddingHorizontal: 16,
            fontFamily: fonts.sans, fontSize: 16, color: theme.text,
          }}
        />
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow color={theme.captionWarm}>{tr.onboarding.birthLabel}</Eyebrow>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <DateBox value={day} onChange={setDay} max={2} placeholder="ДД" flex={1} theme={theme} />
          <DateBox value={month} onChange={setMonth} max={2} placeholder="ММ" flex={1} theme={theme} />
          <DateBox value={year} onChange={setYear} max={4} placeholder="ГГГГ" flex={1.6} theme={theme} />
        </View>
      </View>

      <Text style={[t.caption, { color: theme.caption }]}>{tr.onboarding.localOnly}</Text>

      <Pressable
        disabled={!ready}
        onPress={() => {
          if (!ready || !birth) return;
          setChild({ name: name.trim(), birth });
          router.replace('/');
        }}
        style={{
          height: theme.bigHit, borderRadius: theme.radius.md,
          backgroundColor: ready ? theme.accent : theme.chip,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={[t.button, { color: ready ? theme.onAccent : theme.captionWarm }]}>{tr.onboarding.start}</Text>
      </Pressable>
    </View>
  );
}

/** Вынесен из компонента: объявление внутри тела перерисовывало поле на каждом нажатии. */
function DateBox({ value, onChange, max, placeholder, flex, theme }: {
  value: string; onChange: (v: string) => void; max: number; placeholder: string; flex: number; theme: Theme;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, max))}
      placeholder={placeholder}
      placeholderTextColor={theme.caption}
      keyboardType="number-pad"
      maxLength={max}
      style={{
        flex, height: 54, borderRadius: theme.radius.md, backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.line, paddingHorizontal: 16, textAlign: 'center',
        fontFamily: fonts.sans, fontSize: 16, color: theme.text,
      }}
    />
  );
}

function toISO(day: string, month: string, year: string): string | null {
  const d = Number(day), m = Number(month), y = Number(year);
  if (!d || !m || !y || year.length !== 4) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d, 12, 0, 0);
  if (date.getDate() !== d || date.getMonth() !== m - 1) return null;
  if (date.getTime() > Date.now()) return null;
  return date.toISOString();
}
