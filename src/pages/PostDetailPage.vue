<template>
  <div class="post-detail-page">

    <div v-if="showAutoScrollIndicator" class="floating-scroll-controls">
      <div class="control-btn" @click="toggleSpeed" :title="$t('pages.postDetailPage.speedControl')">
        <i class="fas fa-bolt"></i>
        <span>{{ speedLevels[currentSpeedIndex].label }}</span>
      </div>
      <div class="divider"></div>
      <div class="control-btn stop-btn" @click="stopPostAutoScroll" :title="$t('pages.postDetailPage.stopScroll')">
        <i class="fas fa-stop"></i>
        <span>{{ $t('pages.postDetailPage.stop') }}</span>
      </div>
    </div>

    <!-- ========== 专为 PC 打造的沉浸式双栏架构 ========== -->
    <div class="pc-pure-layout" :class="{ 'has-sidebar': isCommentVisible }" v-if="!isMobile">
      <!-- 互动按钮的文档流替身 -->
      <div class="pc-floating-actions-placeholder"></div>

      <!-- 真正的悬浮互动按钮 -->
      <div class="pc-floating-actions">
        <div class="action-item like-action" :class="{ active: post.isLiked === 1 }" @click="handleLike" :title="$t('pages.postDetailPage.actions.like')">
          <div class="icon-wrap"><i :class="post.isLiked === 1 ? 'fas fa-heart' : 'far fa-heart'"></i><span class="count" v-if="post.likeCount">{{ post.likeCount }}</span></div><span class="action-text">{{ $t('pages.postDetailPage.actions.like') }}</span>
        </div>
        <div class="action-item comment-action" @click="toggleCommentSection" :class="{ active: isCommentVisible }" :title="$t('pages.postDetailPage.actions.comment')">
          <div class="icon-wrap"><i class="fas fa-comment"></i><span class="count" v-if="post.commentCount">{{ post.commentCount }}</span></div><span class="action-text">{{ $t('pages.postDetailPage.actions.comment') }}</span>
        </div>
        <div class="action-item fav-action" :class="{ active: post.isFavorited === 1 }" @click="doFavorite" :title="$t('pages.postDetailPage.actions.favorite')">
          <div class="icon-wrap"><i :class="post.isFavorited === 1 ? 'fas fa-star' : 'far fa-star'"></i><span class="count" v-if="post.favoriteCount">{{ post.favoriteCount }}</span></div><span class="action-text">{{ $t('pages.postDetailPage.actions.favorite') }}</span>
        </div>
        <div class="action-item share-action" @click="handleShare" :title="$t('pages.postDetailPage.actions.share')">
          <div class="icon-wrap"><i class="far fa-paper-plane"></i></div><span class="action-text">{{ $t('pages.postDetailPage.actions.share') }}</span>
        </div>
        <div class="action-item more-action-item" @click="showMoreModal = true" :title="$t('pages.postDetailPage.actions.more')">
          <div class="icon-wrap"><i class="fas fa-ellipsis-h"></i></div><span class="action-text">{{ $t('pages.postDetailPage.actions.more') }}</span>
        </div>
      </div>

      <div class="pc-pure-main">
        <div class="pc-pure-article">
          <div v-if="loading" class="skeleton-loading title-skeleton"></div>
          <h1 v-else class="post-title">{{ post.title }}</h1>

          <div class="post-meta-bar">
            <div v-if="loading" class="skeleton-loading avatar-skeleton-small"></div>
            <img v-else :src="post.user?.userAvatar || getDefaultAvatar(post.user?.userName)" class="meta-avatar" @click="handleUserClick(post.user)">
            <span class="meta-author" @click="handleUserClick(post.user)">{{ post.user?.userName || $t('pages.postDetailPage.anonymous') }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-time">{{ formatShortDate(post.createTime) }}</span>

            <span v-if="post.user?.id !== loginUserStore.loginUser?.id"
                  class="meta-follow-btn"
                  :class="{ 'is-followed': isFollowed, 'is-loading': followLoading }"
                  @click="!followLoading && handleFollow()">
                {{ isFollowed ? $t('pages.postDetailPage.followed') : $t('pages.postDetailPage.follow') }}
              </span>
          </div>

          <div v-if="loading" class="skeleton-loading cover-skeleton"></div>
          <div v-else-if="post.coverUrl" class="post-cover-wrapper" @click="openImagePreview(post.coverUrl)">
            <img :src="post.coverUrl" class="post-cover-img" :alt="$t('pages.postDetailPage.coverAlt')" />
          </div>

          <div class="content-divider" v-if="!loading">
            <span class="divider-text">{{ $t('pages.postDetailPage.contentDivider') }}</span>
          </div>

          <div v-if="loading" class="skeleton-loading content-skeleton"></div>
          <Html-content v-else :content="post.content" class="html-content-render" />

          <div class="tags-wrapper" v-if="post?.category || (post?.tagList && post.tagList.length > 0)">
            <span v-if="post?.category" class="xhs-category">{{ post?.category }}</span>
            <span v-for="tag in post?.tagList" :key="tag" class="xhs-tag"># {{ tag }}</span>
          </div>

          <div class="yuemu-sponsor-ad-wrapper" style="margin: 32px 0;" v-if="$enableAds">
            <div class="yuemu-sponsor-ad-label" style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items: center; padding-left: 2px;">
              <i class="fas fa-ad" style="margin-right: 6px; color: #52c41a;"></i> {{ $t('components.bigPicture.sponsoredTitle') || '精选赞助内容' }}
            </div>
            <div style="position: relative; width: 100%; height: 140px;">
              <GlobalAdBanner margin="0" :fillHeight="true" />
            </div>
          </div>

          <div class="end-divider">- THE END -</div>
        </div>
      </div>

      <!-- 侧边栏占据文档流位置的透明替身 -->
      <div class="pc-pure-sidebar-placeholder" v-show="isCommentVisible"></div>

      <!-- 真正的右侧悬浮评论侧栏（绝对固定版） -->
      <div class="pc-pure-sidebar" v-show="isCommentVisible">
        <div class="comment-header">
          <h3>{{ $t('pages.postDetailPage.commentsCount', { count: post.commentCount || 0 }) }}</h3>
          <button class="close-btn" @click="toggleCommentSection"><i class="fas fa-times"></i></button>
        </div>
        <div class="comments-list" ref="pcCommentsScrollRef" @scroll="handlePcSiderScroll">
          <div v-if="commentloading && queryRequest.current === 1" class="comment-skeletons">
            <div v-for="i in 5" :key="i" class="comment-item-skeleton">
              <div class="skeleton-loading avatar-skeleton"></div>
              <div class="skeleton-content"><div class="skeleton-loading name-skeleton"></div><div class="skeleton-loading text-skeleton"></div></div>
            </div>
          </div>
          <comment-list v-else :comments="comments" @reply-clicked="handleReplyClick" @update-comments="queryComments" />
          <div v-if="isEndOfData" class="end-message">{{ $t('pages.postDetailPage.endMessage') }}</div>
        </div>

        <div class="comment-input-bar">
          <input v-model="commentContent" :placeholder="replyCommentId ? $t('pages.postDetailPage.replyPrefix', { user: replyTargetUserName }) : $t('pages.postDetailPage.addComment')"
                 class="comment-input-field" @input="handleInputChange" @keydown.enter.prevent="addComment"
                 maxlength="200" @focus="handleInputFocus" @blur="handleInputBlur">
          <button class="emoji-btn" @click.stop="toggleEmojiPicker" @mousedown.prevent><i class="far fa-smile"></i></button>
          <button class="send-btn" :disabled="!commentContent.trim()" @click="addComment" @mousedown.prevent>{{ $t('pages.postDetailPage.send') }}</button>
        </div>
        <div v-if="showEmojiPicker" class="emoji-picker-wrapper" @mousedown.prevent>
          <emoji-picker class="custom-emoji-picker" :i18n="emojiI18n" @select="onEmojiSelect" />
        </div>
      </div>
    </div>

    <!-- ========== 移动端保留原本结构 ========== -->
    <div class="xhs-container" :class="{ 'comments-hidden': !isCommentVisible }" v-if="isMobile">

      <div class="pc-floating-actions" v-if="!isMobile">
        <div class="action-item like-action" :class="{ active: post.isLiked === 1 }" @click="handleLike" :title="$t('pages.postDetailPage.actions.like')">
          <div class="icon-wrap"><i :class="post.isLiked === 1 ? 'fas fa-heart' : 'far fa-heart'"></i><span class="count" v-if="post.likeCount">{{ post.likeCount }}</span></div><span class="action-text">{{ $t('pages.postDetailPage.actions.like') }}</span>
        </div>
        <div class="action-item comment-action" @click="toggleCommentSection" :class="{ active: isCommentVisible }" :title="$t('pages.postDetailPage.actions.comment')">
          <div class="icon-wrap"><i class="fas fa-comment"></i><span class="count" v-if="post.commentCount">{{ post.commentCount }}</span></div><span class="action-text">{{ $t('pages.postDetailPage.actions.comment') }}</span>
        </div>
        <div class="action-item fav-action" :class="{ active: post.isFavorited === 1 }" @click="doFavorite" :title="$t('pages.postDetailPage.actions.favorite')">
          <div class="icon-wrap"><i :class="post.isFavorited === 1 ? 'fas fa-star' : 'far fa-star'"></i><span class="count" v-if="post.favoriteCount">{{ post.favoriteCount }}</span></div><span class="action-text">{{ $t('pages.postDetailPage.actions.favorite') }}</span>
        </div>
        <div class="action-item share-action" @click="handleShare" :title="$t('pages.postDetailPage.actions.share')">
          <div class="icon-wrap"><i class="far fa-paper-plane"></i></div><span class="action-text">{{ $t('pages.postDetailPage.actions.share') }}</span>
        </div>
        <div class="action-item more-action-item" @click="showMoreModal = true" :title="$t('pages.postDetailPage.actions.more')">
          <div class="icon-wrap"><i class="fas fa-ellipsis-h"></i></div><span class="action-text">{{ $t('pages.postDetailPage.actions.more') }}</span>
        </div>
      </div>

      <div class="xhs-main-card">
        <div class="xhs-content-section content-scroll-wrapper" ref="contentScrollWrapper">
          <div class="content-inner">

            <div v-if="loading" class="skeleton-loading title-skeleton"></div>
            <h1 v-else class="post-title">{{ post.title }}</h1>

            <div class="post-meta-bar">
              <div v-if="loading" class="skeleton-loading avatar-skeleton-small"></div>
              <img v-else :src="post.user?.userAvatar || getDefaultAvatar(post.user?.userName)" class="meta-avatar" @click="handleUserClick(post.user)">
              <span class="meta-author" @click="handleUserClick(post.user)">{{ post.user?.userName || $t('pages.postDetailPage.anonymous') }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-time">{{ formatShortDate(post.createTime) }}</span>

              <span v-if="post.user?.id !== loginUserStore.loginUser?.id"
                    class="meta-follow-btn"
                    :class="{ 'is-followed': isFollowed, 'is-loading': followLoading }"
                    @click="!followLoading && handleFollow()">
                {{ isFollowed ? $t('pages.postDetailPage.followed') : $t('pages.postDetailPage.follow') }}
              </span>
            </div>

            <div v-if="loading" class="skeleton-loading cover-skeleton"></div>
            <div v-else-if="post.coverUrl" class="post-cover-wrapper" @click="openImagePreview(post.coverUrl)">
              <img :src="post.coverUrl" class="post-cover-img" :alt="$t('pages.postDetailPage.coverAlt')" />
            </div>

            <div class="content-divider" v-if="!loading">
              <span class="divider-text">{{ $t('pages.postDetailPage.contentDivider') }}</span>
            </div>

            <div v-if="loading" class="skeleton-loading content-skeleton"></div>
            <Html-content v-else :content="post.content" class="html-content-render" />

            <div class="tags-wrapper" v-if="post?.category || (post?.tagList && post.tagList.length > 0)">
              <span v-if="post?.category" class="xhs-category">{{ post?.category }}</span>
              <span v-for="tag in post?.tagList" :key="tag" class="xhs-tag"># {{ tag }}</span>
            </div>

            <div class="yuemu-sponsor-ad-wrapper" style="margin: 32px 0;" v-if="$enableAds">
              <div class="yuemu-sponsor-ad-label" style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items: center; padding-left: 2px;">
                <i class="fas fa-ad" style="margin-right: 6px; color: #52c41a;"></i> {{ $t('components.bigPicture.sponsoredTitle') || '精选赞助内容' }}
              </div>
              <div style="position: relative; width: 100%; height: 100px;">
                <GlobalAdBanner margin="0" :fillHeight="true" />
              </div>
            </div>

            <div class="end-divider">- THE END -</div>
          </div>
        </div>

        <div class="xhs-comment-section info-section" ref="commentsRef" v-show="!isMobile && isCommentVisible">
          <div class="comment-header">
            <h3>{{ $t('pages.postDetailPage.commentsCount', { count: post.commentCount || 0 }) }}</h3>
            <button class="close-btn" @click="toggleCommentSection"><i class="fas fa-times"></i></button>
          </div>
          <div class="comments-list" ref="scrollContainer" @scroll="handleScroll">
            <div v-if="commentloading && queryRequest.current === 1" class="comment-skeletons">
              <div v-for="i in 5" :key="i" class="comment-item-skeleton">
                <div class="skeleton-loading avatar-skeleton"></div>
                <div class="skeleton-content"><div class="skeleton-loading name-skeleton"></div><div class="skeleton-loading text-skeleton"></div></div>
              </div>
            </div>
            <comment-list v-else :comments="comments" @reply-clicked="handleReplyClick" @update-comments="queryComments" />
            <div v-if="isEndOfData" class="end-message">{{ $t('pages.postDetailPage.endMessage') }}</div>
          </div>

          <div class="comment-input-bar">
            <input v-model="commentContent" :placeholder="replyCommentId ? $t('pages.postDetailPage.replyPrefix', { user: replyTargetUserName }) : $t('pages.postDetailPage.addComment')"
                   class="comment-input-field" @input="handleInputChange" @keydown.enter.prevent="addComment"
                   maxlength="200" @focus="handleInputFocus" @blur="handleInputBlur">
            <button class="emoji-btn" @click.stop="toggleEmojiPicker" @mousedown.prevent><i class="far fa-smile"></i></button>
            <button class="send-btn" :disabled="!commentContent.trim()" @click="addComment" @mousedown.prevent>{{ $t('pages.postDetailPage.send') }}</button>
          </div>
          <div v-if="showEmojiPicker" class="emoji-picker-wrapper" @mousedown.prevent>
            <emoji-picker class="custom-emoji-picker" :i18n="emojiI18n" @select="onEmojiSelect" />
          </div>
        </div>
      </div>
    </div>

    <div class="mobile-comments-container" v-if="isMobile" ref="mobileCommentsRef">
      <div class="comment-header"><h3>{{ $t('pages.postDetailPage.commentsCount', { count: post.commentCount || 0 }) }}</h3></div>
      <div class="mobile-comments-list" ref="mobileScrollContainer">
        <div v-if="commentloading && queryRequest.current === 1" class="comment-skeletons">
          <div v-for="i in 5" :key="i" class="comment-item-skeleton">
            <div class="skeleton-loading avatar-skeleton"></div>
            <div class="skeleton-content"><div class="skeleton-loading name-skeleton"></div><div class="skeleton-loading text-skeleton"></div></div>
          </div>
        </div>
        <comment-list v-else :comments="comments" @reply-clicked="handleReplyClick" @update-comments="queryComments" />
        <div v-if="isEndOfData" class="end-message">{{ $t('pages.postDetailPage.endMessage') }}</div>
      </div>
    </div>

    <div class="mobile-comment-input-fixed" v-if="isMobile">
      <div class="input-row">
        <input v-model="commentContent" :placeholder="replyCommentId ? $t('pages.postDetailPage.replyPrefix', { user: replyTargetUserName }) : $t('pages.postDetailPage.addComment')"
               class="comment-input-field" @input="handleInputChange" @keydown.enter.prevent="addComment"
               maxlength="200" @focus="handleInputFocus" @blur="handleInputBlur">
        <button class="emoji-btn" @click.stop="toggleEmojiPicker" @mousedown.prevent><i class="far fa-smile"></i></button>
        <button class="send-btn" :disabled="!commentContent.trim()" @click="addComment" @mousedown.prevent>{{ $t('pages.postDetailPage.send') }}</button>
      </div>

      <div class="action-row">
        <div class="action-icons">
          <div class="action-icon" :class="{ 'active': post.isLiked === 1 }" @click="handleLike">
            <i :class="post.isLiked === 1 ? 'fas fa-heart' : 'far fa-heart'"></i><span>{{ post.likeCount || 0 }}</span>
          </div>
          <div class="action-icon" :class="{ 'active': post.isFavorited === 1 }" @click="doFavorite">
            <i :class="post.isFavorited === 1 ? 'fas fa-star' : 'far fa-star'"></i><span>{{ post.favoriteCount || 0 }}</span>
          </div>
          <div class="action-icon" @click="handleShare">
            <i class="far fa-paper-plane"></i>
          </div>
          <div class="action-icon" @click="showMoreModal = true">
            <i class="fas fa-ellipsis-h"></i>
          </div>
        </div>
      </div>

      <div v-if="showEmojiPicker" class="emoji-picker-wrapper mobile-emoji-picker" @mousedown.prevent>
        <emoji-picker class="custom-emoji-picker" :i18n="emojiI18n" @select="onEmojiSelect" />
      </div>
    </div>

    <share-modal ref="shareModalRef" :link="shareLink" :imageUrl="shareImage" :title="post.title" :user="post.user" :create-time="post.createTime" @share-success="handleShareSuccess" />

    <div class="delete-modal" v-if="showDeleteModal">
      <div class="delete-modal-mask" @click="showDeleteModal = false"></div>
      <div class="delete-modal-content">
        <div class="delete-modal-icon">
          <i class="fas fa-triangle-exclamation"></i>
        </div>
        <h3 class="delete-modal-title">{{ $t('pages.postDetailPage.delModal.title') }}</h3>
        <p class="delete-modal-desc">{{ $t('pages.postDetailPage.delModal.desc') }}</p>
        <div class="delete-modal-actions">
          <button class="delete-modal-btn cancel" @click="showDeleteModal = false">{{ $t('pages.postDetailPage.delModal.cancel') }}</button>
          <button class="delete-modal-btn confirm" @click="confirmDelete">{{ $t('pages.postDetailPage.delModal.confirm') }}</button>
        </div>
      </div>
    </div>

    <ReportModal ref="reportModalRef" :target-type="reportTargetType" :target-id="reportTargetId" />

    <div v-if="showPermissionSetting" class="permission-setting-modal show">
      <div class="modal-mask" @click="showPermissionSetting = false"></div>
      <div class="modal-content permission-modal-content">
        <div class="modal-header permission-modal-header">
          <div class="header-left">
            <i class="fas fa-shield-alt header-icon"></i>
            <h3>{{ $t('pages.postDetailPage.permTitle') }}</h3>
          </div>
          <button class="close-btn" @click="showPermissionSetting = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body permission-modal-body">
          <ContentPermissionSetting
            :post-id="route.params.id"
            :initial-permissions="{
              allowLike: post.allowLike ? 1 : 0,
              allowComment: post.allowComment ? 1 : 0,
              allowCollect: post.allowCollect ? 1 : 0,
              allowShare: post.allowShare ? 1 : 0
            }"
            @saved="() => { showPermissionSetting = false; fetchPostDetail(); }"
            @cancelled="() => showPermissionSetting = false"
          />
        </div>
      </div>
    </div>

    <ImagePreview
      v-model:visible="showImagePreview"
      :images="previewImages"
      :initial-index="previewInitialIndex"
      @close="closeImagePreview"
    />

    <div v-if="showMoreModal" class="more-modal">
      <div class="modal-mask" @click="showMoreModal = false"></div>
      <div class="modal-content bottom-sheet">

        <div class="modal-header">
          <div class="header-content">
            <div class="author-info">
              <img :src="post.user?.userAvatar || getDefaultAvatar(post.user?.userName)" :alt="post.user?.userName" class="author-avatar">
              <div class="author-text">
                <div class="author-name">{{ post.user?.userName || $t('pages.postDetailPage.anonymous') }}</div>
                <div class="publish-time">{{ formatShortDate(post.createTime) }}</div>
              </div>
            </div>
            <button class="close-btn" @click="showMoreModal = false"><i class="fas fa-times"></i></button>
          </div>

          <div class="post-info">
            <div class="post-title">{{ post.title || $t('pages.postDetailPage.untitled') }}</div>
            <div class="post-stats">
              <span><i class="fas fa-eye"></i> {{ post.viewCount || 0 }}</span>
              <span><i class="fas fa-heart"></i> {{ post.likeCount || 0 }}</span>
              <span><i class="fas fa-comment"></i> {{ post.commentCount || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="modal-body">
          <div class="horizontal-scroll-container">
            <div class="action-buttons">
              <button class="action-btn" @click="handleEdit" v-if="post.user?.id && String(post.user.id) === String(loginUserStore.loginUser?.id)">
                <i class="fas fa-edit"></i><span>{{ $t('pages.postDetailPage.moreActions.edit') }}</span>
              </button>
              <button class="action-btn" @click="showDeleteConfirm" v-if="post.user?.id && String(post.user.id) === String(loginUserStore.loginUser?.id)">
                <i class="fas fa-trash-alt"></i><span>{{ $t('pages.postDetailPage.moreActions.del') }}</span>
              </button>
              <button class="action-btn" @click="togglePostAutoScroll">
                <i class="fas fa-play" v-if="!isPostAutoScrolling"></i>
                <i class="fas fa-pause" v-else></i>
                <span>{{ isPostAutoScrolling ? $t('pages.postDetailPage.moreActions.pause') : $t('pages.postDetailPage.moreActions.scroll') }}</span>
              </button>
              <button class="action-btn" @click="goToAnalytics" v-if="post.user?.id && String(post.user.id) === String(loginUserStore.loginUser?.id)">
                <i class="fas fa-chart-bar"></i><span>{{ $t('pages.postDetailPage.moreActions.analytics') }}</span>
              </button>
              <button class="action-btn" @click="openReportModal">
                <i class="fas fa-flag"></i><span>{{ $t('pages.postDetailPage.moreActions.report') }}</span>
              </button>
              <button v-if="post.user?.id && String(post.user.id) === String(loginUserStore.loginUser?.id)" class="action-btn" @click="showPermissionSetting = true; showMoreModal = false">
                <i class="fas fa-lock"></i><span>{{ $t('pages.postDetailPage.moreActions.perm') }}</span>
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

import { ref, onMounted, computed, nextTick, onUnmounted, watch, onActivated, onDeactivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Image } from 'ant-design-vue'
import HtmlContent from '@/components/HtmlContent.vue'
import ShareModal from '@/components/ShareModal.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import CommentList from '@/components/CommentList.vue'
import ReportModal from '@/components/ReportModal.vue'
import ContentPermissionSetting from '@/components/ContentPermissionSetting.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { getPostByIdUsingGet, deletePostUsingPost } from '@/api/postController'
import { addUserFollowsUsingPost, findIsFollowUsingPost } from '@/api/userFollowsController'
import { addCommentUsingPost, queryCommentUsingPost } from '@/api/commentsController'
import GlobalAdBanner from '@/components/GlobalAdBanner.vue'
import { doLikeUsingPost } from '@/api/likeRecordController'
import { doShareUsingPost } from '@/api/shareRecordController'
import { addFavoriteRecordUsingPost, cancelFavoriteUsingPost } from '@/api/favoriteRecordController'
import { getDefaultAvatar } from '@/utils/userUtils'
import { formatTime, formatShortDate } from '@/utils/dateUtils'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { throttle } from 'lodash-es'
import { ViewDurationTracker } from '@/utils/viewDurationTracker'
import { getTextCover } from '@/utils/textCoverGenerator'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const loading = ref(true)
const post = ref<API.Post & {
  isLiked?: number;
  isFavorited?: number;
  isShared?: number;
  likeCount?: string | number;
  favoriteCount?: string | number;
  shareCount?: string | number;
  viewCount?: string | number;
  commentCount?: string | number;
}>({} as API.Post & {
  isLiked?: number;
  isFavorited?: number;
  isShared?: number;
  likeCount?: string | number;
  favoriteCount?: string | number;
  shareCount?: string | number;
  viewCount?: string | number;
  commentCount?: string | number;
})

const commentsRef = ref<HTMLElement | null>(null)
const pcCommentsScrollRef = ref<HTMLElement | null>(null)
const mobileCommentsRef = ref<HTMLElement | null>(null)
const contentScrollWrapper = ref<HTMLElement | null>(null)
const isFollowed = ref(false)
const followLoading = ref(false)
const comments = ref<API.Comment[]>([])
const isAddingComment = ref(false)

const viewDurationTracker = new ViewDurationTracker(2)

const commentContent = ref('')
const replyCommentId = ref('')
const replyTargetUserName = ref('')
const replyTargetContent = ref('')
const commentloading = ref(false)
const isEndOfData = ref(false)
const showEmojiPicker = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
const mobileScrollContainer = ref<HTMLElement | null>(null)
const queryRequest = ref<API.CommentsQueryRequest>({
  targetId: 0,
  targetType: 2,
  current: 1,
  pageSize: 15,
})
const shareModalRef = ref()
const reportModalRef = ref()
const reportTargetType = ref<string>('')
const reportTargetId = ref<string>('')
const showPermissionSetting = ref(false)

const showImagePreview = ref(false)
const previewImages = ref<string[]>([])
const previewInitialIndex = ref(0)

const openImagePreview = (url: string) => {
  previewImages.value = [url]
  previewInitialIndex.value = 0
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  setTimeout(() => {
    previewImages.value = []
    previewInitialIndex.value = 0
  }, 300)
}

const isInputFocused = ref(false)
const isMobile = ref(window.innerWidth <= 768)

const isCommentVisible = ref(isMobile.value)
const toggleCommentSection = () => {
  isCommentVisible.value = !isCommentVisible.value
}

const shareLink = computed(() => window.location.origin + '/post/' + post.value?.id)

const handleResize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 768

  if (wasMobile !== isMobile.value) {
    if (isMobile.value) {
      window.addEventListener('scroll', handleMobileScroll)
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    } else {
      window.removeEventListener('scroll', handleMobileScroll)
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }

  nextTick(() => {
    if (isMobile.value && replyCommentId.value) {
      const inputEl = document.querySelector('.mobile-comment-input-fixed .comment-input-field') as HTMLInputElement
      inputEl?.focus()
    }
  })
}

const setBodyScroll = (lock: boolean) => {
  if (!isMobile.value) {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    return
  }

  if (lock) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const openReportModal = () => {
  if (reportModalRef.value) {
    reportTargetType.value = '2'
    reportTargetId.value = post.value.id.toString()
    reportModalRef.value.openModal(reportTargetType.value, reportTargetId.value)
  }
  showMoreModal.value = false
  setBodyScroll(false)
}

// --------------------------------------------------------------------------
// 自动滚动 & 速度调节功能
// --------------------------------------------------------------------------
const isPostAutoScrolling = ref(false)
let autoScrollInterval: number | null = null
const autoScrollPauseOnComment = ref(true)
const showAutoScrollIndicator = ref(false)

// 速度配置映射表
const speedLevels = [
  { label: t('pages.postDetailPage.speeds.slow'), value: 2 },
  { label: t('pages.postDetailPage.speeds.normal'), value: 4 },
  { label: t('pages.postDetailPage.speeds.fast'), value: 8 }
]
const currentSpeedIndex = ref(1) // 默认选用"正常"速度
const autoScrollSpeed = ref(speedLevels[currentSpeedIndex.value].value)

// 切换速度
const toggleSpeed = () => {
  currentSpeedIndex.value = (currentSpeedIndex.value + 1) % speedLevels.length
  autoScrollSpeed.value = speedLevels[currentSpeedIndex.value].value
  message.success(t('pages.postDetailPage.msgs.speedSwitched').replace('{speed}', speedLevels[currentSpeedIndex.value].label))
}

const togglePostAutoScroll = () => {
  if (isPostAutoScrolling.value) {
    stopPostAutoScroll()
  } else {
    resetScrollPosition()
    startPostAutoScroll()
  }
  showMoreModal.value = false
  setBodyScroll(false)
}

const resetScrollPosition = () => {
  if (isMobile.value) {
    window.scrollTo({ top: 0, behavior: 'instant' })
  } else if (contentScrollWrapper.value) {
    contentScrollWrapper.value.scrollTop = 0
  }
}

const startPostAutoScroll = () => {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval)
  }
  isPostAutoScrolling.value = true
  showAutoScrollIndicator.value = true

  if (isMobile.value) {
    autoScrollInterval = setInterval(() => {
      const mobileCommentsEl = mobileCommentsRef.value
      if (mobileCommentsEl && autoScrollPauseOnComment.value) {
        const rect = mobileCommentsEl.getBoundingClientRect()
        if (rect.top <= window.innerHeight * 0.8) {
          stopPostAutoScroll()
          message.info(t('pages.postDetailPage.msgs.scrollPausedComments'))
          return
        }
      }

      const currentScrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = Math.max(
        document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.clientHeight, document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      )

      if (currentScrollTop + windowHeight >= documentHeight - 300) {
        stopPostAutoScroll()
        message.info(t('pages.postDetailPage.msgs.scrollStoppedBottom'))
        return
      }

      window.scrollBy({ top: autoScrollSpeed.value, left: 0, behavior: 'smooth' })
    }, 50)
  } else {
    if (contentScrollWrapper.value) {
      contentScrollWrapper.value.classList.add('auto-scrolling')

      autoScrollInterval = setInterval(() => {
        if (contentScrollWrapper.value) {
          const { scrollTop, clientHeight, scrollHeight } = contentScrollWrapper.value

          if (scrollTop + clientHeight >= scrollHeight - 100) {
            stopPostAutoScroll()
            message.info(t('pages.postDetailPage.msgs.scrollStoppedBottom'))
            return
          }
          contentScrollWrapper.value.scrollTop += autoScrollSpeed.value
        }
      }, 50)
    }
  }
}

const stopPostAutoScroll = () => {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval)
    autoScrollInterval = null
  }
  isPostAutoScrolling.value = false
  showAutoScrollIndicator.value = false

  if (contentScrollWrapper.value) {
    contentScrollWrapper.value.classList.remove('auto-scrolling')
  }
}
// --------------------------------------------------------------------------

