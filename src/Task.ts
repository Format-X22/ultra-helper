import { Exchange } from 'ccxt';
import { StockName, TaskConfig } from './TaskCalculator';
import { TaskState } from './Executor';
import { PhoneCall } from './PhoneCall';

export type TaskExplain = {
    id: number;
    // TODO -
};

export class Task {
    private state: TaskState = TaskState.INITIAL;
    private previewState: TaskState;
    private startTime: Date;
    private current: {
        bottom: number;
        enter: number;
        stop: number;
        take: number;
        amount: number;
    } = {
        bottom: null,
        enter: null,
        stop: null,
        take: null,
        amount: null,
    };

    constructor(
        private id: number,
        private phone: PhoneCall,
        private exchanges: Map<StockName, Exchange>,
        private config: TaskConfig
    ) {
        this.startTime = new Date();
    }

    public getId(): number {
        return this.id;
    }

    public getState(): TaskState {
        return this.state;
    }

    public updateState(newState: TaskState): void {
        const explainJson: string = JSON.stringify(this.explain(), null, 2);

        console.log(`Task[${this.id}] ${this.state}=>${newState}, ${explainJson}`);

        this.previewState = this.state;
        this.state = newState;
    }

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
        this.updateState(TaskState.UNHANDLED_ERROR);
        await this.phone.doCall('Error');
        this.updateState(TaskState.HANDLED_ERROR);
    }

    private async syncCurrentValues(): Promise<void> {
        if (!this.current.bottom) {
            this.current.bottom = this.config.bottom;
        }

        // TODO -
    }

    public explain(): TaskExplain {
        // TODO -
        return { id: 0 };
    }
}
