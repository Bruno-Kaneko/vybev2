import type { Post, User, Place, Chat, Reward } from '@/types';

const NOW = Date.now();
const HOUR = 3600 * 1000;

export const MOCK_USERS: User[] = [
  { id: '1', username: 'ana_silva', displayName: 'Ana Silva', avatar: 'https://i.pravatar.cc/150?img=47', bio: 'São Paulo by night', instagram: 'ana.silva', points: 1240, followers: 892, following: 312, createdAt: NOW - 90 * 24 * HOUR },
  { id: '2', username: 'pedro_fest', displayName: 'Pedro Ferreira', avatar: 'https://i.pravatar.cc/150?img=12', bio: 'Sempre rolando', instagram: 'pedroferreira', points: 780, followers: 541, following: 200, createdAt: NOW - 60 * 24 * HOUR },
  { id: '3', username: 'julia_night', displayName: 'Julia Costa', avatar: 'https://i.pravatar.cc/150?img=32', bio: 'Curtindo a vida', instagram: 'julia.night.sp', points: 2100, followers: 1203, following: 445, createdAt: NOW - 120 * 24 * HOUR },
  { id: '4', username: 'rafael_vybe', displayName: 'Rafael Santos', avatar: 'https://i.pravatar.cc/150?img=8', bio: 'DJ de fim de semana', instagram: 'rafaelvybe', points: 650, followers: 320, following: 180, createdAt: NOW - 30 * 24 * HOUR },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: '1',
    user: MOCK_USERS[0],
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    caption: 'A night não para!',
    placeName: 'Club Fama',
    placeId: 'place1',
    location: { latitude: -23.561, longitude: -46.656 },
    expiresAt: NOW + 1.5 * HOUR,
    createdAt: NOW - 0.5 * HOUR,
    reactions: { fire: 47, heart: 23 },
    commentCount: 8,
  },
  {
    id: 'p2',
    userId: '2',
    user: MOCK_USERS[1],
    imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&q=80',
    caption: 'Quem tá aqui?',
    placeName: 'Bar do Victor',
    placeId: 'place2',
    location: { latitude: -23.558, longitude: -46.660 },
    expiresAt: NOW + 3.2 * HOUR,
    createdAt: NOW - 0.8 * HOUR,
    reactions: { fire: 12, heart: 34 },
    commentCount: 3,
  },
  {
    id: 'p3',
    userId: '3',
    user: MOCK_USERS[2],
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
    caption: 'Esse DJ tá demais',
    placeName: 'D-Edge',
    placeId: 'place3',
    location: { latitude: -23.545, longitude: -46.643 },
    expiresAt: NOW + 5.7 * HOUR,
    createdAt: NOW - 0.3 * HOUR,
    reactions: { fire: 89, heart: 61 },
    commentCount: 22,
  },
  {
    id: 'p4',
    userId: '4',
    user: MOCK_USERS[3],
    imageUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80',
    caption: 'Sextou!',
    placeName: 'Outs Club',
    placeId: 'place4',
    location: { latitude: -23.572, longitude: -46.648 },
    expiresAt: NOW + 4 * HOUR,
    createdAt: NOW - 1.5 * HOUR,
    reactions: { fire: 33, heart: 18 },
    commentCount: 5,
  },
];

