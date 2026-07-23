<template>
  <div class="yuemu-box" :class="{ 'yuemu-is-loaded': bgLoaded }">
    <div class="yuemu-content">
      <div class="yuemu-mobile-overlay"></div>
      <div class="yuemu-login-wrapper">

        <div class="yuemu-apple-header">
          <div class="yuemu-header-text">
            <h2 class="yuemu-title">{{ currentTitle }}</h2>
            <p class="yuemu-subtitle">{{ currentSubtitle }}</p>
          </div>

          <button class="yuemu-icon-btn-switch" @click="toggleMainMethod" :title="t('pages.user.userLoginPage.switchMethod')">
            <component :is="cornerIcon" class="yuemu-icon" />
          </button>
        </div>

        <div class="yuemu-blue-doll-container" v-show="loginType === 'account'">
          <div class="yuemu-blue-doll" :class="{ 'yuemu-password': isPasswordFocused }">
            <div class="yuemu-hand"></div><div class="yuemu-hand yuemu-hand-r"></div>
            <div class="yuemu-arms"><div class="yuemu-arm"></div><div class="yuemu-arm yuemu-arm-r"></div></div>
          </div>
        </div>

        <Transition name="yuemu-apple-fade" mode="out-in">

          <div v-if="loginType === 'account'" key="account" class="yuemu-tab-panel">
            <form
              @submit.prevent="submitForm"
              class="yuemu-auth-form"
              autocomplete="off"
            >
              <div class="yuemu-input-group">
                <div class="yuemu-input-prefix">
                  <i class="fas fa-user"></i>
                </div>
                <input
                  v-model="formState.accountOrEmail"
                  type="text"
                  :placeholder="t('pages.user.userLoginPage.accountPlaceholder')"
                  class="yuemu-native-input"
                  required
                />
              </div>

              <div class="yuemu-input-group">
                <div class="yuemu-input-prefix">
                  <i class="fas fa-lock"></i>
                </div>
                <input
                  v-model="formState.userPassword"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('pages.user.userLoginPage.passwordPlaceholder')"
                  class="yuemu-native-input"
                  @focus="handlePasswordFocus"
                  @blur="handlePasswordBlur"
                  required
                />
                <button type="button" class="yuemu-pwd-toggle-btn" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
                </button>
              </div>

              <div class="yuemu-verify-group">
                <div class="yuemu-compact-verify-container">
                  <div class="yuemu-digit-inputs">
                    <input
                      v-for="(item, index) in 4"
                      :key="index"
                      v-model="codeList[index]"
                      type="text"
                      maxlength="1"
                      class="yuemu-apple-digit-input"
                      :placeholder="t('pages.user.userLoginPage.codePlaceholder')"
                      @input="handleCodeInput($event, index)"
                      @keydown.backspace="handleCodeBackspace(index)"
                      ref="codeInputRefs"
                      required
                    />
                  </div>
                  <div class="yuemu-code-captcha" @click="getVerifyCode">
                    <img :src="verifyCodeImg" :alt="$t('pages.user.userLoginPage.altCaptcha')" v-if="verifyCodeImg" />
                    <div class="yuemu-captcha-placeholder" v-else><a-spin size="small" /></div>
                  </div>
                </div>
              </div>

              <div class="yuemu-submit-item">
                <button type="submit" class="yuemu-apple-submit-btn">
                  {{ t('pages.user.userLoginPage.loginBtn') }}
                </button>
              </div>

              <div class="yuemu-auth-links">
                <RouterLink to="/user/register" class="yuemu-link-item">{{ t('pages.user.userLoginPage.registerLink') }}</RouterLink>
                <span class="yuemu-divider-dot"></span>
                <RouterLink to="/user/reset-password" class="yuemu-link-item">{{ t('pages.user.userLoginPage.resetPasswordLink') }}</RouterLink>
              </div>
            </form>
          </div>

          <div v-else-if="loginType === 'wechat'" key="wechat" class="yuemu-tab-panel">
            <div class="yuemu-qr-auth-pane">
              <div class="yuemu-apple-qr-box">
                <img src="@/assets/wx.png" alt="WeChat" class="yuemu-wx-logo" />
              </div>

              <div v-if="route.query.inviteCode" class="yuemu-invite-code-indicator">
                <i class="fas fa-gift" style="margin-right: 6px;"></i>
                {{ t('pages.user.userLoginPage.invitedText') }}{{ route.query.inviteCode }}
              </div>

              <div class="yuemu-code-display" @click="fetchWxReqCode">
                <span class="yuemu-code-text" :class="{ 'yuemu-highlight': wxReqCode !== t('pages.user.userLoginPage.fetchingText') && wxReqCode !== t('pages.user.userLoginPage.expiredText') }">
                  {{ wxReqCode }}
                </span>
              </div>
              <p class="yuemu-refresh-tip" v-if="wxReqCode === t('pages.user.userLoginPage.expiredText')" @click="fetchWxReqCode">
                <SyncOutlined /> {{ t('pages.user.userLoginPage.refreshCode') }}
              </p>
            </div>
          </div>

          <div v-else key="qrcode" class="yuemu-tab-panel">
            <div class="yuemu-qr-auth-pane">
              <div class="yuemu-qr-status-container">
                <div v-if="qrStatus === 'waiting'" class="yuemu-qr-waiting">
                  <div class="yuemu-apple-qr-box">
                    <a-qrcode
                      v-if="qrUrl"
                      :value="qrUrl"
                      :size="180"
                      color="#000000"
                      bgColor="transparent"
                      :bordered="false"
                      class="yuemu-perfect-qr"
                    />
                  </div>
                  <div class="yuemu-qr-secure-badge">
                    <SafetyCertificateFilled class="yuemu-secure-icon" /> {{ t('pages.user.userLoginPage.endToEndEncryption') }}
                  </div>
                </div>

                <div v-else-if="qrStatus === 'scanned'" class="yuemu-qr-scanned">
                  <div class="yuemu-status-icon yuemu-success"><CheckOutlined /></div>
                  <p class="yuemu-status-title">{{ t('pages.user.userLoginPage.scannedTitle') }}</p>
                  <p class="yuemu-status-desc">{{ t('pages.user.userLoginPage.scannedDesc') }}</p>
                </div>

                <div v-else-if="qrStatus === 'expired'" class="yuemu-qr-expired">
                  <div class="yuemu-status-icon yuemu-expired"><SyncOutlined /></div>
                  <p class="yuemu-status-title">{{ t('pages.user.userLoginPage.expiredTitle') }}</p>
                  <button class="yuemu-apple-refresh-btn" @click="refreshQrCode">{{ t('pages.user.userLoginPage.refreshBtn') }}</button>
                </div>

                <div v-else class="yuemu-qr-loading">
                  <a-spin size="large" />
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <div class="yuemu-apple-dock">
          <div class="yuemu-dock-item" @click="loginType = 'wechat'" :class="{ 'yuemu-active': loginType === 'wechat' }">
            <div class="yuemu-dock-icon yuemu-wechat"><i class="fab fa-weixin"></i></div>
          </div>
          <div class="yuemu-dock-item" @click="loginType = 'qrcode'" :class="{ 'yuemu-active': loginType === 'qrcode' }">
            <div class="yuemu-dock-icon yuemu-app"><i class="fas fa-qrcode"></i></div>
          </div>
          <div class="yuemu-dock-item" @click="loginType = 'account'" :class="{ 'yuemu-active': loginType === 'account' }">
            <div class="yuemu-dock-icon yuemu-account"><i class="fas fa-user"></i></div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { reactive, ref, onMounted, onUnmounted, h, watch, computed } from 'vue'
