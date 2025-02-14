import { EventQueueItem } from './types';

export class EventQueue {
  private queue: EventQueueItem[] = [];
  private processing: boolean = false;

  public add(event: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ event, resolve, reject });
      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const { event, resolve, reject } = this.queue.shift()!;
      try {
        const result = await event();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    this.processing = false;
  }
} 