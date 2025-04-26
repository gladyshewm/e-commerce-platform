import { SagaStep } from './create-order/steps/saga-step';

export interface SagaFactory<T> {
  createSteps(): SagaStep<T>[];
}
