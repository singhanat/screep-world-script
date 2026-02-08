var config = require('config');

module.exports = {
    draw: function (room) {
        if (!room.controller) return;

        // Draw Room Info Box
        room.visual.rect(40, 0, 9, 20, {
            fill: '#000000',
            opacity: 0.5,
            stroke: '#ffffff'
        });

        // Room Name & Level
        room.visual.text(room.name + " Lvl " + room.controller.level, 44.5, 1.5, {
            color: '#00ff00',
            font: 0.8
        });

        // Controller Progress
        var progress = (room.controller.progress / room.controller.progressTotal) * 100;
        room.visual.text("Prog: " + progress.toFixed(2) + "%", 44.5, 2.5, {
            color: '#aaaaaa',
            font: 0.6
        });

        // Energy Bar
        var energyPercent = (room.energyAvailable / room.energyCapacityAvailable) * 100;
        room.visual.rect(41, 3.5, 7 * (energyPercent / 100), 0.6, {
            fill: '#ffff00',
            opacity: 0.8
        });
        room.visual.text("Energy: " + room.energyAvailable + "/" + room.energyCapacityAvailable, 44.5, 3.2, {
            color: '#ffffff',
            font: 0.5
        });

        // Creep Roles Count
        var y = 5;
        var roomConfig = config.rooms[room.name];
        var roles = (roomConfig && roomConfig.population) ? roomConfig.population : {};
        for (let role in roles) {
            let current = _.sum(Game.creeps, (c) => c.memory.role == role && c.room.name == room.name);
            let target = roles[role];

            let color = current < target ? '#ff0000' : '#00ff00';
            room.visual.text(role + ": " + current + "/" + target, 41, y, {
                align: 'left',
                color: color,
                font: 0.5
            });
            y += 0.8;
        }

        // --- GCL Display ---
        if (room.controller.level > 0) { // Only draw excessive info on owned rooms
            room.visual.rect(40, 15, 9, 3, {
                fill: '#000000',
                opacity: 0.5,
                stroke: '#ffffff'
            });

            room.visual.text("GCL: " + Game.gcl.level, 44.5, 16.5, {
                color: '#00eebb',
                font: 0.8
            });

            var gclProgress = (Game.gcl.progress / Game.gcl.progressTotal) * 100;
            room.visual.rect(41, 17, 7 * (gclProgress / 100), 0.6, {
                fill: '#00eebb',
                opacity: 0.8
            });
            room.visual.text(gclProgress.toFixed(2) + "%", 44.5, 17.5, {
                color: '#ffffff',
                font: 0.5,
                stroke: '#000000',
                strokeWidth: 0.1
            });
        }

    }
};
