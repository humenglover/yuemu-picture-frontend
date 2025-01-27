<template>
  <div id="globalFooter">
    <div v-if="device === DEVICE_TYPE_ENUM.PC" class="pc-footer">
      <div class="wave-container">
        <div class="wave wave1"></div>
        <div class="wave wave2"></div>
        <div class="wave wave3"></div>
      </div>
      <div class="footer-content">
        <p>
          © 2024 鹿梦. All rights reserved. <span style="width: 10px"></span>
          <a href="https://beian.miit.gov.cn/" target="_blank">陇ICP备2024012699号</a>
        </p>
      </div>
    </div>

    <van-tabbar v-else v-model="active" class="mobile-tabbar" :safe-area-inset-bottom="true">
      <van-tabbar-item to="/">
        <template #icon="props">
          <div class="custom-icon">
            <van-icon name="wap-home" :class="{ 'icon-active': props.active }" />
          </div>
        </template>
        <span :class="['tab-text', { 'text-active': active === 0 }]">首页</span>
      </van-tabbar-item>

      <van-tabbar-item @click="showUploadOptions">
        <template #icon>
          <div class="add-button">
            <van-icon name="plus" />
          </div>
        </template>
      </van-tabbar-item>

      <van-tabbar-item to="/my">
        <template #icon="props">
          <div class="custom-icon">
            <van-icon name="manager" :class="{ 'icon-active': props.active }" />
          </div>
        </template>
        <span :class="['tab-text', { 'text-active': active === 2 }]">我的</span>
      </van-tabbar-item>
    </van-tabbar>

    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actions"
      cancel-text="取消"
      close-on-click-action
      :round="true"
      class="custom-popup"
      position="center"
      @select="onSelect"
    >
      <template #description>
        <div class="action-sheet-header">
          <div class="header-icon">
            <van-icon name="photograph" />
          </div>
          <div class="title">选择上传位置</div>
          <div class="subtitle">选择将图片上传到公共图库或个人空间</div>
        </div>
      </template>
    </van-action-sheet>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { getDeviceType } from '@/utils/device.ts'
import router from '@/router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { listSpaceVoByPageUsingPost } from '@/api/spaceController'
import { message } from 'ant-design-vue'

// 定义用于存储设备类型的响应式变量
const device = ref<string>('')

// 用于跟踪当前活动的底部标签页，初始化为 0，对应第一个tabbar项（可根据实际默认高亮项调整）
const active = ref(0)

// 上传选项相关
const showActionSheet = ref(false)
const loginUserStore = useLoginUserStore()

// 动作面板选项
const actions = [
  {
    name: '上传到公共图库',
    color: '#ff8e53',
    subname: '您的图片将在审核通过后展示给所有用户',
    icon: 'photo-o',
  },
  {
    name: '上传到个人空间',
    color: '#ff6b6b',
    subname: '仅您自己可以查看和管理',
    icon: 'user-o',
  },
]

// 显示上传选项
const showUploadOptions = () => {
  if (!loginUserStore.loginUser.id) {
    router.push('/user/login')
    return
  }
  showActionSheet.value = true
}

// 处理选项选择
const onSelect = async (action: any) => {
  if (action.name === '上传到公共图库') {
    router.push('/add_picture')
  } else {
    try {
      // 获取用户的第一个空间
      const res = await listSpaceVoByPageUsingPost({
        userId: loginUserStore.loginUser.id,
        current: 1,
        pageSize: 1,
      })
      if (res.data.code === 0) {
        // 如果有空间，则进入上传页面
        if (res.data.data?.records?.length > 0) {
          const space = res.data.data.records[0]
          router.push({
            path: '/add_picture',
            query: {
              spaceId: space.id,
            },
          })
        } else {
          // 如果没有空间，则跳转到创建空间页面
          router.push('/add_space')
          message.warn('请先创建空间')
        }
      } else {
        message.error('加载我的空间失败，' + res.data.message)
      }
    } catch (error: any) {
      console.error('获取空间信息失败：', error)
      message.error('获取空间信息失败，请稍后重试')
    }
  }
}

// 页面加载时获取设备类型并获取数据，同时设置初始高亮项
onMounted(async () => {
  device.value = await getDeviceType()
  const currentRoute = router.currentRoute.value
  const currentPath = currentRoute.path
  if (currentPath === '/') {
    active.value = 0
  } else if (currentPath === '/add_picture') {
    active.value = 1
  } else if (currentPath === '/my') {
    active.value = 2
  }
})

// 监听路由变化，更新高亮菜单项对应的active值
router.afterEach((to) => {
  const currentPath = to.path
  if (currentPath === '/') {
    active.value = 0
  } else if (currentPath === '/add_picture') {
    active.value = 1
  } else if (currentPath === '/my') {
    active.value = 2
  }
})
</script>

<style scoped>
#globalFooter {
  z-index: 0;
}
/* PC端页脚样式 */
.pc-footer {
  position: relative;
  height: 24px;
  text-align: center;
  padding: 4px 0;
  background: linear-gradient(to bottom, transparent, rgba(255, 142, 83, 0.03));
  overflow: hidden;
  z-index: 1021;
}

.wave-container {
  position: absolute;
  top: -8px;
  left: 0;
  width: 100%;
  height: 20px;
  overflow: hidden;
}

