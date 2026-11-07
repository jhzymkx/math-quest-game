(() => {
  const ui = {
    game: document.getElementById("game"),
    startScreen: document.getElementById("start-screen"),
    resultScreen: document.getElementById("result-screen"),
    startButton: document.getElementById("start-button"),
    restartButton: document.getElementById("restart-button"),
    score: document.getElementById("score"),
    finalScore: document.getElementById("final-score"),
    levelName: document.getElementById("level-name"),
    equation: document.getElementById("equation"),
    hint: document.getElementById("hint"),
    progress: document.getElementById("progress"),
    feedback: document.getElementById("feedback")
  };

  ui.startButton.addEventListener("click", () => {
    if (!window.Phaser) {
      ui.feedback.textContent = "Phaser 尚未載入，正在重新連線…";
      const retry = document.createElement("script");
      retry.src = "https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.min.js";
      retry.onload = () => window.location.reload();
      retry.onerror = () => { ui.feedback.textContent = "連線失敗，請確認網路後重新整理。"; };
      document.head.appendChild(retry);
      return;
    }
    if (window.mathGameScene) window.mathGameScene.beginGame();
    else window.mathGameStartRequested = true;
  });
  ui.restartButton.addEventListener("click", () => {
    if (window.mathGameScene) window.mathGameScene.restartGame();
  });
  const levels = [
    { place: "森林營地", success: "太好了！小狐狸找到森林出口！", theme: { sky: 0xdff5e9, ground: 0xb8e4b8, hill: 0x8fcf9b, platform: 0x6db78c, accent: 0x31966e, sparkle: 0xffd76f } },
    { place: "雲朵坡道", success: "答對了！乘上雲朵繼續前進！", theme: { sky: 0xe7f1ff, ground: 0xc8daf7, hill: 0xa9c3ec, platform: 0x8da9e5, accent: 0x667fd1, sparkle: 0xffd981 } },
    { place: "海底珊瑚", success: "答對了！海底寶箱正在發光！", theme: { sky: 0xdaf6f5, ground: 0x9bdcda, hill: 0x72c8c9, platform: 0x52b2b6, accent: 0x218e9a, sparkle: 0xffe17a } },
    { place: "星星基地", success: "算對了！星際飛船準備起飛！", theme: { sky: 0x1a2b55, ground: 0x263b69, hill: 0x354b7c, platform: 0x5367a0, accent: 0x9a8dea, sparkle: 0xffd76f } },
    { place: "彩虹城堡", success: "漂亮！彩虹城堡的大門打開了！", theme: { sky: 0xfff1dc, ground: 0xc0e7bd, hill: 0x95d2a0, platform: 0x7bc39a, accent: 0x599bc0, sparkle: 0xf6be52 } }
  ];

  const seenQuestions = levels.map(() => new Set());

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(values) {
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = randomInt(0, i);
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  function createQuestion(stageIndex) {
    let question;
    let attempts = 0;
    do {
      let a;
      let b;
      let answer;
      let equation;
      let hint;

      if (stageIndex === 0) {
        a = randomInt(2, 9);
        b = randomInt(2, 9);
        answer = a + b;
        equation = a + " + " + b + " = ?";
        hint = "提示：從 " + a + " 開始，往前數 " + b + " 格。";
      } else if (stageIndex === 1) {
        a = randomInt(12, 30);
        b = randomInt(2, Math.min(12, a - 1));
        answer = a - b;
        equation = a + " − " + b + " = ?";
        hint = "提示：從 " + a + " 往回數 " + b + " 格。";
      } else if (stageIndex === 2) {
        a = randomInt(2, 9);
        b = randomInt(2, 9);
        answer = a * b;
        equation = a + " × " + b + " = ?";
        hint = "提示：把 " + b + " 個 " + a + " 加起來。";
      } else if (stageIndex === 3) {
        b = randomInt(2, 9);
        answer = randomInt(2, 12);
        a = b * answer;
        equation = a + " ÷ " + b + " = ?";
        hint = "提示：把 " + a + " 平分成 " + b + " 份。";
      } else {
        a = randomInt(23, 58);
        b = randomInt(12, 39);
        answer = a + b;
        equation = a + " + " + b + " = ?";
        hint = "提示：先加個位數，再加十位數。";
      }

      const distractors = new Set();
      const spread = Math.max(6, Math.ceil(answer * 0.2));
      while (distractors.size < 3) {
        const offset = randomInt(1, spread) * (Math.random() < 0.5 ? -1 : 1);
        const candidate = answer + offset;
        if (candidate >= 0 && candidate !== answer) distractors.add(candidate);
      }
      question = { equation, answer, hint, options: shuffle([answer, ...distractors]) };
      attempts += 1;
    } while (seenQuestions[stageIndex].has(question.equation) && attempts < 100);

    seenQuestions[stageIndex].add(question.equation);
    if (seenQuestions[stageIndex].size > 500) seenQuestions[stageIndex].clear();
    return question;
  }

  window.mathGameControls = { up: false, down: false, left: false, right: false };
  window.mathGameStartRequested = false;

  document.querySelectorAll("[data-direction]").forEach((button) => {
    const direction = button.dataset.direction;
    const release = () => { window.mathGameControls[direction] = false; };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      window.mathGameControls[direction] = true;
      if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  });

  if (!window.Phaser) {
    ui.game.innerHTML = '<div class="load-error"><div><strong>遊戲程式載入中斷</strong><br>請確認網路連線後重新整理，Phaser 遊戲引擎才能啟動。</div></div>';
    return;
  }

  class AdventureScene extends Phaser.Scene {
    constructor() {
      super("AdventureScene");
      this.levelIndex = 0;
      this.score = 0;
      this.optionObjects = [];
      this.answerLocked = true;
      this.gameStarted = false;
      this.finished = false;
    }

    create() {
      window.mathGameScene = this;
      this.boardWidth = 960;
      this.boardHeight = 540;
      this.physics.world.setBounds(20, 16, this.boardWidth - 40, this.boardHeight - 32);
      this.makeTextures();

      this.backgroundGraphics = this.add.graphics();
      this.drawArena(levels[0]);

      this.player = this.physics.add.image(this.boardWidth / 2, this.boardHeight * 0.84, "fox");
      this.player.setScale(0.88);
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(40, 46, true);
      this.player.setDepth(5);

      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys("W,A,S,D");

      const startWasRequested = window.mathGameStartRequested;
      this.setScore(0);
      ui.feedback.textContent = "碰到你認為正確的答案，開始闖關！";
      if (startWasRequested) this.beginGame();
    }

    makeTextures() {
      const fox = this.make.graphics({ x: 0, y: 0, add: false });
      fox.fillStyle(0xe8914e, 1);
      fox.fillTriangle(10, 25, 8, 2, 26, 15);
      fox.fillTriangle(38, 15, 57, 2, 54, 27);
      fox.fillStyle(0xffdfb2, 1);
      fox.fillTriangle(14, 17, 13, 7, 22, 16);
      fox.fillTriangle(43, 16, 52, 7, 50, 18);
      fox.fillStyle(0xe8914e, 1);
      fox.fillCircle(32, 31, 23);
      fox.fillStyle(0xfff3dc, 1);
      fox.fillEllipse(32, 39, 27, 18);
      fox.fillStyle(0x183b3d, 1);
      fox.fillCircle(24, 30, 2.8);
      fox.fillCircle(40, 30, 2.8);
      fox.fillStyle(0x693c32, 1);
      fox.fillTriangle(29, 37, 35, 37, 32, 41);
      fox.fillStyle(0xffca71, 1);
      fox.fillRoundedRect(17, 51, 30, 21, 9);
      fox.fillStyle(0xfff1c6, 1);
      fox.fillCircle(32, 56, 3);
      fox.generateTexture("fox", 64, 76);
      fox.destroy();

      const orb = this.make.graphics({ x: 0, y: 0, add: false });
      orb.fillStyle(0xffffff, 0.35);
      orb.fillCircle(48, 48, 43);
      orb.fillStyle(0xffffff, 0.96);
      orb.fillCircle(48, 48, 34);
      orb.fillStyle(0xffffff, 0.75);
      orb.fillCircle(37, 34, 10);
      orb.generateTexture("answer-orb", 96, 96);
      orb.destroy();
    }

    drawArena(level) {
      const g = this.backgroundGraphics;
      const t = level.theme;
      const w = this.boardWidth;
      const h = this.boardHeight;
      g.clear();
      g.fillStyle(t.sky, 1);
      g.fillRect(0, 0, w, h);
      g.fillStyle(t.ground, 1);
      g.fillRect(0, h * 0.74, w, h * 0.26);
      g.fillStyle(t.hill, 0.55);
      g.fillCircle(75, h * 0.91, 118);
      g.fillCircle(w - 35, h * 0.93, 155);
      g.fillCircle(w * 0.5, h * 1.08, 190);

      if (this.levelIndex === 3) {
        g.fillStyle(0xffffff, 0.88);
        [[90, 74, 3], [206, 131, 2], [386, 57, 3], [560, 103, 2], [735, 58, 3], [866, 150, 2], [680, 210, 2]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
        g.fillStyle(t.accent, 0.26);
        for (let i = 0; i < 6; i += 1) g.fillCircle(150 + i * 140, 490 + (i % 2) * 12, 48);
      } else {
        g.fillStyle(0xffffff, 0.46);
        [[100, 82], [820, 88], [710, 174]].forEach(([x, y]) => {
          g.fillCircle(x, y, 22);
          g.fillCircle(x + 24, y - 8, 28);
          g.fillCircle(x + 52, y, 20);
          g.fillRoundedRect(x - 1, y, 56, 21, 10);
        });
        g.fillStyle(t.accent, 0.18);
        for (let i = 0; i < 8; i += 1) g.fillCircle(55 + i * 122, h * 0.82 + (i % 2) * 19, 6 + (i % 3) * 2);
      }

      const positions = this.getOptionPositions();
      positions.forEach(([x, y], index) => {
        g.fillStyle(0x214d43, 0.10);
        g.fillRoundedRect(x - 82, y + 32, 164, 19, 10);
        g.fillStyle(t.platform, 0.92);
        g.fillRoundedRect(x - 77, y + 25, 154, 16, 8);
        g.fillStyle(0xffffff, 0.55);
        g.fillRoundedRect(x - 49, y + 28, 48, 4, 2);
        if (this.levelIndex !== 3) {
          g.fillStyle(index % 2 ? t.sparkle : t.accent, 0.55);
          g.fillCircle(x - 87, y + 17, 4);
          g.fillCircle(x + 88, y + 18, 4);
        }
      });
    }

    getOptionPositions() {
      const w = this.boardWidth;
      const h = this.boardHeight;
      return [[w * 0.21, h * 0.31], [w * 0.79, h * 0.31], [w * 0.21, h * 0.63], [w * 0.79, h * 0.63]];
    }

    beginGame() {
      if (this.gameStarted || this.finished) return;
      this.gameStarted = true;
      window.mathGameStartRequested = false;
      ui.startScreen.hidden = true;
      ui.feedback.textContent = "用方向鍵或 WASD 移動小狐狸。";
      this.levelIndex = 0;
      this.setScore(0);
      this.setupLevel();
    }

    restartGame() {
      ui.resultScreen.hidden = true;
      ui.startScreen.hidden = true;
      this.finished = false;
      this.gameStarted = true;
      this.levelIndex = 0;
      this.clearOptions();
      this.player.clearTint();
      this.setScore(0);
      this.setupLevel();
    }

    setupLevel() {
      const level = levels[this.levelIndex];
      this.currentQuestion = createQuestion(this.levelIndex);
      this.answerLocked = false;
      this.drawArena(level);
      this.player.setPosition(this.boardWidth / 2, this.boardHeight * 0.84);
      this.player.setVelocity(0, 0);
      this.player.clearTint();
      this.updateHud();
      ui.feedback.textContent = "新題目出爐！找到正確答案，前往下一關！";
      this.spawnOptions(this.currentQuestion);
    }

    updateHud() {
      const level = levels[this.levelIndex];
      const question = this.currentQuestion;
      const chineseNumbers = ["一", "二", "三", "四", "五"];
      ui.levelName.textContent = "第" + chineseNumbers[this.levelIndex] + "關 · " + level.place;
      ui.equation.textContent = question.equation;
      ui.hint.textContent = question.hint;
      ui.progress.setAttribute("aria-valuenow", String(this.levelIndex));
      Array.from(ui.progress.children).forEach((step, index) => {
        step.classList.toggle("is-done", index < this.levelIndex);
        step.classList.toggle("is-current", index === this.levelIndex);
      });
    }

    setScore(value) {
      this.score = value;
      ui.score.textContent = String(this.score);
    }

    spawnOptions(question) {
      this.clearOptions();
      const positions = this.getOptionPositions();
      const values = question.options.slice();

      const colors = [0xfbd274, 0x9ad9c0, 0x91c6ec, 0xf3a99c];
      values.forEach((value, index) => {
        const [x, y] = positions[index];
        const sprite = this.physics.add.image(x, y, "answer-orb");
        sprite.setScale(0.86);
        sprite.setTint(colors[index]);
        sprite.setImmovable(true);
        sprite.body.setAllowGravity(false);
        sprite.setDepth(3);
        const label = this.add.text(x, y, String(value), {
          fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
          fontSize: "30px",
          fontStyle: "bold",
          color: "#173a3a",
          stroke: "#ffffff",
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(4);
        const option = { value, sprite, label, collider: null };
        sprite.setData("option", option);
        option.collider = this.physics.add.overlap(this.player, sprite, () => this.selectOption(option), undefined, this);
        this.optionObjects.push(option);
        this.tweens.add({ targets: [sprite, label], y: y - 6, duration: 950 + index * 70, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      });
    }

    clearOptions() {
      this.optionObjects.forEach((option) => {
        if (option.collider) option.collider.destroy();
        if (option.sprite && option.sprite.active) option.sprite.destroy();
        if (option.label && option.label.active) option.label.destroy();
      });
      this.optionObjects = [];
    }

    selectOption(option) {
      if (this.answerLocked || !option.sprite.active) return;
      this.answerLocked = true;
      this.player.setVelocity(0, 0);

      if (option.value === this.currentQuestion.answer) {
        this.setScore(this.score + 10);
        ui.feedback.textContent = levels[this.levelIndex].success + " +10 分";
        this.clearOptions();
        this.player.setTint(0xffd76f);
        this.time.delayedCall(850, () => {
          this.player.clearTint();
          if (this.levelIndex === levels.length - 1) {
            this.finishGame();
          } else {
            this.levelIndex += 1;
            this.setupLevel();
          }
        });
      } else {
        this.setScore(this.score - 5);
        ui.feedback.textContent = "這個數字不對喔，−5 分，再試一次！";
        this.clearOptions();
        this.player.setTint(0xf4aaa0);
        this.time.delayedCall(700, () => {
          this.player.clearTint();
          this.player.setPosition(this.boardWidth / 2, this.boardHeight * 0.84);
          this.spawnOptions(this.currentQuestion);
          this.answerLocked = false;
        });
      }
    }

    finishGame() {
      this.finished = true;
      this.gameStarted = false;
      this.answerLocked = true;
      ui.progress.setAttribute("aria-valuenow", "5");
      Array.from(ui.progress.children).forEach((step) => {
        step.classList.add("is-done");
        step.classList.remove("is-current");
      });
      ui.finalScore.textContent = String(this.score);
      ui.resultScreen.hidden = false;
      ui.feedback.textContent = "五關完成！你是數學小高手！";
    }

    update() {
      if (!this.gameStarted || this.finished || this.answerLocked) return;
      const left = this.cursors.left.isDown || this.wasd.A.isDown || window.mathGameControls.left;
      const right = this.cursors.right.isDown || this.wasd.D.isDown || window.mathGameControls.right;
      const up = this.cursors.up.isDown || this.wasd.W.isDown || window.mathGameControls.up;
      const down = this.cursors.down.isDown || this.wasd.S.isDown || window.mathGameControls.down;
      const velocity = new Phaser.Math.Vector2((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
      if (velocity.lengthSq() > 0) velocity.normalize().scale(245);
      this.player.setVelocity(velocity.x, velocity.y);
    }
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: 960,
    height: 540,
    backgroundColor: "#dff5e9",
    physics: { default: "arcade", arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 960, height: 540 },
    scene: [AdventureScene]
  });
})();




