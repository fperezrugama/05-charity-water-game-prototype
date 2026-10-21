// Catch the Clean Water uses regular HTML buttons instead of a game library.
// This keeps the game simple and makes it usable with a keyboard and screen reader.

const gameBoard = document.querySelector('#game-board');
const dropLayer = document.querySelector('#drop-layer');
const scoreText = document.querySelector('#score');
const timerText = document.querySelector('#timer');
const communityScoreText = document.querySelector('#community-score');
const feedbackText = document.querySelector('#feedback');
const startButton = document.querySelector('#start-button');
const resetButton = document.querySelector('#reset-button');
const replayButton = document.querySelector('#replay-button');
const shareButton = document.querySelector('#share-button');
const resultPanel = document.querySelector('#result-panel');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');
const shareMessage = document.querySelector('#share-message');

const roundLength = 30;
const winningScore = 20;
let score = 0;
let timeLeft = roundLength;
let communityScore = 0;
let gameIsRunning = false;
let timerId;
let dropId;

function updateDisplay() {
    scoreText.textContent = score;
    timerText.textContent = timeLeft;
    communityScoreText.textContent = communityScore;
}

function setFeedback(message) {
    feedbackText.textContent = message;
}

function clearGameTimers() {
    clearInterval(timerId);
    clearInterval(dropId);
}

function clearDrops() {
    dropLayer.replaceChildren();
}

function resetGame() {
    clearGameTimers();
    clearDrops();
    score = 0;
    timeLeft = roundLength;
    gameIsRunning = false;
    startButton.disabled = false;
    startButton.textContent = 'Start game';
    resultPanel.hidden = true;
    shareMessage.textContent = '';
    updateDisplay();
    setFeedback('Press start when you are ready.');
}

function finishGame(playerWon) {
    clearGameTimers();
    clearDrops();
    gameIsRunning = false;
    startButton.disabled = false;

    if (playerWon) {
        resultTitle.textContent = 'You brought clean water closer!';
        resultMessage.textContent = `You scored ${score} points and reached the community goal. Great work!`;
        setFeedback('Clean water win!');
        showConfetti();
    } else {
        resultTitle.textContent = 'Time is up!';
        resultMessage.textContent = `You scored ${score} points. Try again to reach ${winningScore}.`;
        setFeedback('Every drop still counts. Give it another try!');
    }

    resultPanel.hidden = false;
}

function changeScore(points) {
    // Math.max keeps the score from ever dropping below zero.
    score = Math.max(0, score + points);
    updateDisplay();

    if (score >= winningScore) {
        finishGame(true);
    } else if (score >= 15) {
        setFeedback('Amazing! 15 points - you are almost there!');
    } else if (score >= 10) {
        setFeedback('Great job! You reached 10 points!');
    }
}

function catchDrop(drop, isPolluted) {
    if (!gameIsRunning) {
        return;
    }

    drop.remove();
    if (isPolluted) {
        changeScore(-2);
        setFeedback('Polluted drop! -2 points. Keep going!');
    } else {
        communityScore += 1;
        changeScore(1);
        updateDisplay();
        if (score < 10) {
            setFeedback('+1 clean water point!');
        }
    }
}

function createDrop() {
    if (!gameIsRunning) {
        return;
    }

    const isPolluted = Math.random() < 0.25;
    const drop = document.createElement('button');
    const horizontalPosition = Math.random() * 82 + 5;
    drop.className = isPolluted ? 'drop polluted' : 'drop';
    drop.type = 'button';
    drop.style.left = `${horizontalPosition}%`;
    drop.setAttribute('aria-label', isPolluted ? 'Polluted drop, avoid' : 'Clean water drop, catch');
    drop.textContent = isPolluted ? '🟤' : '💧';
    drop.addEventListener('click', () => catchDrop(drop, isPolluted));
    drop.addEventListener('animationend', () => drop.remove());
    dropLayer.append(drop);
}

function startGame() {
    resetGame();
    gameIsRunning = true;
    startButton.disabled = true;
    resultPanel.hidden = true;
    setFeedback('Go! Catch the clean water drops.');
    createDrop();
    dropId = setInterval(createDrop, 800);
    timerId = setInterval(() => {
        timeLeft -= 1;
        updateDisplay();
        if (timeLeft <= 0) {
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

updateDisplay();
