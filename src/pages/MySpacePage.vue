<template>
  <div id="mySpacePage" class="space-page-wrapper">
    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh" class="pull-refresh-area">
      <div class="space-loader-card">
        <div class="portal-loader">
          <div class="orbit"></div>
          <div class="orbit orbit-2"></div>
          <div class="core"></div>
        </div>
        <div class="text-section">
          <h2 class="gradient-text">{{ $t('pages.mySpacePage.openingSpace') }}</h2>
          <p class="sub-text">Please wait a moment...</p>
        </div>
        <div class="info-footer">
          <div class="info-pill">
            <i class="fas fa-info-circle"></i>
            <span>{{ $t('pages.mySpacePage.autoBuild') }}</span>
          </div>
        </div>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { listSpaceVoByPageUsingPost } from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import { onMounted, ref, onActivated } from 'vue'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'

const { t } = useI18n();

const router = useRouter()
const loginUserStore = useLoginUserStore()
const isRefreshing = ref(false)

const onRefresh = async () => {
  await checkUserSpace()
  isRefreshing.value = false
}

const checkUserSpace = async () => {
  const loginUser = loginUserStore.loginUser
  if (!loginUser?.id) {
    router.replace({ name: 'UserLogin' })
    return
  }

  try {
    const res = await listSpaceVoByPageUsingPost({
      userId: loginUser.id,
      current: 1,
      pageSize: 1,
      spaceType: SPACE_TYPE_ENUM.PRIVATE,
    })

    if (res.data.code === 0) {
      if (res.data.data?.records?.length > 0) {
        const space = res.data.data.records[0]
        router.replace({ name: 'SpaceDetail', params: { id: space.id } })
      } else {
        router.replace({ name: 'AddSpace' })
        message.info(t('pages.mySpacePage.creatingSpace'))
      }
    } else {
      message.error(t('pages.mySpacePage.loadFail').replace('{msg}', res.data.message))
    }
  } catch (error) {
    message.error(t('pages.mySpacePage.networkFail'))
  }
}

onMounted(() => {
  checkUserSpace()
})

onActivated(() => {
  checkUserSpace()
})
</script>

<style scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");

.space-page-wrapper {
  min-height: calc(100vh - 60px);
  background-color: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--theme-transition);
  width: 100%; /* 确保外层满宽 */
}

.pull-refresh-area {
  width: 100%;
  min-height: calc(100vh - 60px);
}

/* 关键修复点：穿透 Vant 组件内部，强制其包裹层使用 Flex 居中 */
:deep(.van-pull-refresh__track) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
}

.space-loader-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 40px;
  border-radius: 32px;
  background: var(--card-background);
  box-shadow: 0 20px 60px var(--shadow-color);
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 400px;
  /* 如果还有微调偏移，可以加上 margin: 0 auto; 双重保险 */
  margin: 0 auto;
  transform: translateY(-8vh);
  animation: floatUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes floatUp {
  from { opacity: 0; transform: translateY(-3vh) scale(0.95); }
  to { opacity: 1; transform: translateY(-8vh) scale(1); }
}

.portal-loader {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.orbit {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px dashed var(--link-color);
  opacity: 0.3;
  animation: spin 8s linear infinite;
}

.orbit-2 {
  width: 70%;
  height: 70%;
  border: 2px solid transparent;
  border-top: 2px solid var(--link-color);
  border-bottom: 2px solid var(--link-color);
  opacity: 0.8;
  animation: spin-reverse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.core {
  width: 20px;
  height: 20px;
  background: var(--link-color);
  border-radius: 50%;
  box-shadow: 0 0 15px var(--link-color);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 25px var(--link-color); }
  100% { transform: scale(0.8); opacity: 0.8; }
}

.text-section {
  text-align: center;
  margin-bottom: 36px;
}

.gradient-text {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 10px;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--link-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.sub-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.info-footer {
  width: 100%;
  display: flex;
  justify-content: center;
}

.info-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--hover-background);
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.info-pill i {
  color: var(--link-color);
}
</style>
