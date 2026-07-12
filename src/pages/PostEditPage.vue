<template>
  <div id="yuemu-postEditPage" class="yuemu-post-page" :class="{ 'is-ai-generating': isAiGenerating }">
    <div class="yuemu-page-inner-wrapper">
      <div class="yuemu-app-container yuemu-editor-pane">

        <header class="yuemu-app-header">
          <div class="yuemu-header-left">
            <button class="yuemu-icon-btn" @click="handleCancel">
              <i class="fa-solid fa-angle-left"></i>
            </button>
            <span class="yuemu-header-title yuemu-mobile-title-inline">{{ isEdit ? $t('pages.postEditPage.header.editTitle') : $t('pages.postEditPage.header.publishTitle') }}</span>
          </div>
          <div class="yuemu-header-center yuemu-mobile-hide">
            <span class="yuemu-header-title">{{ isEdit ? $t('pages.postEditPage.header.editTitle') : $t('pages.postEditPage.header.publishTitle') }}</span>
          </div>
          <div class="yuemu-header-right">
            <button class="yuemu-draft-inbox-btn" @click="openDraftModal" :title="$t('pages.postEditPage.header.drafts')" v-if="!isPC">
              <i class="fa-solid fa-inbox yuemu-mobile-hide-icon"></i>
              <span>{{ $t('pages.postEditPage.header.drafts') }}</span>
            </button>
            <button class="yuemu-preview-header-btn" @click="openPreview" v-if="!isPC" :title="$t('pages.postEditPage.header.preview')">
              <i class="fa-solid fa-eye yuemu-mobile-hide-icon"></i>
              <span>{{ $t('pages.postEditPage.header.preview') }}</span>
            </button>
            <div class="yuemu-pc-actions">
              <button class="yuemu-btn-publish" @click="handleSubmit" :disabled="submitting || !validateFormBasic()">
                <i class="fa-solid fa-spinner fa-spin" v-if="submitting"></i>
                <span v-else>{{ isEdit ? $t('pages.postEditPage.header.update') : $t('pages.postEditPage.header.publish') }}</span>
              </button>
            </div>
          </div>
        </header>

        <div class="yuemu-auto-save-bar" v-if="hasUnsavedChanges">
          <i class="fa-solid fa-pen-nib"></i> {{ $t('pages.postEditPage.autoSaveTip') }}
        </div>

        <main class="yuemu-app-content custom-scroll" id="editor-scroll-container">

          <div class="yuemu-hero-section">
            <div class="yuemu-title-wrapper">
              <textarea
                v-model="postForm.title"
                :placeholder="$t('pages.postEditPage.editor.titlePlaceholder')"
                maxlength="100"
                class="yuemu-title-input custom-scroll"
                rows="2"
                :disabled="isAiGenerating"
              ></textarea>
              <span class="yuemu-title-count" :class="{ 'is-full': postForm.title.length >= 100 }">
                {{ postForm.title.length }}/100
              </span>
            </div>

            <div class="yuemu-cover-thumbnail" @click="showCoverMenu = true">
              <template v-if="postForm.coverUrl">
                <img :src="postForm.coverUrl" class="yuemu-cover-img" :alt="$t('pages.postEditPage.cover.alt')" />
                <div class="yuemu-cover-overlay">
                  <i class="fa-solid fa-camera"></i>
                </div>
              </template>
              <template v-else>
                <div class="yuemu-cover-placeholder">
                  <i class="fa-solid fa-image"></i>
                  <span>{{ $t('pages.postEditPage.cover.addCover') }}</span>
                </div>
              </template>
              <div class="yuemu-uploading-overlay" v-if="uploading">
                <i class="fa-solid fa-spinner fa-spin"></i>
              </div>
            </div>

            <input type="file" ref="coverFileInput" accept="image/*" @change="handleCoverUpload" hidden />
          </div>

          <div class="yuemu-editor-wrapper" :style="isAiGenerating ? 'pointer-events: none; opacity: 0.8;' : ''">
            <div class="yuemu-editor-container" style="display: flex; flex-direction: column; height: 100%;">
              <div class="yuemu-sticky-toolbar-wrapper" v-show="!isAiGenerating">
                <Toolbar
                  class="yuemu-w-toolbar"
                  :editor="editorRef"
                  :defaultConfig="toolbarConfig"
                  :mode="mode"
                />
              </div>
              <Editor
                v-show="!isAiGenerating"
                class="yuemu-w-editor"
                :defaultConfig="editorConfig"
                :mode="mode"
                v-model="postForm.content"
                @onCreated="handleCreated"
                @onChange="handleEditorChange"
              />
              <!-- 完美克隆的伪装编辑器结构：无缝继承 WangEditor 所有的全局样式，绝对无缝、零抖动、防聚焦 -->
              <div v-if="isAiGenerating" class="yuemu-w-editor" style="background: var(--card-background); border: none;">
                <div class="w-e-text-container" style="background: var(--card-background);">
                  <div class="w-e-scroll">
                    <div data-slate-editor="true" class="w-e-text" style="outline: none; min-height: 400px; padding: 0 10px;" v-html="aiStreamingContent || $t('pages.postEditPage.editor.aiWriting')">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="yuemu-settings-list">
            <div class="yuemu-post-actions-row" v-if="isPC">
              <button class="yuemu-btn-draft yuemu-ai-btn" @click="showAiGenerator = true" v-if="!isEdit" :title="$t('pages.postEditPage.header.aiGen')">
                <i class="fa-solid fa-wand-magic-sparkles"></i> 一键成帖
              </button>
              <div class="yuemu-draft-actions">
                <button class="yuemu-draft-inbox-btn yuemu-pc-draft-btn" @click="openDraftModal" :title="$t('pages.postEditPage.header.drafts')">
                  <i class="fa-solid fa-inbox"></i> 草稿箱
                </button>
                <button class="yuemu-btn-draft" @click="saveDraft" v-if="!isEdit || (isEdit && route.query.draft)" :disabled="submitting">
                  {{ $t('pages.postEditPage.header.saveDraft') }}
                </button>
              </div>
            </div>
            <div class="yuemu-setting-divider" v-if="isPC"></div>

            <div class="yuemu-setting-cell" @click="openCategoryModal = true">
              <div class="yuemu-cell-left">
                <div class="yuemu-icon-wrap yuemu-bg-blue"><i class="fa-solid fa-folder-open"></i></div>
                <span class="yuemu-cell-label">{{ $t('pages.postEditPage.category.label') }} <span class="yuemu-required">*</span></span>
              </div>
              <div class="yuemu-cell-right">
                <span class="yuemu-cell-value" :class="{ 'yuemu-placeholder': !postForm.category }">
                  {{ postForm.category || $t('pages.postEditPage.category.pleaseSelect') }}
                </span>
                <i class="fa-solid fa-angle-right yuemu-arrow-icon"></i>
              </div>
            </div>

            <div class="yuemu-setting-divider"></div>

            <div class="yuemu-setting-cell" @click="openTagModal = true">
              <div class="yuemu-cell-left">
                <div class="yuemu-icon-wrap yuemu-bg-orange"><i class="fa-solid fa-hashtag"></i></div>
                <span class="yuemu-cell-label">{{ $t('pages.postEditPage.tags.label') }}</span>
              </div>
              <div class="yuemu-cell-right">
                <div class="yuemu-tag-preview-list" v-if="postForm.tags.length > 0">
                  <span class="yuemu-preview-tag" v-for="tag in postForm.tags.slice(0, 1)" :key="tag">#{{ tag }}</span>
                  <span class="yuemu-preview-tag yuemu-more" v-if="postForm.tags.length > 1">+{{ postForm.tags.length - 1 }}</span>
                </div>
                <span class="yuemu-cell-value yuemu-placeholder" v-else>{{ $t('pages.postEditPage.tags.addTag') }}</span>
                <i class="fa-solid fa-angle-right yuemu-arrow-icon"></i>
              </div>
            </div>
          </div>

          <div class="yuemu-bottom-padding"></div>
        </main>

        <footer class="yuemu-app-footer" v-if="isMobile">
          <button class="yuemu-footer-btn yuemu-ai-btn" @click="showAiGenerator = true" v-if="!isEdit">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>AI</span>
          </button>
          <button class="yuemu-footer-btn yuemu-draft-btn" @click="saveDraft" v-if="!isEdit || (isEdit && route.query.draft)" :disabled="submitting">
            <i class="fa-solid fa-box-archive" v-if="!submitting"></i>
            <span>{{ $t('pages.postEditPage.drafts.label') }}</span>
          </button>
          <button class="yuemu-footer-btn yuemu-publish-btn-large" @click="handleSubmit" :disabled="submitting || !validateFormBasic()">
            <i class="fa-solid fa-spinner fa-spin" v-if="submitting"></i>
            <span v-else>{{ isEdit ? $t('pages.postEditPage.header.update') : $t('pages.postEditPage.header.publish') }}</span>
          </button>
        </footer>

        <transition name="yuemu-fade-modal">
          <div class="yuemu-action-sheet-mask" v-if="showCoverMenu" @click="showCoverMenu = false">
            <div class="yuemu-action-sheet-panel yuemu-menu-sheet" @click.stop>
              <div class="yuemu-menu-list">
                <button class="yuemu-menu-btn" @click="openCoverPreview()" v-if="postForm.coverUrl">
                  <i class="fa-solid fa-eye"></i> 查看封面
                </button>
                <button class="yuemu-menu-btn" @click="triggerCoverUpload(); showCoverMenu = false">
                  <i class="fa-solid fa-image"></i> 从相册上传
                </button>
                <button class="yuemu-menu-btn" @click="selectCoverFromContent(); showCoverMenu = false" v-if="postForm.content">
                  <i class="fa-solid fa-file-image"></i> 从正文提取
                </button>
                <button class="yuemu-menu-btn" @click="showCoverGenerator = true; showCoverMenu = false">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> AI 智能生成
                </button>
                <div class="yuemu-menu-divider" v-if="postForm.coverUrl"></div>
                <button class="yuemu-menu-btn yuemu-danger" @click="postForm.coverUrl = ''; showCoverMenu = false" v-if="postForm.coverUrl">
                  <i class="fa-solid fa-trash-can"></i> 删除封面
                </button>
              </div>
              <button class="yuemu-menu-cancel" @click="showCoverMenu = false">{{ $t('pages.postEditPage.cover.cancel') }}</button>
            </div>
          </div>
        </transition>

        <transition name="yuemu-fade-modal">
          <div class="yuemu-action-sheet-mask" v-if="openCategoryModal" @click="openCategoryModal = false">
            <div class="yuemu-action-sheet-panel" @click.stop>
              <div class="yuemu-sheet-drag-bar"></div>
              <div class="yuemu-sheet-header">
                <h3>{{ $t('pages.postEditPage.category.title') }}</h3>
                <button class="yuemu-sheet-close" @click="openCategoryModal = false"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="yuemu-sheet-search">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input v-model="categorySearchText" :placeholder="$t('pages.postEditPage.category.searchPlaceholder')" @input="filterCategories" />
              </div>
              <div class="yuemu-sheet-content custom-scroll">
                <div class="yuemu-category-grid">
                  <div v-for="cat in filteredCategories" :key="cat" class="yuemu-category-item" :class="{ 'is-active': postForm.category === cat }" @click="handleCategorySelect(cat)">{{ cat }}</div>
                </div>
                <div v-if="filteredCategories.length === 0" class="yuemu-empty-tips">{{ $t('pages.postEditPage.category.notFound') }}</div>
              </div>
            </div>
          </div>
        </transition>

        <transition name="yuemu-fade-modal">
          <div class="yuemu-action-sheet-mask" v-if="openTagModal" @click="openTagModal = false">
            <div class="yuemu-action-sheet-panel" @click.stop>
              <div class="yuemu-sheet-drag-bar"></div>
              <div class="yuemu-sheet-header">
                <h3>{{ $t('pages.postEditPage.tags.title', { count: postForm.tags.length }) }}</h3>
                <button class="yuemu-sheet-close" @click="openTagModal = false"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="yuemu-sheet-search">
                <input v-model="customTagInput" :placeholder="$t('pages.postEditPage.tags.inputPlaceholder')" @keyup.enter="addCustomTag" @input="filterTags" class="yuemu-tag-input" />
                <button class="yuemu-add-tag-btn" @click="addCustomTag"><i class="fa-solid fa-arrow-up"></i></button>
              </div>
              <div class="yuemu-active-tags-area" v-if="postForm.tags.length > 0">
                <span class="yuemu-active-tag" v-for="(tag, index) in postForm.tags" :key="tag">
                  #{{ tag }} <i class="fa-solid fa-xmark" @click="removeTag(index)"></i>
                </span>
              </div>
              <div class="yuemu-sheet-content custom-scroll">
                <div class="yuemu-tag-grid">
                  <div class="yuemu-tag-item" v-for="tag in filteredTags" :key="tag" :class="{ 'is-active': postForm.tags.includes(tag) }" @click="toggleTag(tag)">#{{ tag }}</div>
                </div>
              </div>
              <div class="yuemu-sheet-footer"><button class="yuemu-done-btn" @click="openTagModal = false">{{ $t('pages.postEditPage.tags.doneBtn') }}</button></div>
            </div>
          </div>
        </transition>

        <transition name="yuemu-fade-modal">
          <div class="yuemu-action-sheet-mask" v-if="showSelectCoverFromContent" @click="showSelectCoverFromContent = false">
            <div class="yuemu-action-sheet-panel" @click.stop>
              <div class="yuemu-sheet-drag-bar"></div>
              <div class="yuemu-sheet-header">
                <h3>{{ $t('pages.postEditPage.cover.chooseContentPic') }}</h3>
                <button class="yuemu-sheet-close" @click="showSelectCoverFromContent = false"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="yuemu-sheet-content">
                <div class="yuemu-cover-images-grid">
                  <div class="yuemu-cover-image-item" v-for="(image, index) in extractImagesFromContent()" :key="index" @click="useImageAsCover(image)">
                    <img :src="image" class="yuemu-cover-preview-img" />
                    <div class="yuemu-cover-sel-overlay"><i class="fa-solid fa-circle-check"></i> {{ $t('pages.postEditPage.cover.setAsCover') }}</div>
                  </div>
                </div>
                <div v-if="extractImagesFromContent().length === 0" class="yuemu-empty-tips">
                  <i class="fa-solid fa-box-open" style="font-size: 32px; margin-bottom: 8px;"></i>
                  <p>{{ $t('pages.postEditPage.cover.noPicInContent') }}</p>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <transition name="yuemu-fade-modal">
          <div class="yuemu-action-sheet-mask" v-if="showDraftModal" @click="showDraftModal = false">
            <div class="yuemu-action-sheet-panel" @click.stop>
              <div class="yuemu-sheet-drag-bar"></div>
              <div class="yuemu-sheet-header">
                <h3>{{ $t('pages.postEditPage.drafts.title') }}</h3>
                <button class="yuemu-sheet-close" @click="showDraftModal = false"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="yuemu-sheet-content custom-scroll" @scroll="handleDraftScroll">
                <div v-if="draftLoading" class="yuemu-draft-loading">
                  <i class="fa-solid fa-spinner fa-spin"></i> 加载中...
                </div>
                <div v-else-if="draftList.length === 0" class="yuemu-empty-draft">
                  <i class="fa-solid fa-inbox"></i>
                  <p>{{ $t('pages.postEditPage.drafts.empty') }}</p>
                </div>
                <div v-else>
                  <div class="yuemu-draft-list">
                    <div v-for="draft in draftList" :key="draft.id" class="yuemu-draft-item" @click="loadDraft(draft)">
                      <div class="yuemu-draft-cover" v-if="draft.coverUrl"><img :src="draft.coverUrl" /></div>
                      <div class="yuemu-draft-cover yuemu-placeholder" v-else><i class="fa-regular fa-image"></i></div>
                      <div class="yuemu-draft-info">
                        <div class="yuemu-draft-title">{{ draft.title || $t('pages.postEditPage.drafts.untitled') }}</div>
                        <div class="yuemu-draft-preview">{{ draft.content ? draft.content.replace(/<[^>]*>/g, '').substring(0, 50) : $t('pages.postEditPage.drafts.noContent') }}...</div>
                        <div class="yuemu-draft-time">{{ formatDraftTime(draft.editTime || draft.createTime) }}</div>
                      </div>
                      <button class="yuemu-draft-delete" @click.stop="deleteDraft(String(draft.id))">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>

                  <!-- 触底加载更多状态展示 -->
                  <div v-if="draftLoadingMore" class="yuemu-draft-load-more">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>{{ $t('pages.postEditPage.drafts.loadingMore') }}</span>
                  </div>
                  <div v-else-if="!hasMoreDrafts && draftList.length > 0" class="yuemu-draft-no-more">
                    <span>{{ $t('pages.postEditPage.drafts.end') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- 封面预览全屏层 -->
        <transition name="yuemu-fade-modal">
          <div class="yuemu-cover-preview-fullscreen" v-if="showCoverPreview" @click="closeCoverPreview">
            <div class="yuemu-cover-preview-header">
              <button class="yuemu-preview-close-btn" @click="closeCoverPreview">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <span class="yuemu-preview-title">{{ $t('pages.postEditPage.preview.coverTitle') }}</span>
              <div style="width: 40px;"></div>
            </div>
            <div class="yuemu-cover-preview-body">
              <img :src="postForm.coverUrl" :alt="$t('pages.postEditPage.preview.coverAlt')" class="yuemu-cover-preview-image" @click.stop />
            </div>
          </div>
        </transition>

        <div class="yuemu-preview-layer" :class="{ 'is-active': showPreviewModal && !isPC }">
          <div class="yuemu-preview-header">
            <button class="yuemu-preview-back-btn" @click="closePreview">
              <i class="fa-solid fa-angle-left"></i> 返回
            </button>
            <span>{{ $t('pages.postEditPage.preview.effectPreview') }}</span>
            <div style="width: 60px"></div>
          </div>
          <div class="yuemu-preview-body custom-scroll">
            <div class="yuemu-post-detail-mock">
              <div class="yuemu-preview-content-box">
                <h1 class="yuemu-preview-title">{{ postForm.title || $t('pages.postEditPage.preview.untitledTitle') }}</h1>
                <div v-if="postForm.coverUrl" class="yuemu-preview-cover-dashed">
                  <img :src="postForm.coverUrl" :alt="$t('pages.postEditPage.preview.coverAlt')" />
                </div>
                <HtmlContent :content="postForm.content || $t('pages.postEditPage.preview.placeholderHtmlOld')" />
              </div>
            </div>
          </div>
        </div>

        <div class="yuemu-center-modal-overlay" v-if="showDraftConfirmModal || showLeaveConfirmModal">
          <div class="yuemu-center-modal">
            <template v-if="showDraftConfirmModal">
              <div class="yuemu-modal-icon yuemu-blue"><i class="fa-regular fa-file-lines"></i></div>
              <h3 class="yuemu-modal-title">{{ $t('pages.postEditPage.modals.draftFoundTitle') }}</h3>
              <p class="yuemu-modal-desc">{{ $t('pages.postEditPage.modals.draftFoundDesc') }}</p>
              <div class="yuemu-modal-actions">
                <button class="yuemu-modal-btn yuemu-outline" @click="showDraftConfirmModal = false">{{ $t('pages.postEditPage.modals.abandonDraft') }}</button>
                <button class="yuemu-modal-btn yuemu-primary" @click="confirmDraftLoad">{{ $t('pages.postEditPage.modals.loadDraft') }}</button>
              </div>
            </template>

            <template v-if="showLeaveConfirmModal">
              <div class="yuemu-modal-icon yuemu-warning"><i class="fa-solid fa-triangle-exclamation"></i></div>
              <h3 class="yuemu-modal-title">{{ $t('pages.postEditPage.modals.unsavedTitle') }}</h3>
              <p class="yuemu-modal-desc">{{ $t('pages.postEditPage.modals.unsavedDesc') }}</p>
              <div class="yuemu-modal-actions yuemu-vertical">
                <button class="yuemu-modal-btn yuemu-primary" @click="cancelLeave">{{ $t('pages.postEditPage.modals.continueEdit') }}</button>
                <button class="yuemu-modal-btn yuemu-outline" @click="saveDraftAndLeave">{{ $t('pages.postEditPage.modals.saveAndLeave') }}</button>
                <button class="yuemu-modal-btn yuemu-danger-text" @click="confirmLeaveWithoutSave">{{ $t('pages.postEditPage.modals.abandonAndLeave') }}</button>
              </div>
            </template>
          </div>
        </div>

        <div class="yuemu-toast-message" :class="[toastType, { 'yuemu-show': showToast }]">
          <i class="fa-solid" :class="toastType === 'success' ? 'fa-circle-check' : (toastType === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark')"></i>
          <span>{{ toastMessage }}</span>
        </div>

        <CoverGenerator
          v-if="showCoverGenerator"
          :contentImages="extractImagesFromContent()"
          :initialText="postForm.title"
          @close="showCoverGenerator = false"
          @confirm="handleCoverGenerated"
        />

        <AiPostGeneratorModal
          v-if="showAiGenerator"
          :categories="categories"
          @close="showAiGenerator = false"
          @start="handleAiStart"
        />

        <transition name="yuemu-slide-up">
          <div class="yuemu-ai-capsule" v-if="isAiGenerating">
            <i class="fa-solid fa-wand-magic-sparkles fa-beat"></i>
            <span class="capsule-text">{{ aiGenerateStatus }}</span>
            <button class="yuemu-ai-stop-btn" @click="stopAiGeneration" :title="$t('pages.postEditPage.modals.pauseAiGen')">
              <i class="fa-solid fa-pause"></i>
            </button>
          </div>
        </transition>
      </div>

      <div class="yuemu-app-container yuemu-preview-pane" v-if="isPC">
        <header class="yuemu-app-header">
          <div class="yuemu-header-center">
            <span class="yuemu-header-title">{{ $t('pages.postEditPage.preview.realtimePreview') }}</span>
          </div>
        </header>
        <div class="yuemu-preview-body yuemu-pc-preview-body custom-scroll">
          <div class="yuemu-post-detail-mock">
            <div class="yuemu-preview-content-box">
              <h1 class="yuemu-preview-title">{{ postForm.title || $t('pages.postEditPage.preview.realtimeTitleAlt') }}</h1>
              <div v-if="postForm.coverUrl" class="yuemu-preview-cover-dashed">
                <img :src="postForm.coverUrl" :alt="$t('pages.postEditPage.preview.coverAlt')" />
              </div>
              <HtmlContent :content="(isAiGenerating ? aiStreamingContent : postForm.content) || $t('pages.postEditPage.preview.placeholderHtml')" />
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

import { ref, computed, shallowRef, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { addPostUsingPost, updatePostUsingPost, listPostTagCategoryUsingGet, getPostLatestDraftUsingGet, savePostDraftUsingPost, listPostDraftsUsingGet, deletePostDraftUsingDelete, aiGenerateStreamUsingGet } from '@/api/postController'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import CoverGenerator from '@/components/CoverGenerator.vue'
import HtmlContent from '@/components/HtmlContent.vue'
import AiPostGeneratorModal from '@/components/AiPostGeneratorModal.vue'

const loginUserStore = useLoginUserStore()
const route = useRoute()
const router = useRouter()
const editorRef = shallowRef()

const mode = 'default'
const submitting = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadQueue: { file: File; insertFn: any }[] = []
let draftId: string | null = null

const aiStreamingContent = ref('') // 用于流式生成时的实时预览缓存

let originalBodyOverflow = ''
const isPC = ref(false)

const checkPC = () => { isPC.value = window.innerWidth >= 1024 }

const openCoverPreview = () => {
  if (postForm.value.coverUrl) {
    showCoverPreview.value = true
    showCoverMenu.value = false
  }
}

const closeCoverPreview = () => {
  showCoverPreview.value = false
}

const isAiGenerating = ref(false)
const aiGenerateStatus = ref(t('pages.postEditPage.status.connecting'))
const aiParsedContent = ref('')

const coverFileInput = ref<HTMLInputElement>()

const showCoverMenu = ref(false)
const openCategoryModal = ref(false)
const openTagModal = ref(false)
const showSelectCoverFromContent = ref(false)
const showCoverGenerator = ref(false)
const showDraftConfirmModal = ref(false)
const showLeaveConfirmModal = ref(false)
const showPreviewModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')
const showDraftModal = ref(false)
const showCoverPreview = ref(false)
const isMobile = ref(false)
const showAiGenerator = ref(false)

const categories = ref<string[]>([])
const filteredCategories = ref<string[]>([])
const categorySearchText = ref('')
const tags = ref<string[]>([])
const filteredTags = ref<string[]>([])
const customTagInput = ref('')
const draftDataTemp = ref<any>(null)
const rawDraftList = ref<any[]>([])
const draftList = ref<any[]>([])
const draftLoading = ref(false)
const draftPage = ref(1)
const draftPageSize = 10
const draftLoadingMore = ref(false)
const hasMoreDrafts = computed(() => draftList.value.length < rawDraftList.value.length)

const postForm = ref({
  title: '',
  content: '',
  category: undefined as string | undefined,
  tags: [] as string[],
  coverUrl: ''
})

const initialFormData = ref({ ...postForm.value })
const isEdit = computed(() => !!route.params.id)
const hasUnsavedChanges = computed(() => {
  return (
    postForm.value.title !== initialFormData.value.title ||
    postForm.value.content !== initialFormData.value.content ||
    postForm.value.category !== initialFormData.value.category ||
    JSON.stringify(postForm.value.tags) !== JSON.stringify(initialFormData.value.tags) ||
    postForm.value.coverUrl !== initialFormData.value.coverUrl
  )
})

const validateFormBasic = () => { return postForm.value.title?.trim() && postForm.value.category; }

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > 1920 || height > 1080) {
          const ratio = Math.min(1920 / width, 1080 / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        const maxFileSize = 2 * 1024 * 1024;
        let quality = 0.8;
        const compressAndCheck = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error(t('pages.postEditPage.msgs.compressFail'))); return; }
            if (blob.size <= maxFileSize || quality <= 0.1) {
              resolve(new File([blob], file.name, { type: blob.type, lastModified: Date.now() }));
            } else { quality -= 0.1; compressAndCheck(); }
          }, 'image/jpeg', quality);
        };
        compressAndCheck();
      };
      img.onerror = () => reject(new Error(t('pages.postEditPage.msgs.picLoadFail')));
    };
    reader.onerror = () => reject(new Error(t('pages.postEditPage.msgs.readFail')));
  });
}

