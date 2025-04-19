"use client";

import { useState, useEffect } from "react";
import { Clock, Copy, Check, Trash2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import {
  getAllResponses,
  clearResponseStore,
  removeResponse,
  extractValueFromResponse,
  type StoredResponse,
} from "@/lib/response-store";

interface ResponseReferencesPanelProps {
  onRefresh: () => void;
}

export function ResponseReferencesPanel({
  onRefresh,
}: ResponseReferencesPanelProps) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<StoredResponse[]>([]);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null
  );
  const [pathInput, setPathInput] = useState("");
  const [pathResult, setPathResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Load responses on mount and when refreshed
  useEffect(() => {
    refreshResponses();
  }, []);

  const refreshResponses = () => {
    const allResponses = getAllResponses();
    setResponses(allResponses);

    // Select the latest response by default if available
    if (allResponses.length > 0 && !selectedResponseId) {
      setSelectedResponseId(allResponses[0].id);
    }

    onRefresh();
  };

  const handleClearAll = () => {
    clearResponseStore();
    setResponses([]);
    setSelectedResponseId(null);
    setPathResult(null);
    toast({
      title: "Historial de respuestas borrado",
      description: "Se han eliminado todas las respuestas guardadas",
    });
    onRefresh();
  };

  const handleRemoveResponse = (id: string) => {
    removeResponse(id);

    // Update the local state
    const updatedResponses = responses.filter((r) => r.id !== id);
    setResponses(updatedResponses);

    // If the selected response was removed, select the first one or null
    if (selectedResponseId === id) {
      setSelectedResponseId(
        updatedResponses.length > 0 ? updatedResponses[0].id : null
      );
      setPathResult(null);
    }

    toast({
      title: "Respuesta eliminada",
      description: "La respuesta ha sido eliminada del historial",
    });
    onRefresh();
  };

  const handleTestPath = () => {
    if (!selectedResponseId || !pathInput.trim()) {
      setPathResult(null);
      return;
    }

    const response = responses.find((r) => r.id === selectedResponseId);
    if (!response) {
      setPathResult(null);
      return;
    }

    try {
      const result = extractValueFromResponse(response, pathInput);
      setPathResult(result);
    } catch (error) {
      console.error("Error extracting value:", error);
      setPathResult(null);
      toast({
        title: "Error al extraer valor",
        description:
          error.message ||
          "No se pudo extraer el valor con la ruta especificada",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);

    toast({
      title: "Copiado al portapapeles",
      description: "La referencia ha sido copiada",
    });
  };

  const formatResponseReference = (
    responseId: string,
    path: string
  ): string => {
    return `{{response:${responseId}.${path}}}`;
  };

  const formatLatestResponseReference = (path: string): string => {
    return `{{response.${path}}}`;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800";
    if (status >= 300 && status < 400) return "bg-blue-100 text-blue-800";
    if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-800";
    if (status >= 500) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const selectedResponse = selectedResponseId
    ? responses.find((r) => r.id === selectedResponseId)
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Referencias de Respuestas
        </CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={refreshResponses}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="history">
          <TabsList className="mb-4">
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="explorer" disabled={!selectedResponseId}>
              Explorador
            </TabsTrigger>
            <TabsTrigger value="help">Ayuda</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {responses.length > 0 ? (
                  responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedResponseId === response.id
                          ? "bg-primary/5 border-primary/20"
                          : "hover:bg-muted border-border"
                      }`}
                      onClick={() => setSelectedResponseId(response.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {response.method}
                            </Badge>
                            <Badge className={getStatusColor(response.status)}>
                              {response.status}
                            </Badge>
                            {response.id === responses[0].id && (
                              <Badge variant="secondary" className="text-xs">
                                Último
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {response.url}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {response.timestamp}
                          </p>
                        </div>
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                formatResponseReference(response.id, "status"),
                                `ref-${response.id}`
                              );
                            }}
                          >
                            {copied === `ref-${response.id}` ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveResponse(response.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No hay respuestas guardadas
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Las respuestas se guardan automáticamente al realizar
                      peticiones
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="explorer">
            {selectedResponse && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      {selectedResponse.method} {selectedResponse.url}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedResponse.timestamp}
                    </p>
                  </div>
                  <Badge className={getStatusColor(selectedResponse.status)}>
                    {selectedResponse.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="path-input">Ruta de acceso</Label>
                  <div className="flex gap-2">
                    <Input
                      id="path-input"
                      value={pathInput}
                      onChange={(e) => setPathInput(e.target.value)}
                      placeholder="Ej: data.0.id, status, contentType"
                      className="flex-1"
                    />
                    <Button onClick={handleTestPath}>Probar</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ingresa una ruta para acceder a datos específicos de la
                    respuesta
                  </p>
                </div>

                {pathResult !== null && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                      <Label>Resultado</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              formatResponseReference(
                                selectedResponse.id,
                                pathInput
                              ),
                              "path-specific"
                            )
                          }
                        >
                          {copied === "path-specific" ? (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 mr-1" />
                          )}
                          Copiar referencia
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              formatLatestResponseReference(pathInput),
                              "path-latest"
                            )
                          }
                        >
                          {copied === "path-latest" ? (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 mr-1" />
                          )}
                          Como última respuesta
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-md overflow-x-auto">
                      <pre className="text-sm font-mono">
                        {typeof pathResult === "object"
                          ? JSON.stringify(pathResult, null, 2)
                          : String(pathResult)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <Label>Referencias comunes</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() =>
                        copyToClipboard(
                          formatResponseReference(
                            selectedResponse.id,
                            "status"
                          ),
                          "common-status"
                        )
                      }
                    >
                      <span className="truncate">Código de estado</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() =>
                        copyToClipboard(
                          formatResponseReference(
                            selectedResponse.id,
                            "contentType"
                          ),
                          "common-content"
                        )
                      }
                    >
                      <span className="truncate">Tipo de contenido</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() =>
                        copyToClipboard(
                          formatResponseReference(
                            selectedResponse.id,
                            "responseText"
                          ),
                          "common-text"
                        )
                      }
                    >
                      <span className="truncate">Texto completo</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="help">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">
                  ¿Cómo usar referencias de respuestas?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Las referencias de respuestas te permiten usar datos de
                  respuestas anteriores en nuevas peticiones.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Sintaxis</h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-mono">
                    {"{{response.ruta.al.valor}}"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Referencia a un valor en la respuesta más reciente
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-mono">
                    {"{{response:ID_RESPUESTA.ruta.al.valor}}"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Referencia a un valor en una respuesta específica por ID
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Ejemplos</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <code className="bg-muted px-1 py-0.5 rounded">
                      {"{{response.data.id}}"}
                    </code>{" "}
                    - Accede al ID en el objeto data de la última respuesta
                  </li>
                  <li>
                    <code className="bg-muted px-1 py-0.5 rounded">
                      {"{{response.data[0].name}}"}
                    </code>{" "}
                    - Accede al nombre del primer elemento en un array
                  </li>
                  <li>
                    <code className="bg-muted px-1 py-0.5 rounded">
                      {"{{response.status}}"}
                    </code>{" "}
                    - Obtiene el código de estado de la última respuesta
                  </li>
                  <li>
                    <code className="bg-muted px-1 py-0.5 rounded">
                      {"{{response:1234567890.token}}"}
                    </code>{" "}
                    - Accede al token de una respuesta específica
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Casos de uso comunes</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    • Usar un token de autenticación de una respuesta de login
                  </li>
                  <li>
                    • Encadenar peticiones usando IDs o referencias de una
                    respuesta anterior
                  </li>
                  <li>
                    • Crear flujos de trabajo complejos que dependen de datos
                    previos
                  </li>
                  <li>
                    • Validar respuestas comparando con datos de peticiones
                    anteriores
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
