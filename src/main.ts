/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as globStream from 'glob-stream';
import ignore, { Ignore } from 'ignore';
import { Observable } from 'rxjs';
import { bufferCount, mergeMap } from 'rxjs/operators';
import { promises as fs } from 'fs';

import { ProgressReporter } from './progress-reporter';
import { IOptions } from './protocol';
import { WorkerPool } from './worker-pool';
import { relative } from 'path';

const bufferSize = 50;

function runGlobs(files: string[], ignore: Ignore) {
  return new Observable<string>((subscriber) => {
    const stream = globStream(files);
    stream.addListener('data', (data) => {
      if (!ignore.ignores(relative(data.cwd, data.path))) {
        subscriber.next(data);
      }
    });
    stream.addListener('error', (err) => subscriber.error(err));
    stream.addListener('finish', () => subscriber.complete());
    stream.resume();
  });
}

async function getIgnore(ignorePath: string) {
  try {
    return ignore().add(await fs.readFile(ignorePath, 'utf-8'));
  } catch (e) {
    return ignore();
  }
}

export async function spawnWorkers(options: IOptions) {
  const pool = new WorkerPool(options);
  const progress = new ProgressReporter(options.quiet, options.check);

  runGlobs(options.files, await getIgnore(options.ignorePath))
    .pipe(
      bufferCount(bufferSize),
      mergeMap((files) => pool.format(files), pool.maxSize * 2),
    )
    .subscribe(
      (result) => progress.update(result),
      (err) => {
        throw err;
      },
      () => {
        progress.complete();

        if ((progress.reformatted && options.check) || progress.failed) {
          process.exit(1);
        } else {
          process.exit(0);
        }
      },
    );
}
