<template>
  <div class="apple-page-container">
    <div id="spaceDetailPage" :class="{ 'is-pulling': refreshDistance > 0 }">
      <div class="glass-header">
        <div class="fake-search-bar" @click="showSearchPopup = true">
          <i class="fas fa-search"></i>
          <span>{{ $t('pages.spaceDetailPage.search.placeholder') }}</span>
        </div>
      </div>

      <div v-if="!isStatusLoading && !userSpaceStatus.isMember" class="permission-denied-state">
        <div class="denied-content">
          <div class="lock-icon-wrap">
            <i class="fas fa-lock"></i>
          </div>
          <h2 class="denied-title">{{ $t('pages.spaceDetailPage.privateAccess.title') }}</h2>
          <p class="denied-desc">{{ $t('pages.spaceDetailPage.privateAccess.desc') }}</p>
          <button
            v-if="space.spaceType !== SPACE_TYPE_ENUM.PRIVATE"
            class="apple-primary-btn"
            @click="applyToJoinSpace"
            :class="{ 'is-pending': userSpaceStatus.hasPending }"
          >
            <i v-if="!userSpaceStatus.hasPending" class="fas fa-user-plus"></i>
            <i v-else class="fas fa-spinner fa-spin"></i>
            <span>{{ userSpaceStatus.hasPending ? $t('pages.spaceDetailPage.privateAccess.pendingBtn') : $t('pages.spaceDetailPage.privateAccess.applyBtn') }}</span>
          </button>
        </div>
      </div>

      <div class="content-wrap" v-if="isStatusLoading || userSpaceStatus.isMember">
        <div class="custom-pull-refresh"
             :style="{
               transform: `translateY(${refreshDistance}px)`,
               marginBottom: `-${refreshDistance}px`,
               transition: refreshDistance ? 'none' : 'transform 0.3s, margin-bottom 0.3s'
             }"
             @touchstart="handleTouchStart"
             @touchmove="handleTouchMove"
             @touchend="handleTouchEnd"
             @touchcancel="handleTouchEnd">

          <!-- 刷新指示器 -->
          <div class="refresh-indicator"
               :class="{ 'refreshing': isRefreshing, 'pulled': refreshDistance >= refreshThreshold }"
               :style="{ opacity: Math.min(refreshDistance / refreshThreshold, 1) }">
            <div class="refresh-icon">
              <i v-if="isRefreshing" class="fas fa-spinner fa-spin loading-icon"></i>
              <div v-else class="pull-arrow" :style="{ transform: `rotate(${Math.min(180, (refreshDistance / refreshThreshold) * 180)}deg)` }">
                ↓
              </div>
            </div>
            <span class="refresh-text">{{ isRefreshing ? '' : refreshDistance >= refreshThreshold ? $t('pages.spaceDetailPage.refresh.release') : $t('pages.spaceDetailPage.refresh.pull') }}</span>
          </div>

          <BigPictureList
            v-if="isStatusLoading || loading || dataList.length > 0"
            :dataList="dataList"
            :loading="isStatusLoading || loading"
            :showOp="true"
            :onReload="fetchData"
            :isMyPosts="false"
          />

          <!-- 触底加载与没有更多状态 -->
          <div v-if="loadingMore" class="space-list-loading-more">
            <i class="fas fa-circle-notch fa-spin"></i> <span>{{ $t('pages.spaceDetailPage.status.loadingMore') }}</span>
          </div>
          <div v-if="!hasMore && dataList.length > 0 && !loading && !loadingMore" class="space-list-no-more">
            {{ $t('pages.spaceDetailPage.status.noMore') }}
          </div>

          <div v-else-if="dataList.length === 0 && !loading && !isStatusLoading" class="apple-empty-state">
            <div class="empty-icon-wrap">
              <i class="fas fa-folder-open"></i>
            </div>
            <h3 class="empty-title">{{ $t('pages.spaceDetailPage.empty.title') }}</h3>
            <p class="empty-desc">{{ canUploadPicture ? $t('pages.spaceDetailPage.empty.userHint') : $t('pages.spaceDetailPage.empty.adminHint') }}</p>
          </div>
        </div>
      </div>

      
      <!-- 径向展开 FAB 操作区 -->
      <div class="fab-radial-container" v-if="!isStatusLoading && userSpaceStatus.isMember">
        <div class="fab-mask" v-if="fabExpanded" @click="toggleFab"></div>
        
        <div class="radial-menu" :class="{ 'is-expanded': fabExpanded }">
          <button class="radial-item item-0" @click="handleUploadClick" v-if="canUploadPicture">
            <div class="radial-icon"><i class="fas fa-upload"></i></div>
            <span class="radial-label">{{ $t('pages.spaceDetailPage.fab.upload') }}</span>
          </button>
          <button class="radial-item item-1" @click="router.push(`/space_chat/${id}`); fabExpanded = false" v-if="space.spaceType === SPACE_TYPE_ENUM.TEAM">
            <div class="radial-icon"><i class="fas fa-comments"></i></div>
            <span class="radial-label">{{ $t('pages.spaceDetailPage.fab.chat') }}</span>
          </button>
          <button class="radial-item item-2" @click="toggleMoreModal(); fabExpanded = false">
            <div class="radial-icon"><i class="fas fa-ellipsis-h"></i></div>
            <span class="radial-label">{{ $t('pages.spaceDetailPage.fab.more') }}</span>
          </button>
        </div>

        <button class="floating-upload-btn" @click="toggleFab">
          <i class="fas fa-plus" :style="{ transform: fabExpanded ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }"></i>
        </button>
      </div>

      <div v-if="moreModalVisible" class="apple-overlay" @click="toggleMoreModal">
        <div class="apple-modal-sheet" @click.stop>
          <div class="drag-indicator"></div>
          <div class="modal-header-compact">
            <h3 class="modal-title">{{ space.spaceName }}</h3>
            <button class="modal-close-icon" @click="toggleMoreModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-scroll-body">
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">{{ $t('pages.spaceDetailPage.info.creator') }}</span>
                <span class="info-value">{{ space.user?.userName || $t('pages.spaceDetailPage.info.unknown') }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('pages.spaceDetailPage.info.type') }}</span>
                <span class="info-value">{{ space.spaceType === 0 ? $t('pages.spaceDetailPage.info.privateType') : $t('pages.spaceDetailPage.info.teamType') }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('pages.spaceDetailPage.info.createTime') }}</span>
                <span class="info-value">{{ space.createTime ? formatTime(space.createTime) : t('pages.spaceDetailPage.info.unknown') }}</span>
              </div>
              <div class="info-row desc-row" v-if="space.spaceDesc">
                <span class="info-label">{{ $t('pages.spaceDetailPage.info.desc') }}</span>
                <span class="info-value desc-text">{{ space.spaceDesc }}</span>
              </div>
            </div>

            <div class="info-card capacity-card">
              <div class="capacity-left">
                <span class="card-title">{{ $t('pages.spaceDetailPage.info.capacity') }}</span>
                <div class="capacity-numbers">
                  <div class="num-block">
                    <span class="current">{{ space.usedStorage ?? 0 }} MB</span>
                    <span class="total">/ {{ space.maxStorage ?? 0 }} MB</span>
                  </div>

                </div>
              </div>
              <div class="capacity-right">
                <VChart :option="gaugeOption" :style="{ width: '70px', height: '70px' }" autoresize />
              </div>
            </div>

            <div v-if="!isStatusLoading && userSpaceStatus.isMember" class="action-grid-card">
              <div class="action-grid">
                <div v-if="canManageSpaceUser && space.spaceType === SPACE_TYPE_ENUM.TEAM" class="grid-item" @click="handleNavigate(`/spaceUserManage/${id}`)">
                  <div class="icon-wrap bg-blue"><i class="fas fa-users-cog"></i><div v-if="pendingApplicationsCount > 0" class="red-dot"></div></div>
                  <span>{{ $t('pages.spaceDetailPage.actions.members') }}</span>
                </div>
                <div v-if="space.spaceType === SPACE_TYPE_ENUM.TEAM" class="grid-item" @click="handleNavigate(`/space_chat/${id}`)">
                  <div class="icon-wrap bg-green"><i class="fas fa-comments"></i></div>
                  <span>{{ $t('pages.spaceDetailPage.actions.chat') }}</span>
                </div>
                <div v-if="canManageSpaceUser" class="grid-item" @click="handleNavigate(`/space_analyze?spaceId=${id}`)">
                  <div class="icon-wrap bg-purple"><i class="fas fa-chart-pie"></i></div>
                  <span>{{ $t('pages.spaceDetailPage.actions.analyze') }}</span>
                </div>
                <div v-if="canManageSpaceUser && space.spaceType !== SPACE_TYPE_ENUM.PRIVATE" class="grid-item" @click="handleNavigate(`/space/${String(id)}/activityManage`)">
                  <div class="icon-wrap bg-cyan"><i class="fas fa-calendar-alt"></i></div>
                  <span>{{ $t('pages.spaceDetailPage.actions.activity') }}</span>
                </div>
                <div v-if="canEditPicture" class="grid-item" @click="doBatchEdit">
                  <div class="icon-wrap bg-orange"><i class="fas fa-layer-group"></i></div>
                  <span>{{ $t('pages.spaceDetailPage.actions.batchEdit') }}</span>
                </div>
                <div v-if="canManageSpaceUser && userSpaceStatus.isMember" class="grid-item" @click="openEditSpaceModal">
                  <div class="icon-wrap bg-gray"><i class="fas fa-pen"></i></div>
                  <span>{{ $t('pages.spaceDetailPage.actions.edit') }}</span>
                </div>
              </div>

              <button v-if="canQuitSpace" class="apple-danger-btn" @click="handleQuitSpace"> {{ $t('pages.spaceDetailPage.actions.quit') }} </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showEditSpaceModal" class="apple-overlay" @click="cancelEditSpace">
        <div class="apple-modal-sheet" @click.stop>
          <div class="drag-indicator"></div>
          <div class="modal-header-compact">
            <h3 class="modal-title">{{ $t('pages.spaceDetailPage.actions.edit') }}</h3>
            <button class="modal-close-icon" @click="cancelEditSpace"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-scroll-body form-body">
            <div class="apple-input-group">
              <label>{{ $t('pages.spaceDetailPage.editModal.nameLabel') }}</label>
              <input v-model="editSpaceForm.spaceName" type="text" :placeholder="$t('pages.spaceDetailPage.editModal.namePlaceholder')" />
            </div>
            <div class="apple-input-group">
              <label>{{ $t('pages.spaceDetailPage.editModal.descLabel') }}</label>
              <textarea v-model="editSpaceForm.spaceDesc" :placeholder="$t('pages.spaceDetailPage.editModal.descPlaceholder')" rows="3"></textarea>
            </div>
            <div class="apple-input-group">
              <label>{{ $t('pages.spaceDetailPage.editModal.coverLabel') }}</label>
              <div class="cover-upload-box" @click="!isCoverUploading && triggerFileSelect()">
                <div v-if="isCoverUploading" class="upload-loading">
                  <van-loading size="24px" color="var(--link-color)" vertical>{{ $t('pages.spaceDetailPage.editModal.uploading') }}</van-loading>
                </div>
                <img v-if="editSpaceForm.spaceCover" :src="editSpaceForm.spaceCover" :alt="$t('pages.spaceDetailPage.editModal.coverAlt')" />
                <div v-else-if="!isCoverUploading" class="upload-placeholder">
                  <i class="fas fa-camera"></i>
                  <span>{{ $t('pages.spaceDetailPage.editModal.changeCover') }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer-actions">
              <button class="apple-btn-secondary" @click="cancelEditSpace">{{ $t('pages.spaceDetailPage.editModal.cancel') }}</button>
              <button class="apple-btn-primary" @click="confirmEditSpace">{{ $t('pages.spaceDetailPage.editModal.save') }}</button>
            </div>
          </div>
        </div>
      </div>

      <input ref="fileInputRef" type="file" accept="image/*" @change="handleFileChange" style="display: none;" />

      <BatchEditPictureModal
        ref="batchEditPictureModalRef"
        :spaceId="id"
        :pictureList="dataList"
        :onSuccess="onBatchEditPictureSuccess"
      />

      <div v-if="showQuitConfirmDialog" class="apple-overlay" @click="cancelQuit">
        <div class="apple-dialog" @click.stop>
          <h3 class="dialog-title">{{ $t('pages.spaceDetailPage.quitDialog.title') }}</h3>
          <p class="dialog-desc">{{ $t('pages.spaceDetailPage.quitDialog.desc') }}</p>
          <div class="dialog-actions">
            <button class="dialog-btn cancel" @click="cancelQuit">{{ $t('pages.spaceDetailPage.editModal.cancel') }}</button>
            <button class="dialog-btn danger" @click="confirmQuit">{{ $t('pages.spaceDetailPage.quitDialog.title') }}</button>
          </div>
        </div>
      </div>

      <div v-if="showJoinSpaceDialog" class="apple-overlay" @click="cancelJoin">
        <div class="apple-dialog" @click.stop>
          <h3 class="dialog-title">{{ $t('pages.spaceDetailPage.privateAccess.dialogTitle') }}</h3>
          <p class="dialog-desc">{{ $t('pages.spaceDetailPage.privateAccess.dialogDesc') }}</p>
          <div class="dialog-actions">
            <button class="dialog-btn cancel" @click="cancelJoin">{{ $t('pages.spaceDetailPage.privateAccess.cancelJoin') }}</button>
            <button class="dialog-btn confirm" @click="joinSpace">{{ $t('pages.spaceDetailPage.privateAccess.confirmJoin') }}</button>
          </div>
        </div>
      </div>

    </div>
  </div>

    


    <!-- 全屏独立搜索页 -->
    <van-popup v-model:show="showSearchPopup" :position="isMobile ? 'bottom' : 'center'" :class="['full-search-popup', { 'is-desktop': !isMobile }]">
      <div class="drawer-drag-bar" v-if="isMobile"></div>
      <div class="search-popup-header">
        <div class="search-input-wrap">
          <i class="fas fa-search"></i>
          <input type="text" v-model="searchParams.searchText" :placeholder="$t('pages.spaceDetailPage.search.inputPlaceholder')" @keyup.enter="doPopupSearch" />
        </div>
        <button class="search-btn" @click="doPopupSearch">{{ $t('pages.spaceDetailPage.search.btn') }}</button>
      </div>
      
      <div class="search-popup-body">
        <div class="advanced-tools-grid">
          <div class="tool-card" @click="openColorPicker">
            <div class="tool-icon bg-gradient-pink"><i class="fas fa-palette"></i></div>
            <div class="tool-text">
              <h4>{{ $t('pages.spaceDetailPage.search.colorTitle') }}</h4>
              <p>{{ $t('pages.spaceDetailPage.search.colorDesc') }}</p>
            </div>
            <i class="fas fa-chevron-right tool-arrow"></i>
          </div>
          <div class="tool-card" @click="cameraInputRef?.click()">
            <div class="tool-icon bg-gradient-blue"><i class="fas fa-camera"></i></div>
            <div class="tool-text">
              <h4>{{ $t('pages.spaceDetailPage.search.imageTitle') }}</h4>
              <p>{{ $t('pages.spaceDetailPage.search.imageDesc') }}</p>
            </div>
            <i class="fas fa-chevron-right tool-arrow"></i>
          </div>
        </div>

        <!-- 颜色选择器 -->
        <div v-if="showColorPickerInPopup" class="inline-color-picker">
          <div class="picker-header">
            <span>{{ $t('pages.spaceDetailPage.search.extractColor') }}</span>
            <button class="close-picker" @click="showColorPickerInPopup = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="picker-body">
            <color-picker format="hex" @pureColorChange="handleColorSelected" :disable-alpha="true" :disable-history="true" shape="square" />
          </div>
        </div>
      </div>
      <input type="file" ref="cameraInputRef" accept="image/*" style="display: none" @change="handleCameraUpload" capture="environment">
    </van-popup>

</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent]);
import { h, onMounted, onUnmounted, reactive, computed, watch, ref, createVNode, onActivated, onDeactivated, nextTick, provide } from 'vue'

