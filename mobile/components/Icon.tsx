import Svg, { Circle, Path } from 'react-native-svg';

type Props = { size?: number; color: string };

const S = 1.6;

export function IconHome({ size = 22, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4.5 11.5 12 4.2l7.5 7.3" />
      <Path d="M6.3 10v9a1 1 0 0 0 1 1h9.4a1 1 0 0 0 1-1v-9" />
    </Svg>
  );
}

export function IconSleep({ size = 22, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.2 4.7A7 7 0 1 0 19.3 17.8 8.4 8.4 0 0 1 17.2 4.7z" />
      <Path d="M19.6 5.6v2.3M18.4 6.75h2.4" />
    </Svg>
  );
}

export function IconFeeding({ size = 22, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.5 3.5h5" />
      <Path d="M10.2 3.5v2.1a1.8 1.8 0 0 1-.55 1.3L8.4 8.15A2.4 2.4 0 0 0 7.7 9.85V18a2.5 2.5 0 0 0 2.5 2.5h3.6a2.5 2.5 0 0 0 2.5-2.5V9.85a2.4 2.4 0 0 0-.7-1.7l-1.25-1.25a1.8 1.8 0 0 1-.55-1.3V3.5" />
      <Path d="M8.3 13.5h7.4" />
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

export function IconCamera({ size = 20, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.2-2h8.2l1.2 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
      <Circle cx="12" cy="13" r="3.6" />
    </Svg>
  );
}

export function IconMic({ size = 20, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3.5a2.7 2.7 0 0 1 2.7 2.7v5.6a2.7 2.7 0 0 1-5.4 0V6.2A2.7 2.7 0 0 1 12 3.5z" />
      <Path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8V21" />
    </Svg>
  );
}

export function IconStop({ size = 20, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke="none">
      <Path d="M7.4 7.4h9.2a1 1 0 0 1 1 1v7.2a1 1 0 0 1-1 1H7.4a1 1 0 0 1-1-1V8.4a1 1 0 0 1 1-1z" />
    </Svg>
  );
}

export function IconPlay({ size = 20, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke="none">
      <Path d="M8.6 6.3a.9.9 0 0 1 1.36-.77l7.2 4.7a.9.9 0 0 1 0 1.54l-7.2 4.7a.9.9 0 0 1-1.36-.77z" />
    </Svg>
  );
}

export function IconPause({ size = 20, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke="none">
      <Path d="M8.4 6h2.1a.8.8 0 0 1 .8.8v10.4a.8.8 0 0 1-.8.8H8.4a.8.8 0 0 1-.8-.8V6.8A.8.8 0 0 1 8.4 6zM13.5 6h2.1a.8.8 0 0 1 .8.8v10.4a.8.8 0 0 1-.8.8h-2.1a.8.8 0 0 1-.8-.8V6.8a.8.8 0 0 1 .8-.8z" />
    </Svg>
  );
}

export function IconTrash({ size = 18, color }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4.5 6.5h15M9.5 6.5V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5M6.5 6.5l.8 12a1 1 0 0 0 1 .9h7.4a1 1 0 0 0 1-.9l.8-12" />
    </Svg>
  );
}