const processUploadQueue = async () => {
  while (uploadQueue.length > 0) {
    const { file, insertFn } = uploadQueue.shift()!;
    try {
      uploading.value = true; uploadProgress.value = 10;
      if (file.size > 10 * 1024 * 1024) throw new Error(t('pages.postEditPage.msgs.picSize10M'));
      if (!file.type.startsWith('image/')) throw new Error(t('pages.postEditPage.msgs.picOnly'));

      const compressedFile = await compressImage(file);
      uploadProgress.value = 40;

      const formData = new FormData();
      formData.append('file', compressedFile);
      const res = await uploadPostImageUsingPost({}, { headers: { 'Content-Type': 'multipart/form-data' } }, compressedFile);

      uploadProgress.value = 90;
      if (res.data.code === 0 && res.data.data) {
        insertFn(res.data.data.url);
        uploadProgress.value = 100;
        showToastMessage(t('pages.postEditPage.msgs.contentPicSuccess'), 'success');
      } else { throw new Error(res.data.message || t('pages.postEditPage.msgs.uploadFail')); }
    } catch (error: any) { showToastMessage(t('pages.postEditPage.msgs.uploadFailPrefix') + String(error.message || t('pages.postEditPage.msgs.unknownError')), 'error');
    } finally { await new Promise(resolve => setTimeout(resolve, 300)); }
  }
  uploading.value = false; uploadProgress.value = 0; isUploading.value = false;
}