// 在私有空间和团队空间中禁用所有子组件的广告
provide('enableAds', false)

import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import { message, Modal, Badge } from 'ant-design-vue'
import { listPictureVoByPageUsingPost, searchPictureByColorUsingPost, searchPictureBySemanticUsingPost, searchPictureByPictureUsingPost } from '@/api/pictureController.ts'
import { formatSize } from '@/utils'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import PictureList from '@/components/PictureList.vue'
import { EditOutlined, PlusOutlined, BarChartOutlined, TeamOutlined, LeftOutlined, RightOutlined, MessageOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
import PictureSearchForm from '@/components/PictureSearchForm.vue'
import BatchEditPictureModal from '@/components/BatchEditPictureModal.vue'
import MobilePictureList from '@/components/MobilePictureList.vue'
import CustomPcCarousel from '@/components/CustomPcCarousel.vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { listSpaceVoByPageUsingPost } from '@/api/spaceController'
import { useRouter } from 'vue-router'
import { SPACE_PERMISSION_ENUM, SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { prevRoute } from '@/router'
import { Pagination as VanPagination, Field as VanField, Button as VanButton, DropdownMenu as VanDropdownMenu, DropdownItem as VanDropdownItem, Loading as VanLoading, Dialog as VanDialog } from 'vant'
import 'vant/es/pagination/style'
import 'vant/es/field/style'
import 'vant/es/button/style'
import 'vant/es/dropdown-menu/style'
import 'vant/es/dropdown-item/style'
import 'vant/es/loading/style'
import 'vant/es/dialog/style'
import BigPictureList from '@/components/BigPictureList.vue'
import { quitSpaceUsingPost, checkPendingApplicationUsingPost, joinSpaceUsingPost } from '@/api/spaceUserController'
import { LogoutOutlined } from '@ant-design/icons-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { listSpaceUserUsingPost } from '@/api/spaceUserController'
import { editSpaceUsingPost } from '@/api/spaceController'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import { InboxOutlined } from '@ant-design/icons-vue'
import { listActivityBySpaceIdUsingPost } from '@/api/activityController'

const { t } = useI18n();

declare namespace API {
  interface SpaceVO {
    id?: string | number
    spaceName?: string
    spaceDesc?: string
    spaceCover?: string
    userId?: string | number
    user?: { userName?: string }
    spaceType?: number
    createTime?: string | number | Date
    totalSize?: number
    maxSize?: number
    totalCount?: number
    maxCount?: number
    maxStorage?: number
    usedStorage?: number
    permissionList?: string[]
  }
  interface PictureQueryRequest {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    orderBy?: string[]
    spaceId?: string | number
    [key: string]: any
  }
  interface PictureVO {
    id?: string | number
    [key: string]: any
  }
  interface SpaceEditRequest {
    id?: string | number
    spaceName?: string
    spaceDesc?: string
    spaceCover?: string
  }
}

interface Props { id: string | number }

const loginUserStore = useLoginUserStore()
const device = ref<string>('')
const moreModalVisible = ref(false)

const cameraInputRef = ref<HTMLInputElement | null>(null)
const handleCameraUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    message.warning(t('pages.spaceDetailPage.msgs.selectImage') || '请上传图片')
    return
  }
  
  message.loading({ content: '正在分析图片...', key: 'imageSearch', duration: 0 })
  try {
    const res = await uploadPostImageUsingPost({}, { headers: { 'Content-Type': 'multipart/form-data' } }, file)
    if (res.data.code === 0 && res.data.data) {
      message.success({ content: '上传成功，开始搜索', key: 'imageSearch', duration: 2 })
      onPictureSearch(res.data.data.url)
    } else {
      throw new Error(res.data.message || '上传失败')
    }
  } catch (error: any) {
    message.error({ content: '失败: ' + error.message, key: 'imageSearch', duration: 2 })
  } finally {
    if (target) target.value = ''
    fabExpanded.value = false
  }
}



