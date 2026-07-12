export default {
  title: '未命名相册',
  desc: '在这里，贴满属于我们的浪漫瞬间...',
  count: '{count} 张相片',
  since: '始于 {date}',
  emptyOwner: '这一页还是空白的，快去洗些照片贴上来吧',
  emptyVisitor: 'Ta 的手账本还没有贴入照片哦',
  uploadBtn: '贴入新照片',
  editBtn: '编辑寄语',
  deleteBtn: '撕下照片',
  defaultIntro: '(悄悄留白，把故事放在心里...)',
  modals: {
    upload: {
      title: '洗印照片',
      dropzone: '点击或拖拽，挑选想贴入相册的相片',
      limit: '最多选 {limit} 张 (已传 {current}/{max})',
      placeholder: '在这张照片背后写下寄语...',
      cancel: '取消',
      uploading: '正在用胶水贴入...',
      submit: '确认贴入'
    },
    edit: {
      title: '编辑寄语',
      placeholder: '在这张照片背后写下寄语...',
      cancel: '取消',
      submit: '保存'
    },
    delete: {
      title: '撕下这张照片？',
      desc: '一旦从手账本上撕下，这段美好的记录就永远消失了。',
      submit: '忍痛撕下',
      cancel: '我再看看'
    }
  },
  msgs: {
    unknownTime: '未知时间',
    fetchAlbumFail: '获取相册信息失败',
    fetchPhotosFail: '获取照片列表失败',
    compressFail: '图片压缩失败',
    loadFail: '图片加载失败',
    readFail: '文件读取失败',
    maxAlbumLimit: '相册最多只能上传{max}张照片哦~',
    maxBatchLimit: '一次最多只能上传{max}张照片~',
    processFail: '图片处理失败，请重试',
    allSuccess: '所有照片贴入成功！',
    partialSuccess: '成功贴入 {success} 张，失败 {fail} 张',
    uploadFail: '上传失败',
    editSuccess: '描述已更新',
    editFail: '更新失败',
    delSuccess: '已撕下照片',
    delFail: '删除失败'
  }
};
