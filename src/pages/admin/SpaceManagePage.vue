<template>
  <div id="yuemu-spaceManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-container">
        <div class="yuemu-header-panel">
          <div class="yuemu-header-top-row">
            <h2 class="yuemu-page-title-text"> {{ t('pages.admin.spaceManagePage.title') }} </h2>
            <div class="yuemu-action-group">
              <a-button @click="router.push({ name: 'SpaceAnalyze', query: { queryPublic: '1' } })" class="yuemu-btn-ghost yuemu-orange">
                <i class="fas fa-chart-bar"></i> {{ t('pages.admin.spaceManagePage.analyzePublic') }}
              </a-button>
              <a-button @click="router.push({ name: 'SpaceAnalyze', query: { queryAll: '1' } })" class="yuemu-btn-ghost yuemu-purple">
                <i class="fas fa-chart-line"></i> {{ t('pages.admin.spaceManagePage.analyzeAll') }}
              </a-button>
              <a-button type="primary" @click="router.push({ name: 'AddSpace' })" class="yuemu-btn-primary">
                <i class="fas fa-plus"></i> {{ t('pages.admin.spaceManagePage.createSpace') }}
              </a-button>
            </div>
          </div>

          <a-form layout="inline" :model="searchParams" class="yuemu-search-form" @finish="doSearch">
            <a-form-item>
              <a-input v-model:value="searchParams.spaceName" :placeholder="t('pages.admin.spaceManagePage.searchSpaceName')" allow-clear class="yuemu-input">
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-select v-model:value="searchParams.spaceLevel" :placeholder="t('pages.admin.spaceManagePage.spaceLevel')" :options="SPACE_LEVEL_OPTIONS" allow-clear style="width: 140px" class="yuemu-select" :dropdownClassName="'yuemu-select-dropdown'" teleport="body" />
            </a-form-item>
            <a-form-item>
              <a-select v-model:value="searchParams.spaceType" :placeholder="t('pages.admin.spaceManagePage.spaceCategory')" :options="SPACE_TYPE_OPTIONS" allow-clear style="width: 140px" class="yuemu-select" :dropdownClassName="'yuemu-select-dropdown'" teleport="body" />
            </a-form-item>
            <a-form-item>
              <a-input v-model:value="searchParams.userId" :placeholder="t('pages.admin.spaceManagePage.userId')" allow-clear class="yuemu-input" style="width: 120px" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary"> {{ t('pages.admin.spaceManagePage.search') }} </a-button>
            </a-form-item>
            <a-form-item>
              <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
                <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
                <SortDescendingOutlined v-else />
                {{ sortOrder === 'ascend' ? t('pages.admin.spaceManagePage.ascendText') : t('pages.admin.spaceManagePage.descendText') }}
              </a-button>
            </a-form-item>
          </a-form>
        </div>

        <div class="yuemu-table-wrapper">
          <a-spin :spinning="loading">
            <a-table rowKey="id" :columns="columns" :data-source="dataList" :pagination="false" @change="doTableChange" class="yuemu-data-table">
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'spaceCover'">
                  <div v-if="record.spaceCover" class="yuemu-table-cover-img-wrap">
                    <img :src="record.spaceCover" :alt="t('pages.admin.spaceManagePage.cover')" class="yuemu-table-cover-img" />
                  </div>
                  <div v-else class="yuemu-table-cover-text" :class="'yuemu-level-' + getSpaceLevelClass(record.spaceLevel)">
                    {{ record.spaceName?.charAt(0) || '-' }}
                  </div>
                </template>
                <template v-if="column.dataIndex === 'spaceName'">
                  <span class="yuemu-font-semibold">{{ record.spaceName }}</span>
                </template>
                <template v-if="column.dataIndex === 'spaceLevel'">
                  <span class="yuemu-tag" :class="'yuemu-level-' + getSpaceLevelClass(record.spaceLevel)">
                    {{ SPACE_LEVEL_MAP[record.spaceLevel] }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'spaceType'">
                  <span class="yuemu-tag" :class="record.spaceType === 1 ? 'yuemu-blue' : 'yuemu-gray'">
                    {{ SPACE_TYPE_MAP[record.spaceType] }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'spaceUseInfo'">
                  <div class="yuemu-usage-info yuemu-text-secondary">
                    <div><span class="yuemu-label"> {{ t('pages.admin.spaceManagePage.sizeLabel') }} </span> {{ formatSize(record.totalSize) }} / {{ formatSize(record.maxSize) }}</div>
                    <div><span class="yuemu-label"> {{ t('pages.admin.spaceManagePage.countLabel') }} </span> {{ record.totalCount }} / {{ record.maxCount }}</div>
                  </div>
                </template>
                <template v-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">{{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-table-actions">
                    <a-button type="text" class="yuemu-link-blue" @click="router.push({ name: 'SpaceAnalyze', query: { spaceId: record.id } })"> {{ t('pages.admin.spaceManagePage.analyze') }} </a-button>
                    <a-button type="text" class="yuemu-link-green" @click="router.push({ name: 'AddSpace', query: { id: record.id } })"> {{ t('pages.admin.spaceManagePage.edit') }} </a-button>
                    <a-button
                      type="text"
                      :class="record.isRecommended === 1 ? 'yuemu-link-orange' : 'yuemu-link-gray'"
                      @click="toggleRecommendStatus(record)"
                      :disabled="record.spaceType !== 1"
                    >
                      <i v-if="record.isRecommended === 1" class="fas fa-star"></i>
                      {{ record.isRecommended === 1 ? t('pages.admin.spaceManagePage.cancelRecommend') : (record.spaceType === 1 ? t('pages.admin.spaceManagePage.setRecommend') : t('pages.admin.spaceManagePage.onlyTeam')) }}
                    </a-button>
                    <a-button type="text" class="yuemu-link-red" @click="showDeleteConfirm(record)">{{ t('pages.admin.spaceManagePage.delete') }}</a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination-box">
          <a-pagination
            v-model:current="searchParams.current"
            :total="total"
            :page-size="searchParams.pageSize"
            :show-total="(totalCount) => t('pages.admin.spaceManagePage.totalSpaceText', { t: totalCount })"
            show-size-changer
            @change="onPaginationChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-mobile-container">
        <div class="yuemu-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-mobile-title"> {{ t('pages.admin.spaceManagePage.title') }} </h1>
            <van-button type="primary" size="small" class="yuemu-mobile-btn-icon" @click="router.push({ name: 'AddSpace' })" round>
              <i class="fas fa-plus"></i>
            </van-button>
          </div>
          <div class="yuemu-search-bar-box">
            <van-search v-model="searchParams.spaceName" :placeholder="t('pages.admin.spaceManagePage.searchSpaceName')" class="yuemu-search-input" shape="round" @search="onSearch" />
          </div>
          <div class="yuemu-mobile-global-actions">
            <div class="yuemu-pill-btn yuemu-orange" @click="router.push({ name: 'SpaceAnalyze', query: { queryPublic: '1' } })">
                <i class="fas fa-chart-bar"></i> {{ t('pages.admin.spaceManagePage.analyzePublicShort') }}
            </div>
            <div class="yuemu-pill-btn yuemu-purple" @click="router.push({ name: 'SpaceAnalyze', query: { queryAll: '1' } })">
                <i class="fas fa-chart-line"></i> {{ t('pages.admin.spaceManagePage.analyzeAllShort') }}
            </div>
            <div class="yuemu-sort-trigger" @click="toggleSortOrder">
              <i :class="sortOrder === 'ascend' ? 'fas fa-sort-amount-up' : 'fas fa-sort-amount-down'"></i>
            </div>
          </div>
        </div>

        <div class="yuemu-list-scroll-area">
          <div class="yuemu-card-list">
            <div v-for="space in dataList" :key="space.id" class="yuemu-data-card">
              <div class="yuemu-card-header">
                <div class="yuemu-space-cover-wrap">
                  <img v-if="space.spaceCover" :src="space.spaceCover" :alt="t('pages.admin.spaceManagePage.cover')" class="yuemu-space-cover-img" />
                  <div v-else class="yuemu-space-cover-text" :class="'yuemu-level-' + getSpaceLevelClass(space.spaceLevel)">
                    {{ space.spaceName?.charAt(0) || '-' }}
                  </div>
                </div>
                <div class="yuemu-main-info">
                  <div class="yuemu-name-row">
                    <span class="yuemu-name-text">{{ space.spaceName }}</span>
                    <span v-if="space.isRecommended === 1" class="yuemu-badge yuemu-orange"><i class="fas fa-star" style="font-size:10px"></i> {{ t('pages.admin.spaceManagePage.recommend') }} </span>
                  </div>
                  <div class="yuemu-desc-row yuemu-text-secondary">
                    <i :class="space.spaceType === 1 ? 'fas fa-users' : 'fas fa-user'" style="font-size: 11px;"></i>
                    {{ SPACE_TYPE_MAP[space.spaceType] }} · ID: {{ space.userId }}
                  </div>
                </div>
                <div class="yuemu-side-info">
                  <span class="yuemu-badge" :class="'yuemu-level-' + getSpaceLevelClass(space.spaceLevel)">{{ SPACE_LEVEL_MAP[space.spaceLevel] }}</span>
                </div>
              </div>

              <div class="yuemu-card-body">
                <div class="yuemu-usage-stats">
                  <div class="yuemu-stat-item">
                    <span class="yuemu-label"> {{ t('pages.admin.spaceManagePage.capacity') }} </span>
                    <span class="yuemu-value">{{ formatSize(space.totalSize) }} <span class="yuemu-text-secondary">/ {{ formatSize(space.maxSize) }}</span></span>
                  </div>
                  <div class="yuemu-stat-item">
                    <span class="yuemu-label"> {{ t('pages.admin.spaceManagePage.fileCount') }} </span>
                    <span class="yuemu-value">{{ space.totalCount }} <span class="yuemu-text-secondary">/ {{ space.maxCount }}</span></span>
                  </div>
                </div>
              </div>

              <div class="yuemu-card-actions">
                <button class="yuemu-action-pill yuemu-blue" @click="router.push({ name: 'SpaceAnalyze', query: { spaceId: space.id } })"> {{ t('pages.admin.spaceManagePage.analyze') }} </button>
                <button class="yuemu-action-pill yuemu-green" @click="router.push({ name: 'AddSpace', query: { id: space.id } })"> {{ t('pages.admin.spaceManagePage.edit') }} </button>
                <button
                  class="yuemu-action-pill"
                  :class="space.isRecommended === 1 ? 'yuemu-orange' : 'yuemu-gray'"
                  :disabled="space.spaceType !== 1"
                  @click="toggleRecommendStatus(space)"
                >
                  {{ space.isRecommended === 1 ? t('pages.admin.spaceManagePage.cancelRecommend') : t('pages.admin.spaceManagePage.setRecommend') }}
                </button>
                <button class="yuemu-action-pill yuemu-red" @click="showDeleteConfirm(space)">{{ t('pages.admin.spaceManagePage.delete') }}</button>
              </div>
            </div>

            <van-empty v-if="dataList.length === 0 && !loading" :description="t('pages.admin.spaceManagePage.noSpace')">
              <template #image><i class="fas fa-folder-open" style="font-size: 48px; color: var(--text-secondary);"></i></template>
            </van-empty>
          </div>

          <div class="yuemu-mobile-pager" v-if="total > 0">
            <div class="yuemu-pager-info yuemu-text-secondary">
              <span>{{ t('pages.admin.spaceManagePage.totalCountMobile', { total }) }}</span>
            </div>
            <van-pagination :prev-text="t('pages.admin.spaceManagePage.prevPage')" :next-text="t('pages.admin.spaceManagePage.nextPage')" v-model="searchParams.current" :total-items="total" :items-per-page="searchParams.pageSize" @change="onPageChange" :show-page-size="3" force-ellipses class="yuemu-pagination-custom" />
          </div>
        </div>

        <van-action-sheet v-model:show="showPageSizeSheet" :actions="pageSizeOptions" :cancel-text="t('pages.admin.spaceManagePage.cancel')" @select="handlePageSizeChange" class="yuemu-action-sheet" teleport="body" />
      </div>
    </template>

    <a-modal v-model:open="deleteConfirmVisible" :footer="null" :width="360" class="yuemu-confirm-box" centered>
      <div class="yuemu-confirm-content">
        <div class="yuemu-confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.spaceManagePage.confirmDeleteSpace') }} </h3>
        <p class="yuemu-confirm-desc" v-html="t('pages.admin.spaceManagePage.deleteWarningText', { name: selectedSpace?.spaceName })"></p>
        <div class="yuemu-confirm-footer">
          <button class="yuemu-btn-cancel" @click="deleteConfirmVisible = false">{{ t('pages.admin.spaceManagePage.cancel') }}</button>
          <button class="yuemu-btn-confirm-danger" @click="confirmDelete">{{ t('pages.admin.spaceManagePage.confirmDeleteBtn') }}</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { deleteSpaceUsingPost, listSpaceByPageUsingPost, setRecommendStatusUsingPost } from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { SPACE_LEVEL_MAP, SPACE_LEVEL_OPTIONS, SPACE_TYPE_MAP, SPACE_TYPE_OPTIONS } from '@/constants/space.ts'
import { formatSize } from '@/utils'
import { useRouter } from 'vue-router'
import {
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons-vue'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'

const device = ref<string>('')
const router = useRouter()

onMounted(async () => {
  device.value = await getDeviceType()
  loadData()
})

const showPageSizeSheet = ref(false)
const pageSizeOptions = [
  { name: t('pages.admin.spaceManagePage.pageSize10'), value: 10 },
  { name: t('pages.admin.spaceManagePage.pageSize20'), value: 20 },
  { name: t('pages.admin.spaceManagePage.pageSize30'), value: 30 },
  { name: t('pages.admin.spaceManagePage.pageSize50'), value: 50 },
]

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: t('pages.admin.spaceManagePage.cover'), dataIndex: 'spaceCover', width: 80 },
  { title: t('pages.admin.spaceManagePage.spaceName'), dataIndex: 'spaceName' },
  { title: t('pages.admin.spaceManagePage.level'), dataIndex: 'spaceLevel', width: 100 },
  { title: t('pages.admin.spaceManagePage.category'), dataIndex: 'spaceType', width: 100 },
  { title: t('pages.admin.spaceManagePage.usage'), dataIndex: 'spaceUseInfo', width: 220 },
  { title: t('pages.admin.spaceManagePage.createTime'), dataIndex: 'createTime', width: 150 },
  { title: t('pages.admin.spaceManagePage.action'), key: 'action', fixed: 'right', width: 240, align: 'right' },
]

const loading = ref(false)
const dataList = ref<API.SpaceVO[]>([])
const total = ref(0)

const searchParams = reactive({
  current: 1,
  pageSize: 10,
  spaceName: '',
  spaceLevel: undefined,
  spaceType: undefined,
  userId: undefined,
  sortField: 'createTime',
  sortOrder: 'descend',
})
const sortOrder = ref<'ascend' | 'descend'>('descend')

const doTableChange = (pagination: any) => {
  searchParams.current = pagination.current
  searchParams.pageSize = pagination.pageSize
  loadData()
}

const onPaginationChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  loadData()
}

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await listSpaceByPageUsingPost({
      ...searchParams,
      sortOrder: sortOrder.value,
    })
    if (res.data.code === 0) {
      dataList.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
    }
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  loading.value = false
  dataList.value = []
})

