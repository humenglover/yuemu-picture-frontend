<template>
  <div class="yuemu-mobile-detail">

    <header class="yuemu-header">
      <button class="yuemu-nav-icon" @click="router.back()">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="yuemu-nav-title">
        <span class="yuemu-nav-title-text">{{ picture.name || $t('pages.mobilePictureDetailPage.title') }}</span>
      </div>
      <button class="yuemu-nav-icon" @click="showMoreDrawer = true">
        <i class="fas fa-ellipsis-h"></i>
      </button>
    </header>

    <div v-if="!pictureLoaded" class="yuemu-skeleton-state">
      <div class="yuemu-skeleton-image"></div>
      <div class="yuemu-skeleton-action-bar">
        <div class="yuemu-skeleton-author">
          <div class="yuemu-skeleton-avatar"></div>
          <div class="yuemu-skeleton-name"></div>
        </div>
        <div class="yuemu-skeleton-icons">
          <div class="yuemu-skeleton-icon"></div>
          <div class="yuemu-skeleton-icon"></div>
          <div class="yuemu-skeleton-icon"></div>
        </div>
      </div>
      <div class="yuemu-skeleton-content">
        <div class="yuemu-skeleton-line short"></div>
        <div class="yuemu-skeleton-line"></div>
        <div class="yuemu-skeleton-line"></div>
      </div>
    </div>

    <div v-else-if="isDeleted" class="yuemu-empty-state">
      <img :src="emptyImage" :alt="$t('pages.mobilePictureDetailPage.emptyState.invisible')" class="yuemu-empty-state-img" />
      <h3>{{ $t('pages.mobilePictureDetailPage.emptyState.invisible') }}</h3>
      <p>{{ $t('pages.mobilePictureDetailPage.emptyState.hidden') }}</p>
      <button class="yuemu-back-btn" @click="router.back()">{{ $t('pages.mobilePictureDetailPage.emptyState.backToDiscover') }}</button>
    </div>

    <main v-else class="yuemu-scroll-main" ref="scrollContainer" @scroll="handleScroll">

      <div class="yuemu-post-image-area" @click="showImagePreview">
        <div
          class="yuemu-blur-bg"
          :style="{ backgroundImage: `url(${picture.thumbnailUrl || picture.url})` }"
        ></div>
        <div class="yuemu-blur-overlay"></div>
        <img
          :src="picture.url"
          :alt="picture.name"
          class="yuemu-actual-image"
          @load="handleImageLoad"
        />
      </div>

      <div class="yuemu-integrated-action-bar">
        <div class="yuemu-author-module" @click="handleUserClick(picture.user)">
          <div class="yuemu-avatar-container">
            <img :src="picture.user?.userAvatar || getDefaultAvatar(picture.user?.userName)" class="yuemu-avatar" />
            <button
              v-if="picture.user?.id !== loginUserStore.loginUser?.id"
              class="yuemu-tiny-follow-badge"
              :class="{ 'is-followed': isFollowed }"
              @click.stop="handleFollow"
            >
              <i class="fas" :class="isFollowed ? 'fa-check' : 'fa-plus'"></i>
            </button>
          </div>
          <span class="yuemu-author-name">{{ picture.user?.userName || $t('pages.mobilePictureDetailPage.anonymous') }}</span>
        </div>

        <div class="yuemu-interaction-module">
          <button
            class="yuemu-action-icon"
            :class="{
              'liked': picture.isLiked === 1,
              'no-permission': !picture.allowLike
            }"
            @click="doLike"
          >
            <i :class="picture.isLiked === 1 ? 'fas fa-heart' : 'far fa-heart'"></i>
            <span>{{ formatNumber(picture.likeCount) || 0 }}</span>
          </button>

          <button
            class="yuemu-action-icon"
            :class="{
              'saved': picture.isFavorited === 1,
              'no-permission': !picture.allowCollect
            }"
            @click="doFavorite"
          >
            <i :class="picture.isFavorited === 1 ? 'fas fa-star' : 'far fa-star'"></i>
            <span>{{ formatNumber(picture.favoriteCount) || 0 }}</span>
          </button>

          <button
            class="yuemu-action-icon"
            :class="{ 'no-permission': !picture.allowShare }"
            @click="doShare"
          >
            <i class="far fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <div class="yuemu-post-info">
        <div class="yuemu-caption-container" v-if="picture.introduction || picture.name">
          <div class="yuemu-caption-text" :class="{ 'is-collapsed': !descExpanded }" v-html="formattedIntroduction">
          </div>
          <button v-if="isDescLong && !descExpanded" class="yuemu-more-text-btn" @click="descExpanded = true">{{ $t('pages.mobilePictureDetailPage.expandDesc') }}</button>
        </div>

        <div class="yuemu-tags" v-if="picture.tags && picture.tags.length">
          <span v-for="tag in picture.tags" :key="tag" class="yuemu-tag-badge">#{{ tag }}</span>
        </div>

        <div class="yuemu-post-time">{{ formatTime(picture.createTime) }}</div>
      </div>

      <div class="yuemu-tab-navigation" style="margin-top: 16px;">
        <div
          class="yuemu-tab-item"
          :class="{ 'active': activeTab === 'comments' }"
          @click="switchTab('comments')"
        >
          {{ $t('pages.mobilePictureDetailPage.tabs.comments', { count: picture.commentCount || 0 }) }}
        </div>
        <div
          class="yuemu-tab-item"
          :class="{ 'active': activeTab === 'recommend' }"
          @click="switchTab('recommend')"
        >
        {{ $t('pages.mobilePictureDetailPage.tabs.aiRecommend') }}
        </div>
      </div>

      <div class="yuemu-tab-content">
        <div v-show="activeTab === 'comments'" class="yuemu-comments-section">
          <div v-if="commentloading && queryRequest.current === 1" class="yuemu-loading-wrap">
            <i class="fas fa-spinner fa-spin"></i> {{ $t('pages.mobilePictureDetailPage.comments.loading') }}
          </div>

          <div v-else-if="comments.length === 0 && !commentloading" class="yuemu-empty-comments-wrap">
            <img :src="emptyImage" :alt="$t('pages.mobilePictureDetailPage.comments.emptyText')" class="yuemu-empty-comment-img" />
            <p>{{ $t('pages.mobilePictureDetailPage.comments.emptyText') }}</p>
          </div>

          <comment-list
            v-else
            :comments="comments"
            @reply-clicked="handleReplyClick"
            @update-comments="() => queryComments(false)"
          />

          <div v-if="commentloading && queryRequest.current > 1" class="yuemu-loading-wrap">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-if="isEndOfData && !commentloading && comments.length > 0" class="yuemu-end-wrap">
          {{ $t('pages.mobilePictureDetailPage.comments.end') }}
          </div>
        </div>

        <div v-show="activeTab === 'recommend'" class="yuemu-recommend-section">
          <!-- 在 AI 相似瀑布流顶部注入全局广告组件，对用户影响极小 -->
          <div class="yuemu-sponsor-ad-wrapper" v-if="$enableAds">
            <div class="yuemu-sponsor-ad-label">
              <i class="fas fa-ad"></i> {{ $t('components.bigPicture.sponsoredTitle') || '精选赞助内容' }}
            </div>
            <GlobalAdBanner margin="0 0 16px 0" />
          </div>
          <GuessLikePictureList
            :dataList="guessLikeList"
            @click-picture="handleGuessLikeClick"
          />
          <div class="yuemu-loading-wrap" v-if="guessLikeLoading">
            <i class="fas fa-spinner fa-spin"></i> {{ $t('pages.mobilePictureDetailPage.aiRecommend.loading') }}
          </div>
          <div class="yuemu-end-wrap" v-if="!guessLikeHasMore && guessLikeList.length > 0">
          {{ $t('pages.mobilePictureDetailPage.aiRecommend.end') }}
          </div>
        </div>
      </div>
    </main>

    <div v-if="pictureLoaded && !isDeleted && activeTab === 'comments'" class="yuemu-bottom-input">
      <div v-if="showEmojiPicker" class="yuemu-emoji-float-layer">
        <emoji-picker :i18n="emojiI18n" @select="onEmojiSelect" />
      </div>

      <div class="yuemu-input-bar-inner">
        <img :src="loginUserStore.loginUser?.userAvatar || getDefaultAvatar()" class="yuemu-my-avatar" />

        <div class="yuemu-input-box" :class="{ 'is-focused': isInputFocused || replyCommentId }">
          <input
            id="commentInput"
            v-model="commentContent"
            type="text"
            autocomplete="off"
            :placeholder="replyCommentId ? $t('pages.mobilePictureDetailPage.input.replyPrefix', { user: replyTargetUserName }) : (picture.allowComment ? $t('pages.mobilePictureDetailPage.input.addComment') : $t('pages.mobilePictureDetailPage.input.commentClosed'))"
            :disabled="!picture.allowComment"
            @focus="isInputFocused = true"
            @blur="handleInputBlur"
            @keydown.enter.prevent="addComment"
          />

          <button class="yuemu-emoji-trigger-btn" :disabled="!picture.allowComment" @click.stop="toggleEmojiPicker">
            <i class="far fa-smile"></i>
          </button>

          <button
            class="yuemu-send-btn"
            :class="{ 'active': commentContent.trim() }"
            :disabled="!commentContent.trim() || !picture.allowComment"
            @click="addComment"
          >
          {{ $t('pages.mobilePictureDetailPage.input.send') }}
          </button>
        </div>
      </div>
    </div>

    <ImagePreview
      v-model:visible="showPreview"
      :images="[picture.url]"
      :initialIndex="0"
    />

    <van-popup v-model:show="showMoreDrawer" position="bottom" round class="yuemu-action-sheet">
      <div class="yuemu-drag-indicator"></div>

      <!-- 第一排：左右滑动图标按钮 -->
      <div class="yuemu-sheet-scroll-row">
        <div class="yuemu-scroll-container">
          <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="yuemu-scroll-item" @click="goToAnalytics">
            <div class="yuemu-icon-circle"><i class="fas fa-chart-bar"></i></div>
            <span>{{ $t('pages.mobilePictureDetailPage.actions.analytics') }}</span>
          </div>
          <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="yuemu-scroll-item" @click="doEdit">
            <div class="yuemu-icon-circle"><i class="fas fa-edit"></i></div>
            <span>{{ $t('pages.mobilePictureDetailPage.actions.editInfo') }}</span>
          </div>
          <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="yuemu-scroll-item" @click="showPermissionSetting = true; showMoreDrawer = false">
            <div class="yuemu-icon-circle"><i class="fas fa-lock"></i></div>
            <span>{{ $t('pages.mobilePictureDetailPage.actions.permissions') }}</span>
          </div>
          <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id) && !hasCopyright" class="yuemu-scroll-item" @click="goToCopyrightRegister">
            <div class="yuemu-icon-circle"><i class="fas fa-copyright"></i></div>
            <span>{{ $t('pages.mobilePictureDetailPage.actions.copyrightReg') }}</span>
          </div>
          <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id) && hasCopyright" class="yuemu-scroll-item" @click="goToEditCopyright">
            <div class="yuemu-icon-circle"><i class="fas fa-shield-alt"></i></div>
            <span>{{ $t('pages.mobilePictureDetailPage.actions.editCopyright') }}</span>
          </div>
          <div class="yuemu-scroll-item" @click="handleDownload">
            <div class="yuemu-icon-circle"><i class="fas fa-download"></i></div>
            <span>{{ $t('pages.mobilePictureDetailPage.actions.saveImage') }}</span>
          </div>
          <div v-if="showChatRoom" class="yuemu-scroll-item" @click="openChatModal">
            <div class="yuemu-icon-circle"><i class="fas fa-comments"></i></div>
            <span>{{ $t('pages.mobilePictureDetailPage.actions.chatRoom') }}</span>
          </div>
        </div>
      </div>

      <div class="yuemu-sheet-divider"></div>

      <!-- 第二排：垂直列表按钮 -->
      <div class="yuemu-sheet-list">
        <button class="yuemu-list-item" @click="goToCopyrightTrace">
          <i class="fas fa-search"></i>
          <span>{{ $t('pages.mobilePictureDetailPage.actions.traceImage') }}</span>
        </button>
        <button class="yuemu-list-item yuemu-text-danger" @click="openReportModal">
          <i class="fas fa-flag"></i>
          <span>{{ $t('pages.mobilePictureDetailPage.actions.report') }}</span>
        </button>
        <button v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="yuemu-list-item yuemu-text-danger" @click="showDeleteConfirm">
          <i class="fas fa-trash-alt"></i>
          <span>{{ $t('pages.mobilePictureDetailPage.actions.delete') }}</span>
        </button>
      </div>

      <div class="yuemu-sheet-footer">
        <button class="yuemu-cancel-btn" @click="showMoreDrawer = false">{{ $t('pages.mobilePictureDetailPage.actions.cancel') }}</button>
      </div>
    </van-popup>

    <ShareModal class="yuemu-high-z-modal" ref="shareModalRef" :link="shareLink" :imageUrl="picture.thumbnailUrl || picture.url" :title="picture.name" :user="picture.user" />
    <ReportModal class="yuemu-high-z-modal" ref="reportModalRef" :target-type="reportTargetType" :target-id="reportTargetId" />

    <div v-if="deleteConfirmVisible" class="yuemu-dialog-mask yuemu-high-z-modal">
      <div class="yuemu-dialog">
        <div class="yuemu-dialog-title">{{ $t('pages.mobilePictureDetailPage.dialog.confirmDelTitle') }}</div>
        <div class="yuemu-dialog-desc">{{ $t('pages.mobilePictureDetailPage.dialog.confirmDelDesc') }}</div>
        <div class="yuemu-dialog-actions">
          <button @click="deleteConfirmVisible = false">{{ $t('pages.mobilePictureDetailPage.actions.cancel') }}</button>
          <button class="yuemu-text-danger" @click="confirmDelete">{{ $t('pages.mobilePictureDetailPage.dialog.confirm') }}</button>
        </div>
      </div>
    </div>

    <div v-if="showPermissionSetting" class="yuemu-full-modal yuemu-high-z-modal">
      <header class="yuemu-header"><button class="yuemu-nav-icon" @click="showPermissionSetting = false"><i class="fas fa-chevron-down"></i></button><div class="yuemu-nav-title">{{ $t('pages.mobilePictureDetailPage.actions.permissions') }}</div><div style="width:40px"></div></header>
      <ContentPermissionSetting class="yuemu-modal-body" :pictureId="props.id" :initialPermissions="{ allowLike: picture.allowLike ? 1 : 0, allowComment: picture.allowComment ? 1 : 0, allowCollect: picture.allowCollect ? 1 : 0, allowShare: picture.allowShare ? 1 : 0 }" @permissions-updated="handlePermissionsUpdated" />
    </div>

    <div v-if="showChatModal" class="yuemu-full-modal yuemu-high-z-modal">
      <header class="yuemu-header"><button class="yuemu-nav-icon" @click="showChatModal = false"><i class="fas fa-chevron-down"></i></button><div class="yuemu-nav-title">{{ $t('pages.mobilePictureDetailPage.headers.chatRoom', { count: onlineCount }) }}</div><div style="width:40px"></div></header>
      <PictureChatRoom class="yuemu-modal-body" ref="chatRoomRef" :pictureId="props.id" @message="handleChatMessage" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, computed, onMounted, nextTick, onUnmounted, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { downloadImage } from '@/utils'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import ShareModal from '@/components/ShareModal.vue'
