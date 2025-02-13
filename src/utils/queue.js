export class EventQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(event) {
    return new Promise((resolve, reject) => {
      this.queue.push({ event, resolve, reject });
      if (!this.processing) {
        this.process();
      }
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const { event, resolve, reject } = this.queue.shift();
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