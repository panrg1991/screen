const { GameLogic } = require('../../utils/game.js');
const Render3D = require('../../utils/render.js');
const audioManager = require('../../utils/audio.js');

const app = getApp();

Page({
  data: {
    level: 1,
    difficulty: 'easy',
    difficultyName: '简单',
    score: 0,
    combo: 0,
    currentLayer: 0,
    targetLayers: 10,
    perfectCount: 0,
    progress: 0,
    bestScore: 0,
    showPerfect: false,
    showGameOver: false,
    showLevelComplete: false,
    isNewBest: false
  },

  onLoad(options) {
    const { difficulty = 'easy', level = '1' } = options;
    const difficultyNames = { easy: '简单', normal: '容易', hard: '困难' };

    this.difficulty = difficulty;
    this.level = parseInt(level);

    // 加载最高分
    const bestScores = wx.getStorageSync('bestScores') || {};
    const best = (bestScores[difficulty] && bestScores[difficulty][`level${level}`]) || 0;

    this.setData({
      level: this.level,
      difficulty,
      difficultyName: difficultyNames[difficulty],
      bestScore: best
    });

    // 初始化游戏逻辑
    this.gameLogic = new GameLogic(difficulty, this.level);
    this.gameState = null;
    this.animFrame = null;
    this.perfectTimer = null;

    // 初始化音频
    this.initAudio();
  },

  onReady() {
    this.initCanvas();
  },

  onUnload() {
    this.stopGameLoop();
    this.destroyAudio();
  },

  /**
   * 初始化画布
   */
  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return;

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio || 2;

        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.canvas = canvas;
        this.ctx = ctx;
        this.canvasWidth = res[0].width;
        this.canvasHeight = res[0].height;

        // 初始化 3D 渲染器
        this.render3D = new Render3D(ctx, res[0].width, res[0].height);

        // 开始游戏循环
        this.startGameLoop();
      });
  },

  /**
   * 开始游戏主循环
   */
  startGameLoop() {
    this.stopGameLoop();
    this.gameRunning = true;

    const loop = () => {
      if (!this.gameRunning) return;

      // 更新游戏逻辑
      this.gameLogic.update();

      // 获取游戏状态
      this.gameState = this.gameLogic.getState();

      // 渲染
      this.render();

      // 继续循环
      this.animFrame = this.canvas.requestAnimationFrame(loop);
    };

    loop();
  },

  /**
   * 停止游戏循环
   */
  stopGameLoop() {
    this.gameRunning = false;
    if (this.animFrame && this.canvas) {
      this.canvas.cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  },

  /**
   * 渲染画面
   */
  render() {
    if (!this.gameState || !this.render3D) return;

    const { blocks, moveOffset, score, combo, gameOver, levelComplete } = this.gameState;

    // 绘制 3D 场景
    this.render3D.drawTower(blocks, {
      x: this.gameState.currentX,
      y: blocks.length > 0 ? blocks[blocks.length - 1].y + blocks[blocks.length - 1].height : 0,
      z: 0,
      width: this.gameState.currentWidth,
      depth: this.gameState.currentDepth,
      height: this.gameLogic.config.blockHeight,
      colorIdx: blocks.length % 12
    }, moveOffset);
  },

  /**
   * 处理点击 - 放置积木
   */
  onTap() {
    if (!this.gameLogic || this.data.showGameOver || this.data.showLevelComplete) return;

    const result = this.gameLogic.placeBlock();

    if (!result) return;

    if (result.gameOver) {
      // 游戏结束
      this.onGameOver();
      return;
    }

    // 播放音效
    this.playPlaceSound(result.perfect);

    // 更新 UI
    const state = this.gameLogic.getState();
    const progress = Math.min(100, (state.currentLayer / state.targetLayers) * 100);

    this.setData({
      score: state.score,
      combo: state.combo,
      currentLayer: state.currentLayer,
      perfectCount: state.perfectCount,
      progress: progress.toFixed(0)
    });

    // 完美对齐特效
    if (result.perfect) {
      this.showPerfectEffect();
    }

    // 检查通关
    if (state.levelComplete) {
      this.onLevelComplete();
    }
  },

  /**
   * 显示完美对齐特效
   */
  showPerfectEffect() {
    this.setData({ showPerfect: true });

    if (this.perfectTimer) clearTimeout(this.perfectTimer);
    this.perfectTimer = setTimeout(() => {
      this.setData({ showPerfect: false });
    }, 600);
  },

  /**
   * 游戏结束处理
   */
  onGameOver() {
    this.stopGameLoop();

    const state = this.gameLogic.getState();
    const { score, combo, perfectCount, currentLayer } = state;

    const bestScores = wx.getStorageSync('bestScores') || {
      easy: { level1: 0, level2: 0, level3: 0 },
      normal: { level1: 0, level2: 0, level3: 0 },
      hard: { level1: 0, level2: 0, level3: 0 }
    };

    const key = `level${this.level}`;
    const best = bestScores[this.difficulty][key] || 0;
    const isNewBest = score > best;

    if (isNewBest) {
      bestScores[this.difficulty][key] = score;
      wx.setStorageSync('bestScores', bestScores);
    }

    this.playGameOverSound();

    // 跳转到结果页面
    wx.redirectTo({
      url: `/pages/result/result?isWin=false&level=${this.level}&difficulty=${this.difficulty}&score=${score}&combo=${combo}&perfectCount=${perfectCount}&currentLayer=${currentLayer}&isNewBest=${isNewBest}`
    });
  },

  /**
   * 通关处理
   */
  onLevelComplete() {
    this.stopGameLoop();

    const state = this.gameLogic.getState();
    const { score, perfectCount, combo, currentLayer } = state;

    const bestScores = wx.getStorageSync('bestScores') || {
      easy: { level1: 0, level2: 0, level3: 0 },
      normal: { level1: 0, level2: 0, level3: 0 },
      hard: { level1: 0, level2: 0, level3: 0 }
    };

    const key = `level${this.level}`;
    const best = bestScores[this.difficulty][key] || 0;
    const isNewBest = score > best;

    if (isNewBest) {
      bestScores[this.difficulty][key] = score;
      wx.setStorageSync('bestScores', bestScores);
    }

    // 解锁下一关
    if (this.level < 3) {
      const unlockedLevels = wx.getStorageSync('unlockedLevels') || { easy: 1, normal: 1, hard: 1 };
      if (unlockedLevels[this.difficulty] < this.level + 1) {
        unlockedLevels[this.difficulty] = this.level + 1;
        wx.setStorageSync('unlockedLevels', unlockedLevels);
      }
    }

    this.playCompleteSound();

    // 跳转到结果页面
    wx.redirectTo({
      url: `/pages/result/result?isWin=true&level=${this.level}&difficulty=${this.difficulty}&score=${score}&combo=${combo}&perfectCount=${perfectCount}&currentLayer=${currentLayer}&isNewBest=${isNewBest}`
    });
  },

  /**
   * 返回首页
   */
  onBack() {
    wx.navigateBack();
  },

  /**
   * 初始化音效
   */
  initAudio() {
    try {
      audioManager.init();
    } catch (e) {
      console.log('音频初始化失败', e);
    }
  },

  playPlaceSound(isPerfect) {
    audioManager.play(isPerfect ? 'perfect' : 'place');
  },

  playGameOverSound() {
    audioManager.play('gameover');
  },

  playCompleteSound() {
    audioManager.play('complete');
  },

  destroyAudio() {
    audioManager.destroy();
  },

  /**
   * 分享功能
   */
  onShareAppMessage() {
    const { score, level, difficultyName } = this.data;
    return {
      title: `我在积木堆叠第${level}关获得了${score}分，来挑战我吧！`,
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});
