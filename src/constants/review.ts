// 常用拒绝原因选项
export const REJECT_REASON_OPTIONS = [
  { label: '图片尺寸不符合要求', value: 'size_invalid' },
  { label: '图片内容不当', value: 'content_invalid' },
  { label: '图片质量过低', value: 'quality_low' },
  { label: '图片格式不支持', value: 'format_invalid' },
  { label: '图片包含敏感内容', value: 'sensitive_content' },
  { label: '图片可能侵犯版权', value: 'copyright_issue' },
  { label: '其他原因', value: 'other' },
]

// 拒绝原因对应的默认文案
export const REJECT_REASON_MAP = {
  size_invalid: '图片尺寸不符合平台要求，请上传符合要求的图片',
  content_invalid: '图片内容不符合平台规范，请重新上传',
  quality_low: '图片质量较低，建议上传清晰度更高的图片',
  format_invalid: '不支持该图片格式，请使用支持的格式重新上传',
  sensitive_content: '图片包含敏感内容，请遵守平台规范',
  copyright_issue: '图片可能存在版权问题，请确保拥有相关权限',
  other: '',
}
