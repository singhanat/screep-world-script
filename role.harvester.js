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
                creep.moveTo(new RoomPosition(25, 25, 'W44N9'), { visualizePathStyle: { stroke: '#ffffff' } });
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
                    creep.moveTo(structure, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                else if (transferResult == OK) {
                    // Yield logic: If blocking source (range 1), move to a free spot
                    var nearbySource = creep.pos.findInRange(FIND_SOURCES, 1)[0];
                    if (nearbySource) {
                        var fleeDir = nearbySource.pos.getDirectionTo(creep);
                        var bestDir = 0;

                        // Scan directions: Start with "away", then rotate
                        // Offsets: 0 (Directly away), 1/-1 (45 deg), 2/-2 (90 deg)
                        var offsets = [0, 1, -1, 2, -2, 3, -3, 4];

                        // Direction to coord lookup (index 0 is dummy)
                        var dx = [0, 0, 1, 1, 1, 0, -1, -1, -1];
                        var dy = [0, -1, -1, 0, 1, 1, 1, 0, -1];

                        for (let offset of offsets) {
                            let tryDir = fleeDir + offset;
                            if (tryDir > 8) tryDir -= 8;
                            if (tryDir < 1) tryDir += 8;

                            let targetX = creep.pos.x + dx[tryDir];
                            let targetY = creep.pos.y + dy[tryDir];

                            // 1. Check Terrain (Wall)
                            let terrain = creep.room.getTerrain().get(targetX, targetY);
                            if (terrain === TERRAIN_MASK_WALL) continue;

                            // 2. Check Structures (Obstacles)
                            // Note: lookForAt(LOOK_STRUCTURES) does NOT return construction sites, so they are safe.
                            let structures = creep.room.lookForAt(LOOK_STRUCTURES, targetX, targetY);
                            let blocked = false;
                            for (let s of structures) {
                                if (s.structureType !== STRUCTURE_ROAD &&
                                    s.structureType !== STRUCTURE_CONTAINER &&
                                    s.structureType !== STRUCTURE_RAMPART) {
                                    blocked = true; break;
                                }
                            }
                            if (blocked) continue;

                            // 3. Check Creeps (Collision)
                            let creeps = creep.room.lookForAt(LOOK_CREEPS, targetX, targetY);
                            if (creeps.length > 0) continue;

                            // Found valid spot!
                            bestDir = tryDir;
                            break;
                        }

                        if (bestDir > 0) {
                            creep.move(bestDir);
                            creep.say('🏃 yield');
                        } else {
                            creep.say('⛔ stuck');
                        }
                    }
                }
            }
            // If full, try storage
            else {
                var storage = creep.room.storage;
                if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                // If no storage or full, Upgrade Controller (Fallback)
                else {
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffaa00' } });
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
                creep.moveTo(new RoomPosition(25, 25, 'W45N9'), { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }
            // --- SCAVENGER MODE END ---

            // If still no active source (all empty), find *any* source to wait at
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