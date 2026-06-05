# 积木堆叠 - 微信小程序

一款类似 Stack / Tower Bloxx 的 3D 积木堆叠小游戏，支持三关、三难度，具有逼真 3D 视觉效果。

---

## 功能特性

| 功能 | 描述 |
|------|------|
| 三关卡 | 第1关(10层) → 第2关(15层) → 第3关(20层)，连续解锁 |
| 三难度 | 简单（积木大/速度慢）、容易（中）、困难（积木小/速度快） |
| 3D 效果 | Canvas 2D 透视投影模拟 3D，每层不同颜色 + 光影 |
| 音效振动 | 支持音效 MP3（可选），无文件时自动降级为振动反馈 |
| 最高分 | 本地存储每个难度+关卡的最高分 |
| 微信分享 | 支持分享游戏成绩给微信好友 |

---

## 项目结构

```
d:\weixin\screen\
├── pages\
│   ├── index\          # 首页：难度选择 + 关卡入口
│   ├── game\           # 游戏主页面：核心玩法
│   └── result\         # 结算页面：得分 + 星级评价
├── utils\
│   ├── game.js         # 游戏核心逻辑（碰撞检测、得分计算）
│   ├── render.js       # 3D 渲染引擎（透视投影）
│   ├── audio.js        # 音效 + 振动反馈管理
│   └── storage.js     # 本地存储管理（最高分、解锁进度）
├── audio\              # 音效文件目录（可选）
├── app.js              # 小程序入口
├── app.json            # 小程序配置
├── app.wxss            # 全局样式
├── project.config.json  # 项目配置
└── README.md           # 本文件
```

---

## 快速开始

### 1. 打开项目

1. 下载安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开工具 → 「导入项目」
3. 目录选择 `d:\weixin\screen`
4. AppID 选择 **「测试号」** 或填写你自己的小程序 AppID
5. 点击「编译」即可预览

### 2. 真机预览

在开发者工具中点击 **「预览」**，用微信扫码即可在手机上体验真实效果。

---

## 游戏规则

1. 点击屏幕将滑来的积木放置在塔上
2. 对齐越精准，得分越高：
   - **完美对齐**（偏差极小）：+10 分 + 连击加成
   - **普通对齐**：+5 分，超出部分被切掉
3. 偏差过大积木被切窄，完全未对齐则游戏结束
4. 达到目标层数即通关，解锁下一关

### 得分规则

| 对齐情况 | 得分 | 效果 |
|---------|------|------|
| 完美对齐（偏差 < 5%） | 10 + 连击×2 | 金色特效 |
| 普通对齐 | 5 分 | 正常放置 |
| 偏差过大 | 积木变窄 | 难度增加 |
| 完全未对齐 | 游戏结束 | — |

---

## 音效配置（可选）

在 `audio/` 目录下放置以下 MP3 文件即可启用音效：

| 文件名 | 用途 |
|--------|------|
| `place.mp3` | 放置积木音效 |
| `perfect.mp3` | 完美对齐音效 |
| `gameover.mp3` | 游戏结束音效 |
| `complete.mp3` | 通关音效 |

> **没有音效文件也能正常运行**，会自动降级为振动反馈模式。

免费音效下载推荐：[Mixkit Free Sound Effects](https://mixkit.co/free-sound-effects/) | [Freesound](https://freesound.org/)

---

## 自定义配置

### 修改难度参数

编辑 `utils/game.js` 中的 `DIFFICULTY_CONFIG`：

```javascript
const DIFFICULTY_CONFIG = {
  easy: {
    name: '简单',
    blockWidth: 80,     // 积木宽度
    blockDepth: 40,     // 积木深度
    blockHeight: 20,    // 积木高度
    moveSpeed: 3,       // 移动速度
    tolerance: 0.4,     // 容错率
    perfectThreshold: 0.08 // 完美对齐阈值
  },
  // ...
};
```

### 修改关卡配置

编辑 `utils/game.js` 中的 `LEVEL_CONFIG`：

```javascript
const LEVEL_CONFIG = {
  1: { name: '初级', targetLayers: 10, speedMultiplier: 1.0 },
  2: { name: '中级', targetLayers: 15, speedMultiplier: 1.3 },
  3: { name: '高级', targetLayers: 20, speedMultiplier: 1.6 }
};
```

### 修改 3D 颜色

编辑 `utils/render.js` 中的 `BLOCK_COLORS` 数组，可自定义每层积木的颜色。

---

## 技术说明

| 项目 | 说明 |
|------|------|
| 开发框架 | 微信小程序原生开发 |
| 3D 渲染 | Canvas 2D + 透视投影模拟 3D 效果 |
| 数据存储 | `wx.setStorageSync` 本地存储 |
| 音效 | `wx.createInnerAudioContext` + `wx.vibrateShort/Long` |
| 最低基础库 | 2.25.4+ |

---

## 常见问题

**Q：开发者工具提示 AppID 无效？**
A：在工具顶部选择「测试号」即可，无需真实 AppID 即可预览。

**Q：手机上打开没有振动？**
A：振动功能需要真机环境，PC 模拟器不支持。

**Q：如何更换 AppID？**
A：修改 `project.config.json` 中的 `appid` 字段，或在开发者工具中直接修改。

---

##  License

MIT License
