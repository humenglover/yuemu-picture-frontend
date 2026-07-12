import { saveAs } from 'file-saver'

/**
 * 格式化文件大小
 * @param size
 */
export const formatSize = (size?: number) => {
  if (!size) return '未知'
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
      plus.nativeUI.showWaiting('正在保存...');
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
                  plus.nativeUI.toast('已成功保存到系统相册');
                  bitmap.clear();
                },
                function (e: any) {
                  plus.nativeUI.closeWaiting();
                  plus.nativeUI.toast('保存到相册失败');
                  bitmap.clear();
                }
              );
            },
            function (e: any) {
              plus.nativeUI.closeWaiting();
              plus.nativeUI.toast('保存文件失败');
              bitmap.clear();
            }
          );
        },
        function (e: any) {
          plus.nativeUI.closeWaiting();
          plus.nativeUI.toast('处理图像失败');
        }
      );
      return;
    }

    // 常规网络图片下载
    plus.nativeUI.showWaiting('正在下载...');
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
              plus.nativeUI.toast('已成功保存到系统相册');
            },
            function (e: any) {
              plus.nativeUI.closeWaiting();
              plus.nativeUI.toast('保存到相册失败: ' + JSON.stringify(e));
            }
          );
        } else {
          plus.nativeUI.closeWaiting();
          plus.nativeUI.toast('下载失败');
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
