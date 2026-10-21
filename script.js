// Catch the Clean Water uses regular HTML buttons instead of a game library.
// This keeps the game simple and makes it usable with a keyboard and screen reader.

const dropLayer = document.querySelector('#drop-layer');
const scoreText = document.querySelector('#score');
const timerText = document.querySelector('#timer');
const communityScoreText = document.querySelector('#community-score');
const feedbackText = document.querySelector('#feedback');
const startScreen = document.querySelector('#start-screen');
const gameplayScreen = document.querySelector('#gameplay-screen');
const startButton = document.querySelector('#start-button');
const resetButton = document.querySelector('#reset-button');
const replayButton = document.querySelector('#replay-button');
const shareButton = document.querySelector('#share-button');
const resultPanel = document.querySelector('#result-panel');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');
const finalScoreText = document.querySelector('#final-score');
const shareMessage = document.querySelector('#share-message');

const roundLength = 30;
const winningScore = 20;
const maxActiveDrops = 6;
const pollutedDropChance = 0.2;
const pollutedDropPenalty = -2;
let score = 0;
let timeRemaining = roundLength;
let communityScore = 0;
let isPlaying = false;
let milestones = {
    tenPoints: false,
    fifteenPoints: false
};
let timerId;
let dropId;
const activeDrops = new Set();

function updateDisplay() {
    scoreText.textContent = score;
    timerText.textContent = timeRemaining;

    // The community counter is optional while this phase uses the simpler layout.
    if (communityScoreText) {
        communityScoreText.textContent = communityScore;
    }
}

// Show short messages in the live feedback area for all players.
function showFeedback(message) {
    feedbackText.textContent = message;
}

function clearGameTimers() {
    // Clearing both intervals prevents duplicate timers in later rounds.
    clearInterval(timerId);
    clearInterval(dropId);
    timerId = null;
    dropId = null;
}

function clearDrops() {
    // Removing the elements also stops their CSS fall animations.
    dropLayer.replaceChildren();
    activeDrops.clear();
}

function clearCelebration() {
    document.querySelectorAll('.confetti').forEach((piece) => piece.remove());
}

function showScreen(screenToShow) {
    startScreen.hidden = screenToShow !== startScreen;
    gameplayScreen.hidden = screenToShow !== gameplayScreen;
    resultPanel.hidden = screenToShow !== resultPanel;
}

function resetRoundState() {
    // Always clear the old round before creating a new timer or spawn interval.
    clearGameTimers();
    clearDrops();
    clearCelebration();
    score = 0;
    timeRemaining = roundLength;
    isPlaying = false;
    milestones = {
        tenPoints: false,
        fifteenPoints: false
    };
    startButton.disabled = false;
    startButton.textContent = 'Start game';
    shareMessage.textContent = '';
    updateDisplay();
}

function finishGame(playerWon) {
    clearGameTimers();
    clearDrops();
    isPlaying = false;
    startButton.disabled = false;
    finalScoreText.textContent = score;
    showScreen(resultPanel);

    if (playerWon) {
        resultTitle.textContent = 'You brought clean water closer!';
        resultMessage.textContent = `You scored ${score} points and reached the community goal. Great work!`;
        showFeedback('Clean water win!');
        showConfetti();
    } else {
        resultTitle.textContent = 'Time is up!';
        resultMessage.textContent = `You scored ${score} points. Try again to reach ${winningScore}.`;
        showFeedback('Every drop still counts. Give it another try!');
    }

}

function updateScore(points) {
    if (!isPlaying) {
        return;
    }

    // Change the score in one place and update the visible number immediately.
    score = Math.max(0, score + points);
    updateDisplay();

    if (score >= winningScore) {
        finishGame(true);
    } else if (score >= 15 && !milestones.fifteenPoints) {
        milestones.fifteenPoints = true;
        showMilestoneFeedback('Amazing! 15 points - you are almost there!');
    } else if (score >= 10 && !milestones.tenPoints) {
        milestones.tenPoints = true;
        showMilestoneFeedback('Great job! You reached 10 points!');
    }
}

function showMilestoneFeedback(message) {
    // Milestone flags are set before this function is called, so each message appears once per round.
    showFeedback(message);
}

