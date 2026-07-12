<template>
  <div id="yuemu-spaceUserManagePage" class="yuemu-page-container">

    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-header-section">
        <h2 class="yuemu-page-title"> {{ t('pages.admin.spaceUserManagePage.title') }} </h2>

        <div class="yuemu-tabs-container">
          <div class="yuemu-tabs-nav">
            <div class="yuemu-tab-item" :class="{ active: activeStatus === '1' }" @click="handleStatusChange('1')">
              {{ t('pages.admin.spaceUserManagePage.passed') }} <span class="yuemu-badge-count">{{ statusCounts[1] }}</span>
            </div>
            <div class="yuemu-tab-item" :class="{ active: activeStatus === '0' }" @click="handleStatusChange('0')">
              {{ t('pages.admin.spaceUserManagePage.pending') }} <span class="yuemu-badge-count">{{ statusCounts[0] }}</span>
            </div>
            <div class="yuemu-tab-item" :class="{ active: activeStatus === '2' }" @click="handleStatusChange('2')">
              {{ t('pages.admin.spaceUserManagePage.rejected') }} <span class="yuemu-badge-count">{{ statusCounts[2] }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="yuemu-toolbar">
        <form class="yuemu-search-form" @submit.prevent="handleSubmit">
          <div class="yuemu-input-capsule">
            <i class="fas fa-search yuemu-search-icon"></i>
            <input
              v-model="formData.userId"
              :placeholder="t('pages.admin.spaceUserManagePage.searchUserToAdd')"
              class="yuemu-input"
            />
            <button v-if="formData.userId" type="button" @click="formData.userId = ''" class="yuemu-clear-btn">
              <i class="fas fa-times-circle"></i>
            </button>
          </div>
          <button type="submit" class="yuemu-btn-pill primary">
            <i class="fas fa-user-plus"></i> {{ t('pages.admin.spaceUserManagePage.addMember') }}
          </button>
        </form>
      </div>

      <div class="yuemu-table-card">
        <div class="yuemu-table-header">
          <div class="yuemu-th" style="flex: 2;"> {{ t('pages.admin.spaceUserManagePage.userInfo') }} </div>
          <div class="yuemu-th" style="flex: 1;"> {{ t('pages.admin.spaceUserManagePage.adminRole') }} </div>
          <div class="yuemu-th" style="flex: 1.5;"> {{ t('pages.admin.spaceUserManagePage.joinTime') }} </div>
          <div class="yuemu-th" style="flex: 2; text-align: right;"> {{ t('pages.admin.spaceUserManagePage.actionCommand') }} </div>
        </div>
        <div class="yuemu-table-body">
          <div v-if="dataList.length === 0" class="yuemu-empty-state">
            <i class="fas fa-users-slash"></i>
            <p> {{ t('pages.admin.spaceUserManagePage.noMemberData') }} </p>
          </div>

          <div v-for="record in dataList" :key="record.id" class="yuemu-table-row">
            <div class="yuemu-td" style="flex: 2;">
              <div class="yuemu-user-info" @click="goToUserPage(record.user?.id)">
                <img :src="record.user?.userAvatar || getDefaultAvatar(record.user?.userName)" class="yuemu-avatar" />
                <span class="yuemu-name">{{ record.user?.userName || t('pages.admin.spaceUserManagePage.unknownUser') }}</span>
              </div>
            </div>

            <div class="yuemu-td" style="flex: 1;">
              <div class="yuemu-select-wrapper">
                <select
                  v-model="record.spaceRole"
                  @change="(e) => editSpaceRole((e.target as HTMLSelectElement).value, record)"
                  :disabled="record.user?.id === loginUserStore.loginUser?.id || activeStatus !== '1'"
                  class="yuemu-role-select"
                >
                  <option v-for="option in SPACE_ROLE_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <i class="fas fa-chevron-down select-icon"></i>
              </div>
            </div>

            <div class="yuemu-td yuemu-time" style="flex: 1.5;">
              {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
            </div>

            <div class="yuemu-td yuemu-actions-right" style="flex: 2;">
              <template v-if="activeStatus !== '1' && record.user?.id !== loginUserStore.loginUser?.id">
                <button @click="handleAudit(record, 1)" class="yuemu-btn-action success"><i class="fas fa-check"></i> {{ t('pages.admin.spaceUserManagePage.pass') }} </button>
              </template>
              <template v-if="activeStatus !== '2' && record.user?.id !== loginUserStore.loginUser?.id">
                <button @click="handleAudit(record, 2)" class="yuemu-btn-action danger"><i class="fas fa-times"></i> {{ t('pages.admin.spaceUserManagePage.reject') }} </button>
              </template>

              <button
                @click="toggleRecommended(record)"
                class="yuemu-btn-action outline"
                :class="{ 'is-recommended': record.isRecommended === 1 }"
                :disabled="activeStatus !== '1'"
              >
                <i class="fas fa-star"></i> {{ record.isRecommended === 1 ? t('pages.admin.spaceUserManagePage.cancelRecommend') : t('pages.admin.spaceUserManagePage.setRecommend') }}
              </button>

              <button
                @click="showDeleteConfirm(record)"
                :disabled="record.user?.id === loginUserStore.loginUser?.id"
                class="yuemu-btn-action delete"
              >
                {{ t('pages.admin.spaceUserManagePage.remove') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-mobile-header">
        <div class="yuemu-tabs-nav mobile-tabs">
          <div class="yuemu-tab-item" :class="{ active: activeStatus === '1' }" @click="handleStatusChange('1')">
            {{ t('pages.admin.spaceUserManagePage.passed') }} <span class="yuemu-badge-count">{{ statusCounts[1] }}</span>
          </div>
          <div class="yuemu-tab-item" :class="{ active: activeStatus === '0' }" @click="handleStatusChange('0')">
            {{ t('pages.admin.spaceUserManagePage.pending') }} <span class="yuemu-badge-count">{{ statusCounts[0] }}</span>
          </div>
          <div class="yuemu-tab-item" :class="{ active: activeStatus === '2' }" @click="handleStatusChange('2')">
            {{ t('pages.admin.spaceUserManagePage.rejected') }} <span class="yuemu-badge-count">{{ statusCounts[2] }}</span>
          </div>
        </div>

        <div class="yuemu-mobile-toolbar">
          <div class="yuemu-input-capsule">
            <i class="fas fa-search yuemu-search-icon"></i>
            <input
              v-model="formData.userId"
              :placeholder="t('pages.admin.spaceUserManagePage.inputUserIdToAdd')"
              class="yuemu-input"
              @keyup.enter="handleSubmit"
            />
            <button v-if="formData.userId" @click="formData.userId = ''" class="yuemu-clear-btn"><i class="fas fa-times-circle"></i></button>
          </div>
          <button @click="handleSubmit" class="yuemu-btn-pill primary mini"> {{ t('pages.admin.spaceUserManagePage.add') }} </button>
        </div>
      </div>

      <div class="yuemu-mobile-list">
        <div v-if="dataList.length === 0" class="yuemu-empty-state">
          <i class="fas fa-users-slash"></i>
          <p> {{ t('pages.admin.spaceUserManagePage.noMemberData') }} </p>
        </div>

        <div v-for="member in dataList" :key="member.id" class="yuemu-member-card">
          <div class="yuemu-card-top">
            <div class="yuemu-user-info" @click="goToUserPage(member.user?.id)">
              <img :src="member.user?.userAvatar || getDefaultAvatar(member.user?.userName)" class="yuemu-avatar" />
              <div class="yuemu-user-meta">
                <span class="yuemu-name">{{ member.user?.userName || t('pages.admin.spaceUserManagePage.unknownUser') }}</span>
                <span class="yuemu-time">{{ t('pages.admin.spaceUserManagePage.joinText') }}: {{ dayjs(member.createTime).format('YYYY-MM-DD') }}</span>
              </div>
            </div>
            <button
              class="yuemu-role-badge"
              @click="openRoleModal(member)"
              :disabled="member.user?.id === loginUserStore.loginUser?.id || activeStatus !== '1'"
            >
              {{ getRoleLabel(member.spaceRole) }} <i class="fas fa-angle-down" v-if="member.user?.id !== loginUserStore.loginUser?.id && activeStatus === '1'"></i>
            </button>
          </div>

          <div class="yuemu-card-actions">
            <template v-if="activeStatus !== '1' && member.user?.id !== loginUserStore.loginUser?.id">
              <button @click="handleAudit(member, 1)" class="yuemu-btn-pill success fill"><i class="fas fa-check"></i> {{ t('pages.admin.spaceUserManagePage.pass') }} </button>
            </template>
            <template v-if="activeStatus !== '2' && member.user?.id !== loginUserStore.loginUser?.id">
              <button @click="handleAudit(member, 2)" class="yuemu-btn-pill danger fill"><i class="fas fa-times"></i> {{ t('pages.admin.spaceUserManagePage.reject') }} </button>
            </template>

            <button
              @click="toggleRecommended(member)"
              class="yuemu-btn-pill outline fill"
              :class="{ 'is-active': member.isRecommended === 1 }"
              :disabled="activeStatus !== '1'"
            >
              <i class="fas fa-star"></i> {{ member.isRecommended === 1 ? t('pages.admin.spaceUserManagePage.cancelRecommend') : t('pages.admin.spaceUserManagePage.setRecommend') }}
            </button>

            <button
              @click="showDeleteConfirm(member)"
              :disabled="member.user?.id === loginUserStore.loginUser?.id"
              class="yuemu-btn-pill outline danger-text fill"
            >
              {{ t('pages.admin.spaceUserManagePage.remove') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <transition name="yuemu-fade">
      <div v-if="deleteConfirmVisible" class="yuemu-modal-overlay" @click.self="deleteConfirmVisible = false">
        <div class="yuemu-modal-box">
          <div class="yuemu-modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3 class="yuemu-modal-title"> {{ t('pages.admin.spaceUserManagePage.confirmRemoveMember') }} </h3>
          <p class="yuemu-modal-desc" v-html="t('pages.admin.spaceUserManagePage.removeMemberDesc', { name: selectedMember?.user?.userName || t('pages.admin.spaceUserManagePage.notSet'), account: selectedMember?.user?.userAccount })">
          </p>
          <div class="yuemu-modal-actions">
            <button class="yuemu-btn-pill outline" @click="deleteConfirmVisible = false">{{ t('pages.admin.spaceUserManagePage.cancel') }}</button>
            <button class="yuemu-btn-pill danger" @click="confirmDelete"> {{ t('pages.admin.spaceUserManagePage.confirmRemove') }} </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="yuemu-slide-up">
      <div v-if="roleModalVisible" class="yuemu-modal-overlay sheet-overlay" @click.self="closeRoleModal">
        <div class="yuemu-action-sheet">
          <div class="yuemu-sheet-header">
            <h3> {{ t('pages.admin.spaceUserManagePage.modifyRole') }} </h3>
            <button class="yuemu-close-btn" @click="closeRoleModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="yuemu-sheet-body">
            <div
              v-for="option in SPACE_ROLE_OPTIONS"
              :key="option.value"
              class="yuemu-sheet-item"
              :class="{ 'active': selectedRole === option.value }"
              @click="selectRole(option.value)"
            >
              <span>{{ option.label }}</span>
              <i class="fas fa-check" v-if="selectedRole === option.value"></i>
            </div>
          </div>
          <div class="yuemu-sheet-footer">
            <button class="yuemu-btn-pill primary full-width" @click="confirmRoleChange" :disabled="selectedRole === currentMember?.spaceRole">
              {{ t('pages.admin.spaceUserManagePage.confirmModify') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { SPACE_ROLE_OPTIONS } from '../../constants/space.ts'
import {
  addSpaceUserUsingPost,
  deleteSpaceUserUsingPost,
  editSpaceUserUsingPost,
  listSpaceUserUsingPost,
  auditSpaceUserUsingPost,
  setRecommendedMemberUsingPost,
} from '@/api/spaceUserController.ts'
import dayjs from 'dayjs'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useRouter } from 'vue-router'
import { getDefaultAvatar } from '@/utils/userUtils'

const router = useRouter()
const device = ref<string>('')
const loginUserStore = useLoginUserStore()

onMounted(async () => {
  device.value = await getDeviceType()
})

const props = defineProps<{ id: string }>()

const dataList = ref<API.SpaceUserVO[]>([])
const statusCounts = ref({ 0: 0, 1: 0, 2: 0 })
const activeStatus = ref('1')

const fetchStatusCounts = async () => {
  if (!props.id) return
  try {
    const promises = [0, 1, 2].map(status => listSpaceUserUsingPost({ spaceId: props.id.toString(), status }))
    const results = await Promise.all(promises)
    results.forEach((res, index) => {
      if (res.data?.code === 0) statusCounts.value[index] = res.data.data?.length || 0
    })
  } catch (error) { console.error(t('pages.admin.spaceUserManagePage.fetchCountFail'), error) }
}

const fetchData = async () => {
  if (!props.id) return
  const res = await listSpaceUserUsingPost({ spaceId: props.id.toString(), status: Number(activeStatus.value) })
  if (res.data.code === 0 && res.data.data) dataList.value = res.data.data ?? []
  else message.error(t('pages.admin.spaceUserManagePage.fetchDataFail') + res.data.message)
}

onMounted(() => { fetchData(); fetchStatusCounts(); })

const handleStatusChange = (status: string) => { activeStatus.value = status; fetchData(); }

const formData = reactive<API.SpaceUserAddRequest>({ userId: '' })

const handleSubmit = async () => {
  if (!props.id || !formData.userId) return
  const res = await addSpaceUserUsingPost({ spaceId: props.id, ...formData })
  if (res.data.code === 0) {
    message.success(t('pages.admin.spaceUserManagePage.addSuccess'))
    fetchData(); fetchStatusCounts(); formData.userId = ''
  } else message.error(t('pages.admin.spaceUserManagePage.addFail') + res.data.message)
}

const editSpaceRole = async (value: string, record: any) => {
  const res = await editSpaceUserUsingPost({ id: record.id, spaceRole: value })
  if (res.data.code === 0) message.success(t('pages.admin.spaceUserManagePage.modifySuccess'))
  else message.error(t('pages.admin.spaceUserManagePage.modifyFail') + res.data.message)
}

// 移除确认
const deleteConfirmVisible = ref(false)
const selectedMember = ref<API.SpaceUserVO | null>(null)
const showDeleteConfirm = (member: API.SpaceUserVO) => { selectedMember.value = member; deleteConfirmVisible.value = true; }
const confirmDelete = async () => {
  if (!selectedMember.value?.id) return
  try {
    const res = await deleteSpaceUserUsingPost({ id: selectedMember.value.id })
    if (res.data.code === 0) {
      message.success(t('pages.admin.spaceUserManagePage.removeSuccess')); deleteConfirmVisible.value = false; fetchData(); fetchStatusCounts();
    } else message.error(t('pages.admin.spaceUserManagePage.removeFail') + res.data.message)
  } catch (error) { message.error(t('pages.admin.spaceUserManagePage.removeFailRetry')) }
}

const handleAudit = async (record: API.SpaceUserVO, status: number) => {
  try {
    const res = await auditSpaceUserUsingPost({ spaceId: props.id.toString(), userId: record.userId, status })
    if (res.data?.code === 0) {
      message.success(status === 1 ? t('pages.admin.spaceUserManagePage.passSuccess') : t('pages.admin.spaceUserManagePage.rejectSuccess')); fetchData(); fetchStatusCounts();
    }
  } catch (error) { message.error(t('pages.admin.spaceUserManagePage.opFailGeneral')) }
}

const toggleRecommended = async (record: API.SpaceUserVO) => {
  try {
    const newRecommended = record.isRecommended === 1 ? 0 : 1;
    const res = await setRecommendedMemberUsingPost({ spaceId: props.id, userId: record.userId, isRecommended: Number(newRecommended) })
    if (res.data?.code === 0) {
      message.success(record.isRecommended === 1 ? t('pages.admin.spaceUserManagePage.cancelRecommendSuccess') : t('pages.admin.spaceUserManagePage.setRecommendSuccess')); record.isRecommended = Number(newRecommended);
    } else message.error(t('pages.admin.spaceUserManagePage.opFail') + res.data.message)
  } catch (error: any) {
    if (error.message && error.message.includes('上限')) message.error(t('pages.admin.spaceUserManagePage.limitReached'));
    else message.error(t('pages.admin.spaceUserManagePage.opFailGeneral'));
  }
}

const goToUserPage = (userId?: number) => { if (userId) router.push(`/user/${userId}`) }

// 移动端角色弹窗
const roleModalVisible = ref(false)
const currentMember = ref<API.SpaceUserVO | null>(null)
const selectedRole = ref('')
const openRoleModal = (member: API.SpaceUserVO) => { currentMember.value = member; selectedRole.value = member.spaceRole; roleModalVisible.value = true; }
const closeRoleModal = () => { roleModalVisible.value = false; currentMember.value = null; selectedRole.value = ''; }
const selectRole = (value: string) => { selectedRole.value = value; }
const confirmRoleChange = async () => {
  if (!currentMember.value || !selectedRole.value) return
  await editSpaceRole(selectedRole.value, currentMember.value)
  currentMember.value.spaceRole = selectedRole.value
  roleModalVisible.value = false
}

const getRoleLabel = (value: string) => {
  const option = SPACE_ROLE_OPTIONS.find(item => item.value === value)
  return option ? option.label : t('pages.admin.spaceUserManagePage.unknownRole')
}
</script>

<style scoped>
/* =========================================================
   yuemu- 全局通用规范及基础重置
   ========================================================= */
.yuemu-page-container {
  padding: 24px; max-width: 1200px; margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-primary);
}

.yuemu-page-title { font-size: 24px; font-weight: 700; margin-bottom: 20px; color: var(--text-primary); }

/* --- 统一 Tabs 样式 (参考活动详情页) --- */
.yuemu-tabs-container { border-bottom: 1px solid var(--border-color); margin-bottom: 24px; }
.yuemu-tabs-nav { display: flex; gap: 32px; }
.yuemu-tab-item { padding: 12px 0; font-size: 15px; font-weight: 500; color: var(--text-secondary); cursor: pointer; position: relative; transition: color 0.2s; }
.yuemu-tab-item.active { color: var(--text-primary); font-weight: 600; }
.yuemu-tab-item.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px; background: var(--text-primary); border-radius: 2px 2px 0 0; }
.yuemu-badge-count { font-size: 11px; background: var(--hover-background); color: var(--text-primary); padding: 2px 8px; border-radius: 12px; margin-left: 6px; font-weight: 600; }
.yuemu-tab-item.active .yuemu-badge-count { background: var(--text-primary); color: var(--background); }

/* --- 统一输入胶囊 --- */
.yuemu-input-capsule {
  display: flex; align-items: center; background: var(--hover-background);
  border-radius: 24px; padding: 4px 16px; border: 1px solid transparent; transition: 0.2s; flex: 1;
}
.yuemu-input-capsule:focus-within { background: var(--card-background); border-color: var(--link-color); box-shadow: 0 4px 12px rgba(22,119,255,0.1); }
.yuemu-search-icon { color: var(--text-secondary); font-size: 14px; margin-right: 8px; }
.yuemu-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: var(--text-primary); padding: 8px 0; min-width: 100px;}
.yuemu-clear-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; opacity: 0.6; transition: 0.2s; }
.yuemu-clear-btn:hover { opacity: 1; color: var(--text-primary); }

/* --- 统一 Pill 按钮 --- */
.yuemu-btn-pill {
  border: none; padding: 10px 24px; border-radius: 24px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.yuemu-btn-pill.primary { background: var(--link-color, #1677ff); color: #fff; }
.yuemu-btn-pill.primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(22,119,255,0.2); }
.yuemu-btn-pill.outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); }
.yuemu-btn-pill.outline:hover { background: var(--hover-background); }
.yuemu-btn-pill.success { background: #10b981; color: #fff; }
.yuemu-btn-pill.danger { background: #ef4444; color: #fff; }
.yuemu-btn-pill.outline.danger-text { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
.yuemu-btn-pill.outline.danger-text:hover { background: rgba(239, 68, 68, 0.05); }
.yuemu-btn-pill.mini { padding: 6px 16px; font-size: 13px; }
.yuemu-btn-pill.fill { flex: 1; padding: 8px 0; }
.yuemu-btn-pill.full-width { width: 100%; padding: 12px 0; font-size: 15px; }

/* =========================================================
   PC 端表格视图
   ========================================================= */
.yuemu-toolbar { margin-bottom: 20px; }
.yuemu-search-form { display: flex; gap: 16px; align-items: center; max-width: 500px; }

.yuemu-table-card { background: var(--card-background); border-radius: 16px; border: 1px solid var(--border-color); overflow: hidden; }
.yuemu-table-header { display: flex; padding: 16px 20px; background: var(--hover-background); font-size: 13px; font-weight: 600; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); }
.yuemu-table-row { display: flex; padding: 16px 20px; border-bottom: 1px solid var(--border-color); align-items: center; transition: 0.2s; }
.yuemu-table-row:last-child { border-bottom: none; }
.yuemu-table-row:hover { background: var(--hover-background); }

.yuemu-user-info { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.yuemu-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); }
.yuemu-name { font-weight: 600; font-size: 14px; }
.yuemu-time { color: var(--text-secondary); font-size: 13px; font-family: monospace; }

/* 下拉框美化 */
.yuemu-select-wrapper { position: relative; width: 120px; }
.yuemu-role-select {
  width: 100%; padding: 8px 30px 8px 12px; font-size: 13px; font-weight: 500;
  border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-background);
  color: var(--text-primary); outline: none; cursor: pointer; appearance: none;
}
.yuemu-select-wrapper .select-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--text-secondary); pointer-events: none; }

/* 行内操作按钮 */
.yuemu-actions-right { display: flex; justify-content: flex-end; gap: 8px; }
.yuemu-btn-action {
  background: var(--hover-background); border: none; padding: 6px 12px; border-radius: 6px;
  font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; color: var(--text-primary);
}
.yuemu-btn-action:hover:not(:disabled) { filter: brightness(0.95); transform: translateY(-1px); }
.yuemu-btn-action:disabled { opacity: 0.4; cursor: not-allowed; }
.yuemu-btn-action.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-btn-action.success:hover { background: rgba(16, 185, 129, 0.2); }
.yuemu-btn-action.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-btn-action.danger:hover { background: rgba(239, 68, 68, 0.2); }
.yuemu-btn-action.delete { background: transparent; color: #ef4444; }
.yuemu-btn-action.delete:hover:not(:disabled) { background: rgba(239, 68, 68, 0.05); }
.yuemu-btn-action.outline.is-recommended { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.yuemu-empty-state { padding: 60px 0; text-align: center; color: var(--text-secondary); }
.yuemu-empty-state i { font-size: 40px; margin-bottom: 12px; opacity: 0.5; }

/* =========================================================
   移动端视图 (Mobile First Cards)
   ========================================================= */
@media (max-width: 768px) {
  .yuemu-page-container { padding: 0; background: var(--background, #f5f5f5); }

  .yuemu-mobile-header { background: var(--card-background); padding: 12px 16px; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--border-color); }
  .yuemu-tabs-nav.mobile-tabs { gap: 0; justify-content: space-between; border-bottom: none; }
  .yuemu-tabs-nav.mobile-tabs .yuemu-tab-item { flex: 1; text-align: center; padding: 10px 0; }

  .yuemu-mobile-toolbar { display: flex; gap: 10px; margin-top: 12px; }

  .yuemu-mobile-list { padding: 12px; }
  .yuemu-member-card { background: var(--card-background); border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }

  .yuemu-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
  .yuemu-user-meta { display: flex; flex-direction: column; gap: 4px; }
  .yuemu-user-meta .yuemu-name { font-size: 15px; }
  .yuemu-user-meta .yuemu-time { font-size: 12px; color: var(--text-secondary); }

  .yuemu-role-badge {
    background: rgba(22, 119, 255, 0.1); color: #1677ff; border: none; padding: 4px 10px;
    border-radius: 12px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;
  }

  .yuemu-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
}

/* =========================================================
   弹窗与抽屉 (通用毛玻璃)
   ========================================================= */
.yuemu-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.yuemu-modal-box { background: var(--card-background); width: 100%; max-width: 320px; border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1); animation: yuemuPop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-modal-icon { font-size: 40px; margin-bottom: 16px; }
.yuemu-modal-icon.warning { color: #f59e0b; }
.yuemu-modal-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
.yuemu-modal-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.5; }
.yuemu-modal-desc b { color: var(--text-primary); }
.yuemu-modal-actions { display: flex; gap: 12px; }
.yuemu-modal-actions button { flex: 1; }

/* 移动端 Action Sheet */
.sheet-overlay { align-items: flex-end; padding: 0; }
.yuemu-action-sheet { background: var(--card-background); width: 100%; border-radius: 20px 20px 0 0; padding-bottom: env(safe-area-inset-bottom); animation: yuemuSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-sheet-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.yuemu-sheet-header h3 { font-size: 16px; font-weight: 600; margin: 0; }
.yuemu-close-btn { background: none; border: none; font-size: 18px; color: var(--text-secondary); padding: 4px; cursor: pointer; }
.yuemu-sheet-body { padding: 12px 20px; max-height: 50vh; overflow-y: auto; }
.yuemu-sheet-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; font-size: 15px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); cursor: pointer; }
.yuemu-sheet-item:last-child { border-bottom: none; }
.yuemu-sheet-item.active { color: #1677ff; font-weight: 600; }
.yuemu-sheet-footer { padding: 16px 20px; border-top: 1px solid var(--border-color); }

@keyframes yuemuPop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes yuemuSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.yuemu-fade-enter-active, .yuemu-slide-up-enter-active { transition: opacity 0.3s; }
.yuemu-fade-enter-from, .yuemu-slide-up-enter-from { opacity: 0; }
</style>
