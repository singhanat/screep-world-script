var config = require('config');

module.exports = {
    run: function (room) {
        var towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });

        for (let tower of towers) {
            // 1. Attack Hostiles
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                tower.attack(closestHostile);
                continue; // Skip repair if attacking
            }

            // 2. Heal Creeps (Optional, but could be useful)
            // var closestDamagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
            //     filter: (c) => c.hits < c.hitsMax
            // });
            // if (closestDamagedCreep) {
            //     tower.heal(closestDamagedCreep);
            //     continue;
            // }

            // 3. Repair Structures
            var damagedStructures = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    if (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) {
                        var targetParams = config.rooms[room.name];
                        var wallTarget = (targetParams && targetParams.walls) ? targetParams.walls : 10000;
                        return structure.hits < wallTarget;
                    }
                    return structure.hits < structure.hitsMax;
                }
            });

            // Prioritize non-walls/ramparts first unless walls are critically low
            damagedStructures.sort((a, b) => {
                if (a.structureType != STRUCTURE_WALL && a.structureType != STRUCTURE_RAMPART) return -1;
                if (b.structureType != STRUCTURE_WALL && b.structureType != STRUCTURE_RAMPART) return 1;
                return a.hits - b.hits;
            });

            if (damagedStructures.length > 0) {
                tower.repair(damagedStructures[0]);
            }
        }
    }
};
