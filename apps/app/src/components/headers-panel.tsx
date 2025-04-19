"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { EnvVariable } from "@/lib/storage";

export interface HeaderItem {
  id: string;
  name: string;
  value: string;
  enabled: boolean;
}

interface HeadersPanelProps {
  headers: HeaderItem[];
  onHeadersChange: (headers: HeaderItem[]) => void;
  authHeaders: Record<string, string>;
  variables: EnvVariable[];
}

export function HeadersPanel({
  headers,
  onHeadersChange,
  authHeaders,
  variables,
}: HeadersPanelProps) {
  const [newHeaderName, setNewHeaderName] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");

  const handleAddHeader = () => {
    if (!newHeaderName.trim()) return;

    const newHeader: HeaderItem = {
      id: Date.now().toString(),
      name: newHeaderName,
      value: newHeaderValue,
      enabled: true,
    };

    onHeadersChange([...headers, newHeader]);
    setNewHeaderName("");
    setNewHeaderValue("");
  };

  const handleDeleteHeader = (id: string) => {
    onHeadersChange(headers.filter((header) => header.id !== id));
  };

  const handleToggleHeader = (id: string, enabled: boolean) => {
    onHeadersChange(
      headers.map((header) =>
        header.id === id ? { ...header, enabled } : header
      )
    );
  };

  const handleUpdateHeader = (
    id: string,
    field: "name" | "value",
    value: string
  ) => {
    onHeadersChange(
      headers.map((header) =>
        header.id === id ? { ...header, [field]: value } : header
      )
    );
  };

  // Verificar si hay headers de autenticación
  const hasAuthHeaders = Object.keys(authHeaders).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nombre del header"
          value={newHeaderName}
          onChange={(e) => setNewHeaderName(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Valor"
          value={newHeaderValue}
          onChange={(e) => setNewHeaderValue(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" onClick={handleAddHeader}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {hasAuthHeaders && (
        <div className="rounded-md border p-3 bg-muted/30">
          <Label className="text-sm font-medium mb-2 block">
            Headers de autenticación
          </Label>
          <div className="space-y-2">
            {Object.entries(authHeaders).map(([name, value]) => (
              <div
                key={name}
                className="flex items-center justify-between p-2 bg-background rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {name}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {value}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Auto
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="h-[250px] rounded-md border">
        <div className="p-4 space-y-2">
          {headers.length > 0 ? (
            headers.map((header) => (
              <div
                key={header.id}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded-md group"
              >
                <Switch
                  checked={header.enabled}
                  onCheckedChange={(checked) =>
                    handleToggleHeader(header.id, checked)
                  }
                  className="data-[state=unchecked]:opacity-50"
                />
                <Input
                  value={header.name}
                  onChange={(e) =>
                    handleUpdateHeader(header.id, "name", e.target.value)
                  }
                  className={`flex-1 ${!header.enabled ? "opacity-50" : ""}`}
                  disabled={!header.enabled}
                />
                <Input
                  value={header.value}
                  onChange={(e) =>
                    handleUpdateHeader(header.id, "value", e.target.value)
                  }
                  className={`flex-1 ${!header.enabled ? "opacity-50" : ""}`}
                  disabled={!header.enabled}
                  placeholder="{{variable}}"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteHeader(header.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No hay headers personalizados</p>
              <p className="text-xs">
                Añade headers para personalizar tu petición
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="text-xs text-muted-foreground">
        <p>
          Puedes usar variables de entorno con la sintaxis{" "}
          <code>{"{{nombre_variable}}"}</code>
        </p>
        <p>
          Ejemplo: <code>Authorization: Bearer {"{{token}}"}</code>
        </p>
      </div>
    </div>
  );
}
