<template>
  <div id="usersDetailPage" ref="pageRef" class="page-wrapper">
    <div class="top-nav">
      <div class="nav-btn" @click="goBack">
        <i class="fas fa-arrow-left"></i>
      </div>
      <div class="top-nav__right">
        <div class="nav-btn" v-if="showActionButtons" @click="showReportModal" :title="$t('pages.userDetailPage.report')">
          <i class="fas fa-flag"></i>
        </div>
        <div class="nav-btn" @click="handleShare" :title="$t('pages.userDetailPage.shareTitle')">
          <i class="fas fa-share-alt"></i>
        </div>
      </div>
    </div>

    <div class="profile-container">
      <div class="banner-section">
        <img :src="userHomepageBg" :alt="$t('pages.userDetailPage.bgTitle')" class="banner-img" />
        <div class="banner-mask"></div>
      </div>

      <div class="info-card">
        <div class="profile-main-top">
          <div class="avatar-wrapper">
            <img :src="userInfo.userAvatar || getDefaultAvatar(userInfo.userName)" :alt="$t('pages.userDetailPage.avatarTitle')" />
          </div>

          
        </div>

        <div class="user-profile-info">
          <div class="user-name-row">
            <h1 class="user-name">{{ userInfo.userName }}</h1>
            <img v-if="userInfo.memberType === 1" :src="proIcon" class="member-icon clickable-badge" :alt="t('pages.userDetailPage.roles.pro', 'Pro会员')" :title="t('pages.userDetailPage.roles.pro', 'Pro会员')" @click.stop="openMemberModal" />
            <img v-if="userInfo.memberType === 2" :src="plusIcon" class="member-icon clickable-badge" :alt="t('pages.userDetailPage.roles.plus', 'Plus会员')" :title="t('pages.userDetailPage.roles.plus', 'Plus会员')" @click.stop="openMemberModal" />
            <span v-if="userRoleBadge" class="role-badge" :class="userRoleBadge.class">
              <i :class="userRoleBadge.icon"></i>
              <span>{{ userRoleBadge.text }}</span>
            </span>
          </div>
          <div class="user-id">
            <span>{{ $t('pages.userDetailPage.stats.yuemuId') }} {{ userInfo.id }}</span>
            <i class="fas fa-copy copy-icon" :class="{ 'success': copySuccess }" @click="copyUserId"></i>
          </div>
        </div>

        <div class="user-stats">
          <div class="stat-box" @click="goToFollowList('follow')">
            <span class="stat-num">{{ followCount || 0 }}</span>
            <span class="stat-label">{{ $t('pages.userDetailPage.follow') }}</span>
          </div>
          <div class="stat-box" @click="goToFollowList('fans')">
            <span class="stat-num">{{ fansCount || 0 }}</span>
            <span class="stat-label">{{ $t('pages.userDetailPage.stats.followers') }}</span>
          </div>
        </div>

