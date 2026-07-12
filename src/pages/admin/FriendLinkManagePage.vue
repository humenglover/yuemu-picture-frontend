<template>
  <div id="yuemu-friend-link-manage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-dashboard">
        <header class="yuemu-dashboard-header">
          <div class="yuemu-header-left">
            <h1 class="yuemu-page-title">{{ t('pages.admin.friendLinkManagePage.mainTitle') }}</h1>
            <p class="yuemu-page-desc">{{ t('pages.admin.friendLinkManagePage.mainDesc') }}</p>
          </div>
          <div class="yuemu-header-right">
            <a-button class="yuemu-btn-ghost" @click="handleRefreshCache">
              <CloudSyncOutlined /> {{ t('pages.admin.friendLinkManagePage.refreshCacheBtn') }}
            </a-button>
            <a-button type="primary" class="yuemu-btn-primary" @click="showAddModal">
              <PlusOutlined /> {{ t('pages.admin.friendLinkManagePage.addLinkBtn') }}
            </a-button>
          </div>
        </header>

        <div class="yuemu-filter-bar">
          <a-form layout="inline" :model="searchParams" class="yuemu-filter-form" @finish="handleSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.siteName"
                :placeholder="t('pages.admin.friendLinkManagePage.searchPlaceholder')"
                allow-clear
                class="yuemu-input-base yuemu-search-input"
                style="width: 220px"
                @change="handleSearch"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.siteType"
                :placeholder="t('pages.admin.friendLinkManagePage.siteTypePlaceholder')"
                class="yuemu-select-base"
                :dropdownClassName="'yuemu-dark-dropdown'"
                allow-clear
                @change="handleSearch"
                style="width: 140px"
              >
                <a-select-option v-for="type in siteTypes" :key="type.value" :value="type.value">
                  {{ type.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.status"
                :placeholder="t('pages.admin.friendLinkManagePage.statusPlaceholder')"
                class="yuemu-select-base"
                :dropdownClassName="'yuemu-dark-dropdown'"
                allow-clear
                @change="handleSearch"
                style="width: 140px"
              >
                <a-select-option :value="1">{{ t('pages.admin.friendLinkManagePage.approved') }}</a-select-option>
                <a-select-option :value="0">{{ t('pages.admin.friendLinkManagePage.pending') }}</a-select-option>
                <a-select-option :value="2">{{ t('pages.admin.friendLinkManagePage.rejected') }}</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary"> {{ t('pages.admin.friendLinkManagePage.searchBtn') }} </a-button>
            </a-form-item>
          </a-form>
        </div>

        <div class="yuemu-table-container">
          <a-spin :tip="t('pages.admin.friendLinkManagePage.loadingData')" :spinning="loading">
            <a-table
              :dataSource="friendLinks"
              :columns="columns"
              :pagination="false"
              @change="handleTableChange"
              rowKey="id"
              class="yuemu-seamless-table"
              :scroll="{ x: 1200 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'siteInfo'">
                  <div class="yuemu-site-info-cell">
                    <div class="yuemu-logo-wrap">
                      <img :src="record.siteLogo || 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" />
                    </div>
                    <div class="yuemu-site-meta">
                      <span class="yuemu-font-semibold">{{ record.siteName }}</span>
                      <span class="yuemu-badge yuemu-bg-blue yuemu-mini-tag">{{ record.siteType }}</span>
                    </div>
                  </div>
                </template>

                <template v-if="column.dataIndex === 'siteUrl'">
                  <a :href="record.siteUrl" target="_blank" rel="noopener noreferrer" class="yuemu-mac-link">
                    {{ record.siteUrl }}
                  </a>
                </template>

                <template v-if="column.dataIndex === 'weight'">
                  <span class="yuemu-weight-tag">{{ record.weight }}</span>
                </template>

                <template v-if="column.dataIndex === 'status'">
                  <span class="yuemu-badge" :class="getStatusColorClass(record.status)">
                    <div class="yuemu-status-dot" :class="getStatusColorClass(record.status)"></div>
                    {{ getStatusText(record.status) }}
                  </span>
                </template>

                <template v-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">{{ formatTime(record.createTime) }}</span>
                </template>

                <template v-if="column.key === 'action'">
                  <div class="yuemu-action-cell">
                    <button class="yuemu-icon-text-btn yuemu-color-primary" @click="showEditModal(record)">{{ t('pages.admin.friendLinkManagePage.edit') }}</button>
                    <template v-if="record.status === 0">
                      <button class="yuemu-icon-text-btn yuemu-color-success" @click="handleReview(record)">{{ t('pages.admin.friendLinkManagePage.approve') }}</button>
                    </template>
                    <template v-else-if="record.status === 1">
                      <button class="yuemu-icon-text-btn yuemu-color-warning" @click="handleReview(record)">{{ t('pages.admin.friendLinkManagePage.rejectDown') }}</button>
                    </template>
                    <template v-else>
                      <button class="yuemu-icon-text-btn yuemu-color-success" @click="handleReview(record)">{{ t('pages.admin.friendLinkManagePage.reApprove') }}</button>
                    </template>
                    <button class="yuemu-icon-text-btn yuemu-color-gray" @click="showWeightModal(record)">{{ t('pages.admin.friendLinkManagePage.weight') }}</button>
                    <button class="yuemu-icon-text-btn yuemu-color-danger" @click="showDeleteConfirm(record)">{{ t('pages.admin.friendLinkManagePage.delete') }}</button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination-bar">
          <a-pagination
            v-model:current="pagination.current"
            :page-size-options="['10', '20', '50']"
            :total="total"
            :show-total="(total) => t('pages.admin.friendLinkManagePage.totalPartners', { total })"
            show-size-changer
            :page-size="pagination.pageSize"
            @change="onPaginationChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-m-container">
        <div class="yuemu-m-sticky-header">
          <div class="yuemu-m-header-main">
            <h1 class="yuemu-m-title">{{ t('pages.admin.friendLinkManagePage.partnerManageMobile') }}</h1>
            <div class="yuemu-m-actions">
              <van-button icon="replay" size="small" round class="yuemu-m-ghost-btn" @click="handleRefreshCache" />
              <van-button icon="plus" size="small" type="primary" round class="yuemu-m-primary-btn" @click="showAddModal" />
            </div>
          </div>

          <div class="yuemu-m-search-row">
            <van-search v-model="searchParams.siteName" :placeholder="t('pages.admin.friendLinkManagePage.searchPlaceholder')" shape="round" class="yuemu-m-search" @search="handleSearch" clearable />
          </div>

          <div class="yuemu-m-filter-row">
            <van-dropdown-menu class="yuemu-m-van-dropdown" :z-index="1000">
              <van-dropdown-item v-model="searchParams.siteType" :options="mobileTypeOptions" @change="handleSearch" teleport="body" />
              <van-dropdown-item v-model="searchParams.status" :options="mobileStatusOptions" @change="handleSearch" teleport="body" />
            </van-dropdown-menu>
          </div>
        </div>

        <div class="yuemu-m-scroll-view">
          <div class="yuemu-m-card-list">
            <div v-for="item in friendLinks" :key="item.id" class="yuemu-m-card">
              <div class="yuemu-m-card-header">
                <div class="yuemu-logo-wrap yuemu-m-logo">
                  <img :src="item.siteLogo || 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" alt="logo" />
                </div>
                <div class="yuemu-m-main-info">
                  <div class="yuemu-m-title-row">
                    <span class="yuemu-m-site-name">{{ item.siteName }}</span>
                    <span class="yuemu-badge yuemu-bg-blue yuemu-mini-tag">{{ item.siteType }}</span>
                  </div>
                  <div class="yuemu-m-status-row">
                    <span class="yuemu-badge" :class="getStatusColorClass(item.status)">
                      {{ getStatusText(item.status) }}
                    </span>
                    <span class="yuemu-text-secondary yuemu-m-weight-text">{{ t('pages.admin.friendLinkManagePage.weightPrefix') }}: {{ item.weight }}</span>
                  </div>
                </div>
              </div>

              <div class="yuemu-m-card-body" @click="openUrl(item.siteUrl)">
                <div class="yuemu-m-url-box">
                  <LinkOutlined /> <span class="yuemu-m-url-text">{{ item.siteUrl }}</span>
                </div>
                <div class="yuemu-m-desc-text">{{ item.siteDesc || t('pages.admin.friendLinkManagePage.noDesc') }}</div>

                <div class="yuemu-m-contact-box yuemu-text-secondary">
                  <span v-if="item.ownerName"><UserOutlined /> {{ item.ownerName }}</span>
                  <span v-if="item.ownerContact"><MessageOutlined /> {{ item.ownerContact }}</span>
                </div>
              </div>

              <div class="yuemu-m-card-actions">
                <template v-if="item.status === 0">
                  <button class="yuemu-m-action-btn yuemu-color-success" @click="handleReview(item)">{{ t('pages.admin.friendLinkManagePage.approve') }}</button>
                </template>
                <template v-else>
                  <button class="yuemu-m-action-btn" :class="item.status === 1 ? 'yuemu-color-warning' : 'yuemu-color-success'" @click="handleReview(item)">
                    {{ item.status === 1 ? t('pages.admin.friendLinkManagePage.deprecated') : t('pages.admin.friendLinkManagePage.active') }}
                  </button>
                </template>
                <button class="yuemu-m-action-btn yuemu-color-primary" @click="showEditModal(item)">{{ t('pages.admin.friendLinkManagePage.edit') }}</button>
                <button class="yuemu-m-action-btn yuemu-color-gray" @click="showWeightModal(item)">{{ t('pages.admin.friendLinkManagePage.weight') }}</button>
                <button class="yuemu-m-action-btn yuemu-color-danger" @click="showDeleteConfirm(item)">{{ t('pages.admin.friendLinkManagePage.delete') }}</button>
              </div>
            </div>
          </div>

          <van-empty v-if="friendLinks.length === 0 && !loading" :description="t('pages.admin.friendLinkManagePage.noRecords')" />

          <div class="yuemu-m-pagination" v-if="total > 0">
            <van-pagination :prev-text="t('pages.admin.friendLinkManagePage.prevPage')" :next-text="t('pages.admin.friendLinkManagePage.nextPage')"
              v-model="pagination.current"
              :total-items="total"
              :items-per-page="pagination.pageSize"
              @change="onMobilePageChange"
              :show-page-size="3"
              force-ellipses
              class="yuemu-dark-van-pagination"
            />
          </div>
        </div>
      </div>
    </template>

    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <a-modal
        v-model:open="modalVisible"
        :title="modalMode === 'add' ? t('pages.admin.friendLinkManagePage.addLink') : t('pages.admin.friendLinkManagePage.editLink')"
        :footer="null"
        class="yuemu-apple-modal"
        destroyOnClose
        centered
      >
        <a-form :model="formData" :rules="rules" ref="formRef" class="yuemu-modal-form">
          <div class="yuemu-form-item">
            <label>{{ t('pages.admin.friendLinkManagePage.siteName') }} <span class="yuemu-required">*</span></label>
            <a-input v-model:value="formData.siteName" :placeholder="t('pages.admin.friendLinkManagePage.enterSiteName')" class="yuemu-input-base" />
          </div>
          <div class="yuemu-form-item">
            <label>{{ t('pages.admin.friendLinkManagePage.siteUrl') }} <span class="yuemu-required">*</span></label>
            <a-input v-model:value="formData.siteUrl" :placeholder="t('pages.admin.friendLinkManagePage.enterSiteUrl')" class="yuemu-input-base" />
          </div>
          <div class="yuemu-form-row">
            <div class="yuemu-form-item yuemu-half">
              <label>{{ t('pages.admin.friendLinkManagePage.siteType') }} <span class="yuemu-required">*</span></label>
              <a-select v-model:value="formData.siteType" :placeholder="t('pages.admin.friendLinkManagePage.pleaseSelect')" class="yuemu-select-base" :dropdownClassName="'yuemu-dark-dropdown'">
                <a-select-option v-for="type in siteTypes" :key="type.value" :value="type.value">
                  {{ type.name }}
                </a-select-option>
              </a-select>
            </div>
            <div class="yuemu-form-item yuemu-half">
              <label>{{ t('pages.admin.friendLinkManagePage.siteLogo') }}</label>
              <a-input v-model:value="formData.siteLogo" :placeholder="t('pages.admin.friendLinkManagePage.logoUrl')" class="yuemu-input-base" />
            </div>
          </div>
          <div class="yuemu-form-row">
            <div class="yuemu-form-item yuemu-half">
              <label>{{ t('pages.admin.friendLinkManagePage.ownerName') }}</label>
              <a-input v-model:value="formData.ownerName" :placeholder="t('pages.admin.friendLinkManagePage.optional')" class="yuemu-input-base" />
            </div>
            <div class="yuemu-form-item yuemu-half">
              <label>{{ t('pages.admin.friendLinkManagePage.contactInfo') }}</label>
              <a-input v-model:value="formData.ownerContact" :placeholder="t('pages.admin.friendLinkManagePage.optional')" class="yuemu-input-base" />
            </div>
          </div>
          <div class="yuemu-form-item">
            <label>{{ t('pages.admin.friendLinkManagePage.siteDesc') }}</label>
            <a-textarea v-model:value="formData.siteDesc" :placeholder="t('pages.admin.friendLinkManagePage.siteDescPlaceholder')" :rows="3" class="yuemu-input-base" />
          </div>
          <div class="yuemu-modal-footer">
            <a-button class="yuemu-btn-ghost" @click="handleModalCancel">{{ t('pages.admin.friendLinkManagePage.cancel') }}</a-button>
            <a-button type="primary" class="yuemu-btn-primary" @click="handleModalOk" :loading="modalLoading">{{ t('pages.admin.friendLinkManagePage.save') }}</a-button>
          </div>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="weightModalVisible"
        :title="t('pages.admin.friendLinkManagePage.setWeightTitle')"
        :footer="null"
        class="yuemu-apple-modal"
        centered
        width="360px"
      >
        <div class="yuemu-modal-form">
          <div class="yuemu-form-item">
            <label>{{ t('pages.admin.friendLinkManagePage.weightValue') }}</label>
            <a-input-number
              v-model:value="weightForm.weight"
              :min="0"
              :max="100"
              class="yuemu-input-base"
              style="width: 100%"
            />
            <p class="yuemu-text-secondary" style="font-size: 12px; margin-top: 8px;">{{ t('pages.admin.friendLinkManagePage.weightHint') }}</p>
          </div>
          <div class="yuemu-modal-footer">
            <a-button class="yuemu-btn-ghost" @click="handleWeightModalCancel">{{ t('pages.admin.friendLinkManagePage.cancel') }}</a-button>
            <a-button type="primary" class="yuemu-btn-primary" @click="handleWeightModalOk" :loading="weightModalLoading">{{ t('pages.admin.friendLinkManagePage.confirm') }}</a-button>
          </div>
        </div>
      </a-modal>
    </template>

    <template v-else>
      <van-dialog
        v-model:show="modalVisible"
        :title="modalMode === 'add' ? t('pages.admin.friendLinkManagePage.addLink') : t('pages.admin.friendLinkManagePage.editLink')"
        show-cancel-button
        :before-close="handleMobileDialogClose"
        class="yuemu-dark-van-dialog"
      >
        <van-form ref="mobileFormRef" class="yuemu-dark-van-form">
          <van-cell-group inset>
            <van-field v-model="formData.siteName" :label="t('pages.admin.friendLinkManagePage.siteName')" :placeholder="t('pages.admin.friendLinkManagePage.required')" :rules="[{ required: true }]" />
            <van-field v-model="formData.siteUrl" :label="t('pages.admin.friendLinkManagePage.siteUrl')" :placeholder="t('pages.admin.friendLinkManagePage.requiredUrl')" :rules="[{ required: true }]" />
            <van-field
              v-model="formData.siteType"
              is-link
              readonly
              :label="t('pages.admin.friendLinkManagePage.siteType')"
              :placeholder="t('pages.admin.friendLinkManagePage.pleaseSelect')"
              @click="showSiteTypePicker = true"
              :rules="[{ required: true }]"
            />
            <van-field v-model="formData.siteLogo" :label="t('pages.admin.friendLinkManagePage.siteLogo')" :placeholder="t('pages.admin.friendLinkManagePage.optionalPicUrl')" />
            <van-field v-model="formData.ownerName" :label="t('pages.admin.friendLinkManagePage.ownerName')" :placeholder="t('pages.admin.friendLinkManagePage.optional')" />
            <van-field v-model="formData.ownerContact" :label="t('pages.admin.friendLinkManagePage.contactInfo')" :placeholder="t('pages.admin.friendLinkManagePage.optional')" />
            <van-field v-model="formData.siteDesc" :label="t('pages.admin.friendLinkManagePage.siteDesc')" type="textarea" :placeholder="t('pages.admin.friendLinkManagePage.optional')" rows="2" autosize />
          </van-cell-group>
        </van-form>
      </van-dialog>

      <van-popup v-model:show="showSiteTypePicker" round position="bottom" class="yuemu-dark-action-sheet">
        <van-picker
          :columns="siteTypes.map(type => ({ text: type.name, value: type.value }))"
          @confirm="onSiteTypeConfirm"
          @cancel="showSiteTypePicker = false"
          show-toolbar
          :title="t('pages.admin.friendLinkManagePage.selectSiteType')"
        />
      </van-popup>

      <van-dialog
        v-model:show="weightModalVisible"
        :title="t('pages.admin.friendLinkManagePage.setWeightTitle')"
        show-cancel-button
        :before-close="handleMobileWeightDialogClose"
        class="yuemu-dark-van-dialog"
      >
        <van-cell-group inset class="yuemu-dark-van-form">
          <van-field :label="t('pages.admin.friendLinkManagePage.weightValueMobile')">
            <template #input>
              <van-stepper v-model="weightForm.weight" :min="0" :max="100" integer />
            </template>
          </van-field>
        </van-cell-group>
      </van-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  SearchOutlined, PlusOutlined, CloudSyncOutlined, LinkOutlined,
  UserOutlined, MessageOutlined
} from '@ant-design/icons-vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import type { FriendLink, SiteType } from '@/api/types'
import {
  listFriendLinksByPageUsingGet, addFriendLinkUsingPost, updateFriendLinkUsingPost,
  deleteFriendLinkUsingPost, reviewFriendLinkUsingPost, updateWeightUsingPost,
  refreshCacheUsingPost, listSiteTypesUsingGet
} from '@/api/friendLinkController'
import { formatTime } from '@/utils/dateUtils'

const router = useRouter()
const device = ref<string>('')

// 状态文案
const getStatusText = (status: number | undefined) => {
  switch (status) {
    case 1: return t('pages.admin.friendLinkManagePage.approved')
    case 2: return t('pages.admin.friendLinkManagePage.rejected')
    default: return t('pages.admin.friendLinkManagePage.pending')
  }
}

// 动态色彩类名，匹配重构后的 CSS
const getStatusColorClass = (status: number) => {
  switch (status) {
    case 1: return 'yuemu-bg-green'
    case 2: return 'yuemu-bg-red'
    default: return 'yuemu-bg-orange'
  }
}

const openUrl = (url: string) => { if (url) window.open(url, '_blank') }

onMounted(async () => {
  device.value = await getDeviceType()
  await Promise.all([fetchFriendLinks(), fetchSiteTypes()])
})

// PC 表格列定义
const columns = [
  { get title() { return t('pages.admin.friendLinkManagePage.colSiteInfo') }, dataIndex: 'siteInfo', key: 'siteInfo', width: 260 },
  { get title() { return t('pages.admin.friendLinkManagePage.colSiteUrl') }, dataIndex: 'siteUrl', key: 'siteUrl', width: 220, ellipsis: true },
  { get title() { return t('pages.admin.friendLinkManagePage.colWeight') }, dataIndex: 'weight', key: 'weight', sorter: true, width: 90 },
  { get title() { return t('pages.admin.friendLinkManagePage.colCreateTime') }, dataIndex: 'createTime', key: 'createTime', width: 140 },
  { get title() { return t('pages.admin.friendLinkManagePage.colStatus') }, dataIndex: 'status', key: 'status', width: 120 },
  { get title() { return t('pages.admin.friendLinkManagePage.colAction') }, key: 'action', fixed: 'right', width: 280, align: 'right' }
]

const loading = ref<boolean>(false)
const friendLinks = ref<FriendLink[]>([])
const siteTypes = ref<SiteType[]>([])
const total = ref<number>(0)

interface MobileOption { text: string; value: string | number | undefined; }

const mobileTypeOptions = computed<MobileOption[]>(() => [
  { get text() { return t('pages.admin.friendLinkManagePage.allTypes') }, value: '' },
  ...siteTypes.value.map(type => ({ text: type.name || '', value: type.value || '' }))
])

const mobileStatusOptions = [
  { get text() { return t('pages.admin.friendLinkManagePage.allStatus') }, value: '' },
  { get text() { return t('pages.admin.friendLinkManagePage.approved') }, value: 1 },
  { get text() { return t('pages.admin.friendLinkManagePage.pending') }, value: 0 },
  { get text() { return t('pages.admin.friendLinkManagePage.rejected') }, value: 2 }
]

const pagination = reactive({ current: 1, pageSize: 10 })
const searchParams = reactive({ siteName: '', siteType: '', status: '', orderBy: undefined as string | undefined })

const modalVisible = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const modalLoading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: undefined as number | undefined,
  siteName: '', siteUrl: '', siteLogo: '', siteDesc: '',
  ownerName: '', ownerContact: '', siteType: undefined as string | undefined
})

