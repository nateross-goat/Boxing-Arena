import { useBoxingGame } from "../lib/stores/useBoxingGame";
import { getFighters } from "../lib/fighters";

interface FighterSelectionMenuProps {
  onClose: () => void;
}

const FighterSelectionMenu = ({ onClose }: FighterSelectionMenuProps) => {
  const { playerProgress, startFight } = useBoxingGame();
  const fighters = getFighters();

  const handleSelectFighter = (fighterId: string) => {
    startFight(fighterId);
    onClose();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-30">
      <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">SELECT OPPONENT</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {fighters.map((fighter: any) => {
            const isUnlocked = playerProgress.unlockedFighters.includes(fighter.id);
            const canFight = isUnlocked || fighter.id === fighters[playerProgress.unlockedFighters.length]?.id;
            
            return (
              <div 
                key={fighter.id}
                className={`p-4 rounded border-2 ${
                  canFight 
                    ? 'bg-gray-700 border-green-500 cursor-pointer hover:bg-gray-600' 
                    : 'bg-gray-800 border-gray-600 opacity-50'
                }`}
                onClick={canFight ? () => handleSelectFighter(fighter.id) : undefined}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{fighter.avatar}</div>
                  <h3 className="text-white font-bold text-lg mb-1">{fighter.name}</h3>
                  <div className="text-gray-300 text-sm mb-2">{fighter.nickname}</div>
                  
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>Health: {fighter.health}</div>
                    <div>Power: {fighter.power}</div>
                    <div>Speed: {fighter.speed}</div>
                    <div>Defense: {fighter.defense}</div>
                  </div>
                  
                  {!canFight && (
                    <div className="text-red-400 text-xs mt-2 font-bold">
                      LOCKED
                    </div>
                  )}
                  
                  {fighter.id === 'mike_tyson' && (
                    <div className="text-red-500 text-xs mt-2 font-bold">
                      FINAL BOSS
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
        >
          BACK
        </button>
      </div>
    </div>
  );
};

export default FighterSelectionMenu;
