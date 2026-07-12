import router from '@/router';

// 向外暴露一个"等待用户回复"的 Promise 解析函数
// App.vue 里的自定义弹框会调用它来传递用户选择
let resolveExit: ((confirmed: boolean) => void) | null = null;

// App.vue 调用这个函数来告知用户的选择
export const respondExitConfirm = (confirmed: boolean) => {
  if (resolveExit) {
    resolveExit(confirmed);
    resolveExit = null;
  }
};

// 显示自定义退出确认弹框，返回用户选择的 Promise
const showExitConfirm = (): Promise<boolean> => {
  return new Promise((resolve) => {
    resolveExit = resolve;
    // 派发自定义事件，App.vue 监听后弹出自定义 UI
    window.dispatchEvent(new CustomEvent('show-exit-confirm'));
  });
};

export const handleBackButton = () => {
  return new Promise<void>((resolve, reject) => {
    document.addEventListener('plusready', () => {
      // @ts-ignore
      const webview = plus.webview.currentWebview();

      // 彻底退出应用的方法
      const exitApp = () => {
        // @ts-ignore
        if (plus.os.name === 'Android') {
          // @ts-ignore
          plus.runtime.quit();
          // 延时调用安卓底层的强制退出，确保后台进程被真正杀死，防止二次进入卡死
          setTimeout(() => {
            // @ts-ignore
            const System = plus.android.importClass('java.lang.System');
            System.exit(0);
          }, 150);
        } else {
          // @ts-ignore
          plus.runtime.quit();
        }
      };

      // @ts-ignore
      plus.key.addEventListener('backbutton', async () => {
        const currentRoute = router.currentRoute.value.path;
        
        webview.canBack(async (e: { canBack: boolean }) => {
          if (e.canBack) {
            webview.back(-1);
          } else {
            if (currentRoute === '/' || currentRoute === '/home') {
              // 确实在主页，并且没有可返回的历史记录时，才弹出退出弹框
              const confirmed = await showExitConfirm();
              if (confirmed) {
                exitApp();
              }
            } else {
              // 如果在底部其他页面（如“我的”等）且没有历史记录，尽可能先回到主页
              router.replace('/');
            }
          }
        });
        resolve();
      });
    });
  });
};
