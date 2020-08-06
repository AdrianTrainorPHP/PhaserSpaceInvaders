let game;

window.onload = function () {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: 0x000000,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: 'thegame',
            width: 800,
            height: 600
        },
        physics: {
            default: 'arcade'
        },
        scene: PlayGame
    };
    game = new Phaser.Game(gameConfig);
    window.focus();
};

class PlayGame extends Phaser.Scene {

    constructor() {
        super('PlayGame');
    }

    preload() {
        this.load.image('player', 'assets/images/player.png');
        this.load.image('shot', 'assets/images/shot.png');
        this.load.spritesheet({
            key: 'barrierPart',
            url: 'assets/images/spaceinvaders-barrier-sprite.png',
            frameConfig: {
                frameWidth: 20,
                frameHeight: 20,
                startFrame: 0,
                endFrame: 5
            }
        });
        this.load.spritesheet({
            key: 'enemyA',
            url: 'assets/images/enemy-a-sprite.png',
            frameConfig: {
                frameWidth: 25,
                frameHeight: 25,
                startFrame: 0,
                endFrame: 1
            }
        });
    }

    create() {
        this.initialiseBarrierSprites();
        this.initializeEnemySprites();

        this.player = this.makePlayer((this.sys.canvas.width / 2), this.sys.canvas.height - 10);


        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    initialiseBarrierSprites() {
        let i = -1;
        this.barrierSprites = [];

        function iterate(xs, ys, self) {
            for (let y of ys) {
                for (let x of xs) {
                    self.barrierSprites.push(self.makeBarrierSprite(x, y, 0, ++i));
                }
            }
        }

        const incrementBy = 170;
        function increment(target) {
            for (let t in target) {
                target[t] += incrementBy;
            }
        }

        let xas = [-70, -60, 0, 10],
            xbs = [-50, -40, -30, -20, -10],
            yas = [490, 480, 470, 460, 450],
            ybs = [460, 450];

        for (let v = 1; v < 5; v++) {
            increment(xas);
            increment(xbs);
            iterate(xas, yas, this);
            iterate(xbs, ybs, this);
        }
    }

    makeBarrierSprite(x, y, loadIndex, arrayIndex) {
        let barrierSprite = this.physics.add.image(x, y, 'barrierPart', loadIndex);
        barrierSprite.loadIndex = loadIndex;
        barrierSprite.arrayIndex = arrayIndex;
        barrierSprite.initX = x;
        barrierSprite.initY = y;
        return barrierSprite;
    }

    initializeEnemySprites() {
        let i = -1;
        this.enemySprites = [];

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('enemyA', { start: 0, end: 1 }),
            frameRate: 1,
            repeat: -1,
        });

        this.baseEnemyX = 12;
        this.enemyX = this.baseEnemyX;

        let x, y = 100;
        for (let v = 0; v < 5; v++) {
            x = 100;
            for (let t = 0; t < 11; t++) {
                this.enemySprites.push(this.makeEnemySprite(x, y, 'enemyA', 0, ++i, this));
                x += 40;
            }
            y += 40;
        }
    }

    makeEnemySprite(x, y, type, loadIndex, arrayIndex, self) {
        // let enemySprite = this.physics.add.image(x, y, type, loadIndex);
        let enemySprite = this.physics.add.sprite(x, y, type);
        enemySprite.loadIndex = loadIndex;
        enemySprite.arrayIndex = arrayIndex;
        enemySprite.initX = x;
        enemySprite.initY = y;
        enemySprite.anims.play('walk');
        enemySprite.setVelocityX(self.enemyX);
        enemySprite.setCollideWorldBounds(true);
        return enemySprite;
    }

    update() {
        if (typeof this.shot !== 'undefined') {
            this.shot.y -= this.shot.props.speed;
            if (this.shot.y < 0) {
                this.shot.destroy();
                this.shot = undefined;
            }
        }

        if (this.rightKey.isDown && this.player.x < this.sys.canvas.width - (this.player.displayWidth * this.player.originX)) {
            this.player.x += this.player.props.speed;
        }

        if (this.leftKey.isDown && this.player.x > (this.player.displayWidth * this.player.originX)) {
            this.player.x -= this.player.props.speed;
        }

        if (this.spaceKey.isDown && typeof this.shot === 'undefined') {
            this.makeShot(this.player.x, this.player.y, this);
        }

        let changeDirection = false,
            newDirection = 'left';

        for (let enemy of this.enemySprites) {
            if (typeof enemy === 'undefined') continue;

            if (enemy.x > 780) {
                newDirection = 'left';
                changeDirection = true;
                continue;
            }

            if (enemy.x < 20) {
                newDirection = 'right';
                changeDirection = true;
            }
        }

        if (changeDirection) {
            switch (newDirection) {
                case 'right':
                    this.enemyX = this.baseEnemyX;
                    break;
                default:
                    this.enemyX = 0 - this.baseEnemyX;
            }
        }

        for (let enemy of this.enemySprites) {
            if (typeof enemy === 'undefined') continue;
            enemy.setVelocityX(this.enemyX);
        }
    }

    makePlayer(x, y) {
        let player = this.physics.add.image(x, y, 'player').setOrigin(0.5, 1);
        player.setBounce(1);
        player.props = {};
        player.props.speed = 4;
        return player;
    }

    makeShot(x, y, self) {
        self.shot = self.physics.add.image(x, (y - 21), 'shot');
        self.shot.setOrigin(0.5, 1);
        self.shot.props = {};
        self.shot.props.speed = 10;
        self.physics.add.collider(self.shot, self.enemySprites, function (_shot, _enemySprite) {
            let arrayIndex = _enemySprite.arrayIndex;
            _shot.destroy();
            _enemySprite.destroy();
            self.shot = undefined;
            self.enemySprites[arrayIndex] = undefined;
        });
        self.physics.add.collider(self.shot, self.barrierSprites, function (_shot, _barrierSprite) {
            let loadIndex = _barrierSprite.loadIndex,
                arrayIndex = _barrierSprite.arrayIndex,
                initX = _barrierSprite.initX,
                initY = _barrierSprite.initY;
            loadIndex++;
            _barrierSprite.destroy();
            self.shot.destroy();
            self.shot = undefined;
            self.barrierSprites[arrayIndex] = undefined;
            if (loadIndex < 5) {
                self.barrierSprites[arrayIndex] = self.makeBarrierSprite(initX, initY, loadIndex, arrayIndex);
            }
        });
        return self.shot;
    }
}