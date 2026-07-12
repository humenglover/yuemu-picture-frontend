// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getLeaderboard GET /api/invite/leaderboard */
export async function getLeaderboardUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getLeaderboardUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListUserInviteRankVO_>('/api/invite/leaderboard', {
    method: 'GET',
    params: {
      // limit has a default value: 10
      limit: '10',
      ...params,
    },
    ...(options || {}),
  })
}

/** listMyInviteRecords GET /api/invite/my/records */
export async function listMyInviteRecordsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listMyInviteRecordsUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageInviteRecordVO_>('/api/invite/my/records', {
    method: 'GET',
    params: {
      // current has a default value: 1
      current: '1',
      // size has a default value: 10
      size: '10',
      ...params,
    },
    ...(options || {}),
  })
}
