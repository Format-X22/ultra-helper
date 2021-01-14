import * as TelegramBot from 'node-telegram-bot-api';

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

enum TaskType {
    CAMEL = 'CAMEL',
    FLAG = 'FLAG',
    ZIGZAG = 'ZIGZAG',
}
enum StockName {
    BITMEX = 'BITMEX',
    BINANCE = 'BINANCE',
    BYBIT = 'BYBIT',
    HUOBI = 'HUOBI',
    OKEKS = 'OKEKS',
    DERIBIT = 'DERIBIT',
}

enum SideType {
    LONG,
    SHORT,
}

type TaskConfig = {
    // Definable
    type: TaskType;
    stock: StockName;
    fullFund: number;
    fibZero: number;
    fibOne: number;

    // Auto
    side: SideType;
    orderAmount: number;
    zeroAmount: number;
    takeAmount: number;
    enterPrice: number;
    stopPrice: number;
    toZeroTriggerPrice: number;
    zeroPrice: number;
    takePrice: number;
};

const CAMEL_ENTER_LEVEL: number = 0.85;
const CAMEL_STOP_LEVEL: number = 0.5;
const CAMEL_ZERO_TRIGGER_LEVEL: number = 1.2;
const CAMEL_ZERO_LEVEL: number = 0.85;
const CAMEL_TAKE_LEVEL: number = 1.85;

const FLAG_ENTER_LEVEL: number = 0.85;
const FLAG_STOP_LEVEL: number = 0.5;
const FLAG_ZERO_TRIGGER_LEVEL: number = 1.2;
const FLAG_ZERO_LEVEL: number = 0.85;
const FLAG_TAKE_LEVEL: number = 1.85;

const ZIGZAG_ENTER_LEVEL: number = 0.63;
const ZIGZAG_STOP_LEVEL: number = 0.38;
const ZIGZAG_ZERO_TRIGGER_LEVEL: number = 0.9;
const ZIGZAG_ZERO_LEVEL: number = 0.63;
const ZIGZAG_TAKE_LEVEL: number = 1.2;

const SQUEEZE_INDENT_PERCENT: number = 0.5;
const MAX_LEVERAGE: number = 33;
const MAX_AMOUNT: number = 190_000;

export class Telegram {
    private bot: TelegramBot;
    private dialogState: DialogFeed = DialogFeed.ROOT;
    private taskState: TaskFeed = TaskFeed.START;
    private taskConfig: TaskConfig;

    constructor(private key: string, private ownerId: number) {
        this.clearTaskConfig();

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

            this.clearTaskConfig();

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

                this.taskConfig.type = text as TaskType;

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

                this.taskConfig.stock = text as StockName;

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

                this.taskConfig.fullFund = value;

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

                this.taskConfig.fibOne = value;

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

                this.taskConfig.fibZero = value;

                // Next
                this.taskState = TaskFeed.CONFIRM;

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

                this.populateTaskAutoFields();

                // TODO Start task

                // Complete
                await this.send('Task success started!');

                this.clearTaskConfig();

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
        const taskConfigAsArray: Array<Array<string>> = Object.entries(this.taskConfig as object);
        const lines: Array<string> = taskConfigAsArray.map(
            ([key, value]: [string, string]): string => `${key} = ${value}`
        );

        return ['', ...lines, ''].join('\n');
    }

    private clearTaskConfig(): void {
        this.taskConfig = {
            type: null,
            stock: null,
            fullFund: null,
            fibZero: null,
            fibOne: null,

            side: null,
            orderAmount: null,
            zeroAmount: null,
            takeAmount: null,
            enterPrice: null,
            takePrice: null,
            stopPrice: null,
            zeroPrice: null,
            toZeroTriggerPrice: null,
        };
    }

    private populateTaskAutoFields(): void {
        const task: TaskConfig = this.taskConfig;

        if (task.type === TaskType.CAMEL) {
            task.enterPrice = this.calcFibLevel(CAMEL_ENTER_LEVEL);
            task.stopPrice = this.calcFibLevel(CAMEL_STOP_LEVEL);
            task.toZeroTriggerPrice = this.calcFibLevel(CAMEL_ZERO_TRIGGER_LEVEL);
            task.zeroPrice = this.calcFibLevel(CAMEL_ZERO_LEVEL);
            task.takePrice = this.calcFibLevel(CAMEL_TAKE_LEVEL);
        }

        if (task.type === TaskType.FLAG) {
            task.enterPrice = this.calcFibLevel(FLAG_ENTER_LEVEL);
            task.stopPrice = this.calcFibLevel(FLAG_STOP_LEVEL);
            task.toZeroTriggerPrice = this.calcFibLevel(FLAG_ZERO_TRIGGER_LEVEL);
            task.zeroPrice = this.calcFibLevel(FLAG_ZERO_LEVEL);
            task.takePrice = this.calcFibLevel(FLAG_TAKE_LEVEL);
        }

        if (task.type === TaskType.ZIGZAG) {
            task.enterPrice = this.calcFibLevel(ZIGZAG_ENTER_LEVEL);
            task.stopPrice = this.calcFibLevel(ZIGZAG_STOP_LEVEL);
            task.toZeroTriggerPrice = this.calcFibLevel(ZIGZAG_ZERO_TRIGGER_LEVEL);
            task.zeroPrice = this.calcFibLevel(ZIGZAG_ZERO_LEVEL);
            task.takePrice = this.calcFibLevel(ZIGZAG_TAKE_LEVEL);
        }

        if ([TaskType.CAMEL, TaskType.FLAG, TaskType.ZIGZAG].includes(task.type)) {
            if (task.fibOne > task.fibZero) {
                task.side = SideType.LONG;

                const stopIndent: number =
                    1 - task.stopPrice / task.enterPrice + SQUEEZE_INDENT_PERCENT;

                // TODO Calc amount
            } else {
                task.side = SideType.SHORT;

                const stopIndent: number =
                    task.stopPrice / task.enterPrice - 1 + SQUEEZE_INDENT_PERCENT;

                // TODO Calc amount
            }
        }
    }

    private calcFibLevel(level: number): number {
        const task: TaskConfig = this.taskConfig;

        if (!task.fibZero || !task.fibOne) {
            throw 'Invalid fib';
        }

        if (task.fibOne > task.fibZero) {
            return task.fibZero + (task.fibOne - task.fibZero) * level;
        } else {
            return task.fibZero - (task.fibZero - task.fibOne) * level;
        }
    }
}
