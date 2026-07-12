import i18n from '@/locales';
const t = i18n.global.t;

export const POST_STATUS_ENUM = {
  REVIEWING: 0,
  PASS: 1,
  REJECT: 2,
}

export const POST_STATUS_MAP = {
  get [POST_STATUS_ENUM.REVIEWING]() { return t('constants.post.reviewing') },
  get [POST_STATUS_ENUM.PASS]() { return t('constants.post.pass') },
  get [POST_STATUS_ENUM.REJECT]() { return t('constants.post.reject') },
}

export const POST_STATUS_OPTIONS = [
  { get label() { return POST_STATUS_MAP[POST_STATUS_ENUM.REVIEWING] }, value: POST_STATUS_ENUM.REVIEWING },
  { get label() { return POST_STATUS_MAP[POST_STATUS_ENUM.PASS] }, value: POST_STATUS_ENUM.PASS },
  { get label() { return POST_STATUS_MAP[POST_STATUS_ENUM.REJECT] }, value: POST_STATUS_ENUM.REJECT },
]
