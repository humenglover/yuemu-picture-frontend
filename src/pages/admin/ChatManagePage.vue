<template>
  <div id="yuemu-chatManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <div class="yuemu-header-main-row">
            <div class="yuemu-page-info">
              <h1 class="yuemu-page-title">{{ t('pages.admin.chatManagePage.title') }}</h1>
              <p class="yuemu-text-secondary" style="margin: 4px 0 0 0; font-size: 13px;">{{ t('pages.admin.chatManagePage.desc') }}</p>
            </div>
            <div class="yuemu-action-group">
              <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
                <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
                <SortDescendingOutlined v-else />
                {{ sortOrder === 'ascend' ? t('pages.admin.chatManagePage.timeAsc') : t('pages.admin.chatManagePage.timeDesc') }}
              </a-button>
              <a-button
                v-show="hasSelected"
                type="primary"
                @click="batchRestoreSelectedMessages"
                class="yuemu-btn-success"
              >
                <UndoOutlined /> {{ t('pages.admin.chatManagePage.batchRestore') }}
              </a-button>
              <a-button
                v-show="hasSelected"
                type="primary"
                danger
                @click="batchDeleteSelectedMessages"
                class="yuemu-btn-danger"
              >
                <DeleteOutlined /> {{ t('pages.admin.chatManagePage.batchDelete') }}
              </a-button>
            </div>
          </div>

          <div class="yuemu-search-form">
            <a-input
              v-model:value="searchParams.content"
              :placeholder="t('pages.admin.chatManagePage.searchPlaceholder')"
              allowClear
              @change="doSearch"
              class="yuemu-input"
              style="width: 240px"
            >
              <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
            </a-input>
            <a-select
              v-model:value="searchParams.type"
              :placeholder="t('pages.admin.chatManagePage.messageType')"
              class="yuemu-select"
              :dropdownClassName="'yuemu-select-dropdown'"
              allowClear
              @change="doSearch"
              style="width: 140px"
            >
              <a-select-option :value="1">{{ t('pages.admin.chatManagePage.privateChat') }}</a-select-option>
              <a-select-option :value="2">{{ t('pages.admin.chatManagePage.picComment') }}</a-select-option>
              <a-select-option :value="3">{{ t('pages.admin.chatManagePage.spaceMessage') }}</a-select-option>
            </a-select>
            <a-select
              v-model:value="searchParams.isDelete"
              :placeholder="t('pages.admin.chatManagePage.messageStatus')"
              class="yuemu-select"
              :dropdownClassName="'yuemu-select-dropdown'"
              allowClear
              @change="doSearch"
              style="width: 140px"
            >
              <a-select-option :value="0">{{ t('pages.admin.chatManagePage.normal') }}</a-select-option>
              <a-select-option :value="1">{{ t('pages.admin.chatManagePage.deleted') }}</a-select-option>
            </a-select>
          </div>
        </div>

        <div class="yuemu-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              :row-selection="rowSelection"
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'content'">
                  <div class="yuemu-message-content-cell">
                    <template v-if="record.messageType === 'audio'">
                      <AudioBubble :url="record.messageUrl" :is-self="false" />
                    </template>
                    <template v-else-if="record.messageType === 'image'">
                      <Image
                        :src="record.messageUrl"
                        :alt="record.content"
                        class="yuemu-message-image"
                        :preview="{ src: record.messageUrl }"
                      />
                    </template>
                    <template v-else>
                      <a-tooltip :title="record.content" placement="topLeft">
                        <div class="yuemu-ellipsis-text">{{ record.content }}</div>
                      </a-tooltip>
                    </template>
                  </div>
                </template>
                <template v-else-if="column.dataIndex === 'type'">
                  <span class="yuemu-tag yuemu-mini" :class="getTypeColor(record.type)">
                    {{ getTypeText(record.type) }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'status'">
                  <span class="yuemu-tag yuemu-mini" :class="record.status === 0 ? 'yuemu-orange' : 'yuemu-green'">
                    {{ record.status === 0 ? t('pages.admin.chatManagePage.unread') : t('pages.admin.chatManagePage.read') }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'isDelete'">
                  <span class="yuemu-tag yuemu-mini" :class="record.isDelete === 0 ? 'yuemu-green' : 'yuemu-red'">
                    {{ record.isDelete === 0 ? t('pages.admin.chatManagePage.normal') : t('pages.admin.chatManagePage.deletedShort') }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">
                    {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
                  </span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button
                      v-if="record.isDelete === 0"
                      type="text"
                      class="yuemu-btn-text-red"
                      @click="showDeleteConfirm(record)"
                    > {{ t('pages.admin.chatManagePage.delete') }} </a-button>
                    <a-button
                      v-else
                      type="text"
                      class="yuemu-btn-text-green"
                      @click="handleRestore(record)"
                    > {{ t('pages.admin.chatManagePage.restore') }} </a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="pcPageSizeOptions"
            :total="total"
            :show-total="(total) => t('pages.admin.chatManagePage.totalMessages', { total })"
            show-size-changer
            :page-size="searchParams.pageSize"
            @change="onPageChange"
            @showSizeChange="onShowSizeChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-mobile-container">
        <div class="yuemu-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-page-title">{{ t('pages.admin.chatManagePage.chatTitleMobile') }}</h1>
            <van-button icon="sort" size="small" round class="yuemu-btn-icon-ghost" @click="toggleSortOrder" />
          </div>

          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.content"
              :placeholder="t('pages.admin.chatManagePage.searchPlaceholder')"
              class="yuemu-search"
              shape="round"
              @search="doSearch"
              clearable
            />
          </div>

          <div class="yuemu-filter-dropdown-row">
            <van-dropdown-menu class="yuemu-van-dropdown" :z-index="1000">
              <van-dropdown-item
                v-model="searchParams.type"
                :options="mobileTypeOptions"
                @change="doSearch"
                teleport="body"
              />
              <van-dropdown-item
                v-model="searchParams.isDelete"
                :options="mobileStatusOptions"
                @change="doSearch"
                teleport="body"
              />
            </van-dropdown-menu>
          </div>

          <div class="yuemu-batch-action-bar" :class="{ 'yuemu-is-active': hasSelected }">
            <span class="yuemu-text-secondary">{{ t('pages.admin.chatManagePage.selectedItems', { count: state.selectedRowKeys.length }) }}</span>
            <div class="yuemu-batch-btns">
              <van-button size="mini" round class="yuemu-btn-success-sm" @click="batchRestoreSelectedMessages">{{ t('pages.admin.chatManagePage.restore') }}</van-button>
              <van-button size="mini" round type="danger" @click="batchDeleteSelectedMessages">{{ t('pages.admin.chatManagePage.delete') }}</van-button>
            </div>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div class="yuemu-card-list">
              <div v-for="message in dataList" :key="message.id" class="yuemu-chat-card">
                <div class="yuemu-card-header">
                  <van-checkbox :name="message.id" class="yuemu-checkbox" />
                  <div class="yuemu-main-info">
                    <div class="yuemu-sender-row">
                      <span class="yuemu-id-text">
                        <strong>{{ message.senderId }}</strong>
                        <span class="yuemu-text-secondary" style="margin: 0 4px">▶</span>
                        <strong>{{ message.receiverId }}</strong>
                      </span>
                      <span class="yuemu-tag yuemu-mini" :class="getTypeColor(message.type)">
                        {{ getTypeText(message.type) }}
                      </span>
                    </div>
                    <div class="yuemu-meta-row yuemu-text-secondary">
                      <span>ID: {{ message.id }}</span>
                      <span>{{ dayjs(message.createTime).format('MM-DD HH:mm') }}</span>
                    </div>
                  </div>
                </div>

                <div class="yuemu-card-body">
                  <div class="yuemu-message-bubble">
                    <template v-if="message.messageType === 'audio'">
                      <AudioBubble :url="message.messageUrl" :is-self="false" />
                    </template>
                    <template v-else-if="message.messageType === 'image'">
                      <Image
                        :src="message.messageUrl"
                        :alt="message.content"
                        class="yuemu-message-image"
                        :preview="{ src: message.messageUrl }"
                      />
                    </template>
                    <template v-else>
                      <div class="yuemu-content-text">{{ message.content }}</div>
                    </template>
                  </div>
                </div>

                <div class="yuemu-card-footer-tags">
                  <span class="yuemu-tag yuemu-mini" :class="message.status === 0 ? 'yuemu-orange' : 'yuemu-green'">
                    {{ message.status === 0 ? t('pages.admin.chatManagePage.unread') : t('pages.admin.chatManagePage.read') }}
                  </span>
                  <span class="yuemu-tag yuemu-mini" :class="message.isDelete === 0 ? 'yuemu-green' : 'yuemu-red'">
                    {{ message.isDelete === 0 ? t('pages.admin.chatManagePage.normal') : t('pages.admin.chatManagePage.deletedShort') }}
                  </span>
                </div>

                <div class="yuemu-card-actions">
                  <template v-if="message.isDelete === 0">
                    <button class="yuemu-action-btn yuemu-danger" @click="showDeleteConfirm(message)">{{ t('pages.admin.chatManagePage.deleteMessage') }}</button>
                  </template>
                  <template v-else>
                    <button class="yuemu-action-btn yuemu-success" @click="handleRestore(message)">{{ t('pages.admin.chatManagePage.restoreMessage') }}</button>
                  </template>
                </div>
              </div>
            </div>
          </van-checkbox-group>

          <div class="yuemu-mobile-pagination">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.chatManagePage.total', { total }) }}</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ t('pages.admin.chatManagePage.pageSize', { size: searchParams.pageSize }) }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.chatManagePage.prevPage')" :next-text="t('pages.admin.chatManagePage.nextPage')"
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
          :actions="mobilePageSizeOptions"
          :cancel-text="t('pages.admin.chatManagePage.cancel')"
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
        <h3 class="yuemu-confirm-title">{{ t('pages.admin.chatManagePage.confirmDeleteTitle') }}</h3>
        <p class="yuemu-confirm-desc">
          <template v-if="selectedMessage?.messageType === 'audio'">[{{ t('pages.admin.chatManagePage.audioMessage') }}]</template>
          <template v-else-if="selectedMessage?.messageType === 'image'">[{{ t('pages.admin.chatManagePage.imageMessage') }}]</template>
          <template v-else>{{ selectedMessage?.content || t('pages.admin.chatManagePage.noContent') }}</template>
          <br>{{ t('pages.admin.chatManagePage.deleteWarning') }}
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="deleteConfirmVisible = false">{{ t('pages.admin.chatManagePage.cancel') }}</button>
          <button class="yuemu-danger-btn" @click="confirmDelete">{{ t('pages.admin.chatManagePage.confirmDelete') }}</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { onMounted, reactive, ref, computed } from 'vue'
import {
  listMessagesByPageUsingPost,
  batchOperationMessagesUsingPost,
} from '@/api/chatMessageController'
import { message, Image } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import {
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SearchOutlined,
  ExclamationCircleFilled,
  UndoOutlined,
} from '@ant-design/icons-vue'
import AudioBubble from '@/components/AudioBubble.vue'

const device = ref<string>('')
const dataList = ref<API.ChatMessage[]>([])
const total = ref(0)
const loading = ref(false)
const showPageSizeSheet = ref(false)
const deleteConfirmVisible = ref(false)
const selectedMessage = ref<API.ChatMessage | null>(null)
const state = reactive({ selectedRowKeys: [] as number[] })

const pcPageSizeOptions = ['10', '20', '30', '50']
const mobilePageSizeOptions = [
  { get name() { return t('pages.admin.chatManagePage.pageSize10') }, value: 10 },
  { get name() { return t('pages.admin.chatManagePage.pageSize20') }, value: 20 },
  { get name() { return t('pages.admin.chatManagePage.pageSize30') }, value: 30 },
  { get name() { return t('pages.admin.chatManagePage.pageSize50') }, value: 50 },
]

const mobileStatusOptions = [
  { get text() { return t('pages.admin.chatManagePage.allStatus') }, value: undefined },
  { get text() { return t('pages.admin.chatManagePage.normal') }, value: 0 },
  { get text() { return t('pages.admin.chatManagePage.deleted') }, value: 1 },
]

const mobileTypeOptions = [
  { get text() { return t('pages.admin.chatManagePage.allTypes') }, value: undefined },
  { get text() { return t('pages.admin.chatManagePage.privateChat') }, value: 1 },
  { get text() { return t('pages.admin.chatManagePage.picComment') }, value: 2 },
  { get text() { return t('pages.admin.chatManagePage.spaceMessage') }, value: 3 },
]

const searchParams = reactive<API.ChatMessageAdminRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
  content: '',
  type: undefined,
  status: undefined,
  isDelete: undefined,
})

const columns = [
  { get title() { return t('pages.admin.chatManagePage.colContent') }, dataIndex: 'content', width: 300 },
  { get title() { return t('pages.admin.chatManagePage.colSenderId') }, dataIndex: 'senderId', width: 100 },
  { get title() { return t('pages.admin.chatManagePage.colReceiverId') }, dataIndex: 'receiverId', width: 100 },
  { get title() { return t('pages.admin.chatManagePage.colType') }, dataIndex: 'type', width: 100 },
  { get title() { return t('pages.admin.chatManagePage.colStatus') }, dataIndex: 'status', width: 90 },
  { get title() { return t('pages.admin.chatManagePage.colIsDelete') }, dataIndex: 'isDelete', width: 90 },
  { get title() { return t('pages.admin.chatManagePage.colCreateTime') }, dataIndex: 'createTime', width: 180 },
  { get title() { return t('pages.admin.chatManagePage.colAction') }, key: 'action', width: 120, align: 'right' },
]

const sortOrder = computed(() => searchParams.sortOrder)
const hasSelected = computed(() => state.selectedRowKeys.length > 0)
const rowSelection = computed(() => ({
  selectedRowKeys: state.selectedRowKeys,
  onChange: (keys: number[]) => { state.selectedRowKeys = keys },
}))

const fetchData = async () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) loading.value = true
  try {
    const res = await listMessagesByPageUsingPost(searchParams)
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records
      total.value = res.data.data.total
    }
  } catch (error) {
    message.error(t('pages.admin.chatManagePage.fetchError'))
  } finally {
    loading.value = false
  }
}

