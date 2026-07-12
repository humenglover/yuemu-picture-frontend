<template>
  <div id="rankingPage">
    <div v-if="device !== DEVICE_TYPE_ENUM.PC" class="mobile-header blur-nav">
      <div class="header-content">
        <button class="icon-btn" @click="goBack"><i class="fas fa-chevron-left"></i></button>
        <h1 class="page-title">{{ $t('pages.rankingPage.title') }}</h1>
        <div class="placeholder"></div>
      </div>
    </div>


    <div class="ranking-header-filters">
      <div class="filter-row top-row">
        <div class="pill-container">
          <div
            v-for="type in rankingTypes"
            :key="type.value"
            class="pill-item"
            :class="{ active: currentType === type.value }"
            @click="handleTypeChange(type.value)"
          >
            {{ type.label }}
          </div>
        </div>

        <div class="pill-container">
          <div class="pill-item" :class="{ active: currentDimension === 'works' }" @click="currentDimension = 'works'">{{ $t('pages.rankingPage.tabs.works') }}</div>
          <div class="pill-item" :class="{ active: currentDimension === 'authors' }" @click="currentDimension = 'authors'">{{ $t('pages.rankingPage.tabs.authors') }}</div>
        </div>
      </div>

      <div class="filter-row bottom-row">
        <div class="pill-container outline-style">
          <div
            v-for="range in timeRanges"
            :key="range.value"
            class="pill-item outline-item"
            :class="{ active: currentTimeRange === range.value }"
            @click="handleTimeRangeChange(range.value)"
          >
            {{ range.label }}
          </div>
        </div>

        <div class="rule-hint" @click="toggleInfo">
          <i class="fas fa-question-circle"></i>
        </div>
      </div>
    </div>

    <main class="ranking-board">

      <Teleport to="body">
        <transition name="modal-fade">
          <div v-if="isInfoExpanded" class="custom-rule-modal-overlay" @click.self="toggleInfo">
            <div class="custom-rule-modal-container">
              <div class="modal-header">
                <h3>{{ $t('pages.rankingPage.rules.title') }}</h3>
                <button class="close-btn" @click="toggleInfo">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="info-content modal-rules">
                <div class="info-section">
                  <h4><i class="fas fa-feather-alt"></i> {{ $t('pages.rankingPage.rules.aesthetics.title') }}</h4>
                  <p v-if="currentDimension === 'works'">
                    <span v-html="$t('pages.rankingPage.rules.aesthetics.desc1')"></span>
                    <span class="highlight" v-html="$t('pages.rankingPage.rules.aesthetics.desc2')"></span>
                  </p>
                  <p v-else>
                    <span v-html="$t('pages.rankingPage.rules.aesthetics.desc3')"></span>
                    {{ $t('pages.rankingPage.rules.aesthetics.desc4') }}
                  </p>
                </div>
                <div class="info-section">
                  <h4><i class="fas fa-water"></i> {{ $t('pages.rankingPage.rules.surge.title') }}</h4>
                  <p>
                    <span v-html="$t('pages.rankingPage.rules.surge.desc1')"></span>
                    <span v-html="$t('pages.rankingPage.rules.surge.desc2')"></span>
                  </p>
                </div>
                <div class="info-section">
                  <h4><i class="fas fa-hourglass-half"></i> {{ $t('pages.rankingPage.rules.time.title') }}</h4>
                  <p>
                    <span v-html="$t('pages.rankingPage.rules.time.desc1')"></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>

      <a-spin :spinning="loading" class="spin-wrapper">
        <transition name="board-fade" mode="out-in">
          <div :key="`${currentType}-${currentDimension}-${currentTimeRange}`" class="board-content">
            <template v-if="currentType === 'picture'">
              <PictureRankingList v-if="currentDimension === 'works'" :data-list="pictureList" />
              <AuthorRankingCard v-else type="picture" :time-range="currentTimeRange" :limit="20" />
            </template>
            <template v-if="currentType === 'post'">
              <PostRankingList v-if="currentDimension === 'works'" :data-list="postList" />
              <AuthorRankingCard v-else type="post" :time-range="currentTimeRange" :limit="20" />
            </template>
          </div>
        </transition>
      </a-spin>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getDeviceType } from "@/utils/device";
