<template>
  <div class="yuemu-pro-report-center">
    <div class="yuemu-page-container">
      <header class="yuemu-pro-header">
        <div class="yuemu-header-main">
          <h1 class="yuemu-page-title">{{ t('pages.user.userReportCenter.title') }}</h1>
          <div class="yuemu-mini-stats">
            <span class="yuemu-stat-item"><i class="yuemu-dot yuemu-all"></i>{{ t('pages.user.userReportCenter.totalReports') }}{{ stats.totalReports }}</span>
            <span class="yuemu-stat-item"><i class="yuemu-dot yuemu-pending"></i>{{ t('pages.user.userReportCenter.pendingReports') }}{{ stats.pendingReports }}</span>
          </div>
        </div>

        <div class="yuemu-pro-filters">
          <div class="yuemu-filter-chip" :class="{ 'yuemu-active': searchParams.reportType }" @click="openSheet('type')">
            {{ getSelectText('type') === t('pages.user.userReportCenter.typeAll') ? t('pages.user.userReportCenter.filterType') : getSelectText('type') }}
            <i class="fs fs-chevron-down"></i>
          </div>
          <div class="yuemu-filter-chip" :class="{ 'yuemu-active': searchParams.status }" @click="openSheet('status')">
            {{ getSelectText('status') === t('pages.user.userReportCenter.statusAll') ? t('pages.user.userReportCenter.filterStatus') : getSelectText('status') }}
            <i class="fs fs-chevron-down"></i>
          </div>
          <div class="yuemu-filter-chip" :class="{ 'yuemu-active': searchParams.targetType }" @click="openSheet('targetType')">
            {{ getSelectText('targetType') === t('pages.user.userReportCenter.targetAll') ? t('pages.user.userReportCenter.filterTarget') : getSelectText('targetType') }}
            <i class="fs fs-chevron-down"></i>
          </div>
          <div v-if="hasFilters" class="yuemu-filter-reset" @click="resetSearch">
            <i class="fs fs-rotate-left"></i> {{ t('pages.user.userReportCenter.reset') }}
          </div>
        </div>
      </header>

      <main class="yuemu-pro-feed" ref="listContainer">
        <div v-if="loading && dataList.length === 0" class="yuemu-pro-state">
          <div class="yuemu-spinner"></div>
        </div>

        <div v-else-if="!loading && dataList.length === 0" class="yuemu-pro-state">
          <i class="fs fs-inbox-full yuemu-empty-icon"></i>
          <div class="yuemu-empty-text">{{ t('pages.user.userReportCenter.emptyText') }}</div>
        </div>

        <div v-else class="yuemu-feed-list">
          <article v-for="report in dataList" :key="report.id" class="yuemu-feed-card">
            <div class="yuemu-feed-header">
              <div class="yuemu-user-info">
                <img :src="report.userAvatar || defaultAvatar" class="yuemu-avatar" />
                <div class="yuemu-meta">
                  <span class="yuemu-name">{{ report.userName || t('pages.user.userReportCenter.anonymous') }}</span>
                  <span class="yuemu-time">{{ formatTime(report.createTime) }} · #{{ report.id }}</span>
                </div>
              </div>
              <span class="yuemu-status-badge" :class="getStatusClass(report.status)">
                {{ report.statusText }}
              </span>
            </div>

            <div class="yuemu-feed-body">
              <div class="yuemu-target-tag">
                <i class="fs fs-crosshair"></i> {{ report.targetTypeText }} (ID: {{ report.targetId }})
                <span class="yuemu-type-accent">[{{ report.reportTypeText }}]</span>
              </div>

              <p class="yuemu-reason-text">{{ report.reason || t('pages.user.userReportCenter.noReason') }}</p>

              <div v-if="report.screenshotUrls?.length" class="yuemu-media-grid">
                <img
                  v-for="(url, idx) in report.screenshotUrls"
                  :key="idx" :src="url"
                  @click="previewImage(url)"
                  class="yuemu-media-item"
                />
              </div>
            </div>

            <div v-if="report.status !== 0" class="yuemu-feed-footer">
              <div class="yuemu-result-box">
                <span class="yuemu-result-label">
                  <i class="fs fs-reply-all"></i> {{ t('pages.user.userReportCenter.handleFeedback') }}{{ report.handlerName || t('pages.user.userReportCenter.system') }}
                </span>
                <p class="yuemu-result-content">{{ report.handleResult || t('pages.user.userReportCenter.noHandleDetail') }}</p>
              </div>
            </div>
          </article>
        </div>

        <div v-if="loadingMore" class="yuemu-pro-load-more"><div class="yuemu-spinner yuemu-small"></div></div>
      </main>

      <button class="yuemu-pro-fab" @click="openReportModal" :title="t('pages.user.userReportCenter.reportBtn')">
        <i class="fas fa-plus"></i>
      </button>

      <transition name="yuemu-slide-up">
        <div v-if="currentSheet" class="yuemu-pro-sheet-mask" @click="closeSheet">
          <div class="yuemu-pro-sheet" @click.stop>
            <div class="yuemu-sheet-bar"></div>
            <h3 class="yuemu-sheet-title">{{ t('pages.user.userReportCenter.sheetTitle') }}</h3>
            <div class="yuemu-sheet-items">
              <div
                v-for="opt in currentOptions"
                :key="opt.value"
                class="yuemu-sheet-item"
                :class="{ 'yuemu-selected': isSelected(opt.value) }"
                @click="selectOption(opt.value)"
              >
                {{ opt.label }}
                <i v-if="isSelected(opt.value)" class="fs fs-check yuemu-check-icon"></i>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="yuemu-fade">
        <div v-if="previewImageUrl" class="yuemu-pro-lightbox" @click="previewImageUrl = ''">
          <img :src="previewImageUrl" />
          <button class="yuemu-lightbox-close"><i class="fs fs-xmark"></i></button>
        </div>
      </transition>

      <ReportModal ref="reportModalRef" @success="handleReportSuccess" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted, reactive, ref, onUnmounted, computed } from 'vue';
