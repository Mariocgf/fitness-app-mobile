import {
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../request-cancellation';

describe('request-cancellation utils', () => {
  it('detects Axios and DOM abort/cancel errors', () => {
    expect(isRequestCanceled({ code: 'ERR_CANCELED' })).toBe(true);
    expect(isRequestCanceled({ name: 'CanceledError' })).toBe(true);
    expect(isRequestCanceled({ name: 'AbortError' })).toBe(true);
    expect(isRequestCanceled(new Error('network down'))).toBe(false);
  });

  it('aborts the previous controller when starting a new request', () => {
    const requestRef = { current: null as AbortController | null };

    const first = beginAbortableRequest(requestRef);
    const second = beginAbortableRequest(requestRef);

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(isCurrentRequest(requestRef, first)).toBe(false);
    expect(isCurrentRequest(requestRef, second)).toBe(true);

    endAbortableRequest(requestRef, second);
    expect(requestRef.current).toBeNull();
  });
});