<div class="action-group-modern" v-if="showActionButtons">
            <button class="btn-outline-modern" @click="startPrivateChat" :disabled="!canPrivateChat">
              {{ $t('pages.userDetailPage.chat') }}
            </button>
            <button
              :class="['btn-solid-modern', isFollowing ? 'btn-followed-modern' : 'btn-primary-modern']"
              :disabled="!canFollow || followLoading"
              @click="toggleFollow"
            >
              <i v-if="followLoading" class="fas fa-spinner fa-spin"></i>
              <span v-else>{{ isFollowing ? $t('pages.userDetailPage.following') : $t('pages.userDetailPage.follow') }}</span>
            </button>
          </div>


        <div class="user-intro" v-if="userInfo.userProfile || userInfo.personalSign || userInfo.region || userInfo.userTags">
          <p class="bio-text" v-if="userInfo.userProfile">{{ userInfo.userProfile }}</p>
          <p class="bio-text" v-if="userInfo.personalSign">{{ userInfo.personalSign }}</p>

          <div class="tags-container">
            <span class="tag-pill" v-if="userInfo.region">
              <i class="fas fa-map-marker-alt"></i> {{ userInfo.region }}
            </span>
            <span class="tag-pill" v-if="userInfo.gender || userInfo.birthday">
              <i :class="userInfo.gender === t('pages.userDetailPage.stats.male') ? 'fas fa-mars' : (userInfo.gender === t('pages.userDetailPage.stats.female') ? 'fas fa-venus' : 'fas fa-user')"></i>
              {{ formatGenderAndAge(userInfo.gender, userInfo.birthday) }}
            </span>
            <span class="tag-pill" v-for="tag in parseUserTags(userInfo.userTags)" :key="tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <div class="content-tabs">
        <div class="tab-item" :class="{ active: activeTab === 'pictures' }" @click="activeTab = 'pictures'">
          <span class="tab-text">{{ $t('pages.userDetailPage.tabs.pictures') }}</span>
          <span class="tab-count" v-if="pictureTotal > 0">{{ pictureTotal }}</span>
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
          <span class="tab-text">{{ $t('pages.userDetailPage.tabs.posts') }}</span>
          <span class="tab-count" v-if="postTotal > 0">{{ postTotal }}</span>
        </div>
      </div>

      <div class="content-area" ref="contentAreaRef">
        <div v-show="activeTab === 'pictures'" class="list-section">
          <WaterfallPictureList v-if="device === DEVICE_TYPE_ENUM.PC" :dataList="pictureList" :loading="loading" :onLoadMore="loadMorePictures" />
          <div v-else>
            <BigPictureList :dataList="pictureList" :loading="loading" />
            <div class="loading-state" v-if="pictureList.length > 0 && (loading || isLoadingMore)">
              <van-loading size="20px">{{ $t('pages.userDetailPage.loading') }}</van-loading>
            </div>
          </div>
        </div>
        <div v-show="activeTab === 'posts'" class="list-section">
          <PostList :dataList="postList" :loading="postLoading" :showStatus="false" />
          <div class="loading-state" v-if="postList.length > 0 && (postLoading || isLoadingMore)">
            <van-loading size="20px">{{ $t('pages.userDetailPage.loading') }}</van-loading>
          </div>
        </div>
      </div>
    </div>

    <ShareModal ref="shareModalRef" :title="t('pages.userDetailPage.shareTitle')" :link="userHomeLink" :image-url="getImageUrlForShare()" :user="userInfo" :create-time="userInfo.createTime" />
    <ReportModal ref="reportModalRef" :open="reportModalVisible" :target-id="String(userInfo.id)" target-type="4" @update:open="handleReportModalChange" @success="handleReportSuccess" />
    <MemberDetailModal ref="memberDetailModalRef" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, computed, watch, onUnmounted, nextTick, onActivated, onDeactivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import dayjs from 'dayjs'
import { getDefaultAvatar } from '@/utils/userUtils'
import { message } from 'ant-design-vue'
import { createOrUpdatePrivateChatUsingPost } from '@/api/privateChatController'
import { getFollowAndFansCountUsingPost, addUserFollowsUsingPost, findIsFollowUsingPost } from '@/api/userFollowsController'
import { getFollowOrFanPictureUsingPost } from '@/api/userFollowsController'
import WaterfallPictureList from '@/components/WaterfallPictureList.vue'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import BigPictureList from '@/components/BigPictureList.vue'
import { listPostByPageUsingPost } from '@/api/postController'
import PostList from '@/components/PostList.vue'
import { getUserPublicInfoUsingGet } from '@/api/userController'
import ShareModal from '@/components/ShareModal.vue'
import ReportModal from '@/components/ReportModal.vue'
import plusIcon from '@/assets/icons/plus.svg'
import proIcon from '@/assets/icons/pro.svg'
import MemberDetailModal from '@/components/MemberDetailModal.vue'

defineOptions({
  name: 'UserDetail'
})

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const device = ref<string>('')
const activeTab = ref('pictures')
const postList = ref<API.Post[]>([])
const postTotal = ref(0)
const postLoading = ref(false)
const pictureTotal = ref(0)
const postPagination = ref({ current: 1, pageSize: 8 })
const isEndOfData = ref(false)
const isLoadingMore = ref(false)

const memberDetailModalRef = ref<any>(null)
const openMemberModal = () => {
  if (userInfo.value.id && memberDetailModalRef.value) {
    memberDetailModalRef.value.open(userInfo.value)
  }
}
const copySuccess = ref(false)
const savedScrollPosition = ref(0)
const isPageActive = ref(true)
const currentUserId = ref(String(route.params.id))
const contentAreaRef = ref<HTMLElement | null>(null)
let scrollHandler: any = null
const shareModalRef = ref<any>(null)
const reportModalRef = ref<any>(null)
const reportModalVisible = ref(false)
const pageRef = ref<HTMLElement | null>(null)

