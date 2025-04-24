/**
 * A simple event emitter for browser use, replacing Node.js EventEmitter.
 * This is needed because Node's EventEmitter cannot be used in the browser.
 */
export class SimpleEventEmitter {
  private listeners: Record<string, Array<(...args: any[]) => void>> = {};

  /**
   * Register an event listener
   */
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  /**
   * Remove an event listener
   */
  off(event: string, listener: (...args: any[]) => void): void {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event].indexOf(listener);
    if (index !== -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * Emit an event with provided arguments
   */
  emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    
    // Create a copy of the listeners array to avoid issues if listeners modify the array
    const eventListeners = [...this.listeners[event]];
    for (const listener of eventListeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }

  /**
   * Remove all listeners for an event, or all events if no event is specified
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}