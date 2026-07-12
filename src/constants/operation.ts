import i18n from '@/locales';
const t = i18n.global.t;

export const OPERATION_ENUM = {
  DELETE: 0,
  APPROVE: 1,
  REJECT: 2
};

export const OPERATION_MAP = {
  get 0() { return t('constants.operation.delete') },
  get 1() { return t('constants.operation.approve') },
  get 2() { return t('constants.operation.reject') }
};

export const OPERATION_OPTIONS = [
  { get label() { return OPERATION_MAP[0] }, value: 0 },
  { get label() { return OPERATION_MAP[1] }, value: 1 },
  { get label() { return OPERATION_MAP[2] }, value: 2 }
];
