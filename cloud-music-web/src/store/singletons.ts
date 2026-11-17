import { defineStore } from 'pinia';

/**
 * 旧版 service 单例的统一容器。
 * 这些 service 以 ref 对象 + 方法暴露内部状态，实例形状无法直接拆成 pinia state；
 * 按 key 缓存在 store 闭包内，生命周期随 app，替代散落在各 hook 里的模块级 shared 变量。
 */
export const useSingletonStore = defineStore('legacySingletons', () => {
  const instances = new Map<string, unknown>();

  const get = <T>(key: string, factory: () => T): T => {
    if (!instances.has(key)) {
      instances.set(key, factory());
    }
    return instances.get(key) as T;
  };

  return { get };
});
