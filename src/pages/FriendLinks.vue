<template>
  <div>
    <div class="friend-wrap">
      <div class="friend-main">
        <!-- 搜索和申请区域 -->
        <div class="header-section">
          <div class="seasonal-banner-wrapper">
            <img :src="currentSeasonBanner" :alt="currentSeason + ' banner'" class="seasonal-banner" />
          </div>

          <div class="header-content">
            <div class="search-wrapper">
              <div class="search-inner">
                <i class="fas fa-search search-prefix-icon"></i>
                <input
                  type="text"
                  v-model="searchText"
                  :placeholder="$t('pages.friendLinksPage.searchPlaceholder')"
                  @keyup.enter="handleSearch"
                  class="minimal-search-input"
                />
              </div>
            </div>
          </div>
        </div>

        <hr />

        <!-- {{ $t('pages.friendLinksPage.recommendLinks') }}滚动区域 -->
        <div class="recommend-section" v-if="recommendLinks.length > 0">
          <h3>{{ $t('pages.friendLinksPage.recommendLinks') }}</h3>
          <div class="recommend-scroll">
            <div class="recommend-container" :style="{ width: recommendLinks.length * 280 + 'px' }">
              <div v-for="link in recommendLinks" :key="link.id" class="recommend-item" @click="visitSite(link)">
                <img :src="link.siteLogo" :alt="link.siteName" class="site-logo">
                <div class="site-info">
                  <h4>{{ link.siteName }}</h4>
                  <p>{{ link.siteDesc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div class="apply-header-row">
          <div style="font-size: 20px;font-weight: bold"><i class="fas fa-seedling"></i>{{ $t('pages.friendLinksPage.applyMethod') }}</div>
          <button class="custom-apply-btn" @click="showApplyModal">
            <i class="fas fa-plus"></i>
            <span>{{ $t('pages.friendLinksPage.applyJoin') }}</span>
          </button>
        </div>
        <div>
          <blockquote>
            <div>{{ $t('pages.friendLinksPage.applyMethodDesc1') }}</div>
            <div>{{ $t('pages.friendLinksPage.applyMethodDesc2') }}<i class="fas fa-ban"></i><i class="fas fa-ban"></i><i class="fas fa-ban"></i></div>
          </blockquote>
        </div>

        <hr />

        <h2><i class="fas fa-medal"></i>{{ $t('pages.friendLinksPage.friendLinks') }}</h2>
        <div class="category-filter">
          <a-radio-group v-model:value="currentType" @change="handleTypeChange" button-style="solid">
            <a-radio-button value="">{{ $t('pages.friendLinksPage.all') }}</a-radio-button>
            <a-radio-button v-for="type in SITE_TYPES" :key="type.value" :value="type.value">
              {{ type.name }}
            </a-radio-button>
          </a-radio-group>
        </div>
        <div class="friend-cards">
          <div v-for="link in friendLinks" :key="link.id" class="friend-card" @click="visitSite(link)">
            <div class="card-content">
              <div class="card-header">
                <img
                  :src="link.siteLogo"
                  :alt="link.siteName"
                  class="site-avatar"
                  @error="handleImageError($event)"
                />
                <div class="site-info">
                  <h3 class="site-name">
                    <span v-if="link.weight > 80" class="weight-icon"><i class="fas fa-fire"></i></span>
                    {{ link.siteName }}
                  </h3>
                  <p class="site-type">{{ getSiteTypeLabel(link.siteType) }}</p>
                </div>
              </div>
              <p class="site-desc" :title="link.siteDesc">{{ link.siteDesc }}</p>
              <div class="site-stats">
                <span class="stat-item">
                  <i class="fas fa-eye"></i> {{ link.viewCount || 0 }}
                </span>
                <span class="stat-item">
                  <i class="fas fa-hand-point-up"></i> {{ link.clickCount || 0 }}
                </span>
                <span class="stat-item time">
                  <i class="fas fa-calendar-alt"></i> {{ formatTime(link.createTime) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr />

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <a-button
            :loading="false"
            @click="loadMore"
            size="large"
            type="primary"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin loading-icon"></i>
            {{ loading ? $t('pages.friendLinksPage.loading') : $t('pages.friendLinksPage.loadMore') }}
          </a-button>
        </div>

        <!-- 没有更多数据提示 -->
        <div v-else-if="friendLinks.length > 0" class="no-more">
          <p>{{ $t('pages.friendLinksPage.noMoreData') }}</p>
        </div>

        <!-- 添加自定义弹框 -->
        <div v-if="showApplyDialog" class="custom-dialog-overlay" @click.self="showApplyDialog = false">
          <div class="custom-dialog-content background-opacity shadow-box">
            <div class="dialog-header">
              <div class="dialog-title">
                <span class="emoji"><i class="fas fa-handshake"></i></span> {{ $t('pages.friendLinksPage.applyFriendLink') }}
              </div>
              <div class="dialog-close" @click="showApplyDialog = false">×</div>
            </div>

            <div class="dialog-body">
              <div class="welcome-text">
                <span class="emoji"><i class="fas fa-hand-paper"></i></span> {{ $t('pages.friendLinksPage.welcomeExchange') }}
              </div>

              <div class="form-container">
                <div class="form-left">
                  <div class="apply-section">
                    <div class="section-title">
                      <span class="emoji"><i class="fas fa-edit"></i></span> {{ $t('pages.friendLinksPage.applyMethod') }}
                    </div>
                    <div class="apply-steps">
                      <div class="step">
                        <span class="step-num">1</span>
                        <span class="step-text">{{ $t('pages.friendLinksPage.step1') }}</span>
                      </div>
                      <div class="step">
                        <span class="step-num">2</span>
                        <span class="step-text">{{ $t('pages.friendLinksPage.step2') }}</span>
                      </div>
                      <div class="step">
                        <span class="step-num">3</span>
                        <span class="step-text">{{ $t('pages.friendLinksPage.step3') }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- {{ $t('pages.friendLinksPage.siteInfoTitle') }} -->
                  <div class="site-info-section">
                    <div class="section-title">
                      <span class="emoji"><i class="fas fa-home"></i></span> {{ $t('pages.friendLinksPage.siteInfoTitle') }}
                    </div>
                    <div class="site-info-content">
                      <div class="info-item">
                        <span class="label">{{ $t('pages.friendLinksPage.siteNameLabel') }}</span>
                        <span class="value">{{ siteName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ $t('pages.friendLinksPage.siteUrlLabel') }}</span>
                        <span class="value">{{ siteUrl }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ $t('pages.friendLinksPage.siteDescLabel') }}</span>
                        <span class="value">{{ siteDesc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-right">
                  <div class="form-section">
                    <div class="section-title">
                      <span class="emoji"><i class="fas fa-clipboard-list"></i></span> {{ $t('pages.friendLinksPage.fillInfo') }}
                    </div>
                    <div class="form-item">
                      <div class="form-group">
                        <input type="text" v-model="form.siteName" :placeholder="$t('pages.friendLinksPage.siteNamePlaceholder')" class="custom-input">
                      </div>
                      <div class="form-group">
                        <input type="text" v-model="form.siteUrl" :placeholder="$t('pages.friendLinksPage.siteUrlPlaceholder')" class="custom-input">
                      </div>
                      <label>{{ $t('pages.friendLinksPage.siteLogoLabel') }}</label>
                      <div class="logo-input-group">
                        <Upload
                          v-model:file-list="fileList"
                          name="file"
                          :show-upload-list="false"
                          :before-upload="beforeUpload"
                          :custom-request="customRequest"
                          @change="handleFileChange"
                        >
                          <div v-if="imageUrl" class="uploaded-image">
                            <img :src="imageUrl" alt="{{ $t('pages.friendLinksPage.siteLogoLabel') }}" />
                            <div class="upload-overlay">
                              <i class="fas fa-plus"></i>
                              <div class="ant-upload-text">{{ $t('pages.friendLinksPage.changeImage') }}</div>
                            </div>
                          </div>
                          <div v-else class="upload-button">
                            <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-plus"></i>
                            <div class="ant-upload-text">{{ $t('pages.friendLinksPage.uploadLogo') }}</div>
                          </div>
                        </Upload>
                        <div class="url-input">
                          <input
                            type="text"
                            :placeholder="$t('pages.friendLinksPage.logoUrlPlaceholder')"
                            :value="form.siteLogo"
                            @input="handleLogoUrlInput"
                          />
                        </div>
                      </div>
                      <div class="form-tip">{{ $t('pages.friendLinksPage.uploadTip') }}</div>
                    </div>
                    <div class="form-group">
                      <textarea v-model="form.siteDesc" :placeholder="$t('pages.friendLinksPage.siteDescPlaceholder')" class="custom-textarea"></textarea>
                    </div>
                    <div class="form-group">
                      <input type="text" v-model="form.ownerName" :placeholder="$t('pages.friendLinksPage.ownerNamePlaceholder')" class="custom-input">
                    </div>
                    <div class="form-group">
                      <input type="text" v-model="form.ownerContact" :placeholder="$t('pages.friendLinksPage.ownerContactPlaceholder')" class="custom-input">
                    </div>
                    <div class="form-group">
                      <select v-model="form.siteType" class="custom-select">
                        <option value="" disabled selected>{{ $t('pages.friendLinksPage.selectTypePlaceholder') }}</option>
                        <option v-for="type in SITE_TYPES" :key="type.value" :value="type.value">
                          {{ type.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dialog-footer">
              <button class="submit-btn" @click="submitApply">
                <span class="emoji">✨</span> {{ $t('pages.friendLinksPage.submitApply') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { message, Upload } from 'ant-design-vue'
import type { FormInstance, UploadChangeParam, UploadProps } from 'ant-design-vue'
import { SearchOutlined, PlusOutlined, EyeOutlined, CalendarOutlined, LoadingOutlined } from '@ant-design/icons-vue'
import type { FriendLink } from '@/api/friendLinkController'
import { formatTime } from '@/utils/dateUtils'
import {
  listRecommendFriendLinksUsingGet,
  listFriendLinksByPageUsingGet,
  addFriendLinkUsingPost,
  increaseClickCountUsingPost
} from '@/api/friendLinkController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { getRandomCoverImage } from '@/utils/imageUtils'
import { uploadPostImageUsingPost } from '@/api/pictureController'

import springBanner from '@/assets/season/spring.png'
import summerBanner from '@/assets/season/summer.png'
import autumnBanner from '@/assets/season/autumn.png'
import winterBanner from '@/assets/season/winter.png'

// 季节性横幅图片映射
const bannerImages = {
  spring: springBanner,
  summer: summerBanner,
  autumn: autumnBanner,
  winter: winterBanner
}

// 获取当前季节
const getCurrentSeason = () => {
  const now = new Date()
  const month = now.getMonth() + 1

  // 春季: 3月 - 5月
  if (month >= 3 && month <= 5) {
    return 'spring'
  }
  // 夏季: 6月 - 8月
  if (month >= 6 && month <= 8) {
    return 'summer'
  }
  // 秋季: 9月 - 11月
  if (month >= 9 && month <= 11) {
    return 'autumn'
  }
  // 冬季: 12月 - 2月
  return 'winter'
}

// 当前季节
const currentSeason = ref(getCurrentSeason())

// 当前季节的横幅图片
const currentSeasonBanner = ref(bannerImages[currentSeason.value])

// 初始化横幅
onMounted(() => {
  currentSeason.value = getCurrentSeason()
  currentSeasonBanner.value = bannerImages[currentSeason.value]
})

const loginUserStore = useLoginUserStore()

// 类型定义
interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
}

// 网站类型定义
const SITE_TYPES = [
  { name: t('pages.friendLinksPage.types.PERSONAL_BLOG'), value: 'PERSONAL_BLOG' },
  { name: t('pages.friendLinksPage.types.TECH_COMMUNITY'), value: 'TECH_COMMUNITY' },
  { name: t('pages.friendLinksPage.types.RESOURCE_SHARING'), value: 'RESOURCE_SHARING' },
  { name: t('pages.friendLinksPage.types.DESIGN_INSPIRATION'), value: 'DESIGN_INSPIRATION' },
  { name: t('pages.friendLinksPage.types.TOOL_NAVIGATION'), value: 'TOOL_NAVIGATION' },
  { name: t('pages.friendLinksPage.types.NEWS_INFORMATION'), value: 'NEWS_INFORMATION' },
  { name: t('pages.friendLinksPage.types.LEARNING_EDUCATION'), value: 'LEARNING_EDUCATION' },
  { name: t('pages.friendLinksPage.types.LIFE_SHARING'), value: 'LIFE_SHARING' },
  { name: t('pages.friendLinksPage.types.OTHERS'), value: 'OTHERS' }
]

// 搜索和筛选状态
const searchText = ref('')
const currentType = ref('')
const siteTypes = ref(SITE_TYPES.map(type => type.value))
const typeCounts = ref<Record<string, number>>({})

// 加载状态
const loading = ref(false)
const hasMore = ref(true)
const current = ref(1)
const pageSize = ref(12)

// 友链数据
const friendLinks = ref<FriendLink[]>([])
const recommendLinks = ref<FriendLink[]>([])

// {{ $t('pages.friendLinksPage.siteInfoTitle') }}
const siteName = ref(t('pages.friendLinksPage.defaultSiteName'))
const siteUrl = ref('https://lumenglover.com')
const siteLogo = ref('https://example.com/logo.png')
const siteDesc = ref(t('pages.friendLinksPage.defaultSiteDesc'))

// 表单数据
const form = ref({
  siteName: '',
  siteUrl: '',
  siteLogo: '',
  siteDesc: '',
  ownerName: '',
  ownerContact: '',
  siteType: ''
})

// 弹框显示状态
const showApplyDialog = ref(false)

// 上传相关状态
const uploading = ref(false)
const imageUrl = ref('')

// 表单验证规则
const applyRules = {
  siteName: [{ required: true, message: t('pages.friendLinksPage.valSiteName'), trigger: 'blur' }],
  siteUrl: [
    { required: true, message: t('pages.friendLinksPage.valSiteUrl'), trigger: 'blur' },
    { type: 'url', message: t('pages.friendLinksPage.valValidUrl'), trigger: 'blur' }
  ],
  siteLogo: [
    { required: true, message: t('pages.friendLinksPage.valLogoUrl'), trigger: 'blur' },
    { type: 'url', message: t('pages.friendLinksPage.valValidLogo'), trigger: 'blur' }
  ],
  siteDesc: [{ required: true, message: t('pages.friendLinksPage.valSiteDesc'), trigger: 'blur' }],
  ownerName: [{ required: true, message: t('pages.friendLinksPage.valOwnerName'), trigger: 'blur' }],
  ownerContact: [{ required: true, message: t('pages.friendLinksPage.valOwnerContact'), trigger: 'blur' }],
  siteType: [{ required: true, message: t('pages.friendLinksPage.selectTypePlaceholder'), trigger: 'change' }]
}

// 网站类型映射
const SITE_TYPE_MAP = {
  get 'PERSONAL_BLOG'() { return t('pages.friendLinksPage.types.PERSONAL_BLOG'); },
  get 'TECH_COMMUNITY'() { return t('pages.friendLinksPage.types.TECH_COMMUNITY'); },
  get 'RESOURCE_SHARING'() { return t('pages.friendLinksPage.types.RESOURCE_SHARING'); },
  get 'DESIGN_INSPIRATION'() { return t('pages.friendLinksPage.types.DESIGN_INSPIRATION'); },
  get 'TOOL_NAVIGATION'() { return t('pages.friendLinksPage.types.TOOL_NAVIGATION'); },
  get 'NEWS_INFORMATION'() { return t('pages.friendLinksPage.types.NEWS_INFORMATION'); },
  get 'LEARNING_EDUCATION'() { return t('pages.friendLinksPage.types.LEARNING_EDUCATION'); },
  get 'LIFE_SHARING'() { return t('pages.friendLinksPage.types.LIFE_SHARING'); },
  get 'OTHERS'() { return t('pages.friendLinksPage.types.OTHERS'); }
} as const

// 获取网站类型标签
const getSiteTypeLabel = (type: string) => {
  // 将类型转换为大写
  const upperType = type?.toUpperCase() || ''
  return SITE_TYPE_MAP[upperType as keyof typeof SITE_TYPE_MAP] || t('pages.friendLinksPage.types.OTHERS')
}

// 获取{{ $t('pages.friendLinksPage.recommendLinks') }}
const fetchRecommendLinks = async () => {
  try {
    const res = await listRecommendFriendLinksUsingGet({ limit: 12 })
    if (res.data?.code === 0 && res.data.data) {
      recommendLinks.value = res.data.data
    }
  } catch (error) {
    message.error(t('pages.friendLinksPage.errGetRecommend'))
  }
}

// 获取友链列表
const fetchFriendLinks = async (append = false) => {
  if(loading.value || !hasMore.value) return;

  loading.value = true
  try {
    const res = await listFriendLinksByPageUsingGet({
      current: current.value,
      pageSize: pageSize.value,
      siteType: currentType.value || undefined,
      siteName: searchText.value || undefined,
      sortField: 'createTime',
      sortOrder: 'descend'
    })
    if (res.data?.code === 0 && res.data.data) {
      if (append) {
        friendLinks.value = [...friendLinks.value, ...res.data.data.records]
      } else {
        friendLinks.value = res.data.data.records
      }

      // 判断是否还有更多数据
      hasMore.value = res.data.data.records.length === pageSize.value
    }
  } catch (error) {
    message.error(t('pages.friendLinksPage.errGetList'))
  } finally {
    loading.value = false
  }
}

// 访问网站
const visitSite = (site: FriendLink) => {
  window.open(site.siteUrl, '_blank')
  // 增加点击次数
  increaseClickCountUsingPost({ id: site.id })
}

// 处理搜索
const handleSearch = (value: string) => {
  searchText.value = value
  current.value = 1
  hasMore.value = true
  fetchFriendLinks()
}

// 处理类型切换
const handleTypeChange = () => {
  current.value = 1
  hasMore.value = true
  fetchFriendLinks()
}

// 加载更多
const loadMore = async () => {
  current.value++
  await fetchFriendLinks(true)
}

// 打开弹框
const showApplyModal = () => {
  if (!loginUserStore.loginUser.id) {
    message.warning(t('pages.friendLinksPage.warnLogin'))
    return
  }
  showApplyDialog.value = true
}

// 关闭弹框
const hideApplyModal = () => {
  showApplyDialog.value = false
  form.value = {
    siteName: '',
    siteUrl: '',
    siteLogo: '',
    siteDesc: '',
    ownerName: '',
    ownerContact: '',
    siteType: ''
  }
}

// {{ $t('pages.friendLinksPage.submitApply') }}
const submitApply = async () => {
  try {
    // 表单验证
    if (!form.value.siteName || !form.value.siteUrl || !form.value.siteDesc) {
      message.error(t('pages.friendLinksPage.errFillAll'))
      return
    }

    // TODO: 调用API{{ $t('pages.friendLinksPage.submitApply') }}
    await addFriendLinkUsingPost(form.value)
    message.success(t('pages.friendLinksPage.applySuccess'))
    hideApplyModal()
  } catch (error) {
    message.error(t('pages.friendLinksPage.applyFail'))
  }
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = getRandomCoverImage()
}

// 处理文件上传
const handleUpload = async (file: File): Promise<string> => {
  try {
    const res = await uploadPostImageUsingPost({}, {}, file)
    if (res.data?.code === 0 && res.data?.data?.url) {
      return res.data.data.url
    }
    throw new Error(t('pages.friendLinksPage.uploadFail'))
  } catch (error) {
    console.error(t('pages.friendLinksPage.uploadFail') + ':', error)
    throw error
  }
}

// 处理文件变更
const handleFileChange = async (info: UploadChangeParam) => {
  const { file } = info
  if (file.status === 'uploading') {
    uploading.value = true
    return
  }
  if (file.status === 'done' && file.response) {
    uploading.value = false
    // 更新表单数据和预览图片
    if (typeof file.response === 'string') {
      // 直接返回的是URL字符串
      form.value.siteLogo = file.response
      imageUrl.value = file.response
    } else if (file.response.data?.url) {
      // 返回的是完整的图片对象
      form.value.siteLogo = file.response.data.url
      imageUrl.value = file.response.data.url
    }
  }
}

// 处理在线图片地址输入
const handleLogoUrlInput = (e: Event) => {
  const url = (e.target as HTMLInputElement).value
  if (url) {
    // 简单的URL格式验证
    if (url.startsWith('http://') || url.startsWith('https://')) {
      form.value.siteLogo = url
      imageUrl.value = url
    } else {
      message.error(t('pages.friendLinksPage.validImageUrl'))
    }
  }
}

// 上传前校验
const beforeUpload = (file: File) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error(t('pages.friendLinksPage.onlyImage'))
    return false
  }
  // 检查文件大小
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error(t('pages.friendLinksPage.limit2MB'))
    return false
  }
  return true
}

// 自定义上传方法
const customRequest = async (options: any) => {
  const { file, onSuccess, onError } = options
  try {
    const url = await handleUpload(file)
    if (url) {
      onSuccess(url)
    } else {
      onError(new Error(t('pages.friendLinksPage.uploadFail')))
    }
  } catch (error) {
    onError(error)
  }
}

// 触底检测
const handleScroll = () => {
  // 检测是否滚动到底部
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const windowHeight = document.documentElement.clientHeight || window.innerHeight
  const documentHeight = document.documentElement.scrollHeight || document.body.scrollHeight

  // 当距离底部小于300px时，自动加载更多
  if (windowHeight + scrollTop >= documentHeight - 300) {
    if (!loading.value && hasMore.value) {
      loadMore()
    }
  }
}

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchRecommendLinks(),
    fetchFriendLinks()
  ])

  // 添加滚动事件监听
  window.addEventListener('scroll', handleScroll)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.friend-wrap {
  min-height: 100vh;
  padding-bottom: 44px;
}

.friend-main {
  max-width: 1400px;
  margin: 0 auto;
}

/* 美化分割线 */
hr {
  position: relative;
  margin: 40px auto;
  border: 2px dashed #36cfc9;
  overflow: visible;
}

hr:before {
  position: absolute;
  top: -14px;
  left: 5%;
  color: #36cfc9;
  content: '❄';
  font-size: 30px;
  line-height: 1;
  transition: all 1s ease-in-out;
}

hr:hover:before {
  left: calc(95% - 20px);
}

.header-section {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.seasonal-banner-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.seasonal-banner-wrapper :deep(.seasonal-banner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.seasonal-banner {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 24px;
}

.search-wrapper {
  flex: 1;
  max-width: 500px;
}

.search-inner {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 0 20px;
  height: 48px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  &:hover, &:focus-within {
    background: rgba(255, 255, 255, 0.85);
    border-color: #36cfc9;
    box-shadow: 0 8px 32px rgba(54, 207, 201, 0.15);
  }

  .search-prefix-icon {
    color: #8c8c8c;
    margin-right: 12px;
    font-size: 16px;
  }
}

.minimal-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  color: #262626;
  width: 100%;

  &::placeholder {
    color: #bfbfbf;
  }
}

.apply-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.custom-apply-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #36cfc9, #13c2c2);
  color: white;
  border: none;
  border-radius: 20px;
  height: 36px;
  padding: 0 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(19, 194, 194, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(19, 194, 194, 0.3);
  background: linear-gradient(135deg, #40e0d0, #36cfc9);
}

.custom-apply-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .header-content {
    padding: 32px 16px;
  }
  .search-wrapper {
    width: 100% !important;
    max-width: none !important;
  }
}

.apply-box .ant-btn {
  height: 52px;
  border-radius: 26px;
  padding: 0 30px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #00c6fb, #005bea);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 150, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.apply-box .ant-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #00c6fb, #0046b8);
  box-shadow: 0 8px 20px rgba(0, 150, 255, 0.4);
}

.apply-box .ant-btn .anticon {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.apply-box .ant-btn:hover .anticon {
  transform: rotate(90deg);
}

/* {{ $t('pages.friendLinksPage.recommendLinks') }}滚动区域 */
.recommend-section {
  margin-bottom: 30px;
}

.recommend-section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #1d1d1f;
}

.recommend-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  position: relative;
}

.recommend-scroll::-webkit-scrollbar {
  display: none;
}

.recommend-container {
  display: inline-flex;
  animation: scrollRecommend 30s linear infinite;
  padding: 4px;
}

.recommend-container:hover {
  animation-play-state: paused;
}

@keyframes scrollRecommend {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.recommend-item {
  flex: 0 0 260px;
  margin-right: 20px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.recommend-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recommend-item .site-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.recommend-item .site-info {
  flex: 1;
  min-width: 0;
}

.recommend-item .site-info h4 {
  margin: 0 0 4px;
  font-size: 15px;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommend-item .site-info p {
  margin: 0;
  font-size: 13px;
  color: #86868b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media screen and (max-width: 700px) {
  .friend-main {
    padding: 4px 6px;
  }

  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .search-box {
    max-width: none;
  }

  .apply-box {
    text-align: center;
  }

  .friend-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 10px;
  }

  .friend-card {
    margin: 0;
  }

  .card-content {
    padding: 10px;
  }

  .site-avatar {
    width: 40px;
    height: 40px;
  }

  .site-name {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .site-desc {
    font-size: 12px;
    margin: 6px 0;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 2.8em;
    line-height: 1.4;
  }

  .site-stats {
    font-size: 11px;
    gap: 6px;
    margin-top: 6px;
    padding-top: 6px;
  }

  blockquote {
    margin: 15px 0;
    padding: 10px;
    font-size: 14px;
  }

  h2 {
    font-size: 18px !important;
  }
}

@media screen and (max-width: 480px) {
  .friend-cards {
    gap: 8px;
    padding: 8px;
  }

  .card-content {
    padding: 8px;
  }

  .site-name {
    font-size: 13px;
  }

  .site-desc {
    font-size: 11px;
  }
}

.friend-main h2 {
  font-size: 20px;
}

blockquote {
  line-height: 2;
  border-left: 0.2rem solid #ed6ea0;
  padding: 10px 1rem;
  background-color: #ffe6fa;
  border-radius: 4px;
  margin: 20px auto;
  color: var(--maxGreyFont);
}

.friend-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.friend-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.friend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 150, 255, 0.2);
}

.card-content {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.site-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
  border: 2px solid rgba(0, 150, 255, 0.1);
  transition: all 0.3s ease;
  background: #f5f5f5;
}

.friend-card:hover .site-avatar {
  border-color: rgba(0, 150, 255, 0.3);
  transform: scale(1.05);
}

.site-info {
  flex: 1;
  min-width: 0;
}

.site-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.4;
}

.weight-icon {
  font-size: 16px;
}

.site-type {
  font-size: 13px;
  color: #0096ff;
  margin: 0;
  background: rgba(0, 150, 255, 0.08);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  font-weight: 500;
}

.site-desc {
  font-size: 14px;
  color: #666;
  margin: 16px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.6;
  min-height: 44px;
}

.site-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: #999;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item .anticon {
  font-size: 14px;
  opacity: 0.8;
}

.stat-item.time {
  margin-left: auto;
}

/* 分类导航样式 */
.category-filter {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 24px auto;
  padding: 0 20px;
  max-width: 1200px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  position: relative;
}

.category-filter::-webkit-scrollbar {
  display: none;
}

.category-filter .ant-radio-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 8px 0;
}

.category-filter .ant-radio-button-wrapper {
  height: 36px;
  line-height: 34px;
  padding: 0 20px;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #666;
  font-size: 14px;
  transition: all 0.3s ease;
  margin: 0;
  position: relative;
  overflow: hidden;
}

.category-filter .ant-radio-button-wrapper:not(:first-child)::before {
  display: none;
}

.category-filter .ant-radio-button-wrapper:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
  z-index: 1;
}

.category-filter .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.25);
}

