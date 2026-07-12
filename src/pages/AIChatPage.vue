<template>
  <div class="yuemu-ai-chat-page">
    <div class="drawer-mask" v-if="showSessionDrawer && isMobile" @click="toggleSessionDrawer"></div>

    <div class="session-sidebar" :class="{ 'drawer-open': showSessionDrawer && isMobile, 'collapsed': isSidebarCollapsed && !isMobile }">
      <div class="session-header">
        <button class="new-session-btn" @click="showCreateSessionModal" :disabled="creatingSession">
          <i class="fas fa-plus"></i><span>{{ creatingSession ? t('pages.aiChatPage.creating') : t('pages.aiChatPage.newChat') }}</span>
        </button>
        <button class="resource-btn" @click="$router.push('/ai_resource')" :title="$t('pages.aiChatPage.resourceLibrary')">
          <i class="fas fa-folder-open"></i>
        </button>
      </div>

      <div class="session-list" ref="sessionListRef" @scroll="handleSessionListScroll">
        <div class="loading" v-if="loadingSessions"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div class="session-item" v-for="item in sessions" :key="item.id" :class="{ active: currentSessionId === item.id }" @click="handleSessionClick(item.id)">
          <i class="far fa-comment-alt session-icon"></i>
          <div class="session-name">
            <template v-if="autoNamingSessionId === item.id">
              <i class="fas fa-magic fa-spin" style="margin-right: 4px; color: var(--link-color);"></i>生成中...
            </template>
            <template v-else>{{ item.sessionName || t('pages.aiChatPage.newSession') }}</template>
          </div>
          <div class="session-actions">
            <button class="action-btn" @click.stop="startEditingSession(item.id, item.sessionName)" title="编辑"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete" @click.stop="confirmDeleteSession(item.id)" title="删除"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
        <div class="load-more" v-if="sessionLoadingMore"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div class="empty-session" v-if="sessions.length === 0 && !loadingSessions">{{ $t('pages.aiChatPage.noHistory') }}</div>
      </div>

      <div class="sidebar-footer">
        <a-popover :placement="isMobile ? 'top' : 'rightBottom'" trigger="hover" overlayClassName="quota-popover" :arrow="isMobile">
          <template #content>
            <div class="quota-popover-content">
              <h4 class="popover-title">{{ $t('pages.aiChatPage.quotaDetails') }}</h4>

              <!-- 1. 周 Token -->
              <div class="popover-item">
                <div class="item-header">
                  <span class="item-label"><i class="fas fa-bolt"></i> {{ $t('pages.aiChatPage.tokenWeek') }}</span>
                  <span class="item-val">{{ formatTokenCount(aiTokenUsage.usedWeek) }} / {{ formatTokenCount(aiTokenUsage.limitWeek) }}</span>
                </div>
                <div class="item-bar">
                  <div class="item-bar-inner" :style="{ width: Math.min((aiTokenUsage.usedWeek / aiTokenUsage.limitWeek) * 100, 100) + '%' }" :class="{'is-warning': (aiTokenUsage.usedWeek / aiTokenUsage.limitWeek) > 0.8}"></div>
                </div>
              </div>

              <!-- 2. 5h Token -->
              <div class="popover-item">
                <div class="item-header">
                  <span class="item-label"><i class="fas fa-clock"></i> {{ $t('pages.aiChatPage.token5h') }}</span>
                  <span class="item-val">{{ formatTokenCount(aiTokenUsage.used5h) }} / {{ formatTokenCount(aiTokenUsage.limit5h) }}</span>
                </div>
                <div class="item-bar">
                  <div class="item-bar-inner" :style="{ width: Math.min(((aiTokenUsage.used5h || 0) / (aiTokenUsage.limit5h || 1)) * 100, 100) + '%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }" :class="{'is-warning': ((aiTokenUsage.used5h || 0) / (aiTokenUsage.limit5h || 1)) > 0.8}"></div>
                </div>
              </div>

              <!-- 3. 生图 -->
              <div class="popover-item">
                <div class="item-header">
                  <span class="item-label"><i class="fas fa-image"></i> {{ $t('pages.aiChatPage.imageGenWeek') }}</span>
                  <span class="item-val">{{ aiTokenUsage.usedImageGenWeek || 0 }} / {{ aiTokenUsage.limitImageGenWeek || 5 }}</span>
                </div>
                <div class="item-bar">
                  <div class="item-bar-inner" :style="{ width: Math.min(((aiTokenUsage.usedImageGenWeek || 0) / (aiTokenUsage.limitImageGenWeek || 5)) * 100, 100) + '%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }" :class="{'is-warning': ((aiTokenUsage.usedImageGenWeek || 0) / (aiTokenUsage.limitImageGenWeek || 5)) > 0.8}"></div>
                </div>
              </div>

              <!-- 4. 搜图 -->
              <div class="popover-item">
                <div class="item-header">
                  <span class="item-label"><i class="fas fa-search"></i> {{ $t('pages.aiChatPage.imageSearchWeek') }}</span>
                  <span class="item-val">{{ aiTokenUsage.usedImageSearchWeek || 0 }} / {{ aiTokenUsage.limitImageSearchWeek || 5 }}</span>
                </div>
                <div class="item-bar">
                  <div class="item-bar-inner" :style="{ width: Math.min(((aiTokenUsage.usedImageSearchWeek || 0) / (aiTokenUsage.limitImageSearchWeek || 5)) * 100, 100) + '%', background: 'linear-gradient(90deg, #2563eb, #10b981)' }" :class="{'is-warning': ((aiTokenUsage.usedImageSearchWeek || 0) / (aiTokenUsage.limitImageSearchWeek || 5)) > 0.8}"></div>
                </div>
              </div>
            </div>
          </template>

          <!-- 侧边栏常驻展示：极其简约的卡片 -->
          <div class="mini-quota-container" v-if="aiTokenUsage">
            <div class="mini-quota-summary">
              <div class="summary-left">
                <span class="summary-dot pulsing"></span>
                <span class="summary-text">{{ $t('pages.aiChatPage.quotaUsage', { usage: Math.round(Math.min((aiTokenUsage.usedWeek / aiTokenUsage.limitWeek) * 100, 100)) }) }}</span>
              </div>
              <div class="summary-right">
                <i class="fas fa-info-circle info-icon"></i>
              </div>
            </div>
            <div class="quota-progress-compact">
              <div class="quota-progress-inner" :style="{ width: Math.min((aiTokenUsage.usedWeek / aiTokenUsage.limitWeek) * 100, 100) + '%' }" :class="{'is-warning': (aiTokenUsage.usedWeek / aiTokenUsage.limitWeek) > 0.8}"></div>
            </div>

            <div class="quota-footer-compact">
              <span class="quota-tier" :class="'tier-' + aiTokenUsage.memberType">{{ getMemberTitle(aiTokenUsage.memberType) }}</span>
              <span class="quota-link" @click.stop="showCapabilities = true">{{ $t('pages.aiChatPage.modelCapabilities') }} <i class="fas fa-angle-right"></i></span>
            </div>
          </div>
        </a-popover>
      </div>
    </div>

    <div class="chat-container">

      <div class="mobile-header" v-if="isMobile">
        <button class="mobile-menu-btn" @click="toggleSessionDrawer"><i class="fas fa-bars"></i></button>
        <div class="model-selector-wrap mobile-model-selector" style="flex: 1; text-align: center;">
          <a-select v-model:value="selectedModel" :options="models" class="yuemu-ant-select" style="width: 220px; text-align: left;" :bordered="false" />
        </div>
        <button class="mobile-new-btn" @click="showCreateSessionModal"><i class="fas fa-edit"></i></button>
      </div>

      <div class="pc-header" v-if="!isMobile && currentSessionId">
        <button class="pc-sidebar-toggle" @click="toggleSidebar" title="隐藏/显示侧边栏"><i class="fas fa-bars"></i></button>
        <div class="pc-header-center" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 12px; overflow: hidden;">
          <h3 class="session-title-text" style="flex: 0 1 auto; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right;">
            <template v-if="autoNamingSessionId === currentSessionId">
              <i class="fas fa-magic fa-spin" style="margin-right: 4px; color: var(--link-color);"></i>智能命名中...
            </template>
            <template v-else>{{ getCurrentSessionName() }}</template>
          </h3>
          <div class="model-selector-wrap pc-model-selector" style="flex-shrink: 0;">
            <a-select v-model:value="selectedModel" :options="models" class="yuemu-ant-select" style="width: 230px; text-align: left;" />
          </div>
        </div>
        <button class="pc-back-btn" @click="goBack" title="返回"><i class="fas fa-arrow-left"></i></button>
      </div>

      <div class="chat-messages-wrapper" ref="messagesContainerRef" @scroll="handleMessagesScroll" @click="handleChatAreaClick">
        <div class="chat-messages-content">
          <div class="top-loading" v-if="messageLoadingMore && !loadingMessages">
            <i class="fas fa-circle-notch fa-spin"></i><span>{{ $t('pages.aiChatPage.loadHistory') }}</span>
          </div>

          <div class="yuemu-welcome-screen" v-if="currentMessages.length === 0 && !loadingMessages">
            <div class="welcome-sparkle"><i class="fas fa-sparkles"></i></div>
            <h2>{{ $t('pages.aiChatPage.hello', { name: loginUser?.userName || $t('pages.aiChatPage.friend') }) }}</h2>
            <p class="welcome-subtitle">{{ $t('pages.aiChatPage.welcomeSub') }}</p>

            <div class="yuemu-suggestion-grid">
              <div class="yuemu-suggestion-card" @click="sendQuickMessage('今天是几月几号？查询西安今天的天气情况，搜索站内有哪些西安的照片，再从Pexels找一些西安的高质量照片并将第一张保存到我的私有空间，网络搜索西安的热门景点和旅游攻略，最后用50字以内简短总结并用语音播报西安旅行建议')">
                <div class="sugg-icon cyan"><i class="fas fa-magic"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggTravel') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggTravelDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" @click="sendQuickMessageWithImage('帮我对这张图片先执行 YOLO 目标检测，看看画面里都有哪些物体，然后对其进行一键画质增强并智能裁剪为16:9宽屏比例，接着套用经典胶片复古滤镜并装裱上胡桃木艺术画框，最后打上内容为“智能分析”的下角明文水印，并将最终成品的质感大图拼接为莫兰迪色卡社交分享卡片！')">
                <div class="sugg-icon indigo"><i class="fas fa-wand-magic-sparkles"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggVisual') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggVisualDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" v-if="!isMobile" @click="sendQuickMessage('西安今天天气怎么样')">
                <div class="sugg-icon cyan"><i class="fas fa-cloud-sun"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggWeather') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggWeatherDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" v-if="!isMobile" @click="sendQuickMessage('我想听听你的声音')">
                <div class="sugg-icon light-blue"><i class="fas fa-microphone-alt"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggVoice') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggVoiceDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" v-if="!isMobile" @click="sendQuickMessageWithImage('帮我把这张图裁剪成适合小红书的3:4竖版比例')">
                <div class="sugg-icon purple"><i class="fas fa-crop-alt"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggCrop') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggCropDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" @click="sendQuickMessageWithImage('这张图片有点暗，帮我优化一下画质')">
                <div class="sugg-icon orange"><i class="fas fa-adjust"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggEnhance') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggEnhanceDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" v-if="!isMobile" @click="sendQuickMessageWithImage('帮我给这张图加个水印，内容是©悦木图库')">
                <div class="sugg-icon pink"><i class="fas fa-copyright"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggWatermark') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggWatermarkDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" v-if="!isMobile" @click="sendQuickMessageWithImage('分析一下这张图的配色方案')">
                <div class="sugg-icon teal"><i class="fas fa-palette"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggPalette') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggPaletteDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" v-if="!isMobile" @click="sendQuickMessageWithImage('查看这张照片的拍摄参数')">
                <div class="sugg-icon indigo"><i class="fas fa-camera"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggExif') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggExifDesc') }}</span>
                </div>
              </div>
              <div class="yuemu-suggestion-card" v-if="isMobile" @click="sendQuickMessage('帮我生成一张少女在草原漫步的场景，阳光明媚，水彩画风格')">
                <div class="sugg-icon blue"><i class="fas fa-image"></i></div>
                <div class="sugg-text">
                  <span class="sugg-title">{{ $t('pages.aiChatPage.suggDraw') }}</span>
                  <span class="sugg-desc">{{ $t('pages.aiChatPage.suggDrawDesc') }}</span>
                </div>
              </div>
            </div>
          </div>

          <template v-for="(item, index) in currentMessages" :key="item.localId || item.id">
            <div v-if="shouldShowTimestamp(item, currentMessages[index - 1])" class="timestamp-divider">
              <span>{{ formatMessageDivider(item.createTime) }}</span>
            </div>

            <div class="message-item" :class="getMessageItemClass(item)">

              <div class="yuemu-avatar" v-if="item.messageType === 2 && item.content !== '上下文已清理'">
                <div class="avatar-wrapper" :class="{'is-thinking': isThinkingMessage(item) || item.isStreaming}">
                  <div class="rotating-halo" v-if="isThinkingMessage(item) || item.isStreaming"></div>
                  <div class="sparkle-bg">
                    <img src="@/assets/customer_service.png" alt="AI助手" class="ai-avatar-img" />
                  </div>
                </div>
                <div class="yuemu-mobile-avatar-info" v-if="isMobile">
                  <span class="yuemu-ai-name">AI 助手</span>
                  <span class="yuemu-ai-time">{{ formatTime(item.createTime) }}</span>
                </div>
              </div>

              <div class="message-content-box">
                <div v-if="isThinkingMessage(item)" class="yuemu-tool-steps">
                  <div class="tool-steps-header">
                    <div class="pulse-ring"></div><span>{{ $t('pages.aiChatPage.thinking') }}</span>
                  </div>
                  <div class="tool-steps-list">
                    <div v-for="(step, idx) in (item.statusSteps?.length ? item.statusSteps : ['分析需求...'])" :key="idx" class="tool-step-item" :class="{ 'step-active': idx === (item.statusSteps?.length || 1) - 1 }">
                      <i v-if="idx < (item.statusSteps?.length || 1) - 1" class="fas fa-check-circle done-icon"></i>
                      <i v-else class="fas fa-circle-notch fa-spin active-icon"></i>
                      <span class="step-text">{{ step }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="!isThinkingMessage(item) && item.messageType === 2 && item.completedSteps?.length" class="yuemu-steps-summary">
                  <div class="steps-summary-header" @click="toggleStepsCollapse(item.id)">
                    <i class="fas fa-robot"></i><span>{{ $t('pages.aiChatPage.completedSteps', { count: item.completedSteps.length }) }}</span>
                    <i class="fas fa-chevron-down chevron" :class="{'is-open': !collapsedSteps[item.id]}"></i>
                  </div>
                  <div class="steps-summary-list" v-show="!collapsedSteps[item.id]">
                    <div v-for="(step, idx) in item.completedSteps" :key="idx" class="steps-summary-item"><i class="fas fa-check"></i><span>{{ step }}</span></div>
                  </div>
                </div>

                <!-- 消息气泡统一包裹内容，按原文顺序渲染，智能并排连续图片 -->
                <div class="yuemu-message-bubble" v-if="item.content && item.content !== '正在思考中'">

                  <template v-for="(seg, sIdx) in getMessageSegments(item.content)" :key="sIdx">

                    <!-- 普通文本段落 -->
                    <template v-if="seg.type === 'text' && seg.content.trim()">
                      <div v-if="item.isThinking && (seg.content === '...' || seg.content === '正在思考中')" class="yuemu-elegant-thinking">
                        <div class="thinking-glow-wave"><span></span><span></span><span></span></div>
                        <div class="thinking-text">{{ $t('pages.aiChatPage.deepThinking') }}</div>
                      </div>
                      <div v-else class="markdown-body yuemu-markdown" :class="{'ai-streaming': item.isStreaming}" v-html="parseMarkdown(seg.content)"></div>
                    </template>

                    <!-- 智能组合的图片图库 (支持一行多列) -->
                    <div v-else-if="seg.type === 'gallery'" class="yuemu-gallery-grid">
                      <div v-for="(gItem, gIdx) in seg.items" :key="gIdx" class="gallery-item">
                        <div class="attachment-img-wrap" @click="openImagePreview(seg.items.map(i => i.url), gIdx)">
                          <img :src="gItem.url" alt="附图" referrerpolicy="no-referrer-when-downgrade" @error="handleImgError($event, gItem.url, item)" @load="handleImgLoad(gItem.url)" />
                          <div class="img-error-mask" v-if="failedImageUrls.has(gItem.url) && !item.isStreaming"><i class="fas fa-image-slash"></i></div>
                        </div>
                        <div v-if="gItem.caption" class="gallery-caption markdown-body yuemu-markdown" v-html="parseMarkdown(gItem.caption)"></div>
                      </div>
                    </div>

                    <!-- 单独嵌入的语音文件 -->
                    <div v-else-if="seg.type === 'audio'" class="message-attachments audios">
                      <div class="audio-wrap">
                        <audio :src="seg.url" controls></audio>
                      </div>
                    </div>

                  </template>
                </div>

                <div class="message-actions" v-if="!isThinkingMessage(item)">
                  <span class="time">{{ formatTime(item.createTime) }}</span>
                  <template v-if="!item.isStreaming">
                    <button v-if="item.messageType === 2 && item.content !== '上下文已清理'" class="action-icon" @click="toggleTTS(item)" :title="playingMessageId === item.id ? '停止朗读' : '语音朗读'">
                      <i class="fas" :class="playingMessageId === item.id ? 'fa-stop-circle' : 'fa-volume-up'"></i>
                    </button>
                    <button v-if="item.content !== '上下文已清理'" class="action-icon" @click="copyMessage(item)" title="复制"><i class="far fa-copy"></i></button>
                  </template>
                </div>
              </div>
            </div>
          </template>

          <div class="loading-state" v-if="loadingMessages"><i class="fas fa-circle-notch fa-spin"></i></div>
          <!--          <div class="clear-context-btn-wrap" v-if="currentMessages.length > 0 && currentSessionId && !sendingMessage && !aiThinking && !isThinkingMessage(currentMessages[currentMessages.length - 1]) && currentMessages[currentMessages.length - 1].content !== '上下文已清理'">-->
          <!--            <button class="yuemu-chip-btn" @click="clearSessionContext"><i class="fas fa-broom"></i><span>开启新话题</span></button>-->
          <!--          </div>-->
        </div>
      </div>

      <button class="scroll-bottom-fab" :class="{ 'visible': showScrollToBottom }" @click="scrollToBottom(true)"><i class="fas fa-arrow-down"></i></button>

      <div class="yuemu-input-wrapper">
        <transition name="fade-slide-up">
          <div class="yuemu-quick-actions" v-if="isMobile && !inputMessage && !imagePreviewUrl && !sendingMessage">
            <button class="quick-action-chip featured" @click="sendQuickMessage('今天是几月几号？查询西安今天的天气情况，搜索站内有哪些西安的照片，再从Pexels找一些西安的高质量照片并将第一张保存到我的私有空间，网络搜索西安的热门景点和旅游攻略，最后用50字以内简短总结并用语音播报西安旅行建议')"><i class="fas fa-magic"></i> {{ $t('pages.aiChatPage.mobileActions.travel') }}</button>
            <button class="quick-action-chip featured" @click="sendQuickMessageWithImage('帮我对这张图片先执行 YOLO 目标检测，看看画面里都有哪些物体，然后对其进行一键画质增强并智能裁剪为16:9宽屏比例，接着套用经典胶片复古滤镜并装裱上胡桃木艺术画框，最后打上内容为“智能分析”的下角明文水印，并将最终成品的质感大图拼接为莫兰迪色卡社交分享卡片！')"><i class="fas fa-wand-magic-sparkles"></i> {{ $t('pages.aiChatPage.mobileActions.visual') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessage('搜索一下风景的壁纸')"><i class="fas fa-image"></i> {{ $t('pages.aiChatPage.mobileActions.searchBg') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessage('西安今天天气怎么样')"><i class="fas fa-cloud-sun"></i> {{ $t('pages.aiChatPage.mobileActions.weather') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessage('我想听听你的声音')"><i class="fas fa-headphones"></i> {{ $t('pages.aiChatPage.mobileActions.voice') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessage('我加入的那些空间')"><i class="fas fa-folder-open"></i> {{ $t('pages.aiChatPage.mobileActions.joinedSpace') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessage('帮我上传图片到公共空间，随便取个名字')"><i class="fas fa-cloud-upload-alt"></i> {{ $t('pages.aiChatPage.mobileActions.uploadPublic') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessageWithImage('帮我把这张图裁剪成适合小红书的3:4竖版比例')"><i class="fas fa-crop-alt"></i> {{ $t('pages.aiChatPage.actionCrop') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessageWithImage('这张图片有点暗，帮我优化一下画质')"><i class="fas fa-adjust"></i> {{ $t('pages.aiChatPage.mobileActions.enhance') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessageWithImage('帮我给这张图加个水印，内容是©悦木图库')"><i class="fas fa-copyright"></i> {{ $t('pages.aiChatPage.actionWatermark') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessageWithImage('分析一下这张图的配色方案')"><i class="fas fa-palette"></i> {{ $t('pages.aiChatPage.actionPalette') }}</button>
            <button class="quick-action-chip" @click="sendQuickMessageWithImage('查看这张照片的拍摄参数')"><i class="fas fa-camera"></i> {{ $t('pages.aiChatPage.actionExif') }}</button>
          </div>
        </transition>

        <div class="yuemu-input-container" :class="{'pc-style': !isMobile}">
          <div class="input-preview-bar" v-if="imagePreviewUrl">
            <div class="preview-card">
              <img :src="imagePreviewUrl" :alt="$t('pages.aiChatPage.mobileActions.toBeSent')" />
              <button class="remove-btn" @click="clearImage"><i class="fas fa-times"></i></button>
              <div class="upload-mask" v-if="uploadingImage"><i class="fas fa-spinner fa-spin"></i></div>
            </div>
          </div>

          <div class="input-main-row">
            <input type="file" ref="fileInputRef" style="display: none" accept="image/*" @change="handleImageSelect" />
            <input type="file" ref="cameraInputRef" style="display: none" accept="image/*" capture @change="handleImageSelect" />

            <div class="pc-input-top">
              <div class="upload-menu-wrapper" v-if="isMobile">
                <button class="circle-btn" @click.stop="toggleUploadMenu" :disabled="!!imagePreviewUrl"><i class="fas fa-plus"></i></button>
                <transition name="fade-scale">
                  <div class="upload-menu" v-if="showImageUploadMenu" @click.stop :style="uploadMenuStyle">
                    <button class="menu-item" @click="handleUploadClick"><i class="fas fa-image"></i><span>{{ $t('pages.aiChatPage.uploadPic') }}</span></button>
                    <button class="menu-item" @click="handleCameraClick"><i class="fas fa-camera"></i><span>{{ $t('pages.aiChatPage.takePhoto') }}</span></button>
                  </div>
                </transition>
              </div>

              <!-- 输入框 -->
              <textarea v-if="!isMobile" v-model="inputMessage" maxlength="500" :placeholder="$t('pages.aiChatPage.placeholderPC')" class="yuemu-text-input pc-textarea" @keydown="handleKeydown" @paste="handlePaste" rows="1" :style="{height: 'auto', maxHeight: '150px', overflowY: 'hidden'}" oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; this.style.overflowY = this.scrollHeight > 150 ? 'auto' : 'hidden';"></textarea>
              <textarea v-else v-model="inputMessage" maxlength="500" :placeholder="$t('pages.aiChatPage.placeholderMobile')" class="yuemu-text-input mobile-textarea" @keydown="handleKeydown" @paste="handlePaste" rows="1" :style="{height: 'auto', maxHeight: '120px', overflowY: 'hidden'}" oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; this.style.overflowY = this.scrollHeight > 120 ? 'auto' : 'hidden';"></textarea>

              <div class="mobile-right-actions" v-if="isMobile">
                <button class="circle-btn"
                        :class="[
                    (inputMessage.trim() || imagePreviewUrl || sendingMessage || uploadingImage) ? 'send-btn' : 'mic-btn',
                    {'active': inputMessage.trim() || imagePreviewUrl, 'is-recording': isRecording}
                  ]"
                        :disabled="uploadingImage || sendingMessage"
                        @click="(uploadingImage || sendingMessage) ? null : (inputMessage.trim() || imagePreviewUrl) ? sendMessage() : startVoiceInput()">
                  <i class="fas fa-circle-notch fa-spin" v-if="uploadingImage || (sendingMessage && !uploadingImage)"></i>
                  <i class="fas fa-paper-plane" v-else-if="inputMessage.trim() || imagePreviewUrl"></i>
                  <template v-else>
                    <i class="fas" :class="isRecording ? 'fa-stop' : 'fa-microphone'"></i>
                    <div class="mic-waves" v-if="isRecording"><span></span><span></span><span></span></div>
                  </template>
                </button>
              </div>
            </div>

            <!-- PC 端底部工具栏 -->
            <div class="pc-bottom-toolbar" v-if="!isMobile">
              <div class="toolbar-left">
                <div class="upload-menu-wrapper">
                  <button class="circle-btn action-btn" @click.stop="toggleUploadMenu" :disabled="!!imagePreviewUrl"><i class="fas fa-plus"></i></button>
                  <transition name="fade-scale">
                    <div class="upload-menu" v-if="showImageUploadMenu" @click.stop>
                      <button class="menu-item" @click="handleUploadClick"><i class="fas fa-image"></i><span>{{ $t('pages.aiChatPage.uploadPic') }}</span></button>
                      <button class="menu-item" @click="handleCameraClick"><i class="fas fa-camera"></i><span>{{ $t('pages.aiChatPage.takePhoto') }}</span></button>
                    </div>
                  </transition>
                </div>

                <div class="toolbar-divider" v-if="!inputMessage && !imagePreviewUrl && !sendingMessage"></div>

                <div class="pc-quick-actions" v-if="!inputMessage && !imagePreviewUrl && !sendingMessage">
                  <button class="pc-action-btn" @click="sendQuickMessage('今天是几月几号？查询西安今天的天气情况，搜索站内有哪些西安的照片，再从Pexels找一些西安的高质量照片并将第一张保存到我的私有空间，网络搜索西安的热门景点和旅游攻略，最后用50字以内简短总结并用语音播报西安旅行建议')"><i class="fas fa-magic"></i> {{ $t('pages.aiChatPage.actionTravel') }}</button>
                  <button class="pc-action-btn" @click="sendQuickMessageWithImage('帮我对这张图片先执行 YOLO 目标检测，看看画面里都有哪些物体，然后对其进行一键画质增强并智能裁剪为16:9宽屏比例，接着套用经典胶片复古滤镜并装裱上胡桃木艺术画框，最后打上内容为“智能分析”的下角明文水印，并将最终成品的质感大图拼接为莫兰迪色卡社交分享卡片！')"><i class="fas fa-wand-magic-sparkles"></i> {{ $t('pages.aiChatPage.actionVisual') }}</button>
                  <button class="pc-action-btn" @click="sendQuickMessageWithImage('这张图片有点暗，帮我优化一下画质')"><i class="fas fa-image"></i> {{ $t('pages.aiChatPage.actionEnhance') }}</button>
                  <button class="pc-action-btn" @click="sendQuickMessage('我想听听你的声音')"><i class="fas fa-music"></i> {{ $t('pages.aiChatPage.actionVoice') }}</button>

                  <div class="pc-more-wrapper">
                    <button class="pc-action-btn more-btn" @click.stop="showPcMoreActions = !showPcMoreActions"><i class="fas fa-th-large"></i> {{ $t('pages.aiChatPage.actionMore') }}</button>
                    <transition name="fade-scale">
                      <div class="pc-more-menu" v-if="showPcMoreActions" @click.stop>
                        <button class="more-menu-item" @click="sendQuickMessageWithImage('分析一下这张图的配色方案')"><i class="fas fa-palette"></i> {{ $t('pages.aiChatPage.actionPalette') }}</button>
                        <button class="more-menu-item" @click="sendQuickMessage('搜索一下风景的壁纸')"><i class="fas fa-search"></i> {{ $t('pages.aiChatPage.actionSearchBg') }}</button>
                        <button class="more-menu-item" @click="sendQuickMessage('我加入的那些空间')"><i class="fas fa-folder-open"></i> {{ $t('pages.aiChatPage.actionJoinedSpace') }}</button>
                        <button class="more-menu-item" @click="sendQuickMessage('帮我上传图片到公共空间，随便取个名字')"><i class="fas fa-cloud-upload-alt"></i> {{ $t('pages.aiChatPage.actionUploadPublic') }}</button>
                        <button class="more-menu-item" @click="sendQuickMessageWithImage('帮我把这张图裁剪成适合小红书的3:4竖版比例')"><i class="fas fa-crop-alt"></i> {{ $t('pages.aiChatPage.actionCrop') }}</button>
                        <button class="more-menu-item" @click="sendQuickMessageWithImage('帮我给这张图加个水印，内容是©悦木图库')"><i class="fas fa-copyright"></i> {{ $t('pages.aiChatPage.actionWatermark') }}</button>
                        <button class="more-menu-item" @click="sendQuickMessageWithImage('查看这张照片的拍摄参数')"><i class="fas fa-camera"></i> {{ $t('pages.aiChatPage.actionExif') }}</button>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>

              <div class="toolbar-right">
                <button class="circle-btn"
                        :class="[
                    (inputMessage.trim() || imagePreviewUrl || sendingMessage || uploadingImage) ? 'send-btn' : 'mic-btn',
                    {'active': inputMessage.trim() || imagePreviewUrl, 'is-recording': isRecording}
                  ]"
                        :disabled="uploadingImage || sendingMessage"
                        @click="(uploadingImage || sendingMessage) ? null : (inputMessage.trim() || imagePreviewUrl) ? sendMessage() : startVoiceInput()">
                  <i class="fas fa-circle-notch fa-spin" v-if="uploadingImage || (sendingMessage && !uploadingImage)"></i>
                  <i class="fas fa-paper-plane" v-else-if="inputMessage.trim() || imagePreviewUrl"></i>
                  <template v-else>
                    <i class="fas" :class="isRecording ? 'fa-stop' : 'fa-microphone'"></i>
                    <div class="mic-waves" v-if="isRecording"><span></span><span></span><span></span></div>
                  </template>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>

  <teleport to="body">
    <transition name="fade-scale">
      <div class="yuemu-modal-overlay voice-overlay" v-if="showVoiceModal" @click.self="cancelVoiceInput">
        <div class="yuemu-modal-box voice-modal-box">
          <div class="voice-content">
            <div class="voice-status-text">{{ isRecording ? $t('pages.aiChatPage.listening') : $t('pages.aiChatPage.stopped') }}</div>
            <p v-if="voiceTempResult" class="text">{{ voiceTempResult }}</p>
            <p v-else class="placeholder">{{ $t('pages.aiChatPage.voicePlaceholder') }}</p>

            <div class="visualizer" :class="{'is-active': isRecording}">
              <span style="--delay: 0.0s"></span>
              <span style="--delay: 0.1s"></span>
              <span style="--delay: 0.3s"></span>
              <span style="--delay: 0.2s"></span>
              <span style="--delay: 0.4s"></span>
              <span style="--delay: 0.1s"></span>
              <span style="--delay: 0.3s"></span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="cancelVoiceInput">{{ $t('pages.aiChatPage.cancel') }}</button>
            <div class="voice-divider"></div>
            <button class="btn-confirm" @click="finishVoiceInput" :disabled="!voiceTempResult">{{ $t('pages.aiChatPage.send') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-scale">
      <div class="yuemu-modal-overlay" v-if="updateSessionModalVisible" @click.self="cancelUpdateSession">
        <div class="yuemu-modal-box">
          <h3>{{ $t('pages.aiChatPage.renameSession') }}</h3>
          <input type="text" v-model="updateSessionName" class="modal-input" :placeholder="$t('pages.aiChatPage.inputNamePlaceholder')" @keyup.enter="confirmUpdateSession" />
          <div class="modal-actions-standard">
            <button class="btn-text" @click="cancelUpdateSession">{{ $t('pages.aiChatPage.cancel') }}</button>
            <button class="btn-primary" @click="confirmUpdateSession" :disabled="!updateSessionName.trim() || updatingSession">{{ $t('pages.aiChatPage.save') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-scale">
      <div class="yuemu-modal-overlay" v-if="createSessionModalVisible" @click.self="cancelCreateSession">
        <div class="yuemu-modal-box">
          <h3>{{ $t('pages.aiChatPage.createSessionTitle') }}</h3>
          <input type="text" v-model="newSessionTitle" class="modal-input" :placeholder="$t('pages.aiChatPage.createNamePlaceholder')" @keyup.enter="confirmCreateSession" />
          <div class="modal-actions-standard">
            <button class="btn-text" @click="cancelCreateSession">{{ $t('pages.aiChatPage.cancel') }}</button>
            <button class="btn-primary" @click="confirmCreateSession" :disabled="!newSessionTitle.trim() || creatingSession">{{ $t('pages.aiChatPage.createBtn') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-scale">
      <div class="yuemu-modal-overlay" v-if="showDeleteConfirmModal" @click.self="cancelDeleteSession">
        <div class="yuemu-modal-box">
          <h3>{{ $t('pages.aiChatPage.deleteSessionTitle') }}</h3>
          <p class="modal-desc">{{ $t('pages.aiChatPage.deleteSessionDesc') }}</p>
          <div class="modal-actions-standard">
            <button class="btn-text" @click="cancelDeleteSession">{{ $t('pages.aiChatPage.cancel') }}</button>
            <button class="btn-danger" @click="confirmDeleteSessionAction">{{ $t('pages.aiChatPage.deleteBtn') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <ImagePreview
      v-model:visible="showImagePreview"
      :images="previewImages"
      :initial-index="previewInitialIndex"
      @close="closeImagePreview"
    />

    <div class="global-toast" v-if="showMessage" :class="messageType">
      <i :class="messageType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
      <span>{{ messageText }}</span>
    </div>

    <AICapabilities :visible="showCapabilities" @close="showCapabilities = false" />
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, computed, watch, reactive } from 'vue'
import dayjs from 'dayjs'
import { parseMarkdown } from '@/utils/markdownParser'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  createSessionUsingPost,
  deleteSessionUsingPost,
  listSessionsUsingGet,
  switchSessionUsingPost,
  updateSessionNameUsingPost,
  autoNameSessionUsingPost
} from '@/api/sessionController'
import {
  listQaMessagesUsingGet,
  clearSessionContextUsingPost,
  getTtsAudioUsingGet,
  getAiTokenUsageUsingGet
} from '@/api/messageQaController'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import AICapabilities from '@/components/AICapabilities.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { aiTokenWebSocketService } from '@/utils/aiTokenWebSocketService'

interface Window { EventSource: typeof EventSource; speechSynthesis: any; SpeechSynthesisUtterance: any; }
declare const EventSource: { prototype: EventSource; new(url: string, eventSourceInitDict?: EventSourceInit): EventSource; };

const debounce = (func: Function, wait: number) => {
  let timeout: number | null = null;
  return function (...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => { timeout = null; func(...args) }, wait);
  }
}

// SSE 流式处理逻辑
let currentEventSource: EventSource | null = null; // 保存当前的EventSource实例用于打断

const handleSseStreamWithEventSource = (url: string, aiMessagePlaceholder: any, callback: (error?: Error) => void) => {
  aiMessagePlaceholder.isStreaming = true;
  streamingMessageIds.value.push(Number(aiMessagePlaceholder.id));
  const eventSource = new EventSource(url, { withCredentials: true });
  currentEventSource = eventSource; // 保存实例

  let fullContent = '';
  let displayedContent = '';
  let typeFrame: number | null = null;
  let isStreamDone = false;

  let timeoutId: number | null = null;
  const IDLE_TIMEOUT_MS = 600000; // 10分钟动态空闲超时

  const handleTimeout = () => {
    console.error('SSE 连接空闲超时');
    currentEventSource = null;
    eventSource.close();
    if (typeFrame) cancelAnimationFrame(typeFrame);
    callback(new Error('Timeout'));
  };

  const resetIdleTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(handleTimeout, IDLE_TIMEOUT_MS);
  };

  // 初始启动超时监听
  resetIdleTimeout();

  const typeNext = () => {
    if (displayedContent.length < fullContent.length) {
      const remaining = fullContent.length - displayedContent.length;
      // 为了丝滑，基于剩余字符数量动态增加输出的字符数
      // 保持基准 1-2 个字符每帧(约60-120chars/s)，当积压多时加速
      let charsToAdd = 1;
      if (remaining > 50) charsToAdd = Math.ceil(remaining / 5);
      else if (remaining > 20) charsToAdd = 3;
      else if (remaining > 5) charsToAdd = 2;

      displayedContent += fullContent.substring(displayedContent.length, displayedContent.length + charsToAdd);

      aiMessagePlaceholder.content = displayedContent;
      const index = currentMessages.value.findIndex(msg => msg.id === aiMessagePlaceholder.id);
      if (index !== -1) currentMessages.value[index].content = displayedContent;
      scrollToBottomRealtime();

      typeFrame = requestAnimationFrame(typeNext);
    } else {
      typeFrame = null;
      if (isStreamDone) {
        finalizeMessage();
      }
    }
  };

  const finalizeMessage = () => {
    aiMessagePlaceholder.isStreaming = false;
    aiMessagePlaceholder.isThinking = false;
    aiMessagePlaceholder.statusSteps = [];
    aiMessagePlaceholder.content = fullContent;
    const sIndex = streamingMessageIds.value.indexOf(Number(aiMessagePlaceholder.id));
    if (sIndex > -1) streamingMessageIds.value.splice(sIndex, 1);
    currentEventSource = null;
    eventSource.close();
    callback();
  };

  eventSource.addEventListener('aiStatusUpdate', (event: MessageEvent) => {
    resetIdleTimeout();
    try {
      const dataObj = JSON.parse(event.data);
      if (dataObj?.status) {
        aiMessagePlaceholder.statusSteps = [...(aiMessagePlaceholder.statusSteps || []), dataObj.status];
        aiMessagePlaceholder.isThinking = true;
        scrollToBottomRealtime();
      }
    } catch (e) {}
  });

  eventSource.addEventListener('aiAnswerChunk', (event: MessageEvent) => {
    resetIdleTimeout();
    try {
      const dataObj = JSON.parse(event.data);
      const token = dataObj.token;
      if (token == null) return;

      if (dataObj.isSync) {
        fullContent = token;
        displayedContent = token;
        aiMessagePlaceholder.content = displayedContent;
        scrollToBottomRealtime();
      } else {
        fullContent += token;
        if (!typeFrame) {
          typeFrame = requestAnimationFrame(typeNext);
        }
      }

      if (token.trim() && aiMessagePlaceholder.isThinking) aiMessagePlaceholder.isThinking = false;
    } catch (e) {}
  });

  eventSource.addEventListener('done', (event: MessageEvent) => {
    if (timeoutId) clearTimeout(timeoutId);
    try {
      const doneData = JSON.parse(event.data);
      if (doneData.aiMsgId) {
        aiMessagePlaceholder.id = doneData.aiMsgId;
      }
      isStreamDone = true;
      eventSource.close(); // 收到完成信号立刻关闭连接，防止底层自动重连或触发 onerror

      if (!typeFrame && displayedContent.length >= fullContent.length) {
        finalizeMessage();
      }
    } catch (e) {
      isStreamDone = true;
      eventSource.close();
      finalizeMessage();
    }
  });

  eventSource.onerror = async () => {
    if (timeoutId) clearTimeout(timeoutId);
    // 如果已经收到 done 信号，忽略 onerror
    if (isStreamDone) return;
    console.warn('SSE连接中断，等待重连或手动刷新');
    if (typeFrame) cancelAnimationFrame(typeFrame);
    const sIndex = streamingMessageIds.value.indexOf(Number(aiMessagePlaceholder.id));
    if (sIndex > -1) streamingMessageIds.value.splice(sIndex, 1);
    currentEventSource = null;
    eventSource.close();

    // 检查是否是因为超额限额导致的连接断开
    try {
      const usageRes = await getAiTokenUsageUsingGet();
      if (usageRes.data?.code === 0 && usageRes.data?.data) {
        const { used5h, limit5h, usedWeek, limitWeek } = usageRes.data.data;
        if (Number(used5h) >= Number(limit5h)) {
          callback(new Error('您5小时内的 AI 请求配额已达上限，请稍后再试或升级会员。'));
          return;
        }
        if (Number(usedWeek) >= Number(limitWeek)) {
          callback(new Error(t('pages.aiChatPage.msgs.quotaWeekLimit')));
          return;
        }
      }
    } catch (e) {
      console.warn('获取 AI Token 用量失败', e);
    }

    callback(new Error('AI 服务连接中断，请重试或刷新页面'));
  };
};

/**
 * 检查并尝试重连正在生成中的流
 */
const checkAndReconnectStream = async () => {
  if (currentMessages.value.length < 2) return;
  const lastMsg = currentMessages.value[currentMessages.value.length - 1];

  // 如果最后一条是 AI 消息且内容为占位符 '...'，说明正在生成中
  if (lastMsg.messageType === 2 && lastMsg.content === '...') {
    console.log('检测到未完成的 AI 回复，尝试自动重连...');

    // 找到对应的用户提问
    let userMsg = '';
    for (let i = currentMessages.value.length - 2; i >= 0; i--) {
      if (currentMessages.value[i].messageType === 1) {
        userMsg = currentMessages.value[i].content || '';
        break;
      }
    }

    if (userMsg && currentSessionId.value) {
      const aiMsgProxy = reactive({ ...lastMsg, isStreaming: true, isThinking: true, statusSteps: [] });
      // 替换原消息为响应式代理
      currentMessages.value[currentMessages.value.length - 1] = aiMsgProxy;

      // 同步全局状态，隐藏底部的按钮
      aiThinking.value = true;
      sendingMessage.value = true;

      const encoded = encodeURIComponent(userMsg);
      const url = `/api/rag/qa/message/send/stream?message=${encoded}&sessionId=${currentSessionId.value}&model=${encodeURIComponent(selectedModel.value)}`;

      handleSseStreamWithEventSource(url, aiMsgProxy, (err) => {
        aiThinking.value = false;
        sendingMessage.value = false;
        if (err) console.error('重连流失败:', err);
      });
    }
  }
};



const loginUserStore = useLoginUserStore()
const loginUser = computed(() => loginUserStore.loginUser)

const isMobile = ref(false)
const checkIsMobile = () => { isMobile.value = window.innerWidth < 768 }
const showSessionDrawer = ref(false)
const toggleSessionDrawer = () => { showSessionDrawer.value = !showSessionDrawer.value; if (isMobile.value) document.body.style.overflow = showSessionDrawer.value ? 'hidden' : '' }
const isSidebarCollapsed = ref(false)
const toggleSidebar = () => { isSidebarCollapsed.value = !isSidebarCollapsed.value }

const aiTokenUsage = ref<any>(null)
const getMemberTitle = (type: number) => {
  if (type === 2) return 'Plus 会员'
  if (type === 1) return 'Pro 会员'
  return '普通用户'
}

const formatTokenCount = (count: number) => {
  if (count == null) return '0'
  if (count >= 10000) {
    return parseFloat((count / 10000).toFixed(1)) + 'w'
  }
  return count.toString()
}

const sessions = ref<API.RagSessionVO[]>([])
const currentSessionId = ref<number | null>(null)
const loadingSessions = ref(false)
const creatingSession = ref(false)
const createSessionModalVisible = ref(false)
const newSessionTitle = ref('')
const sessionCurrentPage = ref(1)
const sessionPageSize = ref(20)
const sessionHasMore = ref(true)
const sessionLoadingMore = ref(false)
const updateSessionModalVisible = ref(false)
const updatingSession = ref(false)
const updateSessionName = ref('')
const sessionToUpdateId = ref<number | null>(null)
const showDeleteConfirmModal = ref(false)
const sessionToDeleteId = ref<number | null>(null)

const showMessage = ref(false)
const messageText = ref('')
const messageType = ref<'success' | 'error'>('success')
const showCapabilities = ref(false)


const LOCAL_MODEL_KEY = 'yuemu_selected_ai_model';
const selectedModel = ref(localStorage.getItem(LOCAL_MODEL_KEY) || 'deepseek-v4-flash');
watch(selectedModel, (val) => localStorage.setItem(LOCAL_MODEL_KEY, val));

const models = [
  { value: 'qwen3.5-flash', label: 'Qwen3.5-Flash (基准 1.0x)' },
  { value: 'deepseek-v4-flash', label: 'DeepSeek-V4-Flash (1.36x)' },
  { value: 'qwen3.5-plus', label: 'Qwen3.5-Plus (2.55x)' },
  { value: 'deepseek-v4-pro', label: 'DeepSeek-V4-Pro (16.36x)' }
];

const currentMessages = ref<API.RagMessageVO[]>([])
const inputMessage = ref('')
const loadingMessages = ref(false)
const sendingMessage = ref(false)
const aiThinking = ref(false)

const streamingMessageIds = ref<number[]>([])
const failedImageUrls = reactive(new Set<string>())
const collapsedSteps = reactive<Record<string, boolean>>({})

const showScrollToBottom = ref(false)
const messageCurrentPage = ref(1)
const messagePageSize = ref(20)
const messageHasMore = ref(true)
const messageLoadingMore = ref(false)
const initialMessageLoaded = ref(false)

const messagesContainerRef = ref<HTMLElement | null>(null)
const sessionListRef = ref<HTMLElement | null>(null)

const isRecording = ref(false)
let recognition: any = null
const showVoiceModal = ref(false)
const voiceTempResult = ref('')
const voiceActive = ref(false)

const fileInputRef = ref<HTMLInputElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)
const selectedImage = ref<File | null>(null)
const imagePreviewUrl = ref('')
const uploadedImageUrl = ref('')
const uploadingImage = ref(false)
const uploadedImageMetadata = ref<any>(null)
const showImageUploadMenu = ref(false)
const showPcMoreActions = ref(false)
const uploadMenuStyle = ref<any>({})

const handleUploadClick = () => {
  showImageUploadMenu.value = false;
  fileInputRef.value?.click();
}

const handleCameraClick = () => {
  showImageUploadMenu.value = false;
  cameraInputRef.value?.click();
}

const toggleUploadMenu = (event: Event) => {
  showImageUploadMenu.value = !showImageUploadMenu.value;

  if (showImageUploadMenu.value && isMobile.value) {
    // 移动端计算菜单位置 - 左对齐，但确保不超出屏幕
    const button = event.target as HTMLElement;
    const rect = button.getBoundingClientRect();
    const menuWidth = 180;

    // 计算左边距，确保不超出屏幕左侧
    let leftPos = rect.left;
    if (leftPos < 16) {
      leftPos = 16; // 最小左边距16px
    }
    // 确保不超出屏幕右侧
    if (leftPos + menuWidth > window.innerWidth - 16) {
      leftPos = window.innerWidth - menuWidth - 16;
    }

    uploadMenuStyle.value = {
      bottom: `${window.innerHeight - rect.top + 8}px`,
      left: `${leftPos}px`,
      width: `${menuWidth}px`
    };
  }
}

const showImagePreview = ref(false)
const previewImages = ref<string[]>([])
const previewInitialIndex = ref(0)

const openImagePreview = (urls: string | string[], index: number = 0) => {
  if (Array.isArray(urls)) {
    previewImages.value = urls.map(url => url.includes('images.pexels.com') ? url.split('?')[0] : url);
    previewInitialIndex.value = index;
  } else {
    let previewUrl = urls;
    if (urls.includes('images.pexels.com')) {
      previewUrl = urls.split('?')[0];
    }
    previewImages.value = [previewUrl];
    previewInitialIndex.value = 0;
  }
  showImagePreview.value = true;
}
const closeImagePreview = () => { showImagePreview.value = false; setTimeout(() => { previewImages.value = []; previewInitialIndex.value = 0; }, 300) }

const getMessageItemClass = (item: API.RagMessageVO) => {
  if (item.content === '上下文已清理') return 'system-message';
  return item.messageType === 1 ? 'user-message' : 'assistant-message';
};
const handleImgError = (e: Event, url: string, item?: any) => { if (!item?.isStreaming) { (e.target as HTMLImageElement).style.display = 'none'; failedImageUrls.add(url); } };
const handleImgLoad = (url: string) => { if (failedImageUrls.has(url)) failedImageUrls.delete(url); };
const toggleStepsCollapse = (msgId: string) => { collapsedSteps[msgId] = !collapsedSteps[msgId]; };

// ====== 核心优化：智能内联切片与网格聚合引擎 ======
const getMessageSegments = (content: string) => {
  if (!content) return [];
  if (content === '上下文已清理' || content === '正在思考中') return [{ type: 'text', content }];

  // 前置净化：自动纠正大模型由于直觉所添加的带感叹号的 `![附图` 或 `![语音`，确保其稳健转化为画廊卡片
  // 同时移除大模型偶尔在末尾泄漏的异常终止符星号 *
  let sanitizedContent = content
    .replace(/!\[附图:/g, '[附图:')
    .replace(/!\[语音:/g, '[语音:')
    .replace(/\s*\*+\s*$/, '');

  // 1. 去除隐藏的图片元数据，避免其干扰后续排版
  sanitizedContent = sanitizedContent.replace(/\[图片元数据:.*?\]/g, '');

  // 2. 将原文分割为 图片 / 语音 / 普通文本 等基础片段（放宽 URL 匹配条件并且兼容大模型偶尔生成的中文全角括号、甚至小括号闭合等严重幻觉）
  const splitRegex = /(\[附图:\s*[^\]】\)]+?[\]】\)]|!\[[^\]]*\]\(https?:\/\/[^\)\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg|ico)(?:\?[^\)]*)?\)|!\[[^\]]*\]\(https?:\/\/(?:static\.yuemutuku\.com|[^\/]*\.(?:cloudfront\.net|amazonaws\.com|qiniucdn\.com|aliyuncs\.com))[^\)\s]+\)|\[语音:\s*[^\]】\)]+?[\]】\)])/i;
  const parts = sanitizedContent.split(splitRegex);
  const rawSegments: any[] = [];

  parts.forEach(part => {
    if (!part) return;
    const imgMatch = part.match(/^\[附图:\s*([^\]】\)]+?)\s*[\]】\)]$/i) ||
      part.match(/^!\[[^\]]*\]\((https?:\/\/[^\)\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg|ico)(?:\?[^\)]*)?)\)$/i) ||
      part.match(/^!\[[^\]]*\]\((https?:\/\/(?:static\.yuemutuku\.com|[^\/]*\.(?:cloudfront\.net|amazonaws\.com|qiniucdn\.com|aliyuncs\.com))[^\)\s]+)\)$/i);
    const audMatch = part.match(/^\[语音:\s*([^\]】\)]+?)\s*[\]】\)]$/i);

    if (imgMatch) {
      rawSegments.push({ type: 'image', url: imgMatch[1] });
    } else if (audMatch) {
      rawSegments.push({ type: 'audio', url: audMatch[1] });
    } else {
      rawSegments.push({ type: 'text', content: part });
    }
  });

  // 3. 第二次编排：智能聚合连续的图片及简短标题为图库(Gallery)，解决瀑布流拉长页面的问题
  const segments: any[] = [];
  let i = 0;

  while (i < rawSegments.length) {
    if (rawSegments[i].type === 'image') {
      const galleryItems: { url: string, caption: string }[] = [];

      while (i < rawSegments.length && rawSegments[i].type === 'image') {
        const url = rawSegments[i].url;
        let caption = '';
        i++;

        // 探测图片后面的段落是不是可以作为图片的「标注标题」
        if (i < rawSegments.length && rawSegments[i].type === 'text') {
          const textContent = rawSegments[i].content;
          const trimmed = textContent.trim();

          if (trimmed === '') {
            // 纯空行，略过
            galleryItems.push({ url, caption: '' });
            i++;
          } else {
            // 通过双换行符分割段落，通常第一段就是标题
            const paragraphs = trimmed.split(/\n\s*\n/);
            const firstPara = paragraphs[0].trim();

            // 更严格的标题判断条件：
            // 1. 不包含markdown标题标记（#、##、###等）
            // 2. 不包含明确的分隔符（---）
            // 3. 长度小于 120 字符（容纳超链接）
            // 4. 不包含多个句子（通过句号、问号、感叹号判断）
            // 5. 不以数字开头（避免误判列表项）
            // 6. 不包含"为您"、"以下"、"找到"等引导性词汇
            // 7. 不能有空行隔开（如果是 \n\n 开头则一定是新段落正文）
            // 8. 过滤掉以句号结尾的长句子（大概率是正文段落）
            const hasMarkdownHeading = firstPara.match(/^#{1,6}\s/);
            const hasBreak = firstPara.match(/^---/);
            const hasMultipleSentences = (firstPara.match(/[。！？.!?]/g) || []).length > 1;
            const startsWithNumber = firstPara.match(/^\d+[\.\、]/);
            const hasIntroWords = /为您|以下|找到|搜索|查询|来自|根据/.test(firstPara);

            const hasBlankLineBefore = /^\s*?\n\s*?\n/.test(textContent);
            const isLongSentence = firstPara.length > 20 && /[。！？.!?]$/.test(firstPara.trim());

            const isLikelyCaption = !hasMarkdownHeading &&
              !hasBreak &&
              !hasBlankLineBefore &&
              !isLongSentence &&
              firstPara.length < 120 && // 放宽限制以完美容纳带有 picture-redirect 超链接的 Markdown 图片标题
              !hasMultipleSentences &&
              !startsWithNumber &&
              !hasIntroWords;

            if (isLikelyCaption) {
              let safeCaption = firstPara;

              // 1. 修复大模型幻觉产生的错别字括号，比如 `标题)(/url` -> `[标题](/url`
              if (safeCaption.includes(')(/picture-redirect')) {
                safeCaption = safeCaption.replace(/\)\(\/picture-redirect/g, '](/picture-redirect');
                if (!safeCaption.includes('[')) {
                  safeCaption = (safeCaption.startsWith('*') ? '*[' + safeCaption.slice(1) : '[' + safeCaption);
                }
              }

              // 2. 自动修复大模型未闭合的 markdown 链接或斜体（比如 streaming 途中，或生成截断时）
              if (safeCaption.match(/\*\[[^\]]*\]\([^\)]*$/)) {
                safeCaption += ')*';
              } else if (safeCaption.match(/\[[^\]]*\]\([^\)]*$/)) {
                safeCaption += ')';
              } else if (safeCaption.match(/\*[^\*]+$/)) {
                safeCaption += '*';
              }

              // 3. 自动修复只有前半边括号的异常：比如 AI 生成了 [标题](url 却没有 )
              // 或者漏了 `[`
              if (safeCaption.includes('](/') && !safeCaption.includes('[')) {
                safeCaption = '[' + safeCaption;
              }

              caption = safeCaption;
              galleryItems.push({ url, caption });

              if (paragraphs.length > 1) {
                // 如果后面还有大段文本，说明图库序列到此结束了，将其恢复为独立的 text 块
                const remainingText = paragraphs.slice(1).join('\n\n');
                rawSegments[i] = { type: 'text', content: '\n\n' + remainingText };
                break;
              } else {
                i++;
              }
            } else {
              // 此文本不符合标题特征，不视为标题，直接打破图库连续性
              galleryItems.push({ url, caption: '' });
              break;
            }
          }
        } else {
          // 后面紧跟着的还是图片或者语音，标题为空
          galleryItems.push({ url, caption: '' });
        }
      }
      // 将收集到的组合封装为 gallery 集合渲染
      segments.push({ type: 'gallery', items: galleryItems });
    } else {
      segments.push(rawSegments[i]);
      i++;
    }
  }

  return segments;
};

