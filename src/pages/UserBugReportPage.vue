<template>
  <div class="user-bug-report-page">
    <div class="page-header">
      <h1>{{ $t('pages.userBugReportPage.title') }}</h1>
      <p>{{ $t('pages.userBugReportPage.subtitle') }}！</p>
    </div>

    <!-- 提交表单 -->
    <a-card class="submit-form-card">
      <template #title>
        <span class="form-title">{{ $t('pages.userBugReportPage.reportTitle') }}</span>
      </template>

      <a-form
        :model="formState"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
        layout="horizontal"
        autocomplete="off"
        @finish="handleSubmit"
        :colon="false"
        labelAlign="left"
      >
        <a-form-item
          :label="$t('pages.userBugReportPage.fields.title.label')"
          name="title"
          :rules="[{ required: true, message: $t('pages.userBugReportPage.fields.title.placeholder') }, { max: 100, message: '{{ $t('pages.userBugReportPage.fields.title.maxLen', { max: 100 }) }}!' }]"
        >
          <a-input
            v-model:value="formState.title"
            placeholder="请简明扼要地描述遇到的问题"
            :maxlength="100"
          />
        </a-form-item>

        <a-form-item
          :label="$t('pages.userBugReportPage.fields.priority.label')"
          name="priority"
          :rules="[{ required: true, message: $t('pages.userBugReportPage.fields.priority.placeholder') }]"
        >
          <a-select
            v-model:value="formState.priority"
            :placeholder="$t('pages.userBugReportPage.fields.priority.placeholder')"
          >
            <a-select-option :value="0">{{ $t('pages.userBugReportPage.fields.priority.low') }}</a-select-option>
            <a-select-option :value="1">{{ $t('pages.userBugReportPage.fields.priority.medium') }}</a-select-option>
            <a-select-option :value="2">{{ $t('pages.userBugReportPage.fields.priority.high') }}</a-select-option>
            <a-select-option :value="3">{{ $t('pages.userBugReportPage.fields.priority.urgent') }}</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          :label="$t('pages.userBugReportPage.fields.description.label')"
          name="description"
          :rules="[{ required: true, message: $t('pages.userBugReportPage.fields.description.placeholder') }, { max: 500, message: $t('pages.userBugReportPage.fields.description.maxLen', { max: 500 }) }]"
        >
          <a-textarea
            v-model:value="formState.description"
            :placeholder="$t('pages.userBugReportPage.fields.description.desc')"
            :rows="4"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <a-form-item
          :label="$t('pages.userBugReportPage.fields.steps.label')"
          name="reproduceSteps"
          :rules="[{ required: true, message: $t('pages.userBugReportPage.fields.steps.placeholder') }, { max: 1000, message: $t('pages.userBugReportPage.fields.steps.maxLen', { max: 1000 }) }]"
        >
          <a-textarea
            v-model:value="formState.reproduceSteps"
            :placeholder="$t('pages.userBugReportPage.fields.steps.desc')"
            :rows="6"
            :maxlength="1000"
            show-count
          />
        </a-form-item>

        <a-form-item
          :label="$t('pages.userBugReportPage.fields.expected.label')"
          name="expectedResult"
          :rules="[{ required: true, message: $t('pages.userBugReportPage.fields.expected.placeholder') }, { max: 500, message: '{{ $t('pages.userBugReportPage.fields.expected.maxLen', { max: 500 }) }}!' }]"
        >
          <a-textarea
            v-model:value="formState.expectedResult"
            :placeholder="$t('pages.userBugReportPage.fields.expected.desc')"
            :rows="3"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <a-form-item
          :label="$t('pages.userBugReportPage.fields.actual.label')"
          name="actualResult"
          :rules="[{ required: true, message: $t('pages.userBugReportPage.fields.actual.placeholder') }, { max: 500, message: '{{ $t('pages.userBugReportPage.fields.actual.maxLen', { max: 500 }) }}!' }]"
        >
          <a-textarea
            v-model:value="formState.actualResult"
            :placeholder="$t('pages.userBugReportPage.fields.actual.desc')"
            :rows="3"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <a-form-item
          :label="$t('pages.userBugReportPage.fields.device.label')"
          name="deviceInfo"
        >
          <a-input
            v-model:value="formState.deviceInfo"
            placeholder="例如：iPhone 13, Android 12, Windows 10 等"
            :maxlength="200"
          />
        </a-form-item>

        <a-form-item
          :label="$t('pages.userBugReportPage.fields.browser.label')"
          name="browserInfo"
        >
          <a-input
            v-model:value="formState.browserInfo"
            placeholder="例如：Chrome 98.0, Safari 15.0, Firefox 96.0 等"
            :maxlength="200"
          />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4 }">
          <a-button
            type="primary"
            html-type="submit"
            :loading="submitting"
            :style="{ backgroundColor: '#52c41a', borderColor: '#52c41a' }"
          >
            {{ submitting ? '提交中...' : '提交漏洞报告' }}
          </a-button>
          <a-button
            style="margin-left: 12px;"
            @click="resetForm"
          >
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 用户反馈列表 -->
    <div class="feedback-list-section">
      <div class="section-header">
        <h2>{{ $t('pages.userBugReportPage.list.myRecords') }}</h2>
        <div class="list-controls">
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索标题或描述..."
            allow-clear
            @change="handleSearch"
            style="width: 250px; margin-right: 16px;"
          />
          <a-select
            v-model:value="filterStatus"
            placeholder="筛选状态"
            allow-clear
            @change="handleFilterChange"
            style="width: 150px; margin-right: 16px;"
          >
            <a-select-option value="">{{ $t('pages.userBugReportPage.list.allStatus') }}</a-select-option>
            <a-select-option value="0">{{ $t('pages.userBugReportPage.list.status.pending') }}</a-select-option>
            <a-select-option value="1">{{ $t('pages.userBugReportPage.list.status.resolved') }}</a-select-option>
            <a-select-option value="2">{{ $t('pages.userBugReportPage.list.status.ignored') }}</a-select-option>
          </a-select>
          <a-button @click="refreshList">{{ $t('pages.userBugReportPage.btns.refresh') }}</a-button>
        </div>
      </div>

      <!-- 反馈列表 -->
      <div class="feedback-list">
        <a-card
          v-for="item in feedbackList"
          :key="item.id"
          class="feedback-item"
          :class="{ 'status-solved': item.status === 1, 'status-ignored': item.status === 2 }"
        >
          <div class="feedback-header">
            <div class="feedback-title">
              <h3>{{ item.title }}</h3>
              <a-tag
                :color="getStatusColor(item.status)"
                style="margin-left: 12px;"
              >
                {{ getStatusText(item.status) }}
              </a-tag>
              <a-tag
                :color="getPriorityColor(item.priority)"
                style="margin-left: 8px;"
              >
                {{ getPriorityText(item.priority) }}
              </a-tag>
            </div>
            <div class="feedback-meta">
              <span class="feedback-time">{{ formatDate(item.createTime) }}</span>
            </div>
          </div>

          <div class="feedback-content">
            <p class="feedback-description">{{ item.description }}</p>

            <div class="feedback-details">
              <div class="detail-row">
                <span class="detail-label">重现步骤：</span>
                <span class="detail-value">{{ item.reproduceSteps?.substring(0, 100) }}{{ item.reproduceSteps?.length > 100 ? '...' : '' }}</span>
              </div>
              <div class="detail-row" v-if="item.expectedResult">
                <span class="detail-label">预期结果：</span>
                <span class="detail-value">{{ item.expectedResult }}</span>
              </div>
              <div class="detail-row" v-if="item.actualResult">
                <span class="detail-label">实际结果：</span>
                <span class="detail-value">{{ item.actualResult }}</span>
              </div>
              <div class="detail-row" v-if="item.deviceInfo">
                <span class="detail-label">设备信息：</span>
                <span class="detail-value">{{ item.deviceInfo }}</span>
              </div>
              <div class="detail-row" v-if="item.browserInfo">
                <span class="detail-label">浏览器：</span>
                <span class="detail-value">{{ item.browserInfo }}</span>
              </div>
              <div class="detail-row" v-if="item.solveTime && item.status === 1">
                <span class="detail-label">解决时间：</span>
                <span class="detail-value">{{ formatDate(item.solveTime) }}</span>
              </div>
            </div>
          </div>
        </a-card>

        <div v-if="feedbackList.length === 0" class="empty-feedback">
          <a-empty description="暂无反馈记录" />
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="feedbackList.length > 0">
        <a-pagination
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :show-quick-jumper="true"
          :page-size-options="['10', '20', '50', '100']"
          @change="handlePageChange"
          @showSizeChange="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  addBugReportUsingPost,
  listMyBugReportByPageUsingPost
} from '@/api/bugReportController';

