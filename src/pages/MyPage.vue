<template>
  <div id="MyPage" class="tiktok-page"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd"
       @touchcancel="handleTouchEnd">
    <div class="page-pull-wrapper">
      <div class="tk-banner-wrap" :class="{ 'is-loaded': bgLoaded }" :style="{ backgroundImage: bgLoaded ? `url(${userHomepageBg})` : 'none' }">
        <div class="banner-mask" :style="{ backdropFilter: `blur(${pullProgress * 12}px)`, WebkitBackdropFilter: `blur(${pullProgress * 12}px)`, transition: pullTransition }"></div>

        <div class="tk-nav">
          <div class="nav-left">
            <div class="icon-bg scan-icon-wrap" @click="qrScannerVisible = true" :title="$t('pages.myPage.scanIcon')">
              <img :src="scanIcon" class="custom-scan-icon" :alt="$t('pages.myPage.scan')" />
            </div>
            <div v-if="device === DEVICE_TYPE_ENUM.MOBILE" class="icon-bg ai-icon-wrap" @click="router.push('/chat/ai')" :title="$t('pages.myPage.aiAssistant')">
              <img :src="aiIcon" class="ai-icon-img" alt="AI" />
            </div>
          </div>
          <div class="nav-right">
            <div class="icon-bg" @click="handleMessageCenter" :title="$t('pages.myPage.messages')" style="position: relative;" v-if="loginUserStore.loginUser.id">
              <i class="fas fa-bell"></i>
              <div class="tk-badge nav-badge" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</div>
            </div>
            <div v-if="loginUserStore.loginUser.userRole === 'admin'" class="icon-bg" @click="showAdminModal" :title="$t('pages.myPage.admin')"><i class="fas fa-sliders-h"></i></div>
            <div class="icon-bg" @click="handleSettingClick" :title="$t('pages.myPage.settings')"><i class="fas fa-bars"></i></div>
            <div class="icon-bg with-text" @click="handleMyTeamsClick" :title="$t('pages.myPage.team')" v-if="loginUserStore.loginUser.id">
              <i class="fas fa-users"></i>
              <span>{{ $t('pages.myPage.team') }}</span>
            </div>
          </div>
        </div>

        <div class="banner-user-info" @click="handleSettingClick">
          <div class="banner-avatar-wrap" :style="{ transform: avatarTransform, transition: pullTransition }">
            <img :src="loginUserStore.loginUser.userAvatar || getDefaultAvatar(loginUserStore.loginUser.userName)" :alt="$t('pages.myPage.avatar')" :style="{ opacity: 1 - (pullProgress * 0.3), transition: pullTransition }" />
            <div class="avatar-refresh-overlay" :style="{ opacity: pullProgress, transition: pullTransition }">
              <i class="fas fa-spinner" :class="{ 'fa-spin': isRefreshing }" :style="{ transform: isRefreshing ? 'none' : `rotate(${refreshDistance * 3}deg)` }"></i>
            </div>
            <div class="avatar-add" @click.stop="openModal" :style="{ opacity: textOpacity, transition: pullTransition }"><i class="fas fa-plus"></i></div>
          </div>
          <div class="banner-text-info" :style="{ opacity: textOpacity, transition: pullTransition }">
            <div class="user-name-wrapper">
              <h1 class="tk-username text-white">{{ loginUserStore.loginUser.userName || $t('pages.myPage.unlogged') }}</h1>
              <img v-if="loginUserStore.loginUser.memberType === 1" :src="proIcon" class="member-icon" :alt="$t('pages.myPage.proMember')" :title="$t('pages.myPage.proMember')" @click.stop="openMemberModal" style="cursor:pointer;" />
              <img v-if="loginUserStore.loginUser.memberType === 2" :src="plusIcon" class="member-icon" :alt="$t('pages.myPage.plusMember')" :title="$t('pages.myPage.plusMember')" @click.stop="openMemberModal" style="cursor:pointer;" />
            </div>
            <div class="tk-userid text-white-70" v-if="loginUserStore.loginUser.id">
              <span class="id-text">{{ $t('pages.myPage.yuemuId', { id: loginUserStore.loginUser.id }) }}</span>
              <div class="copy-tag dark-style" @click.stop="copyUserId">
                <i class="fas fa-copy"></i>
                <span v-if="copySuccess" class="success-text">{{ $t('pages.myPage.copied') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="tk-profile">
        <div class="profile-stats-row">
          <div class="profile-stats" v-if="loginUserStore.loginUser.id">
            <div class="stat-item" @click="handleFollowClick">
              <span class="stat-num">{{ followAndFans.followCount || 0 }}</span>
              <span class="stat-label">{{ $t('pages.myPage.follows') }}</span>
            </div>
            <div class="stat-item" @click="handleFansClick">
              <span class="stat-num">{{ followAndFans.fansCount || 0 }}</span>
              <span class="stat-label">{{ $t('pages.myPage.fans') }}</span>
            </div>
          </div>
          <div class="profile-stats" v-else></div>

          <div class="profile-btn-group">
            <template v-if="!loginUserStore.loginUser.id">
              <button class="tk-btn tk-btn-primary" @click="router.push('/user/login')">{{ $t('pages.myPage.loginNow') }}</button>
            </template>
            <template v-else>
              <button class="tk-btn tk-btn-default" @click="openModal">{{ $t('pages.myPage.editProfile') }}</button>
              <button class="tk-btn tk-btn-default btn-icon" @click="handleShareClick" :title="$t('pages.myPage.share')"><i class="fas fa-share"></i></button>
              <button class="tk-btn tk-btn-default btn-icon" @click="handleMyPostsClick" :title="$t('pages.myPage.search')"><i class="fas fa-search"></i></button>
            </template>
          </div>
        </div>

        <div class="profile-bio" v-if="loginUserStore.loginUser.id">
          <p v-if="loginUserStore.loginUser.userProfile">{{ loginUserStore.loginUser.userProfile }}</p>
          <p v-if="loginUserStore.loginUser.personalSign" class="tk-sign">{{ loginUserStore.loginUser.personalSign }}</p>

          <div class="tk-tags" v-if="loginUserStore.loginUser.region || loginUserStore.loginUser.gender || loginUserStore.loginUser.userTags">
            <span class="tk-tag" v-if="loginUserStore.loginUser.region">{{ loginUserStore.loginUser.region }}</span>
            <span class="tk-tag" v-if="loginUserStore.loginUser.gender || loginUserStore.loginUser.birthday">
            {{ formatGenderAndAge(loginUserStore.loginUser.gender, loginUserStore.loginUser.birthday) }}
          </span>
            <span class="tk-tag" v-for="tag in parseUserTags(loginUserStore.loginUser.userTags)" :key="tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <div class="tk-tabs-wrap" v-if="loginUserStore.loginUser.id" :class="{ 'is-sticky': topBarSolid }">
        <div class="tk-tabs">
          <div class="tab-item" :class="{ active: activeTab === 'picture' }" @click="switchTab('picture')">{{ $t('pages.myPage.tabs.picture') }}</div>
          <div class="tab-item" :class="{ active: activeTab === 'post' }" @click="switchTab('post')">{{ $t('pages.myPage.tabs.post') }}</div>
          <div class="tab-item" :class="{ active: activeTab === 'favorites' }" @click="switchTab('favorites')">{{ $t('pages.myPage.tabs.favorites') }}</div>

          <div class="tab-item"
               v-if="device === DEVICE_TYPE_ENUM.MOBILE"
               :class="{ active: ['likes', 'comments', 'shares'].includes(activeTab) }"
               @click="toggleInteractionDropdown">
            {{ $t('pages.myPage.tabs.interaction') }} <i class="fas fa-caret-down tk-caret" :class="{'is-rotated': showInteractionDropdown}"></i>
          </div>

          <template v-if="device !== DEVICE_TYPE_ENUM.MOBILE">
            <div class="tab-item" :class="{ active: activeTab === 'likes' }" @click="switchTab('likes')">{{ $t('pages.myPage.tabs.likes') }}</div>
            <div class="tab-item" :class="{ active: activeTab === 'shares' }" @click="switchTab('shares')">{{ $t('pages.myPage.tabs.shares') }}</div>
            <div class="tab-item" :class="{ active: activeTab === 'comments' }" @click="switchTab('comments')">{{ $t('pages.myPage.tabs.comments') }}</div>
          </template>
        </div>

        <div class="tk-dropdown-mask" v-if="showInteractionDropdown" @click="showInteractionDropdown = false">
          <div class="tk-dropdown-menu">
            <div class="drop-item" :class="{ active: activeTab === 'likes' }" @click.stop="switchTab('likes')">{{ $t('pages.myPage.tabs.likes') }}</div>
            <div class="drop-item" :class="{ active: activeTab === 'comments' }" @click.stop="switchTab('comments')">{{ $t('pages.myPage.tabs.comments') }}</div>
            <div class="drop-item" :class="{ active: activeTab === 'shares' }" @click.stop="switchTab('shares')">{{ $t('pages.myPage.tabs.shares') }}</div>
          </div>
        </div>

        <div class="tab-extra" v-if="activeTab === 'picture'">
          <i class="fas" :class="pictureViewMode === 'big' ? 'fa-list' : 'fa-th'" @click="togglePictureViewMode"></i>
        </div>
      </div>

      <div class="tk-content" v-if="loginUserStore.loginUser.id">
        <div class="tk-content-inner">
          <div class="tk-tools" v-if="(activeTab === 'picture' || activeTab === 'post') && !loading">
            <template v-if="activeTab === 'picture'">
              <div class="tool-btn" @click="handleMySpaceClick"><i class="fas fa-lock"></i> {{ $t('pages.myPage.tools.privateGallery') }}</div>
              <div class="tool-btn" @click="showDraftPictures"><i class="fas fa-box"></i> {{ $t('pages.myPage.tools.pictureDrafts') }}</div>
              <div class="tool-btn" @click="handleAnalyticsClick"><i class="fas fa-chart-line"></i> {{ $t('pages.myPage.tools.analytics') }}</div>
            </template>
            <template v-if="activeTab === 'post'">
              <div class="tool-btn" @click="showPostDraftModal"><i class="fas fa-edit"></i> {{ $t('pages.myPage.tools.postDrafts') }}</div>
              <div class="tool-btn" @click="handleAnalyticsClick"><i class="fas fa-chart-line"></i> {{ $t('pages.myPage.tools.analytics') }}</div>
            </template>
          </div>

          <div class="tk-state" v-if="loading && contentData.length === 0">
            <div class="tk-loader"></div>
          </div>
          <div class="tk-state empty" v-else-if="loadError || (!loading && contentData.length === 0)">
            <img :src="emptyImage" alt="empty" class="empty-image" />
            <p>{{ loadError ? $t('pages.myPage.empty.loadFail') : getEmptyDescription() }}</p>
          </div>

          <div class="tk-list" v-if="!loadError && contentData.length > 0">
            <template v-if="activeTab === 'picture'">
              <BigPictureList v-if="pictureViewMode === 'big'" :dataList="contentData" :loading="loading" :showOp="true" :onReload="fetchContentData" :isMyPosts="true" />
              <MobilePictureList v-else :dataList="contentData" :loading="loading" :showOp="true" :onReload="fetchContentData" :isMyPosts="true" />
            </template>
            <PostList v-else-if="activeTab === 'post'" :dataList="contentData" :loading="loading" :showOp="true" :onReload="fetchContentData" :isMyPosts="true" :showStatus="true" />
            <UnreadFavoriteList v-else-if="activeTab === 'favorites'" :favorites="contentData" :is-received="false" />
            <UnreadLikeList v-else-if="activeTab === 'likes'" :likes="contentData" :is-received="false" />
            <UnreadShareList v-else-if="activeTab === 'shares'" :shares="contentData" :is-received="false" />
            <UnreadCommentList v-else-if="activeTab === 'comments'" :comments="contentData" :is-received="false" />
          </div>

          <div class="tk-load-more" v-if="isLoadingMore">
            <i class="fas fa-spinner fa-spin"></i> {{ $t('pages.myPage.loading') }}
          </div>
          <div class="tk-no-more" v-else-if="!hasMore() && contentData.length > 0">
        {{ $t('pages.myPage.end') }}
          </div>
        </div>
      </div>
    </div>

    <ShareModal ref="shareModalRef" :title="$t('pages.myPage.shareTitle').replace('{user}', loginUserStore.loginUser.userName || $t('pages.myPage.unlogged'))" :link="userHomeLink" :image-url="getImageUrlForShare()" :user="loginUserStore.loginUser" :create-time="loginUserStore.loginUser.createTime" />

    <div class="tk-bottom-sheet" :class="{ 'is-open': draftModalVisible }">
      <div class="sheet-mask" @click="closeDraftModal"></div>
      <div class="sheet-content pc-limit">
        <div class="sheet-drag-bar"><span></span></div>
        <div class="sheet-header">
          <h3>{{ $t('pages.myPage.drafts.picTitle') }}</h3>
          <div class="close-btn" @click="closeDraftModal"><i class="fas fa-times"></i></div>
        </div>
        <div class="sheet-body">
          <!-- 如果草稿列表为空 -->
          <div v-if="!draftLoading && draftPictures.length === 0" class="empty-draft-state">
            <img :src="emptyImage" alt="empty" class="empty-image" />
            <p>{{ $t('pages.myPage.drafts.emptyPic') }}</p>
          </div>

          <!-- 自定义草稿列表（带删除功能） -->
          <div v-if="!draftLoading && draftPictures.length > 0" class="draft-picture-list">
            <div v-for="draft in draftPictures" :key="draft.id" class="draft-picture-item">
              <img :src="draft.url" :alt="$t('pages.myPage.drafts.draftAlt')" class="draft-picture-thumb" @click="handleDraftPictureClick(draft)" />
              <div class="draft-picture-info">
                <div class="draft-picture-name">{{ draft.name || $t('pages.myPage.drafts.untitled') }}</div>
                <div class="draft-picture-time">{{ formatDraftTime(draft.editTime || draft.createTime) }}</div>
              </div>
              <button class="draft-picture-delete" @click.stop="deleteDraftPicture(draft.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="tk-bottom-sheet" :class="{ 'is-open': postDraftModalVisible }">
      <div class="sheet-mask" @click="closePostDraftModal"></div>
      <div class="sheet-content pc-limit">
        <div class="sheet-drag-bar"><span></span></div>
        <div class="sheet-header">
          <h3>{{ $t('pages.myPage.drafts.postTitle') }}</h3>
          <div class="close-btn" @click="closePostDraftModal"><i class="fas fa-times"></i></div>
        </div>
        <div class="sheet-body">
          <PostDraftList ref="postDraftListRef" />
        </div>
      </div>
    </div>

    <ScanAndSearchModal v-model:visible="qrScannerVisible" />

    <div v-if="open" class="modal-mask glass-mask" @click="open = false">
      <div class="modal-content full-screen-mobile profile-edit-modal" @click.stop>
        <div class="modal-header compact-header">
          <i class="fas fa-times close-btn" @click="open = false"></i>
        </div>

        <div class="profile-hero-section">
          <div class="hero-cover" @click="showBgFileUploadDialog">
            <img v-if="myMessage.homepageBg" :src="myMessage.homepageBg" class="cover-image" :alt="$t('pages.myPage.profileModal.bgAlt')" />
            <div v-else class="cover-placeholder"></div>
            <div class="cover-overlay"><i class="fas fa-camera"></i></div>
            <input type="file" ref="bgFileInput" style="display: none" accept="image/*" @change="handleBgImageUpload" />
          </div>
          <div class="hero-avatar-wrapper">
            <div class="avatar-upload-circle" @click="showFileUploadDialog">
              <img :src="myMessage.userAvatar || getDefaultAvatar(myMessage.userName)" class="hero-avatar" :alt="$t('pages.myPage.avatar')" />
              <div class="avatar-overlay"><i class="fas fa-camera"></i></div>
            </div>
            <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleAvatarUpload" />
          </div>
        </div>

        <div class="modal-body scrollable-body form-compact">
          <div class="form-item">
            <label class="form-label">{{ $t('pages.myPage.profileModal.nickname') }}</label>
            <input v-model="myMessage.userName" class="form-input soft-input" type="text" :placeholder="$t('pages.myPage.profileModal.nicknamePlaceholder')" maxlength="30" />
            <div class="char-count">{{ myMessage.userName ? myMessage.userName.length : 0 }}/30</div>
          </div>
          <div class="form-item">
            <label class="form-label">{{ $t('pages.myPage.profileModal.bio') }}</label>
            <textarea v-model="myMessage.userProfile" class="form-input soft-input textarea-input" :placeholder="$t('pages.myPage.profileModal.bioPlaceholder')" maxlength="520" rows="3"></textarea>
            <div class="char-count">{{ myMessage.userProfile ? myMessage.userProfile.length : 0 }}/520</div>
          </div>
          <div class="form-item">
            <label class="form-label">{{ $t('pages.myPage.profileModal.gender') }}</label>
            <div class="gender-segmented-control">
              <div class="segment-pill" :class="{ 'active': myMessage.gender === '' }" @click="myMessage.gender = ''">{{ $t('pages.myPage.profileModal.genderSecret') }}</div>
              <div class="segment-pill" :class="{ 'active': myMessage.gender === '男' }" @click="myMessage.gender = '男'">{{ $t('pages.myPage.profileModal.genderMale') }}</div>
              <div class="segment-pill" :class="{ 'active': myMessage.gender === '女' }" @click="myMessage.gender = '女'">{{ $t('pages.myPage.profileModal.genderFemale') }}</div>
              <div class="segment-pill" :class="{ 'active': myMessage.gender === '其他' }" @click="myMessage.gender = '其他'">{{ $t('pages.myPage.profileModal.genderOther') }}</div>
            </div>
          </div>
          <div class="form-item row-group">
            <div class="flex-1">
              <label class="form-label">{{ $t('pages.myPage.profileModal.birthday') }}</label>
              <a-date-picker v-model:value="birthdayDate" class="form-input soft-input w-full date-picker-custom" :placeholder="$t('pages.myPage.profileModal.birthdayPlaceholder')" format="YYYY-MM-DD" value-format="YYYY-MM-DD" :bordered="false" />
            </div>
            <div class="flex-1">
              <label class="form-label">{{ $t('pages.myPage.profileModal.region') }}</label>
              <div class="input-with-button location-group">
                <input v-model="myMessage.region" class="form-input soft-input" type="text" :placeholder="$t('pages.myPage.profileModal.regionPlaceholder')" maxlength="50" />
                <button class="location-btn inset-btn" @click="getLocation" :disabled="locationLoading">
                  <i v-if="!locationLoading" class="fas fa-map-marker-alt"></i>
                  <i v-else class="fas fa-spinner fa-spin"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer-actions">
            <button class="pill-submit-btn" @click="editProfile">{{ $t('pages.myPage.profileModal.save') }}</button>
          </div>
        </div>
      </div>
    </div>

    <AvatarCropper ref="avatarCropperRef" :imageUrl="tempImageUrl" @success="handleCroppedAvatar" />

    <MemberMechanismModal ref="memberMechanismModalRef" />
    <MemberDetailModal ref="memberDetailModalRef" />

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import emptyImage from '@/assets/empty.png'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { userLogoutUsingPost, generateQrCodeUsingGet, scanQrCodeUsingPost, confirmQrLoginUsingPost, updateUserUsingPost, updateUserAvatarUsingPost } from '@/api/userController'
import { listSpaceVoByPageUsingPost } from '@/api/spaceController'
import { SPACE_TYPE_ENUM } from '@/constants/space'
import MemberDetailModal from '@/components/MemberDetailModal.vue'
import ScanAndSearchModal from '@/components/ScanAndSearchModal.vue'
import { message } from 'ant-design-vue'
import { h, ref, onMounted, onUnmounted, computed, watch, nextTick, provide } from 'vue'

// 在“我的空间”中强制关闭所有广告
provide('enableAds', false)

import { Modal } from 'ant-design-vue'
import { getFollowAndFansCountUsingPost } from '@/api/userFollowsController'
import { useMessageStore } from '@/stores/useMessageStore'
import ShareModal from '@/components/ShareModal.vue'
import PictureList from '@/components/PictureList.vue'
import PostList from '@/components/PostList.vue'
import UnreadLikeList from '@/components/UnreadLikeList.vue'
import UnreadShareList from '@/components/UnreadShareList.vue'
import UnreadCommentList from '@/components/UnreadCommentList.vue'
import UnreadFavoriteList from '@/components/UnreadFavoriteList.vue'
import BigPictureList from '@/components/BigPictureList.vue'
import PostDraftList from '@/components/PostDraftList.vue'
import MobilePictureList from '@/components/MobilePictureList.vue'
import { listPictureVoByPageUsingPost, listDraftPicturesUsingGet } from '@/api/pictureController'
import { listMyPostsUsingPost } from '@/api/postController'
import { getMyLikeHistoryUsingPost } from '@/api/likeRecordController'
import { getMyFavoriteHistoryUsingPost } from '@/api/favoriteRecordController'
import { getMyShareHistoryUsingPost } from '@/api/shareRecordController'
import { getMyCommentHistoryUsingPost } from '@/api/commentsController'
import AvatarCropper from '@/components/AvatarCropper.vue'
import MemberMechanismModal from '@/components/MemberMechanismModal.vue'
import aiIcon from '@/assets/icons/ai.svg'
import scanIcon from '@/assets/icons/scan-icon.svg'
import scanSuccessSound from '@/assets/sounds/scan_QR.mp3'
import plusIcon from '@/assets/icons/plus.svg'
import proIcon from '@/assets/icons/pro.svg'

import springBanner from '@/assets/season/mobile/1.png'
import summerBanner from '@/assets/season/mobile/2.png'
import autumnBanner from '@/assets/season/mobile/3.png'
import winterBanner from '@/assets/season/mobile/4.png'

const { t } = useI18n();

const loginUserStore = useLoginUserStore()
const router = useRouter()
defineOptions({ name: 'MyPage' })
const adminModalOpen = ref(false)
const device = ref<string>('')
const topBarSolid = ref(false)
const shareModalRef = ref<any>(null)
const memberMechanismModalRef = ref<any>(null)
const draftModalVisible = ref(false)
const postDraftModalVisible = ref(false)
const qrScannerVisible = ref(false)

const open = ref(false)
const locationLoading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const bgFileInput = ref<HTMLInputElement | null>(null)
const avatarCropperRef = ref()
const tempImageUrl = ref('')

const showMemberRules = () => {
  memberMechanismModalRef.value?.openModal()
}

const memberDetailModalRef = ref<any>(null)
const openMemberModal = () => {
  if (loginUserStore.loginUser?.id && memberDetailModalRef.value) {
    memberDetailModalRef.value.open(loginUserStore.loginUser)
  }
}

const disableBodyScroll = (shouldDisable: boolean) => {
  if (shouldDisable) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
}

const draftPictures = ref<any[]>([])
const draftLoading = ref(false)
const copySuccess = ref(false)
const postDraftListRef = ref<any>(null)

onBeforeRouteLeave((to, from) => {
  closeDraftModal()
  closePostDraftModal()
  showInteractionDropdown.value = false
})

const userHomeLink = computed(() => {
  const user = loginUserStore.loginUser || {}
  const href = router.resolve({
    path: `/user/${user.id}`,
    query: { userName: user.userName, userAvatar: user.userAvatar, userAccount: user.userAccount, userProfile: user.userProfile, userRole: user.userRole, createTime: user.createTime }
  }).href
  return `${window.location.origin}${href}`
})

const getImageUrlForShare = () => {
  if (loginUserStore.loginUser?.homepageBg) return loginUserStore.loginUser.homepageBg;
  if (loginUserStore.loginUser?.userAvatar) return loginUserStore.loginUser.userAvatar;
  return getDefaultAvatar(loginUserStore.loginUser.userName);
}

const followAndFans = ref({ followCount: 0, fansCount: 0 })
const messageStore = useMessageStore()
const props = defineProps({ messageCenterUnreadCount: { type: Number, default: 0 } })
const unreadCount = computed(() => props.messageCenterUnreadCount)

const activeTab = ref('picture')
const PICTURE_VIEW_MODE_KEY = 'myPagePictureViewMode'
const pictureViewMode = ref<'list' | 'big'>((localStorage.getItem(PICTURE_VIEW_MODE_KEY) as 'list' | 'big') || 'big')
const togglePictureViewMode = () => {
  pictureViewMode.value = pictureViewMode.value === 'list' ? 'big' : 'list'
  localStorage.setItem(PICTURE_VIEW_MODE_KEY, pictureViewMode.value)
}

const contentData = ref<any[]>([])
const loading = ref(false)
const pagination = ref({ current: 1, pageSize: 12, total: 0 })
const loadError = ref(false)
const showInteractionDropdown = ref(false)
const tabLoading = ref<Record<string, boolean>>({ likes: false, shares: false, comments: false })

const isInteractionTab = (tab: string) => ['likes', 'comments', 'shares'].includes(tab)
const toggleInteractionDropdown = () => { if (device.value === DEVICE_TYPE_ENUM.MOBILE) showInteractionDropdown.value = !showInteractionDropdown.value }

const TABS = ['picture', 'post', 'likes', 'favorites', 'shares', 'comments'] as const
type Tab = typeof TABS[number]

const createDefaultState = () => ({ pagination: { current: 1, pageSize: 12, total: 0 }, content: [] as any[], loading: false, isLoadingMore: false, loadError: false })
const tabStore = ref<Record<string, any>>({ picture: createDefaultState(), post: createDefaultState(), likes: createDefaultState(), favorites: createDefaultState(), shares: createDefaultState(), comments: createDefaultState() })

const bannerImages = { spring: springBanner, summer: summerBanner, autumn: autumnBanner, winter: winterBanner }
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}
const currentSeason = ref(getCurrentSeason())
const currentSeasonBanner = ref(bannerImages[currentSeason.value])
const userHomepageBg = computed(() => loginUserStore.loginUser?.homepageBg || currentSeasonBanner.value)
const bgLoaded = ref(false)
const preloadBg = (url: string) => { if (!url) return; bgLoaded.value = false; const img = new Image(); img.src = url; img.onload = () => bgLoaded.value = true }
watch(() => userHomepageBg.value, (newVal) => preloadBg(newVal), { immediate: true })

const formatGenderAndAge = (gender: string | undefined, birthday: string | undefined) => {
  if (!birthday) return gender || '';
  try {
    const birthDate = new Date(birthday); const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return t('pages.myPage.ageStr').replace('{gender}', gender || '').replace('{age}', String(age));
  } catch { return gender || ''; }
};

const parseUserTags = (tagsStr: string | undefined) => { if (!tagsStr) return []; return tagsStr.split(/[;,，；]/).filter(tag => tag.trim() !== ''); };

const isLoadingMore = ref(false)
const hasMore = () => pagination.value.current * pagination.value.pageSize < pagination.value.total
const pullDownDistance = ref(0)
const isRefreshing = ref(false)
const scrollTimer = ref<number | null>(null)

const startY = ref(0)
const currentY = ref(0)
const refreshDistance = ref(0)
const maxPullDistance = 100
const refreshThreshold = 80

const pullTransition = computed(() => {
  return (isRefreshing.value || (!isRefreshing.value && refreshDistance.value === 0))
    ? 'all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
    : 'none';
});

const avatarTransform = computed(() => {
  const isRef = isRefreshing.value;
  const distance = isRef ? maxPullDistance : refreshDistance.value;
  const progress = Math.min(distance / maxPullDistance, 1);
  const scale = 1 + progress * 0.5;

  const containerWidth = device.value === DEVICE_TYPE_ENUM.MOBILE ? window.innerWidth : Math.min(window.innerWidth, 1000);
  const maxTx = (containerWidth / 2) - 58;
  const tx = maxTx * progress;
  const ty = -30 * progress;

  return `translate(${tx}px, ${ty}px) scale(${scale})`;
});

const pullProgress = computed(() => {
  if (isRefreshing.value) return 1;
  return Math.min(refreshDistance.value / maxPullDistance, 1);
});

const textOpacity = computed(() => {
  if (isRefreshing.value) return 0;
  return Math.max(0, 1 - (refreshDistance.value / refreshThreshold));
});

const applyTabState = (tab: Tab) => {
  const s = tabStore.value[tab]
  pagination.value = { ...s.pagination }
  contentData.value = s.content // 直接引用，不创建新数组
  loading.value = s.loading
  isLoadingMore.value = s.isLoadingMore
  loadError.value = s.loadError
}

const getFollowAndFansCount = async () => {
  if (!loginUserStore.loginUser.id) return
  try { const res = await getFollowAndFansCountUsingPost({ id: loginUserStore.loginUser.id }); if (res.data.code === 0) followAndFans.value = res.data.data || { followCount: 0, fansCount: 0 } } catch (error) {}
}

const handleScroll = () => {
  topBarSolid.value = window.scrollY > 40
  if (scrollTimer.value !== null) return
  scrollTimer.value = window.setTimeout(() => {
    const scrollHeight = document.documentElement.scrollHeight; const scrollTop = document.documentElement.scrollTop || document.body.scrollTop; const clientHeight = document.documentElement.clientHeight
    if (scrollHeight - scrollTop - clientHeight < 30 && !loading.value && !isLoadingMore.value && hasMore()) loadMore()
    if (scrollTimer.value !== null) { clearTimeout(scrollTimer.value); scrollTimer.value = null }
  }, 150)
}

const handleTouchStart = (e: TouchEvent) => {
  // 如果任何模态框打开，禁用下拉刷新
  if (draftModalVisible.value || postDraftModalVisible.value || qrScannerVisible.value || open.value) {
    return
  }
  startY.value = e.touches[0].clientY
  currentY.value = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  // 如果任何模态框打开，禁用下拉刷新
  if (isRefreshing.value || draftModalVisible.value || postDraftModalVisible.value || qrScannerVisible.value || open.value) {
    return
  }
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop > 0) return
  currentY.value = e.touches[0].clientY
  const distance = currentY.value - startY.value
  if (distance > 0) {
    e.preventDefault()
    refreshDistance.value = Math.min(distance * 0.5, maxPullDistance)
    // 隐藏滚动条，防止下拉时因为 translate 导致页面高度瞬间变长出现滚动条
    document.body.style.overflow = 'hidden'
  }
}