const windowWidth = ref(window.innerWidth)
const handleResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => { window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize) })
const isMobile = computed(() => windowWidth.value <= 768)

const showSearchPopup = ref(false)
const showColorPickerInPopup = ref(false)

const doPopupSearch = () => {
  onSearch(searchParams)
  showSearchPopup.value = false
}
const openColorPicker = () => {
  showColorPickerInPopup.value = true
}
const handleColorSelected = (color) => {
  onColorChange(color)
  showColorPickerInPopup.value = false
  showSearchPopup.value = false
}

const fabExpanded = ref(false)



const toggleFab = () => {
  fabExpanded.value = !fabExpanded.value
}







const isStatusLoading = ref(true)

const toggleMoreModal = () => {
  moreModalVisible.value = !moreModalVisible.value
  document.body.style.overflow = moreModalVisible.value ? 'hidden' : ''
}

onMounted(async () => {
  device.value = await getDeviceType()
  window.addEventListener('scroll', checkScrollBottom)
})

const scrollPosition = ref(0)

onActivated(() => {
  window.addEventListener('scroll', checkScrollBottom)
  nextTick(() => { window.scrollTo({ top: scrollPosition.value, behavior: 'instant' }) })
})

onDeactivated(() => {
  scrollPosition.value = window.pageYOffset || document.documentElement.scrollTop
  window.removeEventListener('scroll', checkScrollBottom)
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScrollBottom)
  document.body.style.overflow = ''
})

