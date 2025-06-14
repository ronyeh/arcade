import { SquareConfig } from './types';

// Access PIXI from global scope (loaded via CDN)
declare const PIXI: any;

export class Square {
    public container: any;
    public graphics: any;
    public isActive: boolean = false;
    public isHidden: boolean = false;
    private config: SquareConfig;
    private flashTween: any = null;

    constructor(config: SquareConfig, size: number) {
        this.config = config;
        this.container = new PIXI.Container();
        this.graphics = new PIXI.Graphics();
        
        this.container.addChild(this.graphics);
        this.container.x = config.x;
        this.container.y = config.y;
        
        // Make it interactive
        this.container.interactive = true;
        this.container.buttonMode = true;
        
        this.drawSquare(size);
    }

    private drawSquare(size: number): void {
        this.graphics.clear();
        
        if (this.isHidden) {
            // Draw a semi-transparent overlay when hidden
            this.graphics.beginFill(0x000000, 0.7);
            this.graphics.drawRoundedRect(-size/2, -size/2, size, size, 10);
            this.graphics.endFill();
        } else {
            // Draw the colored square
            const color = this.isActive ? this.config.color : this.config.darkColor;
            this.graphics.beginFill(color);
            this.graphics.drawRoundedRect(-size/2, -size/2, size, size, 10);
            this.graphics.endFill();
            
            // Add border
            this.graphics.lineStyle(3, 0xFFFFFF, 0.8);
            this.graphics.drawRoundedRect(-size/2, -size/2, size, size, 10);
        }
    }

    public flash(duration: number = 500): Promise<void> {
        return new Promise((resolve) => {
            this.isActive = true;
            this.drawSquare(150); // Assuming size is 150, you might want to pass this
            
            // Simple timeout-based flash
            setTimeout(() => {
                this.isActive = false;
                this.drawSquare(150);
                resolve();
            }, duration);
        });
    }

    public setHidden(hidden: boolean): void {
        this.isHidden = hidden;
        this.drawSquare(150);
    }

    public onClick(callback: () => void): void {
        this.container.on('pointerdown', callback);
    }

    public setSize(size: number): void {
        this.drawSquare(size);
    }

    public get key(): string {
        return this.config.key;
    }

    public get frequency(): number {
        return this.config.frequency;
    }
}
