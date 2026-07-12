<template>
  <div id="reminderPage" class="retro-theme">

    <div class="reminderPage-container" v-if="device !== DEVICE_TYPE_ENUM.MOBILE">
      <div class="main-content">
        <div class="content-layout">
          <div class="left-section">
            <div class="time-container retro-card">
              <div class="time-and-date">
                <div class="time">
                  <i class="fas fa-clock time-icon"></i>
                  <span>{{ currentTime }}</span>
                </div>
                <div class="date">
                  <i class="fas fa-calendar-alt date-icon"></i>
                  <span>{{ currentDate }}</span>
                </div>
              </div>
            </div>

            <div class="reminders retro-card">
              <div class="section-header retro-border-bottom">
                <div class="header-left">
                  <h3>
                    <i class="fas fa-bookmark list-icon"></i>
                    {{ $t('pages.reminderPage.title') }}
                  </h3>
                  <a-date-picker
                    v-model:value="selectedDate"
                    :disabledDate="disabledDate"
                    :format="dateFormat"
                    @change="onDateChange"
                    :bordered="false"
                    :allowClear="false"
                    :inputReadOnly="true"
                    :popupStyle="{ marginTop: '8px' }"
                  >
                    <template #suffixIcon>
                      <i class="fas fa-calendar-day" style="color: var(--retro-accent)"></i>
                    </template>
                  </a-date-picker>
                </div>
                <button class="add-button retro-btn" @click="addReminder">
                  <i class="fas fa-feather-alt add-icon"></i>
                  {{ $t('pages.reminderPage.addBtn') }}
                </button>
              </div>

              <div class="reminder-list-wrapper">
                <a-list :data-source="reminders" class="reminder-list">
                  <template #renderItem="{ item }">
                    <a-list-item class="retro-list-item">
                      <div class="reminder-item">
                        <i v-if="item.completed" class="fas fa-check-square check-icon retro-stamp"></i>
                        <i v-else class="far fa-square clock-icon"></i>
                        <span class="time retro-typewriter">{{ item.time }}</span>
                        <span class="content" :class="{'retro-strike': item.completed}" @click="showDetail(item)">
                          {{ item.content.length > 20 ? item.content.slice(0, 20) + '...' : item.content }}
                        </span>
                        <div class="actions">
                          <a-button
                            type="text"
                            class="action-icon"
                            :class="{ active: item.starred }"
                            @click="toggleStarred(item)"
                          >
                            <i v-if="item.starred" class="fas fa-star star-icon"></i>
                            <i v-else class="far fa-star star-icon"></i>
                          </a-button>
                          <a-button
                            type="text"
                            class="action-icon"
                            :class="{ active: item.important }"
                            @click="toggleImportant(item)"
                          >
                            <i v-if="item.important" class="fas fa-exclamation-triangle important-icon"></i>
                            <i v-else class="fas fa-exclamation-triangle important-icon" style="opacity: 0.3"></i>
                          </a-button>
                          <a-button type="text" class="retro-action-text" @click="toggleReminder(item)">
                            {{ item.completed ? $t('pages.reminderPage.actions.strikeOut') : $t('pages.reminderPage.actions.stamp') }}
                          </a-button>
                          <a-button type="text" danger class="retro-action-text delete" @click="deleteReminder(item)"> {{ $t('pages.reminderPage.actions.tear') }} </a-button>
                        </div>
                      </div>
                    </a-list-item>
                  </template>
                </a-list>

                <div class="pagination-wrapper">
                  <a-pagination
                    v-model:current="pcCurrentPage"
                    :total="pcTotal"
                    :pageSize="pcPageSize"
                    :pageSizeOptions="['5', '10', '15', '20']"
                    show-size-changer
                    show-quick-jumper
                    :show-total="total => $t('pages.reminderPage.pagination.total').replace('{total}', String(total))"
                    @change="onPageChange"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="right-section">
            <div class="illustration-container retro-card">
              <div class="illustration-content">
                <div class="retro-ascii">
                  <pre>
      .-------.
     /   >_   /
    /_______/
    |       |
    ^^^^^^^^^
                  </pre>
                </div>
                <p class="illustration-text retro-quote">{{ $t('pages.reminderPage.quote') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template v-if="device === DEVICE_TYPE_ENUM.MOBILE">
      <div class="mobile-container">
        <div class="main-content">
          <div class="time-container retro-card" style="margin: 15px;">
            <div class="time-and-text">
              <div class="time">{{ currentTime }}</div>
              <div class="date">{{ currentDate }}</div>
            </div>
            <div class="pet-container retro-ascii-small">
              <pre> ฅ^•ﻌ•^ฅ </pre>
            </div>
          </div>

          <div class="reminder-list retro-card" style="margin: 0 15px 15px 15px;">
            <div class="list-header retro-border-bottom" style="padding-bottom: 10px;">
              <div class="header-top">
                <div class="header-left">
                  <h3 style="margin:0; font-weight: bold; color: var(--retro-ink);">{{ $t('pages.reminderPage.title') }}
                  </h3>
                  <div class="date-picker retro-typewriter" style="margin-top: 5px; cursor: pointer;" @click="showCalendar = true">
                    <i class="fas fa-calendar-alt calendar-icon"></i>
                    <span> {{ formatSelectedDate }} </span>
                  </div>
                </div>
                <div class="header-actions" style="display:flex; gap: 10px;">
                  <button class="retro-btn-small" @click="toggleShowCompleted">
                    <i v-if="showCompleted" class="fas fa-check-square"></i>
                    <i v-else class="far fa-square"></i>
                  </button>
                  <button class="retro-btn-small primary" @click="addReminder">
                    <i class="fas fa-feather-alt"></i>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!loading && reminders.length === 0" class="empty-state" style="padding: 30px; text-align: center;">
              <div class="empty-text">
                <h3 style="color: var(--retro-ink);">{{ getEmptyStateText }}</h3>
                <p style="color: var(--retro-ink); opacity: 0.7;">{{ getEmptyStateSubText }}</p>
              </div>
            </div>

            <van-list
              v-else
              v-model="loading"
              :finished="finished"
              :immediate-check="false"
              :offset="50"
              :direction="'down'"
              :finished-text="$t('pages.reminderPage.pagination.end')"
              @load="onLoadMore"
              class="reminder-list-content"
            >
              <van-cell-group class="reminder-group retro-mobile-group">
                <van-swipe-cell
                  v-for="item in filteredReminders"
                  :key="item.time"
                  class="reminder-cell"
                >
                  <van-cell :border="false" class="reminder-content retro-mobile-cell">
                    <template #icon>
                      <i v-if="item.completed" class="fas fa-check-square check-icon-mobile retro-stamp" style="margin-right: 10px; margin-top: 4px;"></i>
                      <i v-else class="far fa-square clock-icon-mobile" style="margin-right: 10px; margin-top: 4px;"></i>
                    </template>
                    <template #title>
                      <div class="reminder-title">
                        <div class="content-wrapper">
                          <span class="content" :class="{'retro-strike': item.completed}" @click="showDetail(item)">
                            {{ truncateContent(item.content) }}
                          </span>
                          <div class="badges" style="margin-left: 10px; display: inline-flex; gap: 5px;">
                            <i v-if="item.starred" class="fas fa-star" @click="toggleStarred(item)" style="color: var(--retro-ink);"></i>
                            <i v-else class="far fa-star" @click="toggleStarred(item)"></i>
                            <i v-if="item.important" class="fas fa-exclamation-triangle" @click="toggleImportant(item)" style="color: var(--retro-accent);"></i>
                            <i v-else class="fas fa-exclamation-triangle" @click="toggleImportant(item)" style="opacity: 0.3;"></i>
                          </div>
                        </div>
                        <div class="status-info" style="margin-top: 5px;">
                          <span class="time retro-typewriter">{{ item.time }}</span>
                        </div>
                      </div>
                    </template>
                  </van-cell>
                  <template #right>
                    <button class="retro-swipe-btn" @click="toggleReminder(item)">
                      {{ item.completed ? $t('pages.reminderPage.actions.undo') : $t('pages.reminderPage.actions.complete') }}
                    </button>
                    <button class="retro-swipe-btn delete" @click="deleteReminder(item)"> {{ $t('pages.reminderPage.actions.tear') }} </button>
                  </template>
                </van-swipe-cell>
              </van-cell-group>
            </van-list>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content retro-modal" @click.stop>
        <div class="modal-header retro-border-bottom">
          <h3 style="margin: 0; font-weight: bold; color: var(--retro-ink);">{{ $t('pages.reminderPage.addBtn') }}</h3>
          <i class="fas fa-times close-icon" @click="closeAddModal" style="cursor: pointer;"></i>
        </div>

        <div class="modal-body" style="padding: 20px 0;">
          <textarea
            v-model="reminderContent"
            class="reminder-input retro-textarea"
            :placeholder="$t('pages.reminderPage.addModal.placeholder')"
            rows="4"
            maxlength="2048"
          ></textarea>

          <div class="reminder-options" style="display: flex; gap: 20px; margin-top: 15px;">
            <div class="option-item retro-tag" :class="{ active: isStarred }" @click="isStarred = !isStarred">
              <i v-if="!isStarred" class="far fa-star"></i>
              <i v-else class="fas fa-star"></i>
              <span>{{ $t('pages.reminderPage.actions.favorite') }}</span>
            </div>
            <div class="option-item retro-tag" :class="{ active: isImportant }" @click="isImportant = !isImportant">
              <i v-if="!isImportant" class="fas fa-exclamation-triangle" style="opacity:0.3"></i>
              <i v-else class="fas fa-exclamation-triangle" style="color: var(--retro-accent)"></i>
              <span>{{ $t('pages.reminderPage.actions.important') }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 15px;">
          <button class="retro-btn" style="background: var(--retro-bg); color: var(--retro-ink);" @click="closeAddModal">{{ $t('pages.reminderPage.actions.close') }}</button>
          <button class="retro-btn" @click="handleAddConfirm">{{ $t('pages.reminderPage.actions.write') }}</button>
        </div>
      </div>
    </div>

    <van-calendar
      v-model:show="showCalendar"
      :min-date="minDate"
      :max-date="maxDate"
      :show-confirm="false"
      :poppable="true"
      :show-title="false"
      color="#2b2623"
      @select="onSelectDate"
      class="retro-calendar"
      :style="{ '--calendar-height': '100%' }"
    >
    </van-calendar>

    <div v-if="showContentModal" class="modal-overlay" @click="closeContentModal">
      <div class="modal-content retro-modal" @click.stop>
        <div class="modal-header retro-border-bottom">
          <h3 style="margin: 0; font-weight: bold;">{{ $t('pages.reminderPage.detailModal.title') }}</h3>
          <i class="fas fa-times close-icon" @click="closeContentModal" style="cursor: pointer;"></i>
        </div>
        <div class="modal-body" style="padding: 20px 0;">
          <div class="reminder-info" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div class="time-badge retro-typewriter">
              <span>{{ currentReminder?.time }}</span>
            </div>
          </div>
          <div class="content-box retro-textarea" style="min-height: 100px;">
            {{ currentReminder?.content }}
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 15px;">
          <button class="retro-btn" style="background: var(--retro-bg); color: var(--retro-ink);" @click="closeContentModal">{{ $t('pages.reminderPage.actions.fold') }}</button>
          <button class="retro-btn" @click="toggleReminder(currentReminder)">
            {{ currentReminder?.completed ? $t('pages.reminderPage.actions.undoStamp') : $t('pages.reminderPage.actions.stamp') }}
          </button>
        </div>
      </div>
    </div>

    <a-modal
      v-model:open="detailVisible"
      :title="null"
      :footer="null"
      :width="520"
      :closable="false"
      wrapClassName="retro-ant-modal"
    >
      <div class="detail-content retro-modal-inner" style="padding: 20px;">
        <div class="detail-header retro-border-bottom" style="display: flex; justify-content: space-between; padding-bottom: 15px;">
          <div class="time-badge retro-typewriter">
            <span>{{ selectedItem?.time }}</span>
          </div>
          <i class="fas fa-times" style="cursor: pointer;" @click="detailVisible = false"></i>
        </div>
        <div class="detail-body" style="padding: 20px 0;">
          <div class="content-box retro-textarea" style="min-height: 120px;">{{ selectedItem?.content }}</div>
        </div>
        <div class="detail-footer">
          <div class="detail-actions" style="display: flex; justify-content: space-between;">
            <div class="action-group" style="display: flex; gap: 10px;">
              <button class="retro-tag" :class="{ active: selectedItem?.starred }" @click="toggleStarred(selectedItem)">
                <i v-if="selectedItem?.starred" class="fas fa-star"></i>
                <i v-else class="far fa-star"></i>
                <span>{{ selectedItem?.starred ? $t('pages.reminderPage.actions.starred') : $t('pages.reminderPage.actions.star') }}</span>
              </button>
            </div>
            <div class="action-group" style="display: flex; gap: 10px;">
              <button class="retro-btn" @click="toggleReminder(selectedItem)">
                {{ selectedItem?.completed ? $t('pages.reminderPage.actions.undoStamp') : $t('pages.reminderPage.actions.stamp') }}
              </button>
              <button class="retro-btn" style="background: var(--retro-accent); color: white;" @click="handleDetailDelete"> {{ $t('pages.reminderPage.actions.tear') }} </button>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, onUnmounted, computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { message } from 'ant-design-vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { getDeviceType } from '@/utils/device.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  getTodayRemindersUsingPost,
  addReminderUsingPost,
  toggleReminderUsingPost,
  deleteReminderUsingPost,
  toggleStarredUsingPost,
  toggleImportantUsingPost,
  listReminderByPageUsingPost
} from '@/api/reminderController'

// 设置中文语言
dayjs.locale('zh-cn')

const loginUserStore = useLoginUserStore()

// 当前时间
const currentTime = ref(dayjs().format('HH:mm:ss'))
const currentDate = ref(dayjs().format('YYYY-MM-DD dddd'))

// 定时器
let timer: number

// 更新时间
const updateTime = () => {
  currentTime.value = dayjs().format('HH:mm:ss')
  currentDate.value = dayjs().format('YYYY-MM-DD dddd')
}

// 添加设备类型检测
const device = ref<string>('')

// 提醒事项列表
const reminders = ref<API.ReminderVO[]>([])
const loading = ref(false)
const isLoadingMore = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(15)
const sortField = ref<string>('isImportant')
const sortOrder = ref<string>('descend')
const total = ref(0)
const finished = ref(false)

// 日期选择相关
const selectedDate = ref<dayjs.Dayjs>(dayjs())
const showCalendar = ref(false)
const minDate = computed(() => dayjs().subtract(7, 'day').toDate())
const maxDate = computed(() => dayjs().add(30, 'day').toDate())

// 格式化选中日期显示
const formatSelectedDate = computed(() => {
  const date = dayjs(selectedDate.value)
  const today = dayjs()
  const tomorrow = dayjs().add(1, 'day')

  if (date.isSame(today, 'day')) {
    return t('pages.reminderPage.time.today')
  } else if (date.isSame(tomorrow, 'day')) {
    return t('pages.reminderPage.time.tomorrow')
  } else {
    return date.format(t('pages.reminderPage.time.dateFormat'))
  }
})

// 获取今日提醒列表
const fetchTodayReminders = async (isLoadMore = false) => {
  if (loading.value || (isLoadMore && finished.value)) return

  try {
    loading.value = true
    isLoadingMore.value = isLoadMore

    const isToday = dayjs(selectedDate.value).isSame(dayjs(), 'day')
    const res = isToday
      ? await getTodayRemindersUsingPost({
        current: currentPage.value,
        pageSize: pageSize.value,
        completed: showCompleted.value ? undefined : false,
        sortField: 'isImportant',
        sortOrder: sortOrder.value
      })
      : await listReminderByPageUsingPost({
        current: currentPage.value,
        pageSize: pageSize.value,
        date: selectedDate.value.format('YYYY-MM-DD'),
        completed: showCompleted.value ? undefined : false,
        sortField: 'isImportant',
        sortOrder: sortOrder.value
      })

    if (res.data?.code === 0) {
      const newData = res.data.data?.records || []
      total.value = res.data.data?.total || 0

      if (isLoadMore) {
        reminders.value = [...reminders.value, ...newData]
      } else {
        reminders.value = newData
      }

      finished.value = reminders.value.length >= total.value
    } else {
      message.error(res.data?.message || t('pages.reminderPage.msgs.getFail'))
      finished.value = true
    }
  } catch (error: any) {
    message.error(error.message || t('pages.reminderPage.msgs.getFail'))
    finished.value = true
  } finally {
    loading.value = false
    isLoadingMore.value = false
  }
}

// 移动端加载更多
const onLoadMore = async () => {
  if (device.value === DEVICE_TYPE_ENUM.MOBILE && !isLoadingMore.value && !finished.value) {
    currentPage.value++
    await fetchTodayReminders(true)
  }
}

// PC端分页相关
const pcCurrentPage = ref(1)
const pcPageSize = ref(15)
const pcTotal = ref(0)
// PC端分页变化
const onPageChange = (page: number, pageSize: number) => {
  pcCurrentPage.value = page
  pcPageSize.value = pageSize
  fetchPCReminders()
}
// 获取提醒列表 - PC端
const fetchPCReminders = async () => {
  try {
    const isToday = dayjs(selectedDate.value).isSame(dayjs(), 'day')
    const res = isToday
      ? await getTodayRemindersUsingPost({
        current: pcCurrentPage.value,
        pageSize: pcPageSize.value,
        completed: showCompleted.value ? undefined : false,
        sortField: sortField.value,
        sortOrder: sortOrder.value
      })
      : await listReminderByPageUsingPost({
        current: pcCurrentPage.value,
        pageSize: pcPageSize.value,
        date: selectedDate.value.format('YYYY-MM-DD'),
        completed: showCompleted.value ? undefined : false,
        sortField: sortField.value,
        sortOrder: sortOrder.value
      })

    if (res.data?.code === 0) {
      reminders.value = res.data.data?.records || []
      pcTotal.value = res.data.data?.total || 0
    } else {
      message.error(res.data?.message || t('pages.reminderPage.msgs.getFail'))
    }
  } catch (error: any) {
    message.error(error.message || t('pages.reminderPage.msgs.getFail'))
  }
}

// 重置分页
const resetPagination = () => {
  currentPage.value = 1
  finished.value = false
  reminders.value = []
}

// 修改添加/删除/切换状态后的刷新逻辑
const refreshList = () => {
  resetPagination()
  fetchTodayReminders()
}

// 截断内容
const truncateContent = (content: string) => {
  if (!content) return ''
  return content.length > 10 ? content.slice(0, 10) + '...' : content
}

// 添加新的状态
const showAddModal = ref(false)
const reminderContent = ref('')
const isStarred = ref(false)
const isImportant = ref(false)

// 修改添加提醒的方法
const addReminder = () => {
  if (!loginUserStore.loginUser.id) {
    message.warning(t('pages.reminderPage.msgs.notLoggedIn'))
    return
  }
  showAddModal.value = true
}

// 关闭弹框
const closeAddModal = () => {
  showAddModal.value = false
  reminderContent.value = ''
  isStarred.value = false
  isImportant.value = false
}

// 确认添加
const handleAddConfirm = async () => {
  const content = reminderContent.value.trim()
  if (!content) {
    message.warning(t('pages.reminderPage.msgs.contentEmpty'))
    return
  }

  try {
    const res = await addReminderUsingPost({
      content,
      starred: isStarred.value,
      important: isImportant.value
    })

    if (res.data?.code === 0) {
      message.success(t('pages.reminderPage.msgs.addSuccess'))
      closeAddModal()
      refreshList()
    } else {
      message.error(res.data?.message || t('pages.reminderPage.msgs.addFail'))
    }
  } catch (error: any) {
    message.error(error.message || t('pages.reminderPage.msgs.addFail'))
  }
}

// 切换提醒状态
const toggleReminder = async (item: API.ReminderVO) => {
  if (!item.id) return
  try {
    const index = reminders.value.findIndex(r => r.id === item.id)
    if (index !== -1) {
      reminders.value[index] = { ...reminders.value[index], completed: !item.completed }
    }
    const res = await toggleReminderUsingPost({ id: item.id })
    if (res.data?.code !== 0) {
      if (index !== -1) {
        reminders.value[index] = { ...reminders.value[index], completed: item.completed }
      }
      message.error(res.data?.message || t('pages.reminderPage.msgs.opFail'))
    } else {
      message.success(item.completed ? t('pages.reminderPage.msgs.undoSuccess') : t('pages.reminderPage.msgs.stampSuccess'))
    }
  } catch (error: any) {
    const index = reminders.value.findIndex(r => r.id === item.id)
    if (index !== -1) {
      reminders.value[index] = { ...reminders.value[index], completed: item.completed }
    }
    message.error(error.message || t('pages.reminderPage.msgs.opFail'))
  }
}

// 删除提醒
const deleteReminder = async (item: API.ReminderVO) => {
  if (!item.id) return
  try {
    const res = await deleteReminderUsingPost({
      id: item.id
    })
    if (res.data?.code === 0) {
      message.success(t('pages.reminderPage.msgs.tearSuccess'))
      refreshList()
    } else {
      message.error(res.data?.message || t('pages.reminderPage.msgs.tearFail'))
    }
  } catch (error: any) {
    message.error(error.message || t('pages.reminderPage.msgs.tearFail'))
  }
}

// 显示已完成的状态
const showCompleted = ref(true)

// 过滤已完成/未完成的提醒
const filteredReminders = computed(() => {
  if (showCompleted.value) {
    return reminders.value
  }
  return reminders.value.filter(item => !item.completed)
})

// 切换显示已完成
const toggleShowCompleted = () => {
  showCompleted.value = !showCompleted.value
  resetPagination()
  fetchTodayReminders()
}

// 切换收藏状态
const toggleStarred = async (item: API.ReminderVO) => {
  if (!item.id) return
  try {
    const index = reminders.value.findIndex(r => r.id === item.id)
    if (index !== -1) {
      reminders.value[index] = { ...reminders.value[index], starred: !item.starred }
    }
    const res = await toggleStarredUsingPost({ id: item.id })
    if (res.data?.code !== 0) {
      if (index !== -1) {
        reminders.value[index] = { ...reminders.value[index], starred: item.starred }
      }
      message.error(res.data?.message || t('pages.reminderPage.msgs.opFail'))
    } else {
      message.success(item.starred ? t('pages.reminderPage.msgs.unfavSuccess') : t('pages.reminderPage.msgs.favSuccess'))
    }
  } catch (error: any) {
    const index = reminders.value.findIndex(r => r.id === item.id)
    if (index !== -1) {
      reminders.value[index] = { ...reminders.value[index], starred: item.starred }
    }
    message.error(error.message || t('pages.reminderPage.msgs.opFail'))
  }
}

// 切换重要状态
const toggleImportant = async (item: API.ReminderVO) => {
  if (!item.id) return
  try {
    const index = reminders.value.findIndex(r => r.id === item.id)
    if (index !== -1) {
      reminders.value[index] = { ...reminders.value[index], important: !item.important }
    }
    const res = await toggleImportantUsingPost({ id: item.id })
    if (res.data?.code !== 0) {
      if (index !== -1) {
        reminders.value[index] = { ...reminders.value[index], important: item.important }
      }
      message.error(res.data?.message || t('pages.reminderPage.msgs.opFail'))
    } else {
      message.success(item.important ? t('pages.reminderPage.msgs.unimportantSuccess') : t('pages.reminderPage.msgs.importantSuccess'))
    }
  } catch (error: any) {
    const index = reminders.value.findIndex(r => r.id === item.id)
    if (index !== -1) {
      reminders.value[index] = { ...reminders.value[index], important: item.important }
    }
    message.error(error.message || t('pages.reminderPage.msgs.opFail'))
  }
}

// 空状态文案
const getEmptyStateText = computed(() => {
  if (loading.value) return t('pages.reminderPage.empty.loading')
  const date = dayjs(selectedDate.value)
  const today = dayjs()

  if (date.isSame(today, 'day')) {
    return t('pages.reminderPage.empty.todayEmpty')
  } else if (date.isBefore(today, 'day')) {
    return t('pages.reminderPage.empty.pastEmpty')
  } else {
    return t('pages.reminderPage.empty.futureEmpty').replace('{date}', String(date.format(t('pages.reminderPage.time.dateFormat'))))
  }
})

const getEmptyStateSubText = computed(() => {
  if (loading.value) return ''
  const date = dayjs(selectedDate.value)
  const today = dayjs()

  if (date.isSame(today, 'day')) {
    return t('pages.reminderPage.empty.todayHint')
  } else if (date.isBefore(today, 'day')) {
    return t('pages.reminderPage.empty.pastHint')
  } else {
    return t('pages.reminderPage.empty.futureHint')
  }
})

// PC端日期变化处理
const onDateChange = (date: dayjs.Dayjs | null) => {
  if (date) {
    selectedDate.value = date
    resetPagination()
    fetchTodayReminders()
  }
}

// 移动端日期选择处理
const onSelectDate = (date: Date) => {
  selectedDate.value = dayjs(date)
  showCalendar.value = false
  resetPagination()
  fetchTodayReminders()
}

// 日期选择相关
const dateFormat = 'YYYY-MM-DD'
const disabledDate = (current: dayjs.Dayjs) => {
  return current && (current < minDate.value || current > maxDate.value)
}

// 内容弹框相关
const showContentModal = ref(false)
const currentReminder = ref<API.ReminderVO | null>(null)

const closeContentModal = () => {
  showContentModal.value = false
  currentReminder.value = null
}

// 添加详情弹框相关变量和方法
const detailVisible = ref(false)
const selectedItem = ref<any>(null)

const showDetail = (item: any) => {
  if(device.value === DEVICE_TYPE_ENUM.MOBILE) {
    currentReminder.value = item
    showContentModal.value = true
  } else {
    selectedItem.value = item
    detailVisible.value = true
  }
}

// 在详情弹框中删除提醒
const handleDetailDelete = () => {
  if (selectedItem.value) {
    deleteReminder(selectedItem.value)
    detailVisible.value = false
  }
}

onMounted(async () => {
  device.value = await getDeviceType()
  updateTime()
  timer = setInterval(updateTime, 1000) as unknown as number

  if (loginUserStore.loginUser.id) {
    await fetchTodayReminders()
    if(device.value !== DEVICE_TYPE_ENUM.MOBILE) {
      await fetchPCReminders()
    }
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
/* ================= 复古主题 - 使用项目全局变量 ================= */
.retro-theme {
  /* 背景与文字 */
  --retro-bg: var(--background);
  --retro-card-bg: var(--card-background);
  --retro-ink: var(--text-primary);
  --retro-accent: #c84b31;
  --retro-secondary: #4a6741;
  --retro-border-width: 3px;
  --retro-line-color: var(--border-color);
  --retro-dot-color: var(--border-color);

  font-family: var(--font-family-custom);
  color: var(--retro-ink);
}

/* 暗色主题自动继承项目变量 */
.dark-theme .retro-theme {
  --retro-accent: #e66141;
  --retro-secondary: #3d4e38;
}

#reminderPage {
  background-color: var(--retro-bg);
  background-image: repeating-linear-gradient(transparent, transparent 29px, var(--retro-line-color) 30px);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  padding-top: 40px;
  transition: var(--theme-transition);
}

.reminderPage-container, .mobile-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  width: 100%;
  padding: 0 20px;
}

.mobile-container {
  padding: 0;
}

/* --- 复古卡片 --- */
.retro-card {
  background-color: var(--retro-card-bg);
  border: var(--retro-border-width) solid var(--retro-ink);
  box-shadow: 6px 6px 0px var(--retro-ink);
  border-radius: 0;
  padding: 20px;
  margin-bottom: 30px;
  position: relative;
  transition: var(--theme-transition);
}

.content-layout {
  display: flex;
  gap: 40px;
}

.left-section {
  flex: 2;
}

.right-section {
  flex: 1;
}

/* --- 时间日期区域 --- */
.time-container {
  text-align: center;
  padding: 30px !important;
  background-image: radial-gradient(var(--retro-dot-color) 1px, transparent 1px);
  background-size: 10px 10px;
}

.time {
  font-size: 3rem;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 2px;
  margin-bottom: 10px;
  border-bottom: 2px dashed var(--retro-ink);
  display: inline-block;
  padding-bottom: 10px;
  color: var(--retro-ink);
}

.date {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--retro-ink);
}

/* --- 头部 --- */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
}

.retro-border-bottom {
  border-bottom: var(--retro-border-width) solid var(--retro-ink);
}

.header-left h3 {
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0;
  color: var(--retro-ink);
}

/* --- 复古按钮 --- */
.retro-btn {
  background-color: var(--retro-ink);
  color: var(--retro-card-bg);
  border: 2px solid var(--retro-ink);
  box-shadow: 4px 4px 0px var(--retro-ink);
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.1s ease;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 0;
}

.retro-btn:active {
  transform: translate(4px, 4px);
  box-shadow: 0px 0px 0px var(--retro-ink);
}

.retro-btn-small {
  background-color: var(--retro-card-bg);
  border: 2px solid var(--retro-ink);
  box-shadow: 3px 3px 0px var(--retro-ink);
  padding: 4px 10px;
  font-weight: bold;
  color: var(--retro-ink);
  cursor: pointer;
  border-radius: 0;
  transition: var(--theme-transition);
}

.retro-btn-small.primary {
  background-color: var(--retro-ink);
  color: var(--retro-card-bg);
}

.retro-btn-small:active {
  transform: translate(3px, 3px);
  box-shadow: 0px 0px 0px var(--retro-ink);
}

/* --- 列表样式 --- */
:deep(.ant-list-item) {
  border-bottom: 2px dotted var(--retro-line-color) !important;
  padding: 15px 0 !important;
  transition: var(--theme-transition);
}

.reminder-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 15px;
}