// 表单状态
const formState = reactive({
  title: '',
  priority: 1,
  description: '',
  reproduceSteps: '',
  expectedResult: '',
  actualResult: '',
  deviceInfo: '',
  browserInfo: ''
});

// 提交状态
const submitting = ref(false);

// 反馈列表状态
const feedbackList = ref<API.BugReportVO[]>([]);
const loading = ref(false);
const searchKeyword = ref('');
const filterStatus = ref<string | null>(null);

// 分页信息
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 提交表单
const handleSubmit = async (values: any) => {
  submitting.value = true;
  try {
    const response = await addBugReportUsingPost({
      title: values.title,
      priority: values.priority,
      description: values.description,
      reproduceSteps: values.reproduceSteps,
      expectedResult: values.expectedResult,
      actualResult: values.actualResult,
      deviceInfo: values.deviceInfo,
      browserInfo: values.browserInfo
    });

    if (response.code === 0) {
      message.success('漏洞报告提交成功！');
      resetForm();
      refreshList(); // 刷新列表
    } else {
      message.error(response.message || '提交失败');
    }
  } catch (error: any) {
    console.error('提交漏洞报告失败:', error);
    message.error(error.message || t('pages.userBugReportPage.msgs.submitFailRetry'));
  } finally {
    submitting.value = false;
  }
};

