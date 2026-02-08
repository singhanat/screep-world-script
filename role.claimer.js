module.exports = {
    // a function to run the logic for this role
    run: function (creep) {
        // if in target room
        if (creep.room.name != creep.memory.target) {
            // border check: if on exit, move into room
            if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                creep.moveTo(25, 25);
                return;
            }

            // move to target room
            creep.moveTo(new RoomPosition(25, 25, creep.memory.target), { visualizePathStyle: { stroke: '#ffffff' } });
        }
        else {
            // try to claim controller
            if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                // move towards the controller
                creep.moveTo(creep.room.controller);
            }
        }
    }
};