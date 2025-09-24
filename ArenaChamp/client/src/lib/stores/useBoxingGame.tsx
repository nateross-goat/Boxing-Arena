import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getFighters, Fighter } from "../fighters";
import { getLocalStorage, setLocalStorage } from "../utils";

export interface PlayerProgress {
  money: number;
  wins: number;
  unlockedFighters: string[];
  upgrades: {
    speed: number;
    strength: number;
    chin: number;
    health: number;
  };
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  isBlocking: boolean;
  isDodging: boolean;
  isDucking: boolean;
  isStunned: boolean;
  stunTimer: number;
  lastAttackTime: number;
  currentAction: string;
  color: string;
}

export interface Opponent {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  isBlocking: boolean;
  isDodging: boolean;
  isDucking: boolean;
  isStunned: boolean;
  stunTimer: number;
  lastAttackTime: number;
  lastAIAction: number;
  aiStrategy: number;
  currentAction: string;
  color: string;
  // AI Learning patterns
  playerPatterns: {
    recentActions: string[];
    attackCount: { jab: number; cross: number; uppercut: number };
    defensiveCount: { block: number; dodge: number; duck: number };
    predictedNext: string;
    adaptationLevel: number;
  };
  power: number;
  speed: number;
  defense: number;
}

export interface Arena {
  width: number;
  height: number;
  leftBound: number;
  rightBound: number;
  topBound: number;
  bottomBound: number;
}

export type GameState = 'menu' | 'playing' | 'roundBreak' | 'victory' | 'gameOver';

export interface RoundData {
  currentRound: number;
  totalRounds: number;
  roundTimer: number; // Current round time remaining
  maxRoundTime: number; // Full round duration (typically 3 minutes)
  breakTimer: number; // Time remaining in round break
  roundScores: { player: number; opponent: number }[]; // Score for each completed round
  isInBreak: boolean;
}

interface BoxingGameState {
  gameState: GameState;
  player: Player;
  opponent: Opponent | null;
  arena: Arena;
  playerProgress: PlayerProgress;
  roundData: RoundData;
  playerStamina: number;
  opponentStamina: number;
  showUpgrades: boolean;
  showFighterSelection: boolean;

  // Actions
  initializeGame: () => void;
  startFight: (opponentId: string) => void;
  resetGame: () => void;
  updatePlayer: (updates: Partial<Player>) => void;
  updateOpponent: (updates: Partial<Opponent>) => void;
  setGameState: (state: GameState) => void;
  updateRoundTimer: (time: number) => void;
  updateBreakTimer: (time: number) => void;
  startNextRound: () => void;
  endCurrentRound: (winner: 'player' | 'opponent' | 'draw') => void;
  updateStamina: (playerStamina: number, opponentStamina: number) => void;
  upgradePlayer: (upgradeType: 'speed' | 'strength' | 'chin' | 'health') => void;
  addMoney: (amount: number) => void;
  unlockFighter: (fighterId: string) => void;
  setShowUpgrades: (show: boolean) => void;
  setShowFighterSelection: (show: boolean) => void;
  saveProgress: () => void;
  loadProgress: () => void;
}

const defaultPlayerProgress: PlayerProgress = {
  money: 10,
  wins: 0,
  unlockedFighters: ['amateur'],
  upgrades: {
    speed: 0,
    strength: 0,
    chin: 0,
    health: 0
  }
};

const createDefaultPlayer = (progress: PlayerProgress): Player => ({
  x: 200,
  y: 300,
  width: 60,
  height: 120,
  health: 100 + (progress.upgrades.health * 20),
  maxHealth: 100 + (progress.upgrades.health * 20),
  facing: 'right',
  isBlocking: false,
  isDodging: false,
  isDucking: false,
  isStunned: false,
  stunTimer: 0,
  lastAttackTime: 0,
  currentAction: 'idle',
  color: '#4169E1'
});

