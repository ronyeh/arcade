// Access Tone from global scope (loaded via CDN)
declare const Tone: any;

export class AudioManager {
    private synth: any;
    private isInitialized: boolean = false;

    constructor() {
        this.synth = new Tone.Synth().toDestination();
    }

    public async initialize(): Promise<void> {
        if (!this.isInitialized) {
            await Tone.start();
            this.isInitialized = true;
        }
    }

    public playTone(frequency: number, duration: number = 0.3): void {
        if (!this.isInitialized) {
            console.warn('AudioManager not initialized');
            return;
        }

        try {
            this.synth.triggerAttackRelease(frequency, duration);
        } catch (error) {
            console.error('Error playing tone:', error);
        }
    }

    public playSequenceTone(frequency: number): void {
        this.playTone(frequency, 0.5);
    }

    public playSuccessTone(): void {
        // Play a pleasant success chord
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.2);
            }, index * 100);
        });
    }

    public playFailTone(): void {
        // Play a descending failure tone
        const frequencies = [220, 196, 174.61]; // A3, G3, F3
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.3);
            }, index * 150);
        });
    }

    public playBonusTone(): void {
        // Play an ascending bonus tone
        const frequencies = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.15);
            }, index * 100);
        });
    }
}
