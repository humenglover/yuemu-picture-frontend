<template>
  <Transition name="yuemu-slide-up">
    <div v-if="visible" class="yuemu-modern-editor">

      <div class="yuemu-editor-wrapper">
        <!-- 主工作区：顶部导航 + 画板 -->
        <div class="yuemu-canvas-container">

          <!-- 顶部导航 (毛玻璃) -->
          <header class="yuemu-glass-header">
            <button class="yuemu-icon-btn" @click="closeModal" :disabled="loading">
              <i class="fas fa-xmark"></i>
            </button>

            <div class="yuemu-header-title" style="display: flex; gap: 20px; font-size: 16px;">
              <div class="yuemu-collab-status" v-if="isTeamSpace && editingUser" style="position: absolute; left: 50%; transform: translateX(-50%); font-size: 13px;">
                <span class="yuemu-dot"></span> {{ editingUser.userName }} {{ t('components.imageCropper.isEditing') }}
              </div>
              <button class="yuemu-icon-btn" @click="undo" :disabled="historyIndex <= 0" :style="{ opacity: historyIndex <= 0 ? 0.3 : 1 }"><i class="fas fa-undo"></i></button>
              <button class="yuemu-icon-btn" @click="redo" :disabled="historyIndex >= history.length - 1" :style="{ opacity: historyIndex >= history.length - 1 ? 0.3 : 1 }"><i class="fas fa-redo"></i></button>
            </div>

            <div class="yuemu-header-actions" style="display: flex; gap: 12px; align-items: center;">
              <button class="yuemu-action-pill" style="background: rgba(255,255,255,0.15); color: #fff; box-shadow: none;" :class="{ 'yuemu-is-loading': previewLoading }" :disabled="loading || previewLoading" @click="handlePreview">
                <i class="fas fa-spinner fa-spin" v-if="previewLoading"></i>
                <i class="fas fa-eye" v-else></i>
                <span v-if="!previewLoading" style="margin-left: 4px;">{{ t('components.imageCropper.preview') }}</span>
              </button>
              <button class="yuemu-action-pill" :class="{ 'yuemu-is-loading': loading }" :disabled="loading || !canEdit || previewLoading" @click="handleConfirm">
                <i class="fas fa-spinner fa-spin" v-if="loading"></i>
                <span v-else>{{ t('components.imageCropper.finish') }}</span>
              </button>
            </div>
          </header>

          <!-- 沉浸式画板 (占用剩余空间) -->
          <main class="yuemu-immersive-canvas" ref="workspaceRef">

            <div class="yuemu-watermark-preview" v-show="activeTab !== 'crop'" @click="handlePreviewClick" style="cursor: pointer; position: relative;" :title="t('components.imageCropper.clickToEditWatermark')">
              <img :src="previewImageUrl" v-if="previewImageUrl" :alt="t('components.imageCropper.effectPreview')" :style="{ filter: computedCssFilter }" />
              <div v-if="isPreviewGenerating" class="yuemu-loading-mask" style="position: absolute; inset: 0; background: rgba(0,0,0,0.3); z-index: 10; display: flex; align-items: center; justify-content: center;">
                <div class="yuemu-spinner-modern"></div>
              </div>
              <div v-else-if="!previewImageUrl" class="yuemu-spinner-modern"></div>
            </div>

            <div class="yuemu-cropper-wrapper" ref="wrapperRef" :class="{ 'yuemu-hidden-cropper': activeTab !== 'crop' }" :style="{ transform: wrapperTransform, transition: 'transform 0.1s ease-out', filter: computedCssFilter }">
              <LightCropper
                ref="cropperRef"
                :key="cropperKey"
                :img="cropperOption.img"
                :fixed="cropperOption.fixed"
                :fixedNumber="cropperOption.fixedNumber"
                :autoCrop="cropperOption.autoCrop"
                :autoCropArea="cropperOption.autoCropArea"
                @imgLoad="onImgLoad"
                class="yuemu-cropper-instance"
              />
            </div>



            <Transition name="yuemu-fade">
              <div v-show="isImgLoading" class="yuemu-loading-mask">
                <!-- 用 cropperOption.img 做模糊背景：VueCropper 初始化期间也能看到图片，消除黑屏感 -->
                <img
                  v-if="cropperOption.img"
                  :src="cropperOption.img"
                  class="yuemu-loading-bg-preview"
                />
                <div class="yuemu-spinner-modern" style="position: relative; z-index: 2;"></div>
              </div>
            </Transition>
          </main>
        </div>

        <!-- 底部/侧边 控制台 (占据实际空间) -->
        <aside class="yuemu-glass-panel">

          <!-- 现代分段控制器 (导航) -->
          <nav class="yuemu-segmented-control">
            <button class="yuemu-segment" :class="{ yuemu_active: activeTab === 'filter' }" @click="activeTab = 'filter'">{{ t('components.imageCropper.adjust') }}</button>
            <button class="yuemu-segment" :class="{ yuemu_active: activeTab === 'crop' }" @click="activeTab = 'crop'">{{ t('components.imageCropper.composition') }}</button>
            <button class="yuemu-segment" :class="{ yuemu_active: activeTab === 'watermark' }" @click="activeTab = 'watermark'">{{ t('components.imageCropper.watermark') }}</button>
            <button class="yuemu-segment" :class="{ yuemu_active: activeTab === 'ai' }" @click="activeTab = 'ai'">AI</button>
          </nav>

          <div class="yuemu-panel-scroll">

            <!-- 调节面板 (默认) -->
            <Transition name="yuemu-tab-fade" mode="out-in">
              <div v-if="activeTab === 'filter'" class="yuemu-tool-card" key="filter">

                <!-- 紧凑型头部：标题 + 参数标签 + 复原 -->
                <div class="yuemu-compact-filter-header">
                  <div class="yuemu-cf-left">
                    <span class="yuemu-label">{{ t('components.imageCropper.colorLight') }}</span>
                    <div class="yuemu-cf-params">
                      <span v-if="filters.brightness !== 100">{{ t('components.imageCropper.bright') }} {{ filters.brightness - 100 > 0 ? '+' : '' }}{{ filters.brightness - 100 }}</span>
                      <span v-if="filters.contrast !== 100">{{ t('components.imageCropper.contrast') }} {{ filters.contrast - 100 > 0 ? '+' : '' }}{{ filters.contrast - 100 }}</span>
                      <span v-if="filters.saturate !== 100">{{ t('components.imageCropper.saturate') }} {{ filters.saturate - 100 > 0 ? '+' : '' }}{{ filters.saturate - 100 }}</span>
                      <span v-if="filters.hue !== 0">{{ t('components.imageCropper.hue') }} {{ filters.hue > 0 ? '+' : '' }}{{ filters.hue }}</span>
                      <span v-if="filters.blur !== 0" style="color: #FF9F0A;">{{ t('components.imageCropper.blur') }} {{ filters.blur }}</span>
                    </div>
                  </div>
                  <button class="yuemu-text-btn" @click="resetFilters" v-show="filters.brightness !== 100 || filters.contrast !== 100 || filters.saturate !== 100 || filters.hue !== 0 || filters.blur !== 0">{{ t('components.imageCropper.restore') }}</button>
                </div>

                <!-- 紧凑交互区：左侧二维调色盘 + 右侧垂直虚化滑块 -->
                <div class="yuemu-compact-controls-wrapper" style="display: flex; gap: 4px; align-items: stretch; margin-top: 4px;">
                  <div class="yuemu-color-pad-wrap yuemu-compact-pad" style="flex: 1;">
                    <div class="yuemu-color-pad" ref="colorPadRef" :style="dynamicColorPadBg ? { background: dynamicColorPadBg } : {}" @mousedown="onPadDragStart" @touchstart.passive="onPadDragStart">
                      <div class="yuemu-pad-grid"></div>
                      <div class="yuemu-pad-center-x"></div>
                      <div class="yuemu-pad-center-y"></div>
                      <div class="yuemu-pad-thumb" :style="{ left: colorPadX + '%', top: colorPadY + '%' }"></div>
                    </div>
                  </div>
                  <!-- 右侧独立垂直滑块 -->
                  <div class="yuemu-vertical-blur-slider" @mousedown.stop @touchstart.stop>
                    <div class="yuemu-rotated-slider-wrapper">
                      <input type="range" min="0" max="15" step="0.5" v-model="filters.blur" class="yuemu-rotated-slider">
                    </div>
                    <i class="fas fa-droplet"></i>
                  </div>
                </div>

                <!-- 预设滤镜 (Vivo 质感级) -->
                <div class="yuemu-preset-section">
                  <div class="yuemu-slider-header yuemu-mt-3" style="margin-bottom: 8px;"><span>{{ t('components.imageCropper.advancedPresets') }}</span></div>
                  <div class="yuemu-presets-grid">
                    <div
                      class="yuemu-preset-item"
                      v-for="(preset, index) in filterPresets"
                      :key="index"
                      @click="applyPreset(preset)"
                    >
                      <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': isPresetActive(preset) }">
                        <img v-if="cropperOption.img" loading="lazy" :src="cropperOption.img" :style="{ filter: `brightness(${preset.brightness}%) contrast(${preset.contrast}%) saturate(${preset.saturate}%) hue-rotate(${preset.hue}deg)`, willChange: 'filter' }" />
                        <div class="yuemu-preset-overlay" :class="{ 'yuemu-active-overlay': isPresetActive(preset) }">
                          <i class="fas fa-check" v-if="isPresetActive(preset)"></i>
                        </div>
                      </div>
                      <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': isPresetActive(preset) }">{{ preset.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 构图面板 -->
              <div v-else-if="activeTab === 'crop'" class="yuemu-tool-card" key="crop">

                <!-- 自由旋转器 -->
                <div class="yuemu-rotation-section">
                  <div class="yuemu-rotation-header">
                    <button class="yuemu-icon-circle-btn" @click="rotateLeft" :title="t('components.imageCropper.rotateLeft90')"><i class="fas fa-rotate-left"></i></button>
                    <div class="yuemu-rotation-center">
                      <button class="yuemu-text-btn yuemu-reset-btn" @click="resetCrop">{{ t('components.imageCropper.reset') }}</button>
                      <span class="yuemu-degree">{{ rotationAngle }}°</span>
                    </div>
                    <button class="yuemu-icon-circle-btn" @click="rotateRight" :title="t('components.imageCropper.rotateRight90')"><i class="fas fa-rotate-right"></i></button>
                  </div>

                  <div class="yuemu-ruler-slider">
                    <input type="range" min="-45" max="45" v-model.number="rotationAngle" class="yuemu-fat-slider yuemu-ruler">
                  </div>
                </div>

                <!-- 比例宫格 -->
                <div class="yuemu-ratio-grid">
                  <div class="yuemu-ratio-card" :class="{ 'yuemu-active': currentRatioStr === 'free' }" @click="toggleFixed(false)">
                    <div class="yuemu-ratio-icon ratio-icon-free"></div>
                    <span class="yuemu-ratio-text">{{ t('components.imageCropper.freeRatio') }}</span>
                  </div>
                  <div class="yuemu-ratio-card" :class="{ 'yuemu-active': currentRatioStr === 'original' }" @click="setRatioOriginal()">
                    <div class="yuemu-ratio-icon ratio-icon-original"></div>
                    <span class="yuemu-ratio-text">{{ t('components.imageCropper.originalRatio') }}</span>
                  </div>
                  <div class="yuemu-ratio-card" :class="{ 'yuemu-active': currentRatioStr === '1:1' }" @click="setRatio([1, 1], '1:1')">
                    <div class="yuemu-ratio-icon ratio-icon-1-1"></div>
                    <span class="yuemu-ratio-text">1:1</span>
                  </div>
                  <div class="yuemu-ratio-card" :class="{ 'yuemu-active': currentRatioStr === '3:4' }" @click="setRatio([3, 4], '3:4')">
                    <div class="yuemu-ratio-icon ratio-icon-3-4"></div>
                    <span class="yuemu-ratio-text">3:4</span>
                  </div>
                  <div class="yuemu-ratio-card" :class="{ 'yuemu-active': currentRatioStr === '4:3' }" @click="setRatio([4, 3], '4:3')">
                    <div class="yuemu-ratio-icon ratio-icon-4-3"></div>
                    <span class="yuemu-ratio-text">4:3</span>
                  </div>
                  <div class="yuemu-ratio-card" :class="{ 'yuemu-active': currentRatioStr === '9:16' }" @click="setRatio([9, 16], '9:16')">
                    <div class="yuemu-ratio-icon ratio-icon-9-16"></div>
                    <span class="yuemu-ratio-text">9:16</span>
                  </div>
                  <div class="yuemu-ratio-card" :class="{ 'yuemu-active': currentRatioStr === '16:9' }" @click="setRatio([16, 9], '16:9')">
                    <div class="yuemu-ratio-icon ratio-icon-16-9"></div>
                    <span class="yuemu-ratio-text">16:9</span>
                  </div>
                </div>

              </div>

              <!-- 水印/相框面板 -->
              <div v-else-if="activeTab === 'watermark'" class="yuemu-tool-card" key="watermark">
                <div class="yuemu-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span class="yuemu-label">{{ t('components.imageCropper.frameTemplate') }}</span>
                  <Transition name="yuemu-fade">
                    <div style="background: rgba(10, 132, 255, 0.15); border: 1px solid rgba(10, 132, 255, 0.3); padding: 4px 10px; border-radius: 12px; cursor: pointer; display: flex; align-items: center;" v-if="['polaroid', 'card'].includes(selectedFrame)" @click="handlePreviewClick">
                      <span style="color: var(--yuemu-theme-color); font-size: 11px; font-weight: 500;"><i class="fas fa-pen-to-square" style="margin-right: 4px;"></i>{{ t('components.imageCropper.clickToEditWatermarkHint') }}</span>
                    </div>
                  </Transition>
                </div>

                <div class="yuemu-presets-grid">
                  <div class="yuemu-preset-item" @click="selectedFrame = 'none'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'none' }" style="border-radius: 8px; overflow: hidden; background: #222;">
                      <img v-if="croppedImageUrl" loading="lazy" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'none' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.presetOriginal') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'polaroid'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'polaroid' }" style="border-radius: 8px; overflow: hidden; background: #fff; padding: 4px 4px 12px 4px; display: flex; align-items: flex-start;">
                      <img v-if="croppedImageUrl" loading="lazy" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover; background: #ddd;" />
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'polaroid' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.framePolaroid') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'blur-bg'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'blur-bg' }" style="border-radius: 8px; overflow: hidden; background: #222; position: relative;">
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(4px) brightness(0.8);" />
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="position: absolute; top: 10%; left: 10%; width: 80%; height: 80%; object-fit: contain; box-shadow: 0 2px 4px rgba(0,0,0,0.5);" />
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'blur-bg' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameBlurBg') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'blur-aura'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'blur-aura' }" style="border-radius: 8px; overflow: hidden; background: #000; position: relative;">
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="position: absolute; inset: -20%; width: 140%; height: 140%; object-fit: cover; filter: blur(6px) saturate(200%) brightness(1.2) opacity(0.8);" />
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="position: absolute; top: 15%; left: 15%; width: 70%; height: 70%; object-fit: contain; box-shadow: 0 4px 8px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2);" />
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'blur-aura' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameBlurAura') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'blur-glass'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'blur-glass' }" style="border-radius: 8px; overflow: hidden; background: #fff; position: relative;">
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" />
                      <div style="position: absolute; inset: 10%; background: rgba(255,255,255,0.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.5);">
                        <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 80%; height: 80%; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" />
                      </div>
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'blur-glass' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameBlurGlass') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'letterbox'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'letterbox' }" style="border-radius: 8px; overflow: hidden; background: #fff; padding: 12px 0; display: flex; align-items: center;">
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover; background: #ddd;" />
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'letterbox' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameLetterbox') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'gallery'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'gallery' }" style="border-radius: 8px; overflow: hidden; background: #fff; padding: 6px; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
                      <div style="width: 100%; height: 100%; padding: 2px; border: 1px solid rgba(0,0,0,0.2); display: flex;">
                        <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover; background: #ddd;" />
                      </div>
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'gallery' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameGallery') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'stamp'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'stamp' }" style="border-radius: 8px; overflow: hidden; background: #fff; padding: 6px; display: flex; position: relative; border: 2px dashed #ccc; box-sizing: border-box;">
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover; background: #ddd;" />
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'stamp' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameStamp') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'minimalist'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'minimalist' }" style="border-radius: 8px; overflow: hidden; background: #fff; padding: 4px;">
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover; background: #ddd;" />
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'minimalist' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameMinimalist') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'card'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'card' }" style="border-radius: 8px; overflow: hidden; background: #fff; padding: 4px 4px 14px 4px; position: relative;">
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover; background: #ddd;" />
                      <div style="position: absolute; bottom: 4px; left: 4px; width: 10px; height: 2px; background: #aaa;"></div>
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'card' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameCard') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'vintage'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'vintage' }" style="border-radius: 8px; overflow: hidden; background: #f4ecd8; padding: 4px;">
                      <div style="border: 1px solid rgba(0,0,0,0.2); width: 100%; height: 100%; display: flex;">
                        <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover;" />
                      </div>
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'vintage' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameVintage') }}</span>
                  </div>

                  <div class="yuemu-preset-item" @click="selectedFrame = 'film'">
                    <div class="yuemu-preset-thumbnail" :class="{ 'yuemu-active-thumb': selectedFrame === 'film' }" style="border-radius: 8px; overflow: hidden; background: #111; padding: 8px 0; position: relative;">
                      <div style="position: absolute; top: 2px; left: 0; width: 100%; height: 4px; background-image: repeating-linear-gradient(90deg, transparent, transparent 2px, #fff 2px, #fff 6px); opacity: 0.8; z-index: 2;"></div>
                      <div style="position: absolute; bottom: 2px; left: 0; width: 100%; height: 4px; background-image: repeating-linear-gradient(90deg, transparent, transparent 2px, #fff 2px, #fff 6px); opacity: 0.8; z-index: 2;"></div>
                      <img v-if="croppedImageUrl" :src="croppedImageUrl" :style="{ filter: computedCssFilter }" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                    <span class="yuemu-preset-name" :class="{ 'yuemu-active-text': selectedFrame === 'film' }" style="display: block; text-align: center; margin-top: 4px; font-size: 11px;">{{ t('components.imageCropper.frameFilm') }}</span>
                  </div>
                </div>
              </div>

              <!-- AI面板 -->
              <div v-else-if="activeTab === 'ai'" class="yuemu-tool-card" key="ai">
                <button class="yuemu-ai-btn" @click="handleEnhanceImage" :disabled="enhanceLoading || aiLoading || blurLoading">
                  <div class="yuemu-ai-icon" style="background: linear-gradient(135deg, #FF9500, #FFCC00); box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);"><i class="fas fa-magic"></i></div>
                  <div class="yuemu-ai-info">
                    <span class="yuemu-ai-title">{{ enhanceLoading ? t('components.imageCropper.enhancing') : t('components.imageCropper.enhanceClarity') }}</span>
                    <span class="yuemu-ai-desc">{{ t('components.imageCropper.enhanceDesc') }}</span>
                  </div>
                </button>

                <button class="yuemu-ai-btn yuemu-mt-2" @click="handleRemoveBg" :disabled="aiLoading || blurLoading || enhanceLoading">
                  <div class="yuemu-ai-icon"><i class="fas fa-wand-magic-sparkles"></i></div>
                  <div class="yuemu-ai-info">
                    <span class="yuemu-ai-title">{{ aiLoading ? t('components.imageCropper.processing') : t('components.imageCropper.smartCrop') }}</span>
                    <span class="yuemu-ai-desc">{{ t('components.imageCropper.smartCropDesc') }}</span>
                  </div>
                </button>

                <button class="yuemu-ai-btn yuemu-mt-2" @click="handleFaceBlur" :disabled="blurLoading || aiLoading || enhanceLoading">
                  <div class="yuemu-ai-icon yuemu-safe"><i class="fas fa-user-shield"></i></div>
                  <div class="yuemu-ai-info">
                    <span class="yuemu-ai-title">{{ blurLoading ? t('components.imageCropper.scanning') : t('components.imageCropper.faceBlur') }}</span>
                    <span class="yuemu-ai-desc">{{ t('components.imageCropper.faceBlurDesc') }}</span>
                  </div>
                </button>
              </div>
            </Transition>

          </div>
        </aside>

      </div><!-- /.yuemu-editor-wrapper -->

      <!-- 文字编辑弹窗 -->
      <Transition name="yuemu-fade">
        <div v-if="textEditVisible" class="yuemu-modal-overlay" @click="textEditVisible = false">
          <div class="yuemu-modern-dialog" @click.stop style="padding: 24px; max-width: 300px; width: 85%;">
            <h3 style="margin-top: 0; margin-bottom: 20px; color: #fff; text-align: center; font-size: 16px; font-weight: 600;">{{ t('components.imageCropper.editWatermarkText') }}</h3>

            <div>
              <div class="yuemu-setting-cell" style="margin-bottom: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);">
                <input type="text" v-model="tempCustomText" :placeholder="t('components.imageCropper.customSignature')" class="yuemu-borderless-input" maxlength="25">
              </div>
              <div class="yuemu-setting-cell" v-if="selectedFrame === 'card'" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);">
                <input type="text" v-model="tempCustomDate" :placeholder="t('components.imageCropper.datePlaceholder')" class="yuemu-borderless-input" maxlength="15">
              </div>
            </div>

            <div class="yuemu-dialog-actions" style="margin-top: 24px; border-top: none; gap: 12px; display: flex;">
              <button class="yuemu-btn-ghost" @click="textEditVisible = false" style="background: rgba(255,255,255,0.05); border-radius: 12px; border: none !important;">{{ t('components.imageCropper.cancel') }}</button>
              <button class="yuemu-btn-primary" @click="confirmTextEdit" style="background: var(--yuemu-theme-color); color: #fff; border-radius: 12px;">{{ t('components.imageCropper.confirm') }}</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- AI处理结果确认弹窗 -->
      <Transition name="yuemu-fade">
        <div v-if="aiResultVisible" class="yuemu-modal-overlay" @click="closeAiResult">
          <div class="yuemu-modern-dialog" @click.stop>
            <div class="yuemu-dialog-img yuemu-bg-checkboard"><img :src="aiResultUrl" :alt="t('components.imageCropper.processResult')" /></div>
            <div class="yuemu-dialog-actions">
              <button class="yuemu-btn-ghost" @click="closeAiResult">{{ t('components.imageCropper.cancel') }}</button>
              <button class="yuemu-btn-primary" @click="confirmAiResult">{{ t('components.imageCropper.applyEffect') }}</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 全屏预览弹窗 -->
      <ImagePreview
        v-model:visible="previewModalVisible"
        :images="previewModalImages"
        :closableOnMask="true"
      />

      <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, watchEffect, watch, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { uploadPictureUsingPost } from '@/api/pictureController'