const getCleanContent = (c: string) => c ? c.replace(/\[图片元数据:.*?\]/g, '').replace(/\[附图:.*?[\]】]\n*/g,'').replace(/!\[.*?\]\(.*?\)\n*/g,'').replace(/\[语音:.*?[\]】]\n*/g,'').trim() : '';
const isThinkingMessage = (item: any) => item.messageType === 2 && (item.isThinking === true || item.content === '正在思考中');

const shouldShowTimestamp = (current: API.RagMessageVO, prev: API.RagMessageVO | undefined) => !prev || dayjs(current.createTime).diff(dayjs(prev.createTime), 'minute') >= 10;
const formatMessageDivider = (time: string) => { const t = dayjs(time), now = dayjs(); if (t.isSame(now, 'day')) return t.format('HH:mm'); if (t.isSame(now.subtract(1, 'day'), 'day')) return '昨天 ' + t.format('HH:mm'); return t.format('MM-DD HH:mm'); }
const formatTime = (timeStr: string) => dayjs(timeStr).format('HH:mm');

const copyMessage = (item: API.RagMessageVO) => { const text = getCleanContent(item.content); if (!text) return; if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => showSuccessMessage('已复制')).catch(() => fallbackCopy(text)); else fallbackCopy(text); }
const fallbackCopy = (text: string) => { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); showSuccessMessage('已复制'); } catch(e) { showErrorMessage('复制失败'); } document.body.removeChild(ta); }

