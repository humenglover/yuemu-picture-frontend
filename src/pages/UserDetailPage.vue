<template>
  <div id="userDetailPage">
    <div class="page-content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-info">
          <van-image
            :src="userInfo.userAvatar || getDefaultAvatar(userInfo.userName)"
            round
            width="64"
            height="64"
            class="avatar"
          />
          <div class="user-detail">
            <div class="username">{{ userInfo.userName }}</div>
            <div class="user-meta">
              <div class="user-id">ID: {{ userInfo.id }}</div>
              <div class="account">账号: {{ userInfo.userAccount }}</div>
              <div class="create-time">加入时间: {{ formatDate(userInfo.createTime) }}</div>
            </div>
          </div>
        </div>
        <div class="user-actions">
          <div class="stats-wrapper">
            <div class="stat-item" @click="goToFollowList('follow')">
              <span class="count">{{ followCount }}</span>
              <span class="label">关注</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" @click="goToFollowList('fans')">
              <span class="count">{{ fansCount }}</span>
              <span class="label">粉丝</span>
            </div>
          </div>
          <div class="follow-button" v-if="showFollowButton">
            <van-button
              round
              size="small"
              :type="isFollowing ? 'default' : 'primary'"
              :loading="followLoading"
              @click="toggleFollow"
            >
              {{ isFollowing ? '已关注' : '关注' }}
            </van-button>
          </div>
        </div>
      </div>
      <!-- PC用户发布的图片列表 -->
      <div class="pictures-section" v-if="device === DEVICE_TYPE_ENUM.PC">
        <div class="section-header">
          <h3 class="section-title">发布的图片</h3>
          <span class="picture-count" v-if="total > 0">共 {{ total }} 张</span>
        </div>
        <div class="picture-list-container">
          <div class="picture-list-wrapper">
            <WaterfallPictureList
              v-if="device === DEVICE_TYPE_ENUM.PC"
              :dataList="pictureList"
              :loading="loading"
              :onLoadMore="loadMorePictures"
            />
            <MobilePictureList
              v-else
              :dataList="pictureList"
              :loading="loading"
            />
          </div>
          <!-- 空状态 -->
             <div v-if="!loading && pictureList.length === 0" class="empty-state">
            <van-empty
              image="search"
              description="暂无图片"
            />
          </div>
          </div>
        </div>
      </div>
    <!-- 移动用户发布的图片列表 -->
    <div class="pictures-section" v-if="device!==DEVICE_TYPE_ENUM.PC">
      <div class="section-header">
        <h3 class="section-title">发布的图片</h3>
        <span class="picture-count" v-if="total > 0">共 {{ total }} 张</span>
      </div>
      <div class="picture-list-container" style="margin-right: -24px; margin-left: -24px;">
        <div class="picture-list-wrapper">
          <MobilePictureList
            :dataList="pictureList"
            :loading="loading"
          />
          <!-- 分页器 -->
          <div  v-if="total > 0">
            <van-pagination
              v-model="currentPage"
              :total-items="total"
              :items-per-page="pageSize"
              :show-page-size="5"
              force-ellipses
              prev-text="<"
              next-text=">"
              @change="handlePageChange"
            />
          </div>
        </div>
        <!-- 空状态 -->
        <div v-if="!loading && pictureList.length === 0" class="empty-state">
          <van-empty
            image="search"
            description="暂无图片"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import dayjs from 'dayjs'
import { getDefaultAvatar } from '@/utils/userUtils'
import { message } from 'ant-design-vue'
import { getFollowAndFansCountUsingPost, addUserFollowsUsingPost, findIsFollowUsingPost } from '@/api/userFollowsController'
import { getFollowOrFanPictureUsingPost } from '@/api/userFollowsController'
import WaterfallPictureList from '@/components/WaterfallPictureList.vue'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import MobilePictureList from '@/components/MobilePictureList.vue'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const device = ref<string>('')
// 页面加载时获取设备类型并获取数据
onMounted(async () => {
  device.value = await getDeviceType()
  // console.log(route.params)
})
// 处理页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadPictureData()
}

