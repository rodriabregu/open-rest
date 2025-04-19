"use client";

import { useState } from "react";
import { Edit, Plus, Trash2, Check, X, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import type { Environment, EnvVariable } from "@/lib/storage";

interface EnvironmentManagerProps {
  environments: Environment[];
  onEnvironmentsChange: (environments: Environment[]) => void;
  onSelectEnvironment: (envId: string) => void;
}

export function EnvironmentManager({
  environments,
  onEnvironmentsChange,
  onSelectEnvironment,
}: EnvironmentManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("global");
  const [editingVariable, setEditingVariable] = useState<EnvVariable | null>(
    null
  );
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [newVarDescription, setNewVarDescription] = useState("");
  const [newEnvName, setNewEnvName] = useState("");

  // Obtener el entorno activo o el primero si no hay ninguno activo
  const activeEnvironment =
    environments.find((env) => env.isActive) || environments[0];

  // Inicializar el tab activo con el ID del entorno activo si existe
  useState(() => {
    if (activeEnvironment) {
      setActiveTab(activeEnvironment.id);
    }
  });

  const handleAddEnvironment = () => {
    if (!newEnvName.trim()) return;

    const newEnv: Environment = {
      id: Date.now().toString(),
      name: newEnvName,
      variables: [],
    };

    onEnvironmentsChange([...environments, newEnv]);
    setNewEnvName("");
    setActiveTab(newEnv.id);
  };

  const handleDeleteEnvironment = (envId: string) => {
    // No permitir eliminar el entorno global
    if (envId === "global") return;

    const updatedEnvironments = environments.filter((env) => env.id !== envId);

    // Si el entorno eliminado era el activo, activar el global
    if (activeEnvironment?.id === envId) {
      onSelectEnvironment("global");
    }

    onEnvironmentsChange(updatedEnvironments);
    setActiveTab("global");
  };

  const handleAddVariable = () => {
    if (!newVarName.trim()) return;

    const newVar: EnvVariable = {
      id: Date.now().toString(),
      name: newVarName,
      value: newVarValue,
      description: newVarDescription || undefined,
    };

    const updatedEnvironments = environments.map((env) => {
      if (env.id === activeTab) {
        return {
          ...env,
          variables: [...env.variables, newVar],
        };
      }
      return env;
    });

    onEnvironmentsChange(updatedEnvironments);
    setNewVarName("");
    setNewVarValue("");
    setNewVarDescription("");
  };

  const handleEditVariable = () => {
    if (!editingVariable || !editingVariable.name.trim()) return;

    const updatedEnvironments = environments.map((env) => {
      if (env.id === activeTab) {
        return {
          ...env,
          variables: env.variables.map((v) =>
            v.id === editingVariable.id ? { ...editingVariable } : v
          ),
        };
      }
      return env;
    });

    onEnvironmentsChange(updatedEnvironments);
    setEditingVariable(null);
  };

  const handleDeleteVariable = (varId: string) => {
    const updatedEnvironments = environments.map((env) => {
      if (env.id === activeTab) {
        return {
          ...env,
          variables: env.variables.filter((v) => v.id !== varId),
        };
      }
      return env;
    });

    onEnvironmentsChange(updatedEnvironments);
  };

  const handleSelectEnvironment = (envId: string) => {
    onSelectEnvironment(envId);
    setIsOpen(false);
  };

  // Obtener las variables del entorno activo
  const currentEnvVariables =
    environments.find((env) => env.id === activeTab)?.variables || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Entorno: {activeEnvironment?.name || "Global"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestionar Entornos</DialogTitle>
          <DialogDescription>
            Crea y gestiona variables de entorno para usar en tus peticiones.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nuevo entorno..."
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddEnvironment}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList className="flex-1 overflow-x-auto">
                <TabsTrigger value="global" className="flex-shrink-0">
                  Global
                </TabsTrigger>
                {environments
                  .filter((env) => env.id !== "global")
                  .map((env) => (
                    <TabsTrigger
                      key={env.id}
                      value={env.id}
                      className="flex-shrink-0"
                    >
                      {env.name}
                      {env.isActive && (
                        <Badge className="ml-2 bg-green-500 text-white">
                          Activo
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </div>

            <TabsContent value="global" className="border rounded-md p-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Variables Globales</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectEnvironment("global")}
                    disabled={activeEnvironment?.id === "global"}
                  >
                    Usar Globales
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Input
                    placeholder="Nombre"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Valor"
                    value={newVarValue}
                    onChange={(e) => setNewVarValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddVariable}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Descripción opcional"
                    value={newVarDescription}
                    onChange={(e) => setNewVarDescription(e.target.value)}
                    className="h-20"
                  />
                </div>

                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <div className="space-y-2">
                    {environments
                      .find((env) => env.id === "global")
                      ?.variables.map((variable) => (
                        <div
                          key={variable.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                        >
                          {editingVariable?.id === variable.id ? (
                            <>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  value={editingVariable.name}
                                  onChange={(e) =>
                                    setEditingVariable({
                                      ...editingVariable,
                                      name: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                />
                                <Input
                                  value={editingVariable.value}
                                  onChange={(e) =>
                                    setEditingVariable({
                                      ...editingVariable,
                                      value: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                />
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={handleEditVariable}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setEditingVariable(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {"{{" + variable.name + "}}"}
                                  </span>
                                  <span className="text-muted-foreground text-sm">
                                    {variable.value}
                                  </span>
                                </div>
                                {variable.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {variable.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setEditingVariable(variable)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleDeleteVariable(variable.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    {environments.find((env) => env.id === "global")?.variables
                      .length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay variables globales definidas
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {environments
              .filter((env) => env.id !== "global")
              .map((env) => (
                <TabsContent
                  key={env.id}
                  value={env.id}
                  className="border rounded-md p-4"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Variables de {env.name}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectEnvironment(env.id)}
                          disabled={activeEnvironment?.id === env.id}
                        >
                          Usar Entorno
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEnvironment(env.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        placeholder="Nombre"
                        value={newVarName}
                        onChange={(e) => setNewVarName(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Valor"
                        value={newVarValue}
                        onChange={(e) => setNewVarValue(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleAddVariable}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Descripción</Label>
                      <Textarea
                        placeholder="Descripción opcional"
                        value={newVarDescription}
                        onChange={(e) => setNewVarDescription(e.target.value)}
                        className="h-20"
                      />
                    </div>

                    <ScrollArea className="h-[200px] rounded-md border p-2">
                      <div className="space-y-2">
                        {env.variables.map((variable) => (
                          <div
                            key={variable.id}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                          >
                            {editingVariable?.id === variable.id ? (
                              <>
                                <div className="flex-1 flex gap-2">
                                  <Input
                                    value={editingVariable.name}
                                    onChange={(e) =>
                                      setEditingVariable({
                                        ...editingVariable,
                                        name: e.target.value,
                                      })
                                    }
                                    className="flex-1"
                                  />
                                  <Input
                                    value={editingVariable.value}
                                    onChange={(e) =>
                                      setEditingVariable({
                                        ...editingVariable,
                                        value: e.target.value,
                                      })
                                    }
                                    className="flex-1"
                                  />
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={handleEditVariable}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setEditingVariable(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {"{{" + variable.name + "}}"}
                                    </span>
                                    <span className="text-muted-foreground text-sm">
                                      {variable.value}
                                    </span>
                                  </div>
                                  {variable.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {variable.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setEditingVariable(variable)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      handleDeleteVariable(variable.id)
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {env.variables.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay variables definidas en este entorno
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              ))}
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
