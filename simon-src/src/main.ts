import { Game } from './Game';

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const game = new Game();
        
        // Initialize the game asynchronously
        await game.initializeGame();
        
        // Make game globally accessible for debugging
        (window as any).game = game;
        
        console.log('Simon Says game initialized!');
        
        // Add hint and 50/50 keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key === 'h' || event.key === 'H') {
                game.useHint();
            }
            if (event.key === 'x' || event.key === 'X') {
                game.useFiftyFifty();
            }
        });
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        
        // Show error message to user
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h2>Error Loading Game</h2>
                    <p>There was an error initializing the Simon Says game.</p>
                    <p>Please refresh the page and try again.</p>
                    <button onclick="location.reload()" style="
                        background: #4ecdc4; 
                        border: none; 
                        color: white; 
                        padding: 15px 30px; 
                        border-radius: 25px; 
                        font-size: 1.1rem; 
                        cursor: pointer;
                    ">Refresh Page</button>
                </div>
            `;
        }
    }
});

// Handle page visibility for audio context
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Resume audio context when page becomes visible
        // This helps with browser audio policies
        if ((window as any).Tone && (window as any).Tone.context.state === 'suspended') {
            (window as any).Tone.start();
        }
    }
});
