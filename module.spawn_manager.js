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
        if (roomConfig) {
            for (let role of ['harvester', 'upgrader', 'builder', 'repairer', 'wallRepairer', 'rampartRepairer']) {
                var count = _.sum(creeps, (c) => c.memory.role == role && c.room.name == spawn.room.name);
                if (count < roomConfig.population[role]) {
                    if (spawn.createCustomCreep(energy, role) == OK) {
                        console.log(spawn.name + " spawning " + role);
                        return;
                    }
                }
            }
        }

        // 3. Long Distance Spawning (Config Driven)
        // Check config.js for longDistance settings
        for (let targetRoom in config.longDistance) {
            let ldConfig = config.longDistance[targetRoom];

            // Harvesters
            if (ldConfig.harvesters) {
                let count = _.sum(creeps, (c) => c.memory.role == 'longDistanceHarvester' && c.memory.target == targetRoom);
                if (count < ldConfig.harvesters.count) {
                    if (spawn.createLongDistanceHarvester(energy, ldConfig.harvesters.workParts, ldConfig.harvesters.home, targetRoom, ldConfig.harvesters.sourceIndex) == OK) {
                        console.log(spawn.name + " spawning LDH for " + targetRoom);
                        return;
                    }
                }
            }

            // Builders
            if (ldConfig.builders) {
                let count = _.sum(creeps, (c) => c.memory.role == 'longDistanceBuilder' && c.memory.target == targetRoom);
                if (count < ldConfig.builders.count) {
                    if (spawn.createLongDistanceBuilder(energy, ldConfig.builders.workParts, ldConfig.builders.home, targetRoom, 0) == OK) {
                        console.log(spawn.name + " spawning LDB for " + targetRoom);
                        return;
                    }
                }
            }

            // Repairers
            if (ldConfig.repairers) {
                let count = _.sum(creeps, (c) => c.memory.role == 'longDistanceRepairer' && c.memory.target == targetRoom);
                if (count < ldConfig.repairers.count) {
                    if (spawn.createLongDistanceRepairer(energy, ldConfig.repairers.workParts, ldConfig.repairers.home, targetRoom, 0) == OK) {
                        console.log(spawn.name + " spawning LDR for " + targetRoom);
                        return;
                    }
                }
            }

            // Attackers
            if (ldConfig.attackers) {
                let count = _.sum(creeps, (c) => c.memory.role == 'longDistanceAttacker' && c.memory.target == targetRoom);
                if (count < ldConfig.attackers.count) {
                    if (spawn.createLongDistanceAttacker(energy, targetRoom) == OK) {
                        console.log(spawn.name + " spawning LDA for " + targetRoom);
                        return;
                    }
                }
            }
        }


        // 4. Auto-Recycle (Upgrade Population)
        if (!spawn.spawning && spawn.room.energyAvailable === spawn.room.energyCapacityAvailable && spawn.room.energyCapacityAvailable > 300) {

            // Check only every 10 ticks to save CPU
            if (Game.time % 10 !== 0) return;

            for (let role of ['harvester', 'upgrader', 'builder', 'repairer', 'wallRepairer']) {
                var creepsOfRole = _.filter(creeps, (c) => c.memory.role == role && c.room.name == spawn.room.name);

                if (roomConfig && creepsOfRole.length >= roomConfig.population[role] && creepsOfRole.length > 1) {

                    var weakestCreep = _.min(creepsOfRole, (c) => {
                        return _.sum(c.body, (p) => BODYPART_COST[p.type]);
                    });

                    var weakestCost = _.sum(weakestCreep.body, (p) => BODYPART_COST[p.type]);
                    var maxPotential = spawn.room.energyCapacityAvailable;

                    if (weakestCost < maxPotential * 0.6) {
                        console.log("♻️ Auto-Recycle: Marking " + weakestCreep.name + " (" + role + ") for upgrade. Cost: " + weakestCost + "/" + maxPotential);
                        weakestCreep.memory.recycling = true;
                        return;
                    }
                }
            }
        }
    }
};
