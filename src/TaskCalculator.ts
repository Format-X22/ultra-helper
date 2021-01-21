export enum StockName {
    BITMEX = 'BITMEX',
    BINANCE = 'BINANCE',
    BYBIT = 'BYBIT',
    HUOBI = 'HUOBI',
    OKEKS = 'OKEKS',
    DERIBIT = 'DERIBIT',
}

export enum Direction {
    LONG = 'LONG',
    SHORT = 'SHORT',
}

export enum CandleSize {
    H1 = 'H1',
    H4 = 'H4',
}

export type TaskConfig = {
    stock: StockName;
    riskAmount: number;
    candleSize: CandleSize;
    direction: Direction;
    lineStart: number;
    line10: number;
    line20: number;
    bottom: number;
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

// TODO -
const SQUEEZE_INDENT_PERCENT: number = 0.5;
const MAX_LEVERAGE: number = 125;
const MAX_ENTER_AMOUNT: object = {
    [CandleSize.H1]: 190_000,
    [CandleSize.H4]: 240_000,
};

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
            stock: null,
            riskAmount: null,
            candleSize: null,
            direction: null,
            lineStart: null,
            line10: null,
            line20: null,
            bottom: null,
        };
    }

    public populateAutoFields(): void {
        // TODO Calc line 20
        // TODO -
    }
}
