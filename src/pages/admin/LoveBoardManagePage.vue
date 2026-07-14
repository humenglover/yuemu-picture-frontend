<template>
  <div id="yuemu-love-manage-page">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-dashboard-container">
        <header class="yuemu-top-bar">
          <div class="yuemu-bar-left">
            <h2 class="yuemu-main-title"> {{ t('pages.admin.loveBoardManagePage.title') }} <span class="yuemu-badge-count">{{ pcState.total }}</span></h2>
            <p class="yuemu-sub-title"> {{ t('pages.admin.loveBoardManagePage.subTitle') }} </p>
          </div>

          <div class="yuemu-bar-actions">
            <div class="yuemu-search-group">
              <SearchOutlined class="yuemu-search-icon" />
              <input v-model="searchParams.id" :placeholder="t('pages.admin.loveBoardManagePage.searchId')" @keyup.enter="onSearchPC" />
            </div>
            <a-select
              v-model:value="searchParams.status"
              :placeholder="t('pages.admin.loveBoardManagePage.statusFilter')"
              allow-clear
              class="yuemu-status-select"
              dropdownClassName="yuemu-dark-dropdown"
              @change="onSearchPC"
            >
              <a-select-option :value="1"> {{ t('pages.admin.loveBoardManagePage.running') }} </a-select-option>
              <a-select-option :value="0"> {{ t('pages.admin.loveBoardManagePage.stopped') }} </a-select-option>
            </a-select>
            <button class="yuemu-refresh-btn" @click="loadData" :class="{ 'yuemu-is-loading': pcState.loading }">
              <ReloadOutlined />
            </button>
          </div>
        </header>

        <div class="yuemu-board-grid">
          <div v-for="item in pcState.list" :key="item.id" class="yuemu-board-card">
            <div class="yuemu-card-visual">
              <img :src="item.bgCover" class="yuemu-bg-img" loading="lazy" />
              <div class="yuemu-status-glow" :class="item.status === 1 ? 'is-active' : 'is-stopped'"></div>
              <div class="yuemu-card-overlay">
                <button class="yuemu-btn-white" @click="handleEdit(item)"> {{ t('pages.admin.loveBoardManagePage.config') }} </button>
              </div>
            </div>

            <div class="yuemu-card-content">
              <div class="yuemu-couple-info">
                <div class="yuemu-avatar-pair">
                  <img :src="item.manCover" :title="t('pages.admin.loveBoardManagePage.man')" />
                  <img :src="item.womanCover" :title="t('pages.admin.loveBoardManagePage.woman')" class="yuemu-overlap" />
                </div>
                <div class="yuemu-names">
                  <span class="yuemu-names-text">{{ item.manName }} & {{ item.womanName }}</span>
                  <span class="yuemu-card-id"># {{ item.id }}</span>
                </div>
              </div>

              <div class="yuemu-card-footer">
                <span class="yuemu-time-tag"><CalendarOutlined /> {{ item.timing || t('pages.admin.loveBoardManagePage.notSet') }}</span>
                <div class="yuemu-footer-btns">
                  <button class="yuemu-mini-btn yuemu-danger" @click="handleDelete(item.id)">
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="yuemu-pagination-footer">
          <a-pagination
            v-model:current="pcState.current"
            :total="pcState.total"
            :pageSize="pcState.pageSize"
            show-less-items
            @change="loadData"
          />
        </footer>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-m-container">
        <div class="yuemu-m-sticky-header">
          <div class="yuemu-m-header-main">
            <h1 class="yuemu-m-title"> {{ t('pages.admin.loveBoardManagePage.mTitle') }} </h1>
            <button class="yuemu-m-refresh-icon" @click="loadData" :class="{ 'yuemu-is-loading': pcState.loading }">
              <ReloadOutlined />
            </button>
          </div>

          <div class="yuemu-m-search-row">
            <div class="yuemu-m-search-box">
              <SearchOutlined class="yuemu-m-icon-search" />
              <input v-model="searchParams.id" :placeholder="t('pages.admin.loveBoardManagePage.mSearchId')" class="yuemu-m-input" @keyup.enter="onSearchPC" />
            </div>
            <select v-model="searchParams.status" class="yuemu-m-select" @change="onSearchPC">
              <option :value="undefined"> {{ t('pages.admin.loveBoardManagePage.allStatus') }} </option>
              <option :value="1"> {{ t('pages.admin.loveBoardManagePage.running') }} </option>
              <option :value="0"> {{ t('pages.admin.loveBoardManagePage.stopped') }} </option>
            </select>
          </div>
        </div>

        <div class="yuemu-m-scroll-view">
          <div class="yuemu-m-card-list">
            <div v-for="item in pcState.list" :key="item.id" class="yuemu-m-board-card">
              <div class="yuemu-m-card-cover" @click="handleEdit(item)">
                <img :src="item.bgCover" class="yuemu-m-bg" loading="lazy" />
                <div class="yuemu-m-status-badge" :class="item.status === 1 ? 'is-live' : 'is-stop'">
                  <span class="yuemu-m-dot"></span>
                  {{ item.status === 1 ? '运行中' : '已停止' }}
                </div>
              </div>

              <div class="yuemu-m-card-body">
                <div class="yuemu-m-couple-row">
                  <div class="yuemu-m-avatar-group">
                    <img :src="item.manCover" />
                    <img :src="item.womanCover" class="yuemu-m-avatar-overlap" />
                  </div>
                  <div class="yuemu-m-names-col">
                    <span class="yuemu-m-couple-name">{{ item.manName }} & {{ item.womanName }}</span>
                    <span class="yuemu-m-timing"><CalendarOutlined /> {{ item.timing || t('pages.admin.loveBoardManagePage.notSetTiming') }}</span>
                  </div>
                </div>
              </div>

              <div class="yuemu-m-card-actions">
                <button class="yuemu-m-action-btn yuemu-m-edit" @click.stop="handleEdit(item)"> {{ t('pages.admin.loveBoardManagePage.configBoard') }} </button>
                <button class="yuemu-m-action-btn yuemu-m-danger" @click.stop="handleDelete(item.id)"> {{ t('pages.admin.loveBoardManagePage.delete') }} </button>
              </div>
            </div>
          </div>

          <div class="yuemu-m-empty" v-if="pcState.list.length === 0 && !pcState.loading">
            暂无画板数据
          </div>

          <div class="yuemu-m-pagination" v-if="pcState.total > 0">
            <button class="yuemu-m-page-btn" :disabled="pcState.current === 1" @click="changePage(pcState.current - 1)"> {{ t('pages.admin.loveBoardManagePage.prevPage') }} </button>
            <span class="yuemu-m-page-text">{{ pcState.current }} / {{ Math.ceil(pcState.total / pcState.pageSize) || 1 }}</span>
            <button class="yuemu-m-page-btn" :disabled="pcState.current >= Math.ceil(pcState.total / pcState.pageSize)" @click="changePage(pcState.current + 1)"> {{ t('pages.admin.loveBoardManagePage.nextPage') }} </button>
          </div>
        </div>
      </div>
    </template>

    <a-modal
      v-model:open="editModalVisible"
      :title="t('pages.admin.loveBoardManagePage.configCenter')"
      :footer="null"
      width="480px"
      wrapClassName="yuemu-apple-modal-wrap"
      class="yuemu-apple-modal"
      centered
    >
      <div class="yuemu-config-form">
        <div class="yuemu-form-section">
          <label> {{ t('pages.admin.loveBoardManagePage.boardStatus') }} </label>
          <div class="yuemu-apple-switch-row" @click="editForm.status = !editForm.status">
            <div class="yuemu-apple-switch" :class="{ 'is-on': editForm.status }">
              <div class="yuemu-switch-dot"></div>
            </div>
            <span class="yuemu-switch-desc">{{ editForm.status ? '允许公开访问' : '暂时停止维护' }}</span>
          </div>
        </div>

        <div class="yuemu-form-group">
          <label> {{ t('pages.admin.loveBoardManagePage.coupleName') }} </label>
          <div class="yuemu-input-pair">
            <input v-model="editForm.manName" :placeholder="t('pages.admin.loveBoardManagePage.manName')" />
            <span class="yuemu-divider">&</span>
            <input v-model="editForm.womanName" :placeholder="t('pages.admin.loveBoardManagePage.womanName')" />
          </div>
        </div>

        <div class="yuemu-form-group">
          <label>{{ t('pages.admin.loveBoardManagePage.timing') }}</label>
          <input class="yuemu-full-input" v-model="editForm.timing" placeholder="YYYY-MM-DD" />
        </div>

        <div class="yuemu-modal-actions">
          <button class="yuemu-btn-secondary" @click="editModalVisible = false"> {{ t('pages.admin.loveBoardManagePage.cancel') }} </button>
          <button class="yuemu-btn-primary-gradient" :loading="editSubmitLoading" @click="handleEditSubmit"> {{ t('pages.admin.loveBoardManagePage.saveConfig') }} </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, reactive, onMounted } from 'vue'
