<template>
  <div v-if="visible" class="yuemu-apple-share-overlay" @click="closeModal" @wheel.stop>
    <div class="yuemu-share-modal-content" @click.stop>

      <div class="yuemu-poster-card" :class="`theme-${currentTheme}`">
        <div class="yuemu-poster-image-wrap">
          <div
            class="yuemu-poster-bg-img"
            :style="{ backgroundImage: 'url(' + displayImageUrl + ')' }"
          ></div>
        </div>
        <div class="yuemu-poster-info-area">
          <div class="yuemu-info-left">
            <div class="yuemu-poster-title" :title="title">{{ title || t('components.shareModal.shareContent') }}</div>
            <div class="yuemu-poster-author">
              <img v-if="user?.userAvatar" :src="user.userAvatar" class="yuemu-author-avatar" />
              <i v-else class="fas fa-user-circle"></i>
              {{ user ? user.userName : t('components.shareModal.yuemuUser') }}
            </div>
            <div class="yuemu-poster-date">
              {{ formatTime(props.createTime || new Date().toString(), 'full') }}
            </div>
          </div>
          <div class="yuemu-info-right">
            <div class="yuemu-qrcode-box">
              <a-qrcode
                :value="link"
                :size="68"
                :color="qrColor"
                :bgColor="qrBgColor"
                :bordered="false"
                error-level="L"
              />
            </div>
            <span class="yuemu-scan-text">{{ t('components.shareModal.longPressToScan') }}</span>
          </div>
        </div>
      </div>

      <!-- 换肤控制器 -->
      <div class="yuemu-theme-switcher">
        <div class="yuemu-theme-dot yuemu-theme-light" :class="{active: currentTheme === 'light'}" @click="currentTheme = 'light'"></div>
        <div class="yuemu-theme-dot yuemu-theme-dark" :class="{active: currentTheme === 'dark'}" @click="currentTheme = 'dark'"></div>
        <div class="yuemu-theme-dot yuemu-theme-warm" :class="{active: currentTheme === 'warm'}" @click="currentTheme = 'warm'"></div>
        <div class="yuemu-theme-dot yuemu-theme-blue" :class="{active: currentTheme === 'blue'}" @click="currentTheme = 'blue'"></div>
        <div class="yuemu-theme-dot yuemu-theme-green" :class="{active: currentTheme === 'green'}" @click="currentTheme = 'green'"></div>
        <div class="yuemu-theme-dot yuemu-theme-purple" :class="{active: currentTheme === 'purple'}" @click="currentTheme = 'purple'"></div>
      </div>

      <!-- 横滑操作矩阵 -->
      <div class="yuemu-action-grid">
        <div class="yuemu-action-item" @click="saveImage">
          <div class="yuemu-action-icon yuemu-icon-blue"><i class="fas fa-download"></i></div>
          <span>{{ t('components.shareModal.savePoster') }}</span>
        </div>
        <div class="yuemu-action-item" @click="copyRichText">
          <div class="yuemu-action-icon yuemu-icon-orange"><i class="fas fa-copy"></i></div>
          <span>{{ t('components.shareModal.copyText') }}</span>
        </div>
        <div class="yuemu-action-item" @click="openChatShare">
          <div class="yuemu-action-icon yuemu-icon-green"><i class="fas fa-paper-plane"></i></div>
          <span>{{ t('components.shareModal.shareToChat', '发给好友') }}</span>
        </div>
        <div class="yuemu-action-item" @click="closeModal">
          <div class="yuemu-action-icon yuemu-icon-gray"><i class="fas fa-times"></i></div>
          <span>{{ t('common.close') }}</span>
        </div>
      </div>
    </div>

    <div ref="screenshotRef" class="yuemu-screenshot-container" style="display: none;">
      <div ref="captureTargetRef" class="yuemu-capture-wrapper" :class="`theme-${currentTheme}`">
        <div class="yuemu-poster-card yuemu-screenshot-poster">
          <div class="yuemu-poster-image-wrap yuemu-screenshot-img-wrap">
            <div
              class="yuemu-poster-bg-img"
              :style="{ backgroundImage: 'url(' + displayImageUrl + ')' }"
            ></div>
          </div>
          <div class="yuemu-poster-info-area yuemu-screenshot-info">
            <div class="yuemu-info-left">
              <div class="yuemu-poster-title yuemu-screenshot-text-main">{{ title || t('components.shareModal.shareContent') }}</div>
              <div class="yuemu-poster-author yuemu-screenshot-text-blue">
                <img v-if="user?.userAvatar" :src="user.userAvatar" class="yuemu-author-avatar" />
                <i v-else class="fas fa-user-circle"></i>
                {{ user ? user.userName : t('components.shareModal.yuemuUser') }}
              </div>
              <div class="yuemu-poster-date yuemu-screenshot-text-sub">
                {{ t('components.shareModal.creationTimeColon') }} {{ formatTime(props.createTime || new Date().toString(), 'full') }}
              </div>
            </div>
            <div class="yuemu-info-right">
              <div class="yuemu-qrcode-box yuemu-screenshot-qr">
                <a-qrcode
                  :value="link"
                  :size="80"
                  :color="qrColor"
                  :bgColor="qrBgColor"
                  :bordered="false"
                  error-level="L"
                />
              </div>
              <span class="yuemu-scan-text yuemu-screenshot-text-sub">{{ t('components.shareModal.longPressToScan') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 站内分享好友列表模态框 -->
    <div v-if="showChatShareModal" class="yuemu-chat-share-overlay" @click="showChatShareModal = false">
      <div class="yuemu-chat-share-card" @click.stop>
        <div class="yuemu-chat-share-header">
          <h3>{{ t('components.shareModal.selectFriend', '选择一位好友') }}</h3>
          <button class="yuemu-chat-close-btn" @click="showChatShareModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="yuemu-chat-share-list" @wheel.stop @scroll="handleChatListScroll">
          <div v-if="loadingChatList" class="yuemu-chat-share-loading">
            <a-spin />
          </div>
          <template v-else-if="chatListStore.chatListData.length > 0">
            <div 
              v-for="chat in chatListStore.chatListData.filter(c => c.targetUser && String(c.id) !== '-1' && String(c.id) !== '-2')" 
              :key="chat.id" 
              class="yuemu-chat-share-item"
              @click="handleShareToFriend(chat)"
            >
              <img :src="chat.targetUser?.userAvatar || getDefaultAvatar(chat.targetUser?.userName)" class="chat-share-avatar" />
              <div class="chat-share-info">
                <span class="chat-share-name">{{ chat.targetUser?.userName }}</span>
                <span v-if="chat.chatType === 3" class="chat-share-badge group">{{ t('components.shareModal.group', '群组') }}</span>
              </div>
            </div>
          </template>
          <div v-else class="yuemu-chat-share-empty">
            <i class="fas fa-inbox"></i>
            <p>{{ t('components.shareModal.noFriends', '暂无联系人，快去私信打个招呼吧') }}</p>
          </div>
          <!-- 触底加载更多的状态 -->
          <div v-if="loadingMoreChat" class="yuemu-chat-load-more">
            <i class="fas fa-spinner fa-spin"></i>
            <span>{{ t('components.shareModal.loadingMore', '正在加载更多...') }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 独立的 Toast 提示（解决层级覆盖问题） -->
    <Transition name="yuemu-share-fade">
      <div v-if="toastMsg" class="yuemu-share-toast">
        <i :class="toastIcon"></i>
        <span>{{ toastMsg }}</span>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import html2canvas from 'html2canvas'
import { formatTime } from '@/utils/dateUtils'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useChatListStore } from '@/stores/useChatListStore'
import ChatWebSocket from '@/utils/chatWebSocket'
import { listPrivateChatByPageUsingPost } from '@/api/privateChatController'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import { getTextCover } from '@/utils/textCoverGenerator'
import { downloadImage as utilDownloadImage } from '@/utils'
import { getDefaultAvatar } from '@/utils/userUtils'

interface Props {
  title?: string
  link: string
  imageUrl: string
  user?: {
    userName: string
    userAvatar?: string
  }
  createTime?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  link: '',
  imageUrl: '',
  user: undefined,
  createTime: ''
})

const loginUserStore = useLoginUserStore()
const chatListStore = useChatListStore()
const { t } = useI18n()
const visible = ref(false)
const showChatShareModal = ref(false)
const loadingChatList = ref(false)
const chatPage = ref(1)
const hasMoreChat = ref(true)
const loadingMoreChat = ref(false)
const emit = defineEmits(['close'])
const screenshotRef = ref<HTMLElement | null>(null)
const captureTargetRef = ref<HTMLElement | null>(null)
const fallbackImageUrl = 'https://pic.imgdb.cn/item/65ced2939f345e8d03633db1.jpg?x-oss-process=style/small'
const generatedCoverUrl = ref<string | null>(null)

// ================= 全局原生提示框状态 (替代 ant-design-vue message) =================
const toastMsg = ref('')
const toastIcon = ref('fas fa-info-circle')
let toastTimer: any = null

const showMessage = (msg: string | { content: string, key?: string }, type: 'info' | 'success' | 'warning' | 'error' | 'loading' = 'info', duration = 2500) => {
  if (toastTimer) clearTimeout(toastTimer)
  const content = typeof msg === 'string' ? msg : msg.content
  toastMsg.value = content
  if (type === 'success') toastIcon.value = 'fas fa-check-circle'
  else if (type === 'error') toastIcon.value = 'fas fa-times-circle'
  else if (type === 'warning') toastIcon.value = 'fas fa-exclamation-triangle'
  else if (type === 'loading') toastIcon.value = 'fas fa-spinner fa-spin'
  else toastIcon.value = 'fas fa-info-circle'

  if (type !== 'loading') {
    toastTimer = setTimeout(() => { toastMsg.value = '' }, duration)
  }
}

const message = {
  success: (msg: string | any) => showMessage(msg, 'success'),
  error: (msg: string | any) => showMessage(msg, 'error'),
  warning: (msg: string | any) => showMessage(msg, 'warning'),
  loading: (msg: string | any) => showMessage(msg, 'loading'),
}

const openModal = async (dynamicImageUrl = '') => {
  visible.value = true
  document.body.style.overflow = 'hidden'

  if (dynamicImageUrl) {
    generatedCoverUrl.value = dynamicImageUrl
  } else if (!props.imageUrl && props.title) {
    try {
      generatedCoverUrl.value = await getTextCover(props.title, 300, 400)
    } catch (error) {
      console.error(t('components.shareModal.generateCoverFailedColon'), error)
      generatedCoverUrl.value = fallbackImageUrl
    }
  } else {
    generatedCoverUrl.value = null
  }
}

const closeModal = () => {
  visible.value = false
  showChatShareModal.value = false
  document.body.style.overflow = ''
  emit('close')
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(props.link)
    message.success(t('components.shareModal.linkCopied'))
  } catch {
    message.error(t('components.shareModal.copyFailedManualCopy'))
  }
}

