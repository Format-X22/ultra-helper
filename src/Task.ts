import { Exchange } from 'ccxt';
import { StockName, TaskConfig } from './TaskCalculator';
import { TaskState } from './Executor';
import { PhoneCall } from './PhoneCall';

export type TaskExplain = {
    id: number;
    // TODO -
};

export class Task {
    public state: TaskState = TaskState.INITIAL;
    public previewState: TaskState;
    public config: TaskConfig;
    public startTime: Date;
    public current: {
        bottom: number;
        enter: number;
        stop: number;
        take: number;
        amount: number;
    };

    constructor(
        public id: number,
        private phone: PhoneCall,
        private exchanges: Map<StockName, Exchange>
    ) {}

    public async handleTaskIteration(): Promise<void> {
        switch (this.state) {
            // TODO -

            default: {
                await this.handleTaskError(new Error('Unknown state'));
            }
        }

        // TODO -
    }

    public async handleTaskCancel(): Promise<void> {
        switch (this.state) {
            // TODO -

            default: {
                await this.handleTaskError(new Error('Unknown state'));
            }
        }

        // TODO -
    }

    public async handleTaskError(error: Error): Promise<void> {
        console.error(error);
        this.updateTaskState(TaskState.UNHANDLED_ERROR);
        await this.phone.doCall('Error');
        this.updateTaskState(TaskState.HANDLED_ERROR);
    }

    public updateTaskState(newState: TaskState): void {
        const explainJson: string = JSON.stringify(this.explain(), null, 2);

        console.log(`Task[${this.id}] ${this.state}=>${newState}, ${explainJson}`);

        this.previewState = this.state;
        this.state = newState;
    }

    public syncCurrentTaskValues(): void {
        if (!this.current.bottom) {
            this.current.bottom = this.config.bottom;
        }

        // TODO -
    }

    public syncTaskBottom(): void {
        // TODO -
    }

    public explain(): TaskExplain {
        // TODO -
        return { id: 0 };
    }
}
