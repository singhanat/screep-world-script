var roleHarvester = require('role.harvester');

module.exports = {
    // Returns true if the creep's role was overridden
    hijack: function (creep) {
        // Only trigger if no harvesters exist in the room
        var harvesters = _.filter(Game.creeps, (c) => c.memory.role == 'harvester' && c.room.name == creep.room.name);

        if (harvesters.length == 0) {
            // Check if we actually need energy in spawn/extensions
            if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
                // Visual indicator that this creep is in emergency mode
                creep.room.visual.text("🚑", creep.pos.x, creep.pos.y + 0.5, { align: 'center', opacity: 0.8 });

                // Behave like a harvester
                roleHarvester.run(creep);
                return true;
            }
        }
        return false;
    }
};
