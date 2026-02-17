var roleDefender = {

    /** @param {Creep} creep **/
    run: function (creep) {
        // 1. Attack Hostiles
        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (target) {
            if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
            }
        }
        else {
            // 2. Idle Position (if no hostiles, maybe go to a flag or Spawn)
            // For now, just recycle or wait at spawn so we don't clutter sources
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                if (creep.pos.getRangeTo(spawn) > 3) {
                    creep.moveTo(spawn);
                }
            }
        }
    }
};

module.exports = roleDefender;
