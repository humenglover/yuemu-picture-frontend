<template>
  <div class="yuemu-box" :class="{ 'yuemu-is-loaded': bgLoaded }">
    <div class="yuemu-content">
      <div class="yuemu-mobile-overlay"></div>
      <div class="yuemu-login-wrapper">
        <div class="yuemu-login-header">
          <h1 class="yuemu-title">{{ t('pages.user.userRegisterPage.title') }}</h1>
        </div>

        <form
          @submit.prevent="submitForm"
          class="yuemu-auth-form"
          autocomplete="off"
        >
          <div class="yuemu-input-group">
            <div class="yuemu-input-prefix">
              <i class="fas fa-envelope"></i>
            </div>
            <input
              v-model="formState.email"
              type="email"
              :placeholder="t('pages.user.userRegisterPage.emailPlaceholder')"
              class="yuemu-native-input"
              required
            />
          </div>

          <div class="yuemu-verify-action-group">
            <div class="yuemu-input-group yuemu-verify-field-wrapper">
              <div class="yuemu-input-prefix">
                <i class="fas fa-shield-alt"></i>
              </div>
              <input
                v-model="formState.code"
                type="text"
                :placeholder="t('pages.user.userRegisterPage.codePlaceholder')"
                class="yuemu-native-input"
                required
              />
            </div>
            <button
              type="button"
              class="yuemu-get-code-btn"
              :disabled="!!countdown || !formState.email"
              @click="sendEmailCode"
            >
              {{ countdown ? `${countdown}s` : t('pages.user.userRegisterPage.getCode') }}
            </button>
          </div>

          <div class="yuemu-input-group">
            <div class="yuemu-input-prefix">
              <i class="fas fa-lock"></i>
            </div>
            <input
              v-model="formState.userPassword"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('pages.user.userRegisterPage.passwordPlaceholder')"
              class="yuemu-native-input"
              required
            />
            <button type="button" class="yuemu-pwd-toggle-btn" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
            </button>
          </div>

          <div class="yuemu-input-group">
            <div class="yuemu-input-prefix">
              <i class="fas fa-check-circle"></i>
            </div>
            <input
              v-model="formState.checkPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              :placeholder="t('pages.user.userRegisterPage.confirmPasswordPlaceholder')"
              class="yuemu-native-input"
              required
            />
            <button type="button" class="yuemu-pwd-toggle-btn" @click="showConfirmPassword = !showConfirmPassword">
              <i :class="showConfirmPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
            </button>
          </div>

          <div class="yuemu-input-group yuemu-disabled-group" v-if="formState.inviteCode">
            <div class="yuemu-input-prefix">
              <i class="fas fa-gift"></i>
            </div>
            <input
              v-model="formState.inviteCode"
              type="text"
              :placeholder="t('pages.user.userRegisterPage.inviteCodePlaceholder')"
              class="yuemu-native-input"
              disabled
            />
          </div>

          <div class="yuemu-auth-helper-link">
            {{ t('pages.user.userRegisterPage.hasAccount') }}
            <RouterLink to="/user/login" class="yuemu-jump-link">{{ t('pages.user.userRegisterPage.loginNow') }}</RouterLink>
            <span class="yuemu-divider-dot"></span>
            <RouterLink :to="formState.inviteCode ? `/user/login?type=wechat&inviteCode=${formState.inviteCode}` : `/user/login?type=wechat`" class="yuemu-jump-link yuemu-special">{{ t('pages.user.userRegisterPage.wechatRegister') }}</RouterLink>
          </div>

          <div class="yuemu-submit-item">
            <button type="submit" class="yuemu-auth-submit-btn">
              {{ t('pages.user.userRegisterPage.createAccount') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { reactive, ref, onBeforeUnmount, onMounted } from 'vue'
import { userRegisterUsingPost, getEmailCodeUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import bgPc from '@/assets/images/login_two.jpg'
import bgMobile from '@/assets/images/login_bg_phone.png'

const bgLoaded = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const { t } = useI18n()

const route = useRoute()

const submitForm = () => {
  if (!formState.email || !formState.code || !formState.userPassword || !formState.checkPassword) {
    message.warning(t('pages.user.userRegisterPage.fillRequired'))
    return
  }
  if (formState.userPassword.length < 8) {
    message.warning(t('pages.user.userRegisterPage.passwordLength'))
    return
  }
  if (formState.userPassword !== formState.checkPassword) {
    message.warning(t('pages.user.userRegisterPage.passwordNotMatch'))
    return
  }
  handleSubmit(formState)
}

onMounted(() => {
  const isMobile = window.innerWidth <= 768
  const imgUrl = isMobile ? bgMobile : bgPc
  const img = new Image()
  img.src = imgUrl
  img.onload = () => { bgLoaded.value = true }
  img.onerror = () => { bgLoaded.value = true }

  if (route.query.inviteCode) {
    formState.inviteCode = route.query.inviteCode as string
  }
})

const formState = reactive<API.UserRegisterRequest>({
  email: '',
  userPassword: '',
  checkPassword: '',
  code: '',
  inviteCode: '',
})

const countdown = ref<number>(0)
let timer: NodeJS.Timeout | null = null

const sendEmailCode = async () => {
  try {
    await getEmailCodeUsingPost({
      email: formState.email,
      type: 'register'
    })
    message.success(t('pages.user.userRegisterPage.codeSent'))
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer!)
        timer = null
      }
    }, 1000)
  } catch (error: any) {
    message.error(t('pages.user.userRegisterPage.codeSendFail') + error.message)
  }
}