const onSearch = () => { searchParams.current = 1; loadData() }
const onPageChange = (page: number) => { searchParams.current = page; loadData() }
const handlePageSizeChange = (option: any) => { searchParams.pageSize = option.value; searchParams.current = 1; loadData(); showPageSizeSheet.value = false }
const doSearch = () => { searchParams.current = 1; loadData() }

const deleteConfirmVisible = ref(false)
const selectedSpace = ref<API.SpaceVO | null>(null)
const showDeleteConfirm = (space: API.SpaceVO) => { selectedSpace.value = space; deleteConfirmVisible.value = true }

const confirmDelete = async () => {
  if (!selectedSpace.value?.id) return
  const res = await deleteSpaceUsingPost({ id: selectedSpace.value.id })
  if (res.data.code === 0) {
    deleteConfirmVisible.value = false
    loadData()
  }
}

const toggleRecommendStatus = async (space: API.SpaceVO) => {
  if (!space.id) return
  const recommendStatus = space.isRecommended === 1 ? 0 : 1
  const res = await setRecommendStatusUsingPost({ spaceId: space.id, recommendStatus: recommendStatus })
  if (res.data.code === 0) {
    message.success(space.isRecommended === 1 ? t('pages.admin.spaceManagePage.canceledRecommend') : t('pages.admin.spaceManagePage.setRecommendSuccess'))
    space.isRecommended = recommendStatus
  }
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
  searchParams.sortOrder = sortOrder.value
  loadData()
}

