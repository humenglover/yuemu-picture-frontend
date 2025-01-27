<template>
  <div id="MyTeamsPage">
    <!-- 标题区域 -->
    <a-flex
      justify="space-between"
      style="
        display: flex;
        height: 50px;
        align-items: center;
        width: 100%;
        margin-top: -15px;
        margin-bottom: -10px;
        background-color: #f5f3ff;
        border-radius: 10px;
      "
    >
      <div>
        <a-button style="color: #4f46e5; font-size: 18px" type="link" size="large" ghost>
          我的团队
        </a-button>
      </div>
      <div>
        <a-tooltip :title="`共加入 ${teamSpaceList.length} 个团队`">
          <a-progress
            style="margin-right: 10px"
            type="circle"
            :size="device === DEVICE_TYPE_ENUM.PC ? 30 : 42"
            :percent="100"
          />
        </a-tooltip>
      </div>
    </a-flex>

    <div style="margin: 16px 0">
      <a-button type="primary" @click="handleAddTeam" class="add-team-button">
        <PlusOutlined /> 创建团队
      </a-button>
    </div>

    <!-- 团队列表 -->
    <div class="teams-container">
      <a-list :data-source="teamSpaceList" :loading="loading" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item class="team-item" @click="handleTeamClick(item)">
            <a-list-item-meta>
              <template #title>
                <span class="team-name">
                  {{ item.space?.spaceName }}
                  <span v-if="item.space?.userId === loginUserStore.loginUser.id" class="owner-tag">
                    (我的)
                  </span>
                </span>
              </template>
              <template #description>
                <div class="team-info">
                  <span>{{ SPACE_ROLE_MAP[item.spaceRole] }}</span>
                  <span>{{ formatDate(item.createTime) }}</span>
                </div>
              </template>
            </a-list-item-meta>
            <RightOutlined class="arrow-icon" />
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusOutlined, RightOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { SPACE_TYPE_ENUM, SPACE_ROLE_MAP } from '@/constants/space'
import dayjs from 'dayjs'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { getDeviceType } from '@/utils/device.ts'
const router = useRouter()
const loginUserStore = useLoginUserStore()
const teamSpaceList = ref<API.SpaceUserVO[]>([])
const loading = ref(false)

// 定义用于存储设备类型的响应式变量
const device = ref<string>('')
// 页面加载时获取设备类型并获取数据
onMounted(async () => {
  device.value = await getDeviceType()
})
// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 处理添加团队
const handleAddTeam = () => {
  router.push('/add_space?type=' + SPACE_TYPE_ENUM.TEAM)
}

// 处理团队点击
const handleTeamClick = (team: API.SpaceUserVO) => {
  router.push(`/space/${team.spaceId}`)
}

// 获取团队列表
onMounted(async () => {
  loading.value = true
  try {
    const res = await listMyTeamSpaceUsingPost({})
    if (res.data.code === 0) {
      teamSpaceList.value = res.data.data ?? []
    }
  } catch (error) {
    console.error('获取团队列表失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.add-team-button {
  width: 100%;
  height: 40px;
  background: linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
  transition: all 0.3s ease;
}

.add-team-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 107, 107, 0.3);
}

.teams-container {
  margin: 16px -16px 0;
}

.team-item {
  padding: 16px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #fff6f3 0%, #fff9f8 100%);
  border-left: 4px solid #ff8e53;
  cursor: pointer;
  transition: all 0.3s ease;
}

.team-item:hover {
  background: linear-gradient(135deg, #fff1eb 0%, #fff6f3 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 83, 0.1);
}

.team-name {
  font-size: 16px;
  color: #1f2937;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.owner-tag {
  color: #ff8e53;
  font-size: 12px;
  background: rgba(255, 142, 83, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.team-info {
  display: flex;
  gap: 16px;
  color: #6b7280;
  font-size: 13px;
  margin-top: 8px;
}

.arrow-icon {
  color: #ff8e53;
  font-size: 16px;
  opacity: 0.8;
}

:deep(.ant-list-item-meta-title) {
  margin-bottom: 4px !important;
}

:deep(.ant-list-item-meta-description) {
  font-size: 13px;
}

/* 进度条样式 */
:deep(.ant-progress-circle .ant-progress-text) {
  color: #ff8e53 !important;
  font-size: 12px;
}

:deep(.ant-progress-circle-path) {
  stroke: #ff8e53 !important;
}

/* 加载状态样式 */
:deep(.ant-spin-dot-item) {
  background-color: #ff8e53 !important;
}

/* 空状态样式 */
:deep(.ant-empty-description) {
  color: #6b7280;
}
</style>