const weightModalVisible = ref(false)
const weightModalLoading = ref(false)
const weightForm = reactive({ id: undefined as number | undefined, weight: 0 })

const rules = {
  siteName: [{ required: true, get message() { return t('pages.admin.friendLinkManagePage.enterSiteName') }, trigger: 'blur' }],
  siteUrl: [{ required: true, get message() { return t('pages.admin.friendLinkManagePage.enterSiteUrl') }, trigger: 'blur' }],
  siteType: [{ required: true, get message() { return t('pages.admin.friendLinkManagePage.enterSiteType') }, trigger: 'change' }]
}

const fetchFriendLinks = async () => {
  loading.value = true
  try {
    const res = await listFriendLinksByPageUsingGet({
      current: pagination.current, pageSize: pagination.pageSize, ...searchParams
    })
    if (res.data?.code === 0 && res.data?.data) {
      friendLinks.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (err) { message.error(t('pages.admin.friendLinkManagePage.fetchListError')) } finally { loading.value = false }
}

const fetchSiteTypes = async () => {
  try {
    const res = await listSiteTypesUsingGet()
    if (res.data?.code === 0 && res.data?.data) {
      siteTypes.value = res.data.data.map((type: any) => ({ name: type.name, value: type.value.toUpperCase() }))
    }
  } catch (error) {}
}

const handleTableChange = (pag: any, filters: any, sorter: any) => {
  searchParams.orderBy = sorter.field === 'weight' ? `weight ${sorter.order === 'ascend' ? 'asc' : 'desc'}` : undefined
  fetchFriendLinks()
}

const handleSearch = () => { pagination.current = 1; fetchFriendLinks() }
const onPaginationChange = (page: number, pageSize: number) => { pagination.current = page; pagination.pageSize = pageSize; fetchFriendLinks() }

const showAddModal = () => {
  modalMode.value = 'add'
  Object.assign(formData, { id: undefined, siteName: '', siteUrl: '', siteLogo: '', siteDesc: '', ownerName: '', ownerContact: '', siteType: undefined })
  modalVisible.value = true
}

const showEditModal = (record: any) => { modalMode.value = 'edit'; Object.assign(formData, record); modalVisible.value = true }

const handleModalOk = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    modalLoading.value = true
    const api = modalMode.value === 'add' ? addFriendLinkUsingPost : updateFriendLinkUsingPost
    const res = await api(formData)
    if (res.data?.code === 0) { message.success(t('pages.admin.friendLinkManagePage.saveSuccess')); modalVisible.value = false; fetchFriendLinks() }
  } catch (err) {} finally { modalLoading.value = false }
}