import { listMyReportByPageUsingPost } from '@/api/reportController.ts';
import ReportModal from '@/components/ReportModal.vue';
import dayjs from 'dayjs';

const { t } = useI18n();

const defaultAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e2e8f0"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif">?</text></svg>';

const formatTime = (time: string | null) => time ? dayjs(time).format('MM-DD HH:mm') : '';
const previewImageUrl = ref('');
const previewImage = (url: string) => previewImageUrl.value = url;

const reportModalRef = ref();
const openReportModal = () => reportModalRef.value?.openModal();
const handleReportSuccess = () => { resetData(); fetchData(); };

const currentSheet = ref<'type' | 'status' | 'targetType' | null>(null);
const dicts = computed(() => ({
  type: [
    {label: t('pages.user.userReportCenter.typeAll'), value: ''},
    {label: t('pages.user.userReportCenter.typeSpam'), value: '1'},
    {label: t('pages.user.userReportCenter.typeViolation'), value: '2'},
    {label: t('pages.user.userReportCenter.typeHarmful'), value: '3'},
    {label: t('pages.user.userReportCenter.typeAttack'), value: '4'},
    {label: t('pages.user.userReportCenter.typePrivacy'), value: '5'},
    {label: t('pages.user.userReportCenter.typeCopyright'), value: '6'},
    {label: t('pages.user.userReportCenter.typeOther'), value: '7'}
  ],
  status: [
    {label: t('pages.user.userReportCenter.statusAll'), value: ''},
    {label: t('pages.user.userReportCenter.statusPending'), value: '0'},
    {label: t('pages.user.userReportCenter.statusResolved'), value: '1'},
    {label: t('pages.user.userReportCenter.statusRejected'), value: '2'}
  ],
  targetType: [
    {label: t('pages.user.userReportCenter.targetAll'), value: ''},
    {label: t('pages.user.userReportCenter.targetPost'), value: '2'},
    {label: t('pages.user.userReportCenter.targetComment'), value: '3'}
  ]
}));

const currentOptions = computed(() => currentSheet.value ? dicts.value[currentSheet.value] : []);
const openSheet = (sheet: any) => { currentSheet.value = sheet; document.body.style.overflow = 'hidden'; };
const closeSheet = () => { currentSheet.value = null; document.body.style.overflow = ''; };
const isSelected = (val: string) => {
  const key = currentSheet.value === 'type' ? 'reportType' : (currentSheet.value as keyof typeof searchParams);
  return searchParams[key] === val;
};

const selectOption = (val: string) => {
  const key = currentSheet.value === 'type' ? 'reportType' : currentSheet.value;
  if(key) (searchParams as any)[key] = val;
  closeSheet(); doSearch();
};

const searchParams = reactive({ current: 1, pageSize: 10, sortField: 'createTime', sortOrder: 'descend', reportType: '', status: '', targetType: '' });
const hasFilters = computed(() => searchParams.reportType || searchParams.status || searchParams.targetType);

