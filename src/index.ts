#!/usr/bin/env node

/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { isMainThread } from 'worker_threads';
import * as commander from 'commander';
import { cpus } from 'os';
import * as prettier from 'prettier';

const { version } = require('../package.json');

function startMain() {
  const program = commander
    .option(
      '--check, --list-different',
      'Whether to list unformatted files, instead of writing them out',
    )
    .option('--write', 'Whether to write files to the output')
    .option('--concurrency [value]', 'Maximum concurrency', String(cpus().length))
    .option('-q, --quiet', 'If set, pprettier will not output progress')
    .option('--ignore-path [value]', 'Path to an ignore file', '.prettierignore')
    .version(`@mixer/parallel-prettier version ${version} / prettier version ${prettier.version}`)
    .parse(process.argv);

  const opts = program.opts();

  require('./main').spawnWorkers({
    check: opts.listDifferent,
    concurrency: opts.concurrency,
    files: program.args,
    quiet: opts.quiet,
    write: opts.write,
    ignorePath: opts.ignorePath,
  });
}

if (module === require.main && isMainThread) {
  startMain();
} else {
  require('./worker').startWorker();
}
