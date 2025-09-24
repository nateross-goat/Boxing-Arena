export interface Fighter {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  health: number;
  power: number;
  speed: number;
  defense: number;
  color: string;
}

export const getFighters = (): Fighter[] => [
  {
    id: 'amateur',
    name: 'Tommy "The Kid" Smith',
    nickname: 'Amateur Fighter',
    avatar: '👤',
    health: 80,
    power: 5,
    speed: 3,
    defense: 2,
    color: '#808080'
  },
  {
    id: 'brawler',
    name: 'Big Mike Johnson',
    nickname: 'Street Brawler',
    avatar: '💪',
    health: 120,
    power: 8,
    speed: 4,
    defense: 3,
    color: '#8B4513'
  },
  {
    id: 'boxer',
    name: 'Danny "Lightning" Rodriguez',
    nickname: 'Technical Boxer',
    avatar: '🥊',
    health: 140,
    power: 10,
    speed: 6,
    defense: 5,
    color: '#4169E1'
  },
  {
    id: 'champion',
    name: 'Marcus "The Destroyer" Williams',
    nickname: 'Regional Champion',
    avatar: '🏆',
    health: 180,
    power: 12,
    speed: 7,
    defense: 6,
    color: '#FFD700'
  },
  {
    id: 'contender',
    name: 'Viktor "The Beast" Petrov',
    nickname: 'Title Contender',
    avatar: '⚡',
    health: 220,
    power: 15,
    speed: 8,
    defense: 8,
    color: '#FF4500'
  },
  {
    id: 'mike_tyson',
    name: 'Mike "Iron Mike" Tyson',
    nickname: 'The Final Boss',
    avatar: '👑🥊',
    health: 300,
    power: 20,
    speed: 10,
    defense: 10,
    color: '#8B0000'
  }
];
