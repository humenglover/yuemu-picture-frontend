<template>
  <div class="modern-music-detail">
    <div class="bg-layer">
      <div class="bg-blur" :style="{ backgroundImage: `url(${album?.coverUrl || getDefaultAvatar('album')})` }"></div>
      <div class="bg-gradient"></div>
    </div>

    <div v-if="loading" class="modern-state">
      <div class="spinner"></div>
      <p>{{ $t('pages.musicAlbumDetailView.loading') }}</p>
    </div>

    <div v-else-if="error" class="modern-state error">
      <p>{{ error }}</p>
      <button class="primary-btn" @click="retryLoading">{{ $t('pages.musicAlbumDetailView.retry') }}</button>
    </div>

    <div v-else class="content-wrapper">
      <div class="main-container">
        <header class="album-hero">
          <div class="cover-wrapper">
            <img :src="album?.coverUrl || getDefaultAvatar('album')" :alt="album?.albumName" class="hero-cover">
          </div>
          <div class="hero-info">
            <span class="tag">{{ $t('pages.musicAlbumDetailView.title') }}</span>
            <h1 class="title">{{ album?.albumName }}</h1>
            <p class="description">{{ album?.description || $t('pages.musicAlbumDetailView.noDesc') }}</p>
            <div class="meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 18V5l12-2v13M9 9l12-2M5 21a3 3 0 100-6 3 3 0 000 6zM17 19a3 3 0 100-6 3 3 0 000 6z"/></svg>
                {{ $t('pages.musicAlbumDetailView.songsCount', { count: audioFiles.length }) }}
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {{ formatDate(album?.createTime) }}
              </span>
            </div>

            <button v-if="isOwner" class="primary-btn icon-btn upload-action-btn" @click="openUploadModal">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span class="btn-text">{{ $t('pages.musicAlbumDetailView.uploadMusic') }}</span>
            </button>
          </div>
        </header>

        <div class="track-list-container" v-if="audioFiles.length > 0">
          <div class="track-list-header">
            <div class="col-index">#</div>
            <div class="col-title">{{ $t('pages.musicAlbumDetailView.columns.title') }}</div>
            <div class="col-album">{{ $t('pages.musicAlbumDetailView.columns.artist') }}</div>
            <div class="col-time">{{ $t('pages.musicAlbumDetailView.columns.duration') }}</div>
            <div class="col-actions" v-if="isOwner"></div>
          </div>

          <div class="track-list">
            <div v-for="(audio, index) in audioFiles"
                 :key="audio.id"
                 class="track-item"
                 :class="{ 'is-playing': currentPlaying?.id === audio.id }"
                 @click="playAudio(audio)">

              <div class="col-index">
                <span class="index-num" v-if="currentPlaying?.id !== audio.id">{{ index + 1 }}</span>
                <div class="playing-indicator" v-else>
                  <div class="bar" :class="{ 'paused': !isPlaying }"></div>
                  <div class="bar" :class="{ 'paused': !isPlaying }"></div>
                  <div class="bar" :class="{ 'paused': !isPlaying }"></div>
                </div>
              </div>

              <div class="col-title">
                <img :src="getAudioCover(audio)" class="track-cover" :alt="audio.title">
                <div class="track-name-wrap">
                  <span class="track-name" :class="{ 'text-active': currentPlaying?.id === audio.id }">{{ audio.title }}</span>
                  <span class="track-artist-mobile">{{ audio.artist || t('pages.musicAlbumDetailView.unknownArtist') }}</span>
                </div>
              </div>

              <div class="col-artist">
                <span class="track-artist">{{ audio.artist || t('pages.musicAlbumDetailView.unknownArtist') }}</span>
              </div>

              <div class="col-time">
                <span class="track-time">-:--</span>
              </div>

              <div class="col-actions" v-if="isOwner">
                <button class="icon-action-btn" @click.stop="showDeleteConfirm(audio)" :title="$t('pages.musicAlbumDetailView.delete')">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="modern-empty">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1" fill="none"><path d="M9 18V5l12-2v13M9 9l12-2M5 21a3 3 0 100-6 3 3 0 000 6zM17 19a3 3 0 100-6 3 3 0 000 6z"/></svg>
          </div>
          <p>{{ isOwner ? $t('pages.musicAlbumDetailView.emptyTitle') : $t('pages.musicAlbumDetailView.emptyDesc') }}</p>
          <button v-if="isOwner" class="primary-btn" @click="openUploadModal">{{ $t('pages.musicAlbumDetailView.uploadMusic') }}</button>
        </div>
      </div>

      <div class="modern-player" v-if="currentPlaying">
        <div class="player-progress-bar" @click="seek" @mousemove="updateSeekHover" @mouseleave="hideSeekHover">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <div class="progress-hover" :style="{ left: hoverPosition + 'px' }" v-if="showSeekHover">
            {{ formatTime(hoverTime) }}
          </div>
        </div>

        <div class="player-inner">
          <div class="player-now-playing">
            <img :src="getAudioCover(currentPlaying)" :alt="currentPlaying.title" :class="{ 'rotating': isPlaying }">
            <div class="np-info">
              <div class="np-title">{{ currentPlaying.title || currentPlaying.fileName }}</div>
              <div class="np-artist">{{ currentPlaying.artist || t('pages.musicAlbumDetailView.unknownArtist') }}</div>
            </div>
          </div>

          <div class="player-controls">
            <button class="control-btn" @click.stop="playPrevious" :disabled="audioFiles.length <= 1">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button class="control-btn play-circle" @click.stop="togglePlay">
              <svg v-if="isPlaying" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="control-btn" @click.stop="playNext" :disabled="audioFiles.length <= 1">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <div class="player-time">
            <span>{{ formatTime(currentTime) }}</span>
            <span class="divider">/</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showUploadModal" class="modern-modal-overlay">
      <div class="modern-modal upload-modal">
        <div class="modal-header">
          <h2>{{ $t('pages.musicAlbumDetailView.uploadMusic') }}</h2>
          <button class="close-btn" @click="closeUploadModal">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="modal-body upload-layout">
          <div class="upload-sidebar">
            <div class="drop-zone" @click="triggerFileInput" @drop.prevent="handleFileDrop" @dragover.prevent @dragenter.prevent>
              <input type="file" ref="fileInput" style="display: none" accept=".mp3,.wav,.ogg,.m4a" @change="handleFileSelect" multiple>
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <p>{{ $t('pages.musicAlbumDetailView.dropzone') }}</p>
              <span class="sub-text">{{ $t('pages.musicAlbumDetailView.dropzoneExt') }}</span>
            </div>

            <div class="queue-list" v-if="uploadQueue.length > 0">
              <div class="queue-item"
                   v-for="(file, index) in uploadQueue" :key="index"
                   :class="{ 'active': currentEditIndex === index }"
                   @click="currentEditIndex = index">
                <div class="queue-info">
                  <span class="queue-title">{{ file.title || file.name }}</span>
                  <span class="queue-artist">{{ file.artist || t('pages.musicAlbumDetailView.unknown') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="upload-form-area" v-if="uploadQueue.length > 0">
            <div class="form-scroll">
              <div class="cover-uploader" @click="() => handleCoverClick(currentEditIndex)">
                <img v-if="uploadQueue[currentEditIndex]?.coverPreview" :src="uploadQueue[currentEditIndex].coverPreview">
                <div v-else class="cover-placeholder">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span>{{ $t('pages.musicAlbumDetailView.setCover') }}</span>
                </div>
                <input type="file" :ref="el => coverInputs[currentEditIndex] = el" style="display: none" accept="image/*" @change="(event) => handleCoverSelect(event, currentEditIndex)">
              </div>

              <div class="modern-form-group">
                <label>{{ $t('pages.musicAlbumDetailView.songName') }} <span class="req">*</span></label>
                <input v-model="uploadQueue[currentEditIndex].title" type="text" :placeholder="$t('pages.musicAlbumDetailView.songNamePlaceholder')" :disabled="isUploading" required>
              </div>

              <div class="modern-form-group">
                <label>{{ $t('pages.musicAlbumDetailView.artist') }} <span class="req">*</span></label>
                <input v-model="uploadQueue[currentEditIndex].artist" type="text" :placeholder="$t('pages.musicAlbumDetailView.artistPlaceholder')" :disabled="isUploading" required>
              </div>

              <div class="form-row">
                <div class="modern-form-group">
                  <label>{{ $t('pages.musicAlbumDetailView.album') }}</label>
                  <input v-model="uploadQueue[currentEditIndex].album" type="text" :placeholder="$t('pages.musicAlbumDetailView.albumPlaceholder')" :disabled="isUploading">
                </div>
                <div class="modern-form-group">
                  <label>{{ $t('pages.musicAlbumDetailView.genre') }}</label>
                  <div class="input-with-btn">
                    <select v-if="!isCustomGenre" v-model="uploadQueue[currentEditIndex].genre" :disabled="isUploading">
                      <option value="">{{ $t('pages.musicAlbumDetailView.selectGenre') }}</option>
                      <option v-for="cat in categoryList" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                    <input v-else v-model="uploadQueue[currentEditIndex].genre" type="text" :placeholder="$t('pages.musicAlbumDetailView.customGenre')" :disabled="isUploading">
                    <button class="secondary-btn small-btn" @click="isCustomGenre = !isCustomGenre" :disabled="isUploading">
                      {{ isCustomGenre ? $t('pages.musicAlbumDetailView.preset') : $t('pages.musicAlbumDetailView.custom') }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="modern-form-group">
                <label>{{ $t('pages.musicAlbumDetailView.desc') }}</label>
                <textarea v-model="uploadQueue[currentEditIndex].description" :placeholder="$t('pages.musicAlbumDetailView.descPlaceholder')" :disabled="isUploading"></textarea>
              </div>
            </div>
          </div>
          <div class="upload-empty-right" v-else>
            <p>{{ $t('pages.musicAlbumDetailView.selectFirst') }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="closeUploadModal" :disabled="isUploading">{{ $t('pages.musicAlbumDetailView.cancel') }}</button>
          <button class="primary-btn" @click="startUpload" :disabled="isUploading || !uploadQueue.length || !isUploadFormValid">
            {{ isUploading ? $t('pages.musicAlbumDetailView.uploading') : $t('pages.musicAlbumDetailView.startUpload') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modern-modal-overlay">
      <div class="modern-modal compact-modal">
        <div class="modal-body delete-body">
          <div class="delete-icon-wrapper">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--comment-delete-hover-color, #ff4d4f)" stroke-width="1.5" fill="none"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h3>{{ $t('pages.musicAlbumDetailView.delConfirmTitle') }}</h3>
          <p>{{ $t('pages.musicAlbumDetailView.delConfirmDesc', { name: selectedDeleteAudio?.title }) }}</p>
        </div>
        <div class="modal-footer">
          <button class="secondary-btn" @click="showDeleteModal = false">{{ $t('pages.musicAlbumDetailView.cancel') }}</button>
          <button class="danger-btn" @click="confirmDelete">{{ $t('pages.musicAlbumDetailView.confirmDel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter, type RouteLocationNormalizedLoaded } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getDefaultAvatar } from '@/utils/userUtils'

import {
  fetchMusicAlbumByIdUsingGet,
  fetchAlbumAudiosUsingGet,
  uploadMusicToAlbumUsingPost,
  deleteAudioFromAlbumUsingPost
} from '@/api/loveBoardMusicAlbumController'

import { commonUploadPictureUsingPost } from '@/api/fileUploadController'
import { listCategoryByTypeUsingGet } from '@/api/categoryController'

// Types
interface AudioFile {
  id: string
  title: string
  artist: string
  album?: string
  genre?: string
  description?: string
  fileName: string
  fileUrl: string
  coverUrl?: string
  duration: number
  createTime: string
}

interface Album {
  id: string
  albumName: string
  description?: string
  coverUrl?: string
  createTime: string
  isPublic: string
  musicCount: string
}

interface UploadQueueItem {
  file: File
  title: string
  artist: string
  album?: string
  genre?: string
  description?: string
  coverFile?: File
  coverPreview?: string
  name: string
}

const MAX_IMAGE_SIZE = 1 * 1024 * 1024
const MAX_IMAGE_WIDTH = 1920
const MAX_IMAGE_HEIGHT = 1080
const IMAGE_QUALITY = 0.85
const MAX_AUDIO_SIZE = 10 * 1024 * 1024
const AUDIO_QUALITY = 0.8

const route: RouteLocationNormalizedLoaded = useRoute()
const router = useRouter()
const loading = ref<boolean>(true)
const error = ref<string | null>(null)
const album = ref<Album | null>(null)
const audioFiles = ref<AudioFile[]>([])
const currentPlaying = ref<AudioFile | null>(null)
const isPlaying = ref<boolean>(false)
const currentTime = ref<number>(0)
const duration = ref<number>(0)
const audioPlayer = ref<HTMLAudioElement | null>(null)

const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const uploadQueue = ref<UploadQueueItem[]>([])
const isUploading = ref<boolean>(false)
const fileInput = ref<HTMLInputElement | null>(null)
const currentEditIndex = ref<number>(0)
const coverInputs = ref<{[key: number]: HTMLInputElement}>({})

const showSeekHover = ref<boolean>(false)
const hoverPosition = ref<number>(0)
const hoverTime = ref<number>(0)
const isBuffering = ref<boolean>(false)
const showUploadModal = ref<boolean>(false)
const showDeleteModal = ref<boolean>(false)
const selectedDeleteAudio = ref<AudioFile | null>(null)

const isMobileView = ref(window.innerWidth <= 768)
const isPlayerCollapsed = ref(true)
const isHeaderExpanded = ref(false)
const categoryList = ref<string[]>([])
const isCustomGenre = ref<boolean>(false)

const isOwner = computed(() => route.query.isOwner === 'true')

const formatDate = (date?: string) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const retryLoading = async () => {
  error.value = null
  loading.value = true
  try {
    await Promise.all([fetchAlbumData(), fetchAudioFiles()])
  } catch (err) {
    error.value = t('pages.musicAlbumDetailView.loadFail')
  } finally {
    loading.value = false
  }
}

const fetchAlbumData = async () => {
  try {
    const albumId = route.params.id as string
    const password = sessionStorage.getItem(`album_${albumId}_password`)
    const res = await fetchMusicAlbumByIdUsingGet({ id: albumId, password })
    if (res.data.code === 0) {
      album.value = res.data.data
    } else {
      throw new Error(res.data.message || t('pages.musicAlbumDetailView.msgs.fetchAlbumFail'))
    }
  } catch (err) {
    error.value = t('pages.musicAlbumDetailView.msgs.fetchAlbumFail2')
    console.error(err)
  }
}

const fetchAudioFiles = async () => {
  try {
    const albumId = route.params.id as string
    const password = sessionStorage.getItem(`album_${albumId}_password`)
    const res = await fetchAlbumAudiosUsingGet({ albumId, password })
    if (res.data.code === 0) {
      audioFiles.value = res.data.data
    } else {
      throw new Error(res.data.message || t('pages.musicAlbumDetailView.msgs.fetchAudioFail'))
    }
  } catch (err) {
    error.value = t('pages.musicAlbumDetailView.msgs.fetchAudioFail2')
    console.error(err)
  }
}

onMounted(async () => {
  try {
    await Promise.all([fetchAlbumData(), fetchAudioFiles()])
  } catch (err: any) {
    error.value = err.message || t('pages.musicAlbumDetailView.loadFail')
  } finally {
    loading.value = false
  }
})

watch(() => route.params.id, async (newId: string) => {
  if (newId) {
    loading.value = true
    error.value = null
    try {
      await Promise.all([fetchAlbumData(), fetchAudioFiles()])
    } catch (err: any) {
      error.value = err.message || t('pages.musicAlbumDetailView.loadFail')
    } finally {
      loading.value = false
    }
  }
})

const playAudio = (audio: AudioFile) => {
  if (currentPlaying.value?.id === audio.id) {
    togglePlay()
  } else {
    currentPlaying.value = audio
    isPlaying.value = true
    nextTick(() => {
      if (!audioPlayer.value) {
        const audioEl = document.createElement('audio')
        audioEl.onloadedmetadata = onAudioLoaded
        audioEl.ontimeupdate = onTimeUpdate
        audioEl.onended = onAudioEnded
        audioPlayer.value = audioEl
      }
      audioPlayer.value.src = audio.fileUrl
      audioPlayer.value.play().catch(err => {
        console.error(t('pages.musicAlbumDetailView.msgs.playFail'), err)
        isPlaying.value = false
      })
    })
  }
}

const togglePlay = () => {
  if (!audioPlayer.value) return
  if (isPlaying.value) {
    audioPlayer.value.pause()
  } else {
    audioPlayer.value.play().catch(err => {
      console.error(t('pages.musicAlbumDetailView.msgs.playFail'), err)
    })
  }
  isPlaying.value = !isPlaying.value
}

const showDeleteConfirm = (audio: AudioFile) => {
  selectedDeleteAudio.value = audio
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!selectedDeleteAudio.value) return
  try {
    const res = await deleteAudioFromAlbumUsingPost({
      albumId: route.params.id as string,
      audioId: selectedDeleteAudio.value.id
    })
    if (res.data.code === 0) {
      audioFiles.value = audioFiles.value.filter(
        (audio: AudioFile) => audio.id !== selectedDeleteAudio.value?.id
      )
      if (currentPlaying.value?.id === selectedDeleteAudio.value.id) {
        currentPlaying.value = null
        isPlaying.value = false
        if (audioPlayer.value) audioPlayer.value.pause()
      }
      message.success(t('pages.musicAlbumDetailView.msgs.delSuccess'))
    } else {
      throw new Error(res.data.message || t('pages.musicAlbumDetailView.msgs.delFail'))
    }
  } catch (err) {
    message.error(t('pages.musicAlbumDetailView.msgs.delFail'))
    console.error(err)
  } finally {
    showDeleteModal.value = false
    selectedDeleteAudio.value = null
  }
}

const onTimeUpdate = () => {
  if (!audioPlayer.value) return
  currentTime.value = audioPlayer.value.currentTime
}

const onAudioLoaded = () => {
  if (!audioPlayer.value) return
  duration.value = audioPlayer.value.duration
}

const onAudioEnded = () => {
  playNext()
}

const seek = (event: MouseEvent) => {
  if (!audioPlayer.value || !duration.value) return
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  audioPlayer.value.currentTime = percent * duration.value
}

const playNext = () => {
  if (!currentPlaying.value || audioFiles.value.length <= 1) return
  const currentIndex = audioFiles.value.findIndex((audio: AudioFile) => audio.id === currentPlaying.value?.id)
  const nextIndex = currentIndex < audioFiles.value.length - 1 ? currentIndex + 1 : 0
  playAudio(audioFiles.value[nextIndex])
}

const playPrevious = () => {
  if (!currentPlaying.value || audioFiles.value.length <= 1) return
  const currentIndex = audioFiles.value.findIndex((audio: AudioFile) => audio.id === currentPlaying.value?.id)
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : audioFiles.value.length - 1
  playAudio(audioFiles.value[prevIndex])
}

const triggerFileInput = () => { fileInput.value?.click() }

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) handleFiles(Array.from(target.files))
}

const handleFileDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files) handleFiles(Array.from(files))
}

const compressAudio = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_AUDIO_SIZE) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(e.target?.result as ArrayBuffer);
        const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        source.connect(compressor);
        compressor.connect(offlineCtx.destination);
        source.start(0);
        const renderedBuffer = await offlineCtx.startRendering();
        const wavBlob = await audioBufferToWav(renderedBuffer);
        const compressedFile = new File([wavBlob], file.name.replace(/\.[^/.]+$/, '.wav'), { type: 'audio/wav', lastModified: Date.now() });
        resolve(compressedFile);
      } catch (error) { reject(error); }
    };
    reader.onerror = () => reject(new Error(t('pages.musicAlbumDetailView.msgs.imgReadFail')));
    reader.readAsArrayBuffer(file);
  });
};

const audioBufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const buffer32 = new Float32Array(buffer.length * numOfChan);
  const view = new DataView(new ArrayBuffer(44 + length));
  const channels = [];
  let offset = 0; let pos = 0;
  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) { buffer32[offset] = channels[i][pos]; offset++; }
    pos++;
  }
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numOfChan, true);
  view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true); view.setUint16(34, 16, true);
  writeString(view, 36, 'data'); view.setUint32(40, length, true);
  const length32 = buffer32.length; let index = 44; const volume = 1;
  for (let i = 0; i < length32; i++) { view.setInt16(index, buffer32[i] * (0x7FFF * volume), true); index += 2; }
  return Promise.resolve(new Blob([view], { type: 'audio/wav' }));
};

const parseAudioMetadata = (file: File): Promise<{title?: string; artist?: string; album?: string; genre?: string}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const audioContext = new AudioContext();
        await audioContext.decodeAudioData(e.target?.result as ArrayBuffer);
        const fileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const [artist, title] = fileName.split(' - ').map(s => s.trim());
        resolve({ title: title || fileName, artist: title ? artist : '' });
      } catch (error) {
        resolve({ title: file.name.replace(/\.[^/.]+$/, '') });
      }
    };
    reader.onerror = () => resolve({ title: file.name.replace(/\.[^/.]+$/, '') });
    reader.readAsArrayBuffer(file);
  });
};

