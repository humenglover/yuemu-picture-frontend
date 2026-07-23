<template>
  <div id="userManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="pc-container">
        <div class="mac-header-panel">
          <a-form layout="inline" :model="searchParams" class="mac-search-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.userAccount"
                :placeholder="t('pages.admin.userManagePage.searchAccount')"
                allow-clear
                class="mac-input"
              >
                <template #prefix><SearchOutlined class="search-icon" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-input
                v-model:value="searchParams.userName"
                :placeholder="t('pages.admin.userManagePage.searchUserName')"
                allow-clear
                class="mac-input"
              >
                <template #prefix><SearchOutlined class="search-icon" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="ios-btn-primary">
                {{ t('pages.admin.userManagePage.search') }}
              </a-button>
            </a-form-item>
          </a-form>

          <div class="action-group">
            <a-button class="ios-btn-ghost" @click="toggleSortOrder">
              <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
              <SortDescendingOutlined v-else />
              {{ sortOrder === 'ascend' ? t('pages.admin.userManagePage.ascendText') : t('pages.admin.userManagePage.descendText') }}
            </a-button>
            <a-button
              type="primary"
              danger
              :disabled="!hasSelected"
              @click="batchDeleteSelectedPictures"
              class="ios-btn-danger"
              v-show="hasSelected"
            >
              <DeleteOutlined /> {{ t('pages.admin.userManagePage.batchDelete') }}
            </a-button>
            <a-button type="primary" class="ios-btn-primary" @click="openModal">
              <PlusOutlined /> {{ t('pages.admin.userManagePage.addUser') }} </a-button>
          </div>
        </div>

        <div class="mac-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              :row-selection="rowSelection"
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="mac-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'userAvatar'">
                  <div class="avatar-container">
                    <img :src="record.userAvatar || 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" class="avatar-img" />
                  </div>
                </template>

                <template v-else-if="column.dataIndex === 'userInfo'">
                  <div class="user-info-cell">
                    <div class="user-name-row">
                      <span class="user-name">{{ record.userName || t('pages.admin.userManagePage.notSetName') }}</span>
                      <RobotOutlined v-if="record.userRole === 'bot'" class="bot-icon" />
                    </div>
                    <div class="user-account text-secondary">@{{ record.userAccount }}</div>
                  </div>
                </template>

                <template v-else-if="column.dataIndex === 'userProfile'">
                  <span class="text-secondary">{{ record.userProfile || t('pages.admin.userManagePage.lazyDesc') }}</span>
                </template>

                <template v-else-if="column.dataIndex === 'userRole'">
                  <div class="ios-tag" :class="record.userRole">
                    {{ record.userRole === 'admin' ? t('pages.admin.userManagePage.admin') : record.userRole === 'bot' ? t('pages.admin.userManagePage.bot') : record.userRole === 'user' ? t('pages.admin.userManagePage.normalUser') : t('pages.admin.userManagePage.bannedUser') }}
                  </div>
                </template>
                <template v-if="column.dataIndex === 'createTime'">
                  <span class="text-secondary">
                    {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'email'">
                  <span class="text-secondary">{{ record.email || '--' }}</span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="mac-action-buttons">
                    <a-button type="text" class="btn-text-blue" @click="goToUserDetail(record.id)">
                      {{ t('pages.admin.userManagePage.view') }}
                    </a-button>
                    <!-- 机器人用户显示 Pexels 抓取按钮 -->
                    <a-button
                      v-if="record.userRole === 'bot'"
                      type="text"
                      class="btn-text-green"
                      @click="handlePexelsCrawl"
                      :loading="crawlLoading"
                    >
                      <CloudDownloadOutlined /> {{ t('pages.admin.userManagePage.crawlPic') }} </a-button>
                    <!-- 非管理员、非机器人、非当前用户显示封禁按钮 -->
                    <a-button
                      v-if="record.userRole !== 'admin' && record.userRole !== 'bot' && record.id !== loginUserStore.loginUser.id && record.userRole !== 'ban'"
                      type="text" class="btn-text-orange" @click="handleBanOrUnban(record)"
                    > {{ t('pages.admin.userManagePage.ban') }} </a-button>
                    <a-button
                      v-if="record.userRole === 'ban' && record.userRole !== 'bot' && record.id !== loginUserStore.loginUser.id"
                      type="text" class="btn-text-green" @click="handleBanOrUnban(record)"
                    > {{ t('pages.admin.userManagePage.unban') }} </a-button>
                    <a-button
                      v-if="record.userRole !== 'admin' && record.userRole !== 'bot' && record.id !== loginUserStore.loginUser.id"
                      type="text" class="btn-text-red" @click="showDeleteConfirm(record)"
                    >
                      {{ t('pages.admin.userManagePage.delete') }}
                    </a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="mac-pagination">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="pcPageSizeOptions"
            :total="total"
            :show-total="(total) => t('pages.admin.userManagePage.totalUserText', { total })"
            show-size-changer
            :page-size="searchParams.pageSize"
            @change="onPageChange"
            @showSizeChange="onShowSizeChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="mobile-container">
        <div class="ios-sticky-header">
          <div class="header-top">
            <h1 class="page-title"> {{ t('pages.admin.userManagePage.title') }} </h1>
            <van-button type="primary" size="small" icon="plus" class="ios-btn-icon" @click="openModal" round />
          </div>
          <div class="search-bar-wrapper">
            <van-search
              v-model="searchParams.userAccount"
              :placeholder="t('pages.admin.userManagePage.searchAccount')"
              class="ios-search"
              shape="round"
              @search="doSearch"
            />
            <div class="filter-actions">
              <span class="sort-text" @click="toggleSortOrder">
                {{ sortOrder === 'ascend' ? t('pages.admin.userManagePage.ascendText') : t('pages.admin.userManagePage.descendText') }}
                <van-icon :name="sortOrder === 'ascend' ? 'ascending' : 'descending'" />
              </span>
            </div>
          </div>
          <div class="batch-action-bar" :class="{ 'is-active': hasSelected }">
            <span class="text-secondary">{{ t('pages.admin.userManagePage.selectedItems', { count: state.selectedRowKeys.length }) }}</span>
            <van-button size="mini" round type="danger" @click="batchDeleteSelectedPictures">{{ t('pages.admin.userManagePage.batchDelete') }}</van-button>
          </div>
        </div>

        <div class="mobile-content-scroll">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div class="ios-card-list">
              <div v-for="user in dataList" :key="user.id" class="ios-user-card">
                <div class="card-header">
                  <van-checkbox
                    v-if="user.userRole !== 'admin' && user.userRole !== 'bot' && user.id !== loginUserStore.loginUser.id"
                    :name="user.id"
                    class="ios-checkbox"
                  />
                  <div class="avatar-wrap">
                    <img :src="user.userAvatar || 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" alt="avatar"/>
                  </div>
                  <div class="user-main-info">
                    <div class="name-row">
                      <span class="name">{{ user.userName || t('pages.admin.userManagePage.notSetName') }}</span>
                      <RobotOutlined v-if="user.userRole === 'bot'" class="mobile-bot-icon" />
                      <span class="ios-badge" :class="user.userRole">
                        {{ user.userRole === 'admin' ? t('pages.admin.userManagePage.admin') : user.userRole === 'bot' ? t('pages.admin.userManagePage.bot') : user.userRole === 'user' ? t('pages.admin.userManagePage.normalUser') : t('pages.admin.userManagePage.bannedUser') }}
                      </span>
                    </div>
                    <div class="account-row text-secondary">@{{ user.userAccount }}</div>
                  </div>
                </div>

                <div class="card-body">
                  <p class="desc">{{ user.userProfile || t('pages.admin.userManagePage.lazyDesc') }}</p>
                  <div class="meta-info text-secondary">
                    <div class="meta-item">
                      <MailOutlined class="icon" />
                      {{ user.email || t('pages.admin.userManagePage.unboundEmail') }}
                    </div>
                    <div class="meta-item time">
                      {{ dayjs(user.createTime).format('YYYY-MM-DD HH:mm') }}
                    </div>
                  </div>
                </div>

                <div class="card-actions">
                  <button class="ios-action-btn view" @click="goToUserDetail(user.id)">
                    {{ t('pages.admin.userManagePage.view') }}
                  </button>
                  <!-- 机器人用户显示 Pexels 抓取按钮 -->
                  <button
                    v-if="user.userRole === 'bot'"
                    class="ios-action-btn success"
                    @click="handlePexelsCrawl"
                    :disabled="crawlLoading"
                  >
                    {{ crawlLoading ? t('pages.admin.userManagePage.crawling') : t('pages.admin.userManagePage.crawlPic') }}
                  </button>
                  <!-- 非管理员、非机器人、非当前用户显示操作按钮 -->
                  <template v-if="user.id !== loginUserStore.loginUser.id && user.userRole !== 'admin' && user.userRole !== 'bot'">
                    <button
                      v-if="user.userRole !== 'ban'"
                      class="ios-action-btn warn"
                      @click="handleBanOrUnban(user)"
                    > {{ t('pages.admin.userManagePage.ban') }} </button>
                    <button
                      v-else
                      class="ios-action-btn success"
                      @click="handleBanOrUnban(user)"
                    > {{ t('pages.admin.userManagePage.unban') }} </button>
                    <button class="ios-action-btn danger" @click="showDeleteConfirm(user)">
                      {{ t('pages.admin.userManagePage.delete') }}
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </van-checkbox-group>

          <div class="ios-pagination">
            <div class="page-info text-secondary">
              <span>{{ t('pages.admin.userManagePage.totalRecordsText2', { total }) }}</span>
              <span class="page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} {{ t('pages.admin.userManagePage.recordsPerPage') }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.userManagePage.prevPage')" :next-text="t('pages.admin.userManagePage.nextPage')"
              v-model="searchParams.current"
              :total-items="total"
              :items-per-page="searchParams.pageSize"
              @change="onMobilePageChange"
              :show-page-size="3"
              force-ellipses
              class="mac-van-pagination"
            />
          </div>
        </div>

        <van-action-sheet v-model:show="showPageSizeSheet" :actions="mobilePageSizeOptions" :cancel-text="t('pages.admin.userManagePage.cancel')" close-on-click-action @select="handlePageSizeChange" class="ios-action-sheet" />
      </div>
    </template>

    <a-modal v-model:open="open" :title="t('pages.admin.userManagePage.addUser')" @click="openModal" class="mac-modal" :footer="null">
      <form @submit.prevent="handleAddUser" class="mac-form">
        <div class="form-item">
          <label> {{ t('pages.admin.userManagePage.account') }} <span class="required">*</span></label>
          <a-input v-model:value="addUserForm.userAccount" :placeholder="t('pages.admin.userManagePage.inputAccount')" class="mac-input" />
        </div>
        <div class="form-item">
          <label> {{ t('pages.admin.userManagePage.userRole') }} <span class="required">*</span></label>
          <a-select v-model:value="addUserForm.userRole" :placeholder="t('pages.admin.userManagePage.selectRole')" class="mac-select" :dropdownClassName="'mac-select-dropdown'">
            <a-select-option value="admin"> {{ t('pages.admin.userManagePage.admin') }} </a-select-option>
            <a-select-option value="user"> {{ t('pages.admin.userManagePage.normalUser') }} </a-select-option>
          </a-select>
        </div>
        <div class="form-item">
          <label> {{ t('pages.admin.userManagePage.userName') }} </label>
          <a-input v-model:value="addUserForm.userName" :placeholder="t('pages.admin.userManagePage.inputUserName')" class="mac-input" />
        </div>
        <div class="form-item">
          <label> {{ t('pages.admin.userManagePage.profile') }} </label>
          <a-textarea v-model:value="addUserForm.userProfile" :placeholder="t('pages.admin.userManagePage.inputProfile')" :rows="3" class="mac-input" />
        </div>
        <div class="modal-footer">
          <a-button class="ios-btn-ghost" @click="cancelAddUser">{{ t('pages.admin.userManagePage.cancel') }}</a-button>
          <a-button type="primary" class="ios-btn-primary" html-type="submit" @click="handleAddUser">{{ t('pages.admin.userManagePage.confirmAdd') }}</a-button>
        </div>
      </form>
    </a-modal>

    <a-modal
      v-model:open="deleteConfirmVisible"
      :title="null"
      :footer="null"
      :width="360"
      class="ios-confirm-modal"
      centered
    >
      <div class="ios-confirm-content">
        <div class="icon-wrap">
          <ExclamationCircleFilled />
        </div>
        <h3 class="confirm-title"> {{ t('pages.admin.userManagePage.confirmDeleteUser') }} </h3>
        <p class="confirm-desc">{{ t('pages.admin.userManagePage.deleteWarning1') }} @{{ selectedUser?.userAccount }}<br> {{ t('pages.admin.userManagePage.deleteWarning2') }} </p>
        <div class="ios-confirm-actions">
          <button class="ios-cancel-btn" @click="deleteConfirmVisible = false">{{ t('pages.admin.userManagePage.cancel') }}</button>
          <button class="ios-danger-btn" @click="confirmDelete">{{ t('pages.admin.userManagePage.confirmDelete') }}</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { onMounted, reactive, ref, computed, watch } from 'vue'
import {
  deleteUserUsingPost,
  listUserVoByPageUsingPost,
  addUserUsingPost,
  batchDeleteUserUsingPost,
  banOrUnbanUserUsingPost,
} from '@/api/userController.ts'
import { Form, message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import {
  PlusOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SearchOutlined,
  ExclamationCircleFilled,
  MailOutlined,
  RobotOutlined,
  CloudDownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { triggerCrawlUsingPost } from '@/api/pexelsCrawlerController.ts'

const loginUserStore = useLoginUserStore()
const router = useRouter()
const device = ref<string>('')

onMounted(async () => {
  device.value = await getDeviceType()
})

const columns = [
  { title: t('pages.admin.userManagePage.avatar'), dataIndex: 'userAvatar', width: 80 },
  { title: t('pages.admin.userManagePage.userInfo'), dataIndex: 'userInfo', width: 200 },
  { title: t('pages.admin.userManagePage.description'), dataIndex: 'userProfile', width: 200, ellipsis: true },
  { title: t('pages.admin.userManagePage.email'), dataIndex: 'email', width: 180, ellipsis: true },
  { title: t('pages.admin.userManagePage.role'), dataIndex: 'userRole', width: 100 },
  { title: t('pages.admin.userManagePage.registerTime'), dataIndex: 'createTime', width: 160 },
  { title: t('pages.admin.userManagePage.action'), key: 'action', width: 220, align: 'right' },
]

const dataList = ref<API.UserVO[]>([])
const total = ref(0)
const loading = ref(false)
const showPageSizeSheet = ref(false)
const jumpPage = ref('')
const pcPageSizeOptions = ['5', '8', '10', '20', '50']
const mobilePageSizeOptions = [
  { name: t('pages.admin.userManagePage.pageSize10'), value: 10 },
  { name: t('pages.admin.userManagePage.pageSize20'), value: 20 },
  { name: t('pages.admin.userManagePage.pageSize30'), value: 30 },
  { name: t('pages.admin.userManagePage.pageSize50'), value: 50 },
]

const searchParams = reactive<API.UserQueryRequest>({
  current: 1,
  pageSize: 8,
  sortField: 'createTime',
})
const sortOrder = ref<'ascend' | 'descend'>('ascend')

const fetchData = async () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) loading.value = true
  try {
    const res = await listUserVoByPageUsingPost({
      ...searchParams,
      sortOrder: sortOrder.value,
    })
    if (res.data?.code === 0) {
      if (device.value !== DEVICE_TYPE_ENUM.PC && searchParams.current > 1) {
        dataList.value = [...dataList.value, ...res.data.data.records]
      } else {
        dataList.value = res.data.data.records
      }
      total.value = parseInt(res.data.data.total)
    }
  } catch (error) {
    message.error(t('pages.admin.userManagePage.fetchDataError'))
  } finally {
    loading.value = false
  }
}

const onShowSizeChange = (current: number, pageSize: number) => {
  searchParams.current = 1
  searchParams.pageSize = pageSize
  fetchData()
}

const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData()
}