const getSpaceLevelClass = (level: number) => {
  const map: Record<number, string> = { 0: 'gray', 1: 'blue', 2: 'purple' }
  return map[level] || 'gray'
}
</script>

<style scoped>
#yuemu-spaceManagePage {
  height: 100%; box-sizing: border-box; background-color: var(--background); color: var(--text-primary);
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-font-semibold { font-weight: 600; }

/* PC 端布局样式 */
.yuemu-container { padding: 16px; max-width: 1400px; margin: 0 auto; }

.yuemu-header-panel {
  background-color: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; box-shadow: 0 4px 16px var(--shadow-color);
}

.yuemu-header-top-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);
}
.yuemu-page-title-text { margin: 0; font-size: 20px; font-weight: 600; color: var(--text-primary); }

.yuemu-search-form { display: flex; gap: 12px; }

:deep(.yuemu-select .ant-select-selector),
:deep(.yuemu-input) {
  background-color: transparent !important; color: var(--text-primary) !important;
  border-color: var(--border-color) !important; border-radius: 8px !important;
}

.yuemu-btn-primary { background-color: var(--link-color) !important; color: #fff !important; border: none; border-radius: 8px; font-weight: 500; }
.yuemu-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; }
.yuemu-btn-ghost.yuemu-orange { color: #f59e0b !important; border-color: rgba(245,158,11,0.5) !important; }
.yuemu-btn-ghost.yuemu-purple { color: #8b5cf6 !important; border-color: rgba(139,92,246,0.5) !important; }

.yuemu-action-group { display: flex; gap: 12px; align-items: center; }

.yuemu-table-wrapper {
  background-color: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px var(--shadow-color);
}

:deep(.yuemu-data-table) {
  .ant-table { background-color: transparent; color: var(--text-primary); }
  .ant-table-thead > tr > th { background-color: transparent; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-weight: 500; }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color); padding: 16px; }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
}

