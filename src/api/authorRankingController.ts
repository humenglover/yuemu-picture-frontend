// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getAuthorRankingList GET /api/api/author-ranking/list */
export async function getAuthorRankingListUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAuthorRankingListUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListAuthorRankingVO_>('/api/api/author-ranking/list', {
    method: 'GET',
    params: {
      // limit has a default value: 100
      limit: '100',

      ...params,
    },
    ...(options || {}),
  })
}

/** getPictureAuthorRanking GET /api/api/author-ranking/picture/${param0} */
export async function getPictureAuthorRankingUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPictureAuthorRankingUsingGETParams,
  options?: { [key: string]: any }
) {
  const { timeRange: param0, ...queryParams } = params
  return request<API.BaseResponseListAuthorRankingVO_>(
    `/api/api/author-ranking/picture/${param0}`,
    {
      method: 'GET',
      params: {
        // limit has a default value: 100
        limit: '100',
        ...queryParams,
      },
      ...(options || {}),
    }
  )
}

/** getPostAuthorRanking GET /api/api/author-ranking/post/${param0} */
export async function getPostAuthorRankingUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPostAuthorRankingUsingGETParams,
  options?: { [key: string]: any }
) {
  const { timeRange: param0, ...queryParams } = params
  return request<API.BaseResponseListAuthorRankingVO_>(`/api/api/author-ranking/post/${param0}`, {
    method: 'GET',
    params: {
      // limit has a default value: 100
      limit: '100',
      ...queryParams,
    },
    ...(options || {}),
  })
}