const handleModalCancel = () => { modalVisible.value = false; formRef.value?.resetFields() }

const handleReview = async (item: FriendLink) => {
  const targetStatus = (item.status === 1) ? 2 : 1
  try {
    const res = await reviewFriendLinkUsingPost({ id: item.id, status: targetStatus })
    if (res.data?.code === 0) { message.success(targetStatus === 1 ? t('pages.admin.friendLinkManagePage.approveSuccess') : t('pages.admin.friendLinkManagePage.rejectSuccess')); fetchFriendLinks() }
    else { message.error(res.data?.message || t('pages.admin.friendLinkManagePage.operationError')) }
  } catch (err) { message.error(t('pages.admin.friendLinkManagePage.operationError')) }
}

const showWeightModal = (record: any) => { weightForm.id = record.id; weightForm.weight = Number(record.weight); weightModalVisible.value = true }

const handleWeightModalOk = async () => {
  try {
    weightModalLoading.value = true
    const res = await updateWeightUsingPost({ id: weightForm.id!, weight: weightForm.weight })
    if (res.data?.code === 0) { message.success(t('pages.admin.friendLinkManagePage.setWeightSuccess')); weightModalVisible.value = false; fetchFriendLinks() }
  } catch (error) {} finally { weightModalLoading.value = false }
}

