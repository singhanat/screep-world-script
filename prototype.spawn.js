module.exports = function () {
    // create a new function for StructureSpawn
    StructureSpawn.prototype.createCustomCreep =
        function (energy, roleName) {
            // 1. Define Body Part Costs
            // WORK: 100, CARRY: 50, MOVE: 50

            // 2. Prepare Body
            var body = [];

            // 3. Special Logic per Role
            if (roleName === 'harvester') {
                // Harvesters need WORK and CARRY, but also MOVE to not be sluggish
                // Maximize WORK for speed, but keep some CARRY
                var availableEnergy = energy;

                // Essential: 1 WORK, 1 CARRY, 1 MOVE (200 energy)
                if (availableEnergy >= 200) {
                    body.push(WORK, CARRY, MOVE);
                    availableEnergy -= 200;
                }

                // Scale up: Add more WORK parts for faster mining, paired with MOVE
                // Pattern: WORK (100) + MOVE (50) = 150
                var maxWork = 5; // Cap work parts to avoid draining source too fast/wasting CPU
                var currentWork = 1;

                while (availableEnergy >= 150 && currentWork < maxWork) {
                    body.push(WORK, MOVE);
                    availableEnergy -= 150;
                    currentWork++;
                }

                // Add extra CARRY for buffer if energy permits
                while (availableEnergy >= 100) { // CARRY (50) + MOVE (50)
                    body.push(CARRY, MOVE);
                    availableEnergy -= 100;
                }
            }
            else if (roleName === 'upgrader' || roleName === 'builder' || roleName === 'repairer' || roleName === 'wallRepairer') {
                // Workers need balanced WORK/CARRY/MOVE
                // Pattern: WORK (100) + CARRY (50) + MOVE (50) = 200
                var numberOfParts = Math.floor(energy / 200);
                // Cap max size to avoid super slow spawning or overkill
                numberOfParts = Math.min(numberOfParts, 8); // Max 1600 energy creep

                for (let i = 0; i < numberOfParts; i++) {
                    body.push(WORK);
                    body.push(CARRY);
                    body.push(MOVE);
                }
            }
            else {
                // Fallback: Basic Balanced
                var numberOfParts = Math.floor(energy / 200);
                for (let i = 0; i < numberOfParts; i++) {
                    body.push(WORK);
                    body.push(CARRY);
                    body.push(MOVE);
                }
            }

            // create creep with the created body and the given role
            return this.createCreep(body, undefined, { role: roleName, working: false });
        };

    // create a new function for StructureSpawn
    StructureSpawn.prototype.createLongDistanceHarvester =
        function (energy, numberOfWorkParts, home, target, sourceIndex) {
            // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part


            var body = [];
            for (let i = 0; i < numberOfWorkParts; i++) {
                body.push(WORK);
            }

            // 150 = 100 (cost of WORK) + 50 (cost of MOVE)
            energy -= 150 * numberOfWorkParts;

            var numberOfParts = Math.floor(energy / 100);
            for (let i = 0; i < numberOfParts; i++) {
                body.push(CARRY);
            }
            for (let i = 0; i < numberOfParts + numberOfWorkParts; i++) {
                body.push(MOVE);
            }

            // create creep with the created body
            return this.createCreep(body, undefined, {
                role: 'longDistanceHarvester',
                home: home,
                target: target,
                sourceIndex: sourceIndex,
                working: false
            });

        };

    // create a new function for StructureSpawn
    StructureSpawn.prototype.createLongDistanceRepairer =
        function (energy, numberOfWorkParts, home, target, sourceIndex) {
            // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part
            var body = [];
            for (let i = 0; i < numberOfWorkParts; i++) {
                body.push(WORK);
            }

            // 150 = 100 (cost of WORK) + 50 (cost of MOVE)
            energy -= 150 * numberOfWorkParts;

            var numberOfParts = Math.floor(energy / 100);
            for (let i = 0; i < numberOfParts; i++) {
                body.push(CARRY);
            }
            for (let i = 0; i < numberOfParts + numberOfWorkParts; i++) {
                body.push(MOVE);
            }

            // create creep with the created body
            return this.createCreep(body, undefined, {
                role: 'longDistanceRepairer',
                home: home,
                target: target,
                sourceIndex: sourceIndex,
                working: false
            });
        };

    // create a new function for StructureSpawn
    StructureSpawn.prototype.createLongDistanceBuilder =
        function (energy, numberOfWorkParts, home, target, sourceIndex) {
            // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part
            var body = [];
            for (let i = 0; i < numberOfWorkParts; i++) {
                body.push(WORK);
            }

            // 150 = 100 (cost of WORK) + 50 (cost of MOVE)
            energy -= 150 * numberOfWorkParts;

            var numberOfParts = Math.floor(energy / 100);
            for (let i = 0; i < numberOfParts; i++) {
                body.push(CARRY);
            }
            for (let i = 0; i < numberOfParts + numberOfWorkParts; i++) {
                body.push(MOVE);
            }

            // create creep with the created body
            return this.createCreep(body, undefined, {
                role: 'longDistanceBuilder',
                home: home,
                target: target,
                sourceIndex: sourceIndex,
                working: false
            });
        };

    // create a new function for StructureSpawn
    StructureSpawn.prototype.createLongDistanceUpgrader =
        function (energy, numberOfWorkParts, home, target, sourceIndex) {
            // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part
            var body = [];
            for (let i = 0; i < numberOfWorkParts; i++) {
                body.push(WORK);
            }

            // 150 = 100 (cost of WORK) + 50 (cost of MOVE)
            energy -= 150 * numberOfWorkParts;

            var numberOfParts = Math.floor(energy / 100);
            for (let i = 0; i < numberOfParts; i++) {
                body.push(CARRY);
            }
            for (let i = 0; i < numberOfParts + numberOfWorkParts; i++) {
                body.push(MOVE);
            }

            // create creep with the created body
            return this.createCreep(body, undefined, {
                role: 'longDistanceUpgrader',
                home: home,
                target: target,
                sourceIndex: sourceIndex,
                working: false
            });
        };

    // create a new function for StructureSpawn
    StructureSpawn.prototype.createLongDistanceAttacker =
        function (energy, target) {
            // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part
            var body = [];
            for (let i = 0; i < 6; i++) {
                body.push(TOUGH);
            }

            //energy -= 140 * numberOfToughParts;

            //var numberOfParts = Math.floor(energy / 80);
            for (let i = 0; i < 4; i++) {
                body.push(MOVE);
            }
            for (let i = 0; i < 4; i++) {
                body.push(ATTACK);
            }

            // create creep with the created body
            return this.createCreep(body, undefined, {
                role: 'longDistanceAttacker',
                target: target
            });
        };


    // create a new function for StructureSpawn
    StructureSpawn.prototype.createClaimer =
        function (target) {
            return this.createCreep([CLAIM, MOVE], undefined, { role: 'claimer', target: target });
        }
};