const checkScrollBottom = () => {
  const scrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop)
  const windowHeight = window.innerHeight
  const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
  const threshold = 100
  if (documentHeight - (scrollTop + windowHeight) < threshold) {
    if (activeTab.value === 'pictures' && !loading.value && !isEndOfData.value) handleAutoLoad()
    else if (activeTab.value === 'posts' && !postLoading.value) handleAutoLoadPosts()
  }
}

const handleAutoLoad = async () => {
  if (loading.value || isEndOfData.value || isLoadingMore.value) return
  isLoadingMore.value = true
  const nextPage = currentPage.value + 1
  const maxPage = Math.ceil(total.value / pageSize)
  if (nextPage <= maxPage) { currentPage.value = nextPage; await loadPictureData(); }
  isLoadingMore.value = false
}

const handleAutoLoadPosts = async () => {
  if (postLoading.value || isLoadingMore.value) return
  isLoadingMore.value = true
  const nextPage = postPagination.value.current + 1
  const maxPage = Math.ceil(postTotal.value / postPagination.value.pageSize)
  if (nextPage <= maxPage) { postPagination.value.current = nextPage; await loadPostData(); }
  isLoadingMore.value = false
}

const goBack = () => router.go(-1)
const handleShare = () => {
  if (!loginUserStore.loginUser?.id) { message.warning(t('pages.userDetailPage.msgs.loginFirst')); return }
  shareModalRef.value?.openModal()
}
const userHomeLink = computed(() => {
  const user = userInfo.value || {}
  const href = router.resolve({ path: `/user/${user.id}` }).href
  return `${window.location.origin}${href}`
})
const getImageUrlForShare = () => {
  if (userInfo.value?.homepageBg) return userInfo.value.homepageBg;
  return userInfo.value?.userAvatar || getDefaultAvatar(userInfo.value.userName);
}

onMounted(async () => {
  // 核心修复 1：组件首次挂载时，强制将浏览器滚动条置顶，消除从其他页面带来的滚动惯性
  window.scrollTo({ top: 0, behavior: 'instant' })

  device.value = await getDeviceType()
  await Promise.all([getUserPublicInfo(), getFollowAndFansCount(), checkIsFollowing(), loadPictureData(), loadPostData()])
  nextTick(() => { setupScrollListener() })
})

onUnmounted(() => { removeScrollListener() })

onActivated(() => {
  isPageActive.value = true

  // 核心修复 2：判断如果带来的 route id 和当前记录的不一致（说明进了一个新用户的主页）
  if (route.params.id && String(route.params.id) !== currentUserId.value) {
    savedScrollPosition.value = 0 // 废弃之前用户的滚动记录
    window.scrollTo({ top: 0, behavior: 'instant' }) // 强行置顶
  } else {
    // 是同一个用户，正常恢复滚动位置
    nextTick(() => { window.scrollTo({ top: savedScrollPosition.value, behavior: 'instant' }) })
  }

  setupScrollListener()
})

onDeactivated(() => {
  isPageActive.value = false
  savedScrollPosition.value = window.pageYOffset || document.documentElement.scrollTop
  removeScrollListener()
})

watch(activeTab, () => { window.scrollTo({ top: 0, behavior: 'smooth' }) })

watch(() => route.params.id, async (newId) => {
  if (newId && String(newId) !== currentUserId.value && route.name === 'UserDetail') {
    currentUserId.value = String(newId)
    userInfo.value = { id: String(newId), allowPrivateChat: 1, allowFollow: 1, showFollowList: 1, showFansList: 1 } as any
    pictureList.value = []
    postList.value = []
    currentPage.value = 1
    postPagination.value = { current: 1, pageSize: 8 }
    isEndOfData.value = false
    activeTab.value = 'pictures'

    // 核心修复 3：新用户加载前，同步清零并置顶
    savedScrollPosition.value = 0
    window.scrollTo({ top: 0, behavior: 'instant' })

    await Promise.all([ getUserPublicInfo(), getFollowAndFansCount(), checkIsFollowing(), loadPictureData(), loadPostData() ])
  }
})

