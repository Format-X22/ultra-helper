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
        const config: TaskConfig = this.taskConfig;
        const step: number = Math.abs((config.lineStart - config.line10) / 10);
        const stepCount: number = 20;
        const stepSum: number = step * stepCount;

        if (config.lineStart > config.line10) {
            config.line20 = config.lineStart - stepSum;
        } else {
            config.line20 = config.lineStart + stepSum;
        }
    }
}