import PictureChatRoom from '@/components/PictureChatRoom.vue'
import { getDefaultAvatar } from '@/utils/userUtils'
import { deletePictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController'
import { addUserFollowsUsingPost, findIsFollowUsingPost } from '@/api/userFollowsController'
import { Image as AImage, message, TypographyParagraph } from 'ant-design-vue'
import ImagePreview from '@/components/ImagePreview.vue'
import CommentList from '@/components/CommentList.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import { addCommentUsingPost, queryCommentUsingPost } from '@/api/commentsController'
import { doLikeUsingPost } from '@/api/likeRecordController.ts'
import { throttle } from 'lodash-es'
import { doShareUsingPost } from '@/api/shareRecordController'
import { addFavoriteRecordUsingPost, cancelFavoriteUsingPost } from '@/api/favoriteRecordController'
import { formatTime } from '@/utils/dateUtils.ts'
import { ViewDurationTracker } from '@/utils/viewDurationTracker'
import ContentPermissionSetting from '@/components/ContentPermissionSetting.vue'
import GuessLikePictureList from '@/components/GuessLikePictureList.vue'
import GlobalAdBanner from '@/components/GlobalAdBanner.vue'
import { getCopyrightByPictureIdUsingGet } from '@/api/pictureCopyrightController'
import { searchPictureByPictureUsingPost } from '@/api/pictureController'
import emptyImage from '@/assets/illustrations/empty.png'

const props = defineProps<{ id: string | number }>()
const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

const picture = ref<API.PictureVO>({} as API.PictureVO)
const pictureLoaded = ref(false)
const imgReady = ref(false)
const isDeleted = computed(() => pictureLoaded.value && (!picture.value || !picture.value.id))
const isMobile = ref(false)

const showMoreDrawer = ref(false)
const showPermissionSetting = ref(false)
const descExpanded = ref(false)
const showPreview = ref(false)
const isFollowed = ref(false)

const viewDurationTracker = new ViewDurationTracker(1)

import { formatTextWithLinks } from '@/utils/textUtils'

const { t } = useI18n();

const isDescLong = computed(() => {
  if (!picture.value) return false
  const intro = picture.value.introduction || picture.value.name || ''
  return intro.length > 50 || intro.split('\n').length > 2
})

const formattedIntroduction = computed(() => {
  if (!picture.value) return ''
  return formatTextWithLinks(picture.value.introduction || picture.value.name || '')
})

const showEmojiPicker = ref(false)
const emojiI18n = { search: t('pages.mobilePictureDetailPage.emojiSearch'), categories: { recent: t('pages.mobilePictureDetailPage.emojiCats.recent'), smileys: t('pages.mobilePictureDetailPage.emojiCats.smileys'), people: t('pages.mobilePictureDetailPage.emojiCats.people'), nature: t('pages.mobilePictureDetailPage.emojiCats.nature'), foods: t('pages.mobilePictureDetailPage.emojiCats.foods'), activity: t('pages.mobilePictureDetailPage.emojiCats.activity'), places: t('pages.mobilePictureDetailPage.emojiCats.places'), objects: t('pages.mobilePictureDetailPage.emojiCats.objects'), symbols: t('pages.mobilePictureDetailPage.emojiCats.symbols'), flags: t('pages.mobilePictureDetailPage.emojiCats.flags') } }
const toggleEmojiPicker = () => { if (!picture.value.allowComment) return; showEmojiPicker.value = !showEmojiPicker.value }
const onEmojiSelect = (emoji: string) => { commentContent.value += emoji; showEmojiPicker.value = false; }

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.yuemu-emoji-float-layer') && !target.closest('.yuemu-emoji-trigger-btn')) {
    showEmojiPicker.value = false
  }
  if (replyCommentId.value && !target.closest('.yuemu-bottom-input') && !target.closest('.reply-btn')) {
    cancelReply()
  }
}

