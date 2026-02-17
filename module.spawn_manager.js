var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleRepairer = require('role.repairer');
var roleWallRepairer = require('role.wallRepairer');
var roleRampartRepairer = require('role.rampartRepairer');
var roleLongDistanceHarvester = require('role.longDistanceHarvester');
var roleLongDistanceRepairer = require('role.longDistanceRepairer');
var roleLongDistanceBuilder = require('role.longDistanceBuilder');
var roleLongDistanceUpgrader = require('role.longDistanceUpgrader');
var roleLongDistanceAttacker = require('role.longDistanceAttacker');
var roleClaimer = require('role.claimer');
var config = require('config');

module.exports = {
    getTargetPopulation: function (room) {
        var roomConfig = config.rooms[room.name];
        var population = {};

        if (roomConfig && roomConfig.population) {
            population = _.clone(roomConfig.population);
        } else {
            // DYNAMIC POPULATION LOGIC
            // 1. Harvesters: Based on sources (approx 2 per source)
            var sources = room.find(FIND_SOURCES);
            population.harvester = sources.length * 2;

            // 2. Upgraders: Based on Energy Status
            // If storage is full, pump upgraders
            if (room.storage && room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 100000) {
                population.upgrader = 3;
            } else if (room.energyAvailable == room.energyCapacityAvailable) {
                population.upgrader = 2;
            } else {
                population.upgrader = 1;
            }

            // 3. Builders: Based on Construction Sites
            var sites = room.find(FIND_CONSTRUCTION_SITES);
            if (sites.length > 10) {
                population.builder = 3;
            } else if (sites.length > 0) {
                population.builder = 2;
            } else {
                population.builder = 0; // No sites, no builders (Upgraders can do small jobs if needed, or keep 1)
            }

            // 4. Repairs: Keep minimum
            population.repairer = 1;
            population.wallRepairer = 1;
            population.rampartRepairer = 0;

            // Override with strict defaults if panic
            if (population.harvester < 2) population.harvester = 2;
        }
        return population;
    },

    run: function (spawn) {
        var roomConfig = config.rooms[spawn.room.name];
        var energy = spawn.room.energyCapacityAvailable;
        var creeps = Game.creeps;

        // 1. Emergency Spawn Check
        var harvesters = _.filter(creeps, (c) => c.memory.role == 'harvester' && c.room.name == spawn.room.name);
        if (harvesters.length == 0) {
            if (spawn.createCustomCreep(spawn.room.energyAvailable, 'harvester') == OK) {
                console.log(spawn.name + " spawned EMERGENCY harvester");
                return;
            }
        }

        // 2. Normal Room Population
        var population = this.getTargetPopulation(spawn.room);

        if (roomConfig || true) { // Always run dynamic if config missing
            for (let role of ['harvester', 'upgrader', 'builder', 'repairer', 'wallRepairer', 'rampartRepairer']) {
                var count = _.sum(creeps, (c) => c.memory.role == role && c.room.name == spawn.room.name);
                var target = population[role] || 0;

                if (count < target) {
                    // 2.1 Recovery Logic
                    // If we are critical on harvesters (less than 2), Spawn what we can afford immediately!
                    // Don't wait for extensions to fill if we are struggling.
                    var spawnEnergy = energy;
                    if (role == 'harvester' && count < 2) {
                        spawnEnergy = spawn.room.energyAvailable;
                        // Ensure we don't spawn absolute garbage if we have a bit of buffer
                        // But checking against 200 (min cost) is handled in createCustomCreep logic or returns error
                    }

                    var result = spawn.createCustomCreep(spawnEnergy, role);
                    if (typeof result === 'string') {
                        console.log(spawn.name + " spawning " + role + " (Dynamic Target: " + target + ") [Energy: " + spawnEnergy + "/" + energy + "]");
                        return;
                    } else if (role == 'harvester' && count < 2) {
                        // Log reason for failure only for critical recovery
                        if (Game.time % 10 === 0) {
                            console.log(spawn.name + " waiting for energy to recovery spawn Harvester. Energy: " + spawnEnergy + " / Required: ~200. Error Code: " + result);
                        }
                    }
                }
            }
        }

        // 2.5 Mineral Miner (Check for Extractor & RCL 6)
        // We need to use the calculated population object, NOT roomConfig directly
        // because roomConfig might be undefined or missing dynamic values
        var targetMineralMiner = 0;
        if (population && population.mineralMiner) {
            targetMineralMiner = population.mineralMiner;
        } else if (roomConfig && roomConfig.population && roomConfig.population.mineralMiner) {
            targetMineralMiner = roomConfig.population.mineralMiner;
        }

        if (targetMineralMiner > 0) {
            // Check RCL
            if (spawn.room.controller.level >= 6) {
                // Check Extractor
                var extractors = spawn.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_EXTRACTOR
                });

                if (extractors.length > 0) {
                    var count = _.sum(creeps, (c) => c.memory.role == 'mineralMiner' && c.room.name == spawn.room.name);

                    if (count < targetMineralMiner) {
                        if (spawn.createCustomCreep(energy, 'mineralMiner') == OK) {
                            console.log(spawn.name + " spawning mineralMiner (Dynamic Target: " + targetMineralMiner + ")");
                            return;
                        }
                    }
                }
            }
        }

        // 3. Long Distance Spawning (Dynamic)
        // Check config.js for longDistance settings, but allow intelligent overrides
        for (let targetRoom in config.longDistance) {
            let ldConfig = config.longDistance[targetRoom];
            if (!ldConfig.enable) continue; // Skip if disabled

            // Check visibility of target room (if we have a creep there)
            let roomVisible = Game.rooms[targetRoom];

            // --- 3.1 Builders: Dynamic based on Construction Sites ---
            var builderTarget = 0;
            if (roomVisible) {
                var sites = roomVisible.find(FIND_CONSTRUCTION_SITES);
                if (sites.length > 5) builderTarget = 3;
                else if (sites.length > 0) builderTarget = 2;

                // If room is ours and has spawn, let it build itself
                if (roomVisible.controller && roomVisible.controller.my && roomVisible.find(FIND_MY_SPAWNS).length > 0) {
                    builderTarget = 0;
                }
            } else {
                // If no visibility, send 1 scout/builder to check/build initial structures
                builderTarget = 1;
            }

            if (builderTarget > 0) {
                let count = _.sum(creeps, (c) => c.memory.role == 'longDistanceBuilder' && c.memory.target == targetRoom);
                if (count < builderTarget) {
                    if (spawn.createLongDistanceBuilder(energy, 3, spawn.room.name, targetRoom, 0) == OK) {
                        console.log(spawn.name + " spawning LDB for " + targetRoom + " (Dynamic: " + builderTarget + ")");
                        return;
                    }
                }
            }

            // --- 3.2 Harvesters: Dynamic Scavenging ---
            // Only send if we need energy and target room has sources
            var harvesterTarget = 0;
            // Basic logic: Send 2 if we don't have visibility (scout/harvest) or if we see sources
            if (!roomVisible) {
                harvesterTarget = 1;
            } else {
                var sources = roomVisible.find(FIND_SOURCES);
                harvesterTarget = sources.length; // 1 per source initially
            }

            if (harvesterTarget > 0) {
                let count = _.sum(creeps, (c) => c.memory.role == 'longDistanceHarvester' && c.memory.target == targetRoom);
                if (count < harvesterTarget) {
                    if (spawn.createLongDistanceHarvester(energy, 3, spawn.room.name, targetRoom, 0) == OK) {
                        console.log(spawn.name + " spawning LDH for " + targetRoom + " (Dynamic: " + harvesterTarget + ")");
                        return;
                    }
                }
            }

            // --- 3.3 Claimers: Dynamic Claiming ---
            var claimerTarget = 0;
            // Only claim if GCL allows and not already claimed
            var ownedRooms = _.sum(Game.rooms, r => r.controller && r.controller.my);
            if (Game.gcl.level > ownedRooms) {
                if (!roomVisible || (roomVisible.controller && !roomVisible.controller.my)) {
                    claimerTarget = 1;
                }
            }

            if (claimerTarget > 0) {
                let count = _.sum(creeps, (c) => c.memory.role == 'claimer' && c.memory.target == targetRoom);
                if (count < claimerTarget) {
                    if (spawn.createClaimer(targetRoom) == OK) {
                        console.log(spawn.name + " spawning Claimer for " + targetRoom);
                        return;
                    }
                }
            }
        }

        // 4. Auto-Recycle (Upgrade Population)
        // Only consider if:
        // - Spawn is idle
        // - Room is fully charged (Energy == EnergyCapacity)
        // - We have at least RCL 2 (Capacity > 300) to ensure upgrades are meaningful
        if (!spawn.spawning && spawn.room.energyAvailable === spawn.room.energyCapacityAvailable && spawn.room.energyCapacityAvailable > 300) {

            // Check only every 10 ticks to save CPU
            if (Game.time % 10 !== 0) return;

            for (let role of ['harvester', 'upgrader', 'builder', 'repairer', 'wallRepairer']) {
                // Get all creeps of this role in this room
                var creepsOfRole = _.filter(creeps, (c) => c.memory.role == role && c.room.name == spawn.room.name);

                // Only recycle if we have met the target population (don't reduce numbers below target)
                // And ensure we have at least 2 creeps so we don't wipe out the workforce
                if (roomConfig && creepsOfRole.length >= roomConfig.population[role] && creepsOfRole.length > 1) {

                    // Find the weakest creep
                    var weakestCreep = _.min(creepsOfRole, (c) => {
                        // Calculate body cost
                        return _.sum(c.body, (p) => BODYPART_COST[p.type]);
                    });

                    // Calculate stats
                    var weakestCost = _.sum(weakestCreep.body, (p) => BODYPART_COST[p.type]);
                    var maxPotential = spawn.room.energyCapacityAvailable;

                    // Threshold: If weakest is < 60% of potential, recycle it to make room for a big one
                    // Harvesters might be okay with smaller bodies if we have enough linkage, 
                    // but generally bigger is better for CPU usage.
                    if (weakestCost < maxPotential * 0.6) {
                        console.log("♻️ Auto-Recycle: Marking " + weakestCreep.name + " (" + role + ") for upgrade. Cost: " + weakestCost + "/" + maxPotential);
                        weakestCreep.memory.recycling = true;
                        return; // Only recycle one at a time per room
                    }
                }
            }
        }
    }
};
