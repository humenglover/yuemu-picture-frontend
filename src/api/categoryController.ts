// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** addCategory POST /api/category/add */
export async function addCategoryUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.addCategoryUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/category/add', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** deleteCategory POST /api/category/delete */
export async function deleteCategoryUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteCategoryUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/category/delete', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** listCategoryVO POST /api/category/list/page/vo */
export async function listCategoryVoUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listCategoryVOUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageCategoryVO_>('/api/category/list/page/vo', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** findCategory POST /api/category/search */
export async function findCategoryUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.findCategoryUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListCategoryVO_>('/api/category/search', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}
