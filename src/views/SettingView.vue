<template>
  <div id="SettingView">
    <div class="setting-container">

      <div class="setting-group">
        <div class="group-title">{{ $t('pages.settingView.groups.member') }}</div>
        <div class="group-card">
          <div class="setting-cell" @click="router.push('/invite')">
            <div class="cell-icon bg-gold"><i class="fas fa-crown"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.groups.invite') }}</div>
              <div class="cell-desc">{{ $t('pages.settingView.groups.inviteDesc') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <div class="group-title">{{ $t('pages.settingView.groups.account') }}</div>
        <div class="group-card">
          <div class="setting-cell" @click="modifyPasswordOpen = true">
            <div class="cell-icon bg-blue"><i class="fas fa-key"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.account.editPwd') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="setting-cell" @click="changeEmailOpen = true">
            <div class="cell-icon bg-orange"><i class="fas fa-envelope"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.account.editEmail') }}</div>
            </div>
            <div class="cell-right">
              <span class="cell-value">{{ myMessage.email || $t('pages.settingView.account.unbound') }}</span>
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="setting-cell" @click="handleWxItemClick">
            <div class="cell-icon bg-green"><i class="fab fa-weixin"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.account.wechatBind') }}</div>
            </div>
            <div class="cell-right">
              <span v-if="loginUserStore.loginUser.hasBindWx" class="status-badge success">{{ $t('pages.settingView.account.bound') }}</span>
              <span v-else class="cell-value">{{ $t('pages.settingView.account.unbound') }}</span>
              <i v-if="!loginUserStore.loginUser.hasBindWx" class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="setting-cell">
            <div class="cell-icon bg-indigo"><i class="fas fa-desktop"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.account.multiDevice') }}</div>
              <div class="cell-desc">{{ $t('pages.settingView.account.multiDeviceDesc') }}</div>
            </div>
            <div class="cell-right">
              <a-switch :checked="myMessage.allowMultiDeviceLogin === 1" size="small" @change="toggleMultiDeviceLogin" />
            </div>
          </div>

          <div class="setting-cell" @click="handleLoginRecords">
            <div class="cell-icon bg-purple"><i class="fas fa-history"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.account.loginHistory') }}</div>
              <div class="cell-desc">{{ $t('pages.settingView.account.loginHistoryDesc') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <div class="group-title">{{ $t('pages.settingView.groups.general') }}</div>
        <div class="group-card">
          <div class="setting-cell" @click="themeStore.toggleTheme">
            <div class="cell-icon bg-purple"><i class="fas fa-moon"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.general.darkMode') }}</div>
            </div>
            <div class="cell-right">
              <span class="cell-value">{{ themeStore.isDarkTheme ? $t('pages.settingView.general.on') : $t('pages.settingView.general.off') }}</span>
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="setting-cell" @click="toggleLanguage">
            <div class="cell-icon bg-blue"><i class="fas fa-language"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.general.lang') }}</div>
            </div>
            <div class="cell-right">
              <span class="cell-value">{{ $t('pages.settingView.general.zh') }}</span>
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="setting-cell" @click="showStreamRecommendations">
            <div class="cell-icon bg-cyan"><i class="fas fa-layer-group"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.general.layout') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="setting-cell" @click="handleLoveBoard">
            <div class="cell-icon bg-pink"><i class="fas fa-heart"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.general.loveBoard') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="setting-cell" @click="showCalendar = true">
            <div class="cell-icon bg-yellow"><i class="fas fa-calendar-check"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.general.growth') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="setting-cell" @click="handleBrowseHistory">
            <div class="cell-icon bg-gray"><i class="fas fa-history"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.general.history') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <div class="group-title">{{ $t('pages.settingView.groups.privacy') }}</div>
        <div class="group-card">


          <div class="setting-cell" @click="handlePrivacySettingClick">
            <div class="cell-icon bg-teal"><i class="fas fa-shield-alt"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.privacy.settings') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="setting-cell" @click="handleReportCenter">
            <div class="cell-icon bg-red"><i class="fas fa-exclamation-circle"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.privacy.report') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="setting-cell" @click="$router.push('/contact')">
            <div class="cell-icon bg-indigo"><i class="fas fa-paper-plane"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.privacy.contact') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="setting-cell" @click="appDownloadOpen = true">
            <div class="cell-icon bg-blue-light"><i class="fas fa-mobile-alt"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.privacy.download') }}</div>
            </div>
            <div class="cell-right"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="setting-cell" @click="aboutUsOpen = true">
            <div class="cell-icon bg-gray"><i class="fas fa-info"></i></div>
            <div class="cell-content">
              <div class="cell-title">{{ $t('pages.settingView.privacy.about') }}</div>
            </div>
            <div class="cell-right">
              <span class="cell-value">v1.0.0</span>
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-group danger-group">
        <div class="group-card">
          <div class="setting-cell center-cell logout-cell" @click="logoutModalOpen = true">
            <div class="cell-title">{{ $t('pages.settingView.privacy.logout') }}</div>
          </div>
        </div>
        <div class="group-card">
          <div class="setting-cell center-cell destroy-cell" @click="secureDestroyOpen = true">
            <div class="cell-title">{{ $t('pages.settingView.privacy.deleteAccount') }}</div>
          </div>
        </div>
      </div>
    </div>



    <div v-if="modifyPasswordOpen" class="modal-mask" @click="modifyPasswordOpen = false">
      <div class="modal-content bottom-sheet" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.account.editPwd') }}</span>
          <i class="fas fa-times close-btn" @click="modifyPasswordOpen = false"></i>
        </div>
        <div class="modal-body form-compact">
          <div class="notice-card info-notice">
            <div class="notice-header"><i class="fas fa-info-circle"></i><span>{{ $t('pages.settingView.modals.pwd.wechatNote') }}</span></div>
            <p class="notice-desc">{{ $t('pages.settingView.modals.pwd.wechatNoteDesc') }} <span class="highlight-text">12345678</span></p>
          </div>
          <div class="form-item">
            <input v-model="modifyPasswordFormData.oldPassword" class="soft-input" type="password" :placeholder="$t('pages.settingView.modals.pwd.current')" />
          </div>
          <div class="form-item">
            <input v-model="modifyPasswordFormData.newPassword" class="soft-input" type="password" :placeholder="$t('pages.settingView.modals.pwd.newPlaceholder')" />
          </div>
          <div class="form-item">
            <input v-model="modifyPasswordFormData.checkPassword" class="soft-input" type="password" :placeholder="$t('pages.settingView.modals.pwd.confirmPlaceholder')" />
          </div>
          <div class="modal-footer-actions">
            <button class="pill-submit-btn" @click="submitPasswordForm">{{ $t('pages.settingView.modals.pwd.submit') }}</button>
            <div class="footer-link-wrapper">
              <button class="link-btn" @click="handleForgotPassword">{{ $t('pages.settingView.modals.pwd.forgot') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="changeEmailOpen" class="modal-mask" @click="changeEmailOpen = false">
      <div class="modal-content bottom-sheet" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.account.editEmail') }}</span>
          <i class="fas fa-times close-btn" @click="changeEmailOpen = false"></i>
        </div>
        <div class="modal-body form-compact">
          <div class="form-item">
            <input v-model="changeEmailForm.newEmail" class="soft-input" type="email" :placeholder="$t('pages.settingView.modals.email.newPlaceholder')" />
          </div>
          <div class="form-item verify-group">
            <input v-model="changeEmailForm.code" class="soft-input verify-input" type="text" :placeholder="$t('pages.settingView.modals.email.codePlaceholder')" maxlength="6" />
            <button class="send-code-btn pill-send-btn" :disabled="!!countdown" @click="sendEmailCode">
              {{ countdown ? `${countdown}s` : t('pages.settingView.modals.email.getCode') }}
            </button>
          </div>
          <div class="modal-footer-actions">
            <button class="pill-submit-btn" @click="handleChangeEmail">{{ $t('pages.settingView.modals.pwd.submit') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="secureDestroyOpen" class="modal-mask" @click="secureDestroyOpen = false">
      <div class="modal-content bottom-sheet" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.modals.delAccount.title') }}</span>
          <i class="fas fa-times close-btn" @click="secureDestroyOpen = false"></i>
        </div>
        <div class="modal-body form-compact">
          <div class="notice-card warning-notice">
            <div class="notice-header"><i class="fas fa-exclamation-triangle"></i><span>{{ $t('pages.settingView.modals.delAccount.warnTitle') }}</span></div>
            <p class="notice-desc">{{ $t('pages.settingView.modals.delAccount.warnDesc') }}</p>
          </div>
          <div class="form-item">
            <input v-model="secureDestroyForm.userPassword" class="soft-input" type="password" :placeholder="$t('pages.settingView.modals.pwd.current')" />
          </div>
          <div class="form-item verify-group">
            <input v-model="secureDestroyForm.code" class="soft-input verify-input" type="text" :placeholder="$t('pages.settingView.modals.delAccount.codePlaceholder')" maxlength="6" />
            <button class="send-code-btn pill-send-btn" :disabled="!!destroyCodeCountdown" @click="sendDestroyCode">
              {{ destroyCodeCountdown ? `${destroyCodeCountdown}s` : t('pages.settingView.modals.email.getCode') }}
            </button>
          </div>
          <div class="modal-footer-actions vertical-actions">
            <button class="pill-submit-btn danger-pill-btn" @click="confirmSecureDestroy">{{ $t('pages.settingView.modals.delAccount.submit') }}</button>
            <button class="pill-cancel-btn" @click="secureDestroyOpen = false">{{ $t('pages.settingView.modals.delAccount.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="bindWxModalOpen" class="modal-mask" @click="closeWxBindModal">
      <div class="modal-content bottom-sheet wx-bind-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.account.wechatBind') }}</span>
          <i class="fas fa-times close-btn" @click="closeWxBindModal"></i>
        </div>
        <div class="modal-body">
          <div class="wx-bind-info">
            <div class="qr-code-wrapper">
              <img src="@/assets/wx.png" :alt="$t('pages.settingView.modals.wechat.qrAlt')" class="qr-code" />
            </div>
            <p class="wx-bind-desc">{{ $t('pages.settingView.modals.wechat.scanDesc') }}</p>
            <div class="code-display" @click="fetchWxBindReqCode">
              <span class="code-text" :class="{ 'highlight': wxBindReqCode !== t('pages.settingView.msgs.getting') && wxBindReqCode !== t('pages.settingView.msgs.expired') }">{{ wxBindReqCode }}</span>
            </div>
            <p class="refresh-tip" v-if="wxBindReqCode === t('pages.settingView.msgs.expired')" @click="fetchWxBindReqCode">{{ $t('pages.settingView.modals.wechat.clickRetry') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="unbindWxConfirmOpen" class="modal-mask" @click="closeWxUnbindModal">
      <div class="modal-content bottom-sheet wx-bind-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.modals.wechat.unbindTitle') }}</span>
          <i class="fas fa-times close-btn" @click="closeWxUnbindModal"></i>
        </div>
        <div class="modal-body">
          <div class="wx-bind-info">
            <div class="qr-code-wrapper">
              <img src="@/assets/wx.png" :alt="$t('pages.settingView.modals.wechat.qrAlt')" class="qr-code" />
            </div>
            <p class="wx-bind-desc">{{ $t('pages.settingView.modals.wechat.unbindScanDesc') }}</p>
            <div class="code-display" @click="fetchWxUnbindReqCode">
              <span class="code-text" :class="{ 'highlight': wxUnbindReqCode !== t('pages.settingView.msgs.getting') && wxUnbindReqCode !== t('pages.settingView.msgs.expired') }">{{ wxUnbindReqCode }}</span>
            </div>
            <p class="refresh-tip" v-if="wxUnbindReqCode === t('pages.settingView.msgs.expired')" @click="fetchWxUnbindReqCode">{{ $t('pages.settingView.modals.wechat.clickRetry') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="logoutModalOpen" class="modal-mask" @click="logoutModalOpen = false">
      <div class="modal-content dialog-center" @click.stop>
        <div class="confirm-title">{{ $t('pages.settingView.modals.logout.title') }}</div>
        <div class="confirm-desc">{{ $t('pages.settingView.modals.logout.desc') }}</div>
        <div class="confirm-btns">
          <button class="cancel-btn" @click="logoutModalOpen = false">{{ $t('pages.settingView.modals.delAccount.cancel') }}</button>
          <button class="confirm-btn" @click="handleLogoutConfirm">{{ $t('pages.settingView.modals.logout.submit') }}</button>
        </div>
      </div>
    </div>

    <div v-if="showCalendar" class="modal-mask" @click="showCalendar = false">
      <div class="modal-content bottom-sheet calendar-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.general.growth') }}</span>
          <a-select v-model:value="selectedYear" :options="yearOptions" class="year-selector" @change="fetchSignInData" style="width: 100px; margin-left: 12px;"/>
          <i class="fas fa-times close-btn" @click="showCalendar = false"></i>
        </div>
        <div class="modal-body calendar-body">
          <div class="calendar-wrapper">
            <div class="month-grid">
              <div class="month-item" v-for="month in 12" :key="month">
                <div class="month-title">{{ month }}{{ $t('pages.settingView.modals.growth.month') }}</div>
                <div class="week-header">
                  <span class="week-day">{{ $t('pages.settingView.modals.growth.mon') }}</span><span class="week-day">{{ $t('pages.settingView.modals.growth.tue') }}</span><span class="week-day">{{ $t('pages.settingView.modals.growth.wed') }}</span><span class="week-day">{{ $t('pages.settingView.modals.growth.thu') }}</span><span class="week-day">{{ $t('pages.settingView.modals.growth.fri') }}</span><span class="week-day">{{ $t('pages.settingView.modals.growth.sat') }}</span><span class="week-day">{{ $t('pages.settingView.modals.growth.sun') }}</span>
                </div>
                <div class="date-grid">
                  <div class="date-item empty" v-for="(empty, idx) in getMonthStartWeek(month)" :key="`empty-${month}-${idx}`"></div>
                  <div class="date-item" :class="{ signed: isSigned(month, day) }" v-for="day in getDaysInMonth(month)" :key="`date-${month}-${day}`">{{ day }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="streamRecommendationsOpen" class="modal-mask" @click="streamRecommendationsOpen = false">
      <div class="modal-content bottom-sheet" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.modals.layout.title') }}</span>
          <i class="fas fa-times close-btn" @click="streamRecommendationsOpen = false"></i>
        </div>
        <div class="modal-body">
          <div class="layout-preview-container">
            <div class="layout-option" :class="{ active: streamLayout === 'waterfall' }" @click="selectLayout('waterfall')">
              <div class="preview-title">{{ $t('pages.settingView.modals.layout.waterfall') }}</div>
              <div class="preview-content waterfall-preview">
                <div class="preview-item tall"></div><div class="preview-item short"></div>
                <div class="preview-item medium"></div><div class="preview-item tall"></div>
              </div>
              <div class="layout-description">{{ $t('pages.settingView.modals.layout.waterfallDesc') }}</div>
            </div>

            <div v-if="layoutOptions.find(o => o.value === 'grid')" class="layout-option" :class="{ active: streamLayout === 'grid' }" @click="selectLayout('grid')">
              <div class="preview-title">{{ $t('pages.settingView.modals.layout.masonry') }}</div>
              <div class="preview-content grid-preview">
                <div class="preview-item"></div><div class="preview-item"></div>
                <div class="preview-item"></div><div class="preview-item"></div>
              </div>
              <div class="layout-description">{{ $t('pages.settingView.modals.layout.masonryDesc') }}</div>
            </div>

            <div v-if="layoutOptions.find(o => o.value === 'single')" class="layout-option" :class="{ active: streamLayout === 'single' }" @click="selectLayout('single')">
              <div class="preview-title">{{ $t('pages.settingView.modals.layout.single') }}</div>
              <div class="preview-content single-preview">
                <div class="preview-item"></div>
                <div class="preview-item"></div>
              </div>
              <div class="layout-description">{{ $t('pages.settingView.modals.layout.singleDesc') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="aboutUsOpen" class="modal-mask" @click="aboutUsOpen = false">
      <div class="modal-content bottom-sheet about-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.modals.about.title') }}</span>
          <i class="fas fa-times close-btn" @click="aboutUsOpen = false"></i>
        </div>
        <div class="modal-body">
          <img src="@/assets/nuv.png" alt="Logo" class="app-logo" />
          <h3 class="about-title">{{ $t('pages.settingView.modals.about.app') }}</h3>
          <p class="version">Version 1.0.0</p>
          <div class="divider"></div>
          <a href="https://official.yuemutuku.com" target="_blank" class="doc-link-btn">
            <i class="fas fa-book"></i>
            <span>{{ $t('pages.settingView.modals.about.docs') }}</span>
            <i class="fas fa-external-link-alt"></i>
          </a>
          <p class="info-item"><i class="fas fa-envelope"></i><span>109484028@qq.com</span></p>
          <p class="info-item"><i class="fas fa-shield-alt"></i><a href="https://beian.miit.gov.cn/" target="_blank">{{ getBeianNumber() }}</a></p>
          <div class="about-links-nav">
            <span class="nav-dot">•</span>
            <a class="nav-link-btn" @click="aboutUsOpen = false; $router.push('/guides')">{{ $t('pages.settingView.modals.about.creatorGuide') }}</a>
            <span class="nav-dot">•</span>
            <a class="nav-link-btn" @click="aboutUsOpen = false; $router.push('/privacy')">{{ $t('pages.settingView.modals.about.privacyPolicy') }}</a>
            <span class="nav-dot">•</span>
            <a class="nav-link-btn" @click="aboutUsOpen = false; $router.push('/about')">{{ $t('pages.settingView.modals.about.aboutUs') }}</a>
            <span class="nav-dot">•</span>
          </div>
          <p class="copyright">© {{ currentYear }} {{ $t('pages.settingView.modals.about.author') }}. All rights reserved.</p>
        </div>
      </div>
    </div>


    <div v-if="appDownloadOpen" class="modal-mask" @click="appDownloadOpen = false">
      <div class="modal-content bottom-sheet download-modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.privacy.download') }}</span>
          <i class="fas fa-times close-btn" @click="appDownloadOpen = false"></i>
        </div>
        <div class="modal-body download-body">
          <div class="qr-container">
            <img src="@/assets/app.png" :alt="$t('pages.settingView.modals.download.qrAlt')" class="download-qr-code" />
          </div>
          <p class="download-tip">{{ $t('pages.settingView.modals.download.desc') }}</p>
        </div>
      </div>
    </div>

    <div v-if="userPermissionSettingOpen" class="modal-mask" @click="userPermissionSettingOpen = false">
      <div class="modal-content bottom-sheet permission-setting-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ $t('pages.settingView.privacy.settings') }}</span>
          <i class="fas fa-times close-btn" @click="userPermissionSettingOpen = false"></i>
        </div>
        <div class="modal-body permission-setting-body">
          <UserPermissionSetting
            v-if="userPermissionSettingOpen"
            :user-id="loginUserStore.loginUser.id"
            :initial-permissions="{
              allowPrivateChat: myMessage.allowPrivateChat,
              allowFollow: myMessage.allowFollow,
              showFollowList: myMessage.showFollowList,
              showFansList: myMessage.showFansList
            }"
            @saved="() => { userPermissionSettingOpen = false; message.success(t('pages.settingView.modals.privacySetup.save')) }"
            @cancelled="() => userPermissionSettingOpen = false"
          />
        </div>
      </div>
    </div>

    <AvatarCropper ref="avatarCropperRef" :imageUrl="tempImageUrl" @success="handleCroppedAvatar" />
    <MemberDetailModal ref="memberDetailModalRef" />
  </div>
</template>

<script setup lang="ts">
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useThemeStore } from '@/stores/useThemeStore'
import { ref,
  onMounted, computed, reactive, onBeforeUnmount, watch, provide } from 'vue'
import { addUserSignInUsingPost, userLogoutUsingPost } from '@/api/userController'
import { message, Switch } from 'ant-design-vue'
import {
  changePasswordUsingPost,
  updateUserUsingPost,
  userDestroyUsingPost,
  updateUserAvatarUsingPost,
  getUserSignInRecordUsingGet,
  getEmailCodeUsingPost,
  changeEmailUsingPost,
  getDestroyCodeUsingPost,
  userDestroySecureUsingPost,
  updateUserMultiDeviceLoginUsingPost,
  getUserMultiDeviceLoginUsingGet,
  reqWxBindCodeUsingGet,
  checkWxBindStatusUsingGet,
  reqWxUnbindCodeUsingGet,
  checkWxUnbindStatusUsingGet,
} from '@/api/userController'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import router from '@/router'
import type { UserModifyPassWord } from '@/api/API.ts'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import { getUserPermissionsUsingGet } from '@/api/userController'
import AvatarCropper from '@/components/AvatarCropper.vue'
import UserPermissionSetting from '@/components/UserPermissionSetting.vue'
import { getCurrentYear } from '@/utils/date'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import plusIcon from '@/assets/icons/plus.svg'
import proIcon from '@/assets/icons/pro.svg'
import MemberDetailModal from '@/components/MemberDetailModal.vue'
import { useI18n } from 'vue-i18n'

// 状态管理
const loginUserStore = useLoginUserStore()
const themeStore = useThemeStore()
const { locale, t } = useI18n()

const toggleLanguage = () => {
  const newLang = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  locale.value = newLang
  localStorage.setItem('locale', newLang)
}

const modifyPasswordOpen = ref(false)
const changeEmailOpen = ref(false)
const aboutUsOpen = ref(false)
const logoutModalOpen = ref(false)
const logoutConfirmOpen = ref(false)
const showCalendar = ref(false)
const streamRecommendationsOpen = ref(false)
const appDownloadOpen = ref(false)
const bindWxModalOpen = ref(false)
const unbindWxConfirmOpen = ref(false)

const memberDetailModalRef = ref<any>(null)
const openMemberModal = () => {
  if (loginUserStore.loginUser?.id && memberDetailModalRef.value) {
    memberDetailModalRef.value.open(loginUserStore.loginUser)
  }
}

// 微信绑定/解绑逻辑
const wxBindReqCode = ref<string>(t('pages.settingView.msgs.getting'))
const wxBindSceneId = ref<string>('')
let wxBindCheckTimer: any = null

const fetchWxBindReqCode = async () => {
  wxBindReqCode.value = t('pages.settingView.msgs.getting')
  const res = await reqWxBindCodeUsingGet()
  if (res.data.code === 0 && res.data.data) {
    wxBindReqCode.value = res.data.data.code as string
    wxBindSceneId.value = res.data.data.sceneId as string
    startWxBindCheckTimer()
  } else {
    message.error(t('pages.settingView.msgs.getCodeFail') + ': ' + res.data.message)
    wxBindReqCode.value = t('pages.settingView.msgs.expired')
  }
}

const startWxBindCheckTimer = () => {
  stopWxBindCheckTimer()
  wxBindCheckTimer = setInterval(async () => {
    if (!wxBindSceneId.value) return
    const res = await checkWxBindStatusUsingGet({ sceneId: wxBindSceneId.value })
    if (res.data.code === 0) {
      if (res.data.data) {
        stopWxBindCheckTimer()
        message.success(t('pages.settingView.msgs.bindSuccess'))
        bindWxModalOpen.value = false
        const newUserInfo = { ...loginUserStore.loginUser, mpOpenId: 'bound', hasBindWx: true }
        loginUserStore.setLoginUser(newUserInfo)
      }
    } else {
      stopWxBindCheckTimer()
      message.error(res.data.message || t('pages.settingView.msgs.codeExpiredRefresh'))
      wxBindReqCode.value = t('pages.settingView.msgs.expired')
    }
  }, 2000)
}

const stopWxBindCheckTimer = () => {
  if (wxBindCheckTimer) {
    clearInterval(wxBindCheckTimer)
    wxBindCheckTimer = null
  }
}

const handleOpenBindWx = () => {
  bindWxModalOpen.value = true
  fetchWxBindReqCode()
}
const closeWxBindModal = () => {
  bindWxModalOpen.value = false
  stopWxBindCheckTimer()
}

const wxUnbindReqCode = ref<string>(t('pages.settingView.msgs.getting'))
const wxUnbindSceneId = ref<string>('')
let wxUnbindCheckTimer: any = null

const fetchWxUnbindReqCode = async () => {
  wxUnbindReqCode.value = t('pages.settingView.msgs.getting')
  const res = await reqWxUnbindCodeUsingGet()
  if (res.data.code === 0 && res.data.data) {
    wxUnbindReqCode.value = res.data.data.code as string
    wxUnbindSceneId.value = res.data.data.sceneId as string
    startWxUnbindCheckTimer()
  } else {
    message.error(t('pages.settingView.msgs.unbindCodeFail') + ': ' + res.data.message)
    wxUnbindReqCode.value = t('pages.settingView.msgs.expired')
  }
}

const startWxUnbindCheckTimer = () => {
  stopWxUnbindCheckTimer()
  wxUnbindCheckTimer = setInterval(async () => {
    if (!wxUnbindSceneId.value) return
    const res = await checkWxUnbindStatusUsingGet({ sceneId: wxUnbindSceneId.value })
    if (res.data.code === 0) {
      if (res.data.data) {
        stopWxUnbindCheckTimer()
        message.success(t('pages.settingView.msgs.unbindSuccess'))
        unbindWxConfirmOpen.value = false
        const newUserInfo = { ...loginUserStore.loginUser, mpOpenId: null, hasBindWx: false }
        loginUserStore.setLoginUser(newUserInfo)
      }
    } else {
      stopWxUnbindCheckTimer()
      message.error(res.data.message || t('pages.settingView.msgs.codeExpiredOrFail'))
      wxUnbindReqCode.value = t('pages.settingView.msgs.expired')
    }
  }, 2000)
}

const stopWxUnbindCheckTimer = () => {
  if (wxUnbindCheckTimer) {
    clearInterval(wxUnbindCheckTimer)
    wxUnbindCheckTimer = null
  }
}

const handleOpenUnbindWx = () => {
  unbindWxConfirmOpen.value = true
  fetchWxUnbindReqCode()
}
const closeWxUnbindModal = () => {
  unbindWxConfirmOpen.value = false
  stopWxUnbindCheckTimer()
}

onBeforeUnmount(() => {
  stopWxBindCheckTimer()
  stopWxUnbindCheckTimer()
})

const handleWxItemClick = () => {
  if (loginUserStore.loginUser.hasBindWx) {
    handleOpenUnbindWx()
  } else {
    handleOpenBindWx()
  }
}

const secureDestroyOpen = ref(false)
const secureDestroyForm = reactive({ userPassword: '', code: '' })
const destroyCodeCountdown = ref(0)
let destroyCodeTimer: NodeJS.Timeout | null = null
const userPermissionSettingOpen = ref(false)

const loadUserPermissions = async () => {
  try {
    const response = await getUserPermissionsUsingGet({ userId: loginUserStore.loginUser.id })
    if (response.data.code === 0 && response.data) {
      Object.assign(myMessage.value, {
        allowPrivateChat: response.data.data.allowPrivateChat,
        allowFollow: response.data.data.allowFollow,
        showFollowList: response.data.data.showFollowList,
        showFansList: response.data.data.showFansList
      })
      const updatedUserInfo = { ...loginUserStore.loginUser, ...response.data.data }
      loginUserStore.setLoginUser(updatedUserInfo)
    }
  } catch (error) {
    console.error(t('pages.settingView.msgs.loadAuthFail'), error)
  }
}

const loadUserMultiDeviceLoginSetting = async () => {
  try {
    const response = await getUserMultiDeviceLoginUsingGet({ userId: loginUserStore.loginUser.id })
    if (response.data.code === 0 && response.data) {
      myMessage.value.allowMultiDeviceLogin = response.data.data
      const updatedUserInfo = { ...loginUserStore.loginUser, allowMultiDeviceLogin: response.data.data }
      loginUserStore.setLoginUser(updatedUserInfo)
    }
  } catch (error) {
    console.error(t('pages.settingView.msgs.loadDeviceFail'), error)
  }
}


const myMessage = ref({
  userName: loginUserStore.loginUser.userName,
  id: loginUserStore.loginUser.id,
  userAccount: loginUserStore.loginUser.userAccount,
  userProfile: loginUserStore.loginUser.userProfile || '',
  userRole: loginUserStore.loginUser.userRole,
  userAvatar: loginUserStore.loginUser.userAvatar,
  email: loginUserStore.loginUser.email,
  gender: loginUserStore.loginUser.gender || '',
  region: loginUserStore.loginUser.region || '',
  birthday: loginUserStore.loginUser.birthday || '',
  userTags: loginUserStore.loginUser.userTags || '',
  homepageBg: loginUserStore.loginUser.homepageBg || '',
  personalSign: loginUserStore.loginUser.personalSign || '',
  allowPrivateChat: loginUserStore.loginUser.allowPrivateChat ?? 1,
  allowFollow: loginUserStore.loginUser.allowFollow ?? 1,
  showFollowList: loginUserStore.loginUser.showFollowList ?? 1,
  showFansList: loginUserStore.loginUser.showFansList ?? 1,
  allowMultiDeviceLogin: loginUserStore.loginUser.allowMultiDeviceLogin ?? 1,
})

const updateUserInfo = (newUserInfo: any) => { Object.assign(myMessage.value, newUserInfo) }


const streamLayout = ref('waterfall')
const gridAspectRatio = ref('4:3')
const layoutOptions = ref([
  { label: t('pages.settingView.msgs.layoutWaterfall'), value: 'waterfall' },
  { label: t('pages.settingView.msgs.layoutMasonry'), value: 'grid' },
  { label: t('pages.settingView.msgs.layoutSingle'), value: 'single' }
])
const aspectRatioOptions = ref([
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '1:1', value: '1:1' }
])

provide('streamLayout', streamLayout)
provide('gridAspectRatio', gridAspectRatio)


const modifyPasswordFormData = ref<UserModifyPassWord>({ oldPassword: '', newPassword: '', checkPassword: '', })
const submitPasswordForm = async () => {
  if (!modifyPasswordFormData.value.oldPassword || !modifyPasswordFormData.value.newPassword) return message.warning(t('pages.settingView.msgs.fillRequired'))
  if (modifyPasswordFormData.value.newPassword.length < 8) return message.warning(t('pages.settingView.msgs.pwdLengthError'))
  if (modifyPasswordFormData.value.newPassword !== modifyPasswordFormData.value.checkPassword) return message.warning(t('pages.settingView.msgs.pwdMismatch'))
  try {
    const res = await changePasswordUsingPost({
      id: loginUserStore.loginUser.id,
      ...modifyPasswordFormData.value
    })
    if (res.data.code === 0) {
      message.success(t('pages.settingView.msgs.updateSuccess'))
      modifyPasswordOpen.value = false
      modifyPasswordFormData.value = { oldPassword: '', newPassword: '', checkPassword: '' }
    } else message.error(res.data.message)
  } catch (err) { message.error(t('pages.settingView.msgs.updateFail')) }
}

const changeEmailForm = reactive({ newEmail: '', code: '' })
const countdown = ref(0)
let timer: NodeJS.Timeout | null = null
const sendEmailCode = async () => {
  if (!changeEmailForm.newEmail) return message.warning(t('pages.settingView.msgs.inputEmail'))
  try {
    const res = await getEmailCodeUsingPost({ email: changeEmailForm.newEmail, type: 'changeEmail' })
    if (res.data.code === 0) {
      message.success(t('pages.settingView.msgs.sendSuccess'))
      countdown.value = 60
      timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) { clearInterval(timer!); timer = null }
      }, 1000)
    } else message.error(res.data.message)
  } catch (e: any) { message.error(t('pages.settingView.msgs.sendFail')) }
}

const handleChangeEmail = async () => {
  if (!changeEmailForm.newEmail || !changeEmailForm.code) return message.warning(t('pages.settingView.msgs.fillRequired'))
  try {
    const res = await changeEmailUsingPost({ newEmail: changeEmailForm.newEmail, code: changeEmailForm.code, id: loginUserStore.loginUser.id })
    if (res.data.code === 0) {
      message.success(t('pages.settingView.msgs.updateSuccess'))
      changeEmailOpen.value = false
      myMessage.value.email = changeEmailForm.newEmail
      loginUserStore.setLoginUser({ ...loginUserStore.loginUser, email: changeEmailForm.newEmail })
      changeEmailForm.newEmail = ''; changeEmailForm.code = ''
    } else message.error(res.data.message)
  } catch (e: any) { message.error(t('pages.settingView.msgs.updateFail')) }
}


const selectedYear = ref(new Date().getFullYear())
const signInData = ref<number[]>([])
const yearOptions = computed(() => {
  const curr = new Date().getFullYear()
  return Array.from({ length: 3 }, (_, i) => ({ label: `${curr - i}${t('pages.settingView.msgs.year')}`, value: curr - i }))
})
const fetchSignInData = async () => {
  try {
    const res = await getUserSignInRecordUsingGet({ year: selectedYear.value })
    if (res.data.code === 0) signInData.value = res.data.data || []
  } catch (err) { signInData.value = [] }
}
const getDaysInMonth = (month: number) => new Date(selectedYear.value, month, 0).getDate()
const getMonthStartWeek = (month: number) => {
  const first = new Date(selectedYear.value, month - 1, 1).getDay()
  return first === 0 ? 6 : first - 1
}
const isSigned = (month: number, day: number) => {
  const t = `${selectedYear.value}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  return signInData.value.some(item => new Date(selectedYear.value, 0, item).toISOString().split('T')[0] === t)
}
const autoSignIn = async () => {
  if (!loginUserStore.loginUser.id) return
  try { await addUserSignInUsingPost(); await fetchSignInData() } catch (err) {}
}

const getLocation = async () => {
  if (locationLoading.value) return
  locationLoading.value = true
  try {
    const response = await fetch('https://api.myip.la/cn?json')
    const data = await response.json()
    if (data?.location?.province) {
      myMessage.value.region = data.location.province
      message.success(`${t('pages.settingView.msgs.locSuccess')}: ${data.location.province}`)
    } else {
      myMessage.value.region = t('pages.settingView.msgs.beijing'); message.info(t('pages.settingView.msgs.locSuccess') + ': ' + t('pages.settingView.msgs.beijing'))
    }
  } catch (err) {
    myMessage.value.region = t('pages.settingView.msgs.beijing'); message.warning(t('pages.settingView.msgs.locFail'))
  } finally { locationLoading.value = false }
}

const handleLogoutConfirm = async () => {
  try {
    await userLogoutUsingPost()
    loginUserStore.setLoginUser({ userName: t('pages.settingView.msgs.notLogin'), id: 0 })
    message.success(t('pages.settingView.msgs.logoutSuccess'))
    router.push('/user/login')
  } catch (err) { message.error(t('pages.settingView.msgs.logoutFail')) }
}

const sendDestroyCode = async () => {
  if (!secureDestroyForm.userPassword) return message.warning(t('pages.settingView.msgs.inputPwd'))
  try {
    const pwdCheckRes = await changePasswordUsingPost({
      id: loginUserStore.loginUser.id,
      oldPassword: secureDestroyForm.userPassword,
      newPassword: secureDestroyForm.userPassword,
      checkPassword: secureDestroyForm.userPassword,
    })
    if (pwdCheckRes.data.code !== 0) return message.error(t('pages.settingView.msgs.pwdError'))
    const res = await getDestroyCodeUsingPost()
    if (res.data.code === 0) {
      message.success(t('pages.settingView.msgs.codeSent'))
      destroyCodeCountdown.value = 60
      destroyCodeTimer = setInterval(() => {
        destroyCodeCountdown.value--
        if (destroyCodeCountdown.value <= 0) { clearInterval(destroyCodeTimer!); destroyCodeTimer = null }
      }, 1000)
    } else message.error(res.data.message)
  } catch (error: any) { message.error(t('pages.settingView.msgs.sendFail')) }
}

const confirmSecureDestroy = async () => {
  if (!secureDestroyForm.userPassword || !secureDestroyForm.code) return message.warning(t('pages.settingView.msgs.fillRequired'))
  try {
    const res = await userDestroySecureUsingPost(secureDestroyForm)
    if (res.data.code === 0 && res.data.data) {
      message.success(t('pages.settingView.msgs.accountDeleted'))
      loginUserStore.logout()
      router.push('/user/login')
    } else message.error(t('pages.settingView.msgs.deleteFail'))
  } catch (err) { message.error(t('pages.settingView.msgs.deleteFail')) }
}

const toggleMultiDeviceLogin = async (checked: boolean) => {
  try {
    const res = await updateUserMultiDeviceLoginUsingPost({ userId: loginUserStore.loginUser.id, allowMultiDeviceLogin: checked ? 1 : 0 })
    if (res.data.code === 0) {
      message.success(checked ? t('pages.settingView.msgs.multiDeviceOn') : t('pages.settingView.msgs.multiDeviceOff'))
      myMessage.value.allowMultiDeviceLogin = checked ? 1 : 0
      loginUserStore.setLoginUser({ ...loginUserStore.loginUser, allowMultiDeviceLogin: checked ? 1 : 0 })
    } else {
      message.error(t('pages.settingView.msgs.setFail')); myMessage.value.allowMultiDeviceLogin = !checked ? 1 : 0
    }
  } catch (err) { myMessage.value.allowMultiDeviceLogin = !checked ? 1 : 0 }
}

const getDefaultAvatar = (name: string) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'Guest')}`
const handleFollowClick = () => router.push({ path: '/follow-list', query: { tab: 'follow' } })
const handleFansClick = () => router.push({ path: '/follow-list', query: { tab: 'fans' } })
const handleLoveBoard = () => router.push('/loveboard')
const handleForgotPassword = () => { modifyPasswordOpen.value = false; router.push('/user/reset-password') }
const handlePrivacySettingClick = async () => { await loadUserPermissions(); userPermissionSettingOpen.value = true }
const handleReportCenter = () => router.push('/user/report-center')
const handleBrowseHistory = () => router.push('/browse-history')
const handleLoginRecords = () => router.push('/login-records')
const getBeianNumber = () => import.meta.env.VITE_APP_ENV === 'production' ? 'Long ICP Bei 2024012699-3' : 'Long ICP Bei 2024012699-1'

const showStreamRecommendations = () => {
  streamRecommendationsOpen.value = true
  filterLayoutOptions()
  loadStreamLayout()
}
const saveStreamLayout = () => {
  localStorage.setItem('streamLayout', streamLayout.value)
  if (streamLayout.value === 'grid') localStorage.setItem('gridAspectRatio', gridAspectRatio.value)
  window.dispatchEvent(new CustomEvent('streamLayoutChanged', { detail: { layout: streamLayout.value, aspectRatio: streamLayout.value === 'grid' ? gridAspectRatio.value : undefined } }))
}
const selectLayout = (layout: string) => { streamLayout.value = layout; saveStreamLayout() }
const loadStreamLayout = () => {
  streamLayout.value = localStorage.getItem('streamLayout') || 'waterfall'
  gridAspectRatio.value = localStorage.getItem('gridAspectRatio') || '4:3'
}
const filterLayoutOptions = async () => {
  const deviceType = await getDeviceType()
  if (deviceType === DEVICE_TYPE_ENUM.PC) {
    layoutOptions.value = [{ label: t('pages.settingView.msgs.layoutWaterfall'), value: 'waterfall' }, { label: t('pages.settingView.msgs.layoutMasonry'), value: 'grid' }]
    if (streamLayout.value === 'single') streamLayout.value = 'waterfall'
  } else {
    layoutOptions.value = [{ label: t('pages.settingView.msgs.layoutWaterfall'), value: 'waterfall' }, { label: t('pages.settingView.msgs.layoutSingle'), value: 'single' }]
    if (streamLayout.value === 'grid') streamLayout.value = 'waterfall'
  }
}

const currentYear = computed(() => getCurrentYear())
watch(() => loginUserStore.loginUser, (newVal) => updateUserInfo(newVal), { deep: true })
onMounted(async () => {
  if (loginUserStore.loginUser.id) {
    await autoSignIn(); await loadUserPermissions(); await loadUserMultiDeviceLoginSetting()
  }
  loadStreamLayout()
  VChart.config = { echarts }
  await filterLayoutOptions()
})

const isAnyModalOpen = computed(() => (open.value || modifyPasswordOpen.value || changeEmailOpen.value || aboutUsOpen.value || logoutModalOpen.value || logoutConfirmOpen.value || showCalendar.value || streamRecommendationsOpen.value || secureDestroyOpen.value || userPermissionSettingOpen.value || bindWxModalOpen.value || unbindWxConfirmOpen.value || appDownloadOpen.value))

// 保存滚动位置
let savedScrollPosition = 0

watch(isAnyModalOpen, (newVal) => {
  // Mobile browser scroll locking fix with position preservation
  if (newVal) {
    // 保存当前滚动位置
    savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop

    // 禁用滚动
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${savedScrollPosition}px`
    document.body.style.width = '100%'
  } else {
    // 恢复滚动
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''

    // 恢复滚动位置
    window.scrollTo(0, savedScrollPosition)
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);

  // 清理样式
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
})
</script>

<style scoped>
/* =========== 1. 全局基础与页面布局 =========== */
#SettingView {
  min-height: 100vh;
  padding-bottom: 60px;
  overflow-x: hidden;
  transition: var(--theme-transition);
}

.setting-container {
  max-width: 768px;
  margin: 0 auto;
  padding: 20px 16px;
}


/* =========== 3. 现代设置项分组 =========== */
.setting-group { margin-bottom: 28px; }
.group-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin: 0 0 8px 16px; margin-top: 12px;text-transform: uppercase; letter-spacing: 1px; }
.group-card { background: var(--card-background); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02); }

.setting-cell { display: flex; align-items: center; padding: 16px 20px; background: var(--card-background); cursor: pointer; transition: background-color 0.2s; position: relative; }
.setting-cell:not(:last-child)::after { content: ''; position: absolute; bottom: 0; left: 64px; right: 0; height: 1px; background: var(--border-color); opacity: 0.6; }
.setting-cell:hover { background: var(--hover-background); }
.setting-cell:active { background: rgba(0, 0, 0, 0.05); }

.cell-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px; color: #fff; font-size: 14px; flex-shrink: 0; }
.cell-icon.bg-indigo { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.cell-icon.bg-gold { background: rgba(250, 173, 20, 0.1); color: #faad14; }
.bg-blue { background: #007aff; } .bg-orange { background: #ff9500; } .bg-green { background: #34c759; } .bg-indigo { background: #5856d6; } .bg-purple { background: #af52de; } .bg-cyan { background: #32ade6; } .bg-pink { background: #ff2d55; } .bg-yellow { background: #ffcc00; color: #fff; } .bg-teal { background: #30b0c7; } .bg-red { background: #ff3b30; } .bg-gray { background: #8e8e93; } .bg-blue-light { background: #5ac8fa; }

.cell-content { flex: 1; min-width: 0; }
.cell-title { font-size: 16px; font-weight: 500; color: var(--text-primary); }
.cell-desc { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.cell-right { display: flex; align-items: center; gap: 8px; color: var(--text-tertiary); font-size: 14px; }
.cell-value { font-size: 15px; color: var(--text-secondary); }

.danger-group .group-card { margin-bottom: 4px; }
.center-cell { justify-content: center; }
.center-cell::after { display: none; }
.logout-cell .cell-title { color: var(--link-color); font-weight: 600; }
.destroy-cell .cell-title { color: #ff3b30; font-weight: 600; }
.status-badge { font-size: 13px; padding: 4px 10px; border-radius: 12px; font-weight: 600; }
.status-badge.success { background: rgba(52, 199, 89, 0.1); color: #34C759; }

/* =========== 4. 弹窗底层框架 (Modal Base) =========== */
.modal-mask { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease-out; }
.glass-mask { background-color: rgba(0, 0, 0, 0.7); }

.modal-content { background-color: var(--card-background); border-radius: 24px; width: 90%; max-width: 440px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color); animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.close-btn { width: 32px; height: 32px; border-radius: 16px; background: var(--hover-background); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: 0.2s; font-size: 14px; }
.close-btn:hover { background: var(--border-color); color: var(--text-primary); transform: rotate(90deg); }

.modal-body { padding: 12px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.modal-body::-webkit-scrollbar, .scrollable-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-thumb, .scrollable-body::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

/* =========== 5. 表单及输入框样式 (Forms & Inputs) =========== */
.form-compact .form-item { margin-bottom: 20px; }
.form-label { display: block; font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.soft-input, .textarea-input { width: 100%; padding: 14px 16px; background: var(--hover-background); border: 1px solid transparent; border-radius: 14px; font-size: 15px; color: var(--text-primary); outline: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.soft-input:focus, .textarea-input:focus { background: var(--card-background); border-color: var(--link-color); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.textarea-input { min-height: 100px; resize: vertical; }
.char-count { text-align: right; font-size: 12px; color: var(--text-tertiary); margin-top: 6px; }
.row-group { display: flex; gap: 16px; }
.flex-1 { flex: 1; min-width: 0; }
.w-full { width: 100%; }

.gender-segmented-control { display: flex; background: var(--hover-background); border-radius: 14px; padding: 4px; gap: 4px; border: 1px solid var(--border-color); }
.segment-pill { flex: 1; text-align: center; padding: 12px 0; border-radius: 10px; font-size: 14px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
.segment-pill.active { background: var(--card-background); color: var(--text-primary); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }

/* ============ 【修复点2】编辑资料弹窗内的定位按钮 ============ */
.location-group { position: relative; display: flex; align-items: center; width: 100%; }
.location-group .soft-input { padding-right: 50px; } /* 给右侧按钮留出空间 */
.location-group .inset-btn {
  position: absolute; right: 6px; width: 40px; height: 40px; border-radius: 10px; border: none;
  background: var(--card-background); color: var(--link-color); cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.location-group .inset-btn:hover:not(:disabled) { transform: scale(1.05); background: var(--link-color); color: #fff; }

.verify-group { display: flex; gap: 12px; }
.verify-input { flex: 1; }
.pill-send-btn { width: 100px; height: 50px; border-radius: 14px; background: var(--hover-background); color: var(--link-color); font-weight: 600; border: none; cursor: pointer; transition: 0.2s; }
.pill-send-btn:hover:not(:disabled) { background: var(--link-color); color: #fff; }
.pill-send-btn:disabled { color: var(--text-tertiary); cursor: not-allowed; }

.modal-footer-actions { margin-top: 32px; }
.vertical-actions { display: flex; flex-direction: column; gap: 12px; }
.pill-submit-btn { width: 100%; height: 52px; border-radius: 14px; background: var(--link-color); color: #fff; font-size: 16px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }
.pill-submit-btn:hover { background: var(--link-hover-color); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3); }
.danger-pill-btn { background: #ff3b30; box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2); }
.danger-pill-btn:hover { background: #d32f2f; box-shadow: 0 6px 16px rgba(255, 59, 48, 0.3); }
.pill-cancel-btn { width: 100%; height: 52px; border-radius: 14px; background: var(--hover-background); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 16px; font-weight: 600; cursor: pointer; }
.footer-link-wrapper { text-align: center; margin-top: 16px; }
.link-btn { background: none; border: none; color: var(--link-color); font-size: 14px; cursor: pointer; }

/* 提示卡片 */
.notice-card { padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid transparent; }
.notice-header { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
.notice-desc { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5; }
.info-notice { background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.1); }
.info-notice .notice-header { color: var(--link-color); }
.warning-notice { background: rgba(255, 59, 48, 0.05); border-color: rgba(255, 59, 48, 0.1); }
.warning-notice .notice-header { color: #ff3b30; }



/* ============ 【修复点3】成长足迹 (日历) ============ */
.calendar-wrapper { overflow-x: auto; padding-bottom: 12px; }
.month-grid { display: flex; gap: 20px; min-width: max-content; }
.month-item { background: var(--hover-background); border: 1px solid var(--border-color); padding: 16px; border-radius: 16px; width: 280px; }
.month-title { font-weight: bold; font-size: 16px; margin-bottom: 12px; color: var(--text-primary); text-align: center; }
.week-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }
.date-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.date-item { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 13px; border-radius: 8px; background: var(--card-background); color: var(--text-primary); border: 1px solid var(--border-color); }
.date-item.signed { background: var(--link-color); color: #fff; font-weight: bold; border-color: var(--link-color); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4); }
.date-item.empty { background: transparent; border: none; }

/* ============ 【修复点4】消息流布局选择 (Layout Previews) ============ */
.layout-preview-container {display: flex;
  gap: 16px;
  padding: 4px 4px 16px;
  width: 100%;
  margin: auto;}
.layout-option {
  /* 关键修改：去掉固定宽度，让它们平分空间 */
  flex: 1;

  /* 下面是你原有的其他样式，保持不变即可 */
  background: var(--hover-background);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: 0.2s;
  text-align: center;
}
.layout-option.active { border-color: var(--link-color); background: rgba(59, 130, 246, 0.05); }
.preview-title { font-size: 15px; font-weight: bold; margin-bottom: 12px; color: var(--text-primary); }
.layout-description { font-size: 12px; color: var(--text-secondary); margin-top: 12px; }

/* 模拟三种布局样式的色块 */
.preview-content { height: 90px; margin: 0 auto; display: flex; gap: 6px; justify-content: center; }
/* 瀑布流 */
.waterfall-preview { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, 1fr); gap: 6px; width: 100%; }
.waterfall-preview .tall { grid-row: span 3; background: #cce0ff; border-radius: 6px; }
.waterfall-preview .short { grid-row: span 1; background: #99c2ff; border-radius: 6px; }
.waterfall-preview .medium { grid-row: span 2; background: #66a3ff; border-radius: 6px; }
/* 网格 */
.grid-preview { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6px; width: 100%; }
.grid-preview .preview-item { background: #99c2ff; border-radius: 6px; }
/* 单列 */
.single-preview { display: flex; flex-direction: column; width: 100%; gap: 6px; }
.single-preview .preview-item { flex: 1; background: #99c2ff; border-radius: 6px; }

.layout-option.active .preview-item { filter: brightness(0.9); box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3); }

/* ============ 【修复点5】关于我们 & App 下载 ============ */
.about-content, .download-body { text-align: center; }
.app-logo { height: 60px; width: auto; margin: 0 auto 20px; display: block; }
.about-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: var(--text-primary); }
.version { color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; }
.divider { height: 1px; background: var(--border-color); width: 80%; margin: 0 auto 24px; }

.doc-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--link-color);
  color: #fff;
  border-radius: 14px;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 24px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.doc-link-btn:hover {
  background: var(--link-hover-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.doc-link-btn:active {
  transform: translateY(0);
}

.doc-link-btn i:first-child {
  font-size: 16px;
}

.doc-link-btn i:last-child {
  font-size: 12px;
  opacity: 0.8;
}

.info-item { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px; color: var(--text-secondary); font-size: 14px; }
.info-item a { color: var(--link-color); text-decoration: none; }

.about-links-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 20px 0 16px;
}

.nav-dot {
  color: var(--text-tertiary, #94a3b8);
  font-size: 12px;
}

.nav-link-btn {
  font-size: 14px;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 500;
}

.nav-link-btn:hover {
  color: var(--link-color, #2563eb);
}

.nav-link-btn.active {
  color: var(--text-primary, #1e293b);
  font-weight: 600;
}

.copyright { margin-top: 16px; font-size: 12px; color: var(--text-tertiary); }

.qr-container { display: inline-block; padding: 16px; background: #fff; border-radius: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); margin-bottom: 20px; border: 1px solid var(--border-color); }
.download-qr-code { width: 200px; height: 200px; display: block; border-radius: 12px; }
.download-tip { font-size: 15px; color: var(--text-secondary); font-weight: 500; }

/* 微信绑定等杂项 */
.wx-bind-info { text-align: center; }
.wx-bind-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; }
.qr-code-wrapper { width: 180px; height: 180px; margin: 0 auto 24px; padding: 12px; border-radius: 24px; background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.06); border: 1px solid var(--border-color); }
.qr-code { width: 100%; height: 100%; object-fit: contain; border-radius: 12px; }
.code-display { background: var(--hover-background); padding: 16px 32px; border-radius: 16px; display: inline-block; cursor: pointer; border: 1px dashed var(--link-color); transition: 0.2s; }
.code-display:active { transform: scale(0.95); }
.code-text { font-size: 28px; font-weight: 800; letter-spacing: 6px; color: var(--text-primary); }
.highlight { color: var(--link-color); text-shadow: 0 2px 10px rgba(59, 130, 246, 0.2); }
.refresh-tip { font-size: 13px; color: var(--link-color); cursor: pointer; margin-top: 16px; font-weight: 500; }

/* Dialog 确认框居中 */
.dialog-center { padding: 32px 24px; text-align: center; }
.confirm-title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; }
.confirm-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 32px; }
.confirm-btns { display: flex; gap: 12px; }
.confirm-btn, .cancel-btn { flex: 1; height: 44px; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; transition: 0.2s; }
.confirm-btn { background: #ff3b30; color: #fff; }
.confirm-btn:hover { background: #d32f2f; }
.cancel-btn { background: var(--hover-background); color: var(--text-primary); }

/* =========== 8. 动画与响应式 =========== */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

@media screen and (max-width: 768px) {
  .setting-container { padding: 12px; }

  .group-card { border-radius: 16px; }

  /* 底部弹窗 (Bottom Sheet) 增加底部安全区防止刘海屏遮挡 */
  .modal-content.bottom-sheet {
    position: absolute; bottom: 0; left: 0; width: 100%; max-width: 100%;
    border-radius: 28px 28px 0 0; margin: 0;
    padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* 全屏弹窗 */
  .modal-content.full-screen-mobile {
    position: absolute; top: 0; left: 0; width: 100%; height: 100vh;
    max-width: 100%; max-height: 100vh; margin: 0; border-radius: 0; border: none;
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

}
</style>