// ================= ★ 语音朗读 TTS (后端云服务升级) ★ =================
const playingMessageId = ref<number | null>(null);
let currentAudio: HTMLAudioElement | null = null;
const isTtsLoading = ref(false);

const toggleTTS = async (item: API.RagMessageVO) => {
  // 如果正在播放当前的，则停止
  if (playingMessageId.value === item.id) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    playingMessageId.value = null;
    return;
  }

  // 停止其他正在播放的
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  playingMessageId.value = null;

  const textToSpeak = getCleanContent(item.content).replace(/[#*`_\[\]>]/g, '').trim();
  if (!textToSpeak) {
    showErrorMessage('没有可朗读的文本');
    return;
  }

  try {
    isTtsLoading.value = true;
    // 提示用户正在合成（因为云端合成可能需要一两秒）
    showSuccessMessage('生成语音中...');

    // 使用后端提供的 tts 接口，支持跨域与安全校验
    const res = await getTtsAudioUsingGet(
      { text: textToSpeak, voiceType: 'female_gentle' },
      { responseType: 'blob' }
    ) as any;

    // Axios 拦截器默认返回的是 AxiosResponse，因此真实的 Blob 在 data 字段里
    const blob = res.data as Blob;
    const url = URL.createObjectURL(blob);

    currentAudio = new Audio(url);
    currentAudio.onplay = () => {
      playingMessageId.value = item.id;
      isTtsLoading.value = false;
    };
    currentAudio.onended = () => {
      playingMessageId.value = null;
      URL.revokeObjectURL(url);
      currentAudio = null;
    };
    currentAudio.onerror = (e) => {
      console.error('TTS Audio Error:', e);
      showErrorMessage('云端语音播放失败，请稍后重试');
      playingMessageId.value = null;
      isTtsLoading.value = false;
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    await currentAudio.play();
  } catch (error) {
    console.error('TTS Error:', error);
    showErrorMessage('云端语音加载失败');
    playingMessageId.value = null;
    isTtsLoading.value = false;
    currentAudio = null;
  }
};
// ====================================================================

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= 1048576) return resolve(file);
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas'); let { width, height } = img;
        if (width > 1920 || height > 1080) { const r = width / height; if (r > 1) { width = 1920; height = Math.round(width / r); } else { height = 1080; width = Math.round(height * r); } }
        canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return reject(new Error('err')); ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((b) => { if (!b) return reject(new Error('err')); resolve(new File([b], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' })); }, 'image/jpeg', 0.85);
      }; img.onerror = () => reject(new Error('err'));
    };
  });
};