const validatePassword = async (_rule: any, value: string) => {
  if (value !== formState.userPassword) {
    return Promise.reject(t('pages.user.userRegisterPage.passwordNotMatch'))
  }
  return Promise.resolve()
}

const handleSubmit = async (values: any) => {
  const res = await userRegisterUsingPost(values)
  if (res.data.code === 0 && res.data.data) {
    message.success(t('pages.user.userRegisterPage.registerSuccess'))
    await router.push('/user/login')
  } else {
    message.error(t('pages.user.userRegisterPage.registerFail') + res.data.message)
  }
}

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
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
  border-radius: 24px;
  background-color: var(--card-background);
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-shadow: 0 20px 40px var(--shadow-color);
  overflow: hidden;
  transition: var(--theme-transition);
}

.yuemu-content::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--background);
  animation: yuemu-bgPulse 1.5s ease-in-out infinite;
  z-index: 0;
  transition: opacity 0.8s ease-in-out, background-color 0.3s ease;
}

@keyframes yuemu-bgPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.yuemu-content::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--card-background) url("@/assets/images/login_two.jpg") no-repeat;
  background-size: 70% 100%;
  background-position: left;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.8s ease-out;
}

.yuemu-box.yuemu-is-loaded .yuemu-content::before {
  opacity: 0;
  animation: none;
}

.yuemu-box.yuemu-is-loaded .yuemu-content::after {
  opacity: 1;
}

.dark-theme .yuemu-box.yuemu-is-loaded .yuemu-content::after {
  opacity: 1 !important;
  background: linear-gradient(to right, rgba(45, 45, 45, 0.02) 0%, rgba(45, 45, 45, 0.4) 40%, #2d2d2d 68%, #2d2d2d 100%),
  url("@/assets/images/login_two.jpg") no-repeat !important;
  background-size: 100% 100%, 70% 100% !important;
  background-position: left, left !important;
}

.yuemu-login-wrapper {
  position: relative;
  z-index: 1;
  width: 400px;
  margin-right: 10%;
  padding: 32px 32px;
  background: var(--header-background);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid var(--header-border);
  animation: yuemu-fadeInRight 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  transition: var(--theme-transition);
}

@keyframes yuemu-fadeInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

.yuemu-login-header {
  text-align: center;
  margin-bottom: 32px;
}

.yuemu-title {
  font-size: 42px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  transition: var(--theme-transition);
}

.yuemu-auth-form :deep(.ant-form-item) {
  margin-bottom: 24px;
}

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
    border-color: var(--link-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--link-color) 15%, transparent);
    background: var(--yuemu-input-focus-bg) !important;
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
  font-size: 18px;
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

.yuemu-verify-field-wrapper {
  flex: 1;
  margin-bottom: 0 !important;
}

.yuemu-input-group.yuemu-disabled-group {
  opacity: 0.6;
  cursor: not-allowed;

  &:hover {
    border-color: var(--border-color);
  }
  &:focus-within {
    border-color: var(--border-color);
    box-shadow: none;
    background: var(--hover-background);
  }
  .yuemu-native-input {
    cursor: not-allowed;
  }
}

.yuemu-verify-action-group {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.yuemu-verify-field { flex: 1; }

.yuemu-get-code-btn {
  min-width: 110px;
  height: 48px;
  border-radius: 28px;
  background: var(--text-primary);
  border: none;
  color: var(--background);
  font-size: 14px;
  font-weight: 600;
  transition: var(--theme-transition);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--shadow-color);
    background: var(--text-secondary);
    color: var(--background);
  }

  &:disabled {
    background: var(--hover-background);
    color: var(--text-secondary);
    cursor: not-allowed;
    border: 1px solid var(--border-color);
  }
}

.yuemu-auth-helper-link {
  text-align: center;
  margin-bottom: 24px;
  color: var(--text-secondary);
  font-size: 14px;
  transition: var(--theme-transition);
}

.yuemu-jump-link {
  color: var(--link-color);
  font-weight: 600;
  margin-left: 4px;
  transition: var(--theme-transition);
  &:hover { text-decoration: underline; color: var(--link-hover-color); }

  &.yuemu-special {
    color: #07c160;
    &:hover { filter: brightness(0.9); }
  }
}

.yuemu-divider-dot {
  display: inline-block;
  width: 3px;
  height: 3px;
  background: var(--border-color);
  border-radius: 50%;
  margin: 0 8px;
  vertical-align: middle;
  transition: var(--theme-transition);
}

.yuemu-auth-submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 28px;
  background: var(--text-primary);
  border: none;
  color: var(--background);
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition: var(--theme-transition);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--shadow-color);
    background: var(--text-secondary);
  }
}

@media screen and (max-width: 1024px) {
  .yuemu-login-wrapper { width: 400px; margin-right: 5%; }
}

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

  .yuemu-content::after {
    background: var(--card-background) url('@/assets/images/login_bg_phone.png') no-repeat center;
    background-size: cover;
  }

  .yuemu-login-wrapper {
    width: 90vw;
    margin: 0;
    background: var(--header-background);
    padding: 30px 20px;
    z-index: 2;
  }

  .yuemu-title { font-size: 32px; }
}
</style>
