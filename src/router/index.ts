import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'
import { shouldSaveScrollPosition } from '@/constants/route'
import { getDeviceType } from '@/utils/device'
import i18n from '@/locales'

import HomePage from '@/pages/HomePage.vue'

const DEFAULT_ZH_TITLE = '悦木图库 - 发现、分享、创造美好瞬间'
const DEFAULT_EN_TITLE = 'yuemutuku - Discover, Share, Create Beautiful Moments'
let prevRoute: RouteLocationNormalizedLoaded | null = null

/** 根据当前语言和路由名获取页面标题 */
const resolvePageTitle = (to: RouteLocationNormalized): string => {
  if (to.name) {
    const routeName = to.name as string
    const key = `pageTitles.${routeName}`
    const translated = i18n.global.t(key)
    // t() 返回 key 本身说明翻译未命中，回退到 meta.title
    if (translated && translated !== key) {
      return translated
    }
  }
  // meta.title 作为兜底（中文硬编码标题）
  const metaTitle = to.meta?.title ? String(to.meta.title) : ''
  if (metaTitle) return metaTitle
  // 最终兜底：按语言显示默认站点名
  return i18n.global.locale.value === 'en-US' ? DEFAULT_EN_TITLE : DEFAULT_ZH_TITLE
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/redirect',
      name: 'Redirect',
      component: () => import('@/pages/RedirectPage.vue'),
      meta: {
        keepAlive: false,
        title: '跃迁中...请稍候'
      },
    },
    {
      path: '/ai_resource',
      name: 'AiResource',
      component: () => import('@/pages/AiResourcePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: 'AI 资源库 - 你的数字资产'
      },
    },
    {
      path: '/',
      name: 'Home',
      component: HomePage,
      meta: {
        keepAlive: true,
        title: '首页 - 发现美好瞬间'
      },
    },
    {
      path: '/home',
      name: 'MyHome',
      component: HomePage,
      meta: {
        keepAlive: true,
        title: '首页 - 发现美好瞬间'
      },
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/pages/AboutPage.vue'),
      meta: {
        keepAlive: true,
        title: '关于我们 - 悦木图库'
      }
    },
    {
      path: '/guides',
      name: 'Guides',
      component: () => import('@/pages/GuidesPage.vue'),
      meta: {
        keepAlive: true,
        title: '设计与创作者指南 - 悦木图库'
      }
    },
    {
      path: '/guides/:id',
      name: 'GuideDetail',
      component: () => import('@/pages/GuideDetailPage.vue'),
      meta: {
        keepAlive: false,
        title: '创作者指南详情 - 悦木图库'
      }
    },
    {
      path: '/contact',
      name: 'Contact',
      component: () => import('@/pages/ContactPage.vue'),
      meta: {
        keepAlive: true,
        title: '联系与关于创作者 - 悦木图库'
      }
    },
    {
      path: '/privacy',
      name: 'Privacy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
      meta: {
        keepAlive: true,
        title: '隐私政策 - 悦木图库'
      }
    },
    {
      path: '/admin/knowledgeFileManage',
      name: 'AdminKnowledgeFileManage',
      component: () => import('@/pages/admin/KnowledgeFileManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 知识库文件'
      }
    },
    {
      path: '/user/login',
      name: 'UserLogin',
      component: () => import('@/pages/user/UserLoginPage.vue'),
      meta: {
        keepAlive: false,
        title: '登录 - 欢迎回到悦木'
      },
    },
    {
      path: '/user/register',
      name: 'UserRegister',
      component: () => import('@/pages/user/UserRegisterPage.vue'),
      meta: {
        keepAlive: false,
        title: '注册 - 开启创作者之旅'
      },
    },
    {
      path: '/user/setting',
      name: 'UserSetting',
      component: () => import('@/views/SettingView.vue'),
      meta: {
        keepAlive: false,
        title: '账号设置 - 打造专属铭牌'
      },
    },
    {
      path: '/invite',
      name: 'InvitePage',
      component: () => import('@/pages/InvitePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '邀请计划 - 会员中心'
      },
    },
    {
      path: '/add_picture',
      name: 'AddPicture',
      component: () => import('@/pages/AddPicturePage.vue'),
      meta: {
        keepAlive: false,
        title: '发布创作 - 留下光影足迹'
      },
    },
    {
      path: '/admin/userManage',
      name: 'AdminUserManage',
      component: () => import('@/pages/admin/UserManagePage.vue'),
      meta: {
        keepAlive: false,
        title: '中枢大厅 - 用户管理'
      },
    },
    {
      path: '/admin/pictureManage',
      name: 'AdminPictureManage',
      component: () => import('@/pages/admin/PictureManagePage.vue'),
      meta: {
        keepAlive: false,
        title: '中枢大厅 - 图片管理'
      },
    },
    {
      path: '/admin/spaceManage',
      name: 'AdminSpaceManage',
      component: () => import('@/pages/admin/SpaceManagePage.vue'),
      meta: {
        keepAlive: false,
        title: '中枢大厅 - 空间管理'
      },
    },
    {
      path: '/add_space',
      name: 'AddSpace',
      component: () => import('@/pages/AddSpacePage.vue'),
      meta: {
        keepAlive: false,
        title: '开辟空间 - 创建你的小宇宙'
      },
    },
    {
      path: '/my_space',
      name: 'MySpace',
      component: () => import('@/pages/MySpacePage.vue'),
      meta: {
        keepAlive: true,
        title: '我的小宇宙'
      },
    },
    {
      path: '/space/:id',
      name: 'SpaceDetail',
      component: () => import('@/pages/SpaceDetailPage.vue'),
      props: true,
      meta: {
        keepAlive: true,
        title: '空间漫游 - 探索灵感领地'
      },
    },
    {
      path: '/spaceUserManage/:id',
      name: 'SpaceUserManage',
      component: () => import('@/pages/admin/SpaceUserManagePage.vue'),
      props: true,
      meta: {
        keepAlive: false,
        title: '空间成员 - 部落守卫'
      }
    },
    {
      path: '/my_ports',
      name: 'MyPosts',
      component: () => import('@/pages/MyPostsPage.vue'),
      props: true,
      meta: {
        keepAlive: false,
        title: '我的投稿 - 创作历程'
      },
    },
    {
      path: '/admin/systemNotifyManage',
      name: 'AdminSystemNotifyManage',
      component: () => import('@/pages/admin/SystemNotifyManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 全站广播室'
      }
    },
    {
      path: '/user/report-center',
      name: 'UserReportCenter',
      component: () => import('@/pages/user/UserReportCenter.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '小黑屋 - 举报与申诉中心'
      },
    },
    {
      path: '/my_teams',
      name: 'MyTeams',
      component: () => import('@/pages/MyTeamsPage.vue'),
      meta: {
        keepAlive: true,
        needLogin: true,
        title: '我的部落 - 团队集结地'
      },
    },
    {
      path: '/my',
      name: 'MyPage',
      component: () => import('@/pages/MyPage.vue'),
      meta: {
        keepAlive: true,
        title: '个人中心 - 我的悦木'
      },
      props: (route) => ({
        messageCenterUnreadCount: 0
      })
    },
    {
      path: '/space_analyze',
      name: 'SpaceAnalyze',
      component: () => import('@/pages/SpaceAnalyzePage.vue'),
      meta: {
        keepAlive: false,
        title: '数据航线 - 空间分析舱'
      },
    },
    {
      path: '/search_picture',
      name: 'SearchPicture',
      component: () => import('@/pages/SearchPicturePage.vue'),
      meta: {
        keepAlive: false,
        title: '大海捞图 - 图片搜索'
      },
    },
    {
      path: '/guess_you_like',
      name: 'GuessYouLike',
      component: () => import('@/pages/GuessYouLikePage.vue'),
      meta: {
        keepAlive: true,
        title: '猜你喜欢'
      },
    },
    {
      path: '/admin/tagManage',
      name: 'AdminTagManage',
      component: () => import('@/pages/admin/TagManagePage.vue'),
      meta: {
        keepAlive: false,
        title: '中枢大厅 - 标签风向标'
      },
    },
    {
      path: '/admin/categoryManage',
      name: 'AdminCategoryManage',
      component: () => import('@/pages/admin/CategoryManagePage.vue'),
      meta: {
        keepAlive: false,
        title: '中枢大厅 - 视界分类'
      },
    },
    {
      path: '/picture/:id',
      name: 'PictureDetail',
      component: () => import('@/pages/PictureDetailPage.vue'),
      props: true,
      meta: {
        keepAlive: false,
        title: '作品详情 - 细赏光影'
      }
    },
    {
      path: '/mobile/picture/:id',
      name: 'MobilePictureDetail',
      component: () => import('@/pages/MobilePictureDetailPage.vue'),
      props: true,
      meta: {
        keepAlive: false,
        title: '掌上图界 - 细赏光影'
      },
    },
    {
      path: '/picture-redirect/:id',
      name: 'PictureRedirect',
      component: () => import('@/pages/PictureRedirectPage.vue'),
      props: true,
      meta: {
        title: '作品中转站'
      },
    },
    {
      path: '/item/analytics/:type/:id',
      name: 'ItemAnalytics',
      component: () => import('@/pages/ItemAnalyticsPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '作品分析 - 数据透视'
      }
    },
    {
      path: '/picture/copyright/register',
      name: 'CopyrightRegister',
      component: () => import('@/pages/CopyrightRegisterPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '版权卫士 - 登记大厅'
      },
    },
    {
      path: '/picture/copyright/trace',
      name: 'CopyrightTrace',
      component: () => import('@/pages/CopyrightTracePage.vue'),
      meta: {
        keepAlive: false,
        title: '时光追溯 - 版权查询'
      },
    },
    {
      path: '/add_picture/batch',
      name: 'AddPictureBatch',
      component: () => import('@/pages/AddPictureBatchPage.vue'),
      meta: {
        keepAlive: false,
        title: '工业巨兽 - 批量捕获灵感'
      },
    },
    {
      path: '/admin/reportManage',
      name: 'AdminReportManage',
      component: () => import('@/pages/admin/ReportManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 风纪委员会'
      }
    },
    {
      path: '/follow-list',
      name: 'FollowList',
      component: () => import('@/pages/FollowListPage.vue'),
      meta: {
        keepAlive: false,
        title: '特别关注 - 我的星系'
      },
    },
    {
      path: '/user/:id',
      name: 'UserDetail',
      component: () => import('@/pages/UserDetailPage.vue'),
      props: true,
      meta: {
        keepAlive: true,
        title: 'TA的空间 - 遇见有趣的灵魂'
      },
    },
    {
      path: '/friend-links',
      name: 'FriendLinks',
      component: () => import('@/pages/FriendLinks.vue'),
      meta: {
        keepAlive: true,
        title: '星际邻居 - 友情链接'
      },
    },
    {
      path: '/search',
      name: 'Search',
      component: () => import('@/pages/SearchPage.vue'),
      meta: {
        title: '全站探索 - 寻找你的热爱'
      }
    },
    {
      path: '/space_chat/:id',
      name: 'SpaceChat',
      component: () => import('@/pages/SpaceChatPage.vue'),
      meta: {
        title: '部落篝火 - 团队聊天室'
      }
    },
    {
      path: '/chat/:userId?',
      name: 'PrivateChat',
      component: () => import('@/pages/ChatPage.vue'),
      props: true,
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '悄悄话 - 私聊频道'
      }
    },
    {
      path: '/forum',
      name: 'Forum',
      component: () => import('@/pages/ForumPage.vue'),
      meta: {
        keepAlive: true,
        title: '叽叽喳喳 - 悦木社区'
      },
    },
    {
      path: '/chat-list',
      name: 'ChatList',
      component: () => import('@/pages/ChatListPage.vue'),
      meta: {
        needLogin: true,
        keepAlive: false,
        title: '消息信箱 - 联系人列表'
      }
    },
    {
      path: '/post/:id',
      name: 'PostDetail',
      component: () => import('@/pages/PostDetailPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '帖子详情 - 围观前排'
      }
    },
    {
      path: '/post/edit/:id?',
      name: 'PostEdit',
      component: () => import('@/pages/PostEditPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '挥洒文笔 - 编辑帖子'
      }
    },
    {
      path: '/admin/postManage',
      name: 'AdminPostManage',
      component: () => import('@/pages/admin/PostManagePage.vue'),
      meta: {
        requireAuth: true,
        requireAdmin: true,
        title: '中枢大厅 - 贴吧站务'
      }
    },
    {
      path: '/admin/activityManage',
      name: 'AdminActivityManage',
      component: () => import('@/pages/admin/ActivityManagePage.vue'),
      meta: {
        requireAuth: true,
        requireAdmin: true,
        title: '中枢大厅 - 派对管理'
      }
    },
    {
      path: '/space/:spaceId/activityManage',
      name: 'SpaceActivityManage',
      component: () => import('@/pages/SpaceActivityManagePage.vue'),
      props: true,
      meta: {
        requireAuth: true,
        needLogin: true,
        title: '空间派对 - 活动中心'
      }
    },
    {
      path: '/activity/edit/:id?',
      name: 'ActivityEdit',
      component: () => import('@/pages/ActivityEditPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '筹备狂欢 - 编辑活动'
      }
    },
    {
      path: '/activity/detail/:id',
      name: 'ActivityDetail',
      component: () => import('@/pages/ActivityDetailPage.vue'),
      meta: {
        keepAlive: false,
        title: '活动详情 - 热闹进行时'
      }
    },
    {
      path: '/activity/submission/manage',
      name: 'ActivitySubmissionManage',
      component: () => import('@/pages/ActivitySubmissionManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '稿件中心 - 提交审核'
      }
    },
    {
      path: '/message-center',
      name: 'MessageCenter',
      component: () => import('@/pages/MessageCenterPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '收到新电波 - 消息中心'
      }
    },
    {
      path: '/message/history',
      name: 'InteractionHistory',
      component: () => import('@/pages/InteractionHistoryPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '时光机 - 互动足迹'
      }
    },
    {
      path: '/user/reset-password',
      name: 'UserResetPassword',
      component: () => import('@/pages/user/UserResetPasswordPage.vue'),
      meta: {
        keepAlive: false,
        title: '安全中心 - 重置密码'
      },
    },
    {
      path: '/chat/ai',
      name: 'AIChat',
      component: () => import('@/pages/AIChatPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '召唤 AI - 你的赛博助手'
      }
    },
    {
      path: '/admin/manage',
      name: 'AdminManage',
      component: () => import('@/pages/AdminManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 核心控制台'
      }
    },
    {
      path: '/reminder',
      name: 'Reminder',
      component: () => import('@/pages/ReminderPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '备忘录 - 赛博记忆体'
      }
    },
    {
      path: '/admin/likeManage',
      name: 'AdminLikeManage',
      component: () => import('@/pages/admin/LikeManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 赞力管理'
      }
    },
    {
      path: '/admin/shareManage',
      name: 'AdminShareManage',
      component: () => import('@/pages/admin/ShareManagePage.vue'),
      meta: {
        keepAlive: false,
        title: '中枢大厅 - 安利追踪'
      },
    },
    {
      path: '/admin/appManage',
      name: 'AdminAppManage',
      component: () => import('@/pages/admin/AppManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 应用工厂'
      }
    },
    {
      path: '/admin/friendLinkManage',
      name: 'AdminFriendLinkManage',
      component: () => import('@/pages/admin/FriendLinkManagePage.vue'),
      meta: {
        keepAlive: false,
        title: '中枢大厅 - 星际交通网'
      }
    },
    {
      path: '/admin/audioManage',
      name: 'AdminAudioManage',
      component: () => import('@/pages/admin/AudioManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 留声机管理'
      }
    },
    {
      path: '/admin/chatManage',
      name: 'AdminChatManage',
      component: () => import('@/pages/admin/ChatManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 信号塔风纪'
      }
    },
    {
      path: '/admin/loveBoardManage',
      name: 'AdminLoveBoardManage',
      component: () => import('@/pages/admin/LoveBoardManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 丘比特后台'
      }
    },
    {
      path: '/admin/messageManage',
      name: 'AdminMessageManage',
      component: () => import('@/pages/admin/MessageManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 漂流瓶清理'
      }
    },
    {
      path: '/admin/redisMonitor',
      name: 'AdminRedisMonitor',
      component: () => import('@/pages/admin/RedisCacheMonitorPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '系统级 - Redis 引擎监控'
      }
    },
    {
      path: '/admin/aiChatManage',
      name: 'AdminAIChatManage',
      component: () => import('@/pages/admin/AiChatManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '系统级 - 赛博神经元观测'
      }
    },
    {
      path: '/admin/sessionManage',
      name: 'AdminSessionManage',
      component: () => import('@/pages/admin/SessionManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '系统级 - 会话拓扑图'
      }
    },
    {
      path: '/admin/commentManage',
      name: 'AdminCommentManage',
      component: () => import('@/pages/admin/CommentManagePage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        requireAdmin: true,
        title: '中枢大厅 - 弹幕净化仪'
      }
    },
    {
      path: '/games',
      children: [
        {
          path: 'snake',
          component: () => import('@/pages/games/SnakeGamePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 贪吃蛇' }
        },
        {
          path: '2048',
          component: () => import('@/pages/games/Game2048Page.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 2048' }
        },
        {
          path: 'queens',
          component: () => import('@/pages/games/QueensGamePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 八皇后' }
        },
        {
          path: 'tetris',
          component: () => import('@/pages/games/TetrisPage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 俄罗斯方块' }
        },
        {
          path: 'sliding-puzzle',
          component: () => import('@/pages/games/SlidingPuzzlePage.vue'),
          meta: { title: '游乐场 - 滑动拼图', keepAlive: false, needLogin: true }
        },
        {
          path: 'color-challenge',
          component: () => import('@/pages/games/ColorChallengePage.vue'),
          meta: { title: '游乐场 - 绝对色感挑战', keepAlive: false, needLogin: true }
        },
        {
          path: 'link-link',
          component: () => import('@/pages/games/LinkLinkPage.vue'),
          meta: { title: '游乐场 - 连连看', keepAlive: false, needLogin: true }
        },
        {
          path: 'brick',
          component: () => import('@/pages/games/BrickGamePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 疯狂打砖块' }
        },
        {
          path: 'dino',
          component: () => import('@/pages/games/DinoGamePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 恐龙快跑' }
        },
        {
          path: 'memory-card',
          component: () => import('@/pages/games/MemoryCardPage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 记忆翻牌' }
        },
        {
          path: 'minesweeper',
          component: () => import('@/pages/games/MinesweeperPage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 扫雷排爆手' }
        },
        {
          path: 'sbti',
          component: () => import('@/pages/games/SBTIGame.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - SBTI人格解析' }
        },
        {
          path: 'aa-game',
          component: () => import('@/pages/games/AAGamePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 见缝插针' }
        },
        {
          path: 'sudoku',
          component: () => import('@/pages/games/SudokuPage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 数独大脑' }
        },
        {
          path: 'box-jump',
          component: () => import('@/pages/games/BoxJumpPage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 跳一跳' }
        },
        {
          path: 'maze-runner',
          component: () => import('@/pages/games/MazeRunnerPage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 迷宫逃脱' }
        },
        {
          path: 'tank-battle',
          component: () => import('@/pages/games/TankBattlePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 坦克大战' }
        },
        {
          path: 'cat-trap',
          component: () => import('@/pages/games/CatTrapPage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 神经猫捕获器' }
        },
        {
          path: 'whack-mole',
          component: () => import('@/pages/games/WhackMolePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 疯狂打地鼠' }
        },
        {
          path: 'plane-war',
          component: () => import('@/pages/games/PlaneWarPage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 雷电飞机大战' }
        },
        {
          path: 'draw-line',
          component: () => import('@/pages/games/DrawLinePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 脑洞画线' }
        },
        {
          path: 'fruit-slice',
          component: () => import('@/pages/games/FruitSlicePage.vue'),
          meta: { keepAlive: false, needLogin: true, title: '游乐场 - 水果切切乐' }
        }
      ]
    },
    {
      path: '/games',
      name: 'Games',
      component: () => import('@/pages/GamesPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '摸鱼专区 - 欢乐小游戏'
      }
    },
    {
      path: '/tools',
      name: 'Tools',
      component: () => import('@/pages/ToolsPage.vue'),
      meta: {
        title: '次元百宝箱 - 实用工具',
        requiresAuth: true
      }
    },
    {
      path: '/tools/calculator',
      name: 'Calculator',
      component: () => import('@/pages/tools/CalculatorPage.vue'),
      meta: { title: '百宝箱 - 全能计算器', requiresAuth: true }
    },
    {
      path: '/tools/timer',
      name: 'Timer',
      component: () => import('@/pages/tools/TimerPage.vue'),
      meta: { title: '百宝箱 - 倒计时与秒表', requiresAuth: true }
    },
    {
      path: '/tools/food-wheel',
      name: 'FoodWheel',
      component: () => import('@/pages/tools/FoodWheelPage.vue'),
      meta: { title: '百宝箱 - 命运大转盘：今天吃啥', requiresAuth: true }
    },
    {
      path: '/tools/sticky-wall',
      name: 'StickyWall',
      component: () => import('@/pages/tools/StickyWallPage.vue'),
      meta: { title: '百宝箱 - 记忆便签墙', requiresAuth: true }
    },
    {
      path: '/tools/pomodoro',
      name: 'Pomodoro',
      component: () => import('@/pages/tools/PomodoroPage.vue'),
      meta: { title: '百宝箱 - 沉浸番茄钟', requiresAuth: true }
    },
    {
      path: '/tools/random',
      name: 'Random',
      component: () => import('@/pages/tools/RandomPage.vue'),
      meta: { title: '百宝箱 - 量子随机数生成', requiresAuth: true }
    },
    {
      path: '/tools/base-converter',
      name: 'BaseConverter',
      component: () => import('@/pages/tools/BaseConverterPage.vue'),
      meta: { title: '百宝箱 - 程序员的进制转换', requiresAuth: true }
    },
    {
      path: '/tools/unit-converter',
      name: 'UnitConverter',
      component: () => import('@/pages/tools/UnitConverter.vue'),
      meta: { title: '百宝箱 - 万能单位换算', requiresAuth: true }
    },
    {
      path: '/tools/text-lab',
      name: 'TextLab',
      component: () => import('@/pages/tools/TextLab.vue'),
      meta: { title: '百宝箱 - 赛博文本处理器', requiresAuth: true }
    },
    {
      path: '/tools/vault-key',
      name: 'VaultKey',
      component: () => import('@/pages/tools/VaultKey.vue'),
      meta: { title: '百宝箱 - 坚盾密码生成器', requiresAuth: true }
    },
    {
      path: '/tools/grid-ruler',
      name: 'GridRuler',
      component: () => import('@/pages/tools/GridRuler.vue'),
      meta: { title: '百宝箱 - 像素级屏幕游标卡尺', requiresAuth: true }
    },
    {
      path: '/pc-chat',
      name: 'PCChat',
      component: () => import('@/pages/PCChatPage.vue'),
      meta: {
        name: 'PCChatPage',
        needLogin: true,
        keepAlive: true,
        title: '同频共振 - 全屏互动'
      }
    },
    {
      path: '/chat-redirect',
      name: 'ChatRedirect',
      component: () => import('@/pages/ChatRedirectPage.vue'),
      meta: {
        needLogin: true,
        title: '连接接入中...'
      }
    },
    {
      path: '/tools/color-picker',
      name: 'ColorPicker',
      component: () => import('@/pages/tools/ColorPickerPage.vue'),
      meta: {
        title: '百宝箱 - 灵感取色器',
        requiresAuth: true
      }
    },
    {
      path: '/barrage',
      name: 'Barrage',
      component: () => import('@/pages/BarragePage.vue'),
      meta: {
        title: '畅所欲言 - 灵感弹幕墙',
        requireAuth: false
      }
    },
    {
      path: '/browse-history',
      name: 'BrowseHistory',
      component: () => import('@/pages/BrowseHistoryPage.vue'),
      meta: {
        title: '记忆走廊 - 浏览足迹',
        keepAlive: false,
        needLogin: true
      }
    },
    {
      path: '/login-records',
      name: 'LoginRecords',
      component: () => import('@/pages/LoginRecordManagePage.vue'),
      meta: {
        title: '登录记录 - 账号安全',
        keepAlive: false,
        needLogin: true
      }
    },
    {
      path: '/loveboard',
      name: 'LoveBoard',
      component: () => import('@/views/LoveBoardView.vue'),
      meta: {
        title: '心动频率 - 恋爱专属画板',
        requireAuth: false,
        keepAlive: false,
      },
    },
    {
      path: '/loveboard/:id',
      name: 'LoveBoardShare',
      component: () => import('@/views/LoveBoardView.vue'),
      meta: {
        title: '见证心动 - 恋爱画板',
        requireAuth: false,
        keepAlive: false,
      },
    },
    {
      path: '/loveboard/list',
      name: 'LoveBoardList',
      component: () => import('@/views/LoveBoardListView.vue'),
      meta: {
        title: '浪漫广场 - 恋爱画板展厅',
        requireAuth: false,
        keepAlive: false,
      },
    },
    {
      path: '/time-album/:id',
      name: 'TimeAlbumDetail',
      component: () => import('@/views/TimeAlbumDetailView.vue'),
      meta: {
        title: '时光放映机 - 相册纪实',
        requireAuth: false,
        keepAlive: false,
      },
    },
    {
      path: '/music-album/:id',
      name: 'MusicAlbumDetail',
      component: () => import('@/views/MusicAlbumDetailView.vue'),
      meta: {
        title: '黑胶唱片 - 音乐专辑'
      }
    },
    {
      path: '/contact',
      name: 'Contact',
      component: () => import('@/pages/ContactPage.vue'),
      meta: {
        title: '电波发射 - 联系我们',
        keepAlive: false
      }
    },
    {
      path: '/discovery',
      name: 'Discovery',
      component: () => import('@/pages/DiscoveryPage.vue'),
      meta: {
        title: '漫游指南 - 发现大千世界',
        keepAlive: false
      }
    },
    {
      path: '/creator/analytics',
      name: 'CreatorAnalytics',
      component: () => import('@/pages/CreatorAnalyticsPage.vue'),
      meta: {
        keepAlive: false,
        needLogin: true,
        title: '创作者中心 - 数据罗盘'
      }
    },
    {
      path: '/privacy-center',
      name: 'PrivacyCenter',
      component: () => import('@/views/PrivacyCenterView.vue'),
      meta: {
        keepAlive: true,
        title: '隐私中心 - Privacy Center'
      }
    },
    {
      path: '/privacy',
      name: 'PrivacyPolicy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
      meta: {
        keepAlive: true,
        title: '隐私政策 - Privacy Policy'
      }
    },
    {
      path: '/ranking',
      name: 'Ranking',
      component: () => import('@/pages/RankingPage.vue'),
      meta: {
        keepAlive: true,
        title: '风云榜单 - 看看谁最火'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        keepAlive: false,
        title: '404 - 页面未找到'
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    if (shouldSaveScrollPosition(to.path)) {
      const savedScrollPosition = sessionStorage.getItem(`scroll_${to.path}`)
      if (savedScrollPosition) {
        const position = parseInt(savedScrollPosition)
        if (!isNaN(position)) {
          return { top: position }
        }
      }
    }
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  // 核心优化：App 级路由防抖/去重，仅在移动端生效，防止双击导致相同页面入栈多次
  // 注意：排除 Vue Router 初始加载（此时 from 也会解析为 "/" 导致误杀）
  if (getDeviceType() === 'mobile' && from.matched.length > 0 && to.fullPath === from.fullPath) {
    next(false)
    return
  }

  // 异步保存滚动位置，避免阻塞路由切换
  if (shouldSaveScrollPosition(from.path)) {
    Promise.resolve().then(() => {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
      sessionStorage.setItem(`scroll_${from.path}`, scrollPosition.toString())
    })
  }
  prevRoute = from
  next()
})

let lastTitle = DEFAULT_ZH_TITLE

router.afterEach((to) => {
  const newTitle = resolvePageTitle(to)

  // 只有当标题真正改变时才更新DOM，减少不必要的DOM操作
  if (newTitle !== lastTitle) {
    document.title = newTitle
    lastTitle = newTitle
    
    // 动态更新 meta description 以解决 SEO "相同 meta 描述" 的警告
    // 结合页面标题生成独一无二的长尾描述 (100-150字符之间最佳)
    const baseDesc = '在这里您可以发现海量优质图片素材，分享生活点滴，与志同道合的创作者交流互动。加入悦木图库，开启您的创意之旅，探索无限美好可能。'
    const newDescription = `${newTitle} | ${baseDesc}`
    
    const descMeta = document.querySelector('meta[name="description"]')
    if (descMeta) descMeta.setAttribute('content', newDescription)
      
    const ogDescMeta = document.querySelector('meta[property="og:description"]')
    if (ogDescMeta) ogDescMeta.setAttribute('content', newDescription)
      
    const twDescMeta = document.querySelector('meta[name="twitter:description"]')
    if (twDescMeta) twDescMeta.setAttribute('content', newDescription)
  }
})

export { prevRoute }
export default router