const shareImage = computed(() => post.value?.coverUrl || '')
const showMoreActions = ref(false)
const showDeleteModal = ref(false)
const showMoreModal = ref(false)

watch(showMoreModal, (newVal) => {
  setBodyScroll(newVal)
});

const loginUserId = computed(() => loginUserStore.loginUser?.id)
const canEdit = computed(() => post.value.userId === loginUserId.value)
const canDelete = computed(() => canEdit.value)

const handleInputFocus = () => {
  isInputFocused.value = true
  if (!replyCommentId.value) {
    showEmojiPicker.value = false
  }
}

const handleInputBlur = (e: FocusEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (relatedTarget && (
    relatedTarget.closest('.emoji-picker-wrapper') ||
    relatedTarget.closest('.emoji-mart')
  )) {
    return;
  }

  isInputFocused.value = false
  showEmojiPicker.value = false

  if (!commentContent.value.trim()) {
    cancelReply()
  }
}

const fetchPostDetail = async () => {
  const id = route.params.id as string
  if (!id) {
    router.push('/forum')
    return
  }
  try {
    const res = await getPostByIdUsingGet({ id })
    if (res.data?.data) {
      post.value = res.data.data
      loading.value = false
      queryRequest.value.targetId = post.value.id
      queryRequest.value.current = 1
      isEndOfData.value = false
      await queryComments()
      if (isMobile.value) {
        await checkAndLoadMoreComments()
      }
      await checkIsFollowed()
    }
  } catch (error: unknown) {
    message.error((error as Error)?.message || t('pages.postDetailPage.msgs.getDetailFail'))
    router.push('/forum')
  }
}

