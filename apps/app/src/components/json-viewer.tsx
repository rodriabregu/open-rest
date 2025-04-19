"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Search, Copy, Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface JsonViewerProps {
  data: any;
  maxHeight?: string;
}

export function JsonViewer({ data, maxHeight = "500px" }: JsonViewerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["root"])
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [matchPaths, setMatchPaths] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchPaths(new Set());
      return;
    }

    const matches = new Set<string>();

    const searchInObject = (obj: any, path: string) => {
      if (typeof obj !== "object" || obj === null) {
        return;
      }

      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;

        // Check if key matches
        if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches.add(currentPath);

          // Expand all parent paths
          const parentPath = currentPath.split(".");
          while (parentPath.length > 0) {
            parentPath.pop();
            if (parentPath.length > 0) {
              expandedPaths.add(parentPath.join("."));
            }
          }
          expandedPaths.add("root");
        }

        // Check if value matches (for primitives)
        if (
          (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean") &&
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matches.add(currentPath);

          // Expand all parent paths
          const parentPath = currentPath.split(".");
          while (parentPath.length > 0) {
            parentPath.pop();
            if (parentPath.length > 0) {
              expandedPaths.add(parentPath.join("."));
            }
          }
          expandedPaths.add("root");
        }

        // Recurse for objects and arrays
        if (typeof value === "object" && value !== null) {
          searchInObject(value, currentPath);
        }
      });
    };

    searchInObject(data, "");
    setMatchPaths(matches);
    setExpandedPaths(new Set(expandedPaths)); // Trigger re-render
  }, [searchTerm, data]);

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (value: any, path: string, key: string) => {
    const isMatch = matchPaths.has(path);

    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }

    if (typeof value === "boolean") {
      return <span className="text-yellow-600">{String(value)}</span>;
    }

    if (typeof value === "number") {
      return <span className="text-blue-600">{value}</span>;
    }

    if (typeof value === "string") {
      return (
        <span className={`text-green-600 ${isMatch ? "bg-yellow-100" : ""}`}>
          "{value}"
        </span>
      );
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedPaths.has(path);

      return (
        <div>
          <div
            className="flex items-center cursor-pointer"
            onClick={() => toggleExpand(path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            <span className="text-purple-600">Array</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {value.length} {value.length === 1 ? "item" : "items"}
            </Badge>
          </div>

          {isExpanded && (
            <div className="ml-4 border-l pl-2 border-gray-300">
              {value.map((item, index) => (
                <div key={index} className="my-1">
                  <span className="text-gray-500 mr-1">{index}:</span>
                  {renderValue(item, `${path}[${index}]`, String(index))}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === "object") {
      const isExpanded = expandedPaths.has(path);
      const entries = Object.entries(value);

      return (
        <div>
          <div
            className="flex items-center cursor-pointer"
            onClick={() => toggleExpand(path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            <span className="text-purple-600">Object</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {entries.length}{" "}
              {entries.length === 1 ? "property" : "properties"}
            </Badge>
          </div>

          {isExpanded && (
            <div className="ml-4 border-l pl-2 border-gray-300">
              {entries.map(([k, v]) => {
                const childPath = path ? `${path}.${k}` : k;
                const isKeyMatch = matchPaths.has(childPath);

                return (
                  <div key={k} className="my-1">
                    <span
                      className={`text-red-600 ${isKeyMatch ? "bg-yellow-100" : ""}`}
                    >
                      "{k}":
                    </span>{" "}
                    {renderValue(v, childPath, k)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="border rounded-md">
      <div className="flex items-center p-2 border-b">
        <Search className="h-4 w-4 mr-2 text-gray-500" />
        <Input
          placeholder="Buscar en JSON..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          className="ml-2"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className={`p-4 font-mono text-sm`} style={{ maxHeight }}>
        <div className="min-w-max">{renderValue(data, "root", "root")}</div>
      </ScrollArea>
    </div>
  );
}
