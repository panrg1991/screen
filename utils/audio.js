/**
 * 音频 + 振动反馈管理工具
 *
 * 音效：需要放置以下音频文件到 /audio/ 目录（可选）：
 *   - place.mp3   - 放置积木音效
 *   - perfect.mp3 - 完美对齐音效
 *   - gameover.mp3 - 游戏结束音效
 *   - complete.mp3 - 通关音效
 *
 * 振动：无需任何文件，自动触发（微信客户端支持时）
 * 如果没有音频文件，自动降级为纯振动反馈模式。
 */

class AudioManager {
  constructor() {
    this.enabled = true;
    this.audioInstances = {};
    this.initialized = false;
    this.audioAvailable = false;   // 音频文件是否可用
    this.vibrateAvailable = true;   // 振动是否可用
  }

  /**
   * 初始化音频（兼容无文件模式）
   */
  init() {
    if (this.initialized) return;

    const audioList = {
      place:   '/audio/place.mp3',
      perfect:  '/audio/perfect.mp3',
      gameover: '/audio/gameover.mp3',
      complete: '/audio/complete.mp3',
      bgm:      '/audio/bgm.mp3'
    };

    try {
      let loadedCount = 0;

      for (const [key, src] of Object.entries(audioList)) {
        const audio = wx.createInnerAudioContext();
        audio.obeyMuteSwitch = false;

        // 监听加载错误 → 标记该实例不可用
        audio.onError(() => {
          console.log(`[Audio] 文件不存在或无法播放: ${src}`);
        });

        audio.src = src;
        this.audioInstances[key] = audio;
        loadedCount++;
      }

      this.audioAvailable = loadedCount > 0;
      this.initialized = true;

      if (!this.audioAvailable) {
        console.log('[Audio] 未检测到音频文件，将使用振动反馈');
      }
    } catch (e) {
      console.log('[Audio] 初始化失败，将使用振动反馈', e);
      this.audioAvailable = false;
      this.initialized = true; // 仍标记为已初始化（纯振动模式）
    }
  }

  /**
   * 播放音效 + 振动反馈
   * @param {string} type - place / perfect / gameover / complete
   */
  play(type) {
    if (!this.enabled) return;

    // 优先尝试播放音频
    if (this.audioAvailable) {
      try {
        const audio = this.audioInstances[type];
        if (audio) {
          audio.stop();
          audio.seek(0);
          audio.play();
        }
      } catch (e) {
        // 音频播放失败 → 降级为振动
      }
    }

    // 同时触发振动反馈（不受 audioAvailable 影响）
    this._vibrate(type);
  }

  /**
   * 根据音效类型触发不同强度的振动
   */
  _vibrate(type) {
    try {
      switch (type) {
        case 'place':
          // 轻振动：积木放置
          wx.vibrateShort({ type: 'light' });
          break;
        case 'perfect':
          // 中振动：完美对齐
          wx.vibrateShort({ type: 'medium' });
          break;
        case 'gameover':
          // 长振动：游戏结束
          wx.vibrateLong();
          break;
        case 'complete':
          // 两次强振动：通关
          wx.vibrateShort({ type: 'heavy' });
          setTimeout(() => wx.vibrateShort({ type: 'heavy' }), 250);
          break;
        default:
          wx.vibrateShort({ type: 'light' });
      }
    } catch (e) {
      // 振动 API 不可用（模拟器环境）时静默失败
    }
  }

  /**
   * 播放背景音乐
   */
  playBGM() {
    if (!this.enabled || !this.audioAvailable) return;
    try {
      const bgm = this.audioInstances.bgm;
      if (bgm) {
        bgm.loop = true;
        bgm.play();
      }
    } catch (e) {}
  }

  /**
   * 停止背景音乐
   */
  stopBGM() {
    try {
      const bgm = this.audioInstances.bgm;
      if (bgm) bgm.stop();
    } catch (e) {}
  }

  /**
   * 设置音效 + 振动总开关
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stopBGM();
  }

  /**
   * 销毁所有音频实例
   */
  destroy() {
    for (const audio of Object.values(this.audioInstances)) {
      try { audio.destroy(); } catch (e) {}
    }
    this.audioInstances = {};
    this.initialized = false;
    this.audioAvailable = false;
  }
}

module.exports = new AudioManager();