const checkIsFollowed = async () => {
  if (!loginUserStore.loginUser?.id || !post.value?.user?.id) return
  try {
    const res = await findIsFollowUsingPost({
      followerId: loginUserStore.loginUser.id,
      followingId: post.value.user.id
    })
    isFollowed.value = res.data?.data || false
  } catch (error) {
    console.error(t('pages.postDetailPage.msgs.checkFollowFail'), error)
  }
}

const handleFollow = async () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning(t('pages.postDetailPage.msgs.needLogin'))
    return
  }
  followLoading.value = true
  try {
    const res = await addUserFollowsUsingPost({
      followerId: loginUserStore.loginUser.id,
      followingId: post.value.user.id,
      followStatus: isFollowed.value ? 0 : 1
    })
    if (res.data.code === 0) {
      isFollowed.value = !isFollowed.value
      message.success(isFollowed.value ? t('pages.postDetailPage.msgs.followSuccess') : t('pages.postDetailPage.msgs.unfollowSuccess'))
    } else {
      message.error(t('pages.postDetailPage.msgs.opFail'))
    }
  } catch (error: unknown) {
    message.error((error as Error)?.message || t('pages.postDetailPage.msgs.opFailRetry'))
  } finally {
    followLoading.value = false
  }
}

const handleLike = async () => {
  try {
    const res = await doLikeUsingPost({
      targetId: post.value.id,
      targetType: 2,
      isLiked: post.value.isLiked !== 1
    })
    if (res.data.code === 0) {
      post.value.isLiked = post.value.isLiked === 1 ? 0 : 1
      post.value.likeCount = (Number(post.value.likeCount || 0) + (post.value.isLiked === 1 ? 1 : -1)).toString()
    }
  } catch (error: unknown) {
    message.error((error as Error)?.message || t('pages.postDetailPage.msgs.likeFail'))
  }
}

