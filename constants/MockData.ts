import type { Post, User, Place, Chat, Reward, VenueChat } from '@/types';

const NOW = Date.now();
const HOUR = 3600 * 1000;

export const MOCK_USERS: User[] = [
  { id: '1', username: 'ana_silva', displayName: 'Ana Silva', avatar: 'https://i.pravatar.cc/150?img=47', bio: 'São Paulo by night', instagram: 'ana.silva', points: 1240, followers: 892, following: 312, createdAt: NOW - 90 * 24 * HOUR, relationshipStatus: 'solteiro' },
  { id: '2', username: 'pedro_fest', displayName: 'Pedro Ferreira', avatar: 'https://i.pravatar.cc/150?img=12', bio: 'Sempre rolando', instagram: 'pedroferreira', points: 780, followers: 541, following: 200, createdAt: NOW - 60 * 24 * HOUR, relationshipStatus: 'curtindo' },
  { id: '3', username: 'julia_night', displayName: 'Julia Costa', avatar: 'https://i.pravatar.cc/150?img=32', bio: 'Curtindo a vida', instagram: 'julia.night.sp', points: 2100, followers: 1203, following: 445, createdAt: NOW - 120 * 24 * HOUR, relationshipStatus: 'namorando' },
  { id: '4', username: 'rafael_vybe', displayName: 'Rafael Santos', avatar: 'https://i.pravatar.cc/150?img=8', bio: 'DJ de fim de semana', instagram: 'rafaelvybe', points: 650, followers: 320, following: 180, createdAt: NOW - 30 * 24 * HOUR, relationshipStatus: 'ficando' },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: '1',
    user: MOCK_USERS[0]!,
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
    user: MOCK_USERS[1]!,
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
    user: MOCK_USERS[2]!,
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
    user: MOCK_USERS[3]!,
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
  {
    id: 'p5',
    userId: '1',
    user: MOCK_USERS[0]!,
    imageUrl: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&q=80',
    caption: 'Inferno tá pegando fogo 🔥',
    placeName: 'Inferno Club',
    placeId: 'place5',
    location: { latitude: -23.5605, longitude: -46.6548 },
    expiresAt: NOW + 2.1 * HOUR,
    createdAt: NOW - 0.9 * HOUR,
    reactions: { fire: 102, heart: 78 },
    commentCount: 17,
  },
  {
    id: 'p6',
    userId: '3',
    user: MOCK_USERS[2]!,
    imageUrl: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=600&q=80',
    caption: 'Samba na Madalena ❤️',
    placeName: 'Hostel Beer',
    placeId: 'place6',
    location: { latitude: -23.556, longitude: -46.690 },
    expiresAt: NOW + 3.8 * HOUR,
    createdAt: NOW - 0.4 * HOUR,
    reactions: { fire: 28, heart: 45 },
    commentCount: 9,
  },
  {
    id: 'p7',
    userId: '2',
    user: MOCK_USERS[1]!,
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80',
    caption: 'Clash é brabo mesmo',
    placeName: 'Clash Club',
    placeId: 'place11',
    location: { latitude: -23.543, longitude: -46.646 },
    expiresAt: NOW + 5 * HOUR,
    createdAt: NOW - 1.1 * HOUR,
    reactions: { fire: 67, heart: 39 },
    commentCount: 12,
  },
  {
    id: 'p8',
    userId: '4',
    user: MOCK_USERS[3]!,
    imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80',
    caption: 'Caipifruta do Buena Vista 🍹',
    placeName: 'Buena Vista',
    placeId: 'place10',
    location: { latitude: -23.558, longitude: -46.692 },
    expiresAt: NOW + 0.4 * HOUR,
    createdAt: NOW - 1.6 * HOUR,
    reactions: { fire: 19, heart: 52 },
    commentCount: 6,
  },
  {
    id: 'p9',
    userId: '1',
    user: MOCK_USERS[0]!,
    imageUrl: 'https://images.unsplash.com/photo-1571266028243-d220c6a6cb94?w=600&q=80',
    caption: 'Cine Joia nunca decepciona',
    placeName: 'Cine Joia',
    placeId: 'place8',
    location: { latitude: -23.549, longitude: -46.638 },
    expiresAt: NOW + 6 * HOUR,
    createdAt: NOW - 0.2 * HOUR,
    reactions: { fire: 55, heart: 41 },
    commentCount: 14,
  },
  {
    id: 'p10',
    userId: '3',
    user: MOCK_USERS[2]!,
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&q=80',
    caption: 'Bolinho e gelada no Trato Feito 🍺',
    placeName: 'Trato Feito',
    placeId: 'place12',
    location: { latitude: -23.570, longitude: -46.681 },
    expiresAt: NOW + 2.5 * HOUR,
    createdAt: NOW - 0.7 * HOUR,
    reactions: { fire: 14, heart: 29 },
    commentCount: 4,
  },
];

