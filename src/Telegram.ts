import * as TelegramBot from 'node-telegram-bot-api';
import {
    CandleSize,
    Currency,
    Direction,
    StockName,
    TaskCalculator,
    TaskConfig,
} from './TaskCalculator';
import { Executor } from './Executor';
import { TaskExplain } from './Task';

type TelegramKeyboard = {
    reply_markup: {
        remove_keyboard?: boolean;
        keyboard?: Array<Array<string>>;
    };
};

enum ConfirmButtons {
    OK = 'OK',
    CANCEL = 'CANCEL',
}

enum RootCommands {
    STATUS = 'STATUS',
    TASK = 'TASK',
    CANCEL = 'CANCEL',
    PING = 'PING',
}

enum DialogFeed {
    ROOT,
    TASK,
    CANCEL,
}

enum TaskFeed {
    START,
    STOCK,
    CURRENCY,
    DIRECTION,
    RISK_AMOUNT,
    CANDLE_SIZE,
    LINE_START,
    LINE_10,
    BOTTOM,
    CONFIRM,
}

enum CancelFeed {
    START,
    CHOICE,
    CONFIRM,
}

export class Telegram {
    private bot: TelegramBot;
    private dialogState: DialogFeed = DialogFeed.ROOT;
    private taskState: TaskFeed = TaskFeed.START;
    private taskCalculator: TaskCalculator;
    private cancelState: CancelFeed;
    private taskToCancel: number;
    private executor: Executor;

    constructor(private key: string, private ownerId: number) {
        this.executor = new Executor();
        this.taskCalculator = new TaskCalculator();
        this.bot = new TelegramBot(key, { polling: true });

        this.bot.on(
            'text',
            async (message: { chat: { id: number }; text: string }): Promise<void> => {
                if (await this.checkAccess(message.chat.id)) {
                    await this.handleText(message.text.trim());
                }
            }
        );

        this.send('Started!', this.makeKeyboardWith(RootCommands)).catch((error: Error): void => {
            console.error(error);
            process.exit(1);
        });
    }

    public async send(
        text: string,
        options?: TelegramKeyboard,
        disableKeyboardRemover?: boolean
    ): Promise<void> {
        if (!options && !disableKeyboardRemover) {
            options = this.makeKeyboardRemover();
        }

        await this.bot.sendMessage(this.ownerId, text, options || undefined);
    }

    private async checkAccess(id: number): Promise<boolean> {
        return id === this.ownerId;
    }

    private async handleText(text: string): Promise<void> {
        switch (this.dialogState) {
            case DialogFeed.ROOT:
                await this.handleRootFeed(text);
                break;

            case DialogFeed.TASK:
                await this.handleTaskFeed(text);
                break;

            case DialogFeed.CANCEL:
                await this.handleCancelFeed(text);
                break;

            default:
                console.error('Unknown dialog type');
                await this.send('Unknown dialog type', this.makeKeyboardWith(RootCommands));

                this.dialogState = DialogFeed.ROOT;
        }
    }

    private async handleRootFeed(text: string): Promise<void> {
        switch (text) {
            case RootCommands.PING:
                await this.send('pong', this.makeKeyboardWith(RootCommands));
                break;

            case RootCommands.TASK:
                this.dialogState = DialogFeed.TASK;
                this.taskState = TaskFeed.START;
                await this.handleTaskFeed();
                break;

            case RootCommands.CANCEL:
                this.dialogState = DialogFeed.CANCEL;
                this.cancelState = CancelFeed.START;
                await this.handleCancelFeed();
                break;

            case RootCommands.STATUS:
                const statusArray: Array<TaskExplain> = await this.executor.getStatus();
                let statusByTask: Array<string> = [];

                for (const task of statusArray) {
                    statusByTask.push(this.makeObjectExplain(task));
                }

                await this.send(
                    `Current status:\n ${statusByTask.join('\n')}`,
                    this.makeKeyboardWith(RootCommands)
                );
                break;

            default:
                await this.send('Unknown command', this.makeKeyboardWith(RootCommands));
        }
    }