const doTableChange = (page: any) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  if (page.sortField && page.sortOrder) {
    searchParams.sortField = page.sortField
    searchParams.sortOrder = page.sortOrder === 'ascend' ? 'ascend' : 'descend'
  }
  fetchData()
}

const doSearch = async () => {
  try {
    if (device.value === DEVICE_TYPE_ENUM.PC) loading.value = true
    const res = await listUserVoByPageUsingPost({
      ...searchParams,
      sortField: 'createTime',
      sortOrder: sortOrder.value,
    })
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records
      total.value = parseInt(res.data.data.total)
    } else {
      message.error(t('pages.admin.userManagePage.fetchListError'))
    }
  } catch (error) {
    message.error(t('pages.admin.userManagePage.fetchListError'))
  } finally {
    loading.value = false
  }
}

watch(() => searchParams, async () => { await doSearch() }, { deep: true })
onMounted(async () => { await doSearch() })

const deleteConfirmVisible = ref(false)
const selectedUser = ref<API.UserVO | null>(null)

const showDeleteConfirm = (user: API.UserVO) => {
  selectedUser.value = user
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  if (!selectedUser.value?.id) return
  try {
    const res = await deleteUserUsingPost({ id: selectedUser.value.id })
    if (res.data.code === 0) {
      message.success(t('pages.admin.userManagePage.deleteSuccess'))
      deleteConfirmVisible.value = false
      fetchData()
    } else {
      message.error(t('pages.admin.userManagePage.deleteFail') + res.data.message)
    }
  } catch (error) {
    message.error(t('pages.admin.userManagePage.deleteFail') + error)
  }
}