// 初始化用户信息
const userInfo = ref<API.UserVO>({
  id: route.params.id as string,
  userName: route.query.userName as string,
  userAvatar: route.query.userAvatar as string,
  userAccount: route.query.userAccount as string,
  userProfile: route.query.userProfile as string,
  userRole: route.query.userRole as string,
  createTime: route.query.createTime as string
})

const followCount = ref(0)
const fansCount = ref(0)
const isFollowing = ref(false)
const followLoading = ref(false)

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 格式化角色
const formatRole = (role: string) => {
  const roleMap: Record<string, string> = {
    user: '普通用户',
    admin: '管理员',
    ban: '封禁用户'
  }
  return roleMap[role] || role
}

// 是否显示关注按钮
const showFollowButton = computed(() => {
  return loginUserStore.loginUser?.id && loginUserStore.loginUser?.id !== userInfo.value.id
})

// 获取关注和粉丝数
const getFollowAndFansCount = async () => {
  try {
    const userId = route.params.id
    const res = await getFollowAndFansCountUsingPost({ id: userId })
    if (res.data.code === 0) {
      const { followCount: fc, fansCount: fs } = res.data.data
      followCount.value = fc || 0
      fansCount.value = fs || 0
    }
  } catch (error) {
    console.error('获取关注粉丝数失败:', error)
    message.error('获取关注粉丝数失败')
  }
}

// 检查是否已关注
const checkIsFollowing = async () => {
  try {
    const res = await findIsFollowUsingPost({
      followerId: String(loginUserStore.loginUser?.id),
      followingId: String(userInfo.value.id)
    })
    if (res.data?.code === 0) {
      isFollowing.value = res.data.data
    }
  } catch (error) {
    console.error('检查关注状态失败:', error)
  }
}

// 关注/取消关注
const toggleFollow = async () => {
  if (followLoading.value) return
  followLoading.value = true

  try {
    const res = await addUserFollowsUsingPost({
      followerId: String(loginUserStore.loginUser.id),
      followingId: String(userInfo.value.id),
      followingName: userInfo.value.userName,
      followerName: loginUserStore.loginUser.userName,
      followStatus: isFollowing.value ? 0 : 1
    })

    if (res.data?.code === 0) {
      isFollowing.value = !isFollowing.value
      message.success(isFollowing.value ? '关注成功' : '已取消关注')
      await getFollowAndFansCount()
    }
  } catch (error) {
    console.error('操作失败:', error)
    message.error('操作失败，请稍后重试')
  } finally {
    followLoading.value = false
  }
}

// 跳转到关注/粉丝列表
const goToFollowList = (type: 'follow' | 'fans') => {
  router.push({
    path: '/follow-list',
    query: {
      userId: userInfo.value.id,
      tab: type,
      userName: userInfo.value.userName,
      userAvatar: userInfo.value.userAvatar
    }
  })
}

// 图片列表相关
const pictureList = ref<API.PictureVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const total = ref(0)
const pageSize = 12
const isEndOfData = ref(false)

// 加载图片数据
const loadPictureData = async () => {
  loading.value = true
  try {
    const res = await getFollowOrFanPictureUsingPost({
      userId: String(userInfo.value.id),
      current: currentPage.value,
      pageSize: pageSize,
      sortField: 'createTime',
      sortOrder: 'descend'
    })

    if (res.data?.code === 0) {
      if (currentPage.value === 1) {
        pictureList.value = res.data.data.records || []
      } else {
        pictureList.value = [...pictureList.value, ...(res.data.data.records || [])]
      }
      total.value = res.data.data.total || 0
      isEndOfData.value = !res.data.data.records || res.data.data.records.length < pageSize
    }
  } catch (error) {
    console.error('获取图片列表失败:', error)
    message.error('获取图片列表失败')
  } finally {
    loading.value = false
  }
}

// 加载更多图片
const loadMorePictures = async (nextPage: number) => {
  if (isEndOfData.value) return false

  try {
    currentPage.value = nextPage
    const res = await getFollowOrFanPictureUsingPost({
      userId: String(userInfo.value.id),
      current: nextPage,
      pageSize: pageSize,
      sortField: 'createTime',
      sortOrder: 'descend'
    })

    if (res.data?.code === 0) {
      const newData = res.data.data.records || []
      if (newData.length > 0) {
        pictureList.value = [...pictureList.value, ...newData]
        total.value = res.data.data.total || 0
        return true
      } else {
        isEndOfData.value = true
      }
    }
    return false
  } catch (error) {
    console.error('加载更多图片失败:', error)
    return false
  }
}

