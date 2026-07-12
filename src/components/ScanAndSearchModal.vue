<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="pro-scanner-modal">
      <!-- 动态毛玻璃背景 -->
      <div class="pro-scanner-backdrop" @click="closeModal"></div>

      <div class="pro-scanner-panel pc-limit-modal">
        <!-- 透明渐变头部 -->
        <div class="pro-scanner-header">
          <button class="pro-close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
          <h3 class="header-title">{{ activeTab === 'qr' ? t('components.scanAndSearchModal.scanQrCode') : t('components.scanAndSearchModal.searchByImage') }}</h3>
          <div style="width: 36px"></div> <!-- 占位平衡 -->
        </div>

        <!-- 视口容器 -->
        <div class="viewport-container">
          <Transition name="fade" mode="out-in">
            <!-- 二维码扫描视口 -->
            <div class="pro-camera-viewport" v-if="activeTab === 'qr'" key="qr">
              <video ref="videoRef" autoplay playsinline class="pro-video-stream"></video>
              <canvas ref="canvasRef" style="display: none;"></canvas>

              <!-- 扫码成功时的识别涟漪点 -->
              <div v-if="qrDot.show" class="pro-qr-dot" :style="{ left: qrDot.x + 'px', top: qrDot.y + 'px' }">
                <div class="dot-core"></div>
                <div class="dot-ripple"></div>
              </div>

              <!-- 极简高亮的扫描遮罩与取景框 -->
              <div class="pro-scan-mask"></div>
              <div class="pro-scan-frame-wrapper">
                <div class="pro-scan-frame">
                  <span class="pro-corner top-left"></span>
                  <span class="pro-corner top-right"></span>
                  <span class="pro-corner bottom-left"></span>
                  <span class="pro-corner bottom-right"></span>
                  <div class="pro-scan-laser"></div>
                </div>
              </div>

              <!-- 状态胶囊 -->
              <div class="pro-scan-feedback">
                <div class="status-capsule" :class="{ 'is-success': scanningStatus.includes(t('components.scanAndSearchModal.success')) }">
                  <i class="fas" :class="scanningStatus.includes(t('components.scanAndSearchModal.success')) ? 'fa-check-circle' : 'fa-qrcode'"></i>
                  <span>{{ scanningStatus }}</span>
                </div>
              </div>
            </div>

            <!-- 以图搜图视口 -->
            <div class="image-search-viewport" v-else key="image">
              <div class="glass-upload-wrapper">
                <div class="upload-card" @click="!uploading && triggerImageUpload()" :class="{ 'is-uploading': uploading }">
                  <div class="upload-icon-container" :class="{ 'glow-pulse': uploading }">
                    <i v-if="!uploading" class="fas fa-images upload-icon"></i>
                    <i v-else class="fas fa-spinner fa-spin upload-icon uploading-color"></i>
                  </div>

                  <h2 class="upload-title" :class="{ 'uploading-color': uploading }">
                    {{ uploading ? t('components.scanAndSearchModal.extractingInspiration') : t('components.scanAndSearchModal.selectRefImage') }}
                  </h2>
                  <p class="upload-subtitle">
                    {{ uploading ? t('components.scanAndSearchModal.magicJourneyStarting') : t('components.scanAndSearchModal.searchImageDesc') }}
                  </p>

                  <button class="upload-btn" :disabled="uploading" v-if="!uploading">
                    打开相册
                  </button>
                </div>
              </div>
              <input type="file" ref="fileInputRef" accept="image/*" style="display: none" @change="handleImageUpload" capture="camera" :disabled="uploading" />
            </div>
          </Transition>
        </div>

        <!-- 底部 Segmented Control 切换器 -->
        <div class="scan-tabs-container">
          <div class="scan-tabs">
            <div class="scan-tab-indicator" :class="activeTab"></div>
            <div class="scan-tab" :class="{ active: activeTab === 'qr' }" @click="switchTab('qr')">{{ t('components.scanAndSearchModal.scanCode') }}</div>
            <div class="scan-tab" :class="{ active: activeTab === 'image' }" @click="switchTab('image')">{{ t('components.scanAndSearchModal.searchImage') }}</div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, reactive, nextTick, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import jsQR from 'jsqr'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import { ImageCompressor } from '@/utils/imageCompressor'
