import { useColorScheme } from 'react-native';
import { dayTheme, nightTheme, type Theme, type ThemeName } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

/** Тема по системной, с ручным переопределением из настроек. */
export function useTheme(): Theme {
  const system = useColorScheme();
  const override = useAppStore((s) => s.settings.theme);
  const name: ThemeName = override === 'auto' ? (system === 'dark' ? 'night' : 'day') : override;
  return name === 'night' ? nightTheme : dayTheme;
}
