<template>
  <div class="yuemu-love-board-container">
    <div class="yuemu-global-romantic-bg" v-if="!noPermission">
      <canvas ref="treeCanvasRef" class="yuemu-heart-tree-canvas"></canvas>
      <div class="yuemu-floating-hearts"></div>
      <div class="yuemu-soft-light"></div>
    </div>

    <div class="yuemu-hero-canvas" v-if="!noPermission">
      <div class="yuemu-hero-bg">
        <img
          class="yuemu-hero-img"
          :src="loveBoard?.bgCover || defaultBgCover"
          :alt="$t('pages.loveBoardView.bgTitle')"
          :class="{ 'yuemu-loaded': !manAvatarLoading && !womanAvatarLoading }"
        >
        <div class="yuemu-hero-overlay"></div>
        <div class="yuemu-hero-gradient-bottom"></div>
      </div>

      <div class="yuemu-couple-display">
        <div class="yuemu-person">
          <div class="yuemu-avatar-ring">
            <img
              class="yuemu-avatar-img"
              :class="{ 'yuemu-loading': manAvatarLoading, 'yuemu-scale-in': !manAvatarLoading }"
              :src="loveBoard?.manCover || defaultManAvatar"
              @load="handleAvatarLoad('man')"
              :alt="$t('pages.loveBoardView.hisAvatar')"
            >
          </div>
          <app-color-animate-text :texts="[loveBoard?.manName || $t('pages.loveBoardView.he')]" :infinite="true" class="yuemu-name-text"></app-color-animate-text>
        </div>

        <div class="yuemu-heart-center">
          <div class="yuemu-beating-heart">
            <img src="@/assets/loveLike.svg" alt="heart" class="yuemu-heart-svg">
            <div class="yuemu-heart-glow"></div>
          </div>
          <div class="yuemu-view-pill">
            <span><i class="fa-regular fa-eye"></i> {{ $t('pages.loveBoardView.witness', { count: loveBoard?.viewCount || '0' }) }}</span>
          </div>
        </div>

        <div class="yuemu-person">
          <div class="yuemu-avatar-ring yuemu-woman-ring">
            <img
              class="yuemu-avatar-img"
              :class="{ 'yuemu-loading': womanAvatarLoading, 'yuemu-scale-in': !womanAvatarLoading }"
              :src="loveBoard?.womanCover || defaultWomanAvatar"
              @load="handleAvatarLoad('woman')"
              :alt="$t('pages.loveBoardView.herAvatar')"
            >
          </div>
          <app-color-animate-text :texts="[loveBoard?.womanName || $t('pages.loveBoardView.she')]" :infinite="true" class="yuemu-name-text"></app-color-animate-text>
        </div>
      </div>

      <div class="yuemu-hero-actions">
        <button v-if="isOwner" class="yuemu-glass-btn yuemu-pulse-btn" @click="showEditModal" :title="$t('pages.loveBoardView.editBoard')">
          <i class="fa-solid fa-pen-nib"></i>
        </button>
        <button v-if="loveBoard?.status === 1" class="yuemu-glass-btn" @click="handleShare" :title="$t('pages.loveBoardView.share')">
          <i class="fa-solid fa-arrow-up-from-bracket"></i>
        </button>
      </div>
    </div>

    <div class="yuemu-main-content-wrapper" v-if="!noPermission">

      <div class="yuemu-timing-section">
        <div class="yuemu-timing-card yuemu-glass-panel">
          <p class="yuemu-timing-label yuemu-text-glow"><i class="fa-solid fa-heart"></i>{{ $t('pages.loveBoardView.loveDaysPrefix') }}</p>
          <div class="yuemu-timing-numbers">
            <div class="yuemu-time-block"><span class="yuemu-num">{{ timing.year }}</span><span class="yuemu-unit">{{ $t('pages.loveBoardView.time.year') }}</span></div>
            <div class="yuemu-time-block"><span class="yuemu-num">{{ timing.month }}</span><span class="yuemu-unit">{{ $t('pages.loveBoardView.time.month') }}</span></div>
            <div class="yuemu-time-block"><span class="yuemu-num">{{ timing.day }}</span><span class="yuemu-unit">{{ $t('pages.loveBoardView.time.day') }}</span></div>
          </div>
        </div>

        <div class="yuemu-countdown-pill yuemu-glass-panel" v-if="loveBoard?.countdownTitle || loveBoard?.countdownTime">
          <span class="yuemu-icon"><i class="fa-solid fa-hourglass-half"></i></span>
          <span class="yuemu-text">{{ loveBoard?.countdownTitle }} {{ $t('pages.loveBoardView.and') }} <strong>{{ countdownChange }}</strong></span>
        </div>
      </div>

      <nav class="yuemu-feature-nav">
        <div class="yuemu-nav-card yuemu-glass-panel" :class="{ 'yuemu-active': currentView === 'daily' }" @click="handleDailyClick">
          <div class="yuemu-icon-box yuemu-bg-pink"><i class="fa-solid fa-book"></i></div>
          <div class="yuemu-text-box">
            <h3>{{ $t('pages.loveBoardView.tabs.daily') }}</h3>
            <p>{{ $t('pages.loveBoardView.tabs.daily') }}</p>
          </div>
        </div>

        <div class="yuemu-nav-card yuemu-glass-panel" :class="{ 'yuemu-active': currentView === 'album' }" @click="handleTimeAlbumClick">
          <div class="yuemu-icon-box yuemu-bg-purple"><i class="fa-solid fa-camera-retro"></i></div>
          <div class="yuemu-text-box">
            <h3>{{ $t('pages.loveBoardView.tabs.album') }}</h3>
            <p>{{ $t('pages.loveBoardView.tabs.albumDesc') }}</p>
          </div>
        </div>

        <div class="yuemu-nav-card yuemu-glass-panel" :class="{ 'yuemu-active': currentView === 'music' }" @click="handleMusicClick">
          <div class="yuemu-icon-box yuemu-bg-blue"><i class="fa-solid fa-music"></i></div>
          <div class="yuemu-text-box">
            <h3>{{ $t('pages.loveBoardView.tabs.music') }}</h3>
            <p>{{ $t('pages.loveBoardView.tabs.musicDesc') }}</p>
          </div>
        </div>

        <div class="yuemu-nav-card yuemu-glass-panel" :class="{ 'yuemu-active': currentView === 'wishes' }" @click="handleWishesClick">
          <div class="yuemu-icon-box yuemu-bg-yellow"><i class="fa-solid fa-gift"></i></div>
          <div class="yuemu-text-box">
            <h3>{{ $t('pages.loveBoardView.tabs.bless') }}</h3>
            <p>{{ $t('pages.loveBoardView.tabs.blessDesc') }}</p>
          </div>
        </div>
      </nav>

      <div class="yuemu-view-container">
        <div v-if="currentView === 'daily' && loveBoard?.id" class="yuemu-view-panel" :class="{ 'yuemu-show': currentView === 'daily' }">
          <DailyMoments :loveBoardId="String(loveBoard.id)" :isOwner="isOwner" />
        </div>
        <div v-if="currentView === 'album'" class="yuemu-view-panel" :class="{ 'yuemu-show': currentView === 'album' }">
          <TimeAlbum ref="timeAlbumRef" :loveBoardId="String(loveBoard?.id || '')" :isOwner="isOwner" />
        </div>
        <div v-if="currentView === 'music'" class="yuemu-view-panel" :class="{ 'yuemu-show': currentView === 'music' }">
          <MusicAlbum ref="musicAlbumRef" :loveBoardId="String(loveBoard?.id || '')" :isOwner="isOwner" />
        </div>
        <div v-if="currentView === 'wishes'" class="yuemu-view-panel" :class="{ 'yuemu-show': currentView === 'wishes' }">
          <WishesBoard :ownerId="loveBoard?.id || 0" :isOwner="isOwner" />
        </div>
      </div>
    </div>

    <div v-if="modalVisible" class="yuemu-glass-modal-overlay" @click.self="handleModalCancel">
      <div class="yuemu-glass-modal-content">
        <div class="yuemu-modal-header">
          <h2>
            <i class="fa-solid" :class="loveBoard ? 'fa-pen-nib' : 'fa-wand-magic-sparkles'"></i>
            {{ loveBoard ? $t('pages.loveBoardView.tabs.future') : $t('pages.loveBoardView.tabs.futureDesc') }}
          </h2>
          <button class="yuemu-close-btn" @click="handleModalCancel"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form class="yuemu-romantic-form" @submit.prevent="handleModalOk">
          <div class="yuemu-form-group">
            <label><i class="fa-solid fa-image"></i> {{ $t('pages.loveBoardView.edit.title') }}</label>
            <div class="yuemu-upload-box yuemu-hero-upload" @click="showFileUploadDialog('bg')">
              <img v-if="formState.bgCover" :src="formState.bgCover" :alt="$t('pages.loveBoardView.bgTitle')" />
              <div v-else class="yuemu-upload-placeholder">
                <span class="yuemu-icon"><i class="fa-regular fa-image"></i></span>
                <p>{{ $t('pages.loveBoardView.edit.clickBg') }}</p>
              </div>
            </div>
          </div>

          <div class="yuemu-couple-setup">
            <div class="yuemu-person-setup">
              <label><i class="fa-solid fa-mars"></i> {{ $t('pages.loveBoardView.edit.hisLook') }}</label>
              <div class="yuemu-upload-box yuemu-avatar-upload" @click="showFileUploadDialog('man')">
                <img v-if="formState.manCover" :src="formState.manCover" :alt="$t('pages.loveBoardView.hisAvatar')" />
                <div v-else class="yuemu-upload-placeholder"><span class="yuemu-icon"><i class="fa-regular fa-user"></i></span></div>
              </div>
              <input type="text" v-model="formState.manName" :placeholder="$t('pages.loveBoardView.edit.hisName')" required>
            </div>

            <div class="yuemu-heart-divider"><i class="fa-solid fa-heart"></i></div>

            <div class="yuemu-person-setup">
              <label><i class="fa-solid fa-venus"></i> {{ $t('pages.loveBoardView.edit.herLook') }}</label>
              <div class="yuemu-upload-box yuemu-avatar-upload" @click="showFileUploadDialog('woman')">
                <img v-if="formState.womanCover" :src="formState.womanCover" :alt="$t('pages.loveBoardView.herAvatar')" />
                <div v-else class="yuemu-upload-placeholder"><span class="yuemu-icon"><i class="fa-regular fa-user"></i></span></div>
              </div>
              <input type="text" v-model="formState.womanName" :placeholder="$t('pages.loveBoardView.edit.herName')" required>
            </div>
          </div>

          <div class="yuemu-form-group-row">
            <div class="yuemu-form-group yuemu-half">
              <label><i class="fa-regular fa-calendar-days"></i> {{ $t('pages.loveBoardView.edit.startDate') }}</label>
              <input type="date" v-model="formState.timing" required>
            </div>
            <div class="yuemu-form-group yuemu-half">
              <label><i class="fa-solid fa-lock"></i> {{ $t('pages.loveBoardView.edit.privacy') }}</label>
              <label class="yuemu-custom-switch">
                <input type="checkbox" :checked="formState.status === 1" @change="(e) => formState.status = (e.target as HTMLInputElement).checked ? 1 : 0">
                <span class="yuemu-slider"></span>
                <span class="yuemu-text">{{ formState.status === 1 ? $t('pages.loveBoardView.edit.public') : $t('pages.loveBoardView.edit.private') }}</span>
              </label>
            </div>
          </div>

          <div class="yuemu-form-group yuemu-form-group-partner" v-if="!loveBoard || isCreator">
            <label><i class="fa-solid fa-user-group"></i> {{ $t('pages.loveBoardView.edit.partner') }} {{ $t('pages.loveBoardView.edit.optional') }}</label>
            <div class="yuemu-partner-input-wrapper">
              <input
                type="text"
                v-model="formState.partnerUserAccount"
                :placeholder="$t('pages.loveBoardView.edit.partnerPlaceholder')"
                @focus="showFollowingList = false"
              >
              <button
                type="button"
                class="yuemu-btn-select-following"
                @click="toggleFollowingList"
                :title="$t('pages.loveBoardView.edit.selectFromFollow')"
              >
                <i class="fa-solid fa-users"></i>
              </button>
            </div>

            <div v-if="showFollowingList" class="yuemu-following-dropdown">
              <div class="yuemu-dropdown-header">
                <span>{{ $t('pages.loveBoardView.edit.myFollows') }}</span>
                <button type="button" class="yuemu-close-dropdown" @click="showFollowingList = false"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div v-if="loadingFollowing && followingList.length === 0" class="yuemu-dropdown-loading"><i class="fa-solid fa-spinner fa-spin"></i>{{ $t('pages.loveBoardView.edit.loading') }}</div>
              <div v-else-if="followingList.length === 0" class="yuemu-dropdown-empty">{{ $t('pages.loveBoardView.edit.noFollows') }}</div>
              <div v-else class="yuemu-following-list" ref="followingListRef" @scroll="handleFollowingScroll">
                <div
                  v-for="user in followingList"
                  :key="user.id"
                  class="yuemu-following-item"
                  @click="selectFollowing(user)"
                >
                  <img :src="user.userAvatar" :alt="user.userName" class="yuemu-user-avatar">
                  <div class="yuemu-user-info">
                    <div class="yuemu-user-name">{{ user.userName }}</div>
                    <div class="yuemu-user-id">ID: {{ user.id }}</div>
                  </div>
                  <div class="yuemu-select-icon"><i class="fa-solid fa-check"></i></div>
                </div>
                <div v-if="loadingFollowing" class="yuemu-loading-more"><i class="fa-solid fa-spinner fa-spin"></i>{{ $t('pages.loveBoardView.edit.loading') }}</div>
                <div v-else-if="!followingHasMore" class="yuemu-no-more">{{ $t('pages.loveBoardView.edit.noMore') }}</div>
              </div>
            </div>
          </div>

          <div class="yuemu-form-group-row">
            <div class="yuemu-form-group yuemu-half">
              <label><i class="fa-regular fa-bell"></i> {{ $t('pages.loveBoardView.edit.expectedDays') }}</label>
              <input type="text" v-model="formState.countdownTitle" :placeholder="$t('pages.loveBoardView.edit.expectedEx')">
            </div>
            <div class="yuemu-form-group yuemu-half" v-if="formState.countdownTitle">
              <label><i class="fa-regular fa-calendar-check"></i> {{ $t('pages.loveBoardView.edit.thatDayIs') }}</label>
              <input type="date" v-model="formState.countdownTime">
            </div>
          </div>

          <div class="yuemu-modal-footer">
            <button type="button" class="yuemu-btn-ghost" @click="handleModalCancel">{{ $t('pages.loveBoardView.msgs.wait') }}</button>
            <button type="submit" class="yuemu-btn-primary">{{ $t('pages.loveBoardView.edit.save') }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="noPermission" class="yuemu-no-permission-overlay">
      <div class="yuemu-lock-card yuemu-glass-panel">
        <div class="yuemu-lock-icon yuemu-heartbeat"><i class="fa-solid fa-lock"></i></div>
        <h2>{{ $t('pages.loveBoardView.secret.title') }}</h2>
        <p>{{ $t('pages.loveBoardView.secret.desc') }}</p>
        <button class="yuemu-btn-primary" @click="$router.push({ name: 'MyHome' })">{{ $t('pages.loveBoardView.secret.leave') }}</button>
      </div>
    </div>

    <AvatarCropper ref="cropperRef" :imageUrl="tempImageUrl" @success="handleCroppedImage" />
    <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileChange" />

    <div v-if="showMessageText" :class="['yuemu-floating-toast', `yuemu-toast-${showMessageType}`]">
      <i class="fa-solid fa-circle-check" v-if="showMessageType === 'success'"></i>
      <i class="fa-solid fa-circle-exclamation" v-else-if="showMessageType === 'error'"></i>
      <i class="fa-solid fa-circle-info" v-else></i>
      {{ showMessageText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, reactive, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { prevRoute } from '@/router'
import dayjs from 'dayjs'
import AppColorAnimateText from "@/components/color-animate-text/color-animate-text.component.vue"
import {
  getMyLoveBoardUsingGet,
  addLoveBoardUsingPost,
  updateLoveBoardUsingPost,
  getLoveBoardByIdUsingGet,
} from '@/api/loveBoardController'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import { getUserIdByAccountUsingGet } from '@/api/userController'
import { getFollowOrFanListUsingPost } from '@/api/userFollowsController'
import AvatarCropper from '@/components/AvatarCropper.vue'
import DailyMoments from '@/components/DailyMoments.vue'
import TimeAlbum from '@/components/TimeAlbum.vue'
import MusicAlbum from '@/components/MusicAlbum.vue'
import WishesBoard from '@/components/WishesBoard.vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { getDefaultAvatar } from '@/utils/userUtils'
import defaultBgCover from '@/assets/default.png'

interface LoveBoard {
  id?: number;
  bgCover?: string;
  manCover?: string;
  womanCover?: string;
  manName?: string;
  womanName?: string;
  timing?: string;
  countdownTitle?: string;
  countdownTime?: string;
  status?: number;
  userId?: number;
  partnerUserId?: number;
  viewCount?: number;
}

const showMessageText = ref('')
const showMessageType = ref('info')
const messageTimer = ref<number | null>(null)

const loveBoard = ref<LoveBoard>()
const modalVisible = ref(false)
const timing = reactive({ year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 })
const countdownChange = ref('')
const tempImageUrl = ref('')
const cropperRef = ref()
const fileInput = ref<HTMLInputElement | null>(null)
const prevView = ref<string | null>(null)

const formState = reactive({
  bgCover: '', manCover: '', womanCover: '', manName: '', womanName: '',
  timing: '', countdownTitle: '', countdownTime: '', status: 1, partnerUserAccount: ''
})

const currentUploadType = ref<'bg' | 'man' | 'woman'>('bg')
const currentView = ref<'daily' | 'album' | 'music' | 'wishes' | null>('daily')

const showFollowingList = ref(false)
const followingList = ref<any[]>([])
const loadingFollowing = ref(false)
const followingPage = ref(1)
const followingPageSize = ref(20)
const followingHasMore = ref(true)
const followingListRef = ref<HTMLElement | null>(null)

const router = useRouter()
const route = useRoute()

const defaultManAvatar = computed(() => getDefaultAvatar(loveBoard.value?.manName || t('pages.loveBoardView.he')))
const defaultWomanAvatar = computed(() => getDefaultAvatar(loveBoard.value?.womanName || t('pages.loveBoardView.she')))

// ==========================================
//   爱心树摇曳动画核心状态
// ==========================================
const treeCanvasRef = ref<HTMLCanvasElement | null>(null)
let treeReqId: number
let canopyLeaves: any[] = []
let fallingLeaves: any[] = []
const treeColors = ['#ff4d6d', '#ff758f', '#ff8fa3', '#c9184a', '#ffb703', '#fb8500', '#ff006e', '#ff99c8', '#ffe066', '#f72585']
// ==========================================

const isMobile = ref(false)
const checkMobile = () => { isMobile.value = window.innerWidth <= 767 }

onMounted(() => {
  if (prevRoute?.name === 'TimeAlbumDetail') { currentView.value = 'album'; prevView.value = 'album' }
  else if (prevRoute?.name === 'MusicAlbumDetail') { currentView.value = 'music'; prevView.value = 'music' }
  else { currentView.value = 'daily'; prevView.value = 'daily' }

  fetchLoveBoard()
  setInterval(() => { updateTiming(); updateCountdown() }, 1000)

  checkMobile()
  window.addEventListener('resize', handleWindowResize)

  initFloatingHearts()
  initTreeCanvas()
})

const handleWindowResize = () => {
  checkMobile()
  resizeTreeCanvas()
}

const loginUserStore = useLoginUserStore()
const isOwner = computed(() => {
  const currentUserId = loginUserStore.loginUser?.id
  return currentUserId === loveBoard.value?.userId || currentUserId === loveBoard.value?.partnerUserId
})

const isCreator = computed(() => {
  const currentUserId = loginUserStore.loginUser?.id
  return currentUserId === loveBoard.value?.userId
})

const manAvatarLoading = ref(true)
const womanAvatarLoading = ref(true)

const handleAvatarLoad = (type: 'man' | 'woman') => {
  if (type === 'man') { manAvatarLoading.value = false }
  else { womanAvatarLoading.value = false }
}

const showMessage = (text: string, type: 'error' | 'success' | 'info' = 'error') => {
  showMessageText.value = text
  showMessageType.value = type
  if (messageTimer.value) clearTimeout(messageTimer.value)
  messageTimer.value = window.setTimeout(() => { showMessageText.value = '' }, 3000)
}

const noPermission = ref(false)

const fetchLoveBoard = async () => {
  try {
    const loveBoardId = route.params.id
    let res
    if (loveBoardId) {
      res = await getLoveBoardByIdUsingGet({ id: String(loveBoardId) })
      if (res.data.code === 40101) { noPermission.value = true; return }
    } else {
      res = await getMyLoveBoardUsingGet()
    }
    if (res.data.code === 0) {
      loveBoard.value = res.data.data
      if (loveBoard.value) {
        Object.assign(formState, {
          ...loveBoard.value,
          timing: dayjs(loveBoard.value.timing).format('YYYY-MM-DD'),
          countdownTime: loveBoard.value.countdownTime ? dayjs(loveBoard.value.countdownTime).format('YYYY-MM-DD') : null,
          partnerUserAccount: loveBoard.value.partnerUserId ? String(loveBoard.value.partnerUserId) : ''
        })
      } else if (!route.params.id) {
        modalVisible.value = true
        document.body.style.overflow = 'hidden'
      }
    }
  } catch (error) {
    console.error(t('pages.loveBoardView.msgs.fetchFail'), error)
    showMessage(t('pages.loveBoardView.msgs.fetchFail'))
  }
}

const showEditModal = () => {
  if (loveBoard.value) {
    Object.assign(formState, {
      ...loveBoard.value,
      timing: dayjs(loveBoard.value.timing).format('YYYY-MM-DD'),
      countdownTime: loveBoard.value.countdownTime ? dayjs(loveBoard.value.countdownTime).format('YYYY-MM-DD') : null,
      partnerUserAccount: loveBoard.value.partnerUserId ? String(loveBoard.value.partnerUserId) : ''
    })
  }
  modalVisible.value = true
  document.body.style.overflow = 'hidden'
  showFollowingList.value = false
  followingList.value = []
  followingPage.value = 1
  followingHasMore.value = true
}

const toggleFollowingList = async () => {
  showFollowingList.value = !showFollowingList.value
  if (showFollowingList.value && followingList.value.length === 0) {
    followingPage.value = 1
    followingHasMore.value = true
    await fetchFollowingList()
  }
}

const fetchFollowingList = async (isLoadMore = false) => {
  if (loadingFollowing.value || (!isLoadMore && !followingHasMore.value)) return
  try {
    loadingFollowing.value = true
    const res = await getFollowOrFanListUsingPost({
      current: followingPage.value,
      pageSize: followingPageSize.value,
      searchType: 0,
      followerId: loginUserStore.loginUser.id
    })
    if (res.data.code === 0 && res.data.data) {
      const newRecords = res.data.data.records || []
      if (isLoadMore) {
        followingList.value = [...followingList.value, ...newRecords]
      } else {
        followingList.value = newRecords
      }
      const total = res.data.data.total || 0
      followingHasMore.value = followingList.value.length < total
    }
  } catch (error) {
    console.error(t('pages.loveBoardView.msgs.fetchFollowFail'), error)
    showMessage(t('pages.loveBoardView.msgs.fetchFollowFail'))
  } finally {
    loadingFollowing.value = false
  }
}

const handleFollowingScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight
  if (scrollHeight - scrollTop - clientHeight < 50 && followingHasMore.value && !loadingFollowing.value) {
    followingPage.value++
    fetchFollowingList(true)
  }
}

const selectFollowing = (user: any) => {
  formState.partnerUserAccount = String(user.id)
  showFollowingList.value = false
  showMessage(`${t('pages.loveBoardView.msgs.selected')}${user.userName}`, 'success')
}

const handleModalOk = async () => {
  try {
    if (!formState.bgCover || !formState.manCover || !formState.womanCover ||
      !formState.manName || !formState.womanName || !formState.timing) {
      showMessage(t('pages.loveBoardView.msgs.fillRequired'))
      return
    }

    let partnerUserId = undefined
    if (formState.partnerUserAccount && formState.partnerUserAccount.trim()) {
      try {
        const userRes = await getUserIdByAccountUsingGet({
          userAccount: formState.partnerUserAccount.trim()
        })
        if (userRes.data.code === 0 && userRes.data.data) {
          partnerUserId = userRes.data.data
        } else {
          showMessage(userRes.data.message || t('pages.loveBoardView.msgs.partnerNotFound'))
          return
        }
      } catch (error) {
        showMessage(t('pages.loveBoardView.msgs.partnerNotFound'))
        return
      }
    }

    const data = {
      ...formState,
      timing: formState.timing,
      countdownTime: formState.countdownTime,
      status: formState.status ? 1 : 0,
      ...(partnerUserId !== undefined && { partnerUserId })
    }

    const res = loveBoard.value
      ? await updateLoveBoardUsingPost(data)
      : await addLoveBoardUsingPost(data)

    if (res.data.code === 0) {
      showMessage(loveBoard.value ? t('pages.loveBoardView.msgs.updateSuccess') : t('pages.loveBoardView.msgs.createSuccess'), 'success')
      modalVisible.value = false
      document.body.style.overflow = ''
      await fetchLoveBoard()
    } else {
      showMessage(res.data.message || t('pages.loveBoardView.msgs.opFail'))
    }
  } catch (error) {
    console.error(t('pages.loveBoardView.msgs.opFail'), error)
    showMessage(t('pages.loveBoardView.msgs.opFail'))
  }
}

const handleModalCancel = () => {
  modalVisible.value = false
  document.body.style.overflow = ''
  showFollowingList.value = false
  followingList.value = []
  followingPage.value = 1
  followingHasMore.value = true
}

const showFileUploadDialog = (type: 'bg' | 'man' | 'woman') => {
  currentUploadType.value = type
  fileInput.value?.click()
}

const handleFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (currentUploadType.value === 'bg') {
    try {
      const res = await uploadPostImageUsingPost({}, {}, file)
      if (res.data.code === 0) {
        showMessage(t('pages.loveBoardView.msgs.bgSuccess'), 'success')
        formState.bgCover = res.data.data.url
      }
    } catch (error) {
      console.error(t('pages.loveBoardView.msgs.bgFail'), error)
      showMessage(t('pages.loveBoardView.msgs.bgFail'))
    }
  } else {
    tempImageUrl.value = URL.createObjectURL(file)
    cropperRef.value?.openModal()
  }
  (e.target as HTMLInputElement).value = ''
}

const handleCroppedImage = async (file: File) => {
  try {
    const res = await uploadPostImageUsingPost({}, {}, file)
    if (res.data.code === 0) {
      showMessage(t('pages.loveBoardView.msgs.avatarSuccess'), 'success')
      if (currentUploadType.value === 'man') {
        formState.manCover = res.data.data.url
      } else if (currentUploadType.value === 'woman') {
        formState.womanCover = res.data.data.url
      }
      cropperRef.value?.closeModal()
    }
  } catch (error) {
    console.error(t('pages.loveBoardView.msgs.avatarFail'), error)
    showMessage(t('pages.loveBoardView.msgs.avatarFail'))
  }
}

const updateTiming = () => {
  if (!loveBoard.value?.timing) return
  const startDate = dayjs(loveBoard.value.timing)
  const now = dayjs()
  timing.year = now.diff(startDate, 'year')
  const afterYears = startDate.add(timing.year, 'year')
  timing.month = now.diff(afterYears, 'month')
  const afterMonths = afterYears.add(timing.month, 'month')
  timing.day = now.diff(afterMonths, 'day')
  const afterDays = afterMonths.add(timing.day, 'day')
  timing.hour = now.diff(afterDays, 'hour')
  const afterHours = afterDays.add(timing.hour, 'hour')
  timing.minute = now.diff(afterHours, 'minute')
  const afterMinutes = afterHours.add(timing.minute, 'minute')
  timing.second = now.diff(afterMinutes, 'second')
}

const updateCountdown = () => {
  if (!loveBoard.value?.countdownTime) return
  const diff = dayjs(loveBoard.value.countdownTime).diff(dayjs(), 'second')
  if (diff <= 0) return
  const d = Math.floor(diff / (24 * 60 * 60))
  const h = Math.floor((diff % (24 * 60 * 60)) / (60 * 60))
  const m = Math.floor((diff % (60 * 60)) / 60)
  const s = diff % 60
  countdownChange.value = `${d}${t('pages.loveBoardView.time.day')}${h}${t('pages.loveBoardView.time.hour')}${m}${t('pages.loveBoardView.time.minute')}${s}${t('pages.loveBoardView.time.second')}`
}

// 注意：这里的 querySelector 为了兼容子组件未做修改，仅对本文件的 class 进行了增强
const handleDailyClick = () => {
  if (currentView.value === 'daily') {
    const container = document.querySelector('.daily-moments-wrap')
    if (container) {
      container.classList.add('collapsed')
      setTimeout(() => { prevView.value = 'daily'; currentView.value = null }, 300)
    }
  } else { prevView.value = currentView.value; currentView.value = 'daily' }
}

const handleTimeAlbumClick = () => {
  if (currentView.value === 'album') {
    const container = document.querySelector('.time-album-wrap')
    if (container) {
      container.classList.add('collapsed')
      setTimeout(() => { prevView.value = 'album'; currentView.value = null }, 300)
    }
  } else { prevView.value = currentView.value; currentView.value = 'album' }
}

const handleMusicClick = () => {
  if (currentView.value === 'music') {
    const container = document.querySelector('.music-album-wrap')
    if (container) {
      container.classList.add('collapsed')
      setTimeout(() => { prevView.value = 'music'; currentView.value = null }, 300)
    }
  } else { prevView.value = currentView.value; currentView.value = 'music' }
}

const handleWishesClick = () => {
  if (currentView.value === 'wishes') {
    const container = document.querySelector('.wishes-wrap')
    if (container) {
      container.classList.add('collapsed')
      setTimeout(() => { prevView.value = 'wishes'; currentView.value = null }, 300)
    }
  } else { prevView.value = currentView.value; currentView.value = 'wishes' }
}

const handleShare = () => {
  if (!loveBoard.value?.id) return
  const shareUrl = `${window.location.origin}/loveboard/${loveBoard.value.id}`
  navigator.clipboard.writeText(shareUrl)
    .then(() => { showMessage(t('pages.loveBoardView.msgs.copySuccess'), 'success') })
    .catch(() => { showMessage(t('pages.loveBoardView.msgs.copyFail')) })
}

const initFloatingHearts = () => {
  const container = document.querySelector('.yuemu-floating-hearts')
  if (!container) return
  const createHeart = () => {
    const heart = document.createElement('div')
    heart.className = 'yuemu-floating-heart'
    heart.innerHTML = '<i class="fa-solid fa-heart" style="color: #ff8fa3"></i>'
    const size = Math.random() * 16 + 8
    const left = Math.random() * 100
    const delay = Math.random() * 5
    const duration = Math.random() * 10 + 10
    heart.style.cssText = `
      position: absolute; left: ${left}%; bottom: -20px; font-size: ${size}px;
      opacity: ${Math.random() * 0.5 + 0.3}; animation: yuemu-floatUp ${duration}s linear infinite;
      transform: translateY(0) rotate(${Math.random() * 360}deg); pointer-events: none;
    `
    container.appendChild(heart)
    setTimeout(() => { heart.remove() }, duration * 1000)
  }
  setInterval(createHeart, 500)
}

// =================================================================
// 摇曳爱心树核心代码
// =================================================================
const initCanopy = (tScale: number) => {
  canopyLeaves = []
  const scaleFactor = 16 * tScale

  const leafCount = isMobile.value ? 400 : 1200

  for (let i = 0; i < leafCount; i++) {
    let t = Math.random() * Math.PI * 2
    let r = Math.sqrt(Math.random())

    let hx = 16 * Math.pow(Math.sin(t), 3) * r * scaleFactor
    let hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * r * scaleFactor

    canopyLeaves.push({
      offsetX: hx,
      offsetY: hy,
      size: (Math.random() * 2 + 1) * Math.max(tScale, 0.6),
      color: treeColors[Math.floor(Math.random() * treeColors.length)],
      angle: (Math.random() - 0.5) * 0.5,
      vibePhase: i * 0.1,
      alpha: Math.random() * 0.6 + 0.4
    })
  }
}

const drawTreeHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, baseAngle: number, vibeAngle: number, alpha: number) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(baseAngle + vibeAngle)
  ctx.scale(size, size)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-5, -5, -10, 0, 0, 10)
  ctx.bezierCurveTo(10, 0, 5, -5, 0, 0)
  ctx.fill()
  ctx.restore()
}