const createDefaultArena = (): Arena => ({
  width: 800,
  height: 400,
  leftBound: 50,
  rightBound: 750,
  topBound: 200,
  bottomBound: 500
});

export const useBoxingGame = create<BoxingGameState>()(
  subscribeWithSelector((set, get) => ({
    gameState: 'menu',
    player: createDefaultPlayer(defaultPlayerProgress),
    opponent: null,
    arena: createDefaultArena(),
    playerProgress: defaultPlayerProgress,
    roundData: {
      currentRound: 1,
      totalRounds: 3, // Standard 3-round boxing match
      roundTimer: 180000, // 3 minutes per round
      maxRoundTime: 180000,
      breakTimer: 60000, // 1 minute break
      roundScores: [],
      isInBreak: false
    },
    playerStamina: 100,
    opponentStamina: 100,
    showUpgrades: false,
    showFighterSelection: false,

    initializeGame: () => {
      const state = get();
      state.loadProgress();
      const progress = get().playerProgress;
      set({
        player: createDefaultPlayer(progress),
        arena: createDefaultArena()
      });
    },

    startFight: (opponentId: string) => {
      const fighters = getFighters();
      const fighterData = fighters.find((f: Fighter) => f.id === opponentId);
      
      if (!fighterData) return;

      const opponent: Opponent = {
        id: fighterData.id,
        name: fighterData.name,
        x: 600,
        y: 300,
        width: fighterData.id === 'mike_tyson' ? 80 : 60,
        height: fighterData.id === 'mike_tyson' ? 150 : 120,
        health: fighterData.health,
        maxHealth: fighterData.health,
        facing: 'left',
        isBlocking: false,
        isDodging: false,
        isDucking: false,
        isStunned: false,
        stunTimer: 0,
        lastAttackTime: 0,
        lastAIAction: 0,
        aiStrategy: Math.random(),
        currentAction: 'idle',
        color: fighterData.color,
        playerPatterns: {
          recentActions: [],
          attackCount: { jab: 0, cross: 0, uppercut: 0 },
          defensiveCount: { block: 0, dodge: 0, duck: 0 },
          predictedNext: 'idle',
          adaptationLevel: 0
        },
        power: fighterData.power,
        speed: fighterData.speed,
        defense: fighterData.defense
      };

      set({
        gameState: 'playing',
        opponent,
        roundData: {
          currentRound: 1,
          totalRounds: 3,
          roundTimer: 180000,
          maxRoundTime: 180000,
          breakTimer: 60000,
          roundScores: [],
          isInBreak: false
        },
        playerStamina: 100,
        opponentStamina: 100
      });
    },

    resetGame: () => {
      const state = get();
      const progress = state.playerProgress;
      set({
        gameState: 'menu',
        player: createDefaultPlayer(progress),
        opponent: null,
        roundData: {
          currentRound: 1,
          totalRounds: 3,
          roundTimer: 180000, // 3 minutes per round
          maxRoundTime: 180000,
          breakTimer: 60000, // 1 minute break
          roundScores: [],
          isInBreak: false
        },
        playerStamina: 100,
        opponentStamina: 100,
        showUpgrades: false,
        showFighterSelection: false
      });
    },

    updatePlayer: (updates) => {
      set((state) => ({
        player: { ...state.player, ...updates }
      }));
    },

    updateOpponent: (updates) => {
      set((state) => ({
        opponent: state.opponent ? { ...state.opponent, ...updates } : null
      }));
    },

    setGameState: (gameState) => set({ gameState }),

    updateRoundTimer: (roundTimer) => {
      set(state => ({ 
        roundData: { ...state.roundData, roundTimer } 
      }));
    },

    updateBreakTimer: (breakTimer) => {
      set(state => ({ 
        roundData: { ...state.roundData, breakTimer } 
      }));
    },

    startNextRound: () => {
      const state = get();
      const newRound = state.roundData.currentRound + 1;
      
      // Reset fighter health and positions for new round
      const restoredHealth = {
        player: Math.min(state.player.maxHealth, state.player.health + 30), // Restore 30 health
        opponent: Math.min(state.opponent?.maxHealth || 100, (state.opponent?.health || 0) + 30)
      };
      
      set({
        gameState: 'playing',
        roundData: {
          ...state.roundData,
          currentRound: newRound,
          roundTimer: state.roundData.maxRoundTime,
          breakTimer: 60000,
          isInBreak: false
        },
        playerStamina: 100, // Full stamina restoration
        opponentStamina: 100,
        player: {
          ...state.player,
          health: restoredHealth.player,
          x: 200, // Reset to starting position
          y: 300,
          isStunned: false,
          stunTimer: 0,
          currentAction: 'idle'
        },
        opponent: state.opponent ? {
          ...state.opponent,
          health: restoredHealth.opponent,
          x: 600, // Reset to starting position
          y: 300,
          isStunned: false,
          stunTimer: 0,
          currentAction: 'idle'
        } : null
      });
    },

    endCurrentRound: (winner) => {
      const state = get();
      const playerScore = winner === 'player' ? 1 : 0;
      const opponentScore = winner === 'opponent' ? 1 : 0;
      
      const newScores = [...state.roundData.roundScores, { player: playerScore, opponent: opponentScore }];
      
      // Check if match is complete
      const isLastRound = state.roundData.currentRound >= state.roundData.totalRounds;
      const playerWins = newScores.reduce((sum, score) => sum + score.player, 0);
      const opponentWins = newScores.reduce((sum, score) => sum + score.opponent, 0);
      
      set({
        roundData: {
          ...state.roundData,
          roundScores: newScores,
          isInBreak: !isLastRound,
          breakTimer: 60000
        }
      });
      
      if (isLastRound) {
        // Match complete - determine final winner
        if (playerWins > opponentWins) {
          state.setGameState('victory');
        } else {
          state.setGameState('gameOver');
        }
      } else {
        // Start break between rounds
        state.setGameState('roundBreak');
      }
    },

    updateStamina: (playerStamina, opponentStamina) => {
      set({ playerStamina, opponentStamina });
    },

    upgradePlayer: (upgradeType) => {
      const state = get();
      const currentLevel = state.playerProgress.upgrades[upgradeType];
      const cost = 1 + currentLevel * 2;

      if (state.playerProgress.money >= cost && currentLevel < 10) {
        const newProgress = {
          ...state.playerProgress,
          money: state.playerProgress.money - cost,
          upgrades: {
            ...state.playerProgress.upgrades,
            [upgradeType]: currentLevel + 1
          }
        };

        // Update player stats based on upgrades
        let playerUpdates = {};
        if (upgradeType === 'health') {
          const newMaxHealth = 100 + (newProgress.upgrades.health * 20);
          playerUpdates = {
            maxHealth: newMaxHealth,
            health: Math.min(state.player.health, newMaxHealth)
          };
        }

        set({
          playerProgress: newProgress,
          player: { ...state.player, ...playerUpdates }
        });
        
        state.saveProgress();
      }
    },

    addMoney: (amount) => {
      set((state) => ({
        playerProgress: {
          ...state.playerProgress,
          money: state.playerProgress.money + amount,
          wins: state.playerProgress.wins + 1
        }
      }));
      get().saveProgress();
    },

    unlockFighter: (fighterId) => {
      set((state) => ({
        playerProgress: {
          ...state.playerProgress,
          unlockedFighters: [...state.playerProgress.unlockedFighters, fighterId]
        }
      }));
      get().saveProgress();
    },

    setShowUpgrades: (showUpgrades) => set({ showUpgrades }),
    setShowFighterSelection: (showFighterSelection) => set({ showFighterSelection }),

    saveProgress: () => {
      const state = get();
      setLocalStorage('boxingGameProgress', state.playerProgress);
    },

    loadProgress: () => {
      const saved = getLocalStorage('boxingGameProgress');
      if (saved) {
        set({ playerProgress: saved });
      }
    }
  }))
);
