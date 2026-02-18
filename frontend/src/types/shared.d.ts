declare module '@shared/*' {
  const content: any;
  export default content;
}

declare module '@shared/schema/*' {
  export type DeleteUser = any;
  export type InsertUser = any;
  export type PublicUser = any;
  export type SelectUser = any;
  export type UpdateUser = any;

  export const deleteUserSchema: any;
  export const insertUserSchema: any;
  export const publicUserSchema: any;
  export const selectUserSchema: any;
}

declare module '@shared/utils' {
  export function apiFetch(...args: any[]): Promise<any>;
}