const displayImageUrl = computed(() => {
  if (generatedCoverUrl.value) return generatedCoverUrl.value
  if (props.imageUrl) return props.imageUrl
  return fallbackImageUrl
})

const currentTheme = ref('light')

const qrColor = computed(() => currentTheme.value === 'dark' ? '#ffffff' : '#000000')
const qrBgColor = computed(() => {
  switch (currentTheme.value) {
    case 'dark': return '#1f2937'
    case 'warm': return '#fdfbf7'
    case 'blue': return '#f0f7ff'
    case 'green': return '#f6ffed'
    case 'purple': return '#f9f0ff'
    default: return '#ffffff'
  }
})

// 富文案复制
const copyRichText = async () => {
  const authorName = props.user ? props.user.userName : t('components.shareModal.yuemuUser');
  const text = `✨ 我在悦木图库发现了一幅绝美创作《${props.title || t('components.shareModal.untitled')}》\n🎨 创作者：${authorName}\n\n👉 快来扫码看看吧！\n🔗 链接：${props.link}`;
  try {
    await navigator.clipboard.writeText(text);
    message.success(t('components.shareModal.elegantTextCopied', '文案已复制，快去分享吧'));
  } catch {
    message.error(t('components.shareModal.copyFailedManualCopy'));
  }
}