// 重置表单
const resetForm = () => {
  formState.title = '';
  formState.priority = 1;
  formState.description = '';
  formState.reproduceSteps = '';
  formState.expectedResult = '';
  formState.actualResult = '';
  formState.deviceInfo = '';
  formState.browserInfo = '';
};

// 获取我的反馈列表
const fetchFeedbackList = async () => {
  loading.value = true;
  try {
    const response = await listMyBugReportByPageUsingPost({
      current: pagination.current,
      pageSize: pagination.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
      title: searchKeyword.value || undefined,
      status: filterStatus.value ? parseInt(filterStatus.value) : undefined
    });

    if (response.code === 0 && response.data) {
      feedbackList.value = response.data.records || [];
      pagination.total = response.data.total || 0;
    } else {
      message.error(response.message || t('pages.userBugReportPage.msgs.fetchFailUnknown'));
    }
  } catch (error: any) {
    console.error('获取反馈列表失败:', error);
    message.error(error.message || t('pages.userBugReportPage.msgs.fetchFailUnknown'));
  } finally {
    loading.value = false;
  }
};

// 刷新列表
const refreshList = () => {
  pagination.current = 1;
  fetchFeedbackList();
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchFeedbackList();
};

// 处理筛选
const handleFilterChange = () => {
  pagination.current = 1;
  fetchFeedbackList();
};

// 处理分页变化
const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchFeedbackList();
};

// 处理每页显示数量变化
const handlePageSizeChange = (current: number, size: number) => {
  pagination.current = 1;
  pagination.pageSize = size;
  fetchFeedbackList();
};

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return t('pages.userBugReportPage.list.status.pending');
    case 1: return t('pages.userBugReportPage.list.status.resolved');
    case 2: return t('pages.userBugReportPage.list.status.ignored');
    default: return t('pages.userBugReportPage.list.status.unknown');
  }
};

// 获取状态颜色
const getStatusColor = (status: number) => {
  switch (status) {
    case 0: return 'warning';
    case 1: return 'success';
    case 2: return 'default';
    default: return 'default';
  }
};

// 获取优先级文本
const getPriorityText = (priority: number) => {
  switch (priority) {
    case 0: return t('pages.userBugReportPage.fields.priority.low');
    case 1: return t('pages.userBugReportPage.fields.priority.medium');
    case 2: return t('pages.userBugReportPage.fields.priority.high');
    case 3: return t('pages.userBugReportPage.fields.priority.urgent');
    default: return t('pages.userBugReportPage.list.status.unknown');
  }
};

// 获取优先级颜色
const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 0: return 'default';
    case 1: return 'processing';
    case 2: return 'orange';
    case 3: return 'red';
    default: return 'default';
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 初始化数据
onMounted(() => {
  fetchFeedbackList();
});
</script>

<style scoped>
.user-bug-report-page {
  padding: 24px;
  background: var(--background);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  color: var(--text-primary);
  margin-bottom: 8px;
}

.page-header p {
  color: var(--text-secondary);
  margin: 0;
}

.submit-form-card {
  margin-bottom: 32px;
  border-radius: 8px;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.feedback-list-section {
  margin-top: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.section-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.list-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feedback-item {
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.feedback-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feedback-item.status-solved {
  border-left: 4px solid #52c41a;
}

.feedback-item.status-ignored {
  border-left: 4px solid #d9d9d9;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.feedback-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  display: inline-block;
}

.feedback-meta {
  text-align: right;
}

.feedback-time {
  color: var(--text-secondary);
  font-size: 12px;
}

.feedback-content {
  color: var(--text-secondary);
}

.feedback-description {
  margin: 0 0 12px 0;
  line-height: 1.6;
  color: var(--text-secondary);
}

.feedback-details {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-label {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 100px;
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  word-break: break-word;
}

.empty-feedback {
  text-align: center;
  padding: 40px 0;
}

.pagination-wrapper {
  text-align: center;
  margin-top: 24px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .user-bug-report-page {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .list-controls {
    flex-wrap: wrap;
  }

  .feedback-header {
    flex-direction: column;
    gap: 8px;
  }

  .detail-row {
    flex-direction: column;
  }

  .detail-label {
    min-width: auto;
    margin-bottom: 4px;
  }
}

/* 暗色主题适配 */
.dark-theme .user-bug-report-page {
  background: var(--background);
}

.dark-theme .page-header h1 {
  color: var(--text-primary);
}

.dark-theme .page-header p {
  color: var(--text-secondary);
}

.dark-theme .submit-form-card {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .section-header {
  border-bottom-color: var(--border-color);
}

.dark-theme .feedback-item {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .feedback-header {
  border-bottom-color: var(--border-color);
}

.dark-theme .feedback-title h3 {
  color: var(--text-primary);
}

.dark-theme .feedback-time {
  color: var(--text-secondary);
}

.dark-theme .feedback-description {
  color: var(--text-secondary);
}

.dark-theme .detail-label {
  color: var(--text-primary);
}

.dark-theme .detail-value {
  color: var(--text-secondary);
}

.dark-theme .feedback-details {
  border-top-color: var(--border-color);
}
</style>