onMounted(async () => {
  isMobile.value = (await getDeviceType()) === DEVICE_TYPE_ENUM.MOBILE
  await fetchPictureDetail()
  Promise.all([checkIsFollowed(), updateLatestData(), loadCopyrightInfo()])
  queryComments(false)
  document.addEventListener('click', handleClickOutside)
  setTimeout(() => { if (picture.value.id && loginUserStore.loginUser?.id) viewDurationTracker.init(picture.value.id, loginUserStore.loginUser.id) }, 100)
})

onUnmounted(() => {
  if (chatRoomRef.value) chatRoomRef.value.disconnect()
  document.removeEventListener('click', handleClickOutside)
  viewDurationTracker.cleanup();
})

watch(() => props.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    pictureLoaded.value = false
    imgReady.value = false
    activeTab.value = 'comments'
    guessLikeList.value = []
    guessLikeCurrentPage.value = 1
    fetchPictureDetail()
    checkIsFollowed()
    updateLatestData()
    loadCopyrightInfo()
    queryRequest.current = 1
    queryComments(false)
    setTimeout(() => { if (picture.value.id && loginUserStore.loginUser?.id) viewDurationTracker.init(picture.value.id, loginUserStore.loginUser.id) }, 100)
  }
})

const fetchPictureDetail = async () => {
  try {
    const routePictureData = window.history?.state?.pictureData
    if (routePictureData) {
      picture.value = routePictureData
      onlineCount.value = routePictureData.chatCount || 0
      pictureLoaded.value = true
      return
    }
    const res = await getPictureVoByIdUsingGet({ id: props.id })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      onlineCount.value = res.data.data.chatCount || 0
    }
  } catch (e) {} finally {
    setTimeout(() => { pictureLoaded.value = true }, 500)
  }
}

