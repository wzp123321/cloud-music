/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vue 官方 .vue 模块声明模板要求 any
  const component: DefineComponent<object, object, any>
  export default component
}
