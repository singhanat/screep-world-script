module.exports = {
    // a function to run the logic for this role
    run: function (creep) {
        // if creep is bringing energy to the controller but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to transfer energy to the controller
        if (creep.memory.working == true) {

            // --- SCAVENGER MODE START ---
            // If full and in neighbor room, return HOME
            if (creep.room.name == 'W45N9') {
                creep.say('🏠 Home');
                creep.moveTo(new RoomPosition(25, 25, 'W44N9'), { visualizePathStyle: { stroke: '#ffffff' } });
                return;
            }
            // --- SCAVENGER MODE END ---

            // instead of upgraderController we could also use:
            // if (creep.transfer(creep.room.controller, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

            // try to upgrade the controller
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                // if not in range, move towards the controller
                creep.moveTo(creep.room.controller);
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
            if (!source && creep.room.name == 'W44N9') {
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