import { DEVICE_TYPE_ENUM } from "@/constants/device";
import { getTop100PictureUsingGet } from "@/api/pictureController";
import { getTop100PostUsingGet } from "@/api/postController";
import AuthorRankingCard from "@/components/AuthorRankingCard.vue";
import PictureRankingList from "@/components/PictureRankingList.vue";
import PostRankingList from "@/components/PostRankingList.vue";
import { message } from "ant-design-vue";

const router = useRouter();
const route = useRoute();
const device = ref("");
const loading = ref(false);

// 控制说明面板展开/收起，默认 false (全部设备收起)
const isInfoExpanded = ref(false);

const currentType = ref<"picture" | "post">((route.query.type as "picture" | "post") || "picture");
const currentDimension = ref<"works" | "authors">("works");
const currentTimeRange = ref("total");

const rankingTypes = computed(() => [{ value: "picture", label: t('pages.rankingPage.types.picture') }, { value: "post", label: t('pages.rankingPage.types.post') }]);
const timeRanges = computed(() => [
  { value: "day", label: t('pages.rankingPage.periods.day') }, { value: "week", label: t('pages.rankingPage.periods.week') },
  { value: "month", label: t('pages.rankingPage.periods.month') }, { value: "total", label: t('pages.rankingPage.periods.total') }
]);

const pictureList = ref<any[]>([]);
const postList = ref<any[]>([]);

const goBack = () => router.back();