const handleShare = async () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning(t('pages.postDetailPage.msgs.needLogin'))
    return
  }

  // 分享功能改为一直可分享（无取消逻辑）
  try {
    const res = await doShareUsingPost({
      targetId: post.value.id,
      targetType: 2,
      isShared: true
    })
    if (res.data.code === 0) {
      post.value.isShared = 1
      post.value.shareCount = String(Number(post.value.shareCount || 0) + 1)
    }

    let shareImageUrl = post.value.coverUrl || '';
    if (!shareImageUrl && post.value.title) {
      shareImageUrl = await getTextCover(post.value.title, 300, 400);
    }
    shareModalRef.value?.openModal(shareImageUrl);
  } catch (error: unknown) {
    // 即使失败也可以弹窗供用户手动复制链接
    let shareImageUrl = post.value.coverUrl || '';
    if (!shareImageUrl && post.value.title) {
      shareImageUrl = await getTextCover(post.value.title, 300, 400);
    }
    shareModalRef.value?.openModal(shareImageUrl);
  }
}

const handleShareSuccess = () => {
  post.value.shareCount = String(Number(post.value.shareCount || 0) + 1)
  post.value.isShared = 1
  message.success(t('pages.postDetailPage.msgs.shareSuccess'))
}

const queryComments = async (silent = false) => {
  try {
    if (!silent) commentloading.value = true
    const res = await queryCommentUsingPost(queryRequest.value)
    if (res.data?.data) {
      const newComments = res.data.data.records.map(comment => ({
        ...comment,
        commentId: comment.commentId?.toString(),
        parentCommentId: comment.parentCommentId?.toString(),
      }))
      if (queryRequest.value.current === 1) {
        comments.value = newComments
      } else {
        comments.value = comments.value.concat(newComments)
      }
      isEndOfData.value = newComments.length < queryRequest.value.pageSize
    } else {
      isEndOfData.value = true
    }
  } catch (error: unknown) {
    if (!silent) message.error((error as Error)?.message || t('pages.postDetailPage.msgs.getCommentsFail'))
  } finally {
    if (!silent) commentloading.value = false
  }
}