const handleImageSelect = async (e: Event | { target: { files: File[] } }) => {
  const file = (e.target as any).files?.[0]
  if (file) {
    imagePreviewUrl.value = URL.createObjectURL(file); selectedImage.value = file;
    try {
      uploadingImage.value = true;
      const cFile = await compressImage(file);
      const res = await uploadPostImageUsingPost({}, {}, cFile);
      if (res.data.code === 0 && res.data.data?.url) {
        uploadedImageUrl.value = res.data.data.url;
        uploadedImageMetadata.value = {
          thumbnailUrl: res.data.data.thumbnailUrl,
          picSize: res.data.data.picSize,
          picWidth: res.data.data.picWidth,
          picHeight: res.data.data.picHeight,
          picScale: res.data.data.picScale,
          picFormat: res.data.data.picFormat,
          picColor: res.data.data.picColor
        };
        if (inputMessage.value && (inputMessage.value.includes('上传图片') || inputMessage.value.includes(t('pages.aiChatPage.msgs.uploadTo')))) {
          await nextTick();
          sendMessage();
        }
      } else {
        showErrorMessage('图片上传失败');
        clearImage();
      }
    }
    catch (err) {
      showErrorMessage('图片上传异常');
      clearImage();
    } finally {
      uploadingImage.value = false;
    }
  }
}
const clearImage = () => {
  selectedImage.value = null;
  uploadedImageUrl.value = '';
  uploadedImageMetadata.value = null;
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value);
  imagePreviewUrl.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
  if (cameraInputRef.value) cameraInputRef.value.value = '';
}

