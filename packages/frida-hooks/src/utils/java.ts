function iterable(o: Java.Wrapper, cb: (value: Java.Wrapper) => undefined) {
  const iterator = o.iterator();
  while (iterator.hasNext()) {
    cb(iterator.next());
  }
}

/**
 * Determines whether a given Java object or class is an instance of another Java class.
 *
 * @param a - The Java object or class to check. This should be a `Java.Wrapper` instance.
 * @param b - The Java class to check against. This can either be a `Java.Wrapper` instance
 *            or a string representing the fully qualified name of the Java class.
 * @returns A boolean indicating whether `a` is an instance of `b`.
 *
 * @throws An error if `b` is a string and the corresponding Java class cannot be found.
 */
function isInstance(a: Java.Wrapper, b: Java.Wrapper | string) {
  let aClass = a;

  // Convert string to Java class
  let bClass: Java.Wrapper;
  if (typeof b === "string") {
    bClass = Java.use(b);
  } else {
    bClass = b;
  }

  // Convert to generic class object if necessary
  if (aClass.$className !== "java.lang.Class") {
    aClass = aClass.class;
  }
  if (bClass.$className !== "java.lang.Class") {
    bClass = bClass.class;
  }

  return aClass.isInstance(bClass);
}

/**
 * Casts a Java object to a specified class type.
 *
 * @param o - The Java object to be cast. It must implement the `Java.Wrapper` interface.
 * @param className - The fully qualified name of the Java class to cast the object to.
 * @returns The casted Java object as an instance of the specified class.
 *
 * @example
 * ```typescript
 * const myObject = Java.use('com.example.MyClass').$new();
 * const castedObject = cast(myObject, 'com.example.MyClass');
 * ```
 */
function cast(o: Java.Wrapper, className: string) {
  return Java.cast(o, Java.use(className));
}

function describeObject(
  o: Java.Wrapper,
  cbCheck: (value: Java.Wrapper) => boolean | null = null,
  cb: (value: Java.Wrapper) => undefined | null = null,
  skipNull = false
) {
  if (o == null) {
    return null;
  }

  const result: Record<
    string,
    {
      value: string | null;
      className: string;
    } | null
  > = {};

  const declaredFields = o.class.getDeclaredFields();
  for (let i = 0; i < declaredFields.length; i++) {
    const field = declaredFields[i];

    if (field == null) {
      console.error("[describeObject] field is null", field);
      continue;
    }

    const fieldName = field.getName();
    if (o[fieldName] == null) {
      console.error(
        "[describeObject] object.field is null",
        o[fieldName],
        fieldName
      );
      continue;
    }
    const fieldValue = o[fieldName].value;

    // Skip if field value is null
    if (fieldValue == null) {
      if (!skipNull) {
        result[fieldName] = null;
      }
      continue;
    }

    const fieldType = field.getType().getName();

    if (cb && cbCheck && cbCheck(fieldType)) {
      result[fieldName] = {
        value: cb(fieldValue),
        className: fieldType,
      };
      continue;
    }

    result[fieldName] = {
      value: fieldValue.toString(),
      className: fieldType,
    };
  }

  return result;
}

/**
 * Determines whether the given Java object is an enumeration (enum).
 *
 * This function checks if the provided Java object has a declared field
 * named `$VALUES`, which is a common indicator of an enum in Java.
 *
 * @param o - The Java object to check, wrapped in a `Java.Wrapper`.
 * @returns `true` if the object is an enum, otherwise `false`.
 */
function isEnum(o: Java.Wrapper) {
  const declaredFields = o.class.getDeclaredFields();
  for (let i = 0; i < declaredFields.length; i++) {
    if (declaredFields[i].getName() === "$VALUES") {
      return true;
    }
  }

  return false;
}

export { cast, isInstance, isEnum, iterable, describeObject };