import { removeBackgroundUsingPost, faceBlurUsingPost, enhanceImageUsingPost } from '@/api/pythonApiController'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import PictureEditWebSocket from '@/utils/pictureEditWebSocket'
import { SPACE_TYPE_ENUM } from '@/constants/space'
import { PICTURE_EDIT_MESSAGE_TYPE_ENUM } from '@/constants/picture'
import LightCropper from '@/components/LightCropper.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { useI18n } from 'vue-i18n'

interface Props {
  imageUrl?: string; picture?: API.PictureVO; spaceId?: number; space?: API.SpaceVO; onSuccess?: (newPicture: API.PictureVO) => void;
}
const props = defineProps<Props>()
const { t } = useI18n()

const visible = ref(false)
const loading = ref(false)
const isImgLoading = ref(false)
const cropperKey = ref(0)
const cropperRef = ref<InstanceType<typeof LightCropper>>()
const workspaceRef = ref<HTMLElement | null>(null)

const aiLoading = ref(false)
const blurLoading = ref(false)
const enhanceLoading = ref(false)
const aiResultVisible = ref(false)
const aiResultUrl = ref('')
const aiResultBlob = ref<Blob>()

const currentImageUrl = ref(props.imageUrl || '')
const originalImageBlob = ref<Blob>()
const dynamicColorPadBg = ref('')


