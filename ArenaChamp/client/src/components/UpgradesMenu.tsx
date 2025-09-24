import { useBoxingGame } from "../lib/stores/useBoxingGame";

interface UpgradesMenuProps {
  onClose: () => void;
}

const UpgradesMenu = ({ onClose }: UpgradesMenuProps) => {
  const { playerProgress, upgradePlayer } = useBoxingGame();

  const upgrades = [
    {
      name: 'Speed',
      description: 'Movement and punch speed',
      cost: 1 + playerProgress.upgrades.speed * 2,
      level: playerProgress.upgrades.speed,
      maxLevel: 10
    },
    {
      name: 'Strength',
      description: 'Attack power',
      cost: 1 + playerProgress.upgrades.strength * 2,
      level: playerProgress.upgrades.strength,
      maxLevel: 10
    },
    {
      name: 'Chin',
      description: 'Reduces stun chance',
      cost: 1 + playerProgress.upgrades.chin * 2,
      level: playerProgress.upgrades.chin,
      maxLevel: 10
    },
    {
      name: 'Health',
      description: 'Maximum health',
      cost: 1 + playerProgress.upgrades.health * 2,
      level: playerProgress.upgrades.health,
      maxLevel: 10
    }
  ];

  const handleUpgrade = (upgradeName: string) => {
    const upgrade = upgrades.find(u => u.name.toLowerCase() === upgradeName.toLowerCase());
    if (upgrade && playerProgress.money >= upgrade.cost && upgrade.level < upgrade.maxLevel) {
      upgradePlayer(upgradeName.toLowerCase() as any);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-30">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">UPGRADES</h2>
        
        <div className="text-white mb-6 text-center">
          <div className="text-xl font-bold text-green-400">Money: ${playerProgress.money}</div>
        </div>

        <div className="space-y-4 mb-6">
          {upgrades.map((upgrade) => (
            <div key={upgrade.name} className="bg-gray-700 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-bold">{upgrade.name}</h3>
                <div className="text-yellow-400">
                  Level {upgrade.level}/{upgrade.maxLevel}
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-3">{upgrade.description}</p>
              
              <div className="flex justify-between items-center">
                <div className="text-green-400 font-bold">
                  Cost: ${upgrade.cost}
                </div>
                <button
                  onClick={() => handleUpgrade(upgrade.name)}
                  disabled={
                    playerProgress.money < upgrade.cost || 
                    upgrade.level >= upgrade.maxLevel
                  }
                  className={`px-4 py-2 rounded font-bold ${
                    playerProgress.money >= upgrade.cost && upgrade.level < upgrade.maxLevel
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {upgrade.level >= upgrade.maxLevel ? 'MAX' : 'UPGRADE'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default UpgradesMenu;
