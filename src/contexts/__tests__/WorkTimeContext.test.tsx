// src/contexts/__tests__/WorkTimeContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { WorkTimeProvider, useWorkTimeContext, WorkTime } from '../WorkTimeContext';
import { ReactNode } from 'react';

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// window.confirmとwindow.alertのモック
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(),
});
Object.defineProperty(window, 'alert', {
  writable: true,
  value: jest.fn(),
});

// テスト用のラッパーコンポーネント
const wrapper = ({ children }: { children: ReactNode }) => (
  <WorkTimeProvider>{children}</WorkTimeProvider>
);

describe('WorkTimeContext', () => {
  beforeEach(() => {
    // 各テストの前にlocalStorageとモックをクリア
    localStorageMock.clear();
    (window.confirm as jest.Mock).mockClear();
    (window.alert as jest.Mock).mockClear();
    // JSDOMのDateをモックして時間を固定
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('初期状態ではworkTimesは空配列であるべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });
    expect(result.current.workTimes).toEqual([]);
    expect(result.current.isWorking).toBe(false);
  });

  test('localStorageにデータがある場合、初期状態で正しく読み込まれるべき', () => {
    const initialWorkTimes: WorkTime[] = [
      {
        start: new Date('2024-01-01T09:00:00'),
        end: new Date('2024-01-01T09:50:00'),
        memo: 'test memo',
      },
    ];
    localStorageMock.setItem('workTimes', JSON.stringify(initialWorkTimes));

    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    expect(result.current.workTimes).toHaveLength(1);
    expect(result.current.workTimes[0].memo).toBe('test memo');
    expect(result.current.isWorking).toBe(false);
  });

  test('localStorageの最後の作業が未完了の場合、isWorkingはtrueになるべき', () => {
    const initialWorkTimes = [{ start: new Date('2024-01-01T09:00:00'), end: null, memo: '' }];
    localStorageMock.setItem('workTimes', JSON.stringify(initialWorkTimes));

    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    expect(result.current.isWorking).toBe(true);
  });

  test('handleStartWorkは新しい作業記録を追加し、isWorkingをtrueにすべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    act(() => {
      result.current.handleStartWork();
    });

    expect(result.current.workTimes).toHaveLength(1);
    expect(result.current.workTimes[0].end).toBeNull();
    expect(result.current.workTimes[0].start).toEqual(new Date('2024-01-01T10:00:00.000Z'));
    expect(result.current.isWorking).toBe(true);
  });

  test('handleEndWorkは作業を終了し、メモを保存し、isWorkingをfalseにすべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    // 開始
    act(() => {
      result.current.handleStartWork();
    });

    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(1000 * 60 * 30); // 30分
    });

    // メモを設定
    act(() => {
      result.current.setCurrentMemo('30分作業した');
    });

    // 終了
    act(() => {
      result.current.handleEndWork();
    });

    expect(result.current.workTimes).toHaveLength(1);
    expect(result.current.workTimes[0].end).toEqual(new Date('2024-01-01T10:30:00.000Z'));
    expect(result.current.workTimes[0].memo).toBe('30分作業した');
    expect(result.current.isWorking).toBe(false);
    expect(result.current.currentMemo).toBe('');
  });

  test('handleEndWorkは0分の作業記録を保存しないべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    // 開始してすぐに終了
    act(() => {
      result.current.handleStartWork();
    });
    act(() => {
      result.current.handleEndWork();
    });

    expect(result.current.workTimes).toHaveLength(0);
    expect(result.current.isWorking).toBe(false);
  });

  test('作業中でないときにhandleEndWorkを呼んでも状態は変わらないべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    act(() => {
      result.current.handleEndWork();
    });

    expect(result.current.workTimes).toHaveLength(0);
    expect(result.current.isWorking).toBe(false);
  });

  test('handleDeleteWorkTimeは、confirmがtrueなら作業記録を削除すべき', () => {
    const initialWorkTimes: WorkTime[] = [
      {
        start: new Date('2024-01-01T09:00:00'),
        end: new Date('2024-01-01T09:50:00'),
        memo: 'test',
      },
    ];
    localStorageMock.setItem('workTimes', JSON.stringify(initialWorkTimes));
    (window.confirm as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });
    expect(result.current.workTimes).toHaveLength(1);

    act(() => {
      result.current.handleDeleteWorkTime(0);
    });

    expect(result.current.workTimes).toHaveLength(0);
  });

  test('handleDeleteWorkTimeは、confirmがfalseなら作業記録を削除しないべき', () => {
    const initialWorkTimes: WorkTime[] = [
      {
        start: new Date('2024-01-01T09:00:00'),
        end: new Date('2024-01-01T09:50:00'),
        memo: 'test',
      },
    ];
    localStorageMock.setItem('workTimes', JSON.stringify(initialWorkTimes));
    (window.confirm as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });
    expect(result.current.workTimes).toHaveLength(1);

    act(() => {
      result.current.handleDeleteWorkTime(0);
    });

    expect(result.current.workTimes).toHaveLength(1);
  });

  test('handleSaveWorkTimeは作業記録の時刻を正しく更新すべき', () => {
    const initialWorkTimes: WorkTime[] = [
      { start: new Date('2024-01-01T09:00:00'), end: new Date('2024-01-01T10:00:00'), memo: '' },
    ];
    localStorageMock.setItem('workTimes', JSON.stringify(initialWorkTimes));

    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    act(() => {
      result.current.handleEditWorkTime(0);
    });
    expect(result.current.editingWorkTimeIndex).toBe(0);

    act(() => {
      result.current.handleSaveWorkTime(0, '09:30', '10:30');
    });

    expect(result.current.workTimes[0].start).toEqual(new Date('2024-01-01T09:30:00'));
    expect(result.current.workTimes[0].end).toEqual(new Date('2024-01-01T10:30:00'));
    expect(result.current.editingWorkTimeIndex).toBeNull();
  });

  test('handleSaveWorkTimeは日付をまたぐ時刻を正しく処理すべき', () => {
    const initialWorkTimes: WorkTime[] = [
      { start: new Date('2024-01-01T23:00:00'), end: new Date('2024-01-02T01:00:00'), memo: '' },
    ];
    localStorageMock.setItem('workTimes', JSON.stringify(initialWorkTimes));

    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    act(() => {
      result.current.handleSaveWorkTime(0, '23:30', '01:30');
    });

    expect(result.current.workTimes[0].start).toEqual(new Date('2024-01-01T23:30:00'));
    // endの日付が1日進んでいることを確認
    expect(result.current.workTimes[0].end).toEqual(new Date('2024-01-02T01:30:00'));
  });

  test('handleCancelEditは編集モードを終了すべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });

    act(() => {
      result.current.handleEditWorkTime(0);
    });
    expect(result.current.editingWorkTimeIndex).toBe(0);

    act(() => {
      result.current.handleCancelEdit();
    });
    expect(result.current.editingWorkTimeIndex).toBeNull();
  });

  test('importWorkTimesは有効なJSONでworkTimesを更新すべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });
    const jsonData = JSON.stringify([
      { start: '2024-01-02T10:00:00.000Z', end: '2024-01-02T11:00:00.000Z', memo: 'imported' },
    ]);
    const alertMock = window.alert as jest.Mock;

    act(() => {
      result.current.importWorkTimes(jsonData);
    });

    expect(result.current.workTimes).toHaveLength(1);
    expect(result.current.workTimes[0].memo).toBe('imported');
    expect(alertMock).toHaveBeenCalledWith('作業時間データをインポートしました。');
  });

  test('importWorkTimesは無効なJSONでエラーを報告すべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });
    const invalidJson = '{ not a json }';
    const alertMock = window.alert as jest.Mock;

    act(() => {
      result.current.importWorkTimes(invalidJson);
    });

    expect(result.current.workTimes).toHaveLength(0);
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining('作業時間データのインポートに失敗しました。')
    );
  });

  test('importWorkTimesは不正なデータ構造でエラーを報告すべき', () => {
    const { result } = renderHook(() => useWorkTimeContext(), { wrapper });
    const invalidData = JSON.stringify([
      {
        start: '2024-01-02T10:00:00.000Z',
        WRONG_FIELD: '2024-01-02T11:00:00.000Z',
        memo: 'invalid',
      },
    ]);
    const alertMock = window.alert as jest.Mock;

    act(() => {
      result.current.importWorkTimes(invalidData);
    });

    expect(result.current.workTimes).toHaveLength(0);
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('無効なデータ形式です。'));
  });
});