const handleFiles = async (files: File[]) => {
  const validFiles = files.filter(file => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    return ['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')
  })
  if (validFiles.length === 0) { message.error(t('pages.musicAlbumDetailView.msgs.fileReadFail')); return }
  try {
    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        const compressedFile = await compressAudio(file);
        const metadata = await parseAudioMetadata(file);
        return {
          file: compressedFile, name: file.name, title: metadata.title || '', artist: metadata.artist || '',
          album: metadata.album || '', genre: metadata.genre || '', description: '', coverPreview: '', coverUrl: ''
        };
      })
    );
    uploadQueue.value = processedFiles;
  } catch (error) {
    console.error(t('pages.musicAlbumDetailView.msgs.fileProcessFail'), error);
    message.error(t('pages.musicAlbumDetailView.msgs.fileProcessFail2'));
  }
  coverInputs.value = {};
};

const isUploadFormValid = computed(() => uploadQueue.value.every((item: UploadQueueItem) => item.title && item.artist))

const handleCoverClick = (index: number) => {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = 'image/*'; input.style.display = 'none';
  input.onchange = (event) => handleCoverSelect(event as Event, index)
  document.body.appendChild(input)
  coverInputs.value[index] = input
  input.click()
}

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_IMAGE_SIZE) { resolve(file); return; }
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        const aspectRatio = width / height;
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          if (aspectRatio > 1) { width = MAX_IMAGE_WIDTH; height = Math.round(width / aspectRatio); }
          else { height = MAX_IMAGE_HEIGHT; width = Math.round(height * aspectRatio); }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) { reject(new Error(t('pages.musicAlbumDetailView.msgs.ctxFail'))); return; }
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);
        const format = 'image/jpeg';
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error(t('pages.musicAlbumDetailView.msgs.imgCompressFail'))); return; }
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: format, lastModified: Date.now() }));
        }, format, IMAGE_QUALITY);
      };
      img.onerror = () => reject(new Error(t('pages.musicAlbumDetailView.msgs.imgLoadFail')));
    };
    reader.onerror = () => reject(new Error(t('pages.musicAlbumDetailView.msgs.imgReadFail')));
  });
};