const drawTrunk = (ctx: CanvasRenderingContext2D, tScale: number) => {
  ctx.fillStyle = '#4a2c2a'
  ctx.beginPath()
  ctx.moveTo(-25 * tScale, 0)
  ctx.lineTo(25 * tScale, 0)
  ctx.lineTo(10 * tScale, -350 * tScale)
  ctx.lineTo(-10 * tScale, -350 * tScale)
  ctx.fill()

  ctx.strokeStyle = '#4a2c2a'
  ctx.lineWidth = 4 * tScale
  ctx.beginPath()
  ctx.moveTo(0, -200 * tScale)
  ctx.lineTo(-80 * tScale, -280 * tScale)
  ctx.moveTo(0, -250 * tScale)
  ctx.lineTo(90 * tScale, -310 * tScale)
  ctx.stroke()
}

const animateTree = () => {
  const canvas = treeCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const time = Date.now() / 1000
  const globalSwayAngle = Math.sin(time * 1.5) * 0.03

  const centerX = canvas.width / 2
  const baseY = canvas.height - (isMobile.value ? 20 : 60)
  const tScale = isMobile.value ? Math.max(window.innerWidth / 800, 0.45) : 1.2
  const canopyCenterY = baseY - 380 * tScale

  ctx.save()
  ctx.translate(centerX, baseY)
  ctx.rotate(globalSwayAngle)

  drawTrunk(ctx, tScale)

  const relativeCanopyY = -380 * tScale
  const vibeSpeed = 4.5
  const vibeAmplitude = 0.06

  canopyLeaves.forEach(leaf => {
    const vibeAngle = Math.sin(time * vibeSpeed + leaf.vibePhase) * vibeAmplitude
    drawTreeHeart(ctx, leaf.offsetX, relativeCanopyY + leaf.offsetY, leaf.size, leaf.color, leaf.angle, vibeAngle, leaf.alpha)
  })

  ctx.restore()

  if (Math.random() < 0.1 && canopyLeaves.length > 0) {
    const sourceLeaf = canopyLeaves[Math.floor(Math.random() * canopyLeaves.length)]
    fallingLeaves.push({
      x: centerX + sourceLeaf.offsetX,
      y: canopyCenterY + sourceLeaf.offsetY,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 1.5 + 1,
      size: sourceLeaf.size,
      color: sourceLeaf.color,
      baseAngle: sourceLeaf.angle,
      spin: (Math.random() - 0.5) * 0.1,
      alpha: sourceLeaf.alpha
    })
  }

  for (let i = fallingLeaves.length - 1; i >= 0; i--) {
    let p = fallingLeaves[i]
    p.x += p.vx
    p.y += p.vy
    p.baseAngle += p.spin
    p.vx += Math.sin(time * 2 + p.y * 0.01) * 0.05
    drawTreeHeart(ctx, p.x, p.y, p.size, p.color, p.baseAngle, 0, p.alpha)
    if (p.y > canvas.height + 20) {
      fallingLeaves.splice(i, 1)
    }
  }

  treeReqId = requestAnimationFrame(animateTree)
}

