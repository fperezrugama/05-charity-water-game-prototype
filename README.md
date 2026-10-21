# Catch the Clean Water

Catch the Clean Water is a responsive, DOM-based game inspired by charity: water's clean water mission. It uses separate HTML, CSS, and vanilla JavaScript files.

## How to play

- Start a 30-second round.
- Click blue clean water drops for **+1 point**.
- Avoid brown polluted drops. Clicking one costs **2 points**, but the score never goes below zero.
- Reach 20 points before the timer ends to win.
- Reach 10 and 15 points to see milestone feedback.
- Use Reset to clear the round, Replay to start another round, and Share my score to share your result.

Winning also displays celebratory confetti and updates the community-goal drop count.

## Manual test steps

1. Open `index.html` in a browser.
2. Select **Start game** and confirm the timer counts down from 30 seconds.
3. Click a blue drop and confirm the score increases by one.
4. Click a brown polluted drop and confirm the score decreases by two, never below zero.
5. Catch enough blue drops to confirm feedback appears at 10 and 15 points.
6. Reach 20 points before the timer ends and confirm the win message and confetti appear.
7. Let the timer reach zero without reaching 20 and confirm the loss message appears.
8. Select **Reset** during or after a round and confirm the score, timer, drops, and result panel reset.
9. Select **Replay** after a round and confirm a fresh 30-second round begins.
10. Select **Share my score** and confirm the browser share dialog or clipboard fallback works.