.yuemu-usage-info { font-size: 13px; line-height: 1.6; }
.yuemu-label { display: inline-block; width: 40px; color: var(--text-secondary); }

.yuemu-table-cover-img-wrap { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); }
.yuemu-table-cover-img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-table-cover-text { width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; border: 1px solid var(--border-color); }

.yuemu-tag { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.yuemu-level-blue { background-color: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.yuemu-level-purple { background-color: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
.yuemu-level-gray { background-color: var(--hover-background); color: var(--text-secondary); }

.yuemu-table-actions { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-link-blue { color: var(--link-color) !important; }
.yuemu-link-green { color: #10b981 !important; }
.yuemu-link-orange { color: #f59e0b !important; }
.yuemu-link-red { color: #ef4444 !important; }

.yuemu-pagination-box { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item) { background-color: transparent; border-color: var(--border-color); }
:deep(.ant-pagination-item-active) { background-color: var(--hover-background); border-color: var(--link-color); }

/* 移动端布局样式 */
.yuemu-mobile-container { height: 100%; background-color: var(--background); display: flex; flex-direction: column; }

.yuemu-sticky-header {
  position: sticky; top: 0; z-index: 100; padding: 16px 16px 12px;
  background-color: var(--header-background); border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px);
}

.yuemu-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-mobile-title { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); }
.yuemu-mobile-btn-icon { background-color: var(--link-color) !important; border: none !important; width: 32px; height: 32px; }

.yuemu-mobile-global-actions { display: flex; align-items: center; gap: 12px; }
.yuemu-pill-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; height: 36px; border-radius: 18px; font-size: 13px; font-weight: 600; }
.yuemu-pill-btn.yuemu-orange { background-color: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.yuemu-pill-btn.yuemu-purple { background-color: rgba(139,92,246,0.15); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); }
.yuemu-sort-trigger { font-size: 14px; color: var(--link-color); width: 32px; text-align: center; }

.yuemu-list-scroll-area { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-data-card { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; margin-bottom: 16px; box-shadow: 0 4px 12px var(--shadow-color); }

.yuemu-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.yuemu-space-cover-wrap { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0; background-color: var(--hover-background); }
.yuemu-space-cover-img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-space-cover-text { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; }

.yuemu-main-info { flex: 1; min-width: 0; }
.yuemu-name-text { font-size: 16px; font-weight: 600; color: var(--text-primary); }

.yuemu-usage-stats { background-color: var(--hover-background); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color); }
.yuemu-stat-item { display: flex; justify-content: space-between; font-size: 13px; }

.yuemu-card-actions { display: flex; gap: 8px; padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--border-color); }
.yuemu-action-pill { flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; background-color: var(--card-background); color: var(--text-primary); }
.yuemu-action-pill.yuemu-blue { color: var(--link-color); border-color: var(--link-color); }
.yuemu-action-pill.yuemu-green { color: #10b981; border-color: rgba(16,185,129,0.3); }
.yuemu-action-pill.yuemu-orange { color: #f59e0b; border-color: rgba(245,158,11,0.3); }
.yuemu-action-pill.yuemu-red { color: #ef4444; border-color: rgba(239,68,68,0.3); }

.yuemu-mobile-pager { margin-top: 24px; text-align: center; }
.yuemu-pagination-custom { justify-content: center; }
:deep(.yuemu-pagination-custom .van-pagination__item--active) { background-color: var(--link-color); color: #fff; border-radius: 8px; }

/* 弹窗确认框 */
.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-confirm-icon { font-size: 44px; color: #ef4444; margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4; }

.yuemu-confirm-footer { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-footer button { flex: 1; height: 50px; background: transparent; border: none; font-size: 16px; cursor: pointer; transition: 0.2s; }
.yuemu-btn-cancel { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-btn-confirm-danger { color: #ef4444; font-weight: 600 !important; border-bottom-right-radius: 16px; }
</style>
