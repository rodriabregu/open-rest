// Types for test results
export interface TestResult {
  name: string
  passed: boolean
  error?: string
}

export interface TestSuiteResult {
  results: TestResult[]
  passed: number
  failed: number
  duration: number
}

// Test context that will be available to test scripts
export interface TestContext {
  response: any
  responseText: string
  status: number
  statusText?: string
  contentType?: string
  responseTime: number
  responseSize: number
  headers: Record<string, string>
  assert: {
    equals: (actual: any, expected: any, message?: string) => void
    notEquals: (actual: any, expected: any, message?: string) => void
    contains: (haystack: string, needle: string, message?: string) => void
    notContains: (haystack: string, needle: string, message?: string) => void
    greaterThan: (actual: number, expected: number, message?: string) => void
    lessThan: (actual: number, expected: number, message?: string) => void
    isTrue: (actual: boolean, message?: string) => void
    isFalse: (actual: boolean, message?: string) => void
    isNull: (actual: any, message?: string) => void
    isNotNull: (actual: any, message?: string) => void
    isUndefined: (actual: any, message?: string) => void
    isDefined: (actual: any, message?: string) => void
    matches: (actual: string, pattern: RegExp, message?: string) => void
    hasProperty: (obj: any, prop: string, message?: string) => void
    hasProperties: (obj: any, props: string[], message?: string) => void
    isArray: (actual: any, message?: string) => void
    isObject: (actual: any, message?: string) => void
    isString: (actual: any, message?: string) => void
    isNumber: (actual: any, message?: string) => void
    isBoolean: (actual: any, message?: string) => void
  }
  // Helper functions to access response data
  jsonPath: (path: string) => any
  headerValue: (name: string) => string | undefined
}

// Function to run tests
export async function runTests(
  testScript: string,
  responseData: {
    response: any
    responseText: string
    status: number
    statusText?: string
    contentType?: string
    responseTime: number
    responseSize: number
    headers: Record<string, string>
  },
): Promise<TestSuiteResult> {
  const startTime = performance.now()
  const results: TestResult[] = []
  let passed = 0
  let failed = 0

  try {
    // Create test context with assertion functions
    const context: TestContext = {
      ...responseData,
      assert: {
        equals: (actual, expected, message = "Values should be equal") => {
          if (actual !== expected) {
            throw new Error(`${message}: ${actual} !== ${expected}`)
          }
        },
        notEquals: (actual, expected, message = "Values should not be equal") => {
          if (actual === expected) {
            throw new Error(`${message}: ${actual} === ${expected}`)
          }
        },
        contains: (haystack, needle, message = "String should contain substring") => {
          if (!haystack.includes(needle)) {
            throw new Error(`${message}: "${haystack}" does not contain "${needle}"`)
          }
        },
        notContains: (haystack, needle, message = "String should not contain substring") => {
          if (haystack.includes(needle)) {
            throw new Error(`${message}: "${haystack}" contains "${needle}"`)
          }
        },
        greaterThan: (actual, expected, message = "Value should be greater than expected") => {
          if (!(actual > expected)) {
            throw new Error(`${message}: ${actual} is not greater than ${expected}`)
          }
        },
        lessThan: (actual, expected, message = "Value should be less than expected") => {
          if (!(actual < expected)) {
            throw new Error(`${message}: ${actual} is not less than ${expected}`)
          }
        },
        isTrue: (actual, message = "Value should be true") => {
          if (actual !== true) {
            throw new Error(`${message}: ${actual} is not true`)
          }
        },
        isFalse: (actual, message = "Value should be false") => {
          if (actual !== false) {
            throw new Error(`${message}: ${actual} is not false`)
          }
        },
        isNull: (actual, message = "Value should be null") => {
          if (actual !== null) {
            throw new Error(`${message}: ${actual} is not null`)
          }
        },
        isNotNull: (actual, message = "Value should not be null") => {
          if (actual === null) {
            throw new Error(`${message}: value is null`)
          }
        },
        isUndefined: (actual, message = "Value should be undefined") => {
          if (actual !== undefined) {
            throw new Error(`${message}: ${actual} is not undefined`)
          }
        },
        isDefined: (actual, message = "Value should be defined") => {
          if (actual === undefined) {
            throw new Error(`${message}: value is undefined`)
          }
        },
        matches: (actual, pattern, message = "String should match pattern") => {
          if (!pattern.test(actual)) {
            throw new Error(`${message}: "${actual}" does not match ${pattern}`)
          }
        },
        hasProperty: (obj, prop, message = "Object should have property") => {
          if (!obj || !Object.prototype.hasOwnProperty.call(obj, prop)) {
            throw new Error(`${message}: property "${prop}" not found`)
          }
        },
        hasProperties: (obj, props, message = "Object should have properties") => {
          if (!obj) {
            throw new Error(`${message}: object is null or undefined`)
          }
          for (const prop of props) {
            if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
              throw new Error(`${message}: property "${prop}" not found`)
            }
          }
        },
        isArray: (actual, message = "Value should be an array") => {
          if (!Array.isArray(actual)) {
            throw new Error(`${message}: value is not an array`)
          }
        },
        isObject: (actual, message = "Value should be an object") => {
          if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
            throw new Error(`${message}: value is not an object`)
          }
        },
        isString: (actual, message = "Value should be a string") => {
          if (typeof actual !== "string") {
            throw new Error(`${message}: value is not a string`)
          }
        },
        isNumber: (actual, message = "Value should be a number") => {
          if (typeof actual !== "number" || isNaN(actual)) {
            throw new Error(`${message}: value is not a number`)
          }
        },
        isBoolean: (actual, message = "Value should be a boolean") => {
          if (typeof actual !== "boolean") {
            throw new Error(`${message}: value is not a boolean`)
          }
        },
      },
      jsonPath: (path) => {
        try {
          if (!path) return responseData.response

          // Simple JSON path implementation
          const parts = path.split(".")
          let current = responseData.response

          for (const part of parts) {
            if (part.includes("[") && part.includes("]")) {
              // Handle array access
              const [arrayName, indexStr] = part.split("[")
              const index = Number.parseInt(indexStr.replace("]", ""), 10)

              if (arrayName) {
                current = current[arrayName][index]
              } else {
                current = current[index]
              }
            } else {
              current = current[part]
            }

            if (current === undefined) return undefined
          }

          return current
        } catch (error) {
          return undefined
        }
      },
      headerValue: (name) => {
        const normalizedName = name.toLowerCase()
        const headerNames = Object.keys(responseData.headers)
        const matchingHeader = headerNames.find((h) => h.toLowerCase() === normalizedName)
        return matchingHeader ? responseData.headers[matchingHeader] : undefined
      },
    }

    // Create test function
    const testFunction = new Function(
      "context",
      "test",
      `
      const { response, responseText, status, statusText, contentType, responseTime, responseSize, headers, assert, jsonPath, headerValue } = context;
      
      function test(name, fn) {
        try {
          fn();
          return { name, passed: true };
        } catch (error) {
          return { name, passed: false, error: error.message };
        }
      }
      
      const results = [];
      ${testScript}
      return results;
      `,
    )

    // Run tests
    const testResults = testFunction(context, (name: string, fn: () => void) => {
      try {
        fn()
        passed++
        return { name, passed: true }
      } catch (error) {
        failed++
        return { name, passed: false, error: error.message }
      }
    })

    results.push(...testResults)
  } catch (error) {
    results.push({
      name: "Script Error",
      passed: false,
      error: error.message || "Unknown error occurred while running tests",
    })
    failed++
  }

  const endTime = performance.now()
  const duration = endTime - startTime

  return {
    results,
    passed,
    failed,
    duration,
  }
}

