import { iterable, isInstance, describeObject, cast, isEnum } from "./java.js";

const Arrays = Java.use("java.util.Arrays");

export function parseBundle(bundle: Java.Wrapper | null) {
  if (bundle == null) {
    return null;
  }

  const result: Record<string, unknown> = {};

  iterable(
    bundle.keySet(),
    // key is a Set<String>
    (key: Java.Wrapper) => {
      let value = bundle.get(key);

      // Skip if value is null
      if (value == null) {
        result[key.toString()] = null;
        return;
      }

      const className = value.$className;
      switch (className) {
        // Filter out primitives
        case "java.lang.Byte":
        case "java.lang.Character":
        case "java.lang.Short":
        case "java.lang.Integer":
        case "java.lang.Long":
        case "java.lang.Double":
        case "java.lang.Float":
        case "java.lang.Boolean":
        case "java.lang.String":
        case "java.lang.CharSequence":
        case "java.util.HashMap":
          value = value.toString();
          break;

        case "[B":
        case "[C":
        case "[S":
        case "[I":
        case "[J":
        case "[D":
        case "[F":
        case "[Z":
          value = (Arrays.toString as Java.MethodDispatcher)
            .overload(className)
            .call(Arrays, value);
          break;
        case "[Ljava.lang.String;":
        case "[Ljava.lang.CharSequence;":
          value = JSON.parse(
            Java.use("org.json.JSONArray").$new(cast(value, className))
          );
          break;

        default:
          if (
            isInstance(value, "java.io.Serializable") ||
            isInstance(value, "android.os.Parcelable")
          ) {
            const castObject = cast(value, className);

            if (isEnum(castObject)) {
              value = value.toString();
            } else {
              value = describeObject(castObject);
            }
          }
          break;
      }

      result[key.toString()] = { value, className };
    }
  );

  return result;
}
