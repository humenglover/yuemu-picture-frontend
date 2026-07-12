// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** deleteLoginRecord POST /api/loginRecord/delete */
export async function deleteLoginRecordUsingPost(body: number, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>('/api/loginRecord/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** batchDeleteLoginRecord POST /api/loginRecord/delete/batch */
export async function batchDeleteLoginRecordUsingPost(
  body: number[],
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/loginRecord/delete/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** getLoginRecordVOById GET /api/loginRecord/get/vo */
export async function getLoginRecordVoByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getLoginRecordVOByIdUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseUserLoginRecordVO_>('/api/loginRecord/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** listMyLoginRecordByPage POST /api/loginRecord/list/page/vo */
export async function listMyLoginRecordByPageUsingPost(
  body: API.UserLoginRecordQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageUserLoginRecordVO_>('/api/loginRecord/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** listLoginRecordByPage POST /api/loginRecord/list/page/vo/admin */
export async function listLoginRecordByPageUsingPost(
  body: API.UserLoginRecordQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageUserLoginRecordVO_>('/api/loginRecord/list/page/vo/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
