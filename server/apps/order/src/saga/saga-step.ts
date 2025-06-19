export abstract class SagaStep<TContext, TResult = void> {
  abstract readonly name: string;
  abstract invoke(context: TContext): Promise<TResult>;
  abstract compensate(context: TContext): Promise<TResult>;
}
