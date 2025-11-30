import { spawn } from 'child_process';
import EventEmitter from 'events';

/**
 * Managed process wrapper with event handling
 */
export class ManagedProcess extends EventEmitter {
  constructor(command, args = [], options = {}) {
    super();
    this.command = command;
    this.args = args;
    this.options = options;
    this.process = null;
    this.startTime = null;
  }

  /**
   * Start the process
   */
  start() {
    if (this.process) {
      throw new Error('Process is already running');
    }

    this.process = spawn(this.command, this.args, this.options);
    this.startTime = Date.now();

    this.process.stdout.on('data', (data) => {
      this.emit('stdout', data.toString());
    });

    this.process.stderr.on('data', (data) => {
      this.emit('stderr', data.toString());
    });

    this.process.on('close', (code) => {
      this.emit('exit', code);
      this.process = null;
      this.startTime = null;
    });

    this.process.on('error', (error) => {
      this.emit('error', error);
    });

    return this;
  }

  /**
   * Stop the process
   */
  stop(signal = 'SIGTERM') {
    if (!this.process) {
      throw new Error('Process is not running');
    }

    this.process.kill(signal);
  }

  /**
   * Cleanup all event listeners and stop process
   */
  cleanup() {
    if (this.process) {
      // Remove all listeners before stopping
      this.process.stdout?.removeAllListeners();
      this.process.stderr?.removeAllListeners();
      this.process.removeAllListeners();
      this.removeAllListeners(); // Remove EventEmitter listeners
      
      // Stop process if still running
      if (!this.process.killed) {
        this.process.kill('SIGTERM');
      }
      
      this.process = null;
      this.startTime = null;
    }
  }

  /**
   * Check if process is running
   */
  isRunning() {
    return this.process !== null && !this.process.killed;
  }

  /**
   * Get process uptime in milliseconds
   */
  getUptime() {
    return this.startTime ? Date.now() - this.startTime : 0;
  }
}
