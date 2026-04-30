import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Beer, Camera, Check, Crown, Gift, Heart, MapPin, Ticket, Users, X, type LucideIcon } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_REWARDS } from '@/constants/MockData';
import { useResponsive } from '@/hooks/useResponsive';
import type { Reward } from '@/types';

type RewardFilter = 'todos' | Reward['category'];

const EARN_WAYS: Array<{ id: string; Icon: LucideIcon; label: string; points: number }> = [
  { id: 'post', Icon: Camera, label: 'Postar foto', points: 30 },
  { id: 'checkin', Icon: MapPin, label: 'Check-in no lugar', points: 10 },
  { id: 'reaction', Icon: Heart, label: 'Receber reacao', points: 5 },
  { id: 'follow', Icon: Users, label: 'Novo seguidor', points: 15 },
];

const REWARD_FILTERS: Array<{ key: RewardFilter; label: string; Icon: LucideIcon }> = [
  { key: 'todos',    label: 'Todos',    Icon: Gift },
  { key: 'drink',    label: 'Drinks',   Icon: Beer },
  { key: 'discount', label: 'Desconto', Icon: Ticket },
  { key: 'vip',      label: 'VIP',      Icon: Crown },
];

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const [userPoints, setUserPoints] = useState(0);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [redeemReward, setRedeemReward] = useState<Reward | null>(null);
  const [redeemed, setRedeemed] = useState(false);
  const [rewardFilter, setRewardFilter] = useState<RewardFilter>('todos');

  const filteredRewards = rewardFilter === 'todos'
    ? MOCK_REWARDS
    : MOCK_REWARDS.filter(r => r.category === rewardFilter);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredRewards}
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
                  <View style={styles.earnBottom}>
                    <Text style={styles.earnPoints}>+{item.points} pts</Text>
                    <TouchableOpacity
                      style={[styles.collectBtn, collected.has(item.id) && styles.collectBtnDone]}
                      onPress={() => {
                        if (!collected.has(item.id)) {
                          setCollected(prev => new Set([...prev, item.id]));
                          setUserPoints(prev => prev + item.points);
                        }
                      }}
                      disabled={collected.has(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.collectBtnText}>{collected.has(item.id) ? '✓' : 'Coletar'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recompensas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
              {REWARD_FILTERS.map(f => {
                const active = rewardFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setRewardFilter(f.key)}
                    activeOpacity={0.8}
                  >
                    <f.Icon color={active ? Colors.white : Colors.textMuted} size={13} strokeWidth={2.2} />
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <RewardCard
              reward={item}
              userPoints={userPoints}
              maxWidth={responsive.contentMaxWidth}
              onPress={() => { setRedeemed(false); setRedeemReward(item); }}
            />
          </View>
        )}
      />

      <Modal visible={!!redeemReward} transparent animationType="fade" onRequestClose={() => setRedeemReward(null)}>
        <View style={styles.redeemOverlay}>
          <View style={styles.redeemCard}>
            <TouchableOpacity style={styles.redeemClose} onPress={() => setRedeemReward(null)}>
              <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
            </TouchableOpacity>

            {redeemed ? (
              <View style={styles.redeemSuccess}>
                <View style={styles.redeemCheckCircle}>
                  <Check color={Colors.white} size={32} strokeWidth={2.5} />
                </View>
                <Text style={styles.redeemSuccessTitle}>Resgatado!</Text>
                <Text style={styles.redeemSuccessSub}>Mostre o QR code no balcão</Text>
                {/* QR code mock */}
                <View style={styles.qrBox}>
                  {Array.from({ length: 5 }).map((_, row) => (
                    <View key={row} style={styles.qrRow}>
                      {Array.from({ length: 5 }).map((_, col) => (
                        <View
                          key={col}
                          style={[
                            styles.qrCell,
                            ((row + col) % 2 === 0 || (row === 0 && col < 3) || (col === 0 && row < 3))
                              && styles.qrCellFilled,
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>
                <Text style={styles.qrCode}>{redeemReward?.id.toUpperCase()}-{Date.now().toString().slice(-6)}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.redeemTitle}>{redeemReward?.title}</Text>
                <Text style={styles.redeemDesc}>{redeemReward?.description}</Text>
                <Text style={styles.redeemPartner}>{redeemReward?.partnerName}</Text>
                <View style={styles.redeemCostRow}>
                  <Text style={styles.redeemCostLabel}>Custo</Text>
                  <Text style={styles.redeemCostValue}>{redeemReward?.pointsCost} pts</Text>
                </View>
                <View style={styles.redeemCostRow}>
                  <Text style={styles.redeemCostLabel}>Seu saldo</Text>
                  <Text style={[styles.redeemCostValue, { color: userPoints >= (redeemReward?.pointsCost ?? 0) ? Colors.gold : Colors.urgent }]}>
                    {userPoints} pts
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.redeemBtn, userPoints < (redeemReward?.pointsCost ?? 0) && { opacity: 0.4 }]}
                  disabled={userPoints < (redeemReward?.pointsCost ?? 0)}
                  activeOpacity={0.85}
                  onPress={() => setRedeemed(true)}
                >
                  <Text style={styles.redeemBtnText}>Resgatar agora</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RewardCard({ reward, userPoints, maxWidth, onPress }: { reward: Reward; userPoints: number; maxWidth: number; onPress: () => void }) {
  const canRedeem = userPoints >= reward.pointsCost;
  const categoryIcon: Record<Reward['category'], LucideIcon> = {
    drink: Beer,
    discount: Ticket,
    vip: Crown,
    event: Gift,
  };
  const Icon = categoryIcon[reward.category];

  return (
    <TouchableOpacity style={[styles.rewardCard, { maxWidth }, !canRedeem && styles.rewardDisabled]} activeOpacity={0.85} onPress={onPress}>
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
  listContent: {},
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
  earnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectBtn: {
    height: 26,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectBtnDone: {
    backgroundColor: Colors.surfaceElevated,
  },
  collectBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
  filterRow: {
    marginBottom: Spacing.md,
  },
  filterRowContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  filterChipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.white,
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
  // Redeem modal
  redeemOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  redeemCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  redeemClose: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  redeemDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    lineHeight: FontSize.md * 1.5,
  },
  redeemPartner: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.secondary,
  },
  redeemCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  redeemCostLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  redeemCostValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.lg,
    color: Colors.gold,
  },
  redeemBtn: {
    height: 50,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  redeemBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  redeemSuccess: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  redeemCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  redeemSuccessTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    color: Colors.white,
  },
  redeemSuccessSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  qrBox: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    gap: 4,
  },
  qrRow: {
    flexDirection: 'row',
    gap: 4,
  },
  qrCell: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  qrCellFilled: {
    backgroundColor: '#0A0A0F',
  },
  qrCode: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