const getSelectText = (type: 'type' | 'status' | 'targetType') => {
  const val = searchParams[type === 'type' ? 'reportType' : type];
  return dicts.value[type].find(i => i.value === val)?.label || t('pages.user.userReportCenter.all');
};

const dataList = ref<any[]>([]);
const loading = ref(false), loadingMore = ref(false), hasMore = ref(true);
const listContainer = ref<HTMLElement | null>(null);
const stats = reactive({ totalReports: 0, pendingReports: 0, handledReports: 0 });

const getStatusClass = (s: number) => ['yuemu-s-pending', 'yuemu-s-success', 'yuemu-s-reject'][s] || '';

const resetData = () => { dataList.value = []; searchParams.current = 1; hasMore.value = true; };
const resetSearch = () => { searchParams.reportType = searchParams.status = searchParams.targetType = ''; resetData(); fetchData(); };

const fetchData = async (isMore = false) => {
  if (isMore && !hasMore.value) return;
  isMore ? (loadingMore.value = true) : (loading.value = true);
  try {
    const params = {
      ...searchParams,
      reportType: searchParams.reportType ? Number(searchParams.reportType) : undefined,
      status: searchParams.status ? Number(searchParams.status) : undefined,
      targetType: searchParams.targetType ? Number(searchParams.targetType) : undefined
    };
    const res = await listMyReportByPageUsingPost(params);
    if (res.data?.code === 0) {
      const { records, total } = res.data.data;
      dataList.value = isMore ? [...dataList.value, ...records] : records;
      hasMore.value = dataList.value.length < total;
      stats.totalReports = total;
      stats.pendingReports = records.filter((i: any) => i.status === 0).length;
    }
  } catch (e) {} finally { loading.value = loadingMore.value = false; }
};

const doSearch = () => { resetData(); fetchData(); };
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight;
  if (scrollHeight - scrollTop - clientHeight < 100) {
    if (!loading.value && !loadingMore.value && hasMore.value) {
      searchParams.current++; fetchData(true);
    }
  }
};

