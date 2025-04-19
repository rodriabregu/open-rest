"use client";

import { useState, useEffect } from "react";
import { Key, Lock, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import type { EnvVariable } from "@/lib/storage";

export type AuthType = "none" | "basic" | "bearer" | "apikey" | "oauth2";

export interface AuthConfig {
  type: AuthType;
  username?: string;
  password?: string;
  token?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyIn?: "header" | "query";
  enabled: boolean;
}

interface AuthPanelProps {
  authConfig: AuthConfig;
  onAuthChange: (config: AuthConfig) => void;
  variables: EnvVariable[];
  onGenerateHeaders: (headers: Record<string, string>) => void;
}

export function AuthPanel({
  authConfig,
  onAuthChange,
  variables,
  onGenerateHeaders,
}: AuthPanelProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Generar headers basados en la configuración de autenticación
  useEffect(() => {
    if (!authConfig.enabled) {
      onGenerateHeaders({});
      return;
    }

    const headers: Record<string, string> = {};

    switch (authConfig.type) {
      case "basic":
        if (authConfig.username && authConfig.password) {
          const credentials = btoa(
            `${authConfig.username}:${authConfig.password}`
          );
          headers["Authorization"] = `Basic ${credentials}`;
        }
        break;
      case "bearer":
        if (authConfig.token) {
          headers["Authorization"] = `Bearer ${authConfig.token}`;
        }
        break;
      case "apikey":
        if (
          authConfig.apiKeyName &&
          authConfig.apiKeyValue &&
          authConfig.apiKeyIn === "header"
        ) {
          headers[authConfig.apiKeyName] = authConfig.apiKeyValue;
        }
        break;
    }

    onGenerateHeaders(headers);
  }, [authConfig, onGenerateHeaders]);

  const handleAuthTypeChange = (type: AuthType) => {
    onAuthChange({ ...authConfig, type });
  };

  const handleAuthToggle = (enabled: boolean) => {
    onAuthChange({ ...authConfig, enabled });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="auth-enabled">Autenticación</Label>
          <Switch
            id="auth-enabled"
            checked={authConfig.enabled}
            onCheckedChange={handleAuthToggle}
          />
        </div>
        <Select
          value={authConfig.type}
          onValueChange={(value) => handleAuthTypeChange(value as AuthType)}
          disabled={!authConfig.enabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de autenticación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin autenticación</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="apikey">API Key</SelectItem>
            <SelectItem value="oauth2">OAuth 2.0</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {authConfig.enabled && (
        <Card>
          <CardContent className="pt-6">
            {authConfig.type === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        value={authConfig.username || ""}
                        onChange={(e) =>
                          onAuthChange({
                            ...authConfig,
                            username: e.target.value,
                          })
                        }
                        placeholder="Nombre de usuario o {{variable}}"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={authConfig.password || ""}
                          onChange={(e) =>
                            onAuthChange({
                              ...authConfig,
                              password: e.target.value,
                            })
                          }
                          placeholder="Contraseña o {{variable}}"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Genera un header{" "}
                  <code>Authorization: Basic [base64(username:password)]</code>
                </div>
              </div>
            )}

            {authConfig.type === "bearer" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <div className="relative">
                    <Input
                      id="token"
                      type={showToken ? "text" : "password"}
                      value={authConfig.token || ""}
                      onChange={(e) =>
                        onAuthChange({ ...authConfig, token: e.target.value })
                      }
                      placeholder="Token o {{variable}}"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Genera un header <code>Authorization: Bearer [token]</code>
                </div>
              </div>
            )}

            {authConfig.type === "apikey" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apikey-name">Nombre de la clave</Label>
                    <Input
                      id="apikey-name"
                      value={authConfig.apiKeyName || ""}
                      onChange={(e) =>
                        onAuthChange({
                          ...authConfig,
                          apiKeyName: e.target.value,
                        })
                      }
                      placeholder="X-API-Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apikey-value">Valor</Label>
                    <div className="relative">
                      <Input
                        id="apikey-value"
                        type={showApiKey ? "text" : "password"}
                        value={authConfig.apiKeyValue || ""}
                        onChange={(e) =>
                          onAuthChange({
                            ...authConfig,
                            apiKeyValue: e.target.value,
                          })
                        }
                        placeholder="Valor o {{variable}}"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Enviar en</Label>
                  <Select
                    value={authConfig.apiKeyIn || "header"}
                    onValueChange={(value) =>
                      onAuthChange({
                        ...authConfig,
                        apiKeyIn: value as "header" | "query",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="query">Query Parameter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground">
                  {authConfig.apiKeyIn === "header" ? (
                    <>
                      Genera un header{" "}
                      <code>
                        {authConfig.apiKeyName || "X-API-Key"}: [valor]
                      </code>
                    </>
                  ) : (
                    <>
                      Añade un parámetro{" "}
                      <code>?{authConfig.apiKeyName || "apiKey"}=[valor]</code>{" "}
                      a la URL
                    </>
                  )}
                </div>
              </div>
            )}

            {authConfig.type === "oauth2" && (
              <div className="p-4 text-center text-muted-foreground">
                <p>OAuth 2.0 estará disponible próximamente</p>
              </div>
            )}

            {authConfig.type === "none" && (
              <div className="p-4 text-center text-muted-foreground">
                <p>No se utilizará autenticación para esta petición</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
