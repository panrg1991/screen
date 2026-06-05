App({
  onLaunch() {
    // 初始化本地存储
    if (!wx.getStorageSync('bestScores')) {
      wx.setStorageSync('bestScores', {
        easy: { level1: 0, level2: 0, level3: 0 },
        normal: { level1: 0, level2: 0, level3: 0 },
        hard: { level1: 0, level2: 0, level3: 0 }
      });
    }
    if (!wx.getStorageSync('unlockedLevels')) {
      wx.setStorageSync('unlockedLevels', {
        easy: 1,
        normal: 1,
        hard: 1
      });
    }
  },
  globalData: {
    // 当前选择的难度和关卡
    currentDifficulty: 'easy', // easy, normal, hard
    currentLevel: 1,           // 1, 2, 3
  }
});
