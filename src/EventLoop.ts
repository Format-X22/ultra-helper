export class EventLoop {
    static async sleep(ms: number): Promise<void> {
        await new Promise((resolve: (value?: unknown) => void): void => {
            setTimeout(resolve, ms);
        });
    }
}
