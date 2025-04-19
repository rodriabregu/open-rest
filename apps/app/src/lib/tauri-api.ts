// Este archivo proporciona una capa de abstracción para las APIs de Tauri
// con implementaciones alternativas para entornos de navegador

// Detectar si estamos en un entorno Tauri
export const isTauri = () => {
  return typeof window !== "undefined" && window.__TAURI__ !== undefined;
};

// Funciones para diálogos de archivos
export async function saveFileDialog(options: {
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}) {
  if (isTauri()) {
    // Importación dinámica para evitar errores en entornos no-Tauri
    const { save } = await import("@tauri-apps/plugin-dialog");
    return save(options);
  } else {
    // Implementación para navegador (simulada)
    console.log("Simulando diálogo de guardar archivo con opciones:", options);
    // En un navegador real, podríamos usar la API File System Access si está disponible
    return Promise.resolve(
      `/simulated/path/${options?.defaultPath || "export.json"}`
    );
  }
}

export async function openFileDialog(options: {
  filters?: { name: string; extensions: string[] }[];
  multiple?: boolean;
}) {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    return open(options);
  } else {
    // Implementación para navegador (simulada)
    console.log("Simulando diálogo de abrir archivo con opciones:", options);
    return Promise.resolve("/simulated/path/import.json");
  }
}

// Funciones para sistema de archivos
export async function writeTextFile(path: string, contents: string) {
  if (isTauri()) {
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    return writeTextFile(path, contents);
  } else {
    // Implementación para navegador
    console.log(`Simulando escritura de archivo en: ${path}`);
    console.log("Contenido:", contents);

    // En un navegador real, podríamos usar la API File System Access o descargar el archivo
    const blob = new Blob([contents], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() || "export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return Promise.resolve();
  }
}

export async function readTextFile(path: string) {
  if (isTauri()) {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    return readTextFile(path);
  } else {
    // Implementación para navegador (simulada)
    console.log(`Simulando lectura de archivo desde: ${path}`);

    // Datos de ejemplo para simular una importación
    const mockData = {
      collections: [
        {
          id: "imported1",
          name: "API Importada",
          description: "Colección importada de ejemplo",
          endpoints: [
            {
              id: "imp1",
              name: "Endpoint Importado",
              url: "https://api.ejemplo.com/importado",
              method: "GET",
            },
          ],
        },
      ],
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    return Promise.resolve(JSON.stringify(mockData));
  }
}
