<template>
  <div class="yuemu-pc-picture-list">
    <div v-if="!loading && (!dataList || dataList.length === 0)" class="yuemu-empty-state">
      <div class="yuemu-custom-empty-state">
        <img :src="emptyImage" :alt="t('components.pictureList.noContent')" class="yuemu-empty-illustration" />
        <div class="yuemu-empty-text">
          <h3>{{ t('components.pictureList.noPictures') }}</h3>
          <p>{{ t('components.pictureList.text1') }}</p>
        </div>
      </div>
    </div>
    <a-list
      v-else
      :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
      :data-source="dataList"
      :loading="loading"
    >
      <template #renderItem="{ item: picture }">
        <a-list-item class="yuemu-picture-item">
          <a-card class="yuemu-picture-card" hoverable @click="doClickPicture(picture)">
            <template #cover>
              <div class="yuemu-image-wrapper">
                <div class="yuemu-image-container">
                  <img
                    :alt="picture.name"
                    :src="`${picture.thumbnailUrl ?? picture.url}?${new Date().getTime()}`"
                    referrerpolicy="no-referrer-when-downgrade"
                    @load="handleImageLoad(picture)"
                    @error="handleImageError(picture)"
                  />
                </div>
              </div>
            </template>
            <template v-if="showOp" #actions>
              <div v-if="isMyPosts && picture.reviewStatus !== 1" class="yuemu-review-status">
                <a-button type="link" class="yuemu-review-button" @click.stop="showReviewModal(picture)">
                  <template v-if="picture.reviewStatus === 0">
                    <ClockCircleOutlined class="yuemu-status-icon yuemu-pending" />
                    <span class="yuemu-status-text">{{ t('components.pictureList.pendingReview') }}</span>
                  </template>
                  
                  <template v-else-if="picture.reviewStatus === 2">
                    <CloseCircleOutlined class="yuemu-status-icon yuemu-rejected" />
                    <span class="yuemu-status-text">{{ t('components.pictureList.rejected') }}</span>
                  </template>
                </a-button>
              </div>
              <div v-else class="yuemu-operation-buttons">
                <a-button
                  v-if="canEdit"
                  type="link"
                  class="yuemu-action-button yuemu-edit-button"
                  @click="(e) => doEdit(picture, e)"
                >
                  <EditOutlined />
                </a-button>
                <a-button
                  type="link"
                  class="yuemu-action-button yuemu-search-button"
                  @click="(e) => doSearch(picture, e)"
                >
                  <SearchOutlined />
                </a-button>
                <a-button
                  v-if="canDelete"
                  type="link"
                  class="yuemu-action-button yuemu-delete-button"
                  @click="(e) => doDelete(picture, e)"
                >
                  <DeleteOutlined />
                </a-button>
              </div>
            </template>
          </a-card>
        </a-list-item>
      </template>
    </a-list>
    <a-modal
      v-model:open="reviewModalVisible"
      :title="getReviewModalTitle(currentPicture?.reviewStatus)"
      :footer="null"
      class="yuemu-review-modal"
    >
      <div class="yuemu-review-detail">
        <div class="yuemu-status-icon-large">
          <ClockCircleOutlined v-if="currentPicture?.reviewStatus === 0" class="yuemu-pending" />
          <CheckCircleOutlined v-else-if="currentPicture?.reviewStatus === 1" class="yuemu-approved" />
          <CloseCircleOutlined v-else-if="currentPicture?.reviewStatus === 2" class="yuemu-rejected" />
        </div>
        <div class="yuemu-review-message">
          <template v-if="currentPicture?.reviewStatus === 0">{{ t('components.pictureList.picturePendingReview') }}</template>
          <template v-else-if="currentPicture?.reviewStatus === 1">{{ t('components.pictureList.pictureApproved') }}</template>
          <template v-else-if="currentPicture?.reviewStatus === 2">
            {{ currentPicture?.reviewMessage || t('components.pictureList.reviewFailedMsg') }}
          </template>
        </div>
      </div>
    </a-modal>
    <PictureDetailView
      v-if="selectedPictureId"
      :id="selectedPictureId"
      :visible="detailModalVisible"
      :initialData="selectedPictureData"
      @close="handleDetailModalClose"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { useRouter } from 'vue-router'
