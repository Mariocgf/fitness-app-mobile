import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useWellnessDashboard } from '../useWellnessDashboard';
import {
  getHydrationLogs,
  getMeditationSessions,
  getMoodLogs,
  getSleepLogs,
} from '../../services/wellness.service';

jest.mock('../../services/wellness.service', () => ({
  getHydrationLogs: jest.fn(),
  getMeditationSessions: jest.fn(),
  getMoodLogs: jest.fn(),
  getSleepLogs: jest.fn(),
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const emptyPage = {
  page: 1,
  pageSize: 20,
  totalCount: 0,
  items: [],
};

const mockedSleep = getSleepLogs as jest.Mock;
const mockedHydration = getHydrationLogs as jest.Mock;
const mockedMood = getMoodLogs as jest.Mock;
const mockedMeditation = getMeditationSessions as jest.Mock;

describe('useWellnessDashboard request cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aborts in-flight dashboard requests when the hook unmounts', async () => {
    const sleep = deferred<typeof emptyPage>();
    const hydration = deferred<typeof emptyPage>();
    const mood = deferred<typeof emptyPage>();
    const meditation = deferred<typeof emptyPage>();

    mockedSleep.mockReturnValue(sleep.promise);
    mockedHydration.mockReturnValue(hydration.promise);
    mockedMood.mockReturnValue(mood.promise);
    mockedMeditation.mockReturnValue(meditation.promise);

    const { unmount } = renderHook(() => useWellnessDashboard());

    await waitFor(() => expect(mockedSleep).toHaveBeenCalledTimes(1));

    const signals = [
      mockedSleep.mock.calls[0][3],
      mockedHydration.mock.calls[0][3],
      mockedMood.mock.calls[0][3],
      mockedMeditation.mock.calls[0][3],
    ] as AbortSignal[];

    expect(signals.every((signal) => signal.aborted === false)).toBe(true);

    unmount();

    expect(signals.every((signal) => signal.aborted === true)).toBe(true);
  });

  it('does not surface an error when a stale dashboard request is canceled', async () => {
    const staleSleep = deferred<typeof emptyPage>();
    const staleHydration = deferred<typeof emptyPage>();
    const staleMood = deferred<typeof emptyPage>();
    const staleMeditation = deferred<typeof emptyPage>();

    mockedSleep
      .mockReturnValueOnce(staleSleep.promise)
      .mockResolvedValue(emptyPage);
    mockedHydration
      .mockReturnValueOnce(staleHydration.promise)
      .mockResolvedValue(emptyPage);
    mockedMood
      .mockReturnValueOnce(staleMood.promise)
      .mockResolvedValue(emptyPage);
    mockedMeditation
      .mockReturnValueOnce(staleMeditation.promise)
      .mockResolvedValue(emptyPage);

    const { result } = renderHook(() => useWellnessDashboard());

    await waitFor(() => expect(mockedSleep).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(mockedSleep).toHaveBeenCalledTimes(2));

    await act(async () => {
      staleSleep.reject({ code: 'ERR_CANCELED' });
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
