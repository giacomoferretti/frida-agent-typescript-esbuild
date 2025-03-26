interface ActivityHookConfig {
  classNameFilter: string[];
  beforeSet: <T extends Java.Wrapper>(bundle: T, activity: Java.Wrapper) => T;
  afterSet: (result: unknown, activity: Java.Wrapper) => void;
  name: string;
}

class ActivityHookManager {
  private static instance: ActivityHookManager;
  private hooks: ActivityHookConfig[] = [];
  private isHooked = false;
  private lastHookId = 0;

  private constructor() {}

  public static getInstance(): ActivityHookManager {
    if (!ActivityHookManager.instance) {
      ActivityHookManager.instance = new ActivityHookManager();
    }
    return ActivityHookManager.instance;
  }

  public addHook(config: Partial<ActivityHookConfig>): number {
    const hookConfig: ActivityHookConfig = {
      classNameFilter: config.classNameFilter || [],
      beforeSet: config.beforeSet || ((value) => value),
      afterSet: config.afterSet || (() => {}),
      name: config.name || `Hook_${this.lastHookId++}`,
    };

    this.hooks.push(hookConfig);

    // If not already hooked, apply the hook
    if (!this.isHooked) {
      this.applyHook();
    }

    return this.hooks.length - 1;
  }

  public removeHook(identifier: number | string): void {
    if (typeof identifier === "number") {
      this.hooks.splice(identifier, 1);
    } else {
      const index = this.hooks.findIndex((hook) => hook.name === identifier);
      if (index !== -1) {
        this.hooks.splice(index, 1);
      }
    }
  }

  private applyHook(): void {
    const Activity = Java.use("android.app.Activity");

    Activity.onCreate.overload("android.os.Bundle").implementation = function (
      bundle: Java.Wrapper
    ) {
      const manager = ActivityHookManager.getInstance();

      // Find applicable hooks
      const applicableHooks = manager.hooks.filter(
        (hook) =>
          hook.classNameFilter.length === 0 ||
          hook.classNameFilter.includes(this.$className)
      );

      // Process through all applicable hooks
      let modifiedValue = bundle;

      for (const hook of applicableHooks) {
        // Apply beforeSet for each hook
        modifiedValue = hook.beforeSet(modifiedValue, this);
      }

      // Set the final modified value
      const result = this.onCreate(modifiedValue);

      // Run afterSet for each hook
      for (const hook of applicableHooks) {
        hook.afterSet(result, this);
      }

      return result;
    };

    this.isHooked = true;
  }

  public getHooks(): ActivityHookConfig[] {
    return [...this.hooks];
  }
}

export function hookActivity(config: Partial<ActivityHookConfig> = {}): number {
  const manager = ActivityHookManager.getInstance();
  return manager.addHook(config);
}

export function removeActivityHook(identifier: number | string): void {
  const manager = ActivityHookManager.getInstance();
  manager.removeHook(identifier);
}

export function getActivityHooks(): ActivityHookConfig[] {
  const manager = ActivityHookManager.getInstance();
  return manager.getHooks();
}
