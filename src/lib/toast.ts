export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export interface ToastItemData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
  createdAt: number;
  action?: ToastAction;
  dismissible: boolean;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 7000,
};

const MAX_VISIBLE_TOASTS = 4;

type Listener = (toasts: ToastItemData[]) => void;

class ToastStore {
  private toasts: ToastItemData[] = [];
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getToasts = (): ToastItemData[] => {
    return this.toasts;
  };

  private notifyListeners(): void {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => {
        this.listeners.forEach((listener) => listener([...this.toasts]));
      });
    } else {
      setTimeout(() => {
        this.listeners.forEach((listener) => listener([...this.toasts]));
      }, 0);
    }
  }

  show(
    type: ToastType,
    title: string,
    optionsOrDescription?: string | ToastOptions
  ): string {
    const options: ToastOptions =
      typeof optionsOrDescription === "string"
        ? { description: optionsOrDescription }
        : optionsOrDescription || {};

    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = options.duration ?? DEFAULT_DURATIONS[type];
    const dismissible = options.dismissible !== false;

    const newToast: ToastItemData = {
      id,
      type,
      title,
      description: options.description,
      duration,
      createdAt: Date.now(),
      action: options.action,
      dismissible,
    };

    const existingIndex = this.toasts.findIndex((t) => t.id === id);

    if (existingIndex >= 0) {
      // Update existing toast and reset its lifecycle
      this.toasts = this.toasts.map((item, idx) =>
        idx === existingIndex ? newToast : item
      );
    } else {
      // Add new toast to queue, maintaining maximum limit
      const nextToasts = [newToast, ...this.toasts];
      if (nextToasts.length > MAX_VISIBLE_TOASTS) {
        nextToasts.splice(MAX_VISIBLE_TOASTS);
      }
      this.toasts = nextToasts;
    }

    this.notifyListeners();
    return id;
  }

  dismiss = (id: string): void => {
    const initialLen = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.toasts.length !== initialLen) {
      this.notifyListeners();
    }
  };

  clearAll = (): void => {
    if (this.toasts.length > 0) {
      this.toasts = [];
      this.notifyListeners();
    }
  };
}

export const toastStore = new ToastStore();

export const notify = {
  success(title: string, optionsOrDescription?: string | ToastOptions): string {
    return toastStore.show("success", title, optionsOrDescription);
  },

  error(title: string, optionsOrDescription?: string | ToastOptions): string {
    return toastStore.show("error", title, optionsOrDescription);
  },

  warning(title: string, optionsOrDescription?: string | ToastOptions): string {
    return toastStore.show("warning", title, optionsOrDescription);
  },

  info(title: string, optionsOrDescription?: string | ToastOptions): string {
    return toastStore.show("info", title, optionsOrDescription);
  },

  promise<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string | { title: string; description?: string });
      error: string | ((error: unknown) => string | { title: string; description?: string });
    }
  ): Promise<T> {
    const id = notify.info(options.loading, { duration: 60000 });

    return promise
      .then((data) => {
        const successRes =
          typeof options.success === "function"
            ? options.success(data)
            : options.success;

        if (typeof successRes === "string") {
          notify.success(successRes, { id });
        } else {
          notify.success(successRes.title, {
            id,
            description: successRes.description,
          });
        }
        return data;
      })
      .catch((err) => {
        const errorRes =
          typeof options.error === "function"
            ? options.error(err)
            : options.error;

        if (typeof errorRes === "string") {
          notify.error(errorRes, { id });
        } else {
          notify.error(errorRes.title, {
            id,
            description: errorRes.description,
          });
        }
        throw err;
      });
  },

  dismiss(id: string): void {
    toastStore.dismiss(id);
  },

  clear(): void {
    toastStore.clearAll();
  },
};