export const MOCK_PLACES: Place[] = [
  { id: 'place1', name: 'Club Fama', address: 'Rua Augusta, 600', neighborhood: 'Consolação', category: 'club', followers: 1280, tags: ['Eletronica', 'House', 'Comercial'], description: 'Pista cheia, DJs convidados e noite com energia alta.', location: { latitude: -23.561, longitude: -46.656 }, activePosts: 14, activeUsers: 87, thumbnail: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=80', priceLevel: 3, crowdLevel: 'alto', nearMetro: true, hasParking: false, hasSeating: false, coverCharge: 60, hasMenu: false },
  { id: 'place2', name: 'Bar do Victor', address: 'Av. Paulista, 1000', neighborhood: 'Paulista', category: 'bar', followers: 640, tags: ['Bar', 'Drinks', 'Happy hour'], description: 'Bar urbano para encontros, drinks e esquenta antes da festa.', location: { latitude: -23.558, longitude: -46.660 }, activePosts: 6, activeUsers: 32, thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', nearMetro: true, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place3', name: 'D-Edge', address: 'Av. Olga, 170', neighborhood: 'Barra Funda', category: 'club', followers: 4100, tags: ['Techno', 'House', 'After'], description: 'Referencia de musica eletronica com noites longas e lineups fortes.', location: { latitude: -23.545, longitude: -46.643 }, activePosts: 31, activeUsers: 210, thumbnail: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400&q=80', priceLevel: 4, crowdLevel: 'lotado', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 80, hasMenu: false },
  { id: 'place4', name: 'Outs Club', address: 'R. Barra Funda, 969', neighborhood: 'Barra Funda', category: 'club', followers: 930, tags: ['Rock', 'Indie', 'Alternativo'], description: 'Casa alternativa com pista, shows e publico fiel.', location: { latitude: -23.572, longitude: -46.648 }, activePosts: 9, activeUsers: 63, thumbnail: 'https://images.unsplash.com/photo-1571266028243-d220c6a6cb94?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 40, hasMenu: true },
  { id: 'place5', name: 'Inferno Club', address: 'R. Augusta, 584', neighborhood: 'Consolação', category: 'club', followers: 2150, tags: ['Hip-Hop', 'Funk', 'Trap'], description: 'A noite mais quente da Augusta — funk, trap e batida pesada.', location: { latitude: -23.5605, longitude: -46.6548 }, activePosts: 22, activeUsers: 145, thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80', priceLevel: 3, crowdLevel: 'lotado', nearMetro: true, hasParking: false, hasSeating: false, coverCharge: 50, hasMenu: false },
  { id: 'place6', name: 'Hostel Beer', address: 'R. Aspicuelta, 58', neighborhood: 'Vila Madalena', category: 'bar', followers: 890, tags: ['Cerveja', 'Ao vivo', 'MPB'], description: 'Terraço descontraído com chopp gelado e shows toda semana.', location: { latitude: -23.556, longitude: -46.690 }, activePosts: 8, activeUsers: 55, thumbnail: 'https://images.unsplash.com/photo-1555658636-6e4a36218be7?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place7', name: 'Beco 203', address: 'R. Mourato Coelho, 203', neighborhood: 'Pinheiros', category: 'bar', followers: 510, tags: ['Cocktails', 'Jazz', 'Lounge'], description: 'Bar intimista com cocktails autorais e jazz ao vivo nas sextas.', location: { latitude: -23.564, longitude: -46.685 }, activePosts: 5, activeUsers: 28, thumbnail: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80', priceLevel: 3, crowdLevel: 'baixo', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place8', name: 'Cine Joia', address: 'Pça. Carlos Gomes, 82', neighborhood: 'Liberdade', category: 'club', followers: 3600, tags: ['Eletronica', 'Techno', 'Eventos'], description: 'Clube histórico no centro com arquitetura única e pistas múltiplas.', location: { latitude: -23.549, longitude: -46.638 }, activePosts: 19, activeUsers: 130, thumbnail: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80', priceLevel: 3, crowdLevel: 'alto', nearMetro: true, hasParking: false, hasSeating: false, coverCharge: 70, hasMenu: false },
  { id: 'place9', name: 'Levanta Poeira', address: 'R. Pio XI, 1440', neighborhood: 'Alto da Lapa', category: 'club', followers: 1750, tags: ['Samba', 'Pagode', 'Forró'], description: 'A melhor roda de samba de SP — mesas na calçada e muita ginga.', location: { latitude: -23.534, longitude: -46.716 }, activePosts: 11, activeUsers: 78, thumbnail: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=400&q=80', priceLevel: 2, crowdLevel: 'alto', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 25, hasMenu: true },
  { id: 'place10', name: 'Buena Vista', address: 'R. Fidalga, 254', neighborhood: 'Vila Madalena', category: 'bar', followers: 720, tags: ['Latino', 'Salsa', 'Cocktails'], description: 'Clima caribenho, caipirinhas e salsa pra quem quer dançar à vontade.', location: { latitude: -23.558, longitude: -46.692 }, activePosts: 7, activeUsers: 41, thumbnail: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place11', name: 'Clash Club', address: 'R. Barra Funda, 1086', neighborhood: 'Barra Funda', category: 'club', followers: 2900, tags: ['Eletronica', 'House', 'Open format'], description: 'Linha pesada, som de qualidade e a melhor festa de quinta da cidade.', location: { latitude: -23.543, longitude: -46.646 }, activePosts: 25, activeUsers: 178, thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80', priceLevel: 4, crowdLevel: 'lotado', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 90, hasMenu: false },
  { id: 'place12', name: 'Trato Feito', address: 'Av. Rebouças, 3970', neighborhood: 'Pinheiros', category: 'bar', followers: 430, tags: ['Boteco', 'Petisco', 'Futebol'], description: 'Boteco raiz com telão, bolinho de bacalhau e gelada na hora.', location: { latitude: -23.570, longitude: -46.681 }, activePosts: 4, activeUsers: 19, thumbnail: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400&q=80', priceLevel: 1, crowdLevel: 'baixo', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },
];

export const MOCK_REWARDS: Reward[] = [
  { id: 'r1', title: 'Cerveja Grátis', description: 'Uma cerveja long neck no Bar do Victor', pointsCost: 200, partnerName: 'Bar do Victor', category: 'drink' },
  { id: 'r2', title: 'Shot de Tequila', description: 'Um shot de tequila premium no Club Fama', pointsCost: 150, partnerName: 'Club Fama', category: 'drink' },
  { id: 'r3', title: '20% OFF', description: '20% de desconto na entrada da D-Edge', pointsCost: 300, partnerName: 'D-Edge', category: 'discount' },
  { id: 'r4', title: 'Acesso VIP', description: 'Entrada VIP sem fila no Outs Club', pointsCost: 500, partnerName: 'Outs Club', category: 'vip' },
];

export const MOCK_CHATS: Chat[] = [
  { id: 'c1', participants: [MOCK_USERS[0]], lastMessage: 'Vc ainda tá aqui?', lastMessageAt: NOW - 5 * 60 * 1000, unreadCount: 2 },
  { id: 'c2', participants: [MOCK_USERS[1]], lastMessage: 'Que festa incrível!', lastMessageAt: NOW - 15 * 60 * 1000, unreadCount: 0 },
  { id: 'c3', participants: [MOCK_USERS[2]], lastMessage: 'Vem aqui no D-Edge!', lastMessageAt: NOW - 45 * 60 * 1000, unreadCount: 1 },
];
