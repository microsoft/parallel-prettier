import * as clusterType from 'cluster';
import { EventEmitter } from 'events';
import { join } from 'path';
import { fromEvent, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as workerType from 'worker_threads';
import { MasterMessage, WorkerMessage } from './protocol';

const cluster: typeof clusterType | typeof workerType = (() => {
  try {
    return require('worker_threads');
  } catch {
    return require('cluster');
  }
})();

export const isMainThread =
  ('isMaster' in cluster && cluster.isMaster) ||
  ('isMainThread' in cluster && cluster.isMainThread);

/**
 * Returns an observable that emits when the worker gets a message.
 */
export const onMessage = (): Observable<MasterMessage> =>
  'parentPort' in cluster
    ? fromEvent<MasterMessage>(cluster.parentPort!, 'message')
    : fromEvent<[MasterMessage]>(process as EventEmitter, 'message').pipe(map(m => m[0]));

/**
 * Sends a message to the parent process.
 */
export const postMessage = (message: WorkerMessage) =>
  'parentPort' in cluster ? cluster.parentPort!.postMessage(message) : process.send!(message);

const main = join(__dirname, 'index.js');

/**
 * Abstraction over cluster workers and worker threads.
 */
export class Worker {
  public static spawn() {
    return new Worker('fork' in cluster ? cluster.fork() : new cluster.Worker(main));
  }

  private constructor(private worker: workerType.Worker | clusterType.Worker) {}

  public messages() {
    return fromEvent<WorkerMessage | [WorkerMessage]>(this.worker, 'message').pipe(
      map(m => (m instanceof Array ? m[0] : m)),
    );
  }

  public send(work: MasterMessage) {
    if ('postMessage' in this.worker) {
      this.worker.postMessage(work);
    } else {
      this.worker.send(work);
    }
  }
}