    private async handleTaskFeed(text: string = ''): Promise<void> {
        if (text.toLowerCase() === 'cancel') {
            this.dialogState = DialogFeed.ROOT;

            this.taskCalculator.clearConfig();

            await this.send('Task creation canceled', this.makeKeyboardWith(RootCommands));
            return;
        }

        switch (this.taskState) {
            case TaskFeed.START: {
                await this.send('Type CANCEL in any step to cancel task creation');

                // Next
                this.taskState = TaskFeed.STOCK;

                await this.send('Choice task type', this.makeKeyboardWith(StockName));
                break;
            }

            case TaskFeed.STOCK: {
                if (!Object.keys(StockName).includes(text)) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                this.taskCalculator.getConfig().stock = text as StockName;

                // Next
                this.taskState = TaskFeed.CURRENCY;

                await this.send('Choice currency', this.makeKeyboardWith(Currency));
                break;
            }

            case TaskFeed.CURRENCY: {
                if (!Object.keys(Currency).includes(text)) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                this.taskCalculator.getConfig().currency = text as Currency;

                // Next
                this.taskState = TaskFeed.CANDLE_SIZE;

                await this.send('Choice candle size', this.makeKeyboardWith(CandleSize));
                break;
            }

            case TaskFeed.CANDLE_SIZE: {
                if (!Object.keys(CandleSize).includes(text)) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                this.taskCalculator.getConfig().candleSize = text as CandleSize;

                // Next
                this.taskState = TaskFeed.DIRECTION;

                await this.send('Choice direction', this.makeKeyboardWith(Direction));
                break;
            }

            case TaskFeed.DIRECTION: {
                if (!Object.keys(Direction).includes(text)) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                this.taskCalculator.getConfig().direction = text as Direction;

                // Next
                this.taskState = TaskFeed.RISK_AMOUNT;

                await this.send('Input risk amount');
                break;
            }

            case TaskFeed.RISK_AMOUNT: {
                const value: number = Number(text);

                if (!Number.isFinite(value) || value <= 0) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                this.taskCalculator.getConfig().riskAmount = value;

                // Next
                this.taskState = TaskFeed.LINE_START;

                await this.send('Input line start price at now');
                break;
            }

            case TaskFeed.LINE_START: {
                const value: number = Number(text);

                if (!Number.isFinite(value) || value <= 0) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                this.taskCalculator.getConfig().lineStart = value;

                // Next
                this.taskState = TaskFeed.LINE_10;

                await this.send('Input line start price after 10 candles');
                break;
            }

            case TaskFeed.LINE_10: {
                const value: number = Number(text);

                if (!Number.isFinite(value) || value <= 0) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                this.taskCalculator.getConfig().line10 = value;

                // Next
                this.taskState = TaskFeed.BOTTOM;

                await this.send('Input current bottom price');
                break;
            }

            case TaskFeed.BOTTOM: {
                const value: number = Number(text);

                if (!Number.isFinite(value) || value <= 0) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                this.taskCalculator.getConfig().bottom = value;

                // Next
                this.taskState = TaskFeed.CONFIRM;
                this.taskCalculator.populateAutoFields();
                this.taskCalculator.calcHint();

                const resultConfig: TaskConfig = this.taskCalculator.getConfig();

                await this.send(
                    `All ok?\n${this.makeObjectExplain(resultConfig)}`,
                    this.makeKeyboardWith(ConfirmButtons)
                );
                break;
            }

            case TaskFeed.CONFIRM: {
                if (!Object.keys(ConfirmButtons).includes(text)) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                await this.executor.startTask(this.taskCalculator.getConfig());

                // Complete
                await this.send('Task success started!', this.makeKeyboardWith(RootCommands));

                this.taskCalculator.clearConfig();

                this.taskState = TaskFeed.START;
                this.dialogState = DialogFeed.ROOT;
                break;
            }

            default: {
                console.error('Unknown task feed type');
                await this.send('Unknown task feed type', this.makeKeyboardWith(RootCommands));

                this.dialogState = DialogFeed.ROOT;
            }
        }
    }

    private async handleCancelFeed(text: string = ''): Promise<void> {
        if (text.toLowerCase() === 'cancel') {
            this.dialogState = DialogFeed.ROOT;

            this.taskCalculator.clearConfig();

            await this.send('Cancel task canceled', this.makeKeyboardWith(RootCommands));
            return;
        }

        switch (this.cancelState) {
            case CancelFeed.START: {
                // Next
                this.cancelState = CancelFeed.CHOICE;

                const ids: Array<number> = this.executor.getTaskIds();

                await this.send('Choice task', this.makeKeyboardWith(ids));
                break;
            }

            case CancelFeed.CHOICE: {
                const id: number = Number(text);

                if (!Number.isFinite(id) || id < 0) {
                    await this.send('Invalid id', null, true);
                    break;
                }

                // Next
                this.cancelState = CancelFeed.CONFIRM;

                const taskStatuses: Array<TaskExplain> = await this.executor.getStatus();
                const selected: TaskExplain = taskStatuses.find(
                    (task: TaskExplain): boolean => task.id === id
                );

                if (!selected) {
                    await this.send('Invalid id', null, true);
                }

                this.taskToCancel = selected.id;

                await this.send(
                    `Cancel task?\n${this.makeObjectExplain(selected)}`,
                    this.makeKeyboardWith(ConfirmButtons)
                );
                break;
            }

            case CancelFeed.CONFIRM: {
                if (!Object.keys(ConfirmButtons).includes(text)) {
                    await this.send('Invalid value', null, true);
                    return;
                }

                // Complete
                const cancelResult: string = await this.executor.cancelTask(this.taskToCancel);

                await this.send(
                    `Cancel result: ${cancelResult}`,
                    this.makeKeyboardWith(RootCommands)
                );

                this.cancelState = CancelFeed.START;
                this.dialogState = DialogFeed.ROOT;
                break;
            }

            default: {
                console.error('Unknown task feed type');
                await this.send('Unknown task feed type', this.makeKeyboardWith(RootCommands));

                this.dialogState = DialogFeed.ROOT;
            }
        }
    }

    private makeKeyboardWith(
        arrayOfStringOrEnum: Array<string | number> | object
    ): TelegramKeyboard {
        let buttons: Array<string | number>;

        if (Array.isArray(arrayOfStringOrEnum)) {
            buttons = arrayOfStringOrEnum;
        } else {
            buttons = Object.keys(arrayOfStringOrEnum);
        }

        return {
            reply_markup: {
                keyboard: buttons.map((v: string | number): Array<string> => [String(v)]),
            },
        };
    }

    private makeKeyboardRemover(): TelegramKeyboard {
        return {
            reply_markup: {
                remove_keyboard: true,
            },
        };
    }

    private makeObjectExplain(object: object): string {
        const entries: Array<[string, string]> = Object.entries(object);
        const lines: Array<string> = entries.map(([key, value]: [string, string]): string => {
            if (Number.isFinite(parseInt(value))) {
                value = parseFloat(value).toFixed(2);
            }

            return `${key} = ${value}`;
        });

        return ['', ...lines, ''].join('\n');
    }
}