const router = useRouter()
const props = defineProps<Props>()
const space = ref<API.SpaceVO>({})
const searchFormRef = ref() 

const activities = ref([])
const activitiesLoading = ref(false)

const handleNavigate = (path: string) => {
  toggleMoreModal()
  router.push(path)
}

const fetchActivities = async () => {
  activitiesLoading.value = true
  try {
    const res = await listActivityBySpaceIdUsingPost({ spaceId: props.id, current: 1, pageSize: 10 })
    if (res.data.code === 0) {
      const filteredActivities = (res.data.data?.records || []).filter(activity => activity.status === 1 && activity.isExpired === 0)
      activities.value = filteredActivities.map(activity => ({
        id: activity.id,
        coverUrl: activity.coverUrl,
        title: activity.title,
        isExpired: activity.isExpired,
        expireTime: activity.expireTime
      }))
    }
  } catch (error) {
  } finally {
    activitiesLoading.value = false
  }
}

const handleActivityClick = (activityId: string | number) => {
  router.push(`/activity/detail/${activityId}`)
}

const formatTime = (time: string | number | Date) => {
  if (!time) return t('pages.spaceDetailPage.info.unknown')
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const handleUploadClick = () => {
  router.push(`/add_picture?spaceId=${props.id}`)
}

function createPermissionChecker(permission: string) {
  return computed(() => (space.value.permissionList ?? []).includes(permission))
}

const canManageSpaceUser = createPermissionChecker(SPACE_PERMISSION_ENUM.SPACE_USER_MANAGE)
const canUploadPicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_UPLOAD)
const canEditPicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_EDIT)
const canDeletePicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_DELETE)

const canQuitSpace = computed(() => {
  return space.value.spaceType === SPACE_TYPE_ENUM.TEAM && space.value.userId !== loginUserStore.loginUser.id
})

const showEditSpaceModal = ref(false)

const editSpaceForm = reactive<API.SpaceEditRequest>({ id: props.id, spaceName: '', spaceDesc: '', spaceCover: '' })

const isCoverUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const openEditSpaceModal = () => {
  editSpaceForm.id = space.value.id
  editSpaceForm.spaceName = space.value.spaceName || ''
  editSpaceForm.spaceDesc = space.value.spaceDesc || ''
  editSpaceForm.spaceCover = space.value.spaceCover || ''
  showEditSpaceModal.value = true
  toggleMoreModal()
}

const uploadCoverImage = async (file: File) => {
  isCoverUploading.value = true
  try {
    const res = await uploadPostImageUsingPost({}, {}, file)
    if (res.data.code === 0) {
      editSpaceForm.spaceCover = res.data.data.url
      message.success(t('pages.spaceDetailPage.msgs.coverSuccess'))
    } else {
      message.error(t('pages.spaceDetailPage.msgs.coverFailPrefix') + res.data.message)
    }
  } catch (error) {
    message.error(t('pages.spaceDetailPage.msgs.coverFail'))
  } finally {
    isCoverUploading.value = false
  }
}

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return message.error(t('pages.spaceDetailPage.msgs.selectImage'))
  await uploadCoverImage(file)
  target.value = ''
}

const triggerFileSelect = () => fileInputRef.value?.click()

const confirmEditSpace = async () => {
  try {
    const res = await editSpaceUsingPost({ ...editSpaceForm })
    if (res.data.code === 0) {
      message.success(t('pages.spaceDetailPage.msgs.updateSuccess'))
      showEditSpaceModal.value = false
      await fetchSpaceDetail()
    } else {
      message.error(t('pages.spaceDetailPage.msgs.updateFailPrefix') + res.data.message)
    }
  } catch (error) {
    message.error(t('pages.spaceDetailPage.msgs.updateFail'))
  }
}

const cancelEditSpace = () => { showEditSpaceModal.value = false }

const handleQuitSpace = async () => {
  try {
    if (device.value === DEVICE_TYPE_ENUM.PC) {
      Modal.confirm({
        title: t('pages.spaceDetailPage.quitDialog.title'),
        icon: createVNode(ExclamationCircleOutlined),
        content: t('pages.spaceDetailPage.quitDialog.desc'),
        okText: t('pages.spaceDetailPage.quitDialog.confirm'),
        cancelText: t('pages.spaceDetailPage.quitDialog.cancel'),
        okButtonProps: { danger: true },
        async onOk() {
          try {
            const res = await quitSpaceUsingPost({ id: props.id })
            if (res.data.code === 0) {
              message.success(t('pages.spaceDetailPage.msgs.quitSuccess'))
              await router.push('/')
            } else message.error(t('pages.spaceDetailPage.msgs.quitFailPrefix') + res.data.message)
          } catch (error: any) { message.error(t('pages.spaceDetailPage.msgs.quitFailPrefix') + error.message) }
        }
      })
    } else {
      showQuitConfirmDialog.value = true
    }
  } catch (error: any) {
    message.error(t('pages.spaceDetailPage.msgs.opFailPrefix') + error.message)
  }
}

const showQuitConfirmDialog = ref(false)

const confirmQuit = async () => {
  try {
    const res = await quitSpaceUsingPost({ id: props.id })
    if (res.data.code === 0) {
      message.success(t('pages.spaceDetailPage.msgs.quitSuccess'))
      showQuitConfirmDialog.value = false
      await router.push('/')
    } else message.error(t('pages.spaceDetailPage.msgs.quitFailPrefix') + res.data.message)
  } catch (error: any) {
    message.error(t('pages.spaceDetailPage.msgs.quitFailPrefix') + error.message)
  }
}

const cancelQuit = () => { showQuitConfirmDialog.value = false }

const pendingApplicationsCount = ref<number>(0)

const fetchPendingApplications = async () => {
  try {
    const res = await listSpaceUserUsingPost({ spaceId: props.id.toString(), status: 0 })
    if (res.data?.code === 0) pendingApplicationsCount.value = res.data.data?.length || 0
  } catch (error) {}
}

const checkPendingApplication = async () => {
  try {
    if (!loginUserStore.loginUser?.id) {
      message.error(t('pages.spaceDetailPage.msgs.notLoggedIn'))
      router.push('/user/login')
      return
    }
    const res = await checkPendingApplicationUsingPost({ userId: loginUserStore.loginUser.id, spaceId: props.id })
    if (res.data.code === 0) {
      if (res.data.data) {
        message.info(t('pages.spaceDetailPage.msgs.applySubmitted'))
      } else {
        showJoinSpaceDialog.value = true
      }
    } else message.error(t('pages.spaceDetailPage.msgs.checkApplyFailPrefix') + res.data.message)
  } catch (error) { message.error(t('pages.spaceDetailPage.msgs.checkApplyFail')) }
}