const doSearch = () => { searchParams.current = 1; fetchData() }
const doTableChange = () => { fetchData() }
const onPageChange = (page: number, pageSize: number) => { searchParams.current = page; searchParams.pageSize = pageSize; fetchData() }
const onShowSizeChange = (current: number, pageSize: number) => { searchParams.current = 1; searchParams.pageSize = pageSize; fetchData() }
const onMobilePageChange = (page: number) => { searchParams.current = page; fetchData() }

const handlePageSizeChange = (action: { value: number }) => {
  searchParams.current = 1; searchParams.pageSize = action.value; showPageSizeSheet.value = false; fetchData()
}

const showDeleteConfirm = (msg: API.ChatMessage) => { selectedMessage.value = msg; deleteConfirmVisible.value = true }

const confirmDelete = async () => {
  if (!selectedMessage.value?.id) return
  try {
    const res = await batchOperationMessagesUsingPost({ ids: [selectedMessage.value.id], operation: 'delete' })
    if (res.data?.code === 0) {
      message.success(t('pages.admin.chatManagePage.deleteSuccess')); deleteConfirmVisible.value = false; fetchData()
    }
  } catch (error) { message.error(t('pages.admin.chatManagePage.deleteError')) }
}

const handleRestore = async (msg: API.ChatMessage) => {
  try {
    const res = await batchOperationMessagesUsingPost({ ids: [msg.id], operation: 'restore' })
    if (res.data?.code === 0) { message.success(t('pages.admin.chatManagePage.restoreSuccess')); fetchData() }
  } catch (error) { message.error(t('pages.admin.chatManagePage.restoreError')) }
}