import { scanQrCodeUsingPost, confirmQrLoginUsingPost } from '@/api/userController'
import scanSoundUrl from '@/assets/sounds/scan_QR.mp3'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible', 'scanSuccess'])
const router = useRouter()

const activeTab = ref('qr')
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const qrDot = reactive({ show: false, x: 0, y: 0 })
const scanningStatus = ref(t('components.scanAndSearchModal.waitingForScan'))
let stream: MediaStream | null = null
let scanAnimationFrame: number | null = null

watch(() => props.visible, (newVal) => {
  if (newVal) {
    activeTab.value = 'qr'
    nextTick(() => {
      startQrScanner()
    })
  } else {
    stopQrScanner()
  }
})

const closeModal = () => {
  emit('update:visible', false)
}

const switchTab = (tab: string) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (tab === 'image') {
    stopQrScanner()
  } else {
    nextTick(() => {
      startQrScanner()
    })
  }
}

// QR Scanner logic
const startQrScanner = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    message.error(t('components.scanAndSearchModal.cameraNotSupported'))
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.setAttribute('playsinline', 'true')
      videoRef.value.play()
      requestAnimationFrame(scanTick)
    }
  } catch (error) {
    message.error(t('components.scanAndSearchModal.cameraAccessDenied'))
  }
}

const stopQrScanner = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  if (scanAnimationFrame) {
    cancelAnimationFrame(scanAnimationFrame)
    scanAnimationFrame = null
  }
  qrDot.show = false
  scanningStatus.value = t('components.scanAndSearchModal.waitingForScan')
}

const playScanSuccessSound = () => {
  try {
    const audio = new Audio(scanSoundUrl)
    audio.play()
  } catch (e) {
    console.warn(t('components.scanAndSearchModal.audioPlayFailed'), e)
  }
}

const processScannedCode = async (codeData: string) => {
  scanningStatus.value = t('components.scanAndSearchModal.processing')
  try {
    let tokenToUse = codeData;
    // 解析类似 yuemu://qr-login?token=xxxx 的格式
    if (codeData.includes('token=')) {
      tokenToUse = codeData.split('token=')[1]?.split('&')[0] || codeData;
    }

    const res = await scanQrCodeUsingPost({ qrToken: tokenToUse })
    if (res.data.code === 0) {
      scanningStatus.value = t('components.scanAndSearchModal.scanSuccessConfirmLogin')
      const confirmRes = await confirmQrLoginUsingPost({ qrToken: tokenToUse })
      if (confirmRes.data.code === 0) {
        message.success(t('components.scanAndSearchModal.loginVerificationSuccess'))
        closeModal()
      } else {
        message.error(t('components.scanAndSearchModal.verificationFailedColon') + confirmRes.data.message)
        setTimeout(() => { scanningStatus.value = t('components.scanAndSearchModal.waitingForScan'); requestAnimationFrame(scanTick) }, 2000)
      }
    } else {
      message.error(res.data.message || t('components.scanAndSearchModal.invalidQrCode'))
      setTimeout(() => { scanningStatus.value = t('components.scanAndSearchModal.waitingForScan'); requestAnimationFrame(scanTick) }, 2000)
    }
  } catch (error) {
    message.error(t('components.scanAndSearchModal.processingFailed'))
    setTimeout(() => { scanningStatus.value = t('components.scanAndSearchModal.waitingForScan'); requestAnimationFrame(scanTick) }, 2000)
  }
}