const showJoinSpaceDialog = ref(false)

const joinSpace = async () => {
  try {
    const res = await joinSpaceUsingPost({ spaceId: props.id })
    if (res.data.code === 0) {
      message.success(t('pages.spaceDetailPage.msgs.applySuccess'))
      showJoinSpaceDialog.value = false
      await updateUserSpaceStatus()
    } else message.error(t('pages.spaceDetailPage.msgs.applyFailPrefix') + res.data.message)
  } catch (error) { message.error(t('pages.spaceDetailPage.msgs.applyFail')) }
}

const applyToJoinSpace = async () => {
  try {
    if (!loginUserStore.loginUser?.id) {
      message.error(t('pages.spaceDetailPage.msgs.notLoggedIn'))
      router.push('/user/login')
      return
    }
    await updateUserSpaceStatus()
    if (userSpaceStatus.value.hasPending) return message.info(t('pages.spaceDetailPage.msgs.pendingAdmin'))
    if (userSpaceStatus.value.isMember) return message.info(t('pages.spaceDetailPage.msgs.alreadyMember'))
    showJoinSpaceDialog.value = true
  } catch (error) { message.error(t('pages.spaceDetailPage.msgs.systemError')) }
}

const userSpaceStatus = ref({ isMember: false, hasPending: false, application: null })

const updateUserSpaceStatus = async () => {
  if (!loginUserStore.loginUser?.id) {
    userSpaceStatus.value = { isMember: false, hasPending: false, application: null }
    return
  }
  try {
    if (space.value.spaceType === SPACE_TYPE_ENUM.PRIVATE && space.value.userId === loginUserStore.loginUser.id) {
      userSpaceStatus.value = { isMember: true, hasPending: false, application: null }
      return
    }
    const res = await checkPendingApplicationUsingPost({ userId: loginUserStore.loginUser.id, spaceId: props.id })
    if (res.data.code === 0) {
      const application = res.data.data
      if (application) {
        userSpaceStatus.value = { isMember: application.status === 1, hasPending: application.status === 0, application }
      } else {
        userSpaceStatus.value = { isMember: false, hasPending: false, application: null }
      }
    } else {
      userSpaceStatus.value = { isMember: false, hasPending: false, application: null }
    }
  } catch (error) {
    userSpaceStatus.value = { isMember: false, hasPending: false, application: null }
  }
}

const cancelJoin = () => { showJoinSpaceDialog.value = false }

const fetchSpaceDetail = async () => {
  loading.value = true
  try {
    if (!props.id) {
      const res = await listSpaceVoByPageUsingPost({ userId: loginUserStore.loginUser.id, current: 1, pageSize: 1, spaceType: SPACE_TYPE_ENUM.PRIVATE })
      if (res.data.code === 0 && res.data.data?.records?.length > 0) {
        const firstSpace = res.data.data.records[0]
        router.replace(`/space/${firstSpace.id}`)
        space.value = firstSpace
      } else {
        router.replace('/add_space')
        return
      }
    } else {
      const res = await getSpaceVoByIdUsingGet({ id: props.id })
      if (res.data.code === 0 && res.data.data) {
        space.value = res.data.data
        await updateUserSpaceStatus()
        if (canManageSpaceUser.value) await fetchPendingApplications()

        // 并行加载图片列表和轮播图数据
        if (userSpaceStatus.value.isMember) {
          await Promise.all([
            fetchData(),
            space.value.spaceType !== SPACE_TYPE_ENUM.PRIVATE ? fetchActivities() : Promise.resolve()
          ])
        }
      } else if (res.data.code === 40101) {
        await checkPendingApplication()
        return
      }
    }
  } catch (e: any) {
  } finally {
    loading.value = false
    isStatusLoading.value = false
  }
}

watch(canManageSpaceUser, (newValue) => { if (newValue) fetchPendingApplications() })

const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

const searchParams = reactive<API.PictureQueryRequest>({
  current: 1, pageSize: 12, sortField: 'createTime', sortOrder: 'descend', orderBy: ['createTime DESC', 'id DESC'],
})

const loadingMore = ref(false)
const hasMore = ref(true)

const startY = ref(0)
const currentY = ref(0)
const refreshDistance = ref(0)
const isRefreshing = ref(false)
const maxPullDistance = 100
const refreshThreshold = 80

const checkScrollBottom = () => {
  const scrollHeight = document.documentElement.scrollHeight
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const clientHeight = document.documentElement.clientHeight
  if (scrollHeight - scrollTop - clientHeight < 100 && !loadingMore.value && hasMore.value && !loading.value) {
    loadMore()
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value || loading.value) return
  loadingMore.value = true
  try {
    if (!userSpaceStatus.value.isMember) {
      await updateUserSpaceStatus()
      if (!userSpaceStatus.value.isMember && !userSpaceStatus.value.hasPending) await checkPendingApplication()
      if (!userSpaceStatus.value.isMember) return
    }
    const nextPage = Math.floor(dataList.value.length / searchParams.pageSize) + 1
    let res: any;
    if (searchParams.searchText) {
      res = await searchPictureBySemanticUsingPost({ searchText: searchParams.searchText, spaceId: props.id as any, current: nextPage, pageSize: searchParams.pageSize })
    } else {
      res = await listPictureVoByPageUsingPost({ ...searchParams, current: nextPage, spaceId: props.id, orderBy: ['createTime DESC', 'id DESC'] })
    }
    if (res.data.code === 0) {
      const newRecords = res.data.data?.records ?? []
      if (newRecords.length > 0) dataList.value = [...dataList.value, ...newRecords]
      hasMore.value = newRecords.length === searchParams.pageSize
    } else {
      if (!userSpaceStatus.value.isMember) {
        await updateUserSpaceStatus()
        if (!userSpaceStatus.value.isMember && !userSpaceStatus.value.hasPending) await checkPendingApplication()
        if (!userSpaceStatus.value.isMember) return
        await fetchData()
      }
    }
  } catch (error) {} finally { loadingMore.value = false }
}

const fetchData = async () => {
  loading.value = true
  try {
    if(!props.id){ await router.push('/'); return }
    if (!userSpaceStatus.value.isMember) {
      await updateUserSpaceStatus()
      if (!userSpaceStatus.value.isMember && !userSpaceStatus.value.hasPending) await checkPendingApplication()
      if (!userSpaceStatus.value.isMember) return
    }
    hasMore.value = true
    searchParams.current = 1
    let res: any;
    if (searchParams.searchText) {
      res = await searchPictureBySemanticUsingPost({ searchText: searchParams.searchText, spaceId: props.id as any, current: 1, pageSize: searchParams.pageSize })
    } else {
      res = await listPictureVoByPageUsingPost({ ...searchParams, spaceId: props.id, orderBy: ['createTime DESC', 'id DESC'] })
    }
    if (res.data.code === 0) {
      dataList.value = res.data.data?.records ?? []
      hasMore.value = (res.data.data?.records?.length ?? 0) === searchParams.pageSize
    } else {
      if (!userSpaceStatus.value.isMember) {
        await updateUserSpaceStatus()
        if (!userSpaceStatus.value.isMember && !userSpaceStatus.value.hasPending) await checkPendingApplication()
        if (!userSpaceStatus.value.isMember) return
        await fetchData()
      }
    }
  } catch (error) {} finally { loading.value = false }
}

