"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  Copy,
  Check,
  X,
  ExternalLink,
  Clipboard,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface JsonViewerProps {
  data: any;
  maxHeight?: string;
}

type CopyType = "path" | "value" | "full" | null;

export function EnhancedJsonViewer({
  data,
  maxHeight = "500px",
}: JsonViewerProps) {
  const { toast } = useToast();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set([""])
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [matchPaths, setMatchPaths] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<CopyType>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Expand all paths up to a certain depth
  const expandToDepth = useCallback(
    (depth: number) => {
      const newExpanded = new Set<string>([""]);

      const processObject = (obj: any, path: string, currentDepth: number) => {
        if (currentDepth >= depth) return;
        if (Array.isArray(obj)) {
          obj.forEach((item, idx) => {
            const arrayPath = path ? `${path}[${idx}]` : `[${idx}]`;
            newExpanded.add(arrayPath);
            if (typeof item === "object" && item !== null) {
              processObject(item, arrayPath, currentDepth + 1);
            }
          });
        } else if (typeof obj === "object" && obj !== null) {
          Object.keys(obj).forEach((key) => {
            const newPath = path ? `${path}.${key}` : key;
            newExpanded.add(newPath);
            if (typeof obj[key] === "object" && obj[key] !== null) {
              processObject(obj[key], newPath, currentDepth + 1);
            }
          });
        }
      };

      processObject(data, "", 0);
      setExpandedPaths(newExpanded);
    },
    [data]
  );

  // Expand all paths
  const expandAll = useCallback(() => {
    const newExpanded = new Set<string>([""]);

    const processObject = (obj: any, path: string) => {
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => {
          const arrayPath = path ? `${path}[${idx}]` : `[${idx}]`;
          newExpanded.add(arrayPath);
          if (typeof item === "object" && item !== null) {
            processObject(item, arrayPath);
          }
        });
      } else if (typeof obj === "object" && obj !== null) {
        Object.keys(obj).forEach((key) => {
          const newPath = path ? `${path}.${key}` : key;
          newExpanded.add(newPath);
          if (typeof obj[key] === "object" && obj[key] !== null) {
            processObject(obj[key], newPath);
          }
        });
      }
    };

    processObject(data, "");
    setExpandedPaths(newExpanded);
  }, [data]);

  // Collapse all paths
  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set([""]));
  }, []);

  // Initialize with some expanded paths
  useEffect(() => {
    expandToDepth(2); // Expand to depth 2 by default
  }, [data, expandToDepth]);

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchPaths(new Set());
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    const matches = new Set<string>();
    const results: string[] = [];

    const searchInObject = (obj: any, path: string) => {
      if (typeof obj !== "object" || obj === null) {
        return;
      }

      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;

        // Check if key matches
        if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches.add(currentPath);
          results.push(currentPath);
        }

        // Check if value matches (for primitives)
        if (
          (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean") &&
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matches.add(currentPath);
          results.push(currentPath);
        }

        // Recurse for objects and arrays
        if (typeof value === "object" && value !== null) {
          searchInObject(value, currentPath);
        }
      });
    };

    searchInObject(data, "");
    setMatchPaths(matches);
    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);

    // Expand paths to show search results
    const newExpanded = new Set(expandedPaths);
    results.forEach((resultPath) => {
      // Expand all parent paths
      const pathParts = resultPath.split(".");
      let currentPath = "";

      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath = currentPath
          ? `${currentPath}.${pathParts[i]}`
          : pathParts[i];
        newExpanded.add(currentPath);
      }

      newExpanded.add("root");
    });

    setExpandedPaths(newExpanded);
  }, [searchTerm, data, expandedPaths]);

  // Scroll to current search result
  useEffect(() => {
    if (currentResultIndex >= 0 && searchResults.length > 0) {
      const resultPath = searchResults[currentResultIndex];
      const element = document.getElementById(
        `json-path-${resultPath.replace(/\./g, "-")}`
      );

      if (element && scrollAreaRef.current) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentResultIndex, searchResults]);

  const toggleExpand = (path: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const copyToClipboard = (text: string, type: CopyType) => {
    navigator.clipboard.writeText(text);
    setCopied(type);

    toast({
      title: "Copiado al portapapeles",
      description: `${type === "path" ? "Ruta" : type === "value" ? "Valor" : "JSON completo"} copiado`,
      duration: 2000,
    });

    setTimeout(() => setCopied(null), 2000);
  };

  const getValueAtPath = (path: string): any => {
    if (path === "root") return data;

    const parts = path.split(".");
    let current = data;

    for (const part of parts) {
      if (part.includes("[") && part.includes("]")) {
        const [arrayName, indexStr] = part.split("[");
        const index = Number.parseInt(indexStr.replace("]", ""));

        current = current[arrayName][index];
      } else {
        current = current[part];
      }

      if (current === undefined) return undefined;
    }

    return current;
  };

  const formatPath = (path: string): string => {
    if (path === "root") return "";
    return path;
  };

  const navigateSearchResults = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return;

    if (direction === "next") {
      setCurrentResultIndex((currentResultIndex + 1) % searchResults.length);
    } else {
      setCurrentResultIndex(
        (currentResultIndex - 1 + searchResults.length) % searchResults.length
      );
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setMatchPaths(new Set());
    setSearchResults([]);
    setCurrentResultIndex(-1);
  };

  const renderValue = (value: any, path: string, key: string) => {
    const isMatch = matchPaths.has(path);
    const isCurrentSearchResult = searchResults[currentResultIndex] === path;
    const isHovered = hoveredPath === path;
    const isSelected = selectedPath === path;

    const pathId = `json-path-${path.replace(/\./g, "-")}`;

    if (value === null) {
      return (
        <div
          id={pathId}
          className={`relative group ${isMatch ? "bg-yellow-100" : ""} ${isCurrentSearchResult ? "ring-2 ring-blue-500" : ""} ${isSelected ? "bg-blue-100" : ""}`}
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
          onClick={() => setSelectedPath(isSelected ? null : path)}
        >
          <span className="text-gray-500">null</span>
          {(isHovered || isSelected) && renderValueActions(path, value)}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <div
          id={pathId}
          className={`relative group ${isMatch ? "bg-yellow-100" : ""} ${isCurrentSearchResult ? "ring-2 ring-blue-500" : ""} ${isSelected ? "bg-blue-100" : ""}`}
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
          onClick={() => setSelectedPath(isSelected ? null : path)}
        >
          <span className="text-yellow-600">{String(value)}</span>
          {(isHovered || isSelected) && renderValueActions(path, value)}
        </div>
      );
    }

    if (typeof value === "number") {
      return (
        <div
          id={pathId}
          className={`relative group ${isMatch ? "bg-yellow-100" : ""} ${isCurrentSearchResult ? "ring-2 ring-blue-500" : ""} ${isSelected ? "bg-blue-100" : ""}`}
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
          onClick={() => setSelectedPath(isSelected ? null : path)}
        >
          <span className="text-blue-600">{value}</span>
          {(isHovered || isSelected) && renderValueActions(path, value)}
        </div>
      );
    }

    if (typeof value === "string") {
      return (
        <div
          id={pathId}
          className={`relative group ${isMatch ? "bg-yellow-100" : ""} ${isCurrentSearchResult ? "ring-2 ring-blue-500" : ""} ${isSelected ? "bg-blue-100" : ""}`}
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
          onClick={() => setSelectedPath(isSelected ? null : path)}
        >
          <span className="text-green-600">"{value}"</span>
          {(isHovered || isSelected) && renderValueActions(path, value)}
        </div>
      );
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedPaths.has(path);

      return (
        <div
          id={pathId}
          className={`${isMatch ? "bg-yellow-100" : ""} ${isCurrentSearchResult ? "ring-2 ring-blue-500" : ""} ${isSelected ? "bg-blue-100" : ""}`}
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <div
            className="flex items-center cursor-pointer relative group"
            onClick={(e) => toggleExpand(path, e)}
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
            {(isHovered || isSelected) && renderValueActions(path, value)}
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
        <div
          id={pathId}
          className={`${isMatch ? "bg-yellow-100" : ""} ${isCurrentSearchResult ? "ring-2 ring-blue-500" : ""} ${isSelected ? "bg-blue-100" : ""}`}
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <div
            className="flex items-center cursor-pointer relative group"
            onClick={(e) => toggleExpand(path, e)}
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
            {(isHovered || isSelected) && renderValueActions(path, value)}
          </div>

          {isExpanded && (
            <div className="ml-4 border-l pl-2 border-gray-300">
              {entries.map(([k, v]) => {
                const childPath = path ? `${path}.${k}` : k;
                const isKeyMatch = matchPaths.has(childPath);
                const isKeyCurrentSearchResult =
                  searchResults[currentResultIndex] === childPath;

                return (
                  <div key={k} className="my-1">
                    <span
                      id={`json-path-${childPath.replace(/\./g, "-")}-key`}
                      className={`text-red-600 ${isKeyMatch ? "bg-yellow-100" : ""} ${isKeyCurrentSearchResult ? "ring-2 ring-blue-500" : ""}`}
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

  const renderValueActions = (path: string, value: any) => {
    return (
      <div className="absolute right-0 top-0 flex items-center space-x-1 bg-white/80 rounded px-1 shadow-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(formatPath(path), "path");
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copiar ruta</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(
                    typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value),
                    "value"
                  );
                }}
              >
                <Clipboard className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copiar valor</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="border rounded-md">
      <div className="flex items-center p-2 border-b">
        <div className="flex items-center flex-1">
          <Search className="h-4 w-4 mr-2 text-gray-500" />
          <Input
            placeholder="Buscar en JSON..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 flex-1"
          />
          {searchTerm && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="px-1"
                onClick={() => navigateSearchResults("prev")}
              >
                &#8593;
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-1"
                onClick={() => navigateSearchResults("next")}
              >
                &#8595;
              </Button>
              <span className="text-xs text-gray-500 mx-1">
                {searchResults.length > 0
                  ? `${currentResultIndex + 1}/${searchResults.length}`
                  : "0/0"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="px-1"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center ml-2 space-x-1">
          <Button variant="ghost" size="sm" onClick={() => expandAll()}>
            Expandir
          </Button>
          <Button variant="ghost" size="sm" onClick={() => collapseAll()}>
            Colapsar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() =>
              copyToClipboard(JSON.stringify(data, null, 2), "full")
            }
          >
            {copied === "full" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <ScrollArea
        className="p-4 font-mono text-sm"
        style={{ maxHeight, overflow: "auto" }}
        ref={scrollAreaRef}
      >
        <div className="w-full overflow-x-auto">
          {renderValue(data, "", "")}
        </div>
      </ScrollArea>
      <div className="flex gap-2 mt-2">
        <Button size="sm" variant="ghost" onClick={() => expandToDepth(1)}>
          Expandir nivel 1
        </Button>
        <Button size="sm" variant="ghost" onClick={() => expandToDepth(2)}>
          Expandir nivel 2
        </Button>
        <Button size="sm" variant="ghost" onClick={() => expandToDepth(3)}>
          Expandir nivel 3
        </Button>
      </div>

      {selectedPath && selectedPath !== "root" && (
        <div className="p-2 border-t text-xs flex items-center justify-between">
          <div>
            <span className="font-semibold">Ruta:</span>{" "}
            {formatPath(selectedPath)}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => copyToClipboard(formatPath(selectedPath), "path")}
            >
              Copiar ruta
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                const value = getValueAtPath(selectedPath);
                copyToClipboard(
                  typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value),
                  "value"
                );
              }}
            >
              Copiar valor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
