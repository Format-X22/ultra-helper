export enum TaskType {
    CAMEL = 'CAMEL',
    FLAG = 'FLAG',
    ZIGZAG = 'ZIGZAG',
}
export enum StockName {
    BITMEX = 'BITMEX',
    BINANCE = 'BINANCE',
    BYBIT = 'BYBIT',
    HUOBI = 'HUOBI',
    OKEKS = 'OKEKS',
    DERIBIT = 'DERIBIT',
}

export enum SideType {
    LONG = 'LONG',
    SHORT = 'SHORT',
}

export type TaskConfig = {
    // Definable
    type: TaskType;
    stock: StockName;
    fullFund: number;
    fibZero: number;
    fibOne: number;

    // Auto
    side: SideType;
    enterAmount: number;
    zeroAmount: number;
    minProfitAmount: number;
    takeAmount: number;
    stopAmount: number;
    enterPrice: number;
    stopPrice: number;
    toZeroTriggerPrice: number;
    zeroPrice: number;
    toMinProfitTriggerPrice: number;
    minProfitPrice: number;
    takePrice: number;

    // Info
    leverage: number;
};

type FibLevelConfig = {
    ENTER_LEVEL: number;
    STOP_LEVEL: number;
    ZERO_TRIGGER_LEVEL: number;
    ZERO_LEVEL: number;
    MIN_PROFIT_TRIGGER_LEVEL: number;
    MIN_PROFIT_LEVEL: number;
    TAKE_LEVEL: number;
};

const FIB: {
    [TaskType.CAMEL]: FibLevelConfig;
    [TaskType.FLAG]: FibLevelConfig;
    [TaskType.ZIGZAG]: FibLevelConfig;
} = {
    CAMEL: {
        ENTER_LEVEL: 0.85,
        STOP_LEVEL: 0.5,
        ZERO_TRIGGER_LEVEL: 1.2,
        ZERO_LEVEL: 0.85,
        MIN_PROFIT_TRIGGER_LEVEL: 1.75,
        MIN_PROFIT_LEVEL: 1,
        TAKE_LEVEL: 1.85,
    },
    FLAG: {
        ENTER_LEVEL: 0.85,
        STOP_LEVEL: 0.5,
        ZERO_TRIGGER_LEVEL: 1.2,
        ZERO_LEVEL: 0.85,
        MIN_PROFIT_TRIGGER_LEVEL: 1.75,
        MIN_PROFIT_LEVEL: 1,
        TAKE_LEVEL: 1.85,
    },
    ZIGZAG: {
        ENTER_LEVEL: 0.63,
        STOP_LEVEL: 0.38,
        ZERO_TRIGGER_LEVEL: 0.9,
        ZERO_LEVEL: 0.63,
        MIN_PROFIT_TRIGGER_LEVEL: 1.15,
        MIN_PROFIT_LEVEL: 0.95,
        TAKE_LEVEL: 1.2,
    },
};

const SQUEEZE_INDENT_PERCENT: number = 0.5;
const MAX_LEVERAGE: number = 33;
const MAX_FUND_LOSS_PERCENT: number = 50;
// TODO Handle
const MAX_ENTER_AMOUNT: number = 190_000;

// TODO Check calculation with jest

export class TaskCalculator {
    private taskConfig: TaskConfig;

    constructor() {
        this.clearConfig();
    }

    public getConfig(): TaskConfig {
        return this.taskConfig;
    }

    public clearConfig(): void {
        this.taskConfig = {
            type: null,
            stock: null,
            fullFund: null,
            fibZero: null,
            fibOne: null,

            side: null,
            enterAmount: null,
            zeroAmount: null,
            minProfitAmount: null,
            takeAmount: null,
            stopAmount: null,
            enterPrice: null,
            takePrice: null,
            stopPrice: null,
            zeroPrice: null,
            toZeroTriggerPrice: null,
            minProfitPrice: null,
            toMinProfitTriggerPrice: null,

            leverage: null,
        };
    }

    public populateTaskAutoFields(): void {
        const task: TaskConfig = this.taskConfig;

        task.enterPrice = this.calcFibLevel(FIB[task.type].ENTER_LEVEL);
        task.stopPrice = this.calcFibLevel(FIB[task.type].STOP_LEVEL);
        task.toZeroTriggerPrice = this.calcFibLevel(FIB[task.type].ZERO_TRIGGER_LEVEL);
        task.zeroPrice = this.calcFibLevel(FIB[task.type].ZERO_LEVEL);
        task.toMinProfitTriggerPrice = this.calcFibLevel(FIB[task.type].MIN_PROFIT_TRIGGER_LEVEL);
        task.minProfitPrice = this.calcFibLevel(FIB[task.type].MIN_PROFIT_LEVEL);
        task.takePrice = this.calcFibLevel(FIB[task.type].TAKE_LEVEL);

        const squeeze: number = SQUEEZE_INDENT_PERCENT;
        let stopIndent: number;

        if (task.fibOne > task.fibZero) {
            task.side = SideType.LONG;
            stopIndent = 1 - task.stopPrice / task.enterPrice + squeeze;
        } else {
            task.side = SideType.SHORT;
            stopIndent = task.stopPrice / task.enterPrice - 1 + squeeze;
        }

        task.leverage = MAX_FUND_LOSS_PERCENT / stopIndent;
        task.leverage = Number(task.leverage.toFixed(2));

        if (task.leverage > MAX_LEVERAGE) {
            task.leverage = MAX_LEVERAGE;
        }

        task.enterAmount = (task.fullFund * task.leverage) ^ 0;

        const enterPrice: number = task.enterPrice;
        const calc: (mul: number) => number = this.modifyAmount(task.enterAmount);

        if (task.side === SideType.LONG) {
            task.stopAmount = calc(-(100 / MAX_FUND_LOSS_PERCENT));
            task.zeroAmount = calc(-(1 - task.zeroPrice / enterPrice + squeeze));
            task.minProfitAmount = calc(-(1 - task.minProfitPrice / enterPrice + squeeze));
            task.takeAmount = calc(-(task.takePrice / enterPrice - squeeze / 2));
        } else {
            task.stopAmount = calc(100 / MAX_FUND_LOSS_PERCENT);
            task.zeroAmount = calc(task.zeroPrice / enterPrice - 1 + squeeze);
            task.minProfitAmount = calc(task.minProfitPrice / enterPrice - 1 + squeeze);
            task.takeAmount = calc(1 - task.takePrice / enterPrice - squeeze / 2);
        }
    }

    private modifyAmount(amount: number): (mul: number) => number {
        return (mul: number): number => (amount + amount * mul) ^ 0;
    }

    private calcFibLevel(level: number): number {
        const task: TaskConfig = this.taskConfig;

        if (!task.fibZero || !task.fibOne) {
            throw 'Invalid fib';
        }

        if (task.fibOne > task.fibZero) {
            return (task.fibZero + (task.fibOne - task.fibZero) * level) ^ 0;
        } else {
            return (task.fibZero - (task.fibZero - task.fibOne) * level) ^ 0;
        }
    }
}
