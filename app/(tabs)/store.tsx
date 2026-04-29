import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_REWARDS } from '@/constants/MockData';
import type { Reward } from '@/types';

const MY_POINTS = 1240;

const HOW_TO_EARN = [
  { emoji: '📸', label: 'Postar foto', points: '+30' },
  { emoji: '📍', label: 'Check-in no lugar', points: '+10' },
  { emoji: '🔥', label: 'Receber reação', points: '+5' },
  { emoji: '👥', label: 'Novo seguidor', points: '+15' },
];

export default function StoreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Loja</Text>
        <Text style={styles.subtitle}>Troque seus pontos por drinks 🍹</Text>
      </View>

      {/* Points card */}
      <LinearGradient
        colors={Colors.gradientBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pointsCard}
      >
        <Text style={styles.pointsLabel}>Seus pontos</Text>
        <Text style={styles.pointsValue}>{MY_POINTS.toLocaleString('pt-BR')}</Text>
        <Text style={styles.pointsUnit}>VYBEPOINTS</Text>
      </LinearGradient>

      {/* How to earn */}
      <View style={styles.earnSection}>
        <Text style={styles.sectionTitle}>Como ganhar mais pontos</Text>
        <View style={styles.earnGrid}>
          {HOW_TO_EARN.map((item, i) => (
            <View key={i} style={styles.earnItem}>
              <Text style={styles.earnEmoji}>{item.emoji}</Text>
              <Text style={styles.earnLabel}>{item.label}</Text>
              <Text style={styles.earnPoints}>{item.points}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rewards */}
      <View style={styles.rewardsSection}>
        <Text style={styles.sectionTitle}>Recompensas disponíveis</Text>
        {MOCK_REWARDS.map((reward, i) => (
          <View key={reward.id}>
            <RewardCard reward={reward} userPoints={MY_POINTS} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function RewardCard({ reward, userPoints }: { reward: Reward; userPoints: number }) {
  const canRedeem = userPoints >= reward.pointsCost;
  const categoryEmoji: Record<Reward['category'], string> = {
    drink: '🍺',
    discount: '🏷️',
    vip: '⭐',
    event: '🎪',
  };

  return (
    <TouchableOpacity
      style={[styles.rewardCard, !canRedeem && styles.rewardCardDisabled]}
      activeOpacity={0.85}
      disabled={!canRedeem}
    >
      <View style={styles.rewardLeft}>
        <Text style={styles.rewardEmoji}>{categoryEmoji[reward.category]}</Text>
      </View>
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardTitle}>{reward.title}</Text>
        <Text style={styles.rewardPartner}>{reward.partnerName}</Text>
        <Text style={styles.rewardDesc} numberOfLines={1}>{reward.description}</Text>
      </View>
      <View style={styles.rewardRight}>
        <Text style={[styles.rewardCost, canRedeem && { color: Colors.secondary }]}>
          {reward.pointsCost}
        </Text>
        <Text style={styles.rewardPts}>pts</Text>
        <View style={[styles.redeemBtn, !canRedeem && styles.redeemBtnDisabled]}>
          <Text style={[styles.redeemText, !canRedeem && { color: Colors.textDisabled }]}>
            {canRedeem ? 'Resgatar' : 'Faltam pts'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['3xl'],
    color: Colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  pointsCard: {
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  pointsLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pointsValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['5xl'],
    color: Colors.white,
    lineHeight: FontSize['5xl'] * 1.1,
  },
  pointsUnit: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 3,
    marginTop: 2,
  },
  earnSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
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
  },
  earnItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  earnEmoji: {
    fontSize: 24,
  },
  earnLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  earnPoints: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.md,
    color: Colors.gold,
  },
  rewardsSection: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rewardCardDisabled: {
    opacity: 0.5,
  },
  rewardLeft: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardEmoji: {
    fontSize: 28,
  },
  rewardInfo: {
    flex: 1,
    gap: 2,
  },
  rewardTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  rewardPartner: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.secondary,
  },
  rewardDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  rewardRight: {
    alignItems: 'center',
    gap: 4,
  },
  rewardCost: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.textMuted,
  },
  rewardPts: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
    marginTop: -4,
  },
  redeemBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  redeemBtnDisabled: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  redeemText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: Colors.white,
  },
});
