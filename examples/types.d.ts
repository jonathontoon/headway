/**
 * Terminal
 */

type CommandType = 'logo' | 'intro' | 'echo' | 'clear' | 'unknown';

interface CommandResponse {
  type: CommandType;
  value?: string;
}

interface TerminalEntry {
  command: CommandType;
  response?: CommandResponse;
}

/**
 * General
 */

type Status =
  | 'initialized'
  | 'encrypting'
  | 'encrypting_complete'
  | 'decrypting'
  | 'decrypting_complete';

/**
 * Chunks
 */

interface ChunkData {
  buffer: ArrayBufferLike;
  isFirstChunk: boolean;
  isLastChunk: boolean;
}

type ChunkArguments = {
  file: File;
  password: string;
  type: WebWorkerIncomingMessageChunk['type'];
  writerId: string;
};

/**
 * Form
 */

type FileFormArguments = {
  id: string;
};

interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

type Action = 'Encrypt' | 'Decrypt';

/**
 * File Download
 */

type FileDownloadArguments = {
  id: string;
  fileName: string;
  fileSize: number;
};

/**
 * Workers
 */

type WorkerArguments = {
  path: string;
};

type CipherOperationState =
  | 'encrypt'
  | 'encryption_in_progress'
  | 'encryption_last_chunk'
  | 'encryption_done'
  | 'decrypt'
  | 'decryption_in_progress'
  | 'decryption_last_chunk'
  | 'decryption_done'
  | 'mixed';

interface AbstractWebWorkerMessage {
  type: Exclude<CipherOperationState, 'mixed'>;
  password: string;
}

interface AbstractWebWorkerMessageChunk extends AbstractWebWorkerMessage {
  chunk: ArrayBuffer;
  isLastChunk: boolean;
  writerId: string;
  index?: number;
}

interface WebWorkerIncomingMessageChunk extends AbstractWebWorkerMessageChunk {
  isFirstChunk?: boolean;
}

type WebWorkerOutgoingMessageChunk = Omit<
  AbstractWebWorkerMessageChunk,
  'password'
>;