const scanTick = () => {
  if (videoRef.value && videoRef.value.readyState === videoRef.value.HAVE_ENOUGH_DATA && canvasRef.value) {
    const canvas = canvasRef.value
    const video = videoRef.value
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
      if (code && scanningStatus.value === t('components.scanAndSearchModal.waitingForScan')) {
        playScanSuccessSound()
        const rect = video.getBoundingClientRect()
        const scaleX = rect.width / canvas.width
        const scaleY = rect.height / canvas.height
        qrDot.x = code.location.bottomRightCorner.x * scaleX
        qrDot.y = code.location.bottomRightCorner.y * scaleY
        qrDot.show = true
        processScannedCode(code.data)
        return
      }
    }
  }
  if (props.visible && activeTab.value === 'qr') {
    scanAnimationFrame = requestAnimationFrame(scanTick)
  }
}

// Image Search logic
const triggerImageUpload = () => {
  fileInputRef.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    message.warning(t('components.scanAndSearchModal.pleaseSelectImage'))
    return
  }

  uploading.value = true
  message.loading({ content: t('components.scanAndSearchModal.extractingAndParsing'), key: 'imageSearch', duration: 0 })
  try {
    const compressedFile = await ImageCompressor.compress(file)
    const res = await uploadPostImageUsingPost({}, { headers: { 'Content-Type': 'multipart/form-data' } }, compressedFile)
    if (res.data.code === 0 && res.data.data) {
      message.success({ content: t('components.scanAndSearchModal.extractSuccessSeekingInspiration'), key: 'imageSearch', duration: 2 })
      closeModal()
      router.push({
        path: '/search_picture',
        query: { imageUrl: res.data.data.url }
      })
    } else {
      throw new Error(res.data.message || t('components.scanAndSearchModal.uploadFailed'))
    }
  } catch (error: any) {
    message.error({ content: t('components.scanAndSearchModal.parseFailedColon') + (error.message || t('components.scanAndSearchModal.unknownError')), key: 'imageSearch', duration: 2 })
  } finally {
    uploading.value = false
    if (target) target.value = ''
  }
}

onUnmounted(() => {
  stopQrScanner()
})
</script>

<style scoped>
/* 全局弹窗动画 */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.98); }

/* 内部视图切换动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pro-scanner-modal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 2000; display: flex; align-items: center; justify-content: center;
}
.pro-scanner-backdrop {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
}
.pro-scanner-panel {
  position: relative; z-index: 2001;
  width: 100%; max-width: 480px; height: 100%;
  display: flex; flex-direction: column; overflow: hidden;
}

/* 渐变悬浮头部 */
.pro-scanner-header {
  position: absolute; top: 0; left: 0; width: 100%; height: 72px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; z-index: 10;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
}
.header-title { margin: 0; font-size: 16px; font-weight: 600; color: #fff; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.pro-close-btn {
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; backdrop-filter: blur(8px); transition: background 0.3s;
}
.pro-close-btn:hover { background: rgba(255,255,255,0.25); }

/* 核心视口 */
.viewport-container {
  flex: 1; position: relative; width: 100%; height: 100%;
}
.pro-camera-viewport, .image-search-viewport {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
}