.category-filter .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
  background: #40a9ff;
  border-color: #40a9ff;
  color: #fff;
}

.category-filter .ant-radio-button-wrapper span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.category-filter .count {
  font-size: 12px;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  line-height: 1;
  min-width: 20px;
  text-align: center;
}

.ant-radio-button-wrapper-checked .count {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .category-filter {
    margin:  8px;
    padding: 0 16px;
    justify-content: flex-start;
  }

  .category-filter .ant-radio-group {
    flex-wrap: nowrap;
    justify-content: flex-start;
    padding: 4px 0;
    padding-top: 12px;
  }

  .category-filter .ant-radio-button-wrapper {
    height: 32px;
    line-height: 30px;
    padding: 0 16px;
    font-size: 13px;
    flex: 0 0 auto;
  }

  .friend-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }

  .card-content {
    padding: 12px;
  }

  .card-header {
    gap: 8px;
    margin-bottom: 8px;
  }

  .site-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .site-name {
    font-size: 14px;
    margin: 0 0 4px;
  }

  .site-type {
    font-size: 11px;
    padding: 2px 8px;
  }

  .site-desc {
    font-size: 12px;
    margin: 6px 0;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 2.8em;
    line-height: 1.4;
  }

  .site-stats {
    font-size: 11px;
    gap: 8px;
    margin-top: 8px;
    padding-top: 8px;
  }

  .stat-item .anticon {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .friend-cards {
    padding: 8px;
  }
}

