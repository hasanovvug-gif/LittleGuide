import { Text, View, type TextProps, type ViewProps } from 'react-native';
import { typography as t, type Theme } from "@/constants/theme";

export function Eyebrow({ children, color, style, ...rest }: TextProps & { color: string }) {
  return (
    <Text {...rest} style={[t.eyebrow, { color, textTransform: 'uppercase' }, style]}>
      {children}
    </Text>
  );
}

export function Card({ theme, style, children, ...rest }: ViewProps & { theme: Theme }) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: theme.radius.xl,
          padding: 20,
          gap: 12,
        },
        theme.name === 'day'
          ? { shadowColor: '#B79E8A', shadowOpacity: 0.13, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 2 }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ theme }: { theme: Theme }) {
  return <View style={{ height: 1, backgroundColor: theme.line }} />;
}