const onColorChange = async (color: string) => {
  loading.value = true
  if (!userSpaceStatus.value.isMember) {
    await updateUserSpaceStatus()
    if (!userSpaceStatus.value.isMember && !userSpaceStatus.value.hasPending) await checkPendingApplication()
    if (!userSpaceStatus.value.isMember) { loading.value = false; return }
  }
  const res = await searchPictureByColorUsingPost({ picColor: color, spaceId: props.id })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data ?? []
    total.value = dataList.value.length
  } else {
    if (!userSpaceStatus.value.isMember) {
      await updateUserSpaceStatus()
      if (!userSpaceStatus.value.isMember && !userSpaceStatus.value.hasPending) await checkPendingApplication()
      if (!userSpaceStatus.value.isMember) { loading.value = false; return }
      await fetchData()
    }
  }
  loading.value = false
}

const onSearch = (newSearchParams: API.PictureQueryRequest) => {
  if (!newSearchParams) return
  Object.assign(searchParams, { ...newSearchParams, current: 1, pageSize: searchParams.pageSize, sortField: 'createTime', sortOrder: 'descend' })
  fetchData()
}

const onPictureSearch = async (imageUrl: string) => {
  if (!imageUrl) return
  loading.value = true
  if (!userSpaceStatus.value.isMember) {
    await updateUserSpaceStatus()
    if (!userSpaceStatus.value.isMember && !userSpaceStatus.value.hasPending) await checkPendingApplication()
    if (!userSpaceStatus.value.isMember) { loading.value = false; return }
  }
  const res = await searchPictureByPictureUsingPost({ imageUrl, spaceId: props.id as any })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = dataList.value.length
    hasMore.value = false 
  } else {
    message.error(t('pages.spaceDetailPage.msgs.imageSearchFail'))
  }
  loading.value = false
}

const batchEditPictureModalRef = ref()
const onBatchEditPictureSuccess = () => fetchData()
const doBatchEdit = () => { if (batchEditPictureModalRef.value) batchEditPictureModalRef.value.openModal(); toggleMoreModal() }

const handleTouchStart = (e: TouchEvent) => {
  if (device.value === DEVICE_TYPE_ENUM.PC) return
  startY.value = e.touches[0].clientY
  currentY.value = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  if (device.value === DEVICE_TYPE_ENUM.PC || isRefreshing.value) return
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop > 0) return
  currentY.value = e.touches[0].clientY
  const distance = currentY.value - startY.value
  if (distance > 0) {
    e.preventDefault()
    refreshDistance.value = Math.min(distance * 0.5, maxPullDistance)
  }
}

const handleTouchEnd = async () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) return
  if (refreshDistance.value >= refreshThreshold && !isRefreshing.value) {
    isRefreshing.value = true
    await onRefresh()
    isRefreshing.value = false
  }
  refreshDistance.value = 0
}

const onRefresh = async () => {
  try {
    searchFormRef.value?.handleRefresh()
    searchParams.current = 1
    dataList.value = []
    hasMore.value = true

    // 并行加载图片列表和轮播图数据
    await Promise.all([
      fetchData(),
      space.value.spaceType !== SPACE_TYPE_ENUM.PRIVATE ? fetchActivities() : Promise.resolve()
    ])
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const initSpaceState = () => {
  dataList.value = []
  activities.value = []
  total.value = 0
  loading.value = true
  hasMore.value = true
  Object.assign(searchParams, { current: 1, pageSize: 12, sortField: 'createTime', sortOrder: 'descend', searchText: '', category: '', tags: [], orderBy: ['createTime DESC', 'id DESC'] })
  if (searchFormRef.value) {
    searchFormRef.value.clearSearchState()
  }
}

watch(() => props.id, async (newSpaceId, oldSpaceId) => {
  if (newSpaceId !== oldSpaceId) {
    if (oldSpaceId) initSpaceState()
    isStatusLoading.value = true
    activitiesLoading.value = true
    await fetchSpaceDetail()
    isStatusLoading.value = false
  }
}, { immediate: true })

const formatSize = (size?: number) => {
  if (!size) return '0 B'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB'
  return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const capacityPercentage = computed(() => {
  if (!space.value.maxStorage) return 0
  const used = space.value.usedStorage ?? 0
  const max = space.value.maxStorage
  return Math.min(100, Math.round((used / max) * 100))
})

const gaugeOption = computed(() => {
  const percentage = capacityPercentage.value
  const remaining = 100 - percentage
  return {
    series: [{
      type: 'pie',
      radius: ['70%', '90%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: 'transparent', borderWidth: 0 },
      label: {
        show: true, position: 'center', formatter: `{d|${percentage}%}`,
        rich: { d: { fontSize: 14, fontWeight: 'bold', color: '#3b82f6', lineHeight: 20 } }
      },
      labelLine: { show: false },
      data: [
        { value: percentage, name: t('pages.spaceDetailPage.info.used'), itemStyle: { color: '#3b82f6' } },
        { value: remaining, name: t('pages.spaceDetailPage.info.remaining'), itemStyle: { color: 'rgba(150, 150, 150, 0.2)' } }
      ]
    }]
  }
})
</script>

<style scoped>
.apple-page-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  color: var(--text-primary);
  transition: var(--theme-transition);
}

#spaceDetailPage {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overscroll-behavior-y: none;
}

#spaceDetailPage.is-pulling {
  overflow: hidden;
  height: 100vh;
}

.glass-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--header-background);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.02);
}

.search-form-container {
  flex: 1;
  margin-right: 12px;
}

.search-form-container :deep(.picture-search-form) {
  padding: 0;
  margin: 0;
}

.icon-action-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: var(--hover-background);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: var(--theme-transition);
}
.icon-action-btn:hover {
  transform: scale(1.05);
  background: var(--border-color);
}

.top-carousel-section {
  margin-bottom: 8px;
  padding: 0 16px;
}
.carousel-wrapper {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px var(--shadow-color);
  position: relative;
}
.carousel-wrapper :deep(.luxury-carousel) {
  height: 400px;
  max-height: 400px;
}



.permission-denied-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 20px;
}
.denied-content {
  background: var(--card-background);
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 12px 40px var(--shadow-color);
  text-align: center;
  max-width: 400px;
  width: 100%;
}
.lock-icon-wrap {
  width: 64px;
  height: 64px;
  background: var(--hover-background);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: var(--text-secondary);
  font-size: 28px;
}
.denied-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}
.denied-desc {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 32px;
  line-height: 1.5;
}
.apple-primary-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  background: var(--link-color);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: var(--theme-transition);
}
.apple-primary-btn:hover { background: var(--link-hover-color); transform: scale(0.98); }
.apple-primary-btn.is-pending { background: var(--hover-background); color: var(--text-secondary); cursor: not-allowed; }
.apple-primary-btn.is-pending:hover { transform: none; }

