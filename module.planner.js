module.exports = {
    run: function (room) {
        // Only run for my rooms (once claimed)
        if (!room.controller || !room.controller.my) return;

        // Only if no spawns and no spawn construction sites
        var spawns = room.find(FIND_MY_SPAWNS);
        var spawnSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (s) => s.structureType == STRUCTURE_SPAWN
        });

        if (spawns.length > 0 || spawnSites.length > 0) return;

        // Find best spot
        var sources = room.find(FIND_SOURCES);
        var controller = room.controller;

        if (sources.length == 0 || !controller) return;

        // Calculate average position (Centroid)
        var x = controller.pos.x;
        var y = controller.pos.y;

        for (let source of sources) {
            x += source.pos.x;
            y += source.pos.y;
        }

        x = Math.round(x / (sources.length + 1));
        y = Math.round(y / (sources.length + 1));

        // Helper to check if spot is valid
        // Ideally we want a spot that isn't a wall and has some space around it
        function isValidSpot(rx, ry) {
            const terrain = room.getTerrain();
            if (terrain.get(rx, ry) === TERRAIN_MASK_WALL) return false;
            // Avoid edges
            if (rx < 2 || rx > 47 || ry < 2 || ry > 47) return false;
            return true;
        }

        // Spiral search for a valid spot starting from centroid
        for (let r = 0; r < 10; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;

                    let checkX = x + dx;
                    let checkY = y + dy;

                    if (isValidSpot(checkX, checkY)) {
                        // Try to create site
                        var code = room.createConstructionSite(checkX, checkY, STRUCTURE_SPAWN);
                        if (code === OK) {
                            console.log("🏗️ Auto-Planner: Placed Spawn at " + checkX + "," + checkY + " in " + room.name);
                            return;
                        }
                    }
                }
            }
        }
    }
};