const handleTouchEnd = async () => {
  // 恢复滚动条
  document.body.style.overflow = ''

  // 如果任何模态框打开，禁用下拉刷新
  if (draftModalVisible.value || postDraftModalVisible.value || qrScannerVisible.value || open.value) {
    refreshDistance.value = 0
    return
  }
  if (refreshDistance.value >= refreshThreshold && !isRefreshing.value) {
    isRefreshing.value = true
    refreshDistance.value = 0
    await onRefresh()
    isRefreshing.value = false
  }
  refreshDistance.value = 0
}

const onRefresh = async () => {
  pagination.value.current = 1
  contentData.value = []
  try {
    await fetchContentData()
    await getFollowAndFansCount()
    message.success(t('pages.myPage.msgs.refreshSuccess'))
  } catch (error) {
    message.error(t('pages.myPage.msgs.refreshFail'))
  }
}

onMounted(async () => {
  device.value = await getDeviceType()
  getFollowAndFansCount()
  currentSeason.value = getCurrentSeason()
  currentSeasonBanner.value = bannerImages[currentSeason.value]
  if (loginUserStore.loginUser.id) fetchContentData()
  window.addEventListener('scroll', handleScroll)
})

const handleMySpaceClick = async () => {
  try {
    const res = await listSpaceVoByPageUsingPost({
      userId: loginUserStore.loginUser.id,
      current: 1,
      size: 1,
      spaceType: SPACE_TYPE_ENUM.PRIVATE,
    })
    if (res.data.code === 0 && res.data.data.records.length > 0) {
      const space = res.data.data.records[0]
      router.push(`/space/${space.id}`)
    } else {
      router.push('/add_space')
    }
  } catch (error: any) {
    message.error(t('pages.myPage.msgs.noPrivateSpace'))
    router.push('/my_space')
  } finally {
    hide()
  }
}
const handleSettingClick = () => router.push('/user/setting')
const showAdminModal = () => router.push('/admin/manage')
const handleMyPostsClick = () => router.push('/my_ports')
const handleMyTeamsClick = () => router.push('/my_teams')
const handleFollowClick = () => router.push({ path: '/follow-list', query: { tab: 'follow' } })
const handleFansClick = () => router.push({ path: '/follow-list', query: { tab: 'fans' } })
const handleAnalyticsClick = () => router.push('/creator/analytics')

