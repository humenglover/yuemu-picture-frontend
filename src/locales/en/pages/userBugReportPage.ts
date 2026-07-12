export default {
  title: 'Submit Bug Report',
  subtitle: 'Help us improve our product, thank you for your feedback',
  formTitle: 'Submit Form',
  reportTitle: 'Submit Report',
  fields: {
    title: {
      label: 'Title',
      placeholder: 'Enter bug title',
      maxLen: 'Title cannot exceed {max} characters',
      desc: 'Briefly describe the issue'
    },
    priority: {
      label: 'Priority',
      placeholder: 'Select priority',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    },
    description: {
      label: 'Description',
      placeholder: 'Enter detailed description',
      maxLen: 'Description cannot exceed {max} characters',
      desc: 'Describe the issue in detail, including operations and phenomena'
    },
    steps: {
      label: 'Steps to Reproduce',
      placeholder: 'Enter reproduction steps',
      maxLen: 'Steps cannot exceed {max} characters',
      desc: 'Describe how to reproduce the bug step by step'
    },
    expected: {
      label: 'Expected Result',
      placeholder: 'Enter expected result',
      maxLen: 'Expected result cannot exceed {max} characters',
      desc: 'Describe the expected behavior'
    },
    actual: {
      label: 'Actual Result',
      placeholder: 'Enter actual result',
      maxLen: 'Actual result cannot exceed {max} characters',
      desc: 'Describe the actual behavior or error'
    },
    device: {
      label: 'Device Info',
      placeholder: 'e.g. iPhone 12, Windows 11'
    },
    browser: {
      label: 'Browser Info',
      placeholder: 'e.g. Chrome 90, Safari 14'
    }
  },
  btns: {
    submitting: 'Submitting...',
    submit: 'Submit Report',
    reset: 'Reset',
    refresh: 'Refresh'
  },
  list: {
    title: 'Feedback List',
    myRecords: 'My Feedback Records',
    search: 'Search title or description',
    filterStatus: 'Filter status',
    allStatus: 'All Status',
    status: {
      pending: 'Pending',
      resolved: 'Resolved',
      ignored: 'Ignored',
      unknown: 'Unknown'
    },
    columns: {
      title: 'Title',
      priority: 'Priority',
      status: 'Status',
      steps: 'Steps to Reproduce',
      expected: 'Expected Result',
      actual: 'Actual Result',
      device: 'Device Info',
      browser: 'Browser',
      createTime: 'Created At',
      resolveTime: 'Resolved At'
    },
    empty: 'No feedback records yet'
  },
  msgs: {
    submitSuccess: 'Bug report submitted successfully',
    submitFail: 'Failed to submit bug report: ',
    submitFailRetry: 'Submit failed, please try again later',
    fetchFail: 'Failed to fetch feedback list: ',
    fetchFailUnknown: 'Failed to fetch feedback list'
  }
};
