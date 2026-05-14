将图片放在此文件夹。

命名规则（与 `js/experiment-parameters.js` 中 `bigFile` / `smallFile` 一致）：
  大象.png、老鼠.png、鲸鱼.png …

默认扩展名为 .png，可在 experiment-parameters.js 顶部的 IMAGE_EXT 改为 .jpg 等。

本地运行：在项目目录执行
  python -m http.server 8080
浏览器打开 http://127.0.0.1:8080/

共需正式+练习用到的物体图若干（与正式 20 对 + 练习 3 对中所有 bigFile/smallFile 去重后的列表一致）。本仓库 `stimuli/` 已按表配齐；若你自行增删词对，须同步增删对应文件名。填充试次仅为文字，不需要这些物体的图。
