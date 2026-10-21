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
    clearInterval(timerId);
    clearInterval(dropId);
}

function clearDrops() {
    // Remove every drop and forget it when a round ends or is reset.
    dropLayer.replaceChildren();
    activeDrops.clear();
}

function showScreen(screenToShow) {
    startScreen.hidden = screenToShow !== startScreen;
    gameplayScreen.hidden = screenToShow !== gameplayScreen;
}

function resetGame() {
    clearGameTimers();
    clearDrops();
    score = 0;
    timeRemaining = roundLength;
    isPlaying = false;
    milestones = {
        tenPoints: false,
        fifteenPoints: false
    };
    startButton.disabled = false;
    startButton.textContent = 'Start game';
    resultPanel.hidden = true;
    shareMessage.textContent = '';
    showScreen(startScreen);
    updateDisplay();
    showFeedback('Press start when you are ready.');
}

function finishGame(playerWon) {
    clearGameTimers();
    clearDrops();
    isPlaying = false;
    startButton.disabled = false;
    finalScoreText.textContent = score;

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

    resultPanel.hidden = false;
}

function updateScore(points) {
    // Change the score in one place and update the visible number immediately.
    score = Math.max(0, score + points);
    updateDisplay();

    if (score >= winningScore) {
        finishGame(true);
    } else if (score >= 15 && !milestones.fifteenPoints) {
        milestones.fifteenPoints = true;
        showFeedback('Amazing! 15 points - you are almost there!');
    } else if (score >= 10 && !milestones.tenPoints) {
        milestones.tenPoints = true;
        showFeedback('Great job! You reached 10 points!');
    }
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

    resetGame();
    isPlaying = true;
    showScreen(gameplayScreen);
    startButton.disabled = true;
    resultPanel.hidden = true;
    showFeedback('Go! Catch the clean water drops.');
    createDrop();
    dropId = setInterval(createDrop, 800);
    timerId = setInterval(() => {
        timeRemaining -= 1;
        updateDisplay();
        if (timeRemaining <= 0) {
            finishGame(score >= winningScore);
        }
    }, 1000);
}

function showConfetti() {
    const colors = ['#ffc907', '#2e9df7', '#4fcb53', '#ff902a', '#f16061'];

    for (let index = 0; index < 36; index += 1) {
        const piece = document.createElement('span');
        piece.className = 'confetti';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.backgroundColor = colors[index % colors.length];
        piece.style.animationDelay = `${Math.random() * 0.5}s`;
        document.body.append(piece);
        piece.addEventListener('animationend', () => piece.remove());
    }
}

async function shareScore() {
    const shareText = `I caught ${score} clean water points in Catch the Clean Water!`;
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
            console.error('Sharing failed:', error);
            shareMessage.textContent = 'We could not share your score. Please try again.';
        }
    }
}

startButton.addEventListener('click', startGame);
replayButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
shareButton.addEventListener('click', shareScore);

// The start screen is the first view until the player starts a round.
showScreen(startScreen);
updateDisplay();
