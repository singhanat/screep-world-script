var roleAttacker = require('role.attacker');

module.exports = {
    
    // a function to run the logic for this role
    run: function(creep) {
      if (creep.room.name == creep.memory.target) {
          roleAttacker.run(creep)
      }
      // if not in home room...
      else {
          // find exit to target room
          var exit = creep.room.findExitTo(creep.memory.target);
          // move to exit
          creep.moveTo(creep.pos.findClosestByRange(exit));
      }
    }
};