const handleCoverSelect = async (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  if (!target.files || !target.files[0]) return
  const file = target.files[0]
  if (!file.type.startsWith('image/')) { message.error(t('pages.musicAlbumDetailView.msgs.imgReadFail')); return }
  try {
    const compressedFile = await compressImage(file);
    const res = await commonUploadPictureUsingPost({}, {}, compressedFile)
    if (res.data.code === 0) {
      if (uploadQueue.value[index]) {
        uploadQueue.value[index] = {
          ...uploadQueue.value[index],
          coverPreview: URL.createObjectURL(compressedFile),
          coverUrl: res.data.data.url
        }
      }
      message.success(t('pages.musicAlbumDetailView.msgs.coverSuccess'))
    } else { throw new Error(res.data.message || t('pages.musicAlbumDetailView.msgs.coverFail')) }
  } catch (err: any) {
    message.error(err.message || t('pages.musicAlbumDetailView.msgs.coverFail'))
  } finally {
    if (coverInputs.value[index]) { document.body.removeChild(coverInputs.value[index]); delete coverInputs.value[index] }
  }
}

const startUpload = async () => {
  if (!isUploadFormValid.value) { message.error(t('pages.musicAlbumDetailView.msgs.fillRequired')); return }
  isUploading.value = true
  const albumId = route.params.id as string
  for (let i = 0; i < uploadQueue.value.length; i++) {
    const item = uploadQueue.value[i]
    currentEditIndex.value = i
    try {
      const res = await uploadMusicToAlbumUsingPost({
        albumId, title: item.title, artist: item.artist, album: item.album,
        genre: item.genre, description: item.description, coverUrl: item.coverUrl
      }, {}, item.file)
      if (res.data.code === 0) {
        audioFiles.value.push(res.data.data)
        message.success(`"${item.title}" ${t('pages.musicAlbumDetailView.msgs.uploadSuccess')}`)
      } else { throw new Error(res.data.message || t('pages.musicAlbumDetailView.msgs.uploadFail')) }
    } catch (err: any) {
      message.error(`"${item.title}" ${t('pages.musicAlbumDetailView.msgs.uploadFail')}`)
    }
  }
  isUploading.value = false
  await fetchAudioFiles()
  closeUploadModal()
}

