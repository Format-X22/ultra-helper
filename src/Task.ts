import { Exchange } from 'ccxt';
import { StockName, TaskConfig } from './TaskCalculator';
import { PhoneCall } from './PhoneCall';

export enum TaskState {
    INITIAL = 'INITIAL',
    WAITING = 'WAITING',
    IN_POSITION = 'IN_POSITION',
    STOP = 'STOP',
    TAKE = 'TAKE',
    UNHANDLED_ERROR = 'UNHANDLED_ERROR',
    HANDLED_ERROR = 'HANDLED_ERROR',
}

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
            case TaskState.INITIAL: {
                await this.syncCurrentValues();
                await this.placeEnterOrder();
                await this.placeTakeOrder();
                this.updateState(TaskState.WAITING);
                break;
            }

            case TaskState.WAITING: {
                if (await this.isEnter()) {
                    await this.placeStopOrder();
                    this.updateState(TaskState.IN_POSITION);
                } else {
                    const isChanged: boolean = await this.syncCurrentValues();

                    if (isChanged) {
                        await this.moveEnterOrder();
                        await this.moveTakeOrder();
                    }
                }
                break;
            }

            case TaskState.IN_POSITION: {
                if (await this.isStop()) {
                    await this.cancelTakeOrder();
                    this.updateState(TaskState.STOP);
                } else if (await this.isTake()) {
                    await this.cancelStopOrder();
                    this.updateState(TaskState.TAKE);
                }
                break;
            }

            case TaskState.STOP:
            case TaskState.TAKE:
            case TaskState.UNHANDLED_ERROR:
            case TaskState.HANDLED_ERROR:
                break;
        }
    }

    public async handleTaskCancel(): Promise<void> {
        switch (this.state) {
            // TODO -

            case TaskState.STOP:
            case TaskState.TAKE:
            case TaskState.UNHANDLED_ERROR:
            case TaskState.HANDLED_ERROR:
                break;
        }
    }

    public async handleTaskError(error: Error | string): Promise<void> {
        console.error(error);
        this.updateState(TaskState.UNHANDLED_ERROR);
        await this.phone.doCall('Error');
        this.updateState(TaskState.HANDLED_ERROR);
    }

    private async syncCurrentValues(): Promise<boolean> {
        // TODO -
        return true;
    }

    private async isEnter(): Promise<boolean> {
        // TODO -
        return true;
    }

    private async isTake(): Promise<boolean> {
        // TODO -
        return true;
    }

    private async isStop(): Promise<boolean> {
        // TODO -
        return true;
    }

    private async placeEnterOrder(): Promise<void> {
        // TODO -
    }

    private async moveEnterOrder(): Promise<void> {
        // TODO -
    }

    private async cancelEnterOrder(): Promise<void> {
        // TODO -
    }

    private async placeTakeOrder(): Promise<void> {
        // TODO -
    }

    private async moveTakeOrder(): Promise<void> {
        // TODO -
    }

    private async cancelTakeOrder(): Promise<void> {
        // TODO -
    }

    private async placeStopOrder(): Promise<void> {
        // TODO -
    }

    private async cancelStopOrder(): Promise<void> {
        // TODO -
    }

    public explain(): TaskExplain {
        // TODO -
        return { id: 0 };
    }
}
