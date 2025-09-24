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
//changed colors to make them gradients -Nate
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
    color: '#00ffaaff'
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
    color: '#ea00ffff'
  },
  {
    id: 'boxer',
    name: 'Danny "Lightning" Rodriguez',
    nickname: 'Technical Boxer',
    avatar: '🥊',
    health: 200,
    power: 10,
    speed: 6,
    defense: 5,
    color: '#4c79ffff'
  },
  {
    id: 'champion',
    name: 'Marcus "The Destroyer" Williams',
    nickname: 'Regional Champion',
    avatar: '🏆',
    health: 250,
    power: 12,
    speed: 7,
    defense: 6,
    color: '#ffdf2cff'
  },
  {
    id: 'contender',
    name: 'Viktor "The Beast" Petrov',
    nickname: 'Title Contender',
    avatar: '⚡',
    health: 350,
    power: 15,
    speed: 10,
    defense: 10,
    color: '#ff642cff'
  },
  {
    id: 'mike_tyson',
    name: 'Mike "Iron Mike" Tyson',
    nickname: 'The Champ',
    avatar: '👑🥊',
    health: 750,
    power: 40,
    speed: 20,
    defense: 30,
      // changed every stat to make Mike Tyson much harder to beat -Nate
    color: '#d30000ff'
  }
];
