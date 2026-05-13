import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Modal,
  Alert,
  Platform,
  RefreshControl,
  Share as NativeShare,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AtSign, ChevronLeft, Flag, Grid3X3, MapPin, MessageCircle, MoreHorizontal, Share2, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_USERS, MOCK_POSTS } from '@/constants/MockData';
import { Avatar, Skeleton, VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { getProfile, getUserPosts, isFollowing, followUser, unfollowUser, getFollowRequestStatus, sendFollowRequest, cancelFollowRequest, notifyUser } from '@/lib/db';
import type { FollowRequestStatus } from '@/lib/db';
import type { RelationshipStatus, Post, User } from '@/types';
import { Lock } from 'lucide-react-native';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_CONFIG: Record<RelationshipStatus, { label: string; color: string; bg: string }> = {
  solteiro:  { label: 'Solteiro(a)', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  namorando: { label: 'Namorando',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  ficando:   { label: 'Ficando',     color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  curtindo:  { label: 'Só curtindo', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

function StatusBadge({ status }: { status: RelationshipStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[statusStyles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '44' }]}>
      <Text style={[statusStyles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.3,
  },
});

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user: authUser } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [unfollowConfirmOpen, setUnfollowConfirmOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isReal = UUID_RE.test(id ?? '');
  const isOwnProfile = isReal && id === authUser?.id;

  useEffect(() => {
    if (isOwnProfile) router.replace('/(tabs)/profile');
  }, [isOwnProfile]);
  const [requestStatus, setRequestStatus] = useState<FollowRequestStatus>('none');
  const [requestLoading, setRequestLoading] = useState(false);

  const loadProfile = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoadingProfile(true);
    if (isReal) {
      try {
        const [p, posts, followingResult, reqStatus] = await Promise.all([
          getProfile(id),
          getUserPosts(id),
          authUser ? isFollowing(authUser.id, id) : Promise.resolve(false),
          authUser && id !== authUser.id ? getFollowRequestStatus(authUser.id, id) : Promise.resolve('none' as FollowRequestStatus),
        ]);
        if (p) setProfileUser(p);
        setUserPosts(posts);
        setFollowing(followingResult);
        setRequestStatus(reqStatus);
      } catch {}
    } else {
      const mock = MOCK_USERS.find(u => u.id === id) ?? MOCK_USERS[0];
      setProfileUser(mock);
      setUserPosts(MOCK_POSTS.filter(p => p.userId === mock.id));
    }
    setLoadingProfile(false);
  }, [id, isReal, authUser?.id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile(true);
    setRefreshing(false);
  }, [loadProfile]);

  const user = profileUser ?? MOCK_USERS[0];

  const handleFollow = async () => {
    if (!authUser || !id) return;
    if (!isReal) { setFollowing(f => !f); return; }

    const targetPrivate = profileUser?.isPrivate ?? false;
    if (targetPrivate && !following) {
      setRequestLoading(true);
      try {
        if (requestStatus === 'pending') {
          await cancelFollowRequest(authUser.id, id);
          setRequestStatus('none');
        } else {
          await sendFollowRequest(authUser.id, id);
          setRequestStatus('pending');
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível completar a ação.');
      } finally {
        setRequestLoading(false);
      }
      return;
    }

    if (following) {
      setUnfollowConfirmOpen(true);
      return;
    }

    setFollowLoading(true);
    try {
      await followUser(authUser.id, id);
      setFollowing(true);
      const actorName = authUser.user_metadata?.username ?? authUser.email?.split('@')[0] ?? 'Alguém';
      notifyUser(id, authUser.id, 'follow', null, 'passou a seguir você', 'VYBE', `${actorName} passou a seguir você`);
    } catch {
      Alert.alert('Erro', 'Não foi possível completar a ação.');
    } finally {
      setFollowLoading(false);
    }
  };

  const doUnfollow = async () => {
    if (!authUser || !id) return;
    setUnfollowConfirmOpen(false);
    setFollowLoading(true);
    setFollowing(false);
    try {
      await unfollowUser(authUser.id, id);
    } catch {
      setFollowing(true);
    } finally {
      setFollowLoading(false);
    }
  };

  const followButtonLabel = () => {
    if (following) return 'Seguindo ✓';
    if (profileUser?.isPrivate) {
      if (requestStatus === 'pending') return 'Solicitado';
      return 'Solicitar';
    }
    return 'Seguir';
  };
  const contentWidth = Math.min(responsive.contentMaxWidth, responsive.width - responsive.pagePadding * 2);
  const thumbGap = Spacing.xs;
  const thumbSize = (contentWidth - thumbGap * 2) / 3;

  const handleShare = async () => {
    try {
      await NativeShare.share({
        title: 'VYBE',
        message: `Veja o perfil de ${user.displayName} no VYBE! @${user.username}`,
      });
    } catch {}
  };

  if (loadingProfile && isReal) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={[styles.content, { paddingHorizontal: responsive.pagePadding, paddingTop: Spacing.md, alignItems: 'center' }]}>
          <View style={[styles.shell, { maxWidth: responsive.contentMaxWidth, gap: Spacing.lg }]}>
            <View style={styles.topBar}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <Skeleton width={44} height={44} borderRadius={22} />
            </View>
            <View style={{ alignItems: 'center', gap: Spacing.md }}>
              <Skeleton width={86} height={86} borderRadius={43} />
              <Skeleton width="50%" height={22} borderRadius={8} />
              <Skeleton width="35%" height={14} borderRadius={6} />
            </View>
            <Skeleton width="100%" height={80} borderRadius={12} />
            <Skeleton width="100%" height={48} borderRadius={24} />
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width="31%" height={120} borderRadius={10} style={{ aspectRatio: 0.78 }} />
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: responsive.pagePadding,
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        isReal ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.secondary}
            colors={[Colors.secondary]}
          />
        ) : undefined
      }
    >
      <View style={[styles.shell, { maxWidth: responsive.contentMaxWidth }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={Colors.textMuted} size={22} strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={handleShare} style={styles.moreBtn}>
              <Share2 color={Colors.textMuted} size={18} strokeWidth={2.2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setReportSent(false); setReportOpen(true); }} style={styles.moreBtn}>
              <MoreHorizontal color={Colors.textMuted} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <Avatar uri={user.avatar} size="xl" withGradientBorder />
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.relationshipStatus ? <StatusBadge status={user.relationshipStatus} /> : null}
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          {user.instagram ? (
            <TouchableOpacity
              style={styles.instagramRow}
              activeOpacity={0.75}
              onPress={() => Linking.openURL(`https://instagram.com/${user.instagram}`)}
            >
              <AtSign color={Colors.textMuted} size={14} strokeWidth={2} />
              <Text style={styles.instagramHandle}>@{user.instagram}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <StatItem label="Posts" value={userPosts.length} />
          <View style={styles.statDivider} />
          <StatItem
            label="Seguindo"
            value={user.following}
            onPress={isReal ? () => router.push({ pathname: '/followers/[id]' as any, params: { id: id!, type: 'following' } }) : undefined}
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Seguidores"
            value={user.followers}
            onPress={isReal ? () => router.push({ pathname: '/followers/[id]' as any, params: { id: id!, type: 'followers' } }) : undefined}
          />
          <View style={styles.statDivider} />
          <StatItem label="Pontos" value={user.points} highlight />
        </View>

        {!isOwnProfile && (
          <View style={styles.actionsRow}>
            <VybeButton
              label={followButtonLabel()}
              onPress={handleFollow}
              loading={followLoading || requestLoading}
              variant={following || requestStatus === 'pending' ? 'outline' : 'primary'}
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              onPress={() => router.dismissTo(`/(tabs)/chat/${user.id}`)}
              style={styles.msgBtn}
            >
              <MessageCircle color={Colors.text} size={19} strokeWidth={2.2} />
              <Text style={styles.msgBtnText}>Mensagem</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <Grid3X3 color={Colors.white} size={18} strokeWidth={2.2} />
            <Text style={styles.sectionTitle}>Posts</Text>
          </View>
          {profileUser?.isPrivate && !following && !isOwnProfile ? (
            <View style={styles.privateBox}>
              <Lock color={Colors.textMuted} size={36} strokeWidth={1.5} />
              <Text style={styles.privateTitle}>Perfil privado</Text>
              <Text style={styles.privateSub}>Siga este perfil para ver os posts.</Text>
            </View>
          ) : (
            <View style={[styles.postsGrid, { gap: thumbGap }]}>
              {userPosts.map(post => (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.postThumb, { width: thumbSize, height: thumbSize * 1.28 }]}
                  onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: post.imageUrl }} style={styles.postThumbImg} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(10,10,15,0.7)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.thumbMeta}>
                    <MapPin color={Colors.textMuted} size={11} strokeWidth={2.2} />
                    <Text style={styles.postThumbTimer} numberOfLines={1}>{post.placeName}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>

    {/* Unfollow confirm modal */}
    <Modal visible={unfollowConfirmOpen} transparent animationType="fade" onRequestClose={() => setUnfollowConfirmOpen(false)}>
      <TouchableOpacity style={reportStyles.overlay} activeOpacity={1} onPress={() => setUnfollowConfirmOpen(false)}>
        <View style={[reportStyles.sheet, { gap: Spacing.lg }]} onStartShouldSetResponder={() => true}>
          <Text style={{ fontFamily: FontFamily.headingMedium, fontSize: FontSize.lg, color: Colors.white, textAlign: 'center' }}>
            Deixar de seguir?
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: FontSize.sm * 1.5 }}>
            Você vai deixar de seguir {user.displayName}.
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              style={[unfollowStyles.btn, unfollowStyles.btnCancel]}
              onPress={() => setUnfollowConfirmOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={[unfollowStyles.btnText, { color: Colors.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[unfollowStyles.btn, unfollowStyles.btnConfirm]}
              onPress={doUnfollow}
              activeOpacity={0.8}
            >
              <Text style={[unfollowStyles.btnText, { color: Colors.white }]}>Deixar de seguir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>

    {/* Report modal */}
    <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
      <TouchableOpacity style={reportStyles.overlay} activeOpacity={1} onPress={() => setReportOpen(false)}>
        <View style={reportStyles.sheet} onStartShouldSetResponder={() => true}>
          <View style={reportStyles.header}>
            <Flag color={Colors.urgent} size={18} strokeWidth={2.2} />
            <Text style={reportStyles.title}>Reportar perfil</Text>
            <TouchableOpacity onPress={() => setReportOpen(false)} style={reportStyles.closeBtn}>
              <X color={Colors.textMuted} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {reportSent ? (
            <View style={reportStyles.sentBox}>
              <Text style={reportStyles.sentEmoji}>✅</Text>
              <Text style={reportStyles.sentTitle}>Reporte enviado</Text>
              <Text style={reportStyles.sentSub}>Nossa equipe vai analisar em até 24h. Obrigado por ajudar a manter a comunidade segura.</Text>
            </View>
          ) : (
            <>
              <Text style={reportStyles.sub}>Por que você está reportando este perfil?</Text>
              {[
                'Conteúdo inapropriado',
                'Spam ou conta falsa',
                'Assédio ou bullying',
                'Discurso de ódio',
                'Outro',
              ].map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={reportStyles.option}
                  activeOpacity={0.75}
                  onPress={() => setReportSent(true)}
                >
                  <Text style={reportStyles.optionText}>{reason}</Text>
                  <ChevronLeft color={Colors.textMuted} size={14} strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
    </>
  );
}

function StatItem({ label, value, highlight, onPress }: { label: string; value: number; highlight?: boolean; onPress?: () => void }) {
  const content = (
    <>
      <Text style={[styles.statValue, highlight && { color: Colors.gold }]}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.statItem}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
  },
  shell: {
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingBottom: Spacing['2xl'],
    gap: Spacing.xs,
  },
  displayName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    color: Colors.white,
    marginTop: Spacing.md,
  },
  username: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  bio: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: FontSize.md * 1.5,
  },
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  instagramHandle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  msgBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  msgBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  postsSection: {
    width: '100%',
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postThumb: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  postThumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbMeta: {
    position: 'absolute',
    left: 5,
    right: 5,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  postThumbTimer: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.textMuted,
  },
  privateBox: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  privateTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  privateSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

const unfollowStyles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnConfirm: {
    backgroundColor: Colors.urgent,
  },
  btnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
  },
});

const reportStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  optionText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  sentBox: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  sentEmoji: {
    fontSize: 36,
  },
  sentTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  sentSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.6,
  },
});