const dataURLtoFile = (dataurl: string, filename: string) => {
  const arr = dataurl.split(',')
  const match = arr[0].match(/:(.*?);/)
  const mime = match ? match[1] : 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

// 站内好友分享
const openChatShare = async () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning(t('components.shareModal.loginFirst', '请先登录以使用分享功能'));
    return;
  }
  showChatShareModal.value = true;
  
  // 边缘情况处理：如果 store 里没有联系人缓存，主动发起一次拉取
  if (chatListStore.chatListData.length === 0) {
    loadingChatList.value = true;
    chatPage.value = 1;
    hasMoreChat.value = true;
    try {
      const res = await listPrivateChatByPageUsingPost({ current: 1, pageSize: 10 });
      if (res.data?.code === 0 && res.data.data?.records) {
        // 更新到 store，保证模板直接渲染
        chatListStore.updateChatListData(res.data.data.records);
        if (res.data.data.records.length < 10) {
          hasMoreChat.value = false;
        }
      }
    } catch (error) {
      console.error('获取联系人失败', error);
    } finally {
      loadingChatList.value = false;
    }
  } else {
    chatPage.value = Math.max(1, Math.ceil(chatListStore.chatListData.length / 10));
    hasMoreChat.value = true; 
  }
}

const handleChatListScroll = async (e: Event) => {
  const target = e.target as HTMLElement;
  // 提前50px触发加载，使用 Math.ceil 防止小数精度问题
  if (Math.ceil(target.scrollTop) + target.clientHeight >= target.scrollHeight - 50) {
    if (!hasMoreChat.value || loadingMoreChat.value || loadingChatList.value) return;
    
    loadingMoreChat.value = true;
    chatPage.value += 1;
    
    try {
      const res = await listPrivateChatByPageUsingPost({ current: chatPage.value, pageSize: 10 });
      if (res.data?.code === 0 && res.data.data?.records) {
        const newRecords = res.data.data.records;
        if (newRecords.length < 10) {
          hasMoreChat.value = false;
        }
        
        if (newRecords.length > 0) {
          const existingIds = new Set(chatListStore.chatListData.map(c => c.id));
          const uniqueNewRecords = newRecords.filter((c: any) => !existingIds.has(c.id));
          chatListStore.updateChatListData([...chatListStore.chatListData, ...uniqueNewRecords]);
        }
      }
    } catch (error) {
      chatPage.value -= 1;
      console.error('加载更多联系人失败', error);
    } finally {
      loadingMoreChat.value = false;
    }
  }
}

