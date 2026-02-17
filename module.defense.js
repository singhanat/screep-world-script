module.exports = {
    run: function (room) {
        var hostiles = room.find(FIND_HOSTILE_CREEPS);

        if (hostiles.length > 0) {
            // activate Safe Mode if critical structures are in immediate danger
            // 1. Check Spawns
            var spawns = room.find(FIND_MY_SPAWNS);
            for (let spawn of spawns) {
                if (spawn.pos.findInRange(FIND_HOSTILE_CREEPS, 3).length > 0) {
                    if (room.controller.safeMode > 0) return; // Already active
                    if (room.controller.safeModeAvailable > 0 && room.controller.safeModeCooldown == undefined) {
                        room.controller.activateSafeMode();
                        Game.notify("Safe Mode activated in room " + room.name + " due to hostile near spawn!");
                        console.log("DOMAIN: Safe Mode activated in room " + room.name);
                    }
                }
            }

            // 2. Check Controller (only if upgrade blocked or downgrade imminent interaction)
            // But controller is usually not destroyed, just downgraded.
            // Priority is spawn survival.
        }
    }
};
