class WorldSim {
    constructor(options={}) {
        this.height = options.height || 600;
        this.width = options.width || 800;
        this.life = {};
        this.lifeCounter = 0;
        this.totalLifeCounter = 0;
        this.deadCounter = 0;
        this.framesRendered = 0;
    }

    init() {
        document.getElementById('gameContainer').innerHTML += `<canvas id="gameCanvas" width="${this.width}" height="${this.height}"></canvas>`;
    }

    start(lifeAmt=10) {
        for(let i = 0; i < lifeAmt; i++) {
            this.life[i] = new LifeForm({id: i});
            this.lifeCounter++;
            this.totalLifeCounter++;
        }

        for (const lf of Object.values(this.life)) {
            lf.spawn();
        }

        checkBreedability();

        window.requestAnimationFrame(this.runSimulation.bind(this));
    }

    runSimulation() {

        let ctx = document.getElementById('gameCanvas').getContext('2d');

        // clear and thus set up the canvas to be drawn on
        ctx.clearRect(0, 0, this.width, this.height);

        for(let lifeForm of Object.values(this.life)) {
            lifeForm.simulate();
        }

        this.framesRendered+++;
        
        // recursively call the function that runs the world by requesting an animation frame from the window DOM object
        window.requestAnimationFrame(this.runSimulation.bind(this));
    };
}

class LifeForm {
    constructor(options={}) {
        this.id = options.id;
        this.alive = true;
        this.fitness = options.fitness || Math.random();
        this.color = options.color || '#' + Math.floor(Math.random() * 16777215).toString(16);
        this.x = Math.random() * document.getElementById('gameCanvas').width;
        this.y = Math.random() * document.getElementById('gameCanvas').height;
        this.age = numInRange(0, 12);
        // xHeld, yHeld, diagHeld, stopped, diagDir     diagOnlyDir - 0 not diag, 1 ur, 2 dr, 3 dl, 4 ul
        this.constraints = [false, false, false, false, 0];
        this.xDir = 0;
        this.yDir = 0;
    }

    spawn() {
        if(!this.alive) return
        let ctx = document.getElementById('gameCanvas').getContext('2d');

        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();

        this.constraintsController();
    }

    constraintsController() {
            for(let i = 0; i < this.constraints.length - 1; i++) {
                this.constraints[i] = false
            }

            let rand = Math.random();

            if(rand < 0.30) {
                this.constraints[0] = true;
                this.constraints[4] = 0;

                setTimeout(this.constraintsController.bind(this), numInRange(1500, 2000));
            } else if(rand > 0.30 && rand < 0.60) {
                this.constraints[1] = true;
                this.constraints[4] = 0;

                setTimeout(this.constraintsController.bind(this), numInRange(1500, 2000));
            } else if(rand > 0.60 && rand < 0.90) {
                this.constraints[2] = true;

                let rand2 = Math.random();

                if(rand2 < 0.24) {
                    this.constraints[4] = 1;
                } else if(rand2 < 0.49) {
                    this.constraints[4] = 2;
                } else if(rand2 < 0.74) {
                    this.constraints[4] = 3;
                } else {
                    this.constraints[4] = 4;
                }

                setTimeout(this.constraintsController.bind(this), numInRange(1500, 2000));
            } else if(rand > 0.90) {
                this.constraints[3] = true;
                this.constraints[4] = 0;

                setTimeout(this.constraintsController.bind(this), numInRange(200, 600));
            }

            let rand3 = Math.random();

            if(rand3 > 0.5) {
                this.xDir = 0;
                this.yDir = 0;
            } else {
                this.xDir = 1;
                this.yDir = 1;
            }

    }

    simulate() {
        this.move();
        this.updateStats();
    }

    updateStats() {
        if(world.framesRendered % 2000 == 0) this.age++;

        if(this.age > 7 && world.framesRendered % 4000 == 0) this.fitness += numInRange(0.01, 0.05);

        if(this.age > 14 && world.framesRendered % 3000 == 0 && Math.random() > 0.8) this.die();
    }

    die() {
        checkIfLifeFormIsCurrentRP(this.id);

        delete world.life[this.id];
        world.deadCounter++;
        world.lifeCounter--;
    }

    breed(partner) {
        let mixedColor = blendColors(this.color, partner.color, 0.5);
        let fitnessAverage = (this.fitness + partner.fitness) / 2;
        let newID = (world.life[Object.keys(world.life)[Object.keys(world.life).length - 1]].id) + 1;

        world.life[newID] = new LifeForm({
            id: newID,
            color: mixedColor,
            fitness: fitnessAverage - 0.1,
            age: 0
        });

        world.life[newID].spawn();
        world.lifeCounter++;
        world.totalLifeCounter++;
    }

    move() {
        let ctx = document.getElementById('gameCanvas').getContext('2d');

        this.x = newPos(this.x, 'x', this);
        this.y = newPos(this.y, 'y', this);

        // console.log(this.x, this.y);

        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function newPos(posi, w, lf) {
    let rand = Math.random();
    let pos = posi;

    let canvas = document.getElementById('gameCanvas');

    if(lf.constraints[0]) {
        if(w == 'x') return pos;
        else {
            if(lf.yDir == 0) pos += 1
            else pos -= 1;
        }
    } else if(lf.constraints[1]) {
        if(w == 'y') return pos;
        else {
            if(lf.xDir == 0) pos -= 1
            else pos +- 1;
        }
    } else if(lf.constraints[2]) {
        let dir = lf.constraints[4];

        switch (dir) {
            case 1:
                pos += 1;
                break;
            case 2:
                if(w == 'x') {
                    pos += 1;
                } else {
                    pos -= 1;
                }
                break;
            case 3:
                pos -= 1;
                break;
            case 4:
                if(w == 'x') {
                    pos -= 1;
                } else {
                    pos += 1;
                }
                break;
            default:
                break;
        }
    } else if(lf.constraints[3]) {
        return pos;
    }

    if(w == 'x') {
        if(pos < 0) {
            pos = canvas.clientWidth;
        } else if(pos > canvas.clientWidth) {
            pos = 0;
        }
    }

    if(w == 'y') {
        if(pos < 0) {
            pos = canvas.clientHeight;
        } else if(pos > canvas.clientHeight) {
            pos = 0;
        }
    }
    
    return pos;
}

function numInRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function checkBreedability() {
    let lifeForms = Object.values(world.life);

    let breedable = [];

    for(let l of lifeForms) {
        for(let i of lifeForms) {

            if(Math.abs(l.fitness - i.fitness) > 0.15) continue;

            let distance = Math.hypot(l.x - i.x, l.y - i.y);

            if(distance < 20) {
                breedable.push([l, i]);
            }
        }
    }

    // breedable = breedable.filter(c => {
    //     return (Math.random() > 0.5 ? c[0].fitness > 0.7 && c[1].fitness > 0.7 : c[0].fitness > 0.5 && c[1].fitness > 0.5)
    // })

    let couple = breedable[Math.floor(Math.random() * breedable.length)];

    world.life[couple[0].id].breed(world.life[couple[1].id]);

    setTimeout(checkBreedability, numInRange(750, 2000));
}

function blendColors(colorA, colorB, amount) {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
    return '#' + r + g + b;
}

function checkIfLifeFormIsCurrentRP(id) {
    let rpe = document.getElementById('randomParticleId').innerText;

    if(rpe == id) {
        newRandomParticle();
    }
}
