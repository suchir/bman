enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

class Player {
    private x: number;
    private y: number;
    private id: number;
    private width: number;
    private height: number;
    private xSpeed: number;
    private ySpeed: number;
    private direction: Direction;
    private hasKick: boolean;
    private numBombs: number;
    private numBombsAvailable: number;
    private numFire: number;

    constructor(x: number, y: number, id: number) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.width = 1.0;
        this.height = 1.0;

        this.xSpeed = 0;
        this.ySpeed = 0;

        this.direction = Direction.DOWN;

        this.hasKick = false;
        this.numBombs = 1;
        this.numBombsAvailable = this.numBombs;
        this.numFire = 1;
    }
}

export default Player;