const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) {
        // 阻止默认粘贴事件（防止图片被作为乱码文本粘贴）
        e.preventDefault();
        // 模拟文件选择事件触发上传
        await handleImageSelect({ target: { files: [file] } });
        break; // 每次粘贴只处理第一张图片
      }
    }
  }
}

// ================= ★ 修复后的语音输入 (STT) 逻辑 ★ =================
const initRecognition = () => {
  if (recognition) return;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return;

  recognition = new SR();
  recognition.lang = 'zh-CN';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (e: any) => {
    let res = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      res += e.results[i][0].transcript;
    }
    if (res) voiceTempResult.value = res;
  }

  recognition.onerror = (e: any) => {
    if (e.error !== 'aborted') {
      let errorMsg = '语音识别失败';
      if (e.error === 'not-allowed') errorMsg = t('pages.aiChatPage.msgs.micDenied');
      else if (e.error === 'network') errorMsg = t('pages.aiChatPage.msgs.networkError');

      cancelVoiceInput();
      showErrorMessage(`${errorMsg} (${e.error})`);
    }
  }

  recognition.onend = () => {
    voiceActive.value = false;
    if (isRecording.value && !voiceTempResult.value) {
      isRecording.value = false;
    }
  }
}

const startVoiceInput = () => {
  if (isRecording.value) return finishVoiceInput();

  // 1. 兼容 HBuilderX 5+ App 原生语音识别环境
  if (typeof window !== 'undefined' && (window as any).plus && (window as any).plus.speech) {
    const plus = (window as any).plus;
    showVoiceModal.value = true;
    isRecording.value = true;
    voiceActive.value = true;
    voiceTempResult.value = t('pages.aiChatPage.msgs.pleaseSpeak');

    try {
      plus.speech.startRecognize(
        { engine: 'iFly', lang: 'zh-cn' },
        function (s: string) {
          if (s) {
            voiceTempResult.value = s;
            // 短暂延迟后自动结束并上屏
            setTimeout(() => {
              finishVoiceInput();
            }, 500);
          }
        },
        function (e: any) {
          console.warn("语音识别取消或失败: ", e);
          cancelVoiceInput();
        }
      );
    } catch (err) {
      showErrorMessage(t('pages.aiChatPage.msgs.nativeVoiceFail'));
      cancelVoiceInput();
    }
    return;
  }

  // 2. 传统 Web 端 SpeechRecognition 处理
  if (!location.protocol.includes('https') && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    return showErrorMessage(t('pages.aiChatPage.msgs.httpsRequired'));
  }

  initRecognition();

  if (!recognition) {
    return showErrorMessage(t('pages.aiChatPage.msgs.voiceNotSupported'));
  }

  voiceTempResult.value = '';
  showVoiceModal.value = true;

  try {
    recognition.start();
    voiceActive.value = true;
    isRecording.value = true;
  } catch (e: any) {
    if (e.name === 'NotAllowedError') {
      showErrorMessage(t('pages.aiChatPage.msgs.micDeniedCheck'));
    } else if (e.name === 'InvalidStateError') {
      recognition.abort();
      setTimeout(() => recognition.start(), 200);
    } else {
      showErrorMessage(t('pages.aiChatPage.msgs.micError'));
    }
    if (e.name !== 'InvalidStateError') cancelVoiceInput();
  }
}

const finishVoiceInput = () => {
  // 停止 5+ 原生语音
  if (typeof window !== 'undefined' && (window as any).plus && (window as any).plus.speech) {
    try { (window as any).plus.speech.stopRecognize(); } catch(e) {}
  }

  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }

  if (voiceTempResult.value && voiceTempResult.value !== t('pages.aiChatPage.msgs.pleaseSpeak')) {
    inputMessage.value = voiceTempResult.value.trim();
  }
  showVoiceModal.value = false;
  isRecording.value = false;
  voiceTempResult.value = '';
}

const cancelVoiceInput = () => {
  // 取消 5+ 原生语音
  if (typeof window !== 'undefined' && (window as any).plus && (window as any).plus.speech) {
    try { (window as any).plus.speech.stopRecognize(); } catch(e) {}
  }

  if (recognition) {
    try { recognition.abort(); } catch (e) {}
  }
  showVoiceModal.value = false;
  isRecording.value = false;
  voiceTempResult.value = '';
}
// ====================================================================

const loadSessions = async (append = false) => {
  try {
    if (!append) { loadingSessions.value = true; sessionCurrentPage.value = 1; } else sessionLoadingMore.value = true;
    const res = await listSessionsUsingGet({ current: sessionCurrentPage.value, pageSize: sessionPageSize.value });
    if (res.data.code === 0) {
      const recs = res.data.data?.records || []; sessions.value = append ? [...sessions.value, ...recs] : recs; sessionHasMore.value = recs.length === sessionPageSize.value;
      if (!currentSessionId.value && sessions.value.length > 0) { currentSessionId.value = sessions.value[0].id; await loadMessages(); await nextTick(); scrollToBottom(true); }
    } else showErrorMessage(t('pages.aiChatPage.msgs.fetchSessionFail'));
  } catch (e) { showErrorMessage(t('pages.aiChatPage.msgs.fetchSessionError')); } finally { loadingSessions.value = false; sessionLoadingMore.value = false; }
}
const loadMoreSessions = async () => { if (sessionHasMore.value && !sessionLoadingMore.value && !loadingSessions.value) { sessionCurrentPage.value++; await loadSessions(true); } }

const loadMessages = async (append = false) => {
  if (!currentSessionId.value) return;
  try {
    if (!append) { loadingMessages.value = true; messageCurrentPage.value = 1; } else messageLoadingMore.value = true;
    const res = await listQaMessagesUsingGet({ sessionId: currentSessionId.value, current: messageCurrentPage.value, pageSize: messagePageSize.value });
    if (res.data.code === 0) {
      const recs = res.data.data?.records || [];
      if (!append) {
        currentMessages.value = recs;
        initialMessageLoaded.value = true;
        await nextTick();
        scrollToBottomRealtime();
        // 检查并重连流
        checkAndReconnectStream();
      }
      else { const mc = messagesContainerRef.value; const pt = mc?.scrollTop || 0, ph = mc?.scrollHeight || 0; currentMessages.value = [...recs, ...currentMessages.value]; await nextTick(() => { if (mc) mc.scrollTop = pt + (mc.scrollHeight - ph); }); }
      messageHasMore.value = recs.length === messagePageSize.value;
    } else showErrorMessage(t('pages.aiChatPage.msgs.loadMsgFail'));
  } catch (e) { showErrorMessage(t('pages.aiChatPage.msgs.loadMsgError')); } finally { loadingMessages.value = false; messageLoadingMore.value = false; }
}
const loadMoreMessages = async () => { if (messageHasMore.value && !messageLoadingMore.value) { messageCurrentPage.value++; await loadMessages(true); } }

/**
 * AI 自动命名会话（第一轮对话结束后异步触发，对用户无感知）
 */
const autoNamingSessionId = ref<number | null>(null);

const tryAutoNameSession = async (sessionId: number) => {
  try {
    autoNamingSessionId.value = sessionId;
    const res = await autoNameSessionUsingPost({ id: sessionId })
    if (res.data.code === 0 && res.data.data) {
      const newName = res.data.data
      const s = sessions.value.find(x => x.id === sessionId)
      if (s) s.sessionName = newName
    }
  } catch (e) {
    // 自动命名失败静默处理，不影响用户体验
    console.warn('自动命名失败', e)
  } finally {
    if (autoNamingSessionId.value === sessionId) {
      autoNamingSessionId.value = null;
    }
  }
}

const showCreateSessionModal = async () => {
  if (creatingSession.value) return;
  try {
    creatingSession.value = true;
    const res = await createSessionUsingPost({ sessionName: t('pages.aiChatPage.newSession') });
    if (res.data.code === 0 && res.data.data) {
      sessions.value.unshift(res.data.data);
      currentSessionId.value = res.data.data.id;
      currentMessages.value = [];
      await nextTick(); scrollToBottomRealtime();
      if (isMobile.value) showSessionDrawer.value = false;
    } else showErrorMessage(t('pages.aiChatPage.msgs.createFail'));
  } catch (e) { showErrorMessage(t('pages.aiChatPage.msgs.createError')); } finally { creatingSession.value = false; }
}
const cancelCreateSession = () => { createSessionModalVisible.value = false; newSessionTitle.value = ''; }
const confirmCreateSession = async () => {
  try {
    creatingSession.value = true;
    const res = await createSessionUsingPost({ sessionName: t('pages.aiChatPage.newSession') });
    if (res.data.code === 0 && res.data.data) {
      sessions.value.unshift(res.data.data); currentSessionId.value = res.data.data.id; currentMessages.value = [];
      createSessionModalVisible.value = false; await loadMessages(); await nextTick(); scrollToBottomRealtime(); if (isMobile.value) showSessionDrawer.value = false;
    } else showErrorMessage(t('pages.aiChatPage.msgs.createFail'));
  } catch (e) { showErrorMessage(t('pages.aiChatPage.msgs.createError')); } finally { creatingSession.value = false; }
}

const startEditingSession = (id: number, name: string) => { sessionToUpdateId.value = id; updateSessionName.value = name || ''; updateSessionModalVisible.value = true; }
const cancelUpdateSession = () => { updateSessionModalVisible.value = false; sessionToUpdateId.value = null; updateSessionName.value = ''; }
const confirmUpdateSession = async () => { if (!sessionToUpdateId.value || !updateSessionName.value.trim()) return; try { updatingSession.value = true; const res = await updateSessionNameUsingPost({ id: sessionToUpdateId.value, sessionName: updateSessionName.value.trim() }); if (res.data.code === 0) { const s = sessions.value.find(x => x.id === sessionToUpdateId.value); if (s) s.sessionName = updateSessionName.value.trim(); showSuccessMessage(t('pages.aiChatPage.msgs.updateSuccess')); updateSessionModalVisible.value = false; } else showErrorMessage(t('pages.aiChatPage.msgs.updateFail')); } catch (e) { showErrorMessage(t('pages.aiChatPage.msgs.updateError')); } finally { updatingSession.value = false; } }

const handleSessionClick = async (id: number) => { try { const res = await switchSessionUsingPost({ sessionId: id }); if (res.data.code === 0) { currentSessionId.value = id; await loadMessages(); await nextTick(); scrollToBottom(true); if (isMobile.value) toggleSessionDrawer(); } else showErrorMessage(t('pages.aiChatPage.msgs.switchFail')); } catch (e) { showErrorMessage(t('pages.aiChatPage.msgs.switchError')); } }

const confirmDeleteSession = (id: number) => { showDeleteConfirmModal.value = true; sessionToDeleteId.value = id; }
const cancelDeleteSession = () => { showDeleteConfirmModal.value = false; sessionToDeleteId.value = null; }
const confirmDeleteSessionAction = async () => { if (!sessionToDeleteId.value) return; try { const res = await deleteSessionUsingPost({ sessionId: sessionToDeleteId.value }); if (res.data.code === 0) { sessions.value = sessions.value.filter(s => s.id !== sessionToDeleteId.value); if (currentSessionId.value === sessionToDeleteId.value) { if (sessions.value.length > 0) { currentSessionId.value = sessions.value[0].id; await loadMessages(); } else { currentSessionId.value = null; currentMessages.value = []; } } showSuccessMessage(t('pages.aiChatPage.msgs.delSuccess')); showDeleteConfirmModal.value = false; } else showErrorMessage(t('pages.aiChatPage.msgs.delFail')); } catch (e) { showErrorMessage(t('pages.aiChatPage.msgs.delError')); } }

const sendQuickMessage = (text: string) => {
  if (sendingMessage.value) return;
  if (text.includes(t('pages.aiChatPage.uploadPic')) || text.includes(t('pages.aiChatPage.msgs.uploadTo'))) {
    fileInputRef.value?.click();
    inputMessage.value = text;
    return;
  }
  inputMessage.value = text;
  sendMessage();
}

const sendQuickMessageWithImage = (text: string) => {
  if (sendingMessage.value) return;
  // 保存消息文本，等待图片上传
  inputMessage.value = text;
  // 触发文件选择器
  fileInputRef.value?.click();
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (e.isComposing || e.keyCode === 229) {
      return;
    }
    e.preventDefault();
    if (sendingMessage.value) {
      showErrorMessage(t('pages.aiChatPage.msgs.generatingWait'));
      return;
    }
    sendMessage();
  }
}

