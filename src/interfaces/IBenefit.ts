export interface IBenefit<T> {
  id: string;
  apply(context: T): T;
  isApplicable(context: T): boolean;
}
