import type { Collection, Endpoint } from "@/lib/storage"

// Interfaz para el formato de Postman
interface PostmanCollection {
  info: {
    _postman_id: string
    name: string
    description?: string
    schema: string
  }
  item: PostmanItem[]
}

interface PostmanItem {
  name: string
  request: {
    method: string
    url: string | { raw: string; host: string[]; path: string[] }
    header?: { key: string; value: string }[]
    body?: {
      mode: string
      raw?: string
      formdata?: { key: string; value: string; type: string }[]
    }
  }
  response?: any[]
  item?: PostmanItem[] // Para carpetas/subcarpetas
}

/**
 * Convierte una colección de Postman al formato de nuestra aplicación
 */
export function convertPostmanCollection(postmanData: any): Collection[] {
  try {
    // Validar que sea una colección de Postman
    if (!postmanData.info || !postmanData.info._postman_id || !postmanData.item) {
      throw new Error("El archivo no parece ser una colección válida de Postman")
    }

    // Crear la colección principal
    const mainCollection: Collection = {
      id: postmanData.info._postman_id,
      name: postmanData.info.name,
      description: postmanData.info.description || "Importado desde Postman",
      endpoints: [],
    }

    // Procesar los items (pueden ser carpetas o requests)
    const collections: Collection[] = []

    // Función recursiva para procesar items y subcarpetas
    function processItems(items: PostmanItem[], parentCollection: Collection) {
      items.forEach((item) => {
        // Si tiene subcarpetas (es una carpeta)
        if (item.item && item.item.length > 0) {
          // Crear una nueva colección para esta carpeta
          const folderCollection: Collection = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            name: `${parentCollection.name} - ${item.name}`,
            description: `Subcarpeta de ${parentCollection.name}`,
            endpoints: [],
          }

          // Procesar los items de esta carpeta
          processItems(item.item, folderCollection)

          // Añadir la colección si tiene endpoints
          if (folderCollection.endpoints.length > 0) {
            collections.push(folderCollection)
          }
        }
        // Si es un request
        else if (item.request) {
          const endpoint = convertPostmanRequest(item)
          parentCollection.endpoints.push(endpoint)
        }
      })
    }

    // Iniciar el procesamiento con la colección principal
    processItems(postmanData.item, mainCollection)

    // Añadir la colección principal si tiene endpoints
    if (mainCollection.endpoints.length > 0) {
      collections.push(mainCollection)
    }

    return collections
  } catch (error) {
    console.error("Error al convertir colección de Postman:", error)
    throw new Error(`No se pudo convertir la colección de Postman: ${error.message}`)
  }
}

/**
 * Convierte un request de Postman a nuestro formato de endpoint
 */
function convertPostmanRequest(item: PostmanItem): Endpoint {
  const { request } = item

  // Extraer la URL
  let url = ""
  if (typeof request.url === "string") {
    url = request.url
  } else if (request.url && request.url.raw) {
    url = request.url.raw
  }

  // Extraer headers como JSON
  let headers = {}
  if (request.header && request.header.length > 0) {
    headers = request.header.reduce((acc, header) => {
      acc[header.key] = header.value
      return acc
    }, {})
  }

  // Extraer body
  let body = ""
  if (request.body && request.body.mode === "raw" && request.body.raw) {
    body = request.body.raw
  } else if (request.body && request.body.mode === "formdata" && request.body.formdata) {
    // Convertir formdata a JSON para nuestro formato
    const formData = {}
    request.body.formdata.forEach((item) => {
      formData[item.key] = item.value
    })
    body = JSON.stringify(formData, null, 2)
  }

  return {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    name: item.name,
    url,
    method: request.method,
    headers: JSON.stringify(headers, null, 2),
    body,
  }
}

/**
 * Detecta si el JSON importado es una colección de Postman
 */
export function isPostmanCollection(data: any): boolean {
  return (
    data &&
    data.info &&
    data.info._postman_id &&
    data.info.schema &&
    data.info.schema.includes("postman") &&
    Array.isArray(data.item)
  )
}
