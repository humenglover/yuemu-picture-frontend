<template>
  <div class="picture-detail-page" :class="{ 'is-mobile': isMobile, 'is-loaded': pageReady }">

    <template v-if="pictureLoaded && picture.id">
      <div class="background-effects">
        <div
          class="color-blur-layer"
          :style="{
            background: `linear-gradient(135deg, ${dominantColor}, ${adjustColor(dominantColor, 20)}, var(--background))`,
            opacity: 0.3
          }"
        ></div>
        <div
          class="blurred-image-layer"
          :style="{ backgroundImage: picture.url ? `url(${picture.url})` : 'none' }"
        ></div>
      </div>
    </template>

    <div class="top-nav-bar">
      <button class="nav-btn" @click="handleBack" :title="$t('pages.pictureDetailPage.back')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="nav-actions" v-if="isMobile">
        <button class="nav-btn" @click="doShare" :title="$t('pages.pictureDetailPage.share')">
          <i class="fas fa-share-alt"></i>
        </button>
      </div>
    </div>

    <div class="content-layer">
      <div v-if="isDeleted" class="deleted-view">
        <div class="deleted-content">
          <i class="fas fa-trash-can"></i>
          <h2>{{ $t('pages.pictureDetailPage.deletedTitle') }}</h2>
          <p>{{ $t('pages.pictureDetailPage.deletedDesc') }}</p>
          <button class="btn-primary" @click="handleBack">{{ $t('pages.pictureDetailPage.backToPrev') }}</button>
        </div>
      </div>

      <div v-else class="layout-container">

        <div class="preview-section">
          <div v-if="!pictureLoaded" class="image-skeleton">
            <div class="shimmer"></div>
          </div>

          <div v-else class="image-wrapper" :class="{ 'ready': imgReady }">
            <img v-if="picture.url" :src="picture.url" class="bg-fill-blur" alt="" />
            <img
              v-if="picture.url"
              :src="picture.url"
              :alt="picture.name"
              class="main-image"
              @load="handleImageLoad"
              @click="showImagePreview"
            />
          </div>

          <div class="image-overlay-tools" v-if="!isMobile && imgReady">
            <div class="tool-item like" :class="{ active: picture.isLiked === 1 }" @click="doLike" :title="$t('pages.pictureDetailPage.like')">
              <i class="fas fa-heart"></i>
            </div>
            <div class="tool-item favorite" :class="{ active: picture.isFavorited === 1 }" @click="doFavorite" :title="$t('pages.pictureDetailPage.favorite')">
              <i class="fas fa-star"></i>
            </div>
          </div>
        </div>

        <div class="details-section">

          <div v-if="!pictureLoaded" class="info-skeleton">
            <div class="skeleton-header"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>

          <template v-else>
            <div class="author-fixed-header">
              <div class="author-info" @click="handleUserClick(picture.user)">
                <img :src="picture.user?.userAvatar || getDefaultAvatar(picture.user?.userName)" class="author-avatar" alt="" />
                <span class="author-name">{{ picture.user?.userName || $t('pages.pictureDetailPage.anonymous') }}</span>
              </div>
              <button
                v-if="picture.user?.id !== loginUserStore.loginUser?.id"
                class="follow-btn-inline"
                :class="{ 'followed': isFollowed }"
                @click.stop="handleFollow"
              >
                {{ isFollowed ? $t('pages.pictureDetailPage.followed') : $t('pages.pictureDetailPage.follow') }}
              </button>
            </div>

            <div class="scrollable-content" ref="scrollContainer" @scroll="handleScroll">
              <div class="post-content-area">
                <h1 class="pic-title">{{ picture.name || $t('pages.pictureDetailPage.untitled') }}</h1>

                <div class="pic-intro-wrapper" v-if="picture.introduction">
                  <div class="pic-intro" :class="{ 'is-collapsed': !isIntroExpanded }" v-html="formattedIntroduction"></div>
                  <button v-if="isLongIntro" class="expand-btn" @click="isIntroExpanded = !isIntroExpanded">
                    {{ isIntroExpanded ? $t('pages.pictureDetailPage.collapse') : $t('pages.pictureDetailPage.expand') }}
                  </button>
                </div>

                <div class="pic-tags" v-if="picture.tags?.length">
                  <span v-for="tag in picture.tags" :key="tag" class="tag-item">#{{ tag }}</span>
                </div>

                <div class="post-time-stats">
                  <span v-html="$t('pages.pictureDetailPage.publishInfo').replace('{time}', formatTime(picture.createTime)).replace('{views}', String(picture.viewCount || 0))"></span>
                </div>
              </div>

              <div class="divider"></div>

              <div class="comments-area">
                <div class="comments-count-title-wrapper">
                  <div class="comments-count-title">{{ $t('pages.pictureDetailPage.commentsCount', { count: picture.commentCount || 0 }) }}</div>
                  <button class="guess-like-btn" @click="doGuessLike">
                    <i class="fas fa-magic"></i>
                    <span>{{ $t('pages.pictureDetailPage.guessYouLike') }}</span>
                  </button>
                </div>

                <comment-list
                  v-if="comments.length"
                  :comments="comments"
                  @reply-clicked="handleReplyClick"
                  @update-comments="queryComments"
                />

                <div v-if="comments.length === 0 && !commentloading" class="empty-comment-state">
                  <img src="@/assets/illustrations/empty.png" :alt="$t('pages.pictureDetailPage.noCommentAlt')" />
                  <p>{{ $t('pages.pictureDetailPage.noCommentText') }}</p>
                </div>

                <div v-if="commentloading" class="loading-more">
                  <i class="fas fa-spinner fa-spin"></i> {{ $t('pages.pictureDetailPage.loading') }}
                </div>
                <div v-if="isEndOfData && comments.length > 0" class="end-of-data">
                  {{ $t('pages.pictureDetailPage.end') }}
                </div>
              </div>
            </div>

            <div class="action-footer-fixed">
              <div class="comment-input-container">
                <div v-if="replyCommentId" class="reply-hint">
                  <span>{{ $t('pages.pictureDetailPage.replyPrefix').replace('{user}', getReplyUserName()) }}</span>
                  <i class="fas fa-times" @click="cancelReply"></i>
                </div>
                <div class="input-box-wrapper">
                  <input
                    v-model="commentContent"
                    class="comment-input"
                    type="text"
                    :placeholder="picture.allowComment ? $t('pages.pictureDetailPage.addComment') : $t('pages.pictureDetailPage.commentClosed')"
                    :disabled="!picture.allowComment"
                    @keydown.enter="addComment"
                  />
                  <button class="emoji-btn" @click.stop="toggleEmojiPicker" @mousedown.prevent><i class="far fa-smile"></i></button>
                  <button class="send-btn" :disabled="!commentContent.trim() || isAddingComment" @click="addComment">{{ $t('pages.pictureDetailPage.send') }}</button>
                </div>

                <div v-if="showEmojiPicker" class="emoji-picker-wrapper" @mousedown.prevent>
                  <emoji-picker class="custom-emoji-picker" :i18n="emojiI18n" @select="onEmojiSelect" />
                </div>
              </div>

              <div class="footer-buttons">
                <div class="footer-btn-item like" :class="{ active: picture.isLiked === 1 }" @click="doLike">
                  <i class="fas fa-heart"></i> <span>{{ picture.likeCount || 0 }}</span>
                </div>
                <div class="footer-btn-item favorite" :class="{ active: picture.isFavorited === 1 }" @click="doFavorite">
                  <i class="fas fa-star"></i> <span>{{ picture.favoriteCount || 0 }}</span>
                </div>
                <div class="footer-btn-item" @click="doShare">
                  <i class="fas fa-share-alt"></i> <span>{{ picture.shareCount || 0 }}</span>
                </div>
                <div class="footer-btn-item more" @click="showMoreModal = true">
                  <i class="fas fa-ellipsis-h"></i>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="modal-layer">
      <Teleport to="body">
        <div v-if="showMoreModal" class="custom-dropdown-overlay" @click="showMoreModal = false">
          <div class="custom-dropdown-content" @click.stop>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="dropdown-item" @click="goToAnalytics"><i class="fas fa-chart-bar"></i> {{ $t('pages.pictureDetailPage.analytics') }}</div>
            <div class="dropdown-item" @click="openChatModal"><i class="fas fa-comments"></i> {{ $t('pages.pictureDetailPage.chatRoom') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="dropdown-item" @click="openPermissionSetting"><i class="fas fa-cog"></i> {{ $t('pages.pictureDetailPage.permissions') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id) && !hasCopyright" class="dropdown-item" @click="goToCopyrightRegister"><i class="fas fa-copyright"></i> {{ $t('pages.pictureDetailPage.copyrightReg') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id) && hasCopyright" class="dropdown-item" @click="goToEditCopyright"><i class="fas fa-shield-alt"></i> {{ $t('pages.pictureDetailPage.editCopyright') }}</div>
            <div class="dropdown-item" @click="goToCopyrightTrace"><i class="fas fa-search"></i> {{ $t('pages.pictureDetailPage.tracePic') }}</div>
            <div class="dropdown-item" @click="openReportModal"><i class="fas fa-flag"></i> {{ $t('pages.pictureDetailPage.report') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="dropdown-item" @click="doEdit"><i class="fas fa-edit"></i> {{ $t('pages.pictureDetailPage.editInfo') }}</div>
            <div v-if="picture.user?.id && String(picture.user.id) === String(loginUserStore.loginUser?.id)" class="dropdown-item danger" @click="showDeleteConfirm"><i class="fas fa-trash-alt"></i> {{ $t('pages.pictureDetailPage.deletePic') }}</div>
            <div v-if="picture.isDownload !== 0" class="dropdown-item" @click="handleDownload"><i class="fas fa-download"></i> {{ $t('pages.pictureDetailPage.savePic') }}</div>
          </div>
        </div>
      </Teleport>

      <ShareModal ref="shareModalRef" :link="shareLink" :imageUrl="picture.url" :title="picture.name" :user="picture.user" :createTime="picture.createTime" />
      <ReportModal ref="reportModalRef" :target-type="'1'" :target-id="String(picture.id)" />

      <div v-if="showChatModal" class="custom-confirm-overlay">
        <div class="chat-room-content" @click.stop>
          <div class="modal-header">
            <h3><span v-html="$t('pages.pictureDetailPage.chatRoomTitle', { count: onlineCount || 0 })"></span></h3>
            <button class="modal-close-btn" @click="showChatModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="chat-room-body" style="height: 50vh; overflow-y: auto;">
            <PictureChatRoom ref="chatRoomRef" :pictureId="props.id" @message="handleChatMessage" class="modal-chat-room" />
          </div>
        </div>
      </div>

      <div v-if="showPermissionSetting" class="custom-confirm-overlay">
        <div class="permission-setting-content" @click.stop>
          <div class="modal-header">
            <h3>{{ $t('pages.pictureDetailPage.permTitle') }}</h3>
            <button class="modal-close-btn" @click="showPermissionSetting = false"><i class="fas fa-times"></i></button>
          </div>
          <ContentPermissionSetting
            :pictureId="props.id"
            :initialPermissions="{ allowLike: picture.allowLike ? 1 : 0, allowComment: picture.allowComment ? 1 : 0, allowCollect: picture.allowCollect ? 1 : 0, allowShare: picture.allowShare ? 1 : 0 }"
            @permissions-updated="handlePermissionsUpdated"
          />
        </div>
      </div>

      <div v-if="deleteConfirmVisible" class="custom-confirm-overlay">
        <div class="confirm-box">
          <h3>{{ $t('pages.pictureDetailPage.hint') }}</h3>
          <p>{{ $t('pages.pictureDetailPage.confirmDelDesc') }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="deleteConfirmVisible = false">{{ $t('pages.pictureDetailPage.cancel') }}</button>
            <button class="btn-danger" @click="confirmDelete">{{ $t('pages.pictureDetailPage.confirmDelete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <a-image v-if="picture.url && !isMobile" :src="picture.url" :preview="{ visible: showPreview, onVisibleChange: handlePreviewChange }" style="display: none;" />
    <ImagePreview v-if="isMobile" v-model:visible="showPreview" :images="[picture.url]" :initialIndex="0" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, computed, onMounted, nextTick, onUnmounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { downloadImage, toHexColor } from '@/utils'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import ShareModal from '@/components/ShareModal.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import { getDefaultAvatar } from '@/utils/userUtils'
import { deletePictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController'
import { addUserFollowsUsingPost, findIsFollowUsingPost } from '@/api/userFollowsController'
import { message } from 'ant-design-vue'
import ImagePreview from '@/components/ImagePreview.vue'
import CommentList from '@/components/CommentList.vue'
import { addCommentUsingPost, queryCommentUsingPost } from '@/api/commentsController'
import { doLikeUsingPost } from '@/api/likeRecordController'
import { throttle } from 'lodash-es'
import { doShareUsingPost } from '@/api/shareRecordController'
import { addFavoriteRecordUsingPost, cancelFavoriteUsingPost } from '@/api/favoriteRecordController'
import { formatTime } from '@/utils/dateUtils'
import ReportModal from '@/components/ReportModal.vue'
import { getCopyrightByPictureIdUsingGet } from '@/api/pictureCopyrightController'
import PictureChatRoom from '@/components/PictureChatRoom.vue'
import ContentPermissionSetting from '@/components/ContentPermissionSetting.vue'

const { t } = useI18n();

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 状态
const isMobile = ref(false)
const pageReady = ref(false)
const pictureLoaded = ref(false)
const imgReady = ref(false)
const isDeleted = computed(() => pictureLoaded.value && (!picture.value || !picture.value.id))

const picture = ref<API.PictureVO>({} as API.PictureVO)
const comments = ref<API.CommentsVO[]>([])
const commentloading = ref(false)
const isEndOfData = ref(false)
const isFollowed = ref(false)

// 文本展开收起状态
const isIntroExpanded = ref(false)
const isLongIntro = computed(() => {
  const intro = picture.value.introduction || ''
  // 超过60个字符或者换行超过3行，就显示展开按钮
  return intro.length > 60 || intro.split('\n').length > 3
})

// 弹窗状态
const showPreview = ref(false)
const showMoreModal = ref(false)
const showChatModal = ref(false)
const showPermissionSetting = ref(false)
const deleteConfirmVisible = ref(false)
const showEmojiPicker = ref(false)
const hasCopyright = ref(false)
const copyrightInfo = ref<API.CopyrightInfoVO | null>(null)

const onlineCount = ref(0)
const scrollContainer = ref<HTMLElement | null>(null)
const shareModalRef = ref()
const reportModalRef = ref()

// 计算属性
const dominantColor = computed(() => picture.value?.picColor ? toHexColor(picture.value.picColor) : '#1a1a1a')
const shareLink = computed(() => picture.value?.id ? `${window.location.origin}/picture/${picture.value.id}` : '')
const formattedIntroduction = computed(() => (picture.value.introduction || '').replace(/\n/g, '<br/>'))

// 分页
const queryRequest = reactive<API.CommentsQueryRequest>({
  targetId: String(props.id),
  targetType: 1,
  current: 1,
  pageSize: 20
})

onMounted(async () => {
  const device = await getDeviceType()
  isMobile.value = device === DEVICE_TYPE_ENUM.MOBILE || window.innerWidth < 768

  await fetchPictureDetail()
  pageReady.value = true

  if (picture.value?.id) {
    queryComments()
    checkIsFollowed()
    loadCopyrightInfo()
  }
})

const handleBack = () => {
  router.back()
}

// 核心数据加载
const fetchPictureDetail = async () => {
  try {
    const res = await getPictureVoByIdUsingGet({ id: props.id })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      onlineCount.value = res.data.data.chatCount || 0
    }
  } catch (e) {} finally {
    pictureLoaded.value = true
  }
}

// 图片加载完成
const handleImageLoad = () => { imgReady.value = true }
const showImagePreview = () => { showPreview.value = true }
const handlePreviewChange = (visible: boolean) => { showPreview.value = visible }

function adjustColor(hex: string, percent: number) {
  hex = hex.replace('#', '').padStart(6, '0')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const adjustValue = (value: number) => Math.min(255, Math.max(0, Math.round(value + (value * (percent / 100)))))
  return `#${adjustValue(r).toString(16).padStart(2, '0')}${adjustValue(g).toString(16).padStart(2, '0')}${adjustValue(b).toString(16).padStart(2, '0')}`
}

// 互动功能
const doLike = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.pictureDetailPage.needLogin'))
  const newStatus = picture.value.isLiked === 1 ? false : true
  try {
    const res = await doLikeUsingPost({ targetId: props.id, targetType: 1, isLiked: newStatus })
    if (res.data.code === 0) {
      picture.value.isLiked = newStatus ? 1 : 0
      picture.value.likeCount = String(Number(picture.value.likeCount || 0) + (newStatus ? 1 : -1))
    }
  } catch (e) {}
}

const doFavorite = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.pictureDetailPage.needLogin'))
  const isFavorited = picture.value.isFavorited === 1
  try {
    const res = isFavorited
      ? await cancelFavoriteUsingPost({ userId: loginUserStore.loginUser.id, targetId: props.id, targetType: 1 })
      : await addFavoriteRecordUsingPost({ userId: loginUserStore.loginUser.id, targetId: props.id, targetType: 1, targetUserId: picture.value.user?.id, isFavorite: true })
    if (res.data.code === 0) {
      picture.value.isFavorited = isFavorited ? 0 : 1
      picture.value.favoriteCount = String(Number(picture.value.favoriteCount || 0) + (isFavorited ? -1 : 1))
      message.success(isFavorited ? t('pages.pictureDetailPage.cancelFav') : t('pages.pictureDetailPage.favSuccess'))
    }
  } catch (e) {}
}

const doShare = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.pictureDetailPage.needLogin'))
  try {
    const res = await doShareUsingPost({ targetId: picture.value.id, targetType: 1, isShared: true })
    if (res.data?.code === 0) {
      picture.value.isShared = 1
      picture.value.shareCount = String(Number(picture.value.shareCount || 0) + 1)
      shareModalRef.value?.openModal()
    }
  } catch (e) {}
}

const doGuessLike = () => {
  if (!picture.value.url) return message.warning(t('pages.pictureDetailPage.invalidUrl'))
  router.push({
    path: '/guess_you_like',
    query: {
      url: picture.value.url,
      id: picture.value.id
    }
  })
}

// 用户与关注
const handleUserClick = (user: any) => {
  if (user?.id) router.push(`/user/${user.id}`)
}

const checkIsFollowed = async () => {
  if (!loginUserStore.loginUser?.id || !picture.value?.user?.id) return
  try {
    const res = await findIsFollowUsingPost({ followerId: loginUserStore.loginUser.id, followingId: picture.value.user.id })
    isFollowed.value = !!res.data?.data
  } catch (e) {}
}

const handleFollow = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.pictureDetailPage.needLogin'))
  try {
    const res = await addUserFollowsUsingPost({ followerId: loginUserStore.loginUser.id, followingId: picture.value.user.id, followStatus: isFollowed.value ? 0 : 1 })
    if (res.data.code === 0) {
      isFollowed.value = !isFollowed.value
      message.success(isFollowed.value ? t('pages.pictureDetailPage.followed') : t('pages.pictureDetailPage.unfollowed'))
    }
  } catch (e) {}
}

// 评论
const commentContent = ref('')
const isAddingComment = ref(false)
const replyCommentId = ref('')

const queryComments = async () => {
  if (commentloading.value) return
  commentloading.value = true
  try {
    const res = await queryCommentUsingPost(queryRequest)
    if (res.data?.code === 0 && res.data.data) {
      const records = res.data.data.records || []
      comments.value = queryRequest.current === 1 ? records : [...comments.value, ...records]
      isEndOfData.value = records.length < queryRequest.pageSize
    }
  } finally { commentloading.value = false }
}

const handleScroll = throttle(() => {
  const el = scrollContainer.value
  if (!el) return
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
    if (!isEndOfData.value && !commentloading.value) {
      queryRequest.current++
      queryComments()
    }
  }
}, 200)

// 辅助方法：递归查找树形评论节点
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

// 辅助方法：移除伪造的乐观评论
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

// 核心：带乐观更新的添加评论
const addComment = async () => {
  const content = commentContent.value.trim()
  if (!content || isAddingComment.value) return

  if (!loginUserStore.loginUser?.id) {
    message.warning(t('pages.pictureDetailPage.needLogin'))
    return
  }

  isAddingComment.value = true

  // --- 乐观加载 UI (Optimistic UI) 阶段 ---
  const tempId = `temp-${Date.now()}`
  const parentId = replyCommentId.value || '0'
  const targetUserName = getReplyUserName()

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
    isOptimistic: true // 触发 CommentList 里的闪烁发光骨架特效
  }

  // 插入伪造的数据
  if (parentId !== '0') {
    (optimisticComment as any).parentId = parentId;
    (optimisticComment as any).targetUser = { userName: targetUserName };
    const parent = findComment(comments.value, parentId);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(optimisticComment);
    }
  } else {
    comments.value.unshift(optimisticComment as any);
  }

  // 1毫秒也不等，瞬间清空输入框
  commentContent.value = ''
  replyCommentId.value = ''
  showEmojiPicker.value = false

  // 自动滚动到评论区头部 (只有发主评论时需要)
  if (parentId === '0') {
    nextTick(() => {
      const scrollEl = scrollContainer.value
      if (scrollEl) {
        scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }
  // --- 乐观加载阶段结束 ---

  // --- 真实的 API 请求 ---
  try {
    const res = await addCommentUsingPost({
      targetId: props.id,
      targetType: 1,
      content: content,
      parentCommentId: parentId
    })

    if (res.data.code === 0) {
      // 成功了，增加数字
      picture.value.commentCount = String(Number(picture.value.commentCount || 0) + 1)

      // 找到刚才插入的临时评论，并将其替换为真实数据
      const tempComment = findComment(comments.value, tempId)
      if (tempComment) {
        const realId = res.data.data
        tempComment.commentId = realId ? String(realId) : `real-${Date.now()}`
        // 解除乐观加载状态
        tempComment.isOptimistic = false
      }
    } else {
      // 如果后端拒绝了，撤回刚才的操作
      removeOptimisticComment(tempId)
      commentContent.value = content // 把文字还给用户
      message.error(res.data.message || t('pages.pictureDetailPage.commentFail'))
    }
  } catch (error) {
    // 如果网络断了，撤回
    removeOptimisticComment(tempId)
    commentContent.value = content
    message.error(t('pages.pictureDetailPage.commentFailRetry'))
  } finally {
    isAddingComment.value = false
  }
}

const handleReplyClick = (cid: string) => {
  replyCommentId.value = cid
  nextTick(() => document.querySelector('.comment-input')?.focus())
}
const cancelReply = () => { replyCommentId.value = '' }
const getReplyUserName = () => comments.value.find(c => String(c.commentId) === String(replyCommentId.value))?.commentUser?.userName || ''

// 表情包
const toggleEmojiPicker = () => showEmojiPicker.value = !showEmojiPicker.value
const onEmojiSelect = (emoji: string) => {
  commentContent.value += emoji
  nextTick(() => {
    const inputEl = document.querySelector('.comment-input') as HTMLInputElement
    if (inputEl) { inputEl.focus(); inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length) }
  })
}
const emojiI18n = { search: t('pages.pictureDetailPage.emojiSearch'), categories: { recent: t('pages.pictureDetailPage.emojiCats.recent'), smileys: t('pages.pictureDetailPage.emojiCats.smileys'), people: t('pages.pictureDetailPage.emojiCats.people'), nature: t('pages.pictureDetailPage.emojiCats.nature'), foods: t('pages.pictureDetailPage.emojiCats.foods'), activity: t('pages.pictureDetailPage.emojiCats.activity'), places: t('pages.pictureDetailPage.emojiCats.places'), objects: t('pages.pictureDetailPage.emojiCats.objects'), symbols: t('pages.pictureDetailPage.emojiCats.symbols'), flags: t('pages.pictureDetailPage.emojiCats.flags') } }

// 更多菜单功能
const openReportModal = () => { reportModalRef.value?.openModal(); showMoreModal.value = false }
const openChatModal = () => { showChatModal.value = true; showMoreModal.value = false }
const handleChatMessage = (msg: any) => { if (msg.type === 'onlineUsers') onlineCount.value = msg.onlineCount }
const openPermissionSetting = () => { showPermissionSetting.value = true; showMoreModal.value = false }
const handlePermissionsUpdated = (newPermissions: any) => {
  Object.assign(picture.value, newPermissions)
  showPermissionSetting.value = false
}
const handleDownload = () => { downloadImage(picture.value.url, picture.value.name); showMoreModal.value = false }
const doEdit = () => router.push({ path: '/add_picture', query: { id: picture.value.id, spaceId: picture.value.spaceId } })
const showDeleteConfirm = () => { deleteConfirmVisible.value = true; showMoreModal.value = false }
const confirmDelete = async () => {
  const res = await deletePictureUsingPost({ id: picture.value.id })
  if (res.data.code === 0) { message.success(t('pages.pictureDetailPage.delSuccess')); router.back() }
}
const loadCopyrightInfo = async () => {
  try {
    const res = await getCopyrightByPictureIdUsingGet({ pictureId: String(props.id) })
    if (res.data.code === 0 && res.data.data) { copyrightInfo.value = res.data.data; hasCopyright.value = true }
  } catch (e) {}
}
const goToCopyrightRegister = () => router.push({ path: '/picture/copyright/register', query: { pictureId: String(props.id) } })
const goToEditCopyright = () => router.push({ path: '/picture/copyright/register', query: { pictureId: String(props.id), edit: 'true' } })
const goToCopyrightTrace = () => router.push(copyrightInfo.value?.copyrightCode ? { path: '/picture/copyright/trace', query: { code: copyrightInfo.value.copyrightCode } } : '/picture/copyright/trace')
const goToAnalytics = () => {
  if (!props.id) return message.warning(t('pages.pictureDetailPage.noPicId'))
  router.push(`/item/analytics/picture/${props.id}`)
  showMoreModal.value = false
}
</script>

<style scoped>
/* 核心：锁定PC端全局滚动 */
.picture-detail-page {
  position: relative;
  width: 100%;
  height: 100vh;      /* 严格锁定视口高度 */
  overflow: hidden;   /* 彻底切断全局滚动 */
  background: var(--background, #f5f5f5);
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.picture-detail-page.is-loaded {
  opacity: 1;
}

/* 顶部导航 */
.top-nav-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 60px; padding: 0 20px;
  display: flex; align-items: center; justify-content: space-between;
  z-index: 100;
  background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%);
  pointer-events: none;
}
.nav-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; pointer-events: auto;
  backdrop-filter: blur(8px); transition: all 0.2s;
}
.nav-btn:hover { background: rgba(0, 0, 0, 0.6); transform: scale(1.05); }

/* 背景特效 */
.background-effects { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.color-blur-layer { position: absolute; inset: 0; filter: blur(80px); transition: background 0.8s ease; }
.blurred-image-layer { position: absolute; inset: 0; background-position: center; background-size: cover; filter: blur(40px) brightness(0.6) opacity(0.5); transform: scale(1.1); }

/* 内容层 */
.content-layer {
  position: relative; z-index: 10;
  flex: 1; display: flex; flex-direction: column;
  min-height: 0; /* Flex 核心防破 */
}

/* 核心布局：左图右流 */
.layout-container {
  display: flex; width: 100%; max-width: 1400px;
  margin: 0 auto; flex: 1;
  height: 100%; min-height: 0; /* 再次掐断撑破 */
  padding: 10px 20px 20px; gap: 20px; box-sizing: border-box;
}

/* ================= 左侧大图 ================= */
.preview-section {
  flex: 7; position: relative;
  background: rgba(0, 0, 0, 0.2); border-radius: 20px;
  overflow: hidden; display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1);
}
.image-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; opacity: 0; transform: scale(0.98); transition: all 0.5s ease; }
.image-wrapper.ready { opacity: 1; transform: scale(1); }
.bg-fill-blur { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(50px) brightness(0.5); opacity: 0.6; z-index: 1; }
.main-image { max-width: 95%; max-height: 95%; object-fit: contain; box-shadow: 0 20px 50px rgba(0,0,0,0.4); border-radius: 8px; cursor: zoom-in; z-index: 2; }
.image-overlay-tools { position: absolute; bottom: 30px; display: flex; gap: 20px; padding: 12px 24px; background: rgba(0, 0, 0, 0.5); border-radius: 40px; border: 1px solid rgba(255,255,255, 0.2); backdrop-filter: blur(10px); z-index: 10; }
.tool-item { color: #fff; font-size: 24px; cursor: pointer; transition: transform 0.2s; }
.tool-item:hover { transform: scale(1.2); }
.tool-item.active.like { color: #ff4d4f; }
.tool-item.active.favorite { color: #ffca28; }

/* ================= 右侧流 ================= */
.details-section {
  flex: 3; min-width: 360px;
  background: var(--card-background); border-radius: 20px;
  display: flex; flex-direction: column; min-height: 0; /* 掐断子项溢出 */
  box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid var(--border-color);
}

/* 1. 固定头部 (作者) */
.author-fixed-header {
  padding: 20px; border-bottom: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.author-info { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.author-avatar { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border-color); }
.author-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.follow-btn-inline { padding: 6px 16px; border-radius: 16px; background: #3b82f6; color: #fff; border: none; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s; }
.follow-btn-inline.followed { background: var(--hover-background); color: var(--text-secondary); }

/* 2. 核心滚动区 (简介+评论) */
.scrollable-content {
  flex: 1; overflow-y: auto; padding: 20px;
  scrollbar-width: thin;
}
.scrollable-content::-webkit-scrollbar { width: 6px; }
.scrollable-content::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }

.post-content-area { margin-bottom: 20px; }
.pic-title { font-size: 20px; font-weight: 700; margin: 0 0 12px 0; color: var(--text-primary); }

/* 折叠控制 */
.pic-intro-wrapper { position: relative; margin-bottom: 12px; }
.pic-intro { font-size: 15px; line-height: 1.6; color: var(--text-primary); opacity: 0.9; }
.pic-intro.is-collapsed {
  display: -webkit-box; -webkit-box-orient: vertical;
  -webkit-line-clamp: 3; overflow: hidden;
}
.expand-btn { background: none; border: none; color: #3b82f6; font-size: 15px; font-weight: 500; cursor: pointer; padding: 0; margin-top: 4px; }

.pic-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.tag-item { color: #3b82f6; font-size: 14px; cursor: pointer; }
.post-time-stats { font-size: 12px; color: var(--text-secondary); }

.divider { height: 1px; background: var(--border-color); margin: 20px 0; }

.comments-count-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.comments-count-title { font-size: 15px; font-weight: 600; margin: 0; color: var(--text-primary); }

.guess-like-btn {
  display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 16px;
  background: var(--hover-background); border: 1px solid var(--border-color); color: var(--text-primary);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;
}
.guess-like-btn:hover {
  color: #3b82f6; border-color: #3b82f6; background: rgba(59, 130, 246, 0.05);
  transform: translateY(-1px); box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
}

/* 3. 固定底部 (输入框+互动) */
.action-footer-fixed {
  flex-shrink: 0; padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}
.comment-input-container { position: relative; margin-bottom: 16px; }
.reply-hint { display: flex; justify-content: space-between; font-size: 12px; color: #3b82f6; background: rgba(59, 130, 246, 0.1); padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; }
.input-box-wrapper { display: flex; gap: 10px; align-items: center; }
.comment-input { flex: 1; background: var(--hover-background); border: none; padding: 10px 16px; border-radius: 20px; color: var(--text-primary); font-size: 14px; outline: none; }
.emoji-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
.send-btn { background: #3b82f6; color: #fff; border: none; padding: 8px 16px; border-radius: 18px; font-weight: 600; cursor: pointer; }
.send-btn:disabled { background: var(--border-color); color: var(--text-secondary); }

.footer-buttons { display: flex; justify-content: space-between; padding: 0 10px; }
.footer-btn-item { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; font-size: 16px; }
.footer-btn-item span { font-size: 13px; font-weight: 500; }
.footer-btn-item.active.like { color: #ff4d4f; }
.footer-btn-item.active.favorite { color: #ffca28; }
.footer-btn-item.active i.fa-share-alt { color: #10b981; }

.empty-comment-state { text-align: center; padding: 40px 0; color: var(--text-secondary); }
.empty-comment-state img { width: 120px; margin-bottom: 16px; opacity: 0.8; }
.loading-more, .end-of-data { text-align: center; padding: 20px 0; color: var(--text-secondary); font-size: 13px; }

/* 骨架屏 */
.image-skeleton { width: 100%; height: 100%; background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.shimmer { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.info-skeleton { padding: 24px; }
.skeleton-header { width: 60%; height: 48px; background: var(--hover-background); border-radius: 24px; margin-bottom: 20px; }
.skeleton-text { width: 100%; height: 16px; background: var(--hover-background); border-radius: 8px; margin-bottom: 12px; }
.skeleton-text.short { width: 80%; }


/* ================= 移动端适配 (解除控制，恢复原生滚动) ================= */
@media (max-width: 768px) {
  .picture-detail-page {
    height: auto;
    min-height: 100vh;
    overflow-y: auto; /* 移动端靠原生滚动 */
  }

  .content-layer { padding-top: 0; }
  .top-nav-bar { background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%); }

  .layout-container {
    flex-direction: column;
    height: auto;
    padding: 0; gap: 0;
  }

  .preview-section {
    width: 100vw; height: 100vw; max-height: 60vh;
    border-radius: 0; border: none; background: rgba(0,0,0,0.8); backdrop-filter: none;
  }
  .main-image { max-width: 100%; max-height: 100%; border-radius: 0; box-shadow: none; }

  .details-section {
    border-radius: 24px 24px 0 0; margin-top: -20px; z-index: 10; border: none;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  }

  .scrollable-content {
    overflow-y: visible; /* 移动端不需要内部滚动 */
  }

  .action-footer-fixed {
    position: sticky; bottom: 0;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
}

/* 弹窗通用样式 */
.custom-dropdown-overlay { position: fixed; inset: 0; z-index: 10010; }
.custom-dropdown-content { position: absolute; right: 20px; bottom: 80px; background: var(--card-background); border-radius: 16px; box-shadow: 0 20px 50px var(--shadow-color); border: 1px solid var(--border-color); padding: 8px; width: 180px; }
.dropdown-item { padding: 12px 14px; font-size: 14px; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 12px; border-radius: 10px; }
.dropdown-item:hover { background: var(--hover-background); color: #3b82f6; }
.dropdown-item.danger { color: #ef4444; }

.custom-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 10020; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.confirm-box { background: var(--card-background); border-radius: 16px; padding: 24px; width: 300px; text-align: center; }
.confirm-actions { display: flex; gap: 12px; margin-top: 20px; }
.btn-cancel, .btn-danger { flex: 1; padding: 10px; border-radius: 20px; cursor: pointer; border: none; font-weight: 500; }
.btn-cancel { background: var(--hover-background); color: var(--text-primary); }
.btn-danger { background: #ef4444; color: #fff; }

.permission-setting-content, .chat-room-content { background: var(--card-background); border-radius: 20px; width: 90vw; max-width: 500px; padding: 20px; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; }
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
.modal-close-btn { background: var(--hover-background); border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary); }
.emoji-picker-wrapper { position: absolute; bottom: 100%; right: 0; z-index: 200; margin-bottom: 10px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); background: var(--card-background); border: 1px solid var(--border-color); }
</style>
