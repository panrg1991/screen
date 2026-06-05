Page({
  data: {
    isWin: false,
    level: 1,
    difficultyName: '简单',
    score: 0,
    currentLayer: 0,
    perfectCount: 0,
    combo: 0,
    isNewBest: false
  },

  onLoad(options) {
    const {
      isWin = 'false',
      level = '1',
      difficulty = 'easy',
      score = '0',
      currentLayer = '0',
      perfectCount = '0',
      combo = '0',
      isNewBest = 'false'
    } = options;

    const difficultyNames = { easy: '简单', normal: '容易', hard: '困难' };

    this.setData({
      isWin: isWin === 'true',
      level: parseInt(level),
      difficulty: difficulty,
      difficultyName: difficultyNames[difficulty] || '简单',
      score: parseInt(score),
      currentLayer: parseInt(currentLayer),
      perfectCount: parseInt(perfectCount),
      combo: parseInt(combo),
      isNewBest: isNewBest === 'true'
    });
  },

  playAgain() {
    const { level, difficulty, isWin } = this.data;
    const nextLevel = isWin && level < 3 ? level + 1 : level;

    wx.redirectTo({
      url: `/pages/game/game?difficulty=${difficulty}&level=${nextLevel}`
    });
  },

  goHome() {
    wx.navigateBack({
      fail: () => {
        wx.redirectTo({ url: '/pages/index/index' });
      }
    });
  },

  onShareAppMessage() {
    const { score, level, difficultyName } = this.data;
    return {
      title: `我在积木堆叠第${level}关获得了${score}分，来挑战我吧！`,
      path: '/pages/index/index'
    };
  }
});
