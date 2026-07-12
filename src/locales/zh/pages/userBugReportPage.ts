export default {
  title: '提交漏洞反馈',
  subtitle: '帮助我们改进产品体验，感谢您的宝贵意见',
  formTitle: '提交表单',
  reportTitle: '提交漏洞报告',
  fields: {
    title: {
      label: '标题',
      placeholder: '请输入漏洞标题',
      maxLen: '标题不能超过 {max} 个字符',
      desc: '请简明扼要地描述遇到的问题'
    },
    priority: {
      label: '优先级',
      placeholder: '请选择优先级',
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    },
    description: {
      label: '详细描述',
      placeholder: '请输入详细描述',
      maxLen: '描述不能超过 {max} 个字符',
      desc: '请详细描述您遇到的问题，包括具体的操作步骤和现象'
    },
    steps: {
      label: '重现步骤',
      placeholder: '请输入重现步骤',
      maxLen: '重现步骤不能超过 {max} 个字符',
      desc: '请按步骤详细描述如何重现该问题，例如：1. 点击 xx 按钮 2. 输入 xx 内容 3. 发生 xx 异常'
    },
    expected: {
      label: '预期结果',
      placeholder: '请输入预期结果',
      maxLen: '预期结果不能超过 {max} 个字符',
      desc: '请描述您期望的正常行为或结果'
    },
    actual: {
      label: '实际结果',
      placeholder: '请输入实际结果',
      maxLen: '实际结果不能超过 {max} 个字符',
      desc: '请描述实际发生的现象或错误结果'
    },
    device: {
      label: '设备信息',
      placeholder: '例如：iPhone 12, Windows 11 等'
    },
    browser: {
      label: '浏览器信息',
      placeholder: '例如：Chrome 90, Safari 14 等'
    }
  },
  btns: {
    submitting: '提交中...',
    submit: '提交漏洞报告',
    reset: '重置',
    refresh: '刷新'
  },
  list: {
    title: '用户反馈列表',
    myRecords: '我的反馈记录',
    search: '搜索标题或描述',
    filterStatus: '筛选状态',
    allStatus: '全部状态',
    status: {
      pending: '待处理',
      resolved: '已解决',
      ignored: '已忽略',
      unknown: '未知'
    },
    columns: {
      title: '标题',
      priority: '优先级',
      status: '状态',
      steps: '重现步骤',
      expected: '预期结果',
      actual: '实际结果',
      device: '设备信息',
      browser: '浏览器',
      createTime: '创建时间',
      resolveTime: '解决时间'
    },
    empty: '暂无反馈记录'
  },
  msgs: {
    submitSuccess: '漏洞报告提交成功',
    submitFail: '提交漏洞报告失败：',
    submitFailRetry: '提交失败，请稍后重试',
    fetchFail: '获取反馈列表失败：',
    fetchFailUnknown: '获取反馈列表失败'
  }
};
