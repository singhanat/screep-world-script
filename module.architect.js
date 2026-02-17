var config = require('config');

module.exports = {
    run: function (spawn) {
        if (!config.autoBuild) return;

        // Check if we should run architect this tick
        if (Game.time % config.autoBuild.frequency !== 0) return;

        // 1. Auto Roads
        if (config.autoBuild.roads) {
            this.planRoads(spawn.room, spawn.pos);
        }

        // 2. Auto Extensions (Checkerboard Pattern)
        if (config.autoBuild.extensions) {
            // Find optimal position for extensions (checkerboard)
            this.planAuto(spawn.room, spawn.pos, STRUCTURE_EXTENSION, 2, 10, true);
        }

        // 3. Auto Towers (Defense)
        if (spawn.room.controller.level >= 3) {
            this.planAuto(spawn.room, spawn.pos, STRUCTURE_TOWER, 3, 5, false);
        }

        // 4. Auto Containers (Mining)
        if (spawn.room.controller.level >= 2) {
            this.planContainers(spawn.room);
        }

        // 5. Auto Storage (RCL 4)
        if (spawn.room.controller.level >= 4) {
            this.planStorage(spawn.room, spawn.pos);
        }

        // 6. Base Hardening (Ramparts)
        this.planDefense(spawn.room);
    },

    planRoads: function (room, centerPos) {
        var targets = room.find(FIND_SOURCES);
        if (room.controller) {
            targets.push(room.controller);
        }

        for (let target of targets) {
            var path = room.findPath(centerPos, target.pos, {
                ignoreCreeps: true,
                swampCost: 2,
                range: 1
            });

            for (let point of path) {
                room.createConstructionSite(point.x, point.y, STRUCTURE_ROAD);
            }
        }
    },

    planContainers: function (room) {
        var sources = room.find(FIND_SOURCES);
        for (let source of sources) {
            var adjacent = room.lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
            for (let spot of adjacent) {
                if (spot.terrain != 'wall') {
                    var structures = room.lookForAt(LOOK_STRUCTURES, spot.x, spot.y);
                    // Check if container already exists or site exists
                    var hasContainer = _.some(structures, (s) => s.structureType == STRUCTURE_CONTAINER);
                    var sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, spot.x, spot.y);

                    if (!hasContainer && sites.length == 0) {
                        room.createConstructionSite(spot.x, spot.y, STRUCTURE_CONTAINER);
                        break; // One per source is enough usually
                    }
                }
            }
        }
    },

    planStorage: function (room, centerPos) {
        // Try to place storage near the spawn (but not ON it)
        // Spiral out from center
        if (room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_STORAGE } }).length > 0) return;

        for (let x = centerPos.x - 2; x <= centerPos.x + 2; x++) {
            for (let y = centerPos.y - 2; y <= centerPos.y + 2; y++) {
                // Must be buildable
                if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

                // Must be empty
                if (room.lookForAt(LOOK_STRUCTURES, x, y).length > 0) continue;
                if (room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) continue;

                room.createConstructionSite(x, y, STRUCTURE_STORAGE);
                return;
            }
        }
    },

    planDefense: function (room) {
        // Simple Defense: Put Ramparts over critical structures
        // This is safer than building walls which might block paths
        var targets = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_SPAWN ||
                s.structureType == STRUCTURE_STORAGE ||
                s.structureType == STRUCTURE_TOWER ||
                s.structureType == STRUCTURE_CONTROLLER
        });

        for (let target of targets) {
            // Check if rampart already exists
            var structures = target.pos.lookFor(LOOK_STRUCTURES);
            var hasRampart = _.some(structures, (s) => s.structureType == STRUCTURE_RAMPART);

            if (!hasRampart) {
                room.createConstructionSite(target.pos, STRUCTURE_RAMPART);
            }
        }
    },

    planAuto: function (room, centerPos, structureType, minRange, maxRange, useCheckerboard) {
        // Calculate max allowed
        var maxCount = CONTROLLER_STRUCTURES[structureType][room.controller.level];
        if (!maxCount) return; // Not available at this RCL

        var currentCount = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: structureType }
        }).length;

        var plannedCount = room.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: { structureType: structureType }
        }).length;

        if (currentCount + plannedCount >= maxCount) return;

        // Spiral search
        for (let range = minRange; range <= maxRange; range++) {
            for (let x = centerPos.x - range; x <= centerPos.x + range; x++) {
                for (let y = centerPos.y - range; y <= centerPos.y + range; y++) {

                    if (x < 2 || x > 48 || y < 2 || y > 48) continue;

                    // Simple checkerboard: (x + y) % 2 === 0
                    if (useCheckerboard && (x + y) % 2 !== 0) continue;

                    var terrain = room.getTerrain().get(x, y);
                    if (terrain === TERRAIN_MASK_WALL) continue;

                    var structures = room.lookForAt(LOOK_STRUCTURES, x, y);
                    if (structures.length > 0) continue;

                    var sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
                    if (sites.length > 0) continue;

                    var result = room.createConstructionSite(x, y, structureType);
                    if (result === OK) {
                        console.log("Planning " + structureType + " at: " + x + "," + y);
                        return; // One at a time
                    }
                }
            }
        }
    }
};
