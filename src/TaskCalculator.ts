const SQUEEZE_INDENT_PERCENT: number = 0.25;
const STOP_INDENT_RATE: number = 3;

export enum StockName {
    BITMEX = 'BITMEX',
    BINANCE = 'BINANCE',
    BYBIT = 'BYBIT',
    HUOBI = 'HUOBI',
    OKEKS = 'OKEKS',
    DERIBIT = 'DERIBIT',
}

export enum Currency {
    BTC_USD = 'BTCUSD',
    BTC_USDT = 'BTC_USDT',
    ETH_USD = 'ETH_USD',
    ETH_USDT = 'ETH_USDT',
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
    // Defined
    stock: StockName;
    currency: Currency;
    riskAmount: number;
    candleSize: CandleSize;
    direction: Direction;
    lineStart: number;
    line10: number;
    bottom: number;

    // Calculated or from constant
    step: number;
    squeezeIndentPercent: number;
    stopIndentRate: number;

    // Hint
    line20: number;
    currentStopIndent: number;
    currentEnterAmount: number;
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
            currency: null,
            riskAmount: null,
            candleSize: null,
            direction: null,
            lineStart: null,
            line10: null,
            line20: null,
            bottom: null,
            step: null,
            currentStopIndent: null,
            currentEnterAmount: null,
            squeezeIndentPercent: null,
            stopIndentRate: null,
        };
    }

    public populateAutoFields(): void {
        const config: TaskConfig = this.taskConfig;

        config.step = Math.abs((config.lineStart - config.line10) / 10);

        config.squeezeIndentPercent = SQUEEZE_INDENT_PERCENT;
        config.stopIndentRate = STOP_INDENT_RATE;
    }

    public calcHint(): void {
        const config: TaskConfig = this.taskConfig;
        const step: number = config.step;
        const stepCount: number = 20;
        const stepSum: number = step * stepCount;

        if (config.lineStart > config.line10) {
            config.line20 = config.lineStart - stepSum;
        } else {
            config.line20 = config.lineStart + stepSum;
        }

        const stopRateValue: number = Math.abs(config.lineStart - config.bottom) / STOP_INDENT_RATE;

        if (config.direction === Direction.LONG) {
            const stopEnter: number = config.lineStart - stopRateValue;

            config.currentStopIndent =
                100 - (stopEnter * 100) / config.lineStart + SQUEEZE_INDENT_PERCENT;
        } else {
            const stopEnter: number = config.lineStart + stopRateValue;

            config.currentStopIndent =
                (stopEnter * 100) / config.lineStart - 100 + SQUEEZE_INDENT_PERCENT;
        }

        config.currentEnterAmount = config.riskAmount * (100 / config.currentStopIndent);
    }
}
