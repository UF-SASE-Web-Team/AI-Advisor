declare module '@shared/*' {
  const content: any;
  export default content;
}

declare module '@shared/schema/*' {
  const content: any;
  export = content;
}

declare module '@shared/utils' {
  export function apiFetch(...args: any[]): Promise<any>;
}