const calculatePadGradient = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return URL.revokeObjectURL(url);
    canvas.width = 50; canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);
    const data = ctx.getImageData(0, 0, 50, 50).data;

    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] > 128) {
        r += data[i]; g += data[i+1]; b += data[i+2]; count++;
      }
    }
    if (count > 0) { r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count); }
    else { r = 128; g = 128; b = 128; }

    let rf = r / 255, gf = g / 255, bf = b / 255;
    let max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
        case gf: h = (bf - rf) / d + 2; break;
        case bf: h = (rf - gf) / d + 4; break;
      }
      h /= 6;
    }
    h = Math.round(h * 360);
    const rightH = h; const leftH = (h + 180) % 360;

    dynamicColorPadBg.value = `
      linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 0%, transparent 45%, rgba(0, 0, 0, 0.65) 100%),
      linear-gradient(to right, hsl(${leftH}, 25%, 45%) 0%, hsl(${leftH}, 20%, 60%) 35%, hsl(${rightH}, 85%, 65%) 70%, hsl(${rightH}, 95%, 60%) 100%)
    `;
    URL.revokeObjectURL(url);
  };
  img.src = url;
};

const activeTab = ref('filter')
const currentRatioStr = ref('free')

const textEditVisible = ref(false)
const tempCustomText = ref('')
const tempCustomDate = ref('')
const customFrameDate = ref(new Date().toISOString().split('T')[0].replace(/-/g, '.'))

const handlePreviewClick = () => {
  // @ts-ignore
  if (activeTab.value === 'watermark' && ['polaroid', 'card'].includes(selectedFrame.value)) {
    // @ts-ignore
    tempCustomText.value = customFrameText.value;
    tempCustomDate.value = customFrameDate.value;
    textEditVisible.value = true;
  }
}

const confirmTextEdit = () => {
  // @ts-ignore
  customFrameText.value = tempCustomText.value;
  customFrameDate.value = tempCustomDate.value;
  textEditVisible.value = false;
}

const filterPresets = computed(() => [
  { name: t('components.imageCropper.presetOriginal'), brightness: 100, contrast: 100, saturate: 100, hue: 0 },
  { name: t('components.imageCropper.presetInsVibe'), brightness: 116, contrast: 120, saturate: 125, hue: 6 },
  { name: t('components.imageCropper.presetAppetizing'), brightness: 120, contrast: 113, saturate: 130, hue: 0 },
  { name: t('components.imageCropper.presetMilkTea'), brightness: 110, contrast: 150, saturate: 135, hue: 10 },
  { name: t('components.imageCropper.presetBeach'), brightness: 114, contrast: 140, saturate: 128, hue: -10 },
  { name: t('components.imageCropper.presetHealing'), brightness: 80, contrast: 90, saturate: 120, hue: -5 },
  { name: t('components.imageCropper.presetCream'), brightness: 118, contrast: 90, saturate: 110, hue: 8 },
  { name: t('components.imageCropper.presetSunset'), brightness: 78, contrast: 150, saturate: 136, hue: 12 },
  { name: t('components.imageCropper.presetFilm'), brightness: 120, contrast: 95, saturate: 82, hue: 15 },
  { name: t('components.imageCropper.presetSelfie'), brightness: 118, contrast: 120, saturate: 116, hue: -16 },
  { name: t('components.imageCropper.presetInsClear'), brightness: 120, contrast: 130, saturate: 120, hue: -8 },
  { name: t('components.imageCropper.presetBwDocumentary'), brightness: 105, contrast: 120, saturate: 0, hue: 0 },
]);

const applyPreset = (preset: any) => {
  filters.brightness = preset.brightness;
  filters.contrast = preset.contrast;
  filters.saturate = preset.saturate;
  filters.hue = preset.hue;
};

const isPresetActive = (preset: any) => {
  return filters.brightness === preset.brightness &&
    filters.contrast === preset.contrast &&
    filters.saturate === preset.saturate &&
    filters.hue === preset.hue;
};

const cropperOption = reactive({
  img: currentImageUrl.value,
  autoCrop: true,
  fixed: false,
  fixedNumber: [1, 1],
  fixedBox: false,
  centerBox: true,
  canMove: true,
  canMoveBox: true,
  original: false,
  autoCropArea: 1,
  outputSize: 1,
  outputType: 'png' as const
})

const filters = reactive({ brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0 })
const computedCssFilter = computed(() => `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px)`)
const resetFilters = () => { filters.brightness = 100; filters.contrast = 100; filters.saturate = 100; filters.hue = 0; filters.blur = 0; }

