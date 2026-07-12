<template>
  <div id="yuemu-postManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-mac-header-panel">
          <a-form layout="inline" :model="searchParams" class="yuemu-mac-search-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.searchText"
                :placeholder="t('pages.admin.postManagePage.searchTitleContent')"
                allow-clear
                class="yuemu-mac-input"
                style="width: 200px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-input
                v-model:value="searchParams.category"
                :placeholder="t('pages.admin.postManagePage.searchCategory')"
                allow-clear
                class="yuemu-mac-input"
                style="width: 140px"
              />
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.status"
                :placeholder="t('pages.admin.postManagePage.reviewStatus')"
                allow-clear
                :options="POST_STATUS_OPTIONS"
                class="yuemu-mac-select"
                style="width: 130px"
                :dropdownClassName="'yuemu-mac-select-dropdown'"
                teleport="body"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-ios-btn-primary">
                {{ t('pages.admin.postManagePage.searchText') }}
              </a-button>
            </a-form-item>
            <a-form-item>
              <a-button class="yuemu-ios-btn-ghost" @click="toggleSortOrder">
                <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
                <SortDescendingOutlined v-else />
                {{ sortOrder === 'ascend' ? t('pages.admin.postManagePage.ascendText') : t('pages.admin.postManagePage.descendText') }}
              </a-button>
            </a-form-item>
          </a-form>
        </div>

        <div class="yuemu-mac-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-mac-table"
              :scroll="{ x: 1200 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'title'">
                  <div class="yuemu-post-title-cell">
                    <span class="yuemu-font-semibold">{{ record.title }}</span>
                    <span v-if="record.category" class="yuemu-ios-tag yuemu-gray" style="margin-top:4px;">{{ record.category }}</span>
                  </div>
                </template>
                <template v-if="column.dataIndex === 'content'">
                  <a-button type="text" class="yuemu-btn-text-blue" @click="showContentModal(record)">
                    {{ t('pages.admin.postManagePage.viewContent') }}
                  </a-button>
                </template>
                <template v-if="column.dataIndex === 'attachments'">
                  <div class="yuemu-attachments-preview" v-if="record.attachments && record.attachments.length">
                    <a-popover placement="top">
                      <template #content><img :src="record.attachments[0].url" style="max-width:200px; border-radius:8px;"/></template>
                      <img :src="record.attachments[0].url" class="yuemu-thumb-img" />
                    </a-popover>
                    <span v-if="record.attachments.length > 1" class="yuemu-text-secondary" style="font-size:12px;">{{ t('pages.admin.postManagePage.etcAttachmentsText', { count: record.attachments.length }) }}</span>
                  </div>
                  <span class="yuemu-text-tertiary">{{ t('pages.admin.postManagePage.noAttachment') }}</span>
                </template>
                <template v-if="column.dataIndex === 'userInfo'">
                  <div class="yuemu-user-info-cell">
                    <a-avatar :size="28" :src="record.user?.userAvatar || 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" />
                    <span class="yuemu-text-secondary">{{ record.user?.userName || t('pages.admin.postManagePage.anonymousText') }}</span>
                  </div>
                </template>
                <template v-if="column.dataIndex === 'stats'">
                  <div class="yuemu-stats-cell yuemu-text-secondary">
                    <span><LikeOutlined /> {{ record.likeCount }}</span>
                    <span><EyeOutlined /> {{ record.viewCount }}</span>
                    <span><MessageOutlined /> {{ record.commentCount }}</span>
                  </div>
                </template>
                <template v-if="column.dataIndex === 'status'">
                  <span class="yuemu-ios-tag" :class="getStatusClass(record.status)">
                    {{ POST_STATUS_MAP[record.status] }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">{{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                </template>
                <template v-if="column.key === 'action'">
                  <div class="yuemu-mac-action-buttons">
                    <a-button v-if="record.status !== POST_STATUS_ENUM.PASS" type="text" class="yuemu-btn-text-green" @click="handleReview(record, POST_STATUS_ENUM.PASS)">{{ t('pages.admin.postManagePage.passBtn') }}</a-button>
                    <a-button v-if="record.status !== POST_STATUS_ENUM.REJECT" type="text" class="yuemu-btn-text-orange" @click="showRejectModal(record)">{{ t('pages.admin.postManagePage.rejectBtn') }}</a-button>
                    <a-button type="text" class="yuemu-btn-text-red" @click="showDeleteConfirm(record)">{{ t('pages.admin.postManagePage.deleteBtn') }}</a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-mac-pagination">
          <a-pagination
            v-model:current="searchParams.current"
            :total="total"
            :pageSize="searchParams.pageSize"
            :pageSizeOptions="['10', '20', '30', '40']"
            show-size-changer
            :showTotal="t => `Total ${t} posts`"
            @change="handlePageChange"
            @showSizeChange="handleSizeChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-mobile-container">
        <div class="yuemu-ios-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-page-title"> {{ t('pages.admin.postManagePage.title') }} </h1>
          </div>
          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.searchText"
              :placeholder="t('pages.admin.postManagePage.searchPlaceholder')"
              class="yuemu-ios-search"
              shape="round"
              @search="doSearch"
            />
            <div class="yuemu-filter-actions">
              <span class="yuemu-sort-text" @click="toggleSortOrder">
                {{ sortOrder === 'ascend' ? t('pages.admin.postManagePage.ascendText') : t('pages.admin.postManagePage.descendText') }}
                <van-icon :name="sortOrder === 'ascend' ? 'ascending' : 'descending'" />
              </span>
            </div>
          </div>
          <div class="yuemu-ios-dropdown-wrapper">
            <van-dropdown-menu class="yuemu-mac-van-dropdown" :active-color="'var(--link-color)'">
              <van-dropdown-item
                v-model="searchParams.status"
                :options="mobileStatusOptions"
                @change="doSearch"
                teleport="body"
              />
            </van-dropdown-menu>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <div class="yuemu-ios-card-list">
            <div v-for="post in dataList" :key="post.id" class="yuemu-ios-data-card" @click="showContentModal(post)">
              <div class="yuemu-card-header-post">
                <div class="yuemu-author-info">
                  <a-avatar :size="32" :src="post.user?.userAvatar || 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" />
                  <div class="yuemu-author-meta">
                    <span class="yuemu-author-name">{{ post.user?.userName || t('pages.admin.postManagePage.anonymousUser') }}</span>
                    <span class="yuemu-post-time yuemu-text-secondary">{{ dayjs(post.createTime).format('MM-DD HH:mm') }}</span>
                  </div>
                </div>
                <span class="yuemu-ios-badge" :class="getStatusClass(post.status)">
                  {{ POST_STATUS_MAP[post.status] }}
                </span>
              </div>

              <div class="yuemu-card-body-post">
                <h3 class="yuemu-post-title-main">{{ post.title }}</h3>
                <div v-if="post.category" class="yuemu-post-tags" style="margin-bottom:8px;">
                  <span class="yuemu-ios-tag yuemu-blue"># {{ post.category }}</span>
                </div>

                <div v-if="post.attachments && post.attachments.length" class="yuemu-post-attachments-mobile">
                  <div class="yuemu-attachment-info yuemu-text-secondary">
                    <PictureOutlined /> Contains {{ post.attachments.length }} media attachments
                  </div>
                </div>
              </div>

              <div class="yuemu-card-footer-post">
                <div class="yuemu-post-stats-mobile yuemu-text-secondary">
                  <span><LikeOutlined /> {{ post.likeCount }}</span>
                  <span><EyeOutlined /> {{ post.viewCount }}</span>
                  <span><MessageOutlined /> {{ post.commentCount }}</span>
                </div>

                <div class="yuemu-post-actions-mobile" @click.stop>
                  <button v-if="post.status !== POST_STATUS_ENUM.PASS" class="yuemu-action-circle-btn yuemu-success" @click="handleReview(post, POST_STATUS_ENUM.PASS)">{{ t('pages.admin.postManagePage.passBtn') }}</button>
                  <button v-if="post.status !== POST_STATUS_ENUM.REJECT" class="yuemu-action-circle-btn yuemu-warn" @click="showRejectModal(post)">{{ t('pages.admin.postManagePage.rejectBtn') }}</button>
                  <van-popover placement="top-end" :actions="[{ text: t('pages.admin.postManagePage.permanentDeleteText'), color: '#ef4444' }]" @select="showDeleteConfirm(post)">
                    <template #reference>
                      <button class="yuemu-action-circle-btn yuemu-gray"> {{ t('pages.admin.postManagePage.more') }} </button>
                    </template>
                  </van-popover>
                </div>
              </div>
            </div>

            <van-empty v-if="dataList.length === 0 && !loading" :description="t('pages.admin.postManagePage.emptyData')" />
          </div>

          <div class="yuemu-mobile-pagination-minimal" v-if="total > 0">
            <div class="yuemu-page-current yuemu-text-secondary">
              Page {{ searchParams.current }} / {{ Math.ceil(total / searchParams.pageSize) }} (Total {{ total }})
            </div>
            <div class="yuemu-page-nav">
              <button class="yuemu-nav-btn" :disabled="searchParams.current === 1" @click="handlePrevPage">Prev Page</button>
              <button class="yuemu-nav-btn" :disabled="searchParams.current >= Math.ceil(total / searchParams.pageSize)" @click="handleNextPage">Next Page</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <a-modal
      v-model:open="rejectModalVisible"
      :title="t('pages.admin.postManagePage.rejectPost')"
      @ok="handleRejectConfirm"
      :confirmLoading="confirmLoading"
      class="yuemu-mac-modal"
      :footer="null"
    >
      <div class="yuemu-mac-form" style="padding-top: 10px;">
        <div class="yuemu-form-item">
          <label> {{ t('pages.admin.postManagePage.shortcutReason') }} </label>
          <a-select
            v-model:value="selectedReason"
            :placeholder="t('pages.admin.postManagePage.selectRejectReason')"
            class="yuemu-mac-select"
            :dropdownClassName="'yuemu-mac-select-dropdown'"
            style="width: 100%"
            @change="handleReasonSelect"
          >
            <a-select-option v-for="option in POST_REJECT_REASON_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
          </a-select>
        </div>
        <div class="yuemu-form-item" style="margin-top: 16px;">
          <label>Detailed Description</label>
          <a-textarea
            v-model:value="rejectMessage"
            :placeholder="t('pages.admin.postManagePage.rejectDetailPlaceholder')"
            :rows="4"
            class="yuemu-mac-input"
            :maxLength="200"
            show-count
          />
        </div>
        <div class="yuemu-modal-footer">
          <a-button class="yuemu-ios-btn-ghost" @click="rejectModalVisible = false">{{ t('pages.admin.postManagePage.cancelBtn') }}</a-button>
          <a-button type="primary" danger class="yuemu-ios-btn-danger yuemu-full-width" @click="handleRejectConfirm" :loading="confirmLoading">{{ t('pages.admin.postManagePage.confirmRejectBtn') }}</a-button>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="contentModalVisible"
      :title="t('pages.admin.postManagePage.postPreview')"
      width="800px"
      :footer="null"
      class="yuemu-mac-modal yuemu-content-modal"
    >
      <div class="yuemu-content-preview-container">
        <h2 class="yuemu-preview-title">{{ selectedPost?.title }}</h2>
        <div class="yuemu-preview-meta yuemu-text-secondary">
          <span v-if="selectedPost?.category" class="yuemu-ios-tag yuemu-gray"># {{ selectedPost.category }}</span>
          <span class="yuemu-ios-tag" :class="getStatusClass(selectedPost?.status || 0)" style="margin-left: 8px;">
            {{ POST_STATUS_MAP[selectedPost?.status || 0] }}
          </span>
        </div>
        <div class="yuemu-preview-markdown-wrapper">
          <html-content v-if="selectedPost" :content="selectedPost.content" />
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="deleteConfirmVisible"
      :title="null"
      :footer="null"
      :width="360"
      class="yuemu-ios-confirm-modal"
      centered
    >
      <div class="yuemu-ios-confirm-content">
        <div class="yuemu-icon-wrap">
          <ExclamationCircleFilled />
        </div>
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.postManagePage.confirmDeleteTitle') }} </h3>
        <p class="yuemu-confirm-desc">
          {{ t('pages.admin.postManagePage.deleteWarning1') }}<br>{{ t('pages.admin.postManagePage.deleteWarning2') }}
        </p>
        <div class="yuemu-ios-confirm-actions">
          <button class="yuemu-ios-cancel-btn" @click="deleteConfirmVisible = false">{{ t('pages.admin.postManagePage.cancelBtn') }}</button>
          <button class="yuemu-ios-danger-btn" @click="confirmDelete"> {{ t('pages.admin.postManagePage.delete') }} </button>
        </div>
      </div>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  ExclamationCircleFilled,
  SearchOutlined,
  PictureOutlined,
  LikeOutlined,
  EyeOutlined,
  MessageOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons-vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import { POST_REJECT_REASON_OPTIONS, POST_REJECT_REASON_MAP } from '@/constants/review'
import { listPostByPageUsingPost, deletePostUsingPost, reviewPostUsingPost, getPostByIdUsingGet } from '@/api/postController'
import HtmlContent from '@/components/HtmlContent.vue'
import { Popover as VanPopover, Empty as VanEmpty } from 'vant'
import 'vant/lib/popover/style'

// Status枚举
const POST_STATUS_ENUM = { REVIEWING: 0, PASS: 1, REJECT: 2 }
const POST_STATUS_MAP: Record<number, string> = { 0: t('pages.admin.postManagePage.pendingText'), 1: t('pages.admin.postManagePage.passedText'), 2: t('pages.admin.postManagePage.rejectedText') }
const POST_STATUS_OPTIONS = [
  { label: t('pages.admin.postManagePage.pendingText'), value: 0 },
  { label: t('pages.admin.postManagePage.passedText'), value: 1 },
  { label: t('pages.admin.postManagePage.rejectedText'), value: 2 },
]
const mobileStatusOptions = [
  { text: t('pages.admin.postManagePage.allStatusText'), value: undefined },
  { text: t('pages.admin.postManagePage.pendingText'), value: 0 },
  { text: t('pages.admin.postManagePage.passedText'), value: 1 },
  { text: t('pages.admin.postManagePage.rejectedText'), value: 2 },
]

const columns = [
  { title: t('pages.admin.postManagePage.colTitleText'), dataIndex: 'title', width: 220 },
  { title: t('pages.admin.postManagePage.colContentText'), dataIndex: 'content', width: 100 },
  { title: t('pages.admin.postManagePage.colAttachmentText'), dataIndex: 'attachments', width: 120 },
  { title: t('pages.admin.postManagePage.colAuthorText'), dataIndex: 'userInfo', width: 140 },
  { title: t('pages.admin.postManagePage.colStatsText'), dataIndex: 'stats', width: 160 },
  { title: t('pages.admin.postManagePage.colStatusText'), dataIndex: 'status', width: 100 },
  { title: t('pages.admin.postManagePage.colCreateTimeText'), dataIndex: 'createTime', width: 160 },
  { title: t('pages.admin.postManagePage.colActionText'), key: 'action', fixed: 'right', width: 180, align: 'right' },
]

const router = useRouter()
const device = ref(DEVICE_TYPE_ENUM.PC)
const loading = ref(false)
const dataList = ref<API.Post[]>([])
const total = ref(0)
const searchParams = ref({ searchText: '', category: '', status: undefined, isPublic: false, current: 1, pageSize: 10, sortField: 'createTime', sortOrder: 'descend' })
const sortOrder = ref<'ascend' | 'descend'>('descend')

onMounted(async () => {
  device.value = await getDeviceType()
  loadData()
})

const getStatusClass = (status: number) => {
  if (status === 0) return 'yuemu-orange'
  if (status === 1) return 'yuemu-green'
  if (status === 2) return 'yuemu-red'
  return 'yuemu-gray'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await listPostByPageUsingPost({
      ...searchParams.value,
      sortOrder: sortOrder.value,
      current: searchParams.value.current,
      pageSize: searchParams.value.pageSize,
    })
    if (res.data?.data) {
      dataList.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (error: any) {
    message.error(t('pages.admin.postManagePage.fetchErrorText'))
  } finally {
    loading.value = false
  }
}

const doSearch = () => { searchParams.value.current = 1; loadData() }
const doTableChange = (pag: any) => { searchParams.value.current = pag.current; searchParams.value.pageSize = pag.pageSize; loadData() }
const handlePageChange = (page: number, pageSize: number) => { searchParams.value.current = page; searchParams.value.pageSize = pageSize; loadData() }
const handleSizeChange = (current: number, size: number) => { searchParams.value.current = 1; searchParams.value.pageSize = size; loadData() }

const handlePrevPage = () => { if (searchParams.value.current > 1) { searchParams.value.current--; loadData() } }
const handleNextPage = () => { if (searchParams.value.current < Math.ceil(total.value / searchParams.value.pageSize)) { searchParams.value.current++; loadData() } }

// Delete确认
const deleteConfirmVisible = ref(false)
const postToDelete = ref<API.Post | null>(null)
const showDeleteConfirm = (record: API.Post) => { postToDelete.value = record; deleteConfirmVisible.value = true }
const confirmDelete = async () => {
  if (!postToDelete.value) return
  try {
    await deletePostUsingPost({ id: postToDelete.value.id })
    message.success(t('pages.admin.postManagePage.deletedSuccessText'))
    deleteConfirmVisible.value = false
    loadData()
  } catch (error) { message.error(t('pages.admin.postManagePage.deleteErrorText')) }
}

// 审核Action
const rejectModalVisible = ref(false)
const rejectMessage = ref('')
const selectedReason = ref('')
const confirmLoading = ref(false)
const currentPost = ref<API.Post>()

const showRejectModal = (post: API.Post) => {
  currentPost.value = post; rejectMessage.value = ''; selectedReason.value = ''; rejectModalVisible.value = true;
}
const handleReasonSelect = (value: string) => { selectedReason.value = value; rejectMessage.value = POST_REJECT_REASON_MAP[value] || ''; }

const handleReview = async (post: API.Post, status: number) => {
  try {
    await reviewPostUsingPost({ id: post.id, status })
    message.success(t('pages.admin.postManagePage.passSuccessText'))
    loadData()
  } catch (error) { message.error(t('pages.admin.postManagePage.opErrorText')) }
}

const handleRejectConfirm = async () => {
  if (!currentPost.value) return
  confirmLoading.value = true
  try {
    await reviewPostUsingPost({ id: currentPost.value.id, status: POST_STATUS_ENUM.REJECT, message: rejectMessage.value })
    message.success(t('pages.admin.postManagePage.rejectSuccessText'))
    rejectModalVisible.value = false
    loadData()
  } catch (error) { message.error(t('pages.admin.postManagePage.opErrorText')) } finally { confirmLoading.value = false }
}

// Content预览模态框
const contentModalVisible = ref(false)
const selectedPost = ref<API.Post>()
const showContentModal = async (post: API.Post) => {
  try {
    const res = await getPostByIdUsingGet({ id: post.id })
    if (res.data?.data) { selectedPost.value = res.data.data; contentModalVisible.value = true; }
  } catch (error) { message.error(t('pages.admin.postManagePage.fetchDetailErrorText')) }
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
  searchParams.value.sortOrder = sortOrder.value
  loadData()
}

</script>

<style scoped>
/* ==================== 统一依赖 CSS 变量 ==================== */
#yuemu-postManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-font-semibold { font-weight: 600; }
.yuemu-ellipsis-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ==================== PC 端样式重构 ==================== */
.yuemu-pc-container {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

.yuemu-mac-header-panel {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 16px var(--shadow-color);
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  transition: var(--theme-transition);
}

.yuemu-mac-search-form { display: flex; gap: 12px; width: 100%; }

/* 深度覆盖 Ant Design 表单元素 */
:deep(.yuemu-mac-select .ant-select-selector),
:deep(.yuemu-mac-input), :deep(.yuemu-mac-textarea) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: var(--theme-transition);
}
:deep(.yuemu-mac-input input), :deep(.yuemu-mac-textarea) { background-color: transparent !important; color: var(--text-primary) !important; }
:deep(.yuemu-mac-input input::placeholder), :deep(.yuemu-mac-textarea::placeholder) { color: var(--text-secondary) !important; }
:deep(.yuemu-mac-input:focus-within), :deep(.yuemu-mac-textarea:focus) { border-color: var(--link-color) !important; }
:deep(.yuemu-mac-select .ant-select-arrow) { color: var(--text-secondary); }

/* Apple 按钮系列 */
.yuemu-ios-btn-primary { background-color: var(--link-color) !important; color: var(--text-other) !important; border: none !important; border-radius: 8px !important; font-weight: 500; transition: var(--theme-transition); }
.yuemu-ios-btn-primary:hover { background-color: var(--link-hover-color) !important; }
.yuemu-ios-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; background-color: transparent !important; transition: var(--theme-transition); }
.yuemu-ios-btn-ghost:hover { background-color: var(--hover-background) !important; }
.yuemu-ios-btn-danger { background-color: #ef4444 !important; border: none !important; border-radius: 8px !important; color: #fff !important; }
.yuemu-ios-btn-danger:hover { background-color: #dc2626 !important; }

/* 表格容器包裹区 */
.yuemu-mac-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: var(--theme-transition);
}

/* 深度覆盖 Ant Design 表格样式 */
:deep(.yuemu-mac-table) {
  .ant-table, .ant-table-container, .ant-table-content { background-color: transparent !important; color: var(--text-primary) !important; }
  .ant-table-thead > tr > th { background-color: transparent !important; border-bottom: 1px solid var(--border-color) !important; color: var(--text-secondary) !important; font-weight: 500; }
  .ant-table-thead > tr > th::before { display: none !important; }
  .ant-table-tbody > tr > td { background-color: transparent !important; border-bottom: 1px solid var(--border-color) !important; color: var(--text-primary) !important; transition: var(--theme-transition); }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
  .ant-table-cell-fix-left, .ant-table-cell-fix-right { background-color: var(--card-background) !important; }
  .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background-color: var(--hover-background) !important; }
  .ant-empty-description { color: var(--text-secondary) !important; }
}

/* 表格内元素 */
.yuemu-post-title-cell { display: flex; flex-direction: column; align-items: flex-start; }
.yuemu-user-info-cell { display: flex; align-items: center; gap: 8px; }
.yuemu-stats-cell { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
.yuemu-thumb-img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer; }
.yuemu-attachments-preview { display: flex; align-items: center; gap: 8px; }

/* Tag 样式 */
.yuemu-ios-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.yuemu-ios-tag.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-ios-tag.yuemu-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-ios-tag.yuemu-red { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-ios-tag.yuemu-orange { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.yuemu-ios-tag.yuemu-gray { background-color: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }
.yuemu-ios-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.yuemu-ios-badge.yuemu-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-ios-badge.yuemu-red { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-ios-badge.yuemu-orange { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.yuemu-mac-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-blue { color: var(--link-color) !important; }
.yuemu-btn-text-green { color: #10b981 !important; }
.yuemu-btn-text-orange { color: #f59e0b !important; }
.yuemu-btn-text-red { color: #ef4444 !important; border-radius: 6px; }
.yuemu-mac-action-buttons .ant-btn { font-size: 13px; border-radius: 6px; }
.yuemu-mac-action-buttons .ant-btn:hover { background-color: var(--hover-background); }

/* PC端分页 */
.yuemu-mac-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item) { background-color: transparent !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-item a) { color: var(--text-primary) !important; }
:deep(.ant-pagination-item-active) { background-color: var(--hover-background) !important; border-color: var(--link-color) !important; }
:deep(.ant-pagination-item-active a) { color: var(--link-color) !important; }
:deep(.ant-pagination-prev .ant-pagination-item-link), :deep(.ant-pagination-next .ant-pagination-item-link) { background-color: transparent !important; color: var(--text-primary) !important; border-color: var(--border-color) !important; }
:deep(.ant-select-selector) { background-color: transparent !important; color: var(--text-primary) !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-total-text) { color: var(--text-secondary) !important; }


/* ==================== 移动端样式重构 ==================== */
.yuemu-mobile-container { height: 100%; background-color: var(--background); display: flex; flex-direction: column; }

/* 顶部吸顶面板 */
.yuemu-ios-sticky-header { position: sticky; top: 0; z-index: 1000; padding: 16px 16px 0; }
.yuemu-ios-sticky-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--header-background); border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); z-index: -1; pointer-events: none;
}

.yuemu-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); }

.yuemu-search-bar-wrapper { margin-bottom: 4px; display: flex; align-items: center; gap: 12px; }
:deep(.yuemu-ios-search) { flex: 1; padding: 0 !important; background-color: transparent !important; }
:deep(.yuemu-ios-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }
:deep(.van-field__control) { color: var(--text-primary) !important; }
:deep(.van-field__control::placeholder) { color: var(--text-secondary) !important; }

.yuemu-filter-actions {
  font-size: 14px;
  color: var(--link-color);
  font-weight: 500;
}
.yuemu-sort-text {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

:deep(.yuemu-ios-dropdown-wrapper) { margin: 0 -16px; position: relative; z-index: 1001; }
:deep(.yuemu-mac-van-dropdown .van-dropdown-menu__bar) { background-color: transparent !important; box-shadow: none !important; height: 48px !important; }
:deep(.yuemu-mac-van-dropdown .van-dropdown-menu__title) { color: var(--text-primary) !important; font-size: 14px; }
:deep(.van-dropdown-item__content) { background-color: var(--card-background) !important; }
:deep(.van-dropdown-item__option) { color: var(--text-primary) !important; background-color: var(--card-background) !important; }
:deep(.van-dropdown-item__option--active) { color: var(--link-color) !important; }



/* 列表滚动区 */
.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-ios-card-list { display: flex; flex-direction: column; gap: 16px; }

/* 移动端帖子卡片 (Feed流风格) */
.yuemu-ios-data-card { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color); transition: var(--theme-transition); cursor: pointer;}
.yuemu-ios-data-card:active { transform: scale(0.98); }

.yuemu-card-header-post { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.yuemu-author-info { display: flex; align-items: center; gap: 10px; }
.yuemu-author-meta { display: flex; flex-direction: column; }
.yuemu-author-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.yuemu-post-time { font-size: 12px; }

.yuemu-card-body-post { margin-bottom: 12px; }
.yuemu-post-title-main { margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: var(--text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.yuemu-post-attachments-mobile { background-color: var(--hover-background); padding: 8px 12px; border-radius: 8px; font-size: 13px; border: 1px solid var(--border-color); display: inline-flex;}

.yuemu-card-footer-post { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-color); }
.yuemu-post-stats-mobile { display: flex; gap: 16px; font-size: 13px; }
.yuemu-post-stats-mobile span { display: flex; align-items: center; gap: 4px; }

.yuemu-post-actions-mobile { display: flex; gap: 8px; }
.yuemu-action-circle-btn { padding: 4px 12px; border-radius: 14px; font-size: 12px; font-weight: 500; border: none; }
.yuemu-action-circle-btn.yuemu-success { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-action-circle-btn.yuemu-warn { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.yuemu-action-circle-btn.yuemu-gray { background-color: var(--hover-background); color: var(--text-primary); }

/* 移动端极简分页 */
.yuemu-mobile-pagination-minimal { margin-top: 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.yuemu-page-current { font-size: 13px; }
.yuemu-page-nav { display: flex; gap: 16px; }
.yuemu-nav-btn { padding: 6px 20px; border-radius: 16px; background-color: var(--hover-background); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px; }
.yuemu-nav-btn:disabled { opacity: 0.4; }

/* ==================== 统一弹窗样式 ==================== */
:deep(.yuemu-mac-modal), :deep(.yuemu-ios-confirm-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-header { background-color: var(--card-background); border-bottom: 1px solid var(--border-color); padding: 16px 24px; border-radius: 16px 16px 0 0;}
  .ant-modal-title { color: var(--text-primary); font-size: 16px; font-weight: 600; text-align: center;}
  .ant-modal-close { color: var(--text-secondary); }
  .ant-modal-body { padding: 24px; }
  .yuemu-mac-select-dropdown { background-color: var(--card-background) !important; border: 1px solid var(--border-color); }
  .ant-select-item { color: var(--text-primary); }
  .ant-select-item-option-active:not(.ant-select-item-option-disabled) { background-color: var(--hover-background); }
  .ant-select-item-option-selected:not(.ant-select-item-option-disabled) { background-color: rgba(59, 130, 246, 0.1); color: var(--link-color); }
}

.yuemu-mac-form .yuemu-form-item { margin-bottom: 16px; }
.yuemu-mac-form label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 24px; }
.yuemu-modal-footer .ant-btn { flex: 1; height: 40px; border-radius: 10px; font-size: 15px; }
.yuemu-full-width { width: 100%; }

/* 帖子预览Content区 */
.yuemu-content-preview-container { max-height: 60vh; overflow-y: auto; }
.yuemu-preview-title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0; line-height: 1.4; }
.yuemu-preview-meta { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
.yuemu-preview-markdown-wrapper { color: var(--text-primary); font-size: 15px; line-height: 1.6; }

/* 确认Delete弹框 */
.yuemu-ios-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: #ef4444; margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 20px 0; line-height: 1.4; }

.yuemu-ios-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-ios-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; transition: var(--theme-transition); }
.yuemu-ios-confirm-actions button:hover { background-color: var(--hover-background); }
.yuemu-ios-cancel-btn { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-ios-danger-btn { color: #ef4444; font-weight: 600 !important; border-bottom-right-radius: 16px; }
</style>