export const MOCK_PLACES: Place[] = [
  { id: 'place1', name: 'Club Fama', address: 'Rua Augusta, 600', neighborhood: 'Consolação', category: 'club', followers: 1280, tags: ['Eletronica', 'House', 'Comercial'], description: 'Pista cheia, DJs convidados e noite com energia alta.', location: { latitude: -23.561, longitude: -46.656 }, activePosts: 14, activeUsers: 87, thumbnail: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=80', priceLevel: 3, crowdLevel: 'alto', queueLevel: 'longa', vibe: 'misto', nearMetro: true, hasParking: false, hasSeating: false, coverCharge: 60, hasMenu: false },
  { id: 'place2', name: 'Bar do Victor', address: 'Av. Paulista, 1000', neighborhood: 'Paulista', category: 'bar', followers: 640, tags: ['Bar', 'Drinks', 'Happy hour'], description: 'Bar urbano para encontros, drinks e esquenta antes da festa.', location: { latitude: -23.558, longitude: -46.660 }, activePosts: 6, activeUsers: 32, thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', queueLevel: 'sem fila', vibe: 'resenha', nearMetro: true, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place3', name: 'D-Edge', address: 'Av. Olga, 170', neighborhood: 'Barra Funda', category: 'club', followers: 4100, tags: ['Techno', 'House', 'After'], description: 'Referencia de musica eletronica com noites longas e lineups fortes.', location: { latitude: -23.545, longitude: -46.643 }, activePosts: 31, activeUsers: 210, thumbnail: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400&q=80', priceLevel: 4, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'misto', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 80, hasMenu: false },
  { id: 'place4', name: 'Outs Club', address: 'R. Barra Funda, 969', neighborhood: 'Barra Funda', category: 'club', followers: 930, tags: ['Rock', 'Indie', 'Alternativo'], description: 'Casa alternativa com pista, shows e publico fiel.', location: { latitude: -23.572, longitude: -46.648 }, activePosts: 9, activeUsers: 63, thumbnail: 'https://images.unsplash.com/photo-1571266028243-d220c6a6cb94?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', queueLevel: 'curta', vibe: 'misto', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 40, hasMenu: true },
  { id: 'place5', name: 'Inferno Club', address: 'R. Augusta, 584', neighborhood: 'Consolação', category: 'club', followers: 2150, tags: ['Hip-Hop', 'Funk', 'Trap'], description: 'A noite mais quente da Augusta — funk, trap e batida pesada.', location: { latitude: -23.5605, longitude: -46.6548 }, activePosts: 22, activeUsers: 145, thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80', priceLevel: 3, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'paquera', nearMetro: true, hasParking: false, hasSeating: false, coverCharge: 50, hasMenu: false },
  { id: 'place6', name: 'Hostel Beer', address: 'R. Aspicuelta, 58', neighborhood: 'Vila Madalena', category: 'bar', followers: 890, tags: ['Cerveja', 'Ao vivo', 'MPB'], description: 'Terraço descontraído com chopp gelado e shows toda semana.', location: { latitude: -23.556, longitude: -46.690 }, activePosts: 8, activeUsers: 55, thumbnail: 'https://images.unsplash.com/photo-1555658636-6e4a36218be7?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', queueLevel: 'sem fila', vibe: 'resenha', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place7', name: 'Beco 203', address: 'R. Mourato Coelho, 203', neighborhood: 'Pinheiros', category: 'bar', followers: 510, tags: ['Cocktails', 'Jazz', 'Lounge'], description: 'Bar intimista com cocktails autorais e jazz ao vivo nas sextas.', location: { latitude: -23.564, longitude: -46.685 }, activePosts: 5, activeUsers: 28, thumbnail: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80', priceLevel: 3, crowdLevel: 'baixo', queueLevel: 'sem fila', vibe: 'paquera', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place8', name: 'Cine Joia', address: 'Pça. Carlos Gomes, 82', neighborhood: 'Liberdade', category: 'club', followers: 3600, tags: ['Eletronica', 'Techno', 'Eventos'], description: 'Clube histórico no centro com arquitetura única e pistas múltiplas.', location: { latitude: -23.549, longitude: -46.638 }, activePosts: 19, activeUsers: 130, thumbnail: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80', priceLevel: 3, crowdLevel: 'alto', queueLevel: 'curta', vibe: 'misto', nearMetro: true, hasParking: false, hasSeating: false, coverCharge: 70, hasMenu: false },
  { id: 'place9', name: 'Levanta Poeira', address: 'R. Pio XI, 1440', neighborhood: 'Alto da Lapa', category: 'club', followers: 1750, tags: ['Samba', 'Pagode', 'Forró'], description: 'A melhor roda de samba de SP — mesas na calçada e muita ginga.', location: { latitude: -23.534, longitude: -46.716 }, activePosts: 11, activeUsers: 78, thumbnail: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=400&q=80', priceLevel: 2, crowdLevel: 'alto', queueLevel: 'curta', vibe: 'resenha', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 25, hasMenu: true },
  { id: 'place10', name: 'Buena Vista', address: 'R. Fidalga, 254', neighborhood: 'Vila Madalena', category: 'bar', followers: 720, tags: ['Latino', 'Salsa', 'Cocktails'], description: 'Clima caribenho, caipirinhas e salsa pra quem quer dançar à vontade.', location: { latitude: -23.558, longitude: -46.692 }, activePosts: 7, activeUsers: 41, thumbnail: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', queueLevel: 'sem fila', vibe: 'paquera', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place11', name: 'Clash Club', address: 'R. Barra Funda, 1086', neighborhood: 'Barra Funda', category: 'club', followers: 2900, tags: ['Eletronica', 'House', 'Open format'], description: 'Linha pesada, som de qualidade e a melhor festa de quinta da cidade.', location: { latitude: -23.543, longitude: -46.646 }, activePosts: 25, activeUsers: 178, thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80', priceLevel: 4, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'misto', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 90, hasMenu: false },
  { id: 'place12', name: 'Trato Feito', address: 'Av. Rebouças, 3970', neighborhood: 'Pinheiros', category: 'bar', followers: 430, tags: ['Boteco', 'Petisco', 'Futebol'], description: 'Boteco raiz com telão, bolinho de bacalhau e gelada na hora.', location: { latitude: -23.570, longitude: -46.681 }, activePosts: 4, activeUsers: 19, thumbnail: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400&q=80', priceLevel: 1, crowdLevel: 'baixo', queueLevel: 'sem fila', vibe: 'resenha', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },

  // Itaim Bibi
  { id: 'place13', name: 'Bar Brahma Itaim', address: 'R. João Cachoeira, 1100', neighborhood: 'Itaim Bibi', category: 'bar', followers: 1850, tags: ['Samba', 'Chope', 'Ao vivo'], description: 'O clássico de SP na versão Itaim — chopp gelado, samba e clientela animada.', location: { latitude: -23.581, longitude: -46.678 }, activePosts: 16, activeUsers: 94, thumbnail: 'https://images.unsplash.com/photo-1555658636-6e4a36218be7?w=400&q=80', priceLevel: 2, crowdLevel: 'alto', queueLevel: 'curta', vibe: 'resenha', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place14', name: 'Club 1234', address: 'R. Bandeira Paulista, 567', neighborhood: 'Itaim Bibi', category: 'club', followers: 3200, tags: ['House', 'Open Format', 'VIP'], description: 'O clube mais badalado do Itaim — lineup de peso e área VIP exclusiva.', location: { latitude: -23.583, longitude: -46.676 }, activePosts: 27, activeUsers: 190, thumbnail: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=80', priceLevel: 5, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'paquera', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 120, hasMenu: false },
  { id: 'place15', name: 'Terraço Itaim', address: 'R. Dr. Renato Paes de Barros, 65', neighborhood: 'Itaim Bibi', category: 'lounge', followers: 980, tags: ['Rooftop', 'Cocktails', 'Sunset'], description: 'Rooftop com vista para a cidade, drinks autorais e clima intimista.', location: { latitude: -23.579, longitude: -46.674 }, activePosts: 10, activeUsers: 52, thumbnail: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80', priceLevel: 4, crowdLevel: 'médio', queueLevel: 'sem fila', vibe: 'paquera', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 0, hasMenu: true },

  // Vila Olímpia
  { id: 'place16', name: 'Woods', address: 'R. Funchal, 423', neighborhood: 'Vila Olímpia', category: 'club', followers: 4800, tags: ['Techno', 'House', 'Europeu'], description: 'A casa techno mais importante de SP — som brutal, ambiente escuro e noite longa.', location: { latitude: -23.592, longitude: -46.685 }, activePosts: 34, activeUsers: 240, thumbnail: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400&q=80', priceLevel: 4, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'misto', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 100, hasMenu: false },
  { id: 'place17', name: 'Bar do Beto', address: 'R. Joaquim Floriano, 190', neighborhood: 'Vila Olímpia', category: 'bar', followers: 620, tags: ['Boteco', 'Happy Hour', 'Executivos'], description: 'Point do happy hour pós-trabalho — petisco farto e chope sempre gelado.', location: { latitude: -23.594, longitude: -46.682 }, activePosts: 8, activeUsers: 43, thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80', priceLevel: 2, crowdLevel: 'médio', queueLevel: 'sem fila', vibe: 'resenha', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },

  // Moema
  { id: 'place18', name: 'Blue Note SP', address: 'Av. Paulista, 2073', neighborhood: 'Moema', category: 'lounge', followers: 5100, tags: ['Jazz', 'Blues', 'Ao vivo'], description: 'A melhor casa de jazz de SP — experiência premium com artistas nacionais e internacionais.', location: { latitude: -23.587, longitude: -46.658 }, activePosts: 12, activeUsers: 70, thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80', priceLevel: 4, crowdLevel: 'médio', queueLevel: 'curta', vibe: 'paquera', nearMetro: true, hasParking: true, hasSeating: true, coverCharge: 80, hasMenu: true },
  { id: 'place19', name: 'Bar Moema 6', address: 'Av. Moema, 600', neighborhood: 'Moema', category: 'bar', followers: 740, tags: ['Cocktails', 'Gastrôbar', 'Vinil'], description: 'Gastrôbar com deck ao ar livre, comidinhas e DJ de vinil nos fins de semana.', location: { latitude: -23.589, longitude: -46.663 }, activePosts: 6, activeUsers: 38, thumbnail: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80', priceLevel: 3, crowdLevel: 'médio', queueLevel: 'sem fila', vibe: 'paquera', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 0, hasMenu: true },

  // Jardins
  { id: 'place20', name: 'Spot', address: 'R. Min. Rocha Azevedo, 72', neighborhood: 'Jardins', category: 'lounge', followers: 1600, tags: ['Clássico', 'Jantar', 'After'], description: 'Ícone dos Jardins — restaurante de dia, bar animado de noite.', location: { latitude: -23.567, longitude: -46.661 }, activePosts: 7, activeUsers: 45, thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', priceLevel: 3, crowdLevel: 'médio', queueLevel: 'sem fila', vibe: 'resenha', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 0, hasMenu: true },
  { id: 'place21', name: 'Astor', address: 'R. Delfina, 163', neighborhood: 'Vila Madalena', category: 'bar', followers: 2100, tags: ['Cocktails', 'Gastronomia', 'Vintage'], description: 'Bar icônico da Madalena com drinks clássicos e decoração vintage dos anos 60.', location: { latitude: -23.554, longitude: -46.693 }, activePosts: 11, activeUsers: 67, thumbnail: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80', priceLevel: 3, crowdLevel: 'alto', queueLevel: 'curta', vibe: 'paquera', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },

  // Brooklin / Santo André
  { id: 'place22', name: 'Manifesto', address: 'R. Pedroso Alvarenga, 1150', neighborhood: 'Itaim Bibi', category: 'club', followers: 2600, tags: ['RnB', 'Hip-Hop', 'Black Music'], description: 'A casa do RnB e Black Music de SP — batida pesada e pista sempre cheia.', location: { latitude: -23.585, longitude: -46.670 }, activePosts: 20, activeUsers: 142, thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80', priceLevel: 3, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'paquera', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 60, hasMenu: false },

  // Lapa / Bom Retiro
  { id: 'place23', name: 'Carioca Club', address: 'R. Cardeal Arcoverde, 2899', neighborhood: 'Pinheiros', category: 'club', followers: 1900, tags: ['Samba', 'Axé', 'Forró', 'Ao vivo'], description: 'Múltiplas pistas com samba, axé e forró — noite completa no ritmo do Brasil.', location: { latitude: -23.565, longitude: -46.688 }, activePosts: 18, activeUsers: 115, thumbnail: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=400&q=80', priceLevel: 2, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'misto', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 35, hasMenu: true },
  { id: 'place24', name: 'Noctivagos', address: 'R. Bom Pastor, 930', neighborhood: 'Ipiranga', category: 'bar', followers: 380, tags: ['Boteco', 'Rock', 'Alternativo'], description: 'Bar alternativo com rock ao vivo, cerveja artesanal e pátio iluminado.', location: { latitude: -23.583, longitude: -46.624 }, activePosts: 5, activeUsers: 28, thumbnail: 'https://images.unsplash.com/photo-1571266028243-d220c6a6cb94?w=400&q=80', priceLevel: 1, crowdLevel: 'baixo', queueLevel: 'sem fila', vibe: 'resenha', nearMetro: false, hasParking: false, hasSeating: true, coverCharge: 0, hasMenu: true },

  // Eventos
  { id: 'place25', name: 'Arena Anhembi', address: 'Av. Olavo Fontoura, 1209', neighborhood: 'Santana', category: 'event', followers: 9200, tags: ['Festival', 'Grandes Shows', 'Eletrônica'], description: 'O maior espaço de eventos de SP — palco para festivais e shows internacionais.', location: { latitude: -23.513, longitude: -46.633 }, activePosts: 45, activeUsers: 380, thumbnail: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&q=80', priceLevel: 3, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'misto', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 150, hasMenu: false },
  { id: 'place26', name: 'Audio Club', address: 'Av. Francisco Matarazzo, 694', neighborhood: 'Água Branca', category: 'club', followers: 6300, tags: ['Techno', 'Trance', 'Festival Indoor'], description: 'Templo da música eletrônica de SP — múltiplos palcos, line-up internacional.', location: { latitude: -23.526, longitude: -46.651 }, activePosts: 38, activeUsers: 295, thumbnail: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=80', priceLevel: 4, crowdLevel: 'lotado', queueLevel: 'longa', vibe: 'misto', nearMetro: false, hasParking: true, hasSeating: false, coverCharge: 110, hasMenu: false },
  { id: 'place27', name: 'Espaço das Américas', address: 'R. Tagipuru, 795', neighborhood: 'Água Branca', category: 'event', followers: 4100, tags: ['Shows', 'Pop', 'Rock'], description: 'Arena de médio porte com shows de artistas nacionais e internacionais toda semana.', location: { latitude: -23.527, longitude: -46.655 }, activePosts: 22, activeUsers: 165, thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80', priceLevel: 3, crowdLevel: 'alto', queueLevel: 'curta', vibe: 'misto', nearMetro: false, hasParking: true, hasSeating: true, coverCharge: 80, hasMenu: true },
];

export const MOCK_REWARDS: Reward[] = [
  { id: 'r1', title: 'Cerveja Grátis', description: 'Uma long neck gelada no Bar do Victor', pointsCost: 200, partnerName: 'Bar do Victor', category: 'drink' },
  { id: 'r2', title: 'Shot de Tequila', description: 'Um shot de tequila premium no Club Fama', pointsCost: 150, partnerName: 'Club Fama', category: 'drink' },
  { id: 'r3', title: '20% OFF Entrada', description: '20% de desconto na entrada da D-Edge', pointsCost: 300, partnerName: 'D-Edge', category: 'discount' },
  { id: 'r4', title: 'Acesso VIP', description: 'Entrada VIP sem fila no Outs Club', pointsCost: 500, partnerName: 'Outs Club', category: 'vip' },
  { id: 'r5', title: 'Caipirinha', description: 'Uma caipirinha de limão no Buena Vista', pointsCost: 180, partnerName: 'Buena Vista', category: 'drink' },
  { id: 'r6', title: 'Entrada Free', description: 'Entrada gratuita na Levanta Poeira (até 22h)', pointsCost: 250, partnerName: 'Levanta Poeira', category: 'discount' },
  { id: 'r7', title: 'Mesa VIP', description: 'Reserva de mesa VIP no Clash Club', pointsCost: 800, partnerName: 'Clash Club', category: 'vip' },
  { id: 'r8', title: 'Chopp Duplo', description: 'Dois choppinhos no Hostel Beer', pointsCost: 220, partnerName: 'Hostel Beer', category: 'drink' },
  { id: 'r9', title: '30% OFF', description: '30% off no consumo do Beco 203', pointsCost: 350, partnerName: 'Beco 203', category: 'discount' },
  { id: 'r10', title: 'Open Bar 1h', description: '1 hora de open bar no Cine Joia', pointsCost: 600, partnerName: 'Cine Joia', category: 'vip' },
];

export const MOCK_CHATS: Chat[] = [
  { id: 'c1', participants: [MOCK_USERS[0]!], lastMessage: 'Vc ainda tá aqui?', lastMessageAt: NOW - 5 * 60 * 1000, unreadCount: 2, createdAt: NOW - 7.5 * HOUR },
  { id: 'c2', participants: [MOCK_USERS[1]!], lastMessage: 'Que festa incrível!', lastMessageAt: NOW - 15 * 60 * 1000, unreadCount: 0, createdAt: NOW - 1 * HOUR },
  { id: 'c3', participants: [MOCK_USERS[2]!], lastMessage: 'Vem aqui no D-Edge!', lastMessageAt: NOW - 45 * 60 * 1000, unreadCount: 1, createdAt: NOW - 4 * HOUR },
];
