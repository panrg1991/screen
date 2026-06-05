/**
 * 本地存储管理工具
 * 管理最高分、关卡解锁进度、设置等
 */

const KEYS = {
  BEST_SCORES: 'bestScores',
  UNLOCKED_LEVELS: 'unlockedLevels',
  SETTINGS: 'gameSettings'
};

const DEFAULT_BEST_SCORES = {
  easy: { level1: 0, level2: 0, level3: 0 },
  normal: { level1: 0, level2: 0, level3: 0 },
  hard: { level1: 0, level2: 0, level3: 0 }
};

const DEFAULT_UNLOCKED = {
  easy: 1,
  normal: 1,
  hard: 1
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true
};

module.exports = {
  /**
   * 获取最高分
   */
  getBestScores() {
    return wx.getStorageSync(KEYS.BEST_SCORES) || { ...DEFAULT_BEST_SCORES };
  },

  /**
   * 保存最高分
   */
  saveBestScore(difficulty, level, score) {
    const scores = this.getBestScores();
    const key = `level${level}`;
    if (score > (scores[difficulty][key] || 0)) {
      scores[difficulty][key] = score;
      wx.setStorageSync(KEYS.BEST_SCORES, scores);
      return true; // 新纪录
    }
    return false;
  },

  /**
   * 获取指定关卡最高分
   */
  getBestScore(difficulty, level) {
    const scores = this.getBestScores();
    return scores[difficulty]?.[`level${level}`] || 0;
  },

  /**
   * 获取解锁进度
   */
  getUnlockedLevels() {
    return wx.getStorageSync(KEYS.UNLOCKED_LEVELS) || { ...DEFAULT_UNLOCKED };
  },

  /**
   * 解锁关卡
   */
  unlockLevel(difficulty, level) {
    const unlocked = this.getUnlockedLevels();
    if (unlocked[difficulty] < level) {
      unlocked[difficulty] = level;
      wx.setStorageSync(KEYS.UNLOCKED_LEVELS, unlocked);
    }
  },

  /**
   * 获取设置
   */
  getSettings() {
    return wx.getStorageSync(KEYS.SETTINGS) || { ...DEFAULT_SETTINGS };
  },

  /**
   * 保存设置
   */
  saveSettings(settings) {
    wx.setStorageSync(KEYS.SETTINGS, settings);
  },

  /**
   * 重置所有数据
   */
  resetAll() {
    wx.setStorageSync(KEYS.BEST_SCORES, { ...DEFAULT_BEST_SCORES });
    wx.setStorageSync(KEYS.UNLOCKED_LEVELS, { ...DEFAULT_UNLOCKED });
    wx.setStorageSync(KEYS.SETTINGS, { ...DEFAULT_SETTINGS });
  }
};