const sendMessage = async () => {
  if (sendingMessage.value) return;
  if (!inputMessage.value.trim() && !uploadedImageUrl.value) return;

  sendingMessage.value = true;

  // 1. 发送消息前，首先校验 AI Token 是否达到限额，避免产生无效的消息占位符
  try {
    const usageRes = await getAiTokenUsageUsingGet();
    if (usageRes.data?.code === 0 && usageRes.data?.data) {
      const { used5h, limit5h, usedWeek, limitWeek } = usageRes.data.data;
      if (Number(used5h) >= Number(limit5h)) {
        showErrorMessage(t('pages.aiChatPage.msgs.quota5hLimit'));
        sendingMessage.value = false;
        return;
      }
      if (Number(usedWeek) >= Number(limitWeek)) {
        showErrorMessage(t('pages.aiChatPage.msgs.quotaWeekLimit'));
        sendingMessage.value = false;
        return;
      }
    }
  } catch (e) {
    console.warn('AI Token 额度预检失败', e);
  }

  if (!currentSessionId.value) {
    try {
      // 固定创建一个初始默认名称的会话，以便触发后续的 AI 自动起名逻辑
      const res = await createSessionUsingPost({ sessionName: t('pages.aiChatPage.newSession') });
      if (res.data.code === 0 && res.data.data) {
        sessions.value.unshift(res.data.data);
        currentSessionId.value = res.data.data.id;
      } else {
        showErrorMessage(t('pages.aiChatPage.msgs.autoCreateFail'));
        sendingMessage.value = false;
        return;
      }
    } catch (e) {
      showErrorMessage(t('pages.aiChatPage.msgs.autoCreateError'));
      sendingMessage.value = false;
      return;
    }
  }

  const msg = inputMessage.value.trim(); inputMessage.value = '';
  nextTick(() => { document.querySelectorAll('.yuemu-text-input').forEach((el: any) => { el.style.height = 'auto'; el.style.overflowY = 'hidden'; }); });
  try {
    const uMsg: API.RagMessageVO = { id: Date.now(), localId: Date.now(), sessionId: currentSessionId.value, content: msg, userId: loginUser.value?.id, messageType: 1, createTime: new Date().toISOString() };
    currentMessages.value.push(uMsg); await nextTick(); scrollToBottomRealtime(true);

    aiThinking.value = true;
    const aiMsg: any = reactive({ id: Date.now() + 1, localId: Date.now() + 1, sessionId: currentSessionId.value, content: '...', userId: loginUser.value?.id, messageType: 2, createTime: new Date().toISOString(), isThinking: true, statusSteps: [] as string[] });
    currentMessages.value.push(aiMsg); await nextTick(); scrollToBottomRealtime(true);

    let finalMsg = msg;
    if (uploadedImageUrl.value) {
      if (uploadedImageMetadata.value) {
        const metadataJson = JSON.stringify(uploadedImageMetadata.value);
        finalMsg += `\n\n![图片](${uploadedImageUrl.value})\n[图片元数据:${metadataJson}]`;
      } else {
        finalMsg += `\n\n![图片](${uploadedImageUrl.value})`;
      }
      uMsg.content = finalMsg;
      clearImage();
    }

    const curS = sessions.value.find(s => s.id === currentSessionId.value);
    const isFirstMessage = currentMessages.value.filter(m => m.messageType === 1).length <= 1;

    const encoded = encodeURIComponent(finalMsg);
    const url = `/api/rag/qa/message/send/stream?message=${encoded}&sessionId=${currentSessionId.value}&model=${encodeURIComponent(selectedModel.value)}`;
    await new Promise<void>((resolve, reject) => { handleSseStreamWithEventSource(url, aiMsg, (err) => { if (err) { showErrorMessage(err.message || t('pages.aiChatPage.msgs.aiResponseError')); reject(err); } else resolve(); }); });

    // 流完成后，如果是第一轮对话且会话名称仍是默认值，则异步触发 AI 自动命名
    if (isFirstMessage && currentSessionId.value && curS && (curS.sessionName === t('pages.aiChatPage.newSession') || !curS.sessionName)) {
      tryAutoNameSession(currentSessionId.value)
    }
  } catch (e) { } finally { aiThinking.value = false; sendingMessage.value = false; }
}

const clearSessionContext = debounce(async () => { if (!currentSessionId.value) return; try { const res = await clearSessionContextUsingPost({ sessionId: currentSessionId.value }); if (res.data.code === 0) { if (res.data.data) { currentMessages.value.push(res.data.data); await nextTick(); scrollToBottomRealtime(); } showSuccessMessage(t('pages.aiChatPage.msgs.newTopicStarted')); } else showErrorMessage(t('pages.aiChatPage.msgs.resetFail')); } catch (e) { showErrorMessage(t('pages.aiChatPage.msgs.resetError')); } }, 300)
const scrollToBottom = (force = false) => {
  if (messagesContainerRef.value) {
    if (currentMessages.value.length === 0) {
      messagesContainerRef.value.scrollTop = 0;
    } else {
      if (force || !showScrollToBottom.value) {
        messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
      }
    }
  }
}

const scrollToBottomRealtime = (force = false) => {
  if (messagesContainerRef.value) {
    requestAnimationFrame(() => {
      if (messagesContainerRef.value) {
        if (currentMessages.value.length === 0) {
          messagesContainerRef.value.scrollTop = 0;
        } else {
          if (force || !showScrollToBottom.value) {
            messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
          }
        }
      }
    });
  }
}
const handleMessagesScroll = debounce(() => { const el = messagesContainerRef.value; if (!el) return; savedScrollTop = el.scrollTop; showScrollToBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight >= 150; if (el.scrollTop <= 20 && !messageLoadingMore.value && !loadingMessages.value && messageHasMore.value) loadMoreMessages(); }, 200);
const handleSessionListScroll = () => { const el = sessionListRef.value; if (el && el.scrollHeight - el.scrollTop <= el.clientHeight + 10) loadMoreSessions(); }

watch(isMobile, (val) => { if (!val) showSessionDrawer.value = false; });
const showSuccessMessage = (msg: string) => { messageText.value = msg; messageType.value = 'success'; showMessage.value = true; setTimeout(() => showMessage.value = false, 3000); }
const showErrorMessage = (msg: string) => { messageText.value = msg; messageType.value = 'error'; showMessage.value = true; setTimeout(() => showMessage.value = false, 3000); }
const getCurrentSessionName = () => { const s = sessions.value.find(x => x.id === currentSessionId.value); return s ? s.sessionName || t('pages.aiChatPage.newSession') : t('pages.aiChatPage.msgs.selectOrCreateSession'); };
const router = useRouter()
const { t } = useI18n(); const goBack = () => router.go(-1);

const handleChatAreaClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const aLink = target.closest('a');
  if (aLink) {
    const href = aLink.getAttribute('href');
    if (href && href.startsWith('/')) {
      if (
        href.startsWith('/picture/') ||
        href.startsWith('/picture-redirect/') ||
        href.startsWith('/user/') ||
        href.startsWith('/space/') ||
        href.startsWith('/post/')
      ) {
        event.preventDefault(); // 阻止浏览器网页刷新
        router.push(href); // 丝滑的前端路由跳转
      }
    }
  }
};

const handleAiTokenUsageUpdated = (event: Event) => {
  const customEvent = event as CustomEvent;
  aiTokenUsage.value = customEvent.detail;
};

const initAiTokenWebSocket = () => {
  if (loginUser.value && loginUser.value.id) {
    aiTokenWebSocketService.connect(loginUser.value.id);
  }
  window.addEventListener('aiTokenUsageUpdated', handleAiTokenUsageUpdated);
};

const destroyAiTokenWebSocket = () => {
  aiTokenWebSocketService.disconnect();
  window.removeEventListener('aiTokenUsageUpdated', handleAiTokenUsageUpdated);
};

onMounted(() => {
  checkIsMobile(); window.addEventListener('resize', checkIsMobile);
  loadSessions();
  initAiTokenWebSocket();
  nextTick(() => { if (sessionListRef.value) sessionListRef.value.addEventListener('scroll', handleSessionListScroll); if (messagesContainerRef.value) messagesContainerRef.value.addEventListener('scroll', handleMessagesScroll); });

  // 点击外部关闭弹窗菜单
  document.addEventListener('click', () => {
    if (showImageUploadMenu.value) {
      showImageUploadMenu.value = false;
    }
    if (showPcMoreActions.value) {
      showPcMoreActions.value = false;
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
  if (sessionListRef.value) sessionListRef.value.removeEventListener('scroll', handleSessionListScroll);
  if (messagesContainerRef.value) messagesContainerRef.value.removeEventListener('scroll', handleMessagesScroll);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (currentEventSource) {
    currentEventSource.close();
    currentEventSource = null;
  }
  destroyAiTokenWebSocket();
});

let savedScrollTop = 0;
onDeactivated(() => {
  destroyAiTokenWebSocket();
  // 如果容器的 scrollTop 大于 0，说明浏览器还没重置它，存下来
  if (messagesContainerRef.value && messagesContainerRef.value.scrollTop > 0) {
    savedScrollTop = messagesContainerRef.value.scrollTop;
  }
});
onActivated(async () => {
  initAiTokenWebSocket();

  if (currentSessionId.value) {
    // 重新拉取当前会话的消息，防止在后台路由切换时连接断开漏掉数据
    // loadMessages 内部带有 checkAndReconnectStream()，若服务端还在生成会主动接力重连 SSE
    await loadMessages();
  }

  if (messagesContainerRef.value && savedScrollTop > 0) {
    // 使用 requestAnimationFrame 和 setTimeout 双重保证，确保布局重绘完成
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (messagesContainerRef.value) {
          messagesContainerRef.value.scrollTop = savedScrollTop;
        }
      }, 50);
    });
  }
});
</script>

<style scoped lang="scss">
/* 适配 Ant Design Vue 下拉框深色主题 */
.yuemu-ant-select {
  border-radius: 12px;
}
:deep(.ant-select-selector) {
  border-radius: 12px !important;
  background-color: var(--card-background) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
  transition: all 0.3s ease !important;
}
:deep(.ant-select-selector:hover) {
  border-color: var(--link-color) !important;
}
:deep(.ant-select-arrow) {
  color: var(--text-secondary) !important;
}
:deep(.ant-select-dropdown) {
  background-color: var(--card-background) !important;
  border: 1px solid var(--border-color) !important;
}
:deep(.ant-select-item) {
  color: var(--text-primary) !important;
}
:deep(.ant-select-item-option-active), :deep(.ant-select-item-option-selected) {
  background-color: var(--hover-background) !important;
}

* { box-sizing: border-box; }
button, input { font-family: var(--font-family-base); outline: none; }

.yuemu-ai-chat-page {
  display: flex; height: 92vh; max-width: 1400px; margin: 0 auto;
  background: var(--background); color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  transition: var(--theme-transition);
  @media (max-width: 768px) { height: 100vh; max-width: 100vw; width: 100vw; }
}