const updateLatestData = async () => {
  try {
    const res = await getPictureVoByIdUsingGet({ id: props.id })
    if (res.data.code === 0 && res.data.data) {
      const latestData = res.data.data
      const imageUrl = picture.value.url
      Object.keys(latestData).forEach(key => { if (key !== 'url') picture.value[key] = latestData[key] })
      picture.value.url = imageUrl
      onlineCount.value = latestData.chatCount || 0
    }
  } catch (e: any) {}
}

const handleImageLoad = () => { imgReady.value = true; }
const showImagePreview = () => showPreview.value = true
const closeImagePreview = () => showPreview.value = false
const handleUserClick = (user) => { if (user) router.push(`/user/${user.id}`) }
const formatNumber = (num: number) => num ? (num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num.toString()) : '0'

const doLike = async () => {
  if (!picture.value.allowLike) return message.warning(t('pages.mobilePictureDetailPage.messages.likeDisabled'))
  try {
    const res = await doLikeUsingPost({ targetId: props.id, targetType: 1, isLiked: picture.value.isLiked !== 1 })
    if (res.data.code === 0) {
      const wasLiked = picture.value.isLiked === 1
      picture.value.isLiked = wasLiked ? 0 : 1
      const currentCount = Number(picture.value.likeCount) || 0
      picture.value.likeCount = wasLiked ? currentCount - 1 : currentCount + 1
    }
  } catch (error) {}
}

const doFavorite = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.mobilePictureDetailPage.messages.needLogin'))
  if (!picture.value.allowCollect) return message.warning(t('pages.mobilePictureDetailPage.messages.collectDisabled'))
  try {
    const currentCount = Number(picture.value.favoriteCount) || 0
    if (picture.value.isFavorited === 1) {
      await cancelFavoriteUsingPost({ userId: loginUserStore.loginUser.id, targetId: picture.value.id, targetType: 1 })
      picture.value.isFavorited = 0
      picture.value.favoriteCount = currentCount - 1
    } else {
      await addFavoriteRecordUsingPost({ userId: loginUserStore.loginUser.id, targetId: picture.value.id, targetType: 1, targetUserId: picture.value.user.id, isFavorite: true })
      picture.value.isFavorited = 1
      picture.value.favoriteCount = currentCount + 1
    }
  } catch (error) {}
}

const handleFollow = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.mobilePictureDetailPage.messages.needLogin'))
  try {
    const res = await addUserFollowsUsingPost({ followerId: loginUserStore.loginUser.id, followingId: picture.value.user.id, followStatus: isFollowed.value ? 0 : 1 })
    if (res.data?.code === 0) isFollowed.value = !isFollowed.value
  } catch (error) { message.error(t('pages.mobilePictureDetailPage.messages.opFail')) }
}

const checkIsFollowed = async () => {
  if (!loginUserStore.loginUser?.id || !picture.value?.user?.id) return
  try {
    const res = await findIsFollowUsingPost({ followerId: loginUserStore.loginUser.id, followingId: picture.value.user.id })
    if (res.data?.data) isFollowed.value = res.data.data
  } catch (error) {}
}

const shareModalRef = ref(); const reportModalRef = ref(); const reportTargetType = ref<string>(''); const reportTargetId = ref<string>('');
const shareLink = computed(() => !picture.value?.id ? '' : `${window.location.origin}/picture/${picture.value.id}`)
const doShare = () => {
  if (!picture.value.allowShare) return message.warning(t('pages.mobilePictureDetailPage.messages.shareDisabled'))
  showMoreDrawer.value = false; shareModalRef.value?.openModal()
}

