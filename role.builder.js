var roleUpgrader = require('role.upgrader');
var emergency = require('module.emergency_override');

module.exports = {
    // a function to run the logic for this role
    run: function (creep) {
        if (emergency.hijack(creep)) return;

        // if target is defined and creep is not in target room
        if (creep.memory.target != undefined && creep.room.name != creep.memory.target) {
            // find exit to target room
            var exit = creep.room.findExitTo(creep.memory.target);
            // move to exit
            creep.moveTo(creep.pos.findClosestByRange(exit));
            // return the function to not do anything else
            return;
        }

        // if creep is trying to complete a constructionSite but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to complete a constructionSite
        if (creep.memory.working == true) {

            // --- SCAVENGER MODE START ---
            // If full and in neighbor room, return HOME
            if (creep.room.name == 'W45N9') {
                creep.say('🏠 Home');
                creep.moveTo(new RoomPosition(25, 25, 'W44N9'), { visualizePathStyle: { stroke: '#ffffff' } });
                return;
            }
            // --- SCAVENGER MODE END ---

            // find closest constructionSite
            var constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            // if one is found
            if (constructionSite != undefined) {
                // try to build, if the constructionSite is not in range
                if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                    // move towards the constructionSite
                    creep.moveTo(constructionSite);
                }
            }
            // if no constructionSite is found
            else {
                // go upgrading the controller
                roleUpgrader.run(creep);
            }
        }
        // if creep is supposed to harvest energy from source
        else {
            var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

            if (!source) {
                source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
            }

            // --- SCAVENGER MODE START ---
            // If no active source in Home Room, go to Neighbor
            // But verify it's not a LongDistanceBuilder who is SUPPOSED to supply target
            if (!source && creep.room.name == 'W44N9' && !creep.memory.target) {
                creep.say('🏃 Scavenge');
                creep.moveTo(new RoomPosition(25, 25, 'W45N9'), { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }
            // --- SCAVENGER MODE END ---

            if (!source) {
                source = creep.pos.findClosestByRange(FIND_SOURCES);
            }

            if (source) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else if (creep.harvest(source) == ERR_NOT_ENOUGH_RESOURCES) {
                    creep.say('Waiting...');
                }
            } else {
                creep.say('No Source');
            }
        }
    }
};