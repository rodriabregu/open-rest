"use client";

import "./App.css";

import { useState, useEffect } from "react";
import {
  Save,
  Clock,
  Play,
  FolderPlus,
  Folder,
  Trash2,
  Move,
  Download,
  Upload,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  type Collection,
  type HistoryItem,
  type Environment,
  type EnvVariable,
  saveCollections,
  loadCollections,
  saveHistory,
  loadHistory,
  saveEnvironments,
  loadEnvironments,
  setActiveEnvironment,
  replaceVariables,
} from "@/lib/storage";

import {
  saveFileDialog,
  openFileDialog,
  writeTextFile,
  readTextFile,
} from "@/lib/tauri-api";

import {
  detectAndConvertImport,
  type ImportFormat,
  enrichEndpoint,
} from "@/lib/importers";
import { EnvironmentManager } from "@/components/environment-manager";
import { AuthPanel, type AuthConfig } from "@/components/auth-panel";
import { HeadersPanel, type HeaderItem } from "@/components/headers-panel";
import { ResponseViewer } from "@/components/response-viewer";
import { CodeGenerator } from "@/components/code-generator";
import { TestEditor } from "@/components/test-editor";
import { ResponseReferencesPanel } from "@/components/response-references-panel";
import type { TestSuiteResult } from "@/lib/test-runner";
import {
  storeResponse,
  loadResponseStore,
  replaceResponseReferences,
} from "@/lib/response-store";