const toolbarConfig = { toolbarKeys: ['uploadImage', 'color', 'bold', 'underline', 'through', 'italic', 'undo', 'redo'] }

const editorConfig = {
  placeholder: t('pages.postEditPage.editor.placeholder'),
  html: true,
  autoFocus: false,
  maxLength: 5000,
  scroll: false,
  onMaxLength: () => showToastMessage(t('pages.postEditPage.msgs.contentMaxLength5000'), 'warning'),
  pasteFilter: true,
  pasteIgnoreImg: false,
  pasteTextHandle: (content: string) => {
    if (content.length > 5000) {
      const remainingLength = 5000 - postForm.value.content.length;
      if (remainingLength > 0) {
        showToastMessage(t('pages.postEditPage.msgs.pasteTruncated').replace('{len}', String(remainingLength)), 'warning');
        return content.substring(0, remainingLength);
      }
      showToastMessage(t('pages.postEditPage.msgs.maxLenPasteFail'), 'warning');
      return '';
    }
    return content;
  },
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: any) {
        uploadQueue.push({ file, insertFn });
        if (!isUploading.value) { isUploading.value = true; await processUploadQueue(); }
      }
    }
  },
  EXTEND_CONF: { image: { draggable: true, resizable: false, customConfig: { allowDrag: true, showMenu: true } } },
  hoverbarKeys: { image: { menuKeys: ['deleteImage', 'viewImage'] } },
}