const open = ref(false)
const openModal = () => { open.value = true }

const addUserForm = reactive({ userAccount: '', userName: '', userProfile: '', userRole: '' })

const handleAddUser = async () => {
  const userData: API.UserAddRequest = {
    userAccount: addUserForm.userAccount,
    userName: addUserForm.userName,
    userProfile: addUserForm.userProfile,
    userRole: addUserForm.userRole,
  }
  try {
    const res = await addUserUsingPost(userData)
    if (res.data.code === 0) {
      message.success(t('pages.admin.userManagePage.addSuccess'))
      open.value = false
      fetchData()
    } else {
      message.error(t('pages.admin.userManagePage.addFail') + res.data.message)
    }
  } catch (error) {
    message.error(t('pages.admin.userManagePage.addException'))
  }
}

const cancelAddUser = () => {
  open.value = false
  addUserForm.userAccount = ''
  addUserForm.userName = ''
  addUserForm.userProfile = ''
  addUserForm.userRole = ''
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
  searchParams.sortOrder = sortOrder.value
  fetchData()
}

const crawlLoading = ref(false)
const handlePexelsCrawl = async () => {
  crawlLoading.value = true
  try {
    const res = await triggerCrawlUsingPost()
    if (res.data.code === 0) {
      message.success(t('pages.admin.userManagePage.pexelsStart'))
      setTimeout(() => fetchData(), 3000) // 3秒后自动刷新用户列表
    } else {
      message.error(t('pages.admin.userManagePage.startCrawlFail') + res.data.message)
    }
  } catch (error) {
    message.error(t('pages.admin.userManagePage.startCrawlFail'))
  } finally {
    crawlLoading.value = false
  }
}