/* 加载更多按钮样式 */
.load-more {
  text-align: center;
  margin: 24px 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.no-more {
  text-align: center;
  margin: 24px 0;
  color: #999;
}

@media (max-width: 768px) {
  .pagination-wrapper {
    margin: 16px 0;
    padding: 0 8px;
  }

  .pagination-wrapper :deep(.ant-pagination) {
    gap: 2px;
  }

  .pagination-wrapper :deep(.ant-pagination-item),
  .pagination-wrapper :deep(.ant-pagination-prev),
  .pagination-wrapper :deep(.ant-pagination-next) {
    min-width: 28px;
    height: 28px;
    line-height: 26px;
  }

  /* 在移动端隐藏页码跳转器和部分页码 */
  .pagination-wrapper :deep(.ant-pagination-jump-prev),
  .pagination-wrapper :deep(.ant-pagination-jump-next),
  .pagination-wrapper :deep(.ant-pagination-options) {
    display: none !important;
  }

  /* 只显示当前页码附近的页码 */
  .pagination-wrapper :deep(.ant-pagination-item:not(.ant-pagination-item-active):not(.ant-pagination-item-1):not(.ant-pagination-item-2):not(.ant-pagination-item-3)) {
    display: none;
  }
}

@media (max-width: 375px) {
  .pagination-wrapper :deep(.ant-pagination-item),
  .pagination-wrapper :deep(.ant-pagination-prev),
  .pagination-wrapper :deep(.ant-pagination-next) {
    min-width: 24px;
    height: 24px;
    line-height: 22px;
    font-size: 12px;
  }
}

@media screen and (max-width: 700px) {
  .friend-main {
    padding: 4px 6px;
  }

  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .search-box {
    max-width: none;
  }

  .apply-box {
    text-align: center;
  }

  .friend-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 10px;
  }

  .friend-card {
    margin: 0;
  }

  .card-content {
    padding: 10px;
  }

  .site-avatar {
    width: 40px;
    height: 40px;
  }

  .site-name {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .site-desc {
    font-size: 12px;
    margin: 6px 0;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 2.8em;
    line-height: 1.4;
  }

  .site-stats {
    font-size: 11px;
    gap: 6px;
    margin-top: 6px;
    padding-top: 6px;
  }

  blockquote {
    margin: 15px 0;
    padding: 10px;
    font-size: 14px;
  }

  h2 {
    font-size: 18px !important;
  }
}

@media (prefers-color-scheme: dark) {
  .friend-main {
    background: rgba(0, 0, 0, 0.8);
  }

  blockquote {
    background: #2a2a2a;
    border-left-color: #ed6ea0;
    color: #999;
  }

  .friend-card {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.05);
  }

  .friend-card:hover {
    border-color: rgba(0, 150, 255, 0.3);
    background: rgba(255, 255, 255, 0.05);
  }

  .site-name {
    color: #e5e5e5;
  }

  .site-type {
    background: rgba(0, 150, 255, 0.15);
    color: #4db8ff;
  }

  .site-desc {
    color: #999;
  }

  .site-stats {
    color: #888;
    border-top-color: rgba(255, 255, 255, 0.05);
  }

  .site-avatar {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
  }

  .friend-card:hover .site-avatar {
    border-color: rgba(0, 150, 255, 0.4);
  }

  .category-filter .ant-radio-button-wrapper {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
    color: #999;
  }

  .category-filter .ant-radio-button-wrapper:hover {
    background: rgba(24, 144, 255, 0.1);
    border-color: #1890ff;
    color: #1890ff;
  }

  .category-filter .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
    background: #1890ff;
    border-color: #1890ff;
    color: #fff;
  }

  .category-filter .count {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* 网站分类样式 */
.category-section {
  margin: 24px 0;
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 24px rgba(0, 150, 255, 0.1);
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.category-item {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #1d1d1f;
  border: 1px solid rgba(0, 150, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 150, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-item:hover {
  background: linear-gradient(135deg, #00c6fb, #005bea);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 150, 255, 0.2);
  border-color: transparent;
}

.category-item.active {
  background: linear-gradient(135deg, #00c6fb, #005bea);
  color: white;
  font-weight: 500;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(0, 150, 255, 0.2);
}

/* 分页器样式 */
.pagination-container {
  margin-top: 32px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 24px rgba(0, 150, 255, 0.1);
}

:deep(.ant-pagination-item) {
  border-radius: 8px;
  border: 1px solid rgba(0, 150, 255, 0.1);
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

:deep(.ant-pagination-item-active) {
  background: linear-gradient(135deg, #00c6fb, #005bea);
  border-color: transparent;
}

:deep(.ant-pagination-item-active a) {
  color: white !important;
}

:deep(.ant-pagination-prev),
:deep(.ant-pagination-next) {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 150, 255, 0.1);
}

:deep(.ant-pagination-prev:hover),
:deep(.ant-pagination-next:hover),
:deep(.ant-pagination-item:hover) {
  border-color: #00c6fb;
  color: #00c6fb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 150, 255, 0.1);
}

:deep(.ant-select-selector) {
  border-radius: 8px !important;
  border: 1px solid rgba(0, 150, 255, 0.1) !important;
  background: rgba(255, 255, 255, 0.9) !important;
}

:deep(.ant-select:hover .ant-select-selector) {
  border-color: #00c6fb !important;
}

/* 移动端样式优化 */
@media screen and (max-width: 768px) {
  .friend-wrap {
    padding: -24px;
  }

  .header-section {
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .header-content {
    padding: 28px;
    padding-top: 32px;
    gap: 12px;
    flex-direction: row;
    flex-wrap: nowrap;
  }

  .search-box {
    max-width: none;
    flex: 1;
    border-radius: 24px;
  }

  .search-input :deep(.ant-input) {
    height: 40px;
    font-size: 14px;
    padding-left: 16px;
  }

  .search-input :deep(.ant-input-search-button) {
    height: 40px;
    width: 40px;
    border-radius: 20px;
  }

  .apply-box {
    margin-left: 8px;
  }

  .apply-box .ant-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 20px;
    justify-content: center;
  }

  .apply-box .ant-btn .anticon {
    font-size: 18px;
    margin: 0;
  }

  .apply-box .ant-btn .btn-text {
    display: none;
  }

  hr {
    margin: 30px auto;
    border-width: 1px;
  }

  hr:before {
    font-size: 24px;
    top: -12px;
  }
}

.apply-text {
  display: none;
}

/* 弹框样式 */
.custom-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.custom-dialog-content {
  width: 90%;
  max-width: 900px;
  background: linear-gradient(-45deg, #e8d8b9, #eccec5, #a3e9eb, #bdbdf0, #eec1ea);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
  border-radius: 20px;
  padding: 24px;
  position: relative;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
}

.dialog-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-close {
  font-size: 28px;
  color: #666;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.2);
}

.dialog-close:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: rotate(90deg);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.welcome-text {
  text-align: center;
  font-size: 18px;
  color: #666;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px;
  border-radius: 12px;
}

.form-container {
  display: flex;
  gap: 24px;
}

.form-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-right {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
}

.apply-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
}

.apply-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.5);
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s;
}

.step:hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.8);
}

.step-num {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #00c6fb, #005bea);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.step-text {
  color: #444;
  font-size: 14px;
  flex: 1;
}

.site-info-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
}

.site-info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  gap: 8px;
  line-height: 1.6;
}

.info-item .label {
  color: #666;
  min-width: 80px;
  font-weight: 500;
}

.info-item .value {
  color: #333;
  flex: 1;
}

.dialog-footer {
  padding-top: 20px;
  text-align: center;
}

.submit-btn {
  background: linear-gradient(135deg, #00c6fb, #005bea);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 150, 255, 0.2);
}

.emoji {
  font-size: 1.2em;
}

@media (max-width: 768px) {
  .custom-dialog-content {
    width: 95%;
    max-width: 100%;
    padding: 16px;
    border-radius: 16px;
    height: 90vh;
  }

  .dialog-header {
    padding-bottom: 12px;
  }

  .dialog-title {
    font-size: 20px;
  }

  .welcome-text {
    font-size: 16px;
    margin-bottom: 16px;
    padding: 10px;
  }

  .form-container {
    flex-direction: column;
    gap: 16px;
  }

  .form-left {
    width: 100%;
    gap: 16px;
  }

  .form-right {
    width: 100%;
    padding: 16px;
  }

  .site-info-section {
    display: none;
  }

  .apply-section {
    padding: 16px;
    margin-bottom: 0;
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 12px;
  }

  .apply-steps {
    gap: 12px;
  }

  .step {
    padding: 10px;
  }

  .step-num {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }

  .step-text {
    font-size: 13px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .custom-input,
  .custom-textarea,
  .custom-select {
    padding: 10px 14px;
    font-size: 14px;
  }

  .custom-textarea {
    height: 80px;
  }

  .dialog-footer {
    padding-top: 16px;
  }

  .submit-btn {
    width: 100%;
    justify-content: center;
    padding: 10px 24px;
    font-size: 15px;
  }
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.form-group {
  position: relative;
}

.custom-input, .custom-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.9);
}

.custom-input:focus, .custom-textarea:focus {
  border-color: var(--lightGreen);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 150, 255, 0.1);
}

.custom-textarea {
  height: 100px;
  resize: none;
}

.custom-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.9);
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}