// Example test templates
export const testTemplates = {
  statusCode: `// Verificar código de estado
test("El código de estado debe ser 200", function() {
  assert.equals(status, 200);
});`,

  responseTime: `// Verificar tiempo de respuesta
test("El tiempo de respuesta debe ser menor a 1000ms", function() {
  assert.lessThan(responseTime, 1000);
});`,

  jsonStructure: `// Verificar estructura JSON
test("La respuesta debe tener la propiedad 'data'", function() {
  assert.hasProperty(response, "data");
});

test("'data' debe ser un array", function() {
  assert.isArray(jsonPath("data"));
});`,

  contentType: `// Verificar tipo de contenido
test("El tipo de contenido debe ser JSON", function() {
  assert.contains(contentType, "application/json");
});`,

  dataValidation: `// Validar datos específicos
test("El primer elemento debe tener un ID", function() {
  const firstItem = jsonPath("data[0]");
  assert.isDefined(firstItem);
  assert.hasProperty(firstItem, "id");
});`,

  headers: `// Verificar headers
test("La respuesta debe incluir el header 'cache-control'", function() {
  const cacheControl = headerValue("cache-control");
  assert.isDefined(cacheControl);
});`,

  complete: `// Verificación completa
test("El código de estado debe ser 200", function() {
  assert.equals(status, 200);
});

test("El tipo de contenido debe ser JSON", function() {
  assert.contains(contentType, "application/json");
});

test("El tiempo de respuesta debe ser aceptable", function() {
  assert.lessThan(responseTime, 1000);
});

test("La respuesta debe tener la estructura correcta", function() {
  assert.isObject(response);
  assert.hasProperties(response, ["data", "meta"]);
  assert.isArray(jsonPath("data"));
});

test("Los datos deben ser válidos", function() {
  const firstItem = jsonPath("data[0]");
  if (firstItem) {
    assert.hasProperties(firstItem, ["id", "name"]);
    assert.isNumber(firstItem.id);
    assert.isString(firstItem.name);
  }
});`,
}