onMounted(() => {
  fetchData();
  window.addEventListener('scroll', handleScroll);
});
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.yuemu-pro-report-center {
  background-color: var(--background);
  min-height: 100vh;
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.yuemu-page-container {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

/* --- 吸顶极简头部 --- */
.yuemu-pro-header {
  position: sticky; top: 0; z-index: 50;
  background: var(--header-background);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--border-color);
  padding: 24px 24px 16px;
}

.yuemu-header-main { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; }
.yuemu-page-title { font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -1px; color: var(--text-primary); }

.yuemu-mini-stats { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); font-weight: 600; }
.yuemu-stat-item { display: flex; align-items: center; gap: 6px; }
.yuemu-dot { width: 7px; height: 7px; border-radius: 50%; }
.yuemu-dot.yuemu-all { background: var(--link-color); }
.yuemu-dot.yuemu-pending { background: #f59e0b; }

/* --- 紧凑筛选栏 --- */
.yuemu-pro-filters { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; align-items: center; }
.yuemu-pro-filters::-webkit-scrollbar { display: none; }

.yuemu-filter-chip {
  flex-shrink: 0; background: var(--card-background); border: 1px solid var(--border-color);
  padding: 7px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 6px; color: var(--text-primary);
  cursor: pointer; transition: all 0.2s;
}
.yuemu-filter-chip:active { transform: scale(0.96); }
.yuemu-filter-chip.yuemu-active { background: var(--text-primary); color: var(--background); border-color: var(--text-primary); }

.yuemu-filter-reset { font-size: 13px; color: var(--text-secondary); padding: 6px 8px; cursor: pointer; white-space: nowrap; font-weight: 600; }
.yuemu-filter-reset:hover { color: var(--link-color); }

/* --- Feed 流 --- */
.yuemu-pro-feed { padding: 24px 16px 120px; }
.yuemu-feed-list { display: flex; flex-direction: column; gap: 20px; }

.yuemu-feed-card {
  background: var(--card-background); border-radius: 20px; padding: 20px;
  border: 1px solid var(--border-color); box-shadow: 0 4px 16px var(--shadow-color);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-feed-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px var(--shadow-color); border-color: var(--link-color); }

.yuemu-feed-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.yuemu-user-info { display: flex; align-items: center; gap: 14px; }
.yuemu-avatar { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border-color); object-fit: cover; }
.yuemu-meta { display: flex; flex-direction: column; }
.yuemu-name { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.yuemu-time { font-size: 12px; color: var(--text-secondary); margin-top: 3px; font-family: 'SF Mono', monospace; }

.yuemu-status-badge { font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 8px; }
.yuemu-s-pending { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.yuemu-s-success { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.yuemu-s-reject { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.yuemu-feed-body { margin-bottom: 18px; }
.yuemu-target-tag {
  display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700;
  background: var(--hover-background); padding: 5px 12px; border-radius: 8px;
  color: var(--text-secondary); margin-bottom: 12px; border: 1px solid var(--border-color);
}
.yuemu-type-accent { color: var(--link-color); margin-left: 4px; }
.yuemu-reason-text { font-size: 16px; line-height: 1.7; margin: 0; color: var(--text-primary); }

.yuemu-media-grid { display: flex; gap: 12px; margin-top: 18px; overflow-x: auto; padding-bottom: 6px; }
.yuemu-media-item { width: 100px; height: 100px; flex-shrink: 0; object-fit: cover; border-radius: 12px; cursor: pointer; transition: 0.3s; border: 1px solid var(--border-color); }
.yuemu-media-item:hover { transform: scale(1.05); }

.yuemu-feed-footer { background: var(--hover-background); border-radius: 12px; padding: 16px; border-left: 4px solid var(--link-color); }
.yuemu-result-label { font-size: 13px; font-weight: 700; color: var(--link-color); margin-bottom: 8px; display: block; }
.yuemu-result-content { font-size: 15px; margin: 0; color: var(--text-primary); line-height: 1.6; }

/* --- UI 状态 --- */
.yuemu-pro-fab {
  position: fixed; right: 40px; bottom: 40px; width: 60px; height: 60px; border-radius: 30px;
  background: var(--link-color); color: #fff; display: flex; align-items: center; justify-content: center;
  border: none; font-size: 24px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
  z-index: 90; cursor: pointer; transition: all 0.3s;
}
.yuemu-pro-fab:active { transform: scale(0.9); }

.yuemu-pro-state { padding: 100px 0; text-align: center; }
.yuemu-empty-icon { font-size: 60px; color: var(--border-color); margin-bottom: 20px; }
.yuemu-empty-text { color: var(--text-secondary); font-size: 16px; font-weight: 600; }
.yuemu-spinner { width: 30px; height: 30px; border: 4px solid var(--border-color); border-top-color: var(--link-color); border-radius: 50%; animation: yuemu-spin 0.8s linear infinite; margin: 0 auto; }
@keyframes yuemu-spin { to { transform: rotate(360deg); } }

/* --- 筛选面板 --- */
.yuemu-pro-sheet-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; }
.yuemu-pro-sheet { background: var(--card-background); width: 90%; max-width: 400px; border-radius: 24px; padding: 28px; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
.yuemu-sheet-title { font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 20px; text-align: center; }
.yuemu-sheet-items { display: flex; flex-direction: column; gap: 10px; }
.yuemu-sheet-item { padding: 14px 18px; border-radius: 14px; font-size: 16px; font-weight: 600; color: var(--text-primary); background: var(--hover-background); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.yuemu-sheet-item.yuemu-selected { background: var(--nav-item-active); color: var(--link-color); }

/* --- 全屏预览 --- */
.yuemu-pro-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 999; display: flex; align-items: center; justify-content: center; }
.yuemu-pro-lightbox img { max-width: 95%; max-height: 85vh; object-fit: contain; }
.yuemu-lightbox-close { position: absolute; top: 30px; right: 30px; background: none; border: none; color: #fff; font-size: 30px; cursor: pointer; }

/* 动画系统 */
.yuemu-slide-up-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-slide-up-enter-from { opacity: 0; transform: translateY(30px) scale(0.9); }
.yuemu-fade-enter-active { transition: opacity 0.3s; }
.yuemu-fade-enter-from { opacity: 0; }

@media (max-width: 768px) {
  .yuemu-pro-header { padding: 16px 16px 12px; }
  .yuemu-pro-sheet-mask { align-items: flex-end; }
  .yuemu-pro-sheet { max-width: 100%; border-radius: 28px 28px 0 0; padding-bottom: calc(env(safe-area-inset-bottom) + 30px); }
  .yuemu-sheet-bar { width: 40px; height: 5px; background: var(--border-color); border-radius: 3px; margin: -10px auto 20px; }
  .yuemu-pro-fab { right: 20px; bottom: 30px; }
}
.yuemu-pro-end{
  width: 100%;
  margin: 0 auto;
}
</style>
