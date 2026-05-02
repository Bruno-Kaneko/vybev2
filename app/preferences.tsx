import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Info,
  Key,
  Lock,
  Mail,
  MessageCircle,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { setProfilePrivacy } from '@/lib/db';
import { VybeButton } from '@/components/ui';

type Prefs = {
  notifLikes: boolean;
  notifFollows: boolean;
  notifMessages: boolean;
  notifGroups: boolean;
  notifNearby: boolean;
  privateProfile: boolean;
};

const DEFAULTS: Prefs = {
  notifLikes: true,
  notifFollows: true,
  notifMessages: true,
  notifGroups: true,
  notifNearby: false,
  privateProfile: false,
};

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Account modals
  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    const saved = user?.user_metadata?.preferences as Partial<Prefs> | undefined;
    if (saved) setPrefs({ ...DEFAULTS, ...saved });
  }, [user]);

  const update = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaveState('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await supabase.auth.updateUser({ data: { preferences: next } });
        if (key === 'privateProfile' && user?.id) {
          await setProfilePrivacy(user.id, value);
        }
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1800);
      } catch {
        setSaveState('idle');
      }
    }, 600);
  };

  const saveEmail = async () => {
    if (!newEmail.trim()) return;
    setAccountLoading(true);
    setAccountMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      setAccountMsg('Email de confirmação enviado. Verifique sua caixa de entrada.');
      setNewEmail('');
    } catch (e: any) {
      setAccountMsg(e?.message ?? 'Erro ao atualizar email.');
    } finally {
      setAccountLoading(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 6) { setAccountMsg('Senha precisa ter ao menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setAccountMsg('As senhas não coincidem.'); return; }
    setAccountLoading(true);
    setAccountMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setAccountMsg('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPasswordOpen(false); setAccountMsg(''); }, 1500);
    } catch (e: any) {
      setAccountMsg(e?.message ?? 'Erro ao atualizar senha.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Tem certeza? Esta ação é irreversível.')
        : await new Promise<boolean>(resolve =>
            Alert.alert(
              'Excluir conta',
              'Tem certeza? Esta ação é irreversível e todos os seus dados serão apagados.',
              [
                { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Excluir', style: 'destructive', onPress: () => resolve(true) },
              ]
            )
          );
    if (!confirmed) return;
    await supabase.auth.signOut();
    router.replace('/(onboarding)');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: responsive.pagePadding,
            paddingBottom: insets.bottom + 40,
            maxWidth: responsive.contentMaxWidth,
            alignSelf: 'center' as const,
            width: '100%',
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={Colors.white} size={22} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.title}>Preferências</Text>
          <View style={styles.saveIndicator}>
            {saveState === 'saving' && <Text style={styles.savingText}>Salvando…</Text>}
            {saveState === 'saved' && <Text style={styles.savedText}>Salvo ✓</Text>}
          </View>
        </View>

        {/* Account */}
        <SectionHeader icon={User} label="Conta" />
        <View style={styles.card}>
          <LinkRow
            icon={Mail}
            label="Alterar email"
            sub={user?.email ?? ''}
            onPress={() => { setAccountMsg(''); setEmailOpen(true); }}
          />
          <Divider />
          <LinkRow
            icon={Key}
            label="Alterar senha"
            onPress={() => { setAccountMsg(''); setPasswordOpen(true); }}
          />
        </View>

        {/* Notifications */}
        <SectionHeader icon={Bell} label="Notificações" />
        <View style={styles.card}>
          <ToggleRow
            icon={Heart}
            label="Curtidas"
            sub="Aviso quando alguém curtir seu post"
            value={prefs.notifLikes}
            onChange={v => update('notifLikes', v)}
          />
          <Divider />
          <ToggleRow
            icon={UserPlus}
            label="Novos seguidores"
            sub="Aviso quando alguém começar a te seguir"
            value={prefs.notifFollows}
            onChange={v => update('notifFollows', v)}
          />
          <Divider />
          <ToggleRow
            icon={MessageCircle}
            label="Mensagens"
            sub="Aviso quando receber uma mensagem"
            value={prefs.notifMessages}
            onChange={v => update('notifMessages', v)}
          />
          <Divider />
          <ToggleRow
            icon={Users}
            label="Grupões"
            sub="Aviso sobre atividade nos grupões que você participa"
            value={prefs.notifGroups}
            onChange={v => update('notifGroups', v)}
          />
          <Divider />
          <ToggleRow
            icon={Bell}
            label="Pessoas por perto"
            sub="Aviso quando alguém que você segue estiver próximo"
            value={prefs.notifNearby}
            onChange={v => update('notifNearby', v)}
          />
        </View>

        {/* Privacy */}
        <SectionHeader icon={Lock} label="Privacidade" />
        <View style={styles.card}>
          <ToggleRow
            icon={Eye}
            label="Perfil privado"
            sub="Apenas seguidores aprovados veem seus posts"
            value={prefs.privateProfile}
            onChange={v => update('privateProfile', v)}
          />
        </View>

        {/* About */}
        <SectionHeader icon={Info} label="Sobre" />
        <View style={styles.card}>
          <LinkRow icon={Shield} label="Termos de uso" onPress={() => {}} />
          <Divider />
          <LinkRow icon={Lock} label="Política de privacidade" onPress={() => {}} />
          <Divider />
          <InfoRow label="Versão" value="1.0.0 (beta)" />
        </View>

        {/* Delete account */}
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity style={styles.dangerRow} activeOpacity={0.75} onPress={handleDeleteAccount}>
            <Trash2 color={Colors.urgent} size={18} strokeWidth={2.2} />
            <Text style={styles.dangerText}>Excluir conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change email modal */}
      <Modal visible={emailOpen} transparent animationType="fade" onRequestClose={() => setEmailOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Alterar email</Text>
            <Text style={styles.modalSub}>Atual: {user?.email}</Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Novo email"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            />
            {accountMsg ? <Text style={styles.accountMsg}>{accountMsg}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEmailOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <VybeButton label="Salvar" onPress={saveEmail} loading={accountLoading} style={styles.saveBtn} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change password modal */}
      <Modal visible={passwordOpen} transparent animationType="fade" onRequestClose={() => setPasswordOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Alterar senha</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nova senha"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar nova senha"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            />
            {accountMsg ? <Text style={styles.accountMsg}>{accountMsg}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPasswordOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <VybeButton label="Salvar" onPress={savePassword} loading={accountLoading} style={styles.saveBtn} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── sub-components ──────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon color={Colors.textMuted} size={14} strokeWidth={2.2} />
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

function ToggleRow({ icon: Icon, label, sub, value, onChange }: {
  icon: any; label: string; sub: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon color={Colors.textMuted} size={17} strokeWidth={2.1} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.secondary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

function LinkRow({ icon: Icon, label, sub, onPress }: {
  icon: any; label: string; sub?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowIcon}>
        <Icon color={Colors.textMuted} size={17} strokeWidth={2.1} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {onPress && <ChevronRight color={Colors.textMuted} size={16} strokeWidth={2} />}
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, marginBottom: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.xl, color: Colors.white },
  saveIndicator: { width: 70, alignItems: 'flex-end' },
  savingText: { fontFamily: FontFamily.body, fontSize: FontSize.xs, color: Colors.textMuted },
  savedText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.success },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs,
    color: Colors.textMuted, letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  dangerCard: { marginTop: Spacing.xl, borderColor: Colors.urgentGlow },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    gap: Spacing.md, minHeight: 56,
  },
  rowIcon: { width: 24, alignItems: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.white },
  rowSub: { fontFamily: FontFamily.body, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: FontSize.xs * 1.5 },
  rowValue: { fontFamily: FontFamily.body, fontSize: FontSize.sm, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.lg + 24 + Spacing.md },
  dangerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md, minHeight: 56,
  },
  dangerText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.urgent },
  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing['2xl'], paddingBottom: Spacing['4xl'], gap: Spacing.md,
  },
  modalTitle: { fontFamily: FontFamily.heading, fontSize: FontSize['2xl'], color: Colors.white },
  modalSub: { fontFamily: FontFamily.body, fontSize: FontSize.sm, color: Colors.textMuted, marginTop: -Spacing.xs },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, height: 50,
    fontFamily: FontFamily.body, fontSize: FontSize.md, color: Colors.text,
  },
  accountMsg: {
    fontFamily: FontFamily.body, fontSize: FontSize.sm, color: Colors.success,
    textAlign: 'center',
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.textMuted },
  saveBtn: { flex: 1 },
});
