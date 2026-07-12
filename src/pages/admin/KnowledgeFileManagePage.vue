<template>
  <div id="yuemu-knowledgeFileManagePage">
    <template v-if="device === 'pc'">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <a-form layout="inline" :model="searchParams" class="yuemu-search-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.originalName"
                :placeholder="t('pages.admin.knowledgeFileManagePage.searchFilename')"
                allow-clear
                class="yuemu-input"
              >
                <template #prefix><SearchOutlined class="yuemu-search-icon" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.fileType"
                class="yuemu-select"
                :dropdownClassName="'yuemu-select-dropdown'"
                :placeholder="t('pages.admin.knowledgeFileManagePage.fileType')"
                allow-clear
                style="width: 140px;"
              >
                <a-select-option value="pdf">PDF</a-select-option>
                <a-select-option value="txt">TXT</a-select-option>
                <a-select-option value="docx">DOCX</a-select-option>
                <a-select-option value="md">MD</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary"> {{ t('pages.admin.knowledgeFileManagePage.search') }} </a-button>
            </a-form-item>
          </a-form>

          <div class="yuemu-action-group">
            <a-button
              v-show="hasSelected"
              type="primary"
              danger
              @click="handleBatchDelete"
              class="yuemu-btn-danger"
            >
              <DeleteOutlined /> {{ t('pages.admin.knowledgeFileManagePage.batchDelete') }} </a-button>
            <a-upload
              name="file"
              :multiple="true"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :showUploadList="false"
              @change="handleUploadChange"
            >
              <a-button type="primary" class="yuemu-btn-primary">
                <UploadOutlined /> {{ t('pages.admin.knowledgeFileManagePage.uploadFile') }} </a-button>
            </a-upload>
          </div>
        </div>

        <div class="yuemu-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              :row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }"
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'originalName'">
                  <div class="yuemu-file-name-cell">
                    <div class="yuemu-file-icon-mini" :class="'yuemu-' + record.fileType">
                      <FileTextOutlined v-if="['txt', 'md'].includes(record.fileType)" />
                      <FilePdfOutlined v-else-if="record.fileType === 'pdf'" />
                      <FileWordOutlined v-else-if="record.fileType === 'docx'" />
                      <FileOutlined v-else />
                    </div>
                    <span class="yuemu-file-name-text" :title="record.originalName">
                      {{ truncateText(record.originalName, 30) }}
                    </span>
                  </div>
                </template>
                <template v-if="column.dataIndex === 'fileSizeDisplay'">
                  <span class="yuemu-text-secondary">{{ record.fileSizeDisplay }}</span>
                </template>
                <template v-if="column.dataIndex === 'fileType'">
                  <span class="yuemu-tag" :class="'yuemu-' + record.fileType">
                    {{ record.fileType.toUpperCase() }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'vectorCount'">
                  <span class="yuemu-tag yuemu-blue">{{ record.vectorCount || 0 }} 向量</span>
                </template>
                <template v-if="column.dataIndex === 'uploadTime'">
                  <span class="yuemu-text-secondary">{{ dayjs(record.uploadTime).format('YYYY-MM-DD HH:mm') }}</span>
                </template>
                <template v-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button type="text" class="yuemu-btn-text-blue" @click="handleView(record)"> {{ t('pages.admin.knowledgeFileManagePage.view') }} </a-button>
                    <a-button type="text" class="yuemu-btn-text-red" @click="showDeleteConfirm(record)"> {{ t('pages.admin.knowledgeFileManagePage.delete') }} </a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination-wrapper">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="['10', '20', '30', '50']"
            :total="total"
            :show-total="(total) => `共 ${total} 个文件`"
            show-size-changer
            :page-size="searchParams.pageSize"
            @change="doTableChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-mobile-container">
        <div class="yuemu-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-page-title"> {{ t('pages.admin.knowledgeFileManagePage.title') }} </h1>
            <a-upload
              name="file"
              :multiple="true"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :showUploadList="false"
              @change="handleUploadChange"
            >
              <van-button type="primary" size="small" icon="plus" class="yuemu-btn-icon" round />
            </a-upload>
          </div>
          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.originalName"
              :placeholder="t('pages.admin.knowledgeFileManagePage.searchFilename')"
              class="yuemu-search"
              shape="round"
              @search="doSearch"
              clearable
            />
          </div>

          <div class="yuemu-batch-action-bar" :class="{ 'yuemu-is-active': hasSelected }">
            <span class="yuemu-text-secondary">已选 {{ state.selectedRowKeys.length }} 项</span>
            <van-button size="mini" round type="danger" @click="handleBatchDelete"> {{ t('pages.admin.knowledgeFileManagePage.batchDelete') }} </van-button>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div class="yuemu-card-list">
              <div v-for="file in dataList" :key="file.id" class="yuemu-file-card">
                <div class="yuemu-card-header">
                  <van-checkbox :name="file.id" class="yuemu-checkbox" />
                  <div class="yuemu-file-icon-wrap" :class="'yuemu-' + file.fileType">
                    <FileTextOutlined v-if="['txt', 'md'].includes(file.fileType)" />
                    <FilePdfOutlined v-else-if="file.fileType === 'pdf'" />
                    <FileWordOutlined v-else-if="file.fileType === 'docx'" />
                    <FileOutlined v-else />
                  </div>
                  <div class="yuemu-file-main-info">
                    <div class="yuemu-name-row">
                      <span class="yuemu-file-name">{{ truncateText(file.originalName, 20) }}</span>
                    </div>
                    <div class="yuemu-meta-row yuemu-text-secondary">
                      {{ file.fileSizeDisplay }} • {{ dayjs(file.uploadTime).format('MM-DD HH:mm') }}
                    </div>
                  </div>
                </div>

                <div class="yuemu-card-body">
                  <div class="yuemu-tags-row">
                     <span class="yuemu-tag yuemu-mini" :class="'yuemu-' + file.fileType">
                        {{ file.fileType.toUpperCase() }}
                     </span>
                    <span class="yuemu-tag yuemu-mini yuemu-blue">
                        {{ file.vectorCount || 0 }} 向量
                     </span>
                    <span class="yuemu-tag yuemu-mini yuemu-gray">
                        @{{ file.userId || '未知' }}
                     </span>
                  </div>
                </div>

                <div class="yuemu-card-actions">
                  <button class="yuemu-action-btn yuemu-view" @click="handleView(file)"> {{ t('pages.admin.knowledgeFileManagePage.viewFile') }} </button>
                  <button class="yuemu-action-btn yuemu-danger" @click="showDeleteConfirm(file)"> {{ t('pages.admin.knowledgeFileManagePage.delete') }} </button>
                </div>
              </div>
            </div>
          </van-checkbox-group>

          <div class="yuemu-mobile-pagination">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>共 {{ total }} 个文件</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} {{ t('pages.admin.knowledgeFileManagePage.recordsPerPageText') }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.knowledgeFileManagePage.prevPage')" :next-text="t('pages.admin.knowledgeFileManagePage.nextPage')"
              v-model="searchParams.current"
              :total-items="total"
              :items-per-page="searchParams.pageSize"
              @change="onMobilePageChange"
              :show-page-size="3"
              force-ellipses
              class="yuemu-van-pagination"
            />
          </div>
        </div>

        <van-action-sheet
          v-model:show="showPageSizeSheet"
          :actions="pageSizeOptions"
          :cancel-text="t('pages.admin.knowledgeFileManagePage.cancel')"
          close-on-click-action
          @select="handlePageSizeChange"
          class="yuemu-action-sheet"
        />
      </div>
    </template>

    <a-modal
      v-model:open="deleteConfirmVisible"
      :title="null"
      :footer="null"
      :width="360"
      class="yuemu-confirm-modal"
      centered
    >
      <div class="yuemu-confirm-content">
        <div class="yuemu-icon-wrap">
          <ExclamationCircleFilled />
        </div>
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.knowledgeFileManagePage.confirmDeleteTitle') }} </h3>
        <p class="yuemu-confirm-desc">
          文件：{{ selectedFile?.originalName }}<br>
          大小：{{ selectedFile?.fileSizeDisplay }}<br>
          删除后知识库向量将同步移除，不可恢复。
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="deleteConfirmVisible = false"> {{ t('pages.admin.knowledgeFileManagePage.cancel') }} </button>
          <button class="yuemu-danger-btn" @click="confirmDelete"> {{ t('pages.admin.knowledgeFileManagePage.confirmDelete') }} </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { computed, onMounted, reactive, ref } from 'vue';
import {
  listKnowledgeFileVoByPageUsingPost,
  batchDeleteKnowledgeFilesUsingPost
} from '@/api/knowledgeFileController';
import { message } from 'ant-design-vue';
import {
  SearchOutlined,
  UploadOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { getDeviceType } from '@/utils/device';

const device = ref('');

onMounted(async () => {
  device.value = await getDeviceType();
  fetchData();
});

const columns = [
  { title: '文件信息', dataIndex: 'originalName', width: 260 },
  { title: '大小', dataIndex: 'fileSizeDisplay', width: 100 },
  { title: '格式', dataIndex: 'fileType', width: 100 },
  { title: '向量数量', dataIndex: 'vectorCount', width: 120 },
  { title: t('pages.admin.knowledgeFileManagePage.colUploadTime'), dataIndex: 'uploadTime', width: 160 },
  { title: t('pages.admin.knowledgeFileManagePage.colActionText'), key: 'action', width: 140, align: 'right' },
];

const dataList = ref([]);
const total = ref(0);
const loading = ref(false);

const searchParams = reactive({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
  originalName: undefined,
  fileType: undefined
});

const state = reactive({ selectedRowKeys: [], loading: false });
const hasSelected = computed(() => state.selectedRowKeys.length > 0);

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const fetchData = async () => {
  if (device.value === 'pc') loading.value = true;
  try {
    const res = await listKnowledgeFileVoByPageUsingPost({ ...searchParams });
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records || [];
      total.value = res.data.data.total || 0;
    } else {
      message.error('获取数据失败，' + res.data.message);
    }
  } catch (error) {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

const doSearch = () => {
  searchParams.current = 1;
  fetchData();
};

const doTableChange = (page) => {
  searchParams.current = page.current || page;
  searchParams.pageSize = page.pageSize || searchParams.pageSize;
  fetchData();
};

const onSelectChange = (selectedRowKeys) => {
  state.selectedRowKeys = selectedRowKeys;
};

const handleBatchDelete = async () => {
  if (state.selectedRowKeys.length === 0) return;
  try {
    const res = await batchDeleteKnowledgeFilesUsingPost(state.selectedRowKeys);
    if (res.data.code === 0) {
      message.success('批量删除成功');
      state.selectedRowKeys = [];
      fetchData();
    } else {
      message.error('批量删除失败：' + res.data.message);
    }
  } catch (error) {
    message.error('批量删除异常');
  }
};

const handleView = (record) => {
  if (record.fileUrl) {
    window.open(record.fileUrl, '_blank');
  } else {
    message.warning('文件链接不可用');
  }
};

const deleteConfirmVisible = ref(false);
const selectedFile = ref(null);

const showDeleteConfirm = (file) => {
  selectedFile.value = file;
  deleteConfirmVisible.value = true;
};

const confirmDelete = async () => {
  if (!selectedFile.value?.id) return;
  try {
    const res = await batchDeleteKnowledgeFilesUsingPost([selectedFile.value.id]);
    if (res.data.code === 0) {
      message.success('删除成功');
      deleteConfirmVisible.value = false;
      fetchData();
    } else {
      message.error('删除失败：' + res.data.message);
    }
  } catch (error) {
    message.error('删除异常');
  }
};

/* 移动端逻辑 */
const showPageSizeSheet = ref(false);
const pageSizeOptions = [
  { name: t('pages.admin.knowledgeFileManagePage.pageSize10Text'), value: 10 },
  { name: t('pages.admin.knowledgeFileManagePage.pageSize20Text'), value: 20 },
  { name: t('pages.admin.knowledgeFileManagePage.pageSize30Text'), value: 30 },
  { name: t('pages.admin.knowledgeFileManagePage.pageSize50Text'), value: 50 },
];

const onMobilePageChange = (page) => {
  searchParams.current = page;
  fetchData();
};

const handlePageSizeChange = (action) => {
  searchParams.current = 1;
  searchParams.pageSize = action.value;
  fetchData();
};

/* 上传逻辑 */
const uploadUrl = ref(`${location.origin}/api/knowledgeFile/upload`);
const uploadHeaders = ref({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

const handleUploadChange = (info) => {
  const fileName = info.file.name;
  const fileExtension = fileName.split('.').pop().toLowerCase();
  const allowedExtensions = ['pdf', 'txt', 'docx', 'md'];

  if (!allowedExtensions.includes(fileExtension)) {
    message.error(`不支持该格式，仅支持 ${allowedExtensions.join(', ')}`);
    return;
  }
  if (info.file.status === 'done') {
    message.success(`${info.file.name} 上传成功`);
    fetchData();
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败`);
  }
};
</script>

<style scoped>
/* ==================== 统一依赖 CSS 变量 ==================== */
#yuemu-knowledgeFileManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}
.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-search-icon { color: var(--text-secondary); }

/* ==================== PC 端样式 ==================== */
.yuemu-pc-container {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

.yuemu-header-panel {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 16px var(--shadow-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  transition: var(--theme-transition);
}

.yuemu-search-form { display: flex; gap: 12px; }

:deep(.yuemu-input), :deep(.ant-input-affix-wrapper), :deep(.yuemu-select .ant-select-selector) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: var(--theme-transition);
}
:deep(.yuemu-input input), :deep(.ant-input-affix-wrapper input) { background-color: transparent !important; color: var(--text-primary) !important; }
:deep(.yuemu-input input::placeholder), :deep(.ant-input-affix-wrapper input::placeholder), :deep(.yuemu-select .ant-select-selection-placeholder) { color: var(--text-secondary) !important; }
:deep(.yuemu-input:focus-within), :deep(.ant-input-affix-wrapper-focused), :deep(.yuemu-select.ant-select-focused .ant-select-selector) { border-color: var(--link-color) !important; }

.yuemu-action-group { display: flex; gap: 12px; align-items: center; }

.yuemu-btn-primary { background-color: var(--link-color) !important; color: var(--text-other) !important; border: none !important; border-radius: 8px !important; font-weight: 500; transition: var(--theme-transition); }
.yuemu-btn-primary:hover { background-color: var(--link-hover-color) !important; }
.yuemu-btn-danger { border-radius: 8px !important; }

.yuemu-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: var(--theme-transition);
}

:deep(.yuemu-table) {
  .ant-table { background-color: transparent; color: var(--text-primary); }
  .ant-table-thead > tr > th { background-color: transparent; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-weight: 500; }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color); padding: 16px; color: var(--text-primary); transition: var(--theme-transition); }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
  .ant-empty-description { color: var(--text-secondary); }
}

.yuemu-file-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.yuemu-file-icon-mini {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

/* 文件类型颜色映射 */
.yuemu-pdf { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
.yuemu-txt { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
.yuemu-docx { background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.2); }
.yuemu-md { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }

.yuemu-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
}
.yuemu-tag.yuemu-mini { padding: 2px 8px; font-size: 11px; }
.yuemu-tag.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
.yuemu-tag.yuemu-gray { background-color: var(--hover-background); color: var(--text-secondary); border-color: var(--border-color); }

.yuemu-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-blue { color: var(--link-color) !important; }
.yuemu-btn-text-red { color: var(--comment-delete-hover-color) !important; }
.yuemu-action-buttons .ant-btn { font-size: 13px; border-radius: 6px; }
.yuemu-action-buttons .ant-btn:hover { background-color: var(--hover-background); }

.yuemu-pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item) { background-color: transparent; border-color: var(--border-color); }
:deep(.ant-pagination-item-active) { background-color: var(--hover-background); border-color: var(--link-color); }

/* ==================== 移动端展示 ==================== */
.yuemu-mobile-container {
  height: 100%;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
}

.yuemu-sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--header-background);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 16px 16px 8px;
}
.yuemu-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); }

.yuemu-btn-icon { background-color: var(--link-color) !important; border: none !important; width: 32px; height: 32px; box-shadow: 0 2px 8px var(--shadow-color); }

.yuemu-search-bar-wrapper { display: flex; align-items: center; gap: 12px; }
:deep(.yuemu-search) { flex: 1; padding: 0 !important; background-color: transparent !important; }
:deep(.yuemu-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }

.yuemu-batch-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}
.yuemu-batch-action-bar.yuemu-is-active {
  height: 44px;
  opacity: 1;
  margin-top: 8px;
  border-top: 1px solid var(--border-color);
}

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-card-list { display: flex; flex-direction: column; gap: 16px; }

.yuemu-file-card {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition: var(--theme-transition);
}

.yuemu-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.yuemu-file-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 22px;
  flex-shrink: 0;
}
.yuemu-file-main-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;}
.yuemu-name-row .yuemu-file-name { font-size: 15px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

.yuemu-tags-row { margin-bottom: 4px; display: flex; gap: 6px; flex-wrap: wrap;}

.yuemu-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}
.yuemu-action-btn {
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-size: 13px;
  font-weight: 500;
  background-color: var(--card-background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}
.yuemu-action-btn.yuemu-view { color: var(--link-color); }
.yuemu-action-btn.yuemu-danger { color: var(--comment-delete-hover-color); }

.yuemu-mobile-pagination { margin-top: 24px; }
.yuemu-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: var(--hover-background); border-radius: 12px; color: var(--link-color); border: 1px solid var(--border-color); }
:deep(.yuemu-van-pagination .van-pagination__item--active) { background-color: var(--link-color); color: var(--text-other); }

:deep(.yuemu-action-sheet) { background-color: var(--card-background); color: var(--text-primary); }
:deep(.yuemu-action-sheet .van-action-sheet__item) { background-color: var(--card-background); color: var(--text-primary); border-bottom: 1px solid var(--border-color); }

/* ==================== 统一确认删除弹窗 ==================== */
:deep(.yuemu-confirm-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-body { padding: 24px; }
}
.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: var(--comment-delete-hover-color); margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 20px 0; line-height: 1.4; }

.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; transition: var(--theme-transition); }
.yuemu-confirm-actions button:hover { background-color: var(--hover-background); }
.yuemu-cancel-btn { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-danger-btn { color: var(--comment-delete-hover-color); font-weight: 600 !important; border-bottom-right-radius: 16px; }
</style>
