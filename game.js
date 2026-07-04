// Simple balloon popping game for teaching past-time indicators.
// Touch and mouse friendly.
// Save as game.js and open index.html

(() => {
  // Config
  const correctWords = [
    "ago",
    "last",
    "yesterday",
    "in the past",
    "once upon a time"
  ];
  const wrongWords = [
    "next",
    "always",
    "usually",
    "now"
  ];

  const gameArea = document.getElementById('gameArea');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const levelEl = document.getElementById('level');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const messageEl = document.getElementById('message');

  let score = 0, lives = 3, level = 1;
  let spawnInterval = 1500; // ms
  let spawnTimer = null;
  let running = false;
  let balloonId = 0;
  let maxActive = 8;
  let activeBalloons = new Set();

  function updateHUD(){
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    levelEl.textContent = level;
  }

  function showMessage(text, timeout = 1400){
    messageEl.textContent = text;
    messageEl.style.display = 'block';
    setTimeout(()=> { messageEl.style.display = 'none'; }, timeout);
  }

  function rand(min,max){ return Math.random()*(max-min)+min }
  function choose(arr){ return arr[Math.floor(Math.random()*arr.length)] }

  function spawnBalloon(){
    if (!running) return;
    if (activeBalloons.size >= maxActive) return;

    balloonId++;
    const id = 'b'+balloonId;
    const isCorrect = Math.random() < 0.6; // ~60% are correct for practice
    const word = isCorrect ? choose(correctWords) : choose(wrongWords);
    const el = document.createElement('div');
    el.className = 'balloon c' + (Math.floor(Math.random()*3)+1);
    el.id = id;
    el.setAttribute('data-word', word);
    el.setAttribute('data-correct', !!isCorrect);
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.innerHTML = `<span class="label">${word}</span>`;
    el.style.left = Math.max(8, Math.min(gameArea.clientWidth - 120, rand(8, gameArea.clientWidth - 120))) + 'px';

    // random start bottom offset
    el.style.bottom = '-160px';
    // random float duration dependent on level (faster as level grows)
    const baseSpeed = Math.max(7 - level*0.6, 3.5); // seconds to cross
    const duration = rand(baseSpeed*0.9, baseSpeed*1.3);

    // animation using CSS keyframes: transform translateY up.
    el.style.animation = `floatUp ${duration}s linear forwards`;
    el.style.zIndex = 100 + Math.floor(rand(0,20));
    gameArea.appendChild(el);
    activeBalloons.add(id);

    // pop on click/tap/space/enter
    function popHandler(e){
      // prevent double activation
      if (!el.parentElement) return;
      e && e.preventDefault && e.preventDefault();
      popBalloon(el, true);
    }
    el.addEventListener('click', popHandler, {passive:false});
    el.addEventListener('touchstart', popHandler, {passive:false});
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); popHandler(ev); }
    });

    // when animation ends (reached top), remove and penalize if correct left
    el.addEventListener('animationend', () => {
      if (!el.parentElement) return;
      // popped via code? if still present, treat as missed
      const wasCorrect = el.getAttribute('data-correct') === 'true';
      if (wasCorrect){
        // missed correct balloon -> lose a life
        lives = Math.max(0, lives - 1);
        showMessage('Missed a past-time word!', 1100);
        updateHUD();
        checkGameOver();
      }
      removeBalloon(el);
    });

    // small entrance pop sound (optional)
  }

  function removeBalloon(el){
    if (!el) return;
    const id = el.id;
    if (activeBalloons.has(id)) activeBalloons.delete(id);
    if (el.parentElement) el.parentElement.removeChild(el);
  }

  function popBalloon(el, byPlayer){
    if (!el) return;
    const isCorrect = el.getAttribute('data-correct') === 'true';
    // visual pop
    el.classList.add('pop');
    // disable pointer
    el.style.pointerEvents = 'none';
    // small delay to remove
    setTimeout(() => removeBalloon(el), 260);

    if (byPlayer){
      if (isCorrect){
        score += 10;
        showMessage('+10! Good job!', 900);
      } else {
        // popped wrong -> lose a life
        lives = Math.max(0, lives - 1);
        showMessage('Oops — that is not past tense!', 1000);
      }
      updateHUD();
      checkGameOver();
      maybeLevelUp();
    } else {
      // popped by system (not used)
    }
  }

  function maybeLevelUp(){
    // level up every 50 points
    const newLevel = Math.floor(score / 50) + 1;
    if (newLevel > level){
      level = newLevel;
      // increase difficulty
      spawnInterval = Math.max(500, spawnInterval - 120);
      maxActive = Math.min(14, maxActive + 1);
      showMessage('Level up! Level ' + level, 1200);
      updateHUD();
      restartSpawner();
    }
  }

  function checkGameOver(){
    if (lives <= 0){
      endGame();
    }
  }

  function startGame(){
    if (running) return;
    running = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    showMessage('Go! Pop the past-time words!', 1000);
    restartSpawner();
  }

  function restartSpawner(){
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnBalloon, spawnInterval);
  }

  function pauseGame(){
    if (!running) return;
    running = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    // pause animations by setting computed top positions and removing animation
    document.querySelectorAll('.balloon').forEach(el=>{
      const style = getComputedStyle(el);
      const matrix = style.transform;
      // approximate: remove animation and freeze
      const computedTop = style.bottom;
      el.style.animationPlayState = 'paused';
      el.style.animation = 'none';
      // keep it visually where it was by switching to transform translateY - but to keep it simple, we leave paused
    });
    showMessage('Paused', 700);
  }

  function resetGame(){
    running = false;
    if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    // remove balloons
    document.querySelectorAll('.balloon').forEach(el => el.remove());
    activeBalloons.clear();
    score = 0; lives = 3; level = 1;
    spawnInterval = 1500; maxActive = 8;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    updateHUD();
    showMessage('Ready!', 700);
  }

  function endGame(){
    running = false;
    if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    // disable further popping
    document.querySelectorAll('.balloon').forEach(el=>{
      el.style.pointerEvents = 'none';
    });
    showMessage('Game Over! Score: ' + score, 3000);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  // UI events
  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', pauseGame);
  resetBtn.addEventListener('click', resetGame);

  // keyboard quick controls
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p') {
      if (running) pauseGame(); else startGame();
    } else if (e.key === 'r') {
      resetGame();
    }
  });

  // initial state
  updateHUD();
  pauseBtn.disabled = true;
  resetBtn.disabled = false;

  // small tip: spawn a few warm-up balloons when pressing Start quickly
  // but we rely on spawnBalloon interval.

})();