const handleWeightModalCancel = () => { weightModalVisible.value = false }

const handleRefreshCache = async () => {
  try {
    const res = await refreshCacheUsingPost()
    if (res.data?.code === 0) message.success(t('pages.admin.friendLinkManagePage.refreshCacheSuccess'))
  } catch (error) {}
}

const onMobilePageChange = (page: number) => {
  pagination.current = page; fetchFriendLinks()
  document.querySelector('.yuemu-mobile-content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
}

const showDeleteConfirm = (item: FriendLink) => {
  Modal.confirm({
    get title() { return t('pages.admin.friendLinkManagePage.confirmDeleteTitle') },
    content: t('pages.admin.friendLinkManagePage.confirmDeleteMsg', { name: item.siteName }),
    get okText() { return t('pages.admin.friendLinkManagePage.confirmDelete') },
    okType: 'danger',
    get cancelText() { return t('pages.admin.friendLinkManagePage.cancel') },
    async onOk() {
      const res = await deleteFriendLinkUsingPost({ id: item.id })
      if (res.data?.code === 0) { message.success(t('pages.admin.friendLinkManagePage.deleteSuccess')); fetchFriendLinks() }
    }
  })
}

// 移动端相关
const showSiteTypePicker = ref(false)
const mobileFormRef = ref()

const handleMobileDialogClose = (action: string) => {
  if (action === 'confirm') { handleMobileFormSubmit(); return false }
  return true
}

const handleMobileFormSubmit = async () => {
  try {
    await mobileFormRef.value?.validate()
    modalLoading.value = true
    const api = modalMode.value === 'add' ? addFriendLinkUsingPost : updateFriendLinkUsingPost
    const res = await api(formData)
    if (res.data?.code === 0) { message.success(t('pages.admin.friendLinkManagePage.saveSuccess')); modalVisible.value = false; fetchFriendLinks() }
  } catch (err) {} finally { modalLoading.value = false }
}

const onSiteTypeConfirm = (value: { text: string; value: string }) => {
  formData.siteType = value.value; showSiteTypePicker.value = false
}

const handleMobileWeightDialogClose = async (action: string) => {
  if (action === 'confirm') {
    try {
      weightModalLoading.value = true
      const res = await updateWeightUsingPost({ id: weightForm.id!, weight: Number(weightForm.weight) })
      if (res.data?.code === 0) { message.success(t('pages.admin.friendLinkManagePage.setSuccess')); weightModalVisible.value = false; pagination.current = 1; fetchFriendLinks(); return true }
    } catch (err) {} finally { weightModalLoading.value = false }
    return false
  }
  weightModalVisible.value = false; return true
}
</script>

<style scoped>
/* ==================== 1. 基础全局配置 ==================== */
#yuemu-friend-link-manage {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-font-semibold { font-weight: 600; }

/* ==================== 2. PC 端工作台 ==================== */
.yuemu-pc-dashboard {
  padding: 32px 24px;
  max-width: 1500px;
  margin: 0 auto;
}

/* 头部面板 */
.yuemu-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}
.yuemu-page-title { margin: 0; font-size: 26px; font-weight: 800; color: var(--text-primary); letter-spacing: 0.5px; }
.yuemu-page-desc { margin: 4px 0 0 0; font-size: 14px; color: var(--text-secondary); opacity: 0.8; }
.yuemu-header-right { display: flex; gap: 12px; }