import { getCodeUsingGet, userLoginUsingPost, reqWxLoginCodeUsingGet, checkWxLoginStatusUsingGet, generateQrCodeUsingGet, checkQrStatusUsingGet } from '@/api/userController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import {
  QrcodeOutlined, DesktopOutlined,
  WechatFilled, CheckOutlined, SyncOutlined, SafetyCertificateFilled
} from '@ant-design/icons-vue'
import bgPc from '@/assets/images/login_two.jpg'
import bgMobile from '@/assets/images/login_bg_phone.png'

const bgLoaded = ref(false)
const showPassword = ref(false)
const route = useRoute()
const loginType = ref<'account' | 'wechat' | 'qrcode'>('account')
const { t } = useI18n()

const submitForm = () => {
  if (!formState.accountOrEmail || !formState.userPassword || !formState.verifyCode) {
    message.warning(t('pages.user.userLoginPage.fillRequired'))
    return
  }
  if (formState.userPassword.length < 8) {
    message.warning(t('pages.user.userLoginPage.passwordLength'))
    return
  }
  handleSubmit(formState)
}

const currentTitle = computed(() => {
  switch (loginType.value) {
    case 'account': return t('pages.user.userLoginPage.titleLogin')
    case 'wechat': return t('pages.user.userLoginPage.titleWechat')
    case 'qrcode': return t('pages.user.userLoginPage.titleQrcode')
    default: return t('pages.user.userLoginPage.titleLogin')
  }
})