function catchDrop(drop, isPolluted) {
    if (!isPlaying || !activeDrops.has(drop)) {
        return;
    }

    removeDrop(drop);
    if (isPolluted) {
        // The score helper clamps the result, so pollution cannot make it negative.
        updateScore(pollutedDropPenalty);
        showFeedback('Polluted Water! -2');
    } else {
        // The active drop is removed before scoring, so a second tap cannot score.
        communityScore += 1;
        updateScore(1);
        if (isPlaying) {
            showFeedback('+1 Water Drop!');
        }
    }
}

function removeDrop(drop) {
    // This works for both collected drops and drops that finish their animation.
    activeDrops.delete(drop);
    drop.remove();
}

function createDrop() {
    // Do not create more drops when the round is over or the board is full.
    if (!isPlaying || activeDrops.size >= maxActiveDrops) {
        return;
    }

    // Polluted drops are obstacles, but they appear less often than clean drops.
    const isPolluted = Math.random() < pollutedDropChance;
    const drop = document.createElement('button');
    // Keep the drop's left edge away from the board edges.
    const horizontalPosition = Math.random() * 76 + 2;
    drop.className = isPolluted ? 'drop polluted' : 'drop';
    drop.type = 'button';
    drop.style.left = `${horizontalPosition}%`;
    drop.setAttribute('aria-label', isPolluted ? 'Polluted water drop, avoid' : 'Clean water drop, catch');
    drop.textContent = isPolluted ? '☣' : '💧';
    // Pointer input responds immediately on touch, mouse, and pen.
    drop.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        catchDrop(drop, isPolluted);
    });
    // Keep click support for keyboard activation and guard duplicate pointer/click events
    // with activeDrops in catchDrop.
    drop.addEventListener('click', () => catchDrop(drop, isPolluted));
    drop.addEventListener('animationend', () => removeDrop(drop), { once: true });
    activeDrops.add(drop);
    dropLayer.append(drop);
}

function startGame() {
    // Ignore extra clicks so two rounds cannot run at the same time.
    if (isPlaying) {
        return;
    }

    resetRoundState();
    beginRound();
}

function beginRound() {
    isPlaying = true;
    showScreen(gameplayScreen);
    startButton.disabled = true;
    showFeedback('Go! Catch the clean water drops.');
    createDrop();
    dropId = setInterval(createDrop, 800);
    timerId = setInterval(() => {
        // Clamp the value so the screen never shows a negative time.
        timeRemaining = Math.max(0, timeRemaining - 1);
        updateDisplay();
        if (timeRemaining <= 0) {
            // finishGame clears the spawn interval, timer, and falling drops.
            finishGame(score >= winningScore);
        }
    }, 1000);
}

function restartGame() {
    // Reset and Play Again both use this path for a completely fresh round.
    resetRoundState();
    beginRound();
}

function showConfetti() {
    const colors = ['#ffc907', '#2e9df7', '#4fcb53', '#ff902a', '#f16061'];

    // Confetti is decorative, short-lived, and never captures pointer or keyboard input.
    for (let index = 0; index < 36; index += 1) {
        const piece = document.createElement('span');
        piece.className = 'confetti';
        piece.setAttribute('aria-hidden', 'true');
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.backgroundColor = colors[index % colors.length];
        piece.style.animationDelay = `${Math.random() * 0.5}s`;
        document.body.append(piece);
        piece.addEventListener('animationend', () => piece.remove());
    }
}

async function shareScore() {
    // window.location.href becomes the published game URL when this game is deployed.
    const gameUrl = window.location.href;
    const shareText = `I scored ${score} points in Catch the Clean Water! Play here: ${gameUrl}`;
    shareMessage.textContent = '';

    try {
        if (navigator.share) {
            await navigator.share({ title: 'Catch the Clean Water', text: shareText });
            shareMessage.textContent = 'Thanks for sharing the clean water mission!';
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            shareMessage.textContent = 'Your score was copied. Share it with your community!';
        } else {
            shareMessage.textContent = 'Sharing is not available in this browser.';
        }
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            shareMessage.textContent = 'Share canceled.';
        } else {
            // Keep sharing failures visible without interrupting the game.
            console.error('Sharing failed:', error);
            shareMessage.textContent = 'We could not share your score. Please try again.';
        }
    }
}

startButton.addEventListener('click', startGame);
replayButton.addEventListener('click', restartGame);
resetButton.addEventListener('click', restartGame);
shareButton.addEventListener('click', shareScore);

// The start screen is the first view until the player starts a round.
showScreen(startScreen);
updateDisplay();
