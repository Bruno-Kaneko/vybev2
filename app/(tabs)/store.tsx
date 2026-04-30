import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Beer, Camera, Crown, Gift, Heart, MapPin, Ticket, Users, type LucideIcon } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_REWARDS } from '@/constants/MockData';
import { useResponsive } from '@/hooks/useResponsive';
import type { Reward } from '@/types';

const EARN_WAYS: Array<{ Icon: LucideIcon; label: string; points: string }> = [
  { Icon: Camera, label: 'Postar foto', points: '+30' },
  { Icon: MapPin, label: 'Check-in no lugar', points: '+10' },
  { Icon: Heart, label: 'Receber reacao', points: '+5' },
  { Icon: Users, label: 'Novo seguidor', points: '+15' },
];

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const userPoints = 1240;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        data={MOCK_REWARDS}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: responsive.pagePadding,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        ListHeaderComponent={
          <View style={[styles.shell, { maxWidth: responsive.contentMaxWidth }]}>
            <Text style={styles.title}>Loja</Text>
            <Text style={styles.subtitle}>Troque seus pontos por recompensas</Text>

            <View style={styles.pointsCard}>
              <Text style={styles.pointsLabel}>Seus pontos</Text>
              <Text style={styles.pointsValue}>{userPoints}</Text>
            </View>

            <Text style={styles.sectionTitle}>Como ganhar pontos</Text>
            <View style={styles.earnGrid}>
              {EARN_WAYS.map(item => (
                <View key={item.label} style={styles.earnCard}>
                  <item.Icon color={Colors.secondary} size={24} strokeWidth={2.2} />
                  <Text style={styles.earnLabel}>{item.label}</Text>
                  <Text style={styles.earnPoints}>{item.points}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recompensas</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RewardCard reward={item} userPoints={userPoints} maxWidth={responsive.contentMaxWidth} />
        )}
      />
    </View>
  );
}

function RewardCard({ reward, userPoints, maxWidth }: { reward: Reward; userPoints: number; maxWidth: number }) {
  const canRedeem = userPoints >= reward.pointsCost;
  const categoryIcon: Record<Reward['category'], LucideIcon> = {
    drink: Beer,
    discount: Ticket,
    vip: Crown,
    event: Gift,
  };
  const Icon = categoryIcon[reward.category];

  return (
    <TouchableOpacity style={[styles.rewardCard, { maxWidth }, !canRedeem && styles.rewardDisabled]} activeOpacity={0.85}>
      <View style={styles.rewardIcon}>
        <Icon color={canRedeem ? Colors.gold : Colors.textMuted} size={24} strokeWidth={2.2} />
      </View>
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardTitle} numberOfLines={1}>{reward.title}</Text>
        <Text style={styles.rewardDesc} numberOfLines={1}>{reward.description}</Text>
        <Text style={styles.partner} numberOfLines={1}>{reward.partnerName}</Text>
      </View>
      <View style={styles.costPill}>
        <Text style={styles.costText}>{reward.pointsCost}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    alignItems: 'center',
  },
  shell: {
    width: '100%',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['3xl'],
    color: Colors.white,
    paddingTop: Spacing.md,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  pointsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  pointsLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pointsValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['4xl'],
    color: Colors.gold,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  earnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  earnCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  earnLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  earnPoints: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.md,
    color: Colors.secondary,
  },
  rewardCard: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  rewardDisabled: {
    opacity: 0.55,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    flexShrink: 0,
  },
  rewardInfo: {
    flex: 1,
    minWidth: 0,
  },
  rewardTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  rewardDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  partner: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
    marginTop: 4,
  },
  costPill: {
    minWidth: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  costText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.sm,
    color: Colors.gold,
    textAlign: 'center',
  },
});
