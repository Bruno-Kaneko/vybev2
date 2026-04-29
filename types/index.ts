export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  points: number;
  followers: number;
  following: number;
  createdAt: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  imageUrl: string;
  caption?: string;
  placeName: string;
  placeId?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  expiresAt: number;
  createdAt: number;
  reactions: {
    fire: number;
    heart: number;
  };
  commentCount: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  category: 'club' | 'bar' | 'event' | 'lounge';
  followers?: number;
  tags?: string[];
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  activePosts: number;
  activeUsers: number;
  thumbnail?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  partnerName: string;
  partnerLogo?: string;
  imageUrl?: string;
  category: 'drink' | 'discount' | 'vip' | 'event';
}

export type TimerDuration = 2 | 4 | 6;

export function getTimeRemaining(expiresAt: number): {
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
  isExpired: boolean;
  label: string;
} {
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isUrgent: true, isExpired: true, label: 'Expirado' };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isUrgent = diff < 30 * 60 * 1000; // < 30 minutes

  let label: string;
  if (hours > 0) {
    label = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    label = `${minutes}m ${seconds}s`;
  } else {
    label = `${seconds}s`;
  }

  return { hours, minutes, seconds, isUrgent, isExpired: false, label };
}
