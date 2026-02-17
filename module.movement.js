module.exports = {
    move: function (creep, target, color) {
        if (!color) color = '#ffffff';

        // 0. Fatigue Check
        if (creep.fatigue > 0) return;

        // 1. Stuck Tracking
        if (!creep.memory.lastPos) creep.memory.lastPos = { x: creep.pos.x, y: creep.pos.y };

        let isStuck = (creep.pos.x === creep.memory.lastPos.x && creep.pos.y === creep.memory.lastPos.y);

        if (isStuck) {
            creep.memory.stuckCount = (creep.memory.stuckCount || 0) + 1;
        } else {
            creep.memory.stuckCount = 0;
            creep.memory.lastPos = { x: creep.pos.x, y: creep.pos.y };
        }

        // 2. Detour Logic (Commitment Strategy)
        // If we decided to detour, STICK to it for 'detourTicks' amount of time.
        // Don't flip-flop between "Direct Path" and "Detour Path".

        if (creep.memory.detourTicks > 0) {
            creep.memory.detourTicks--;
            creep.say('🛡️ ' + creep.memory.detourTicks);

            // While detouring, we MUST enable ignoreCreeps: false to force pathfinding around obstacles
            // And use high reusePath to prevent re-calculation back to the "blocked" short path.
            let ret = creep.moveTo(target, {
                visualizePathStyle: { stroke: 'red', lineStyle: 'dashed' },
                reusePath: 15,     // Stick to this path!
                ignoreCreeps: false, // Treat creeps as walls
                costCallback: function (roomName, costMatrix) {
                    // Optional: Make other creeps extra expensive to absolutely force going around
                    // But ignoreCreeps: false usually handles this.
                }
            });

            // If we are stuck EVEN WHILE detouring (e.g. tunnel with no way around),
            // Then we must Jitter.
            if (isStuck && creep.memory.stuckCount > 2) {
                creep.say('🤪 Chaos');
                creep.move(1 + Math.floor(Math.random() * 8));
                // Reset detour slightly to allow re-eval after chaos
                // But keep it active so we don't immediately go back to main path
            }
            return;
        }

        // 3. Trigger Detour Mode
        if (creep.memory.stuckCount >= 3) {
            creep.say('🛡️ Plan B');
            creep.memory.detourTicks = 20; // Commit to detour logic for 20 ticks
            delete creep.memory._move;     // Force NEW path calculation immediately

            // Execute first step of detour immediately
            creep.moveTo(target, {
                visualizePathStyle: { stroke: 'red', lineStyle: 'dashed' },
                reusePath: 15,
                ignoreCreeps: false
            });
            return;
        }

        // 4. Default Move (Optimistic)
        // Normal movement ignores creeps (assumes they will move), low reuse to adapt.
        creep.moveTo(target, {
            visualizePathStyle: { stroke: color },
            reusePath: 10,
            ignoreCreeps: true
        });
    },

    // Standard yield logic (unchanged)
    yieldSpot: function (creep) {
        var nearbySource = creep.pos.findInRange(FIND_SOURCES, 1)[0];
        if (nearbySource) {
            var fleeDir = nearbySource.pos.getDirectionTo(creep);
            var bestDir = 0;
            var offsets = [0, 1, -1, 2, -2, 3, -3, 4];
            var dx = [0, 0, 1, 1, 1, 0, -1, -1, -1];
            var dy = [0, -1, -1, 0, 1, 1, 1, 0, -1];

            for (let offset of offsets) {
                let tryDir = fleeDir + offset;
                if (tryDir > 8) tryDir -= 8;
                if (tryDir < 1) tryDir += 8;

                let targetX = creep.pos.x + dx[tryDir];
                let targetY = creep.pos.y + dy[tryDir];

                if (targetX < 0 || targetX > 49 || targetY < 0 || targetY > 49) continue;

                let terrain = creep.room.getTerrain().get(targetX, targetY);
                if (terrain === TERRAIN_MASK_WALL) continue;
                let structures = creep.room.lookForAt(LOOK_STRUCTURES, targetX, targetY);
                let blocked = false;
                for (let s of structures) {
                    if (s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_RAMPART) {
                        blocked = true; break;
                    }
                }
                if (blocked) continue;
                let creeps = creep.room.lookForAt(LOOK_CREEPS, targetX, targetY);
                if (creeps.length > 0) continue;
                bestDir = tryDir;
                break;
            }

            if (bestDir > 0) {
                creep.move(bestDir);
                creep.say('🏃 yield');
            }
        }
    }
};