const activeTab = ref<'comments' | 'recommend'>('comments')
const guessLikeList = ref<API.PictureVO[]>([])
const guessLikeLoading = ref(false)
const guessLikeCurrentPage = ref(1)
const guessLikeHasMore = ref(true)

const fetchGuessLikeData = async () => {
  if (guessLikeLoading.value || !guessLikeHasMore.value || !picture.value.url) return
  guessLikeLoading.value = true
  try {
    const res = await searchPictureByPictureUsingPost({
      pictureId: picture.value.id,
      pictureUrl: picture.value.url,
      current: guessLikeCurrentPage.value,
      pageSize: 12
    })
    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records || []
      if (guessLikeCurrentPage.value === 1) {
        guessLikeList.value = records
      } else {
        guessLikeList.value = [...guessLikeList.value, ...records]
      }
      guessLikeHasMore.value = records.length >= 12
    }
  } catch (e: any) {} finally {
    guessLikeLoading.value = false
  }
}

const isSwitchingTab = ref(false)

const switchTab = (tab: 'comments' | 'recommend') => {
  if (activeTab.value === tab) return
  isSwitchingTab.value = true
  activeTab.value = tab

  nextTick(() => {
    const tabEl = document.querySelector('.yuemu-tab-navigation') as HTMLElement
    const scrollEl = scrollContainer.value
    if (tabEl && scrollEl) {
      const targetTop = tabEl.offsetTop - 60
      if (scrollEl.scrollTop > targetTop) {
        scrollEl.scrollTop = targetTop
      }
    }
    setTimeout(() => {
      isSwitchingTab.value = false
    }, 100)
  })

  if (tab === 'recommend' && guessLikeList.value.length === 0) {
    guessLikeCurrentPage.value = 1
    fetchGuessLikeData()
  }
}

const handleGuessLikeClick = (newPicture: any) => {
  router.replace({
    path: `/picture-redirect/${newPicture.id}`,
    state: { pictureData: JSON.parse(JSON.stringify(newPicture)) }
  })
}

const openReportModal = () => { showMoreDrawer.value = false; if (reportModalRef.value) { reportTargetType.value = '1'; reportTargetId.value = picture.value.id.toString(); reportModalRef.value.openModal(reportTargetType.value, reportTargetId.value) } }

const showChatRoom = computed(() => !picture.value?.spaceId)
const showChatModal = ref(false)
const onlineCount = ref(0)
const chatRoomRef = ref()
const handleChatMessage = (msg: any) => { if (msg.type === 'onlineUsers') onlineCount.value = msg.onlineCount }
const openChatModal = () => { showMoreDrawer.value = false; if (loginUserStore.loginUser) showChatModal.value = true; else message.warning(t('pages.mobilePictureDetailPage.messages.needLogin')) }

const doEdit = () => { showMoreDrawer.value = false; router.push({ path: '/add_picture', query: { id: picture.value.id, spaceId: picture.value.spaceId } }) }
const handleDownload = () => { showMoreDrawer.value = false; if (picture.value.isDownload === 0) return message.warning(t('pages.mobilePictureDetailPage.messages.downloadDisabled')); downloadImage(picture.value.url, picture.value.name || t('pages.mobilePictureDetailPage.title')); message.success(t('pages.mobilePictureDetailPage.messages.startDownload')); }
const deleteConfirmVisible = ref(false)
const showDeleteConfirm = () => { showMoreDrawer.value = false; deleteConfirmVisible.value = true; }
const confirmDelete = async () => {
  try {
    const res = await deletePictureUsingPost({ id: picture.value?.id })
    if (res.data.code === 0) { message.success(t('pages.mobilePictureDetailPage.messages.delSuccess')); router.back(); }
  } catch (error: any) {}
}

const handlePermissionsUpdated = (updatedPermissions: any) => { Object.assign(picture.value, updatedPermissions); showPermissionSetting.value = false; message.success(t('pages.mobilePictureDetailPage.messages.permUpdated')); }

const hasCopyright = ref(false)
const copyrightInfo = ref<API.CopyrightInfoVO | null>(null)
const loadCopyrightInfo = async () => {
  if (!picture.value?.id) return
  try {
    const res = await getCopyrightByPictureIdUsingGet({ pictureId: String(picture.value.id) })
    if (res.data.code === 0 && res.data.data) { copyrightInfo.value = res.data.data; hasCopyright.value = true; }
  } catch (error) {}
}
const goToCopyrightRegister = () => { showMoreDrawer.value = false; router.push({ path: '/picture/copyright/register', query: { pictureId: String(picture.value.id) } }) }
const goToEditCopyright = () => { showMoreDrawer.value = false; router.push({ path: '/picture/copyright/register', query: { pictureId: String(picture.value.id), edit: 'true' } }) }
const goToCopyrightTrace = () => {
  showMoreDrawer.value = false
  if (copyrightInfo.value?.copyrightCode) { router.push({ path: '/picture/copyright/trace', query: { code: copyrightInfo.value.copyrightCode } }) }
  else { router.push({ path: '/picture/copyright/trace' }) }
}

const goToAnalytics = () => {
  if (!props.id) return message.warning(t('pages.mobilePictureDetailPage.messages.noPicId'))
  showMoreDrawer.value = false
  router.push(`/item/analytics/picture/${props.id}`)
}

const comments = ref<API.Comment[]>([])
const commentContent = ref('')
const replyCommentId = ref('')
const replyTargetUserName = ref('')
const commentloading = ref(false)
const isEndOfData = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
const isAddingComment = ref(false)
const isInputFocused = ref(false)
const queryRequest = reactive<API.CommentsQueryRequest>({ targetId: props.id, targetType: 1, current: 1, pageSize: 15 })

const focusInput = () => {
  if (!picture.value.allowComment) return message.warning(t('pages.mobilePictureDetailPage.messages.commentDisabled'))
  const inputEl = document.getElementById('commentInput')
  if (inputEl) inputEl.focus()
}