import {
  listLoveBoardsByPageUsingPost,
  updateLoveBoardAdminUsingPost,
  batchOperationLoveBoardsUsingPost
} from '@/api/loveBoardController'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import { SearchOutlined, ReloadOutlined, CalendarOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const device = ref<string>('')
const searchParams = reactive({ id: undefined, status: undefined })
// PC和移动端共用一套状态，因为逻辑完全一致
const pcState = reactive({ list: [], loading: false, total: 0, current: 1, pageSize: 8 })
const editModalVisible = ref(false)
const editSubmitLoading = ref(false)
const editForm = reactive({ id: undefined, status: true, manName: '', womanName: '', timing: '' })

const loadData = async () => {
  pcState.loading = true
  try {
    const res = await listLoveBoardsByPageUsingPost({ ...searchParams, current: pcState.current, pageSize: pcState.pageSize, sortOrder: 'descend' })
    if (res.data?.code === 0) {
      pcState.list = res.data.data.records || []
      pcState.total = parseInt(res.data.data.total) || 0
    }
  } finally { pcState.loading = false }
}

const onSearchPC = () => { pcState.current = 1; loadData() }

const changePage = (page: number) => {
  pcState.current = page
  loadData()
  // 移动端翻页后滚动到顶部
  if (device.value !== DEVICE_TYPE_ENUM.PC) {
    document.querySelector('.yuemu-m-scroll-view')?.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const handleEdit = (record: any) => {
  Object.assign(editForm, { ...record, status: record.status === 1 })
  editModalVisible.value = true
}

const handleEditSubmit = async () => {
  editSubmitLoading.value = true
  try {
    const res = await updateLoveBoardAdminUsingPost({ ...editForm, status: editForm.status ? 1 : 0 })
    if (res.data?.code === 0) {
      message.success(t('common.message.operationSuccess')); editModalVisible.value = false; loadData()
    }
  } finally { editSubmitLoading.value = false }
}

const handleDelete = (id: any) => {
  batchOperationLoveBoardsUsingPost({ ids: [id], operation: 'delete' }).then(res => {
    if (res.data.code === 0) { message.success(t('common.message.deleteSuccess')); loadData() }
  })
}

onMounted(async () => {
  device.value = await getDeviceType()
  loadData()
})
</script>

<style scoped>
/* ==================== 统一全局变量与背景 ==================== */
#yuemu-love-manage-page {
  background-color: var(--background);

  padding-bottom: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* ==================== PC 端：Dashboard 风格 ==================== */
.yuemu-dashboard-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 24px;
}

.yuemu-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.yuemu-main-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.yuemu-badge-count {
  font-size: 14px;
  background: var(--link-color);
  color: #fff;
  padding: 2px 10px;
  border-radius: 20px;
}

.yuemu-sub-title {
  color: var(--text-secondary);
  margin: 4px 0 0;
  font-size: 14px;
}

.yuemu-bar-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

/* 搜索框设计 */
.yuemu-search-group {
  display: flex;
  align-items: center;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  padding: 0 16px;
  border-radius: 12px;
  height: 42px;
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: all 0.3s;
}
.yuemu-search-group:focus-within { border-color: var(--link-color); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }

.yuemu-search-group input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  outline: none;
  margin-left: 8px;
  width: 150px;
}
.yuemu-search-group input::placeholder { color: var(--text-secondary); opacity: 0.6; }

.yuemu-search-icon { color: var(--text-secondary); }

/* AntD Select 穿透修复 */
:deep(.yuemu-status-select .ant-select-selector) {
  background-color: var(--card-background) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
  height: 42px !important;
  display: flex;
  align-items: center;
  color: var(--text-primary) !important;
  box-shadow: 0 2px 8px var(--shadow-color) !important;
}
:deep(.yuemu-status-select .ant-select-selection-placeholder) { color: var(--text-secondary) !important; opacity: 0.6; }
:deep(.yuemu-status-select .ant-select-arrow) { color: var(--text-secondary) !important; }

@media (prefers-color-scheme: dark) { .yuemu-dark-dropdown {
  background-color: #262626 !important;
  border: 1px solid #3a3a3a !important;
} }
@media (prefers-color-scheme: dark) { .yuemu-dark-dropdown .ant-select-item { color: #e5e5e5 !important; } }
@media (prefers-color-scheme: dark) { .yuemu-dark-dropdown .ant-select-item-option-active { background-color: #383838 !important; } }

/* 刷新按钮动画 */
.yuemu-refresh-btn {
  width: 42px;
  height: 42px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.yuemu-refresh-btn:hover { border-color: var(--link-color); color: var(--link-color); }
.yuemu-is-loading { animation: yuemu-spin 1s linear infinite; }

@keyframes yuemu-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ==================== PC 画板卡片网格 ==================== */
.yuemu-board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.yuemu-board-card {
  background: var(--card-background);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.yuemu-board-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px var(--shadow-color);
  border-color: var(--link-color);
}

.yuemu-card-visual {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.yuemu-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}

.yuemu-board-card:hover .yuemu-bg-img { transform: scale(1.1); }

/* 状态呼吸灯 */
.yuemu-status-glow {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  z-index: 2;
}

.yuemu-status-glow.is-active {
  background: #10b981;
  box-shadow: 0 0 12px #10b981;
  animation: yuemu-pulse 2s infinite;
}

.yuemu-status-glow.is-stopped { background: #ef4444; }

@keyframes yuemu-pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.yuemu-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: 0.3s;
  backdrop-filter: blur(4px);
}

.yuemu-board-card:hover .yuemu-card-overlay { opacity: 1; }

.yuemu-btn-white {
  background: #fff;
  color: #000;
  border: none;
  padding: 8px 24px;
  border-radius: 99px;
  font-weight: 600;
  cursor: pointer;
}

/* 卡片内容区 */
.yuemu-card-content { padding: 20px; }

.yuemu-couple-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.yuemu-avatar-pair {
  display: flex;
  align-items: center;
}

.yuemu-avatar-pair img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--card-background);
  object-fit: cover;
}

.yuemu-overlap { margin-left: -12px; }

.yuemu-names-text {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.yuemu-card-id {
  font-size: 12px;
  color: var(--text-secondary);
}

.yuemu-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.yuemu-time-tag {
  font-size: 12px;
  color: var(--text-secondary);
}

.yuemu-mini-btn {
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  color: var(--text-secondary);
  background: transparent;
  border: none;
}

.yuemu-mini-btn.yuemu-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* PC 分页 */
.yuemu-pagination-footer { margin-top: 40px; display: flex; justify-content: center; }
:deep(.ant-pagination-item) { background: transparent !important; border: none !important; }
:deep(.ant-pagination-item-active a) { color: var(--link-color) !important; font-weight: 800; }
:deep(.ant-pagination-item a) { color: var(--text-primary) !important; }
:deep(.ant-pagination-prev button), :deep(.ant-pagination-next button) { color: var(--text-primary) !important; }

/* ==================== 移动端：高质感流式卡片 ==================== */
.yuemu-m-container { display: flex; flex-direction: column;  }

.yuemu-m-sticky-header {
  position: sticky; top: 0; z-index: 100;
  padding: 16px 16px 12px;
  background: rgba(var(--header-background-rgb, 255,255,255), 0.85); /* 默认/浅色 */
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}
@media (prefers-color-scheme: dark) { .yuemu-m-sticky-header { background: rgba(30, 30, 30, 0.85); } }

.yuemu-m-header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.yuemu-m-title { font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0; }
.yuemu-m-refresh-icon { background: transparent; border: none; font-size: 18px; color: var(--text-primary); padding: 4px; }

.yuemu-m-search-row { display: flex; gap: 12px; align-items: center; }
.yuemu-m-search-box {
  flex: 1; display: flex; align-items: center; background: var(--hover-background);
  border: 1px solid var(--border-color); border-radius: 14px; padding: 0 12px; height: 40px;
}
.yuemu-m-icon-search { color: var(--text-secondary); margin-right: 8px; }
.yuemu-m-input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 14px; outline: none; width: 100%;}
.yuemu-m-input::placeholder { color: var(--text-secondary); opacity: 0.6; }

.yuemu-m-select {
  background: var(--hover-background); color: var(--text-primary);
  border: 1px solid var(--border-color); border-radius: 14px; height: 40px;
  padding: 0 12px; font-size: 14px; outline: none; appearance: none; /* 移除原生箭头 */
}
/* 解决暗色模式下移动端 select 展开选项白色背景的问题（因系统限制较难完美，但基础背景已修） */

.yuemu-m-scroll-view { flex: 1; overflow-y: auto; padding: 16px; }
.yuemu-m-card-list { display: flex; flex-direction: column; gap: 20px; }

.yuemu-m-board-card {
  background: var(--card-background); border-radius: 24px; overflow: hidden;
  border: 1px solid var(--border-color); box-shadow: 0 8px 24px var(--shadow-color);
}

.yuemu-m-card-cover { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; }
.yuemu-m-bg { width: 100%; height: 100%; object-fit: cover; }
.yuemu-m-status-badge {
  position: absolute; top: 12px; right: 12px;
  display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600; color: #fff; backdrop-filter: blur(8px);
}
.yuemu-m-status-badge.is-live { background: rgba(16, 185, 129, 0.85); }
.yuemu-m-status-badge.is-stop { background: rgba(239, 68, 68, 0.85); }
.yuemu-m-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.is-live .yuemu-m-dot { animation: yuemu-pulse 2s infinite; }

.yuemu-m-card-body { padding: 16px; }
.yuemu-m-couple-row { display: flex; align-items: center; gap: 12px; }
.yuemu-m-avatar-group { display: flex; align-items: center; }
.yuemu-m-avatar-group img { width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--card-background); object-fit: cover; }
.yuemu-m-avatar-overlap { margin-left: -16px; }

.yuemu-m-names-col { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
.yuemu-m-couple-name { font-size: 16px; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-m-timing { font-size: 12px; color: var(--text-secondary); }

.yuemu-m-card-actions { display: flex; gap: 12px; padding: 0 16px 16px; }
.yuemu-m-action-btn { flex: 1; padding: 10px 0; border-radius: 12px; font-size: 14px; font-weight: 600; border: none; }
.yuemu-m-edit { background: var(--hover-background); color: var(--text-primary); border: 1px solid var(--border-color); }
.yuemu-m-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.yuemu-m-empty { text-align: center; padding: 40px; color: var(--text-secondary); font-size: 14px; }

/* 移动端极简分页 */
.yuemu-m-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-bottom: 24px;}
.yuemu-m-page-btn { padding: 8px 20px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-background); color: var(--text-primary); font-size: 14px; font-weight: 500;}
.yuemu-m-page-btn:disabled { opacity: 0.4; }
.yuemu-m-page-text { font-size: 14px; color: var(--text-secondary); font-weight: 600; }


/* ==================== 苹果风格 Modal (双端通用) ==================== */
:deep(.yuemu-apple-modal .ant-modal-content) {
  background: var(--card-background);
  border-radius: 24px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border-color);
}
:deep(.yuemu-apple-modal .ant-modal-header) { background: var(--card-background); padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-title) { font-weight: 700; font-size: 18px; text-align: center; color: var(--text-primary); }
:deep(.yuemu-apple-modal .ant-modal-close) { color: var(--text-secondary); }

.yuemu-config-form { padding: 24px; }
.yuemu-config-form label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.yuemu-form-section, .yuemu-form-group { margin-bottom: 20px; }

.yuemu-apple-switch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--hover-background);
  padding: 12px 16px;
  border-radius: 16px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: 0.2s;
}
.yuemu-apple-switch-row:active { border-color: var(--border-color); }