const resizeTreeCanvas = () => {
  const canvas = treeCanvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const tScale = isMobile.value ? Math.max(window.innerWidth / 800, 0.45) : 1.2
  initCanopy(tScale)
}

const initTreeCanvas = () => {
  resizeTreeCanvas()
  animateTree()
}

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  if (messageTimer.value) clearTimeout(messageTimer.value)
  if (treeReqId) cancelAnimationFrame(treeReqId)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ================= 动态树的专属样式 ================= */
.yuemu-heart-tree-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.9;
  z-index: 0;
}

/* ================= 全局基础 & 动态背景 ================= */
.yuemu-love-board-container {
  min-height: 100vh;
  width: 100%;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  color: var(--text-primary);
  padding-bottom: 60px;
  overflow-x: hidden;
  box-sizing: border-box;
  background: transparent;
}

.yuemu-global-romantic-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.yuemu-soft-light {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 192, 203, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(216, 191, 216, 0.15) 0%, transparent 50%);
  animation: yuemu-breathe 10s ease-in-out infinite alternate;
}
@keyframes yuemu-breathe { 0% { opacity: 0.6; } 100% { opacity: 1; } }

.yuemu-floating-hearts { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2;}

@keyframes yuemu-floatUp {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
}

/* ================= 顶部浪漫画卷 (Hero) ================= */
.yuemu-hero-canvas {
  position: relative;
  width: 100%;
  height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 10;
}

