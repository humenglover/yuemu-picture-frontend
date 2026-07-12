import i18n from '@/locales';
const t = i18n.global.t;

export const PIC_REVIEW_STATUS_ENUM = {
  REVIEWING: 0,
  PASS: 1,
  REJECT: 2,
}

export const PIC_REVIEW_STATUS_MAP = {
  get 0() { return t('constants.picture.reviewing') },
  get 1() { return t('constants.picture.pass') },
  get 2() { return t('constants.picture.reject') },
}

export const PIC_REVIEW_STATUS_OPTIONS = [
  { get label() { return PIC_REVIEW_STATUS_MAP[0] }, value: 0 },
  { get label() { return PIC_REVIEW_STATUS_MAP[1] }, value: 1 },
  { get label() { return PIC_REVIEW_STATUS_MAP[2] }, value: 2 },
]

export const PICTURE_EDIT_MESSAGE_TYPE_ENUM = {
  INFO: "INFO",
  ERROR: "ERROR",
  ENTER_EDIT: "ENTER_EDIT",
  EXIT_EDIT: "EXIT_EDIT",
  EDIT_ACTION: "EDIT_ACTION",
} as const;

