import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type TextInputProps,
} from 'react-native';
export const palette = {
  paper: '#F7F5F1',
  ink: '#282334',
  plum: '#573B68',
  lavender: '#E9E1F1',
  coral: '#BD4A3C',
  muted: '#6C6475',
  line: '#DAD4DF',
  white: '#FFFFFF',
};
export function useTheme() {
  const dark = useColorScheme() === 'dark';
  return {
    ...palette,
    paper: dark ? '#19161F' : palette.paper,
    ink: dark ? '#F7F5FA' : palette.ink,
    white: dark ? '#272130' : '#FFFFFF',
    muted: dark ? '#C2B8CD' : palette.muted,
    line: dark ? '#4A4056' : palette.line,
    active: dark ? '#D8C2E9' : palette.plum,
  };
}
export function Page({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.paper }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.inner}>{children}</View>
    </ScrollView>
  );
}
export function Txt({
  children,
  kind = 'body',
  color,
}: {
  children: React.ReactNode;
  kind?: 'body' | 'title' | 'hero' | 'label' | 'small';
  color?: string;
}) {
  const t = useTheme();
  return (
    <Text
      accessibilityRole={kind === 'title' || kind === 'hero' ? 'header' : undefined}
      style={[s.text, s[kind], { color: color ?? t.ink }]}
    >
      {children}
    </Text>
  );
}
export function Card({ children, tint = false }: { children: React.ReactNode; tint?: boolean }) {
  const t = useTheme();
  return (
    <View style={[s.card, { backgroundColor: tint ? t.plum : t.white, borderColor: t.line }]}>
      {children}
    </View>
  );
}
export function Row({ children }: { children: React.ReactNode }) {
  return <View style={s.row}>{children}</View>;
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: secondary ? t.white : t.plum,
          borderColor: t.line,
          opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? t.plum : '#FFF'} />
      ) : (
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
            color: secondary ? t.ink : '#FFF',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt kind="label">{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        {...props}
        style={[
          s.input,
          { color: t.ink, borderColor: t.line, backgroundColor: t.white },
          props.style,
        ]}
      />
    </View>
  );
}
export function Notice({ text, error = false }: { text?: string; error?: boolean }) {
  if (!text) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ padding: 14, borderRadius: 12, backgroundColor: error ? '#FBE6E3' : '#E9E1F1' }}
    >
      <Txt kind="small" color={error ? '#922E25' : '#493356'}>
        {text}
      </Txt>
    </View>
  );
}
export function Loading() {
  return (
    <Page>
      <ActivityIndicator accessibilityLabel="Chargement" />
      <Txt>Chargement…</Txt>
    </Page>
  );
}
export const s = StyleSheet.create({
  page: { padding: 22, paddingTop: 34, paddingBottom: 48 },
  inner: { width: '100%', maxWidth: 780, alignSelf: 'center', gap: 20 },
  text: { fontFamily: undefined },
  body: { fontSize: 16, lineHeight: 25 },
  title: { fontSize: 27, lineHeight: 34, fontWeight: '700', letterSpacing: -0.7 },
  hero: { fontSize: 44, lineHeight: 50, fontWeight: '700', letterSpacing: -1.7 },
  label: { fontSize: 13, lineHeight: 20, fontWeight: '700', letterSpacing: 0.5 },
  small: { fontSize: 13, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 24, padding: 22, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  button: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
  },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 48, fontSize: 16 },
  choice: { padding: 16, borderRadius: 16, borderWidth: 2 },
});
