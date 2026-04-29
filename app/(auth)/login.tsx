import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Cloud,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react-native';
import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { BrandLogo, VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';

type SocialProvider = 'google' | 'icloud' | 'instagram';
type SvgIcon = React.ComponentType<{ color: string; size: number }>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [message, setMessage] = useState('');

  const goToApp = async () => {
    await new Promise(r => setTimeout(r, 650));
    router.replace('/(tabs)');
  };

  const handleLogin = async () => {
    setMessage('');
    setLoading(true);
    await goToApp();
    setLoading(false);
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setMessage('');
    setSocialLoading(provider);
    await goToApp();
    setSocialLoading(null);
  };

  const handleForgotPassword = () => {
    setMessage(email.trim() ? `Enviamos as instrucoes para ${email.trim()}.` : 'Digite seu email para recuperar a senha.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + Spacing['3xl'],
            paddingBottom: insets.bottom + Spacing.xl,
            paddingHorizontal: responsive.pagePadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.panel, { maxWidth: responsive.formMaxWidth }]}>
          <View style={styles.logoSection}>
            <BrandLogo width={188} height={58} />
          </View>

          <View style={styles.socialSection}>
            <SocialButton
              Icon={GoogleIcon}
              label="Continuar com Google"
              onPress={() => handleSocialLogin('google')}
              color="#EA4335"
              loading={socialLoading === 'google'}
            />
            <SocialButton
              Icon={Cloud}
              label="Continuar com iCloud"
              onPress={() => handleSocialLogin('icloud')}
              color={Colors.white}
              loading={socialLoading === 'icloud'}
            />
            <SocialButton
              Icon={InstagramIcon}
              label="Continuar com Instagram"
              onPress={() => handleSocialLogin('instagram')}
              color="#E1306C"
              loading={socialLoading === 'instagram'}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.formSection}>
            <VybeInput
              Icon={Mail}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <VybeInput
              Icon={Lock}
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightAction={
                <TouchableOpacity onPress={() => setShowPassword(prev => !prev)} style={styles.iconButton}>
                  {showPassword ? (
                    <EyeOff color={Colors.textMuted} size={20} strokeWidth={2} />
                  ) : (
                    <Eye color={Colors.textMuted} size={20} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              }
            />

            <VybeButton
              label="Entrar"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.loginBtn}
            />

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

          {message ? <Text style={styles.feedback}>{message}</Text> : null}

          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Ainda nao tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SocialButton({
  Icon,
  label,
  onPress,
  color,
  loading,
}: {
  Icon: SvgIcon;
  label: string;
  onPress: () => void;
  color: string;
  loading: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.socialButton} activeOpacity={0.8} disabled={loading}>
      <View style={[styles.socialIcon, { borderColor: `${color}44` }]}>
        {loading ? (
          <ActivityIndicator color={color} size="small" />
        ) : (
          <Icon color={color} size={18} />
        )}
      </View>
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function GoogleIcon({ size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="#FFFFFF" />
      <SvgText
        x="12"
        y="16"
        fill="#EA4335"
        fontSize="13"
        fontWeight="700"
        textAnchor="middle"
      >
        G
      </SvgText>
    </Svg>
  );
}

function InstagramIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="4" y="4" width="16" height="16" rx="5" stroke={color} strokeWidth="2.2" fill="none" />
      <Circle cx="12" cy="12" r="3.8" stroke={color} strokeWidth="2.2" fill="none" />
      <Circle cx="16.8" cy="7.2" r="1.2" fill={color} />
    </Svg>
  );
}

function VybeInput({
  Icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  rightAction,
}: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
      <Icon color={focused ? Colors.secondary : Colors.textMuted} size={20} strokeWidth={2} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
      {rightAction}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  socialSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    minHeight: 54,
  },
  socialIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabel: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  formSection: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputShell: {
    height: 54,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputShellFocused: {
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtn: {
    marginTop: Spacing.sm,
  },
  forgotBtn: {
    alignSelf: 'center',
    padding: Spacing.sm,
  },
  forgotText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  feedback: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  registerText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  registerLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.secondary,
  },
});
