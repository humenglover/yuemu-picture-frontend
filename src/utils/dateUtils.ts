import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import relativeTime from 'dayjs/plugin/relativeTime'
import i18n from '@/locales'

dayjs.extend(relativeTime)

const t = (key: string) => i18n.global.t(key)

/** 设置 dayjs 语言跟随 i18n */
const syncLocale = () => {
  const locale = i18n.global.locale.value
  dayjs.locale(locale === 'en-US' ? 'en' : 'zh-cn')
}
// 立即同步一次
syncLocale()
// 监听语言切换
i18n.global.locale.value && syncLocale()

const isZh = () => i18n.global.locale.value !== 'en-US'

/**
 * 格式化时间
 * @param time 时间戳或日期字符串
 * @param type 格式化类型：'relative' | 'date' | 'full'
 * @returns 格式化后的时间字符串
 */
export const formatTime = (time: string | number | Date | undefined, type: 'relative' | 'date' | 'full' = 'relative'): string => {
  if (!time) return t('common.message.unknownTime')

  syncLocale()
  const date = dayjs(time)
  const now = dayjs()

  // 如果是未来时间
  if (date.isAfter(now)) {
    if (isZh()) {
      return date.year() === now.year()
        ? date.format('MM月DD日 HH:mm')
        : date.format('YYYY年MM月DD日 HH:mm')
    }
    return date.year() === now.year()
      ? date.format('MM/DD HH:mm')
      : date.format('YYYY/MM/DD HH:mm')
  }

  switch (type) {
    case 'relative':
      // 如果是今天
      if (date.isSame(now, 'day')) {
        return date.format('HH:mm')
      }
      // 如果是昨天
      if (date.isSame(now.subtract(1, 'day'), 'day')) {
        return t('common.message.yesterday') + ' ' + date.format('HH:mm')
      }
      // 如果是前天
      if (date.isSame(now.subtract(2, 'day'), 'day')) {
        return t('common.message.dayBeforeYesterday') + ' ' + date.format('HH:mm')
      }
      // 如果是本周
      if (date.isSame(now, 'week')) {
        return date.format('dddd HH:mm')
      }
      // 如果是今年
      if (date.isSame(now, 'year')) {
        return isZh() ? date.format('MM月DD日 HH:mm') : date.format('MM/DD HH:mm')
      }
      // 其他情况
      return isZh() ? date.format('YYYY年MM月DD日 HH:mm') : date.format('YYYY/MM/DD HH:mm')

    case 'date':
      if (!date.isSame(now, 'year')) {
        return isZh() ? date.format('YYYY年MM月DD日') : date.format('YYYY/MM/DD')
      }
      return isZh() ? date.format('MM月DD日') : date.format('MM/DD')

    case 'full':
      return isZh() ? date.format('YYYY年MM月DD日 HH:mm:ss') : date.format('YYYY/MM/DD HH:mm:ss')

    default:
      return date.format('YYYY-MM-DD HH:mm:ss')
  }
}

/**
 * 格式化消息时间
 * @param date 日期
 * @returns 格式化后的时间字符串
 */
export const formatMessageTime = (date: Date | string | number | undefined): string => {
  if (!date) return ''

  syncLocale()
  const now = dayjs()
  const target = dayjs(date)

  if (target.isSame(now, 'day')) {
    return target.format('HH:mm')
  } else if (target.isSame(now.subtract(1, 'day'), 'day')) {
    return t('common.message.yesterday')
  } else if (target.isSame(now, 'year')) {
    return target.format('MM-DD')
  } else {
    return target.format('YYYY-MM-DD')
  }
}

/**
 * 获取相对时间
 * @param date 日期
 * @returns 相对时间字符串
 */
export const getRelativeTime = (date: Date | string | number): string => {
  syncLocale()
  return dayjs(date).fromNow()
}

/**
 * 获取简短日期 (YY-MM-DD)
 * @param date 日期
 * @returns 简短日期格式
 */
export const formatShortDate = (date: Date | string | number | undefined): string => {
  if (!date) return ''
  return dayjs(date).format('YY-MM-DD')
}
