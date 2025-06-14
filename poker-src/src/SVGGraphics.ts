import { Card, Suit, Rank } from './Card';
import { Player } from './Player';
import { GameState } from './GameState'; // For pot size, later for more specific states

const SVG_NS = "http://www.w3.org/2000/svg";

// Card dimensions and styling
const CARD_WIDTH = 60;
const CARD_HEIGHT = 90;
const CARD_RX = 5; // Border radius
const CARD_STROKE = "black";
const CARD_FILL = "white";
const TEXT_FILL = "black";
const SUIT_COLORS: { [key in Suit]: string } = {
    [Suit.Hearts]: "red",
    [Suit.Diamonds]: "red",
    [Suit.Clubs]: "black",
    [Suit.Spades]: "black",
};

export class SVGGraphics {
    private svg: SVGSVGElement;
    private gameContainer: HTMLElement;

    constructor(containerId: string = "game-container") {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id "${containerId}" not found.`);
        }
        this.gameContainer = container;

        // Create SVG element
        this.svg = document.createElementNS(SVG_NS, "svg");
        this.svg.setAttribute("width", this.gameContainer.style.width || "800");
        this.svg.setAttribute("height", this.gameContainer.style.height || "600");
        this.svg.setAttribute("viewBox", `0 0 ${this.gameContainer.style.width || 800} ${this.gameContainer.style.height || 600}`);
        this.gameContainer.appendChild(this.svg);

        this.defineGlobalStyles();
    }

    private defineGlobalStyles(): void {
        const defs = document.createElementNS(SVG_NS, "defs");
        const style = document.createElementNS(SVG_NS, "style");
        style.textContent = `
            .card-rect {
                stroke: ${CARD_STROKE};
                stroke-width: 1;
                fill: ${CARD_FILL};
                rx: ${CARD_RX};
            }
            .card-text {
                font-family: sans-serif;
                font-size: 18px;
                text-anchor: middle;
                dominant-baseline: middle;
            }
            .player-info-text {
                font-family: sans-serif;
                font-size: 14px;
                fill: white; /* Changed to white for better visibility on dark green */
                text-anchor: middle; /* Centering player name/chips */
            }
            .bet-text { /* Specific style for bet amounts */
                font-family: sans-serif;
                font-size: 12px;
                fill: yellow;
                text-anchor: middle;
            }
            .pot-text {
                font-family: sans-serif;
                font-size: 18px;
                fill: yellow;
                text-anchor: middle;
            }
            .folded-text {
                font-family: sans-serif;
                font-size: 16px;
                fill: orange;
                text-anchor: middle;
                dominant-baseline: middle;
            }
        `;
        defs.appendChild(style);
        this.svg.appendChild(defs);
    }

    private clearContent(): void {
        const children = Array.from(this.svg.children);
        for (const child of children) {
            if (child.tagName.toLowerCase() !== 'defs') {
                this.svg.removeChild(child);
            }
        }
    }

    drawCard(card: Card, x: number, y: number, id?: string, hidden: boolean = false): SVGGElement {
        const group = document.createElementNS(SVG_NS, "g");
        if (id) group.setAttribute("id", id);
        group.setAttribute("transform", `translate(${x}, ${y})`);
        group.classList.add("card-svg-group");

        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("width", CARD_WIDTH.toString());
        rect.setAttribute("height", CARD_HEIGHT.toString());
        rect.classList.add("card-rect");
        if (hidden) {
            rect.setAttribute("fill", "darkslateblue"); // Color for hidden card back
        }
        group.appendChild(rect);

        const textContent = hidden ? "??" : card.toString();
        const textColor = hidden ? "white" : SUIT_COLORS[card.suit];

        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", (CARD_WIDTH / 2).toString());
        text.setAttribute("y", (CARD_HEIGHT / 2).toString());
        text.classList.add("card-text");
        text.style.fill = textColor;
        text.textContent = textContent;
        group.appendChild(text);

        this.svg.appendChild(group);
        return group;
    }

    drawTable(players: Player[], communityCards: Card[], pot: number): void {
        this.clearContent();

        const svgWidth = parseFloat(this.svg.getAttribute("width") || "800");
        const svgHeight = parseFloat(this.svg.getAttribute("height") || "600");

        // Community Cards
        const numCommCards = communityCards.length;
        const communityTotalWidth = numCommCards * CARD_WIDTH + Math.max(0, numCommCards - 1) * 10;
        const communityStartX = (svgWidth - communityTotalWidth) / 2;
        const communityY = svgHeight / 2 - CARD_HEIGHT / 2 - 30;
        communityCards.forEach((card, index) => {
            this.drawCard(card, communityStartX + index * (CARD_WIDTH + 10), communityY, `community-card-${index}`);
        });

        // Players
        const numPlayers = players.length;
        const tableRadiusX = svgWidth * 0.4;
        const tableRadiusY = svgHeight * 0.3;
        const centerX = svgWidth / 2;
        const centerY = svgHeight / 2 + 30;

        players.forEach((player, index) => {
            const angle = (index / numPlayers) * 2 * Math.PI - Math.PI / 2;
            const playerBaseX = centerX + tableRadiusX * Math.cos(angle);
            const playerBaseY = centerY + tableRadiusY * Math.sin(angle);

            // Player Info Text (Name, Chips)
            const playerInfo = document.createElementNS(SVG_NS, "text");
            playerInfo.setAttribute("x", playerBaseX.toString());
            playerInfo.setAttribute("y", (playerBaseY - CARD_HEIGHT * 0.5 - 15).toString()); // Above cards
            playerInfo.classList.add("player-info-text");
            playerInfo.textContent = `${player.name}: ${player.chips}`;
            this.svg.appendChild(playerInfo);

            // Player Bets
            if(player.currentBet > 0){
                const betText = document.createElementNS(SVG_NS, "text");
                betText.setAttribute("x", playerBaseX.toString());
                betText.setAttribute("y", (playerBaseY + CARD_HEIGHT * 0.5 + 20).toString()); // Below cards
                betText.classList.add("bet-text");
                betText.textContent = `Bet: ${player.currentBet}`;
                this.svg.appendChild(betText);
            }

            // Player Cards
            const cardXOffset = -CARD_WIDTH * 0.8; // Start left for two cards
            player.hand.forEach((card, cardIndex) => {
                // For a two player game, one player is 'You', other is 'Peer'
                // Hide Peer's cards unless it's showdown (not implemented yet)
                const shouldHide = player.name.toLowerCase().includes("peer");
                this.drawCard(
                    card,
                    playerBaseX + cardXOffset + cardIndex * (CARD_WIDTH + 5),
                    playerBaseY - CARD_HEIGHT * 0.5,
                    `player-${player.id}-card-${cardIndex}`,
                    shouldHide && !player.folded // Don't hide if folded (show back or nothing)
                                                // This simple hide logic will need to be tied to showdown state
                );
            });

            if (player.folded) {
                const foldedText = document.createElementNS(SVG_NS, "text");
                // Position FOLDED text over where cards would be
                foldedText.setAttribute("x", (playerBaseX - CARD_WIDTH * 0.3).toString());
                foldedText.setAttribute("y", playerBaseY.toString());
                foldedText.classList.add("folded-text");
                foldedText.textContent = "FOLDED";
                this.svg.appendChild(foldedText);
            }
        });

        // Pot size
        const potText = document.createElementNS(SVG_NS, "text");
        potText.setAttribute("x", (svgWidth / 2).toString());
        potText.setAttribute("y", (communityY + CARD_HEIGHT + 30).toString()); // Below community cards
        potText.classList.add("pot-text");
        potText.textContent = `Pot: ${pot}`;
        this.svg.appendChild(potText);
    }

    public getSVGElement(): SVGSVGElement {
        return this.svg;
    }
}