const currentSubtitle = computed(() => {
  switch (loginType.value) {
    case 'account': return t('pages.user.userLoginPage.subtitleAccount')
    case 'wechat': return t('pages.user.userLoginPage.subtitleWechat')
    case 'qrcode': return t('pages.user.userLoginPage.subtitleQrcode')
    default: return ''
  }
})

const cornerIcon = computed(() => loginType.value === 'qrcode' ? DesktopOutlined : QrcodeOutlined)

const toggleMainMethod = () => {
  loginType.value = loginType.value === 'qrcode' ? 'account' : 'qrcode'
}

onMounted(() => {
  const isMobile = window.innerWidth <= 768
  const img = new Image()
  img.src = isMobile ? bgMobile : bgPc
  img.onload = () => { bgLoaded.value = true }
  img.onerror = () => { bgLoaded.value = true }

  if (route.query.type === 'wechat') {
    loginType.value = 'wechat'
    fetchWxReqCode()
  } else if (route.query.type === 'qrcode') {
    loginType.value = 'qrcode'
    generateAppQrCode()
  }
  getVerifyCode()
})

onUnmounted(() => {
  stopCheckStatusTimer()
  stopQrCheckTimer()
})

const formState = reactive<API.UserLoginRequest>({
  accountOrEmail: '',
  userPassword: '',
  serververifycode: '',
  verifyCode: '',
})

const verifyCodeImg = ref<string>('')
const loginUserStore = useLoginUserStore()
const isPasswordFocused = ref(false)

const codeList = ref(['', '', '', ''])
const codeInputRefs = ref<HTMLInputElement[]>([])

const wxReqCode = ref<string>(t('pages.user.userLoginPage.fetchingText'))
const wxSceneId = ref<string>('')
let checkStatusTimer: any = null

const qrUrl = ref<string>('')
const qrToken = ref<string>('')
const qrStatus = ref<'loading' | 'waiting' | 'scanned' | 'expired'>('loading')
let qrCheckTimer: any = null

watch(codeList, (newVal) => {
  formState.verifyCode = newVal.join('')
}, { deep: true })

watch(loginType, (val) => {
  if (val === 'wechat') {
    fetchWxReqCode()
  } else if (val === 'qrcode') {
    generateAppQrCode()
  } else {
    stopCheckStatusTimer()
    stopQrCheckTimer()
  }
})

const handlePasswordFocus = () => isPasswordFocused.value = true
const handlePasswordBlur = () => isPasswordFocused.value = false

const getVerifyCode = async () => {
  const res = await getCodeUsingGet()
  if (res.data.code === 0 && res.data.data) {
    verifyCodeImg.value = 'data:image/jpeg;base64,' + res.data.data.base64Captcha
    formState.serververifycode = res.data.data.encryptedCaptcha
    codeList.value = ['', '', '', '']
  }
}

const handleCodeInput = (e: Event, index: number) => {
  const input = e.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  codeList.value[index] = value
  input.value = value
  if (value && index < 3) codeInputRefs.value[index + 1]?.focus()
}

const handleCodeBackspace = (index: number) => {
  if (!codeList.value[index] && index > 0) {
    codeList.value[index - 1] = ''
    codeInputRefs.value[index - 1]?.focus()
  }
}

