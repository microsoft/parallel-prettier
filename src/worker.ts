/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { readFile, writeFile } from 'fs';
import * as prettier from 'prettier';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { last, mergeMap } from 'rxjs/operators';
import { promisify } from 'util';
import {
  IFilesMessage,
  IFormattedMessage,
  IInitializationMessage,
  MasterMessage,
  MessageType,
  WorkerMessage,
  WorkerMode,
} from './protocol';

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

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
    id: files.id,
    type: MessageType.Formatted,
  };

  return of(...files.files).pipe(
    mergeMap(async (file) => {
      const contents = await readFileAsync(file.path, 'utf-8');
      const { ignored } = await prettier.getFileInfo(file.path, {
        ignorePath: './.prettierignore',
      });

      if (ignored) {
        return output;
      }

      const formatted = prettier.format(contents, {
        ...(await prettier.resolveConfig(file.path)),
        filepath: file.path,
      });

      if (formatted === contents) {
        return output;
      }

      if (settings.mode === WorkerMode.Write) {
        await writeFileAsync(file.path, formatted);
      } else if (settings.mode === WorkerMode.Print) {
        process.stdout.write(formatted);
      }

      output.formatted.push(file);
      return output;
    }),
    last(),
  );
}

export function startWorker() {
  const settings = new Subject<IInitializationMessage>();
  const files = new Subject<IFilesMessage>();

  process.on('message', (data: MasterMessage) => {
    switch (data.type) {
      case MessageType.WorkerInitialization:
        settings.next(data);
        break;
      case MessageType.WorkerFiles:
        files.next(data);
        break;
    }
  });

  combineLatest(settings, files)
    .pipe(mergeMap(([s, f]) => runFormatting(s, f)))
    .subscribe(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (message) => process.send!(message),
      (err) => {
        throw err;
      },
    );
}
