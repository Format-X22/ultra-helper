import { StockName, TaskConfig } from './TaskCalculator';
import { PhoneCall } from './PhoneCall';
import { bitmex as BitMex, Exchange } from 'ccxt';
import { Task, TaskExplain, TaskState } from './Task';

const {
    smsc,
    stock,
}: {
    smsc: {
        login: string;
        password: string;
        phones: string;
    };
    stock: {
        bitmex: {
            apiKey: string;
            secret: string;
        };
    };
} = require('../config.json');

const LOOP_INTERVAL: number = 5000;

export class Executor {
    private readonly taskMap: Map<number, Task> = new Map<number, Task>();
    private readonly phone: PhoneCall;
    private readonly exchanges: Map<StockName, Exchange> = new Map<StockName, Exchange>();
    private lastTaskId: number = 0;

    constructor() {
        this.phone = new PhoneCall(smsc.login, smsc.password, smsc.phones);
        this.exchanges.set(
            StockName.BITMEX,
            new BitMex({
                apiKey: stock.bitmex.apiKey,
                secret: stock.bitmex.secret,
            })
        );

        setTimeout(this.runIteration.bind(this), LOOP_INTERVAL);
    }

    public async startTask(config: TaskConfig): Promise<void> {
        const task: Task = new Task(++this.lastTaskId, this.phone, this.exchanges, config);

        this.taskMap.set(task.getId(), task);
    }

    public async cancelTask(id: number): Promise<string> {
        const task: Task = this.taskMap.get(id);

        if (!task) {
            return 'Unknown task';
        }

        try {
            await task.handleTaskCancel();
        } catch (error) {
            await task.handleTaskError(error);
        }

        this.taskMap.delete(id);

        return 'Success task cancel';
    }

    public getTaskIds(): Array<number> {
        return Array.from(this.taskMap.keys());
    }

    public async getStatus(): Promise<Array<TaskExplain>> {
        return Array.from(this.taskMap.values()).map((task: Task): TaskExplain => task.explain());
    }

    private async runIteration(): Promise<void> {
        for (const task of this.taskMap.values()) {
            const state: TaskState = task.getState();

            if (state === TaskState.HANDLED_ERROR || state === TaskState.UNHANDLED_ERROR) {
                continue;
            }

            try {
                await task.handleTaskIteration();
            } catch (error) {
                await task.handleTaskError(error);
            }
        }

        setTimeout(this.runIteration.bind(this), LOOP_INTERVAL);
    }
}
