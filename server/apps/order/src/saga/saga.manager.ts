import { Logger } from '@nestjs/common';
import { SagaStep } from './saga-step';

export class SagaManager<T> {
  private readonly logger = new Logger(SagaManager.name);

  constructor(private readonly steps: SagaStep<T>[]) {}

  async execute(initialParams: T): Promise<void> {
    const completedSteps: SagaStep<T>[] = [];

    for (const step of this.steps) {
      try {
        this.logger.log(`Invoking step: ${step.name}`);
        await step.invoke(initialParams);
        completedSteps.push(step);
      } catch (error) {
        this.logger.error(
          `Failed to invoke step: ${step.name}, starting compensation...`,
        );
        for (const stepToUndo of completedSteps.reverse()) {
          try {
            this.logger.log(`Compensating step: ${stepToUndo.name}`);
            await stepToUndo.compensate(initialParams);
          } catch (compensationError) {
            this.logger.error(
              `Failed to compensate step: ${stepToUndo.name}, error: ${compensationError.message}`,
              compensationError.stack,
            );
          }
        }
        this.logger.log(`Saga failed. Compensation completed`);
        throw error;
      }
    }
    this.logger.log('Saga completed successfully');
  }
}