const handleShareToFriend = async (chat: any) => {
  message.loading({ content: t('components.shareModal.generatingPoster', '正在封装分享卡片...'), key: 'shareMsg' });
  
  try {
    await nextTick();
    if (!screenshotRef.value || !captureTargetRef.value) throw new Error('Container not found');

    const screenshotContainer = screenshotRef.value
    const captureTarget = captureTargetRef.value

    screenshotContainer.style.display = 'block'
    screenshotContainer.style.position = 'fixed'
    screenshotContainer.style.left = '-9999px'
    screenshotContainer.style.top = '0'
    screenshotContainer.style.zIndex = '-1'

    // 等待图片加载和渲染
    await new Promise(resolve => setTimeout(resolve, 300))

    let canvasBgColor = '#ffffff'
    if (currentTheme.value === 'dark') canvasBgColor = '#1f2937'
    if (currentTheme.value === 'warm') canvasBgColor = '#fdfbf7'
    if (currentTheme.value === 'blue') canvasBgColor = '#f0f7ff'
    if (currentTheme.value === 'green') canvasBgColor = '#f6ffed'
    if (currentTheme.value === 'purple') canvasBgColor = '#f9f0ff'

    const canvas = await html2canvas(captureTarget, {
      backgroundColor: canvasBgColor,
      useCORS: true,
      allowTaint: true,
      scale: 1.5, // 适当缩小 scale，满足上传和预览需求
      logging: false,
    })

    screenshotContainer.style.display = 'none'

    const base64Data = canvas.toDataURL('image/jpeg', 0.8)
    const file = dataURLtoFile(base64Data, `share_${Date.now()}.jpg`)
    
    // 发起上传
    message.loading({ content: t('components.shareModal.sendingMsg', '正在发送...'), key: 'shareMsg' });
    const uploadRes = await uploadPostImageUsingPost({}, {}, file);
    
    if (uploadRes.data.code !== 0 || !uploadRes.data.data?.url) {
      throw new Error(uploadRes.data.message || '上传卡片失败');
    }
    
    const imageUrl = uploadRes.data.data.url;

    const ws = new ChatWebSocket({
      privateChatId: chat.id,
      type: chat.chatType === 3 ? 'space' : 'private'
    });
    
    const sendData = () => {
      ws.sendMessage({
        type: chat.chatType === 3 ? 3 : 'message',
        content: '[分享卡片]',
        messageUrl: imageUrl,
        messageType: 'image',
        privateChatId: String(chat.id)
      });
      setTimeout(() => {
        ws.destroy();
        showChatShareModal.value = false;
        message.success({ content: t('components.shareModal.sentSuccess', '卡片已发送给好友'), key: 'shareMsg' });
      }, 600);
    };
    
    // 发送
    ws.on('open', () => {
      sendData();
    });
    ws.connect();
    
  } catch (err) {
    console.error(err);
    message.error({ content: '生成或发送卡片失败，请重试', key: 'shareMsg' });
    if (screenshotRef.value) {
       screenshotRef.value.style.display = 'none'
    }
  }
}


