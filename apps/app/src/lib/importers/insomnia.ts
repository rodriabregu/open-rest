import type { Collection, Endpoint } from "@/lib/storage"

// Interfaz para el formato de Insomnia
interface InsomniaExport {
  _type: string
  __export_format: number
  __export_date: string
  __export_source: string
  resources: InsomniaResource[]
}

interface InsomniaResource {
  _id: string
  _type: string
  name: string
  description?: string
  parentId?: string
  url?: string
  method?: string
  headers?: { name: string; value: string }[]
  body?: {
    mimeType: string
    text?: string
  }
}

/**
 * Convierte una exportación de Insomnia al formato de nuestra aplicación
 */
export function convertInsomniaExport(insomniaData: any): Collection[] {
  try {
    // Validar que sea una exportación de Insomnia
    if (!insomniaData.__export_format || !insomniaData.resources || !Array.isArray(insomniaData.resources)) {
      throw new Error("El archivo no parece ser una exportación válida de Insomnia")
    }

    const collections: Collection[] = []
    const resources = insomniaData.resources

    // Obtener todas las carpetas (colecciones)
    const folders = resources.filter((r) => r._type === "request_group")

    // Crear una colección para cada carpeta
    folders.forEach((folder) => {
      const collection: Collection = {
        id: folder._id,
        name: folder.name,
        description: folder.description || "Importado desde Insomnia",
        endpoints: [],
      }

      // Encontrar todos los requests que pertenecen a esta carpeta
      const requests = resources.filter((r) => r._type === "request" && r.parentId === folder._id)

      // Convertir cada request a nuestro formato de endpoint
      requests.forEach((request) => {
        const endpoint = convertInsomniaRequest(request)
        collection.endpoints.push(endpoint)
      })

      // Solo añadir la colección si tiene endpoints
      if (collection.endpoints.length > 0) {
        collections.push(collection)
      }
    })

    // Crear una colección para requests sin carpeta
    const orphanRequests = resources.filter(
      (r) => r._type === "request" && (!r.parentId || !folders.find((f) => f._id === r.parentId)),
    )

    if (orphanRequests.length > 0) {
      const orphanCollection: Collection = {
        id: Date.now().toString(),
        name: "Requests sin carpeta",
        description: "Requests importados desde Insomnia que no pertenecen a ninguna carpeta",
        endpoints: orphanRequests.map(convertInsomniaRequest),
      }

      collections.push(orphanCollection)
    }

    return collections
  } catch (error) {
    console.error("Error al convertir exportación de Insomnia:", error)
    throw new Error(`No se pudo convertir la exportación de Insomnia: ${error.message}`)
  }
}

/**
 * Convierte un request de Insomnia a nuestro formato de endpoint
 */
function convertInsomniaRequest(request: InsomniaResource): Endpoint {
  // Extraer headers como JSON
  let headers = {}
  if (request.headers && request.headers.length > 0) {
    headers = request.headers.reduce((acc, header) => {
      acc[header.name] = header.value
      return acc
    }, {})
  }

  // Extraer body
  let body = ""
  if (request.body && request.body.text) {
    body = request.body.text
  }

  return {
    id: request._id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
    name: request.name,
    url: request.url || "",
    method: request.method || "GET",
    headers: JSON.stringify(headers, null, 2),
    body,
  }
}

/**
 * Detecta si el JSON importado es una exportación de Insomnia
 */
export function isInsomniaExport(data: any): boolean {
  return (
    data &&
    data.__export_format &&
    data.__export_source &&
    data.__export_source.includes("insomnia") &&
    Array.isArray(data.resources)
  )
}