const state = reactive({ selectedRowKeys: [] as number[], loading: false })
const onSelectChange = (selectedKeys: number[]) => { state.selectedRowKeys = selectedKeys }
const hasSelected = computed(() => state.selectedRowKeys.length > 0)

const batchDeleteSelectedPictures = async () => {
  if (state.selectedRowKeys.length === 0) return
  try {
    const res = await batchDeleteUserUsingPost(state.selectedRowKeys)
    if (res.data.code === 0) {
      message.success(t('pages.admin.userManagePage.batchDeleteSuccess'))
      state.selectedRowKeys = []
      fetchData()
    } else {
      message.error(t('pages.admin.userManagePage.batchDeleteFail'))
    }
  } catch (error) {
    message.error(t('pages.admin.userManagePage.batchDeleteFail'))
  }
}

const rowSelection = computed(() => {
  return {
    selectedRowKeys: state.selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record: API.UserVO) => ({
      disabled: record.userRole === 'admin' || record.userRole === 'bot',
    }),
  }
})

const onMobilePageChange = async (page: number) => {
  searchParams.current = page
  await doSearch()
}

const handlePageSizeChange = async (action: { value: number }) => {
  searchParams.current = 1
  searchParams.pageSize = action.value
  await doSearch()
}

const handleBanOrUnban = async (user: API.UserVO) => {
  try {
    const res = await banOrUnbanUserUsingPost({
      userId: user.id,
      isUnban: user.userRole === 'ban'
    })
    if (res.data?.code === 0) {
      message.success(user.userRole === 'ban' ? t('pages.admin.userManagePage.unbanSuccess') : t('pages.admin.userManagePage.banSuccess'))
      fetchData()
    } else {
      message.error(res.data?.message || t('common.message.operationFailed'))
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || t('common.message.operationFailed'))
  }
}