const saveImage = async () => {
  try {
    await nextTick()
    if (!screenshotRef.value || !captureTargetRef.value) throw new Error(t('components.shareModal.screenshotContainerNotFound'))

    const screenshotContainer = screenshotRef.value
    const captureTarget = captureTargetRef.value

    screenshotContainer.style.display = 'block'
    screenshotContainer.style.position = 'fixed'
    screenshotContainer.style.left = '-9999px'
    screenshotContainer.style.top = '0'
    screenshotContainer.style.zIndex = '-1'

    await new Promise(resolve => setTimeout(resolve, 500))

    // 根据主题调整 html2canvas 的背景色
    let canvasBgColor = '#ffffff'
    if (currentTheme.value === 'dark') canvasBgColor = '#1f2937'
    if (currentTheme.value === 'warm') canvasBgColor = '#fdfbf7'
    if (currentTheme.value === 'blue') canvasBgColor = '#f0f7ff'
    if (currentTheme.value === 'green') canvasBgColor = '#f6ffed'
    if (currentTheme.value === 'purple') canvasBgColor = '#f9f0ff'

    const canvas = await html2canvas(captureTarget, {
      backgroundColor: canvasBgColor,
      useCORS: true,
      allowTaint: true,
      scale: 3,
      logging: false,
      imageTimeout: 10000,
    })

    screenshotContainer.style.display = 'none'

    const base64Data = canvas.toDataURL('image/jpeg', 0.95)
    utilDownloadImage(base64Data, `${t('components.shareModal.yuemuShare')}-${Date.now()}.jpg`)
    message.success(t('components.shareModal.generatePosterSuccess'))
  } catch (error) {
    console.error(t('components.shareModal.savePictureFailedColon'), error)
    if (screenshotRef.value) {
      screenshotRef.value.style.display = 'none'
    }
    message.error(t('components.shareModal.savePictureFailedRetry'))
  }
}

defineExpose({
  openModal,
})
</script>

<style scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");

.yuemu-apple-share-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: yuemu-fadeIn 0.25s ease-out;
  padding: 12px;
}

