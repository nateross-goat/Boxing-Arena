import { create } from "zustand";

interface SoundManagerState {
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  backgroundMusic: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Enhanced sound properties
  lastHitTime: number;
  comboCount: number;
  audioContext: AudioContext | null;
  
  initializeSounds: () => void;
  playHit: () => void;
  playAIHit: () => void;
  playSuccess: () => void;
  playBlock: () => void;
  playMiss: () => void;
  playStun: () => void;
  playKnockdown: () => void;
  playCrowdCheer: () => void;
  playCrowdBoo: () => void;
  playRoundBell: () => void;
  playComboHit: (comboLevel: number) => void;
  resetCombo: () => void;
  resumeAudioContext: () => void;
  toggleMute: () => void;
}

export const useSoundManager = create<SoundManagerState>((set, get) => ({
  hitSound: null,
  successSound: null,
  backgroundMusic: null,
  isMuted: false,
  lastHitTime: 0,
  comboCount: 0,
  audioContext: null,

  initializeSounds: () => {
    try {
      const hitSound = new Audio('/sounds/hit.mp3');
      const successSound = new Audio('/sounds/success.mp3');
      const backgroundMusic = new Audio('/sounds/background.mp3');

      hitSound.volume = 0.3;
      successSound.volume = 0.5;
      backgroundMusic.volume = 0.2;
      backgroundMusic.loop = true;

      set({
        hitSound,
        successSound,
        backgroundMusic
      });

      // Initialize Web Audio Context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      set({
        hitSound,
        successSound,
        backgroundMusic,
        audioContext
      });
      
      // Resume context if suspended (will be needed after user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          console.log('AudioContext resume failed - will retry on user interaction');
        });
      }

      // Start background music
      backgroundMusic.play().catch(() => {
        console.log('Background music autoplay prevented');
      });

    } catch (error) {
      console.log('Error initializing sounds:', error);
    }
  },

  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      try {
        // Update combo tracking first
        const now = Date.now();
        const { lastHitTime, comboCount } = get();
        
        const newComboCount = (now - lastHitTime < 2000) ? comboCount + 1 : 1;
        
        set({ 
          lastHitTime: now, 
          comboCount: newComboCount 
        });
        
        // Play appropriate sound based on combo count
        if (newComboCount >= 3) {
          const soundClone = hitSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = Math.min(0.7, 0.3 + (newComboCount * 0.1));
          soundClone.playbackRate = 1 + (newComboCount * 0.1);
          soundClone.play();
          
          // Crowd reacts to good combos
          if (newComboCount >= 5) {
            setTimeout(() => get().playCrowdCheer(), 200);
          }
        } else {
          // Normal hit sound
          const soundClone = hitSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = 0.4;
          soundClone.play();
        }
      } catch (error) {
        console.log('Hit sound play error:', error);
      }
    }
  },

  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      try {
        successSound.currentTime = 0;
        successSound.play();
      } catch (error) {
        console.log('Success sound play error:', error);
      }
    }
  },

  playBlock: () => {
    const { isMuted, audioContext } = get();
    if (!isMuted && audioContext) {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        
        // Clean up nodes
        setTimeout(() => {
          try {
            oscillator.disconnect();
            gainNode.disconnect();
          } catch (e) { /* ignore cleanup errors */ }
        }, 250);
      } catch (error) {
        console.log('Block sound error:', error);
      }
    }
  },

  playMiss: () => {
    const { isMuted, audioContext } = get();
    if (!isMuted && audioContext) {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        
        setTimeout(() => {
          try {
            oscillator.disconnect();
            gainNode.disconnect();
          } catch (e) { /* ignore cleanup errors */ }
        }, 200);
      } catch (error) {
        console.log('Miss sound error:', error);
      }
    }
  },

  playStun: () => {
    const { isMuted, audioContext } = get();
    if (!isMuted && audioContext) {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        setTimeout(() => {
          try {
            oscillator.disconnect();
            gainNode.disconnect();
          } catch (e) { /* ignore cleanup errors */ }
        }, 600);
      } catch (error) {
        console.log('Stun sound error:', error);
      }
    }
  },

  playKnockdown: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      try {
        // Play success sound with lower pitch for knockdown
        const soundClone = successSound.cloneNode() as HTMLAudioElement;
        soundClone.volume = 0.6;
        soundClone.playbackRate = 0.8; // Lower pitch
        soundClone.play();
      } catch (error) {
        console.log('Knockdown sound error:', error);
      }
    }
  },

  playCrowdCheer: () => {
    const { isMuted, audioContext } = get();
    if (!isMuted && audioContext) {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200 + Math.random() * 200, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.0);
        
        setTimeout(() => {
          try {
            oscillator.disconnect();
            gainNode.disconnect();
          } catch (e) { /* ignore cleanup errors */ }
        }, 1100);
      } catch (error) {
        console.log('Crowd cheer error:', error);
      }
    }
  },

  playCrowdBoo: () => {
    const { isMuted, audioContext } = get();
    if (!isMuted && audioContext) {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(80 + Math.random() * 60, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
        
        setTimeout(() => {
          try {
            oscillator.disconnect();
            gainNode.disconnect();
          } catch (e) { /* ignore cleanup errors */ }
        }, 900);
      } catch (error) {
        console.log('Crowd boo error:', error);
      }
    }
  },

  playRoundBell: () => {
    const { isMuted, audioContext } = get();
    if (!isMuted && audioContext) {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 2.0);
        
        setTimeout(() => {
          try {
            oscillator.disconnect();
            gainNode.disconnect();
          } catch (e) { /* ignore cleanup errors */ }
        }, 2100);
      } catch (error) {
        console.log('Round bell error:', error);
      }
    }
  },

  playAIHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      try {
        // AI hit sound without combo tracking
        const soundClone = hitSound.cloneNode() as HTMLAudioElement;
        soundClone.volume = 0.4;
        soundClone.play();
      } catch (error) {
        console.log('AI hit sound play error:', error);
      }
    }
  },

  playComboHit: (comboLevel: number) => {
    // This method is deprecated - combo logic is now handled in playHit()
    // Kept for backwards compatibility
    console.warn('playComboHit is deprecated, use playHit() which handles combos automatically');
  },

  resumeAudioContext: () => {
    const { audioContext } = get();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch((error) => {
        console.log('AudioContext resume error:', error);
      });
    }
  },

  resetCombo: () => {
    set({ comboCount: 0, lastHitTime: 0 });
  },

  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    set({ isMuted: newMutedState });
    
    if (backgroundMusic) {
      if (newMutedState) {
        backgroundMusic.pause();
      } else {
        backgroundMusic.play().catch(() => {
          console.log('Background music play prevented');
        });
      }
    }
  }
}));
