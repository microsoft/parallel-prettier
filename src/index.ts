#!/usr/bin/env node

/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as cluster from 'cluster';
import * as commander from 'commander';
import { cpus } from 'os';
import * as prettier from 'prettier';
import { version } from '../package.json';

function startMaster() {
  const program = commander
    .option(
      '--check, --list-different',
      'Whether to list unformatted files, instead of writing them out',
    )
    .option('--write', 'Whether to write files to the output')
    .option('--concurrency [value]', 'Maximum concurrency', String(cpus().length))
    .option('-q, --quiet', 'If set, pprettier will not output progress')
    .version(`@mixer/parallel-prettier version ${version} / prettier version ${prettier.version}`)
    .parse(process.argv);

  require('./master').spawnWorkers({
    check: program.listDifferent,
    concurrency: program.concurrency,
    files: program.args,
    quiet: program.quiet,
    write: program.write,
  });
}

if (module === require.main && cluster.isMaster) {
  startMaster();
} else if (cluster.isWorker) {
  require('./worker').startWorker();
}
