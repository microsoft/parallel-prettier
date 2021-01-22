/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { parentPort } from 'worker_threads';
import { promises as fs } from 'fs';
import * as prettier from 'prettier';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { last, mergeMap } from 'rxjs/operators';
import { inspect } from 'util';
import {
  IFilesMessage,
  IFormattedMessage,
  IInitializationMessage,
  MasterMessage,
  MessageType,
  WorkerMessage,
  WorkerMode,
} from './protocol';

/**
 * Reads the files from the observable stream and, with the specified
 * concurrency, formats them. Returns a stream of results to send back
 * to the master.
 */
function runFormatting(
  settings: IInitializationMessage,
  files: IFilesMessage,
): Observable<WorkerMessage> {
  const output: IFormattedMessage = {
    files: files.files.length,
    formatted: [],
    failed: [],
    id: files.id,
    type: MessageType.Formatted,
  };

  return of(...files.files).pipe(
    mergeMap(async (file) => {
      const contents = await fs.readFile(file.path, 'utf-8');
      let formatted: string;
      try {
        formatted = prettier.format(contents, {
          ...(await prettier.resolveConfig(file.path)),
          filepath: file.path,
        });
      } catch (e) {
        process.stderr.write('\r\n' + inspect(e) + '\r\n');
        output.failed.push(file);
        return output;
      }

      if (formatted === contents) {
        return output;
      }

      if (settings.mode === WorkerMode.Write) {
        await fs.writeFile(file.path, formatted);
      } else if (settings.mode === WorkerMode.Print) {
        process.stdout.write(formatted);
      }

      output.formatted.push(file);
      return output;
    }),
    last(),
  );
}

export function startWorker(): void {
  const settings = new Subject<IInitializationMessage>();
  const files = new Subject<IFilesMessage>();

  parentPort?.on('message', (data: MasterMessage) => {
    switch (data.type) {
      case MessageType.WorkerInitialization:
        settings.next(data);
        break;
      case MessageType.WorkerFiles:
        files.next(data);
        break;
    }
  });

  combineLatest([settings, files])
    .pipe(mergeMap(([s, f]) => runFormatting(s, f)))
    .subscribe(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (message) => parentPort?.postMessage(message),
      (err) => {
        throw err;
      },
    );
}
