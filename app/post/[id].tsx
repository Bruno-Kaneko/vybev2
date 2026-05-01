import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Share as NativeShare, ScrollView,
  Animated, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, ChevronLeft, Heart, MapPin, MessageCircle, Send } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS } from '@/constants/MockData';
import { Avatar, PostTimer } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { getPost, getComments, addComment } from '@/lib/db';
import type { DBComment } from '@/lib/db';
import type { Post } from '@/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MOCK_FALLBACK_COMMENTS: DBComment[] = [];

export default function PostDetailScreen() {
  const { id, autoComment } = useLocalSearchParams<{ id: string; autoComment?: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user } = useAuth();
  const isReal = UUID_RE.test(id ?? '');

  const [post, setPost] = useState<Post | null>(
    isReal ? null : (MOCK_POSTS.find(p => p.id === id) ?? MOCK_POSTS[0])
  );
  const [loading, setLoading] = useState(isReal);
  const [liked, setLiked] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;
  const [shared, setShared] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState<DBComment[]>(MOCK_FALLBACK_COMMENTS);
  const commentRef = useRef<TextInput>(null);
  const commentReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isReal) return;
    setLoading(true);
    Promise.all([
      getPost(id),
      getComments(id),
    ]).then(([p, c]) => {
      if (p) setPost(p);
      setComments(c);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (autoComment === '1') setCommentOpen(true);
  }, []);

  useEffect(() => {
    if (commentOpen) {
      Animated.spring(commentReveal, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 160 } as any).start(() => {
        commentRef.current?.focus();
      });
    } else {
      Animated.timing(commentReveal, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [commentOpen]);

  const sendComment = async () => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    if (isReal && user?.id) {
      setSending(true);
      try {
        await addComment(id, user.id, text);
        const updated = await getComments(id);
        setComments(updated);
      } catch {
        // silently ignore
      } finally {
        setSending(false);
      }
    } else {
      setComments(prev => [...prev, {
        id: `local_${Date.now()}`,
        post_id: id,
        user_id: user?.id ?? 'me',
        text,
        created_at: new Date().toISOString(),
        profiles: { id: user?.id ?? 'me', username: user?.user_metadata?.username ?? 'eu', display_name: null, avatar_url: null },
      }]);
    }
  };

  const sharePost = async () => {
    if (!post) return;
    setShared(true);
    try {
      await NativeShare.share({
        title: 'VYBE',
        message: `${post.user.displayName} está em ${post.placeName}${post.caption ? ': ' + post.caption : ''}`,
      });
    } catch {
      setShared(false);
    }
  };

  if (loading || !post) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.secondary} size="large" />
      </View>
    );
  }

  const likeCount = post.reactions.heart + (liked ? 1 : 0);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.shell, { maxWidth: responsive.feedMaxWidth }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ChevronLeft color={Colors.white} size={24} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.76)']}
          style={styles.imageOverlay}
        />

        <View style={styles.info}>
          <View style={styles.userRow}>
            <TouchableOpacity
              style={styles.userLeft}
              onPress={() => router.push(`/profile/${post.userId}`)}
              activeOpacity={0.85}
            >
              <Avatar uri={post.user.avatar} size="sm" withGradientBorder />
              <View style={styles.userCopy}>
                <View style={styles.nameLine}>
                  <Text style={styles.username}>{post.user.displayName}</Text>
                  <View style={styles.placeLine}>
                    <MapPin color={Colors.secondary} size={13} strokeWidth={2.4} />
                    <Text style={styles.placeName} numberOfLines={1}>{post.placeName}</Text>
                  </View>
                </View>
                <Text style={styles.handle}>@{post.user.username}</Text>
              </View>
            </TouchableOpacity>
            <PostTimer expiresAt={post.expiresAt} />
          </View>

          {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => {
                Animated.sequence([
                  Animated.spring(likeScale, { toValue: 1.28, useNativeDriver: true, damping: 4, stiffness: 400 } as any),
                  Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 260 } as any),
                ]).start();
                setLiked(prev => !prev);
              }}
              style={styles.actionBtn}
            >
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <Heart
                  color={liked ? Colors.secondary : Colors.white}
                  fill={liked ? Colors.secondary : 'transparent'}
                  size={24}
                  strokeWidth={2.2}
                />
              </Animated.View>
              <Text style={styles.actionLabel}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setCommentOpen(prev => !prev)} activeOpacity={0.75}>
              <MessageCircle color={commentOpen ? Colors.secondary : Colors.white} size={24} strokeWidth={2.2} />
              <Text style={styles.actionLabel}>{comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sharePost} style={styles.actionBtn} activeOpacity={0.75}>
              <Send color={shared ? Colors.secondary : Colors.white} size={23} strokeWidth={2.2} />
              <Text style={styles.actionLabel}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={[styles.commentSection, {
          opacity: commentReveal,
          transform: [{ translateY: commentReveal.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          pointerEvents: commentOpen ? 'auto' : 'none',
        }]}>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>Seja o primeiro a comentar</Text>
          ) : (
            comments.map(c => (
              <View key={c.id} style={styles.commentRow}>
                <Avatar uri={c.profiles?.avatar_url ?? ''} size="xs" />
                <View style={styles.commentBody}>
                  <Text style={styles.commentUser}>
                    {c.profiles?.display_name ?? c.profiles?.username ?? 'usuario'}
                  </Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            ))
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              ref={commentRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Adicionar comentário..."
              placeholderTextColor={Colors.textDisabled}
              style={[
                styles.commentInput,
                Platform.OS === 'web' && ({ outlineStyle: 'none', backgroundColor: 'transparent' } as any),
              ]}
              returnKeyType="send"
              onSubmitEditing={sendComment}
              editable={!sending}
            />
            <TouchableOpacity
              onPress={sendComment}
              style={[styles.commentSendBtn, (!commentText.trim() || sending) && { opacity: 0.4 }]}
              disabled={!commentText.trim() || sending}
            >
              {sending
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <ArrowUp color={Colors.white} size={16} strokeWidth={2.5} />
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
  },
  shell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  commentSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  noComments: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  commentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  commentBody: {
    flex: 1,
  },
  commentUser: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginBottom: 1,
  },
  commentText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: FontSize.sm * 1.45,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.lg,
    paddingRight: 5,
    height: 44,
    marginTop: Spacing.xs,
  },
  commentInput: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: Colors.surface,
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 190,
  },
  info: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  userLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userCopy: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 0,
  },
  username: {
    flexShrink: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  placeLine: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  placeName: {
    flexShrink: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  handle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  caption: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
    lineHeight: FontSize.md * 1.45,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 40,
  },
  actionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
});
