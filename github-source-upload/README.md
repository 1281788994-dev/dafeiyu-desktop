# 大肥鱼桌宠

一只抱着电脑办公、会甩尾和庆祝的蓝发鲸鱼女仆。独立运行，支持 Windows 与 Mac，不需要安装 ChatGPT，也不需要 API Key。

**[下载最新版本](https://github.com/1281788994-dev/dafeiyu-desktop/releases/latest)** · **[完整使用说明与动作分镜](docs/使用说明.md)**

## 下载和运行

| 电脑 | 下载文件 | 运行方式 |
| --- | --- | --- |
| Windows 10 / 11，64 位 | `大肥鱼桌宠-Windows-x64-v1.1.2.zip` | 完整解压，再运行 `大肥鱼桌宠.exe`；保留旁边的运行文件 |
| Mac，Apple 芯片 | `大肥鱼桌宠-Mac-Apple芯片-v1.1.2.zip` | 解压，把 App 拖进“应用程序”后打开 |
| Mac，Intel 芯片 | `大肥鱼桌宠-Mac-Intel-v1.1.2.zip` | 解压，把 App 拖进“应用程序”后打开 |

更新时先退出旧版，再运行新版。设置与位置会保留。

当前为测试版：Apple 芯片 Mac 已启动验证；Windows 与 Intel Mac 尚未实机验证。发行包尚无正式发布者签名 / Apple 公证，首次打开可能出现系统安全提示。请确认下载来源，不需要关闭系统安全保护。

## 六个动作，一眼看明白

以下均为实际动画素材的**静态分镜**，从左到右表示动作顺序。

### 1. 抱电脑甩尾

鼠标碰到她，尾巴就摆起来。约六秒后可以再次触发。

![甩尾动作静态分镜](docs/images/tail-storyboard.png)

### 2. 抛、跳、接、工作

双击她：抛起电脑、跳起来、接住，再坐回去工作。

![抛跳接动作静态分镜](docs/images/catch-storyboard.png)

### 3. 伸个懒腰

“伸个懒腰，脑洞就打开啦。”

![伸懒腰动作静态分镜](docs/images/stretch-storyboard.png)

### 4. 抱电脑打盹

“我只是闭眼整理一下思路。”

![打盹动作静态分镜](docs/images/sleep-storyboard.png)

### 5. 抱电脑站起跳

“电脑抱稳，快乐起飞。”

![站起跳动作静态分镜](docs/images/stand-storyboard.png)

### 6. 电脑事故小剧场

“完了……修好就当没发生。”

![摔坏电脑再维修动作静态分镜](docs/images/gag-storyboard.png)

## 头像工具栏

鼠标移到大肥鱼上会出现工具栏。六个头像分别对应六个动作，停留可查看名称；三个点打开设置与退出菜单。

![大肥鱼头像动作工具栏](docs/images/toolbar.png)

- 按住大肥鱼拖动，位置会自动保存。
- 右键设置动画速度、大小、置顶、减少动画和隐藏。
- 气泡位于人物上方，不遮住角色。
- 18 句本地气泡文案；闲时每 90–180 秒偶尔做小动作，专注计时期间不自动打扰。
- 右键关闭“偶尔说句话和做小动作”，可以保持安静。
- 专注计时支持 5 / 25 / 45 分钟，到时自动庆祝。
- 菜单栏 / 系统托盘图标可显示、隐藏或退出桌宠。

本项目只提供本地文字气泡，不是 AI 聊天或语音对话。独立版不读取 ChatGPT 或其他应用的任务状态；庆祝由双击、动作按钮或自身计时器触发。不联网，不收集使用数据，不自动设置开机启动。

## 开发和打包

源码位于 `app/`，使用 Electron 45.1.0。安装 Node.js 和对应平台的 Electron 后，可用 `electron app` 启动。

```sh
node --test tests/animation.test.js tests/renderer.test.js
electron app --smoke-test
```

精灵表为 1536×2704 透明 PNG，13 行，每格 192×208；这是独立桌宠格式。动作播放时长与速度在 `app/animation.js` 中控制。

Mac 上的手动打包脚本：`python3 scripts/package.py --target all`。需要 `.runtime-cache/` 中有 Electron 45.1.0 的官方发行 ZIP（darwin-arm64 / darwin-x64 / win32-x64）及官方 `SHASUMS256.txt`，脚本先校验再打包。缓存和安装包不进入 Git 历史，安装包在 Releases 中下载。

`prepare-assets.py`、`prepare-extra-assets.py` 是原始素材制作记录，依赖制作环境的本地参考素材与 Pillow；运行桌宠和使用已提供的精灵表不需要这些工具。`make-storyboards.py` 用于从精灵表导出本文分镜。

## 来源与许可

角色参考：[1190fasheqi/dafeiyu-pet](https://github.com/1190fasheqi/dafeiyu-pet)。本项目使用用户提供参考后制作的二创动画，不代表 DeepSeek、Apple 或 OpenAI 官方。

程序代码采用 [MIT License](LICENSE)。角色与图像素材的权利不随代码许可而改变；详见 [素材与开源说明](NOTICE.txt)。Electron 及其依赖的许可保留在各平台安装包中。
