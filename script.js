const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

let score = 0;
let timeLeft = 60; 
let gameInterval; 
let timerInterval; 
let scoreMultiplier = 1; 
let multiplierTimeout; 

let isMultiplierBugPresent = false; 

const MIN_SPEED = 2;
const MAX_SPEED = 6;
const BUG_SIZE = 80;

// --- NEW CONSTANT: Determines the density of the bugs ---
// Higher number means FEWER bugs (less dense). Lower means MORE bugs (more dense).
// 2000 is a good starting point for balancing on a standard phone screen.
const BUG_DENSITY_FACTOR = 2000; 

// --- Bug definitions (remains the same) ---
const BUG_DEFINITIONS = [
    // ... (Definitions remain here) ...
    { name: 'Ladybug', points: 1, type: 'standard', url: 'https://media.tenor.com/pPOVCdk6jYUAAAAi/ladybug-flap-wings.gif' },
    { name: 'Cockroach', points: 1, type: 'standard', url:'https://media.tenor.com/ntPn1ftrTkkAAAAi/cockroach-ipis.gif'},
    { name: 'Dragonfly', points: 3, type: 'standard', url: 'https://media.tenor.com/J6mHiFhG7fkAAAAm/yanmega-flying.webp' },
    { name: 'Mantis', points: 3, type: 'standard', url: 'https://media.tenor.com/VISiRM_3gLoAAAAm/%E8%9E%B3%E8%9E%82-praying-mantis.webp'}, 
    { name: 'Spider', points: 5, type: 'standard', url: 'https://media.tenor.com/3dgbcMt6Kx4AAAAm/spider-insect.webp' }, 
    { name: 'Bee', points: 5, type: 'standard', url: 'https://media.tenor.com/Jg9fOjEk2lYAAAAi/dm4uz3-foekoe.gif' },
    { name: 'Butterfly', points: 0, type: 'multiplier', url: 'https://media.tenor.com/IL_Mx0jUaIIAAAAi/borboletas-butterflies.gif' }
];

// Helper functions (remain the same)
function getRandomBugDefinition() {
    // ... (10% spawn logic remains here) ...
    if (!isMultiplierBugPresent && Math.random() < 0.10) { 
        return BUG_DEFINITIONS.find(bug => bug.type === 'multiplier');
    }
    const standardBugs = BUG_DEFINITIONS.filter(bug => bug.type === 'standard');
    return standardBugs[Math.floor(Math.random() * standardBugs.length)];
}

function activateMultiplier() {
    // ... (Multiplier logic remains here) ...
    clearTimeout(multiplierTimeout);
    scoreMultiplier = 2;
    scoreDisplay.style.color = 'gold'; 

    multiplierTimeout = setTimeout(() => {
        scoreMultiplier = 1;
        scoreDisplay.style.color = '#000'; 
    }, 10000); 
}

// --- NEW FUNCTION: Calculate Max Bugs Based on Screen Area ---
function getMaxBugs() {
    // Calculate the total area of the game screen
    const gameAreaWidth = gameArea.offsetWidth;
    const gameAreaHeight = gameArea.offsetHeight;
    const gameAreaArea = gameAreaWidth * gameAreaHeight;

    // Divide the area by the density factor.
    // Example: 380px * 530px (standard phone area) = 201400.
    // 201400 / 2000 = 100.7. Max bugs = 100.
    const maxBugs = Math.floor(gameAreaArea / BUG_DENSITY_FACTOR);

    // Ensure a minimum bug count (e.g., 5) just in case the screen is tiny.
    return Math.max(5, maxBugs);
}

