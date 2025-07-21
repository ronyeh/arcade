class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.camera = { x: 0, y: 0 };
        this.gravity = 0.5;
        this.gameSpeed = 2;
        
        this.player = new Player(100, 400);
        this.enemies = [];
        this.platforms = [];
        this.powerFoods = [];
        this.projectiles = [];
        
        this.keys = {};
        this.level = 1;
        this.score = 0;
        
        this.setupControls();
        this.createLevel();
        this.gameLoop();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    createLevel() {
        for (let i = 0; i < 10; i++) {
            this.platforms.push(new Platform(i * 200, 500, 150, 20));
        }
        
        for (let i = 0; i < 5; i++) {
            this.enemies.push(new Enemy(300 + i * 400, 450));
        }
        
        this.powerFoods.push(new PowerFood(1800, 400, 'throw'));
    }
    
    update() {
        this.player.update(this);
        
        this.enemies.forEach(enemy => enemy.update(this));
        this.projectiles.forEach(projectile => projectile.update(this));
        
        this.camera.x = this.player.x - this.width / 2;
        this.camera.y = Math.max(0, this.player.y - this.height / 2);
        
        this.checkCollisions();
        this.cleanup();
    }
    
    checkCollisions() {
        this.platforms.forEach(platform => {
            if (this.player.collidesWith(platform)) {
                this.player.onGround = true;
                this.player.y = platform.y - this.player.height;
                this.player.velocityY = 0;
            }
        });
        
        this.enemies.forEach((enemy, enemyIndex) => {
            if (this.player.collidesWith(enemy) && !enemy.flipped) {
                if (this.player.attacking) {
                    enemy.flip();
                    this.score += 100;
                } else {
                    this.player.takeDamage(10);
                }
            }
            
            this.projectiles.forEach((projectile, projIndex) => {
                if (projectile.collidesWith(enemy)) {
                    enemy.takeDamage(50);
                    this.projectiles.splice(projIndex, 1);
                    this.score += 50;
                }
            });
        });
        
        this.powerFoods.forEach((food, index) => {
            if (this.player.collidesWith(food)) {
                this.player.addAbility(food.ability);
                this.powerFoods.splice(index, 1);
                this.updateUI();
            }
        });
    }
    
    cleanup() {
        this.enemies = this.enemies.filter(enemy => enemy.health > 0);
        this.projectiles = this.projectiles.filter(proj => 
            proj.x > this.camera.x - 100 && proj.x < this.camera.x + this.width + 100
        );
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.platforms.forEach(platform => platform.render(this.ctx));
        this.powerFoods.forEach(food => food.render(this.ctx));
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        this.player.render(this.ctx);
        
        this.ctx.restore();
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('level').textContent = this.level;
        document.getElementById('abilities').textContent = this.player.abilities.join(', ');
    }
    
    gameLoop() {
        this.update();
        this.render();
        this.updateUI();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpPower = 12;
        this.onGround = false;
        this.health = 100;
        this.maxHealth = 100;
        this.attacking = false;
        this.attackCooldown = 0;
        this.abilities = ['flip'];
        this.facing = 1;
    }
    
    update(game) {
        this.handleInput(game);
        
        if (!this.onGround) {
            this.velocityY += game.gravity;
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        this.velocityX *= 0.8;
        this.onGround = false;
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        if (this.y > game.height + 100) {
            this.takeDamage(20);
            this.y = 100;
            this.velocityY = 0;
        }
    }
    
    handleInput(game) {
        if (game.keys['a'] || game.keys['arrowleft']) {
            this.velocityX = -this.speed;
            this.facing = -1;
        }
        if (game.keys['d'] || game.keys['arrowright']) {
            this.velocityX = this.speed;
            this.facing = 1;
        }
        if ((game.keys['w'] || game.keys['arrowup'] || game.keys[' ']) && this.onGround) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
        }
        if (game.keys['j'] && this.attackCooldown === 0) {
            this.attack(game);
        }
        if (game.keys['k'] && this.abilities.includes('throw') && this.attackCooldown === 0) {
            this.throwFood(game);
        }
        if (game.keys['l'] && this.abilities.includes('spin') && this.attackCooldown === 0) {
            this.spinAttack(game);
        }
    }
    
    attack(game) {
        this.attacking = true;
        this.attackCooldown = 30;
        setTimeout(() => { this.attacking = false; }, 200);
    }
    
    throwFood(game) {
        const projectile = new Projectile(
            this.x + (this.facing > 0 ? this.width : 0),
            this.y + this.height / 2,
            this.facing * 8,
            0
        );
        game.projectiles.push(projectile);
        this.attackCooldown = 60;
    }
    
    spinAttack(game) {
        this.attacking = true;
        this.attackCooldown = 90;
        setTimeout(() => { this.attacking = false; }, 500);
    }
    
    addAbility(ability) {
        if (!this.abilities.includes(ability)) {
            this.abilities.push(ability);
        }
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    render(ctx) {
        ctx.fillStyle = this.attacking ? '#ff6b6b' : '#4ecdc4';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 5, this.y + 5, 10, 10);
        ctx.fillRect(this.x + 25, this.y + 5, 10, 10);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x + 15, this.y + 20, 10, 5);
        
        const spatulaX = this.x + (this.facing > 0 ? this.width : -10);
        const spatulaY = this.y + 15;
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(spatulaX, spatulaY, 10, 25);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(spatulaX, spatulaY, 10, 15);
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 1;
        this.direction = -1;
        this.flipped = false;
        this.flipTimer = 0;
    }
    
    update(game) {
        if (this.flipped) {
            this.flipTimer--;
            if (this.flipTimer <= 0) {
                this.flipped = false;
            }
        } else {
            this.x += this.speed * this.direction;
        }
        
        if (this.x < game.camera.x - 100) {
            this.direction = 1;
        } else if (this.x > game.camera.x + game.width + 100) {
            this.direction = -1;
        }
    }
    
    flip() {
        this.flipped = true;
        this.flipTimer = 180;
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    render(ctx) {
        if (this.flipped) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(Math.PI);
            ctx.translate(-this.width/2, -this.height/2);
            ctx.fillStyle = '#ff9ff3';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x + 5, this.y + 5, 5, 5);
            ctx.fillRect(this.x + 20, this.y + 5, 5, 5);
        }
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    render(ctx) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x, this.y, this.width, 5);
    }
}

class PowerFood {
    constructor(x, y, ability) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.ability = ability;
        this.bounce = 0;
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    render(ctx) {
        this.bounce += 0.1;
        const offsetY = Math.sin(this.bounce) * 5;
        
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(this.x, this.y + offsetY, this.width, this.height);
        
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(this.x + 10, this.y + offsetY - 5, 10, 8);
    }
}

class Projectile {
    constructor(x, y, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
    
    update(game) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += game.gravity * 0.3;
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    render(ctx) {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

new Game();