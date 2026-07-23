/**
 * 页面标题翻译表（中文）
 * key = 路由 name，value = 页面标题
 * 用于 router.afterEach 动态设置 document.title
 */
const zhPageTitles: Record<string, string> = {
  // ── 首页 ──
  Home: '首页 - 发现美好瞬间',
  MyHome: '首页 - 发现美好瞬间',

  // ── 用户 ──
  UserLogin: '登录 - 欢迎回到悦木，安全登录您的账号，开启精彩的内容创作与分享体验之旅',
  UserRegister: '注册 - 开启创作者之旅',
  UserSetting: '账号设置 - 打造专属铭牌',
  UserDetail: 'TA的空间 - 遇见有趣的灵魂',
  UserResetPassword: '安全中心 - 找回并重置密码，悦木图库致力于为您提供安全可靠的账号找回服务',
  UserReportCenter: '小黑屋 - 举报与申诉中心',

  // ── 个人中心 ──
  MyPage: '个人中心 - 我的悦木',
  MySpace: '我的小宇宙',
  MyPosts: '我的投稿 - 创作历程',
  MyTeams: '我的部落 - 团队集结地',

  // ── 图片 ──
  AddPicture: '发布创作 - 留下光影足迹',
  AddPictureBatch: '工业巨兽 - 批量捕获灵感',
  PictureDetail: '作品详情 - 细赏光影',
  MobilePictureDetail: '掌上图界 - 细赏光影',
  PictureRedirect: '作品中转站',
  SearchPicture: '大海捞图 - 图片搜索',
  GuessYouLike: '猜你喜欢',

  // ── 版权 ──
  CopyrightRegister: '版权卫士 - 登记大厅',
  CopyrightTrace: '时光追溯 - 版权查询',

  // ── 空间 ──
  AddSpace: '开辟空间 - 创建你的小宇宙',
  SpaceDetail: '空间漫游 - 探索灵感领地',
  SpaceAnalyze: '数据航线 - 空间分析舱',
  SpaceUserManage: '空间成员 - 部落守卫',
  SpaceChat: '部落篝火 - 团队聊天室',
  SpaceActivityManage: '空间派对 - 活动中心',

  // ── 聊天 ──
  PrivateChat: '悄悄话 - 私聊频道',
  ChatList: '消息信箱 - 联系人列表',
  PCChat: '同频共振 - 全屏互动',
  AIChat: '召唤 AI - 你的赛博助手',
  ChatRedirect: '连接接入中 - 正在为您跳转至专属聊天频道，请稍候片刻，即将开启您的跨频交流体验',

  // ── 论坛 & 帖子 ──
  Forum: '叽叽喳喳 - 悦木社区',
  PostDetail: '帖子详情 - 围观前排',
  PostEdit: '挥洒文笔 - 编辑帖子',

  // ── 活动 ──
  ActivityDetail: '活动详情 - 热闹进行时',
  ActivityEdit: '筹备狂欢 - 编辑活动',
  ActivitySubmissionManage: '稿件中心 - 提交审核',

  // ── 消息 & 互动 ──
  MessageCenter: '收到新电波 - 消息中心',
  InteractionHistory: '时光机 - 互动足迹',

  // ── 搜索 & 发现 ──
  Search: '全站探索 - 寻找你的热爱',
  Discovery: '漫游指南 - 发现大千世界',

  // ── 其他页面 ──
  Ranking: '风云榜单 - 看看谁最火',
  InvitePage: '邀请计划 - 会员中心',
  FriendLinks: '星际邻居 - 友情链接',
  Contact: '电波发射 - 联系我们',
  FollowList: '特别关注 - 我的星系',
  Barrage: '畅所欲言 - 灵感弹幕墙',
  BrowseHistory: '记忆走廊 - 浏览足迹',
  LoginRecords: '登录记录 - 账号安全',
  Redirect: '跃迁中...请稍候',
  AiResource: 'AI 资源库 - 你的数字资产',
  CreatorAnalytics: '创作者中心 - 数据罗盘',
  Reminder: '备忘录 - 赛博记忆体',
  ItemAnalytics: '作品分析 - 数据透视',

  // ── 游戏 ──
  Games: '摸鱼专区 - 欢乐小游戏，工作学习之余的放松神器，海量经典在线网页游戏等你来探索挑战',

  // ── 工具 ──
  Tools: '次元百宝箱 - 实用工具，集合了包括全能计算器、进制转换、颜色取色器在内的一系列常用工具',
  Calculator: '百宝箱 - 全能计算器',
  Timer: '百宝箱 - 倒计时与秒表',
  FoodWheel: '百宝箱 - 命运大转盘：今天吃啥',
  StickyWall: '百宝箱 - 记忆便签墙',
  Pomodoro: '百宝箱 - 沉浸番茄钟',
  Random: '百宝箱 - 量子随机数生成',
  BaseConverter: '百宝箱 - 程序员的进制转换',
  UnitConverter: '百宝箱 - 万能单位换算',
  TextLab: '百宝箱 - 赛博文本处理器',
  VaultKey: '百宝箱 - 坚盾密码生成器',
  GridRuler: '百宝箱 - 像素级屏幕游标卡尺',
  ColorPicker: '百宝箱 - 灵感取色器',

  // ── 恋爱画板 ──
  LoveBoard: '心动频率 - 恋爱专属画板',
  LoveBoardShare: '见证心动 - 恋爱画板',
  LoveBoardList: '浪漫广场 - 恋爱画板展厅',

  // ── 相册 ──
  TimeAlbumDetail: '时光放映机 - 相册纪实',
  MusicAlbumDetail: '黑胶唱片 - 音乐专辑',

  // ── 隐私 ──
  PrivacyCenter: '隐私中心 - Privacy Center',
  PrivacyPolicy: '隐私政策 - Privacy Policy',

  // ── 管理后台 ──
  AdminManage: '中枢大厅 - 核心控制台',
  AdminUserManage: '中枢大厅 - 用户管理',
  AdminPictureManage: '中枢大厅 - 图片管理',
  AdminSpaceManage: '中枢大厅 - 空间管理',
  AdminTagManage: '中枢大厅 - 标签风向标',
  AdminCategoryManage: '中枢大厅 - 视界分类',
  AdminReportManage: '中枢大厅 - 风纪委员会',
  AdminPostManage: '中枢大厅 - 贴吧站务',
  AdminCommentManage: '中枢大厅 - 弹幕净化仪',
  AdminActivityManage: '中枢大厅 - 派对管理',
  AdminSystemNotifyManage: '中枢大厅 - 全站广播室',
  AdminKnowledgeFileManage: '中枢大厅 - 知识库文件',
  AdminLikeManage: '中枢大厅 - 赞力管理',
  AdminShareManage: '中枢大厅 - 安利追踪',
  AdminAppManage: '中枢大厅 - 应用工厂',
  AdminFriendLinkManage: '中枢大厅 - 星际交通网',
  AdminAudioManage: '中枢大厅 - 留声机管理',
  AdminChatManage: '中枢大厅 - 信号塔风纪',
  AdminLoveBoardManage: '中枢大厅 - 丘比特后台',
  AdminMessageManage: '中枢大厅 - 漂流瓶清理',
  AdminRedisMonitor: '系统级 - Redis 引擎监控',
  AdminAIChatManage: '系统级 - 赛博神经元观测',
  AdminSessionManage: '系统级 - 会话拓扑图',

  // ── 404 ──
  NotFound: '404 - 页面未找到',

  // ── 创作者指南与关于我们 ──
  About: '关于我们 - 悦木图库',
  Guides: '设计与创作者指南 - 悦木图库',
  GuideDetail: '创作者指南详情 - 悦木图库',
};

/** 默认页面标题（当路由无 name 或无匹配翻译时使用） */
export const DEFAULT_ZH_TITLE = '悦木图库 - 发现、分享、创造美好瞬间';

export default zhPageTitles;