const goToUserDetail = (userId: string) => { router.push({ name: 'UserDetail', params: { id: userId } }) }
</script>

<style scoped>
/* ==================== 统一依赖你的 CSS 变量 ==================== */
#userManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.text-secondary {
  color: var(--text-secondary);
}

.search-icon {
  color: var(--text-secondary);
}

/* ==================== PC 端样式重构 ==================== */
.pc-container {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 顶部操作面板 */
.mac-header-panel {
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

.mac-search-form {
  display: flex;
  gap: 12px;
}

/* 深度覆盖 Ant Design 输入框样式 */
:deep(.mac-input), :deep(.ant-input-affix-wrapper) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: var(--theme-transition);
}
:deep(.mac-input input), :deep(.ant-input-affix-wrapper input) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
}
:deep(.mac-input input::placeholder), :deep(.ant-input-affix-wrapper input::placeholder) {
  color: var(--text-secondary) !important;
}
:deep(.mac-input:focus-within), :deep(.ant-input-affix-wrapper-focused) {
  border-color: var(--link-color) !important;
}

.action-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 按钮通用色 */
.ios-btn-primary {
  background-color: var(--link-color) !important;
  color: var(--text-other) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 500;
  transition: var(--theme-transition);
}
.ios-btn-primary:hover {
  background-color: var(--link-hover-color) !important;
}

