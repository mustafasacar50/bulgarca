export const storage = {
  get: <T>(key: string, useSession = false): T | null => {
    const store = useSession ? sessionStorage : localStorage;
    const data = store.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },
  set: <T>(key: string, value: T, useSession = false): void => {
    const store = useSession ? sessionStorage : localStorage;
    store.setItem(key, JSON.stringify(value));
  },
  remove: (key: string, useSession = false): void => {
    const store = useSession ? sessionStorage : localStorage;
    store.removeItem(key);
  }
};