const handleSubmit = async (values: any) => {
  values.serververifycode = formState.serververifycode
  const res = await userLoginUsingPost(values)
  if (res.data.code === 0 && res.data.data) {
    await loginUserStore.fetchLoginUser()
    message.success(t('pages.user.userLoginPage.welcomeBack'))
    router.push({ name: 'MyHome', replace: true })
  } else {
    message.error(t('pages.user.userLoginPage.loginFail') + res.data.message)
    getVerifyCode()
  }
}

const fetchWxReqCode = async () => {
  wxReqCode.value = t('pages.user.userLoginPage.fetchingText')
  const res = await reqWxLoginCodeUsingGet()
  if (res.data.code === 0 && res.data.data) {
    wxReqCode.value = res.data.data.code as string
    wxSceneId.value = res.data.data.sceneId as string
    startCheckStatusTimer()
  } else {
    message.error(t('pages.user.userLoginPage.fetchFail'))
    wxReqCode.value = t('pages.user.userLoginPage.expiredText')
  }
}

const startCheckStatusTimer = () => {
  stopCheckStatusTimer()
  checkStatusTimer = setInterval(async () => {
    if (!wxSceneId.value) return
    const params: any = { sceneId: wxSceneId.value }
    if (route.query.inviteCode) {
      params.inviteCode = route.query.inviteCode as string
    }
    const res = await checkWxLoginStatusUsingGet(params)
    if (res.data.code === 0 && res.data.data) {
      stopCheckStatusTimer()
      await loginUserStore.fetchLoginUser()
      message.success(t('pages.user.userLoginPage.loginSuccess'))
      router.push({ name: 'MyHome', replace: true })
    } else if (res.data.code !== 0) {
      stopCheckStatusTimer()
      wxReqCode.value = t('pages.user.userLoginPage.expiredText')
    }
  }, 2000)
}

const stopCheckStatusTimer = () => {
  if (checkStatusTimer) { clearInterval(checkStatusTimer); checkStatusTimer = null }
}

const generateAppQrCode = async () => {
  try {
    stopQrCheckTimer()
    qrStatus.value = 'loading'
    const res = await generateQrCodeUsingGet()
    if (res.data.code === 0 && res.data.data) {
      qrToken.value = res.data.data.qrToken as string
      qrUrl.value = `yuemu://qr-login?token=${qrToken.value}`
      qrStatus.value = 'waiting'
      startQrCheckTimer()
    } else {
      qrStatus.value = 'expired'
    }
  } catch (error) {
    qrStatus.value = 'expired'
  }
}

const startQrCheckTimer = () => {
  stopQrCheckTimer()
  qrCheckTimer = setInterval(async () => {
    if (!qrToken.value) return
    try {
      const res = await checkQrStatusUsingGet({ qrToken: qrToken.value })
      if (res.data.code === 0 && res.data.data) {
        stopQrCheckTimer()
        await loginUserStore.fetchLoginUser()
        message.success(t('pages.user.userLoginPage.loginSuccess'))
        router.push({ name: 'MyHome', replace: true })
      } else if (res.data.code !== 0) {
        stopQrCheckTimer()
        qrStatus.value = 'expired'
      }
    } catch (error) {
      stopQrCheckTimer()
      qrStatus.value = 'expired'
    }
  }, 2000)
}

const stopQrCheckTimer = () => {
  if (qrCheckTimer) { clearInterval(qrCheckTimer); qrCheckTimer = null }
}

const refreshQrCode = () => generateAppQrCode()
</script>

<style scoped>
.yuemu-box {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--background);
  z-index: 1000;
  transition: var(--theme-transition);
}

.yuemu-content {
  width: 85vw;
  max-width: 1400px;
  min-height: 80vh;
  border-radius: 32px;
  background-color: var(--card-background);
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-shadow: 0 40px 80px var(--shadow-color);
  overflow: hidden;
  transition: var(--theme-transition);
}

.yuemu-content::before {
  content: ''; position: absolute; inset: 0;
  background-color: var(--background);
  animation: yuemu-bgPulse 1.5s ease-in-out infinite;
  z-index: 0; transition: opacity 0.8s ease-in-out;
}
@keyframes yuemu-bgPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