export default function Home() {
  const { toast } = useToast();

  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [responseSize, setResponseSize] = useState(0);
  const [statusCode, setStatusCode] = useState(0);
  const [contentType, setContentType] = useState("");
  const [responseHeaders, setResponseHeaders] = useState<
    Record<string, string>
  >({});
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [testScript, setTestScript] = useState("");
  const [testResults, setTestResults] = useState<TestSuiteResult | null>(null);
  const [parsedResponse, setParsedResponse] = useState<any>(null);
  const [responsesUpdated, setResponsesUpdated] = useState(0);

  // Estado para colecciones
  const [collections, setCollections] = useState<Collection[]>([]);

  // Estado para modales
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newEndpointName, setNewEndpointName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [selectedEndpoint, setSelectedEndpoint] = useState<any | null>(null);
  const [targetCollectionId, setTargetCollectionId] = useState("");

  // Estado para importación
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");
  const [importData, setImportData] = useState<Collection[] | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    collections: number;
    endpoints: number;
  } | null>(null);

  // Estado para variables de entorno
  const [environments, setEnvironments] = useState<Environment[]>([]);

  // Estado para autenticación
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    type: "none",
    enabled: false,
  });

  // Estado para headers
  const [headers, setHeaders] = useState<HeaderItem[]>([
    {
      id: "1",
      name: "Content-Type",
      value: "application/json",
      enabled: true,
    },
  ]);

  // Estado para headers generados por autenticación
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Añadir estado para el formato detectado
  const [detectedFormat, setDetectedFormat] = useState<ImportFormat>("unknown");

  // Cargar datos al iniciar
  useEffect(() => {
    const savedCollections = loadCollections();
    if (savedCollections.length > 0) {
      setCollections(savedCollections);
    } else {
      // Datos de ejemplo si no hay colecciones guardadas
      setCollections([
        {
          id: "1",
          name: "JSONPlaceholder",
          description: "API de prueba para desarrollo",
          endpoints: [
            {
              id: "1",
              name: "Obtener Posts",
              url: "https://jsonplaceholder.typicode.com/posts",
              method: "GET",
            },
            {
              id: "2",
              name: "Obtener Usuario",
              url: "https://jsonplaceholder.typicode.com/users/1",
              method: "GET",
            },
          ],
        },
        {
          id: "2",
          name: "Proyecto Personal",
          description: "API de mi proyecto",
          endpoints: [
            {
              id: "3",
              name: "Login",
              url: "https://mi-api.com/auth/login",
              method: "POST",
            },
          ],
        },
      ]);
    }

    const savedHistory = loadHistory();
    if (savedHistory.length > 0) {
      setHistory(savedHistory);
    }

    // Cargar entornos
    const savedEnvironments = loadEnvironments();
    if (savedEnvironments.length > 0) {
      setEnvironments(savedEnvironments);
    } else {
      // Crear entorno global por defecto
      setEnvironments([
        {
          id: "global",
          name: "Global",
          variables: [
            {
              id: "1",
              name: "base_url",
              value: "https://jsonplaceholder.typicode.com",
              description: "URL base para JSONPlaceholder API",
            },
          ],
          isActive: true,
        },
      ]);
    }

    // Cargar respuestas almacenadas
    loadResponseStore(); // Added
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    if (collections.length > 0) {
      saveCollections(collections);
    }
  }, [collections]);

  useEffect(() => {
    if (history.length > 0) {
      saveHistory(history);
    }
  }, [history]);

  useEffect(() => {
    if (environments.length > 0) {
      saveEnvironments(environments);
    }
  }, [environments]);

  // Obtener variables del entorno activo
  const getActiveVariables = (): EnvVariable[] => {
    const activeEnv = environments.find((env) => env.isActive);
    const globalEnv = environments.find((env) => env.id === "global");

    // Combinar variables globales con las del entorno activo
    const globalVars = globalEnv?.variables || [];
    const activeVars =
      activeEnv && activeEnv.id !== "global" ? activeEnv.variables : [];

    // Las variables del entorno activo tienen prioridad sobre las globales
    const combinedVars = [...globalVars];

    // Añadir o sobrescribir variables del entorno activo
    activeVars.forEach((activeVar) => {
      const existingIndex = combinedVars.findIndex(
        (v) => v.name === activeVar.name
      );
      if (existingIndex >= 0) {
        combinedVars[existingIndex] = activeVar;
      } else {
        combinedVars.push(activeVar);
      }
    });

    return combinedVars;
  };

  // Procesar URL con variables antes de enviar
  const processUrlWithVariables = (inputUrl: string): string => {
    const activeVars = getActiveVariables();
    let processedUrl = replaceVariables(inputUrl, activeVars);

    // Reemplazar referencias a respuestas anteriores
    processedUrl = replaceResponseReferences(processedUrl); // Added

    // Añadir parámetros de consulta para API Key si es necesario
    if (
      authConfig.enabled &&
      authConfig.type === "apikey" &&
      authConfig.apiKeyIn === "query" &&
      authConfig.apiKeyName &&
      authConfig.apiKeyValue
    ) {
      const separator = processedUrl.includes("?") ? "&" : "?";
      const apiKeyValue = replaceVariables(authConfig.apiKeyValue, activeVars);
      processedUrl += `${separator}${authConfig.apiKeyName}=${encodeURIComponent(apiKeyValue)}`;
    }

    return processedUrl;
  };

  // Construir headers para la petición
  const buildRequestHeaders = (): Record<string, string> => {
    const activeVars = getActiveVariables();
    const requestHeaders: Record<string, string> = {};

    // Añadir headers personalizados habilitados
    headers
      .filter((header) => header.enabled)
      .forEach((header) => {
        let value = replaceVariables(header.value, activeVars);
        value = replaceResponseReferences(value); // Added
        requestHeaders[header.name] = value;
      });

    // Añadir headers de autenticación (tienen prioridad)
    Object.entries(authHeaders).forEach(([name, value]) => {
      let processedValue = replaceVariables(value, activeVars);
      processedValue = replaceResponseReferences(processedValue); // Added
      requestHeaders[name] = processedValue;
    });

    return requestHeaders;
  };

  // Procesar body con variables antes de enviar
  const processBodyWithVariables = (inputBody: string): string => {
    const activeVars = getActiveVariables();
    let processedBody = replaceVariables(inputBody, activeVars);
    processedBody = replaceResponseReferences(processedBody); // Added
    return processedBody;
  };

  const handleRequest = async () => {
    try {
      setLoading(true);
      setResponse("Enviando solicitud...");
      setResponseTime(0);
      setResponseSize(0);
      setStatusCode(0);
      setContentType("");
      setResponseHeaders({}); // Added
      setParsedResponse(null); // Added
      setTestResults(null); // Added

      // Registrar tiempo de inicio
      const startTime = performance.now();

      // Procesar URL y headers con variables
      const processedUrl = processUrlWithVariables(url);
      const requestHeaders = buildRequestHeaders();
      const processedBody = processBodyWithVariables(body);

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && processedBody) {
        options.body = processedBody;
      }

      const response = await fetch(processedUrl, options);

      // Calcular tiempo de respuesta
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      // Obtener código de estado y tipo de contenido
      setStatusCode(response.status);
      setContentType(response.headers.get("content-type") || "");

      // Extraer headers de la respuesta
      const headers: Record<string, string> = {}; // Renamed to avoid conflict
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      setResponseHeaders(headers); // Added

      // Obtener el texto de la respuesta
      const responseText = await response.text();

      // Intentar parsear como JSON
      let jsonData = null; // Added
      try {
        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          jsonData = JSON.parse(responseText);
          setParsedResponse(jsonData); // Added
        }
      } catch (e) {
        console.error("Error parsing JSON response:", e);
      }

      // Calcular tamaño de la respuesta
      setResponseSize(new Blob([responseText]).size);

      // Guardar en historial
      const historyItem = {
        url: processedUrl,
        method,
        timestamp: new Date().toLocaleString(),
        status: response.status,
      };
      setHistory([historyItem, ...history].slice(0, 10));

      // Mostrar respuesta
      setResponse(responseText);

      // Almacenar la respuesta para referencias futuras
      storeResponse({
        // Added
        name: `${method} ${processedUrl.split("/").pop() || processedUrl}`,
        timestamp: new Date().toLocaleString(),
        url: processedUrl,
        method,
        status: response.status,
        contentType: response.headers.get("content-type") || undefined,
        responseData: jsonData,
        responseText,
      });

      // Actualizar el contador de respuestas para refrescar el panel de referencias
      setResponsesUpdated((prev) => prev + 1); // Added
    } catch (error: any) {
      setResponse(`Error: ${error.message}`);
      setStatusCode(0);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para gestionar colecciones
  const addCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection = {
      id: Date.now().toString(),
      name: newCollectionName,
      description: newCollectionDescription,
      endpoints: [],
    };

    setCollections([...collections, newCollection]);
    setNewCollectionName("");
    setNewCollectionDescription("");
  };

  const deleteCollection = (collectionId: string) => {
    setCollections(
      collections.filter((collection) => collection.id !== collectionId)
    );
  };

  // Funciones para gestionar endpoints
  const saveEndpoint = () => {
    if (!selectedCollection) return;

    const newEndpoint = {
      id: Date.now().toString(),
      name: newEndpointName || `Endpoint ${url.split("/").pop()}`,
      url,
      method,
      headers: JSON.stringify(
        headers
          .filter((h) => h.enabled)
          .reduce((acc, h) => ({ ...acc, [h.name]: h.value }), {})
      ),
      body,
      auth: JSON.stringify(authConfig),
      tests: testScript, // Added
    };

    const updatedCollections = collections.map((collection) => {
      if (collection.id === selectedCollection) {
        return {
          ...collection,
          endpoints: [...collection.endpoints, newEndpoint],
        };
      }
      return collection;
    });

    setCollections(updatedCollections);
    setNewEndpointName("");
    toast({
      title: "Endpoint guardado",
      description: `El endpoint "${newEndpoint.name}" ha sido guardado en la colección`,
    });
  };

  const deleteEndpoint = (collectionId: string, endpointId: string) => {
    const updatedCollections = collections.map((collection) => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          endpoints: collection.endpoints.filter(
            (endpoint) => endpoint.id !== endpointId
          ),
        };
      }
      return collection;
    });

    setCollections(updatedCollections);
  };

  const moveEndpoint = () => {
    if (!selectedEndpoint || !targetCollectionId) return;

    // Primero, eliminar el endpoint de su colección actual
    let endpointToMove: any = null;
    const collectionsAfterRemoval = collections.map((collection) => {
      const foundEndpoint = collection.endpoints.find(
        (e) => e.id === selectedEndpoint.id
      );

      if (foundEndpoint) {
        endpointToMove = foundEndpoint;
        return {
          ...collection,
          endpoints: collection.endpoints.filter(
            (e) => e.id !== selectedEndpoint.id
          ),
        };
      }
      return collection;
    });

    // Luego, añadir el endpoint a la nueva colección
    if (endpointToMove) {
      const finalCollections = collectionsAfterRemoval.map((collection) => {
        if (collection.id === targetCollectionId) {
          return {
            ...collection,
            endpoints: [...collection.endpoints, endpointToMove],
          };
        }
        return collection;
      });

      setCollections(finalCollections);
    }

    setSelectedEndpoint(null);
    setTargetCollectionId("");
  };

  const loadEndpoint = (endpoint: any) => {
    setUrl(endpoint.url);
    setMethod(endpoint.method);
    setBody(endpoint.body || "");
    setTestScript(endpoint.tests || ""); // Added

    // Cargar headers
    try {
      if (endpoint.headers) {
        const headersObj = JSON.parse(endpoint.headers);
        const headerItems: HeaderItem[] = Object.entries(headersObj).map(
          ([name, value]) => ({
            id:
              Date.now().toString() +
              Math.random().toString(36).substring(2, 9),
            name,
            value: value as string,
            enabled: true,
          })
        );
        setHeaders(headerItems);
      } else {
        // Added else block to reset headers if none are saved
        setHeaders([
          {
            id: "1",
            name: "Content-Type",
            value: "application/json",
            enabled: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error al cargar headers:", error);
      // Reset headers on error
      setHeaders([
        {
          id: "1",
          name: "Content-Type",
          value: "application/json",
          enabled: true,
        },
      ]);
    }

    // Cargar configuración de autenticación
    try {
      if (endpoint.auth) {
        const authObj = JSON.parse(endpoint.auth);
        setAuthConfig(authObj);
      } else {
        // Added else block to reset auth config if none is saved
        setAuthConfig({ type: "none", enabled: false });
      }
    } catch (error) {
      console.error("Error al cargar autenticación:", error);
      // Reset auth config on error
      setAuthConfig({ type: "none", enabled: false });
    }
  };

  // Funciones para exportar/importar colecciones
  const exportCollections = async () => {
    try {
      // Preparar datos para exportar
      const dataToExport = {
        collections,
        exportDate: new Date().toISOString(),
        version: "1.0",
      };

      // Convertir a JSON
      const jsonData = JSON.stringify(dataToExport, null, 2);

      // Mostrar diálogo para guardar archivo
      const filePath = await saveFileDialog({
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
        defaultPath: "colecciones-api.json",
      });

      if (filePath) {
        // Escribir archivo
        await writeTextFile(filePath, jsonData);

        toast({
          title: "Exportación exitosa",
          description: "Tus colecciones han sido exportadas correctamente.",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Error al exportar colecciones:", error);
      toast({
        title: "Error al exportar",
        description:
          "No se pudieron exportar las colecciones. " +
          (error.message || "Error desconocido"),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const startImport = async () => {
    try {
      // Mostrar diálogo para seleccionar archivo
      const selected = await openFileDialog({
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
        multiple: false,
      });

      if (selected) {
        // Leer archivo
        const content = await readTextFile(selected as string);

        // Parsear JSON
        const importedData = JSON.parse(content);

        // Detectar formato y convertir
        const result = detectAndConvertImport(importedData);

        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.collections || result.collections.length === 0) {
          throw new Error("No se encontraron colecciones para importar");
        }

        // Guardar el formato detectado
        setDetectedFormat(result.format);

        // Contar endpoints totales
        const totalEndpoints = result.collections.reduce(
          (sum, collection) => sum + (collection.endpoints?.length || 0),
          0
        );

        // Guardar datos para previsualización
        setImportData(result.collections);
        setImportPreview({
          collections: result.collections.length,
          endpoints: totalEndpoints,
        });

        // Mostrar diálogo de confirmación
        setShowImportDialog(true);
      }
    } catch (error: any) {
      console.error("Error al importar colecciones:", error);
      toast({
        title: "Error al importar",
        description:
          "No se pudieron importar las colecciones. " +
          (error.message || "Error desconocido"),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const confirmImport = () => {
    if (!importData) return;

    try {
      // Enriquecer los endpoints con información adicional
      const enrichedCollections = importData.map((collection) => ({
        ...collection,
        endpoints: collection.endpoints.map(enrichEndpoint),
      }));

      if (importMode === "replace") {
        // Reemplazar todas las colecciones
        setCollections(enrichedCollections);
      } else {
        // Fusionar colecciones
        // Crear un mapa de IDs existentes para evitar duplicados
        const existingIds = new Set(collections.map((c) => c.id));

        // Añadir colecciones nuevas (con IDs nuevos si ya existen)
        const newCollections = enrichedCollections.map((collection) => {
          // Si el ID ya existe, generar uno nuevo
          const newId = existingIds.has(collection.id)
            ? Date.now().toString() + Math.random().toString(36).substring(2, 9)
            : collection.id;

          // Añadir el ID al conjunto
          existingIds.add(newId);

          return {
            ...collection,
            id: newId,
          };
        });

        setCollections([...collections, ...newCollections]);
      }

      // Mensaje específico según el formato
      let formatName = "desconocido";
      if (detectedFormat === "postman") formatName = "Postman";
      else if (detectedFormat === "insomnia") formatName = "Insomnia";
      else if (detectedFormat === "native") formatName = "nativo";

      toast({
        title: "Importación exitosa",
        description: `Se han importado ${importPreview?.collections} colecciones con ${importPreview?.endpoints} endpoints desde formato ${formatName}.`,
        duration: 3000,
      });

      // Limpiar estado
      setImportData(null);
      setImportPreview(null);
      setShowImportDialog(false);
      setDetectedFormat("unknown");
    } catch (error: any) {
      console.error("Error al procesar la importación:", error);
      toast({
        title: "Error al procesar",
        description:
          "No se pudieron procesar las colecciones importadas. " +
          (error.message || "Error desconocido"),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Función para cambiar el entorno activo
  const handleSelectEnvironment = (envId: string) => {
    const updatedEnvironments = setActiveEnvironment(environments, envId);
    setEnvironments(updatedEnvironments);
  };

  // Función para manejar los resultados de las pruebas
  const handleTestResults = (results: TestSuiteResult) => {
    // Added
    setTestResults(results);
  };

  // Función para refrescar el panel de referencias
  const handleRefreshResponses = () => {
    // Added
    setResponsesUpdated((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-background p-4">
      <Toaster />

      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <EnvironmentManager
            environments={environments}
            onEnvironmentsChange={setEnvironments}
            onSelectEnvironment={handleSelectEnvironment}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-background">
              <CardHeader>
                <CardTitle>Petición</CardTitle>
                <CardDescription>
                  Configura y envía tu petición API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="URL de la API (ej: {{base_url}}/posts)"
                    className="flex-1"
                  />
                  <Button onClick={handleRequest} disabled={loading}>
                    {loading ? "Enviando..." : <Play className="h-4 w-4" />}
                  </Button>

                  {/* Botón para guardar endpoint con selección de colección */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Save className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Guardar Endpoint</DialogTitle>
                        <DialogDescription>
                          Guarda este endpoint en una colección para usarlo más
                          tarde.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="endpoint-name" className="text-right">
                            Nombre
                          </Label>
                          <Input
                            id="endpoint-name"
                            value={newEndpointName}
                            onChange={(e) => setNewEndpointName(e.target.value)}
                            placeholder="Mi Endpoint"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="collection" className="text-right">
                            Colección
                          </Label>
                          <Select onValueChange={setSelectedCollection}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Seleccionar colección" />
                            </SelectTrigger>
                            <SelectContent>
                              {collections.map((collection) => (
                                <SelectItem
                                  key={collection.id}
                                  value={collection.id}
                                >
                                  {collection.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={saveEndpoint}>Guardar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Tabs defaultValue="body">
                  <TabsList className="mb-4">
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger> {/* Added */}
                    {showCodeGenerator && (
                      <TabsTrigger value="code">Code</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="body">
                    <Textarea
                      placeholder="Cuerpo de la petición (JSON)"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="font-mono h-40"
                    />
                  </TabsContent>

                  <TabsContent value="headers">
                    <HeadersPanel
                      headers={headers}
                      onHeadersChange={setHeaders}
                      authHeaders={authHeaders}
                      variables={getActiveVariables()}
                    />
                  </TabsContent>

                  <TabsContent value="auth">
                    <AuthPanel
                      authConfig={authConfig}
                      onAuthChange={setAuthConfig}
                      variables={getActiveVariables()}
                      onGenerateHeaders={setAuthHeaders}
                    />
                  </TabsContent>

                  <TabsContent value="tests">
                    {" "}
                    {/* Added */}
                    <TestEditor
                      responseData={{
                        response: parsedResponse,
                        responseText: response,
                        status: statusCode,
                        statusText: statusCode ? String(statusCode) : undefined,
                        contentType,
                        responseTime,
                        responseSize,
                        headers: responseHeaders,
                      }}
                      testScript={testScript}
                      onTestScriptChange={setTestScript}
                      onTestResults={handleTestResults}
                    />
                  </TabsContent>

                  {showCodeGenerator && (
                    <TabsContent value="code">
                      <CodeGenerator
                        url={url}
                        method={method}
                        headers={headers}
                        authHeaders={authHeaders}
                        body={body}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>

            <div className="mt-6">
              <ResponseViewer
                response={response}
                responseTime={responseTime}
                responseSize={responseSize}
                statusCode={statusCode}
                contentType={contentType}
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Panel de Referencias de Respuestas */}
            <ResponseReferencesPanel onRefresh={handleRefreshResponses} />{" "}
            {/* Added */}
            {/* Colecciones de Endpoints */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Colecciones
                </CardTitle>
                <div className="flex space-x-2">
                  {/* Botón para exportar colecciones */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportCollections}
                    title="Exportar colecciones"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {/* Botón para importar colecciones */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={startImport}
                    title="Importar colecciones"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>

                  {/* Botón para añadir colección */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nueva Colección</DialogTitle>
                        <DialogDescription>
                          Crea una nueva colección para organizar tus endpoints.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="collection-name"
                            className="text-right"
                          >
                            Nombre
                          </Label>
                          <Input
                            id="collection-name"
                            value={newCollectionName}
                            onChange={(e) =>
                              setNewCollectionName(e.target.value)
                            }
                            placeholder="Mi Colección"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="collection-desc"
                            className="text-right"
                          >
                            Descripción
                          </Label>
                          <Input
                            id="collection-desc"
                            value={newCollectionDescription}
                            onChange={(e) =>
                              setNewCollectionDescription(e.target.value)
                            }
                            placeholder="Descripción opcional"
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={addCollection}>Crear Colección</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {collections.map((collection) => (
                    <AccordionItem key={collection.id} value={collection.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center">
                          <Folder className="mr-2 h-4 w-4" />
                          <span>{collection.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {collection.endpoints.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-6 pr-2">
                          <p className="text-xs text-muted-foreground mb-2">
                            {collection.description}
                          </p>

                          {collection.endpoints.length > 0 ? (
                            <div className="space-y-2">
                              {collection.endpoints.map((endpoint) => (
                                <div
                                  key={endpoint.id}
                                  className="flex justify-between items-center p-2 hover:bg-muted rounded group"
                                >
                                  <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => loadEndpoint(endpoint)}
                                  >
                                    <p className="font-medium text-sm">
                                      {endpoint.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {endpoint.url} {/* Removed extra space */}
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs font-mono bg-primary/10 px-2 py-1 rounded mr-2">
                                      {endpoint.method}
                                    </span>
                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                      {/* Mover endpoint */}
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() =>
                                              setSelectedEndpoint(endpoint)
                                            }
                                          >
                                            <Move className="h-3 w-3" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>
                                              Mover Endpoint
                                            </DialogTitle>
                                            <DialogDescription>
                                              Selecciona la colección a la que
                                              deseas mover este endpoint.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <Select
                                            onValueChange={
                                              setTargetCollectionId
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Seleccionar colección destino" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {collections
                                                .filter(
                                                  (c) => c.id !== collection.id
                                                )
                                                .map((c) => (
                                                  <SelectItem
                                                    key={c.id}
                                                    value={c.id}
                                                  >
                                                    {c.name}
                                                  </SelectItem>
                                                ))}
                                            </SelectContent>
                                          </Select>
                                          <DialogFooter>
                                            <Button onClick={moveEndpoint}>
                                              Mover
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>

                                      {/* Eliminar endpoint */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          deleteEndpoint(
                                            collection.id,
                                            endpoint.id
                                          )
                                        }
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              No hay endpoints en esta colección
                            </p>
                          )}

                          <div className="flex justify-between mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => deleteCollection(collection.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {collections.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No hay colecciones
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Crea una colección para organizar tus endpoints
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Historial */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Historial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.length > 0 ? (
                    history.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => {
                          setUrl(item.url);
                          setMethod(item.method);
                          // Reset other fields when loading from history? Consider adding if needed.
                          // setBody("");
                          // setHeaders([...]);
                          // setAuthConfig({...});
                          // setTestScript("");
                        }}
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {item.timestamp}
                          </p>
                          <p className="text-sm truncate max-w-[200px]">
                            {item.url}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-primary/10 px-2 py-1 rounded">
                            {item.method}
                          </span>
                          <span
                            className={`text-xs font-mono px-2 py-1 rounded ${
                              item.status >= 200 && item.status < 300
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay historial disponible
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para importar */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Colecciones</DialogTitle>
            <DialogDescription>
              Se han encontrado colecciones para importar.
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Resumen de importación</AlertTitle>
              <AlertDescription>
                Se importarán {importPreview.collections} colecciones con un
                total de {importPreview.endpoints} endpoints.
                {detectedFormat !== "unknown" && (
                  <>
                    <br />
                    <span className="font-medium">
                      Formato detectado:{" "}
                      {detectedFormat === "postman"
                        ? "Postman"
                        : detectedFormat === "insomnia"
                          ? "Insomnia"
                          : detectedFormat === "native"
                            ? "Nativo"
                            : "Desconocido"}
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="py-4">
            <h4 className="mb-3 text-sm font-medium">Modo de importación:</h4>
            <RadioGroup
              value={importMode}
              onValueChange={(value) =>
                setImportMode(value as "replace" | "merge")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge">
                  Fusionar con colecciones existentes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace">
                  Reemplazar todas las colecciones existentes
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={confirmImport}>Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
