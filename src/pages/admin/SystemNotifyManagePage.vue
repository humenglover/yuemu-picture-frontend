<template>
  <div id="yuemu-systemNotifyManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <a-form layout="inline" :model="searchParams" class="yuemu-search-form" @finish="doSearch">
            <a-form-item>
              <a-select
                v-model:value="searchParams.notifyType"
                :placeholder="t('pages.admin.systemNotifyManagePage.notifyType')"
                allow-clear
                style="width: 140px"
                class="yuemu-select"
                :dropdownClassName="'yuemu-select-dropdown'"
              >
                <a-select-option value="ADMIN_ANNOUNCE"> {{ t('pages.admin.systemNotifyManagePage.adminAnnounce') }} </a-select-option>
                <a-select-option value="POST_SELECTED"> {{ t('pages.admin.systemNotifyManagePage.postFeatured') }} </a-select-option>
                <a-select-option value="POST_DELETED"> {{ t('pages.admin.systemNotifyManagePage.postDeleted') }} </a-select-option>
                <a-select-option value="POST_UPDATED"> {{ t('pages.admin.systemNotifyManagePage.postModified') }} </a-select-option>
                <a-select-option value="ACCOUNT_CHANGED"> {{ t('pages.admin.systemNotifyManagePage.accountChanged') }} </a-select-option>
                <a-select-option value="SYSTEM_ALERT"> {{ t('pages.admin.systemNotifyManagePage.systemAlarm') }} </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.receiverType"
                :placeholder="t('pages.admin.systemNotifyManagePage.receiverType')"
                allow-clear
                style="width: 140px"
                class="yuemu-select"
                :dropdownClassName="'yuemu-select-dropdown'"
              >
                <a-select-option value="ALL_USER"> {{ t('pages.admin.systemNotifyManagePage.allUsers') }} </a-select-option>
                <a-select-option value="SPECIFIC_USER"> {{ t('pages.admin.systemNotifyManagePage.specificUser') }} </a-select-option>
                <a-select-option value="ROLE"> {{ t('pages.admin.systemNotifyManagePage.byRole') }} </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.isEnabled"
                :placeholder="t('pages.admin.systemNotifyManagePage.status')"
                allow-clear
                style="width: 100px"
                class="yuemu-select"
                :dropdownClassName="'yuemu-select-dropdown'"
              >
                <a-select-option :value="1"> {{ t('pages.admin.systemNotifyManagePage.valid') }} </a-select-option>
                <a-select-option :value="0"> {{ t('pages.admin.systemNotifyManagePage.invalid') }} </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary">
                {{ t('pages.admin.systemNotifyManagePage.searchBtn') }}
              </a-button>
            </a-form-item>
          </a-form>

          <div class="yuemu-action-group">
            <a-button type="primary" class="yuemu-btn-primary" @click="openModal">
              <PlusOutlined /> {{ t('pages.admin.systemNotifyManagePage.addNotify') }} </a-button>
          </div>
        </div>

        <div class="yuemu-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'notifyType'">
                  <span class="yuemu-tag" :class="`yuemu-tag-${getNotifyTypeClass(record.notifyType)}`">
                    {{ getNotifyTypeName(record.notifyType) }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'receiverType'">
                  <span class="yuemu-tag yuemu-tag-gray">
                    {{ getReceiverTypeName(record.receiverType) }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'isGlobal'">
                  <span class="yuemu-tag" :class="record.isGlobal === 1 ? 'yuemu-tag-green' : 'yuemu-tag-gray'">
                    {{ record.isGlobal === 1 ? t('pages.admin.systemNotifyManagePage.yes') : t('pages.admin.systemNotifyManagePage.no') }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'isEnabled'">
                  <span class="yuemu-tag" :class="record.isEnabled === 1 ? 'yuemu-tag-green' : 'yuemu-tag-red'">
                    {{ record.isEnabled === 1 ? t('pages.admin.systemNotifyManagePage.valid') : t('pages.admin.systemNotifyManagePage.invalid') }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">
                    {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'title'">
                  <a-tooltip :title="record.title">
                    <div class="yuemu-ellipsis-text">{{ record.title }}</div>
                  </a-tooltip>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button type="text" class="yuemu-btn-text-red" @click="showDeleteConfirm(record)">
                      {{ t('pages.admin.systemNotifyManagePage.deleteBtn') }}
                    </a-button>
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
            :show-total="(total) => t('pages.admin.systemNotifyManagePage.totalNotifyText', { total })"
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
            <h1 class="yuemu-page-title"> {{ t('pages.admin.systemNotifyManagePage.title') }} </h1>
            <van-button type="primary" size="small" icon="plus" class="yuemu-btn-icon" @click="openModal" round />
          </div>
          <div class="yuemu-dropdown-wrapper">
            <van-dropdown-menu class="yuemu-van-dropdown" :active-color="'var(--link-color)'">
              <van-dropdown-item
                v-model="mobileSearchParams.notifyType"
                :options="notifyTypeOptions"
                @change="onMobileSearch"
                teleport="body"
              />
              <van-dropdown-item
                v-model="mobileSearchParams.receiverType"
                :options="receiverTypeOptions"
                @change="onMobileSearch"
                teleport="body"
              />
              <van-dropdown-item
                v-model="mobileSearchParams.isEnabled"
                :options="statusOptions"
                @change="onMobileSearch"
                teleport="body"
              />
            </van-dropdown-menu>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <div class="yuemu-card-list">
            <div v-for="notify in dataList" :key="notify.id" class="yuemu-data-card">
              <div class="yuemu-card-header">
                <div class="yuemu-icon-wrap-tag" :class="`yuemu-tag-${getNotifyTypeClass(notify.notifyType)}`">
                  <BellOutlined />
                </div>
                <div class="yuemu-main-info">
                  <div class="yuemu-name-row">
                    <span class="yuemu-name">{{ notify.title }}</span>
                  </div>
                  <div class="yuemu-desc-row yuemu-text-secondary">
                    {{ getNotifyTypeName(notify.notifyType) }}
                  </div>
                </div>
              </div>

              <div class="yuemu-card-body">
                <div class="yuemu-meta-tags">
                  <span class="yuemu-badge" :class="`yuemu-tag-${getReceiverTypeClass(notify.receiverType)}`">
                    {{ getReceiverTypeName(notify.receiverType) }}
                  </span>
                  <span class="yuemu-badge" :class="notify.isEnabled === 1 ? 'yuemu-tag-green' : 'yuemu-tag-red'">
                    {{ notify.isEnabled === 1 ? t('pages.admin.systemNotifyManagePage.valid') : t('pages.admin.systemNotifyManagePage.invalid') }}
                  </span>
                  <span v-if="notify.isGlobal === 1" class="yuemu-badge yuemu-tag-blue"> {{ t('pages.admin.systemNotifyManagePage.global') }} </span>
                </div>
                <div class="yuemu-meta-info yuemu-text-secondary" style="margin-top: 8px;">
                  <span>{{ dayjs(notify.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                </div>
              </div>

              <div class="yuemu-card-actions">
                <button class="yuemu-action-btn yuemu-danger" @click="showDeleteConfirm(notify)">
                  {{ t('pages.admin.systemNotifyManagePage.deleteNotifyBtn') }}
                </button>
              </div>
            </div>

            <van-empty v-if="dataList.length === 0 && !loading" :description="t('pages.admin.systemNotifyManagePage.noNotify')" />
          </div>

          <div class="yuemu-mobile-pagination" v-if="total > 0">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.systemNotifyManagePage.totalRecordsText2', { total }) }}</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} {{ t('pages.admin.systemNotifyManagePage.recordsPerPage') }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.systemNotifyManagePage.prevPage')" :next-text="t('pages.admin.systemNotifyManagePage.nextPage')"
              v-model="searchParams.current"
              :total-items="total"
              :items-per-page="searchParams.pageSize"
              @change="onMobilePageChange"
              :show-page-size="3"
              force-ellipses
              class="yuemu-pagination-component"
            />
          </div>
        </div>

        <van-action-sheet
          v-model:show="showPageSizeSheet"
          :actions="mobilePageSizeOptions"
          :cancel-text="t('pages.admin.systemNotifyManagePage.cancelBtn')"
          close-on-click-action
          @select="handlePageSizeChange"
          class="yuemu-action-sheet"
        />
      </div>
    </template>

    <a-modal
      v-model:open="modalVisible"
      :title="t('pages.admin.systemNotifyManagePage.addNotifyTitle')"
      @cancel="handleModalCancel"
      class="yuemu-modal"
      :footer="null"
      :confirm-loading="modalConfirmLoading"
    >
      <a-form :model="modalForm" ref="modalFormRef" class="yuemu-form" layout="vertical">
        <a-form-item :label="t('pages.admin.systemNotifyManagePage.notifyType')" name="notifyType" :rules="[{ required: true, message: t('pages.admin.systemNotifyManagePage.selectNotifyType') }]">
          <a-select v-model:value="modalForm.notifyType" :placeholder="t('pages.admin.systemNotifyManagePage.plsSelect')" class="yuemu-select" :dropdownClassName="'yuemu-select-dropdown'">
            <a-select-option value="ADMIN_ANNOUNCE"> {{ t('pages.admin.systemNotifyManagePage.adminAnnounce') }} </a-select-option>
            <a-select-option value="POST_SELECTED"> {{ t('pages.admin.systemNotifyManagePage.postFeatured') }} </a-select-option>
            <a-select-option value="POST_DELETED"> {{ t('pages.admin.systemNotifyManagePage.postDeleted') }} </a-select-option>
            <a-select-option value="POST_UPDATED"> {{ t('pages.admin.systemNotifyManagePage.postModified') }} </a-select-option>
            <a-select-option value="ACCOUNT_CHANGED"> {{ t('pages.admin.systemNotifyManagePage.accountChanged') }} </a-select-option>
            <a-select-option value="SYSTEM_ALERT"> {{ t('pages.admin.systemNotifyManagePage.systemAlarm') }} </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item :label="t('pages.admin.systemNotifyManagePage.receiverType')" name="receiverType" :rules="[{ required: true, message: t('pages.admin.systemNotifyManagePage.selectReceiverType') }]">
          <a-select v-model:value="modalForm.receiverType" :placeholder="t('pages.admin.systemNotifyManagePage.plsSelect')" class="yuemu-select" :dropdownClassName="'yuemu-select-dropdown'">
            <a-select-option value="ALL_USER"> {{ t('pages.admin.systemNotifyManagePage.allUsers') }} </a-select-option>
            <a-select-option value="SPECIFIC_USER"> {{ t('pages.admin.systemNotifyManagePage.specificUser') }} </a-select-option>
            <a-select-option value="ROLE"> {{ t('pages.admin.systemNotifyManagePage.byRole') }} </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          v-if="modalForm.receiverType === 'SPECIFIC_USER'"
          :label="t('pages.admin.systemNotifyManagePage.receiverId')"
          name="receiverId"
          :rules="[{ required: true, message: t('pages.admin.systemNotifyManagePage.inputReceiverId') }]"
        >
          <a-input v-model:value="modalForm.receiverId" :placeholder="t('pages.admin.systemNotifyManagePage.inputReceiverId')" class="yuemu-input" />
        </a-form-item>

        <a-form-item
          v-if="modalForm.receiverType === 'ROLE'"
          :label="t('pages.admin.systemNotifyManagePage.roleCode')"
          name="receiverId"
          :rules="[{ required: true, message: t('pages.admin.systemNotifyManagePage.inputRoleCode') }]"
        >
          <a-input v-model:value="modalForm.receiverId" :placeholder="t('pages.admin.systemNotifyManagePage.rolePlaceholder')" class="yuemu-input" />
        </a-form-item>

        <a-form-item :label="t('pages.admin.systemNotifyManagePage.notifyTitle')" name="title" :rules="[{ required: true, message: t('pages.admin.systemNotifyManagePage.inputTitle') }]">
          <a-input v-model:value="modalForm.title" :placeholder="t('pages.admin.systemNotifyManagePage.inputTitle')" class="yuemu-input" />
        </a-form-item>

        <a-form-item :label="t('pages.admin.systemNotifyManagePage.content')" name="content" :rules="[{ required: true, message: t('pages.admin.systemNotifyManagePage.inputContent') }]">
          <a-textarea v-model:value="modalForm.content" :placeholder="t('pages.admin.systemNotifyManagePage.inputContent')" :rows="3" class="yuemu-input" />
        </a-form-item>

        <div style="display: flex; gap: 24px;">
          <a-form-item :label="t('pages.admin.systemNotifyManagePage.globalNotify')" style="flex: 1">
            <a-switch v-model:checked="modalForm.isGlobal" />
          </a-form-item>
          <a-form-item :label="t('pages.admin.systemNotifyManagePage.statusValid')" style="flex: 1">
            <a-switch v-model:checked="modalForm.isEnabled" />
          </a-form-item>
        </div>

        <div class="yuemu-modal-footer">
          <a-button class="yuemu-btn-ghost" @click="handleModalCancel">{{ t('pages.admin.systemNotifyManagePage.cancelBtn') }}</a-button>
          <a-button type="primary" class="yuemu-btn-primary" @click="handleModalOk" :loading="modalConfirmLoading"> {{ t('pages.admin.systemNotifyManagePage.confirmAdd') }} </a-button>
        </div>
      </a-form>
    </a-modal>

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
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.systemNotifyManagePage.confirmDeleteNotify') }} </h3>
        <p class="yuemu-confirm-desc">
          <span v-html="t('pages.admin.systemNotifyManagePage.deleteWarning1', { title: selectedNotify?.title }) + t('pages.admin.systemNotifyManagePage.deleteWarning2')"></span>
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="deleteConfirmVisible = false">{{ t('pages.admin.systemNotifyManagePage.cancelBtn') }}</button>
          <button class="yuemu-danger-btn" @click="confirmDelete">{{ t('pages.admin.systemNotifyManagePage.confirmDeleteNotify') }}</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { message, Form } from 'ant-design-vue';
import type { UnwrapRef } from 'vue';
import dayjs from 'dayjs';
import {
  listSystemNotifiesUsingGet,
  addSystemNotifyUsingPost,
  deleteSystemNotifyUsingDelete
} from '@/api/systemNotifyController';
import { DEVICE_TYPE_ENUM } from '@/constants/device';
import { SearchOutlined, PlusOutlined, BellOutlined, ExclamationCircleFilled } from '@ant-design/icons-vue';
import { useLoginUserStore } from '@/stores/useLoginUserStore';
import { getDeviceType } from '@/utils/device';

const device = ref<string>(DEVICE_TYPE_ENUM.PC);
const loginUserStore = useLoginUserStore();

const searchParams = reactive({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
  notifyType: undefined,
  receiverType: undefined,
  isEnabled: undefined,
});

const dataList = ref<API.SystemNotify[]>([]);
const total = ref(0);
const loading = ref(false);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
  { title: t('pages.admin.systemNotifyManagePage.notifyType'), dataIndex: 'notifyType', key: 'notifyType', sorter: true, width: 140 },
  { title: t('pages.admin.systemNotifyManagePage.notifyTitle'), dataIndex: 'title', key: 'title', sorter: true },
  { title: t('pages.admin.systemNotifyManagePage.receiverType'), dataIndex: 'receiverType', key: 'receiverType', width: 120 },
  { title: t('pages.admin.systemNotifyManagePage.colGlobal'), dataIndex: 'isGlobal', key: 'isGlobal', width: 80 },
  { title: t('pages.admin.systemNotifyManagePage.status'), dataIndex: 'isEnabled', key: 'isEnabled', width: 80 },
  { title: t('pages.admin.systemNotifyManagePage.colCreateTime'), dataIndex: 'createTime', key: 'createTime', sorter: true, width: 180 },
  { title: t('pages.admin.systemNotifyManagePage.colAction'), key: 'action', fixed: 'right', width: 100, align: 'right' },
];

const pcPageSizeOptions = ref(['10', '20', '50', '100']);

const modalVisible = ref(false);
const modalConfirmLoading = ref(false);
const modalFormRef = ref<InstanceType<typeof Form> | null>(null);

const modalForm: UnwrapRef<{
  notifyType: string | undefined;
  receiverType: string | undefined;
  receiverId: string | undefined;
  title: string | undefined;
  content: string | undefined;
  isGlobal: boolean;
  isEnabled: boolean;
}> = reactive({
  notifyType: undefined,
  receiverType: undefined,
  receiverId: undefined,
  title: undefined,
  content: undefined,
  isGlobal: false,
  isEnabled: true,
});

watch(() => modalForm.receiverType, (newVal) => {
  if (newVal !== 'SPECIFIC_USER' && newVal !== 'ROLE') {
    modalForm.receiverId = undefined;
  }
});

const loadData = async () => {
  loading.value = true;
  try {
    const res = await listSystemNotifiesUsingGet({
      ...searchParams,
      isEnabled: searchParams.isEnabled !== undefined ? searchParams.isEnabled : undefined,
    });
    if (res.data?.code === 0) {
      dataList.value = res.data.data?.records || [];
      total.value = res.data.data?.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

const doSearch = () => {
  searchParams.current = 1;
  loadData();
};

const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page;
  searchParams.pageSize = pageSize;
  loadData();
};

const onShowSizeChange = (current: number, size: number) => {
  searchParams.current = 1;
  searchParams.pageSize = size;
  loadData();
};

const doTableChange = (pagination: any, filters: any, sorter: any) => {
  if (sorter.field && sorter.order) {
    searchParams.sortField = sorter.field;
    searchParams.sortOrder = sorter.order === 'ascend' ? 'ascend' : 'descend';
  } else {
    searchParams.sortField = 'createTime';
    searchParams.sortOrder = 'descend';
  }
  loadData();
};

const openModal = () => {
  Object.assign(modalForm, {
    notifyType: undefined,
    receiverType: undefined,
    receiverId: undefined,
    title: undefined,
    content: undefined,
    isGlobal: false,
    isEnabled: true,
  });
  modalVisible.value = true;
};

const handleModalOk = async () => {
  try {
    await modalFormRef.value?.validateFields();
    modalConfirmLoading.value = true;
    const res = await addSystemNotifyUsingPost({
      notifyType: modalForm.notifyType,
      receiverType: modalForm.receiverType,
      receiverId: (modalForm.receiverType === 'SPECIFIC_USER' || modalForm.receiverType === 'ROLE') ? modalForm.receiverId : undefined,
      title: modalForm.title,
      content: modalForm.content,
      isGlobal: modalForm.isGlobal ? 1 : 0,
      isEnabled: modalForm.isEnabled ? 1 : 0,
      senderType: 'ADMIN',
      senderId: loginUserStore.loginUser?.id?.toString() || 'ADMIN',
    });
    if (res.data?.code === 0) {
      message.success(t('pages.admin.systemNotifyManagePage.addSuccess'));
      modalVisible.value = false;
      await loadData();
    }
  } finally {
    modalConfirmLoading.value = false;
  }
};

const handleModalCancel = () => {
  modalVisible.value = false;
};

const deleteConfirmVisible = ref(false);
const selectedNotify = ref<API.SystemNotify | null>(null);

const showDeleteConfirm = (notify: API.SystemNotify) => {
  selectedNotify.value = notify;
  deleteConfirmVisible.value = true;
};

const confirmDelete = async () => {
  if (!selectedNotify.value?.id) return;
  try {
    const res = await deleteSystemNotifyUsingDelete({ id: selectedNotify.value.id || 0 });
    if (res.data?.code === 0) {
      message.success(t('pages.admin.systemNotifyManagePage.deleteSuccess'));
      deleteConfirmVisible.value = false;
      await loadData();
    }
  } catch (error) {
    message.error(t('pages.admin.systemNotifyManagePage.deleteFail'));
  }
};

const mobileSearchParams = reactive({ notifyType: '', receiverType: '', isEnabled: '' });
const showPageSizeSheet = ref(false);

const notifyTypeOptions = computed(() => [
  { text: t('pages.admin.systemNotifyManagePage.allCategories'), value: '' },
  { text: t('pages.admin.systemNotifyManagePage.adminAnnounce'), value: 'ADMIN_ANNOUNCE' },
  { text: t('pages.admin.systemNotifyManagePage.postFeatured'), value: 'POST_SELECTED' },
  { text: t('pages.admin.systemNotifyManagePage.postDeleted'), value: 'POST_DELETED' },
  { text: t('pages.admin.systemNotifyManagePage.postModified'), value: 'POST_UPDATED' },
  { text: t('pages.admin.systemNotifyManagePage.accountChanged'), value: 'ACCOUNT_CHANGED' },
  { text: t('pages.admin.systemNotifyManagePage.systemAlarm'), value: 'SYSTEM_ALERT' },
]);

const receiverTypeOptions = computed(() => [
  { text: t('pages.admin.systemNotifyManagePage.allReceivers'), value: '' },
  { text: t('pages.admin.systemNotifyManagePage.allUsers'), value: 'ALL_USER' },
  { text: t('pages.admin.systemNotifyManagePage.specificUser'), value: 'SPECIFIC_USER' },
  { text: t('pages.admin.systemNotifyManagePage.byRole'), value: 'ROLE' },
]);

const statusOptions = computed(() => [
  { text: t('pages.admin.systemNotifyManagePage.allStatus'), value: '' },
  { text: t('pages.admin.systemNotifyManagePage.valid'), value: 1 },
  { text: t('pages.admin.systemNotifyManagePage.invalid'), value: 0 },
]);

const mobilePageSizeOptions = [
  { name: t('pages.admin.systemNotifyManagePage.pageSize10'), value: 10 },
  { name: t('pages.admin.systemNotifyManagePage.pageSize20'), value: 20 },
  { name: t('pages.admin.systemNotifyManagePage.pageSize50'), value: 50 },
];

const getNotifyTypeName = (type: string | undefined) => {
  const map: Record<string, string> = {
    'ADMIN_ANNOUNCE': '管理员公告',
    'POST_SELECTED': '帖子精选',
    'POST_DELETED': '帖子删除',
    'POST_UPDATED': '帖子修改',
    'ACCOUNT_CHANGED': '账号变更',
    'SYSTEM_ALERT': '系统告警'
  };
  return type ? map[type] || type : '';
};

const getNotifyTypeClass = (type: string | undefined) => {
  const map: Record<string, string> = {
    'ADMIN_ANNOUNCE': 'blue',
    'POST_SELECTED': 'green',
    'POST_DELETED': 'red',
    'POST_UPDATED': 'orange',
    'ACCOUNT_CHANGED': 'purple',
    'SYSTEM_ALERT': 'red'
  };
  return type ? map[type] || 'gray' : 'gray';
};

const getReceiverTypeName = (type: string | undefined) => {
  const map: Record<string, string> = {
    'ALL_USER': '全体用户',
    'SPECIFIC_USER': '指定用户',
    'ROLE': '按角色'
  };
  return type ? map[type] || type : '';
};

const getReceiverTypeClass = (type: string | undefined) => {
  const map: Record<string, string> = {
    'ALL_USER': 'blue',
    'SPECIFIC_USER': 'green',
    'ROLE': 'orange'
  };
  return type ? map[type] || 'gray' : 'gray';
};

const onMobileSearch = () => {
  searchParams.notifyType = mobileSearchParams.notifyType || undefined;
  searchParams.receiverType = mobileSearchParams.receiverType || undefined;
  searchParams.isEnabled = mobileSearchParams.isEnabled !== '' ? (mobileSearchParams.isEnabled as any) : undefined;
  searchParams.current = 1;
  loadData();
};

const onMobilePageChange = (page: number) => {
  searchParams.current = page;
  loadData();
};

const handlePageSizeChange = (action: { value: number }) => {
  searchParams.current = 1;
  searchParams.pageSize = action.value;
  loadData();
};

onMounted(async () => {
  device.value = await getDeviceType();
  setTimeout(() => loadData(), 100);
});
</script>

<style scoped>
#yuemu-systemNotifyManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-ellipsis-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

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
}

.yuemu-search-form { display: flex; gap: 12px; }

:deep(.yuemu-select .ant-select-selector),
:deep(.yuemu-input) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}

.yuemu-btn-primary {
  background-color: var(--link-color) !important;
  color: var(--text-other) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 500;
}

.yuemu-btn-ghost {
  border-radius: 8px !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  background-color: transparent !important;
}

.yuemu-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--shadow-color);
}

:deep(.yuemu-table) {
  .ant-table { background-color: transparent; color: var(--text-primary); }
  .ant-table-thead > tr > th { background-color: transparent; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color); padding: 16px; color: var(--text-primary); }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
}

.yuemu-tag { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.yuemu-tag-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-tag-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-tag-red { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-tag-orange { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.yuemu-tag-purple { background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.yuemu-tag-gray { background-color: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }

.yuemu-action-buttons { display: flex; justify-content: flex-end; }
.yuemu-btn-text-red { color: #ef4444 !important; border-radius: 6px; }

.yuemu-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }

.yuemu-mobile-container { height: 100%; background-color: var(--background); display: flex; flex-direction: column; }
.yuemu-sticky-header { position: sticky; top: 0; z-index: 1000; background-color: var(--background); border-bottom: 1px solid var(--border-color); padding: 16px 16px 0; }
.yuemu-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); }

.yuemu-btn-icon { background-color: var(--link-color) !important; border: none !important; width: 32px; height: 32px; }

.yuemu-dropdown-wrapper { margin: 0 -16px; position: relative; z-index: 1001; }
:deep(.yuemu-van-dropdown .van-dropdown-menu__bar) { background-color: var(--background) !important; box-shadow: none !important; }

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-card-list { display: flex; flex-direction: column; gap: 16px; }

.yuemu-data-card { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color); }
.yuemu-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.yuemu-icon-wrap-tag { width: 44px; height: 44px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 20px; flex-shrink: 0; }

.yuemu-main-info { flex: 1; min-width: 0; }
.yuemu-name-row .yuemu-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.yuemu-desc-row { font-size: 13px; margin-top: 2px; }

.yuemu-card-body { margin-bottom: 16px; }
.yuemu-meta-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.yuemu-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; background-color: var(--hover-background); color: var(--text-secondary); }

.yuemu-card-actions { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-color); }
.yuemu-action-btn { flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; font-weight: 500; background-color: var(--card-background); color: var(--text-primary); }

.yuemu-mobile-pagination { margin-top: 24px; }
.yuemu-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: var(--hover-background); border-radius: 12px; cursor: pointer; color: var(--link-color); border: 1px solid var(--border-color); }

:deep(.yuemu-modal), :deep(.yuemu-confirm-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-header { background-color: var(--card-background); border-bottom: 1px solid var(--border-color); padding: 20px 24px; }
  .ant-modal-title { color: var(--text-primary); font-size: 18px; font-weight: 600; }
  .ant-modal-body { padding: 24px; }
}

.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 24px; }
.yuemu-modal-footer .ant-btn { flex: 1; height: 40px; border-radius: 10px; font-size: 15px; }

.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: #ef4444; margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 20px 0; line-height: 1.4; }

.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; color: var(--text-primary); }
.yuemu-cancel-btn { border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-danger-btn { color: #ef4444; font-weight: 600 !important; border-bottom-right-radius: 16px; }
</style>