const queryComments = async (silent = false) => {
  if (!silent) commentloading.value = true
  try {
    const res = await queryCommentUsingPost(queryRequest)
    if (res.data?.data != null) {
      const newComments = res.data.data.records.map((comment: any) => ({ ...comment, commentId: comment.commentId?.toString(), parentCommentId: comment.parentCommentId?.toString() }))
      if (queryRequest.current === 1) comments.value = newComments; else comments.value = [...comments.value, ...newComments];
      isEndOfData.value = newComments.length < queryRequest.pageSize
    } else {
      if (queryRequest.current === 1) comments.value = [];
      isEndOfData.value = true;
    }
  } catch (error) {} finally {
    if (!silent) commentloading.value = false
  }
}

const findComment = (list: any[], id: string): any => {
  for (const c of list) {
    if (c.commentId === id) return c;
    if (c.children && c.children.length > 0) { const found = findComment(c.children, id); if (found) return found; }
  }
  return null;
}

const removeOptimisticComment = (id: string) => {
  comments.value = comments.value.filter(c => c.commentId !== id)
  const removeFromChildren = (list: any[]) => {
    for (const c of list) {
      if (c.children) { c.children = c.children.filter((child: any) => child.commentId !== id); removeFromChildren(c.children) }
    }
  }
  removeFromChildren(comments.value)
}

const addComment = async () => {
  if (!picture.value.allowComment) return message.warning(t('pages.mobilePictureDetailPage.messages.commentDisabled'))
  const content = commentContent.value.trim()
  if (!content || isAddingComment.value) return

  isAddingComment.value = true
  const tempId = `temp-${Date.now()}`
  const parentId = replyCommentId.value || '0'
  const targetUserName = replyTargetUserName.value

  const optimisticComment = {
    commentId: tempId,
    content: content,
    createTime: new Date().toISOString(),
    likeCount: '0',
    dislikeCount: '0',
    commentUser: {
      id: loginUserStore.loginUser?.id,
      userName: loginUserStore.loginUser?.userName,
      userAvatar: loginUserStore.loginUser?.userAvatar
    },
    isOptimistic: true,
    children: [] // 补充children防止子组件报错
  }

  // ===== 1. 先将假数据推入本地数组 =====
  if (parentId !== '0') {
    (optimisticComment as any).parentId = parentId;
    (optimisticComment as any).targetUser = { userName: targetUserName };
    const parent = findComment(comments.value, parentId);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.unshift(optimisticComment);
    }
  } else {
    comments.value.unshift(optimisticComment as any);
  }

  // 清空输入框状态
  commentContent.value = '';
  replyCommentId.value = '';
  replyTargetUserName.value = '';
  showEmojiPicker.value = false;

  if (parentId === '0') {
    nextTick(() => {
      const scrollEl = document.querySelector('.yuemu-scroll-main')
      const commentsHeader = document.querySelector('.yuemu-comments-header')
      if (scrollEl && commentsHeader) {
        const topPos = (commentsHeader as HTMLElement).offsetTop - 20;
        scrollEl.scrollTo({ top: topPos, behavior: 'smooth' })
      }
    })
  }

  // ===== 2. 发送请求并在成功后进行“局部替换” =====
  try {
    const res = await addCommentUsingPost({
      targetId: picture.value.id,
      targetType: 1,
      content: content,
      parentCommentId: parentId
    })

    if (res.data.code === 0) {
      // 数量+1
      const currentCount = Number(picture.value.commentCount) || 0
      picture.value.commentCount = currentCount + 1

      // 找到我们刚才塞进去的那个假评论
      const tempComment = findComment(comments.value, tempId)
      if (tempComment) {
        const realId = res.data.data
        // 用后端返回的真实 ID 覆盖假数据
        tempComment.commentId = realId ? String(realId) : `real-${Date.now()}`
        // 取消骨架屏/闪烁状态，将其变为真实评论
        tempComment.isOptimistic = false
      }

      // 注意：这里我们移除了下面这两行导致重新请求拉取分页的代码
      // queryRequest.current = 1;
      // await queryComments(true);

    } else {
      // 失败则移除假评论，恢复输入框
      removeOptimisticComment(tempId);
      commentContent.value = content;
      message.error(res.data.message || t('pages.mobilePictureDetailPage.messages.defaultCommentFail'))
    }
  } catch (error) {
    removeOptimisticComment(tempId);
    commentContent.value = content;
    message.error(t('pages.mobilePictureDetailPage.messages.commentFail'))
  } finally {
    isAddingComment.value = false
  }
}

const handleReplyClick = (commentId: string, userName: string) => { replyCommentId.value = commentId; replyTargetUserName.value = userName; focusInput(); }
const cancelReply = () => { replyCommentId.value = ''; replyTargetUserName.value = ''; }

const handleInputBlur = (e: FocusEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (relatedTarget && (
    relatedTarget.closest('.yuemu-emoji-float-layer') ||
    relatedTarget.closest('.yuemu-emoji-trigger-btn')
  )) {
    return;
  }

  isInputFocused.value = false
  showEmojiPicker.value = false

  if (!commentContent.value.trim()) {
    cancelReply()
  }
}

const handleScroll = throttle(() => {
  if (isSwitchingTab.value) return
  const container = scrollContainer.value
  if (!container) return
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
    if (activeTab.value === 'comments' && !commentloading.value && !isEndOfData.value) {
      queryRequest.current++; queryComments(false).catch(() => queryRequest.current--)
    } else if (activeTab.value === 'recommend' && !guessLikeLoading.value && guessLikeHasMore.value) {
      guessLikeCurrentPage.value++; fetchGuessLikeData()
    }
  }
}, 150)

</script>

<style scoped>
/* ================= 1. 全屏视口控制 ================= */
.yuemu-mobile-detail {
  position: fixed; inset: 0; z-index: 9999;
  background-color: var(--background);
  color: var(--text-primary);
  display: flex; flex-direction: column;
  height: 100vh; height: 100dvh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif;
}

