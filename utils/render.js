/**
 * 3D 渲染引擎 - 使用 Canvas 2D 模拟 3D 透视效果
 * 实现积木堆叠游戏的 3D 视觉效果
 */

// 3D 颜色方案 - 每层不同颜色，营造逼真 3D 感
const BLOCK_COLORS = [
  { top: '#667eea', left: '#4a5fd4', right: '#3548b8' },
  { top: '#764ba2', left: '#5e3a82', right: '#472c62' },
  { top: '#e94560', left: '#c23152', right: '#9c1f3e' },
  { top: '#0abde3', left: '#0896b6', right: '#067189' },
  { top: '#10ac84', left: '#0d8a6a', right: '#0a6850' },
  { top: '#f9c74f', left: '#d4a83e', right: '#af8a2e' },
  { top: '#f8961e', left: '#d47d18', right: '#b06512' },
  { top: '#f3722c', left: '#d45c1e', right: '#b54812' },
  { top: '#90be6d', left: '#78a25b', right: '#608b48' },
  { top: '#43aa8b', left: '#368a72', right: '#2a6b59' },
  { top: '#577590', left: '#455d75', right: '#35485c' },
  { top: '#f94144', left: '#d43538', right: '#b0282c' },
];

// 透视投影参数
const PERSPECTIVE = {
  viewDist: 800,      // 视点距离
  scaleFactor: 0.001, // 缩放因子
  ySkew: 0.3,        // Y轴倾斜（营造俯视感）
  xSkew: 0.0         // X轴倾斜
};

class Render3D {
  constructor(ctx, canvasWidth, canvasHeight) {
    this.ctx = ctx;
    this.W = canvasWidth;
    this.H = canvasHeight;
    this.centerX = canvasWidth / 2;
    this.centerY = canvasHeight * 0.6; // 塔基位置偏下
  }

  /**
   * 将 3D 坐标转换为 2D 屏幕坐标（透视投影）
   */
  project(x, y, z) {
    const { viewDist, scaleFactor } = PERSPECTIVE;
    const factor = viewDist / (viewDist + z);
    const screenX = this.centerX + x * factor;
    const screenY = this.centerY - y * factor * (1 - PERSPECTIVE.ySkew);
    const scale = factor;
    return { x: screenX, y: screenY, scale };
  }

  /**
   * 绘制 3D 积木（长方体）
   * @param {Object} block - { x, y, z, width, depth, height, colorIdx }
   * @param {Number} offsetX - X轴移动偏移（用于动画）
   * @param {Number} alpha - 透明度
   */
  drawBlock(block, offsetX = 0, alpha = 1) {
    const ctx = this.ctx;
    const { x, y, z, width, depth, height, colorIdx } = block;
    const colors = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length];

    const halfW = width / 2;
    const halfD = depth / 2;
    const bx = x + offsetX;

    // 顶面四个角（3D 投影）
    const topFrontLeft = this.project(bx - halfW, y + height, z - halfD);
    const topFrontRight = this.project(bx + halfW, y + height, z - halfD);
    const topBackLeft = this.project(bx - halfW, y + height, z + halfD);
    const topBackRight = this.project(bx + halfW, y + height, z + halfD);

    // 底面四个角
    const botFrontLeft = this.project(bx - halfW, y, z - halfD);
    const botFrontRight = this.project(bx + halfW, y, z - halfD);
    const botBackLeft = this.project(bx - halfW, y, z + halfD);
    const botBackRight = this.project(bx + halfW, y, z + halfD);

    ctx.save();
    ctx.globalAlpha = alpha;

    // --- 绘制顶面（最亮）---
    ctx.beginPath();
    ctx.moveTo(topFrontLeft.x, topFrontLeft.y);
    ctx.lineTo(topFrontRight.x, topFrontRight.y);
    ctx.lineTo(topBackRight.x, topBackRight.y);
    ctx.lineTo(topBackLeft.x, topBackLeft.y);
    ctx.closePath();
    ctx.fillStyle = colors.top;
    ctx.fill();

    // 顶面高光
    const grd = ctx.createLinearGradient(
      topFrontLeft.x, topFrontLeft.y,
      topBackRight.x, topBackRight.y
    );
    grd.addColorStop(0, 'rgba(255,255,255,0.25)');
    grd.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = grd;
    ctx.fill();

