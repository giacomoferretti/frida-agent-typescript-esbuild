import { hookActivity } from "../index.js";
import { sendDataAndLog } from "../log/index.js";
import { parseBundle } from "../utils/index.js";

export const hookActivityOnCreate = () => {
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
};

export const hookAndroidLog = () => {
  const Log = Java.use("android.util.Log");

  Log.d.overload(
    "java.lang.String",
    "java.lang.String",
    "java.lang.Throwable"
  ).implementation = function (
    tag: Java.Wrapper,
    msg: Java.Wrapper,
    tr: Java.Wrapper
  ) {
    sendDataAndLog("Log.d", { tag, msg, tr });
    return this.d
      .overload("java.lang.String", "java.lang.String", "java.lang.Throwable")
      .call(this, tag, msg, tr);
  };

  Log.v.overload(
    "java.lang.String",
    "java.lang.String",
    "java.lang.Throwable"
  ).implementation = function (
    tag: Java.Wrapper,
    msg: Java.Wrapper,
    tr: Java.Wrapper
  ) {
    sendDataAndLog("Log.v", { tag, msg, tr });
    return this.v
      .overload("java.lang.String", "java.lang.String", "java.lang.Throwable")
      .call(this, tag, msg, tr);
  };

  Log.i.overload(
    "java.lang.String",
    "java.lang.String",
    "java.lang.Throwable"
  ).implementation = function (
    tag: Java.Wrapper,
    msg: Java.Wrapper,
    tr: Java.Wrapper
  ) {
    sendDataAndLog("Log.i", { tag, msg, tr });
    return this.i
      .overload("java.lang.String", "java.lang.String", "java.lang.Throwable")
      .call(this, tag, msg, tr);
  };

  Log.e.overload(
    "java.lang.String",
    "java.lang.String",
    "java.lang.Throwable"
  ).implementation = function (
    tag: Java.Wrapper,
    msg: Java.Wrapper,
    tr: Java.Wrapper
  ) {
    sendDataAndLog("Log.e", { tag, msg, tr });
    return this.e
      .overload("java.lang.String", "java.lang.String", "java.lang.Throwable")
      .call(this, tag, msg, tr);
  };

  Log.w.overload(
    "java.lang.String",
    "java.lang.String",
    "java.lang.Throwable"
  ).implementation = function (
    tag: Java.Wrapper,
    msg: Java.Wrapper,
    tr: Java.Wrapper
  ) {
    sendDataAndLog("Log.w", { tag, msg, tr });
    return this.w
      .overload("java.lang.String", "java.lang.String", "java.lang.Throwable")
      .call(this, tag, msg, tr);
  };
};
