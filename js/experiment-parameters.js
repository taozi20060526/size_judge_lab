/**
 * 【实验参数与材料定义】赵钰涛 · 认知心理学课程作业
 *
 * 本文件为「单一配置源」：计时、练习/正式词对与文件名、四条件呈现规格、可选 Supabase 连接。
 * 图画置于 stimuli/，文件名须与 PAIRS / PRACTICE_PAIRS 中 bigFile、smallFile 一致。
 * 其他脚本只读 window.SJL_CONFIG，不在别处硬编码实验常数。
 */
window.SJL_CONFIG = {
  STORAGE_KEY: "size_judge_lab_v1",
  /** 保留。图片路径已改为相对 index.html，一般留空即可。 */
  BASE_PATH: "",
  IMAGE_EXT: ".png",
  FIX_MS: 500,
  ITI_MS: 600,
  TIMEOUT_MS: 3500,
  MIN_OTHER_TRIALS_BETWEEN_SAME_PAIR: 12,
  PRACTICE_MIN_ACC: 0.78,
  PRACTICE_MAX_TRIES: 5,
  /* 图画大小：提高基准与小图占比，便于辨认（尤其「大–小」对比时的小物体） */
  IMG_BIG_CON_PCT: 90,
  IMG_SMALL_CON_PCT: 44,
  IMG_BIG_INC_PCT: 44,
  IMG_SMALL_INC_PCT: 90,
  TXT_BIG_PT: 52,
  TXT_SMALL_PT: 22,
  TXT_BIG_INC_PT: 22,
  TXT_SMALL_INC_PT: 52,
  PRACTICE_PAIRS: [
    { big: "斑马", small: "台灯", bigFile: "斑马", smallFile: "台灯" },
    { big: "狮子", small: "仓鼠", bigFile: "狮子", smallFile: "仓鼠" },
    { big: "轮船", small: "皮划艇", bigFile: "轮船", smallFile: "皮划艇" },
  ],
  PAIRS: [
    { id: 1, big: "大象", small: "老鼠", bigFile: "大象", smallFile: "老鼠" },
    { id: 2, big: "鲸鱼", small: "金鱼", bigFile: "鲸鱼", smallFile: "金鱼" },
    { id: 3, big: "高楼", small: "狗屋", bigFile: "高楼", smallFile: "狗屋" },
    { id: 4, big: "飞机", small: "蜻蜓", bigFile: "飞机", smallFile: "蜻蜓" },
    { id: 5, big: "公交车", small: "滑板", bigFile: "公交车", smallFile: "滑板" },
    { id: 6, big: "西瓜", small: "樱桃", bigFile: "西瓜", smallFile: "樱桃" },
    { id: 7, big: "马", small: "狗", bigFile: "马", smallFile: "狗" },
    { id: 8, big: "冰箱", small: "微波炉", bigFile: "冰箱", smallFile: "微波炉" },
    { id: 9, big: "衣柜", small: "床头柜", bigFile: "衣柜", smallFile: "床头柜" },
    { id: 10, big: "自行车", small: "滑板车", bigFile: "自行车", smallFile: "滑板车" },
    { id: 11, big: "篮球", small: "网球", bigFile: "篮球", smallFile: "网球" },
    { id: 12, big: "笔记本电脑", small: "平板", bigFile: "笔记本电脑", smallFile: "平板" },
    { id: 13, big: "沙发", small: "单人椅", bigFile: "沙发", smallFile: "单人椅" },
    { id: 14, big: "平底锅", small: "碗", bigFile: "平底锅", smallFile: "碗" },
    { id: 15, big: "枕头", small: "床", bigFile: "枕头", smallFile: "床" },
    { id: 16, big: "背包", small: "手提包", bigFile: "背包", smallFile: "手提包" },
    { id: 17, big: "电水壶", small: "保温杯", bigFile: "电水壶", smallFile: "保温杯" },
    { id: 18, big: "台灯", small: "手电筒", bigFile: "台灯", smallFile: "手电筒" },
    { id: 19, big: "键盘", small: "计算器", bigFile: "键盘", smallFile: "计算器" },
    { id: 20, big: "吹风机", small: "电动牙刷", bigFile: "吹风机", smallFile: "电动牙刷" },
  ],
  FILLER_PAIRS: [
    { id: "F1", big: "骆驼", small: "刺猬", bigFile: "骆驼", smallFile: "刺猬" },
    { id: "F2", big: "犀牛", small: "松鼠", bigFile: "犀牛", smallFile: "松鼠" },
    { id: "F3", big: "高铁", small: "玩具火车", bigFile: "高铁", smallFile: "玩具火车" },
    { id: "F4", big: "航母", small: "模型船", bigFile: "航母", smallFile: "模型船" },
    { id: "F5", big: "货轮", small: "漂流瓶", bigFile: "货轮", smallFile: "漂流瓶" },
    { id: "F6", big: "热气球", small: "羽毛球", bigFile: "热气球", smallFile: "羽毛球" },
    { id: "F7", big: "坦克", small: "玩具枪", bigFile: "坦克", smallFile: "玩具枪" },
    { id: "F8", big: "起重机", small: "杠铃", bigFile: "起重机", smallFile: "杠铃" },
    { id: "F9", big: "宫殿", small: "岗亭", bigFile: "宫殿", smallFile: "岗亭" },
    { id: "F10", big: "金字塔", small: "魔方", bigFile: "金字塔", smallFile: "魔方" },
    { id: "F11", big: "木瓜", small: "荔枝", bigFile: "木瓜", smallFile: "荔枝" },
    { id: "F12", big: "鳄鱼", small: "壁虎", bigFile: "鳄鱼", smallFile: "壁虎" },
    { id: "F13", big: "老鹰", small: "麻雀", bigFile: "老鹰", smallFile: "麻雀" },
    { id: "F14", big: "鸵鸟", small: "鹌鹑", bigFile: "鸵鸟", smallFile: "鹌鹑" },
    { id: "F15", big: "快艇", small: "纸船", bigFile: "快艇", smallFile: "纸船" },
    { id: "F16", big: "油罐车", small: "玩具汽车", bigFile: "油罐车", smallFile: "玩具汽车" },
    { id: "F17", big: "洗碗机", small: "茶杯", bigFile: "洗碗机", smallFile: "茶杯" },
    { id: "F18", big: "洗衣机", small: "香皂", bigFile: "洗衣机", smallFile: "香皂" },
    { id: "F19", big: "书柜", small: "便签本", bigFile: "书柜", smallFile: "便签本" },
    { id: "F20", big: "显微镜", small: "放大镜", bigFile: "显微镜", smallFile: "放大镜" },
  ],
  CONDITION_DEFS: [
    { key: "pic_con", label: "图画-一致", mode: "image", consistent: true },
    { key: "pic_inc", label: "图画-不一致", mode: "image", consistent: false },
    { key: "txt_con", label: "文字-一致", mode: "text", consistent: true },
    { key: "txt_inc", label: "文字-不一致", mode: "text", consistent: false },
  ],
  /**
   * 远端数据库（Supabase）连接项。
   * supabaseUrl：项目 API 根地址（https://…supabase.co，勿含 /rest）。
   * supabaseAnonKey：控制台 API Keys 中 anon public；公开仓库提交前请评估泄露风险。
   * 建表与权限：见仓库根目录 supabase-setup.sql。
   */
  REMOTE: {
    enabled: true,
    supabaseUrl: "https://bobardlyrlziugirtvbh.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvYmFyZGx5cmx6aXVnaXJ0dmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njg1MzgsImV4cCI6MjA5NDM0NDUzOH0.d06Dpm2iIkWBqDGOcE3ya767A0uZo5X8ih3oKsBKvNE",
    tableName: "experiment_sessions",
  },
};