const closeUploadModal = () => {
  if (isUploading.value) { message.warning(t('pages.musicAlbumDetailView.msgs.uploadingWait')); return }
  showUploadModal.value = false
  uploadQueue.value = []
  currentEditIndex.value = 0
}

const getAudioCover = (audio: AudioFile) => audio.coverUrl || getDefaultAvatar(audio.title || audio.fileName)

const updateSeekHover = (event: MouseEvent) => {
  const seekArea = event.currentTarget as HTMLElement
  const rect = seekArea.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  hoverPosition.value = event.clientX - rect.left
  hoverTime.value = percent * duration.value
  showSeekHover.value = true
}

const hideSeekHover = () => { showSeekHover.value = false }

onMounted(() => window.addEventListener('resize', () => isMobileView.value = window.innerWidth <= 768))
onUnmounted(() => {
  window.removeEventListener('resize', () => isMobileView.value = window.innerWidth <= 768)
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value = null
  }
})

const fetchCategories = async () => {
  try {
    const res = await listCategoryByTypeUsingGet({ type: 2 })
    if (res.data.code === 0) categoryList.value = res.data.data || []
  } catch (err) { console.error(t('pages.musicAlbumDetailView.msgs.fetchCatFail'), err) }
}

const openUploadModal = async () => {
  showUploadModal.value = true
  await fetchCategories()
}
</script>

