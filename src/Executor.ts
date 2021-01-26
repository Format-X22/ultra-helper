import { TaskConfig } from './TaskCalculator';

export type Task = {
    id: number;
};

export class Executor {
    async startTask(config: TaskConfig): Promise<void> {
        // TODO -
    }

    async cancelTask(id: number): Promise<string> {
        // TODO -
        return 'TODO';
    }

    async getStatus(): Promise<Array<Task>> {
        // TODO -
        return [{ id: 0 }, { id: 1 }];
    }
}
