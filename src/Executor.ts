import { TaskConfig } from './TaskCalculator';

export type Task = {
    id: number;
};

const SQUEEZE_INDENT_PERCENT: number = 0.5;
const MAX_ENTER_AMOUNT: number = 190_000;
const STOP_INDENT_RATE: number = 2.5;

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