/* 检索过滤栏 */
.yuemu-filter-bar {
  background: var(--card-background);
  border-radius: 16px;
  padding: 16px 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px var(--shadow-color);
  margin-bottom: 24px;
}
.yuemu-filter-form { display: flex; flex-wrap: wrap; gap: 12px; width: 100%; }

/* ==================== 3. 基础 UI 组件覆写 (彻底解决搜索框白块问题) ==================== */

/* 按钮系 */
.yuemu-btn-primary { background: var(--link-color) !important; color: #fff !important; border: none !important; border-radius: 8px !important; font-weight: 500; height: 36px; padding: 0 16px; box-shadow: 0 4px 12px rgba(var(--link-color-rgb), 0.25); }
.yuemu-btn-primary:hover { filter: brightness(1.1); }
.yuemu-btn-ghost { background: var(--hover-background) !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; border-radius: 8px !important; height: 36px; }

/* ======== 重点修复：PC 搜索框和下拉框 ======== */
/* 外层 Wrapper 及 Select Selector 统一背景和边框 */
:deep(.yuemu-input-base),
:deep(.yuemu-input-base > .ant-input),
:deep(.yuemu-select-base .ant-select-selector) {
  background-color: var(--hover-background) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: all 0.3s;
}

/* 当 Input 带有 Prefix/Suffix/Clear (表现为 affix-wrapper) 时，强制其内部真正的 Input 为透明 */
:deep(.yuemu-input-base.ant-input-affix-wrapper) {
  background-color: var(--hover-background) !important;
}
:deep(.yuemu-input-base.ant-input-affix-wrapper > input.ant-input) {
  background-color: transparent !important;
  border: none !important;
  color: var(--text-primary) !important;
}

/* 焦点/Hover 高亮状态 */
:deep(.yuemu-input-base:hover),
:deep(.yuemu-input-base.ant-input-affix-wrapper:hover),
:deep(.yuemu-input-base:focus-within),
:deep(.yuemu-select-base:hover .ant-select-selector),
:deep(.yuemu-select-base.ant-select-focused .ant-select-selector) {
  border-color: var(--link-color) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important; /* 兼容变量可以用 rgba(var(--link-color-rgb), 0.1) */
}

/* Placeholder 文本颜色 */
:deep(.ant-input::placeholder),
:deep(.ant-input-affix-wrapper input::placeholder),
:deep(.ant-select-selection-placeholder) {
  color: var(--text-secondary) !important;
  opacity: 0.6;
}

/* AntD 图标颜色修复 (清除按钮/下拉箭头) */
:deep(.ant-input-clear-icon),
:deep(.ant-select-arrow) {
  color: var(--text-secondary) !important;
  background-color: transparent !important;
}
:deep(.ant-input-clear-icon:hover) {
  color: var(--text-primary) !important;
}

/* 下拉菜单和弹窗暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .yuemu-dark-dropdown, .ant-select-dropdown {
    background-color: #262626 !important;
    border: 1px solid #3a3a3a !important;
    box-shadow: 0 6px 16px rgba(0,0,0,0.5) !important;
  }
  .ant-select-item { color: #e5e5e5 !important; }
  .ant-select-item-option-hover, .ant-select-item-option-active { background-color: #383838 !important; }

  .yuemu-apple-modal .ant-modal-content { background: #1f1f1f !important; border: 1px solid #333 !important; color: #fff !important; }
  .yuemu-apple-modal .ant-modal-header { background: #1f1f1f !important; border-bottom: 1px solid #333 !important; }
  .yuemu-apple-modal .ant-modal-title { color: #fff !important; }
  .ant-modal-close { color: #999 !important; }
}

/* ==================== 4. 表格无界感重构 ==================== */
.yuemu-table-container {
  background: var(--card-background);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  padding: 8px;
  box-shadow: 0 8px 30px var(--shadow-color);
}

:deep(.yuemu-seamless-table) {
  .ant-table { background: transparent !important; color: var(--text-primary) !important; }
  .ant-table-thead > tr > th {
    background: transparent !important;
    border-bottom: 1px solid var(--border-color) !important;
    color: var(--text-secondary) !important;
    font-weight: 600; font-size: 13px; text-transform: uppercase;
  }
  .ant-table-thead > tr > th::before { display: none !important; }
  .ant-table-tbody > tr > td {
    background: transparent !important;
    border-bottom: 1px solid var(--border-color) !important;
    padding: 16px !important;
    transition: background 0.3s;
  }
  .ant-table-tbody > tr:hover > td,
  .ant-table-tbody > tr:hover > .ant-table-cell-fix-left,
  .ant-table-tbody > tr:hover > .ant-table-cell-fix-right {
    background: var(--hover-background) !important;
  }
  .ant-table-cell-fix-left, .ant-table-cell-fix-right { background: var(--card-background) !important; }
}

/* ==================== 5. 表格内视觉元素 ==================== */
.yuemu-site-info-cell { display: flex; align-items: center; gap: 12px; }
.yuemu-logo-wrap { width: 44px; height: 44px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); background: #fff; flex-shrink: 0; }
.yuemu-logo-wrap img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-site-meta { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }

.yuemu-mac-link { color: var(--link-color); font-weight: 500; transition: opacity 0.2s; }
.yuemu-mac-link:hover { opacity: 0.7; text-decoration: underline; }

.yuemu-weight-tag {
  background: var(--hover-background); color: var(--text-primary);
  padding: 4px 10px; border-radius: 8px; font-family: monospace; font-weight: 600;
}

.yuemu-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; gap: 6px; }
.yuemu-mini-tag { padding: 2px 6px; font-size: 11px; }

