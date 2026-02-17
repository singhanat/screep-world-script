// Load modules
require('prototype.spawn')();
var config = require('config');
var cleanup = require('module.cleanup');
var towers = require('module.towers');
var spawnManager = require('module.spawn_manager');
var architect = require('module.architect');
var planner = require('module.planner');
var dashboard = require('module.dashboard');

// Load roles
var roles = {
    harvester: require('role.harvester'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder'),
    repairer: require('role.repairer'),
    wallRepairer: require('role.wallRepairer'),
    rampartRepairer: require('role.rampartRepairer'),
    longDistanceHarvester: require('role.longDistanceHarvester'),
    longDistanceRepairer: require('role.longDistanceRepairer'),
    longDistanceBuilder: require('role.longDistanceBuilder'),
    longDistanceUpgrader: require('role.longDistanceUpgrader'),
    longDistanceAttacker: require('role.longDistanceAttacker'),
    claimer: require('role.claimer'),
    mineralMiner: require('role.mineralMiner'),
    defender: require('role.defender')
};

module.exports.loop = function () {
    // 1. Memory Cleanup
    cleanup.run();

    // 2. Run Creeps
    for (let name in Game.creeps) {
        var creep = Game.creeps[name];
        // Recycle Logic (Self-Destruct for Upgrade)
        if (creep.memory.recycling) {
            var spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
            if (spawn) {
                if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ff0000' } });
                    creep.say('♻️ bye');
                }
            } else {
                // If no spawn reachable, just suicide to free up slot
                creep.suicide();
            }
            continue; // Skip normal role
        }

        if (creep.memory.role && roles[creep.memory.role]) {
            try {
                roles[creep.memory.role].run(creep);
            } catch (e) {
                console.log('Error running role ' + creep.memory.role + ' for creep ' + name + ':', e);
            }
        }
    }

    // 3. Run Rooms (Towers & Spawns)
    for (let roomName in Game.rooms) {
        var room = Game.rooms[roomName];

        // Run Towers
        towers.run(room);

        // Run Defense (Safe Mode Check)
        require('module.defense').run(room);

        // Draw Dashboard
        try {
            dashboard.draw(room);
        } catch (e) {
            console.log('Dashboard Error:', e);
        }

        // Run Planner (Auto-Spawn Placement)
        try {
            planner.run(room);
        } catch (e) {
            console.log('Planner Error:', e);
        }

        // Run Spawns
        var spawns = room.find(FIND_MY_SPAWNS);
        for (let spawn of spawns) {
            spawnManager.run(spawn);

            // Run Architect (Auto-Build)
            architect.run(spawn);

            // Visuals
            if (spawn.spawning) {
                var spawningCreep = Game.creeps[spawn.spawning.name];
                room.visual.text(
                    '🛠️' + spawningCreep.memory.role,
                    spawn.pos.x + 1,
                    spawn.pos.y,
                    { align: 'left', opacity: 0.8 });
            }
        }
    }

    var pixelFarmer = require('module.pixel_farmer');

    // ... (existing code)

    // Optional: Visual Dashboard
    // Can be added here to show creep counts on screen
    if (Game.time % 10 === 0) {
        console.log('--- Status Report ---');
        console.log('Bucket: ' + Game.cpu.bucket);
    }

    // 4. Pixel Farming (End of Tick)
    try {
        if (Game.cpu.generatePixel) { // Check if function exists (Official Server only)
            pixelFarmer.run();
        }
    } catch (e) {
        console.log('Pixel Farm Error:', e);
    }
};