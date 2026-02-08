module.exports = {
    // Global configuration
    LOG_LEVEL: 1, // 0: None, 1: Info, 2: Debug

    // Room specific configurations
    rooms: {
        'W44N9': {
            // Desired population for this room
            population: {
                harvester: 4,
                upgrader: 1,
                builder: 1,
                repairer: 1,
                wallRepairer: 2,
                rampartRepairer: 0
            },
            // Structures to maintain
            walls: 100000,
            ramparts: 100000
        }
        // Add other rooms here as you expand
    },
    // Long Distance Roles Configuration
    // Set these when you are ready to expand to neighboring rooms!
    longDistance: {
        /*
        // Example: Target Room Name
        'W44N8': {
            harvesters: { count: 2, home: 'W44N9', sourceIndex: 0, workParts: 2 }, // sourceIndex: 0 or 1
            repairers: { count: 1, home: 'W44N9', sourceIndex: 0, workParts: 4 },
            upgraders: { count: 0, home: 'W44N9', sourceIndex: 0, workParts: 4 },
            attackers: { count: 0, home: 'W44N9' }
        },
        */
    },

    // Auto-spawn configurations based on room level (Controller Level) can be added here
    autoSpawn: {
        enabled: true,
        // Define priority of roles
        priority: [
            'harvester',
            'repairer',
            'upgrader',
            'builder',
            'wallRepairer',
            'rampartRepairer',
            'longDistanceHarvester',
            'longDistanceBuilder',
            'longDistanceRepairer',
            'longDistanceUpgrader',
            'longDistanceAttacker',
            'claimer'
        ]
    },

    // Architect Configuration (Auto-Build)
    autoBuild: {
        roads: true,      // Automatically build roads to sources and controller
        extensions: true,  // Automatically build extensions around spawn
        frequency: 100    // check every N ticks (save CPU)
    }
};
