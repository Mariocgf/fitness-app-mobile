export type CancellableRequestOptions = {
  signal?: AbortSignal;
};

type AbortControllerRef = {
  current: AbortController | null;
};

export const withRequestSignal = <TConfig extends Record<string, unknown>>(
  config: TConfig,
  signal?: AbortSignal,
): TConfig & CancellableRequestOptions =>
  signal ? { ...config, signal } : config;

export const isRequestCanceled = (error: unknown): boolean => {
  const err = error as {
    __CANCEL__?: boolean;
    code?: string;
    name?: string;
    message?: string;
  } | null;

  return (
    err?.__CANCEL__ === true ||
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError" ||
    err?.message === "canceled"
  );
};

export const beginAbortableRequest = (
  requestRef: AbortControllerRef,
): AbortController => {
  requestRef.current?.abort();
  const controller = new AbortController();
  requestRef.current = controller;
  return controller;
};

export const abortRequest = (requestRef: AbortControllerRef) => {
  requestRef.current?.abort();
  requestRef.current = null;
};

export const isCurrentRequest = (
  requestRef: AbortControllerRef,
  controller: AbortController,
): boolean => requestRef.current === controller && !controller.signal.aborted;

export const endAbortableRequest = (
  requestRef: AbortControllerRef,
  controller: AbortController,
) => {
  if (requestRef.current === controller) {
    requestRef.current = null;
  }
};
