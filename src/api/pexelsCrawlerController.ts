// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** triggerCrawl POST /api/pexels/crawl/trigger */
export async function triggerCrawlUsingPost(options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/pexels/crawl/trigger', {
    method: 'POST',
    ...(options || {}),
  })
}
