// Types for stored responses
export interface StoredResponse {
  id: string
  name: string
  timestamp: string
  url: string
  method: string
  status: number
  contentType?: string
  responseData: any
  responseText: string
}

// In-memory store for responses
let responseStore: StoredResponse[] = []

// Maximum number of responses to keep in history
const MAX_STORED_RESPONSES = 10

// Function to add a response to the store
export function storeResponse(response: Omit<StoredResponse, "id">): StoredResponse {
  const id = Date.now().toString()
  const storedResponse: StoredResponse = {
    ...response,
    id,
  }

  // Add to the beginning of the array
  responseStore = [storedResponse, ...responseStore.slice(0, MAX_STORED_RESPONSES - 1)]

  // Also save to localStorage for persistence
  saveResponseStore()

  return storedResponse
}

// Function to get a response by ID
export function getResponseById(id: string): StoredResponse | undefined {
  return responseStore.find((response) => response.id === id)
}

// Function to get the most recent response
export function getLatestResponse(): StoredResponse | undefined {
  return responseStore[0]
}

// Function to get all stored responses
export function getAllResponses(): StoredResponse[] {
  return [...responseStore]
}

// Function to clear all stored responses
export function clearResponseStore(): void {
  responseStore = []
  saveResponseStore()
}

// Function to remove a specific response
export function removeResponse(id: string): void {
  responseStore = responseStore.filter((response) => response.id !== id)
  saveResponseStore()
}

// Function to save the response store to localStorage
function saveResponseStore(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("rest-client-response-store", JSON.stringify(responseStore))
  }
}

// Function to load the response store from localStorage
export function loadResponseStore(): void {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("rest-client-response-store")
    if (saved) {
      try {
        responseStore = JSON.parse(saved)
      } catch (error) {
        console.error("Error loading response store:", error)
        responseStore = []
      }
    }
  }
}

// Function to extract a value from a response using a path
export function extractValueFromResponse(response: StoredResponse, path: string): any {
  if (!path) return response.responseData

  try {
    // Handle special paths
    if (path === "status") return response.status
    if (path === "contentType") return response.contentType
    if (path === "responseText") return response.responseText

    // For JSON data, navigate the path
    const parts = path.split(".")
    let current = response.responseData

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
    console.error(`Error extracting value from path ${path}:`, error)
    return undefined
  }
}

// Function to replace response references in a string
export function replaceResponseReferences(
  text: string,
  getResponse: (id?: string) => StoredResponse | undefined = getLatestResponse,
): string {
  if (!text) return text

  // Match patterns like {{response.data.id}} or {{response:123.data.id}}
  const regex = /{{response(?::([^.}]+))?\.([^}]+)}}/g

  return text.replace(regex, (match, responseId, path) => {
    try {
      // Get the specified response or the latest one
      const response = responseId ? getResponseById(responseId) : getResponse()

      if (!response) {
        console.warn(`Response not found: ${responseId || "latest"}`)
        return match // Keep the original text if response not found
      }

      // Extract the value from the response
      const value = extractValueFromResponse(response, path)

      if (value === undefined) {
        console.warn(`Path not found in response: ${path}`)
        return match // Keep the original text if path not found
      }

      // Convert to string if it's an object or array
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value)
      }

      return String(value)
    } catch (error) {
      console.error("Error replacing response reference:", error)
      return match // Keep the original text if there's an error
    }
  })
}
