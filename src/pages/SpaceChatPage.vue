<template>
  <div class="space-chat-page">
    <div class="chat-container">
      <div class="chat-main">
        <div class="header-title">
          <div class="back-btn" @click="router.back()">
            <i class="fas fa-chevron-left"></i>
          </div>
          <div class="user-info">
            <h2 class="space-name">{{ space.spaceName || $t('pages.spaceChatPage.defaultName') }}</h2>
            <div class="online-status">
              <span class="pulse-dot"></span>
              <span class="online-text">{{ onlineCount }}{{ $t('pages.spaceChatPage.onlineCount') }}</span>
            </div>
          </div>
          <div class="header-actions">
            <div class="action-icon-btn" @click="showAnnouncement = true" :title="$t('pages.spaceChatPage.tooltips.announcement')">
              <i class="fas fa-bullhorn"></i>
            </div>
            <div class="action-icon-btn" @click="showMemberList = true" :title="$t('pages.spaceChatPage.tooltips.memberList')">
              <i class="fas fa-users"></i>
              <span v-if="onlineCount > 0" class="count-badge">{{ onlineCount }}</span>
            </div>
          </div>
        </div>

        <div class="chat-content-wrapper">
          <PictureChatRoom
            ref="chatRoomRef"
            v-bind="chatProps"
            @message="handleChatMessage"
          />
        </div>
      </div>
    </div>

    <a-modal
      v-model:open="showAnnouncement"
      :footer="null"
      :width="isMobile ? '90%' : '420px'"
      :centered="true"
      class="modern-modal announcement-modal"
      :closable="false"
    >
      <div class="modal-custom-header">
        <div class="header-icon-box bg-purple">
          <i class="fas fa-bullhorn"></i>
        </div>
        <h3 class="modal-title">{{ $t('pages.spaceChatPage.announcement.title') }}</h3>
        <button class="modal-close-btn" @click="showAnnouncement = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="announcement-content">
        <p class="welcome-text">{{ $t('pages.spaceChatPage.announcement.welcome') }}</p>
        <div class="rule-list">
          <div class="rule-item">
            <div class="rule-icon bg-blue"><i class="fas fa-star"></i></div>
            <div class="rule-text">{{ $t('pages.spaceChatPage.announcement.rule1') }}</div>
          </div>
          <div class="rule-item">
            <div class="rule-icon bg-green"><i class="fas fa-handshake"></i></div>
            <div class="rule-text">{{ $t('pages.spaceChatPage.announcement.rule2') }}</div>
          </div>
          <div class="rule-item">
            <div class="rule-icon bg-orange"><i class="fas fa-palette"></i></div>
            <div class="rule-text">{{ $t('pages.spaceChatPage.announcement.rule3') }}</div>
          </div>
          <div class="rule-item">
            <div class="rule-icon bg-red"><i class="fas fa-ban"></i></div>
            <div class="rule-text">{{ $t('pages.spaceChatPage.announcement.rule4') }}</div>
          </div>
        </div>
        <button class="primary-full-btn" @click="showAnnouncement = false">{{ $t('pages.spaceChatPage.announcement.gotIt') }}</button>
      </div>
    </a-modal>

    <a-drawer
      v-model:visible="showMemberList"
      :width="isMobile ? '100%' : '360px'"
      :bodyStyle="{ padding: '0px', background: 'var(--card-background)' }"
      :headerStyle="{ display: 'none' }"
      placement="right"
      class="modern-drawer"
    >
      <div class="drawer-custom-header">
        <h3 class="drawer-title">{{ $t('pages.spaceChatPage.members.title') }} <span>({{ totalCount }})</span></h3>
        <button class="drawer-close-btn" @click="showMemberList = false">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="member-list-content">
        <div class="member-group">
          <div class="group-title">
            <span class="group-label">{{ $t('pages.spaceChatPage.members.onlineGroup') }}</span>
            <span class="group-count">{{ onlineCount }}</span>
          </div>
          <div class="member-items">
            <div
              v-for="user in onlineUsers"
              :key="user.id"
              class="member-item"
              @click="goToUserDetail(user)"
            >
              <div class="avatar-wrapper">
                <a-avatar :src="user.userAvatar" :size="44" class="user-avatar" />
                <div class="status-indicator online"></div>
              </div>
              <div class="member-info">
                <span class="member-name">{{ user.userName }}</span>
                <span class="member-status-text text-green">{{ $t('pages.spaceChatPage.members.online') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="member-group" v-if="offlineUsers.length > 0">
          <div class="group-title">
            <span class="group-label">{{ $t('pages.spaceChatPage.members.offlineGroup') }}</span>
            <span class="group-count">{{ offlineCount }}</span>
          </div>
          <div class="member-items">
            <div
              v-for="user in offlineUsers"
              :key="user.id"
              class="member-item offline"
              @click="goToUserDetail(user)"
            >
              <div class="avatar-wrapper">
                <a-avatar :src="user.userAvatar" :size="44" class="user-avatar" />
                <div class="status-indicator offline"></div>
              </div>
              <div class="member-info">
                <span class="member-name">{{ user.userName }}</span>
                <span class="member-status-text">{{ $t('pages.spaceChatPage.members.offline') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController'
import { message } from 'ant-design-vue'
import PictureChatRoom from '@/components/PictureChatRoom.vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDefaultAvatar } from '@/utils/userUtils'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const space = ref<API.SpaceVO>({})
const onlineCount = ref(0)
const offlineCount = ref(0)
const totalCount = ref(0)
const onlineUsers = ref<any[]>([])
const offlineUsers = ref<any[]>([])
const showMemberList = ref<boolean>(false)
const showAnnouncement = ref<boolean>(false)
const device = getDeviceType()
const isMobile = device === DEVICE_TYPE_ENUM.MOBILE

const fetchSpaceDetail = async () => {
  try {
    const res = await getSpaceVoByIdUsingGet({ id })
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data;
      totalCount.value = res.data.data.members?.length || 0;
      offlineUsers.value = res.data.data.members?.map((member: any) => ({
        ...member,
        userAvatar: member.userAvatar || getDefaultAvatar(member.userName),
      })) || [];
    } else {
      message.error(t('pages.spaceChatPage.msgs.getDetailFail') + (res.data.message || t('pages.spaceChatPage.msgs.unknownError') || t('pages.spaceChatPage.msgs.getInfoFail')))
    }
  } catch (e: any) {
    message.error(t('pages.spaceChatPage.msgs.getInfoFail') + e.message)
  }
}

const handleChatMessage = (msg: any) => {
  if (msg.type === 'onlineUsers') {
    onlineCount.value = msg.onlineUsers?.length || 0;
    offlineCount.value = totalCount.value - onlineCount.value;
    onlineUsers.value = msg.onlineUsers?.map((user: any) => ({
      ...user,
      userAvatar: user.userAvatar || getDefaultAvatar(user.userName)
    })) || [];

    const onlineUserIds = new Set(onlineUsers.value.map(u => u.id));
    offlineUsers.value = (space.value.members || []).filter((member: any) =>
      !onlineUserIds.has(member.id)
    ).map((member: any) => ({
      ...member,
      userAvatar: member.userAvatar || getDefaultAvatar(member.userName),
    }));
  }
}

const chatProps = {
  type: 'space',
  spaceId: id.toString(),
  onMessage: handleChatMessage
}

const goToUserDetail = (user: any) => {
  router.push({
    path: `/user/${user.id}`,
    query: {
      userName: user.userName,
      userAvatar: user.userAvatar || getDefaultAvatar(user.userName),
      userAccount: user.userAccount,
      userProfile: user.userProfile,
      userRole: user.userRole,
      createTime: user.createTime
    }
  })
}

onMounted(() => {
  fetchSpaceDetail()
})
</script>

<style scoped>
/* =========== 全局容器布局 =========== */
.space-chat-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--background, #f5f7fa);
  z-index: 100;
}

.chat-container {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100%;
  padding: 24px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.chat-main {
  flex: 1;
  background: var(--card-background, #fff);
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  position: relative;
}

/* =========== 顶部毛玻璃标题栏 =========== */
.header-title {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: rgba(var(--card-background-rgb, 255, 255, 255), 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}
.dark-theme .header-title {
  background: rgba(30, 30, 30, 0.85);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 18px;
  transition: all 0.2s;
  margin-right: 16px;
  background: var(--hover-background);
}
.back-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
  transform: translateX(-2px);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.space-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.online-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 呼吸灯效果 */
.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #52c41a;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(82, 196, 26, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
}

/* 右侧操作按钮 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px; /* 微圆角 Squircle */
  background: var(--hover-background);
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
.action-icon-btn:hover {
  background: var(--link-color);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  font-weight: 700;
  border: 2px solid var(--card-background);
}

/* 聊天主体容器 */
.chat-content-wrapper {
  flex: 1;
  height: 0; /* 配合flex使用，让子元素自行管理滚动 */
  background: var(--post-content-background, transparent);
}

/* =========== 弹窗公共样式重置 =========== */
:deep(.modern-modal) {
  .ant-modal-content {
    background: var(--card-background);
    border-radius: 24px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
  }
  .ant-modal-body { padding: 0; }
}

.modal-custom-header {
  padding: 24px 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.header-icon-box {
  width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: #fff; margin-bottom: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
.modal-title { font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0; }
.modal-close-btn {
  position: absolute; top: 20px; right: 20px;
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--hover-background); border: none; color: var(--text-secondary);
  cursor: pointer; transition: 0.2s;
}
.modal-close-btn:hover { background: var(--border-color); color: var(--text-primary); transform: rotate(90deg); }

/* 群公告内容 */
.announcement-content {
  padding: 0 24px 24px;
}
.welcome-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; text-align: center; }

.rule-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
.rule-item {
  display: flex; align-items: center; gap: 12px;
  background: var(--hover-background); padding: 12px 16px; border-radius: 12px;
}
.rule-icon {
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; flex-shrink: 0;
}
.bg-purple { background: linear-gradient(135deg, #c471f5, #fa71cd); }
.bg-blue { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.bg-green { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.bg-orange { background: linear-gradient(135deg, #f6d365, #fda085); }
.bg-red { background: linear-gradient(135deg, #ff0844, #ffb199); }
.rule-text { font-size: 14px; font-weight: 500; color: var(--text-primary); }

.primary-full-btn {
  width: 100%; height: 48px; border-radius: 14px;
  background: var(--link-color); color: #fff; font-size: 16px; font-weight: 600;
  border: none; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.primary-full-btn:active { transform: scale(0.96); }

/* =========== 侧边成员列表抽屉 =========== */
.drawer-custom-header {
  padding: 20px 24px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-background);
}
.drawer-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.drawer-title span { color: var(--text-tertiary); font-weight: normal; font-size: 15px;}
.drawer-close-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--hover-background); border: none; color: var(--text-secondary); cursor: pointer; transition: 0.2s;
}
.drawer-close-btn:hover { background: var(--border-color); color: var(--text-primary); }

.member-list-content {
  padding: 16px;
  height: calc(100vh - 70px);
  overflow-y: auto;
}
.member-list-content::-webkit-scrollbar { width: 4px; }
.member-list-content::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

.member-group { margin-bottom: 24px; }
.group-title { display: flex; justify-content: space-between; margin-bottom: 12px; padding: 0 8px; }
.group-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.group-count { font-size: 13px; color: var(--text-tertiary); }

.member-items { display: flex; flex-direction: column; gap: 4px; }
.member-item {
  display: flex; align-items: center; padding: 10px; border-radius: 12px;
  cursor: pointer; transition: 0.2s; background: transparent; border: 1px solid transparent;
}
.member-item:hover { background: var(--hover-background); border-color: var(--border-color); }
.member-item.offline { opacity: 0.6; }
.member-item.offline:hover { opacity: 1; }

/* 头像与沉浸式状态点 */
.avatar-wrapper { position: relative; margin-right: 14px; flex-shrink: 0; }
.user-avatar { border: 1px solid var(--border-color); }
.status-indicator {
  position: absolute; bottom: 0; right: 0;
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid var(--card-background);
}
.status-indicator.online { background-color: #52c41a; }
.status-indicator.offline { background-color: #d9d9d9; }

.member-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.member-name { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-status-text { font-size: 12px; color: var(--text-tertiary); }
.text-green { color: #52c41a; font-weight: 500; }

/* =========== 移动端极致适配 =========== */
@media screen and (max-width: 768px) {
  .chat-container { padding: 0; }
  .chat-main { border-radius: 0; border: none; box-shadow: none; }
  .header-title { padding: 12px 16px; }
  .back-btn { width: 32px; height: 32px; margin-right: 12px; font-size: 16px; background: transparent;}
  .space-name { font-size: 16px; }
  .online-text { font-size: 12px; }
  .action-icon-btn { width: 36px; height: 36px; font-size: 16px; }

  :deep(.modern-modal .ant-modal-content) {
    position: absolute; bottom: 0; width: 100%; border-radius: 24px 24px 0 0; margin: 0; padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
