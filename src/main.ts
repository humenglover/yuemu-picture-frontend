import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { handleBackButton } from '@/utils/back.ts'
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/reset.css'
import '@/access.ts'
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import "vue3-emoji-picker/css";
import { addUserSignInUsingPost } from '@/api/userController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
// 导入全局样式
import '@/styles/theme.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import i18n from './locales'
// 1. 先创建 app 实例
const app = createApp(App)
const pinia = createPinia()

// 2. 先 use 所有插件（包括 router），确保路由初始化完成
app.use(pinia)
app.use(router) // 关键：必须在 router.isReady() 之前执行
app.use(VueCropper)
app.use(i18n)

// 注入全局广告控制配置
app.config.globalProperties.$enableAds = __ENABLE_ADS__
app.provide('enableAds', __ENABLE_ADS__)

// 初始化安全防护
// createSecurityShield()

// 自动签到函数
const autoSignIn = async () => {
  const loginUserStore = useLoginUserStore()
  // 确保用户已登录
  if (loginUserStore.loginUser?.id) {
    try {
      await addUserSignInUsingPost()
    } catch (error) {
      console.error('自动签到失败:', error)
    }
  }
}


// 3. 等路由准备就绪后，再执行依赖路由的操作
router.isReady().then(() => {
  autoSignIn()


})


// 挂载应用
app.mount('#app')
// 使用nextTick确保在DOM更新后（也就是应用挂载完成后）执行后续逻辑
import { nextTick } from 'vue'
nextTick(() => {
  handleBackButton()
    .then(() => {
      // 这里可以添加一些后续逻辑，比如确认返回键处理逻辑添加成功后的提示等，目前为空
    })
    .catch((error) => {
      console.error('处理返回键时出现错误:', error)
    })
})

document.addEventListener('plusready', function () {
  // @ts-ignore
  if (typeof plus === 'undefined') return;

  // @ts-ignore
  if (plus.os.name === 'Android') {
    try {
      // @ts-ignore
      const wv = plus.webview.currentWebview().nativeInstanceObject();
      if (!wv) return;

      // 注意：千万不要在这里加上 wv.setLongClickable(false)
      // 在这强制改原生 View 的可长按属性会导致 Chromium 底层触摸状态机(Touch State Machine)
      // 错乱，出现长按后 App 卡死（失去所有触摸响应）的致命 Bug。
      // 震动和选中我们交给前端的 selectionchange 处理。
      // @ts-ignore
      plus.android.invoke(wv, 'setHapticFeedbackEnabled', false);
    } catch (err) {
      console.error('[NativeJS] Android error:', err);
    }
  }

  // @ts-ignore
  if (plus.os.name === 'iOS') {
    try {
      // @ts-ignore
      plus.webview.currentWebview().setStyle({ userSelect: false });
    } catch (err) {
      console.error('[NativeJS] iOS error:', err);
    }
  }
});

