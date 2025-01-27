<template>
  <div id="globalHeader">
    <div v-if="device === DEVICE_TYPE_ENUM.PC">
      <a-row :wrap="false">
        <a-col flex="200px">
          <router-link to="/">
            <div>
              <div class="logo">
                <img src="../assets/nuv.png" alt="logo" />
              </div>
            </div>
          </router-link>
        </a-col>
        <a-col flex="auto" style="margin-left: -66px">
          <a-menu
            v-model:selectedKeys="current"
            mode="horizontal"
            :items="items"
            @click="doMenuClick"
            class="custom-menu"
          />
        </a-col>
        <a-col >
          <div
            class="mobile-search mobile-search-fixed"
            v-if="!showSearch"
            @click="handleSearchClick"
          >
            <div class="search-bar">
              <a-input-search
                placeholder="搜索"
              >
              </a-input-search>
            </div>
          </div>
        </a-col>
        <!-- 用户信息展示栏 -->
        <a-col flex="120px">
          <div class="user-login-status">
            <div v-if="loginUserStore.loginUser.id">
              <a-dropdown>
                <a-space>
                  <a-avatar class="user-avatar" :src="loginUserStore.loginUser?.userAvatar || getDefaultAvatar(loginUserStore.loginUser?.userName)"/>
                  <span class="username-text">{{
                    loginUserStore.loginUser.userName ?? '无名'
                  }}</span>
                </a-space>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="setting">
                      <router-link to="/user/setting">
                        <SettingOutlined />
                        个人中心
                      </router-link>
                    </a-menu-item>
                    <a-menu-item>
                      <router-link to="/my_space">
                        <UserOutlined />
                        我的空间
                      </router-link>
                    </a-menu-item>
                    <a-menu-item key="mypros">
                      <router-link to="/my_ports">
                        <CloudUploadOutlined />
                        我的发布
                      </router-link>
                    </a-menu-item>
                    <a-menu-item @click="showLogoutConfirm">
                      <LogoutOutlined />
                      退出登录
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
            <div v-else>
              <a-button type="primary" href="/user/login" class="login-button">
                <span class="button-content">
                  <UserOutlined />
                  <span>登录</span>
                </span>
              </a-button>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>
    <div v-else class="mobile-header">
      <div class="mobile-header-content">
