// Interfaz para los endpoints
export interface Endpoint {
  id: string
  name: string
  url: string
  method: string
  headers?: string // JSON string con los headers
  body?: string // Cuerpo de la petición
  auth?: string // JSON string con la configuración de autenticación
  tests?: string // Script de pruebas
}

// Interfaz para las colecciones
export interface Collection {
  id: string
  name: string
  description: string
  endpoints: Endpoint[]
}

// Interfaz para el historial
export interface HistoryItem {
  url: string
  method: string
  timestamp: string
  status: number
}

// Interfaz para las variables de entorno
export interface EnvVariable {
  id: string
  name: string
  value: string
  description?: string
}

// Interfaz para los entornos
export interface Environment {
  id: string
  name: string
  variables: EnvVariable[]
  isActive?: boolean
}

// Función para guardar colecciones en localStorage
export const saveCollections = (collections: Collection[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("rest-client-collections", JSON.stringify(collections))
  }
}

// Función para cargar colecciones desde localStorage
export const loadCollections = (): Collection[] => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("rest-client-collections")
    if (saved) {
      return JSON.parse(saved)
    }
  }
  return []
}

// Función para guardar historial en localStorage
export const saveHistory = (history: HistoryItem[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("rest-client-history", JSON.stringify(history))
  }
}

// Función para cargar historial desde localStorage
export const loadHistory = (): HistoryItem[] => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("rest-client-history")
    if (saved) {
      return JSON.parse(saved)
    }
  }
  return []
}

// Función para guardar entornos en localStorage
export const saveEnvironments = (environments: Environment[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("rest-client-environments", JSON.stringify(environments))
  }
}

// Función para cargar entornos desde localStorage
export const loadEnvironments = (): Environment[] => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("rest-client-environments")
    if (saved) {
      return JSON.parse(saved)
    }
  }
  return []
}

// Función para obtener el entorno activo
export const getActiveEnvironment = (environments: Environment[]): Environment | null => {
  const activeEnv = environments.find((env) => env.isActive)
  return activeEnv || null
}

// Función para establecer un entorno como activo
export const setActiveEnvironment = (environments: Environment[], envId: string): Environment[] => {
  return environments.map((env) => ({
    ...env,
    isActive: env.id === envId,
  }))
}

// Función para reemplazar variables en una cadena
export const replaceVariables = (text: string, variables: EnvVariable[]): string => {
  if (!text || !variables || variables.length === 0) return text

  let result = text

  // Reemplazar variables en formato {{variable}}
  variables.forEach((variable) => {
    const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, "g")
    result = result.replace(regex, variable.value)
  })

  return result
}