const handleCreated = (editor: any) => {
  editorRef.value = editor
  const editorDom = editor.getEditableContainer()
  if (editorDom) {
    editorDom.addEventListener('paste', () => {
      setTimeout(() => {
        const content = editor.getText() || '';
        if (content.length > 5000) {
          editor.setHtml(content.substring(0, 5000).replace(/\n/g, '<br>'));
          showToastMessage(t('pages.postEditPage.msgs.maxLenTruncated'), 'warning');
        }
      }, 10);
    });
  }
  if (isEdit.value) initPostData()
}

const handleEditorChange = (editor: any) => { postForm.value.content = editor.getHtml() }

const parseTags = (tagsRaw: any): string[] => {
  if (Array.isArray(tagsRaw)) return tagsRaw;
  if (typeof tagsRaw === 'string') { try { return JSON.parse(tagsRaw) || []; } catch { return []; } }
  return [];
}

const initPostData = () => {
  const postData = route.query.post
  if (postData) { setFormData(JSON.parse(postData as string)) }
  else if (route.query.draft) {
    const draft = typeof route.query.draft === 'string' ? JSON.parse(route.query.draft) : route.query.draft;
    setFormData(draft)
    if (draft.id) draftId = String(draft.id);
    showToastMessage(t('pages.postEditPage.msgs.draftLoaded'), 'success');
  } else if (isEdit.value) { showToastMessage(t('pages.postEditPage.msgs.getDataFail'), 'error'); router.back(); }
}

const setFormData = (data: any) => {
  postForm.value = {
    title: data.title || '',
    category: data.category,
    tags: parseTags(data.tags),
    coverUrl: data.coverUrl || '',
    content: data.content || ''
  }
  if (editorRef.value && data.content) editorRef.value.setHtml(data.content)
  updateInitialFormData()
}

const fetchTagsAndCategories = async () => {
  try {
    const res = await listPostTagCategoryUsingGet()
    if (res.data?.code === 0 && res.data.data) {
      tags.value = res.data.data.tagList || []
      categories.value = res.data.data.categoryList || []
      filteredTags.value = [...tags.value]
      filteredCategories.value = [...categories.value]
    }
  } catch (error) { showToastMessage(t('pages.postEditPage.msgs.getTagsFail'), 'error'); }
}

const loadLatestDraft = async () => {
  try {
    const res = await getPostLatestDraftUsingGet()
    if (res.data?.code === 0 && res.data.data) {
      draftDataTemp.value = res.data.data
      showDraftConfirmModal.value = true
    }
  } catch (error) {}
}

const confirmDraftLoad = () => {
  if (draftDataTemp.value) {
    setFormData(draftDataTemp.value)
    draftId = String(draftDataTemp.value.id);
    showToastMessage(t('pages.postEditPage.msgs.draftLoaded'), 'success');
  }
  showDraftConfirmModal.value = false
}

const triggerCoverUpload = () => coverFileInput.value?.click()

const handleCoverUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { showToastMessage(t('pages.postEditPage.msgs.pleaseSelectPic'), 'warning'); return }
  try {
    uploading.value = true; uploadProgress.value = 10;
    const compressedFile = await compressImage(file); uploadProgress.value = 40;
    const res = await uploadPostImageUsingPost({}, { headers: { 'Content-Type': 'multipart/form-data' } }, compressedFile)
    uploadProgress.value = 90;
    if (res.data.code === 0 && res.data.data) {
      postForm.value.coverUrl = res.data.data.url
      showToastMessage(t('pages.postEditPage.msgs.coverUploadSuccess'), 'success');
    } else throw new Error(res.data.message || t('pages.postEditPage.msgs.uploadFail'));
  } catch (error: any) { showToastMessage(t('pages.postEditPage.msgs.coverUploadFailMsg').replace('{msg}', String(error.message || t('pages.postEditPage.msgs.unknownError'))), 'error'); }
  finally { uploading.value = false; uploadProgress.value = 0; if (target) target.value = '' }
}

const extractImagesFromContent = (): string[] => {
  if (!postForm.value.content) return [];
  const doc = new DOMParser().parseFromString(postForm.value.content, 'text/html');
  return Array.from(doc.querySelectorAll('img')).map(img => img.getAttribute('src')).filter(Boolean) as string[];
};

const selectCoverFromContent = () => {
  const images = extractImagesFromContent();
  if (images.length > 0) showSelectCoverFromContent.value = true;
  else showToastMessage(t('pages.postEditPage.msgs.noValidPicInContent'), 'warning');
};

const useImageAsCover = (imageUrl: string) => {
  postForm.value.coverUrl = imageUrl; showSelectCoverFromContent.value = false; showToastMessage(t('pages.postEditPage.msgs.setCoverSuccess'), 'success');
};

let aiAbortController: AbortController | null = null;

const stopAiGeneration = () => {
  if (aiAbortController) {
    aiAbortController.abort();
  }
};

