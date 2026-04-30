import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Heart,
  Info,
  Lock,
  MessageCircle,
  Moon,
  Shield,
  Trash2,
  UserX,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants';
import { useResponsive } from '@/hooks/useResponsive';

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();

  // Notification prefs
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifGroups, setNotifGroups] = useState(true);
  const [notifNearby, setNotifNearby] = useState(false);

  // Privacy prefs
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);
  const [showLocation, setShowLocation] = useState(true);

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
          <View style={{ width: 40 }} />
        </View>

        {/* Notifications */}
        <SectionHeader icon={Bell} label="Notificações" />
        <View style={styles.card}>
          <ToggleRow
            icon={Heart}
            label="Curtidas"
            sub="Avisar quando alguém curtir seu post"
            value={notifLikes}
            onChange={setNotifLikes}
          />
          <Divider />
          <ToggleRow
            icon={UserX}
            label="Novos seguidores"
            sub="Avisar quando alguém começar a te seguir"
            value={notifFollows}
            onChange={setNotifFollows}
          />
          <Divider />
          <ToggleRow
            icon={MessageCircle}
            label="Mensagens"
            sub="Avisar quando receber uma mensagem"
            value={notifMessages}
            onChange={setNotifMessages}
          />
          <Divider />
          <ToggleRow
            icon={Globe}
            label="Grupões"
            sub="Avisar sobre atividade nos grupões que você participa"
            value={notifGroups}
            onChange={setNotifGroups}
          />
          <Divider />
          <ToggleRow
            icon={Bell}
            label="Pessoas por perto"
            sub="Avisar quando alguém que você segue estiver próximo"
            value={notifNearby}
            onChange={setNotifNearby}
          />
        </View>

        {/* Privacy */}
        <SectionHeader icon={Lock} label="Privacidade" />
        <View style={styles.card}>
          <ToggleRow
            icon={Eye}
            label="Perfil privado"
            sub="Apenas seguidores veem seus posts e stories"
            value={privateProfile}
            onChange={setPrivateProfile}
          />
          <Divider />
          <ToggleRow
            icon={Heart}
            label="Mostrar status de relacionamento"
            sub="Exibir no seu perfil público"
            value={showStatus}
            onChange={setShowStatus}
          />
          <Divider />
          <ToggleRow
            icon={MessageCircle}
            label="Aceitar mensagens diretas"
            sub="Qualquer pessoa pode te enviar DM"
            value={allowDMs}
            onChange={setAllowDMs}
          />
          <Divider />
          <ToggleRow
            icon={Globe}
            label="Aparecer no mapa"
            sub="Sua localização aparece nos pins do mapa"
            value={showLocation}
            onChange={setShowLocation}
          />
        </View>

        {/* Appearance */}
        <SectionHeader icon={Moon} label="Aparência" />
        <View style={styles.card}>
          <LinkRow
            icon={Moon}
            label="Tema"
            value="Escuro"
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

        {/* Danger zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity style={styles.dangerRow} activeOpacity={0.75} onPress={() => {}}>
            <Trash2 color={Colors.urgent} size={18} strokeWidth={2.2} />
            <Text style={styles.dangerText}>Excluir conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon color={Colors.textMuted} size={14} strokeWidth={2.2} />
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  sub,
  value,
  onChange,
}: {
  icon: any;
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon color={Colors.textMuted} size={17} strokeWidth={2.1} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
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

function LinkRow({
  icon: Icon,
  label,
  value,
  onPress,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowIcon}>
        <Icon color={Colors.textMuted} size={17} strokeWidth={2.1} />
      </View>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
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
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dangerCard: {
    marginTop: Spacing.xl,
    borderColor: Colors.urgentGlow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  rowSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  rowValue: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.lg + 24 + Spacing.md,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
  },
  dangerText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.urgent,
  },
});
