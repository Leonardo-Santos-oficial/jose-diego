export interface AdminCommand<Result> {
  execute(): Promise<Result>;
}