const loadMoreComments = async () => {
  if (commentloading.value || isEndOfData.value) return

  commentloading.value = true
  queryRequest.value.current += 1

  try {
    await queryComments()
  } catch (error) {
    console.error(t('pages.postDetailPage.msgs.loadMoreCommentsFail'), error)
  } finally {
    commentloading.value = false
  }
}

const handleScroll = throttle(() => {
  if (isMobile.value) return

  const container = scrollContainer.value
  if (!container || commentloading.value) return

  const { scrollTop, clientHeight, scrollHeight } = container
  const threshold = 50

  if ((scrollTop + clientHeight >= scrollHeight - threshold) && !isEndOfData.value) {
    loadMoreComments()
  }
}, 300)

const handlePcSiderScroll = throttle(() => {
  const container = pcCommentsScrollRef.value
  if (!container || commentloading.value || isEndOfData.value) return
  const { scrollTop, clientHeight, scrollHeight } = container
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadMoreComments()
  }
}, 300)

// 辅助方法：递归查找树形评论节点
const findComment = (list: any[], id: string): any => {
  for (const c of list) {
    if (c.commentId === id) return c;
    if (c.children && c.children.length > 0) {
      const found = findComment(c.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 辅助方法：移除伪造的乐观评论
const removeOptimisticComment = (id: string) => {
  comments.value = comments.value.filter(c => c.commentId !== id)
  const removeFromChildren = (list: any[]) => {
    for (const c of list) {
      if (c.children) {
        c.children = c.children.filter((child: any) => child.commentId !== id)
        removeFromChildren(c.children)
      }
    }
  }
  removeFromChildren(comments.value)
}

// 核心修复：带局部乐观更新的添加评论
const addComment = async () => {
  const content = commentContent.value.trim()
  if (!content || isAddingComment.value) return

  if (!loginUserStore.loginUser?.id) {
    message.warning(t('pages.postDetailPage.msgs.needLogin'))
    return
  }

  isAddingComment.value = true

  // --- 乐观加载 UI (Optimistic UI) 阶段 ---
  const tempId = `temp-${Date.now()}`
  const parentId = replyCommentId.value || '0'
  const targetUserName = replyTargetUserName.value

  const optimisticComment = {
    commentId: tempId,
    content: content,
    createTime: new Date().toISOString(),
    likeCount: '0',
    dislikeCount: '0',
    commentUser: {
      id: loginUserStore.loginUser?.id,
      userName: loginUserStore.loginUser?.userName,
      userAvatar: loginUserStore.loginUser?.userAvatar,
    },
    isOptimistic: true, // 触发 CommentList 里的闪烁发光骨架特效
    children: [] // 加入 children 数组防止子组件渲染报错
  }

  // 插入伪造的数据
  if (parentId !== '0') {
    (optimisticComment as any).parentId = parentId;
    (optimisticComment as any).targetUser = { userName: targetUserName };
    const parent = findComment(comments.value, parentId);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.unshift(optimisticComment);
    }
  } else {
    comments.value.unshift(optimisticComment as any);
  }

  // 瞬间清空输入框状态
  commentContent.value = ''
  replyCommentId.value = ''
  replyTargetUserName.value = ''
  showEmojiPicker.value = false

  // 自动滚动到评论区头部 (只有发主评论时需要)
  if (parentId === '0') {
    nextTick(() => {
      scrollToLatestComment()
    })
  }
  // --- 乐观加载阶段结束 ---

  // --- 真实的 API 请求 ---
  try {
    const res = await addCommentUsingPost({
      targetId: post.value.id,
      targetType: 2,
      content: content,
      parentCommentId: parentId
    })

    if (res.data.code === 0) {
      // 成功了，增加数字
      post.value.commentCount = String(Number(post.value.commentCount || 0) + 1)

      // 找到刚才插入的临时评论，并将其替换为真实数据
      const tempComment = findComment(comments.value, tempId)
      if (tempComment) {
        const realId = res.data.data
        tempComment.commentId = realId ? String(realId) : `real-${Date.now()}`
        // 解除乐观加载状态
        tempComment.isOptimistic = false
      }

      // 注意：此处的 queryComments 和 current = 1 已经被移除，彻底解决全量刷新的问题
    } else {
      // 如果后端拒绝了，撤回刚才的操作
      removeOptimisticComment(tempId)
      commentContent.value = content // 把文字还给用户
      message.error(res.data.message || t('pages.postDetailPage.msgs.commentFail'))
    }
  } catch (error) {
    // 如果网络断了，撤回
    removeOptimisticComment(tempId)
    commentContent.value = content
    message.error(t('pages.postDetailPage.msgs.commentFailRetry'))
  } finally {
    isAddingComment.value = false
  }
}

const handleReplyClick = (commentId: string, userName: string) => {
  replyCommentId.value = commentId
  replyTargetUserName.value = userName || ''

  const targetComment = comments.value.find(c => c.commentId === commentId)
  let contentPreview = targetComment?.content || ''
  if (contentPreview.length > 50) {
    contentPreview = contentPreview.substring(0, 50) + '...'
  }
  replyTargetContent.value = contentPreview

  nextTick(() => {
    const mobileInput = document.querySelector('.mobile-comment-input-fixed .comment-input-field') as HTMLInputElement
    const pcInput = document.querySelector('.info-section .comment-input-field') as HTMLInputElement

    if (mobileInput) {
      mobileInput.focus()
    } else if (pcInput) {
      pcInput.focus()
    }
  })
}

const cancelReply = () => {
  replyCommentId.value = ''
  replyTargetUserName.value = ''
  replyTargetContent.value = ''
}

const handleInputChange = () => {
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
  if (showEmojiPicker.value) {
    nextTick(() => {
      const inputEl = document.querySelector('.mobile-comment-input-fixed .comment-input-field') as HTMLInputElement ||
        document.querySelector('.info-section .comment-input-field') as HTMLInputElement
      if (inputEl) {
        inputEl.focus()
      }
    })
  }
}

const onEmojiSelect = (emoji: string) => {
  commentContent.value += emoji
  nextTick(() => {
    const inputEl = document.querySelector('.mobile-comment-input-fixed .comment-input-field') as HTMLInputElement ||
      document.querySelector('.info-section .comment-input-field') as HTMLInputElement
    if (inputEl) {
      inputEl.focus()
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length)
    }
  })
}

const emojiI18n = {
  search: t('pages.postDetailPage.emojiSearch'),
  categories: {
    recent: t('pages.postDetailPage.emojiCats.recent'),
    smileys: t('pages.postDetailPage.emojiCats.smileys'),
    people: t('pages.postDetailPage.emojiCats.people'),
    nature: t('pages.postDetailPage.emojiCats.nature'),
    foods: t('pages.postDetailPage.emojiCats.foods'),
    activity: t('pages.postDetailPage.emojiCats.activity'),
    places: t('pages.postDetailPage.emojiCats.places'),
    objects: t('pages.postDetailPage.emojiCats.objects'),
    symbols: t('pages.postDetailPage.emojiCats.symbols'),
    flags: t('pages.postDetailPage.emojiCats.flags')
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.emoji-btn') && !target.closest('.emoji-picker-wrapper') && !target.closest('.emoji-mart')) {
    showEmojiPicker.value = false
  }
  if (!target.closest('.action-btn.btn-more-text') && !target.closest('.more-popover')) {
    showMoreActions.value = false
  }
  if (replyCommentId.value && !target.closest('.comment-input-field') && !target.closest('.comment-input-bar') && !target.closest('.action-item')) {
    cancelReply()
  }
}

const handlePageScroll = throttle(() => {
  if (!isPostAutoScrolling.value) return

  if (isMobile.value) {
    const mobileCommentsEl = mobileCommentsRef.value
    if (mobileCommentsEl && autoScrollPauseOnComment.value) {
      const rect = mobileCommentsEl.getBoundingClientRect()
      if (rect.top <= window.innerHeight * 0.8) {
        stopPostAutoScroll()
        message.info(t('pages.postDetailPage.msgs.scrollPausedComments'))
      }
    }
  }
}, 100)

const handleMobileScroll = throttle(() => {
  if (!isMobile.value) return;

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
  const clientHeight = window.innerHeight
  const scrollHeight = Math.max(
    document.body.scrollHeight, document.body.offsetHeight,
    document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight
  )

  if (commentloading.value || isEndOfData.value) return

  const threshold = 150
  if ((scrollTop + clientHeight >= scrollHeight - threshold)) {
    loadMoreComments()
  }
}, 300)

onMounted(() => {
  fetchPostDetail()
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handlePageScroll)

  if (isMobile.value) {
    window.addEventListener('scroll', handleMobileScroll);
  } else {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }

  setTimeout(() => {
    if (post.value.id && loginUserStore.loginUser?.id) {
      viewDurationTracker.init(post.value.id, loginUserStore.loginUser.id);
    }
  }, 100)
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    // <i class="fas fa-fire"></i> 路由切换时先恢复滚动，再重新设置
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''

    fetchPostDetail()

    // 重新设置滚动锁定（仅 PC 端解除）
    nextTick(() => {
      if (!isMobile.value) {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }
    })
  }
})