.apple-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}
.empty-icon-wrap {
  font-size: 56px;
  color: var(--border-color);
  margin-bottom: 20px;
}
.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}
.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.floating-upload-btn {
  position: fixed;
  bottom: 120px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: var(--link-color);
  color: white;
  border: none;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px var(--shadow-color);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 90;

  animation: shadowBreathe 3s ease-in-out infinite;
}
@keyframes shadowBreathe {
  0% { box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2); transform: scale(1); }
  50% { box-shadow: 0 12px 28px rgba(22, 119, 255, 0.45); transform: scale(1.03); }
  100% { box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2); transform: scale(1); }
}
.floating-upload-btn:hover { transform: translateY(-4px) scale(1.05); }
.floating-upload-btn:active { transform: scale(0.95); }

.content-wrap {
  flex: 1;
  margin: auto;
  padding: 0 16px;
  width: 100%;
  box-sizing: border-box;
}

.custom-pull-refresh {
  min-height: 70vh;
  position: relative;
}

.refresh-indicator {
  position: absolute;
  top: -60px;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  transition: opacity 0.2s;
}

.refresh-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  font-size: 18px;
  color: var(--link-color);
}

.pull-arrow {
  font-size: 20px;
  transition: transform 0.3s;
  color: var(--link-color);
}

.refresh-text {
  font-weight: 500;
}

.apple-overlay {
  position: fixed;
  inset: 0;
  background: var(--upload-sheet-backdrop);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}
