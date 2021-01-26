import { TaskConfig } from './TaskCalculator';
import { PhoneCall } from './PhoneCall';

const {
    smsc,
}: {
    smsc: {
        login: string;
        password: string;
        phones: string;
    };
} = require('../config.json');

enum TaskState {
    INITIAL = 'INITIAL',
    WAITING = 'WAITING',
    UNHANDLED_ERROR = 'UNHANDLED_ERROR',
    HANDLED_ERROR = 'HANDLED_ERROR',
}

export type Task = {
    id: number;
    state: TaskState;
    previewState: TaskState;
};

const LOOP_INTERVAL: number = 5000;

export class Executor {
    private lastTaskId: number = 0;
    private taskMap: Map<number, Task>;
    private phone: PhoneCall;

    constructor() {
        this.phone = new PhoneCall(smsc.login, smsc.password, smsc.phones);

        setTimeout(this.runIteration.bind(this), LOOP_INTERVAL);
    }

    public async startTask(config: TaskConfig): Promise<void> {
        const task: Task = this.getEmptyTask();

        // TODO -

        this.updateTaskState(task, TaskState.WAITING);
        this.taskMap.set(task.id, task);
    }

    public async cancelTask(id: number): Promise<string> {
        const task: Task = this.taskMap.get(id);

        if (!task) {
            return 'Unknown task';
        }

        try {
            await this.handleTaskCancel(task);
        } catch (error) {
            await this.handleTaskError(task, error);
        }

        this.taskMap.delete(id);

        return 'Success task cancel';
    }

    public async getStatus(): Promise<Array<Task>> {
        return Array.from(this.taskMap.values());
    }

    private getEmptyTask(): Task {
        return {
            id: ++this.lastTaskId,
            state: TaskState.INITIAL,
            previewState: null,
        };
    }

    private async runIteration(): Promise<void> {
        for (const task of this.taskMap.values()) {
            if (
                task.state === TaskState.HANDLED_ERROR ||
                task.state === TaskState.UNHANDLED_ERROR
            ) {
                continue;
            }

            try {
                await this.handleTaskIteration(task);
            } catch (error) {
                await this.handleTaskError(task, error);
            }
        }

        setTimeout(this.runIteration.bind(this), LOOP_INTERVAL);
    }

    private async handleTaskIteration(task: Task): Promise<void> {
        switch (task.state) {
            // TODO -

            default: {
                await this.handleTaskError(task, new Error('Unknown state'));
            }
        }

        // TODO -
    }

    private async handleTaskCancel(task: Task): Promise<void> {
        switch (task.state) {
            // TODO -

            default: {
                await this.handleTaskError(task, new Error('Unknown state'));
            }
        }

        // TODO -
    }

    private async handleTaskError(task: Task, error: Error): Promise<void> {
        console.error(error);
        this.updateTaskState(task, TaskState.UNHANDLED_ERROR);
        await this.phone.doCall('Error');
        this.updateTaskState(task, TaskState.HANDLED_ERROR);
    }

    private updateTaskState(task: Task, newState: TaskState): void {
        const taskAsJson: string = JSON.stringify(task, null, 2);

        console.log(`Task[${task.id}] ${task.state}=>${newState}, ${taskAsJson}`);

        task.previewState = task.state;
        task.state = newState;
    }
}