.wave {
  position: absolute;
  left: 0;
  width: 200%;
  height: 100%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
  transform-origin: center bottom;
}

.wave1 {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 800 88.7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23ff8e5308'/%3E%3C/svg%3E");
  animation: wave 15s linear infinite;
  z-index: 3;
  opacity: 0.8;
}

.wave2 {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 800 88.7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23ff6b6b08'/%3E%3C/svg%3E");
  animation: wave 10s linear infinite;
  z-index: 2;
  opacity: 0.6;
}

.wave3 {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 800 88.7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23ff8e5305'/%3E%3C/svg%3E");
  animation: wave 7s linear infinite;
  z-index: 1;
  opacity: 0.4;
}

@keyframes wave {
  0% {
    transform: translateX(0) translateZ(0) scaleY(1);
  }
  50% {
    transform: translateX(-25%) translateZ(0) scaleY(0.95);
  }
  100% {
    transform: translateX(-50%) translateZ(0) scaleY(1);
  }
}

.footer-content {
  position: relative;
  z-index: 4;
  padding: 2px 0;
}

.footer-content p {
  color: #8d8a8a;
  margin-bottom: 1px;
  font-size: 12px;
  line-height: 1.2;
}

.footer-content a {
  color: #666;
  text-decoration: none;
  position: relative;
  transition: color 0.3s ease;
  font-size: 11px;
  line-height: 1.2;
}

.footer-content a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, #ff8e53, #ff6b6b);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

.footer-content a:hover {
  color: #ff8e53;
}

.footer-content a:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

/* 移动端底部导航栏样式 */
.mobile-tabbar {
  :deep(.van-tabbar) {
    height: 50px;
    border-top: none;
    box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.05);
  }

  :deep(.van-tabbar-item) {
    color: #94a3b8;
    font-size: 10px;
  }

  .add-button {
    position: relative;
    z-index: 2;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: -40px auto 0;
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
    border: 4px solid #fff;

    .van-icon {
      font-size: 24px;
      color: white;
    }
  }

  .custom-icon {
    margin-bottom: 4px;

    .van-icon {
      font-size: 20px;
    }
  }

  .icon-active {
    color: #ff8e53;
  }

  .text-active {
    color: #ff8e53;
  }
}

:deep(.van-tabbar-item) {
  padding: 6px 0 !important;
  height: 52px !important;
}

:deep(.van-tabbar-item__icon) {
  margin-bottom: 3px !important;
  height: auto !important;
}

:deep(.van-tabbar-item__text) {
  font-size: 12px !important;
  line-height: 1 !important;
  margin-top: 1px !important;
}

/* 自定义图标样式 */
.custom-icon {
  font-size: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1px;
}

/* 中间的上传按钮 */
.add-button {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -25px;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-button .van-icon {
  font-size: 22px;
  color: white;
}

/* 激活状态的图标和文字 */
.icon-active {
  color: #ff8e53;
  transform: scale(1.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.text-active {
  color: #ff8e53;
  font-weight: 500;
}

/* 点击效果 */
.add-button:active {
  transform: scale(0.9) rotate(-45deg);
}

/* 标签文字样式 */
.tab-text {
  font-size: 12px;
  margin-top: 2px;
  padding-bottom: 2px;
  display: block;
}

:deep(.van-tabbar-item--active) {
  background-color: transparent;
}

/* 添加渐变背景 */
:deep(.van-tabbar-item)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #ff8e53, #ff6b6b);
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 2px 2px 0 0;
}

:deep(.van-tabbar-item--active)::after {
  opacity: 1;
}

/* 弹框样式 */
.custom-popup {
  --van-action-sheet-max-height: none !important;
  z-index: 9999;
  :deep(.van-action-sheet__content) {
    padding: 20px;
    border-radius: 20px;
    background: linear-gradient(to bottom, #fff9f6, #fff);
    width: 300px;
    position: fixed;
    left: 50%;
    bottom: 120px;
    transform: translateX(-50%);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    animation: slideUpIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :deep(.van-overlay) {
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
  }

  /* 优化小三角形 */
  :deep(.van-action-sheet__content)::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #fff;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
}

.action-sheet-header {
  padding: 20px 16px 12px;
  text-align: center;
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.header-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: iconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.header-icon .van-icon {
  font-size: 24px;
  color: white;
}

.action-sheet-header .title {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 8px;
  animation: fadeIn 0.4s ease-out 0.1s both;
}

.action-sheet-header .subtitle {
  font-size: 13px;
  color: #64748b;
  animation: fadeIn 0.4s ease-out 0.2s both;
}

:deep(.van-action-sheet__item) {
  margin: 8px 0;
  padding: 16px !important;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(20px);
  opacity: 0;
  animation: fadeInUp 0.3s ease-out forwards;
}

:deep(.van-action-sheet__item:nth-child(2)) {
  animation-delay: 0.1s;
}

:deep(.van-action-sheet__cancel) {
  font-size: 14px !important;
  color: #64748b !important;
  margin-top: 8px;
  border-radius: 12px;
}

/* 动画关键帧 */
@keyframes popIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes iconPop {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 添加新的动画 */
@keyframes slideUpIn {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}
</style>