.ios-btn-ghost {
  border-radius: 8px !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  background-color: transparent !important;
  transition: var(--theme-transition);
}
.ios-btn-ghost:hover {
  background-color: var(--hover-background) !important;
}

.ios-btn-danger {
  border-radius: 8px !important;
}

/* 表格容器包裹区 */
.mac-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: var(--theme-transition);
}

/* 深度覆盖 Ant Design 表格样式 */
:deep(.mac-table) {
  .ant-table {
    background-color: transparent;
    color: var(--text-primary);
  }
  .ant-table-thead > tr > th {
    background-color: transparent;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-weight: 500;
  }
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid var(--border-color);
    padding: 16px 16px;
    color: var(--text-primary);
    transition: var(--theme-transition);
  }
  .ant-table-tbody > tr:hover > td {
    background-color: var(--hover-background) !important;
  }
  /* 空数据文本 */
  .ant-empty-description {
    color: var(--text-secondary);
  }
}

/* PC 表格内元素 */
.avatar-container {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border-color);
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 身份标签 自适应风格 */
.ios-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
}
.ios-tag.admin {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}
.ios-tag.user {
  background-color: var(--hover-background);
  color: var(--text-primary);
  border-color: var(--border-color);
}
.ios-tag.ban {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}
.ios-tag.bot {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}
.ios-tag.bot {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}