const getDefaultAvatar = (userName: string) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userName || 'Guest')}&backgroundColor=ffd5dc,ffdfbf,ffd5dc`

const copyUserId = () => {
  if (loginUserStore.loginUser.id) {
    navigator.clipboard.writeText(loginUserStore.loginUser.id.toString()).then(() => { copySuccess.value = true; setTimeout(() => copySuccess.value = false, 2000) })
  }
}
const handleShareClick = () => { if (!loginUserStore.loginUser?.id) return message.warning(t('pages.myPage.msgs.needLogin')); shareModalRef.value?.openModal() }

// 相机逻辑
const handleScanClick = async () => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.myPage.msgs.needLogin'))
  qrScannerVisible.value = true
}

onUnmounted(() => {
  if (qrScannerVisible.value) closeQrScanner()
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimer.value !== null) { clearTimeout(scrollTimer.value); scrollTimer.value = null }
})

const handleMessageCenter = () => router.push('/message-center')
const getEmptyDescription = () => ({ picture: t('pages.myPage.empty.picture'), post: t('pages.myPage.empty.post'), likes: t('pages.myPage.empty.likes'), favorites: t('pages.myPage.empty.favorites'), shares: t('pages.myPage.empty.shares'), comments: t('pages.myPage.empty.comments') }[activeTab.value])

const switchTab = async (tab: string) => {
  if (activeTab.value === tab) { showInteractionDropdown.value = false; return }
  if (isInteractionTab(tab)) tabLoading.value[tab] = true; else loading.value = true
  activeTab.value = tab as Tab
  showInteractionDropdown.value = false
  if (scrollTimer.value !== null) { clearTimeout(scrollTimer.value); scrollTimer.value = null }
  isLoadingMore.value = false; loadError.value = false
  const s = tabStore.value[activeTab.value]
  if (s.content.length > 0 || s.pagination.total > 0) {
    applyTabState(activeTab.value)
    if (isInteractionTab(tab)) tabLoading.value[tab] = false; else loading.value = false
  } else {
    pagination.value = { current: 1, pageSize: pagination.value.pageSize, total: 0 }
    contentData.value = []
    tabStore.value[activeTab.value].pagination = { ...pagination.value }; tabStore.value[activeTab.value].content = []; tabStore.value[activeTab.value].loading = true
    try { await fetchContentData() } catch { message.error(t('pages.myPage.msgs.loadFail')) } finally { if (isInteractionTab(tab)) tabLoading.value[tab] = false; else loading.value = false }
  }
}

const loadMore = async () => {
  if (isLoadingMore.value || !hasMore()) return
  isLoadingMore.value = true; tabStore.value[activeTab.value].isLoadingMore = true
  try { pagination.value.current += 1; await fetchContentData(true) } catch { pagination.value.current -= 1 } finally { isLoadingMore.value = false; tabStore.value[activeTab.value].isLoadingMore = false }
}

const fetchContentData = async (isLoadMore = false) => {
  if (!loginUserStore.loginUser.id) return
  if (!isLoadMore) { if (isInteractionTab(activeTab.value)) tabLoading.value[activeTab.value] = true; else loading.value = true }
  try {
    let res; const params = { current: pagination.value.current, pageSize: pagination.value.pageSize, sortField: 'createTime', sortOrder: 'descend', userId: loginUserStore.loginUser.id }
    switch (activeTab.value) {
      case 'picture': res = await listPictureVoByPageUsingPost(params); break
      case 'post': res = await listMyPostsUsingPost(params); break
      case 'likes': res = await getMyLikeHistoryUsingPost(params); break
      case 'favorites': res = await getMyFavoriteHistoryUsingPost(params); break
      case 'shares': res = await getMyShareHistoryUsingPost(params); break
      case 'comments': res = await getMyCommentHistoryUsingPost(params); break
    }
    if (res?.data?.code === 0 && res.data.data) {
      const newData = Array.isArray(res.data.data.records) ? res.data.data.records : []
      if (isLoadMore) contentData.value = [...contentData.value, ...newData]
      else contentData.value = newData
      pagination.value.total = Number(res.data.data.total || 0)
      loadError.value = false
      tabStore.value[activeTab.value].content = [...contentData.value]
      tabStore.value[activeTab.value].pagination = { ...pagination.value }
    }
  } catch { loadError.value = true; tabStore.value[activeTab.value].loadError = true } finally { if (!isLoadMore) { if (isInteractionTab(activeTab.value)) tabLoading.value[activeTab.value] = false; else loading.value = false } }
}

const fetchDraftPictures = async () => {
  if (!loginUserStore.loginUser.id) return
  draftLoading.value = true
  try { const res = await listDraftPicturesUsingGet(); if (res?.data?.code === 0) draftPictures.value = Array.isArray(res.data.data) ? res.data.data : [] } catch {} finally { draftLoading.value = false }
}

const showDraftPictures = async () => { await fetchDraftPictures(); draftModalVisible.value = true; disableBodyScroll(true) }
const closeDraftModal = () => { draftModalVisible.value = false; disableBodyScroll(false) }
const showPostDraftModal = async () => {
  postDraftModalVisible.value = true
  disableBodyScroll(true)
  // 等待模态框打开后再加载数据
  await nextTick()
  if (postDraftListRef.value) {
    postDraftListRef.value.fetchDrafts(true)
  }
}
const closePostDraftModal = () => { postDraftModalVisible.value = false; disableBodyScroll(false) }

// 删除图片草稿
const deleteDraftPicture = async (pictureId: number) => {
  Modal.confirm({
    title: t('pages.myPage.drafts.confirmDelTitle'),
    content: t('pages.myPage.drafts.confirmDelDesc'),
    okText: t('pages.myPage.drafts.del'),
    cancelText: t('pages.myPage.drafts.cancel'),
    okType: 'danger',
    onOk: async () => {
      try {
        const { deletePictureUsingPost } = await import('@/api/pictureController')
        const res = await deletePictureUsingPost({ id: pictureId })
        if (res.data.code === 0) {
          message.success(t('pages.myPage.msgs.delSuccess'))
          // 从列表中移除
          draftPictures.value = draftPictures.value.filter(d => d.id !== pictureId)
        } else {
          message.error(t('pages.myPage.msgs.delFail'))
        }
      } catch (error) {
        message.error(t('pages.myPage.msgs.delFail'))
      }
    }
  })
}

// 点击图片草稿跳转到编辑页面
const handleDraftPictureClick = (draft: any) => {
  router.push({
    path: '/add_picture',
    query: { id: draft.id }
  })
  closeDraftModal()
}

// 格式化草稿时间
const formatDraftTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? t('pages.myPage.time.justNow') : t('pages.myPage.time.minsAgo').replace('{num}', String(minutes))
    }
    return t('pages.myPage.time.hoursAgo').replace('{num}', String(hours))
  } else if (days === 1) {
    return t('pages.myPage.time.yesterday')
  } else if (days < 7) {
    return t('pages.myPage.time.daysAgo').replace('{num}', String(days))
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// --- 编辑资料弹窗逻辑 ---
const myMessage = ref({
  userName: loginUserStore.loginUser.userName,
  id: loginUserStore.loginUser.id,
  userAccount: loginUserStore.loginUser.userAccount,
  userProfile: loginUserStore.loginUser.userProfile || '',
  userRole: loginUserStore.loginUser.userRole,
  userAvatar: loginUserStore.loginUser.userAvatar,
  email: loginUserStore.loginUser.email,
  gender: loginUserStore.loginUser.gender || '',
  region: loginUserStore.loginUser.region || '',
  birthday: loginUserStore.loginUser.birthday || '',
  userTags: loginUserStore.loginUser.userTags || '',
  homepageBg: loginUserStore.loginUser.homepageBg || '',
  personalSign: loginUserStore.loginUser.personalSign || '',
})

const updateUserInfo = (newUserInfo: any) => {
  Object.assign(myMessage.value, newUserInfo)
}

watch(() => loginUserStore.loginUser, (newVal) => updateUserInfo(newVal), { deep: true })

const birthdayDate = computed({
  get: () => myMessage.value.birthday || null,
  set: (value: string | null) => { myMessage.value.birthday = value || '' }
})

const openModal = () => {
  open.value = true
}

const getLocation = async () => {
  if (locationLoading.value) return
  locationLoading.value = true
  try {
    const response = await fetch('https://api.myip.la/cn?json')
    const data = await response.json()
    if (data?.location?.province) {
      myMessage.value.region = data.location.province
      message.success(t('pages.myPage.msgs.locSuccess').replace('{loc}', data.location.province))
    } else {
      myMessage.value.region = '北京'; message.info(t('pages.myPage.msgs.locSuccess').replace('{loc}', '北京'))
    }
  } catch (err) {
    myMessage.value.region = '北京'; message.warning(t('pages.myPage.msgs.locFailDefault'))
  } finally { locationLoading.value = false }
}

const showFileUploadDialog = () => fileInput.value?.click()
const handleAvatarUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) return message.warning(t('pages.myPage.msgs.uploadSizeFail'))
    tempImageUrl.value = URL.createObjectURL(file)
    avatarCropperRef.value?.openModal()
    ;(e.target as HTMLInputElement).value = ''
  }
}
const handleCroppedAvatar = async (file: File) => {
  try {
    const res = await updateUserAvatarUsingPost({ id: loginUserStore.loginUser.id }, {}, file, { 'Content-Type': 'multipart/form-data' })
    if (res.data.code === 0) {
      message.success(t('pages.myPage.msgs.uploadSuccess'))
      myMessage.value.userAvatar = res.data.data
      loginUserStore.setLoginUser({ ...loginUserStore.loginUser, userAvatar: res.data.data })
      avatarCropperRef.value?.closeModal()
    }
  } catch (err) { message.error(t('pages.myPage.msgs.uploadFail')) }
}

const showBgFileUploadDialog = () => bgFileInput.value?.click()
const handleBgImageUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) return message.warning(t('pages.myPage.msgs.uploadSizeFail5'))
    try {
      const hide = message.loading(t('pages.myPage.msgs.uploading'), 0)
      const res = await uploadPostImageUsingPost({}, {}, file)
      hide()
      if (res.data.code === 0) {
        message.success(t('pages.myPage.msgs.uploadSuccess'))
        myMessage.value.homepageBg = res.data.data.url
      } else message.error(t('pages.myPage.msgs.uploadFail'))
    } catch (err) { message.error(t('pages.myPage.msgs.uploadFail')) }
    ;(e.target as HTMLInputElement).value = ''
  }
}

const editProfile = async () => {
  if (!myMessage.value.userName) return message.warning(t('pages.myPage.msgs.nicknameEmpty'))
  if (myMessage.value.userName.length > 30) return message.warning(t('pages.myPage.msgs.nicknameLong'))
  if (myMessage.value.userProfile && myMessage.value.userProfile.length > 520) return message.warning(t('pages.myPage.msgs.bioLong'))
  if (myMessage.value.region && myMessage.value.region.length > 50) return message.warning(t('pages.myPage.msgs.regionLong'))

  try {
    const res = await updateUserUsingPost(myMessage.value)
    if (res.data.code === 0) {
      message.success(t('pages.myPage.msgs.saveSuccess'))
      const updatedUserInfo = { ...loginUserStore.loginUser, ...myMessage.value }
      loginUserStore.setLoginUser(updatedUserInfo)
      open.value = false
    } else {
      message.error(t('pages.myPage.msgs.saveFail').replace('{msg}', res.data.message))
    }
  } catch (err) {
    message.error(t('pages.myPage.msgs.saveFailRetry'))
  }
}

const isAnyModalOpen = computed(() => (open.value || draftModalVisible.value || postDraftModalVisible.value || qrScannerVisible.value))
watch(isAnyModalOpen, (newVal) => {
  if(newVal) {
    disableBodyScroll(true)
  } else {
    disableBodyScroll(false)
  }
})

defineExpose({ handleMySpaceClick, handleSettingClick, showAdminModal, handleMyTeamsClick, showDraftPictures, fetchDraftPictures })
</script>

<style scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");

/* 页面核心容器限制宽度居中 */
.tiktok-page {
  background-color: var(--background);
  min-height: 100vh;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  color: var(--text-primary);
  overflow-x: hidden;
  position: relative;
  box-shadow: 0 0 24px rgba(0,0,0,0.06);
  transition: var(--theme-transition);
}

@media screen and (min-width: 769px) {
  .tiktok-page {
    margin-top: 12px;
    border-radius: 20px 20px 0 0;
    overflow: hidden;
  }
}

/* 顶部 Banner 区域 */
.tk-banner-wrap {
  position: relative;
  height: 280px;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease;
  display: flex;
  flex-direction: column;
}

@media screen and (min-width: 769px) {
  .tk-banner-wrap {
    border-radius: 20px 20px 0 0;
  }
}
.banner-mask {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%, rgba(0,0,0,0.7) 100%);
}

.banner-user-info {
  position: absolute;
  bottom: 20px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

.banner-avatar-wrap {
  position: relative;
  width: 84px; height: 84px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  background: transparent;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.banner-avatar-wrap img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.avatar-refresh-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  border-radius: 50%;
  font-size: 28px;
  color: #ffffff;
  z-index: 5;
  pointer-events: none;
}
.avatar-add {
  position: absolute; bottom: 0px; right: 0px;
  width: 24px; height: 24px;
  background: var(--link-color);
  color: #ffffff;
  border-radius: 50%; border: 2px solid #fff;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
}

.banner-text-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.text-white { color: #ffffff !important; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
.text-white-70 { color: rgba(255,255,255,0.85) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

.dark-style {
  background: rgba(0,0,0,0.3) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
}
.dark-style:hover { background: rgba(0,0,0,0.5) !important; }

.tk-nav {
  position: relative;
  z-index: 10;
  height: 54px;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 8px;
}
.icon-bg {
  width: 32px; height: 32px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  color: #ffffff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  cursor: pointer;
  margin: 0 4px;
  transition: all 0.3s ease;
}
.icon-bg.with-text {
  width: auto;
  padding: 0 12px;
  border-radius: 100px;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}
.icon-bg:hover {
  background: rgba(0,0,0,0.45);
}
.nav-left, .nav-right { display: flex; align-items: center; }

/* ================= 核心：AI 特化按钮 ================= */
.ai-icon-wrap {
  position: relative;
  overflow: visible;
  background: transparent !important;
  border: none !important;
  backdrop-filter: none !important;
}
.ai-icon-img {
  width: 32px;
  height: 32px;
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}
.ai-icon-wrap:hover {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
.ai-icon-wrap:hover .ai-icon-img {
  filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))
  drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))
  brightness(1.3);
  transform: scale(1.2) rotate(5deg);
}
.ai-icon-wrap:active .ai-icon-img {
  transform: scale(0.95);
}

/* ================= 扫码特效同步 ================= */
.scan-icon-wrap {
  position: relative;
  overflow: hidden;
}
.custom-scan-icon {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  color: #fff;
}
.tk-badge {
  position: absolute; top: -4px; right: -2px;
  background: var(--link-color);
  color: #ffffff;
  font-size: 10px; padding: 0 4px; border-radius: 10px; min-width: 14px; text-align: center;
  border: 1px solid rgba(0,0,0,0.2);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}



.tk-profile {
  position: relative;
  border-radius: 0;
  background: var(--background);
  padding: 16px 16px 8px 16px;
  z-index: 20;
  transition: var(--theme-transition);
}
@media screen and (min-width: 769px) {
  .tk-profile {
    padding: 24px;
  }
}

.profile-stats-row {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
}

.profile-btn-group { display: flex; gap: 8px; margin: 0; }
.tk-btn {
  height: 36px; padding: 0 20px;
  border-radius: 6px;
  font-size: 14px; font-weight: 600;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.1s, background 0.3s;
}
.tk-btn:active { transform: scale(0.96); }
.tk-btn-primary { background: var(--link-color); color: #ffffff; }
.tk-btn-primary:hover { background: var(--link-hover-color); }
.tk-btn-default { background: var(--hover-background); color: var(--text-primary); }
.tk-btn-default:hover { background: var(--border-color); }
.btn-icon { padding: 0 12px; }

.tk-username { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 0.5px; color: var(--text-primary); }

.user-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.member-icon {
  height: 28px;
  width: auto;
  flex-shrink: 0;
  vertical-align: text-bottom;
}

.tk-userid {
  font-size: 13px; color: var(--text-secondary);
  display: flex; align-items: center; gap: 8px;
  max-width: 100%;
}
.id-text {
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.copy-tag {
  flex-shrink: 0;
  background: var(--hover-background); padding: 2px 6px; border-radius: 4px;
  cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 11px;
  transition: background 0.2s;
}
.copy-tag:hover { background: var(--border-color); color: var(--text-primary); }
.success-text { color: #10b981; }

.profile-stats { display: flex; gap: 24px; margin: 0; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; transition: opacity 0.2s;}
.stat-item:active { opacity: 0.7; }
.stat-num { font-size: 17px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.stat-label { font-size: 12px; color: var(--text-secondary); line-height: 1.2; }

.profile-bio p { font-size: 14px; line-height: 1.5; margin: 0 0 4px; color: var(--text-primary); }
.tk-sign { color: var(--text-secondary) !important; }
.tk-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.tk-tag {
  background: var(--hover-background); color: var(--text-secondary);
  font-size: 12px; padding: 4px 10px; border-radius: 100px;
}

.tk-tabs-wrap {
  position: sticky; top: 0; z-index: 90;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  transition: var(--theme-transition);
}
/* 暗黑模式下玻璃质感 */
:deep(.dark-theme) .tk-tabs-wrap { background: rgba(15, 23, 42, 0.85); }

.tk-tabs {
  display: flex; overflow-x: auto; flex: 1; scrollbar-width: none;
}
.tk-tabs::-webkit-scrollbar { display: none; }
.tab-item {
  padding: 14px 20px; font-size: 15px; color: var(--text-secondary);
  white-space: nowrap; cursor: pointer; position: relative;
  transition: color 0.2s;
}
.tab-item.active { font-weight: 700; color: var(--text-primary); }
.tab-item.active::after {
  content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 24px; height: 3px; border-radius: 3px; background: var(--link-color);
}
.tk-caret { margin-left: 4px; transition: transform 0.2s; }
.tk-caret.is-rotated { transform: rotate(180deg); }
.tab-extra { padding: 0 16px; color: var(--text-secondary); cursor: pointer; font-size: 18px; }

.tk-dropdown-mask {
  position: absolute; top: 100%; left: 0; right: 0; height: 100vh;
  background: rgba(0,0,0,0.1); z-index: 80;
}
.tk-dropdown-menu {
  background: var(--card-background);
  box-shadow: 0 4px 12px var(--shadow-color);
  border-radius: 0 0 12px 12px; padding: 8px;
}
.drop-item { padding: 14px; text-align: center; font-size: 15px; border-radius: 8px; color: var(--text-primary); }
.drop-item.active { background: var(--hover-background); color: var(--link-color); font-weight: 700; }

.tk-content { min-height: 50vh; margin: 0 4px; }

@media screen and (min-width: 769px) {
  .tk-content { padding: 0 12px; margin: 0; }
}

.custom-pull-refresh { position: relative; width: 100%; will-change: transform; touch-action: pan-y; }
.refresh-indicator {
  position: absolute; left: 0; right: 0; top: -50px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); font-size: 14px; gap: 8px;
}
.refresh-icon { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; }
.pull-arrow { font-size: 20px; transition: transform 0.3s; color: var(--link-color); }
.loading-icon { color: var(--link-color); font-size: 18px; }
.refresh-text { font-weight: 500; color: var(--text-secondary); }
.refresh-indicator.refreshing .refresh-text { color: var(--link-color); }
.refresh-indicator.pulled .pull-arrow { color: var(--link-color); }

.tk-content-inner { position: relative;  margin-bottom: 68px;}
.tk-tools { display: flex; padding: 8px 4px; gap: 12px; }
.tool-btn {
  flex: 1; background: var(--hover-background); padding: 12px 0; text-align: center;
  font-size: 14px; font-weight: 500; color: var(--text-primary);
  border-radius: 8px;
  cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 6px;
  border: 1px solid transparent;
  transition: var(--theme-transition);
}
.tool-btn:hover { border-color: var(--border-color); background: var(--card-background); box-shadow: 0 2px 8px var(--shadow-color); }
.full-width { width: 100%; }

.tk-state { padding: 60px 0; display: flex; justify-content: center; align-items: center; }
.tk-state.empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 0; color: var(--text-secondary); font-size: 14px; text-align: center;
}
.empty-image { width: 160px; height: auto; margin-bottom: 16px; opacity: 0.9; }
.tk-loader {
  width: 24px; height: 24px; border: 2px solid var(--border-color); border-top-color: var(--link-color);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.tk-load-more, .tk-no-more { text-align: center; padding: 20px 0; color: var(--text-secondary); font-size: 13px; }

/* ================= 优化底部抽屉（BottomSheet）================= */
.tk-bottom-sheet {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: flex-end; justify-content: center;
  pointer-events: none;
}
.tk-bottom-sheet.is-open { pointer-events: auto; }
.sheet-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.6);
  opacity: 0; transition: opacity 0.3s;
}
.tk-bottom-sheet.is-open .sheet-mask { opacity: 1; }
.sheet-content {
  position: relative; width: 100%;
  background: var(--card-background);
  border-radius: 16px 16px 0 0;
  height: 80vh; display: flex; flex-direction: column;
  transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  padding-bottom: env(safe-area-inset-bottom);
}
.pc-limit { max-width: 1000px; margin: 0 auto; }
.tk-bottom-sheet.is-open .sheet-content { transform: translateY(0); }
.sheet-drag-bar { padding: 12px 0 0; display: flex; justify-content: center; }
.sheet-drag-bar span { width: 36px; height: 4px; border-radius: 2px; background: var(--border-color); }
.sheet-header { padding: 12px 16px 16px; position: relative; text-align: center; }
.sheet-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.close-btn {
  position: absolute; right: 16px; top: 12px;
  width: 28px; height: 28px; background: var(--hover-background); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);
}
.sheet-body { flex: 1; overflow-y: auto; padding-bottom: 20px; }

/* 图片草稿列表样式 */
.empty-draft-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}
.empty-draft-state p {
  margin: 0;
  font-size: 14px;
}

.draft-picture-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.draft-picture-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--hover-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s;
  cursor: pointer;
}

.draft-picture-item:hover {
  background: var(--card-background);
  border-color: var(--link-color);
  transform: translateX(4px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.draft-picture-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
}

.draft-picture-info {
  flex: 1;
  min-width: 0;
}

.draft-picture-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.draft-picture-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.draft-picture-delete {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0;
}

.draft-picture-delete:hover {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}



/* =========== 弹窗底层框架全屏适配 =========== */
.modal-mask {
  position: fixed; inset: 0;
  background-color: rgba(0, 0, 0, 0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
}
.glass-mask { background-color: rgba(0, 0, 0, 0.6); }

.modal-content {
  background-color: var(--card-background); border-radius: 24px;
  width: 90%; max-width: 460px; max-height: 85vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color);
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 24px; border-bottom: 1px solid var(--border-color);
  background-color: var(--card-background); flex-shrink: 0;
}
.modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); }

.modal-body {
  padding: 24px; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}
.modal-body::-webkit-scrollbar, .scrollable-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-thumb, .scrollable-body::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

/* =========== 表单样式 =========== */
.form-compact .form-item { margin-bottom: 20px; }
.form-label { display: block; font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; padding-left: 4px; }
.soft-input {
  width: 100%; height: 52px; padding: 0 16px; background: var(--hover-background);
  border: 1.5px solid transparent; border-radius: 14px; font-size: 15px; color: var(--text-primary);
  outline: none; transition: all 0.2s ease; box-sizing: border-box;
}
.soft-input:focus, .soft-input:focus-within { background: var(--card-background); border-color: var(--link-color); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
.textarea-input { height: auto; padding: 16px; resize: none; line-height: 1.6; }
.char-count { text-align: right; font-size: 12px; color: var(--text-tertiary); margin-top: 6px; }
.date-picker-custom { display: flex; align-items: center; padding: 0 16px !important; }
.row-group { display: flex; gap: 16px; }
.flex-1 { flex: 1; min-width: 0; }
.w-full { width: 100%; }

.gender-segmented-control {
  display: flex; background: var(--hover-background); border-radius: 14px; padding: 4px; gap: 4px; border: 1px solid var(--border-color);
}
.segment-pill {
  flex: 1; text-align: center; padding: 12px 0; border-radius: 10px; font-size: 14px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
}
.segment-pill.active { background: var(--card-background); color: var(--text-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

.location-group { position: relative; display: flex; align-items: center; width: 100%; }
.location-group .soft-input { padding-right: 48px; }
.location-group .inset-btn {
  position: absolute; right: 6px; width: 40px; height: 40px; border-radius: 10px; border: none; background: var(--card-background);
  color: var(--link-color); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); transition: all 0.2s ease; z-index: 2; font-size: 16px;
}
.location-group .inset-btn:hover:not(:disabled) { background: var(--link-color); color: #fff; transform: scale(1.05); }

.modal-footer-actions { margin-top: 32px; }
.pill-submit-btn {
  width: 100%; height: 52px; border-radius: 14px; background: var(--link-color); color: #fff; font-size: 16px; font-weight: 600; border: none; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.pill-submit-btn:active { transform: scale(0.98); }

/* =========== 个人资料全屏编辑特有样式 =========== */
.profile-hero-section { position: relative; height: 200px; background: var(--hover-background); margin-bottom: 60px; flex-shrink: 0; }
.hero-cover { width: 100%; height: 100%; overflow: hidden; position: relative; cursor: pointer; }
.cover-image { width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); }
.hero-avatar-wrapper { position: absolute; bottom: -40px; left: 24px; z-index: 10; }
.avatar-upload-circle {
  width: 90px; height: 90px; border-radius: 22px; border: 4px solid var(--card-background); background: var(--card-background); overflow: hidden; position: relative; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.hero-avatar { width: 100%; height: 100%; object-fit: cover; }
.cover-overlay, .avatar-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; opacity: 0; transition: 0.2s;
}
.hero-cover:hover .cover-overlay, .avatar-upload-circle:hover .avatar-overlay { opacity: 1; }

.compact-header { position: absolute; top: 0; width: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent); border: none; z-index: 20; padding-top: 0; }
.compact-header .modal-title { color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
.compact-header .close-btn { background: rgba(255,255,255,0.2); color: #fff; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); }

/* ==== 移动端全屏弹窗平滑适配 ==== */
@media (max-width: 768px) {
  .modal-content.full-screen-mobile {
    position: absolute; bottom: 0; left: 0; top: auto;
    width: 100%; height: 80vh; max-width: 100%; max-height: 80vh;
    margin: 0; border-radius: 20px 20px 0 0; border: none;
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.tk-list { margin-bottom: 24px; }
</style>
