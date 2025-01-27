import { createApp} from 'vue'
import { createPinia } from 'pinia'
import { handleBackButton } from '@/utils/back.ts'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@/access.ts'
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/index.css'
// import { message } from 'ant-design-vue'
import "vue3-emoji-picker/css";
const app = createApp(App)


window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise Rejection:', event.reason)
})

app.use(createPinia())
app.use(router)
app.use(Antd)
app.use(VueCropper)

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