const handleAiStart = (params: any) => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  showAiGenerator.value = false
  isAiGenerating.value = true
  aiGenerateStatus.value = t('pages.postEditPage.status.connectingAi')
  aiParsedContent.value = ''
  aiStreamingContent.value = ''
  postForm.value.title = ''
  if (editorRef.value) {
    editorRef.value.setHtml('')
    editorRef.value.blur() // 提前失焦
  }


  let accumulatedText = ''
  let eventBuffer = ''
  let rawContent = ''

  if (aiAbortController) {
    aiAbortController.abort();
  }
  aiAbortController = new AbortController();

  aiGenerateStreamUsingGet(params, {
    responseType: 'text',
    signal: aiAbortController.signal,
    onDownloadProgress: (progressEvent: any) => {
      const xhr = progressEvent.event?.target
      if (!xhr) return

      const responseText = xhr.responseText
      const newText = responseText.substring(accumulatedText.length)
      accumulatedText = responseText
      eventBuffer += newText

      let nextNewlineIndex
      while ((nextNewlineIndex = eventBuffer.indexOf('\n\n')) !== -1) {
        const eventChunk = eventBuffer.slice(0, nextNewlineIndex)
        eventBuffer = eventBuffer.slice(nextNewlineIndex + 2)

        let eventType = 'message'
        let dataStr = ''
        eventChunk.split('\n').forEach(line => {
          if (line.startsWith('event:')) eventType = line.substring(6).trim()
          else if (line.startsWith('data:')) dataStr = line.substring(5).trim()
        })

        if (dataStr) {
          try {
            const data = JSON.parse(dataStr)
            if (eventType === 'status' && data.status) {
              aiGenerateStatus.value = data.status
            } else if (eventType === 'cover' && data.url) {
              postForm.value.coverUrl = data.url
            } else if (eventType === 'content_chunk' && data.text) {
              rawContent += data.text

              let cleanContent = rawContent

              // 1. 提取 TITLE (增强移动端和PC端换行与特殊字符的兼容性)
              // 兼容可能混入的 \r, \n 或 HTML 标签，以及 AI 忘写 #TITLE# 只写了 "标题：" 的情况
              const titleMatch = cleanContent.match(/(?:#TITLE#|标题)[:：\s]*([^<\n\r]+)/i)
              if (titleMatch) {
                postForm.value.title = titleMatch[1].trim()
                cleanContent = cleanContent.replace(/(?:#TITLE#|标题)[:：\s]*[^\n\r<]*(?:[\n\r\s]|<br\s*\/?>)*/i, '')
              } else {
                // 如果没有 #TITLE#，回退提取第一行
                const firstLineMatch = cleanContent.match(/^([^#<\n\r]+)(?:[\n\r\s]|<br\s*\/?>)+/)
                if (firstLineMatch && !cleanContent.startsWith('#TAGS#')) {
                  postForm.value.title = firstLineMatch[1].trim()
                  cleanContent = cleanContent.replace(/^([^#<\n\r]+)(?:[\n\r\s]|<br\s*\/?>)+/, '')
                }
              }

              // 2. 提取 TAGS (兼容 AI 的各种脑残格式)
              const tagsMatch = cleanContent.match(/(?:#TAGS#|话题标签|标签)[:：\s]*([^<\n\r]+)/i)
              if (tagsMatch) {
                const tagsStr = tagsMatch[1].trim()
                const newTags = tagsStr.split(/[,，、\s]/).map(t => t.trim().replace(/^#+/, '')).filter(t => t)

                if (newTags.length > 0) {
                  let finalTags = [...postForm.value.tags] // 保留用户可能已经手动填写的标签
                  newTags.forEach(t => {
                    if (!finalTags.includes(t) && finalTags.length < 3) {
                      finalTags.push(t)
                    }
                  })
                  postForm.value.tags = finalTags
                }
                cleanContent = cleanContent.replace(/(?:#TAGS#|话题标签|标签)[:：\s]*[^\n\r<]*(?:[\n\r\s]|<br\s*\/?>)*/i, '')
              }

              // 2.5 额外提取正文中可能混入的 #xxx 标签 (大模型经常不听话，喜欢在结尾或者正文夹杂 #标签)
              const inlineHashtags = cleanContent.match(/#([^\s#<，。、！\n\r]+)/g)
              if (inlineHashtags) {
                let finalTags = [...postForm.value.tags]
                inlineHashtags.forEach(tag => {
                  const t = tag.replace(/^#+/, '').trim()
                  if (t && t.length >= 1 && !finalTags.includes(t) && finalTags.length < 3) {
                    finalTags.push(t)
                  }
                })
                postForm.value.tags = finalTags
                // 把正文中的 #xxx 静默剥离出 # 号，或者直接移除冗余的末尾标签尾巴
                cleanContent = cleanContent.replace(/(?:\n|<br\s*\/?>)*\s*#([^\s#<，。、！\n\r]+)/g, '')
              }

              // 3. 清理首尾的代码块标记
              if (cleanContent.startsWith('```html')) {
                cleanContent = cleanContent.replace(/^```html[\n\s]*/, '').replace(/[\n\s]*```$/, '')
              }

              // 4. 终极 DOM 规范化引擎：确保实时渲染 (v-html) 与 WangEditor (Slate) 最终渲染 100% 结构一致，杜绝任何抖动
              let htmlContent = cleanContent.replace(/\r/g, '')

              // 扁平化所有块级标签和换行符，统一转换为纯 \n
              htmlContent = htmlContent.replace(/<p[^>]*>/ig, '').replace(/<\/p>/ig, '\n')
              htmlContent = htmlContent.replace(/<br\s*\/?>/ig, '\n')

              // 核心修复：把一切连续的换行符彻底压缩成一个单独的 \n
              // 无论 AI 生成了几个换行、几个空段落，我们统统合并，彻底消除过大的段落间距！
              htmlContent = htmlContent.replace(/\n+/g, '\n')

              // 严格按照单行文字重建干净的 WangEditor 段落
              const blocks = htmlContent.split('\n').map(b => b.trim()).filter(b => b !== '')
              const normalizedHtml = blocks.map(b => `<p>${b}</p>`).join('')

              aiStreamingContent.value = normalizedHtml
              // 彻底不触碰 editorRef 底层的 DOM，流式渲染全权交给结构克隆的伪装容器，
              // 这样既不破坏 WangEditor 的虚拟 DOM 状态，又能达到 100% 一致的视觉效果。

            } else if (eventType === 'done') {
              isAiGenerating.value = false
              showToastMessage(t('pages.postEditPage.msgs.aiGenComplete'), 'success')

              if (params.category && params.category !== t('pages.postEditPage.category.default')) {
                postForm.value.category = params.category
              }

              postForm.value.content = aiStreamingContent.value
              if (editorRef.value) {
                // 生成完毕后，最后执行一次正式的 setHtml 同步状态给编辑器
                editorRef.value.setHtml(aiStreamingContent.value)
              }
            } else if (eventType === 'error') {
              isAiGenerating.value = false
              showToastMessage(data.error, 'error')
            }
          } catch (err) {}
        }
      }
    }
  }).catch(e => {
    isAiGenerating.value = false
    if (e.message === 'canceled' || e.code === 'ERR_CANCELED') {
      showToastMessage(t('pages.postEditPage.msgs.aiGenPaused'), 'warning')
      postForm.value.content = aiStreamingContent.value
      if (editorRef.value) {
        editorRef.value.setHtml(aiStreamingContent.value)
      }
    } else {
      showToastMessage(t('pages.postEditPage.msgs.aiGenError'), 'error')
    }
  })
}

const handleCoverGenerated = async (dataUrl: string) => {
  try {
    const response = await fetch(dataUrl); const blob = await response.blob();
    const file = new File([blob], `cover-${Date.now()}.png`, { type: 'image/png' });
    uploading.value = true; uploadProgress.value = 10;
    const res = await uploadPostImageUsingPost({}, { headers: { 'Content-Type': 'multipart/form-data' } }, file);
    uploadProgress.value = 90;
    if (res.data.code === 0 && res.data.data) {
      postForm.value.coverUrl = res.data.data.url; showCoverGenerator.value = false; showToastMessage(t('pages.postEditPage.msgs.coverGenSuccess'), 'success');
    } else throw new Error(res.data.message || t('pages.postEditPage.msgs.uploadFail'));
  } catch (error: any) { showToastMessage(t('pages.postEditPage.msgs.coverUploadFailMsg').replace('{msg}', String(error.message || t('pages.postEditPage.msgs.unknownError'))), 'error'); }
  finally { uploading.value = false; uploadProgress.value = 0; }
};

const filterCategories = () => {
  const text = categorySearchText.value.trim().toLowerCase()
  filteredCategories.value = text ? categories.value.filter(item => item.toLowerCase().includes(text)) : [...categories.value]
}

const handleCategorySelect = (cat: string) => {
  postForm.value.category = cat; openCategoryModal.value = false; categorySearchText.value = ''; filterCategories();
}

const filterTags = () => {
  const text = customTagInput.value.trim().toLowerCase()
  filteredTags.value = text ? tags.value.filter(item => item.toLowerCase().includes(text)) : [...tags.value]
}

const addCustomTag = () => {
  const val = customTagInput.value.trim()
  if (val && !postForm.value.tags.includes(val)) {
    if (postForm.value.tags.length < 3) { postForm.value.tags.push(val); customTagInput.value = '' }
    else showToastMessage(t('pages.postEditPage.msgs.maxTags3'), 'warning');
  }
}

const toggleTag = (tag: string) => {
  const index = postForm.value.tags.indexOf(tag)
  if (index > -1) postForm.value.tags.splice(index, 1)
  else if (postForm.value.tags.length < 3) postForm.value.tags.push(tag)
  else showToastMessage(t('pages.postEditPage.msgs.maxTags3'), 'warning');
}

const removeTag = (index: number) => postForm.value.tags.splice(index, 1)

const validateForm = () => {
  if (!postForm.value.title?.trim()) return t('pages.postEditPage.msgs.needTitle');
  if (!postForm.value.category) return t('pages.postEditPage.msgs.needCategory');
  const plainText = postForm.value.content.replace(/<[^>]*>/g, '').trim();
  if (!plainText) return t('pages.postEditPage.msgs.needContent');
  if (postForm.value.content.length > 5000) return t('pages.postEditPage.msgs.contentLimit5000');
  return null;
}

const handleSubmit = async () => {
  const errorMsg = validateForm();
  if (errorMsg) return showToastMessage(errorMsg, 'warning');

  submitting.value = true
  try {
    const submitData: any = { ...postForm.value, tags: postForm.value.tags || [] }
    if (isEdit.value) {
      submitData.id = String(route.params.id)
      await updatePostUsingPost(submitData)
      showToastMessage(t('pages.postEditPage.msgs.updateSuccess'), 'success');
    } else {
      if (draftId) submitData.id = draftId
      await addPostUsingPost(submitData)
      showToastMessage(t('pages.postEditPage.msgs.publishSuccess'), 'success');
      draftId = null
    }
    updateInitialFormData()
    router.push('/forum')
  } catch (error: any) {
    showToastMessage(t('pages.postEditPage.msgs.actionFailMsg').replace('{action}', isEdit.value ? t('pages.postEditPage.header.update') : t('pages.postEditPage.header.publish')).replace('{msg}', String(error.message || t('pages.postEditPage.msgs.unknownError'))), 'error');
  } finally { submitting.value = false }
}

const saveDraft = async () => {
  if (!postForm.value.title?.trim() || !postForm.value.content.replace(/<[^>]*>/g, '').trim()) {
    showToastMessage(t('pages.postEditPage.msgs.needTitleAndContent'), 'warning'); return
  }
  submitting.value = true
  try {
    const submitData: any = { ...postForm.value }
    if (draftId) submitData.id = draftId
    await savePostDraftUsingPost(submitData)
    showToastMessage(t('pages.postEditPage.msgs.draftSaveSuccess'), 'success');
    updateInitialFormData()
    // 保存成功后返回上一页
    isLeavingPage = true
    setTimeout(() => {
      router.back()
    }, 500) // 延迟500ms让用户看到成功提示
  } catch (error: any) { showToastMessage(t('pages.postEditPage.msgs.saveFail').replace('{msg}', String(error.message)), 'error'); }
  finally { submitting.value = false }
}

const updateInitialFormData = () => { initialFormData.value = JSON.parse(JSON.stringify(postForm.value)) }

// 草稿箱相关函数
const loadDraftList = async () => {
  draftLoading.value = true
  draftPage.value = 1
  try {
    const res = await listPostDraftsUsingGet()
    if (res.data?.code === 0 && res.data.data) {
      rawDraftList.value = Array.isArray(res.data.data) ? res.data.data : []
      draftList.value = rawDraftList.value.slice(0, draftPageSize)
    }
  } catch (error: any) {
    showToastMessage(t('pages.postEditPage.msgs.getDraftsFail'), 'error')
  } finally {
    draftLoading.value = false
  }
}

const handleDraftScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target) return
  // 判断滚动条是否触底
  const threshold = 15 // 触底阈值
  const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold
  if (isBottom && !draftLoadingMore.value && hasMoreDrafts.value) {
    loadMoreDrafts()
  }
}

const loadMoreDrafts = async () => {
  if (draftLoadingMore.value || !hasMoreDrafts.value) return
  draftLoadingMore.value = true
  // 模拟加载延时以提供更加优雅的动效
  await new Promise(resolve => setTimeout(resolve, 300))
  try {
    draftPage.value += 1
    draftList.value = rawDraftList.value.slice(0, draftPage.value * draftPageSize)
  } finally {
    draftLoadingMore.value = false
  }
}

const loadDraft = (draft: any) => {
  setFormData(draft)
  if (draft.id) draftId = String(draft.id)
  showDraftModal.value = false
  showToastMessage(t('pages.postEditPage.msgs.draftLoaded'), 'success')
}

const deleteDraft = async (draftId: string) => {
  try {
    const res = await deletePostDraftUsingDelete({ draftId: String(draftId) })
    if (res.data?.code === 0) {
      showToastMessage(t('pages.postEditPage.msgs.delSuccess'), 'success')
      rawDraftList.value = rawDraftList.value.filter(d => String(d.id) !== draftId)
      draftList.value = rawDraftList.value.slice(0, draftPage.value * draftPageSize)
    } else {
      showToastMessage(t('pages.postEditPage.msgs.delFail'), 'error')
    }
  } catch (error: any) {
    showToastMessage(t('pages.postEditPage.msgs.delFailMsg').replace('{msg}', String(error.message || t('pages.postEditPage.msgs.unknownError'))), 'error');
  }
}

const formatDraftTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? t('pages.postEditPage.time.justNow') : t('pages.postEditPage.time.minsAgo').replace('{num}', String(minutes))
    }
    return t('pages.postEditPage.time.hoursAgo').replace('{num}', String(hours))
  } else if (days === 1) {
    return t('pages.postEditPage.time.yesterday')
  } else if (days < 7) {
    return t('pages.postEditPage.time.daysAgo').replace('{num}', String(days))
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const openDraftModal = () => {
  showDraftModal.value = true
}

watch(showDraftModal, (newVal) => {
  if (newVal) {
    loadDraftList()
  }
})

const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  toastMessage.value = message; toastType.value = type; showToast.value = true;
  setTimeout(() => showToast.value = false, 3000)
}

let isLeavingPage = false;
let unregisterGuard: Function | null = null;

const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value && !isEdit.value && !isLeavingPage) {
    e.preventDefault(); e.returnValue = ''; return '';
  }
}

const handleCancel = () => {
  if (hasUnsavedChanges.value && !isEdit.value) showLeaveConfirmModal.value = true;
  else router.back();
}

const cancelLeave = () => showLeaveConfirmModal.value = false;
const confirmLeaveWithoutSave = () => { isLeavingPage = true; showLeaveConfirmModal.value = false; router.back(); }
const saveDraftAndLeave = async () => { await saveDraft(); isLeavingPage = true; showLeaveConfirmModal.value = false; router.back(); }

const openPreview = () => {
  if (!postForm.value.title?.trim()) return showToastMessage(t('pages.postEditPage.msgs.firstFillTitle'), 'warning');
  if (!postForm.value.content?.trim()) return showToastMessage(t('pages.postEditPage.msgs.firstFillContent'), 'warning');
  showPreviewModal.value = true
}

const closePreview = () => showPreviewModal.value = false;

onMounted(async () => {
  originalBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  // 初始化 isMobile 状态
  isMobile.value = window.innerWidth < 768

  checkPC()
  window.addEventListener('resize', () => {
    checkPC()
    // 同时更新 isMobile 状态
    isMobile.value = window.innerWidth < 768
  })
  window.addEventListener('beforeunload', beforeUnloadHandler)
  await fetchTagsAndCategories()

  unregisterGuard = router.beforeEach((to, from, next) => {
    if (isLeavingPage || showLeaveConfirmModal.value || showPreviewModal.value || showCoverGenerator.value || openCategoryModal.value || openTagModal.value || showCoverMenu.value) {
      return next();
    }
    if (hasUnsavedChanges.value && !isEdit.value && to.path !== from.path) {
      showLeaveConfirmModal.value = true; next(false);
    } else next();
  });
});

onBeforeUnmount(() => {
  document.body.style.overflow = originalBodyOverflow
  if (editorRef.value) editorRef.value.destroy()
  window.removeEventListener('resize', checkPC)
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  if (unregisterGuard) unregisterGuard()
})

watch(postForm, (newVal) => {
  if (!initialFormData.value.title && !initialFormData.value.content) { updateInitialFormData() }
}, { deep: true })

watch(isAiGenerating, (newVal) => {
  // 注释掉此处的 disable/enable，完全交给外部的 pointer-events:none 来禁用交互，
  // 保证 WangEditor 始终处于 editable 状态，从而能接受 setHtml 的内容更新。
  // if (editorRef.value) {
  //   if (newVal) {
  //     editorRef.value.disable()
  //   } else {
  //     editorRef.value.enable()
  //   }
  // }
})
</script>

<style scoped>
/* ================= 全局与基础 ================= */
.yuemu-post-page {
  position: fixed; inset: 0;
  background-color: var(--background);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-primary);
  overflow: hidden;
  box-sizing: border-box;
}

* { box-sizing: border-box; }

.yuemu-page-inner-wrapper {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .yuemu-page-inner-wrapper { gap: 24px; padding: 0 20px; max-width: 1200px; }
}

.yuemu-app-container {
  width: 100%; max-width: 600px; height: 100dvh;
  background: var(--card-background);
  display: flex; flex-direction: column;
  position: relative; overflow: hidden;
}

.yuemu-editor-pane, .yuemu-preview-pane { flex: 1; }

@media (min-width: 641px) {
  .yuemu-app-container {
    height: 90vh; max-height: 880px; border-radius: 20px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.06);
    border: 1px solid var(--border-color);
  }
  [data-theme='dark'] .yuemu-app-container { box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
}

.yuemu-required { color: #ff4d4f; font-weight: normal; margin-left: 2px; }
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

/* ================= 顶栏 ================= */
.yuemu-app-header {
  height: 54px;
  padding-top: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding-left: 16px; padding-right: 16px;
  background: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0; z-index: 50;
}

/* 使用 1:2:1 布局确保中心对齐不重叠 */
.yuemu-header-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  z-index: 2;
}
.yuemu-header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  z-index: 2;
  min-height: 40px; /* 确保有最小高度 */
}
.yuemu-header-center {
  flex: 2; text-align: center;
  font-size: 16px; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yuemu-icon-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-primary);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0; /* 防止被压缩 */
}
.yuemu-icon-btn:hover { background: var(--hover-background); }

.yuemu-publish-btn {
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  flex-shrink: 0;
}
.yuemu-publish-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(22, 119, 255, 0.3); }
.yuemu-publish-btn:disabled { background: var(--hover-background); color: var(--text-secondary); box-shadow: none; cursor: not-allowed; }

/* 隐藏移动端图标辅助类 */
.yuemu-mobile-hide-icon {
  display: inline-block;
}

.yuemu-mobile-title-inline {
  display: none;
}

/* 顶部草稿箱和预览按钮 */
.yuemu-draft-inbox-btn, .yuemu-preview-header-btn {
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 18px;
  transition: 0.2s;
  flex-shrink: 0;
}
.yuemu-draft-inbox-btn:hover, .yuemu-preview-header-btn:hover {
  background: var(--hover-background);
}
.yuemu-draft-inbox-btn i, .yuemu-preview-header-btn i {
  color: #007AFF;
  font-size: 15px;
}

/* 触底加载更多及无更多提示样式 */
.yuemu-draft-load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.yuemu-draft-load-more i {
  color: #007AFF;
}
.yuemu-draft-no-more {
  text-align: center;
  padding: 16px 0;
  color: var(--text-secondary);
  font-size: 12px;
  opacity: 0.6;
}

/* PC端按钮组 */
.yuemu-pc-actions {
  display: none; /* 默认隐藏 */
}

@media (min-width: 768px) {
  .yuemu-pc-actions {
    display: flex;
    gap: 12px;
  }
}

.yuemu-btn-draft {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
.yuemu-btn-draft:hover:not(:disabled) {
  background: var(--hover-background);
  color: var(--text-primary);
  border-color: var(--text-secondary);
}
.yuemu-btn-draft:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.yuemu-post-actions-row .yuemu-ai-btn {
  background: rgba(24, 144, 255, 0.08);
  border-color: rgba(24, 144, 255, 0.3);
  color: #1890ff;
  flex: 1;
}
.yuemu-post-actions-row .yuemu-ai-btn:hover {
  background: rgba(24, 144, 255, 0.15);
  border-color: #1890ff;
  color: #1890ff;
}

.yuemu-btn-publish {
  background: #007AFF;
  border: none;
  color: #fff;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
  height: 36px;
  white-space: nowrap;
}
.yuemu-btn-publish:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3);
}
.yuemu-btn-publish:disabled {
  background: var(--border-color);
  color: var(--text-secondary);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.yuemu-auto-save-bar { background: rgba(250, 173, 20, 0.1); color: #faad14; font-size: 12px; padding: 6px 16px; display: flex; align-items: center; gap: 6px; justify-content: center; flex-shrink: 0; }

/* ================= 核心滚动区 ================= */
.yuemu-app-content {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  background: var(--background); display: flex; flex-direction: column; position: relative;
}

/* 1. 标题与封面区 (紧凑并排) */
.yuemu-hero-section {
  display: flex; align-items: flex-start; gap: 16px; padding: 8px 20px 16px;
  background: var(--card-background);
}

.yuemu-title-wrapper { flex: 1; position: relative; display: flex; flex-direction: column; min-width: 0;}
.yuemu-title-input {
  width: 100%; border: none; outline: none; background: transparent; font-size: 22px;
  font-weight: 700; color: var(--text-primary); resize: none; line-height: 1.4;
  padding: 0; margin: 0; font-family: inherit;
}
.yuemu-title-input::placeholder { color: var(--text-secondary); opacity: 0.5; font-weight: 600;}
.yuemu-title-count { font-size: 12px; color: var(--text-secondary); opacity: 0.7; margin-top: 8px; align-self: flex-end;}
.yuemu-title-count.is-full { color: #ff4d4f; }

/* 小巧的缩略封面 */
.yuemu-cover-thumbnail {
  width: 90px; height: 120px; flex-shrink: 0; border-radius: 12px;
  background: var(--hover-background); border: 1px solid var(--border-color);
  overflow: hidden; position: relative; cursor: pointer; transition: 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.yuemu-cover-thumbnail:hover { border-color: #1677ff; }
.yuemu-cover-img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-cover-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 500;}
.yuemu-cover-placeholder i { font-size: 24px; opacity: 0.6;}
.yuemu-cover-overlay { position: absolute; bottom: 6px; right: 6px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; backdrop-filter: blur(4px); }
.yuemu-uploading-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px;}

/* 2. 编辑器 */
.yuemu-editor-wrapper { flex: 1 0 auto; display: flex; flex-direction: column; position: relative; background: var(--card-background); min-height: 400px;}
.yuemu-sticky-toolbar-wrapper {
  position: sticky; top: 0; z-index: 10;
  background: var(--card-background); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);
}
[data-theme='dark'] .yuemu-sticky-toolbar-wrapper { background: rgba(30, 30, 35, 0.85); }

:deep(.w-e-toolbar) { border: none !important; background: var(--card-background); padding: 4px 10px !important; }
:deep(.w-e-toolbar .w-e-bar) { flex-wrap: nowrap !important; overflow-x: auto !important; scrollbar-width: none; }
:deep(.w-e-toolbar .w-e-bar::-webkit-scrollbar) { display: none; }

.yuemu-w-editor { flex: 1 0 auto; height: auto !important; }
:deep(.w-e-text-container) { height: auto !important; min-height: 400px !important; flex: 1 0 auto !important; background: var(--card-background); color: var(--text-primary) !important; overflow-y: hidden !important; }
:deep(.w-e-text-container [data-slate-editor]) { padding: 20px !important; font-size: 16px !important; line-height: 1.8 !important; color: var(--text-primary) !important; min-height: 400px !important; }
:deep(.w-e-text-placeholder) { color: var(--text-secondary) !important; font-style: normal !important; top: 20px !important; left: 20px !important; }
:deep(.w-e-text-container img) { max-width: 100% !important; height: auto !important; border-radius: 8px; margin: 12px 0; display: block; }

/* 3. 极简设置区 (iOS Style) */
.yuemu-settings-list { margin: 16px; background: var(--card-background); border-radius: 16px; border: 1px solid var(--border-color);}
.yuemu-post-actions-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; gap: 16px; }
.yuemu-draft-actions { display: flex; gap: 12px; }
.yuemu-pc-draft-btn { background: var(--hover-background); padding: 0 16px; height: 36px; border-radius: 20px; border: 1px solid var(--border-color); }
.yuemu-setting-cell { display: flex; align-items: center; justify-content: space-between; padding: 16px; cursor: pointer; transition: background 0.2s; }
.yuemu-setting-cell:hover { background: var(--hover-background); }
.yuemu-setting-divider { height: 1px; background: var(--border-color); margin-left: 48px; }
.yuemu-cell-left { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 500; color: var(--text-primary); }
.yuemu-icon-wrap { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;}
.yuemu-bg-blue { background: #007AFF; }
.yuemu-bg-orange { background: #FF9500; }

.yuemu-required { color: #ff3b30; font-weight: normal; margin-left: 2px; }
.yuemu-cell-right { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-primary); }
.yuemu-cell-value { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-placeholder { color: var(--text-secondary); opacity: 0.7;}
.yuemu-arrow-icon { color: var(--text-secondary); opacity: 0.5; font-size: 14px; margin-left: 4px;}
.yuemu-tag-preview-list { display: flex; gap: 6px; }
.yuemu-preview-tag { background: rgba(22, 119, 255, 0.1); color: #1677ff; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;}
.yuemu-more { background: var(--hover-background); color: var(--text-secondary); }

/* ================= 封面操作抽屉 ================= */
.yuemu-menu-sheet { background: var(--card-background); padding: 0 16px 16px !important; border: none !important;}
.yuemu-menu-list { background: var(--card-background); border-radius: 16px; overflow: hidden; margin-bottom: 12px; }
.yuemu-menu-btn { width: 100%; padding: 18px; background: transparent; border: none; font-size: 16px; font-weight: 500; color: var(--text-primary); cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px;}
.yuemu-menu-btn:hover { background: var(--hover-background); }
.yuemu-menu-divider { height: 1px; background: var(--border-color); }
.yuemu-menu-btn.yuemu-danger { color: #ff4d4f; }
.yuemu-menu-cancel { width: 100%; border: none; background: var(--card-background); border-radius: 16px; padding: 18px; text-align: center; font-size: 16px; font-weight: 600; color: #1677ff; cursor: pointer; transition: 0.2s;}
.yuemu-menu-cancel:hover { background: var(--hover-background); }

/* ================= 通用弹窗/抽屉样式 ================= */
.yuemu-fade-modal-enter-active, .yuemu-fade-modal-leave-active { transition: opacity 0.3s; }
.yuemu-fade-modal-enter-from, .yuemu-fade-modal-leave-to { opacity: 0; }
.yuemu-fade-modal-enter-active .yuemu-action-sheet-panel, .yuemu-fade-modal-enter-active .yuemu-center-modal { animation: yuemu-slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.yuemu-fade-modal-leave-active .yuemu-action-sheet-panel, .yuemu-fade-modal-leave-active .yuemu-center-modal { animation: yuemu-slideDown 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
@keyframes yuemu-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes yuemu-slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }

.yuemu-action-sheet-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; justify-content: center; backdrop-filter: blur(4px);}
.yuemu-action-sheet-panel { width: 100%; background: var(--card-background); border-radius: 20px 20px 0 0; padding-bottom: env(safe-area-inset-bottom, 0px); display: flex; flex-direction: column; max-height: calc(100% - 40px); border: 1px solid var(--border-color);}
.yuemu-sheet-drag-bar { width: 40px; height: 4px; background: var(--border-color); border-radius: 2px; margin: 10px auto; }
.yuemu-sheet-header { position: relative; text-align: center; padding: 10px 0 16px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.yuemu-sheet-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
.yuemu-sheet-close { position: absolute; right: 16px; top: 8px; border: none; background: transparent; font-size: 20px; color: var(--text-secondary); padding: 4px; cursor: pointer; transition: 0.2s;}
.yuemu-sheet-close:hover { color: var(--text-primary); }

.yuemu-sheet-search { padding: 12px 16px; position: relative; border-bottom: 1px solid var(--border-color); display: flex; gap: 10px; }
.yuemu-sheet-search i.fa-magnifying-glass { position: absolute; left: 28px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
.yuemu-sheet-search input { flex: 1; padding: 10px 10px 10px 34px; background: var(--hover-background); border: none; border-radius: 10px; outline: none; font-size: 15px; color: var(--text-primary); }
.yuemu-tag-input { padding-left: 12px !important; }
.yuemu-add-tag-btn { background: #1677ff; color: #fff; border: none; width: 40px; border-radius: 10px; cursor: pointer; }

.yuemu-active-tags-area { padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 1px dashed var(--border-color); }
.yuemu-active-tag { background: rgba(22, 119, 255, 0.1); color: #1677ff; padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.yuemu-active-tag i { cursor: pointer; opacity: 0.7; }

.yuemu-sheet-content { padding: 16px; overflow-y: auto; flex: 1; min-height: 0; }
.yuemu-category-grid, .yuemu-tag-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.yuemu-category-item, .yuemu-tag-item { background: var(--hover-background); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 6px; text-align: center; font-size: 14px; font-weight: 500; color: var(--text-primary); cursor: pointer; transition: 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-tag-item { font-size: 13px; padding: 10px 4px; color: var(--text-secondary); font-weight: normal;}
.is-active { background: rgba(22, 119, 255, 0.1); color: #1677ff !important; border-color: #1677ff !important; font-weight: 600 !important; }
.yuemu-empty-tips { text-align: center; color: var(--text-secondary); padding: 40px 0; font-size: 14px; }
.yuemu-sheet-footer { padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--border-color); background: var(--card-background); }
.yuemu-done-btn { width: 100%; height: 44px; background: #1677ff; color: #fff; border: none; border-radius: 22px; font-size: 15px; font-weight: 600; cursor: pointer; }

/* 提取封面 */
.yuemu-cover-images-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.yuemu-cover-image-item { aspect-ratio: 1; border-radius: 12px; overflow: hidden; position: relative; cursor: pointer; border: 1px solid var(--border-color); }
.yuemu-cover-preview-img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-cover-sel-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; gap: 6px; font-size: 13px; font-weight: 500; transition: 0.2s; backdrop-filter: blur(2px);}
.yuemu-cover-image-item:hover .yuemu-cover-sel-overlay { opacity: 1; }

/* 草稿箱 */
.yuemu-draft-loading { text-align: center; padding: 40px 0; color: var(--text-secondary); font-size: 14px; }
.yuemu-draft-loading i { font-size: 24px; margin-bottom: 8px; display: block; }
.yuemu-empty-draft { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
.yuemu-empty-draft i { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }
.yuemu-empty-draft p { margin: 0; font-size: 14px; }
.yuemu-draft-list { display: flex; flex-direction: column; gap: 12px; }
.yuemu-draft-item { display: flex; gap: 12px; padding: 12px; background: var(--hover-background); border-radius: 16px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
.yuemu-draft-item:hover { background: var(--card-background); border-color: var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.yuemu-draft-cover { width: 70px; height: 70px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: var(--background); display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--text-secondary); border: 1px solid var(--border-color);}
.yuemu-draft-cover img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-draft-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.yuemu-draft-title { font-size: 15px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.yuemu-draft-preview { font-size: 13px; color: var(--text-secondary); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.yuemu-draft-time { font-size: 12px; color: var(--text-secondary); margin-top: auto; }
.yuemu-draft-delete { width: 36px; height: 36px; border-radius: 50%; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; transition: 0.2s; flex-shrink: 0; align-self: center; display: flex; align-items: center; justify-content: center; font-size: 16px;}
.yuemu-draft-delete:hover { background: rgba(255, 77, 79, 0.1); color: #ff4d4f; }

/* 封面预览全屏层 */
.yuemu-cover-preview-fullscreen {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.yuemu-cover-preview-header {
  height: 54px;
  padding-top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.yuemu-preview-close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.yuemu-preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.yuemu-preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.yuemu-cover-preview-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.yuemu-cover-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: yuemu-zoomInImage 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

@keyframes yuemu-zoomInImage {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 居中弹窗 */
.yuemu-center-modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.yuemu-center-modal { background: var(--card-background); width: 85%; max-width: 320px; border-radius: 20px; padding: 24px; text-align: center; animation: yuemu-zoomIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); border: 1px solid var(--border-color);}
@keyframes yuemu-zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.yuemu-modal-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px; }
.yuemu-blue { background: rgba(22, 119, 255, 0.1); color: #1677ff; }
.yuemu-warning { background: rgba(250, 173, 20, 0.1); color: #faad14; }
.yuemu-modal-title { font-size: 18px; font-weight: 600; margin: 0 0 10px; color: var(--text-primary); }
.yuemu-modal-desc { font-size: 14px; color: var(--text-secondary); margin: 0 0 24px; line-height: 1.5; }
.yuemu-modal-actions { display: flex; gap: 12px; }
.yuemu-vertical { flex-direction: column; gap: 10px; }
.yuemu-modal-btn {
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: 0.2s;
  min-height: 44px; /* 确保最小高度 */
  padding: 0 20px; /* 添加内边距 */
  display: flex;
  align-items: center;
  justify-content: center;
}
.yuemu-primary { background: #1677ff; color: #fff; flex: 1;}
.yuemu-outline { background: var(--hover-background); color: var(--text-primary); flex: 1;}
.yuemu-danger-text { background: transparent; color: #ff4d4f; }

/* 垂直布局时移除 flex: 1，防止按钮被拉伸 */
.yuemu-vertical .yuemu-modal-btn {
  flex: 0 0 auto; /* 不拉伸，保持固定高度 */
  width: 100%; /* 但宽度占满 */
}

/* 预览层 */
.yuemu-preview-layer { position: absolute; inset: 0; background: var(--background); z-index: 300; display: flex; flex-direction: column; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.yuemu-preview-layer.is-active { transform: translateY(0); }
.yuemu-preview-header { height: 54px; padding: 0 16px 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); font-weight: 600; background: var(--card-background); }
.yuemu-preview-back-btn { background: none; border: none; font-size: 16px; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 0;}
.yuemu-preview-body { flex: 1; overflow-y: auto; background: var(--background); border: 1px solid var(--border-color);}
.yuemu-post-detail-mock { background: var(--card-background); border-radius: 16px; padding: 24px; min-height: 100%; border: 1px solid var(--border-color);}
.yuemu-preview-title { font-size: 24px; font-weight: 700; margin: 0 0 20px; line-height: 1.4; color: var(--text-primary); }

/* PC端右侧预览 */
.yuemu-preview-pane { display: none; }
@media (min-width: 1024px) {
  .yuemu-preview-pane { display: flex; background: var(--background); border: none; }
  .yuemu-preview-pane .yuemu-post-detail-mock { border-radius: 8px; box-shadow: 0 12px 40px rgba(0,0,0,0.04);}
}

/* Toast */
.yuemu-toast-message { position: absolute; top: 20px; left: 50%; transform: translate(-50%, -20px); background: rgba(0,0,0,0.8); color: #fff; padding: 12px 24px; border-radius: 30px; display: flex; align-items: center; gap: 8px; z-index: 2000; font-size: 15px; font-weight: 500; opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); backdrop-filter: blur(8px);}
.yuemu-toast-message.yuemu-show { transform: translate(-50%, 0); opacity: 1; visibility: visible; }
.success i { color: #52c41a; }
.error i { color: #ff4d4f; }
.warning i { color: #faad14; }

/* 移动端底部按钮 */
.yuemu-app-footer {
  display: none; /* 默认隐藏，只在移动端显示 */
}

@media (max-width: 767px) {
  .yuemu-app-footer {
    display: flex;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
    background: var(--card-background);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 0.5px solid rgba(0,0,0,0.08);
    gap: 12px;
    flex-shrink: 0;
    position: relative;
    z-index: 20;
  }

  [data-theme='dark'] .yuemu-app-footer {
    background: rgba(28,28,30,0.85);
    border-top: 0.5px solid rgba(255,255,255,0.1);
  }

  .yuemu-footer-btn {
    height: 44px;
    border-radius: 22px;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    border: none;
    transition: 0.2s;
  }

  .yuemu-app-footer .yuemu-draft-btn {
    flex: 1;
    max-width: 120px;
    background: var(--hover-background);
    color: var(--text-primary);
  }

  .yuemu-app-footer .yuemu-ai-btn {
    flex: 1;
    max-width: 110px;
    background: rgba(24, 144, 255, 0.1);
    color: #1890ff;
  }

  .yuemu-app-footer .yuemu-publish-btn-large {
    flex: 2;
    background: #007AFF;
    color: #fff;
  }

  .yuemu-app-footer .yuemu-publish-btn-large:disabled {
    background: var(--hover-background);
    color: var(--text-secondary);
    cursor: not-allowed;
    opacity: 0.5;
  }
}

/* ====================================
   ★ 移动端特调 (隐藏多余内容)
   ==================================== */
@media (max-width: 767px) {
  .yuemu-app-header {
    padding-left: 12px; padding-right: 12px; border-bottom: none;
    height: 50px;
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
  }

  .yuemu-mobile-title-inline {
    display: inline-block !important;
    margin-left: 8px;
    font-size: 15px !important;
    font-weight: 700 !important;
    color: var(--text-primary);
  }

  .yuemu-mobile-hide {
    display: none !important;
  }

  .yuemu-mobile-hide-icon {
    display: none !important;
  }

  .yuemu-header-right {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    z-index: 2;
  }

  .yuemu-header-title { font-size: 16px; }
  .yuemu-icon-btn { font-size: 20px; width: 40px; height: 40px;}

  /* 移动端极简黑白灰胶囊按钮适配 */
  .yuemu-draft-inbox-btn, .yuemu-preview-header-btn {
    background: var(--hover-background) !important;
    border: 1px solid var(--border-color) !important;
    padding: 5px 12px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: var(--text-primary) !important;
    height: auto !important;
    border-radius: 16px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
    transform: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0 !important;
    transition: all 0.2s ease !important;
  }
  .yuemu-draft-inbox-btn:active, .yuemu-preview-header-btn:active {
    background: var(--border-color) !important;
    opacity: 0.85;
  }

  .yuemu-action-sheet-mask { align-items: flex-end; }
  .yuemu-action-sheet-panel { width: 100vw !important; max-width: 100vw !important; border-radius: 24px 24px 0 0; border: none;}
}

/* ====================================
   ★ 暗黑模式深度适配
   ==================================== */
[data-theme='dark'] .yuemu-post-page { background-color: #000; }
[data-theme='dark'] .yuemu-app-container { background: #141414; border-color: #333; }
[data-theme='dark'] .yuemu-app-header,
[data-theme='dark'] .yuemu-title-cover-section,
[data-theme='dark'] .yuemu-settings-list,
[data-theme='dark'] .yuemu-action-sheet-panel,
[data-theme='dark'] .yuemu-sheet-footer,
[data-theme='dark'] .yuemu-center-modal,
[data-theme='dark'] .yuemu-menu-list,
[data-theme='dark'] .yuemu-menu-cancel,
[data-theme='dark'] .yuemu-mobile-footer { background: #1c1c1e; }
[data-theme='dark'] .yuemu-app-content, [data-theme='dark'] .yuemu-preview-layer, [data-theme='dark'] .yuemu-preview-body { background: #000; }
[data-theme='dark'] .yuemu-editor-wrapper { background: #141414; }
[data-theme='dark'] .yuemu-border-color, [data-theme='dark'] .yuemu-setting-divider, [data-theme='dark'] .yuemu-menu-divider { border-color: rgba(255,255,255,0.1); background-color: rgba(255,255,255,0.1); }

/* AI Capsule and Preview */
.yuemu-ai-capsule {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 28px;
  border-radius: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  border: 1px solid rgba(24, 144, 255, 0.2);
  animation: capsuleBreathe 2.5s infinite ease-in-out;
}
@keyframes capsuleBreathe {
  0% { box-shadow: 0 4px 15px rgba(0,0,0,0.05), 0 0 0 0 rgba(24, 144, 255, 0.1); }
  50% { box-shadow: 0 4px 15px rgba(0,0,0,0.05), 0 0 20px 6px rgba(24, 144, 255, 0.4); }
  100% { box-shadow: 0 4px 15px rgba(0,0,0,0.05), 0 0 0 0 rgba(24, 144, 255, 0.1); }
}
[data-theme='dark'] .yuemu-ai-capsule {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(24, 144, 255, 0.4);
}
.yuemu-ai-capsule i {
  color: #1890ff;
  font-size: 18px;
}
.yuemu-ai-capsule .capsule-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.yuemu-ai-stop-btn {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 8px;
  flex-shrink: 0;
}
.yuemu-ai-stop-btn:hover {
  background: #ff4d4f;
  color: #fff;
}

.yuemu-ai-preview-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--background-color);
}
.yuemu-ai-preview-content p {
  margin-bottom: 1em;
}

.yuemu-slide-up-enter-active,
.yuemu-slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.yuemu-slide-up-enter-from,
.yuemu-slide-up-leave-to {
  transform: translate(-50%, -30px) !important;
  opacity: 0;
}

/* 预览封面虚线风格 (参考图片详情) */
.yuemu-preview-cover-dashed {
  margin: 20px 0;
  padding: 12px;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  background: var(--hover-background);
  display: flex;
  justify-content: center;
  align-items: center;
}
.yuemu-preview-cover-dashed img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  display: block;
}

/* AI 创作全局遮罩与交互锁定 */
.is-ai-generating::after {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-primary);
  opacity: 0.15;
  z-index: 999;
  pointer-events: none; /* 允许滚动穿透 */
  backdrop-filter: blur(1px);
}

.is-ai-generating .yuemu-app-header *,
.is-ai-generating .yuemu-app-content > *:not(#editor-scroll-container) {
  pointer-events: none !important;
}

.is-ai-generating .yuemu-title-input {
  pointer-events: none !important;
  opacity: 0.8;
}

.is-ai-generating .yuemu-settings-list {
  pointer-events: none !important;
  opacity: 0.7;
}
</style>
