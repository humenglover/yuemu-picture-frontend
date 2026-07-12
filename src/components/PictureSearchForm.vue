<template>
  <div class="yuemu-picture-search-form">
    <div class="yuemu-apple-search-container">
      <div class="yuemu-apple-search-box">
        <i class="fas fa-search yuemu-search-icon"></i>
        <input
          type="text"
          v-model="searchParams.searchText"
          :placeholder="t('components.pictureSearchForm.exploreInspiration')"
          class="yuemu-apple-search-input"
          @keyup.enter="emit('search', searchParams)"
        >
        <div class="yuemu-search-actions">
          <button class="yuemu-icon-btn yuemu-filter-btn" @click.stop="toggleDropdown">
            <i class="fas fa-sliders-h"></i>
          </button>
          <button
            class="yuemu-apple-primary-btn yuemu-search-btn"
            @click="emit('search', searchParams)"
          >{{ t('components.pictureSearchForm.search') }}</button>
        </div>
      </div>
      <div class="yuemu-apple-dropdown-menu" v-if="showFilterModal" @click.stop>
        <div class="yuemu-dropdown-item" @click="handleColorSearch">
          <div class="yuemu-item-icon-wrap yuemu-color-wrap"><i class="fas fa-palette"></i></div>
          <span>{{ t('components.pictureSearchForm.searchByColor') }}</span>
        </div>
      </div>
      <input type="file" ref="fileInputRef" accept="image/*" style="display: none" @change="handleImageUpload" capture="camera" />
    </div>
    <Teleport to="body">
      <transition name="yuemu-fade">
        <div class="yuemu-apple-overlay" v-if="showColorModal" @click="closeColorModal">
          <div class="yuemu-apple-modal-sheet yuemu-color-modal" @click.stop>
            <div class="yuemu-drag-indicator"></div>
            <div class="yuemu-modal-header">
              <h3>{{ t('components.pictureSearchForm.colorRecognition') }}</h3>
              <button class="yuemu-close-btn" @click="closeColorModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="yuemu-modal-body yuemu-color-body">
              <color-picker
                format="hex"
                @pureColorChange="handleColorChange"
                :disable-alpha="true"
                :disable-history="true"
                shape="square"
              />
            </div>
          </div>
        </div>
      </transition>
      <transition name="yuemu-fade">
        <div class="yuemu-apple-overlay" v-if="showAdvancedFilterModal" @click="closeAdvancedFilterModal">
          <div class="yuemu-apple-modal-sheet yuemu-filter-modal" @click.stop>
            <div class="yuemu-drag-indicator"></div>
            <div class="yuemu-modal-header">
              <h3>{{ t('components.pictureSearchForm.advancedFilter') }}</h3>
              <button class="yuemu-close-btn" @click="closeAdvancedFilterModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="yuemu-modal-body yuemu-scrollable-body">
              <div class="yuemu-filter-section">
                <div class="yuemu-section-title">
                  <span>{{ t('components.pictureSearchForm.pictureCategory') }}</span>
                  <span class="yuemu-clear-text" v-if="tempSearchParams.category" @click.stop="tempSearchParams.category = ''">{{ t('components.pictureSearchForm.clear') }}</span>
                </div>
                <div class="yuemu-apple-list-cell" @click="categoryModalVisible = true">
                  <div class="yuemu-cell-content">
                    <span v-if="!tempSearchParams.category" class="yuemu-placeholder-text">{{ t('components.pictureSearchForm.allCategories') }}</span>
                    <span v-else class="yuemu-selected-text">{{ tempSearchParams.category }}</span>
                  </div>
                  <i class="fas fa-chevron-right yuemu-arrow-icon"></i>
                </div>
              </div>
              <div class="yuemu-filter-section">
                <div class="yuemu-section-title">
                  <span>{{ t('components.pictureSearchForm.contentTags') }}</span>
                  <span class="yuemu-clear-text" v-if="tempSearchParams.tags.length > 0" @click.stop="tempSearchParams.tags = []">{{ t('components.pictureSearchForm.clearSelected') }}</span>
                </div>
                <div class="yuemu-apple-list-cell yuemu-tags-cell" @click="tagModalVisible = true">
                  <div class="yuemu-cell-content yuemu-tags-preview-wrap">
                    <span v-if="tempSearchParams.tags.length === 0" class="yuemu-placeholder-text">{{ t('components.pictureSearchForm.addTags') }}</span>
                    <template v-else>
                      <span class="yuemu-preview-tag" v-for="tag in tempSearchParams.tags" :key="tag">{{ tag }}</span>
                    </template>
                  </div>
                  <i class="fas fa-chevron-right yuemu-arrow-icon"></i>
                </div>
              </div>
              <div class="yuemu-filter-section">
                <div class="yuemu-section-title">
                  <span>{{ t('components.pictureSearchForm.modificationTimeRange') }}</span>
                  <span class="yuemu-clear-text" v-if="startDate || endDate" @click="startDate = ''; endDate = ''">{{ t('components.pictureSearchForm.clear') }}</span>
                </div>
                <div class="yuemu-date-range-inputs">
                  <input type="date" v-model="startDate" class="yuemu-apple-input">
                  <span class="yuemu-separator">-</span>
                  <input type="date" v-model="endDate" class="yuemu-apple-input">
                </div>
              </div>
            </div>
            <div class="yuemu-modal-footer">
              <button class="yuemu-apple-secondary-btn" @click="doClear">{{ t('components.pictureSearchForm.reset') }}</button>
              <button class="yuemu-apple-primary-btn yuemu-full-btn" @click="handleApplyFilter">{{ t('components.pictureSearchForm.viewResults') }}</button>
            </div>
          </div>
        </div>
      </transition>
      <transition name="yuemu-fade">
        <div class="yuemu-apple-overlay yuemu-sub-overlay" v-if="categoryModalVisible" @click="categoryModalVisible = false">
          <div class="yuemu-apple-modal-sheet yuemu-sub-sheet" @click.stop>
            <div class="yuemu-drag-indicator"></div>
            <div class="yuemu-modal-header">
              <button class="yuemu-icon-text-btn" @click="categoryModalVisible = false">
                <i class="fas fa-chevron-left"></i>{{ t('components.pictureSearchForm.return') }}</button>
              <h3>{{ t('components.pictureSearchForm.selectCategory') }}</h3>
              <div class="yuemu-header-placeholder"></div>
            </div>
            <div class="yuemu-sub-search-wrapper">
              <i class="fas fa-search"></i>
              <input type="text" v-model="categorySearchText" :placeholder="t('components.pictureSearchForm.searchCategoryName')" class="yuemu-sub-search-input">
            </div>
            <div class="yuemu-modal-body yuemu-scrollable-body">
              <div class="yuemu-pills-grid">
                <div
                  v-for="category in filteredCategories"
                  :key="category.value"
                  class="yuemu-filter-pill"
                  :class="{ yuemu_active: tempSearchParams.category === category.value }"
                  @click="selectCategory(category.value)"
                >
                  {{ category.label }}
                </div>
              </div>
              <div v-if="filteredCategories.length === 0" class="yuemu-empty-tip">
                <i class="fas fa-inbox"></i>{{ t('components.pictureSearchForm.noMatchingCategory') }}</div>
            </div>
          </div>
        </div>
      </transition>
      <transition name="yuemu-fade">
        <div class="yuemu-apple-overlay yuemu-sub-overlay" v-if="tagModalVisible" @click="tagModalVisible = false">
          <div class="yuemu-apple-modal-sheet yuemu-sub-sheet" @click.stop>
            <div class="yuemu-drag-indicator"></div>
            <div class="yuemu-modal-header">
              <button class="yuemu-icon-text-btn" @click="tagModalVisible = false">
                <i class="fas fa-chevron-left"></i>{{ t('components.pictureSearchForm.return') }}</button>
              <h3>{{ t('components.pictureSearchForm.selectTags') }} ({{ tempSearchParams.tags.length }})</h3>
              <button class="yuemu-text-btn yuemu-clear-text" @click="tempSearchParams.tags = []">{{ t('components.pictureSearchForm.empty') }}</button>
            </div>
            <div class="yuemu-sub-search-wrapper">
              <i class="fas fa-search"></i>
              <input type="text" v-model="tagSearchText" :placeholder="t('components.pictureSearchForm.searchTagName')" class="yuemu-sub-search-input">
            </div>
            <div class="yuemu-modal-body yuemu-scrollable-body">
              <div class="yuemu-pills-grid">
                <div
                  v-for="tag in filteredTags"
                  :key="tag.value"
                  class="yuemu-filter-pill"
                  :class="{ yuemu_active: tempSearchParams.tags.includes(tag.value) }"
                  @click="toggleTag(tag.value)"
                >
                  {{ tag.label }}
                </div>
              </div>
              <div v-if="filteredTags.length === 0" class="yuemu-empty-tip">
                <i class="fas fa-tags"></i>{{ t('components.pictureSearchForm.noMatchingTags') }}</div>
            </div>
            <div class="yuemu-modal-footer">
              <button class="yuemu-apple-primary-btn yuemu-full-btn" @click="tagModalVisible = false">{{ t('components.pictureSearchForm.finishSelection') }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();


import { ref, reactive, watch, onMounted, onUnmounted, defineEmits, defineExpose, computed, nextTick } from 'vue'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
import { listPictureTagCategoryUsingGet, uploadPostImageUsingPost } from '@/api/pictureController'
import { message } from 'ant-design-vue'
interface SearchParams {
  searchText: string
  category: string
  tags: string[]
  startEditTime: Date | null
  endEditTime: Date | null
  format: string[]
}
const emit = defineEmits<{
  (event: 'search', params: SearchParams): void
  (event: 'filter', params: SearchParams): void
  (event: 'colorChange', color: string): void
  (event: 'pictureSearch', imageUrl: string): void
}>()
const searchParams = reactive<SearchParams>({
  searchText: '',
  category: '',
  tags: [],
  startEditTime: null,
  endEditTime: null,
  format: []
})
const tempSearchParams = reactive({
  category: '',
  tags: [] as string[]
})
// 弹窗控制状态
const showFilterModal = ref(false)
const showColorModal = ref(false)
const showAdvancedFilterModal = ref(false)
const categoryModalVisible = ref(false)
const tagModalVisible = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
// 搜索状态
const startDate = ref('')
const endDate = ref('')
const categorySearchText = ref('')
const tagSearchText = ref('')
const categoryOptions = ref<Array<{ value: string; label: string }>>([])
const tagOptions = ref<Array<{ value: string; label: string }>>([])
// 点击外部关闭快捷菜单
const handleClickOutside = (event: Event) => {
  const dropdown = document.querySelector('.yuemu-apple-dropdown-menu')
  const filterBtn = document.querySelector('.yuemu-filter-btn')
  if (showFilterModal.value && dropdown && filterBtn &&
    !dropdown.contains(event.target as Node) &&
    !filterBtn.contains(event.target as Node)) {
    showFilterModal.value = false
  }
}
onMounted(() => {
  getTagCategoryOptions()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
const getTagCategoryOptions = async () => {
  try {
    const res = await listPictureTagCategoryUsingGet()
    if (res.data.code === 0 && res.data.data) {
      categoryOptions.value = (res.data.data.categoryList || []).map(item => ({ value: item, label: item }))
      tagOptions.value = (res.data.data.tagList || []).map(item => ({ value: item, label: item }))
    }
  } catch (error) {}
}
const toggleDropdown = () => {
  showFilterModal.value = !showFilterModal.value
}
const handleColorSearch = () => {
  showFilterModal.value = false
  showColorModal.value = true
  document.body.style.overflow = 'hidden'
}
const handleAdvancedFilter = () => {
  showFilterModal.value = false
  tempSearchParams.category = searchParams.category
  tempSearchParams.tags = [...searchParams.tags]
  showAdvancedFilterModal.value = true
  document.body.style.overflow = 'hidden'
}
const handleImageSearch = () => {
  showFilterModal.value = false
  fileInputRef.value?.click()
}
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    message.warning(t('components.pictureSearchForm.pleaseSelectPictureFile'))
    return
  }
  message.loading({ content: t('components.pictureSearchForm.uploadingPictureForSearch'), key: 'imageSearch', duration: 0 })
  try {
    // 复用 PostEditPage.vue 中的上传方法，借用它的能力上传得到 URL
    const res = await uploadPostImageUsingPost({}, { headers: { 'Content-Type': 'multipart/form-data' } }, file)
    if (res.data.code === 0 && res.data.data) {
      message.success({ content: t('components.pictureSearchForm.uploadSuccessSearching'), key: 'imageSearch', duration: 2 })
      emit('pictureSearch', res.data.data.url)
    } else {
      throw new Error(res.data.message || t('components.pictureSearchForm.uploadFailed'))
    }
  } catch (error: any) {
    message.error({ content: t('components.pictureSearchForm.uploadFailedColon') + (error.message || t('components.pictureSearchForm.unknownError')), key: 'imageSearch', duration: 2 })
  } finally {
    if (target) target.value = ''
  }
}
const handleColorChange = (color: string) => {
  showColorModal.value = false
  document.body.style.overflow = ''
  emit('colorChange', color)
}
const closeColorModal = () => {
  showColorModal.value = false
  document.body.style.overflow = ''
}
const closeAdvancedFilterModal = () => {
  showAdvancedFilterModal.value = false
  categoryModalVisible.value = false
  tagModalVisible.value = false
  document.body.style.overflow = ''
}
// 分类与标签过滤逻辑
const filteredCategories = computed(() => {
  if (!categorySearchText.value) return categoryOptions.value
  const kw = categorySearchText.value.toLowerCase()
  return categoryOptions.value.filter(item => item.label.toLowerCase().includes(kw))
})
const filteredTags = computed(() => {
  if (!tagSearchText.value) return tagOptions.value
  const kw = tagSearchText.value.toLowerCase()
  return tagOptions.value.filter(item => item.label.toLowerCase().includes(kw))
})
// 选择操作
const selectCategory = (val: string) => {
  tempSearchParams.category = tempSearchParams.category === val ? '' : val
  categoryModalVisible.value = false // 单选，选完即关
}
const toggleTag = (tagValue: string) => {
  const index = tempSearchParams.tags.indexOf(tagValue)
  if (index > -1) {
    tempSearchParams.tags.splice(index, 1)
  } else {
    tempSearchParams.tags.push(tagValue)
  }
}
// 确认与重置
const handleApplyFilter = () => {
  Object.assign(searchParams, tempSearchParams)
  searchParams.startEditTime = startDate.value ? new Date(startDate.value) : null
  searchParams.endEditTime = endDate.value ? new Date(endDate.value) : null
  showAdvancedFilterModal.value = false
  document.body.style.overflow = ''
  emit('search', searchParams)
}
const doClear = () => {
  tempSearchParams.category = ''
  tempSearchParams.tags = []
  startDate.value = ''
  endDate.value = ''
  Object.keys(searchParams).forEach(key => {
    if (key === 'searchText') return
      ;(searchParams as any)[key] = Array.isArray((searchParams as any)[key]) ? [] : ''
  })
  searchParams.startEditTime = null
  searchParams.endEditTime = null
  showAdvancedFilterModal.value = false
  document.body.style.overflow = ''
  emit('search', searchParams)
}
const handleRefresh = () => {
  clearSearchState()
  emit('search', searchParams)
}
let isClearing = false
const clearSearchState = () => {
  isClearing = true
  Object.keys(searchParams).forEach(key => {
    (searchParams as any)[key] = Array.isArray((searchParams as any)[key]) ? [] : ''
  })
  searchParams.startEditTime = null
  searchParams.endEditTime = null
  startDate.value = ''
  endDate.value = ''
  showFilterModal.value = false
  Object.assign(tempSearchParams, { category: '', tags: [] })
  nextTick(() => {
    isClearing = false
  })
}
// Only trigger search automatically when the user clears the input box
watch(() => searchParams.searchText, (newVal) => {
  if (!newVal && !isClearing) {
    emit('search', searchParams)
  }
})
defineExpose({ handleRefresh, clearSearchState })</script>
<style scoped>/* =========== 基础容器与搜索框 =========== */
.yuemu-picture-search-form {
  position: relative;
  width: 100%;
  min-width: 0;
}
.yuemu-apple-search-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  min-width: 0;
}
.yuemu-apple-search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 26px;
  padding: 6px 8px 6px 20px;
  height: 52px;
  transition: box-shadow 0.2s, border-color 0.2s;
  box-shadow: none;
  box-sizing: border-box;
  width: 100%;
}
.yuemu-apple-search-box:hover,
.yuemu-apple-search-box:focus-within {
  background: var(--card-background);
  border-color: transparent;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
}
.yuemu-search-icon {
  color: #9aa0a6;
  font-size: 16px;
  flex-shrink: 0;
}
.yuemu-apple-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  height: 100%;
}
.yuemu-apple-search-input::placeholder {
  color: var(--text-secondary);
}
.yuemu-search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.yuemu-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}
.yuemu-icon-btn:hover {
  background: var(--hover-background);
  color: var(--text-primary);
}
.yuemu-apple-primary-btn {
  background: var(--link-color);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0 20px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
  box-shadow: none;
  flex-shrink: 0;
  white-space: nowrap;
}
.yuemu-apple-primary-btn:hover {
  background: #2563eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.yuemu-apple-primary-btn.yuemu-full-btn {
  flex: 1;
  height: 48px;
  font-size: 16px;
  border-radius: 14px;
}
.yuemu-apple-secondary-btn {
  background: var(--hover-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 0 24px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--theme-transition);
}
.yuemu-apple-secondary-btn:hover {
  background: var(--border-color);
}
/* =========== 下拉菜单 =========== */
.yuemu-apple-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 4px 16px var(--shadow-color);
  width: 180px;
  z-index: 100;
  overflow: hidden;
  animation: yuemu-scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: var(--theme-transition);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}
