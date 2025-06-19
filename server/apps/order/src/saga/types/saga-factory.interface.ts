import { SagaStep } from '../saga-step';

export interface SagaFactory<T> {
  createSteps(): SagaStep<T>[];
}
