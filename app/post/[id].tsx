import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Share as NativeShare, ScrollView, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, ChevronLeft, Heart, MapPin, MessageCircle, Send } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS } from '@/constants/MockData';
import { Avatar, PostTimer } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';

type Comment = { id: string; user: string; text: string };
const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', user: 'mari_sp', text: 'Que lugar incrível!' },
  { id: 'c2', user: 'joao_beats', text: 'To chegando aí 🔥' },
];

export default function PostDetailScreen() {
  const { id, autoComment } = useLocalSearchParams<{ id: string; autoComment?: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const post = MOCK_POSTS.find(p => p.id === id) ?? MOCK_POSTS[0];
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const commentRef = useRef<TextInput>(null);
  const commentReveal = useRef(new Animated.Value(0)).current;

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

  const sendComment = () => {
    if (!commentText.trim()) return;
    setComments(prev => [...prev, { id: `c${Date.now()}`, user: 'eu', text: commentText.trim() }]);
    setCommentText('');
  };

  const sharePost = async () => {
    setShared(true);
    try {
      await NativeShare.share({
        title: 'VYBE',
        message: `${post.user.displayName} esta em ${post.placeName}: ${post.caption}`,
      });
    } catch {
      setShared(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.shell, { maxWidth: responsive.feedMaxWidth }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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

          <Text style={styles.caption}>{post.caption}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => setLiked(prev => !prev)} style={styles.actionBtn}>
              <Heart
                color={liked ? Colors.secondary : Colors.white}
                fill={liked ? Colors.secondary : 'transparent'}
                size={24}
                strokeWidth={2.2}
              />
              <Text style={styles.actionLabel}>{post.reactions.heart + (liked ? 1 : 0)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setCommentOpen(prev => !prev)}>
              <MessageCircle color={commentOpen ? Colors.secondary : Colors.white} size={24} strokeWidth={2.2} />
              <Text style={styles.actionLabel}>{comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sharePost} style={styles.actionBtn}>
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
          {comments.map(c => (
            <View key={c.id} style={styles.commentRow}>
              <Text style={styles.commentUser}>@{c.user}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
          <View style={styles.commentInputRow}>
            <TextInput
              ref={commentRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Adicionar comentário..."
              placeholderTextColor={Colors.textDisabled}
              style={[styles.commentInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              returnKeyType="send"
              onSubmitEditing={sendComment}
            />
            <TouchableOpacity
              onPress={sendComment}
              style={[styles.commentSendBtn, !commentText.trim() && { opacity: 0.4 }]}
              disabled={!commentText.trim()}
            >
              <ArrowUp color={Colors.white} size={16} strokeWidth={2.5} />
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
  commentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  commentUser: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.secondary,
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
    color: Colors.textDim,
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