// 蓝图调色盘逻辑
const colorPadRef = ref<HTMLElement | null>(null)
const colorPadX = ref(50) // X轴：映射为色相 (0-100)
const colorPadY = ref(50) // Y轴：映射为饱和度 (0-100)
const isPadDragging = ref(false)

const updateFiltersFromPad = () => {
  const x = colorPadX.value; const y = colorPadY.value;
  // X轴映射：左冷色右暖色
  filters.hue = Math.round((x - 50) * 1.8); // -90 到 90
  // Y轴映射：上明亮下暗沉
  filters.brightness = Math.round(100 + (50 - y) * 0.4); // 80 到 120
  // 对比度：上柔和下强烈
  filters.contrast = Math.round(100 + (y - 50) * 0.6); // 70 到 130
  // 饱和度：右下最浓烈，左上最灰暗
  filters.saturate = Math.round(100 + (x - 50) * 0.5 + (y - 50) * 0.5); // 50 到 150
}

// 监听底部滑块改变，反向同步到色盘
watch(() => filters, () => {
  if (!isPadDragging.value) {
    colorPadX.value = Math.min(100, Math.max(0, (filters.hue / 1.8) + 50));
    colorPadY.value = Math.min(100, Math.max(0, (200 - filters.saturate) / 2));
  }
}, { deep: true })

const onPadDragStart = (e: MouseEvent | TouchEvent) => {
  isPadDragging.value = true;
  onPadDragMove(e);
  document.addEventListener('mousemove', onPadDragMove);
  document.addEventListener('mouseup', onPadDragEnd);
  document.addEventListener('touchmove', onPadDragMove, { passive: false });
  document.addEventListener('touchend', onPadDragEnd);
}

const onPadDragMove = (e: MouseEvent | TouchEvent) => {
  if (!isPadDragging.value || !colorPadRef.value) return;
  if (e.cancelable) e.preventDefault();
  const rect = colorPadRef.value.getBoundingClientRect();
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

  let x = ((clientX - rect.left) / rect.width) * 100;
  let y = ((clientY - rect.top) / rect.height) * 100;
  colorPadX.value = Math.min(100, Math.max(0, x));
  colorPadY.value = Math.min(100, Math.max(0, y));
  updateFiltersFromPad();
}

const onPadDragEnd = () => {
  isPadDragging.value = false;
  document.removeEventListener('mousemove', onPadDragMove);
  document.removeEventListener('mouseup', onPadDragEnd);
  document.removeEventListener('touchmove', onPadDragMove);
  document.removeEventListener('touchend', onPadDragEnd);
}

import NuvLogo from '@/assets/nuv.png'
const selectedFrame = ref('none');
const customFrameText = ref('YUE PHOTO');

const getLogoImage = (): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = NuvLogo;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
  });
}

const toggleFixed = (isFixed: boolean) => {
  cropperOption.fixed = isFixed;
  if (!isFixed) { currentRatioStr.value = 'free'; nextTick(() => cropperRef.value?.goAutoCrop()); }
}
const setRatio = (ratio: [number, number], ratioStr: string) => {
  cropperOption.fixed = true; cropperOption.fixedNumber = ratio; currentRatioStr.value = ratioStr;
  nextTick(() => cropperRef.value?.goAutoCrop());
}
// LightCropper 不处理内部旋转，直接修改 rotationAngle（±90°步进）
const rotateLeft = () => { rotationAngle.value = rotationAngle.value - 90 }
const rotateRight = () => { rotationAngle.value = rotationAngle.value + 90 }

const fetchImageAsBlob = async (url: string): Promise<Blob> => {
  const isLocal = url.startsWith('blob:') || url.startsWith('data:');
  const finalUrl = isLocal ? url : `${url}${url.includes('?') ? '&' : '?'}referer=${encodeURIComponent(window.location.origin)}`;
  const res = await fetch(finalUrl);
  return await res.blob();
}
const compressImageBlob = async (blob: Blob, maxWidth = 2048, maxHeight = 2048, quality = 0.9): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image(); const blobUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      let { width, height } = img;
      if (width <= maxWidth && height <= maxHeight) return resolve(blob);
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio); height = Math.floor(height * ratio);
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(); ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((b) => b ? resolve(b) : reject(), 'image/jpeg', quality);
    };
    img.onerror = reject; img.src = blobUrl;
  });
}

// showLoading：是否显示全屏加载遮罩（stage2 静默替换时传 false）
// loading 遮罩的关闭【只】由 onImgLoad 回调负责，不在此处提前关闭
const updateCropperImage = (blob: Blob, showLoading = true) => {
  if (cropperOption.img?.startsWith('blob:')) URL.revokeObjectURL(cropperOption.img);
  cropperOption.img = URL.createObjectURL(blob);
  cropperKey.value++;
  initialCropDone = false;
  if (showLoading) {
    isImgLoading.value = true; // 确保遮罩开启，等 onImgLoad 来关闭
  }
}

const openModal = async () => {
  visible.value = true; isImgLoading.value = true;
  initialCropDone = false;
  history.value = []; historyIndex.value = -1; isRestoring.value = false;
  cropperOption.fixed = false; currentRatioStr.value = 'free'; activeTab.value = 'filter';
  resetFilters(); selectedFrame.value = 'none';

  const hdUrl = props.picture?.url || props.imageUrl || '';
  const thumbUrl = props.picture?.thumbnailUrl || '';
  const hasThumb = !!thumbUrl && thumbUrl !== hdUrl;

  try {
    if (!hdUrl && !thumbUrl) throw new Error(t('components.imageCropper.noAvailableImage'));

    if (hasThumb) {
      // ── 方案A：两段式加载 ──────────────────────────────────────────
      // 阶段1：立即用缩略图打开，让用户几乎零等待地看到编辑界面
      const thumbBlob = await fetchImageAsBlob(thumbUrl);
      updateCropperImage(thumbBlob, true); // 显示 loading，等 onImgLoad 关闭

      // 阶段2：后台并行加载高清图
      // - showLoading=false：不触发遮罩，用户无感知
      // - 只在用户尚未开始编辑（historyIndex===-1）时才替换 Cropper 图片，避免打断操作
      fetchImageAsBlob(hdUrl)
        .then(blob => compressImageBlob(blob, 1920, 1920, 0.9))
        .then(compressed => {
          originalImageBlob.value = compressed;
          calculatePadGradient(compressed);
          if (historyIndex.value === -1) {
            // 用户还没操作，可以静默替换为高清图
            updateCropperImage(compressed, false);
          }
        })
        .catch(() => {
          // 高清图加载失败，缩略图 blob 作为 originalImageBlob 兜底
          originalImageBlob.value = thumbBlob;
          calculatePadGradient(thumbBlob);
        });
    } else {
      // 只有一个 url，走原来的单阶段逻辑
      const originalBlob = await fetchImageAsBlob(hdUrl || thumbUrl);
      originalImageBlob.value = originalBlob;
      const compressedBlob = await compressImageBlob(originalBlob, 1920, 1920, 0.9);
      calculatePadGradient(compressedBlob);
      updateCropperImage(compressedBlob);
    }
  } catch (error: any) {
    message.error(t('components.imageCropper.imageLoadFailed')); isImgLoading.value = false;
  }
}

const closeModal = () => {
  visible.value = false;
  if (websocket) websocket.disconnect();
  loading.value = false;
  if (previewModalImages.value[0]) {
    URL.revokeObjectURL(previewModalImages.value[0]);
    previewModalImages.value = [];
  }
}

const rotationAngle = ref(0);

const wrapperRef = ref<HTMLElement | null>(null);
const wrapperWidth = ref(0);
const wrapperHeight = ref(0);
let resizeObserver: ResizeObserver | null = null;

const wrapperTransform = computed(() => {
  if (!rotationAngle.value) return 'rotate(0deg) scale(1)';
  const rad = rotationAngle.value * Math.PI / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));

  const w = wrapperWidth.value || 300;
  const h = wrapperHeight.value || 500;

  const boundW = w * absCos + h * absSin;
  const boundH = w * absSin + h * absCos;

  const scale = Math.min(w / boundW, h / boundH);

  return `rotate(${rotationAngle.value}deg) scale(${scale})`;
});

