<template>
  <Teleport to="body">
    <div class="yuemu-picture-modal-overlay" style="background-color: transparent;" @click.self="handleClose" ref="overlayRef">
      <div class="yuemu-modal-container" :class="{ 'yuemu-is-mobile': isMobile }">
        <button class="yuemu-modal-close-btn" @click="handleClose" :title="t('components.pictureDetailView.close')">
          <i class="fas fa-times"></i>
        </button>
        <div class="yuemu-modal-content-wrapper" @click.stop>
          <div class="yuemu-preview-section" @wheel="handlePreviewWheel" @touchstart="handlePreviewTouchStart" @touchmove="handlePreviewTouchMove">
            <div v-show="!imgReady" class="yuemu-simple-loader">
              <i class="fas fa-circle-notch fa-spin"></i>
            </div>
            <div class="yuemu-image-container">
              <img
                v-if="picture.url"
                :src="picture.url"
                :alt="picture.name"
                class="yuemu-main-image"
                style="opacity: 0;"
                ref="mainImageRef"
                @load="handleImageLoad"
                @click="showImagePreview"
              />
              <div class="yuemu-explore-hint" v-show="imgReady">
                <div class="yuemu-scroll-down-hint" @click="triggerGuessLike" style="cursor: pointer;">
                  <i class="fas fa-chevron-down yuemu-bounce"></i>{{ t('components.pictureDetailView.scrollDownForSimilar') }}</div>
              </div>
            </div>

            <!-- 新增：猜你喜欢推荐瀑布流（沉浸式手账风） -->
            <div class="yuemu-guess-like-section" v-show="picture.id && showGuessLike">
              <div class="yuemu-guess-like-header">
                <h3 class="yuemu-guess-like-title">{{ t('components.pictureDetailView.guessYouLike') }}</h3>
                <button class="yuemu-guess-like-refresh" @click="handleRefreshGuessLike" :disabled="guessLikeLoading">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': guessLikeLoading }"></i>{{ t('components.pictureDetailView.change') }}</button>
              </div>
              
              <!-- 顶部横幅广告注入 -->
              <div class="yuemu-sponsor-ad-wrapper" v-if="$enableAds">
                <div class="yuemu-sponsor-ad-label">
                  <i class="fas fa-ad"></i> {{ t('components.bigPicture.sponsoredTitle') || '精选赞助内容' }}
                </div>
                <div class="yuemu-sponsor-ad-box">
                  <GlobalAdBanner margin="0" :fillHeight="true" />
                </div>
              </div>

              <GuessLikePictureList
                :dataList="guessLikeList"
                @click-picture="handleGuessLikeClick"
              />
              <div class="guess-like-bottom" ref="guessLikeBottomRef">
                <div v-if="guessLikeLoading" class="loading-more-text">
                  <i class="fas fa-spinner fa-spin"></i>{{ t('components.pictureDetailView.loadingMoreRecommendations') }}</div>
                <div v-else-if="guessLikeHasMore && guessLikeList.length > 0" class="load-more-btn" @click="handleLoadMoreGuessLike">
                  {{ t('components.pictureDetailView.clickOrScrollToLoadMore') }}
                </div>
                <div v-else-if="!guessLikeHasMore && guessLikeList.length > 0" class="no-more-text">
                  {{ t('components.pictureDetailView.noMoreSimilarPictures') }}
                </div>
              </div>
            </div>
          </div>
          <div class="yuemu-details-section">
            <div class="yuemu-details-header">
              <div class="yuemu-author-card">
                <div class="yuemu-author-info" @click="handleUserClick(picture.user)">
                  <img
                    :src="picture.user?.userAvatar || getDefaultAvatar(picture.user?.userName)"
                    class="yuemu-author-avatar"
                    alt=""
                  />
                  <div class="yuemu-author-meta">
                    <div class="yuemu-name-row">
                      <span class="yuemu-author-name">{{ picture.user?.userName || $t('components.pictureDetailView.anonymousUser') }}</span>
                      <button
                        v-if="picture.user?.id !== loginUserStore.loginUser?.id"
                        class="yuemu-follow-btn-inline"
                        :class="{ 'yuemu-followed': isFollowed }"
                        @click.stop="handleFollow"
                      >
                        {{ isFollowed ? $t('components.pictureDetailView.followed') : $t('components.pictureDetailView.follow') }}
                      </button>
                    </div>
                    <span class="yuemu-publish-time">{{ formatTime(picture.createTime) }}</span>
                  </div>
                </div>
              </div>
              <div class="yuemu-description-card">
                <h1 class="yuemu-pic-title">{{ picture.name || $t('components.pictureDetailView.unnamedPicture') }}</h1>
                <div class="yuemu-pic-intro" v-html="formattedIntroduction"></div>
                <div class="yuemu-pic-tags" v-if="picture.tags?.length">
                  <span v-for="tag in picture.tags" :key="tag" class="yuemu-tag-item">#{{ tag }}</span>
                </div>
              </div>
              <div class="yuemu-stats-bar">
                <span class="yuemu-stat-item"><i class="fas fa-eye"></i> {{ $t('components.pictureDetailView.viewCount', { count: picture.viewCount || 0 }) }}</span>
                <span class="yuemu-stat-item"><i class="fas fa-clock"></i> {{ $t('components.pictureDetailView.publishedAt') }} {{ formatTime(picture.createTime) }}</span>
              </div>
              <div class="yuemu-divider"></div>
              <div class="yuemu-comments-header">
                <h3>{{ $t('components.pictureDetailView.commentsCount', { count: picture.commentCount || 0 }) }}</h3>
              </div>
            </div>
            <div class="yuemu-details-inner">
              <comment-list
                v-if="comments.length"
                :comments="comments"
                @reply-clicked="handleReplyClick"
                @update-comments="queryComments"
              />
              <div v-if="comments.length === 0 && commentloading" class="yuemu-loading-more" style="padding-top: 40px; color: #999;">
                <i class="fas fa-spinner fa-spin"></i>{{ t('components.pictureDetailView.loadingComments') }}</div>
              <div v-if="comments.length === 0 && !commentloading" class="yuemu-empty-comment-state">
                <img src="@/assets/illustrations/empty.png" :alt="$t('components.pictureDetailView.noCommentsAlt')" />
                <p>{{ t('components.pictureDetailView.noCommentsYet') }}</p>
              </div>
              <div v-if="isEndOfData && comments.length > 0" class="yuemu-end-of-data">
                {{ t('components.pictureDetailView.reachedBottom') }}
              </div>
              <div v-if="commentloading && comments.length > 0" class="yuemu-loading-more">
                <i class="fas fa-spinner fa-spin"></i>{{ t('components.pictureDetailView.loading') }}</div>
            </div>
            <div class="yuemu-action-footer">
              <div class="yuemu-comment-input-container">
                <div class="yuemu-input-bar-inner">
                  <img :src="loginUserStore.loginUser?.userAvatar || getDefaultAvatar()" class="yuemu-my-avatar" />
                  <div class="yuemu-input-box" :class="{ 'yuemu-is-focused': isInputFocused || replyCommentId }">
                    <input
                      id="modalCommentInput"
                      v-model="commentContent"
                      type="text"
                      autocomplete="off"
                      :placeholder="replyCommentId ? `${t('components.pictureDetailView.replyTo')}${replyTargetUserName}` : (picture.allowComment ? t('components.pictureDetailView.addCommentPlaceholder') : t('components.pictureDetailView.commentsClosed'))"
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
                      :class="{ 'yuemu-active': commentContent.trim() }"
                      :disabled="!commentContent.trim() || !picture.allowComment || isAddingComment"
                      @click="addComment"
                    >{{ t('components.pictureDetailView.send') }}</button>
                  </div>
                </div>
                <div v-if="showEmojiPicker" class="yuemu-emoji-picker-wrapper" @mousedown.prevent>
                  <emoji-picker class="yuemu-custom-emoji-picker" :i18n="emojiI18n" @select="onEmojiSelect" />
                </div>
              </div>
              <div class="yuemu-footer-buttons">
                <div class="yuemu-footer-btn-item yuemu-like" :class="{ 'yuemu-active': picture.isLiked === 1 }" @click="doLike">
                  <i class="fas fa-heart"></i>
                  <span>{{ picture.likeCount || 0 }}</span>
                </div>
                <div class="yuemu-footer-btn-item yuemu-favorite" :class="{ 'yuemu-active': picture.isFavorited === 1 }" @click="doFavorite">
                  <i class="fas fa-star"></i>
                  <span>{{ picture.favoriteCount || 0 }}</span>
                </div>
                <div class="yuemu-footer-btn-item" @click="doShare">
                  <i class="fas fa-share"></i>
                </div>
                <div class="yuemu-footer-btn-item yuemu-more" @click="handleShowMoreModal">
                  <i class="fas fa-ellipsis-h"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="yuemu-modal-layer">
        <ShareModal
          ref="shareModalRef"
          :link="shareLink"
          :imageUrl="picture.url"
          :title="picture.name"
          :user="picture.user"
          :createTime="picture.createTime"
        />
      </div>
      <ReportModal ref="reportModalRef" :target-type="'1'" :target-id="String(picture.id)" />
      <div v-if="showPermissionSetting" class="yuemu-custom-confirm-overlay">
        <div class="yuemu-permission-setting-content" @click.stop>
          <div class="yuemu-modal-header">
            <h3>{{ t('components.pictureDetailView.permissionSettings') }}</h3>
            <button class="yuemu-modal-close-btn" style="position:relative; width:30px; height:30px; top:0; right:0" @click="showPermissionSetting = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <ContentPermissionSetting
            :pictureId="picture.id || props.id"
            :initialPermissions="{
                allowLike: picture.allowLike ? 1 : 0,
                allowComment: picture.allowComment ? 1 : 0,
                allowCollect: picture.allowCollect ? 1 : 0,
                allowShare: picture.allowShare ? 1 : 0
              }"
            @permissions-updated="handlePermissionsUpdated"
          />
        </div>
      </div>
      <div v-if="showChatModal" class="yuemu-custom-confirm-overlay">
        <div class="yuemu-chat-room-content" @click.stop>
          <div class="yuemu-modal-header">
            <h3>{{ t('components.pictureDetailView.pictureChatRoom') }}<span style="font-size:12px; font-weight:normal;">(在线 {{ onlineCount || 0 }} 人)</span></h3>
            <button class="yuemu-modal-close-btn" style="position:relative; width:30px; height:30px; top:0; right:0" @click="showChatModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="yuemu-chat-room-body" style="height: 50vh; overflow-y: auto;">
            <PictureChatRoom
              ref="chatRoomRef"
              :pictureId="picture.id || props.id"
              @message="handleChatMessage"
              class="yuemu-modal-chat-room"
            />
          </div>
        </div>
      </div>
      <Teleport to="body">
        <div v-if="showMoreModal" class="yuemu-custom-dropdown-overlay" @click="showMoreModal = false">
          <div class="yuemu-custom-dropdown-content" @click.stop>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="yuemu-dropdown-item" @click="goToAnalytics"><i class="fas fa-chart-bar"></i>{{ t('components.pictureDetailView.dataAnalysis') }}</div>
            <div class="yuemu-dropdown-item" @click="openChatModal"><i class="fas fa-comments"></i>{{ t('components.pictureDetailView.chatRoom') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="yuemu-dropdown-item" @click="openPermissionSetting"><i class="fas fa-cog"></i>{{ t('components.pictureDetailView.permissionSettings') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id) && !hasCopyright" class="yuemu-dropdown-item" @click="goToCopyrightRegister"><i class="fas fa-copyright"></i>{{ t('components.pictureDetailView.copyrightRegistration') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id) && hasCopyright" class="yuemu-dropdown-item" @click="goToEditCopyright"><i class="fas fa-shield-alt"></i>{{ t('components.pictureDetailView.editCopyright') }}</div>
            <div class="yuemu-dropdown-item" @click="goToCopyrightTrace"><i class="fas fa-search"></i>{{ t('components.pictureDetailView.pictureTrace') }}</div>
            <div class="yuemu-dropdown-item" @click="openReportModal"><i class="fas fa-flag"></i>{{ t('components.pictureDetailView.report') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="yuemu-dropdown-item" @click="doEdit"><i class="fas fa-edit"></i>{{ t('components.pictureDetailView.editProfile') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="yuemu-dropdown-item yuemu-danger" @click="showDeleteConfirm"><i class="fas fa-trash-alt"></i>{{ t('components.pictureDetailView.deletePicture') }}</div>
            <div v-if="picture.isDownload !== 0" class="yuemu-dropdown-item" @click="handleDownload"><i class="fas fa-download"></i>{{ t('components.pictureDetailView.savePicture') }}</div>
          </div>
        </div>
      </Teleport>
      <div v-if="deleteConfirmVisible" class="yuemu-custom-confirm-overlay">
        <div class="yuemu-confirm-box">
          <h3>{{ t('components.pictureDetailView.prompt') }}</h3>
          <p>{{ t('components.pictureDetailView.confirmDeletePicture') }}</p>
          <div class="yuemu-confirm-actions">
            <button class="yuemu-btn-cancel" @click="deleteConfirmVisible = false">{{ t('components.pictureDetailView.cancel') }}</button>
            <button class="yuemu-btn-danger" @click="confirmDelete">{{ t('components.pictureDetailView.confirmDelete') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
  <ImagePreview
    v-if="picture.url"
    :images="[picture.url]"
    v-model:visible="showPreview"
    @close="showPreview = false"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();


import { ref, computed, onMounted, nextTick, onUnmounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { downloadImage, toHexColor } from '@/utils'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import ShareModal from '@/components/ShareModal.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import { getDefaultAvatar } from '@/utils/userUtils'
import { deletePictureUsingPost, getPictureVoByIdUsingGet, searchPictureByPictureUsingPost } from '@/api/pictureController'
import { addUserFollowsUsingPost, findIsFollowUsingPost } from '@/api/userFollowsController'
import { message } from 'ant-design-vue'
import CommentList from '@/components/CommentList.vue'
import { addCommentUsingPost, queryCommentUsingPost } from '@/api/commentsController'
import { doLikeUsingPost } from '@/api/likeRecordController'
import { throttle } from 'lodash-es'
import { doShareUsingPost } from '@/api/shareRecordController'
import { addFavoriteRecordUsingPost, cancelFavoriteUsingPost } from '@/api/favoriteRecordController'
import { formatTime } from '@/utils/dateUtils'
import ReportModal from '@/components/ReportModal.vue'
import { getCopyrightByPictureIdUsingGet } from '@/api/pictureCopyrightController.ts'
import PictureChatRoom from '@/components/PictureChatRoom.vue'
import ContentPermissionSetting from '@/components/ContentPermissionSetting.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import BigPictureList from '@/components/BigPictureList.vue'
import GuessLikePictureList from '@/components/GuessLikePictureList.vue'
import GlobalAdBanner from '@/components/GlobalAdBanner.vue'
import { useStructuredData, buildImageObject, buildBreadcrumbList } from '@/composables/useStructuredData'

interface Props {
  id: string | number
  visible?: boolean
  initialData?: API.PictureVO
}
const props = withDefaults(defineProps<Props>(), {
  visible: true,
})
const emit = defineEmits(['close', 'updated'])
// FLIP 飞入飞出动效 Ref 与逻辑声明
const mainImageRef = ref<HTMLImageElement | null>(null)
const originImageEl = ref<HTMLImageElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)
const getOriginImageEl = () => {
  const container = document.querySelector(`[data-pic-id="${picture.value?.id || props.id}"]`)
  if (!container) return null
  return (container.querySelector('.yuemu-j-image, .yuemu-masonry-image') || container.querySelector('img:not(.yuemu-user-avatar)')) as HTMLImageElement
}
const startEnterAnimation = () => {
  const el = overlayRef.value
  if (!el) return
  const originEl = getOriginImageEl()
  const container = el.querySelector('.yuemu-modal-container') as HTMLElement
  const mainImageEl = (mainImageRef.value || el.querySelector('.yuemu-main-image')) as HTMLImageElement
  el.style.backgroundColor = 'rgba(0, 0, 0, 0)'
  if (!originEl || !mainImageEl) {
    if (container) {
      container.style.opacity = '0'
      container.style.transform = 'scale(0.95)'
      container.offsetHeight // force reflow
      container.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      container.style.opacity = '1'
      container.style.transform = 'none'
    }
    el.style.transition = 'background-color 0.3s ease'
    el.style.backgroundColor = 'rgba(0, 0, 0, 0.65)'
    return
  }
  originImageEl.value = originEl
  originEl.style.visibility = 'hidden'
  const firstRect = originEl.getBoundingClientRect()
  nextTick(() => {
    const finalImageEl = (mainImageRef.value || el.querySelector('.yuemu-main-image')) as HTMLImageElement
    if (!finalImageEl) return
    const lastRect = finalImageEl.getBoundingClientRect()
    const lastWidth = lastRect.width || window.innerWidth * 0.5
    const lastHeight = lastRect.height || window.innerHeight * 0.5
    const scaleX = firstRect.width / lastWidth
    const scaleY = firstRect.height / lastHeight
    const translateX = firstRect.left - lastRect.left
    const translateY = firstRect.top - lastRect.top
    finalImageEl.style.transformOrigin = 'top left'
    finalImageEl.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`
    finalImageEl.style.transition = 'none'
    finalImageEl.style.opacity = '1'
    const computedRadius = Math.min(24, 8 / Math.max(scaleX, 0.05))
    finalImageEl.style.borderRadius = `${computedRadius}px`
    const detailsSection = el.querySelector('.yuemu-details-section') as HTMLElement
    const closeBtn = el.querySelector('.yuemu-modal-close-btn') as HTMLElement
    const previewSection = el.querySelector('.yuemu-preview-section') as HTMLElement
    if (detailsSection) {
      detailsSection.style.opacity = '0'
      detailsSection.style.transform = 'translateY(25px)'
      detailsSection.style.borderRadius = isMobile.value ? '0 0 20px 20px' : '0 20px 20px 0'
    }
    if (closeBtn) { closeBtn.style.opacity = '0'; closeBtn.style.transition = 'opacity 0.25s ease' }
    if (previewSection) {
      // 保持原有背景并赋予专属的左侧圆角，避免 container 结界解除时圆角消失
      previewSection.style.borderRadius = isMobile.value ? '20px 20px 0 0' : '20px 0 0 20px'
      previewSection.style.overflow = 'visible' // 彻底解除 CSS 结界，保飞行自由
      previewSection.style.backgroundColor = 'transparent' // 初始设为透明，为底色渐显做准备
    }
    if (container) {
      container.style.transition = 'none'
      container.style.overflow = 'visible'
      container.style.background = 'transparent'
      container.style.boxShadow = 'none'
    }
    finalImageEl.offsetHeight // trigger reflow
    requestAnimationFrame(() => {
      const easeCurve = 'cubic-bezier(0.16, 1, 0.3, 1)'
      finalImageEl.style.transition = `transform 0.45s ${easeCurve}, border-radius 0.45s ${easeCurve}`
      finalImageEl.style.transform = 'none'
      finalImageEl.style.borderRadius = '0px'
      el.style.transition = 'background-color 0.4s ease'
      el.style.backgroundColor = 'rgba(0, 0, 0, 0.65)'
      if (detailsSection) {
        detailsSection.style.transition = `opacity 0.4s ease, transform 0.45s ${easeCurve}`
        detailsSection.style.opacity = '1'
        detailsSection.style.transform = 'translateY(0)'
        detailsSection.style.backgroundColor = 'var(--card-background)'
      }
      if (closeBtn) closeBtn.style.opacity = '1'
      if (previewSection) {
        previewSection.style.transition = 'background-color 0.4s ease'
        previewSection.style.backgroundColor = 'var(--card-background)' // 平滑浮现左半区实心底板！
      }
      // 删除了 previewSection 的透明恢复逻辑，因为它全程保持原有状态
      if (container) {
        container.style.transition = 'none'
        setTimeout(() => {
          container.style.background = ''
          container.style.boxShadow = ''
          container.style.overflow = 'hidden'
          if (detailsSection) {
            detailsSection.style.backgroundColor = ''
            detailsSection.style.borderRadius = ''
          }
          if (previewSection) {
            previewSection.style.overflow = ''
            previewSection.style.borderRadius = ''
            previewSection.style.transition = ''
            previewSection.style.backgroundColor = '' // 圆满交接给 container
          }
          isAnimating.value = false
        }, 450)
      }
    })
  })
}
const isClosing = ref(false)
const handleClose = () => {
  if (isClosing.value) return
  isClosing.value = true
  // 退场伊始，必须无条件释放背景滚动拦截，防止生命周期滞留引发死锁
  window.removeEventListener('wheel', preventScroll)
  window.removeEventListener('touchmove', preventScroll)
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
  const el = overlayRef.value
  if (!el) {
    emit('close')
    return
  }
  const originEl = getOriginImageEl()
  if (originEl) {
    originEl.style.visibility = 'visible'
  }
  const detailsSection = el.querySelector('.yuemu-details-section') as HTMLElement
  const closeBtn = el.querySelector('.yuemu-modal-close-btn') as HTMLElement
  const container = el.querySelector('.yuemu-modal-container') as HTMLElement
  const mainImageEl = (mainImageRef.value || el.querySelector('.yuemu-main-image')) as HTMLImageElement
  const previewSection = el.querySelector('.yuemu-preview-section') as HTMLElement
  // 第一步：极速抹除周边所有干扰元素，让大图成为唯一主体
  if (detailsSection) {
    detailsSection.style.transition = 'opacity 0.15s ease, transform 0.15s ease'
    detailsSection.style.opacity = '0'
    detailsSection.style.transform = 'translateY(10px)'
  }
  if (closeBtn) { closeBtn.style.transition = 'opacity 0.15s ease'; closeBtn.style.opacity = '0' }
  if (previewSection) {
    // 退场时同样赋予专属的左侧圆角
    previewSection.style.borderRadius = isMobile.value ? '20px 20px 0 0' : '20px 0 0 20px'
    // 必须隐去上一步我们加上的实心底板，否则会像大白块一样挡住下面的瀑布流
    previewSection.style.transition = 'background-color 0.15s ease'
    previewSection.style.backgroundColor = 'transparent'
  }
  if (!originEl || !mainImageEl) {
    if (container) {
      container.style.transition = 'none'
      container.style.background = 'transparent'
      container.style.boxShadow = 'none'
    }
    el.style.transition = 'background-color 0.25s ease'
    el.style.backgroundColor = 'rgba(0, 0, 0, 0)'
    setTimeout(() => {
      if (el) el.style.display = 'none'
      emit('close')
    }, 250)
    return
  }
  const firstRect = originEl.getBoundingClientRect()
  const lastRect = mainImageEl.getBoundingClientRect()
  // 第二步：等待 150ms 剥离周边后，纯粹的主图再飞跃回源点
  setTimeout(() => {
    el.style.zIndex = '90'
    mainImageEl.style.position = 'fixed'
    mainImageEl.style.margin = '0'
    mainImageEl.style.top = `${lastRect.top}px`
    mainImageEl.style.left = `${lastRect.left}px`
    mainImageEl.style.width = `${lastRect.width}px`
    mainImageEl.style.height = `${lastRect.height}px`
    mainImageEl.style.objectFit = 'cover'
    mainImageEl.style.zIndex = '90'
    mainImageEl.style.transform = 'none'
    mainImageEl.style.transition = 'none'
    mainImageEl.style.borderRadius = '4px'
    const easeCurve = 'cubic-bezier(0.2, 0.9, 0.2, 1)'
    // 大图起飞时，全屏黑幕使用与图片绝对一致的阻尼曲线消散，绝不残留多余拖尾
    el.style.transition = `background-color 0.4s ${easeCurve}`
    el.style.backgroundColor = 'rgba(0, 0, 0, 0)'
    // 开放结界，同时让包含一切的大卡片底座（保有其完美圆角）整体下沉透明化！
    if (container) {
      container.style.overflow = 'visible'
      container.style.transition = 'none'
      container.style.background = 'transparent'
      container.style.boxShadow = 'none'
    }
    if (previewSection) {
      previewSection.style.overflow = 'visible'
    }
    mainImageEl.offsetHeight // 强制重绘
    requestAnimationFrame(() => {
      mainImageEl.style.transition = `all 0.4s ${easeCurve}`
      mainImageEl.style.top = `${firstRect.top}px`
      mainImageEl.style.left = `${firstRect.left}px`
      mainImageEl.style.width = `${firstRect.width}px`
      mainImageEl.style.height = `${firstRect.height}px`
      mainImageEl.style.borderRadius = '16px'
      setTimeout(() => {
        if (el) el.style.display = 'none'
        emit('close')
      }, 400)
    })
  }, 150)
}
// 已改用原生的进退场方法，摒弃 innerVisible
const loginUserStore = useLoginUserStore()
const router = useRouter()
const isMobile = ref(false)
const imgReady = ref(false)
const picture = ref<API.PictureVO>(props.initialData ? { ...props.initialData } : ({} as API.PictureVO))
const comments = ref<API.CommentsVO[]>([])
const commentloading = ref(true)
const isEndOfData = ref(false)
const isFollowed = ref(false)
const showMoreModal = ref(false)
const deleteConfirmVisible = ref(false)
const showPreview = ref(false)
const hasCopyright = ref(false)
const copyrightInfo = ref<API.CopyrightInfoVO | null>(null)
const showChatModal = ref(false)
const showPermissionSetting = ref(false)
const showEmojiPicker = ref(false)
const onlineCount = ref(0)
const onlineUsers = ref<any[]>([])
const isInputFocused = ref(false)
const shareModalRef = ref()
const reportModalRef = ref()
const scrollContainer = ref<HTMLElement | null>(null)
const dominantColor = computed(() => picture.value?.picColor ? toHexColor(picture.value.picColor) : '#f0f0f0')
const shareLink = computed(() => {
  if (!picture.value?.id) return ''
  return `${window.location.origin}/picture/${picture.value.id}`
})
const isAnimating = ref(true)
const showImagePreview = () => {
  if (isAnimating.value || isClosing.value) return
  showPreview.value = true
}
const handlePreviewChange = (visible: boolean) => {
  showPreview.value = visible
}
const queryRequest = reactive<API.CommentsQueryRequest>({
  targetId: String(props.id),
  targetType: 1,
  current: 1,
  pageSize: 20
})
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.yuemu-emoji-float-layer') && !target.closest('.yuemu-emoji-trigger-btn')) {
    showEmojiPicker.value = false
  }
  if (replyCommentId.value && !target.closest('.yuemu-action-footer') && !target.closest('.reply-btn')) {
    cancelReply()
  }
}
onMounted(async () => {
  if (props.initialData) {
    picture.value = props.initialData
    onlineCount.value = props.initialData.chatCount || 0
  }
  await nextTick()
  startEnterAnimation()
  const device = await getDeviceType()
  isMobile.value = device === DEVICE_TYPE_ENUM.MOBILE || window.innerWidth < 768
  await fetchPictureDetail()
  queryComments()
  checkIsFollowed()
  loadCopyrightInfo()
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
  // 零排版副作用滚动锁定：通过原生事件劫持，允许内部滚动区正常工作，彻底封死其余区域穿透。
  window.addEventListener('wheel', preventScroll, { passive: false })
  window.addEventListener('touchmove', preventScroll, { passive: false })
  nextTick(() => {
    const detailsInner = document.querySelector('.yuemu-details-inner')
    if (detailsInner) {
      scrollContainer.value = detailsInner as HTMLElement
      detailsInner.addEventListener('scroll', handleScroll)
    }
    setupGuessLikeObserver()
  })
})
watch(() => router.currentRoute.value.fullPath, (newPath, oldPath) => {
  if (newPath !== oldPath && props.visible) {
    handleClose()
  }
})
onUnmounted(() => {
  if (originImageEl.value) {
    originImageEl.value.style.visibility = 'visible'
  }
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('wheel', preventScroll)
  window.removeEventListener('touchmove', preventScroll)
  const detailsInner = document.querySelector('.yuemu-details-inner')
  if (detailsInner) {
    detailsInner.removeEventListener('scroll', handleScroll)
  }
})
const preventScroll = (e: Event) => {
  const detailsInner = document.querySelector('.yuemu-details-inner')
  const previewSection = document.querySelector('.yuemu-preview-section')
  if (detailsInner && detailsInner.contains(e.target as Node)) {
    return
  }
  if (previewSection && previewSection.contains(e.target as Node)) {
    return
  }
  e.preventDefault()
}
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') handleClose()
}
const fetchPictureDetail = async () => {
  try {
    if (props.initialData) {
      picture.value = props.initialData
      onlineCount.value = props.initialData.chatCount || 0
    }
    const res = await getPictureVoByIdUsingGet({ id: props.id })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      onlineCount.value = res.data.data.chatCount || 0
    }
  } catch (e) {}
}
let isQueryingComments = false
const queryComments = async () => {
  if (isQueryingComments) return
  isQueryingComments = true
  commentloading.value = true
  try {
    const res = await queryCommentUsingPost(queryRequest)
    if (res.data?.code === 0 && res.data.data) {
      const records = res.data.data.records || []
      if (queryRequest.current === 1) {
        comments.value = records
      } else {
        comments.value = [...comments.value, ...records]
      }
      isEndOfData.value = records.length < queryRequest.pageSize
    }
  } finally {
    commentloading.value = false
    isQueryingComments = false
  }
}
const handleScroll = throttle(() => {
  const el = scrollContainer.value
  if (!el) return
  const scrollTop = el.scrollTop
  const scrollHeight = el.scrollHeight
  const clientHeight = el.clientHeight
  if (scrollHeight - scrollTop - clientHeight < 150) {
    if (!isEndOfData.value && !commentloading.value) {
      queryRequest.current++
      queryComments()
    }
  }
}, 200)
// bottom handleClose removed
const handleImageLoad = () =>{
  imgReady.value = true
  if (mainImageRef.value) {
    mainImageRef.value.style.opacity = '1'
  }
}
const handleUserClick = (user: any) => {
  if (!user?.id) return
  handleClose()
  router.push({ name: 'UserDetail', params: { id: user.id } })
}
const checkIsFollowed = async () => {
  if (!loginUserStore.loginUser?.id || !picture.value?.user?.id) return
  try {
    const res = await findIsFollowUsingPost({
      followerId: loginUserStore.loginUser.id,
      followingId: picture.value.user.id
    })
    isFollowed.value = !!res.data?.data
  } catch (e) {}
}
const handleFollow = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('components.pictureDetailView.pleaseLoginFirst'))
  try {
    const res = await addUserFollowsUsingPost({
      followerId: loginUserStore.loginUser.id,
      followingId: picture.value.user.id,
      followStatus: isFollowed.value ? 0 : 1
    })
    if (res.data.code === 0) {
      isFollowed.value = !isFollowed.value
      message.success(isFollowed.value ? t('components.pictureDetailView.followed') : t('components.pictureDetailView.unfollowed'))
    }
  } catch (e) {}
}
const doLike = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('components.pictureDetailView.pleaseLoginFirst'))
  const newStatus = picture.value.isLiked === 1 ? false : true
  try {
    const res = await doLikeUsingPost({
      targetId: picture.value?.id || props.id,
      targetType: 1,
      isLiked: newStatus
    })
    if (res.data.code === 0) {
      picture.value.isLiked = newStatus ? 1 : 0
      picture.value.likeCount = String(Number(picture.value.likeCount || 0) + (newStatus ? 1 : -1))
    }
  } catch (e) {}
}
const doFavorite = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('components.pictureDetailView.pleaseLoginFirst'))
  const isFavorited = picture.value.isFavorited === 1
  try {
    let res;
    if (isFavorited) {
      res = await cancelFavoriteUsingPost({
        userId: loginUserStore.loginUser.id,
        targetId: picture.value?.id || props.id,
        targetType: 1
      })
    } else {
      res = await addFavoriteRecordUsingPost({
        userId: loginUserStore.loginUser.id,
        targetId: picture.value?.id || props.id,
        targetType: 1,
        targetUserId: picture.value.user?.id,
        isFavorite: true
      })
    }
    if (res.data.code === 0) {
      picture.value.isFavorited = isFavorited ? 0 : 1
      picture.value.favoriteCount = String(Number(picture.value.favoriteCount || 0) + (isFavorited ? -1 : 1))
      message.success(isFavorited ? t('components.pictureDetailView.unfavorited') : t('components.pictureDetailView.favoriteSuccess'))
    }
  } catch (e) {}
}
const commentContent = ref('')
const isAddingComment = ref(false)
const replyCommentId = ref('')
const replyTargetUserName = ref('')
const handleReplyClick = (commentId: string, userName: string) => {
  replyCommentId.value = commentId
  replyTargetUserName.value = userName
  nextTick(() => {
    const inputEl = document.querySelector('#modalCommentInput') as HTMLElement
    inputEl?.focus()
  })
}
const cancelReply = () => {
  replyCommentId.value = ''
  replyTargetUserName.value = ''
}
const handleInputBlur = (e: FocusEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (relatedTarget && (
    relatedTarget.closest('.yuemu-emoji-picker-wrapper') ||
    relatedTarget.closest('.yuemu-custom-emoji-picker')
  )) {
    return;
  }
  isInputFocused.value = false
  showEmojiPicker.value = false
  if (!commentContent.value.trim()) {
    cancelReply()
  }
}
const findComment = (list: any[], id: string): any => {
  for (const c of list) {
    if (c.commentId === id) return c;
    if (c.children && c.children.length > 0) {
      const found = findComment(c.children, id);
      if (found) return found;
    }
  }
  return null;
}
const removeOptimisticComment = (id: string) => {
  comments.value = comments.value.filter(c => c.commentId !== id)
  const removeFromChildren = (list: any[]) => {
    for (const c of list) {
      if (c.children) {
        c.children = c.children.filter((child: any) => child.commentId !== id)
        removeFromChildren(c.children)
      }
    }
  }
  removeFromChildren(comments.value)
}
const addComment = async () => {
  if (!commentContent.value.trim() || isAddingComment.value) return
  isAddingComment.value = true
  const content = commentContent.value.trim()
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
      userAvatar: loginUserStore.loginUser?.userAvatar,
    },
    isOptimistic: true,
    children: [] // 加入 children 数组，防止子组件取不到报错
  }
  // 1. 将假数据装填到本地数组中展示
  if (parentId !== '0') {
    const parent = findComment(comments.value, parentId);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.unshift({ ...optimisticComment, parentId, targetUser: { userName: targetUserName } });
    }
  } else {
    comments.value.unshift(optimisticComment as any);
  }
  // 2. 清空输入框和恢复状态
  commentContent.value = ''
  cancelReply()
  showEmojiPicker.value = false
  // 3. 提交至后端并进行局部更新（不再刷新全局列表）
  try {
    const res = await addCommentUsingPost({
      targetId: picture.value?.id || props.id,
      targetType: 1,
      content: content,
      parentCommentId: parentId
    })
    if (res.data.code === 0) {
      // 数量 + 1
      picture.value.commentCount = String(Number(picture.value.commentCount || 0) + 1)
      // 找到刚刚创建的假数据，替换为后端返回的真实 ID 和时间
      const tempComment = findComment(comments.value, tempId)
      if (tempComment) {
        const realId = res.data.data
        tempComment.commentId = realId ? String(realId) : `real-${Date.now()}`
        // 如果后端有返回其他字段可以补充，目前主要更新 ID 和状态
        tempComment.isOptimistic = false
      }
    } else {
      removeOptimisticComment(tempId)
      commentContent.value = content
      message.error(res.data.message || t('components.pictureDetailView.commentFailedMsg'))
    }
  } catch (e) {
    removeOptimisticComment(tempId)
    commentContent.value = content
    message.error(t('components.pictureDetailView.commentFailed'))
  } finally {
    isAddingComment.value = false
  }
}
const handleShowMoreModal = () => showMoreModal.value = true
const openReportModal = () => { reportModalRef.value?.openModal(); showMoreModal.value = false; }
const openChatModal = () => {
  if (loginUserStore.loginUser) { showChatModal.value = true; showMoreModal.value = false; }
  else message.warning(t('components.pictureDetailView.pleaseLogin'))
}
const handleChatMessage = (msg: any) => {
  if (msg.type === 'onlineUsers') { onlineCount.value = msg.onlineCount; onlineUsers.value = msg.onlineUsers; }
}
const openPermissionSetting = () => { showPermissionSetting.value = true; showMoreModal.value = false; }
const handlePermissionsUpdated = (newPermissions: any) => {
  picture.value.allowLike = newPermissions.allowLike
  picture.value.allowComment = newPermissions.allowComment
  picture.value.allowCollect = newPermissions.allowCollect
  picture.value.allowShare = newPermissions.allowShare
  showPermissionSetting.value = false
}
const handleDownload = () => { downloadImage(picture.value.url, picture.value.name); showMoreModal.value = false; }
const doEdit = () => {
  showMoreModal.value = false
  router.push({ name: 'AddPicture', query: { id: picture.value.id, spaceId: picture.value.spaceId } })
    .then(() => handleClose())
}
const goToCopyrightRegister = () => {
  showMoreModal.value = false
  router.push({ name: 'CopyrightRegister', query: { pictureId: String() } })
}
const goToEditCopyright = () => {
  showMoreModal.value = false
  router.push({ name: 'CopyrightRegister', query: { pictureId: String(), edit: 'true' } })
}
const goToCopyrightTrace = () => {
  showMoreModal.value = false
  router.push({ name: 'CopyrightTrace', query: copyrightInfo.value?.copyrightCode ? { code: copyrightInfo.value.copyrightCode } : {} })
}
const goToAnalytics = () => {
  const targetId = picture.value?.id || props.id
  if (!targetId) return message.warning(t('components.pictureDetailView.cannotGetWorkId'))
  showMoreModal.value = false
  router.push({ name: 'ItemAnalytics', params: { type: 'picture', id: targetId } })
}
const loadCopyrightInfo = async () => {
  if (!picture.value?.id) return
  try {
    const res = await getCopyrightByPictureIdUsingGet({ pictureId: String(picture.value.id) })
    if (res.data.code === 0 && res.data.data) {
      copyrightInfo.value = res.data.data
      hasCopyright.value = true
    }
  } catch (error) {}
}
const showDeleteConfirm = () => deleteConfirmVisible.value = true
const confirmDelete = async () => {
  const res = await deletePictureUsingPost({ id: picture.value.id })
  if (res.data.code === 0) { message.success(t('components.pictureDetailView.deleteSuccess')); handleClose(); }
}
const doShare = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('components.pictureDetailView.pleaseLoginFirst'))
  if (picture.value.allowShare === 0) return message.warning(t('components.pictureDetailView.authorDisabledShare'))
  // 分享功能改为一直可分享（无取消逻辑）
  try {
    const res = await doShareUsingPost({ targetId: picture.value.id, targetType: 1, isShared: true })
    if (res.data?.code === 0) {
      if (picture.value.isShared !== 1) {
        picture.value.isShared = 1
        picture.value.shareCount = String(Number(picture.value.shareCount || 0) + 1)
      }
    }
    shareModalRef.value?.openModal(picture.value.url || '')
  } catch (e) {
    shareModalRef.value?.openModal(picture.value.url || '')
  }
}
const guessLikeList = ref<any[]>([])
const guessLikeLoading = ref(false)
const guessLikeCurrentPage = ref(1)
const guessLikeHasMore = ref(true)
const guessLikeBottomRef = ref<HTMLElement | null>(null)
let guessLikeObserver: IntersectionObserver | null = null
const showGuessLike = ref(false)
const triggerGuessLike = () => {
  if (showGuessLike.value) return
  showGuessLike.value = true
  if (guessLikeList.value.length === 0 && !guessLikeLoading.value) {
    fetchGuessLikeData(true)
  }
  nextTick(() => {
    const previewEl = overlayRef.value?.querySelector('.yuemu-preview-section')
    if (previewEl) {
      previewEl.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' })
    }
  })
}
let previewTouchStartY = 0
const handlePreviewWheel = (e: WheelEvent) => {
  if (!showGuessLike.value && e.deltaY > 30) {
    triggerGuessLike()
  }
}
const handlePreviewTouchStart = (e: TouchEvent) => {
  if (!showGuessLike.value) {
    previewTouchStartY = e.touches[0].clientY
  }
}
const handlePreviewTouchMove = (e: TouchEvent) => {
  if (!showGuessLike.value) {
    const deltaY = previewTouchStartY - e.touches[0].clientY
    if (deltaY > 50) {
      triggerGuessLike()
    }
  }
}
const fetchGuessLikeData = async (isRefresh = false) => {
  if (isRefresh) {
    guessLikeCurrentPage.value = 1
    guessLikeHasMore.value = true
    guessLikeList.value = []
  }
  if (!guessLikeHasMore.value) return
  guessLikeLoading.value = true
  try {
    const res = await searchPictureByPictureUsingPost({
      imageUrl: picture.value.url || undefined,
      pictureId: picture.value.id || undefined,
      spaceId: 0,
      current: guessLikeCurrentPage.value,
      pageSize: 30
    } as any)
    if (res.data.code === 0 && res.data.data) {
      let records = res.data.data.records || []
      // 过滤掉当前正在浏览的图片，避免自己推荐自己
      records = records.filter((p: any) => String(p.id) !== String(picture.value.id))
      if (res.data.data.records && res.data.data.records.length< 30) {
        guessLikeHasMore.value = false
      }
      if (isRefresh) {
        guessLikeList.value = records
      } else {
        guessLikeList.value = [...guessLikeList.value, ...records]
      }
    } else {
      guessLikeHasMore.value = false
    }
  } catch (error: any) {
    console.error(t('components.pictureDetailView.fetchRecommendationsFailed'), error)
  } finally {
    guessLikeLoading.value = false
  }
}
const setupGuessLikeObserver = () =>{
  if (guessLikeObserver) {
    guessLikeObserver.disconnect()
  }
  const previewEl = overlayRef.value?.querySelector('.yuemu-preview-section')
  guessLikeObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !guessLikeLoading.value && guessLikeHasMore.value && guessLikeList.value.length > 0) {
      guessLikeCurrentPage.value++
      fetchGuessLikeData(false)
    }
  }, {
    root: previewEl,
    rootMargin: '0px 0px 400px 0px'
  })
  if (guessLikeBottomRef.value) {
    guessLikeObserver.observe(guessLikeBottomRef.value)
  }
}
const handleLoadMoreGuessLike = () => {
  if (!guessLikeLoading.value && guessLikeHasMore.value) {
    guessLikeCurrentPage.value++
    fetchGuessLikeData(false)
  }
}
watch(guessLikeBottomRef, (newRef) => {
  if (newRef && guessLikeObserver) {
    guessLikeObserver.observe(newRef)
  }
})
const handleRefreshGuessLike = () => {
  fetchGuessLikeData(true)
}
const handleGuessLikeClick = async (newPicture: any) => {
  try {
    const previewEl = overlayRef.value?.querySelector('.yuemu-preview-section')
    if (previewEl) {
      previewEl.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // 1. 立即进入加载状态并隐藏旧数据，给予用户瞬时反馈
    imgReady.value = false
    picture.value.url = '' // 卸载旧图片
    comments.value = []
    queryRequest.current = 1
    queryRequest.targetId = String(newPicture.id)
    isEndOfData.value = false
    commentloading.value = true
    showGuessLike.value = false
    guessLikeList.value = []
    guessLikeCurrentPage.value = 1
    guessLikeHasMore.value = true
    // 2. 发起 API 请求
    const res = await getPictureVoByIdUsingGet({ id: newPicture.id })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      onlineCount.value = res.data.data.chatCount || 0
      // 数据已在 API 返回前初始化过，此处只需确认并拉取评论即可
      const url = new URL(window.location.href)
      if (url.pathname.includes('/picture/')) {
        url.pathname = `/picture/${picture.value.id}`
      }
      window.history.replaceState({}, '', url.toString())
      emit('updated', picture.value)
      queryComments()
    }
  } catch (error) {
    message.error(t('components.pictureDetailView.failedToLoadPictureDetails'))
  }
}
import { formatTextWithLinks } from '@/utils/textUtils'
const formattedIntroduction = computed(() => formatTextWithLinks(picture.value.introduction || t('components.pictureDetailView.noIntroduction')))
const toggleEmojiPicker = () => showEmojiPicker.value = !showEmojiPicker.value
const onEmojiSelect = (emoji: string) => {
  commentContent.value += emoji
  nextTick(() => {
    const inputEl = document.querySelector('#modalCommentInput') as HTMLInputElement
    if (inputEl) { inputEl.focus(); inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length); }
  })
}
const emojiI18n = {
  search: t('components.pictureDetailView.emojiSearch'),
  categories: {
    recent: t('components.pictureDetailView.emojiRecent'), smileys: t('components.pictureDetailView.emojiSmileys'), people: t('components.pictureDetailView.emojiPeople'), nature: t('components.pictureDetailView.emojiNature'), foods: t('components.pictureDetailView.emojiFoods'), activity: t('components.pictureDetailView.emojiActivity'), places: t('components.pictureDetailView.emojiPlaces'), objects: t('components.pictureDetailView.emojiObjects'), symbols: t('components.pictureDetailView.emojiSymbols'), flags: t('components.pictureDetailView.emojiFlags')
  }
}

// ── SEO: JSON-LD structured data ──
let structuredDataScript: HTMLScriptElement | null = null

watch([picture, () => picture.value?.id], () => {
  // remove previous script
  if (structuredDataScript?.parentNode) {
    structuredDataScript.parentNode.removeChild(structuredDataScript)
    structuredDataScript = null
  }
  if (!picture.value?.id) return

  const picUrl = picture.value.url || picture.value.thumbnailUrl || ''
  if (!picUrl) return

  const imageData = buildImageObject({
    url: picUrl.startsWith('http') ? picUrl : `https://www.yuemutuku.com${picUrl}`,
    name: picture.value.name || picture.value.introduction || 'Untitled',
    description: picture.value.introduction || '',
    author: picture.value.user?.userName || '',
    datePublished: picture.value.createTime || '',
    license: 'https://www.yuemutuku.com/privacy',
  })
  const breadcrumb = buildBreadcrumbList([
    { name: '首页', url: 'https://www.yuemutuku.com/' },
    { name: picture.value.name || '作品详情', url: window.location.href },
  ])

  structuredDataScript = injectStructuredData({
    '@context': 'https://schema.org',
    '@graph': [imageData, breadcrumb],
  })
})

onUnmounted(() => {
  if (structuredDataScript?.parentNode) {
    structuredDataScript.parentNode.removeChild(structuredDataScript)
  }
})

</script>
<style scoped>.yuemu-fade-enter-active, .yuemu-fade-leave-active {
  transition: background-color 0.35s ease;
}
.yuemu-fade-enter-from, .yuemu-fade-leave-to {
  background-color: rgba(0, 0, 0, 0) !important;
}
.yuemu-picture-modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  overflow: hidden;
}
.yuemu-modal-container {
  width: 94vw; height: 94vh; max-width: 1300px;
  background: var(--card-background); border-radius: 20px;
  overflow: hidden; box-shadow: 0 100px 100px -20px rgba(0,0,0,0.5);
  display: flex; position: relative; z-index: 999; opacity: 0.98;
}
.yuemu-modal-container.yuemu-is-mobile { width: 100vw; height: 100vh; border-radius: 0; flex-direction: column; }
.yuemu-modal-close-btn {
  position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 999;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); font-size: 18px;
}
.yuemu-modal-close-btn:hover { background: rgba(0, 0, 0, 0.7); transform: rotate(90deg) scale(1.1); }
.yuemu-modal-content-wrapper { display: flex; width: 100%; height: 100%; }
.yuemu-preview-section {
  flex: 7; position: relative; overflow-y: auto; overflow-x: hidden; display: flex;
  flex-direction: column; align-items: center; background: var(--hover-background);
  scroll-behavior: smooth; overscroll-behavior: contain;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.yuemu-preview-section::-webkit-scrollbar { display: none; width: 0; height: 0; }

.yuemu-image-container {
  width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; flex-shrink: 0; padding: 40px 0; box-sizing: border-box;
}
.yuemu-explore-hint {
  position: absolute;
  bottom: 30px;
  display: flex;
  justify-content: center;
  width: 100%;
}
.yuemu-explore-btn {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 10px 24px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.yuemu-explore-btn:hover {
  background: var(--card-background);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.yuemu-sponsor-ad-wrapper {
  width: 100%;
  box-sizing: border-box;
}
.yuemu-sponsor-ad-box {
  position: relative;
  width: 100%;
  height: 160px;
  margin-bottom: 24px;
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
.yuemu-sponsor-ad-label i {
  margin-right: 6px;
}
.yuemu-scroll-down-hint {
  color: var(--text-secondary);
  font-size: 13px;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}
.yuemu-bounce {
  animation: yuemu-bounce 2s infinite;
}
@keyframes yuemu-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}
/* 猜你喜欢模块包裹器 */
.yuemu-guess-like-section {
  width: 100%;
  box-sizing: border-box;
  padding: 0 16px 40px;
}
/* 极简猜你喜欢头部 */
.yuemu-guess-like-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0 16px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}
.yuemu-guess-like-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.yuemu-guess-like-refresh {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}
.yuemu-guess-like-refresh:hover:not(:disabled) {
  background: var(--hover-background);
  color: var(--link-color);
}
.yuemu-guess-like-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.guess-like-bottom { text-align: center; padding: 30px 0; font-size: 14px; color: var(--text-secondary); }
.load-more-btn { display: inline-block; padding: 8px 16px; border-radius: 20px; background: var(--hover-background); cursor: pointer; transition: all 0.2s; }
.load-more-btn:hover { background: var(--border-color); color: var(--text-primary); }
.yuemu-main-image { max-width: 90%; max-height: 90%; object-fit: contain; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border-radius: 4px; cursor: zoom-in; z-index: 2; }
.yuemu-details-section { flex: 3; background: var(--card-background); display: flex; flex-direction: column; position: relative; border-left: 1px solid var(--border-color); overflow: hidden; }
.yuemu-details-header { flex-shrink: 0; padding: 24px; padding-bottom: 16px; background: var(--card-background); border-bottom: 1px solid var(--border-color); z-index: 2; }
.yuemu-details-inner { flex: 1; overflow-y: auto; padding: 24px; padding-bottom: 40px; overscroll-behavior: contain; }
.yuemu-details-inner::-webkit-scrollbar { width: 6px; }
.yuemu-details-inner::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
.yuemu-author-card { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.yuemu-author-info { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.yuemu-author-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; }
.yuemu-author-name { display: block; font-size: 15px; font-weight: 600; color: var(--post-title-color); }
.yuemu-publish-time { display: block; font-size: 12px; margin-top: 4px; color: var(--text-secondary); }
.yuemu-follow-btn-inline {
  padding: 4px 14px; border-radius: 15px; background: #3b82f6; color: #fff;
  border: none; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 8px; transition: all 0.2s;
}
.yuemu-follow-btn-inline.yuemu-followed { background: #f3f3f3; color: #666; }
.yuemu-name-row { display: flex; align-items: center; margin-bottom: 6px; }
.yuemu-description-card { margin-bottom: 24px; }
.yuemu-pic-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: var(--post-title-color); word-wrap: break-word; word-break: break-all; white-space: pre-wrap; line-height: 1.4; }
.yuemu-pic-intro { font-size: 15px; line-height: 1.6; color: var(--post-text-color); margin-bottom: 16px; }
.yuemu-tag-item { color: var(--link-color); font-size: 14px; margin-right: 8px; cursor: pointer; }
.yuemu-stats-bar { display: flex; gap: 16px; color: var(--text-secondary); font-size: 13px; margin-bottom: 16px; }
.yuemu-divider { height: 1px; background: var(--border-color); margin: 20px 0; }
.yuemu-comments-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.yuemu-comments-header h3 { font-size: 15px; font-weight: 600; margin: 0; }
.yuemu-guess-like-btn {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 16px;
  background: var(--hover-background); border: 1px solid var(--border-color); color: var(--text-primary);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;
}
.yuemu-guess-like-btn:hover {
  color: #3b82f6; border-color: #3b82f6; background: rgba(59, 130, 246, 0.05);
  transform: translateY(-1px); box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
}
.yuemu-action-footer { flex-shrink: 0; background: var(--card-background); border-top: 1px solid var(--border-color); padding: 12px 16px; z-index: 100; box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05); }
.yuemu-comment-input-container { position: relative; margin-bottom: 12px; }
.yuemu-input-bar-inner { display: flex; align-items: center; gap: 10px; }
.yuemu-my-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border-color); }
.yuemu-input-box {
  flex: 1; display: flex; align-items: center; background: var(--hover-background);
  border-radius: 20px; padding: 0 14px; height: 36px; border: 1px solid transparent; transition: all 0.2s ease; overflow: hidden;
}
.yuemu-input-box.yuemu-is-focused { border-color: var(--link-color); background: var(--card-background); }
.yuemu-inline-reply-prefix { display: flex; align-items: center; color: var(--link-color); font-size: 13px; font-weight: 500; white-space: nowrap; padding-right: 4px; cursor: pointer; }
.yuemu-inline-reply-prefix span { max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
.yuemu-input-box input { flex: 1; border: none; background: transparent; font-size: 13px; color: var(--text-primary); outline: none; height: 100%; min-width: 20px; }
.yuemu-emoji-trigger-btn { background: none; border: none; font-size: 18px; color: var(--text-secondary); cursor: pointer; padding: 0; display: flex; align-items: center; transition: color 0.2s; margin-left: 6px; }
.yuemu-send-btn { background: none; border: none; color: var(--text-secondary); font-weight: 600; font-size: 13px; padding: 0 0 0 10px; margin-left: 6px; border-left: 1px solid var(--border-color); transition: color 0.2s; }
.yuemu-send-btn.yuemu-active { color: var(--link-color); }
.yuemu-emoji-picker-wrapper {
  position: absolute; bottom: 100%; right: 0; margin-bottom: 12px; z-index: 200;
  background: var(--card-background, #ffffff); box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color);
}
.yuemu-footer-buttons { display: flex; justify-content: space-around; align-items: center; }
.yuemu-footer-btn-item { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); cursor: pointer; transition: color 0.2s; font-size: 16px; padding: 8px 12px; border-radius: 8px; }
.yuemu-footer-btn-item:hover { background: var(--hover-background); }
.yuemu-footer-btn-item.yuemu-like.yuemu-active { color: #ff4d4f; }
.yuemu-footer-btn-item.yuemu-favorite.yuemu-active { color: #ffca28; }
.yuemu-footer-btn-item.yuemu-active { color: var(--link-color); }
.yuemu-custom-dropdown-overlay { position: fixed; inset: 0; z-index: 999; }
.yuemu-custom-dropdown-content {
  position: absolute; right: 20px; bottom: 80px; background: var(--card-background); border-radius: 16px;
  box-shadow: 0 20px 50px var(--shadow-color); border: 1px solid var(--border-color); overflow: hidden; width: 180px; padding: 8px; transform-origin: bottom right; animation: yuemu-dropdownIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes yuemu-dropdownIn {
  from { opacity: 0; transform: scale(0.9) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.yuemu-dropdown-item { padding: 12px 14px; font-size: 14px; color: var(--post-text-color); cursor: pointer; display: flex; align-items: center; gap: 12px; border-radius: 10px; transition: all 0.2s; }
.yuemu-dropdown-item.yuemu-danger { color: #ef4444; }
.yuemu-end-of-data, .yuemu-loading-more { text-align: center; padding: 20px 0; color: var(--text-secondary); font-size: 13px; }
.yuemu-empty-comment-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; opacity: 0;
  animation: yuemu-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes yuemu-fade-up {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 0.8; transform: translateY(0); }
}
.yuemu-empty-comment-state img { width: 120px; margin-bottom: 16px; }
.yuemu-custom-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 999; display: flex; align-items: center; justify-content: center; }
.yuemu-confirm-box { background: var(--card-background); border-radius: 16px; padding: 24px; width: 300px; text-align: center; }
.yuemu-confirm-actions { display: flex; gap: 12px; }
.yuemu-btn-cancel { flex: 1; padding: 10px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--card-background); color: var(--text-primary); cursor: pointer; }
.yuemu-btn-danger { flex: 1; padding: 10px; border-radius: 20px; border: none; background: #fe2c55; color: #fff; cursor: pointer; }
.yuemu-modal-layer { position: absolute; z-index: 999; }
.yuemu-permission-setting-content, .yuemu-chat-room-content { background: var(--card-background); color: var(--text-primary); border-radius: 16px; width: 90vw; max-width: 500px; padding: 20px; max-height: 80vh; display: flex; flex-direction: column; }
.yuemu-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
@media (max-width: 768px) {
  .yuemu-modal-content-wrapper { flex-direction: column; }
  .yuemu-preview-section { flex: none; height: auto; min-height: 300px; padding: 20px 0; }
  .yuemu-details-section { flex: 1; border-left: none; }
}
.yuemu-simple-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-secondary, #999);
  font-size: 36px;
  z-index: 1;
  opacity: 0.6;
}
/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-explore-btn:active, .yuemu-explore-btn:hover,
  .yuemu-explore-btn:active *, .yuemu-explore-btn:hover *,
  .yuemu-footer-btn-item:active, .yuemu-footer-btn-item:hover,
  .yuemu-footer-btn-item:active *, .yuemu-footer-btn-item:hover *,
  .load-more-btn:active, .load-more-btn:hover,
  .load-more-btn:active *, .load-more-btn:hover *,
  .yuemu-modal-close-btn:active, .yuemu-modal-close-btn:hover,
  .yuemu-modal-close-btn:active *, .yuemu-modal-close-btn:hover *,
  .yuemu-guess-like-refresh:active, .yuemu-guess-like-refresh:hover,
  .yuemu-guess-like-refresh:active *, .yuemu-guess-like-refresh:hover *,
  .yuemu-guess-like-btn:active, .yuemu-guess-like-btn:hover,
  .yuemu-guess-like-btn:active *, .yuemu-guess-like-btn:hover * {
    transform: none !important;
  }
}</style>