    // --- 绘制左侧面 ---
    ctx.beginPath();
    ctx.moveTo(topFrontLeft.x, topFrontLeft.y);
    ctx.lineTo(botFrontLeft.x, botFrontLeft.y);
    ctx.lineTo(botBackLeft.x, botBackLeft.y);
    ctx.lineTo(topBackLeft.x, topBackLeft.y);
    ctx.closePath();
    ctx.fillStyle = colors.left;
    ctx.fill();

    // 左侧面阴影
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fill();

    // --- 绘制右侧面 ---
    ctx.beginPath();
    ctx.moveTo(topFrontRight.x, topFrontRight.y);
    ctx.lineTo(botFrontRight.x, botFrontRight.y);
    ctx.lineTo(botBackRight.x, botBackRight.y);
    ctx.lineTo(topBackRight.x, topBackRight.y);
    ctx.closePath();
    ctx.fillStyle = colors.right;
    ctx.fill();

    // --- 绘制前面（可选，增加立体感）---
    ctx.beginPath();
    ctx.moveTo(topFrontLeft.x, topFrontLeft.y);
    ctx.lineTo(topFrontRight.x, topFrontRight.y);
    ctx.lineTo(botFrontRight.x, botFrontRight.y);
    ctx.lineTo(botFrontLeft.x, botFrontLeft.y);
    ctx.closePath();
    ctx.fillStyle = colors.left;
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * 绘制塔（从下到上）
   */
  drawTower(blocks, currentBlock, moveOffset) {
    const ctx = this.ctx;

    // 清空画布
    ctx.clearRect(0, 0, this.W, this.H);

    // 绘制背景渐变
    const bgGrd = ctx.createLinearGradient(0, 0, 0, this.H);
    bgGrd.addColorStop(0, '#1a1a2e');
    bgGrd.addColorStop(0.5, '#16213e');
    bgGrd.addColorStop(1, '#0f3460');
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, this.W, this.H);

    // 绘制地面阴影
    this.drawGround();

    // 绘制已堆叠的积木（从下到上）
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const alpha = 0.6 + 0.4 * (i / Math.max(blocks.length, 1));
      this.drawBlock({
        ...block,
        z: i * block.depth  // 每层沿Z轴推进
      }, 0, alpha);
    }

    // 绘制当前正在移动的积木
    if (currentBlock) {
      const blockWithZ = {
        ...currentBlock,
        z: blocks.length * currentBlock.depth
      };
      this.drawBlock(blockWithZ, moveOffset, 0.9);

      // 绘制移动轨迹指示线
      this.drawGuideLines(blockWithZ, moveOffset);
    }

    // 绘制塔的阴影
    this.drawTowerShadow(blocks, currentBlock, moveOffset);
  }

  /**
   * 绘制地面
   */
  drawGround() {
    const ctx = this.ctx;
    const groundY = this.centerY;

    ctx.save();
    ctx.beginPath();

    // 地面透视效果
    const left = this.project(-200, 0, -100);
    const right = this.project(200, 0, -100);
    const backLeft = this.project(-200, 0, 200);
    const backRight = this.project(200, 0, 200);

    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(backRight.x, backRight.y);
    ctx.lineTo(backLeft.x, backLeft.y);
    ctx.closePath();

    const grd = ctx.createLinearGradient(left.x, left.y, backLeft.x, backLeft.y);
    grd.addColorStop(0, 'rgba(255,255,255,0.05)');
    grd.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 绘制对齐指示线
   */
  drawGuideLines(block, offsetX) {
    const ctx = this.ctx;
    const { x, z, width, depth } = block;
    const bx = x + offsetX;

    // 中心对齐线
    const centerTop = this.project(bx, 1000, z);
    const centerBot = this.project(bx, 0, z);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerTop.x, centerTop.y);
    ctx.lineTo(centerBot.x, centerBot.y);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 绘制塔的阴影
   */
  drawTowerShadow(blocks, currentBlock, moveOffset) {
    const ctx = this.ctx;
    // 简单的椭圆阴影
    const shadowX = this.centerX;
    const shadowY = this.centerY + 5;
    const shadowW = 60 + blocks.length * 2;
    const shadowH = 15;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 绘制放置特效（完美对齐时）
   */
  drawPerfectEffect(x, y, z, width) {
    const ctx = this.ctx;
    const pos = this.project(x, y, z);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 绘制得分动画
   */
  drawScorePopup(x, y, text, alpha = 1) {
    const ctx = this.ctx;
    const pos = this.project(x, y, 0);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(text, pos.x, pos.y);
    ctx.restore();
  }
}

module.exports = Render3D;