.yuemu-hero-bg { position: absolute; inset: 0; z-index: 1; }
.yuemu-hero-img {
  width: 100%; height: 100%; object-fit: cover;
  opacity: 0; transform: scale(1.05); transition: all 1.5s ease;
}
.yuemu-hero-img.yuemu-loaded { opacity: 1; transform: scale(1); }
.yuemu-hero-overlay {
  position: absolute; inset: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
}
.yuemu-hero-gradient-bottom {
  position: absolute; bottom: 0; left: 0; right: 0; height: 150px;
  background: linear-gradient(to top, var(--background), transparent);
}

.yuemu-couple-display {
  position: relative; z-index: 10;
  display: flex; align-items: center; gap: 40px;
  margin-top: -40px;
}
.yuemu-person {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  min-width: 0;
}
.yuemu-avatar-ring {
  width: 110px; height: 110px; border-radius: 50%;
  padding: 4px;
  background: linear-gradient(45deg, #ff9a9e, #fecfef);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  position: relative;
}
.yuemu-woman-ring { background: linear-gradient(45deg, #a18cd1, #fbc2eb); }
.yuemu-avatar-img {
  width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
  border: 3px solid #fff; opacity: 0; transition: opacity 0.5s;
}
.yuemu-avatar-img.yuemu-scale-in { opacity: 1; }

.yuemu-name-text {
  font-size: 22px; font-weight: 700; color: #fff;
  text-shadow: 0 2px 10px rgba(0,0,0,0.4); letter-spacing: 2px;
}

.yuemu-heart-center {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  margin-top: -20px;
}
.yuemu-beating-heart { position: relative; width: 64px; height: 64px; }
.yuemu-heart-svg { width: 100%; height: 100%; animation: yuemu-heartbeat 1.2s infinite; position: relative; z-index: 2; }
.yuemu-heart-glow {
  position: absolute; inset: 0; background: #ff4d4f; border-radius: 50%;
  filter: blur(20px); animation: yuemu-heartbeat 1.2s infinite; opacity: 0.6; z-index: 1;
}
.yuemu-view-pill {
  background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  padding: 6px 14px; border-radius: 20px; color: #fff;
  font-size: 13px; font-weight: 500; border: 1px solid rgba(255,255,255,0.3);
  white-space: nowrap; display: flex; align-items: center; gap: 6px;
}

@keyframes yuemu-heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.15); }
  40% { transform: scale(1); }
  60% { transform: scale(1.15); }
}

