var roleBuilder = require('role.builder');

module.exports = {

    // a function to run the logic for this role
    run: function (creep) {
        // if creep is bringing energy to a structure but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to transfer energy to a structure
        if (creep.memory.working == true) {
            // if in home room
            if (creep.room.name == creep.memory.home) {
                roleBuilder.run(creep)
            }
            // if not in home room...
            else {
                // find exit to home room
                var exit = creep.room.findExitTo(creep.memory.home);
                // and move to exit
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
        }
        // if creep is supposed to harvest energy from source
        else {
            // if in target room
            if (creep.room.name == creep.memory.target) {
                // border check: if on exit, move into room
                if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                    creep.moveTo(25, 25);
                    return;
                }

                // find source
                var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                //var source = creep.room.find(FIND_SOURCES)[creep.memory.sourceIndex];

                // try to harvest energy, if the source is not in range
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    // move towards the source
                    creep.moveTo(source);
                }
            }
            // if not in target room
            else {
                // border check: if on exit, move into room
                if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                    creep.moveTo(25, 25);
                    return;
                }

                // move to target room
                creep.moveTo(new RoomPosition(25, 25, creep.memory.target), { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
};