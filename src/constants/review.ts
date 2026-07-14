// Picture review reject reason options
export const REJECT_REASON_OPTIONS_ZH = [
  { label: '图片尺寸不符合要求', value: 'size_invalid' },
  { label: '图片内容不当', value: 'content_invalid' },
  { label: '图片质量过低', value: 'quality_low' },
  { label: '图片格式不支持', value: 'format_invalid' },
  { label: '图片包含敏感内容', value: 'sensitive_content' },
  { label: '图片可能侵犯版权', value: 'copyright_issue' },
  { label: '其他原因', value: 'other' },
]

export const REJECT_REASON_OPTIONS_EN = [
  { label: 'Image size does not meet requirements', value: 'size_invalid' },
  { label: 'Inappropriate image content', value: 'content_invalid' },
  { label: 'Image quality too low', value: 'quality_low' },
  { label: 'Unsupported image format', value: 'format_invalid' },
  { label: 'Image contains sensitive content', value: 'sensitive_content' },
  { label: 'Possible copyright infringement', value: 'copyright_issue' },
  { label: 'Other', value: 'other' },
]

export const getRejectReasonOptions = (isZh: boolean) => isZh ? REJECT_REASON_OPTIONS_ZH : REJECT_REASON_OPTIONS_EN

// Reject reason messages
export const REJECT_REASON_MAP_ZH: Record<string, string> = {
  size_invalid: '图片尺寸不符合平台要求，请上传符合要求的图片',
  content_invalid: '图片内容不符合平台规范，请重新上传',
  quality_low: '图片质量较低，建议上传清晰度更高的图片',
  format_invalid: '不支持该图片格式，请使用支持的格式重新上传',
  sensitive_content: '图片包含敏感内容，请遵守平台规范',
  copyright_issue: '图片可能存在版权问题，请确保拥有相关权限',
  other: '',
}

export const REJECT_REASON_MAP_EN: Record<string, string> = {
  size_invalid: 'Image size does not meet platform requirements. Please upload an image that meets the requirements.',
  content_invalid: 'Image content does not comply with platform guidelines. Please upload again.',
  quality_low: 'Image quality is low. Please upload a higher quality image.',
  format_invalid: 'Unsupported image format. Please use a supported format and upload again.',
  sensitive_content: 'Image contains sensitive content. Please comply with platform guidelines.',
  copyright_issue: 'The image may have copyright issues. Please ensure you have the relevant permissions.',
  other: '',
}

export const getRejectReasonMap = (isZh: boolean) => isZh ? REJECT_REASON_MAP_ZH : REJECT_REASON_MAP_EN

// Post reject reason options
export const POST_REJECT_REASON_OPTIONS_ZH = [
  { label: '内容不当', value: 'INAPPROPRIATE_CONTENT' },
  { label: '违反规范', value: 'VIOLATE_RULES' },
  { label: '重复内容', value: 'DUPLICATE' },
  { label: '其他原因', value: 'OTHER' },
]

export const POST_REJECT_REASON_OPTIONS_EN = [
  { label: 'Inappropriate Content', value: 'INAPPROPRIATE_CONTENT' },
  { label: 'Violates Rules', value: 'VIOLATE_RULES' },
  { label: 'Duplicate Content', value: 'DUPLICATE' },
  { label: 'Other', value: 'OTHER' },
]

export const getPostRejectReasonOptions = (isZh: boolean) => isZh ? POST_REJECT_REASON_OPTIONS_ZH : POST_REJECT_REASON_OPTIONS_EN

// Post reject reason messages
export const POST_REJECT_REASON_MAP_ZH: Record<string, string> = {
  INAPPROPRIATE_CONTENT: '帖子内容包含不当信息，请修改后重新提交',
  VIOLATE_RULES: '帖子内容违反社区规范，请遵守社区规范后重新提交',
  DUPLICATE: '该内容已存在，请勿重复发布',
  OTHER: '',
}

export const POST_REJECT_REASON_MAP_EN: Record<string, string> = {
  INAPPROPRIATE_CONTENT: 'Post contains inappropriate content. Please modify and resubmit.',
  VIOLATE_RULES: 'Post violates community guidelines. Please comply and resubmit.',
  DUPLICATE: 'This content already exists. Please do not repost.',
  OTHER: '',
}

export const getPostRejectReasonMap = (isZh: boolean) => isZh ? POST_REJECT_REASON_MAP_ZH : POST_REJECT_REASON_MAP_EN

// Activity reject reason options
export const ACTIVITY_REJECT_REASON_OPTIONS_ZH = [
  { label: '内容不当', value: 'INAPPROPRIATE_CONTENT' },
  { label: '信息不完整', value: 'INCOMPLETE_INFO' },
  { label: '活动已过期', value: 'EXPIRED' },
  { label: '违反社区规范', value: 'VIOLATE_RULES' },
  { label: '其他原因', value: 'OTHER' },
]

export const ACTIVITY_REJECT_REASON_OPTIONS_EN = [
  { label: 'Inappropriate Content', value: 'INAPPROPRIATE_CONTENT' },
  { label: 'Incomplete Information', value: 'INCOMPLETE_INFO' },
  { label: 'Activity Expired', value: 'EXPIRED' },
  { label: 'Violates Rules', value: 'VIOLATE_RULES' },
  { label: 'Other', value: 'OTHER' },
]

export const getActivityRejectReasonOptions = (isZh: boolean) => isZh ? ACTIVITY_REJECT_REASON_OPTIONS_ZH : ACTIVITY_REJECT_REASON_OPTIONS_EN

