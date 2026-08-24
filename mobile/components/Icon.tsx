import Svg, { Circle, Path } from 'react-native-svg';

type Props = { size?: number; color: string };

const S = 1.6;

export function IconToday({ size = 22, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round">
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function IconRhythm({ size = 22, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12h3l2-5 3 10 2.5-7 2 4h5.5" />
    </Svg>
  );
}

export function IconDiary({ size = 22, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z" />
      <Path d="M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z" />
    </Svg>
  );
}

export function IconStory({ size = 22, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13.5A8 8 0 0 1 10.5 4 8.2 8.2 0 1 0 20 13.5z" />
    </Svg>
  );
}

export function IconCloud({ size = 19, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 18h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.2A3.4 3.4 0 0 0 7 18z" />
    </Svg>
  );
}

export function IconCheck({ size = 19, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  );
}

export function IconChevron({ size = 18, color, open = false }: Props & { open?: boolean }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d={open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
    </Svg>
  );
}

export function IconDots({ size = 22, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round">
      <Circle cx="12" cy="6" r="1.4" />
      <Circle cx="12" cy="12" r="1.4" />
      <Circle cx="12" cy="18" r="1.4" />
    </Svg>
  );
}

export function IconPlus({ size = 20, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}
