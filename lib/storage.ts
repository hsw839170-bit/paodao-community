/**
 * 安全访问 localStorage 的工具函数
 * 处理移动端隐私模式下 localStorage 被禁用的情况
 */

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage.getItem 失败:', error);
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('localStorage.setItem 失败:', error);
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('localStorage.removeItem 失败:', error);
    return false;
  }
}