// Activity reject reason messages
export const ACTIVITY_REJECT_REASON_MAP_ZH: Record<string, string> = {
  INAPPROPRIATE_CONTENT: '活动内容包含不当信息，请修改后重新提交',
  INCOMPLETE_INFO: '活动信息不完整，请补充必要信息后重新提交',
  EXPIRED: '活动已过期，请更新活动时间后重新提交',
  VIOLATE_RULES: '活动内容违反社区规范，请遵守社区规范后重新提交',
  OTHER: '',
}

export const ACTIVITY_REJECT_REASON_MAP_EN: Record<string, string> = {
  INAPPROPRIATE_CONTENT: 'Activity contains inappropriate content. Please modify and resubmit.',
  INCOMPLETE_INFO: 'Activity information is incomplete. Please provide required details and resubmit.',
  EXPIRED: 'Activity has expired. Please update the activity time and resubmit.',
  VIOLATE_RULES: 'Activity violates community guidelines. Please comply and resubmit.',
  OTHER: '',
}

export const getActivityRejectReasonMap = (isZh: boolean) => isZh ? ACTIVITY_REJECT_REASON_MAP_ZH : ACTIVITY_REJECT_REASON_MAP_EN

// Friend link reject reason options
export const FRIEND_LINK_REJECT_REASON_OPTIONS_ZH = [
  { label: '网站无法访问', value: 'SITE_UNREACHABLE' },
  { label: '内容不当', value: 'INAPPROPRIATE_CONTENT' },
  { label: '信息不完整', value: 'INCOMPLETE_INFO' },
  { label: '违反社区规范', value: 'VIOLATE_RULES' },
  { label: '其他原因', value: 'OTHER' },
]

export const FRIEND_LINK_REJECT_REASON_OPTIONS_EN = [
  { label: 'Site Unreachable', value: 'SITE_UNREACHABLE' },
  { label: 'Inappropriate Content', value: 'INAPPROPRIATE_CONTENT' },
  { label: 'Incomplete Information', value: 'INCOMPLETE_INFO' },
  { label: 'Violates Rules', value: 'VIOLATE_RULES' },
  { label: 'Other', value: 'OTHER' },
]

export const getFriendLinkRejectReasonOptions = (isZh: boolean) => isZh ? FRIEND_LINK_REJECT_REASON_OPTIONS_ZH : FRIEND_LINK_REJECT_REASON_OPTIONS_EN

// Friend link reject reason messages
export const FRIEND_LINK_REJECT_REASON_MAP_ZH: Record<string, string> = {
  SITE_UNREACHABLE: '网站无法正常访问，请确保网站可以正常打开',
  INAPPROPRIATE_CONTENT: '网站内容不符合要求，请确保内容符合社区规范',
  INCOMPLETE_INFO: '友链信息不完整，请补充必要信息后重新提交',
  VIOLATE_RULES: '友链内容违反社区规范，请遵守社区规范后重新提交',
  OTHER: '',
}

export const FRIEND_LINK_REJECT_REASON_MAP_EN: Record<string, string> = {
  SITE_UNREACHABLE: 'The website is unreachable. Please ensure the site is accessible.',
  INAPPROPRIATE_CONTENT: 'Website content does not meet requirements. Please ensure content complies with guidelines.',
  INCOMPLETE_INFO: 'Friend link information is incomplete. Please provide required details and resubmit.',
  VIOLATE_RULES: 'Friend link content violates community guidelines. Please comply and resubmit.',
  OTHER: '',
}

export const getFriendLinkRejectReasonMap = (isZh: boolean) => isZh ? FRIEND_LINK_REJECT_REASON_MAP_ZH : FRIEND_LINK_REJECT_REASON_MAP_EN

// Kept for backward compatibility
/** @deprecated Use getRejectReasonOptions(i18n.global.locale.value !== 'en-US') instead */
export const REJECT_REASON_OPTIONS = REJECT_REASON_OPTIONS_ZH
/** @deprecated Use getRejectReasonMap(i18n.global.locale.value !== 'en-US') instead */
export const REJECT_REASON_MAP = REJECT_REASON_MAP_ZH
/** @deprecated Use getPostRejectReasonOptions(i18n.global.locale.value !== 'en-US') instead */
export const POST_REJECT_REASON_OPTIONS = POST_REJECT_REASON_OPTIONS_ZH
/** @deprecated Use getPostRejectReasonMap(i18n.global.locale.value !== 'en-US') instead */
export const POST_REJECT_REASON_MAP = POST_REJECT_REASON_MAP_ZH
/** @deprecated Use getActivityRejectReasonOptions(i18n.global.locale.value !== 'en-US') instead */
export const ACTIVITY_REJECT_REASON_OPTIONS = ACTIVITY_REJECT_REASON_OPTIONS_ZH
/** @deprecated Use getActivityRejectReasonMap(i18n.global.locale.value !== 'en-US') instead */
export const ACTIVITY_REJECT_REASON_MAP = ACTIVITY_REJECT_REASON_MAP_ZH
/** @deprecated Use getFriendLinkRejectReasonOptions(i18n.global.locale.value !== 'en-US') instead */
export const FRIEND_LINK_REJECT_REASON_OPTIONS = FRIEND_LINK_REJECT_REASON_OPTIONS_ZH
/** @deprecated Use getFriendLinkRejectReasonMap(i18n.global.locale.value !== 'en-US') instead */
export const FRIEND_LINK_REJECT_REASON_MAP = FRIEND_LINK_REJECT_REASON_MAP_ZH
