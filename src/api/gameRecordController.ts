// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** listGameRecordsByPage POST /api/game/record/list */
export async function listGameRecordsByPageUsingPost(
  body: API.GameRecordQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageGameRecordVO_>('/api/game/record/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** getMyHistoryRecords POST /api/game/record/my/history */
export async function getMyHistoryRecordsUsingPost(
  body: API.GameRecordQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageGameRecordVO_>('/api/game/record/my/history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** getRankingList POST /api/game/record/ranking */
export async function getRankingListUsingPost(
  body: API.GameRecordQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageGameRecordVO_>('/api/game/record/ranking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** saveGameRecord POST /api/game/record/save */
export async function saveGameRecordUsingPost(
  body: API.GameRecordAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseGameRecord_>('/api/game/record/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