.yuemu-apple-switch {
  width: 46px;
  height: 24px;
  background: #39393d;
  border-radius: 20px;
  position: relative;
  transition: 0.3s;
}

.yuemu-apple-switch.is-on { background: #34c759; }

.yuemu-switch-dot {
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.yuemu-apple-switch.is-on .yuemu-switch-dot { transform: translateX(22px); }
.yuemu-switch-desc { color: var(--text-primary); font-weight: 500; font-size: 14px;}

.yuemu-input-pair {
  display: flex;
  align-items: center;
  background: var(--hover-background);
  border-radius: 12px;
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  transition: 0.2s;
}
.yuemu-input-pair:focus-within { border-color: var(--link-color); }

.yuemu-input-pair input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 8px;
  color: var(--text-primary);
  text-align: center;
  outline: none;
  font-size: 14px;
}
.yuemu-input-pair input::placeholder { color: var(--text-secondary); opacity: 0.6; }

.yuemu-divider { color: var(--text-secondary); font-weight: bold; }

.yuemu-full-input {
  width: 100%;
  background: var(--hover-background);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: 12px;
  color: var(--text-primary);
  outline: none;
  font-size: 14px;
  transition: 0.2s;
}
.yuemu-full-input:focus { border-color: var(--link-color); }
.yuemu-full-input::placeholder { color: var(--text-secondary); opacity: 0.6; }

.yuemu-modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.yuemu-btn-secondary {
  flex: 1;
  padding: 12px;
  border-radius: 14px;
  background: var(--hover-background);
  color: var(--text-primary);
  font-weight: 600;
  border: 1px solid var(--border-color);
  cursor: pointer;
}

.yuemu-btn-primary-gradient {
  flex: 2;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--link-color), var(--link-hover-color));
  color: #fff;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 15px rgba(var(--link-color-rgb), 0.3);
  cursor: pointer;
}
.yuemu-btn-primary-gradient:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
