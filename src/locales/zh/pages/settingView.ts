export default {
  groups: {
    member: '会员中心',
    invite: '邀请计划',
    inviteDesc: '邀请好友，解锁更多会员权益',
    account: '账号与安全',
    general: '通用与内容',
    privacy: '隐私与关于'
  },
  account: {
    editPwd: '修改密码',
    editEmail: '修改邮箱',
    unbound: '未绑定',
    wechatBind: '微信绑定',
    bound: '已绑定',
    multiDevice: '多端登录控制',
    multiDeviceDesc: '允许在多个设备同时在线',
    loginHistory: '登录记录',
    loginHistoryDesc: '查看账号登录历史和设备信息'
  },
  general: {
    darkMode: '深色模式',
    on: '已开启',
    off: '已关闭',
    lang: '多语言切换',
    zh: '中文',
    en: 'English',
    layout: '消息流推荐布局',
    loveBoard: '恋爱画板',
    growth: '成长足迹',
    history: '浏览历史'
  },
  privacy: {
    settings: '隐私设置',
    report: '举报中心',
    contact: '联系作者',
    download: '下载 App',
    about: '关于悦木',
    logout: '退出登录',
    deleteAccount: '注销账号'
  },
  modals: {
    pwd: {
      title: '修改密码',
      wechatNote: '微信用户须知：',
      wechatNoteDesc: '微信快捷入驻初始密码默认为',
      current: '当前密码',
      currentPlaceholder: '请输入当前密码',
      new: '新密码',
      newPlaceholder: '新密码至少 8 位',
      confirm: '确认新密码',
      confirmPlaceholder: '再次输入新密码',
      submit: '确认修改',
      forgot: '忘记密码?'
    },
    email: {
      title: '修改邮箱',
      new: '新邮箱地址',
      newPlaceholder: '请输入新邮箱',
      code: '6位验证码',
      codePlaceholder: '请输入验证码',
      getCode: '获取',
      submit: '确认修改'
    },
    delAccount: {
      title: '安全注销账号',
      warnTitle: '安全提示：',
      warnDesc: '身份验证后将永久注销账号，此操作不可逆！',
      current: '当前密码',
      currentPlaceholder: '请输入账号密码',
      code: '邮箱验证码',
      codePlaceholder: '请输入验证码',
      getCode: '获取',
      submit: '确认注销',
      cancel: '取消'
    },
    wechat: {
      bindTitle: '微信绑定',
      qrAlt: '公众号二维码',
      scanDesc: '微信扫码关注，并发送下方验证码：',
      getting: '获取中...',
      expired: '已过期',
      clickRetry: '点击重新获取验证码',
      unbindTitle: '微信安全解绑',
      unbindScanDesc: '请使用当前绑定的微信扫码并发送下方验证码：'
    },
    logout: {
      title: '确认退出登录？',
      desc: '退出后需要重新登录才能继续使用。',
      cancel: '取消',
      submit: '退出'
    },
    growth: {
      title: '成长足迹',
      month: '月',
      mon: '一',
      tue: '二',
      wed: '三',
      thu: '四',
      fri: '五',
      sat: '六',
      sun: '日'
    },
    layout: {
      title: '消息流布局',
      waterfall: '瀑布流',
      waterfallDesc: '高度自然错落',
      masonry: '多列等高',
      masonryDesc: '整齐划一排版',
      single: '单列展示',
      singleDesc: '专注大图浏览'
    },
    about: {
      title: '关于我们',
      app: '悦木图库',
      docs: '官方文档',
      author: '鹿梦',
      creatorGuide: '创作者指南',
      privacyPolicy: '隐私政策',
      aboutUs: '关于我们'
    },
    download: {
      title: '下载 App',
      qrAlt: '下载二维码',
      desc: '扫描上方二维码直接下载'
    },
    privacySetup: {
      title: '隐私设置',
      save: '保存成功'
    }
  },
  msgs: {
    getting: '获取中...',
    getCodeFail: '获取验证码失败',
    expired: '已过期',
    bindSuccess: '绑定成功',
    codeExpiredRefresh: '验证码已过期，请刷新重试',
    unbindCodeFail: '获取解绑验证码失败',
    unbindSuccess: '解绑成功，下次登录请使用您的邮箱或悦木号',
    codeExpiredOrFail: '验证码已过期或验证失败',
    loadAuthFail: '加载权限失败',
    loadDeviceFail: '加载多设备失败',
    layoutWaterfall: '瀑布流',
    layoutMasonry: '多列等高',
    layoutSingle: '单列展示',
    fillRequired: '请填写完整',
    pwdLengthError: '新密码至少 8 位',
    pwdMismatch: '两次密码不一致',
    updateSuccess: '修改成功',
    updateFail: '修改失败：',
    inputEmail: '请输入新邮箱',
    sendSuccess: '发送成功',
    sendFail: '发送失败：',
    year: '年',
    locSuccess: '定位成功',
    locFail: '定位失败，已使用默认位置',
    beijing: '北京',
    notLogin: '未登录',
    logoutSuccess: '退出成功',
    logoutFail: '退出失败',
    inputPwd: '请输入密码',
    pwdError: '密码错误',
    codeSent: '验证码已发送',
    accountDeleted: '账号已注销',
    deleteFail: '注销失败',
    multiDeviceOn: '已允许多设备登录',
    multiDeviceOff: '已禁止多设备登录',
    setFail: '设置失败：'
  }
};
