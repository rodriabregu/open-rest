"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

import type { HeaderItem } from "@/components/headers-panel";

interface CodeGeneratorProps {
  url: string;
  method: string;
  headers: HeaderItem[];
  authHeaders: Record<string, string>;
  body: string;
}

export function CodeGenerator({
  url,
  method,
  headers,
  authHeaders,
  body,
}: CodeGeneratorProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // Combine regular headers with auth headers
  const allHeaders = {
    ...headers
      .filter((h) => h.enabled)
      .reduce((acc, h) => ({ ...acc, [h.name]: h.value }), {}),
    ...authHeaders,
  };

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Generate fetch code
  const generateFetch = () => {
    let code = `// JavaScript - Fetch API\n`;
    code += `const options = {\n`;
    code += `  method: "${method}",\n`;

    if (Object.keys(allHeaders).length > 0) {
      code += `  headers: {\n`;
      Object.entries(allHeaders).forEach(([key, value]) => {
        code += `    "${key}": "${value}",\n`;
      });
      code += `  },\n`;
    }

    if (method !== "GET" && method !== "HEAD" && body) {
      code += `  body: ${JSON.stringify(body, null, 2)},\n`;
    }

    code += `};\n\n`;
    code += `fetch("${url}", options)\n`;
    code += `  .then(response => response.json())\n`;
    code += `  .then(data => console.log(data))\n`;
    code += `  .catch(error => console.error("Error:", error));\n`;

    return code;
  };

  // Generate Axios code
  const generateAxios = () => {
    let code = `// JavaScript - Axios\n`;
    code += `import axios from "axios";\n\n`;
    code += `const options = {\n`;
    code += `  method: "${method}",\n`;
    code += `  url: "${url}",\n`;

    if (Object.keys(allHeaders).length > 0) {
      code += `  headers: {\n`;
      Object.entries(allHeaders).forEach(([key, value]) => {
        code += `    "${key}": "${value}",\n`;
      });
      code += `  },\n`;
    }

    if (method !== "GET" && method !== "HEAD" && body) {
      code += `  data: ${body},\n`;
    }

    code += `};\n\n`;
    code += `axios(options)\n`;
    code += `  .then(response => console.log(response.data))\n`;
    code += `  .catch(error => console.error("Error:", error));\n`;

    return code;
  };

  // Generate cURL command
  const generateCurl = () => {
    let code = `# cURL\n`;
    code += `curl -X ${method} "${url}"`;

    Object.entries(allHeaders).forEach(([key, value]) => {
      code += ` \\\n  -H "${key}: ${value}"`;
    });

    if (method !== "GET" && method !== "HEAD" && body) {
      code += ` \\\n  -d '${body}'`;
    }

    return code;
  };

  // Generate Python requests code
  const generatePython = () => {
    let code = `# Python - Requests\n`;
    code += `import requests\n\n`;
    code += `url = "${url}"\n`;

    if (Object.keys(allHeaders).length > 0) {
      code += `headers = {\n`;
      Object.entries(allHeaders).forEach(([key, value]) => {
        code += `    "${key}": "${value}",\n`;
      });
      code += `}\n\n`;
    } else {
      code += `headers = {}\n\n`;
    }

    if (method !== "GET" && method !== "HEAD" && body) {
      code += `payload = ${body}\n\n`;
      code += `response = requests.${method.toLowerCase()}(url, headers=headers, json=payload)\n`;
    } else {
      code += `response = requests.${method.toLowerCase()}(url, headers=headers)\n`;
    }

    code += `print(response.json())\n`;

    return code;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs defaultValue="fetch">
          <TabsList className="mb-4">
            <TabsTrigger value="fetch">Fetch</TabsTrigger>
            <TabsTrigger value="axios">Axios</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>

          <TabsContent value="fetch" className="relative">
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-80 text-sm font-mono">
              {generateFetch()}
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(generateFetch(), "fetch")}
            >
              {copied === "fetch" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TabsContent>

          <TabsContent value="axios" className="relative">
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-80 text-sm font-mono">
              {generateAxios()}
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(generateAxios(), "axios")}
            >
              {copied === "axios" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TabsContent>

          <TabsContent value="curl" className="relative">
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-80 text-sm font-mono">
              {generateCurl()}
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(generateCurl(), "curl")}
            >
              {copied === "curl" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TabsContent>

          <TabsContent value="python" className="relative">
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-80 text-sm font-mono">
              {generatePython()}
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(generatePython(), "python")}
            >
              {copied === "python" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
