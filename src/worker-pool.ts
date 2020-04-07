/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as cluster from 'cluster';
import { fromEvent, Observable } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import {
  IFormatResults,
  IInitializationMessage,
  IOptions,
  MessageType,
  WorkerMessage,
  WorkerMode,
} from './protocol';

/**
 * Pool of workers.
 */
export class WorkerPool {
  private readonly workers: Array<{ worker: cluster.Worker; active: number }> = [];
  private workIdCounter = 0;

  constructor(private readonly options: IOptions) {}

  /**
   * Schedules the given files to be formatted.
   */
  public format(files: string[]): Observable<IFormatResults> {
    if (this.workers.length < this.options.concurrency) {
      this.spawnWorker();
    }

    const target = this.workers[0];
    const id = this.workIdCounter++;
    target.active++;
    target.worker.send({ type: MessageType.WorkerFiles, files, id });
    this.sortWorkers();

    return fromEvent<[WorkerMessage]>(target.worker, 'message').pipe(
      map(([m]) => m),
      filter((m) => m.id === id),
      take(1),
      tap(() => {
        target.active--;
        this.sortWorkers();
      }),
    );
  }

  private sortWorkers() {
    this.workers.sort((a, b) => a.active - b.active);
  }

  private spawnWorker() {
    const worker = { worker: cluster.fork(), active: 0 };
    this.workers.unshift(worker);
    worker.worker.send({
      mode: this.options.check
        ? WorkerMode.Assert
        : this.options.write
        ? WorkerMode.Write
        : WorkerMode.Print,
      type: MessageType.WorkerInitialization,
    } as IInitializationMessage);
  }
}
