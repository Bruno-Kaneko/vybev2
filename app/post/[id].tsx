import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing } from '@/constants';
import { MOCK_POSTS } from '@/constants/MockData';
import { Avatar, PostTimer } from '@/components/ui';

const { width: W, height: H } = Dimensions.get('window');

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const post = MOCK_POSTS.find(p => p.id === id) ?? MOCK_POSTS[0];

  return (
    <View style={styles.root}>
      <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(10,10,10,0.4)', 'transparent', 'rgba(10,10,10,0.92)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.35, 1]}
      />

      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + Spacing.sm }]}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={[styles.info, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.userRow}>
          <Avatar uri={post.user.avatar} size="sm" withGradientBorder />
          <View>
            <Text style={styles.username}>{post.user.username}</Text>
            <Text style={styles.placeName}>📍 {post.placeName}</Text>
          </View>
          <PostTimer expiresAt={post.expiresAt} />
        </View>
        {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute',
    left: Spacing.xl,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  backText: { fontFamily: FontFamily.heading, fontSize: FontSize.xl, color: Colors.white },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  username: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.md, color: Colors.white },
  placeName: { fontFamily: FontFamily.body, fontSize: FontSize.xs, color: Colors.textDim },
  caption: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.white },
});
