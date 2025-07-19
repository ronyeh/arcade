class UmbrellaGuy {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.player = {
            x: 100,
            y: this.canvas ? this.canvas.height - 160 : 240,
            width: 30,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            onGround: false,
            umbrellaOpen: false,
            direction: 1
        };
        
        this.camera = {
            x: 0,
            y: 0
        };
        
        this.buildings = [];
        this.platforms = [];
        this.ladders = [];
        this.trampolines = [];
        this.distance = 0;
        this.gameSpeed = 2;
        this.gravity = 0.5;
        this.jumpPower = -12;
        this.trampolinePower = -20;
        this.keys = {};
        this.windowLights = new Map();
        
        this.generateBuildings();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleSpaceBar();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    handleSpaceBar() {
        if (this.player.onGround) {
            this.player.velocityY = this.jumpPower;
            this.player.onGround = false;
        } else {
            this.player.umbrellaOpen = !this.player.umbrellaOpen;
        }
    }
    
    generateBuildings() {
        this.platforms.push({
            x: 0,
            y: this.canvas.height - 120,
            width: 200,
            height: 20
        });
        
        this.trampolines.push({
            x: 180,
            y: this.canvas.height - 125,
            width: 20,
            height: 5
        });
        
        for (let i = 0; i < 20; i++) {
            const buildingWidth = 80 + Math.random() * 120;
            const maxBuildingHeight = Math.min(this.canvas.height * 0.7, 400);
            const buildingHeight = 150 + Math.random() * (maxBuildingHeight - 150);
            const buildingX = 300 + i * (buildingWidth + 50 + Math.random() * 100);
            
            this.buildings.push({
                x: buildingX,
                y: this.canvas.height - buildingHeight,
                width: buildingWidth,
                height: buildingHeight
            });
            
            this.platforms.push({
                x: buildingX,
                y: this.canvas.height - buildingHeight,
                width: buildingWidth,
                height: 20
            });
            
            this.trampolines.push({
                x: buildingX + buildingWidth - 20,
                y: this.canvas.height - buildingHeight - 5,
                width: 20,
                height: 5
            });
            
            if (Math.random() < 0.3) {
                this.ladders.push({
                    x: buildingX + buildingWidth - 20,
                    y: this.canvas.height - buildingHeight,
                    width: 20,
                    height: buildingHeight
                });
            }
            
            for (let row = 0; row < Math.floor(buildingHeight / 30); row++) {
                for (let col = 0; col < Math.floor(buildingWidth / 25); col++) {
                    const windowKey = `${i}_${row}_${col}`;
                    this.windowLights.set(windowKey, Math.random() < 0.7);
                }
            }
        }
    }
    
    update() {
        this.distance += this.gameSpeed;
        this.camera.x = this.player.x - 200;
        
        this.player.x += this.gameSpeed;
        
        if (!this.player.onGround) {
            if (this.player.umbrellaOpen) {
                this.player.velocityY += this.gravity * 0.3;
                this.player.velocityY = Math.min(this.player.velocityY, 3);
            } else {
                this.player.velocityY += this.gravity;
            }
        }
        
        this.player.y += this.player.velocityY;
        
        this.checkCollisions();
        
        if (this.player.y > this.canvas.height) {
            this.resetGame();
        }
        
        this.scoreElement.textContent = `Distance: ${Math.floor(this.distance / 10)}m`;
    }
    
    checkCollisions() {
        this.player.onGround = false;
        
        for (let platform of this.platforms) {
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 10 &&
                this.player.velocityY >= 0) {
                
                this.player.y = platform.y - this.player.height;
                this.player.velocityY = 0;
                this.player.onGround = true;
                this.player.umbrellaOpen = false;
                break;
            }
        }
        
        for (let trampoline of this.trampolines) {
            if (this.player.x + this.player.width > trampoline.x &&
                this.player.x < trampoline.x + trampoline.width &&
                this.player.y + this.player.height > trampoline.y &&
                this.player.y + this.player.height < trampoline.y + trampoline.height + 10 &&
                this.player.velocityY >= 0) {
                
                this.player.velocityY = this.trampolinePower;
                this.player.onGround = false;
                break;
            }
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.renderBuildings();
        this.renderPlatforms();
        this.renderLadders();
        this.renderTrampolines();
        this.renderPlayer();
        
        this.ctx.restore();
    }
    
    renderBuildings() {
        this.ctx.fillStyle = '#4a4a4a';
        for (let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i];
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
            
            this.ctx.fillStyle = '#ffff99';
            for (let row = 0; row < Math.floor(building.height / 30); row++) {
                for (let col = 0; col < Math.floor(building.width / 25); col++) {
                    const windowKey = `${i}_${row}_${col}`;
                    if (this.windowLights.get(windowKey)) {
                        this.ctx.fillRect(
                            building.x + col * 25 + 5,
                            building.y + row * 30 + 5,
                            15, 20
                        );
                    }
                }
            }
            this.ctx.fillStyle = '#4a4a4a';
        }
    }
    
    renderPlatforms() {
        this.ctx.fillStyle = '#333';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    }
    
    renderLadders() {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        for (let ladder of this.ladders) {
            this.ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
            
            this.ctx.strokeStyle = '#654321';
            for (let i = 0; i < ladder.height; i += 20) {
                this.ctx.beginPath();
                this.ctx.moveTo(ladder.x, ladder.y + i);
                this.ctx.lineTo(ladder.x + ladder.width, ladder.y + i);
                this.ctx.stroke();
            }
        }
    }
    
    renderTrampolines() {
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        for (let trampoline of this.trampolines) {
            this.ctx.fillRect(trampoline.x, trampoline.y, trampoline.width, trampoline.height);
            
            this.ctx.beginPath();
            this.ctx.moveTo(trampoline.x, trampoline.y + trampoline.height);
            this.ctx.quadraticCurveTo(
                trampoline.x + trampoline.width / 2, 
                trampoline.y - 5,
                trampoline.x + trampoline.width, 
                trampoline.y + trampoline.height
            );
            this.ctx.stroke();
            
            for (let i = 0; i < 4; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(trampoline.x + (i * trampoline.width / 3), trampoline.y + trampoline.height);
                this.ctx.lineTo(trampoline.x + (i * trampoline.width / 3), trampoline.y + trampoline.height + 8);
                this.ctx.stroke();
            }
        }
    }
    
    renderPlayer() {
        const playerScreenX = this.player.x;
        const playerScreenY = this.player.y;
        const centerX = playerScreenX + 15;
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, playerScreenY + 8, 6, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, playerScreenY + 14);
        this.ctx.lineTo(centerX, playerScreenY + 30);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 8, playerScreenY + 22);
        this.ctx.lineTo(centerX + 8, playerScreenY + 22);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, playerScreenY + 30);
        this.ctx.lineTo(centerX - 6, playerScreenY + 40);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, playerScreenY + 30);
        this.ctx.lineTo(centerX + 6, playerScreenY + 40);
        this.ctx.stroke();
        
        if (this.player.umbrellaOpen) {
            this.ctx.fillStyle = '#ff1744';
            this.ctx.beginPath();
            this.ctx.arc(centerX, playerScreenY - 10, 20, 0, Math.PI, true);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, playerScreenY - 10);
            this.ctx.lineTo(centerX, playerScreenY + 5);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            for (let i = -3; i <= 3; i++) {
                this.ctx.moveTo(centerX + i * 6, playerScreenY - 10);
                this.ctx.lineTo(centerX + i * 7, playerScreenY - 15);
            }
            this.ctx.stroke();
        }
    }
    
    resetGame() {
        this.player.x = 100;
        this.player.y = this.canvas.height - 160;
        this.player.velocityY = 0;
        this.player.onGround = false;
        this.player.umbrellaOpen = false;
        this.distance = 0;
        this.camera.x = 0;
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new UmbrellaGuy();
});