.yuemu-content::after {
  content: ''; position: absolute; inset: 0;
  background: var(--card-background) url("@/assets/images/login_two.jpg") no-repeat;
  background-size: cover; background-position: center;
  z-index: 0; opacity: 0; transition: opacity 0.8s ease-out;
}
.yuemu-box.yuemu-is-loaded .yuemu-content::before { opacity: 0; animation: none; }
.yuemu-box.yuemu-is-loaded .yuemu-content::after { opacity: 1; }

.dark-theme .yuemu-box.yuemu-is-loaded .yuemu-content::after {
  opacity: 1 !important;
  background: linear-gradient(to right, rgba(45, 45, 45, 0.02) 0%, rgba(45, 45, 45, 0.4) 40%, #2d2d2d 68%, #2d2d2d 100%),
  url("@/assets/images/login_two.jpg") no-repeat !important;
  background-size: cover, cover !important;
  background-position: center, center !important;
}

.yuemu-login-wrapper {
  position: relative;
  z-index: 1;
  width: 380px;
  margin-right: 10%;
  padding: 40px 32px;
  border-radius: 28px;
  animation: yuemu-fadeInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  min-height: 480px;
  max-height: 90vh;
  overflow-y: auto;
  scrollbar-width: none;
  transition: var(--theme-transition);
}
.yuemu-login-wrapper::-webkit-scrollbar {
  display: none;
}

@keyframes yuemu-fadeInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.yuemu-apple-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-shrink: 0;
}

.yuemu-header-text { display: flex; flex-direction: column; gap: 4px; }

.yuemu-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
  transition: var(--theme-transition);
}

.yuemu-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
  transition: var(--theme-transition);
}

.yuemu-icon-btn-switch {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--search-btn-bg);
  color: var(--text-primary);
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: var(--theme-transition);
  flex-shrink: 0;
}
.yuemu-icon-btn-switch:hover { background: var(--hover-background); transform: scale(1.05); }

/* ================= 蓝色公仔动画 ================= */
.yuemu-blue-doll-container { display: flex; justify-content: center; height: 60px; margin-bottom: 16px; flex-shrink: 0;}
.yuemu-blue-doll { width: 180px; height: 90px; background: url("@/assets/images/owl/owl.png") no-repeat center bottom; background-size: contain; position: relative; transition: all 0.3s ease; }
.yuemu-blue-doll .yuemu-hand { width: 30px; height: 30px; background: #4a332a; border-radius: 50%; position: absolute; left: 14px; bottom: -6px; transform: scaleY(0.5); transition: 0.3s; }
.yuemu-blue-doll .yuemu-hand.yuemu-hand-r { left: 136px; }
.yuemu-blue-doll.yuemu-password .yuemu-hand { transform: translate(36px, -20px) scale(0.7); }
.yuemu-blue-doll.yuemu-password .yuemu-hand.yuemu-hand-r { transform: translate(-36px, -20px) scale(0.7); }
.yuemu-blue-doll .yuemu-arms { position: absolute; top: 45px; width: 100%; height: 35px; overflow: hidden; }
.yuemu-blue-doll .yuemu-arm { width: 34px; height: 55px; position: absolute; left: 22px; top: 35px; background: url("@/assets/images/owl/owl-arm.png") no-repeat; background-size: contain; transform: rotate(-25deg); transition: 0.3s; }
.yuemu-blue-doll .yuemu-arm.yuemu-arm-r { left: 124px; transform: rotate(25deg) scaleX(-1); }
.yuemu-blue-doll.yuemu-password .yuemu-arm { transform: translateY(-35px) translateX(35px); }
.yuemu-blue-doll.yuemu-password .yuemu-arm.yuemu-arm-r { transform: translateY(-35px) translateX(-35px) scaleX(-1); }

.yuemu-apple-fade-enter-active, .yuemu-apple-fade-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-apple-fade-enter-from { opacity: 0; transform: scale(0.98) translateY(10px); }
.yuemu-apple-fade-leave-to { opacity: 0; transform: scale(0.98) translateY(-10px); }

.yuemu-tab-panel { flex: 1; display: flex; flex-direction: column; justify-content: center; }

.yuemu-input-group {
  position: relative;
  display: flex;
  align-items: center;
  height: 48px;
  background: var(--yuemu-input-bg);
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
  margin-bottom: 24px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  box-sizing: border-box;

  &:hover {
    background: color-mix(in srgb, var(--yuemu-input-bg) 95%, var(--text-primary));
    border-color: color-mix(in srgb, var(--text-primary) 20%, transparent);
  }

  &:focus-within {
    background: var(--yuemu-input-focus-bg) !important;
    border-color: var(--link-color);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--link-color) 15%, transparent);
  }
}