.retro-typewriter {
  font-family: 'Courier New', Courier, monospace;
  background: var(--retro-ink);
  color: var(--retro-card-bg);
  padding: 2px 6px;
  font-weight: bold;
  font-size: 0.9rem;
  transition: var(--theme-transition);
}

.content {
  flex: 1;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  color: var(--retro-ink);
}

/* 红色划掉效果 */
.retro-strike {
  text-decoration: line-through;
  text-decoration-color: var(--retro-accent);
  text-decoration-thickness: 3px;
  opacity: 0.7;
}

/* 红色印章 */
.retro-stamp {
  color: var(--retro-accent);
  font-size: 1.2rem;
  transform: rotate(-10deg);
}

/* 操作按钮 */
.retro-action-text {
  font-weight: bold;
  color: var(--retro-ink) !important;
  border: 1px solid transparent;
  padding: 0 8px;
  transition: var(--theme-transition);
}
.retro-action-text:hover {
  border: 1px dashed var(--retro-ink);
}
.retro-action-text.delete {
  color: var(--retro-accent) !important;
}

/* --- 右侧插画区域 --- */
.illustration-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: var(--retro-secondary);
  color: var(--retro-card-bg);
  border-color: var(--retro-ink);
  transition: var(--theme-transition);
}

.retro-ascii pre, .retro-ascii-small pre {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.2rem;
  line-height: 1.2;
  font-weight: bold;
}

/* --- 弹框样式 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: var(--theme-transition);
}

.modal-content {
  background: var(--retro-card-bg);
  border: 3px solid var(--retro-ink);
  box-shadow: 6px 6px 0 var(--retro-ink);
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  transition: var(--theme-transition);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 2px solid var(--retro-ink);
  color: var(--retro-ink);
}

.reminder-input, .retro-textarea {
  width: 100%;
  background: var(--retro-card-bg);
  border: 2px solid var(--retro-ink);
  color: var(--retro-ink);
  padding: 12px;
  font-size: 1rem;
  resize: none;
  outline: none;
  transition: var(--theme-transition);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 2px solid var(--retro-ink);
  cursor: pointer;
  transition: var(--theme-transition);
}
.option-item.active {
  background: var(--retro-ink);
  color: var(--retro-card-bg);
}

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  .content-layout {
    flex-direction: column;
    gap: 20px;
  }
  #reminderPage {
    padding-top: 20px;
  }
  .time {
    font-size: 2rem;
  }
}
</style>