<!--        <div class="back-button" @click="handleBackClick">-->
<!--          <LeftOutlined />-->
<!--        </div>-->
        <div class="page-title">
          <span class="title-text">{{ currentTopText }}</span>
        </div>
      </div>
    </div>
    <!-- 退出登录确认弹框 -->
    <a-modal
      v-model:open="logoutConfirmVisible"
      :title="null"
      :footer="null"
      :width="400"
      class="logout-confirm-modal"
    >
      <div class="logout-confirm-content">
        <div class="warning-icon">
          <LogoutOutlined />
        </div>
        <h3 class="confirm-title">确认退出登录？</h3>
        <p class="confirm-desc">退出后需要重新登录才能继续使用</p>
        <div class="confirm-actions">
          <a-button class="cancel-button" @click="logoutConfirmVisible = false">取消</a-button>
          <a-button class="confirm-button" danger @click="confirmLogout">
            确认退出
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed,watch, h, ref, onMounted, onUnmounted } from 'vue'
import {
  HomeOutlined,
  LogoutOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  UserOutlined,
  LinkOutlined,
  LeftOutlined,
  CodeOutlined,
  TeamOutlined,
  PictureOutlined,
  AppstoreOutlined,
  TagsOutlined,
  FolderOutlined,
} from '@ant-design/icons-vue'
import {  message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import Router from '@/router'
// 获取默认头像
const getDefaultAvatar = (userName: string) => {
  const defaultName = userName || 'Guest'
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(defaultName)}&backgroundColor=ffd5dc,ffdfbf,ffd5dc`
}
const loginUserStore = useLoginUserStore()

const route = useRoute()

const isSearchTransitioning = ref(false)

//是否展示pc端搜索组件
const showSearch = ref(false)
//如果当前路径为path: '/search',设置为true
watch(
  () => route.path,
  (newPath) => {
    showSearch.value = newPath === '/search'
  },
  { immediate: true }
)
// 处理搜索点击
const handleSearchClick = () => {
  isSearchTransitioning.value = true

  // 添加过渡动画后再跳转
  setTimeout(() => {
    router.push('/search')
  }, 300) // 与 CSS 动画时间保持一致
}
// // 定义处理返回点击事件的函数
// const handleBackClick = () => {
//   if (route.path === '/') {
//     message.warning('已经是主页，不能再返回了')
//   } else {
//     Router.back() // 使用Router实例执行返回上一步操作
//   }
// }
// 定义用于存储设备类型的响应式变量
const device = ref<string>('')
// 页面加载时获取设备类型并获取数据
onMounted(async () => {
  device.value = await getDeviceType()
})

// 用于存储顶部显示的文字，根据路由动态变化
const currentTopText = ref('')

// 定义图标颜色配置
const iconColors = {
  home: {
    default: '#94a3b8',
    active: '#3B82F6',
    shadow: 'rgba(59, 130, 246, 0.3)',
  },
  create: {
    default: '#94a3b8',
    active: '#10b981',
    shadow: 'rgba(16, 185, 129, 0.3)',
  },
  contact: {
    default: '#94a3b8',
    active: '#f43f5e',
    shadow: 'rgba(244, 63, 94, 0.3)',
  },
  users: {
    default: '#94a3b8',
    active: '#0ea5e9',
    shadow: 'rgba(14, 165, 233, 0.3)',
  },
  pictures: {
    default: '#94a3b8',
    active: '#8b5cf6',
    shadow: 'rgba(139, 92, 246, 0.3)',
  },
  spaces: {
    default: '#94a3b8',
    active: '#f59e0b',
    shadow: 'rgba(245, 158, 11, 0.3)',
  },
  tags: {
    default: '#94a3b8',
    active: '#ec6099',
    shadow: 'rgba(236, 72, 153, 0.3)',
  },
}

// 未经过滤的菜单项
const originItems = [
  {
    key: '/',
    icon: () =>
      h(HomeOutlined, {
        style: {
          fontSize: '18px',
          color: route.path === '/' ? iconColors.home.active : iconColors.home.default,
          filter: route.path === '/' ? `drop-shadow(0 2px 4px ${iconColors.home.shadow})` : 'none',
          transition: 'all 0.3s ease',
        },
      }),
    label: '主页',
    title: '主页',
  },
  {
    key: '/add_picture',
    label: '图创修辑',
    title: '图创修辑',
    icon: () =>
      h(CodeOutlined, {
        style: {
          fontSize: '18px',
          color:
            route.path === '/add_picture' ? iconColors.create.active : iconColors.create.default,
          filter:
            route.path === '/add_picture'
              ? `drop-shadow(0 2px 4px ${iconColors.create.shadow})`
              : 'none',
          transition: 'all 0.3s ease',
        },
      }),
  },
  {
    key: 'link',
    label: h('a', { href: 'http://my.lumenglover.com/contact' }, '联系我们'),
    title: '联系我们',
    icon: () =>
      h(LinkOutlined, {
        style: {
          fontSize: '18px',
          color: iconColors.contact.active,
          filter: `drop-shadow(0 2px 4px ${iconColors.contact.shadow})`,
          transition: 'all 0.3s ease',
        },
      }),
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
    icon: () =>
      h(TeamOutlined, {
        style: {
          fontSize: '18px',
          color:
            route.path === '/admin/userManage' ? iconColors.users.active : iconColors.users.default,
          filter:
            route.path === '/admin/userManage'
              ? `drop-shadow(0 2px 4px ${iconColors.users.shadow})`
              : 'none',
          transition: 'all 0.3s ease',
        },
      }),
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
    icon: () =>
      h(PictureOutlined, {
        style: {
          fontSize: '18px',
          color:
            route.path === '/admin/pictureManage'
              ? iconColors.pictures.active
              : iconColors.pictures.default,
          filter:
            route.path === '/admin/pictureManage'
              ? `drop-shadow(0 2px 4px ${iconColors.pictures.shadow})`
              : 'none',
          transition: 'all 0.3s ease',
        },
      }),
  },
  {
    key: '/admin/spaceManage',
    label: '空间管理',
    title: '空间管理',
    icon: () =>
      h(AppstoreOutlined, {
        style: {
          fontSize: '18px',
          color:
            route.path === '/admin/spaceManage'
              ? iconColors.spaces.active
              : iconColors.spaces.default,
          filter:
            route.path === '/admin/spaceManage'
              ? `drop-shadow(0 2px 4px ${iconColors.spaces.shadow})`
              : 'none',
          transition: 'all 0.3s ease',
        },
      }),
  },
  {
    key: '/admin',
    label: '标识管理',
    title: '标识管理',
    icon: () =>
      h(TagsOutlined, {
        style: {
          fontSize: '18px',
          color:
            route.path.startsWith('/admin/tag') || route.path.startsWith('/admin/category')
              ? iconColors.tags.active
              : iconColors.tags.default,
          filter:
            route.path.startsWith('/admin/tag') || route.path.startsWith('/admin/category')
              ? `drop-shadow(0 2px 4px ${iconColors.tags.shadow})`
              : 'none',
          transition: 'all 0.3s ease',
        },
      }),
    children: [
      {
        key: '/admin/tagManage',
        label: '标签管理',
        title: '标签管理',
        icon: () =>
          h(TagsOutlined, {
            style: {
              fontSize: '16px',
              color:
                route.path === '/admin/tagManage'
                  ? iconColors.tags.active
                  : iconColors.tags.default,
              transition: 'all 0.3s ease',
            },
          }),
      },
      {
        key: '/admin/categoryManage',
        label: '分类管理',
        title: '分类管理',
        icon: () =>
          h(FolderOutlined, {
            style: {
              fontSize: '16px',
              color:
                route.path === '/admin/categoryManage'
                  ? iconColors.tags.active
                  : iconColors.tags.default,
              transition: 'all 0.3s ease',
            },
          }),
      },
    ],
  },
]

// 根据权限过滤菜单项
const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    // 管理员才能看到 /admin 开头的菜单
    if (menu?.key?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

// 展示在菜单的路由数组
const items = computed(() => filterMenus(originItems))

const router = useRouter()
// 当前要高亮的菜单项
const current = ref<string[]>([])
// 监听路由变化，更新高亮菜单项
router.afterEach((to) => {
  current.value = [to.path]
  // 根据路由路径设置顶部显示的文字
  if (to.path === '/my') {
    currentTopText.value = '我的'
  }else{
    currentTopText.value = ''
  }
})

// 路由跳转事件
const doMenuClick = ({ key }) => {
  router.push({
    path: key,
  })
}

// 退出确认相关的状态
const logoutConfirmVisible = ref(false)

// 显示退出确认框
const showLogoutConfirm = () => {
  logoutConfirmVisible.value = true
}

// 确认退出
const confirmLogout = async () => {
  try {
    const res = await userLogoutUsingPost()
    if (res.data.code === 0) {
      logoutConfirmVisible.value = false
      loginUserStore.setLoginUser({
        userName: '未登录',
      })
      message.success('退出登录成功')
      await router.push('/user/login')
    } else {
      message.error('退出登录失败，' + res.data.message)
    }
  } catch (error) {
    message.error('退出登录失败，请稍后重试')
  }
}

// 添加滚动监听
onMounted(() => {
  const handleScroll = () => {
    const header = document.querySelector('.mobile-header')
    if (header) {
      if (window.scrollY > 0) {
        header.classList.add('scrolled')
      } else {
        header.classList.remove('scrolled')
      }
    }
  }

  window.addEventListener('scroll', handleScroll)
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})
</script>

<style scoped>
/* Logo样式 */
.logo {
  height: 60px;
  display: flex;
  align-items: center;
}

.logo img {
  max-width: 50%;
  height: 32px;
  margin-right: 10px;
  transition: transform 0.3s ease;
}

.logo:hover img {
  transform: scale(1.05);
}

/* 菜单样式 */
:deep(.ant-menu) {
  background: transparent;
  border-bottom: none;
  line-height: 60px;
}

:deep(.ant-menu-item) {
  height: 60px;
  line-height: 60px;
  padding: 0 20px !important;
  margin: 0 4px !important;
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.ant-menu-item:hover) {
  background: rgba(0, 0, 0, 0.04);
}

/* 移除默认的菜单选中样式 */
:deep(.ant-menu-item-selected) {
  background: transparent !important; /* 移除默认的蓝色背景 */
  color: inherit !important; /* 使用默认文字颜色 */
}

/* 自定义选中项样式 */
:deep(.ant-menu-item-selected) {
  position: relative;
  font-weight: 500;
}

/* 修改选中项的下划线样式 */
:deep(.ant-menu-item-selected)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: transparent; /* 移除默认的蓝色下划线 */
  border-radius: 3px;
  transition: all 0.3s ease;
}

/* 选中项悬停效果 */
:deep(.ant-menu-item-selected:hover) {
  background: rgba(0, 0, 0, 0.02) !important; /* 更柔和的悬停背景 */
}

/* 未选中项的图标样式 */
:deep(.ant-menu-item:not(.ant-menu-item-selected) .anticon) {
  opacity: 0.7; /* 未选中时图标稍微透明 */
}

/* 选中项的图标容器样式 */
:deep(.ant-menu-item-selected .anticon) {
  position: relative;
  opacity: 1;
}

/* 选中项的图标光晕效果 */
:deep(.ant-menu-item-selected .anticon)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 3;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.2;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
}

/* 菜单项文字样式 */
:deep(.ant-menu-item) {
  color: #666;
  transition: color 0.3s ease;
}

:deep(.ant-menu-item-selected) {
  color: #333;
}

/* 子菜单样式优化 */
:deep(.ant-menu-submenu-title) {
  height: 60px !important;
  line-height: 60px !important;
  transition: all 0.3s ease !important;
}

:deep(.ant-menu-submenu) {
  height: 60px !important;
  line-height: 60px !important;
  padding: 0 20px !important;
  margin: 0 4px !important;
  border-radius: 6px;
}

:deep(.ant-menu-submenu-selected) {
  color: #333 !important;
}

:deep(.ant-menu-submenu:hover) {
  background: rgba(0, 0, 0, 0.04);
}

/* 子菜单图标样式 */
:deep(.ant-menu-submenu .anticon) {
  position: relative;
  font-size: 18px !important;
  margin-right: 8px;
}

/* 移除子菜单的默认箭头 */
:deep(.ant-menu-submenu-arrow) {
  display: none !important;
}

/* 确保子菜单项与父级对齐 */
:deep(.ant-menu-submenu-title) {
  padding: 0 !important;
  margin: 0 !important;
}

/* 下拉菜单样式 */
:deep(.ant-menu-sub) {
  min-width: 120px;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.ant-menu-sub .ant-menu-item) {
  height: 40px !important;
  line-height: 40px !important;
  margin: 2px 0 !important;
  padding: 0 12px !important;
  border-radius: 6px;
}

/* 用户区域样式 */
.user-login-status {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .username-text {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.user-login-status :deep(.ant-avatar) {
  transition: transform 0.3s ease;
}

.user-login-status :deep(.ant-avatar:hover) {
  transform: scale(1.1);
}

/* 移动端样式优化 */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  z-index: 2;
  margin: 0;
  padding: 0;
}

.mobile-header-content {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

/* 返回按钮样式 */
:deep(.back-button) {
  width: 64px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent; /* 移除背景 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0;
  padding: 0;
  border: none;
}

:deep(.back-button .anticon) {
  font-size: 20px;
  color: #1a1a1a; /* 改为深色，与标题颜色一致 */
}

/* 标题样式 */
:deep(.page-title) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 占位元素样式 */
:deep(.right-placeholder) {
  width: 64px;
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 标题文字样式 */
:deep(.title-text) {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

/* 适配刘海屏 */
@supports (padding-top: env(safe-area-inset-top)) {
  .mobile-header {
    padding-top: env(safe-area-inset-top);
    height: calc(64px + env(safe-area-inset-top));
  }

  :deep(.mobile-header-content) {
    height: 64px;
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}

/* 返回按钮激活状态 */
:deep(.back-button:active) {
  background: transparent; /* 移除激活状态背景 */
}

:deep(.back-button:active .anticon) {
  transform: scale(0.9);
  opacity: 0.7; /* 点击时稍微降低透明度 */
}

/* 移除所有可能的默认样式 */
.mobile-header,
:deep(.mobile-header-content),
:deep(.back-button),
:deep(.page-title),
:deep(.right-placeholder) {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

/* 添加进入动画 */
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.mobile-header {
  animation: slideDown 0.3s ease-out;
}

/* 添加滚动阴影效果 */
.mobile-header.scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 登录按钮样式 */
.login-button {
  height: 36px;
  padding: 0 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%);
  border: none;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(255, 107, 107, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }

  .button-content {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  :deep(.anticon) {
    font-size: 15px;
  }
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .login-button {
    height: 32px;
    padding: 0 16px;
    font-size: 13px;

    :deep(.anticon) {
      font-size: 14px;
    }
  }
}

/* 顶部导航菜单样式 */
:deep(.custom-menu) {
  background: transparent;
  border-bottom: none;
  line-height: 60px;

  .ant-menu-item {
    padding: 0 24px;
    margin: 0 4px;
    border-radius: 8px;
    color: #64760b;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::after {
      display: none !important;
    }

    /* 未选中状态的图标 */
    .anticon {
      margin-right: 8px;
      transition: all 0.3s ease;
    }

    /* 悬浮状态 */
    &:hover {
      color: #ff8e53;
      background: #fff6f3;

      .anticon {
        color: #ff8e53 !important;
        filter: drop-shadow(0 2px 4px rgba(255, 142, 83, 0.3)) !important;
      }
    }

    /* 选中状态 */
    &.ant-menu-item-selected {
      color: #ff8e53;
      background: #fff6f3;
      font-weight: 500;

      .anticon {
        color: #ff8e53 !important;
        filter: drop-shadow(0 2px 4px rgba(255, 142, 83, 0.3)) !important;
      }
    }
  }

  /* 子菜单样式 */
  .ant-menu-submenu {
    padding: 0 16px;
    margin: 0 4px;
    color: #64760b;

    &::after {
      display: none !important;
    }

    /* 悬浮状态 */
    &:hover {
      color: #ff8e53;
      background: #fff6f3;

      .anticon {
        color: #ff8e53 !important;
        filter: drop-shadow(0 2px 4px rgba(255, 142, 83, 0.3)) !important;
      }
    }

    /* 选中状态 */
    &.ant-menu-submenu-selected {
      color: #ff8e53;
      background: #fff6f3;

      .anticon {
        color: #ff8e53 !important;
        filter: drop-shadow(0 2px 4px rgba(255, 142, 83, 0.3)) !important;
      }
    }

    /* 展开状态 */
    &.ant-menu-submenu-open {
      color: #ff8e53;
      background: #fff6f3;

      .anticon {
        color: #ff8e53 !important;
        filter: drop-shadow(0 2px 4px rgba(255, 142, 83, 0.3)) !important;
      }
    }
  }
}

/* 响应式调整 */
@media screen and (max-width: 992px) {
  :deep(.custom-menu) {
    .ant-menu-item,
    .ant-menu-submenu {
      padding: 0 16px;
      margin: 0 2px;
    }
  }
}

/* 退出确认弹框样式 */
:deep(.logout-confirm-modal) {
  .ant-modal-content {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
  }

  .ant-modal-body {
    padding: 0;
  }
}

.logout-confirm-content {
  padding: 32px 24px;
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: #ff8e53;
  margin-bottom: 16px;

  .anticon {
    animation: pulse 2s infinite;
  }
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.confirm-desc {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.cancel-button {
  min-width: 100px;
  height: 38px;
  border-radius: 19px;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    color: #1a1a1a;
    border-color: #94a3b8;
    background: #f8fafc;
  }
}

.confirm-button {
  min-width: 100px;
  height: 38px;
  border-radius: 19px;
  background: #ff6b6b;
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #ff5252;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
  }

  &:active {
    transform: translateY(1px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
/* 移动端搜索框样式 */
.mobile-search {
  margin-top: 16px;
  z-index: 0;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-search .search-bar {
  width: 100%;
}

.mobile-search :deep(.ant-btn-icon-only){
  width: 78px;
}

/* 固定状态的搜索框样式 */
.mobile-search-fixed {
  transform: translateY(0) !important;
}
.mobile-search-fixed :deep(.ant-btn-icon-only){
  width: 28px;
}
/* 搜索框过渡动画 */
.mobile-search {
  transform: translateX(0) scale(1);
  opacity: 1;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-search.mobile-search-fixed {
  transform: translateX(calc(50vw - 50%)) scale(0.9);
}

/* 搜索框样式 */
.mobile-search :deep(.ant-input-search) {
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 32px !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 2px 4px rgba(255, 142, 83, 0.05) !important;
  backdrop-filter: blur(8px) !important;
  border: 1px solid rgba(255, 142, 83, 0.1) !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  width: 100% !important;
}

/* 固定状态时的搜索框样式 */
.mobile-search-fixed :deep(.ant-input-search) {
  width: 96px !important;
  transform: scale(1) !important;
  height: 32px;
  line-height: 32px;
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(255, 142, 83, 0.08) !important;
  border: 1px solid rgba(255, 142, 83, 0.15) !important;
  /* 修改搜索图标颜色 */
  .anticon-search {
    color: #fff !important;
    font-size: 20px !important;
    opacity: 0.9 !important;
  }
}

.mobile-search :deep(.ant-input) {
  height: 32px !important;
  font-size: 13px !important;
  padding: 0 12px !important;
  background: transparent !important;
  border: none !important;
  text-align: center !important;
  color: #1a1a1a !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .logout-confirm-content {
    padding: 24px 16px;
  }

  .warning-icon {
    font-size: 40px;
  }

  .confirm-title {
    font-size: 16px;
  }

  .confirm-desc {
    font-size: 13px;
  }

  .confirm-actions {
    gap: 8px;
  }

  .cancel-button,
  .confirm-button {
    min-width: 90px;
    height: 36px;
    font-size: 13px;
  }
}
/* PC端搜索框样式 */
.search-wrapper {
  padding: 8px 0;
  padding-bottom: 24px;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  border-bottom: 1px solid #f1f5f9;
  margin-top: -8px;
  will-change: transform;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-bar {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px;
}

:deep(.ant-input-search) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.ant-input-search .ant-input) {
  margin: auto;
  height: 28px;
  font-size: 14px;
  padding: 0 12px;
}

:deep(.ant-input-search .ant-input-group-addon:last-child) {
  inset-inline-start: 0;
  padding: 0;
  border: 0;
}

:deep(.ant-input-search .ant-btn) {
  height: 36px;
  font-size: 14px;
  background: #ff8e53;
  border-color: #ff8e53;
  box-shadow: none;
}

:deep(.ant-input-search .ant-btn:hover) {
  background: #ff7a33;
  border-color: #ff7a33;
}

.search-icon {
  color: #114da1;
  font-size: 16px;
}

</style>
