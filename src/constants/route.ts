import { stripLocalePrefix } from '@/router/localeRouter'

/**
 * 不需要显示PC端底部信息的路由路径
 */
export const HIDE_PC_FOOTER_ROUTES = [
  '/pc-chat',           // PC端聊天界面
  '/picture/:id',       // 图片详情页
  '/forum',             // 论坛
  '/barrage',
  '/admin',             // 所有管理员界面
  '/admin/:path*',      // 所有管理员子路由
  '/space/*',
  '/admin/:path*',
  '/space_analyze',     // 空间分析页面
  '/post/:path*',
  '/message-center',
  '/loveboard/:path*',
  '/loveboard',
  '/creator/analytics',
  '/search_picture',
  '/guess_you_like',    // 相似图片搜索页
  '/user/:path*',
  '/item/analytics/picture/:path*',
  '/space/:path*/activityManage',
  '/netty-test',
  '/invite',
  '/ai_resource',
  '/chat/:path*',
  '/contact',
  '/my_ports',
  '/search',
  '/games/:path*',
  '/tools/:path*',
  '/reminder',
  '/space/:path*',
  '/my',
  '/activity/detail/:path*',
  '/activity/:path*',
  '/music-album/:path*',
  '/time-album/:path*',
  '/loveboard/:path*',
  '/picture/copyright/:path*',
  '/follow-list',
  '/discovery',
  '/my_teams',
  '/add_picture',
  '/games',
  '/tools',
  '/browse-history/:path*',
  '/login-records',
  '/friend-links',
  '/add_picture/:path*',
  '/ranking',           // 榜单页面

] as const;

/**
 * 检查当前路由是否需要隐藏PC端底部信息
 * @param path 当前路由路径
 */
export const shouldHidePCFooter = (path: string): boolean => {
  const cleanPath = stripLocalePrefix(path)
  return HIDE_PC_FOOTER_ROUTES.some(route => {
    // 处理动态路由参数
    const routePattern = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$')
    return routePattern.test(cleanPath)
  })
}

/**
 * 不需要显示移动端底部信息的路由路径
 */
export const HIDE_MOBILE_FOOTER_ROUTES = [
  '/post/:id',          // 帖子详情页
  '/picture/:id',       // 图片详情页
  '/mobile/picture/:id',       // 图片详情页
  '/pc-chat',           // PC端聊天界面
  '/barrage',
  '/user/:path*',
  '/item/analytics/picture/:path*',
  '/admin',             // 所有管理员界面
  '/admin/:path*',      // 所有管理员子路由
  '/space_chat/:path*',
  '/loveboard/:path*',
  '/browse-history',
  '/creator/analytics',
  '/music-album/:path*',
  '/time-album/:path*',
  '/message-center',
  '/user/',
  '/contact',
  '/login-records',
  '/loveboard/:path*',
  '/loveboard',
  '/netty-test',
  '/chat/:path*',
  '/space/:path*',
  '/user/report-center',
  '/search',
  '/games/:path*',
  '/my_ports',
  '/add_picture',
  '/add_picture/:path*',
  '/tools/:path*',
  '/activity/:path*/:path*',
  '/reminder',          // 工具页面隐藏顶部
  '/ranking',           // 榜单页面
] as const

/**
 * 检查当前路由是否需要隐藏移动端底部信息
 * @param path 当前路由路径
 */
export const shouldHideMobileFooter = (path: string): boolean => {
  const cleanPath = stripLocalePrefix(path)
  return HIDE_MOBILE_FOOTER_ROUTES.some(route => {
    // 处理动态路由参数
    const routePattern = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$')
    return routePattern.test(cleanPath)
  })
}

/**
 * 不需要显示PC端顶部信息的路由路径
 */
export const HIDE_PC_HEADER_ROUTES = [
  '/picture/:id',       // 图片详情页
  '/barrage',
  '/games/.*',          // 游戏页面隐藏顶部 (使用 .* 兼容现有正则逻辑)
  '/tools/.*',          // 工具页面隐藏顶部
  '/reminder',          // 工具页面隐藏顶部
  '/music-album/:path*',
  '/search_picture',
  '/guess_you_like',    // 相似图片搜索页
  '/time-album/:path*',
  '/my_teams',
  '/my_teams/:path*',
  '/loveboard/:path*',
  '/picture/copyright/:path*',
  '/post/edit',
  '/space/:path*',
  '/browse-history/:path*',
  '/contact',
  '/activity/:path*/:path*',
  '/activity/edit/:path*',
  '/activity/edit',     // 活动编辑页面
  '/user/report-center',
  '/loveboard',
  '/admin/:path*',
] as const

/**
 * 检查当前路由是否需要隐藏PC端顶部信息
 * @param path 当前路由路径
 */
export const shouldHidePCHeader = (path: string): boolean => {
  const cleanPath = stripLocalePrefix(path)
  return HIDE_PC_HEADER_ROUTES.some(route => {
    // 处理动态路由参数
    const routePattern = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$')
    return routePattern.test(cleanPath)
  })
}

/**
 * 不需要显示返回上一页按钮的路由路径
 */
export const HIDE_BACK_BUTTON_ROUTES = [
  '/',                  // 主页
  '/home',              // 主页
  '/mobile/picture/:id', // 移动端图片详情页
] as const

/**
 * 检查当前路由是否需要隐藏返回上一页按钮
 * @param path 当前路由路径
 */
export const shouldHideBackButton = (path: string): boolean => {
  const cleanPath = stripLocalePrefix(path)
  return HIDE_BACK_BUTTON_ROUTES.some(route => {
    // 处理动态路由参数
    const routePattern = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$')
    return routePattern.test(cleanPath)
  })
}

/**
 * 需要保存滚动位置的路由路径
 */
export const SAVE_SCROLL_POSITION_ROUTES = [
  '/',                  // 主页
  '/home',              // 主页
  '/forum',             // 论坛页面
  '/my',                // 我的页面
  '/user/:id',          // 用户详情页面

] as const

/**
 * 检查当前路由是否需要保存滚动位置
 * @param path 当前路由路径
 */
export const shouldSaveScrollPosition = (path: string): boolean => {
  const cleanPath = stripLocalePrefix(path)
  return SAVE_SCROLL_POSITION_ROUTES.some(route => {
    // 处理动态路由参数
    const routePattern = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$')
    return routePattern.test(cleanPath)
  })
}