.yuemu-input-prefix {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: color-mix(in srgb, var(--text-primary) 40%, transparent);
  font-size: 20px;
  pointer-events: none;
  z-index: 2;
  transition: var(--theme-transition);
}

.yuemu-native-input {
  width: 100%;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  font-size: 16px;
  color: var(--text-primary) !important;
  height: 100% !important;
  padding: 0 52px 0 52px !important;
  box-sizing: border-box;
  border-radius: 28px;
  z-index: 1;

  &::placeholder {
    color: color-mix(in srgb, var(--text-primary) 35%, transparent);
  }
}

.yuemu-native-input:-webkit-autofill {
  border-radius: 28px !important;
  -webkit-box-shadow: 0 0 0 1000px #f3f3f6 inset !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  transition: background-color 5000s ease-in-out 0s;
}

.yuemu-native-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
}

.dark-theme .yuemu-native-input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px #28282c inset !important;
  -webkit-text-fill-color: #ffffff !important;
}

.dark-theme .yuemu-native-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #1e1e1e inset !important;
  -webkit-text-fill-color: #ffffff !important;
}

.yuemu-pwd-toggle-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 18px;
  z-index: 2;
  transition: var(--theme-transition);

  &:hover {
    color: var(--text-primary);
  }
}

.yuemu-verify-group {
  margin-bottom: 24px;
  width: 100%;
}

.yuemu-compact-verify-container {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.yuemu-digit-inputs {
  flex: 1;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.yuemu-apple-digit-input {
  flex: 1;
  width: 0;
  height: 48px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
  background: var(--yuemu-input-bg);
  text-align: center; font-size: 24px; font-weight: 600; color: var(--text-primary);
  outline: none; transition: var(--theme-transition);

  &:focus {
    background: var(--card-background);
    border-color: var(--link-color);
    box-shadow: 0 0 0 4px var(--nav-item-active);
  }
}

.yuemu-code-captcha {
  width: 110px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: var(--hover-background);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
  transition: var(--theme-transition);
}

.yuemu-code-captcha img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
}

.yuemu-submit-item { margin-top: 10px; margin-bottom: 16px; }
.yuemu-apple-submit-btn {
  width: 100%; height: 48px;
  border-radius: 24px;
  background: var(--text-primary);
  border: none;
  font-size: 17px; font-weight: 600; color: var(--background);
  transition: var(--theme-transition);
  &:hover { background: var(--text-secondary); transform: scale(0.99); }
}

.yuemu-auth-links {
  display: flex; justify-content: center; align-items: center; gap: 16px;
}
.yuemu-link-item { color: var(--link-color); font-size: 14px; transition: opacity 0.2s; &:hover { opacity: 0.7; } }
.yuemu-divider-dot { width: 4px; height: 4px; background: var(--border-color); border-radius: 50%; transition: var(--theme-transition);}

.yuemu-qr-auth-pane {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 20px 0;
}

.yuemu-apple-qr-box {
  padding: 16px;
  background: #ffffff; /* 二维码底色强行保白，以防深色模式扫不出来 */
  border-radius: 24px;
  box-shadow: 0 8px 30px var(--shadow-color);
  margin-bottom: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: var(--theme-transition);
}

.yuemu-wx-logo { width: 140px; height: 140px; object-fit: contain; }

.yuemu-qr-secure-badge {
  font-size: 13px; color: #34c759;
  display: flex; align-items: center; gap: 6px; font-weight: 500;
  background: rgba(52, 199, 89, 0.1); padding: 6px 14px; border-radius: 20px;
}

.yuemu-invite-code-indicator {
  font-size: 13px; color: #ff9500;
  display: flex; align-items: center; justify-content: center; font-weight: 600;
  background: rgba(255, 149, 0, 0.1); padding: 6px 16px; border-radius: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 149, 0, 0.2);
}