.yuemu-dropdown-item:hover {
  background: var(--hover-background);
}
.yuemu-item-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
}
.yuemu-color-wrap { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); }
.yuemu-filter-wrap { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.yuemu-dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0 16px;
}
/* =========== 全局弹窗 (Overlay & Sheet) =========== */
.yuemu-apple-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.yuemu-sub-overlay {
  z-index: 2010;
  background: rgba(0,0,0,0.2);
}
.yuemu-apple-modal-sheet {
  background: var(--card-background);
  width: 100%;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  position: relative;
}
.yuemu-color-modal { max-width: 320px; }
.yuemu-filter-modal, .yuemu-sub-sheet { max-width: 500px; }
.yuemu-drag-indicator { display: none; }
.yuemu-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-background);
  z-index: 10;
}
.yuemu-modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
  text-align: center;
}
.yuemu-header-placeholder { width: 50px; }
.yuemu-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: var(--hover-background);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--theme-transition);
  flex-shrink: 0;
}
.yuemu-close-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}
.yuemu-icon-text-btn {
  background: none; border: none; color: var(--link-color);
  font-size: 15px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 0;
}
.yuemu-icon-text-btn:hover { opacity: 0.8; }
.yuemu-text-btn { background: none; border: none; color: var(--link-color); font-size: 14px; font-weight: 500; cursor: pointer; }
.yuemu-modal-body {
  padding: 24px;
  position: relative;
}
.yuemu-color-body {
  display: flex;
  justify-content: center;
}
.yuemu-color-body :deep(.vc-color-wrap) {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  border: 2px solid var(--border-color);
  background: var(--hover-background);
}
.yuemu-scrollable-body {
  max-height: 60vh;
  overflow-y: auto;
}
.yuemu-scrollable-body::-webkit-scrollbar { width: 6px; }
.yuemu-scrollable-body::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
/* =========== 子弹窗内置搜索框 =========== */
.yuemu-sub-search-wrapper {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  background: var(--card-background);
  gap: 10px;
}
.yuemu-sub-search-wrapper i { color: var(--text-secondary); }
.yuemu-sub-search-input {
  flex: 1; border: none; background: var(--hover-background);
  padding: 8px 12px; border-radius: 8px; color: var(--text-primary);
  font-size: 14px; outline: none; transition: 0.2s;
}
.yuemu-sub-search-input:focus { border: 1px solid var(--link-color); background: var(--card-background);}
.yuemu-empty-tip { text-align: center; color: var(--text-secondary); padding: 40px 0; font-size: 14px;}
.yuemu-empty-tip i { font-size: 24px; display: block; margin-bottom: 10px; color: var(--border-color);}
/* =========== 高级筛选列表项 (List Cell) =========== */
.yuemu-filter-section {
  margin-bottom: 24px;
}
.yuemu-filter-section:last-child { margin-bottom: 0; }
.yuemu-section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}
.yuemu-clear-text {
  font-size: 13px;
  color: var(--link-color);
  cursor: pointer;
  font-weight: 500;
}
.yuemu-apple-list-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--hover-background);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: var(--theme-transition);
}
.yuemu-apple-list-cell:hover {
  border-color: var(--link-color);
  background: var(--card-background);
}
.yuemu-cell-content { flex: 1; display: flex; align-items: center; min-width: 0; }
.yuemu-placeholder-text { color: var(--text-secondary); font-size: 15px; }
.yuemu-selected-text { color: var(--link-color); font-size: 15px; font-weight: 600; }
.yuemu-arrow-icon { color: var(--text-secondary); font-size: 14px; margin-left: 12px;}
.yuemu-tags-preview-wrap { display: flex; gap: 6px; flex-wrap: wrap; }
.yuemu-preview-tag {
  background: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
/* =========== 胶囊样式 (子弹窗内使用) =========== */
.yuemu-pills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.yuemu-filter-pill {
  padding: 8px 16px;
  background: var(--hover-background);
  border: 1px solid var(--border-color);
  border-radius: 100px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--theme-transition);
}
.yuemu-filter-pill:hover {
  border-color: var(--link-color);
  color: var(--text-primary);
}
.yuemu-filter-pill.yuemu_active {
  background: var(--link-color);
  border-color: var(--link-color);
  color: #fff;
}
/* =========== 日期输入框 =========== */
.yuemu-date-range-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}
.yuemu-apple-input {
  flex: 1; min-width: 0;
  background: var(--hover-background);
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: var(--theme-transition);
  color-scheme: dark light;
}
.yuemu-apple-input:focus {
  background: var(--card-background);
  border-color: var(--link-color);
}
.yuemu-separator { color: var(--text-secondary); font-weight: 600; }
.yuemu-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
  background: var(--card-background);
  z-index: 10;
}
/* =========== 动画 =========== */
.yuemu-fade-enter-active, .yuemu-fade-leave-active { transition: opacity 0.25s ease; }
.yuemu-fade-enter-from, .yuemu-fade-leave-to { opacity: 0; }
.yuemu-fade-enter-active .yuemu-apple-modal-sheet { animation: yuemu-scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-fade-leave-active .yuemu-apple-modal-sheet { transition: transform 0.2s ease; transform: scale(0.95); }
@keyframes yuemu-scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes yuemu-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
/* =========== 移动端适配 =========== */
@media screen and (max-width: 768px) {
  .yuemu-picture-search-form { padding: 0; width: 100%; }
  .yuemu-apple-search-box { height: 46px; border-radius: 24px; padding: 4px 6px 4px 16px; gap: 8px; }
  .yuemu-apple-search-input { font-size: 15px; }
  .yuemu-search-icon { font-size: 15px; margin-left: 0; }
  .yuemu-search-actions { gap: 4px; }
  .yuemu-icon-btn { width: 36px; height: 36px; border-radius: 50%; }
  .yuemu-apple-primary-btn { height: 36px; padding: 0 16px; font-size: 13px; border-radius: 18px; }
  .yuemu-apple-overlay { padding: 0; align-items: flex-end; }
  .yuemu-fade-enter-active .yuemu-apple-modal-sheet { animation: yuemu-slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
  .yuemu-fade-leave-active .yuemu-apple-modal-sheet { transform: translateY(100%); }
  .yuemu-apple-modal-sheet {
    width: 100%; max-width: 100%; max-height: 85vh;
    border-radius: 24px 24px 0 0; margin: 0;
  }
  .yuemu-color-modal { max-height: 60vh; }
  .yuemu-sub-sheet { max-height: 90vh; }
  .yuemu-drag-indicator {
    display: block; width: 36px; height: 5px; border-radius: 2.5px;
    background: var(--border-color); margin: 12px auto 0;
  }
  .yuemu-modal-header { padding: 12px 20px 16px; border-bottom: none; }
  .yuemu-sub-search-wrapper { padding: 8px 20px 12px; }
  .yuemu-modal-body { padding: 0 20px 20px; }
  .yuemu-scrollable-body { max-height: calc(85vh - 140px); }
  .yuemu-sub-sheet .yuemu-scrollable-body { max-height: calc(90vh - 180px); }
  .yuemu-modal-footer { padding: 16px 20px 24px; }
}
@media screen and (max-width: 360px) {
  .yuemu-apple-search-box { padding: 4px 4px 4px 12px; }
  .yuemu-apple-primary-btn { padding: 0 12px; font-size: 12px; height: 32px; border-radius: 16px; }
  .yuemu-icon-btn { width: 32px; height: 32px; }
  .yuemu-preview-tag { font-size: 11px; padding: 3px 8px; }
}
/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-apple-search-box:active, .yuemu-apple-search-box:hover,
  .yuemu-apple-search-box:active *, .yuemu-apple-search-box:hover *,
  .yuemu-dropdown-item:active, .yuemu-dropdown-item:hover,
  .yuemu-dropdown-item:active *, .yuemu-dropdown-item:hover *,
  .yuemu-apple-list-cell:active, .yuemu-apple-list-cell:hover,
  .yuemu-apple-list-cell:active *, .yuemu-apple-list-cell:hover *,
  .yuemu-close-btn:active, .yuemu-close-btn:hover,
  .yuemu-close-btn:active *, .yuemu-close-btn:hover *,
  .yuemu-apple-secondary-btn:active, .yuemu-apple-secondary-btn:hover,
  .yuemu-apple-secondary-btn:active *, .yuemu-apple-secondary-btn:hover *,
  .yuemu-icon-btn:active, .yuemu-icon-btn:hover,
  .yuemu-icon-btn:active *, .yuemu-icon-btn:hover *,
  .yuemu-icon-text-btn:active, .yuemu-icon-text-btn:hover,
  .yuemu-icon-text-btn:active *, .yuemu-icon-text-btn:hover *,
  .yuemu-filter-pill:active, .yuemu-filter-pill:hover,
  .yuemu-filter-pill:active *, .yuemu-filter-pill:hover *,
  .yuemu-apple-primary-btn:active, .yuemu-apple-primary-btn:hover,
  .yuemu-apple-primary-btn:active *, .yuemu-apple-primary-btn:hover * {
    transform: none !important;
  }
}</style>
