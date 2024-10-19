/**
 * Limits the number of requests that can be made to the Kucoin API to maxRequests per interval in milliseconds.
 */
export default class RateLimiter {
  private maxRequests: number;
  private interval: number;
  private queue: (() => Promise<any>)[] = [];
  private activeRequests: number = 0;

  constructor(maxRequests: number, interval: number) {
    this.maxRequests = maxRequests;
    this.interval = interval;
    setInterval(() => this.processQueue(), this.interval);
  }

  public async scheduleRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        if (this.activeRequests >= this.maxRequests) {
          return;
        }
        this.activeRequests++;
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
        }
      };
      this.queue.push(executeRequest);
    });
  }

  private processQueue() {
    while (this.queue.length > 0 && this.activeRequests < this.maxRequests) {
      const nextRequest = this.queue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }
}
