# Frida Agent TypeScript - esbuild

A Frida agent template built with TypeScript and `esbuild`. This project provides an optimized way to develop Frida hooks for Android applications, offering a modern TypeScript-based workflow.

## Usage

1. Clone the repo

    ```bash
    git clone https://github.com/giacomoferretti/frida-agent-typescript-esbuild
    ```

2. Install dependencies

    ```bash
    pnpm i
    ```

3. Build packages

    ```bash
    pnpm --filter frida-hooks build
    ```

4. Build agent

    ```bash
    pnpm --filter com.example.app build
    ```

5. Run agent

    ```bash
    python scripts/run.py run -w -f apps/com.example.app/dist/agent.js com.example.app
    ```

## Hooks

### `android.app.Activity.onCreate`

```typescript
import { hookActivity } from "frida-hooks";
import { sendDataAndLog } from "frida-hooks/log";
import { parseBundle } from "frida-hooks/utils";

const main = () => {
  try {
    hookActivity({
        beforeSet: (bundle, activity) => {
        const intent = activity.getIntent();

        let data = intent.getData();
        if (data != null) {
            data = data.toString();
        }

        sendDataAndLog("Activity.onCreate", {
            activity: activity.$className,
            action: intent.getAction(),
            data,
            bundle: parseBundle(bundle),
            extras: parseBundle(intent.getExtras()),
        });

        // Return unmodified
        return bundle;
        },
    });
  } catch (e) {
    sendDataAndLog("Couldn't hook Activitys", e);
  }
};

Java.perform(main);
```

## Frequently Asked Questions

### Why don't you use `frida-compile`?

I used `frida-compile` until recently when I started encountering `unable to resolve` error messages. That's when I came across this comment from @kursattkorkmazzz: <https://github.com/frida/frida-compile/issues/61#issuecomment-2515134055>. Simply switching to esbuild made everything work—and it's faster too!