/* ================= 2. 极简导航栏 ================= */
.yuemu-header {
  display: flex; justify-content: space-between; align-items: center;
  height: 48px; padding: 0 12px;
  background-color: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.yuemu-nav-icon { background: none; border: none; color: var(--text-primary); font-size: 20px; padding: 4px 8px; cursor: pointer; }
.yuemu-nav-title {
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
  overflow: hidden;
  padding: 0 8px;
}
.yuemu-nav-title-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

/* ================= 3. 核心滑动区 ================= */
.yuemu-scroll-main {
  flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch;
  padding-bottom: 24px; scrollbar-width: none; -ms-overflow-style: none;
}
.yuemu-scroll-main::-webkit-scrollbar { display: none; width: 0; height: 0; }

/* ================= 4. 融合式互动栏 ================= */
.yuemu-integrated-action-bar {
  display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 8px;
}
.yuemu-author-module { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.yuemu-avatar-container { position: relative; width: 38px; height: 38px; }
.yuemu-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); }
.yuemu-tiny-follow-badge {
  position: absolute; bottom: -2px; right: -2px; width: 16px; height: 16px; border-radius: 50%;
  background-color: var(--link-color); color: #fff; border: 2px solid var(--background);
  display: flex; align-items: center; justify-content: center; font-size: 8px; cursor: pointer; padding: 0; transition: 0.2s;
}
.yuemu-tiny-follow-badge.is-followed { background-color: var(--border-color); color: var(--text-primary); }
.yuemu-author-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }

.yuemu-interaction-module { display: flex; align-items: center; gap: 16px; }
.yuemu-action-icon {
  background: none; border: none; padding: 0; font-size: 22px; color: var(--text-primary);
  transition: transform 0.1s; cursor: pointer; display: flex; align-items: center; gap: 4px;
}
.yuemu-action-icon span { font-size: 15px; font-weight: 500; }
.yuemu-action-icon:active:not(.no-permission) { transform: scale(0.85); }
.yuemu-action-icon.liked i { color: #ff3b30; animation: yuemuPop 0.3s ease; }
.yuemu-action-icon.saved i { color: #FFD700; animation: yuemuPop 0.3s ease; text-shadow: 0 0 8px rgba(255,215,0,0.4); }
.yuemu-action-icon.no-permission { opacity: 0.25; color: var(--text-secondary); cursor: not-allowed; }

@keyframes yuemuPop { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }

/* ================= 5. 图片画板 ================= */
.yuemu-post-image-area {
  position: relative; width: 100%; min-height: 350px; max-height: 80vh;
  background-color: var(--background); display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.yuemu-blur-bg { position: absolute; inset: -20px; background-size: cover; background-position: center; filter: blur(40px) opacity(0.7); transform: scale(1.1); z-index: 0; }
.yuemu-blur-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); z-index: 1; }
.yuemu-actual-image { position: relative; z-index: 2; width: 100%; height: auto; max-height: 80vh; object-fit: contain; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }

/* ================= 6. 正文与文案 ================= */
.yuemu-post-info { padding: 0 14px; font-size: 14px; }
.yuemu-likes-count { font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }

.yuemu-caption-container { margin-bottom: 8px; }
.yuemu-caption-text { font-size: 14px; line-height: 1.5; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; }
.yuemu-caption-text.is-collapsed { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; }
.yuemu-more-text-btn { background: none; border: none; color: var(--text-secondary); font-size: 14px; padding: 0; cursor: pointer; margin-top: 4px; font-weight: 500; }

.yuemu-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.yuemu-tag-badge { background: rgba(24, 144, 255, 0.08); color: var(--link-color); padding: 4px 10px; border-radius: 12px; font-size: 13px; }
.yuemu-post-time { font-size: 12px; color: var(--text-secondary); font-weight: 300; }

.yuemu-divider { height: 1px; background: var(--border-color); margin: 16px 0; }

/* ================= 7. 评论区 ================= */
.yuemu-comments-section { padding: 0 14px; }
.yuemu-comments-header-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.yuemu-comments-header { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }

.yuemu-guess-like-btn {
  display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px;
  background: var(--hover-background); border: 1px solid var(--border-color); color: var(--text-primary);
  font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;
}
.yuemu-guess-like-btn:hover, .yuemu-guess-like-btn:active {
  color: #3b82f6; border-color: #3b82f6; background: rgba(59, 130, 246, 0.05);
  transform: translateY(-1px);
}
.yuemu-loading-wrap, .yuemu-end-wrap { text-align: center; padding: 20px; color: var(--text-secondary); font-size: 13px; }

.yuemu-empty-comments-wrap { display: flex; flex-direction: column; align-items: center; padding: 40px 0; opacity: 0.8; }
.yuemu-empty-comment-img { width: 120px; height: auto; margin-bottom: 12px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.05)); }
.yuemu-empty-comments-wrap p { font-size: 13px; color: var(--text-secondary); }

/* ================= 8. 底部输入栏 ================= */
.yuemu-bottom-input {
  position: relative; flex-shrink: 0; background: var(--card-background);
  border-top: 1px solid var(--border-color); padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 10px rgba(0,0,0,0.03); z-index: 40;
}

.yuemu-emoji-float-layer {
  position: absolute; bottom: 100%; left: 8px; right: 8px; margin-bottom: 8px; z-index: 3500;
  border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); background: var(--card-background); overflow: hidden;
}
.yuemu-emoji-float-layer :deep(> *) {
  width: 100% !important;
}

.yuemu-input-bar-inner { display: flex; align-items: center; gap: 10px; }
.yuemu-my-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border-color); }

.yuemu-input-box {
  flex: 1; display: flex; align-items: center; background: var(--hover-background);
  border-radius: 20px; padding: 0 14px; height: 36px; border: 1px solid transparent;
  transition: all 0.2s ease; overflow: hidden;
}
.yuemu-input-box.is-focused { border-color: var(--link-color); background: var(--card-background); }