.yuemu-bg-blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
.yuemu-bg-green { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
.yuemu-bg-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
.yuemu-bg-orange { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
.yuemu-bg-gray { background: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }

.yuemu-status-dot { width: 6px; height: 6px; border-radius: 50%; }
.yuemu-status-dot.yuemu-bg-green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.yuemu-status-dot.yuemu-bg-red { background: #ef4444; }
.yuemu-status-dot.yuemu-bg-orange { background: #f59e0b; }

.yuemu-action-cell { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.yuemu-icon-text-btn { background: transparent; border: none; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.yuemu-icon-text-btn:hover { background: var(--hover-background); }
.yuemu-color-primary { color: var(--link-color); }
.yuemu-color-success { color: #10b981; }
.yuemu-color-warning { color: #f59e0b; }
.yuemu-color-danger { color: #ef4444; }
.yuemu-color-gray { color: var(--text-secondary); }

/* 分页 */
.yuemu-pagination-bar { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item), :deep(.ant-pagination-prev), :deep(.ant-pagination-next) { background: transparent !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-item a) { color: var(--text-primary) !important; }
:deep(.ant-pagination-item-active) { border-color: var(--link-color) !important; background: var(--hover-background) !important; }

/* ==================== 6. 移动端 Feed 瀑布流 ==================== */
.yuemu-m-container { min-height: 100vh; display: flex; flex-direction: column; }

.yuemu-m-sticky-header {
  position: sticky; top: 0; z-index: 100;
  padding: 12px 16px;
  background: rgba(var(--header-background-rgb, 255,255,255), 0.85);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}
@media (prefers-color-scheme: dark) { .yuemu-m-sticky-header { background: rgba(30,30,30,0.85); } }

.yuemu-m-header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-m-title { font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0; }
.yuemu-m-actions { display: flex; gap: 10px; }
.yuemu-m-primary-btn { background: var(--link-color) !important; border: none !important; width: 32px; height: 32px; }
.yuemu-m-ghost-btn { background: var(--hover-background) !important; color: var(--text-primary) !important; border: 1px solid var(--border-color) !important; width: 32px; height: 32px; box-shadow: none; }

.yuemu-m-search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }

/* ======== 重点修复：移动端 Vant 搜索框暗黑适配 ======== */
:deep(.yuemu-m-search) { flex: 1; padding: 0 !important; background: transparent !important; }
:deep(.yuemu-m-search .van-search__content) {
  background-color: var(--hover-background) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px;
}
:deep(.yuemu-m-search .van-cell),
:deep(.yuemu-m-search .van-cell__value),
:deep(.yuemu-m-search .van-field__body) {
  background-color: transparent !important;
}
:deep(.yuemu-m-search .van-field__control) { color: var(--text-primary) !important; }
:deep(.yuemu-m-search .van-field__control::placeholder) { color: var(--text-secondary) !important; }
:deep(.yuemu-m-search .van-icon) { color: var(--text-secondary) !important; }

.yuemu-m-filter-row { margin: 0 -16px; }
:deep(.yuemu-m-van-dropdown .van-dropdown-menu__bar) { background: transparent !important; box-shadow: none !important; height: 40px; }
:deep(.yuemu-m-van-dropdown .van-dropdown-menu__title) { color: var(--text-primary) !important; }



.yuemu-m-scroll-view { flex: 1; overflow-y: auto; padding: 16px; }
.yuemu-m-card-list { display: flex; flex-direction: column; gap: 16px; }

/* 移动端卡片 */
.yuemu-m-card {
  background: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 20px; padding: 16px; margin-bottom: 20px;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.yuemu-m-card-header { display: flex; gap: 12px; margin-bottom: 16px; }
.yuemu-m-logo { width: 48px; height: 48px; flex-shrink: 0; }
.yuemu-m-main-info { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.yuemu-m-title-row { display: flex; align-items: center; gap: 8px; }
.yuemu-m-site-name { font-size: 16px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-m-status-row { display: flex; justify-content: space-between; align-items: center; }
.yuemu-m-weight-text { font-size: 12px; font-weight: 500; }

.yuemu-m-card-body { margin-bottom: 16px; }
.yuemu-m-url-box {
  display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--link-color);
  background: var(--hover-background); padding: 10px 12px; border-radius: 10px; margin-bottom: 12px;
  word-break: break-all;
}
.yuemu-m-desc-text { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.yuemu-m-contact-box { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }

.yuemu-m-card-actions { display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 16px; }
.yuemu-m-action-btn { flex: 1; min-width: 70px; padding: 8px 0; border-radius: 10px; border: 1px solid var(--border-color); background: var(--card-background); font-size: 13px; font-weight: 600; }

:deep(.yuemu-dark-van-pagination .van-pagination__item) { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); }
:deep(.yuemu-dark-van-pagination .van-pagination__item--active) { background: var(--link-color); color: #fff; border-color: var(--link-color); border-radius: 8px; }

/* 移动端 Vant 弹窗修复 */
:deep(.yuemu-dark-van-dialog) { background: var(--card-background) !important; color: var(--text-primary) !important; border-radius: 20px; }
:deep(.yuemu-dark-van-dialog .van-dialog__header) { color: var(--text-primary); padding-top: 24px; font-weight: 700; }
:deep(.yuemu-dark-van-form .van-cell) { background: var(--background); color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
:deep(.yuemu-dark-van-form .van-cell::after) { display: none; }
:deep(.yuemu-dark-van-form .van-field__control) { color: var(--text-primary) !important; }
:deep(.yuemu-dark-van-dialog .van-button) { background: var(--card-background); color: var(--text-primary); border-top: 1px solid var(--border-color); }
:deep(.yuemu-dark-van-dialog .van-dialog__confirm) { color: var(--link-color); }



/* ==================== 7. Apple 风格表单弹窗 (PC) ==================== */
:deep(.yuemu-apple-modal .ant-modal-content) { background: var(--card-background); border-radius: 20px; padding: 0; overflow: hidden; border: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-header) { background: var(--card-background); padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-title) { font-weight: 700; font-size: 18px; text-align: center; }

.yuemu-modal-form { padding: 24px; }
.yuemu-form-item { margin-bottom: 16px; }
.yuemu-form-row { display: flex; gap: 16px; }
.yuemu-half { flex: 1; }
.yuemu-form-item label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.yuemu-required { color: #ef4444; }

.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 32px; }
.yuemu-modal-footer .ant-btn { flex: 1; height: 42px; border-radius: 12px; font-weight: 600; font-size: 15px; }
</style>
