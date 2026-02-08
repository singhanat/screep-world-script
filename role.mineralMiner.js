module.exports = {
    run: function (creep) {
        // State switching
        if (creep.memory.working && _.sum(creep.store) == 0) {
            creep.memory.working = false;
            creep.say('⛏️ mining');
        }
        if (!creep.memory.working && _.sum(creep.store) == creep.store.getCapacity()) {
            creep.memory.working = true;
            creep.say('🚚 deliver');
        }

        if (creep.memory.working) {
            // Deliver to Storage or Terminal
            var storage = creep.room.storage;
            var terminal = creep.room.terminal;

            var target = storage || terminal;

            if (target) {
                // Loop through all carried resources (minerals)
                for (const resourceType in creep.store) {
                    if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        return;
                    }
                }
            } else {
                // If no storage (unlikely at RCL6), just wait
                creep.say('No Storage!');
            }
        }
        else {
            // Find Mineral
            var mineral = creep.room.find(FIND_MINERALS)[0];

            // Look for Extractor
            var extractor = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_EXTRACTOR
            });

            if (mineral) {
                // Must handle harvest errors specifically for minerals
                let result = creep.harvest(mineral);

                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(mineral, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else if (result == ERR_NOT_FOUND || result == ERR_NOT_ENOUGH_RESOURCES) {
                    // Mining dry or no extractor logic usually handled by spawn manager preventing spawn
                    // But if here, maybe mineral is empty (regenerating)
                    creep.say('Empty');
                } else if (result == OK) {
                    // All good
                }
            }
        }
    }
};
