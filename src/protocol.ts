/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/**
 * MessageType delimits the kind of message sent in the formatter IPC.
 */
export const enum MessageType {
  WorkerInitialization,
  WorkerFiles,
  Formatted,
  Complete,
}

export const enum WorkerMode {
  Write,
  Print,
  Assert,
}

/**
 * An InitializationMessage is sent from
 * the master to queue work on its workers.
 */
export interface IInitializationMessage {
  type: MessageType.WorkerInitialization;
  mode: WorkerMode.Write;
}

/**
 * IFiles is sent to queue files to format on the worker.
 */
export interface IFilesMessage {
  type: MessageType.WorkerFiles;
  files: IDiscoveredFile[];
  id: number;
}

/**
 * MasterMessage is sent from the cluster master to its workers.
 */
export type MasterMessage = IInitializationMessage | IFilesMessage;

/**
 * Results returned from formatting files.
 */
export interface IFormatResults {
  files: number;
  failed: IDiscoveredFile[];
  formatted: IDiscoveredFile[];
}

/**
 * Format message received from a worker.
 */
export interface IFormattedMessage extends IFormatResults {
  type: MessageType.Formatted;
  id: number;
}

/**
 * Discovered file item.
 */
export interface IDiscoveredFile {
  cwd: string;
  base: string;
  path: string;
}

/**
 * Mesage is sent from the worker to the parent process.
 */
export type WorkerMessage = IFormattedMessage;

/**
 * Top-level options for the formatter.
 */
export interface IOptions {
  check: boolean;
  write: boolean;
  concurrency: number;
  quiet: boolean;
  files: string[];
}
