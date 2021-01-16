import * as TelegramBot from 'node-telegram-bot-api';
import { TaskCalculator, StockName, TaskConfig, TaskType } from './TaskCalculator';

type TelegramKeyboard = {
    reply_markup: {
        remove_keyboard?: boolean;
        keyboard?: Array<Array<string>>;
    };
};

enum ConfirmButtonsText {
    OK = 'OK',
    CANCEL = 'CANCEL',
}

enum DialogFeed {
    ROOT,
    TASK,
}

enum TaskFeed {
    START,
    TYPE,
    STOCK,
    FULL_STOCK_FUND,
    FIB_ZERO,
    FIB_ONE,
    CONFIRM,
}

export class Telegram {
    private bot: TelegramBot;
    private dialogState: DialogFeed = DialogFeed.ROOT;
    private taskState: TaskFeed = TaskFeed.START;
    private taskCalculator: TaskCalculator;

    constructor(private key: string, private ownerId: number) {
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

        this.send('Started!').catch((error: Error): void => {
            console.error(error);
            process.exit(1);
        });
    }

    public async send(text: string, options?: TelegramKeyboard): Promise<void> {
        await this.bot.sendMessage(this.ownerId, text, options || this.makeKeyboardRemover());
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

            default:
                console.error('Unknown dialog type');
                await this.send('Unknown dialog type');

                this.dialogState = DialogFeed.ROOT;
        }
    }

    private async handleRootFeed(text: string): Promise<void> {
        switch (text) {
            case 'ping':
                await this.send('pong');
                break;

            case 'task':
                this.dialogState = DialogFeed.TASK;
                this.taskState = TaskFeed.START;
                await this.handleTaskFeed(text);
                break;

            case 'cancel':
                // TODO -
                await this.send('TODO CANCEL TASK');
                break;

            case 'status':
                // TODO -
                await this.send('TODO STATUS');
                break;

            default:
                await this.send('Unknown command');
        }
    }

    private async handleTaskFeed(text: string): Promise<void> {
        if (text.toLowerCase() === 'cancel') {
            this.dialogState = DialogFeed.ROOT;

            this.taskCalculator.clearConfig();

            await this.send('Task creation canceled', {
                reply_markup: {
                    remove_keyboard: true,
                },
            });
            return;
        }

        switch (this.taskState) {
            case TaskFeed.START: {
                this.taskState = TaskFeed.TYPE;

                // Next
                await this.send('Choice task type', this.makeKeyboardWith(TaskType));
                break;
            }

            case TaskFeed.TYPE: {
                if (!Object.keys(TaskType).includes(text)) {
                    await this.send('Invalid value');
                    return;
                }

                this.taskCalculator.getConfig().type = text as TaskType;

                // Next
                this.taskState = TaskFeed.STOCK;

                await this.send('Choice stock', this.makeKeyboardWith(StockName));
                break;
            }

            case TaskFeed.STOCK: {
                if (!Object.keys(StockName).includes(text)) {
                    await this.send('Invalid value');
                    return;
                }

                this.taskCalculator.getConfig().stock = text as StockName;

                // Next
                this.taskState = TaskFeed.FULL_STOCK_FUND;

                await this.send('Input full stock fund');
                break;
            }

            case TaskFeed.FULL_STOCK_FUND: {
                const value: number = Number(text);

                if (!Number.isFinite(value) || value <= 0) {
                    await this.send('Invalid value');
                    return;
                }

                this.taskCalculator.getConfig().fullFund = value;

                // Next
                this.taskState = TaskFeed.FIB_ZERO;

                await this.send('Input Fibonacci 0 level price value');
                break;
            }

            case TaskFeed.FIB_ZERO: {
                const value: number = Number(text);

                if (!Number.isFinite(value) || value <= 0) {
                    await this.send('Invalid value');
                    return;
                }

                this.taskCalculator.getConfig().fibZero = value;

                // Next
                this.taskState = TaskFeed.FIB_ONE;

                await this.send('Input Fibonacci 1 level price value');
                break;
            }

            case TaskFeed.FIB_ONE: {
                const value: number = Number(text);

                if (!Number.isFinite(value) || value <= 0) {
                    await this.send('Invalid value');
                    return;
                }

                this.taskCalculator.getConfig().fibOne = value;

                // Next
                this.taskState = TaskFeed.CONFIRM;

                this.taskCalculator.populateTaskAutoFields();

                await this.send(
                    `All ok?\n${this.makeTaskConfigExplain()}`,
                    this.makeKeyboardWith(ConfirmButtonsText)
                );
                break;
            }

            case TaskFeed.CONFIRM: {
                if (!Object.keys(ConfirmButtonsText).includes(text)) {
                    await this.send('Invalid value');
                    return;
                }

                // TODO Start task

                // Complete
                await this.send('Task success started!');

                this.taskCalculator.clearConfig();

                this.taskState = TaskFeed.START;
                this.dialogState = DialogFeed.ROOT;
                break;
            }

            default: {
                console.error('Unknown task feed type');
                await this.send('Unknown task feed type');

                this.dialogState = DialogFeed.ROOT;
            }
        }
    }

    private makeKeyboardWith(arrayOfStringOrEnum: Array<string> | object): TelegramKeyboard {
        let buttons: Array<string>;

        if (Array.isArray(arrayOfStringOrEnum)) {
            buttons = arrayOfStringOrEnum;
        } else {
            buttons = Object.keys(arrayOfStringOrEnum);
        }

        return {
            reply_markup: {
                keyboard: buttons.map((v: string): Array<string> => [v]),
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

    private makeTaskConfigExplain(): string {
        const taskConfigAsArray: Array<Array<string>> = Object.entries(
            this.taskCalculator.getConfig() as object
        );
        const lines: Array<string> = taskConfigAsArray.map(
            ([key, value]: [string, string]): string => `${key} = ${value}`
        );

        return ['', ...lines, ''].join('\n');
    }
}