.custom-select:focus {
  border-color: var(--lightGreen);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 150, 255, 0.1);
}

.custom-select option {
  padding: 12px;
}

.custom-input::placeholder,
.custom-textarea::placeholder {
  color: #999;
}

.form-group:hover .custom-input,
.form-group:hover .custom-textarea,
.form-group:hover .custom-select {
  border-color: rgba(0, 150, 255, 0.3);
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.upload-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.logo-uploader {
  width: 100%;
  text-align: center;
}

.logo-uploader :deep(.ant-upload) {
  width: 128px;
  height: 128px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.logo-uploader :deep(.ant-upload:hover) {
  border-color: var(--lightGreen);
  background: rgba(255, 255, 255, 0.9);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #666;
}

.upload-text {
  font-size: 13px;
}

.uploaded-image {
  position: relative;
  width: 128px;
  height: 128px;
  border-radius: 8px;
  overflow: hidden;
}

.uploaded-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.uploaded-image:hover .upload-overlay {
  opacity: 1;
}

.upload-button {
  width: 128px;
  height: 128px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-button:hover {
  border-color: #40a9ff;
}

.ant-upload-text {
  margin-top: 8px;
  font-size: 14px;
}

.logo-input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.url-input {
  flex: 1;
}

.url-input input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s;
}

.url-input input:hover {
  border-color: #40a9ff;
}

.url-input input:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>