onActivated(async () => {
  await fetchPostDetail()
  await checkAndLoadMoreComments()

  // <i class="fas fa-fire"></i> 重新激活时恢复滚动锁定（仅 PC 端解除）
  if (!isMobile.value) {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})

// <i class="fas fa-fire"></i> 新增：组件失活时恢复滚动
onDeactivated(() => {
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})

const checkAndLoadMoreComments = async () => {
  if (!isMobile.value || isEndOfData.value || commentloading.value) return

  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))

  const clientHeight = window.innerHeight
  const scrollHeight = document.documentElement.scrollHeight

  if (scrollHeight <= clientHeight + 300) {
    if (!commentloading.value && !isEndOfData.value) {
      await loadMoreComments()
      checkAndLoadMoreComments()
    }
  }
}

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handlePageScroll)

  if (window.innerWidth <= 768) {
    window.removeEventListener('scroll', handleMobileScroll);
  }

  if (autoScrollInterval) {
    clearInterval(autoScrollInterval)
    autoScrollInterval = null
  }

  if (contentScrollWrapper.value) {
    contentScrollWrapper.value.classList.remove('auto-scrolling')
  }

  // <i class="fas fa-fire"></i> 关键修复：离开页面时恢复 body 滚动
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''

  viewDurationTracker.cleanup();
})

