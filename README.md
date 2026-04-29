# UNO Online
A browser-based multiplayer version of the popular card game UNO, supporting real-time online play and singleplayer matches against bots.

## Live Demo
 https://uno.thlab.dev

 <img src="/images/UNO_Online_homepage.png" alt="Homepage" width="500">

## How to Play
1. Open the live demo
2. Create or join a lobby using a code
3. Add bots or wait for players
4. Start the game!

## Installation
Development and testing were performed using Node.js v24.14. Compatibility with older versions is not guaranteed.

```bash
# Clone repository
git clone https://github.com/thjaed/online-uno-match.git
# Install dependencies
npm install
# Build
npm run build
# Start
npm run start
```
The web server is on port 8080.

## Features
- Responsive UI for mobile and desktop, in portrait or landscape mode.
- Easily join lobbies with a game code.
- Singleplayer and Multiplayer support as players can add bots to their game.
- 'Call UNO' button, which means players receive a penalty if they do not call UNO.
- Draw card stacking - +2 and +4 cards stack
- Play with up to 10 players
- No accounts needed

 
### Use of AI generated code
 AI was used for some async code and for help with CSS.