import PictureDetailView from '@/components/PictureDetailView.vue'
import { onMounted, ref } from 'vue'
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue'
import { deletePictureUsingPost } from '@/api/pictureController.ts'
import { message, Modal } from 'ant-design-vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { getDeviceType } from '@/utils/device.ts'
import emptyImage from '@/assets/illustrations/empty.png'
// 添加设备类型检测
const device = ref<string>('')
// 详情弹窗相关
const detailModalVisible = ref(false)
const selectedPictureId = ref<string | number | null>(null)
const selectedPictureData = ref<API.PictureVO | null>(null)
onMounted(async () => {
  device.value = await getDeviceType()
})
interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOp?: boolean
  onReload?: () => void
  isMyPosts?: boolean
  canEdit?: boolean
  canDelete?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOp: false,
  onReload: () => {},
  isMyPosts: false,
  canEdit: false,
  canDelete: false,
})
const router = useRouter()
// 处理图片加载完成事件，根据宽高比设置行内样式
const handleImageLoad = (picture: API.PictureVO) => {
  const imgElement = event.target as HTMLImageElement
  const width = imgElement.width
  const ratio = picture.picScale
  if (ratio && ratio > 0.58) {
    imgElement.style.width = '100%'
    imgElement.style.height = '100%'
    imgElement.style.objectFit = 'cover'
  } else if (ratio) {
    imgElement.style.width = '100%'
    imgElement.style.height = `${width * 1.78}px`
    imgElement.style.objectFit = 'cover'
    imgElement.style.objectPosition = 'center'
  }
}
// 跳转至图片详情页或打开弹窗
const doClickPicture = (picture: API.PictureVO) => {
  if (device.value === DEVICE_TYPE_ENUM.MOBILE) {
    router.push({
      path: `/picture/${picture.id}`,
    })
  } else {
    selectedPictureId.value = picture.id
    selectedPictureData.value = picture
    detailModalVisible.value = true
  }
}
const handleDetailModalClose = (needReload = false) => {
  detailModalVisible.value = false
  selectedPictureId.value = null
  selectedPictureData.value = null
  if (needReload && props.onReload) {
    props.onReload()
  }
}
const doSearch = (picture, e) => {
  e.stopPropagation()
  router.push({
    path: `/search_picture`,
    query: {
      pictureId: picture.id,
    },
  })
}
const doEdit = (picture, e) => {
  e.stopPropagation()
  router.push({
    path: '/add_picture',
    query: {
      id: picture.id,
      spaceId: picture.spaceId,
    },
  })
}
const doDelete = async (picture, e) => {
  e.stopPropagation()
  const id = picture.id
  if (!id) return
  Modal.confirm({
    title: t('components.pictureList.confirmDelete'),
    content: t('components.pictureList.confirmDeletePictureWarning'),
    okText: t('components.pictureList.ok'),
    cancelText: t('components.pictureList.cancel'),
    onOk: async () => {
      const res = await deletePictureUsingPost({ id })
      if (res.data.code === 0) {
        message.success(t('components.pictureList.deleteSuccess'))
        props.onReload?.()
      } else {
        message.error(t('components.pictureList.text2'))
      }
    },
  })
}
const handleImageError = (picture: API.PictureVO) => {
  const imgElement = event.target as HTMLImageElement
  imgElement.src = picture.url
}
const reviewModalVisible = ref(false)
const currentPicture = ref<API.PictureVO>()
const showReviewModal = (picture: API.PictureVO) => {
  currentPicture.value = picture
  reviewModalVisible.value = true
}
const getReviewModalTitle = (status?: number) => {
  switch (status) {
    case 0: return t('components.pictureList.reviewing')
    case 1: return t('components.pictureList.reviewPassed')
    case 2: return t('components.pictureList.reviewFailed')
    default: return t('components.pictureList.reviewStatus')
  }
}</script>
<style scoped>.yuemu-pc-picture-list {
  padding: 4px;
  width: 100%;
  margin: 0 auto;
  background: var(--header-background);
  color: var(--text-primary);
}
.yuemu-picture-item {
  margin-bottom: 16px;
  width: 100% !important;
}
:deep(.ant-list-items) {
  width: 100%;
}
:deep(.ant-list-item) {
  width: 100% !important;
  padding: 0 !important;
}
.yuemu-picture-card {
  width: 100% !important;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  :deep(.ant-card-body) {
    background: rgba(255, 255, 255, 0.8);
  }
  :deep(.ant-card-actions) {
    background: rgba(255, 255, 255, 0.8);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }
}
.yuemu-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 66%;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}
.yuemu-image-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.yuemu-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.yuemu-picture-card:hover .yuemu-image-container img {
  transform: scale(1.05);
}
.yuemu-operation-buttons {
  display: flex;
  justify-content: space-around;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
.yuemu-action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  transition: all 0.3s ease;
  .anticon {
    font-size: 16px;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.02);
    transform: translateY(-1px);
  }
}
.yuemu-edit-button {
  color: #ff8e53;
  &:hover {
    color: #ff7a3d;
    background: rgba(255, 142, 83, 0.1);
  }
}
.yuemu-search-button {
  color: #45b090;
  &:hover {
    color: #3a9579;
    background: rgba(69, 176, 144, 0.1);
  }
}
.yuemu-delete-button {
  color: #ff6b6b;
  &:hover {
    color: #ff5252;
    background: rgba(255, 107, 107, 0.1);
  }
}
.yuemu-review-status {
  padding: 8px;
  text-align: center;
}
.yuemu-review-message {
  font-size: 16px;
  color: #1f2937;
  line-height: 1.5;
}
.yuemu-review-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
}
.yuemu-status-icon {
  font-size: 16px;
  &.yuemu-pending { color: #1890ff; }
  &.yuemu-approved { color: #52c41a; }
  &.yuemu-rejected { color: #ff4d4f; }
}
.yuemu-status-text {
  font-size: 14px;
}
.yuemu-review-detail {
  text-align: center;
  padding: 24px;
}
.yuemu-status-icon-large {
  font-size: 48px;
  margin-bottom: 16px;
  .yuemu-pending { color: #1890ff; }
  .yuemu-approved { color: #52c41a; }
  .yuemu-rejected { color: #ff4d4f; }
}
.yuemu-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  min-height: 400px;
  background: var(--card-background);
  border-radius: 24px;
  box-shadow: 0 8px 32px var(--shadow-color);
  border: 1px solid var(--border-color);
  margin: 16px;
  .yuemu-custom-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    animation: yuemuEmptyFadeIn 0.8s ease-out;
  }
  .yuemu-empty-illustration {
    width: 200px;
    height: auto;
    opacity: 0.8;
  }
  .yuemu-empty-text {
    margin-top: 12px;
    h3 {
      font-size: 20px;
      color: var(--text-primary);
      margin-bottom: 8px;
      font-weight: 600;
    }
    p {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
  }
}
@keyframes yuemuEmptyFadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
@media screen and (max-width: 768px) {
  .yuemu-review-status {
    padding: 4px;
  }
  .yuemu-review-button {
    padding: 4px 8px;
  }
  .yuemu-status-icon {
    font-size: 14px;
  }
  .yuemu-status-text {
    font-size: 13px;
  }
  .yuemu-review-detail {
    padding: 16px;
  }
  .yuemu-status-icon-large {
    font-size: 40px;
  }
}
/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-delete-button:active, .yuemu-delete-button:hover,
  .yuemu-delete-button:active *, .yuemu-delete-button:hover *,
  .yuemu-picture-card:active, .yuemu-picture-card:hover,
  .yuemu-picture-card:active *, .yuemu-picture-card:hover *,
  .yuemu-search-button:active, .yuemu-search-button:hover,
  .yuemu-search-button:active *, .yuemu-search-button:hover *,
  .yuemu-edit-button:active, .yuemu-edit-button:hover,
  .yuemu-edit-button:active *, .yuemu-edit-button:hover * {
    transform: none !important;
  }
}</style>