const toggleSortOrder = () => {
  searchParams.sortOrder = searchParams.sortOrder === 'ascend' ? 'descend' : 'ascend'; fetchData()
}

const batchDeleteSelectedMessages = async () => {
  if (state.selectedRowKeys.length === 0) return
  try {
    const res = await batchOperationMessagesUsingPost({ ids: state.selectedRowKeys, operation: 'delete' })
    if (res.data?.code === 0) { message.success(t('pages.admin.chatManagePage.batchDeleteSuccess')); state.selectedRowKeys = []; fetchData() }
  } catch (error) { message.error(t('pages.admin.chatManagePage.operationError')) }
}

const batchRestoreSelectedMessages = async () => {
  if (state.selectedRowKeys.length === 0) return
  try {
    const res = await batchOperationMessagesUsingPost({ ids: state.selectedRowKeys, operation: 'restore' })
    if (res.data?.code === 0) { message.success(t('pages.admin.chatManagePage.batchRestoreSuccess')); state.selectedRowKeys = []; fetchData() }
  } catch (error) { message.error(t('pages.admin.chatManagePage.operationError')) }
}

const getTypeText = (type: number) => {
  if (type === 1) return t('pages.admin.chatManagePage.privateChat'); if (type === 2) return t('pages.admin.chatManagePage.picComment'); if (type === 3) return t('pages.admin.chatManagePage.spaceMessage'); return t('pages.admin.chatManagePage.unknown')
}

