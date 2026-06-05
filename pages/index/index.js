const app = getApp();

Page({
  data: {
    currentDifficulty: 'easy',
    currentLevel: 1,
    bestScores: {
      easy: { level1: 0, level2: 0, level3: 0 },
      normal: { level1: 0, level2: 0, level3: 0 },
      hard: { level1: 0, level2: 0, level3: 0 }
    },
    unlockedLevels: {
      easy: 1,
      normal: 1,
      hard: 1
    },
    showHelpModal: false
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadData();
  },

  loadData() {
    const bestScores = wx.getStorageSync('bestScores') || {
      easy: { level1: 0, level2: 0, level3: 0 },
      normal: { level1: 0, level2: 0, level3: 0 },
      hard: { level1: 0, level2: 0, level3: 0 }
    };
    const unlockedLevels = wx.getStorageSync('unlockedLevels') || {
      easy: 1,
      normal: 1,
      hard: 1
    };
    this.setData({
      bestScores,
      unlockedLevels,
      currentDifficulty: app.globalData.currentDifficulty || 'easy',
      currentLevel: app.globalData.currentLevel || 1
    });
  },

  selectDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    app.globalData.currentDifficulty = difficulty;
    this.setData({
      currentDifficulty: difficulty,
      // 切换到该难度下已解锁的最大关卡
      currentLevel: Math.min(this.data.unlockedLevels[difficulty], 3)
    });
  },

  selectLevel(e) {
    const level = parseInt(e.currentTarget.dataset.level);
    const difficulty = this.data.currentDifficulty;

    if (this.data.unlockedLevels[difficulty] < level) {
      wx.showToast({
        title: '请先通关前一关',
        icon: 'none'
      });
      return;
    }

    app.globalData.currentLevel = level;
    this.setData({ currentLevel: level });
  },

  startGame() {
    const { currentDifficulty, currentLevel } = this.data;
    app.globalData.currentDifficulty = currentDifficulty;
    app.globalData.currentLevel = currentLevel;

    wx.navigateTo({
      url: `/pages/game/game?difficulty=${currentDifficulty}&level=${currentLevel}`
    });
  },

  showHelp() {
    this.setData({ showHelpModal: true });
  },

  hideHelp() {
    this.setData({ showHelpModal: false });
  },

  onShareAppMessage() {
    return {
      title: '来挑战积木堆叠大师！你能叠多高？',
      path: '/pages/index/index'
    };
  }
});