/* --- 扫码视图 --- */
.pro-video-stream { width: 100%; height: 100%; object-fit: cover; }
.pro-scan-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3);
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
  15% 30%, 15% 70%, 85% 70%, 85% 30%, 15% 30%);
}
.pro-scan-frame-wrapper {
  position: absolute; top: 30%; left: 15%; width: 70%; height: 40%;
}
.pro-scan-frame {
  width: 100%; height: 100%; position: relative;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset; border-radius: 12px;
}
.pro-corner { position: absolute; width: 24px; height: 24px; border-color: #0ea5e9; border-style: solid; border-radius: 4px; }
.top-left { top: -2px; left: -2px; border-width: 3px 0 0 3px; }
.top-right { top: -2px; right: -2px; border-width: 3px 3px 0 0; }
.bottom-left { bottom: -2px; left: -2px; border-width: 0 0 3px 3px; }
.bottom-right { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; }
.pro-scan-laser {
  position: absolute; left: 4%; width: 92%; height: 2px; background: #0ea5e9;
  box-shadow: 0 0 12px #0ea5e9; animation: scan-anim 2.5s infinite ease-in-out; border-radius: 2px;
}
@keyframes scan-anim { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

/* 二维码涟漪与状态反馈 */
.pro-qr-dot { position: absolute; width: 20px; height: 20px; transform: translate(-50%, -50%); z-index: 2002; }
.dot-core { width: 12px; height: 12px; background: #0ea5e9; border-radius: 50%; margin: 4px; position: relative; z-index: 2; }
.dot-ripple { position: absolute; top: 0; left: 0; width: 20px; height: 20px; background: #0ea5e9; border-radius: 50%; animation: ripple 1.5s infinite; }
@keyframes ripple { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(3.5); opacity: 0; } }

.pro-scan-feedback {
  position: absolute; bottom: calc(25% + env(safe-area-inset-bottom)); left: 0; width: 100%;
  display: flex; justify-content: center;
}
.status-capsule {
  background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  padding: 10px 24px; border-radius: 30px; color: #fff; font-size: 14px;
  display: flex; align-items: center; gap: 8px; transition: background 0.3s;
}
.status-capsule.is-success { background: rgba(14,165,233,0.85); box-shadow: 0 4px 12px rgba(14,165,233,0.3); }

/* --- 搜图视图 (Glassmorphism) --- */
.glass-upload-wrapper {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at center, rgba(30,41,59,0.8) 0%, #000 100%);
}
.upload-card {
  width: 85%; max-width: 320px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 28px; padding: 40px 24px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  box-shadow: 0 24px 48px rgba(0,0,0,0.4);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.upload-card:not(.is-uploading):hover { transform: translateY(-4px); background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); }
.upload-card:not(.is-uploading):active { transform: translateY(2px); }
.upload-card.is-uploading { border-color: rgba(14, 165, 233, 0.4); background: rgba(14, 165, 233, 0.05); }

.upload-icon-container {
  width: 88px; height: 88px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02));
  display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s;
}
.upload-icon-container.glow-pulse { box-shadow: 0 0 24px rgba(14, 165, 233, 0.4); border-color: rgba(14, 165, 233, 0.3); }
.upload-icon { font-size: 36px; color: #fff; }
.upload-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 12px; letter-spacing: 0.5px; }
.upload-subtitle { font-size: 13px; color: rgba(255,255,255,0.6); margin: 0 0 32px; line-height: 1.6; padding: 0 10px; }
.upload-btn {
  background: #fff; color: #000; font-weight: 600; font-size: 15px;
  padding: 14px 36px; border-radius: 30px; border: none; cursor: pointer; transition: 0.3s;
  box-shadow: 0 4px 12px rgba(255,255,255,0.2);
}
.upload-btn:active { transform: scale(0.96); box-shadow: 0 2px 6px rgba(255,255,255,0.1); }
.uploading-color { color: #0ea5e9 !important; }

/* 底部 iOS 风格分段控制器 */
.scan-tabs-container {
  position: absolute; bottom: calc(40px + env(safe-area-inset-bottom));
  left: 0; width: 100%; display: flex; justify-content: center; z-index: 10;
}
.scan-tabs {
  position: relative; display: inline-flex; align-items: center;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-radius: 30px; padding: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.scan-tab-indicator {
  position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px);
  background: #fff; border-radius: 26px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
}
.scan-tab-indicator.qr { transform: translateX(0); }
.scan-tab-indicator.image { transform: translateX(100%); }
.scan-tab {
  flex: 1; text-align: center; padding: 10px 28px; font-size: 15px; font-weight: 600;
  color: rgba(255,255,255,0.8); z-index: 1; cursor: pointer; transition: color 0.3s;
}
.scan-tab.active { color: #1e293b; }

@media screen and (min-width: 768px) {
  .pro-scanner-panel { height: 85vh; border-radius: 24px; margin: auto; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 24px 64px rgba(0,0,0,0.5); }
}
</style>
