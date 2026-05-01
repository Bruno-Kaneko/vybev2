import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { signUp } from '@/lib/auth';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setIsError(true);
      setMessage('Preencha todos os campos.');
      return;
    }
    if (password.length < 8) {
      setIsError(true);
      setMessage('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    setMessage('');
    setIsError(false);
    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      setIsError(true);
      setMessage(e.message === 'User already registered' ? 'Esse email ja esta em uso.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
            paddingHorizontal: responsive.pagePadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View style={[styles.panel, { maxWidth: responsive.formMaxWidth }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={Colors.textMuted} size={20} strokeWidth={2.4} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Junte-se a festa</Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Como quer ser chamado?</Text>
              <TextInput
                placeholder="@username"
                placeholderTextColor={Colors.textDisabled}
                value={username}
                onChangeText={t => setUsername(t.replace(/\s/g, '').toLowerCase())}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <Text style={styles.hint}>Seu @ aparece para outras pessoas</Text>
            </View>

            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="seuemail@exemplo.com"
                placeholderTextColor={Colors.textDisabled}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                placeholder="Minimo 8 caracteres"
                placeholderTextColor={Colors.textDisabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <VybeButton
              label="Criar minha conta"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.md }}
            />

            {message ? (
              <Text style={[styles.feedback, isError && styles.feedbackError]}>{message}</Text>
            ) : null}

            <Text style={styles.terms}>
              Ao criar conta voce concorda com os{' '}
              <Text style={styles.termsLink}>Termos de Uso</Text>
              {' '}e a{' '}
              <Text style={styles.termsLink}>Politica de Privacidade</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  panel: {
    width: '100%',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing['2xl'],
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  header: {
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['4xl'],
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
  },
  form: {
    gap: Spacing.xl,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
    marginTop: 6,
  },
  terms: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.6,
  },
  termsLink: {
    color: Colors.secondary,
  },
  feedback: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.secondary,
    textAlign: 'center',
  },
  feedbackError: {
    color: '#FF4444',
  },
});
