/**
 * 游戏核心逻辑
 * 控制积木移动、碰撞检测、得分计算
 */

// 难度配置
const DIFFICULTY_CONFIG = {
  easy: {
    name: '简单',
    blockWidth: 80,      // 积木宽度（逻辑单位）
    blockDepth: 40,      // 积木深度
    blockHeight: 20,      // 积木高度
    moveSpeed: 3,        // 移动速度
    tolerance: 0.4,      // 容错率（超出此比例才切掉）
    perfectThreshold: 0.08 // 完美对齐阈值
  },
  normal: {
    name: '容易',
    blockWidth: 65,
    blockDepth: 35,
    blockHeight: 18,
    moveSpeed: 4.5,
    tolerance: 0.3,
    perfectThreshold: 0.06
  },
  hard: {
    name: '困难',
    blockWidth: 50,
    blockDepth: 30,
    blockHeight: 16,
    moveSpeed: 6,
    tolerance: 0.2,
    perfectThreshold: 0.04
  }
};

// 关卡配置
const LEVEL_CONFIG = {
  1: { name: '初级', targetLayers: 10, speedMultiplier: 1.0 },
  2: { name: '中级', targetLayers: 15, speedMultiplier: 1.3 },
  3: { name: '高级', targetLayers: 20, speedMultiplier: 1.6 }
};

class GameLogic {
  constructor(difficulty = 'easy', level = 1) {
    this.difficulty = difficulty;
    this.level = level;
    this.config = DIFFICULTY_CONFIG[difficulty];
    this.levelConfig = LEVEL_CONFIG[level];

    this.reset();
  }

  reset() {
    const cfg = this.config;
    const levelCfg = this.levelConfig;

    this.blocks = [];          // 已放置的积木列表
    this.currentX = 0;         // 当前积木X位置
    this.moveDirection = 1;    // 移动方向：1 右, -1 左
    this.moveSpeed = cfg.moveSpeed * levelCfg.speedMultiplier;
    this.currentWidth = cfg.blockWidth;
    this.currentDepth = cfg.blockDepth;
    this.score = 0;
    this.combo = 0;            // 连击数
    this.gameOver = false;
    this.levelComplete = false;
    this.moveOffset = 0;       // 用于渲染的偏移量
    this.perfectCount = 0;     // 完美对齐次数

    // 初始化第一块（底座）
    this.blocks.push({
      x: 0,
      y: 0,
      width: cfg.blockWidth,
      depth: cfg.blockDepth,
      height: cfg.blockHeight,
      colorIdx: 0
    });

    // 初始化当前移动积木
    this.spawnNewBlock();
  }

  /**
   * 生成新的移动积木
   */
  spawnNewBlock() {
    const cfg = this.config;
    const topBlock = this.blocks[this.blocks.length - 1];

    // 新积木从右侧或左侧滑入
    const startX = this.moveDirection > 0
      ? topBlock.x + cfg.blockWidth * 1.5
      : topBlock.x - cfg.blockWidth * 1.5;

    this.currentX = startX;
    this.currentWidth = topBlock.width;
    this.currentDepth = cfg.blockDepth;
    this.moveOffset = 0;
  }

  /**
   * 游戏主循环更新
   */
  update() {
    if (this.gameOver || this.levelComplete) return;

    const topBlock = this.blocks[this.blocks.length - 1];

    // 更新当前积木位置
    this.currentX += this.moveSpeed * this.moveDirection;

    // 边界检测，改变方向
    const boundary = 150;
    if (this.currentX > topBlock.x + boundary) {
      this.moveDirection = -1;
    } else if (this.currentX < topBlock.x - boundary) {
      this.moveDirection = 1;
    }

    // 计算渲染偏移量
    this.moveOffset = this.currentX - topBlock.x;
  }

  /**
   * 放置积木 - 核心逻辑
   * @returns {Object} 放置结果 { success, perfect, cutWidth, gameOver, score }
   */
  placeBlock() {
    if (this.gameOver || this.levelComplete) return null;

    const topBlock = this.blocks[this.blocks.length - 1];
    const offset = this.moveOffset;
    const halfCurrent = this.currentWidth / 2;
    const halfTop = topBlock.width / 2;

    // 计算重叠区域
    const currentLeft = this.currentX - halfCurrent;
    const currentRight = this.currentX + halfCurrent;
    const topLeft = topBlock.x - halfTop;
    const topRight = topBlock.x + halfTop;

    const overlapLeft = Math.max(currentLeft, topLeft);
    const overlapRight = Math.min(currentRight, topRight);
    const overlap = overlapRight - overlapLeft;

    const result = {
      success: false,
      perfect: false,
      cutWidth: 0,
      cutSide: 'none',  // 'left', 'right', 'both'
      scoreGained: 0,
      perfect: false,
      gameOver: false
    };

    if (overlap <= 0) {
      // 完全未对齐 - 游戏结束
      result.gameOver = true;
      this.gameOver = true;
      return result;
    }

    // 计算偏差
    const overlapCenter = (overlapLeft + overlapRight) / 2;
    const deviation = Math.abs(overlapCenter - topBlock.x);
    const deviationRatio = deviation / halfTop;

    // 判断是否完美对齐
    const isPerfect = deviationRatio < this.config.perfectThreshold;
    result.perfect = isPerfect;

    if (isPerfect) {
      // 完美对齐 - 不削减宽度
      result.scoreGained = 10 + this.combo * 2;
      this.combo++;
      this.perfectCount++;
    } else {
      // 普通对齐 - 削减超出部分
      this.combo = 0;
      result.scoreGained = 5;

      // 计算切掉的宽度
      const newWidth = overlap;
      result.cutWidth = this.currentWidth - newWidth;

      // 判断切哪一边
      if (overlapLeft > topLeft + 1) {
        result.cutSide = 'left';
      }
      if (overlapRight < topRight - 1) {
        result.cutSide = result.cutSide === 'left' ? 'both' : 'right';
      }

      this.currentWidth = newWidth;
    }

    // 放置新积木
    const newBlock = {
      x: overlapCenter,
      y: topBlock.y + topBlock.height,
      width: this.currentWidth,
      depth: this.currentDepth,
      height: this.config.blockHeight,
      colorIdx: this.blocks.length % 12
    };

    this.blocks.push(newBlock);
    this.score += result.scoreGained;

    // 检查是否通关
    if (this.blocks.length - 1 >= this.levelConfig.targetLayers) {
      this.levelComplete = true;
      // 通关奖励
      this.score += 50 * this.level;
    }

    // 生成下一个积木
    this.moveDirection *= -1; // 改变方向
    this.spawnNewBlock();

    result.success = true;
    result.newBlock = newBlock;
    return result;
  }

  /**
   * 获取游戏状态
   */
  getState() {
    return {
      blocks: this.blocks,
      currentX: this.currentX,
      moveOffset: this.moveOffset,
      currentWidth: this.currentWidth,
      currentDepth: this.currentDepth,
      score: this.score,
      combo: this.combo,
      gameOver: this.gameOver,
      levelComplete: this.levelComplete,
      currentLayer: this.blocks.length - 1,
      targetLayers: this.levelConfig.targetLayers,
      perfectCount: this.perfectCount
    };
  }

  /**
   * 获取当前难度配置
   */
  getConfig() {
    return { ...this.config, ...this.levelConfig };
  }
}

module.exports = {
  GameLogic,
  DIFFICULTY_CONFIG,
  LEVEL_CONFIG
};