const toggleInfo = () => {
  isInfoExpanded.value = !isInfoExpanded.value;
  if (isInfoExpanded.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

onUnmounted(() => {
  document.body.style.overflow = "";
});

const handleTypeChange = (type: "picture" | "post") => {
  // 清空旧数据，避免显示错误的榜单
  pictureList.value = [];
  postList.value = [];

  currentType.value = type;
  router.replace({ query: { type } });
  loadRankingData();
};

const handleTimeRangeChange = (range: string) => {
  currentTimeRange.value = range;
  loadRankingData();
};

const loadPictureRanking = async () => {
  try {
    const rangeIdMap: Record<string, number> = { day: 1, week: 2, month: 3, total: 4 };
    const res = await getTop100PictureUsingGet({ id: rangeIdMap[currentTimeRange.value] });
    if (res.data.code === 0) pictureList.value = res.data.data || [];
  } catch (error) { message.error(t('pages.rankingPage.msgs.getPicFail')); }
};

const loadPostRanking = async () => {
  try {
    const rangeIdMap: Record<string, number> = { day: 1, week: 2, month: 3, total: 4 };
    const res = await getTop100PostUsingGet({ id: rangeIdMap[currentTimeRange.value] });
    if (res.data.code === 0) postList.value = res.data.data || [];
  } catch (error) { message.error(t('pages.rankingPage.msgs.getPostFail')); }
};

const loadRankingData = async () => {
  loading.value = true;
  try {
    // 只加载当前类型的数据
    if (currentType.value === "picture") {
      postList.value = []; 
      await loadPictureRanking();
    } else {
      pictureList.value = []; 
      await loadPostRanking();
    }
  } finally {
    loading.value = false;
  }
};

// 监听路由参数变化，支持从外部跳转时正确显示
watch(() => route.query.type, (newType) => {
  if (newType && newType !== currentType.value) {
    // 清空旧数据
    pictureList.value = [];
    postList.value = [];

    currentType.value = newType as "picture" | "post";
    loadRankingData();
  }
}, { immediate: false });

onMounted(async () => {
  device.value = await getDeviceType();
  await loadRankingData();
});
</script>

<style scoped lang="scss">
#rankingPage {
  min-height: 100vh;
  background-color: var(--background);
  padding-bottom: 80px;
}

.mobile-header {
  position: sticky; top: 0; z-index: 100;
  background: var(--header-background); backdrop-filter: blur(20px); border-bottom: 1px dashed var(--border-color);
  .header-content {
    display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 16px;
    .icon-btn { background: none; border: none; font-size: 18px; color: var(--text-primary); }
    .page-title { font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .placeholder { width: 24px; }
  }
}


.ranking-header-filters {
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  
  .filter-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    
    &.bottom-row {
      justify-content: center;
    }
  }

  @media (max-width: 768px) {
    padding: 16px 0;
    margin: 0;
    gap: 16px;
    align-items: center;
    .filter-row {
      box-sizing: border-box;
      flex-wrap: nowrap;
      overflow-x: auto;
      justify-content: center;
      gap: 12px;
      padding: 0 16px;
      /* 隐藏横向滚动条但保留滚动功能 */
      &::-webkit-scrollbar { display: none; }
      scrollbar-width: none;
      -ms-overflow-style: none;
      
      /* 添加回弹效果和更顺滑的滚动 */
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x mandatory;
      
      &.top-row, &.bottom-row {
        width: 100%;
        .pill-container {
          flex: 1;
          display: flex;
        }
      }
      
      &::after {
        content: '';
        display: block;
        padding-right: 4px;
      }
    }
    
    .pill-container, .rule-hint {
      scroll-snap-align: start;
    }
  }
}

.pill-container {
  display: inline-flex;
  background: var(--card-background);
  border-radius: 40px;
  padding: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  align-items: center;
  border: 1px solid var(--border-color);
}

.pill-item {
  padding: 8px 24px;
  border-radius: 36px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &.active {
    background: var(--text-primary);
    color: var(--background);
    font-weight: 600;
    box-shadow: 0 4px 12px var(--shadow-color);
  }

  &:not(.active):hover {
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
  }
}

.pill-container.outline-style {
  padding: 4px;
}

.outline-item {
  padding: 6px 20px;
  font-size: 14px;
  border: 1px solid transparent;
  
  &.active {
    background: var(--text-primary);
    color: var(--background);
    border: 1px solid transparent;
    box-shadow: 0 4px 12px var(--shadow-color);
  }

  @media (max-width: 768px) {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
  }
}

.rule-hint {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s;
  padding: 8px 12px;
  &:hover { color: var(--text-primary); }
  i { font-size: 15px; opacity: 0.8; }
}

.ranking-board { max-width: 1400px; margin: 0 auto; padding: 0 24px; min-height: 50vh; @media (max-width: 768px) { padding: 0 4px; } }

/* ================= 自定义弹窗样式 ================= */
.custom-rule-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-rule-modal-container {
  background: var(--card-background);
  border-radius: 16px;
  width: 90%;
  max-width: 560px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px dashed var(--border-color);
    
    h3 { margin: 0; font-size: 17px; font-weight: 600; color: var(--text-primary); }
    .close-btn {
      background: transparent; border: none; font-size: 18px; color: var(--text-secondary);
      cursor: pointer; transition: 0.3s; width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      &:hover { color: var(--text-primary); background: rgba(128, 128, 128, 0.1); transform: rotate(90deg); }
    }
  }

  .modal-rules {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
    display: grid; 
    gap: 20px;
    
    /* 滚动条美化 */
    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.2); border-radius: 3px; }

    .info-section {
      h4 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 10px 0; i { color: #3b82f6; font-size: 14px; opacity: 0.8; } }
      p { font-size: 14px; line-height: 1.6; color: var(--text-secondary); margin: 0; strong { color: var(--text-primary); font-weight: 600; } .highlight { color: var(--text-primary); font-weight: 600; border-bottom: 2px dotted rgba(59, 130, 246, 0.4); } }
    }
  }
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-active .custom-rule-modal-container, .modal-fade-leave-active .custom-rule-modal-container { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .custom-rule-modal-container, .modal-fade-leave-to .custom-rule-modal-container { transform: translateY(20px) scale(0.95); opacity: 0; }

.board-fade-enter-active, .board-fade-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.board-fade-enter-from { opacity: 0; transform: translateY(20px) scale(0.98); }
.board-fade-leave-to { opacity: 0; transform: translateY(-20px) scale(0.98); }
</style>
