// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** cancelVote DELETE /api/activity/vote/cancel */
export async function cancelVoteUsingDelete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.cancelVoteUsingDELETEParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/activity/vote/cancel', {
    method: 'DELETE',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** getMyVoteCount GET /api/activity/vote/my/count */
export async function getMyVoteCountUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getMyVoteCountUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>('/api/activity/vote/my/count', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** getMyVotedSubmissions GET /api/activity/vote/my/voted */
export async function getMyVotedSubmissionsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getMyVotedSubmissionsUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseSetLong_>('/api/activity/vote/my/voted', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** vote POST /api/activity/vote/submit */
export async function voteUsingPost(
  body: API.ActivityVoteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/activity/vote/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