onMounted(async () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning('请先登录')
    router.replace('/user/login')
    return
  }

  // 并行获取数据
  await Promise.all([
    getFollowAndFansCount(),
    checkIsFollowing(),
    loadPictureData()
  ])
})

// 监听路由参数变化，重新获取数据
watch(() => route.params.id, async (newId) => {
  if (newId) {
    currentPage.value = 1
    isEndOfData.value = false
    pictureList.value = []
    await Promise.all([
      getFollowAndFansCount(),
      checkIsFollowing(),
      loadPictureData()
    ])
  }
})
</script>

<style scoped>
#userDetailPage {
  background: #f8fafc;
  min-height: 100vh;
  margin-left: -20px !important;
  margin-right: -20px !important;
}

.page-content {
  margin-left: -20px;
  margin-right: -20px;
}

.user-card {
  background: white;
  border-radius: 12px;

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background: linear-gradient(to bottom, #fff6f3 0%, white 100%);
}

.pagination-wrapper {
  margin-top: 24px;
  margin-left: 20px;
  margin-right: 20px;
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-top: 1px solid #f1f5f9;
}

:deep(.van-pagination) {
  --van-pagination-item-default-color: #64748b;
  --van-pagination-item-default-background-color: #f8fafc;
  --van-pagination-item-default-border-color: transparent;
  --van-pagination-item-height: 36px;
  --van-pagination-item-font-size: 14px;
  --van-pagination-active-background-color: #ff8e53;
  --van-pagination-active-color: white;
  margin-top: 24px;
  margin-left: 20px;
  margin-right: 20px;
  justify-content: center;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.van-pagination__item) {
  margin: 0;
  border-radius: 8px;
  min-width: 36px;
  transition: all 0.3s ease;

  &:hover {
    color: #ff8e53;
    background: #fff6f3;
  }
}

:deep(.van-pagination__item--active) {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 142, 83, 0.2);

  &:hover {
    color: white;
    background: #ff8e53;
  }
}

:deep(.van-pagination__prev),
:deep(.van-pagination__next) {
  background: white;
  border: 1px solid #e2e8f0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-family: monospace;

  &:hover {
    border-color: #ff8e53;
    color: #ff8e53;
  }

  &:active {
    background: #fff6f3;
  }
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.user-detail {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.user-meta {
  color: #64748b;
  font-size: 14px;

  > div {
    margin-bottom: 4px;
  }
}

.user-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.stats-wrapper {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  gap: 6px;
  align-items: center;
  cursor: pointer;
  color: #64748b;

  &:hover {
    color: #1a1a1a;
  }
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
}

.count {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.label {
  font-size: 13px;
}

.follow-button {
  :deep(.van-button) {
    height: 32px;
    padding: 0 16px;
  }
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .page-content {
    padding: 12px;
  }

  .username {
    font-size: 16px;
  }

  .user-actions {
    padding: 10px;
  }

  .count {
    font-size: 14px;
  }

  .label {
    font-size: 12px;
  }
}

.pictures-section {
  margin-top: 16px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.picture-list-container {
  margin: 0;
  padding: 0;
  margin-left: -20px !important;
  margin-right: -20px !important;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.picture-count {
  font-size: 14px;
  color: #64748b;
}

.picture-list-wrapper {
  min-height: 200px;
  position: relative;
  padding: 0;
}

.empty-state {
  padding: 40px 0;
  margin: 0 20px;
}

.pagination-wrapper {
  display: none;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .picture-list-container {
    margin-left: -20px !important;
    margin-right: -20px !important;
  }

  .picture-list-wrapper {
    padding: 0 12px;
  }

  .empty-state,
  .pagination-wrapper {
    margin-left: 12px;
    margin-right: 12px;
  }

  :deep(.van-pagination__item) {
    min-width: 32px;
    height: 32px;
  }

  :deep(.van-pagination__prev),
  :deep(.van-pagination__next) {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}
</style>
