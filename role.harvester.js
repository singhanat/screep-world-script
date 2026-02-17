var movement = require('module.movement');

module.exports = {
    // a function to run the logic for this role
    run: function (creep) {
        // 1. Check State
        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
            creep.say('⚡ transfer');
        }

        // 2. Work (Transfer)
        if (creep.memory.working == true) {

            // --- SCAVENGER MODE START ---
            // If full and in neighbor room, return HOME
            if (creep.room.name == 'W45N9') {
                creep.say('🏠 Home');
                movement.move(creep, new RoomPosition(25, 25, 'W44N9'), '#ffffff');
                return;
            }
            // --- SCAVENGER MODE END ---

            // Find closest spawn, extension or tower which is not full
            var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_SPAWN
                    || s.structureType == STRUCTURE_EXTENSION
                    || s.structureType == STRUCTURE_TOWER)
                    && s.energy < s.energyCapacity
            });

            // If found, transfer
            if (structure != undefined) {
                var transferResult = creep.transfer(structure, RESOURCE_ENERGY);
                if (transferResult == ERR_NOT_IN_RANGE) {
                    movement.move(creep, structure, '#ffffff');
                }
                else if (transferResult == OK) {
                    // Yield logic: If blocking source (range 1), move to a free spot
                    movement.yieldSpot(creep);
                }
            }
            // If full, try storage
            else {
                var storage = creep.room.storage;
                if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        movement.move(creep, storage, '#ffffff');
                    }
                }
                // If no storage or full, Upgrade Controller (Fallback)
                else {
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        movement.move(creep, creep.room.controller, '#ffaa00');
                    }
                }
            }
        }
        // 3. Gather (Harvest)
        else {
            // Priority: Dropped Resources > Container > Source

            var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

            // If path blocked or no path found, find closest by range
            if (!source) {
                source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
            }

            // --- SCAVENGER MODE START ---
            // If no active source in Home Room, go to Neighbor
            if (!source && creep.room.name == 'W44N9') {
                creep.say('🏃 Scavenge');
                movement.move(creep, new RoomPosition(25, 25, 'W45N9'), '#ffaa00');
                return;
            }
            // --- SCAVENGER MODE END ---

            // If still no active source (all empty), find *any* source to wait at
            if (!source) {
                source = creep.pos.findClosestByRange(FIND_SOURCES);
            }

            if (source) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    movement.move(creep, source, '#ffaa00');
                } else if (creep.harvest(source) == ERR_NOT_ENOUGH_RESOURCES) {
                    creep.say('Waiting...');
                }
            } else {
                creep.say('No Source');
            }
        }
    }
};