<style scoped>
/* 全局基础设置，利用传入的 CSS 变量适配明暗主题 */
.modern-music-detail {
  background-color: var(--background);
  color: var(--text-primary);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  font-family: var(--font-family-base);
  transition: var(--theme-transition);
}

/* =========================================================
   修复背景断层：使用 position: fixed 并覆盖全屏
========================================================= */
.bg-layer {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh;
  z-index: 0;
  pointer-events: none;
}
.bg-blur {
  width: 100%; height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(80px);
  opacity: 0.15; /* 极弱透明度，融入系统底色 */
  transform: scale(1.2); /* 防止高斯模糊边缘漏光 */
}
.bg-gradient {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  /* 运用平滑渐变，向下彻底过渡到底色 */
  background: linear-gradient(180deg, transparent 0%, var(--background) 60%, var(--background) 100%);
}

/* 主内容容器 */
.content-wrapper {
  position: relative;
  z-index: 2;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 32px;
  padding-bottom: 120px; /* 留出底部播放器的空间 */
}

/* 通用按钮系统，完美贴合系统的 border/shadow/bg 变量 */
button {
  cursor: pointer; border: none; background: none; color: inherit;
  font-family: inherit; transition: all 0.2s ease;
}
.primary-btn {
  background: var(--text-primary);
  color: var(--background);
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 30px;
  font-size: 14px;
  box-shadow: 0 4px 12px var(--shadow-color);
}
.primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px var(--shadow-color); }
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.secondary-btn {
  background: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  font-weight: 500;
  padding: 10px 24px;
  border-radius: 30px;
}
.secondary-btn:hover { background: var(--hover-background); }