const getTypeColor = (type: number) => {
  if (type === 1) return 'yuemu-blue'; if (type === 2) return 'yuemu-green'; if (type === 3) return 'yuemu-purple'; return 'yuemu-gray'
}

onMounted(async () => {
  device.value = await getDeviceType(); fetchData()
})
</script>

<style scoped>
#yuemu-chatManagePage { height: 100%; box-sizing: border-box; background-color: var(--background); color: var(--text-primary); transition: var(--theme-transition); }
.yuemu-text-secondary { color: var(--text-secondary); }

.yuemu-pc-container { padding: 16px; max-width: 1400px; margin: 0 auto; box-sizing: border-box; }
.yuemu-header-panel { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px var(--shadow-color); margin-bottom: 24px; transition: var(--theme-transition); }
.yuemu-header-main-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 600; color: var(--text-primary); }
.yuemu-search-form { display: flex; gap: 12px; flex-wrap: wrap; }

:deep(.yuemu-input), :deep(.ant-input-affix-wrapper), :deep(.yuemu-select .ant-select-selector) {
  background-color: var(--background) !important; color: var(--text-primary) !important; border-color: var(--border-color) !important; border-radius: 8px !important; box-shadow: none !important; transition: var(--theme-transition);
}

.yuemu-action-group { display: flex; gap: 12px; align-items: center; }
.yuemu-btn-success { background-color: #10b981 !important; color: #fff !important; border: none !important; border-radius: 8px !important; }
.yuemu-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; background-color: transparent !important; }

