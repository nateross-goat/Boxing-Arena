import { useBoxingGame } from "./stores/useBoxingGame";
import { useSoundManager } from "./soundManager";
import type { Arena } from "./stores/useBoxingGame";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private keys: Set<string> = new Set();
  private lastTime = 0;
  private initialized = false;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.setupInputHandlers();
  }

  private setupInputHandlers() {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      // Resume audio context on first user interaction
      useSoundManager.getState().resumeAudioContext();
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      e.preventDefault();
    });

    // Focus canvas
    this.canvas.addEventListener('click', () => {
      this.canvas.focus();
      // Resume audio context on first user interaction
      useSoundManager.getState().resumeAudioContext();
    });
  }

  update() {
    const currentTime = Date.now();
    let deltaTime = currentTime - this.lastTime;
    
    // Initialize timing on first update to prevent massive deltaTime spike
    if (!this.initialized) {
      this.initialized = true;
      this.lastTime = currentTime;
      deltaTime = 16; // Assume ~60fps for first frame
    } else {
      this.lastTime = currentTime;
      // Clamp deltaTime to prevent time spikes (max 100ms)
      deltaTime = Math.min(deltaTime, 100);
    }
    
    // Convert to seconds for calculations
    const deltaSeconds = deltaTime / 1000;

    const state = useBoxingGame.getState();
    const { player, opponent, playerProgress, playerStamina, opponentStamina, roundData } = state;
    
    if (!opponent) return;

    // Handle round break if in break state
    if (roundData.isInBreak || state.gameState === 'roundBreak') {
      const newBreakTimer = Math.max(0, roundData.breakTimer - deltaTime);
      state.updateBreakTimer(newBreakTimer);
      
      if (newBreakTimer <= 0) {
        // Break is over, start next round
        useSoundManager.getState().playRoundBell();
        state.startNextRound();
      }
      return; // Don't update game during break
    }

    // Update round timer
    const newRoundTimer = Math.max(0, roundData.roundTimer - deltaTime);
    state.updateRoundTimer(newRoundTimer);

    // Check round end conditions
    if (newRoundTimer <= 0) {
      // Play round bell before ending
      useSoundManager.getState().playRoundBell();
      this.endRoundByTime();
      return;
    }

    // Update player
    this.updatePlayer(deltaTime, deltaSeconds, playerProgress);
    
    // Update opponent AI
    this.updateOpponentAI(deltaTime, deltaSeconds);

    // Update stun timers
    if (player.isStunned) {
      const newStunTimer = Math.max(0, player.stunTimer - deltaTime);
      state.updatePlayer({ 
        stunTimer: newStunTimer,
        isStunned: newStunTimer > 0 
      });
    }

    if (opponent.isStunned) {
      const newStunTimer = Math.max(0, opponent.stunTimer - deltaTime);
      state.updateOpponent({ 
        stunTimer: newStunTimer,
        isStunned: newStunTimer > 0 
      });
    }

    // Update stamina recovery - slower during combat, faster when idle
    const playerCombatState = player.currentAction !== 'idle' && player.currentAction !== 'blocking';
    const opponentCombatState = opponent.currentAction !== 'idle' && opponent.currentAction !== 'blocking';
    
    // Per-second recovery rates: 3 idle, 1 fighting (much more strategic)
    const playerRecoveryRate = playerCombatState ? 1 : 3;
    const opponentRecoveryRate = opponentCombatState ? 1 : 3;
    
    const newPlayerStamina = Math.min(100, playerStamina + deltaSeconds * playerRecoveryRate);
    const newOpponentStamina = Math.min(100, opponentStamina + deltaSeconds * opponentRecoveryRate);
    state.updateStamina(newPlayerStamina, newOpponentStamina);

    // Check knockout conditions
    if (player.health <= 0) {
      this.endRoundByKnockout('opponent');
    } else if (opponent.health <= 0) {
      this.endRoundByKnockout('player');
    }
  }

  private updatePlayer(deltaTime: number, deltaSeconds: number, playerProgress: any) {
    const state = useBoxingGame.getState();
    const { player, arena, playerStamina } = state;

    if (player.isStunned) return;

    const speedMultiplier = 1 + (playerProgress.upgrades.speed * 0.2);
    // Stamina affects movement speed - slower when tired
    const staminaSpeedEffect = Math.max(0.5, playerStamina / 100);
    const moveSpeed = 150 * speedMultiplier * staminaSpeedEffect * deltaSeconds;

    let newX = player.x;
    let newY = player.y;
    let facing = player.facing;

    // Movement
    if (this.keys.has('ArrowLeft')) {
      newX -= moveSpeed;
      facing = 'left';
    }
    if (this.keys.has('ArrowRight')) {
      newX += moveSpeed;
      facing = 'right';
    }
    if (this.keys.has('ArrowUp')) {
      newY -= moveSpeed;
    }
    if (this.keys.has('ArrowDown')) {
      newY += moveSpeed;
    }

    // Clamp to arena bounds
    newX = Math.max(arena.leftBound, Math.min(arena.rightBound - player.width, newX));
    newY = Math.max(arena.topBound, Math.min(arena.bottomBound - player.height, newY));

    // Combat actions
    let currentAction = 'idle';
    let isBlocking = false;
    let isDodging = false;
    let isDucking = false;

    if (this.keys.has('KeyA')) {
      isBlocking = true;
      currentAction = 'blocking';
    }
    if (this.keys.has('KeyW')) {
      isDodging = true;
      currentAction = 'dodging';
    }
    if (this.keys.has('KeyE')) {
      isDucking = true;
      currentAction = 'ducking';
    }

    // Attacks (with cooldown and stamina cost)
    const currentTime = Date.now();
    const timeSinceLastAttack = currentTime - player.lastAttackTime;

    // Stamina affects attack cooldowns - tired fighters attack slower
    const staminaCooldownMultiplier = 1 + (1 - playerStamina / 100) * 0.8; // Up to 80% slower when exhausted

    if (playerStamina >= 20) {
      const baseCooldowns = { jab: 300, cross: 600, uppercut: 1000 };
      const adjustedJabCooldown = baseCooldowns.jab * staminaCooldownMultiplier;
      const adjustedCrossCooldown = baseCooldowns.cross * staminaCooldownMultiplier;
      const adjustedUppercutCooldown = baseCooldowns.uppercut * staminaCooldownMultiplier;

      if (this.keys.has('KeyD') && timeSinceLastAttack >= adjustedJabCooldown) { // Jab
        this.performPlayerAttack('jab', 10, adjustedJabCooldown, 20);
      } else if (this.keys.has('KeyF') && timeSinceLastAttack >= adjustedCrossCooldown) { // Cross
        this.performPlayerAttack('cross', 20, adjustedCrossCooldown, 30);
      } else if (this.keys.has('KeyS') && timeSinceLastAttack >= adjustedUppercutCooldown) { // Uppercut
        this.performPlayerAttack('uppercut', 30, adjustedUppercutCooldown, 40);
      }
    }

    // Don't overwrite currentAction if we're in an attack animation
    const isInAttackAnimation = (Date.now() - player.lastAttackTime) < 300;
    const finalCurrentAction = isInAttackAnimation ? player.currentAction : currentAction;

    state.updatePlayer({
      x: newX,
      y: newY,
      facing,
      isBlocking,
      isDodging,
      isDucking,
      currentAction: finalCurrentAction
    });

    // Update AI learning patterns for defensive actions only
    if (currentAction !== 'idle' && currentAction !== player.currentAction) {
      this.updateAILearning(currentAction);
    }
  }

  private performPlayerAttack(attackType: string, damage: number, cooldown: number, staminaCost: number) {
    const state = useBoxingGame.getState();
    const { player, opponent, playerProgress, playerStamina } = state;
    
    if (!opponent || playerStamina < staminaCost) return;

    const strengthMultiplier = 1 + (playerProgress.upgrades.strength * 0.3);
    
    // Stamina affects punch effectiveness - reduced power when tired
    const staminaEffectiveness = Math.max(0.3, playerStamina / 100);
    const finalDamage = damage * strengthMultiplier * staminaEffectiveness;

    // Check if attack connects (range check)
    const distance = Math.abs(player.x - opponent.x);
    const attackRange = attackType === 'jab' ? 70 : attackType === 'cross' ? 80 : 90;

    if (distance <= attackRange) {
      // Check if opponent is defending
      let actualDamage = finalDamage;
      let knockback = 0;

      if (opponent.isBlocking) {
        actualDamage *= 0.3; // Blocked attacks do reduced damage
        useSoundManager.getState().playBlock();
      } else if (opponent.isDodging) {
        actualDamage = 0; // Dodged attacks do no damage
        useSoundManager.getState().playMiss();
      } else if (opponent.isDucking && attackType !== 'uppercut') {
        actualDamage = 0; // Ducked attacks miss (except uppercuts)
        useSoundManager.getState().playMiss();
      } else {
        // Calculate knockback
        knockback = attackType === 'jab' ? 10 : attackType === 'cross' ? 20 : 40;
        
        // Chance to stun
        const stunChance = attackType === 'uppercut' ? 0.3 : 0.1;
        if (Math.random() < stunChance) {
          state.updateOpponent({ 
            isStunned: true, 
            stunTimer: 3000,
            currentAction: 'stunned'
          });
          useSoundManager.getState().playStun();
        }
      }

      // Apply damage and knockback
      if (actualDamage > 0) {
        const newHealth = Math.max(0, opponent.health - actualDamage);
        let newOpponentX = opponent.x;
        
        if (knockback > 0) {
          newOpponentX += player.facing === 'right' ? knockback : -knockback;
          newOpponentX = Math.max(state.arena.leftBound, 
            Math.min(state.arena.rightBound - opponent.width, newOpponentX));
        }

        state.updateOpponent({ 
          health: newHealth,
          x: newOpponentX,
          currentAction: actualDamage > 0 ? 'hit' : 'blocked'
        });

        // Play hit sound (now handles combo tracking internally)
        useSoundManager.getState().playHit();
      }
    } else {
      // Attack was out of range - miss sound
      useSoundManager.getState().playMiss();
    }

    // Update player state
    state.updatePlayer({
      lastAttackTime: Date.now(),
      currentAction: attackType
    });

    // Track attack for AI learning
    this.updateAILearning(attackType);

    // Consume stamina
    state.updateStamina(Math.max(0, playerStamina - staminaCost), state.opponentStamina);
  }

  private updateOpponentAI(deltaTime: number, deltaSeconds: number) {
    const state = useBoxingGame.getState();
    const { player, opponent, opponentStamina } = state;
    
    if (!opponent || opponent.isStunned) return;

    const currentTime = Date.now();
    
    // AI acts every 300-800ms based on difficulty
    const aiInterval = Math.max(300, 800 - (opponent.speed * 50));
    
    if (currentTime - opponent.lastAIAction >= aiInterval) {
      this.performOpponentAI();
      state.updateOpponent({ lastAIAction: currentTime });
    }

    // Basic movement towards player
    const distance = Math.abs(player.x - opponent.x);
    // Opponent movement also affected by stamina
    const opponentStaminaEffect = Math.max(0.5, opponentStamina / 100);
    const moveSpeed = (opponent.speed * 20) * opponentStaminaEffect * deltaSeconds;
    
    let newX = opponent.x;
    let facing = opponent.facing;

    if (distance > 80) {
      if (player.x < opponent.x) {
        newX -= moveSpeed;
        facing = 'left';
      } else {
        newX += moveSpeed;
        facing = 'right';
      }
    } else if (distance < 60) {
      // Back away sometimes
      if (Math.random() < 0.3) {
        if (player.x < opponent.x) {
          newX += moveSpeed;
        } else {
          newX -= moveSpeed;
        }
      }
    }

    // Clamp to arena bounds
    newX = Math.max(state.arena.leftBound, Math.min(state.arena.rightBound - opponent.width, newX));

    state.updateOpponent({ x: newX, facing });
  }

  private performOpponentAI() {
    const state = useBoxingGame.getState();
    const { player, opponent, opponentStamina } = state;
    
    if (!opponent || opponentStamina < 20) return;

    const distance = Math.abs(player.x - opponent.x);
    const patterns = opponent.playerPatterns;
    
    // AI decision making enhanced with pattern recognition
    const baseAggressiveness = opponent.aiStrategy;
    const adaptationBonus = patterns.adaptationLevel * 0.3; // Up to 30% adaptation
    const aggressiveness = Math.min(1, baseAggressiveness + adaptationBonus);
    
    // More reliable player threat detection using recent attack timing
    const playerThreat = (Date.now() - player.lastAttackTime) < 250;

    // Predict player behavior and counter accordingly
    const predictedAction = patterns.predictedNext;
    const isPredictingAttack = predictedAction === 'jab' || predictedAction === 'cross' || predictedAction === 'uppercut';
    const isPredictingDefense = predictedAction === 'blocking' || predictedAction === 'dodging' || predictedAction === 'ducking';

    let action = 'idle';
    let staminaCost = 0;

    // Enhanced AI decision making with pattern adaptation
    if (playerThreat && distance < 100) {
      // Defensive actions - adapt based on player attack patterns
      const totalPlayerAttacks = patterns.attackCount.jab + patterns.attackCount.cross + patterns.attackCount.uppercut;
      let defensiveChoice = Math.random();
      
      if (totalPlayerAttacks > 5) {
        // Adapt defense based on most common player attacks
        if (patterns.attackCount.jab > patterns.attackCount.cross && patterns.attackCount.jab > patterns.attackCount.uppercut) {
          defensiveChoice *= 0.6; // More likely to dodge jabs
        } else if (patterns.attackCount.uppercut > patterns.attackCount.cross) {
          defensiveChoice += 0.3; // More likely to duck against uppercuts
        }
      }
      
      if (defensiveChoice < 0.4) {
        action = 'blocking';
      } else if (defensiveChoice < 0.7) {
        action = 'dodging';
      } else {
        action = 'ducking';
      }
    } else if (distance <= 80 && opponentStamina >= 30) {
      // Offensive actions with predictive behavior
      let shouldAttack = Math.random() < aggressiveness;
      
      // If predicting player will be defensive, be more aggressive
      if (isPredictingDefense) {
        shouldAttack = Math.random() < (aggressiveness + 0.3);
      }
      // If predicting player will attack, counter-attack more strategically
      else if (isPredictingAttack) {
        shouldAttack = Math.random() < (aggressiveness + 0.2);
      }
      
      if (shouldAttack) {
        const attackRoll = Math.random();
        
        // Choose attacks based on adaptation level and patterns
        const adaptedAttackChoice = attackRoll + (patterns.adaptationLevel * 0.2);
        
        if (adaptedAttackChoice < 0.3) {
          action = 'jab';
          staminaCost = 20;
          this.performOpponentAttack('jab', 8 + opponent.power, staminaCost);
        } else if (adaptedAttackChoice < 0.6) {
          action = 'cross';
          staminaCost = 30;
          this.performOpponentAttack('cross', 15 + opponent.power, staminaCost);
        } else {
          action = 'uppercut';
          staminaCost = 40;
          this.performOpponentAttack('uppercut', 25 + opponent.power, staminaCost);
        }
      }
    }

    state.updateOpponent({ 
      currentAction: action,
      isBlocking: action === 'blocking',
      isDodging: action === 'dodging',
      isDucking: action === 'ducking'
    });

    if (staminaCost > 0) {
      state.updateStamina(state.playerStamina, Math.max(0, opponentStamina - staminaCost));
    }
  }

  private performOpponentAttack(attackType: string, damage: number, staminaCost: number) {
    const state = useBoxingGame.getState();
    const { player, opponent, opponentStamina } = state;
    
    if (!opponent) return;

    // Update opponent attack state immediately for visual effects
    state.updateOpponent({ 
      lastAttackTime: Date.now(),
      currentAction: attackType
    });

    // Stamina affects opponent punch effectiveness too
    const staminaEffectiveness = Math.max(0.3, opponentStamina / 100);
    const finalDamage = damage * staminaEffectiveness;

    // Check if attack connects
    const distance = Math.abs(player.x - opponent.x);
    const attackRange = attackType === 'jab' ? 70 : attackType === 'cross' ? 80 : 90;

    if (distance <= attackRange) {
      let actualDamage = finalDamage;
      let knockback = 0;

      // Check player defenses
      if (player.isBlocking) {
        actualDamage *= 0.3;
        useSoundManager.getState().playBlock();
      } else if (player.isDodging) {
        actualDamage = 0;
        useSoundManager.getState().playMiss();
      } else if (player.isDucking && attackType !== 'uppercut') {
        actualDamage = 0;
        useSoundManager.getState().playMiss();
      } else {
        knockback = attackType === 'jab' ? 10 : attackType === 'cross' ? 20 : 40;
        
        // Chance to stun player
        const chinResistance = state.playerProgress.upgrades.chin * 0.1;
        const stunChance = Math.max(0, (attackType === 'uppercut' ? 0.3 : 0.1) - chinResistance);
        
        if (Math.random() < stunChance) {
          state.updatePlayer({ 
            isStunned: true, 
            stunTimer: 3000,
            currentAction: 'stunned'
          });
          useSoundManager.getState().playStun();
          // Crowd boos when player gets stunned
          setTimeout(() => useSoundManager.getState().playCrowdBoo(), 300);
        }
      }

      // Apply damage and knockback
      if (actualDamage > 0) {
        const newHealth = Math.max(0, player.health - actualDamage);
        let newPlayerX = player.x;
        
        if (knockback > 0) {
          newPlayerX += opponent.facing === 'right' ? knockback : -knockback;
          newPlayerX = Math.max(state.arena.leftBound, 
            Math.min(state.arena.rightBound - player.width, newPlayerX));
        }

        state.updatePlayer({ 
          health: newHealth,
          x: newPlayerX,
          currentAction: actualDamage > 0 ? 'hit' : 'blocked'
        });

        // AI hit sound - different from player combos
        useSoundManager.getState().playAIHit();
        
        // Check for knockdown
        if (newHealth === 0) {
          useSoundManager.getState().playKnockdown();
          setTimeout(() => useSoundManager.getState().playCrowdBoo(), 500);
        }
      }
    } else {
      // AI attack was out of range - miss sound
      useSoundManager.getState().playMiss();
    }
  }

  private endRoundByTime() {
    const state = useBoxingGame.getState();
    const { player, opponent } = state;
    
    if (!opponent) return;

    // Winner is determined by remaining health (points)
    let roundWinner: 'player' | 'opponent' | 'draw' = 'draw';
    
    const healthDifference = player.health - opponent.health;
    if (Math.abs(healthDifference) >= 10) { // Significant health difference
      roundWinner = healthDifference > 0 ? 'player' : 'opponent';
    }
    
    // Award round and check if match continues
    state.endCurrentRound(roundWinner);
    useSoundManager.getState().resetCombo();
    
    // Play crowd reaction based on round result
    const soundManager = useSoundManager.getState();
    if (roundWinner === 'player') {
      soundManager.playCrowdCheer();
    } else if (roundWinner === 'opponent') {
      soundManager.playCrowdBoo();
    }
    
    // Check if match ended due to final round completion
    const currentState = useBoxingGame.getState();
    if (currentState.gameState === 'victory') {
      this.handleMatchVictory();
    }
  }
  
  private endRoundByKnockout(winner: 'player' | 'opponent') {
    const state = useBoxingGame.getState();
    
    // Knockout ends the match immediately
    this.finishMatch(winner);
    
    const soundManager = useSoundManager.getState();
    soundManager.playKnockdown();
    soundManager.resetCombo();
    
    if (winner === 'player') {
      soundManager.playCrowdCheer();
    } else {
      soundManager.playCrowdBoo();
    }
  }
  
  private finishMatch(winner: 'player' | 'opponent') {
    const state = useBoxingGame.getState();
    const { opponent } = state;
    
    if (!opponent) return;

    if (winner === 'player') {
      // Award money based on round performance
      const totalRounds = state.roundData.roundScores.length + 1; // +1 for current round
      const playerWins = state.roundData.roundScores.reduce((sum, score) => sum + score.player, 0) + 1; // +1 for knockout win
      
      // Bonus money for winning in fewer rounds (more dominant performance)
      let money = 5; // Base prize
      if (playerWins === totalRounds) { // Won all rounds
        money += 3;
      }
      if (totalRounds < 3) { // Early finish bonus (knockout)
        money += 2;
      }
      
      state.addMoney(money);

      // Unlock next fighter
      const fighters = ['amateur', 'brawler', 'boxer', 'champion', 'contender', 'mike_tyson'];
      const currentIndex = fighters.indexOf(opponent.id);
      if (currentIndex >= 0 && currentIndex < fighters.length - 1) {
        const nextFighter = fighters[currentIndex + 1];
        if (!state.playerProgress.unlockedFighters.includes(nextFighter)) {
          state.unlockFighter(nextFighter);
        }
      }

      state.setGameState('victory');
      
      const soundManager = useSoundManager.getState();
      soundManager.playSuccess();
      soundManager.playRoundBell();
    } else {
      state.setGameState('gameOver');
    }
  }

  private handleMatchVictory() {
    const state = useBoxingGame.getState();
    const { opponent } = state;
    
    if (!opponent) return;

    // Award money based on round performance
    const totalRounds = state.roundData.roundScores.length;
    const playerWins = state.roundData.roundScores.reduce((sum, score) => sum + score.player, 0);
    
    // Bonus money for winning in fewer rounds (more dominant performance)
    let money = 5; // Base prize
    if (playerWins === totalRounds) { // Won all rounds
      money += 3;
    }
    if (totalRounds < 3) { // Early finish bonus
      money += 2;
    }
    
    state.addMoney(money);

    // Unlock next fighter
    const fighters = ['amateur', 'brawler', 'boxer', 'champion', 'contender', 'mike_tyson'];
    const currentIndex = fighters.indexOf(opponent.id);
    if (currentIndex >= 0 && currentIndex < fighters.length - 1) {
      const nextFighter = fighters[currentIndex + 1];
      if (!state.playerProgress.unlockedFighters.includes(nextFighter)) {
        state.unlockFighter(nextFighter);
      }
    }

    const soundManager = useSoundManager.getState();
    soundManager.playSuccess();
    soundManager.playCrowdCheer();
    soundManager.playRoundBell(); // Victory bell
  }

  private updateAILearning(playerAction: string) {
    const state = useBoxingGame.getState();
    const { opponent } = state;
    
    if (!opponent) return;

    const patterns = opponent.playerPatterns;
    
    // Track recent actions (keep last 10 actions)
    patterns.recentActions.push(playerAction);
    if (patterns.recentActions.length > 10) {
      patterns.recentActions.shift();
    }

    // Update action counts
    if (playerAction === 'jab' || playerAction === 'cross' || playerAction === 'uppercut') {
      patterns.attackCount[playerAction as keyof typeof patterns.attackCount]++;
    } else if (playerAction === 'blocking' || playerAction === 'dodging' || playerAction === 'ducking') {
      // Fixed defensive mapping
      const defensiveMap: { [key: string]: keyof typeof patterns.defensiveCount } = {
        'blocking': 'block',
        'dodging': 'dodge', 
        'ducking': 'duck'
      };
      const actionKey = defensiveMap[playerAction];
      if (actionKey) {
        patterns.defensiveCount[actionKey]++;
      }
    }

    // Predict next action based on patterns
    this.predictPlayerNextAction(patterns);

    // Increase adaptation level based on fight duration
    patterns.adaptationLevel = Math.min(1, patterns.adaptationLevel + 0.001);

    state.updateOpponent({ playerPatterns: patterns });
  }

  private predictPlayerNextAction(patterns: any) {
    // Simple pattern recognition: look for repeated sequences
    const recent = patterns.recentActions;
    if (recent.length < 3) {
      patterns.predictedNext = 'idle';
      return;
    }

    // Look for the last 2-action sequence and predict what usually comes next
    const lastTwo = recent.slice(-2).join('-');
    const sequences: { [key: string]: string[] } = {};
    
    for (let i = 0; i < recent.length - 2; i++) {
      const sequence = recent.slice(i, i + 2).join('-');
      const nextAction = recent[i + 2];
      
      if (!sequences[sequence]) sequences[sequence] = [];
      sequences[sequence].push(nextAction);
    }

    if (sequences[lastTwo] && sequences[lastTwo].length > 0) {
      // Find most common next action for this sequence
      const nextActions = sequences[lastTwo];
      const actionCounts: { [key: string]: number } = {};
      
      nextActions.forEach(action => {
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      });

      patterns.predictedNext = Object.keys(actionCounts).reduce((a, b) => 
        actionCounts[a] > actionCounts[b] ? a : b
      );
    } else {
      // Fallback to most common recent action
      const mostCommon = patterns.recentActions.reduce((prev, curr, _, arr) =>
        arr.filter(item => item === curr).length > arr.filter(item => item === prev).length ? curr : prev
      );
      patterns.predictedNext = mostCommon;
    }
  }

  render() {
    const state = useBoxingGame.getState();
    const { player, opponent, arena } = state;

    // Clear canvas
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw arena
    this.drawArena(arena);

    // Draw fighters
    this.drawFighter(player, true);
    if (opponent) {
      this.drawFighter(opponent, false);
    }
  }

  private drawArena(arena: any) {
    // Arena floor
    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fillRect(arena.leftBound, arena.topBound, 
      arena.rightBound - arena.leftBound, arena.bottomBound - arena.topBound);

    // Arena ropes
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(arena.leftBound, arena.topBound, 
      arena.rightBound - arena.leftBound, arena.bottomBound - arena.topBound);

    // Center line
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    const centerX = (arena.leftBound + arena.rightBound) / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, arena.topBound);
    this.ctx.lineTo(centerX, arena.bottomBound);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawFighter(fighter: any, isPlayer: boolean) {
    const ctx = this.ctx;
    
    // Calculate shake first if stunned
    let shakeX = 0, shakeY = 0;
    if (fighter.isStunned) {
      shakeX = (Math.random() - 0.5) * 6;
      shakeY = (Math.random() - 0.5) * 4;
      ctx.save();
      ctx.translate(shakeX, shakeY);
    }
    
    // Enhanced fighter body with gradient and outline (after shake transform)
    const gradient = ctx.createLinearGradient(fighter.x, fighter.y, fighter.x, fighter.y + fighter.height);
    
    if (fighter.isStunned) {
      gradient.addColorStop(0, '#ffff00');
      gradient.addColorStop(1, '#ffcc00');
    } else if (fighter.currentAction === 'hit') {
      gradient.addColorStop(0, '#ff6666');
      gradient.addColorStop(1, '#cc0000');
    } else {
      const baseColor = fighter.color;
      const lighterColor = this.lightenColor(baseColor, 30);
      gradient.addColorStop(0, lighterColor);
      gradient.addColorStop(1, baseColor);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(fighter.x, fighter.y, fighter.width, fighter.height);
    
    // Fighter outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(fighter.x, fighter.y, fighter.width, fighter.height);
    
    if (fighter.isStunned) {
      ctx.restore();
    }

    // Fighter face direction indicator
    ctx.fillStyle = '#ffffff';
    const faceX = fighter.facing === 'right' ? 
      fighter.x + fighter.width - 10 : fighter.x;
    ctx.fillRect(faceX, fighter.y + 10, 10, 20);

    // Action indicators
    if (fighter.isBlocking) {
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(fighter.x - 10, fighter.y + 20, 80, 10);
    }
    
    if (fighter.isDodging) {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(fighter.x + fighter.width/2, fighter.y - 10, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (fighter.isDucking) {
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(fighter.x, fighter.y + fighter.height, fighter.width, 10);
    }

    // Enhanced punch animations with trails and impact effects
    if (fighter.currentAction.includes('jab') || 
        fighter.currentAction.includes('cross') || 
        fighter.currentAction.includes('uppercut')) {
      
      const timeSinceAttack = Date.now() - fighter.lastAttackTime;
      const animationProgress = Math.max(0, 1 - timeSinceAttack / 300); // 300ms animation
      
      if (animationProgress > 0) {
        const punchX = fighter.facing === 'right' ? 
          fighter.x + fighter.width : fighter.x - 30;
        const punchY = fighter.currentAction.includes('uppercut') ? 
          fighter.y + 40 : fighter.y + 25;
        
        // Punch trail effect
        ctx.save();
        ctx.globalAlpha = animationProgress * 0.7;
        
        // Set font for emojis
        ctx.font = '20px Arial';
        ctx.textBaseline = 'middle';
        
        // Different effects for different punches
        if (fighter.currentAction.includes('jab')) {
          // Fast jab - small but quick
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(punchX, punchY, 15 + animationProgress * 10, 8);
          ctx.fillText('💥', punchX + 20, punchY + 4);
        } else if (fighter.currentAction.includes('cross')) {
          // Cross - medium power
          ctx.fillStyle = '#ff6600';
          ctx.fillRect(punchX, punchY, 20 + animationProgress * 15, 12);
          ctx.fillText('🔥', punchX + 25, punchY + 6);
        } else if (fighter.currentAction.includes('uppercut')) {
          // Uppercut - powerful upward motion
          ctx.fillStyle = '#ff3300';
          const upwardOffset = animationProgress * 20;
          ctx.fillRect(punchX, punchY - upwardOffset, 18, 15 + upwardOffset);
          ctx.fillText('⚡', punchX + 20, punchY - upwardOffset + 8);
        }
        
        ctx.restore();
      }
    }

    // Fighter name/avatar
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    if (isPlayer) {
      ctx.fillText('YOU', fighter.x + fighter.width/2, fighter.y - 10);
    } else {
      // Show opponent avatar/emoji
      ctx.font = '24px Arial';
      const avatar = fighter.id === 'mike_tyson' ? '👑🥊' : 
                    fighter.id === 'champion' ? '🏆' :
                    fighter.id === 'contender' ? '⚡' :
                    fighter.id === 'boxer' ? '🥊' :
                    fighter.id === 'brawler' ? '💪' : '👤';
      ctx.fillText(avatar, fighter.x + fighter.width/2, fighter.y - 15);
    }
  }

  private lightenColor(color: string, percent: number): string {
    // Simple color lightening function
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
}
