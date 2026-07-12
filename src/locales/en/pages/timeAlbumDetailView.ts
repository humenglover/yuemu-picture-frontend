export default {
  title: 'Untitled Album',
  desc: 'Fill this page with our romantic moments...',
  count: '{count} Photos',
  since: 'Since {date}',
  emptyOwner: 'This page is empty. Print some photos and paste them here!',
  emptyVisitor: 'No photos in this scrapbook yet.',
  uploadBtn: 'Paste New Photo',
  editBtn: 'Edit Message',
  deleteBtn: 'Tear Off',
  defaultIntro: '(Quietly left blank, keeping the story in heart...)',
  modals: {
    upload: {
      title: 'Print Photos',
      dropzone: 'Click or drag to select photos',
      limit: 'Max {limit} photos (Uploaded {current}/{max})',
      placeholder: 'Write a message behind this photo...',
      cancel: 'Cancel',
      uploading: 'Gluing...',
      submit: 'Confirm Paste'
    },
    edit: {
      title: 'Edit Message',
      placeholder: 'Write a message behind this photo...',
      cancel: 'Cancel',
      submit: 'Save'
    },
    delete: {
      title: 'Tear off this photo?',
      desc: 'Once torn off from the scrapbook, this memory will be gone forever.',
      submit: 'Tear Off',
      cancel: 'Let Me See'
    }
  },
  msgs: {
    unknownTime: 'Unknown Time',
    fetchAlbumFail: 'Failed to fetch album info',
    fetchPhotosFail: 'Failed to fetch photos',
    compressFail: 'Failed to compress image',
    loadFail: 'Failed to load image',
    readFail: 'Failed to read file',
    maxAlbumLimit: 'You can upload max {max} photos in this album~',
    maxBatchLimit: 'Max {max} photos per upload~',
    processFail: 'Image processing failed, please try again',
    allSuccess: 'All photos pasted successfully!',
    partialSuccess: '{success} pasted, {fail} failed',
    uploadFail: 'Upload failed',
    editSuccess: 'Message updated',
    editFail: 'Update failed',
    delSuccess: 'Photo torn off',
    delFail: 'Deletion failed'
  }
};