.danger-btn {
  background: var(--comment-delete-hover-color, #ff4d4f);
  color: #fff;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 30px;
}
.danger-btn:hover { filter: brightness(1.1); }
.icon-btn { display: flex; align-items: center; gap: 8px; justify-content: center; }

/* 头部 Hero 区域 */
.album-hero {
  display: flex;
  align-items: flex-end;
  gap: 32px;
  margin-bottom: 40px;
  position: relative;
}
.cover-wrapper {
  width: 220px; height: 220px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 32px var(--shadow-color);
  flex-shrink: 0;
  border: 1px solid var(--border-color);
}
.hero-cover { width: 100%; height: 100%; object-fit: cover; }
.hero-info { display: flex; flex-direction: column; justify-content: flex-end; flex: 1; }
.hero-info .tag {
  font-size: 12px; font-weight: 600; letter-spacing: 1px;
  color: var(--text-secondary); margin-bottom: 12px;
}
.hero-info .title {
  font-size: 3rem; font-weight: 800; margin: 0 0 16px 0;
  line-height: 1.2; color: var(--text-primary);
  word-break: break-all;
}
.hero-info .description {
  color: var(--text-secondary); font-size: 14px; margin: 0 0 16px 0; max-width: 600px;
  line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.hero-info .meta {
  font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;
  display: flex; align-items: center; gap: 12px;
}
.hero-info .meta-item { display: flex; align-items: center; gap: 6px; }

/* 上传按钮 (桌面端常规，移动端FAB) */
.upload-action-btn {
  align-self: flex-start;
}

/* 列表视图布局 */
.track-list-container { width: 100%; }
.track-list-header {
  display: grid;
  grid-template-columns: 50px 1fr 200px 80px 60px;
  padding: 0 16px 12px 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 13px; font-weight: 500;
  margin-bottom: 8px;
}
.track-item {
  display: grid;
  grid-template-columns: 50px 1fr 200px 80px 60px;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
}
.track-item:hover { background-color: var(--hover-background); }
.track-item.is-playing { background-color: var(--nav-item-active); border-color: var(--border-color); }
.track-item:hover .icon-action-btn { opacity: 1; transform: scale(1); }

.col-index { color: var(--text-secondary); font-size: 14px; text-align: center; }
.col-title { display: flex; align-items: center; gap: 16px; min-width: 0; }
.track-cover { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border-color); }
.track-name-wrap { display: flex; flex-direction: column; overflow: hidden; gap: 4px; }
.track-name { font-size: 15px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.track-artist-mobile { display: none; } /* 仅在移动端显示 */
.text-active { color: var(--link-color, #1890ff); }
.col-artist, .col-time { color: var(--text-secondary); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.col-actions { display: flex; justify-content: flex-end; }

.icon-action-btn {
  color: var(--text-secondary); padding: 8px; border-radius: 50%;
  opacity: 0; transform: scale(0.9); transition: all 0.2s;
}
.icon-action-btn:hover { color: var(--comment-delete-hover-color, #ff4d4f); background: var(--hover-background); }

/* 正在播放音轨动画 */
.playing-indicator { display: flex; align-items: flex-end; justify-content: center; gap: 3px; height: 16px; }
.playing-indicator .bar { width: 3px; background-color: var(--link-color, #1890ff); border-radius: 2px; animation: bounce 1s infinite ease-in-out; }
.playing-indicator .bar:nth-child(1) { height: 60%; animation-delay: 0s; }
.playing-indicator .bar:nth-child(2) { height: 100%; animation-delay: -0.25s; }
.playing-indicator .bar:nth-child(3) { height: 80%; animation-delay: -0.5s; }
.playing-indicator .bar.paused { animation-play-state: paused; }
@keyframes bounce { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1); } }

/* 现代播放器 (底部悬浮控制栏) */
.modern-player {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: var(--card-background);
  border-top: 1px solid var(--border-color);
  z-index: 100;
  display: flex; flex-direction: column;
  box-shadow: 0 -4px 20px var(--shadow-color);
}
.player-progress-bar {
  height: 3px; width: 100%; background: var(--border-color); cursor: pointer; position: relative;
  transition: height 0.1s;
}
.player-progress-bar:hover { height: 6px; }
.progress-fill { height: 100%; background: var(--link-color, #1890ff); position: relative; pointer-events: none; }
.progress-fill::after {
  content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%);
  width: 12px; height: 12px; background: var(--link-color, #1890ff); border-radius: 50%; opacity: 0; transition: opacity 0.2s;
  box-shadow: 0 0 4px rgba(0,0,0,0.3);
}
.player-progress-bar:hover .progress-fill::after { opacity: 1; }
.progress-hover {
  position: absolute; bottom: 12px; transform: translateX(-50%);
  background: var(--text-primary); color: var(--background); padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none;
}

.player-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; height: 72px; box-sizing: border-box;
}
.player-now-playing { display: flex; align-items: center; gap: 16px; width: 30%; min-width: 200px; }
.player-now-playing img { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border-color); }
.np-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.np-artist { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.player-controls { display: flex; align-items: center; gap: 24px; justify-content: center; flex: 1; }
.control-btn { color: var(--text-secondary); padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.control-btn:hover:not(:disabled) { color: var(--text-primary); background: var(--hover-background); }
.control-btn.play-circle { color: var(--text-primary); width: 40px; height: 40px; }
.control-btn.play-circle:hover { background: var(--hover-background); transform: scale(1.05); }

.player-time { width: 30%; text-align: right; font-size: 12px; color: var(--text-secondary); display: flex; justify-content: flex-end; gap: 4px; }
.player-time .divider { opacity: 0.5; }

/* 模态框统一风格 (桌面端居中圆角) */
.modern-modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modern-modal {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  max-height: 85vh; width: 90%; max-width: 860px;
  overflow: hidden;
}
.compact-modal { max-width: 360px; }
.modal-header {
  padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--border-color);
}
.modal-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.close-btn { color: var(--text-secondary); padding: 8px; border-radius: 50%; display: flex; }
.close-btn:hover { background: var(--hover-background); color: var(--text-primary); }
.modal-body { padding: 0; flex: 1; overflow-y: auto; }
.modal-footer { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); background: var(--card-background); }

/* 上传表单分栏布局 */
.upload-layout { display: flex; gap: 0; padding: 0; overflow: hidden; }
.upload-sidebar { width: 280px; background: var(--background); display: flex; flex-direction: column; border-right: 1px solid var(--border-color); }
.drop-zone {
  padding: 32px 20px; text-align: center; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;
}
.drop-zone:hover { background: var(--hover-background); }
.drop-zone svg { color: var(--text-secondary); margin-bottom: 12px; }
.drop-zone p { margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: var(--text-primary); }
.drop-zone .sub-text { font-size: 12px; color: var(--text-secondary); }

.queue-list { flex: 1; overflow-y: auto; padding: 12px; }
.queue-item { padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s; margin-bottom: 4px; border: 1px solid transparent; }
.queue-item:hover { background: var(--hover-background); }
.queue-item.active { background: var(--nav-item-active); border-color: var(--border-color); }
.queue-info { display: flex; flex-direction: column; gap: 4px; }
.queue-title { font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.queue-artist { font-size: 12px; color: var(--text-secondary); }

.upload-form-area { flex: 1; padding: 24px; overflow-y: auto; background: var(--card-background); }
.upload-empty-right { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); background: var(--card-background); }

/* 表单输入控件适配 */
.modern-form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.modern-form-group label { font-size: 13px; color: var(--text-primary); font-weight: 600; }
.req { color: var(--comment-delete-hover-color, #ff4d4f); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
input, select, textarea {
  background: var(--background); border: 1px solid var(--border-color); color: var(--text-primary);
  padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s; font-family: inherit;
}
input:focus, select:focus, textarea:focus { border-color: var(--link-color, #1890ff); box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1); }
textarea { min-height: 80px; resize: vertical; }

.input-with-btn { display: flex; gap: 8px; }
.input-with-btn select, .input-with-btn input { flex: 1; }
.small-btn { padding: 8px 12px; font-size: 12px; }

.cover-uploader {
  width: 100px; height: 100px; border-radius: 8px; overflow: hidden; background: var(--background);
  margin-bottom: 24px; cursor: pointer; transition: opacity 0.2s; border: 1px dashed var(--border-color);
}
.cover-uploader:hover { opacity: 0.8; border-color: var(--link-color, #1890ff); }
.cover-uploader img { width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); gap: 6px; font-size: 12px; }

/* 状态与空数据 */
.modern-state { height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--text-secondary); position: relative; z-index: 2;}
.spinner { width: 28px; height: 28px; border: 2px solid var(--border-color); border-top-color: var(--link-color, #1890ff); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.modern-empty { padding: 60px 20px; text-align: center; color: var(--text-secondary); }
.modern-empty .empty-icon { margin-bottom: 16px; color: var(--border-color); }
.modern-empty p { margin-bottom: 24px; font-size: 15px; }

/* 删除确认框 */
.delete-body { text-align: center; padding: 32px 24px; }
.delete-icon-wrapper { margin-bottom: 16px; }
.delete-body h3 { margin: 0 0 12px 0; font-size: 18px; color: var(--text-primary); }
.delete-body p { color: var(--text-secondary); font-size: 14px; line-height: 1.5; margin: 0; }

/* ========================================================
   移动端响应式 (极致紧凑 + FAB + 全屏弹窗)
======================================================== */
@media (max-width: 768px) {
  /* 基础容器全屏贴边 */
  .main-container { padding: 0; padding-bottom: 80px; }

  /* 头部区域横排紧凑化 */
  .album-hero {
    flex-direction: row; align-items: center; padding: 24px 16px;
    gap: 16px; margin-bottom: 0; border-bottom: 1px solid var(--border-color);
  }
  .cover-wrapper { width: 100px; height: 100px; border-radius: 8px; box-shadow: 0 4px 12px var(--shadow-color); }
  .hero-info .tag { display: none; }
  .hero-info .title { font-size: 1.25rem; margin-bottom: 8px; }
  .hero-info .description { font-size: 13px; margin-bottom: 12px; -webkit-line-clamp: 1; }
  .hero-info .meta { margin-bottom: 0; font-size: 12px; }

  /* 上传按钮在移动端转为悬浮按钮 (FAB) */
  .upload-action-btn {
    position: fixed;
    bottom: calc(70px + env(safe-area-inset-bottom, 20px)); /* 悬浮在播放器之上 */
    right: 20px;
    width: 56px; height: 56px;
    border-radius: 50%;
    padding: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    z-index: 90;
    background: var(--text-primary);
  }
  .upload-action-btn .btn-text { display: none; }
  .upload-action-btn svg { width: 24px; height: 24px; }

  /* 列表全屏铺满无缝隙 */
  .track-list-container { width: 100%; border-top: none; }
  .track-list-header { display: none; /* 隐藏表头 */ }
  .track-item {
    grid-template-columns: auto 1fr auto; /* 仅序号、内容、操作 */
    padding: 10px 16px; border-radius: 0; border-bottom: 1px solid var(--border-color);
    gap: 12px;
  }
  .col-index { font-size: 13px; width: 24px; text-align: left; }
  .col-title { gap: 12px; }
  .track-cover { width: 40px; height: 40px; border-radius: 4px; }

  /* 隐藏多余列 */
  .col-artist { display: none; }
  .col-time { display: none; }
  .track-name { font-size: 14px; }
  .track-artist-mobile { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

  .col-actions { justify-content: center; }
  .icon-action-btn { opacity: 1; padding: 6px; }

  /* 移动端极简吸底播放器 */
  .modern-player {
    height: 60px; /* 固定极简高度 */
    padding-bottom: env(safe-area-inset-bottom, 0px); /* 适配全面屏底部小黑条 */
  }
  .player-progress-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .player-progress-bar:hover { height: 2px; } /* 禁止悬停变粗遮挡 */

  .player-inner { padding: 0 16px; height: 60px; width: 100%; justify-content: space-between; }
  .player-now-playing { width: auto; flex: 1; min-width: 0; gap: 12px; }
  .player-now-playing img { width: 40px; height: 40px; border-radius: 4px; }
  .np-title { font-size: 13px; margin-bottom: 2px; }
  .np-artist { font-size: 11px; }

  /* 仅留播放控制，隐藏时间文本 */
  .player-controls { flex: none; gap: 8px; justify-content: flex-end; }
  .player-time { display: none; }

  /* =========================================================
     移动端上传弹窗强制 100vw, 100vh 全屏，剥离圆角
  ========================================================= */
  .modern-modal-overlay { align-items: flex-start; /* 顶部对齐 */ }
  .modern-modal {
    width: 100vw; height: 100vh; max-height: 100vh; max-width: 100vw;
    border-radius: 0; border: none; margin: 0;
  }
  .modal-header {
    padding-top: 20px; /* 适配刘海屏 */
  }
  .upload-layout { flex-direction: column; overflow-y: auto; }
  .upload-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border-color); max-height: 250px; }
  .drop-zone { padding: 16px; }
  .form-row { grid-template-columns: 1fr; gap: 0; }
  .upload-form-area { padding: 16px; }
  .modal-footer {
    padding-bottom: max(16px, env(safe-area-inset-bottom, 16px)); /* 适配全面屏底部 */
  }
}
</style>