/* ================== 左侧边栏 ================== */
.session-sidebar {
  width: 280px; height: 100%; background: var(--card-background); border-right: 1px solid var(--border-color);
  display: flex; flex-direction: column; transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s;  flex-shrink: 0;
  @media (max-width: 768px) { position: fixed; left: 0; top: 0; z-index: 1000; transform: translateX(-100%); box-shadow: 4px 0 24px var(--shadow-color); &.drawer-open { transform: translateX(0); } }
  @media (min-width: 769px) { &.collapsed { margin-left: -280px; opacity: 0; } }
  .session-header { padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
    .new-session-btn { flex: 1; padding: 12px; background: var(--nav-item-active); color: var(--nav-item-active-text); border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--theme-transition); &:hover { opacity: 0.9; transform: translateY(-1px); } }
    .resource-btn { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-background); color: var(--text-secondary); font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; &:hover { background: var(--hover-background); color: var(--link-color); border-color: var(--link-color); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); } }
    .mobile-close-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; color: var(--text-secondary); font-size: 18px; display: flex; align-items: center; justify-content: center; &:hover { background: var(--hover-background); } } }
  .session-list { flex: 1; overflow-y: auto; padding: 8px; scrollbar-width: none; &::-webkit-scrollbar { display: none; }
    .session-item { padding: 12px 14px; margin-bottom: 4px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-primary); transition: var(--theme-transition);
      .session-icon { font-size: 14px; color: var(--text-secondary); opacity: 0.7; }
      .session-name { flex: 1; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .session-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; .action-btn { width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: var(--border-color); color: var(--link-color); } &.delete:hover { color: var(--like-button-active-color); } } }
      &:hover { background: var(--hover-background); .session-actions { opacity: 1; } }
      &.active { background: var(--nav-item-active); color: var(--nav-item-active-text); .session-icon { color: var(--nav-item-active-text); opacity: 1; } .session-actions { opacity: 1; } } }
    .loading, .load-more, .empty-session { padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px; i { font-size: 20px; color: var(--link-color); } } }
  .sidebar-footer { padding: 12px 16px; border-top: 1px solid var(--border-color);
    .mini-quota-container {
      display: flex; flex-direction: column; gap: 8px; cursor: pointer; padding: 4px 0;

      .mini-quota-summary {
        display: flex; justify-content: space-between; align-items: center;

        .summary-left {
          display: flex; align-items: center; gap: 6px;

          .summary-dot {
            width: 6px; height: 6px; border-radius: 50%; background: #10b981;
            &.pulsing { animation: dot-pulse 2s infinite; }
          }

          .summary-text { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
        }

        .info-icon { font-size: 11px; color: var(--text-tertiary); opacity: 0.8; }
      }

      .quota-progress-compact {
        height: 4px; background: var(--hover-background); border-radius: 2px; overflow: hidden;
        .quota-progress-inner {
          height: 100%; background: var(--link-color); border-radius: 2px; transition: width 0.3s ease;
          &.is-warning { background: #ff4d4f; }
        }
      }

      .quota-footer-compact {
        display: flex; justify-content: space-between; align-items: center; margin-top: 2px;

        .quota-tier {
          font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 6px;
          &.tier-0 { background: var(--hover-background); color: var(--text-secondary); }
          &.tier-1 { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
          &.tier-2 { background: rgba(250, 173, 20, 0.1); color: #faad14; }
        }

        .quota-link {
          font-size: 11px; color: var(--text-tertiary); cursor: pointer; transition: color 0.2s;
          display: flex; align-items: center; gap: 4px;
          &:hover { color: var(--link-color); }
        }
      }
    }
  }
}

/* Popover 内置样式 */
:deep(.quota-popover) {
  .ant-popover-inner {
    background-color: var(--card-background) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px var(--shadow-color) !important;
    padding: 0 !important;
  }
  .ant-popover-inner-content {
    color: var(--text-primary) !important;
    padding: 16px !important;
  }
  .ant-popover-arrow {
    display: none !important;
  }
}

.quota-popover-content {
  width: 230px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  .popover-title {
    margin: 0; font-size: 13px; font-weight: 700; color: var(--text-primary);
    border-bottom: 1px solid var(--border-color); padding-bottom: 8px;
  }

  .popover-item {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .item-header {
      display: flex; justify-content: space-between; align-items: center;

      .item-label {
        font-size: 11px; font-weight: 500; color: var(--text-secondary);
        display: flex; align-items: center; gap: 4px;
        i { color: var(--link-color); width: 14px; text-align: center; }
      }

      .item-val {
        font-size: 11px; font-family: 'Inter', -apple-system, sans-serif;
        color: var(--text-primary); font-weight: 600;
      }
    }

    .item-bar {
      height: 4px; background: var(--hover-background); border-radius: 2px; overflow: hidden;
      .item-bar-inner {
        height: 100%; background: var(--link-color); border-radius: 2px; transition: width 0.3s ease;
        &.is-warning { background: #ff4d4f; }
      }
    }
  }
}

@keyframes dot-pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* ================== 主区 & 头部 ================== */
.chat-container {
  flex: 1; display: flex; flex-direction: column; background: var(--chat-page-bg, var(--background));
  position: relative; overflow-x: hidden; width: 100%;
  .pc-header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: var(--chat-page-bg, var(--background)); z-index: 10; .pc-sidebar-toggle { width: 40px; height: 40px; border-radius: 50%; border: none; background: transparent; color: var(--text-secondary); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--theme-transition); &:hover { background: var(--hover-background); color: var(--text-primary); } } .session-title-text { font-size: 16px; font-weight: 600; margin: 0; color: var(--text-primary); flex: 1; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .pc-back-btn { width: 40px; height: 40px; border-radius: 50%; border: none; background: transparent; color: var(--text-secondary); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--theme-transition); &:hover { background: var(--hover-background); color: var(--text-primary); } } }
  .mobile-header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--header-background); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border-color); z-index: 10; button { width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; color: var(--text-primary); font-size: 18px; display: flex; align-items: center; justify-content: center; } .mobile-title { font-size: 16px; font-weight: 600; color: var(--text-primary); flex: 1; text-align: center; padding: 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } }

  /* ================== 消息列表区 ================== */
  .chat-messages-wrapper { flex: 1; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; &::-webkit-scrollbar { display: none; } }
  .chat-messages-content { max-width: 880px; width: 100%; margin: 0 auto; padding: 24px 16px 130px; @media (max-width: 768px) { padding: 16px 12px 110px; } }

  .yuemu-welcome-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; padding: 20px;
    .welcome-sparkle { font-size: 48px; color: var(--link-color); margin-bottom: 24px; animation: float 3s ease-in-out infinite; }
    h2 { font-size: 28px; font-weight: 600; margin: 0 0 12px; color: var(--text-primary); }
    .welcome-subtitle { font-size: 16px; color: var(--text-secondary); margin: 0 0 40px; }
    .yuemu-suggestion-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; width: 100%; max-width: 900px;
      @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
      @media (max-width: 768px) { grid-template-columns: 1fr; gap: 8px; padding: 0 4px; }
      .yuemu-suggestion-card {
        background: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px;
        display: flex; align-items: flex-start; gap: 16px; cursor: pointer; text-align: left;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.02);

        @media (max-width: 768px) {
          padding: 10px;
          gap: 10px;
          border-radius: 12px;
          align-items: center; /* 居中对齐，让小空间更紧凑 */
        }

        &:hover { transform: translateY(-4px); border-color: var(--link-color); box-shadow: 0 12px 24px rgba(0,0,0,0.08); .sugg-icon { transform: scale(1.1) rotate(5deg); } }

        /* 特色卡片样式 - Gemini风格淡蓝色 */
        &.featured {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, rgba(138, 180, 248, 0.08), rgba(174, 203, 250, 0.08));
          border: 2px solid rgba(138, 180, 248, 0.4);
          padding: 20px;
          @media (max-width: 768px) { padding: 12px; }
          .sugg-icon.gradient {
            background: linear-gradient(135deg, #8ab4f8, #aecbfa);
            box-shadow: 0 4px 12px rgba(138, 180, 248, 0.3);
          }
          .sugg-title {
            font-size: 16px;
            font-weight: 700;
            background: linear-gradient(135deg, #8ab4f8, #aecbfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          &:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 32px rgba(138, 180, 248, 0.2);
          }
        }

        .sugg-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; flex-shrink: 0; transition: transform 0.3s;
          @media (max-width: 768px) { width: 32px; height: 32px; border-radius: 8px; font-size: 14px; }
          &.blue { background: linear-gradient(135deg, #4285f4, #669df6); }
          &.cyan { background: linear-gradient(135deg, #00bcd4, #4dd0e1); }
          &.light-blue { background: linear-gradient(135deg, #64b5f6, #90caf9); }
          &.purple { background: linear-gradient(135deg, #9c27b0, #ba68c8); }
          &.orange { background: linear-gradient(135deg, #ff9800, #ffb74d); }
          &.pink { background: linear-gradient(135deg, #e91e63, #f06292); }
          &.teal { background: linear-gradient(135deg, #009688, #4db6ac); }
          &.indigo { background: linear-gradient(135deg, #3f51b5, #7986cb); }
        }
        .sugg-text { display: flex; flex-direction: column; gap: 4px; min-width: 0;
          .sugg-title { font-size: 15px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; @media (max-width: 768px) { font-size: 13px; } }
          .sugg-desc { font-size: 13px; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; @media (max-width: 768px) { font-size: 11px; -webkit-line-clamp: 2; margin-top: 0; } }
        }
      }
    }
  }

  .timestamp-divider { text-align: center; margin: 32px 0; span { background: var(--hover-background); color: var(--text-secondary); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; } }
  .loading-state, .top-loading { text-align: center; padding: 20px; color: var(--text-secondary); font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; i { color: var(--link-color); } }

  .message-item {
    display: flex; gap: 16px; margin-bottom: 32px; width: 100%; max-width: 100%;
    @media (max-width: 768px) { gap: 8px; margin-bottom: 24px; }

    .yuemu-avatar {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      position: relative;

      /* 移动端水平布局，填充信息区 */
      @media (max-width: 768px) {
        width: 100%;
        height: auto;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 12px;
        margin-bottom: 6px;
      }

      .avatar-wrapper {
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        @media (max-width: 768px) { width: 32px; height: 32px; }

        .rotating-halo {
          position: absolute; inset: -4px; border-radius: 50%;
          background: conic-gradient(from 0deg, #4285f4 0%, #ea4335 25%, #fbbc04 50%, #34a853 75%, #4285f4 100%);
          animation: rotate-halo 1.5s linear infinite;
          filter: blur(4px); opacity: 0.85; z-index: 0;
          @media (max-width: 768px) { inset: -3px; filter: blur(3px); }
        }
        .sparkle-bg {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--chat-page-bg, var(--background));
          color: var(--text-primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; position: relative; z-index: 1; transition: transform 0.3s;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
          @media (max-width: 768px) { width: 32px; height: 32px; font-size: 14px; }
          .ai-avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        }
        &.is-thinking .sparkle-bg { animation: pulse-scale 2s ease-in-out infinite; color: var(--link-color); }
      }

      .yuemu-mobile-avatar-info {
        display: flex; align-items: center; gap: 8px; flex: 1;
        .yuemu-ai-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .yuemu-ai-time { font-size: 12px; color: var(--text-secondary); }
        .yuemu-ai-model { margin-left: auto; font-size: 11px; background: var(--hover-background); padding: 4px 8px; border-radius: 12px; color: var(--text-secondary); font-weight: 500; }
      }
    }

    .message-content-box {
      display: flex;
      flex-direction: column;
      max-width: calc(100% - 52px);
      position: relative;
      @media (max-width: 768px) {
        max-width: 100%;
        width: 100%;
      }
      .message-actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; opacity: 0; transition: opacity 0.2s;
        @media (max-width: 768px) { opacity: 1; margin-top: 0; margin-left: auto; gap: 8px; }
        .time { font-size: 12px; color: var(--text-secondary); @media (max-width: 768px) { display: none; } }
        .action-icon {
          background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 14px; transition: color 0.2s; padding: 4px;
          @media (max-width: 768px) { font-size: 16px; padding: 4px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
          &:hover { color: var(--link-color); }
        }
      }
    }

    &:hover .message-actions { opacity: 1; }

    &.system-message {
      justify-content: center;
      .message-content-box {
        align-items: center;
        max-width: 100%;
        text-align: center;
        .message-actions { justify-content: center; margin: 4px auto 0; width: 100%; text-align: center; }
      }
      .yuemu-message-bubble {
        color: var(--text-primary);
        border-radius: 20px;
        padding: 10px 20px;
        font-size: 14px;
        display: inline-block;
        font-weight: 500;
      }
    }

    &.user-message {
      justify-content: flex-end; .message-content-box { align-items: flex-end; max-width: 90%; }
      .yuemu-message-bubble {
        background: var(--chat-message-sender-background, var(--link-color));
        color: var(--chat-message-sender-text, var(--text-other));
        border-radius: 24px 24px 4px 24px; padding: 12px 20px; font-size: 15px; line-height: 1.6; word-break: break-word;
        display: inline-block; width: fit-content;
        max-width: 420px; /* 限制用户消息气泡最大宽度，避免短文本+图片被横向拉伸过宽，且让文本自动折行 */
        @media (max-width: 768px) { padding: 10px 14px; border-radius: 20px 20px 4px 20px; font-size: 14.5px; max-width: 85%; }

        .yuemu-gallery-grid, .message-attachments { margin-top: 8px; }

        /* 用户发送的图片保持合适尺寸，不占满气泡 */
        .yuemu-gallery-grid {
          display: inline-flex;
          flex-direction: column;
          gap: 8px;
          .gallery-item {
            width: auto;
            max-width: 200px;
            min-width: 140px;
            @media (max-width: 768px) {
              max-width: 180px;
              min-width: 120px;
            }
            .attachment-img-wrap {
              width: 100%;
              aspect-ratio: 1 / 1;
              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                border-radius: 8px;
              }
            }
            .gallery-caption {
              display: none; /* 用户消息不显示标题 */
            }
          }
        }
      }
      .markdown-body {
        color: inherit;
        :deep(p) { margin: 0 0 0.5em 0; } :deep(p:last-child) { margin-bottom: 0; }
        :deep(img) {
          max-width: 200px;
          display: block;
          border-radius: 8px;
          @media (max-width: 768px) {
            max-width: 180px;
          }
        }
      }
      .message-actions { display: none; }
    }

    &.assistant-message {
      justify-content: flex-start;
      @media (max-width: 768px) { flex-direction: column; gap: 0; .message-content-box { max-width: 100%; } }

      .yuemu-message-bubble {
        color: var(--text-primary); font-size: 15.5px; line-height: 1.7; padding: 16px 20px; max-width: 100%; word-break: break-word; background: rgba(0, 0, 0, 0.02); border-radius: 16px;
        display: inline-block; width: fit-content;
        @media (max-width: 768px) { font-size: 15px; padding: 12px 16px; border-radius: 12px; overflow-wrap: break-word; }
        @media (prefers-color-scheme: dark) { background: rgba(255, 255, 255, 0.03); }

        .yuemu-gallery-grid, .message-attachments { margin-top: 8px; }
      }

      .yuemu-markdown {
        max-width: 100%;
        :deep(p) { margin: 0 0 0.8em 0; color: var(--markdown-text, var(--text-primary)); }
        :deep(*:first-child) { margin-top: 0 !important; }
        :deep(*:last-child) { margin-bottom: 0 !important; }
        :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) { color: var(--markdown-heading-text, var(--text-primary)); margin: 1.2em 0 0.6em; font-weight: 600; line-height: 1.3; }
        :deep(a) { color: var(--markdown-link-text, var(--link-color)); text-decoration: none; &:hover { text-decoration: underline; color: var(--link-hover-color); } }
        :deep(pre) { background: var(--markdown-code-bg, var(--code-background)); border: 1px solid var(--markdown-border, var(--border-color)); border-radius: 12px; padding: 16px; margin: 1em 0; overflow-x: auto; max-width: 100%; color: var(--markdown-code-text, var(--text-primary)); @media (max-width: 768px) { padding: 12px; border-radius: 8px; } }
        :deep(code) { font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; background: var(--markdown-code-bg, var(--hover-background)); color: var(--markdown-code-text, #e83e8c); padding: 3px 6px; border-radius: 6px; }
        :deep(pre code) { background: transparent; padding: 0; color: inherit; border-radius: 0; }
        :deep(blockquote) { margin: 1em 0; padding: 12px 16px; background: var(--markdown-blockquote-bg, var(--blockquote-background)); border-left: 4px solid var(--markdown-blockquote-border, var(--link-color)); color: var(--markdown-blockquote-text, var(--text-secondary)); border-radius: 0 8px 8px 0; }
        :deep(ul), :deep(ol) { padding-left: 1.5em; margin: 0.8em 0; color: var(--markdown-text, var(--text-primary)); } :deep(li) { margin: 0.4em 0; }
        :deep(table) { width: max-content; border-collapse: collapse; margin: 1em 0;  border-radius: 8px; overflow: hidden; box-shadow: 0 0 0 1px var(--markdown-table-border, var(--border-color)); display: block; overflow-x: auto; max-width: 100%; }
        :deep(th), :deep(td) { padding: 10px 12px; border: 1px solid var(--markdown-table-border, var(--border-color)); white-space: nowrap; }
        :deep(th) { background: var(--markdown-table-header-bg, var(--hover-background)); font-weight: 600; text-align: left; }
        :deep(strong), :deep(b) { font-weight: 700 !important; color: var(--text-primary) !important; }
      }
    }
  }

  /* <i class="fas fa-fire"></i> 新增的：智能图库网格引擎专属样式 */
  .yuemu-gallery-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0;
    max-width: 100%;

    @media (max-width: 768px) {
      gap: 4px;
      margin: 6px 0;
    }

    .gallery-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-radius: 12px;
      padding: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);

      /* 基础形态：电脑端一行3个，防止过大过小 */
      width: calc(33.333% - 4px);
      min-width: 180px;
      max-width: 260px;

      @media (max-width: 768px) {
        /* 移动端形态：一行2个，更紧凑的间距 */
        width: calc(50% - 2px);
        min-width: 140px;
        max-width: none;
        gap: 4px;
        padding: 4px;
        border-radius: 8px;
      }

      .attachment-img-wrap {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        background: var(--hover-background);

        @media (max-width: 768px) {
          border-radius: 6px;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
          /* 加速渲染质量 */
          image-rendering: -webkit-optimize-contrast;
        }
        &:hover img { transform: scale(1.05); }

        .img-error-mask {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: var(--hover-background); color: var(--text-secondary); font-size: 24px;
          @media (max-width: 768px) { font-size: 18px; }
        }
      }

      .gallery-caption {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.4;
        text-align: center;
        padding: 0 4px;
        background: transparent !important;

        @media (max-width: 768px) {
          font-size: 12px;
          padding: 0 2px;
        }

        /* 强力强制单行显示，超出显示省略号，对子容器实施全面深度穿透控制 */
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;

        :deep(p) {
          margin: 0 !important;
          color: inherit;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          display: inline !important;
          max-width: 100% !important;
        }
        :deep(strong) {
          color: var(--text-primary);
          white-space: nowrap !important;
        }
        :deep(a), :deep(em) {
          display: inline-block !important;
          max-width: 100% !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          vertical-align: bottom !important;
        }
        :deep(*) {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
        }
      }
    }
  }

  .yuemu-tool-steps { background: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; width: fit-content; min-width: 260px; max-width: 100%; margin-bottom: 16px; box-shadow: var(--shadow-color); overflow: hidden; .tool-steps-header { padding: 14px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border-color); background: var(--hover-background); .pulse-ring { width: 10px; height: 10px; border-radius: 50%; background: var(--link-color); animation: pulse-dot 1.5s infinite; } span { font-size: 14px; font-weight: 600; color: var(--link-color); } } .tool-steps-list { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; .tool-step-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); .active-icon { color: var(--link-color); } .done-icon { color: var(--ai-avatar-background, #10b981); } &.step-active { color: var(--text-primary); font-weight: 500; } } } }
  .yuemu-steps-summary { background: var(--hover-background); border: 1px solid var(--border-color); border-radius: 14px; width: fit-content; min-width: 260px; max-width: 100%; margin-bottom: 16px; overflow: hidden; .steps-summary-header { padding: 12px 16px; display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; color: var(--text-secondary); transition: var(--theme-transition); &:hover { background: var(--border-color); color: var(--text-primary); } .chevron { margin-left: auto; transition: transform 0.2s; &.is-open { transform: rotate(180deg); } } } .steps-summary-list { border-top: 1px solid var(--border-color); padding: 10px 16px 14px; display: flex; flex-direction: column; gap: 10px; .steps-summary-item { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 10px; i { color: var(--ai-avatar-background, #10b981); } } } }

  .message-attachments {
    display: flex; flex-wrap: wrap; gap: 10px; margin: 8px 0; max-width: 100%;
  }

  .clear-context-btn-wrap { text-align: center; margin: 24px 0 16px; .yuemu-chip-btn { background: var(--card-background); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 10px 20px; border-radius: 24px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: var(--shadow-color); transition: var(--theme-transition); &:hover { color: var(--link-color); border-color: var(--link-color); transform: translateY(-2px); } } }

  .yuemu-input-wrapper {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 100; pointer-events: none;
    background: linear-gradient(to bottom, transparent 0%, var(--chat-page-bg, var(--background)) 35%, var(--chat-page-bg, var(--background)) 100%);
    display: flex; flex-direction: column; align-items: center;
    padding: 16px 16px max(env(safe-area-inset-bottom), 16px); box-sizing: border-box; width: 100%; max-width: 100vw;
    @media (max-width: 768px) { padding: 12px 12px max(env(safe-area-inset-bottom), 12px); overflow-x: hidden; }
  }

  .yuemu-quick-actions {
    pointer-events: auto; width: 100%; max-width: 820px; display: flex; gap: 8px; overflow-x: auto; margin-bottom: 8px; padding-top: 4px; box-sizing: border-box;
    @media (max-width: 768px) { max-width: 100%; padding-left: 0; padding-right: 0; scrollbar-width: none; gap: 6px; &::-webkit-scrollbar { display: none; } }
    @media (min-width: 769px) { scrollbar-width: thin; scrollbar-color: var(--border-color) transparent; &::-webkit-scrollbar { height: 6px; } &::-webkit-scrollbar-track { background: transparent; } &::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; &:hover { background: var(--text-secondary); } } }

    .quick-action-chip {
      flex-shrink: 0; padding: 6px 14px; border-radius: 20px;
      background: var(--hover-background); border: 1px solid var(--border-color);
      color: var(--text-secondary); font-size: 13px; font-weight: 500;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      transition: all 0.2s ease; white-space: nowrap;
      @media (max-width: 768px) { padding: 5px 11px; font-size: 12px; gap: 4px; i { font-size: 11px; } }

      i { color: var(--text-secondary); transition: color 0.2s; }

      &:hover {
        color: var(--text-primary);
        background: var(--border-color);
        i { color: var(--text-primary); }
      }
      &:active { transform: scale(0.97); }

      /* 特色推荐小药丸 - 仅加粗与微调深描边，不做大面积黑白反色块，确保全局纯净简约 */
      &.featured {
        font-weight: 600;
        border-color: var(--text-secondary);
        color: var(--text-primary);
        i { color: var(--text-primary); }
      }
    }
  }

  .yuemu-input-container {
    pointer-events: auto; width: 100%; max-width: 820px; background: var(--chat-input-background, var(--card-background)); border: 1px solid var(--chat-input-border, var(--border-color)); border-radius: 32px; box-shadow: 0 4px 24px var(--shadow-color); display: flex; flex-direction: column; transition: box-shadow 0.3s; box-sizing: border-box;
    &:focus-within { box-shadow: 0 8px 32px var(--shadow-color), 0 0 0 1px var(--link-color); }
    @media (max-width: 768px) { border-radius: 24px; max-width: 100%; margin: 0; }

    .input-preview-bar { padding: 12px 16px 0; display: flex; gap: 10px; .preview-card { width: 64px; height: 64px; border-radius: 12px; position: relative; border: 1px solid var(--border-color); overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; } .remove-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; } .upload-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; } } }
    .input-main-row { display: flex; align-items: flex-end; padding: 8px 12px; gap: 8px; @media (max-width: 768px) {  gap: 6px; }
      .upload-menu-wrapper {
        position: relative;

        .upload-menu {
          position: fixed;
          bottom: auto;
          left: 0;
          width: 180px;
          margin-bottom: 0;
          background: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 8px 24px var(--shadow-color);
          overflow: hidden;


          @media (min-width: 769px) {
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 8px;
            min-width: 160px;
            width: auto;
          }

          .menu-item {
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: transparent;
            color: var(--text-primary);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: background 0.2s;
            text-align: left;

            @media (max-width: 768px) {
              padding: 14px 16px;
              font-size: 14px;
            }

            i {
              color: var(--link-color);
              font-size: 16px;
              width: 20px;
              text-align: center;
              flex-shrink: 0;

              @media (max-width: 768px) {
                font-size: 17px;
                width: 20px;
              }
            }

            span {
              flex: 1;
            }

            &:hover {
              background: var(--hover-background);
            }

            &:active {
              transform: scale(0.98);
            }

            & + .menu-item {
              border-top: 1px solid var(--border-color);
            }
          }
        }
      }

      .circle-btn { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; border: none; background: transparent; color: var(--interaction-button-color); font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--theme-transition); position: relative; @media (max-width: 768px) { width: 36px; height: 36px; font-size: 18px; } &:hover:not(:disabled) { background: var(--interaction-button-hover-color, var(--hover-background)); color: var(--text-primary); } &:disabled { opacity: 0.4; cursor: not-allowed; } }
      .yuemu-text-input { flex: 1; border: none; background: transparent; color: var(--chat-input-text, var(--text-primary)); font-size: 16px; padding: 12px 8px; outline: none; line-height: 1.4; resize: none; font-family: inherit; box-sizing: border-box; @media (max-width: 768px) { font-size: 15px; padding: 8px 4px; } &::placeholder { color: var(--chat-input-placeholder, var(--text-secondary)); } }
      .mic-btn { &.is-recording { background: var(--like-button-active-color); color: #fff; .mic-waves { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 3px; span { width: 3px; height: 14px; background: #fff; border-radius: 2px; animation: mic-wave 1s infinite; &:nth-child(2){animation-delay:0.2s;} &:nth-child(3){animation-delay:0.4s;} } } i { display: none; } } }
      .send-btn { color: var(--text-secondary); opacity: 0.5;
        &.active:not(:disabled) { background: var(--link-color); color: var(--text-other); opacity: 1; box-shadow: 0 4px 12px rgba(0,0,0,0.1); &:hover { background: var(--link-hover-color); transform: scale(1.05); } }
      }
    }
  }
  .yuemu-disclaimer { margin-top: 8px; text-align: center; font-size: 12px; color: var(--text-secondary); opacity: 0.8; pointer-events: auto; @media (max-width: 768px) { display: none; } }

  .scroll-bottom-fab { position: absolute; right: 24px; bottom: 160px; width: 44px; height: 44px; border-radius: 50%; background: var(--card-background); border: 1px solid var(--border-color); color: var(--text-secondary); box-shadow: 0 4px 16px var(--shadow-color); z-index: 99; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: all 0.3s; transform: translateY(20px); font-size: 18px; &.visible { opacity: 1; pointer-events: auto; transform: translateY(0); } &:hover { color: var(--link-color); } @media (max-width: 768px) { bottom: 130px; right: 16px; } }
}

/* ================== 基础模态框 / 覆盖层 ================== */
.drawer-mask { position: fixed; inset: 0; background: var(--comment-drawer-backdrop, rgba(0,0,0,0.5)); backdrop-filter: blur(4px); z-index: 200; }

.yuemu-modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--comment-drawer-backdrop, rgba(0,0,0,0.5)); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 3000;
  padding: 20px;

  .yuemu-modal-box {
    width: 100%; max-width: 400px; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 20px; box-shadow: 0 16px 48px var(--shadow-color); padding: 24px; display: flex; flex-direction: column; gap: 16px; margin: 0 auto;
    h3 { margin: 0; font-size: 18px; color: var(--text-primary); font-weight: 600; }
    .modal-desc { margin: 0; font-size: 15px; color: var(--text-secondary); line-height: 1.5; }
    .modal-input { width: 100%; padding: 14px 16px; background: var(--hover-background); border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-primary); font-size: 15px; outline: none; transition: var(--theme-transition); box-sizing: border-box; &:focus { border-color: var(--link-color); background: var(--card-background); } }
    .modal-actions-standard { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; button { padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; border: none; cursor: pointer; transition: var(--theme-transition); } .btn-text { background: transparent; color: var(--text-secondary); &:hover { background: var(--hover-background); color: var(--text-primary); } } .btn-primary { background: var(--link-color); color: var(--text-other); &:hover:not(:disabled) { background: var(--link-hover-color); } &:disabled { opacity: 0.5; cursor: not-allowed; } } .btn-danger { background: var(--like-button-active-color); color: var(--text-other); &:hover { background: var(--like-button-hover-color); } } }
  }

  &.voice-overlay { align-items: flex-end; @media (min-width: 769px) { align-items: center; } }
  &.voice-overlay .voice-modal-box {
    max-width: 400px; padding: 0; overflow: hidden;
    background: var(--card-background); border-radius: 32px;
    @media (max-width: 768px) { border-radius: 32px 32px 16px 16px; margin-bottom: 16px; }

    .voice-content {
      min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px;
      position: relative; background: linear-gradient(180deg, var(--hover-background) 0%, transparent 100%);
      .voice-status-text { position: absolute; top: 16px; font-size: 13px; font-weight: 600; color: var(--link-color); padding: 4px 12px; background: rgba(37,99,235,0.1); border-radius: 20px; }
      .text { font-size: 20px; font-weight: 500; color: var(--text-primary); text-align: center; margin: 0; line-height: 1.5; z-index: 10; }
      .placeholder { font-size: 16px; color: var(--text-secondary); opacity: 0.7; z-index: 10; }
      .visualizer {
        display: flex; gap: 4px; height: 40px; align-items: center; margin-top: 32px;
        span { width: 4px; height: 6px; background: var(--link-color); border-radius: 4px; transition: height 0.2s; opacity: 0.3; }
        &.is-active span { opacity: 1; animation: voiceWaveUI 1s infinite; animation-delay: var(--delay); }
      }
    }
    .modal-actions {
      display: flex; height: 64px; border-top: 1px solid var(--border-color); background: var(--card-background);
      .voice-divider { width: 1px; height: 100%; background: var(--border-color); }
      button { flex: 1; border: none; background: transparent; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
      .btn-cancel { color: var(--text-secondary); &:hover { background: var(--hover-background); } }
      .btn-confirm { color: var(--link-color); &:hover:not(:disabled) { background: var(--hover-background); } &:disabled { color: var(--text-secondary); opacity: 0.4; cursor: not-allowed; } }
    }
  }
}

.global-toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 500; z-index: 4000; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 24px var(--shadow-color); transition: var(--theme-transition); &.success { background: var(--ai-avatar-background, #10b981); color: var(--text-other); } &.error { background: var(--like-button-active-color); color: var(--text-other); } }


/* ================== 动画序列 ================== */
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes pulse-dot { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

@keyframes rotate-halo { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes pulse-scale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
@keyframes spin-sparkle { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.2); } 100% { transform: rotate(360deg) scale(1); } }
@keyframes mic-wave { 0%, 100% { height: 8px; } 50% { height: 20px; } }
@keyframes voiceWaveUI { 0%, 100% { height: 6px; } 50% { height: 40px; } }
.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.25s cubic-bezier(0.2, 0, 0, 1); }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }
.collapse-enter-active, .collapse-leave-active { transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 300px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }
.fade-slide-up-enter-active, .fade-slide-up-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-slide-up-enter-from, .fade-slide-up-leave-to { opacity: 0; transform: translateY(10px); }
/* PC Style Input Adjustments */
.yuemu-input-container.pc-style { padding: 12px 16px; border-radius: 16px; }
.yuemu-input-container.pc-style .input-main-row { padding: 0; flex-direction: column; gap: 0; align-items: stretch; }
.pc-input-top { display: flex; width: 100%; align-items: flex-end; }
.pc-textarea { resize: none; background: transparent; padding: 0 0; min-height: 24px; font-family: inherit; }
.pc-bottom-toolbar { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 8px; }
.toolbar-divider { width: 1px; height: 16px; background: var(--border-color); margin: 0 4px; }
.pc-quick-actions { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.pc-action-btn { padding: 6px 10px; border-radius: 8px; background: transparent; color: var(--text-secondary); font-size: 13px; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s; }
.pc-action-btn:hover { background: var(--hover-background); color: var(--text-primary); }
.pc-action-btn i { color: inherit; font-size: 14px; }
.pc-more-wrapper { position: relative; }
.pc-more-menu { position: absolute; bottom: calc(100% + 8px); left: 0; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); padding: 8px; display: flex; flex-direction: column; gap: 4px; min-width: 160px; z-index: 100; }
.more-menu-item { padding: 8px 12px; border-radius: 6px; border: none; background: transparent; color: var(--text-primary); text-align: left; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 8px; font-size: 13px; }
.more-menu-item:hover { background: var(--hover-background); color: var(--link-color); }
.more-menu-item i { width: 16px; text-align: center; }
.mobile-right-actions { display: flex; align-items: center; gap: 8px; }
.yuemu-elegant-thinking { display: flex; align-items: center; gap: 10px;   border-radius: 12px; width: fit-content; margin: 4px 0; }
.thinking-glow-wave { display: flex; gap: 6px; align-items: center; }
.thinking-glow-wave span { width: 6px; height: 6px; border-radius: 50%; background: var(--link-color); animation: elegant-wave 1.4s infinite ease-in-out both; }
.thinking-glow-wave span:nth-child(1) { animation-delay: -0.32s; }
.thinking-glow-wave span:nth-child(2) { animation-delay: -0.16s; }
.thinking-text { font-size: 13px; font-weight: 500; letter-spacing: 0.5px; background: linear-gradient(90deg, var(--link-color), #60a5fa, var(--link-color)); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: elegant-shimmer 2s linear infinite; }
@keyframes elegant-wave { 0%, 80%, 100% { transform: scale(0); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; box-shadow: 0 0 8px var(--link-color); } }
@keyframes elegant-shimmer { to { background-position: 200% center; } }
</style>

<style lang="scss">
/* 究极全局加粗防御盾：确保在任何 scoped 作用域、打字流、HTML 实体解析嵌套下加粗均 100% 锐利高亮 */
.yuemu-markdown strong,
.yuemu-markdown b,
.gallery-caption strong,
.gallery-caption b {
  font-weight: 700 !important;
  color: var(--text-primary) !important;
}
</style>