.yuemu-table-wrapper { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px var(--shadow-color); }
:deep(.yuemu-table) {
  .ant-table { background-color: transparent; color: var(--text-primary); }
  .ant-table-thead > tr > th { background-color: transparent; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color); padding: 16px; color: var(--text-primary); }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
}

.yuemu-message-content-cell { display: flex; align-items: center; }
.yuemu-ellipsis-text { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.yuemu-message-image { max-width: 80px; max-height: 80px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border-color); }

.yuemu-tag { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; border: 1px solid transparent; }
.yuemu-mini { padding: 2px 8px; font-size: 11px; }
.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-red { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-purple { background-color: rgba(168, 85, 247, 0.1); color: #a855f7; }
.yuemu-orange { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.yuemu-gray { background-color: var(--hover-background); color: var(--text-secondary); }

.yuemu-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-red { color: var(--comment-delete-hover-color) !important; }
.yuemu-btn-text-green { color: #10b981 !important; }

.yuemu-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }

.yuemu-mobile-container { height: 100%; background-color: var(--background); display: flex; flex-direction: column; }
.yuemu-sticky-header { position: sticky; top: 0; z-index: 100; background-color: var(--header-background); border-bottom: 1px solid var(--border-color); backdrop-filter: blur(15px); padding: 16px 16px 8px; }
.yuemu-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-btn-icon-ghost { background-color: transparent !important; color: var(--text-secondary) !important; border: 1px solid var(--border-color) !important; width: 32px; height: 32px; }

:deep(.yuemu-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }
.yuemu-batch-action-bar { display: flex; justify-content: space-between; align-items: center; height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease; }
.yuemu-batch-action-bar.yuemu-is-active { height: 44px; opacity: 1; margin-top: 8px; border-top: 1px solid var(--border-color); }
.yuemu-batch-btns { display: flex; gap: 8px; }
.yuemu-btn-success-sm { background-color: #10b981 !important; color: #fff !important; }

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-card-list { display: flex; flex-direction: column; gap: 16px; }
.yuemu-chat-card { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color); }
.yuemu-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.yuemu-main-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.yuemu-sender-row { display: flex; justify-content: space-between; align-items: center; }
.yuemu-id-text { font-size: 14px; color: var(--text-primary); }
.yuemu-meta-row { display: flex; justify-content: space-between; font-size: 12px; }
.yuemu-message-bubble { background: var(--background); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); display: inline-block; max-width: 100%; }
.yuemu-content-text { font-size: 14px; color: var(--text-primary); line-height: 1.5; word-break: break-word; }
.yuemu-card-footer-tags { display: flex; gap: 8px; margin-bottom: 12px; }
.yuemu-card-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px; }
.yuemu-action-btn { flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; background-color: var(--card-background); color: var(--text-primary); }

.yuemu-mobile-pagination { margin-top: 24px; }
.yuemu-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: var(--hover-background); border-radius: 12px; cursor: pointer; color: var(--link-color); border: 1px solid var(--border-color); }

:deep(.yuemu-confirm-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-body { padding: 24px; }
}
.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: var(--comment-delete-hover-color); margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 20px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; }
.yuemu-cancel-btn { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-danger-btn { color: var(--comment-delete-hover-color); font-weight: 600 !important; border-bottom-right-radius: 16px; }

:deep(.ant-image) { display: block; max-width: 100px; max-height: 100px; border-radius: 8px; overflow: hidden; }
.yuemu-message-image, :deep(.ant-image-img) { width: auto !important; height: auto !important; max-width: 100px !important; max-height: 100px !important; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color); transition: transform 0.2s ease; display: block; }
.yuemu-message-image:hover, :deep(.ant-image-img):hover { transform: scale(1.05); }
</style>
