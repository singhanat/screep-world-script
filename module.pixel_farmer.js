const config = require('./config');

module.exports = {
    run: function () {
        const pixelConfig = config.pixelFarm || { enabled: true, minBucket: 10000, minCreeps: 2, logFrequency: 50 };

        if (!pixelConfig.enabled) return;

        // 1. Check Bucket: Must be absolutely full (10,000)
        // Or configured minimum - but typically for pixels we want 10k
        if (Game.cpu.bucket < pixelConfig.minBucket) return;

        // 2. Safety Check: Global Defcon
        // If we are under attack, DO NOT drain the bucket. We need CPU for defense.
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            // Only check my own rooms that have a controller
            if (room.controller && room.controller.my) {
                let hostiles = room.find(FIND_HOSTILE_CREEPS);
                if (hostiles.length > 0) {
                    if (Game.time % pixelConfig.logFrequency === 0) {
                        console.log("⚠️ Pixel Farm Paused: Hostiles detected in " + roomName);
                    }
                    return;
                }

                // Optional: Check if we are recovering (Low population)
                // If creeps are very low, keep bucket for rapid spawning
                if (room.find(FIND_MY_CREEPS).length < pixelConfig.minCreeps) {
                    if (Game.time % pixelConfig.logFrequency === 0) {
                        console.log("⚠️ Pixel Farm Paused: Low population in " + roomName);
                    }
                    return;
                }
            }
        }

        // 3. Generate!
        // This will consume 10,000 CPU (emptying the bucket).
        // Only do this if we are safe.
        var result = Game.cpu.generatePixel();
        if (result === OK) {
            console.log("💎 Pixel Generated! Bucket utilized. 💎");
        }
    }
};