/* 用户信息单元格 */
.user-info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.user-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.bot-icon {
  color: #f59e0b;
  font-size: 16px;
}
.user-account {
  font-size: 12px;
  font-family: monospace;
}

/* 无边界操作按钮 */
.mac-action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
.btn-text-blue { color: var(--link-color) !important; }
.btn-text-orange { color: #f59e0b !important; } /* 橙色动作 */
.btn-text-green { color: #10b981 !important; } /* 绿色动作 */
.btn-text-red { color: #ef4444 !important; }   /* 红色动作 */
.mac-action-buttons .ant-btn {
  font-size: 13px;
  border-radius: 6px;
}
.mac-action-buttons .ant-btn:hover {
  background-color: var(--hover-background);
}

/* 深度覆盖 Ant Design 分页样式 */
.mac-pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
:deep(.ant-pagination-item) {
  background-color: transparent;
  border-color: var(--border-color);
}
:deep(.ant-pagination-item a) {
  color: var(--text-primary);
}
:deep(.ant-pagination-item-active) {
  background-color: var(--hover-background);
  border-color: var(--link-color);
}
:deep(.ant-pagination-item-active a) {
  color: var(--link-color);
}
:deep(.ant-pagination-prev .ant-pagination-item-link),
:deep(.ant-pagination-next .ant-pagination-item-link) {
  background-color: transparent;
  color: var(--text-primary);
  border-color: var(--border-color);
}
:deep(.ant-select-selector) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
}
:deep(.ant-select-arrow) {
  color: var(--text-secondary);
}
:deep(.ant-pagination-total-text) {
  color: var(--text-secondary);
}


/* ==================== 移动端样式重构 ==================== */
.mobile-container {
  height: 100%;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
}

/* 顶部吸顶面板 */
.ios-sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--header-background);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 16px 16px 8px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.ios-btn-icon {
  background-color: var(--link-color) !important;
  border: none !important;
  width: 32px;
  height: 32px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.search-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 深度覆盖 Vant 搜索框 */
:deep(.ios-search) {
  flex: 1;
  padding: 0 !important;
  background-color: transparent !important;
}
:deep(.ios-search .van-search__content) {
  background-color: var(--hover-background);
  border: 1px solid var(--border-color);
}
:deep(.van-field__control) {
  color: var(--text-primary) !important;
}
:deep(.van-field__control::placeholder) {
  color: var(--text-secondary) !important;
}

.filter-actions {
  font-size: 14px;
  color: var(--link-color);
  font-weight: 500;
}

/* 批量操作悬浮提示 */
.batch-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}
.batch-action-bar.is-active {
  height: 44px;
  opacity: 1;
  margin-top: 8px;
  border-top: 1px solid var(--border-color);
}

/* 列表滚动区 */
.mobile-content-scroll {
  flex: 1;
  padding: 12px 16px 32px;
  overflow-y: auto;
}

.ios-card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 核心卡片设计 */
.ios-user-card {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition: var(--theme-transition);
}

/* 卡片头部流 */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.avatar-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}
.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-main-info {
  flex: 1;
  min-width: 0;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.name-row .name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mobile-bot-icon {
  color: #f59e0b;
  font-size: 16px;
  flex-shrink: 0;
}
.account-row {
  font-size: 13px;
}

/* 卡片中部信息 */
.card-body .desc {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 卡片操作栏 */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}
.ios-action-btn {
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
.ios-action-btn:active { opacity: 0.7; }
.ios-action-btn.view { color: var(--link-color); border-color: var(--link-color); background-color: var(--hover-background); }
.ios-action-btn.warn { color: #f59e0b; }
.ios-action-btn.success { color: #10b981; }
.ios-action-btn.danger { color: #ef4444; }

/* 移动端分页 */
.ios-pagination {
  margin-top: 24px;
}
.page-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  margin-bottom: 12px;
}
.page-size-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background-color: var(--hover-background);
  border-radius: 12px;
  cursor: pointer;
  color: var(--link-color);
  border: 1px solid var(--border-color);
  transition: var(--theme-transition);
}
.page-size-trigger:active {
  background-color: var(--border-color);
}
:deep(.mac-van-pagination) {
  .van-pagination__item {
    color: var(--text-primary);
    background-color: transparent;
    border: 1px solid var(--border-color);
  }
  .van-pagination__item--active {
    background-color: var(--link-color);
    color: var(--text-other);
    border-color: var(--link-color);
    border-radius: 8px;
  }
}

/* ==================== Vant Action Sheet 样式覆盖 ==================== */
:deep(.ios-action-sheet) {
  background-color: var(--card-background);
  color: var(--text-primary);
}
:deep(.ios-action-sheet .van-action-sheet__item) {
  background-color: var(--card-background);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}
:deep(.ios-action-sheet .van-action-sheet__cancel) {
  background-color: var(--card-background);
  color: var(--text-secondary);
  border-top: 8px solid var(--background);
}

/* ==================== 统一弹窗样式 ==================== */
:deep(.mac-modal), :deep(.ios-confirm-modal) {
  .ant-modal-content {
    background-color: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 0;
  }
  .ant-modal-header {
    background-color: var(--card-background);
    border-bottom: 1px solid var(--border-color);
    padding: 20px 24px;
  }
  .ant-modal-title {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
  }
  .ant-modal-close {
    color: var(--text-secondary);
  }
  .ant-modal-body {
    padding: 24px;
  }

  /* 修复 Select 下拉列表黑暗模式问题 */
  .mac-select-dropdown {
    background-color: var(--card-background) !important;
    border: 1px solid var(--border-color);
  }
  .ant-select-item {
    color: var(--text-primary);
  }
  .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background-color: var(--hover-background);
  }
  .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--link-color);
  }
}

.mac-form .form-item {
  margin-bottom: 16px;
}
.mac-form label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.mac-form .required { color: #ef4444; }
.mac-select { width: 100%; }

.modal-footer {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
.modal-footer .ant-btn {
  flex: 1;
  height: 40px;
  border-radius: 10px;
  font-size: 15px;
}

/* 确认删除弹框 */
.ios-confirm-content {
  text-align: center;
  padding-top: 10px;
}
.icon-wrap {
  font-size: 44px;
  color: #ef4444;
  margin-bottom: 12px;
}
.confirm-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}
.confirm-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.ios-confirm-actions {
  display: flex;
  border-top: 1px solid var(--border-color);
  margin: 0 -24px -24px; /* 撑满底部 */
}
.ios-confirm-actions button {
  flex: 1;
  background-color: transparent;
  border: none;
  height: 50px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--theme-transition);
}
.ios-confirm-actions button:hover {
  background-color: var(--hover-background);
}
.ios-cancel-btn {
  color: var(--text-primary);
  border-right: 1px solid var(--border-color) !important;
  border-bottom-left-radius: 16px;
}
.ios-danger-btn {
  color: #ef4444;
  font-weight: 600 !important;
  border-bottom-right-radius: 16px;
}
</style>
