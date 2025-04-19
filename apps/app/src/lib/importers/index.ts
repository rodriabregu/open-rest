import type { Collection, Endpoint } from "@/lib/storage"
import { convertPostmanCollection, isPostmanCollection } from "./postman"
import { convertInsomniaExport, isInsomniaExport } from "./insomnia"

// Tipos de importación soportados
export type ImportFormat = "postman" | "insomnia" | "native" | "unknown"

// Interfaz para el resultado de la detección
export interface DetectionResult {
  format: ImportFormat
  collections?: Collection[]
  error?: string
}

/**
 * Detecta el formato del archivo importado y lo convierte a nuestro formato
 */
export function detectAndConvertImport(data: any): DetectionResult {
  try {
    // Verificar si es una colección de Postman
    if (isPostmanCollection(data)) {
      const collections = convertPostmanCollection(data)
      return {
        format: "postman",
        collections,
      }
    }

    // Verificar si es una exportación de Insomnia
    if (isInsomniaExport(data)) {
      const collections = convertInsomniaExport(data)
      return {
        format: "insomnia",
        collections,
      }
    }

    // Verificar si es nuestro formato nativo
    if (data.collections && Array.isArray(data.collections)) {
      return {
        format: "native",
        collections: data.collections,
      }
    }

    // Formato desconocido
    return {
      format: "unknown",
      error: "El formato del archivo no es reconocido",
    }
  } catch (error) {
    return {
      format: "unknown",
      error: error.message || "Error al procesar el archivo importado",
    }
  }
}

// Función para enriquecer los endpoints con información adicional
export function enrichEndpoint(endpoint: Endpoint): Endpoint {
  // Si el endpoint no tiene headers o body, añadirlos
  return {
    ...endpoint,
    headers: endpoint.headers || "{}",
    body: endpoint.body || "",
  }
}