const scrollToLatestComment = () => {
  nextTick(() => {
    // 侧边栏模式：直接将侧边栏列表滚动到最上面（或者保持不动，因为侧栏永远在视野里）
    if (!isMobile.value && pcCommentsScrollRef.value) {
      pcCommentsScrollRef.value.scrollTo({ top: 0, behavior: 'smooth' })
    }
    if (scrollContainer.value) {
      const commentHeader = scrollContainer.value.parentElement?.querySelector('.comment-header')
      if (commentHeader) {
        const headerTop = (commentHeader as HTMLElement).offsetTop
        scrollContainer.value.scrollTo({ top: headerTop, behavior: 'smooth' })
      } else {
        scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    if (mobileScrollContainer.value) {
      const mobileCommentHeader = mobileScrollContainer.value.parentElement?.querySelector('.comment-header')
      if (mobileCommentHeader) {
        const mobileHeaderTop = (mobileCommentHeader as HTMLElement).offsetTop
        mobileScrollContainer.value.scrollTo({ top: mobileHeaderTop, behavior: 'smooth' })
      } else {
        mobileScrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    if (isMobile.value) {
      nextTick(() => {
        mobileCommentsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  })
}

const handleUserClick = (user) => {
  if (!user) return
  router.push({
    path: `/user/${user.id}`,
    query: {
      userName: user.userName,
      userAvatar: user.userAvatar,
      userAccount: user.userAccount,
      userProfile: user.userProfile,
      userRole: user.userRole,
      createTime: user.createTime
    }
  })
}

const goToAnalytics = () => {
  if (!post.value.id) return message.warning(t('pages.postDetailPage.msgs.noPostId'))
  showMoreModal.value = false
  router.push(`/item/analytics/post/${post.value.id}`)
}

const handleEdit = () => {
  router.push({
    path: `/post/edit/${post.value.id}`,
    query: {
      post: JSON.stringify({
        id: post.value.id,
        title: post.value.title,
        content: post.value.content,
        category: post.value.category,
        coverUrl: post.value.coverUrl,
        tags: post.value.tagList || [],
      })
    }
  })
  showMoreActions.value = false
  showMoreModal.value = false
  setBodyScroll(false)
}

const showDeleteConfirm = () => {
  showMoreActions.value = false
  showMoreModal.value = false
  showDeleteModal.value = true
  setBodyScroll(false)
}

const confirmDelete = async () => {
  try {
    const res = await deletePostUsingPost({ id: post.value.id })
    if (res.data.code === 0) {
      message.success(t('pages.postDetailPage.msgs.delSuccess'))
      router.push('/forum')
    } else {
      message.error(t('pages.postDetailPage.msgs.delFail'))
    }
  } catch (error) {
    message.error(t('pages.postDetailPage.msgs.delFail'))
  } finally {
    showDeleteModal.value = false
    setBodyScroll(false)
  }
}

const doFavorite = async () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning(t('pages.postDetailPage.msgs.needLogin'))
    return
  }

  if (post.value.isFavorited === 1) {
    try {
      const res = await cancelFavoriteUsingPost({
        userId: loginUserStore.loginUser.id,
        targetId: post.value.id,
        targetType: 2
      })
      if (res.data.code === 0) {
        post.value.isFavorited = 0
        post.value.favoriteCount = String(Number(post.value.favoriteCount || 0) - 1)
        message.success(t('pages.postDetailPage.msgs.unfavSuccess'))
      } else {
        message.error(t('pages.postDetailPage.msgs.unfavFail').replace('{msg}', res.data.message))
      }
    } catch (error) {
      message.error(t('pages.postDetailPage.msgs.unfavFailDefault'))
    }
  } else {
    try {
      const res = await addFavoriteRecordUsingPost({
        userId: loginUserStore.loginUser.id,
        targetId: post.value.id,
        targetType: 2,
        targetUserId: post.value.user.id,
        isFavorite: true
      })
      if (res.data.code === 0) {
        post.value.isFavorited = 1
        post.value.favoriteCount = String(Number(post.value.favoriteCount || 0) + 1)
        message.success(t('pages.postDetailPage.msgs.favSuccess'))
      } else {
        message.error(t('pages.postDetailPage.msgs.favFail').replace('{msg}', res.data.message))
      }
    } catch (error) {
      message.error(t('pages.postDetailPage.msgs.favFailDefault'))
    }
  }
}
</script>

<style lang="scss" scoped>
/* ========== PC 极简流式架构 CSS ========== */
.pc-pure-layout {
  display: flex;
  max-width: 900px;
  margin: 20px auto;
  gap: 20px;
  align-items: flex-start; /* 确保子元素顶部对齐 */
  position: relative;
  transition: max-width 0.3s ease;
  min-height: 100vh; /* 确保容器自身足够长，提供滑轨 */
}

.pc-pure-layout.has-sidebar {
  max-width: 1200px; /* 展开侧边栏时加宽 */
}

.pc-pure-main {
  flex: 1;
  min-width: 0; /* 防止子元素溢出 */
  background: var(--card-background);
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.pc-pure-article {
  padding: 40px;
}

/* 透明替身，负责在文档流中把左侧正文挤到该在的位置 */
.pc-pure-sidebar-placeholder {
  width: 360px;
  flex-shrink: 0;
}

/* 右侧粘性悬浮侧边栏（终极 Fixed 绝杀版） */
.pc-pure-sidebar {
  width: 360px;
  flex-shrink: 0;
  background: var(--card-background);
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  /* 舍弃不可靠的 sticky，改用视口绝对死锁 */
  position: fixed;
  top: 80px; /* 距离顶部的吸附距离 */
  left: calc(50% + 240px); /* 居中状态下，右边栏精准覆盖在替身上方 */
  height: calc(100vh - 100px); /* 强制固定高度，确保永远在视口内 */
  z-index: 100;
}

/* 当屏幕小于 1240px 时，居中会被打破，让侧栏贴近屏幕右边缘 */
@media screen and (max-width: 1240px) {
  .pc-pure-sidebar {
    left: auto;
    right: 20px;
  }
}

.pc-pure-sidebar .comment-header {
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pc-pure-sidebar .comment-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}
.pc-pure-sidebar .comment-header .close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.3s;
}
.pc-pure-sidebar .comment-header .close-btn:hover { color: var(--link-color); }

.pc-pure-sidebar .comments-list {
  flex: 1; /* 占据剩余的所有可用空间 */
  min-height: 0; /* 极其关键：打破 Flexbox 默认的 min-height: auto，防止被内部巨量评论撑破高度！ */
  overflow-y: auto; /* 允许侧边栏内部独立滚动 */
  padding: 20px 24px;
  /* 隐藏滚动条让它更好看一点 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.1) transparent;
}
.pc-pure-sidebar .comments-list::-webkit-scrollbar { width: 6px; }
.pc-pure-sidebar .comments-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }

.pc-pure-sidebar .comment-input-bar {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card-background);
  border-radius: 0 0 24px 24px;
}
.pc-pure-sidebar .comment-input-bar .comment-input-field {
  flex: 1;
  background: var(--hover-background);
  border: none;
  border-radius: 24px;
  padding: 12px 20px;
  outline: none;
  color: var(--text-primary);
}
.pc-pure-sidebar .comment-input-bar .emoji-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
}
.pc-pure-sidebar .comment-input-bar .send-btn {
  background: var(--link-color);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 8px 20px;
  font-weight: 500;
  cursor: pointer;
}
.pc-pure-sidebar .comment-input-bar .send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pc-pure-sidebar .emoji-picker-wrapper {
  position: absolute;
  bottom: 80px;
  right: 24px;
  z-index: 100;
}
/* ========== 全局重置与变量覆盖 ========== */
.post-detail-page {
  position: relative;
  background: var(--background);
  color: var(--text-primary);
  /* 强制覆盖全局的老旧卡其色变量，统一到蓝色和干净的背景 */
  --author-card-background: transparent;
  --post-content-background: transparent;

  @media screen and (max-width: 768px) {
    padding-bottom: 90px; /* 减少底部留白，从120px改为90px */
  }
}

/* 升级版：自动滚动悬浮中控台 */
.floating-scroll-controls {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 6px 16px;
  border-radius: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.05);
  gap: 12px;
  animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  .dark-theme & {
    background: rgba(30, 30, 30, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .divider {
    width: 1px;
    height: 16px;
    background: var(--border-color);
  }

  .control-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--link-color);
    cursor: pointer;
    transition: all 0.2s ease;

    i { font-size: 16px; }
    &:hover { opacity: 0.7; }

    &.stop-btn {
      color: #ff4d4f;
    }
  }
}

@keyframes slideDown {
  from { top: -50px; opacity: 0; }
  to { top: 30px; opacity: 1; }
}

/* ========== 小红书风格主容器 (PC) ========== */
.xhs-container {
  display: flex;
  max-width: 1200px;
  height: calc(100vh - 100px);
  margin: 12px auto;
  gap: 20px;
  transition: var(--theme-transition);

  &.comments-hidden .xhs-main-card {
    max-width: 800px;
    margin: 0 auto;
  }

  @media screen and (max-width: 768px) {
    display: block;
    margin: 0;
    height: auto;
  }
}

/* 左侧操作栏占位符 */
.pc-floating-actions-placeholder {
  width: 80px;
  flex-shrink: 0;
  margin-top: 40px;
}

/* PC 左侧悬浮条（终极 Fixed 绝对防御版） */
.pc-floating-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 40px;
  width: 80px;
  align-items: center;
  position: fixed; /* 脱离文档流，永不随波逐流 */
  top: 100px;
  /* 单栏 900px 居中时的左边界 */
  left: calc(50vw - 450px);
  transition: left 0.3s ease; /* 配合父级容器伸缩进行丝滑平移 */
  z-index: 100;
}

/* 当评论侧边栏展开，主容器变为 1200px 时，左边界向左偏移 */
.pc-pure-layout.has-sidebar .pc-floating-actions {
  left: calc(50vw - 600px);
}

.pc-floating-actions .action-item {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: var(--card-background);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  color: var(--text-secondary);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .icon-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 48px;
    flex-shrink: 0;
    transition: all 0.3s ease;
    i { font-size: 20px; }
    .count { font-size: 11px; font-weight: bold; margin-top: 2px; }
  }

  .action-text {
    max-height: 0;
    opacity: 0;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    height: 76px;
    width: 60px;
    border-radius: 30px;
    transform: translateY(-3px);
    color: var(--link-color);
    box-shadow: 0 6px 20px rgba(0,0,0,0.1);

    .icon-wrap { height: 44px; }
    .action-text { max-height: 20px; opacity: 1; margin-top: 2px; }
  }

  &.active {
    color: var(--like-button-active-color);
    &.comment-action { color: var(--link-color); }
    &.fav-action { color: #FFD700; }
  }
}

/* 主卡片（图文 + 评论） */
.xhs-main-card {
  flex: 1;
  display: flex;
  background: var(--card-background);
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
  overflow: hidden;

  @media screen and (max-width: 768px) {
    border-radius: 0;
    box-shadow: none;
    border: none;
    display: block;
  }
}

/* ========== 正文区域 ========== */
.xhs-content-section {
  flex: 6;
  overflow-y: auto;
  border-right: 1px solid var(--border-color);

  &::-webkit-scrollbar { width: 0; }

  .content-inner {
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;

    @media screen and (max-width: 768px) {
      padding: 24px 8px;
    }
  }

  @media screen and (max-width: 768px) {
    border-right: none;
    overflow-y: visible;
  }
}

/* --- 内容为主：标题顶置 --- */
.post-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.4;
  margin-bottom: 16px;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.title-skeleton { height: 36px; width: 80%; margin-bottom: 16px; border-radius: 8px; }
.avatar-skeleton-small { width: 28px; height: 28px; border-radius: 50%; }

/* --- 紧凑型作者栏 --- */
.post-meta-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
  font-size: 14px;
  color: var(--text-secondary);

  .meta-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    object-fit: cover;
    border: 1px solid var(--border-color);
  }

  .meta-author {
    color: var(--text-primary);
    font-weight: 600;
    cursor: pointer;
    &:hover { color: var(--link-color); }
  }

  .meta-dot {
    opacity: 0.4;
    font-size: 12px;
  }

  .meta-time {
    font-size: 13px;
    opacity: 0.8;
  }

  .meta-follow-btn {
    margin-left: auto;
    padding: 4px 14px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--link-color);
    background: rgba(59, 130, 246, 0.08);
    cursor: pointer;
    transition: all 0.2s;

    &:hover { background: rgba(59, 130, 246, 0.15); }
    &.is-followed {
      color: var(--text-secondary);
      background: var(--hover-background);
    }
    &.is-loading {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

/* --- 封面图区域 --- */
.cover-skeleton { height: 300px; width: 100%; margin-bottom: 24px; border-radius: 12px; }
.post-cover-wrapper {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  cursor: zoom-in;

  .post-cover-img {
    width: 100%;
    max-height: 500px;
    object-fit: cover;
    display: block;
    transition: transform 0.3s;
    &:hover {
      transform: scale(1.02);
    }
  }
}

.content-divider {
  display: flex;
  align-items: center;
  margin: 32px 0;
}

.content-divider::before,
.content-divider::after {
  content: '';
  flex: 1;
  border-top: 2px dotted var(--text-secondary);
  opacity: 0.4;
}

.content-divider::before {
  margin-right: 16px;
}

.content-divider::after {
  margin-left: 16px;
}

.divider-text {
  font-size: 12px;
  letter-spacing: 4px;
  color: var(--text-secondary);
  font-weight: 500;
}

.html-content-render {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 32px;
  word-break: break-word;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;

  .xhs-category, .xhs-tag {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    color: var(--link-color);
    background: rgba(59, 130, 246, 0.06);
    transition: background 0.2s;
    cursor: pointer;

    &:hover { background: rgba(59, 130, 246, 0.12); }
  }
}

.end-divider {
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: 2px;
  margin-top: 48px;
  opacity: 0.4;
}

/* ========== 评论区域 (PC & Mobile 通用核心) ========== */
.xhs-comment-section {
  flex: 4;
  display: flex;
  flex-direction: column;
  background: var(--card-background);
}

.mobile-comments-container {
  background: var(--card-background);
  padding-bottom: 20px;
}

.comment-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    border-radius: 50%;
    transition: background 0.2s;
    &:hover { background: var(--hover-background); color: var(--text-primary); }
  }
}

.comments-list, .mobile-comments-list {
  padding: 20px 24px;

  .end-message {
    text-align: center;
    color: var(--text-secondary);
    font-size: 13px;
    margin-top: 24px;
    opacity: 0.6;
  }
}

.comments-list {
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
}

/* ========== PC 底部输入悬浮栏 ========== */
.comment-input-bar {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card-background);
}

/* ========== 移动端双行悬浮输入栏 ========== */
.mobile-comment-input-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99;
  background: var(--card-background);
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(0,0,0,0.05);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -8px 24px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;

  .input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .action-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 28px;

    .action-icons {
      display: flex;
      justify-content: space-around;
      width: 100%;

      .action-icon {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--text-secondary);
        font-size: 20px;
        cursor: pointer;
        transition: transform 0.2s;

        &:active { transform: scale(0.9); }
        span { font-size: 12px; font-weight: 600; }
        &.active {
          color: var(--like-button-active-color);
          &.fav-action, &:nth-child(2) { color: #FFD700; }
        }
      }
    }
  }
}