const userInfo = ref<API.UserPublicVO>({ id: String(route.params.id), allowPrivateChat: 1, allowFollow: 1, showFollowList: 1, showFansList: 1 } as any)
const userHomepageBg = computed(() => userInfo.value.homepageBg || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')
const formatGenderAndAge = (gender: any, birthday: any) => {
  if (!birthday) return gender || '';
  const age = new Date().getFullYear() - new Date(birthday).getFullYear();
  return `${gender || ''} ${t('pages.userDetailPage.stats.age', { age })}`;
};
const parseUserTags = (tagsStr: any) => tagsStr ? tagsStr.split(/[;,，；]/).filter((t: any) => t.trim() !== '') : [];
const followCount = ref(0), fansCount = ref(0), isFollowing = ref(false), followLoading = ref(false);
const isOwner = computed(() => loginUserStore.loginUser?.id && String(loginUserStore.loginUser.id) === String(userInfo.value.id))
const canPrivateChat = computed(() => userInfo.value.allowPrivateChat && !isOwner.value)
const canFollow = computed(() => userInfo.value.allowFollow && !isOwner.value)
const canShowFollowList = computed(() => isOwner.value || !!userInfo.value.showFollowList)
const canShowFansList = computed(() => isOwner.value || !!userInfo.value.showFansList)
const showActionButtons = computed(() => loginUserStore.loginUser?.id && !isOwner.value)

// 用户角色徽标
const userRoleBadge = computed(() => {
  const role = userInfo.value.userRole
  if (role === 'admin') {
    return {
      text: t('pages.userDetailPage.roles.admin'),
      icon: 'fas fa-shield-alt',
      class: 'badge-admin'
    }
  } else if (role === 'bot') {
    return {
      text: t('pages.userDetailPage.roles.bot'),
      icon: 'fas fa-robot',
      class: 'badge-bot'
    }
  }
  return null
})

const getFollowAndFansCount = async () => {
  const res = await getFollowAndFansCountUsingPost({ id: userInfo.value.id })
  if (res.data.code === 0) { followCount.value = res.data.data.followCount || 0; fansCount.value = res.data.data.fansCount || 0; }
}
const checkIsFollowing = async () => {
  const res = await findIsFollowUsingPost({ followerId: String(loginUserStore.loginUser?.id), followingId: String(userInfo.value.id) })
  if (res.data?.code === 0) isFollowing.value = res.data.data
}
const toggleFollow = async () => {
  if (followLoading.value) return; followLoading.value = true
  try {
    const res = await addUserFollowsUsingPost({
      followerId: String(loginUserStore.loginUser.id), followingId: String(userInfo.value.id),
      followingName: userInfo.value.userName, followerName: loginUserStore.loginUser.userName,
      followStatus: isFollowing.value ? 0 : 1
    })
    if (res.data?.code === 0) { isFollowing.value = !isFollowing.value; message.success(isFollowing.value ? t('pages.userDetailPage.msgs.followSuccess') : t('pages.userDetailPage.msgs.unfollowSuccess')); getFollowAndFansCount(); }
  } finally { followLoading.value = false }
}
const goToFollowList = (type: string) => {
  if (type === 'follow' && !canShowFollowList.value) {
    message.info(t('pages.userDetailPage.msgs.privateFollow'))
    return
  }
  if (type === 'fans' && !canShowFansList.value) {
    message.info(t('pages.userDetailPage.msgs.privateFans'))
    return
  }
  router.push({ name: 'FollowList', query: { type, userId: userInfo.value.id, userName: userInfo.value.userName, userAvatar: userInfo.value.userAvatar } })
}

const pictureList = ref<API.PictureVO[]>([]), loading = ref(false), currentPage = ref(1), total = ref(0), pageSize = 12;
const loadPictureData = async () => {
  if (currentPage.value === 1) loading.value = true
  const res = await getFollowOrFanPictureUsingPost({ userId: String(userInfo.value.id), current: currentPage.value, pageSize: pageSize, sortField: 'createTime', sortOrder: 'descend' })
  if (res.data?.code === 0) {
    const newRecords = (res.data.data.records || []).map((item: any) => ({ ...item, loaded: true }));
    pictureList.value = currentPage.value === 1 ? newRecords : [...pictureList.value, ...newRecords];
    total.value = res.data.data.total || 0; pictureTotal.value = total.value;
    isEndOfData.value = !newRecords.length || newRecords.length < pageSize;
  }
  loading.value = false; isLoadingMore.value = false;
}
const loadMorePictures = async (nextPage: number) => { currentPage.value = nextPage; await loadPictureData(); return true; }

const loadPostData = async () => {
  if (postPagination.value.current === 1) postLoading.value = true
  const res = await listPostByPageUsingPost({ userId: userInfo.value.id, current: postPagination.value.current, pageSize: postPagination.value.pageSize, status: 1 })
  if (res.data?.code === 0) {
    const newRecords = res.data.data.records || [];
    postList.value = postPagination.value.current === 1 ? newRecords : [...postList.value, ...newRecords];
    postTotal.value = res.data.data.total || 0;
  }
  postLoading.value = false; isLoadingMore.value = false;
}
const getUserPublicInfo = async () => {
  const res = await getUserPublicInfoUsingGet({ userId: String(route.params.id) })
  if (res.data?.code === 0 && res.data.data) Object.assign(userInfo.value, res.data.data)
}
const startPrivateChat = async () => {
  const res = await createOrUpdatePrivateChatUsingPost({ targetUserId: userInfo.value.id, lastMessage: t('pages.userDetailPage.chatBtn') })
  if (res.data?.code === 0) router.push({ name: 'PrivateChat', params: { userId: userInfo.value.id }, query: { privateChatId: res.data.data.id, userName: userInfo.value.userName, userAvatar: userInfo.value.userAvatar, isSender: 'true' } })
}

const setupScrollListener = () => { removeScrollListener(); scrollHandler = () => requestAnimationFrame(checkScrollBottom); window.addEventListener('scroll', scrollHandler, { passive: true }) }
const removeScrollListener = () => { if (scrollHandler) window.removeEventListener('scroll', scrollHandler) }
const copyUserId = async () => { await navigator.clipboard.writeText(userInfo.value.id); copySuccess.value = true; message.success(t('pages.userDetailPage.msgs.copySuccess')); setTimeout(() => copySuccess.value = false, 2000) }
const showReportModal = () => reportModalVisible.value = true
const handleReportModalChange = (val: boolean) => reportModalVisible.value = val
const handleReportSuccess = () => { message.success(t('pages.userDetailPage.msgs.reportSuccess')); reportModalVisible.value = false }
</script>

<style scoped>
/* 所有样式完全保留，这里就不重复赘述，请放心使用你原来的这部分 CSS */
.page-wrapper {
  min-height: 100vh;
  background: var(--card-background, #ffffff);
}
.dark-theme .page-wrapper { background: #1e293b; }

.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  background: var(--card-background, #ffffff);
}
.dark-theme .profile-container { background: #1e293b; }

@media (min-width: 768px) {
  .profile-container {
    margin-top: 16px; margin-bottom: 24px;
    border-radius: 24px; overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  }
}

.top-nav {
  position: absolute;
  top: 0; left: 0; width: 100%;
  height: 60px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; z-index: 100;
  box-sizing: border-box;
  pointer-events: none;
}

.nav-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; pointer-events: auto;
  transition: all 0.3s ease;
}
.nav-btn i { font-size: 15px; }
.nav-btn:active { transform: scale(0.9); background: rgba(0, 0, 0, 0.4); }

.top-nav__right { display: flex; align-items: center; pointer-events: none; }

@media (min-width: 768px) {
  .top-nav { max-width: 1000px; left: 50%; transform: translateX(-50%); padding: 0 20px; margin-top: 84px; }
}

.banner-section {
  position: relative; width: 100%; height: 160px;
}
@media (min-width: 768px) { .banner-section { height: 220px; } }
.banner-img { width: 100%; height: 100%; object-fit: cover; }
.banner-mask {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%);
}

.info-card {
  position: relative;
  padding: 0 20px 8px;
  background: var(--card-background, #ffffff);
  z-index: 10;
}
.dark-theme .info-card { background: #1e293b; }

.profile-main-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  transform: translateY(-44px);
  margin-bottom: -32px;
}

.avatar-wrapper {
  width: 88px; height: 88px; flex-shrink: 0;
  border-radius: 50%;
  padding: 4px;
  background: var(--card-background, #ffffff);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.dark-theme .avatar-wrapper { background: #1e293b; }
.avatar-wrapper img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
}

.btn-icon {
  width: 36px; height: 36px; flex-shrink: 0;
  border-radius: 50%; border: none;
  background: #f1f5f9; color: #64748b;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s;
}
.dark-theme .btn-icon { background: #334155; color: #cbd5e1; }
.btn-icon:active { transform: scale(0.95); }

.btn-outline, .btn-solid {
  height: 36px;
  border-radius: 18px;
  font-weight: 600; font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s; white-space: nowrap;
}

.btn-outline {
  padding: 0 16px;
  border: 1px solid #e2e8f0; background: transparent;
  color: var(--text-primary, #0f172a);
}
.dark-theme .btn-outline { border-color: #475569; color: #f8fafc; }
.btn-outline:active { background: #f8fafc; }
.dark-theme .btn-outline:active { background: #334155; }

.btn-solid { padding: 0 20px; border: none; color: #fff; }
.btn-primary { background: #2563eb; }
.btn-primary:active { background: #1d4ed8; transform: scale(0.98); }
.btn-followed { background: #f1f5f9; color: #64748b; }
.dark-theme .btn-followed { background: #334155; color: #94a3b8; }

.user-profile-info { margin-bottom: 12px; }

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.user-name {
  font-size: 24px; font-weight: 800; color: var(--text-primary, #0f172a);
  margin: 0; line-height: 1.3;
  word-break: break-word;
}
.dark-theme .user-name { color: #f8fafc; }

.member-icon {
  height: 28px;
  width: auto;
  flex-shrink: 0;
  vertical-align: text-bottom;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.role-badge i {
  font-size: 11px;
}

.badge-admin {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge-bot {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.dark-theme .badge-admin {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.dark-theme .badge-bot {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.user-id {
  font-size: 12px; color: #64748b;
  display: flex; align-items: center; gap: 6px;
}
.copy-icon { cursor: pointer; padding: 4px; color: #94a3b8; transition: color 0.2s; }
.copy-icon:active { transform: scale(0.9); }
.copy-icon.success { color: #10b981; }

.user-stats { display: flex; gap: 24px; margin-bottom: 16px; }
.stat-box { display: flex; align-items: baseline; gap: 6px; cursor: pointer; }
.stat-num { font-size: 15px; font-weight: 700; color: var(--text-primary, #0f172a); }
.dark-theme .stat-num { color: #f8fafc; }
.stat-label { font-size: 13px; color: #64748b; }
.stat-box.disabled { cursor: default; opacity: 0.8; }

.user-intro { margin-bottom: 8px; }
.bio-text { font-size: 14px; color: #475569; margin: 0; line-height: 1.5; }
.dark-theme .bio-text { color: #cbd5e1; }

.tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-pill {
  padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
  background: var(--search-btn-bg, #f1f5f9); color: var(--text-secondary, #64748b);
  display: flex; align-items: center; gap: 4px;
}
.dark-theme .tag-pill { background: #1e293b; color: #94a3b8; }

.content-tabs {
  display: flex; position: sticky; top: 0;
  background: var(--card-background, #ffffff); z-index: 50;
  border-bottom: 1px solid rgba(0,0,0,0.06); padding: 0 20px;
}
.dark-theme .content-tabs { background: #1e293b; border-color: rgba(255,255,255,0.05); }

.tab-item {
  position: relative; padding: 14px 0; margin-right: 32px;
  font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer;
  display: flex; align-items: center; gap: 4px; transition: color 0.2s;
}
.dark-theme .tab-item { color: #94a3b8; }
.tab-item.active { color: var(--text-primary, #0f172a); }
.dark-theme .tab-item.active { color: #f8fafc; }

.tab-item.active::after {
  content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px;
  background: #2563eb; border-radius: 3px 3px 0 0;
}
.tab-count { font-size: 12px; font-weight: 500; background: #f1f5f9; padding: 2px 6px; border-radius: 10px; }
.dark-theme .tab-count { background: #334155; }
.tab-item.active .tab-count { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
.dark-theme .tab-item.active .tab-count { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

.content-area { padding: 12px 4px; min-height: 50vh; margin-bottom: 64px;}
.loading-state { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; }

@media (max-width: 350px) {
  .action-group { gap: 6px; }
  .btn-outline, .btn-solid { padding: 0 12px; font-size: 13px; }
  .avatar-wrapper { width: 72px; height: 72px; }
}

.action-group-modern {
  display: flex; gap: 12px; margin-top: 0; margin-bottom: 14px;
}
.btn-outline-modern, .btn-solid-modern {
  flex: 1; height: 40px; border-radius: 20px; font-weight: 600; font-size: 15px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
}
.btn-outline-modern { background: var(--card-background); border: 1px solid #2563eb; color: #2563eb; }
.dark-theme .btn-outline-modern { border-color: #3b82f6; color: #3b82f6; }
.btn-solid-modern { border: none; color: #fff; }
.btn-primary-modern { background: #2563eb; }
.btn-followed-modern { background: #f1f5f9; color: #64748b; }
.dark-theme .btn-followed-modern { background: #334155; color: #94a3b8; }
.btn-outline-modern:active, .btn-solid-modern:active { transform: scale(0.97); opacity: 0.9; }

.user-stats { gap: 16px; margin-bottom: 14px; }

.top-nav .nav-btn { margin-left: 12px; }

</style>
