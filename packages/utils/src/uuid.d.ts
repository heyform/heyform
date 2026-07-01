declare module 'uuid' {
  export function v4(options?: any): string
  export function v5(name: string, namespace: string | number[]): string
}