.apple-modal-sheet {
  background: var(--card-background);
  width: 90%;
  max-width: 440px;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px var(--shadow-color);
  animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.drag-indicator { display: none; }
.modal-header-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
}
.modal-title { font-size: 18px; font-weight: 700; margin: 0; color: var(--text-primary); }
.modal-close-icon {
  width: 30px; height: 30px; border-radius: 15px; background: var(--hover-background);
  color: var(--text-secondary); border: none; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s;
}
.modal-close-icon:hover { background: var(--border-color); color: var(--text-primary); }
.modal-scroll-body {
  padding: 20px 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.info-card {
  background: var(--hover-background);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}
.info-row { display: flex; justify-content: space-between; padding: 8px 0;  }
.info-row:last-child { border-bottom: none; padding-bottom: 0; }
.info-row:first-child { padding-top: 0; }
.desc-row { flex-direction: column; gap: 4px; }
.info-label { font-size: 14px; color: var(--text-secondary); }
.info-value { font-size: 14px; color: var(--text-primary); font-weight: 500; text-align: right;}
.desc-text { text-align: left; line-height: 1.4; color: var(--text-secondary); }

.capacity-card { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; display: block;}
.num-block { margin-bottom: 4px; }
.num-block .current { font-size: 18px; font-weight: 700; color: var(--link-color); }
.num-block .current.count { color: var(--markdown-heading-green-border); }
.num-block .total { font-size: 12px; color: var(--text-secondary); margin-left: 4px; }

.action-grid-card { margin-top: 8px; }
.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 0;
  transition: opacity 0.2s;
}
.grid-item:hover { opacity: 0.7; }
.icon-wrap {
  width: 48px; height: 48px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: #fff; position: relative;
}
.bg-blue { background: var(--link-color); }
.bg-green { background: #34c759; }
.bg-purple { background: #5856d6; }
.bg-cyan { background: #32ade6; }
.bg-orange { background: #ff9500; }
.bg-gray { background: #8e8e93; }
.red-dot {
  position: absolute; top: -2px; right: -2px; width: 12px; height: 12px;
  background: #ff3b30; border: 2px solid var(--card-background); border-radius: 50%;
}
.grid-item span { font-size: 12px; color: var(--text-primary); font-weight: 500; }

.apple-danger-btn {
  width: 100%; padding: 14px; border-radius: 12px;
  background: rgba(255, 59, 48, 0.1); color: #ff3b30; font-size: 15px; font-weight: 600;
  border: none; cursor: pointer; transition: 0.2s;
}
.apple-danger-btn:hover { background: rgba(255, 59, 48, 0.15); }

.form-body { display: flex; flex-direction: column; gap: 16px; }
.apple-input-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; padding-left: 4px; }
.apple-input-group input, .apple-input-group textarea {
  width: 100%; background: var(--hover-background); border: 1px solid transparent; border-radius: 12px;
  padding: 12px 16px; font-size: 15px; color: var(--text-primary); transition: all 0.2s; outline: none; box-sizing: border-box;
}
.apple-input-group input:focus, .apple-input-group textarea:focus { background: var(--card-background); border-color: var(--link-color); }
.cover-upload-box {
  width: 100%; height: 120px; background: var(--hover-background); border-radius: 12px;
  display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; position: relative;
}
.cover-upload-box img { width: 100%; height: 100%; object-fit: cover; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-secondary); }
.upload-placeholder i { font-size: 24px; }
.upload-loading { position: absolute; inset: 0; background: var(--header-background); display: flex; align-items: center; justify-content: center; }

.modal-footer-actions { display: flex; gap: 12px; margin-top: 8px; }
.apple-btn-secondary, .apple-btn-primary { flex: 1; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; transition: 0.2s; }
.apple-btn-secondary { background: var(--hover-background); color: var(--text-primary); }
.apple-btn-secondary:hover { background: var(--border-color); }
.apple-btn-primary { background: var(--link-color); color: #fff; }
.apple-btn-primary:hover { background: var(--link-hover-color); }

.apple-dialog {
  background: var(--card-background); width: 300px; border-radius: 18px;
  display: flex; flex-direction: column; text-align: center;
  box-shadow: 0 20px 40px var(--shadow-color); animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.dialog-title { font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 20px 0 8px; }
.dialog-desc { font-size: 13px; color: var(--text-secondary); margin: 0 20px 20px; line-height: 1.4; }
.dialog-actions { display: flex; border-top: 1px solid var(--border-color); }
.dialog-btn { flex: 1; padding: 14px 0; background: transparent; border: none; font-size: 16px; font-weight: 500; cursor: pointer; transition: 0.2s; color: var(--text-primary); }
.dialog-btn:active { background: var(--hover-background); }
.dialog-btn.cancel { color: var(--text-secondary); border-right: 1px solid var(--border-color); }
.dialog-btn.danger { color: #ff3b30; font-weight: 600;}
.dialog-btn.confirm { color: var(--link-color); font-weight: 600;}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

@media screen and (max-width: 768px) {
  .apple-page-container { background: var(--background); }
  .glass-header { padding: 16px 20px; gap: 12px; }
  .search-form-container { margin-right: 0; min-width: 0; }
  .icon-action-btn { width: 38px; height: 38px; font-size: 14px; flex-shrink: 0; }
  .top-carousel-section { padding: 0 4px; }
  .content-wrap { padding: 0 4px; }
  .carousel-wrapper :deep(.luxury-carousel) { height: 220px; max-height: 220px; }



  .apple-modal-sheet {
    position: absolute; bottom: 0; left: 0;
    width: 100%; max-width: 100%;
    border-radius: 24px 24px 0 0;
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .drag-indicator {
    display: block; width: 42px; height: 5px; border-radius: 2.5px;
    background: var(--border-color); margin: 10px auto 0;
  }
  .modal-header-compact { padding: 12px 20px 12px; border-bottom: none;}
  .modal-scroll-body { padding: 10px 20px 30px; max-height: 80vh; }

  .floating-upload-btn { right: 20px; bottom: 120px; width: 50px; height: 50px; font-size: 20px;}
}
.space-list-loading-more, .space-list-no-more {
  text-align: center;
  padding: 16px 0 32px;
  color: var(--text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.space-list-loading-more i {
  color: var(--link-color);
  font-size: 16px;
}

.search-bar-fake {
  width: 100%;
  height: 40px;
  background: var(--hover-background);
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: var(--text-secondary);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}
.search-bar-fake:active {
  background: var(--border-color);
}
.search-bar-fake i {
  margin-right: 8px;
  font-size: 16px;
}

.fab-radial-container {
  position: fixed;
  bottom: 120px;
  right: 32px;
  width: 56px;
  height: 56px;
  z-index: 195;
}
.radial-menu {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
}
.radial-item {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 195;
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s;
  transform: translate(0, 0) scale(0);
  opacity: 0;
  pointer-events: none;
}
.radial-menu.is-expanded .radial-item {
  pointer-events: auto;
}
.radial-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--card-background);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}
.radial-item:active .radial-icon {
  transform: scale(0.9);
}
.radial-label {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--text-primary);
  background: var(--card-background);
  padding: 2px 6px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.radial-menu.is-expanded .radial-label {
  opacity: 1;
  transition-delay: 0.2s;
}
.radial-menu.is-expanded .item-0 { transform: translate(0px, -110px) scale(1); opacity: 1; transition-delay: 0.05s; }
.radial-menu.is-expanded .item-1 { transform: translate(-78px, -78px) scale(1); opacity: 1; transition-delay: 0.1s; }
.radial-menu.is-expanded .item-2 { transform: translate(-110px, 0px) scale(1); opacity: 1; transition-delay: 0.15s; }

.floating-upload-btn {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--link-color);
  color: #fff;
  border: none;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  cursor: pointer;
  z-index: 200;
  transition: transform 0.2s, box-shadow 0.2s;
}
.floating-upload-btn:active {
  transform: scale(0.95);
}
@media screen and (min-width: 769px) {
  .fab-radial-container {
    width: 64px !important; height: 64px !important;
    right: 48px !important; bottom: 80px !important; /* PC 端留出底边距 */
  }
  /* 微调 PC 端内部项使其居中 (64 - 44 = 20, 20/2 = 10) */
  .radial-item { top: 10px !important; left: 10px !important; }
}

.fab-mask {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 190;
}

.full-search-popup {
  display: flex;
  flex-direction: column;
  background: var(--background);
}
.search-popup-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--header-background);
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
}
.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-primary);
  padding: 4px;
  cursor: pointer;
}
.search-popup-header .search-form-container {
  flex: 1;
  margin: 0;
}
.search-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

@media screen and (max-width: 768px) {
  .fab-radial-container { right: 20px; bottom: 120px; }
}


.fake-search-bar {
  width: 100%; max-width: 600px; margin: 0 auto; height: 48px;
  background: var(--card-background, #ffffff);
  border-radius: 24px;
  display: flex; align-items: center; justify-content: flex-start;
  padding: 0 20px;
  font-size: 15px; color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid var(--border-color, #e5e7eb);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}
.fake-search-bar:active, .fake-search-bar:hover {
  background: #f8fafc;
  border-color: var(--link-color);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.12);
}
.fake-search-bar i {
  margin-right: 12px; font-size: 17px;
  color: var(--link-color, #2563eb);
}
.fake-search-bar span {
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.full-search-popup { display: flex; flex-direction: column; width: 100%; max-width: 100vw; background: var(--background); box-sizing: border-box; overflow-x: hidden; }
.full-search-popup:not(.is-desktop) { height: 85vh; border-radius: 24px 24px 0 0; }
.drawer-drag-bar { width: 40px; height: 5px; background: var(--border-color, #e5e7eb); border-radius: 3px; margin: 12px auto 0; flex-shrink: 0; }
.full-search-popup.is-desktop { width: 640px; height: auto; max-height: 80vh; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
.search-popup-header { display: flex; align-items: center; padding: 12px 16px; gap: 12px; background: var(--header-background); border-bottom: 1px solid var(--border-color); width: 100%; box-sizing: border-box; }
.back-btn { background: none; border: none; font-size: 20px; color: var(--text-primary); cursor: pointer; padding: 4px; flex-shrink: 0; }
.search-input-wrap {
  flex: 1; display: flex; align-items: center;
  background: rgba(37, 99, 235, 0.05); /* 非常浅的品牌蓝色底 */
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 12px; padding: 8px 12px; gap: 8px;
  transition: all 0.2s ease;
  min-width: 0;
}
.search-input-wrap:focus-within {
  background: var(--card-background);
  border-color: var(--link-color);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
.search-input-wrap i { color: var(--link-color, #2563eb); font-size: 16px; }
.search-input-wrap input { flex: 1; border: none; background: transparent; outline: none; font-size: 15px; color: var(--text-primary); width: 100%; min-width: 0; }
.search-btn { background: var(--link-color); color: #fff; border: none; border-radius: 16px; padding: 8px 16px; font-size: 14px; font-weight: 500; cursor: pointer; flex-shrink: 0; white-space: nowrap; }

.search-popup-body { padding: 24px 16px; flex: 1; overflow-y: auto; background: var(--background); }
.advanced-tools-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 10px; width: 100%; box-sizing: border-box; overflow-x: hidden; }
.tool-card { display: flex; align-items: center; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; gap: 16px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 16px rgba(0,0,0,0.02); }
.tool-card:active { transform: scale(0.98); }
.tool-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }
.bg-gradient-pink { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); }
.bg-gradient-blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.tool-text { flex: 1; }
.tool-text h4 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
.tool-text p { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); }
.tool-arrow { color: var(--text-secondary); font-size: 14px; }

.inline-color-picker { margin-top: 24px; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; animation: yuemu-scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.picker-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 15px; color: var(--text-primary); }
.close-picker { background: var(--hover-background); border: none; width: 28px; height: 28px; border-radius: 14px; color: var(--text-secondary); cursor: pointer; }
.picker-body { padding: 24px; display: flex; justify-content: center; }
.picker-body :deep(.vc-color-wrap) { width: 120px; height: 120px; border-radius: 16px; border: 2px solid var(--border-color); background: var(--hover-background); }

</style>