.yuemu-share-modal-content {
  position: relative;
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: yuemu-scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.yuemu-glass-close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.yuemu-glass-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.yuemu-poster-card {
  background: var(--card-background, #ffffff);
  border-radius: 20px;
  padding: 12px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  flex-direction: column;
}

.yuemu-poster-image-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid var(--border-color, #f3f4f6);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yuemu-poster-bg-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.yuemu-poster-info-area {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  padding: 4px;
}

.yuemu-info-left {
  flex: 1;
  overflow: hidden;
  padding-right: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.yuemu-poster-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin-bottom: 6px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.yuemu-poster-author {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #4b5563);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.yuemu-poster-date {
  font-size: 11px;
  color: var(--text-tertiary, #9ca3af);
}

.yuemu-info-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.yuemu-qrcode-box {
  background: #ffffff;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.yuemu-scan-text {
  font-size: 11px;
  color: var(--text-tertiary, #9ca3af);
  font-weight: 500;
}

.yuemu-action-button-group {
  display: flex;
  gap: 12px;
  width: 100%;
}

.yuemu-apple-secondary-btn,
.yuemu-apple-primary-btn {
  flex: 1;
  height: 48px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuemu-apple-secondary-btn {
  background: var(--card-background, #ffffff);
  color: var(--text-primary, #111827);
  border: 1px solid var(--border-color, #e5e7eb);
}

.yuemu-apple-secondary-btn:hover {
  background: var(--hover-background, #f3f4f6);
}

.yuemu-apple-primary-btn {
  background: var(--link-color, #2563eb);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.yuemu-apple-primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

@keyframes yuemu-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes yuemu-scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* 主题切换器 */
.yuemu-theme-switcher {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: -2px;
  width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}
.yuemu-theme-dot {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid rgba(255,255,255,0.2);
}
.yuemu-theme-dot:hover { transform: scale(1.1); }
.yuemu-theme-dot.active {
  box-shadow: 0 0 0 2px var(--card-background, #fff), 0 0 0 4px #1677ff;
}
.yuemu-theme-light { background: #ffffff; }
.yuemu-theme-dark { background: #1f2937; }
.yuemu-theme-warm { background: #fdfbf7; }
.yuemu-theme-blue { background: #f0f7ff; border-color: #bae0ff; }
.yuemu-theme-green { background: #f6ffed; border-color: #b7eb8f; }
.yuemu-theme-purple { background: #f9f0ff; border-color: #d3adf7; }

/* 底部横滑操作矩阵 */
.yuemu-action-grid {
  display: flex;
  justify-content: space-around;
  background: var(--card-background, #ffffff);
  border-radius: 20px;
  padding: 12px 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.yuemu-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}
.yuemu-action-item:hover { transform: translateY(-3px); }
.yuemu-action-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}
.yuemu-icon-green { background: linear-gradient(135deg, #10b981, #059669); }
.yuemu-icon-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.yuemu-icon-orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.yuemu-icon-gray { background: linear-gradient(135deg, #9ca3af, #6b7280); }
.yuemu-action-item span {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #4b5563);
}

/* 主题颜色变量映射 */
.theme-light {
  background: #ffffff !important;
  border-color: #e5e7eb !important;
}
.theme-light .yuemu-poster-title { color: #111827 !important; }
.theme-light .yuemu-poster-author { color: #4b5563 !important; }
.theme-light .yuemu-poster-date { color: #9ca3af !important; }
.theme-light .yuemu-scan-text { color: #9ca3af !important; }
.theme-light .yuemu-qrcode-box { background: #ffffff !important; border-color: #e5e7eb !important; }

.theme-dark {
  background: #1f2937 !important;
  border-color: #374151 !important;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
}
.theme-dark .yuemu-poster-title { color: #f9fafb !important; }
.theme-dark .yuemu-poster-author { color: #d1d5db !important; }
.theme-dark .yuemu-poster-date { color: #9ca3af !important; }
.theme-dark .yuemu-scan-text { color: #9ca3af !important; }
.theme-dark .yuemu-qrcode-box { background: #1f2937 !important; border-color: #374151 !important; }

.theme-warm {
  background: #fdfbf7 !important;
  border-color: #f3ece1 !important;
  box-shadow: 0 20px 40px rgba(139,115,85,0.1) !important;
}
.theme-warm .yuemu-poster-title { color: #433422 !important; }
.theme-warm .yuemu-poster-author { color: #8b7355 !important; }
.theme-warm .yuemu-poster-date { color: #bba996 !important; }
.theme-warm .yuemu-scan-text { color: #bba996 !important; }
.theme-warm .yuemu-qrcode-box { background: #fdfbf7 !important; border-color: #f3ece1 !important; }

.theme-blue {
  background: #f0f7ff !important;
  border-color: #bae0ff !important;
  box-shadow: 0 20px 40px rgba(22,119,255,0.1) !important;
}
.theme-blue .yuemu-poster-title { color: #0958d9 !important; }
.theme-blue .yuemu-poster-author { color: #1677ff !important; }
.theme-blue .yuemu-poster-date { color: #69b1ff !important; }
.theme-blue .yuemu-scan-text { color: #69b1ff !important; }
.theme-blue .yuemu-qrcode-box { background: #f0f7ff !important; border-color: #bae0ff !important; }

.theme-green {
  background: #f6ffed !important;
  border-color: #b7eb8f !important;
  box-shadow: 0 20px 40px rgba(82,196,26,0.1) !important;
}
.theme-green .yuemu-poster-title { color: #389e0d !important; }
.theme-green .yuemu-poster-author { color: #52c41a !important; }
.theme-green .yuemu-poster-date { color: #95de64 !important; }
.theme-green .yuemu-scan-text { color: #95de64 !important; }
.theme-green .yuemu-qrcode-box { background: #f6ffed !important; border-color: #b7eb8f !important; }

.theme-purple {
  background: #f9f0ff !important;
  border-color: #d3adf7 !important;
  box-shadow: 0 20px 40px rgba(114,46,209,0.1) !important;
}
.theme-purple .yuemu-poster-title { color: #531dab !important; }
.theme-purple .yuemu-poster-author { color: #722ed1 !important; }
.theme-purple .yuemu-poster-date { color: #b37feb !important; }
.theme-purple .yuemu-scan-text { color: #b37feb !important; }
.theme-purple .yuemu-qrcode-box { background: #f9f0ff !important; border-color: #d3adf7 !important; }

/* 截图专用容器 */
.yuemu-screenshot-container {
  position: fixed;
  left: -9999px;
  top: 0;
  z-index: -1;
}

.yuemu-capture-wrapper {
  padding: 32px;
  width: 500px;
  box-sizing: border-box;
}

.yuemu-screenshot-poster {
  border: none !important;
  box-shadow: 0 12px 40px rgba(0,0,0,0.1) !important;
  border-radius: 20px !important;
}

.yuemu-screenshot-img-wrap {
  border: 1px solid rgba(0,0,0,0.05) !important;
}

/* 头像微调 */
.yuemu-author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

/* 站内分享好友列表模态框 */
.yuemu-chat-share-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2010;
  border-radius: 20px;
  animation: yuemu-fadeIn 0.2s ease-out;
}

.yuemu-chat-share-card {
  width: 90%;
  max-width: 360px;
  max-height: 60vh;
  min-height: 300px;
  background: var(--card-background, #ffffff);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: yuemu-scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.yuemu-chat-share-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.yuemu-chat-share-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.yuemu-chat-close-btn {
  background: none;
  border: none;
  color: var(--text-tertiary, #9ca3af);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yuemu-chat-close-btn:hover {
  background: var(--hover-background, #f3f4f6);
  color: var(--text-primary, #111827);
}

.yuemu-chat-share-list {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}

.yuemu-chat-share-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.yuemu-chat-share-item:hover {
  background: var(--hover-background, #f3f4f6);
}

.chat-share-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color, #e5e7eb);
}

.chat-share-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-share-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.chat-share-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  width: fit-content;
}

.yuemu-chat-share-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
.yuemu-chat-share-empty i {
  font-size: 48px;
  margin-bottom: 12px;
  color: #e0e0e0;
}

.yuemu-chat-load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
  gap: 8px;
}

/* 独立的 Toast 提示 */
.yuemu-share-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 100001; /* 高于 ShareModal 的 2000 */
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  pointer-events: none;
}
.yuemu-share-toast i {
  font-size: 32px;
}
.yuemu-share-toast span {
  font-size: 15px;
  text-align: center;
  line-height: 1.5;
  max-width: 80vw;
}
.yuemu-share-fade-enter-active,
.yuemu-share-fade-leave-active {
  transition: opacity 0.3s ease;
}
.yuemu-share-fade-enter-from,
.yuemu-share-fade-leave-to {
  opacity: 0;
}

.yuemu-chat-share-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-glass-close-btn:active, .yuemu-glass-close-btn:hover,
  .yuemu-glass-close-btn:active *, .yuemu-glass-close-btn:hover *,
  .yuemu-apple-secondary-btn:active, .yuemu-apple-secondary-btn:hover,
  .yuemu-apple-secondary-btn:active *, .yuemu-apple-secondary-btn:hover *,
  .yuemu-theme-dot:active, .yuemu-theme-dot:hover,
  .yuemu-theme-dot:active *, .yuemu-theme-dot:hover *,
  .yuemu-apple-primary-btn:active, .yuemu-apple-primary-btn:hover,
  .yuemu-apple-primary-btn:active *, .yuemu-apple-primary-btn:hover *,
  .yuemu-action-item:active, .yuemu-action-item:hover,
  .yuemu-action-item:active *, .yuemu-action-item:hover * {
    transform: none !important;
  }
}
</style>