.comment-input-field {
  flex: 1;
  width: 100%;
  background: var(--hover-background);
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  transition: all 0.3s;

  &::placeholder { color: var(--text-secondary); opacity: 0.7; }
  &:focus {
    background: var(--card-background);
    border-color: var(--link-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.emoji-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 22px;
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s;
  &:active { transform: scale(0.9); }
}

.send-btn {
  background: var(--link-color);
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--text-secondary);
  }
  &:active:not(:disabled) { transform: scale(0.95); }
}

/* ========== 骨架屏与表情包面板 ========== */
.skeleton-loading {
  background: linear-gradient(90deg, var(--hover-background) 25%, var(--border-color) 50%, var(--hover-background) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.5s infinite;
  border-radius: 8px;
}
@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.content-skeleton { height: 200px; width: 100%; }

.emoji-picker-wrapper {
  position: absolute;
  bottom: 80px;
  right: 20px;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);

  &.mobile-emoji-picker {
    bottom: 100%;
    right: 0;
    left: 0;
    width: 100%;
    margin-bottom: 12px;
  }
}

/* 骨架屏细化 */
.comment-skeletons { padding: 8px 0; }
.comment-item-skeleton {
  display: flex; gap: 12px; margin-bottom: 24px;
  .avatar-skeleton { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
  .skeleton-content {
    flex: 1; display: flex; flex-direction: column; gap: 8px;
    .name-skeleton { height: 16px; width: 30%; border-radius: 4px; }
    .text-skeleton { height: 14px; width: 90%; border-radius: 4px; }
  }
}

/* 各种模态框基础样式 (Delete/More/Permission) */
.delete-modal, .more-modal, .permission-setting-modal {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 权限设置弹框层级更高 */
.permission-setting-modal {
  z-index: 1002;

  .permission-modal-content {
    max-width: 480px;
    padding: 0;
    overflow: hidden;
  }

  .permission-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--card-background);
    position: relative;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      .header-icon {
        font-size: 20px;
        color: var(--link-color);
      }

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: var(--hover-background);
      border: none;
      font-size: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
      z-index: 10;

      &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ff4d4f;
        transform: rotate(90deg);
      }

      &:active {
        transform: rotate(90deg) scale(0.9);
      }
    }
  }

  .permission-modal-body {
    padding: 24px;
    background: var(--background);
    max-height: 70vh;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: var(--hover-background);
    }
    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;
      &:hover {
        background: var(--text-secondary);
      }
    }
  }

  /* 移动端适配 */
  @media screen and (max-width: 768px) {
    .permission-modal-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-width: 100%;
      border-radius: 24px 24px 0 0;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .permission-modal-body {
      max-height: 60vh;
      padding-bottom: calc(24px + env(safe-area-inset-bottom));
    }
  }
}

.delete-modal-mask, .modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.delete-modal-content, .modal-content {
  background: var(--card-background);
  padding: 24px;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  position: relative;
  z-index: 1;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.1);
}

/* 针对底部的弹框处理 (移动端适配) */
@media screen and (max-width: 768px) {
  .modal-content.bottom-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    border-radius: 24px 24px 0 0;
    padding: 24px 0; /* 修改：移除左右 padding */
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* ========== 核心修复：更多菜单顶部作者与摘要信息区 ========== */
.modal-header {
  display: flex;
  flex-direction: column; /* 修复关键：改为纵向堆叠，防止作者信息和标题被挤在同一行 */
  gap: 16px;
  border-bottom: 1px solid var(--border-color);
  padding: 0 24px 16px 24px; /* 添加左右 padding */
  margin-bottom: 0; /* 移除 margin */

  .header-content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .close-btn {
    background: var(--hover-background);
    border: none;
    font-size: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  .author-avatar { width: 44px; height: 44px; border-radius: 50%; }
  .author-text {
    text-align: left;
    .author-name { font-weight: 600; font-size: 16px; }
    .publish-time { font-size: 12px; color: var(--text-secondary); margin-top: 2px;}
  }
}

/* 新增的独立微圆角摘要信息卡片 */
.post-info {
  width: 100%;
  text-align: left;
  background: rgba(0, 0, 0, 0.02);
  padding: 12px 16px;
  border-radius: 12px;

  .dark-theme & {
    background: rgba(255, 255, 255, 0.03);
  }

  .post-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
    /* 超长标题优雅两行截断 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-stats {
    display: flex;
    gap: 16px;
    color: var(--text-secondary);
    font-size: 12px;
    span i { margin-right: 4px; }
  }
}

.modal-body {
  padding: 16px 0; /* 移除左右 padding，只保留上下 */
}
/* ========================================================= */

.horizontal-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 10px 0;
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;

  /* PC端显示滚动条 */
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: var(--hover-background);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
    &:hover {
      background: var(--text-secondary);
    }
  }
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--hover-background);

  /* 移动端隐藏滚动条 */
  @media screen and (max-width: 768px) {
    &::-webkit-scrollbar { display: none; }
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .action-buttons {
    display: inline-flex;
    gap: 12px;
    padding-bottom: 4px;

    .action-btn {
      flex: 0 0 auto;
      width: 72px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--hover-background);
      border: none;
      border-radius: 16px;
      padding: 16px 8px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover { background: rgba(0,0,0,0.05); transform: translateY(-2px); }
      .dark-theme &:hover { background: rgba(255,255,255,0.05); }

      i { font-size: 22px; color: var(--text-secondary); }
      span { font-size: 12px; font-weight: 500; }
    }
  }
}

.delete-modal-icon { font-size: 48px; color: #ff4d4f; margin-bottom: 20px; }
.delete-modal-title { font-size: 20px; font-weight: 600; margin-bottom: 10px; color: var(--text-primary); }
.delete-modal-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 32px; }
.delete-modal-actions {
  display: flex; justify-content: center; gap: 16px;
  .delete-modal-btn { padding: 10px 32px; border-radius: 24px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;}
  .cancel { background: var(--hover-background); color: var(--text-primary); }
  .confirm { background: #ff4d4f; color: white; }
  .cancel:hover { background: rgba(0,0,0,0.1); }
  .confirm:hover { background: #ff7875; }
}

/* ========== 修复：表情包面板背景透明看不清的问题 ========== */
.emoji-picker-wrapper {
  position: absolute;
  bottom: 80px;
  right: 20px;
  z-index: 100;

  /* 核心修复：添加不透明的纯色背景，并附带轻微毛玻璃质感 */
  background: var(--card-background, #ffffff);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  /* 优化阴影层次，让弹框更立体地浮在内容上方 */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);

  &.mobile-emoji-picker {
    bottom: 100%;
    right: 0;
    left: 0;
    width: 100%;
    margin-bottom: 12px;
    /* 移动端稍微加大阴影和边框对比度 */
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
  }

  /* 穿透修改：确保第三方表情组件（如 emoji-mart / vue3-emoji-picker）的底色与外层统一 */
  :deep(.custom-emoji-picker),
  .custom-emoji-picker {
    background: transparent !important;
    --color-bg: transparent !important;
    --bg-color: transparent !important;
    border: none !important;
  }
}

/* 暗色主题适配补充 */
.dark-theme .emoji-picker-wrapper {
  background: var(--card-background, #2d2d2d);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
}
</style>