.yuemu-inline-reply-prefix {
  display: flex; align-items: center; color: var(--link-color); font-size: 14px; font-weight: 500;
  white-space: nowrap; padding-right: 4px; cursor: pointer;
}
.yuemu-inline-reply-prefix span { max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
.yuemu-inline-reply-prefix i { font-size: 11px; margin-left: 2px; opacity: 0.6; }

.yuemu-input-box input {
  flex: 1; border: none; background: transparent; font-size: 14px;
  color: var(--text-primary); outline: none; height: 100%; min-width: 20px;
}
.yuemu-input-box input::placeholder { color: var(--text-secondary); }

.yuemu-emoji-trigger-btn {
  background: none; border: none; font-size: 20px; color: var(--text-secondary);
  cursor: pointer; padding: 0; display: flex; align-items: center; transition: color 0.2s; margin-left: 6px;
}
.yuemu-emoji-trigger-btn:hover:not(:disabled) { color: var(--link-color); }
.yuemu-emoji-trigger-btn:disabled { cursor: not-allowed; opacity: 0.5; }

.yuemu-send-btn {
  background: none; border: none; color: var(--text-secondary); font-weight: 600; font-size: 14px;
  padding: 0 0 0 10px; margin-left: 6px; border-left: 1px solid var(--border-color); transition: color 0.2s;
}
.yuemu-send-btn.active { color: var(--link-color); }
.yuemu-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ================= 9. 骨架图 & 空状态 ================= */
.yuemu-skeleton-state { flex: 1; display: flex; flex-direction: column; background-color: var(--background); }
.yuemu-skeleton-image { width: 100%; height: 350px; background: var(--border-color); animation: yuemuSkeletonPulse 1.5s ease-in-out infinite; }
.yuemu-skeleton-action-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px 8px; }
.yuemu-skeleton-author { display: flex; align-items: center; gap: 10px; }
.yuemu-skeleton-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--border-color); animation: yuemuSkeletonPulse 1.5s ease-in-out infinite; }
.yuemu-skeleton-name { width: 80px; height: 14px; border-radius: 4px; background: var(--border-color); animation: yuemuSkeletonPulse 1.5s ease-in-out infinite; }
.yuemu-skeleton-icons { display: flex; gap: 16px; }
.yuemu-skeleton-icon { width: 22px; height: 22px; border-radius: 50%; background: var(--border-color); animation: yuemuSkeletonPulse 1.5s ease-in-out infinite; }
.yuemu-skeleton-content { padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; }
.yuemu-skeleton-line { width: 100%; height: 14px; border-radius: 4px; background: var(--border-color); animation: yuemuSkeletonPulse 1.5s ease-in-out infinite; }
.yuemu-skeleton-line.short { width: 40%; margin-bottom: 4px; }

@keyframes yuemuSkeletonPulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }

.yuemu-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; flex: 1; }
.yuemu-empty-state-img { width: 140px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.05)); }
.yuemu-empty-state h3 { font-size: 18px; margin: 0 0 8px; color: var(--text-primary); }
.yuemu-empty-state p { font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; }
.yuemu-back-btn { background: var(--text-primary); color: var(--background); border: none; padding: 10px 32px; border-radius: 24px; font-weight: 600; font-size: 14px; }

/* ================= 10. Action Sheet (Douyin Style) ================= */
.yuemu-action-sheet {
  background-color: var(--card-background) !important;
  padding-bottom: env(safe-area-inset-bottom);
  border-radius: 16px 16px 0 0 !important;
}

.yuemu-drag-indicator {
  width: 36px;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  margin: 12px auto 20px;
}

/* 第一排：横向滚动 */
.yuemu-sheet-scroll-row {
  padding: 0 4px 16px;
  overflow-x: auto;
  scrollbar-width: none;
}
.yuemu-sheet-scroll-row::-webkit-scrollbar { display: none; }

.yuemu-scroll-container {
  display: flex;
  gap: 16px;
  padding: 0 16px;
  min-width: max-content;
}

.yuemu-scroll-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 64px;
}

.yuemu-icon-circle {
  width: 48px;
  height: 48px;
  background: var(--hover-background);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-primary);
  transition: background 0.2s;
}
.yuemu-scroll-item:active .yuemu-icon-circle { background: var(--border-color); }

.yuemu-scroll-item span {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
}

.yuemu-sheet-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0 16px;
  opacity: 0.5;
}

/* 第二排：列表项 */
.yuemu-sheet-list {
  padding: 8px 16px;
}

.yuemu-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 0;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
  border-bottom: 1px solid var(--border-color);
}
.yuemu-list-item:last-child { border-bottom: none; }
.yuemu-list-item i { font-size: 18px; width: 24px; text-align: center; color: var(--text-secondary); }
.yuemu-list-item:active { opacity: 0.6; }

.yuemu-text-danger { color: #ff3b30 !important; }
.yuemu-text-danger i { color: #ff3b30 !important; }

/* 底部取消 */
.yuemu-sheet-footer {
  padding: 12px 16px 16px;
}

.yuemu-cancel-btn {
  width: 100%;
  height: 44px;
  background: var(--hover-background);
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.yuemu-cancel-btn:active { background: var(--border-color); }

/* ================= 11. 高层级弹窗 ================= */
.yuemu-high-z-modal { z-index: 3500 !important; }

.yuemu-dialog-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 4000; }
.yuemu-dialog { background: var(--card-background); border-radius: 14px; width: 270px; text-align: center; overflow: hidden; }
.yuemu-dialog-title { font-size: 17px; font-weight: 600; margin: 20px 0 6px; color: var(--text-primary); }
.yuemu-dialog-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; padding: 0 16px; }
.yuemu-dialog-actions { display: flex; border-top: 1px solid var(--border-color); }
.yuemu-dialog-actions button { flex: 1; padding: 14px; border: none; background: none; font-size: 16px; color: var(--text-primary); cursor: pointer; border-right: 1px solid var(--border-color); }
.yuemu-dialog-actions button:last-child { border-right: none; }
.yuemu-dialog-actions button.yuemu-text-danger { color: #ff3b30; font-weight: 600; }

.yuemu-full-modal { position: fixed; inset: 0; background: var(--background); display: flex; flex-direction: column; z-index: 3500; }
.yuemu-modal-body { flex: 1; overflow-y: auto; }

.yuemu-tab-navigation {
  display: flex;
  padding: 0 20px;
  margin-bottom: 16px;
  gap: 24px;
}
.yuemu-tab-item {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 12px 0;
  position: relative;
  cursor: pointer;
  transition: color 0.3s ease;
}
.yuemu-tab-item.active {
  color: var(--link-color);
  font-weight: 600;
}
.yuemu-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--link-color);
  border-radius: 3px 3px 0 0;
}
.yuemu-recommend-section {
  padding: 0 14px;
}
.yuemu-sponsor-ad-wrapper {
  margin-top: 16px;
  position: relative;
}
.yuemu-sponsor-ad-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  padding-left: 2px;
}
</style>
