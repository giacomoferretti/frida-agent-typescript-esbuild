import { sendDataAndLog } from "frida-hooks/log";
import { hookActivityOnCreate, hookAndroidLog } from "frida-hooks/helpers";

const main = () => {
  // Hook `android.app.Activity`
  try {
    hookActivityOnCreate();
  } catch (e) {
    sendDataAndLog("Couldn't hook Activitys", e);
  }

  // Hook `android.util.Log`
  try {
    hookAndroidLog();
  } catch (e) {
    sendDataAndLog("Couldn't hook Log", e);
  }
};

Java.perform(main);
