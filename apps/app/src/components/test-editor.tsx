"use client";

import { useState, useEffect } from "react";
import { Play, Check, X, Copy, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import {
  runTests,
  type TestSuiteResult,
  testTemplates,
} from "@/lib/test-runner";

interface TestEditorProps {
  responseData: {
    response: any;
    responseText: string;
    status: number;
    statusText?: string;
    contentType?: string;
    responseTime: number;
    responseSize: number;
    headers: Record<string, string>;
  };
  testScript?: string;
  onTestScriptChange?: (script: string) => void;
  onTestResults?: (results: TestSuiteResult) => void;
}

export function TestEditor({
  responseData,
  testScript = "",
  onTestScriptChange,
  onTestResults,
}: TestEditorProps) {
  const { toast } = useToast();
  const [script, setScript] = useState(testScript);
  const [results, setResults] = useState<TestSuiteResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Update script when prop changes
  useEffect(() => {
    setScript(testScript);
  }, [testScript]);

  const handleScriptChange = (value: string) => {
    setScript(value);
    if (onTestScriptChange) {
      onTestScriptChange(value);
    }
  };

  const runTestScript = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "El script de prueba está vacío",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    try {
      const testResults = await runTests(script, responseData);
      setResults(testResults);
      if (onTestResults) {
        onTestResults(testResults);
      }

      // Show toast with results
      toast({
        title:
          testResults.failed > 0
            ? "Pruebas completadas con errores"
            : "Pruebas completadas con éxito",
        description: `${testResults.passed} pruebas pasadas, ${testResults.failed} fallidas`,
        variant: testResults.failed > 0 ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "Error al ejecutar pruebas",
        description: error.message || "Ocurrió un error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const addTemplate = (template: string) => {
    // Add template to the end of the current script with a newline separator
    const newScript = script ? `${script}\n\n${template}` : template;
    handleScriptChange(newScript);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    toast({
      title: "Copiado",
      description: "Script copiado al portapapeles",
    });
  };

  const clearScript = () => {
    handleScriptChange("");
    setResults(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={runTestScript} disabled={isRunning} size="sm">
            {isRunning ? "Ejecutando..." : <Play className="h-4 w-4 mr-1" />}
            {isRunning ? "" : "Ejecutar pruebas"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Plantilla
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => addTemplate(testTemplates.statusCode)}
              >
                Verificar código de estado
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => addTemplate(testTemplates.responseTime)}
              >
                Verificar tiempo de respuesta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => addTemplate(testTemplates.jsonStructure)}
              >
                Verificar estructura JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => addTemplate(testTemplates.contentType)}
              >
                Verificar tipo de contenido
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => addTemplate(testTemplates.dataValidation)}
              >
                Validar datos específicos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => addTemplate(testTemplates.headers)}
              >
                Verificar headers
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => addTemplate(testTemplates.complete)}
              >
                Plantilla completa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-1" />
            Copiar
          </Button>
          <Button variant="ghost" size="sm" onClick={clearScript}>
            <Trash2 className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            Resultados{" "}
            {results &&
              `(${results.passed}/${results.passed + results.failed})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <Card>
            <CardContent className="p-0">
              <Textarea
                value={script}
                onChange={(e) => handleScriptChange(e.target.value)}
                className="font-mono text-sm min-h-[300px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="// Escribe tus pruebas aquí
// Ejemplo:
// test('El código de estado debe ser 200', function() {
//   assert.equals(status, 200);
// });"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {results && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Resultados de las pruebas</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={results.failed > 0 ? "destructive" : "default"}
                    >
                      {results.passed}/{results.passed + results.failed} pruebas
                      pasadas
                    </Badge>
                    <Badge variant="outline">
                      {results.duration.toFixed(2)}ms
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {results.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md ${
                          result.passed
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="mr-2 mt-0.5">
                            {result.passed ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-medium ${result.passed ? "text-green-800" : "text-red-800"}`}
                            >
                              {result.name}
                            </p>
                            {!result.passed && result.error && (
                              <p className="text-sm text-red-600 mt-1">
                                {result.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground">
        <p className="mb-1">Variables disponibles:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <code>response</code>: Objeto JSON de la respuesta (si aplica)
          </li>
          <li>
            <code>responseText</code>: Texto completo de la respuesta
          </li>
          <li>
            <code>status</code>: Código de estado HTTP
          </li>
          <li>
            <code>contentType</code>: Tipo de contenido de la respuesta
          </li>
          <li>
            <code>responseTime</code>: Tiempo de respuesta en ms
          </li>
          <li>
            <code>responseSize</code>: Tamaño de la respuesta en bytes
          </li>
          <li>
            <code>headers</code>: Headers de la respuesta
          </li>
          <li>
            <code>jsonPath(path)</code>: Función para acceder a propiedades JSON
            (ej: <code>jsonPath("data.0.id")</code>)
          </li>
          <li>
            <code>headerValue(name)</code>: Función para obtener el valor de un
            header
          </li>
        </ul>
      </div>
    </div>
  );
}