const setRatioOriginal = () => {
  if (!originalImageBlob.value) return;
  const img = new Image();
  const url = URL.createObjectURL(originalImageBlob.value);
  img.onload = () => {
    setRatio([img.width, img.height], 'original');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

const resetCrop = async () => {
  isImgLoading.value = true; cropperOption.fixed = false; currentRatioStr.value = 'free'; cropperOption.autoCropArea = 1;
  rotationAngle.value = 0;
  if (originalImageBlob.value) {
    updateCropperImage(originalImageBlob.value);
  }
}

const processFinalCanvas = async (croppedBlob: Blob, bakeFilter = true, quality = 0.95): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const rad = rotationAngle.value * Math.PI / 180;
      const absCos = Math.abs(Math.cos(rad));
      const absSin = Math.abs(Math.sin(rad));
      const baseWidth = img.width * absCos + img.height * absSin;
      const baseHeight = img.width * absSin + img.height * absCos;

      const baseCanvas = document.createElement('canvas'); baseCanvas.width = baseWidth; baseCanvas.height = baseHeight;
      const baseCtx = baseCanvas.getContext('2d'); if (!baseCtx) return reject();

      baseCtx.translate(baseWidth / 2, baseHeight / 2);
      baseCtx.rotate(rad);
      baseCtx.translate(-img.width / 2, -img.height / 2);
      if (bakeFilter) {
        baseCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px)`;
      }
      baseCtx.drawImage(img, 0, 0);

      if (selectedFrame.value === 'none') {
        baseCanvas.toBlob((b) => b ? resolve(b) : reject(), 'image/jpeg', quality);
        return;
      }

      const finalCanvas = document.createElement('canvas');
      const fCtx = finalCanvas.getContext('2d'); if (!fCtx) return reject();

      let fW = baseWidth, fH = baseHeight;

      if (selectedFrame.value === 'polaroid') {
        const padding = Math.max(baseWidth, baseHeight) * 0.05;
        const bottomPadding = padding * 3;
        fW = baseWidth + padding * 2; fH = baseHeight + padding + bottomPadding;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#FFFFFF'; fCtx.fillRect(0, 0, fW, fH);
        fCtx.drawImage(baseCanvas, padding, padding);

        fCtx.fillStyle = '#111'; fCtx.font = `bold ${bottomPadding * 0.25}px sans-serif`;
        fCtx.textAlign = 'left'; fCtx.textBaseline = 'middle';
        fCtx.fillText(customFrameText.value, padding, fH - padding - (bottomPadding * 0.4) / 2);

      } else if (selectedFrame.value === 'letterbox') {
        const barHeight = baseHeight * 0.15;
        fW = baseWidth; fH = baseHeight + barHeight * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#FFFFFF'; fCtx.fillRect(0, 0, fW, fH);
        fCtx.drawImage(baseCanvas, 0, barHeight);

      } else if (selectedFrame.value === 'gallery') {
        const padding = Math.max(baseWidth, baseHeight) * 0.08;
        fW = baseWidth + padding * 2; fH = baseHeight + padding * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#FFFFFF'; fCtx.fillRect(0, 0, fW, fH);
        fCtx.lineWidth = Math.max(2, padding * 0.02); fCtx.strokeStyle = 'rgba(0,0,0,0.8)';
        fCtx.strokeRect(padding * 0.8, padding * 0.8, baseWidth + padding * 0.4, baseHeight + padding * 0.4);

        fCtx.drawImage(baseCanvas, padding, padding);

      } else if (selectedFrame.value === 'stamp') {
        const padding = Math.max(baseWidth, baseHeight) * 0.1;
        fW = baseWidth + padding * 2; fH = baseHeight + padding * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#FFFFFF'; fCtx.fillRect(0, 0, fW, fH);

        fCtx.lineWidth = Math.max(2, padding * 0.03);
        fCtx.strokeStyle = 'rgba(0,0,0,0.3)';
        fCtx.setLineDash([padding * 0.1, padding * 0.1]);
        fCtx.strokeRect(padding * 0.5, padding * 0.5, fW - padding, fH - padding);
        fCtx.setLineDash([]);

        fCtx.drawImage(baseCanvas, padding, padding);

      } else if (selectedFrame.value === 'minimalist') {
        const padding = Math.max(baseWidth, baseHeight) * 0.05;
        fW = baseWidth + padding * 2; fH = baseHeight + padding * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#FFFFFF'; fCtx.fillRect(0, 0, fW, fH);
        fCtx.drawImage(baseCanvas, padding, padding);

      } else if (selectedFrame.value === 'card') {
        const paddingX = Math.max(baseWidth, baseHeight) * 0.06;
        const paddingTop = paddingX;
        const paddingBottom = paddingX * 2.5;
        fW = baseWidth + paddingX * 2; fH = baseHeight + paddingTop + paddingBottom;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#FFFFFF'; fCtx.fillRect(0, 0, fW, fH);
        fCtx.drawImage(baseCanvas, paddingX, paddingTop);

        fCtx.fillStyle = '#111'; fCtx.font = `bold ${paddingBottom * 0.25}px sans-serif`;
        fCtx.textAlign = 'left'; fCtx.textBaseline = 'middle';
        fCtx.fillText(customFrameText.value, paddingX, fH - paddingBottom / 2);

        fCtx.fillStyle = '#666'; fCtx.font = `${paddingBottom * 0.15}px sans-serif`;
        fCtx.textAlign = 'right';
        fCtx.fillText(customFrameDate.value, fW - paddingX, fH - paddingBottom * 0.25);

      } else if (selectedFrame.value === 'blur-bg') {
        const paddingX = Math.max(baseWidth, baseHeight) * 0.08;
        const paddingY = paddingX;
        fW = baseWidth + paddingX * 2; fH = baseHeight + paddingY * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        // Draw blurred background
        fCtx.filter = `blur(${Math.max(fW, fH) * 0.04}px) brightness(80%)`;
        const scale = Math.max(fW / baseWidth, fH / baseHeight);
        const scaledW = baseWidth * scale;
        const scaledH = baseHeight * scale;
        fCtx.drawImage(baseCanvas, (fW - scaledW)/2, (fH - scaledH)/2, scaledW, scaledH);

        // Reset filter for foreground
        fCtx.filter = 'none';

        // Add shadow to foreground image
        fCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        fCtx.shadowBlur = Math.max(fW, fH) * 0.02;
        fCtx.shadowOffsetX = 0;
        fCtx.shadowOffsetY = fCtx.shadowBlur * 0.4;

        // Draw foreground image
        fCtx.drawImage(baseCanvas, paddingX, paddingY);

        // Reset shadow
        fCtx.shadowColor = 'transparent';
        fCtx.shadowBlur = 0;
        fCtx.shadowOffsetX = 0;
        fCtx.shadowOffsetY = 0;

      } else if (selectedFrame.value === 'blur-aura') {
        const paddingX = Math.max(baseWidth, baseHeight) * 0.15;
        const paddingY = paddingX;
        fW = baseWidth + paddingX * 2; fH = baseHeight + paddingY * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#000000'; fCtx.fillRect(0, 0, fW, fH);

        fCtx.filter = `blur(${Math.max(fW, fH) * 0.08}px) saturate(200%) brightness(120%)`;
        fCtx.globalAlpha = 0.8;
        const scale = Math.max(fW / baseWidth, fH / baseHeight) * 1.5;
        const scaledW = baseWidth * scale;
        const scaledH = baseHeight * scale;
        fCtx.drawImage(baseCanvas, (fW - scaledW)/2, (fH - scaledH)/2, scaledW, scaledH);

        fCtx.filter = 'none';
        fCtx.globalAlpha = 1.0;

        fCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        fCtx.shadowBlur = Math.max(fW, fH) * 0.05;
        fCtx.shadowOffsetY = fCtx.shadowBlur * 0.2;
        fCtx.drawImage(baseCanvas, paddingX, paddingY);
        fCtx.shadowColor = 'transparent';

        fCtx.lineWidth = Math.max(1, paddingX * 0.02);
        fCtx.strokeStyle = 'rgba(255,255,255,0.2)';
        fCtx.strokeRect(paddingX, paddingY, baseWidth, baseHeight);

      } else if (selectedFrame.value === 'blur-glass') {
        const paddingX = Math.max(baseWidth, baseHeight) * 0.1;
        const paddingY = paddingX;
        fW = baseWidth + paddingX * 2; fH = baseHeight + paddingY * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        const scale = Math.max(fW / baseWidth, fH / baseHeight);
        const scaledW = baseWidth * scale;
        const scaledH = baseHeight * scale;
        fCtx.drawImage(baseCanvas, (fW - scaledW)/2, (fH - scaledH)/2, scaledW, scaledH);

        const glassW = fW - paddingX;
        const glassH = fH - paddingY;
        const glassX = paddingX / 2;
        const glassY = paddingY / 2;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = glassW; tempCanvas.height = glassH;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
          tCtx.filter = `blur(${Math.max(fW, fH) * 0.03}px)`;
          tCtx.drawImage(baseCanvas, (fW - scaledW)/2 - glassX, (fH - scaledH)/2 - glassY, scaledW, scaledH);
          tCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          tCtx.fillRect(0, 0, glassW, glassH);
        }

        fCtx.shadowColor = 'rgba(0,0,0,0.3)';
        fCtx.shadowBlur = paddingX * 0.4;
        fCtx.drawImage(tempCanvas, glassX, glassY);
        fCtx.shadowColor = 'transparent';

        fCtx.lineWidth = Math.max(1, paddingX * 0.02);
        fCtx.strokeStyle = 'rgba(255,255,255,0.6)';
        fCtx.strokeRect(glassX, glassY, glassW, glassH);

        const fgScale = Math.min(glassW * 0.8 / baseWidth, glassH * 0.8 / baseHeight);
        const fgW = baseWidth * fgScale;
        const fgH = baseHeight * fgScale;
        fCtx.shadowColor = 'rgba(0,0,0,0.4)';
        fCtx.shadowBlur = paddingX * 0.2;
        fCtx.drawImage(baseCanvas, (fW - fgW)/2, (fH - fgH)/2, fgW, fgH);
        fCtx.shadowColor = 'transparent';
      } else if (selectedFrame.value === 'vintage') {
        const padding = Math.max(baseWidth, baseHeight) * 0.06;
        fW = baseWidth + padding * 2; fH = baseHeight + padding * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#f4ecd8'; // vintage paper
        fCtx.fillRect(0, 0, fW, fH);

        fCtx.lineWidth = Math.max(1, padding * 0.05); fCtx.strokeStyle = 'rgba(0,0,0,0.3)';
        fCtx.strokeRect(padding * 0.5, padding * 0.5, fW - padding, fH - padding);

        // Add shadow to image
        fCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        fCtx.shadowBlur = padding * 0.5;
        fCtx.shadowOffsetX = 0;
        fCtx.shadowOffsetY = padding * 0.2;
        fCtx.drawImage(baseCanvas, padding, padding);

        fCtx.shadowColor = 'transparent';

      } else if (selectedFrame.value === 'film') {
        const paddingY = Math.max(baseWidth, baseHeight) * 0.08;
        const paddingX = Math.max(baseWidth, baseHeight) * 0.15;
        fW = baseWidth + paddingX * 2; fH = baseHeight + paddingY * 2;
        finalCanvas.width = fW; finalCanvas.height = fH;

        fCtx.fillStyle = '#111'; fCtx.fillRect(0, 0, fW, fH);

        // Draw sprockets (holes)
        fCtx.fillStyle = '#ddd';
        const holeW = paddingX * 0.4;
        const holeH = holeW * 0.7;
        const gap = holeH * 1.6;
        for (let y = paddingY; y < fH - paddingY; y += gap) {
          fCtx.fillRect(paddingX * 0.3, y, holeW, holeH);
          fCtx.fillRect(fW - paddingX * 0.3 - holeW, y, holeW, holeH);
        }

        fCtx.drawImage(baseCanvas, paddingX, paddingY);
      }

      finalCanvas.toBlob((b) => b ? resolve(b) : reject(), 'image/jpeg', quality);
    };
    img.onerror = reject; img.src = URL.createObjectURL(croppedBlob);
  });
}

const previewModalVisible = ref(false)
const previewModalImages = ref<string[]>([])
const previewLoading = ref(false)

const handlePreview = async () => {
  if (!cropperRef.value) return;
  previewLoading.value = true;
  try {
    const cropBlob = await new Promise<Blob>((resolve, reject) => cropperRef.value?.getCropBlob((b: Blob) => b ? resolve(b) : reject(), 'image/jpeg', 0.9));
    const finalBlob = await processFinalCanvas(cropBlob, true, 0.9);

    if (previewModalImages.value[0]) {
      URL.revokeObjectURL(previewModalImages.value[0]);
    }
    const url = URL.createObjectURL(finalBlob);
    previewModalImages.value = [url];
    previewModalVisible.value = true;
  } catch (error: any) {
    message.error(t('components.imageCropper.generatePreviewFailed') + '：' + error.message);
  } finally {
    previewLoading.value = false;
  }
}

const handleConfirm = async () => {
  if (!cropperRef.value) return;
  loading.value = true;
  try {
    const cropBlob = await new Promise<Blob>((resolve, reject) => cropperRef.value?.getCropBlob((b: Blob) => b ? resolve(b) : reject(), 'image/jpeg', 0.95));
    const finalBlob = await processFinalCanvas(cropBlob, true, 0.95);

    const file = new File([finalBlob], `${props.picture?.name || 'edited_resource'}.jpg`, { type: 'image/jpeg' });
    const params: API.PictureUploadRequest = props.picture ? { id: props.picture.id } : {}; params.spaceId = props.spaceId;

    const res = await uploadPictureUsingPost(params, {}, file);
    if (res.data?.data) {
      props.onSuccess?.(res.data.data);
      message.success(t('components.imageCropper.processSuccess')); closeModal();
    } else throw new Error(res.data?.message || t('components.imageCropper.unknownError'));
  } catch (error: any) {
    message.error(t('components.imageCropper.exportFailed') + '：' + error.message); loading.value = false;
  }
}

const resolveApiBlob = async (res: any): Promise<Blob> => {
  if (res instanceof Blob) {
    if (res.type === 'application/json') {
      const text = await res.text();
      const json = JSON.parse(text);
      throw new Error(json.message || json.msg || t('components.imageCropper.serviceError'));
    }
    return res;
  }
  if ((res as any).data) {
    const data = (res as any).data;
    if (data instanceof Blob) {
      if (data.type === 'application/json') {
        const text = await data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || json.msg || t('components.imageCropper.serviceError'));
      }
      return data;
    }
  }
  return new Blob([res as any], { type: 'image/png' });
};

const handleRemoveBg = async () => {
  if (aiLoading.value) return;
  aiLoading.value = true;
  try {
    const blob = await new Promise<Blob>((resolve, reject) =>
      cropperRef.value?.getCropBlob((b: Blob) => b ? resolve(b) : reject(), 'image/jpeg', 0.95)
    );
    const res = await removeBackgroundUsingPost({}, new File([blob], 't.jpg'), { responseType: 'blob' });
    aiResultBlob.value = await resolveApiBlob(res);
    aiResultUrl.value = URL.createObjectURL(aiResultBlob.value);
    aiResultVisible.value = true;
  } catch (e: any) {
    message.error(e.message || t('components.imageCropper.smartCropFailed'));
  } finally {
    aiLoading.value = false;
  }
}

const confirmAiResult = () => {
  if (aiResultBlob.value) {
    isImgLoading.value = true;
    aiResultVisible.value = false;
    updateCropperImage(aiResultBlob.value);
  }
}

const closeAiResult = () => {
  aiResultVisible.value = false;
  if (aiResultUrl.value) URL.revokeObjectURL(aiResultUrl.value);
}

const handleFaceBlur = async () => {
  if (blurLoading.value) return;
  blurLoading.value = true;
  try {
    const blob = await new Promise<Blob>((resolve, reject) =>
      cropperRef.value?.getCropBlob((b: Blob) => b ? resolve(b) : reject(), 'image/jpeg', 0.95)
    );
    const res = await faceBlurUsingPost({}, new File([blob], 't.jpg'), { responseType: 'blob' });
    aiResultBlob.value = await resolveApiBlob(res);
    aiResultUrl.value = URL.createObjectURL(aiResultBlob.value);
    aiResultVisible.value = true;
  } catch (e: any) {
    message.error(e.message || t('components.imageCropper.faceBlurFailed'));
  } finally {
    blurLoading.value = false;
  }
}

const handleEnhanceImage = async () => {
  if (enhanceLoading.value) return;
  enhanceLoading.value = true;
  try {
    const blob = await new Promise<Blob>((resolve, reject) =>
      cropperRef.value?.getCropBlob((b: Blob) => b ? resolve(b) : reject(), 'image/jpeg', 0.95)
    );
    const res = await enhanceImageUsingPost({}, new File([blob], 't.jpg'), { responseType: 'blob' });
    aiResultBlob.value = await resolveApiBlob(res);
    aiResultUrl.value = URL.createObjectURL(aiResultBlob.value);
    aiResultVisible.value = true;
  } catch (e: any) {
    message.error(e.message || t('components.imageCropper.enhanceFailed'));
  } finally {
    enhanceLoading.value = false;
  }
}

const previewImageUrl = ref('');
const croppedImageUrl = ref('');
let previewTimer: any = null;
const isPreviewGenerating = ref(false);
// 方案B：并发锁，防止多次 generatePreview 调用叠加执行
let isPreviewRunning = false;

const generatePreview = async () => {
  if (!cropperRef.value || isPreviewRunning) return;
  isPreviewRunning = true;
  isPreviewGenerating.value = true;
  try {
    const cropBlob = await new Promise<Blob>((resolve, reject) => cropperRef.value?.getCropBlob((b: Blob) => b ? resolve(b) : reject(), 'image/jpeg', 0.7));

    if (croppedImageUrl.value) URL.revokeObjectURL(croppedImageUrl.value);
    croppedImageUrl.value = URL.createObjectURL(cropBlob);

    const finalBlob = await processFinalCanvas(cropBlob, false, 0.6);
    if (previewImageUrl.value) URL.revokeObjectURL(previewImageUrl.value);
    previewImageUrl.value = URL.createObjectURL(finalBlob);
  } catch(e) {
    console.error('Preview generation failed:', e);
  } finally {
    isPreviewGenerating.value = false;
    isPreviewRunning = false;
  }
};

let initialCropDone = false;

const onImgLoad = () => {
  isImgLoading.value = false;
  if (!initialCropDone) {
    initialCropDone = true;
    setTimeout(() => {
      if (cropperRef.value && !cropperOption.fixed) {
        cropperRef.value.goAutoCrop();
      }
      if (activeTab.value !== 'crop') generatePreview();
    }, 350);
  } else {
    if (activeTab.value !== 'crop') setTimeout(generatePreview, 100);
  }
}

const loginUserStore = useLoginUserStore(); const loginUser = loginUserStore.loginUser;
const editingUser = ref<API.UserVO>(); const isTeamSpace = computed(() => props.space?.spaceType === SPACE_TYPE_ENUM.TEAM);
const canEdit = computed(() => !isTeamSpace.value || !editingUser.value || editingUser.value.id === loginUser.id);

let websocket: PictureEditWebSocket | null = null;
watchEffect(() => {
  if (isTeamSpace.value && visible.value && props.picture?.id) {
    websocket = new PictureEditWebSocket(props.picture.id); websocket.connect();
    websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.ENTER_EDIT, (msg) => { editingUser.value = msg.user });
    websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.EXIT_EDIT, () => { editingUser.value = undefined });
  }
})

onMounted(() => {
  if (wrapperRef.value) {
    wrapperWidth.value = wrapperRef.value.clientWidth;
    wrapperHeight.value = wrapperRef.value.clientHeight;
    resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        wrapperWidth.value = entry.contentRect.width;
        wrapperHeight.value = entry.contentRect.height;
      }
    });
    resizeObserver.observe(wrapperRef.value);
  }
});

onUnmounted(() => {
  if (websocket) websocket.disconnect(); closeAiResult();
  if (cropperOption.img?.startsWith('blob:')) URL.revokeObjectURL(cropperOption.img);
  if (resizeObserver) resizeObserver.disconnect();
  if (previewModalImages.value[0]) URL.revokeObjectURL(previewModalImages.value[0]);
})

// 方案B：debounce 从 150ms 提升到 300ms，过滤快速切换产生的无效触发
watch([activeTab, selectedFrame, customFrameText, customFrameDate], () => {
  if (activeTab.value !== 'crop') {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(generatePreview, 300);
  }
});

const history = ref<any[]>([]);
const historyIndex = ref(-1);
const isRestoring = ref(false);
let historyTimer: any = null;

const saveHistory = () => {
  const state = {
    imgUrl: cropperOption.img,
    rotationAngle: rotationAngle.value,
    filters: { ...filters },
    selectedFrame: selectedFrame.value,
    customFrameText: customFrameText.value,
    customFrameDate: customFrameDate.value,
    ratioStr: currentRatioStr.value,
    fixed: cropperOption.fixed,
    fixedNumber: cropperOption.fixedNumber ? [...cropperOption.fixedNumber] : [1, 1],
  };
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  history.value.push(state);
  historyIndex.value++;
}

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    restoreState(history.value[historyIndex.value]);
  }
}

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    restoreState(history.value[historyIndex.value]);
  }
}

const restoreState = async (state: any) => {
  isRestoring.value = true;
  if (cropperOption.img !== state.imgUrl) {
    cropperOption.img = state.imgUrl;
    cropperKey.value++;
  }
  rotationAngle.value = state.rotationAngle;
  Object.assign(filters, state.filters);
  selectedFrame.value = state.selectedFrame;
  customFrameText.value = state.customFrameText;
  customFrameDate.value = state.customFrameDate;
  currentRatioStr.value = state.ratioStr;
  cropperOption.fixed = state.fixed;
  cropperOption.fixedNumber = state.fixedNumber;

  await nextTick();
  if (cropperRef.value) cropperRef.value.goAutoCrop();
  if (activeTab.value !== 'crop') generatePreview();

  setTimeout(() => {
    isRestoring.value = false;
  }, 100);
}

watch([
  () => filters,
  () => rotationAngle.value,
  () => selectedFrame.value,
  () => customFrameText.value,
  () => customFrameDate.value,
  () => cropperOption.img,
  () => currentRatioStr.value,
], () => {
  if (isRestoring.value || !visible.value) return;
  clearTimeout(historyTimer);
  historyTimer = setTimeout(() => {
    saveHistory();
  }, 500);
}, { deep: true });

defineExpose({ openModal })
</script>

<style lang="scss" scoped>
/* 定义原生系统级别的变量 */
.yuemu-modern-editor {
  position: fixed; inset: 0; z-index: 9999;
  background-color: #000; /* 沉浸式纯黑背景 */
  color: #fff;
  display: flex; flex-direction: column;
  height: 100vh; height: 100dvh; overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;

  --yuemu-blur-bg: rgba(30, 30, 30, 0.75);
  --yuemu-blur-border: rgba(255, 255, 255, 0.1);
  --yuemu-theme-color: #0A84FF; /* iOS Blue for dark mode */
  --yuemu-surface: rgba(255, 255, 255, 0.08);

  /* 将棋盘格放到最底层全局背景中 */
  background-image:
    linear-gradient(45deg, #111 25%, transparent 25%),
    linear-gradient(-45deg, #111 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #111 75%),
    linear-gradient(-45deg, transparent 75%, #111 75%);
  background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

/* 布局骨架：让侧边和底部真实占用空间 */
.yuemu-editor-wrapper {
  display: flex; flex: 1; flex-direction: column; min-height: 0;
  @media (min-width: 768px) { flex-direction: row; }
}

.yuemu-canvas-container {
  flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; position: relative;
}

/* ========== 画板区域 (弹性填充剩余空间) ========== */
.yuemu-immersive-canvas {
  flex: 1; position: relative; min-height: 0;
  display: flex; flex-direction: column;
  --yuemu-active-filter: none;
}
.yuemu-watermark-preview {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 20px; min-height: 0;
}
.yuemu-watermark-preview img {
  max-width: 100%; max-height: 100%; object-fit: contain;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
.yuemu-cropper-wrapper {
  flex: 1; margin: 15px; position: relative; min-height: 0;
  @media (min-width: 768px) { margin: 30px 40px; }
}
.yuemu-hidden-cropper {
  position: absolute !important;
  inset: 0;
  opacity: 0 !important;
  pointer-events: none !important;
  z-index: -1 !important;
}
.yuemu-cropper-instance { position: absolute; inset: 0; width: 100%; height: 100%; }

:deep(.vue-cropper) {
  background: transparent;
  overflow: visible !important;
  .cropper-box { overflow: hidden !important; }
  .cropper-view-box { outline: 1.5px solid var(--yuemu-theme-color); }
  .cropper-face { background-color: transparent; }
  .cropper-line { background-color: var(--yuemu-theme-color); opacity: 0.6; }
  .cropper-point { background-color: #fff; border: 2px solid var(--yuemu-theme-color); width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
}

/* ========== 悬浮顶部导航 ========== */
.yuemu-glass-header {
  height: 60px; padding: 0 16px 0;
  display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
  z-index: 20; border-bottom: 1px solid var(--yuemu-blur-border);
}

.yuemu-icon-btn { background: rgba(0,0,0,0.4); border: none; color: #fff; width: 36px; height: 36px; border-radius: 18px; font-size: 16px; cursor: pointer; backdrop-filter: blur(10px); transition: 0.2s; }
.yuemu-icon-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }

.yuemu-header-title { text-align: center; font-size: 15px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.yuemu-collab-status { font-size: 11px; color: #FF9F0A; display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: normal; }
.yuemu-dot { width: 5px; height: 5px; border-radius: 50%; background: #FF9F0A; animation: yuemu-blink 1.5s infinite; }

.yuemu-action-pill { background: var(--yuemu-theme-color); color: #fff; border: none; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4); }
.yuemu-action-pill:active:not(:disabled) { transform: scale(0.95); }
.yuemu-action-pill:disabled { opacity: 0.5; cursor: not-allowed; }

/* ========== 底部控制台 (真正占据空间) ========== */
.yuemu-glass-panel {
  height: 42vh; min-height: 320px; max-height: 420px; flex-shrink: 0;
  background: var(--yuemu-blur-bg); backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-top: 1px solid var(--yuemu-blur-border);
  border-radius: 24px 24px 0 0;
  display: flex; flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 20;

  @media (min-width: 768px) {
    width: 340px; height: 100%; min-height: auto; max-height: none;
    border-radius: 0; border-top: none; border-left: 1px solid var(--yuemu-blur-border);
  }
}

/* 分段控制器 (现代 Tab) */
.yuemu-segmented-control {
  display: flex; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 3px;
  margin: 16px 16px 8px; flex-shrink: 0;
}
.yuemu-segment {
  flex: 1; border: none; background: transparent; color: rgba(255,255,255,0.6);
  padding: 8px 0; font-size: 13px; font-weight: 500; border-radius: 10px; cursor: pointer; transition: 0.3s;
}
.yuemu-segment.yuemu_active { background: rgba(255,255,255,0.15); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-weight: 600; }

.yuemu-panel-scroll {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 12px 16px 24px; position: relative;
  scrollbar-width: none;
}
.yuemu-panel-scroll::-webkit-scrollbar { display: none; }

/* ========== 面板内的现代卡片与控件 ========== */
.yuemu-tool-card { width: 100%; display: flex; flex-direction: column; gap: 4px; }
.yuemu-card-header { display: flex; justify-content: space-between; align-items: center; }
.yuemu-filter-params { display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px; margin-top: -6px; min-height: 20px; }
.yuemu-param { background: rgba(255,255,255,0.1); color: var(--yuemu-theme-color); padding: 2px 8px; border-radius: 6px; font-weight: 600; font-variant-numeric: tabular-nums; }
.yuemu-label { font-size: 14px; font-weight: 600; color: #fff; }
.yuemu-text-btn { background: none; border: none; color: var(--yuemu-theme-color); font-size: 13px; cursor: pointer; padding: 0; }

/* 构图工具栏 */
.yuemu-action-row { display: flex; justify-content: center; gap: 24px; padding: 10px 0; }
.yuemu-icon-circle-btn { width: 48px; height: 48px; border-radius: 24px; background: var(--yuemu-surface); border: none; color: #fff; font-size: 18px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
.yuemu-icon-circle-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }
.yuemu-icon-circle-btn.yuemu-danger { color: #FF453A; background: rgba(255, 69, 58, 0.15); }

.yuemu-ratio-carousel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding-bottom: 8px; }
.yuemu-ratio-chip { background: var(--yuemu-surface); border: 1px solid transparent; border-radius: 16px; padding: 10px 0; font-size: 14px; text-align: center; color: #eee; cursor: pointer; transition: 0.2s; }
.yuemu-ratio-chip.yuemu_active { background: rgba(255,255,255,0.1); border-color: var(--yuemu-theme-color); color: var(--yuemu-theme-color); font-weight: 600; }

/* 胖滑块设计 (Fat Sliders) */
.yuemu-sliders-stack { display: flex; flex-direction: column; gap: 20px; }
.yuemu-slider-group { display: flex; flex-direction: column; gap: 10px; }
.yuemu-slider-header { display: flex; justify-content: space-between; font-size: 13px; color: rgba(255,255,255,0.8); .yuemu-val { font-variant-numeric: tabular-nums; font-weight: 600; color: #fff; } }

.yuemu-fat-slider {
  -webkit-appearance: none; width: 100%; height: 28px; border-radius: 14px;
  background: rgba(255,255,255,0.1); outline: none; transition: 0.2s;
}
.yuemu-fat-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 28px; height: 28px; border-radius: 14px;
  background: #fff; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.3); border: 4px solid #ececec; transition: transform 0.1s;
}
.yuemu-fat-slider:active::-webkit-slider-thumb { transform: scale(0.9); }

/* 水印面板 - 细胞化表单项 */
.yuemu-setting-cell {
  background: var(--yuemu-surface); border-radius: 16px; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between;
}
.yuemu-borderless-input { width: 100%; background: transparent; border: none; color: #fff; font-size: 15px; outline: none; }
.yuemu-borderless-input::placeholder { color: rgba(255,255,255,0.4); }
.yuemu-cell-label { font-size: 15px; color: #fff; }
.yuemu-color-picker-modern { position: relative; width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); overflow: hidden; }
.yuemu-color-preview { width: 100%; height: 100%; pointer-events: none; }
.yuemu-invisible-color { position: absolute; inset: -10px; width: 200%; height: 200%; opacity: 0; cursor: pointer; }

.yuemu-hint-bubble { text-align: center; background: rgba(10, 132, 255, 0.15); color: var(--yuemu-theme-color); padding: 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }

/* AI 面板卡片 */
.yuemu-ai-btn {
  display: flex; align-items: center; gap: 16px; background: var(--yuemu-surface);
  border: 1px solid var(--yuemu-blur-border); border-radius: 20px; padding: 16px;
  width: 100%; cursor: pointer; text-align: left; transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-ai-btn:active:not(:disabled) { transform: scale(0.97); background: rgba(255,255,255,0.12); }
.yuemu-ai-btn:disabled { opacity: 0.5; filter: grayscale(1); }
.yuemu-ai-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #FF2D55, #5856D6); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; box-shadow: 0 4px 12px rgba(88, 86, 214, 0.4); }
.yuemu-ai-icon.yuemu-safe { background: linear-gradient(135deg, #34C759, #00C7BE); box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4); }
.yuemu-ai-info { display: flex; flex-direction: column; gap: 4px; }
.yuemu-ai-title { font-size: 15px; font-weight: 600; color: #fff; }
.yuemu-ai-desc { font-size: 12px; color: rgba(255,255,255,0.6); }

/* 蓝图调色盘 */
.yuemu-color-pad-wrap { border-radius: 20px; overflow: hidden; border: 1px solid var(--yuemu-blur-border); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.yuemu-color-pad { position: relative; width: 100%; height: 120px; cursor: crosshair; touch-action: none; }
.yuemu-pad-grid { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px); background-size: 12px 12px; background-position: center center; }
.yuemu-pad-center-x { position: absolute; top: 50%; left: 0; right: 0; height: 12px; transform: translateY(-50%); background-image: radial-gradient(circle, rgba(255,255,255,0.9) 1.5px, transparent 1.5px); background-size: 12px 12px; background-position: center center; pointer-events: none; }
.yuemu-pad-center-y { position: absolute; left: 50%; top: 0; bottom: 0; width: 12px; transform: translateX(-50%); background-image: radial-gradient(circle, rgba(255,255,255,0.9) 1.5px, transparent 1.5px); background-size: 12px 12px; background-position: center center; pointer-events: none; }
.yuemu-pad-thumb { position: absolute; width: 26px; height: 26px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 2px 8px rgba(0,0,0,0.4); pointer-events: none; transition: transform 0.1s; z-index: 2; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.yuemu-pad-thumb::after { content: ''; width: 8px; height: 8px; background: #fff; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
.yuemu-color-pad:active .yuemu-pad-thumb { transform: translate(-50%, -50%) scale(1.15); }

/* ========== 加载与弹窗 ========== */
.yuemu-loading-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; justify-content: center; align-items: center; z-index: 10;
  overflow: hidden;
}
/* VueCropper 初始化期间的背景预览图：模糊+低透明，消除纯黑屏的割裂感 */
.yuemu-loading-bg-preview {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: contain;
  opacity: 0.25;
  filter: blur(8px);
  transform: scale(1.05); /* 防止模糊边缘漏白 */
  pointer-events: none;
}
.yuemu-spinner-modern { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: yuemu-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

.yuemu-watermark-draggable {
  position: fixed; z-index: 100; cursor: move; user-select: none; transform: translate(-50%, -50%);
  font-family: -apple-system, sans-serif; font-weight: 800; font-size: clamp(24px, 6vw, 48px);
  text-shadow: 0 4px 12px rgba(0,0,0,0.8); white-space: nowrap; padding: 10px; border-radius: 12px; transition: 0.2s;
}
.yuemu-watermark-draggable.yuemu-is-dragging { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(4px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }

.yuemu-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 10000; display: flex; justify-content: center; align-items: center; }
.yuemu-modern-dialog { width: 90%; max-width: 340px; background: rgba(40,40,40,0.85); backdrop-filter: blur(25px); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.yuemu-dialog-img { height: 260px; display: flex; align-items: center; justify-content: center; padding: 20px; }
.yuemu-dialog-img img { max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.yuemu-dialog-actions { display: flex; border-top: 1px solid rgba(255,255,255,0.1); }
.yuemu-dialog-actions button { flex: 1; padding: 16px; border: none; background: transparent; font-size: 16px; font-weight: 500; cursor: pointer; }
.yuemu-btn-ghost { color: rgba(255,255,255,0.6); border-right: 1px solid rgba(255,255,255,0.1) !important; }
.yuemu-btn-primary { color: var(--yuemu-theme-color); font-weight: 600 !important; }

.yuemu-mt-2 { margin-top: 8px; } .yuemu-mt-3 { margin-top: 12px; }

@keyframes yuemu-spin { 100% { transform: rotate(360deg); } }
@keyframes yuemu-blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

/* 页面入场动画 */
.yuemu-slide-up-enter-active, .yuemu-slide-up-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s; }
.yuemu-slide-up-enter-from, .yuemu-slide-up-leave-to { transform: translateY(100%); opacity: 0; }
.yuemu-fade-enter-active, .yuemu-fade-leave-active { transition: opacity 0.3s; }
.yuemu-fade-enter-from, .yuemu-fade-leave-to { opacity: 0; }

/* 解决跳跃：Tab 平滑切换动画 */
.yuemu-tab-fade-enter-active, .yuemu-tab-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.yuemu-tab-fade-enter-from { opacity: 0; transform: translateX(10px); }
/* 预设风格宫格布局 */
.yuemu-preset-section { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px; }
.yuemu-presets-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding-bottom: 8px;
}
.yuemu-preset-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.yuemu-preset-thumbnail {
  width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; position: relative;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: transform 0.2s, box-shadow 0.2s;
  background: #2c2c2e;

  /* 修复移动端点击被内部图片或层吞噬导致的需要双击问题 */
  * { pointer-events: none; }
}
.yuemu-preset-thumbnail:active { transform: scale(0.95); }
.yuemu-active-thumb { box-shadow: 0 0 0 2px var(--yuemu-theme-color); }
.yuemu-preset-thumbnail img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }

.yuemu-preset-overlay {
  position: absolute; inset: 0; background: rgba(10, 132, 255, 0.4);
  display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s;
}
.yuemu-preset-overlay.yuemu-active-overlay { opacity: 1; }
.yuemu-preset-overlay i { color: #fff; font-size: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

.yuemu-preset-name { font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 500; transition: color 0.2s; }
.yuemu-preset-name.yuemu-active-text { color: var(--yuemu-theme-color); font-weight: 600; }

/* 旋转控件 */
.yuemu-rotation-section { display: flex; flex-direction: column; gap: 12px; margin-bottom: 8px; }
.yuemu-rotation-header { display: flex; justify-content: space-between; align-items: center; }
.yuemu-rotation-center { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.yuemu-reset-btn { background: rgba(255,255,255,0.1); padding: 4px 16px; border-radius: 12px; font-size: 12px; color: #fff; }
.yuemu-degree { font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--yuemu-theme-color); }
.yuemu-ruler-slider input { margin-top: 4px; }

/* 比例宫格 */
.yuemu-ratio-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
}
.yuemu-ratio-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 12px 0; gap: 8px;
  cursor: pointer; border: 2px solid transparent; transition: 0.2s; color: rgba(255, 255, 255, 0.5);
}
.yuemu-ratio-card.yuemu-active {
  background: rgba(255, 255, 255, 0.1); border-color: var(--yuemu-theme-color); color: var(--yuemu-theme-color);
}
.yuemu-ratio-icon { border: 2px solid currentColor; border-radius: 2px; }
.ratio-icon-free { width: 22px; height: 18px; border-style: dashed; }
.ratio-icon-original { width: 22px; height: 16px; border-radius: 4px; }
.ratio-icon-1-1 { width: 20px; height: 20px; }
.ratio-icon-3-4 { width: 16px; height: 22px; }
.ratio-icon-4-3 { width: 22px; height: 16px; }
.ratio-icon-9-16 { width: 12px; height: 22px; }
.ratio-icon-16-9 { width: 22px; height: 12px; }
.yuemu-ratio-text { font-size: 12px; font-weight: 500; }

/* ========== 紧凑化色彩调节优化 ========== */
.yuemu-compact-filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.yuemu-cf-left { display: flex; align-items: center; gap: 4px; flex: 1; overflow: hidden; }
.yuemu-cf-params { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
.yuemu-cf-params::-webkit-scrollbar { display: none; }
.yuemu-cf-params span { font-size: 10px; background: rgba(255,255,255,0.15); padding: 2px 4px; border-radius: 4px; color: var(--yuemu-theme-color); white-space: nowrap; font-weight: 600; }

.yuemu-compact-pad .yuemu-color-pad { height: 96px; }

.yuemu-vertical-blur-slider { width: 32px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid var(--yuemu-blur-border); display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 6px 0; z-index: 10; }
.yuemu-vertical-blur-slider i { color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 0; }

.yuemu-rotated-slider-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; width: 100%; min-height: 56px; }
.yuemu-rotated-slider { position: absolute; width: 64px; height: 4px; transform: rotate(-90deg); -webkit-appearance: none; background: rgba(255,255,255,0.2); border-radius: 2px; outline: none; }
.yuemu-rotated-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
</style>
