// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getSubmissionById GET /api/activity/submission/get */
export async function getSubmissionByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSubmissionByIdUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseActivitySubmissionVO_>('/api/activity/submission/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** listSubmissionByPage POST /api/activity/submission/list/page */
export async function listSubmissionByPageUsingPost(
  body: API.ActivitySubmissionQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageActivitySubmissionVO_>('/api/activity/submission/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** listMySubmissionByPage POST /api/activity/submission/my/list/page */
export async function listMySubmissionByPageUsingPost(
  body: API.ActivitySubmissionQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageActivitySubmissionVO_>(
    '/api/activity/submission/my/list/page',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    }
  )
}

/** reviewSubmission POST /api/activity/submission/review */
export async function reviewSubmissionUsingPost(
  body: API.ActivitySubmissionReviewRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/activity/submission/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** submitToActivity POST /api/activity/submission/submit */
export async function submitToActivityUsingPost(
  body: API.ActivitySubmissionAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>('/api/activity/submission/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