// --- 1. Dynamic Movement Logic (remains the same) ---
function moveSpider(bugElement) { 
    // ... (Movement logic remains the same) ...
    let speedX = (Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED) * (Math.random() < 0.5 ? 1 : -1);
    let speedY = (Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED) * (Math.random() < 0.5 ? 1 : -1);

    const moveInterval = setInterval(() => {
        let currentX = parseFloat(bugElement.style.left);
        let currentY = parseFloat(bugElement.style.top);

        const maxLeft = gameArea.offsetWidth - BUG_SIZE;
        const maxTop = gameArea.offsetHeight - BUG_SIZE;

        let newX = currentX + speedX;
        let newY = currentY + speedY;

        // Collision detection and boundary snap
        if (newX <= 0) {
            speedX = -speedX; newX = 0; 
        } else if (newX >= maxLeft) {
            speedX = -speedX; newX = maxLeft; 
        }
        
        if (newY <= 0) {
            speedY = -speedY; newY = 0; 
        } else if (newY >= maxTop) {
            speedY = -speedY; newY = maxTop; 
        }

        bugElement.style.left = newX + 'px';
        bugElement.style.top = newY + 'px';

    }, 50);

    bugElement.moveIntervalId = moveInterval;
}


// --- 2. Bug Creation Logic (UPDATED for Max Bug Count) ---
function spawnSpider() {
    if (timeLeft <= 0) return;

    // --- ENFORCE MAX BUG COUNT ---
    const currentBugCount = gameArea.querySelectorAll('.bug-container').length;
    const maxBugCount = getMaxBugs();

    if (currentBugCount >= maxBugCount) {
        // Stop spawning until a bug is smashed
        return; 
    }
    // ----------------------------

    const bugData = getRandomBugDefinition(); 

    // Mark the multiplier bug as present
    if (bugData.type === 'multiplier') {
        isMultiplierBugPresent = true;
    }

    const bugContainer = document.createElement('div');
    bugContainer.className = 'bug-container'; 
    
    // Add shining class if it's the multiplier bug
    if (bugData.type === 'multiplier') {
        bugContainer.classList.add('shining-bug'); 
    }
    
    // Store bug properties
    bugContainer.dataset.points = bugData.points;
    bugContainer.dataset.type = bugData.type;

    const bugImage = document.createElement('img');
    bugImage.src = bugData.url; 
    bugImage.alt = bugData.name;
    bugImage.className = 'bug-image';
    
    bugContainer.appendChild(bugImage);

    // Initial position 
    const maxLeft = gameArea.offsetWidth - BUG_SIZE;
    const maxTop = gameArea.offsetHeight - BUG_SIZE;
    
    const initialX = Math.random() * maxLeft;
    const initialY = Math.random() * maxTop;

    bugContainer.style.left = initialX + 'px';
    bugContainer.style.top = initialY + 'px';

    bugContainer.addEventListener('click', smashSpider);

    gameArea.appendChild(bugContainer);
    moveSpider(bugContainer);
}


// --- 3. Tap/Smash Logic (remains the same) ---
function smashSpider(event) {
    if (timeLeft <= 0) return;

    const bugContainer = event.target.closest('.bug-container');
    if (!bugContainer) return; 

    clearInterval(bugContainer.moveIntervalId);

    // If the multiplier bug is smashed, activate bonus and clear its presence flag
    if (bugContainer.dataset.type === 'multiplier') {
        activateMultiplier();
        isMultiplierBugPresent = false; 
    }
    
    // Calculate score using the current multiplier
    const basePoints = parseInt(bugContainer.dataset.points, 10);
    const earnedPoints = basePoints * scoreMultiplier;
    
    score += earnedPoints; 
    scoreDisplay.textContent = score;

    // Visual cleanup
    bugContainer.style.opacity = '0'; 

    setTimeout(() => {
        bugContainer.remove();
    }, 100);
}


// --- 4. Game Timer and End Game (remains the same) ---
function updateTimer() {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        clearInterval(gameInterval);
        clearTimeout(multiplierTimeout); 
        endGame();
    }
}

function endGame() {
    const remainingBugs = document.querySelectorAll('.bug-container');
    remainingBugs.forEach(bug => {
        clearInterval(bug.moveIntervalId);
        bug.style.pointerEvents = 'none';
    });

    const message = document.createElement('div');
    message.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; font-size: 2em; z-index: 10;';
    message.innerHTML = `GAME OVER! <br>Final Score: **${score}**`;
    gameArea.appendChild(message);
}


// --- 5. Game Start (remains the same) ---
function startGame() {
    timerDisplay.textContent = timeLeft;
    timerInterval = setInterval(updateTimer, 1000);

    gameInterval = setInterval(spawnSpider, 1000);
    spawnSpider();
}

startGame();