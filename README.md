# Screeps World Script (Boom) 💥

A sophisticated, automated script for the game [Screeps](https://screeps.com/), designed to manage colony growth, resource gathering, and creep evolution effectively.

## 🌟 Key Features

### 1. 🧠 Intelligent Spawning System
- **Smart Body Building**: Creeps are not just created with fixed bodies. The system dynamically generates the largest possible creep body based on the room's current energy capacity (`prototype.spawn.js`).
    - **Harvesters**: Maximize `WORK` parts for mining speed while maintaining movement speed.
    - **Workers**: Balanced `WORK`/`CARRY`/`MOVE` ratios.
- **Auto-Recycle & Evolution**: The colony automatically upgrades its workforce! When the room is fully saturated with energy and has a stable population, the Spawner identifies the weakest creeps and recycles them to accidentally birth stronger, more efficient versions (`module.spawn_manager.js`).
- **Emergency Recovery**: If population drops critically (e.g., 0 Harvesters), the system enters emergency mode to spawn cheap, essential creeps immediately.

### 2. 🚦 Smart Creep AI
- **Harvester Yielding**: Harvesters are polite! After filling up with energy, if they are blocking an energy source, they will actively scanning their surroundings to step aside (yield) to a free spot, allowing other creeps to access the source (`role.harvester.js`).
- **Robust Pathfinding**: Creeps use a fallback navigation system. If `findClosestByPath` fails (due to blockage), they switch to `findClosestByRange` to blindly move towards their goal to avoid getting stuck in an idle state.
- **Self-Destruct**: Creeps marked for recycling via the Auto-Recycle system will automatically return to spawn and surrender their resources/life to the colony.

### 3. ⚙️ Centralized Configuration
- **`config.js`**: Control the entire colony from one file.
    - Define target population for each role per room.
    - Set up Long Distance Mining/Remote Harvesting operations.
    - Configure Auto-Build layouts (Roads, Containers, Extensions).

---

## 📂 File Structure & Modules

### Core
- **`main.js`**: The heartbeat of the script. Handles memory cleanup, runs creep logic, and executes room-level managers (Towers, Spawns).
- **`config.js`**: Configuration settings for rooms and relationships.

### Managers & Modules
- **`module.spawn_manager.js`**: The brain of the colony. Decides *who* to spawn and *when*. Handles the **Auto-Recycle** logic.
- **`module.towers.js`**: Controls defensive and repair logic for towers.
- **`module.architect.js`**: Automates construction of base structures based on predefined positions in config.
- **`module.cleanup.js`**: Cleans up memory of deceased creeps to save CPU.

### Prototypes
- **`prototype.spawn.js`**: Extends the default Spawn object to add custom methods like `createCustomCreep` (the Smart Body Builder).

### Creep Roles
- **`role.harvester.js`**: Mines energy. Prioritizes filling Spawns/Extensions > Towers > Storage. Upgrades controller if idle. *Includes Yield Logic*.
- **`role.upgrader.js`**: Dedicated to upgrading the Room Controller.
- **`role.builder.js`**: Constructs buildings from Construction Sites.
- **`role.repairer.js`**: Maintains roads and containers.
- **`role.wallRepairer.js`** / **`role.rampartRepairer.js`**: Fortifies defenses.
- **`role.longDistance*.js`**: specialized roles for remote mining and cross-room operations.

---

## 🚀 How it Works

1. **The Loop**: Every game tick, `main.js` clears dead memory.
2. **Role Execution**: It iterates through all creeps and executes their specific `role.*.js` logic.
    - *Debug*: You might see `♻️ bye`, `🏃 yield`, or `⛔ stuck` bubbles above creeps indicating their status.
3. **Spawn Management**:
    - Checks if any role is below the target population defined in `config.js`.
    - If a creep is needed, it calls `createCustomCreep` to build the best possible body.
    - If all roles are full and energy is maxed, it checks for **Weak Creeps**. If a creep is significantly weaker than the room's potential, it marks it for **Recycling**.
4. **Defense**: Towers automatically attack nearest enemies or heal damaged creeps.

## 📝 Configuration

Edit `config.js` to change your colony's goals:

```javascript
module.exports = {
    rooms: {
        'W1N1': { // Your Room Name
            population: {
                harvester: 2,
                upgrader: 4,
                builder: 2,
                // ...
            },
            // ...
        }
    }
    // ...
};
```
