import { saveAs } from 'file-saver'
import i18n from '@/locales';

const t = (key: string) => i18n.global.t(key);

/**
 * 格式化文件大小
 * @param size
 */
export const formatSize = (size?: number) => {
  if (!size) return t('common.message.unknown')
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

/**
 * 下载图片
 * @param url 图片下载地址
 * @param fileName 要保存为的文件名
 */
export function downloadImage(url?: string, fileName?: string) {
  if (!url) {
    return
  }

  // 兼容 HBuilderX (HTML5+) App 运行环境
  if (typeof window !== 'undefined' && (window as any).plus) {
    const plus = (window as any).plus;

    // 如果是 Base64 数据流（如 canvas 导出的图片）
    if (url.startsWith('data:image/')) {
      plus.nativeUI.showWaiting(t('common.message.saving'));
      const bitmap = new plus.nativeObj.Bitmap('share_img');
      bitmap.loadBase64Data(
        url,
        function () {
          bitmap.save(
            '_doc/share_' + Date.now() + '.jpg',
            { overwrite: true, quality: 100 },
            function (i: any) {
              plus.gallery.save(
                i.target,
                function () {
                  plus.nativeUI.closeWaiting();
                  plus.nativeUI.toast(t('common.message.saveToAlbumSuccess'));
                  bitmap.clear();
                },
                function (e: any) {
                  plus.nativeUI.closeWaiting();
                  plus.nativeUI.toast(t('common.message.saveToAlbumFailed'));
                  bitmap.clear();
                }
              );
            },
            function (e: any) {
              plus.nativeUI.closeWaiting();
              plus.nativeUI.toast(t('common.message.saveFileFailed'));
              bitmap.clear();
            }
          );
        },
        function (e: any) {
          plus.nativeUI.closeWaiting();
          plus.nativeUI.toast(t('common.message.processingImageFailed'));
        }
      );
      return;
    }

    // 常规网络图片下载
    plus.nativeUI.showWaiting(t('common.message.downloading'));
    const dtask = plus.downloader.createDownload(
      url,
      {},
      function (d: any, status: number) {
        if (status === 200) {
          // 下载成功，保存到相册
          plus.gallery.save(
            d.filename,
            function () {
              plus.nativeUI.closeWaiting();
              plus.nativeUI.toast(t('common.message.saveToAlbumSuccess'));
            },
            function (e: any) {
              plus.nativeUI.closeWaiting();
              plus.nativeUI.toast(t('common.message.saveToAlbumFailed') + ': ' + JSON.stringify(e));
            }
          );
        } else {
          plus.nativeUI.closeWaiting();
          plus.nativeUI.toast(t('common.message.downloadFailed'));
        }
      }
    );
    dtask.start();
    return;
  }

  // 普通 Web 端
  saveAs(url, fileName)
}

/**
 * 将颜色值转换为标准 #RRGGBB 格式
 * @param input
 */
export function toHexColor(input: string) {
  // 去掉 0x 前缀
  const colorValue = input.startsWith('0x') ? input.slice(2) : input

  // 将剩余部分解析为十六进制数，再转成 6 位十六进制字符串
  const hexColor = parseInt(colorValue, 16).toString(16).padStart(6, '0')

  // 返回标准 #RRGGBB 格式
  return `#${hexColor}`
}
