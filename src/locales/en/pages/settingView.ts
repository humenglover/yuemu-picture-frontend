export default {
  groups: {
    member: 'Member Center',
    invite: 'Invitation Plan',
    inviteDesc: 'Invite friends, unlock more member privileges',
    account: 'Account & Security',
    general: 'General & Content',
    privacy: 'Privacy & About'
  },
  account: {
    editPwd: 'Change Password',
    editEmail: 'Change Email',
    unbound: 'Unbound',
    wechatBind: 'WeChat Bind',
    bound: 'Bound',
    multiDevice: 'Multi-device Login',
    multiDeviceDesc: 'Allow online on multiple devices simultaneously',
    loginHistory: 'Login History',
    loginHistoryDesc: 'View account login history and device info'
  },
  general: {
    darkMode: 'Dark Mode',
    on: 'ON',
    off: 'OFF',
    lang: 'Language',
    zh: '中文',
    en: 'English',
    layout: 'Feed Layout',
    loveBoard: 'Love Board',
    growth: 'Growth Footprints',
    history: 'Browsing History'
  },
  privacy: {
    settings: 'Privacy Settings',
    report: 'Report Center',
    contact: 'Contact Author',
    download: 'Download App',
    about: 'About Yuemu',
    logout: 'Log Out',
    deleteAccount: 'Delete Account'
  },
  modals: {
    pwd: {
      title: 'Change Password',
      wechatNote: 'WeChat Users Note:',
      wechatNoteDesc: 'Default initial password for WeChat is',
      current: 'Current Password',
      currentPlaceholder: 'Enter current password',
      new: 'New Password',
      newPlaceholder: 'At least 8 characters',
      confirm: 'Confirm Password',
      confirmPlaceholder: 'Re-enter new password',
      submit: 'Confirm Change',
      forgot: 'Forgot Password?'
    },
    email: {
      title: 'Change Email',
      new: 'New Email',
      newPlaceholder: 'Enter new email',
      code: '6-digit Code',
      codePlaceholder: 'Enter code',
      getCode: 'Get',
      submit: 'Confirm Change'
    },
    delAccount: {
      title: 'Delete Account',
      warnTitle: 'Security Warning:',
      warnDesc: 'Account will be permanently deleted after verification. This action is irreversible!',
      current: 'Current Password',
      currentPlaceholder: 'Enter password',
      code: 'Email Code',
      codePlaceholder: 'Enter code',
      getCode: 'Get',
      submit: 'Confirm Deletion',
      cancel: 'Cancel'
    },
    wechat: {
      bindTitle: 'Bind WeChat',
      qrAlt: 'Official Account QR',
      scanDesc: 'Scan to follow, and send code below:',
      getting: 'Getting...',
      expired: 'Expired',
      clickRetry: 'Click to retry',
      unbindTitle: 'Unbind WeChat',
      unbindScanDesc: 'Scan with bound WeChat and send code below:'
    },
    logout: {
      title: 'Log out?',
      desc: 'You will need to log in again.',
      cancel: 'Cancel',
      submit: 'Log Out'
    },
    growth: {
      title: 'Growth Footprints',
      month: 'Mon',
      mon: 'M',
      tue: 'T',
      wed: 'W',
      thu: 'T',
      fri: 'F',
      sat: 'S',
      sun: 'S'
    },
    layout: {
      title: 'Feed Layout',
      waterfall: 'Waterfall',
      waterfallDesc: 'Natural heights',
      masonry: 'Grid',
      masonryDesc: 'Uniform columns',
      single: 'Single',
      singleDesc: 'Large picture focus'
    },
    about: {
      title: 'About Us',
      app: 'Yuemu Gallery',
      docs: 'Official Docs',
      author: 'Lumeng'
    },
    download: {
      title: 'Download App',
      qrAlt: 'Download QR',
      desc: 'Scan QR directly to download'
    },
    privacySetup: {
      title: 'Privacy Settings',
      save: 'Saved successfully'
    }
  },
  msgs: {
    getting: 'Getting...',
    getCodeFail: 'Failed to get code',
    expired: 'Expired',
    bindSuccess: 'Bound successfully',
    codeExpiredRefresh: 'Code expired, please refresh',
    unbindCodeFail: 'Failed to get unbind code',
    unbindSuccess: 'Unbound successfully. Log in with email or Yuemu ID next time.',
    codeExpiredOrFail: 'Code expired or verification failed',
    loadAuthFail: 'Failed to load permissions',
    loadDeviceFail: 'Failed to load devices',
    layoutWaterfall: 'Waterfall',
    layoutMasonry: 'Grid',
    layoutSingle: 'Single Column',
    fillRequired: 'Please fill required fields',
    pwdLengthError: 'New password must be at least 8 chars',
    pwdMismatch: 'Passwords do not match',
    updateSuccess: 'Updated successfully',
    updateFail: 'Update failed: ',
    inputEmail: 'Please enter new email',
    sendSuccess: 'Sent successfully',
    sendFail: 'Send failed: ',
    year: 'Year',
    locSuccess: 'Located successfully',
    locFail: 'Location failed, using default',
    beijing: 'Beijing',
    notLogin: 'Not logged in',
    logoutSuccess: 'Logged out successfully',
    logoutFail: 'Logout failed',
    inputPwd: 'Please enter password',
    pwdError: 'Password incorrect',
    codeSent: 'Code sent',
    accountDeleted: 'Account deleted',
    deleteFail: 'Deletion failed',
    multiDeviceOn: 'Multi-device login enabled',
    multiDeviceOff: 'Multi-device login disabled',
    setFail: 'Setting failed: '
  }
};