.yuemu-hero-actions {
  position: absolute; top: 32px; right: 32px; z-index: 20;
  display: flex; gap: 16px;
}
.yuemu-glass-btn {
  width: 44px; height: 44px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  color: #fff; font-size: 18px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.4);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.3s;
  display: flex; align-items: center; justify-content: center;
}
.yuemu-glass-btn:hover { background: rgba(255,255,255,0.4); transform: scale(1.1); }
.yuemu-pulse-btn { animation: yuemu-subtlePulse 2s infinite; }
@keyframes yuemu-subtlePulse {
  0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
  70% { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

/* ================= 琉璃拟态面板 ================= */
.yuemu-glass-panel {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0,0,0,0.05);
  border-radius: 20px;
}
.dark-theme .yuemu-glass-panel {
  background: rgba(30, 30, 35, 0.6);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

/* ================= 主内容区 ================= */
.yuemu-main-content-wrapper {
  max-width: 1000px; margin: -60px auto 0;
  position: relative; z-index: 10; padding: 0 24px;
}

.yuemu-timing-section {
  display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 40px;
}
.yuemu-timing-card {
  padding: 24px 40px; text-align: center; width: 100%; box-sizing: border-box;
}
.yuemu-timing-label {
  font-size: 16px; color: var(--love-primary, #ff6b9d); font-weight: 600; margin: 0 0 16px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.yuemu-timing-numbers {
  display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;
}
.yuemu-time-block {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.yuemu-num {
  font-size: 28px; font-weight: 800; color: var(--text-primary);
  background: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 12px;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.05);
}
.dark-theme .yuemu-num { background: rgba(0,0,0,0.3); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
.yuemu-unit { font-size: 13px; color: var(--text-secondary); font-weight: 500;}

.yuemu-countdown-pill {
  padding: 12px 24px; border-radius: 30px; display: inline-flex; align-items: center; gap: 8px;
}
.yuemu-countdown-pill .yuemu-icon { color: var(--love-primary, #ff6b9d); font-size: 16px; }
.yuemu-countdown-pill .yuemu-text { font-size: 15px; color: var(--text-primary); font-weight: 500;}
.yuemu-countdown-pill strong { color: var(--love-primary, #ff6b9d); font-size: 16px; }

/* ================= 琉璃导航卡片 ================= */
.yuemu-feature-nav {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;
}
.yuemu-nav-card {
  padding: 20px; display: flex; align-items: center; gap: 16px;
  cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  box-sizing: border-box;
}
.yuemu-nav-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
.dark-theme .yuemu-nav-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
.yuemu-nav-card.yuemu-active { border-color: var(--love-primary, #ff6b9d); background: rgba(255, 107, 157, 0.05); }

.yuemu-icon-box {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; font-size: 22px; color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); flex-shrink: 0;
}
.yuemu-bg-pink { background: linear-gradient(135deg, #ff9a9e, #fecfef); }
.yuemu-bg-purple { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }
.yuemu-bg-blue { background: linear-gradient(135deg, #84fab0, #8fd3f4); }
.yuemu-bg-yellow { background: linear-gradient(135deg, #f6d365, #fda085); }

.yuemu-text-box h3 { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
.yuemu-text-box p { font-size: 12px; color: var(--text-secondary); margin: 0; white-space: nowrap; font-weight: 500;}

/* ================= 动态视图容器 ================= */
.yuemu-view-container { position: relative; min-height: 400px; width: 100%; box-sizing: border-box; }
.yuemu-view-panel {
  opacity: 0; transform: translateY(20px); transition: all 0.5s ease; display: none; width: 100%;
}
.yuemu-view-panel.yuemu-show { opacity: 1; transform: translateY(0); display: block; animation: yuemu-slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);}
@keyframes yuemu-slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

/* ================= 琉璃编辑弹窗 ================= */
.yuemu-glass-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; animation: yuemu-fadeIn 0.2s;
  overflow-x: hidden;
}

.yuemu-glass-modal-content * { box-sizing: border-box; }

.yuemu-glass-modal-content {
  width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; overflow-x: hidden;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  padding: 32px; box-sizing: border-box;
}

.yuemu-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.yuemu-modal-header h2 { font-size: 20px; color: var(--love-primary, #ff6b9d); margin: 0; font-weight: 700; display: flex; align-items: center; gap: 10px;}
.yuemu-close-btn { background: var(--hover-background); border: none; width: 32px; height: 32px; border-radius: 50%; color: var(--text-secondary); cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;}
.yuemu-close-btn:hover { background: var(--border-color); color: var(--text-primary); transform: rotate(90deg);}

.yuemu-romantic-form { display: flex; flex-direction: column; gap: 24px; width: 100%; }
.yuemu-form-group { display: flex; flex-direction: column; gap: 10px; width: 100%; min-width: 0; }
.yuemu-form-group-row { display: flex; gap: 20px; width: 100%; }
.yuemu-half { flex: 1; min-width: 0; }
.yuemu-romantic-form label { font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;}
.yuemu-romantic-form label i { color: var(--text-secondary); }

.yuemu-romantic-form input {
  width: 100%; min-width: 0;
  padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color);
  background: var(--hover-background); color: var(--text-primary); outline: none; transition: 0.2s; font-family: inherit;
}
.yuemu-romantic-form input:focus { border-color: var(--love-primary); background: var(--background); box-shadow: 0 0 0 3px rgba(255,107,157,0.1); }

.yuemu-form-group-partner { position: relative; }
.yuemu-partner-input-wrapper { display: flex; gap: 12px; align-items: center; }
.yuemu-partner-input-wrapper input { flex: 1; }
.yuemu-btn-select-following {
  padding: 0; width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--border-color);
  background: var(--hover-background); color: var(--text-primary); cursor: pointer;
  font-size: 18px; transition: all 0.2s; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
}
.yuemu-btn-select-following:hover { border-color: var(--love-primary); color: var(--love-primary); background: rgba(255,107,157,0.05); }

.yuemu-following-dropdown {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.1);
  max-height: 300px; overflow: hidden; z-index: 100;
  display: flex; flex-direction: column;
}
.dark-theme .yuemu-following-dropdown { box-shadow: 0 12px 32px rgba(0,0,0,0.5); }
.yuemu-dropdown-header {
  padding: 16px 20px; border-bottom: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
  font-weight: 600; color: var(--text-primary);
}
.yuemu-close-dropdown {
  background: none; border: none; font-size: 20px; color: var(--text-secondary);
  cursor: pointer; padding: 0; width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center; transition: 0.2s;
}
.yuemu-close-dropdown:hover { color: var(--love-primary); }
.yuemu-dropdown-loading, .yuemu-dropdown-empty { padding: 32px; text-align: center; color: var(--text-secondary); }
.yuemu-following-list { overflow-y: auto; max-height: 250px; }
.yuemu-following-item {
  padding: 12px 20px; display: flex; align-items: center; gap: 12px;
  cursor: pointer; transition: background 0.2s;
}
.yuemu-following-item:hover { background: var(--hover-background); }
.yuemu-user-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.yuemu-user-info { flex: 1; min-width: 0; }
.yuemu-user-name { font-weight: 600; color: var(--text-primary); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.yuemu-user-id { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.yuemu-select-icon { color: var(--love-primary); font-size: 18px; opacity: 0; transition: opacity 0.2s; }
.yuemu-following-item:hover .yuemu-select-icon { opacity: 1; }
.yuemu-loading-more, .yuemu-no-more { padding: 16px; text-align: center; font-size: 13px; color: var(--text-secondary); }

.yuemu-upload-box {
  width: 100%; border: 2px dashed var(--border-color); border-radius: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  background: var(--hover-background); transition: 0.2s; position: relative;
}
.yuemu-upload-box:hover { border-color: var(--love-primary); background: rgba(255,107,157,0.02); }
.yuemu-upload-box img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-upload-placeholder { text-align: center; color: var(--text-secondary); padding: 16px;}
.yuemu-upload-placeholder .yuemu-icon { font-size: 28px; margin-bottom: 8px; display: block;}
.yuemu-hero-upload { height: 160px; }
.yuemu-avatar-upload { width: 88px; height: 88px; border-radius: 50%; margin: 0 auto 16px; flex-shrink: 0;}

.yuemu-couple-setup {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--hover-background); padding: 24px; border-radius: 20px;
  width: 100%; box-sizing: border-box; border: 1px solid transparent;
}
.yuemu-person-setup { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; }
.yuemu-person-setup input { text-align: center; background: var(--background); }

.yuemu-heart-divider { font-size: 24px; color: var(--love-primary); animation: yuemu-heartbeat 1.2s infinite; margin: 0 20px; margin-top: 20px; flex-shrink: 0;}

.yuemu-custom-switch { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.yuemu-custom-switch input { display: none; }
.yuemu-slider { width: 48px; height: 26px; background: var(--border-color); border-radius: 26px; position: relative; transition: 0.3s; flex-shrink: 0;}
.yuemu-slider:before { content: ''; position: absolute; width: 20px; height: 20px; background: #fff; border-radius: 50%; top: 3px; left: 3px; transition: 0.3s cubic-bezier(0.25, 1, 0.5, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.2);}
.yuemu-custom-switch input:checked + .yuemu-slider { background: var(--love-primary); }
.yuemu-custom-switch input:checked + .yuemu-slider:before { transform: translateX(22px); }
.yuemu-custom-switch .yuemu-text { white-space: nowrap; font-size: 14px; font-weight: 500;}

.yuemu-modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; padding-top: 24px; border-top: 1px solid var(--border-color);}
.yuemu-btn-primary, .yuemu-btn-ghost { padding: 12px 28px; border-radius: 24px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; font-size: 14px;}
.yuemu-btn-primary { background: var(--love-primary); color: #fff; box-shadow: 0 4px 16px rgba(255,107,157,0.3);}
.yuemu-btn-primary:active { transform: scale(0.96); }
.yuemu-btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color);}
.yuemu-btn-ghost:hover { background: var(--hover-background); color: var(--text-primary);}

.yuemu-floating-toast {
  position: fixed; top: 32px; left: 50%; transform: translateX(-50%);
  padding: 14px 28px; border-radius: 30px; color: #fff; font-weight: 600; font-size: 15px;
  z-index: 9999; box-shadow: 0 8px 24px rgba(0,0,0,0.2); animation: yuemu-slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; align-items: center; gap: 10px;
}
.yuemu-toast-success { background: var(--card-background); color: var(--text-primary); border: 1px solid var(--border-color);}
.yuemu-toast-success i { color: #52c41a; font-size: 18px;}
.yuemu-toast-error { background: #ff4d4f; }
.yuemu-toast-info { background: #1677ff; }
@keyframes yuemu-slideDown { from { top: -50px; opacity: 0; } to { top: 32px; opacity: 1; } }

.yuemu-no-permission-overlay {
  position: fixed; inset: 0; background: var(--background);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.yuemu-lock-card { padding: 48px; text-align: center; max-width: 400px; width: 90%; }
.yuemu-lock-card h2 { font-size: 24px; margin: 16px 0 8px; color: var(--text-primary);}
.yuemu-lock-card p { color: var(--text-secondary); margin-bottom: 32px; }
.yuemu-lock-icon { font-size: 64px; color: var(--border-color);}
.yuemu-heartbeat { animation: yuemu-heartbeat 2s infinite; }

/* ================= 移动端极致适配 ================= */
@media (max-width: 768px) {
  .yuemu-hero-canvas { height: 380px; }
  .yuemu-couple-display { gap: 16px; margin-top: -20px; }
  .yuemu-avatar-ring { width: 84px; height: 84px; }
  .yuemu-name-text { font-size: 16px; }
  .yuemu-beating-heart { width: 52px; height: 52px; }
  .yuemu-view-pill { font-size: 12px; padding: 4px 10px; }

  .yuemu-hero-actions { top: 16px; right: 16px; gap: 10px;}
  .yuemu-glass-btn { width: 38px; height: 38px; font-size: 15px;}

  .yuemu-main-content-wrapper { padding: 0 16px; margin-top: -40px; }
  .yuemu-timing-card { padding: 24px 16px; }
  .yuemu-time-block .yuemu-num { font-size: 22px; padding: 6px 14px; }

  .yuemu-feature-nav { grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;}
  .yuemu-nav-card { padding: 16px; flex-direction: column; text-align: center; gap: 10px; border-radius: 20px;}
  .yuemu-icon-box { width: 44px; height: 44px; font-size: 20px; margin: 0 auto; }
  .yuemu-text-box h3 { font-size: 15px; }
  .yuemu-text-box p { display: none; }

  .yuemu-glass-modal-overlay { align-items: flex-end; }
  .yuemu-glass-modal-content {
    width: 100vw !important; max-width: 100vw !important; max-height: 85vh;
    border-radius: 28px 28px 0 0; border-bottom: none; border-left: none; border-right: none;
    margin: 0; padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
    animation: yuemu-slideUpSheet 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .yuemu-modal-header { padding-bottom: 16px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;}
  .yuemu-modal-header h2 { font-size: 18px; }

  .yuemu-form-group-row { flex-direction: column; gap: 20px; }
  .yuemu-couple-setup { padding: 20px 16px; gap: 8px;}
  .yuemu-heart-divider { margin: 0 8px; font-size: 20px;}
  .yuemu-romantic-form input { padding: 12px 14px; font-size: 14px; }
}

@keyframes yuemu-slideUpSheet {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
