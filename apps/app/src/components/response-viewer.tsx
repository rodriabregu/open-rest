"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedJsonViewer } from "@/components/enhanced-json-viewer";

interface ResponseViewerProps {
  response: string;
  responseTime?: number;
  responseSize?: number;
  statusCode?: number;
  contentType?: string;
}

export function ResponseViewer({
  response,
  responseTime = 0,
  responseSize = 0,
  statusCode = 200,
  contentType = "application/json",
}: ResponseViewerProps) {
  const [parsedResponse, setParsedResponse] = useState<any>(null);
  const [responseType, setResponseType] = useState<
    "json" | "text" | "html" | "image" | "xml" | "unknown"
  >("unknown");

  useEffect(() => {
    if (!response) {
      setParsedResponse(null);
      setResponseType("unknown");
      return;
    }

    // Try to determine the response type
    if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(response);
        setParsedResponse(parsed);
        setResponseType("json");
        return;
      } catch (e) {
        // Not valid JSON, continue to other checks
      }
    }

    if (contentType.includes("text/html") || response.trim().startsWith("<")) {
      setResponseType("html");
      setParsedResponse(response);
      return;
    }

    if (
      contentType.includes("text/xml") ||
      contentType.includes("application/xml") ||
      response.trim().startsWith("<?xml")
    ) {
      setResponseType("xml");
      setParsedResponse(response);
      return;
    }

    if (contentType.includes("image/")) {
      setResponseType("image");
      setParsedResponse(response);
      return;
    }

    // Default to text
    setResponseType("text");
    setParsedResponse(response);
  }, [response, contentType]);

  const formatXml = (xml: string) => {
    try {
      let formatted = "";
      let indent = "";
      const tab = "  ";
      xml.split(/>\s*</).forEach((node) => {
        if (node.match(/^\/\w/)) {
          indent = indent.substring(tab.length);
        }
        formatted += indent + "<" + node + ">\n";
        if (node.match(/^<?\w[^>]*[^/]$/)) {
          indent += tab;
        }
      });
      return formatted.substring(1, formatted.length - 2);
    } catch (e) {
      return xml;
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800";
    if (status >= 300 && status < 400) return "bg-blue-100 text-blue-800";
    if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-800";
    if (status >= 500) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Card className="bg-background">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Respuesta</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(statusCode)}>{statusCode}</Badge>
            {responseTime > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {responseTime} ms
              </Badge>
            )}
            {responseSize > 0 && (
              <Badge variant="outline">{formatSize(responseSize)}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue={
            responseType === "json"
              ? "json"
              : responseType === "unknown"
                ? "raw"
                : responseType
          }
        >
          <TabsList className="mb-4">
            {responseType === "json" && (
              <TabsTrigger value="json">JSON</TabsTrigger>
            )}
            {(responseType === "html" || responseType === "xml") && (
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
            )}
            {responseType === "image" && (
              <TabsTrigger value="image">Image</TabsTrigger>
            )}
            <TabsTrigger value="raw">Raw</TabsTrigger>
            {responseType === "html" && (
              <TabsTrigger value="preview">Preview</TabsTrigger>
            )}
          </TabsList>

          {responseType === "json" && (
            <TabsContent value="json">
              <EnhancedJsonViewer data={parsedResponse} maxHeight="400px" />
            </TabsContent>
          )}

          {(responseType === "html" || responseType === "xml") && (
            <TabsContent value="formatted">
              <pre className="bg-muted p-4 rounded-md overflow-auto h-80 font-mono text-sm">
                {responseType === "xml" ? formatXml(response) : response}
              </pre>
            </TabsContent>
          )}

          {responseType === "image" && (
            <TabsContent value="image">
              <div className="flex justify-center p-4 bg-muted rounded-md">
                <img
                  src={response || "/placeholder.svg"}
                  alt="Response"
                  className="max-h-80"
                />
              </div>
            </TabsContent>
          )}

          <TabsContent value="raw">
            <pre className="bg-muted p-4 rounded-md overflow-auto h-80 font-mono text-sm">
              {response || "La respuesta aparecerá aquí"}
            </pre>
          </TabsContent>

          {responseType === "html" && (
            <TabsContent value="preview">
              <div className="border rounded-md h-80 overflow-auto">
                <iframe
                  srcDoc={response}
                  title="HTML Preview"
                  className="w-full h-full"
                  sandbox="allow-same-origin"
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