.yuemu-code-display {
  background: var(--hover-background); border-radius: 16px;
  padding: 12px 32px; cursor: pointer; transition: var(--theme-transition);
  &:hover { transform: scale(1.02); }
}
.yuemu-code-text { font-size: 36px; font-weight: 700; letter-spacing: 6px; color: var(--text-primary); transition: var(--theme-transition);}
.yuemu-code-text.yuemu-highlight { color: var(--link-color); }

.yuemu-status-icon {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 32px;
  margin-bottom: 16px; color: #fff;
}
.yuemu-status-icon.yuemu-success { background: #34c759; }
.yuemu-status-icon.yuemu-expired { background: #ff9f0a; }

.yuemu-status-title { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; transition: var(--theme-transition);}
.yuemu-status-desc { font-size: 15px; color: var(--text-secondary); margin: 0; transition: var(--theme-transition);}
.yuemu-apple-refresh-btn {
  margin-top: 16px; background: var(--hover-background); border: none;
  padding: 10px 24px; border-radius: 20px; font-weight: 600; color: var(--text-primary);
  cursor: pointer; transition: var(--theme-transition);
  &:hover { opacity: 0.8; }
}

.yuemu-refresh-tip { font-size: 14px; color: var(--link-color); cursor: pointer; margin-top: 16px; transition: var(--theme-transition);}

.yuemu-apple-dock {
  display: flex; justify-content: center; gap: 20px;
  margin-top: auto; padding-top: 32px;
}

.yuemu-dock-item {
  width: 48px; height: 48px; border-radius: 16px;
  background: var(--header-background);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px var(--shadow-color);
}
.yuemu-dock-item:hover { transform: translateY(-4px) scale(1.05); background: var(--card-background); box-shadow: 0 8px 20px var(--shadow-color); }
.yuemu-dock-item.yuemu-active {
  background: var(--card-background); border: 2px solid var(--link-color); box-shadow: 0 8px 24px var(--nav-item-active);
}

.yuemu-dock-icon { font-size: 22px; }
.yuemu-dock-icon.yuemu-wechat { color: #07c160; }
.yuemu-dock-icon.yuemu-app { color: var(--text-primary); transition: var(--theme-transition);}
.yuemu-dock-icon.yuemu-account { color: var(--link-color); transition: var(--theme-transition);}

.yuemu-mobile-overlay {
  display: none;
}

@media screen and (max-width: 768px) {
  .yuemu-mobile-overlay {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 1;
    background: color-mix(in srgb, var(--card-background) 25%, transparent);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    pointer-events: none;
  }

  .yuemu-content {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    justify-content: center;
  }

  .yuemu-login-wrapper {
    width: 90vw;
    max-width: 400px;
    margin: 0;
    padding: 36px 24px;
    border-radius: 28px;
    min-height: auto;
    z-index: 2;
  }

  .yuemu-title { font-size: 28px; }
  .yuemu-apple-header { margin-bottom: 24px; }

  .yuemu-blue-doll-container {
    height: 45px;
    margin-bottom: 24px;
    transform: scale(0.8);
    transform-origin: bottom center;
  }

  .yuemu-apple-digit-input {
    height: 44px;
    font-size: 18px;
    border-radius: 10px;
  }

  .yuemu-code-captcha {
    height: 44px;
    width: 90px;
    border-radius: 10px;
  }

  .yuemu-apple-submit-btn {
    height: 44px;
    border-radius: 22px;
  }

  .yuemu-compact-verify-container { gap: 8px; }
  .yuemu-digit-inputs { gap: 6px; }

  .yuemu-apple-dock { padding-top: 24px; gap: 16px; }
  .yuemu-dock-item { width: 44px; height: 44px; border-radius: 14px; }
}

@media screen and (max-height: 650px) {
  .yuemu-blue-doll-container { display: none; }
  .yuemu-login-wrapper { padding: 24px 24px; }
  .yuemu-apple-header { margin-bottom: 16px; }
  .yuemu-apple-dock { padding-top: 16px; }
}

@media screen and (max-width: 768px) {
  .yuemu-content::after {
    background: var(--card-background) url("@/assets/images/login_bg_phone.png") no-repeat;
    background-size: cover; background-position: center;
  }
}
</style>
