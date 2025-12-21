import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Flag,
  Cog,
  ToggleLeft,
  ToggleRight,
  Building2,
} from "lucide-react";
import { getSystemConfigs, getFeatureFlags } from "@/lib/actions/admin/system";
import { FeatureFlagToggle } from "@/components/admin/feature-flag-toggle";
import { SystemConfigEditor } from "@/components/admin/system-config-editor";
import { AddFeatureFlagDialog } from "@/components/admin/add-feature-flag-dialog";

export default async function SettingsPage() {
  const [configs, featureFlags] = await Promise.all([
    getSystemConfigs(),
    getFeatureFlags(),
  ]);

  // Group configs by category
  const configsByCategory = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, typeof configs>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configuration</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage feature flags and system settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="feature-flags" className="space-y-6">
        <TabsList>
          <TabsTrigger value="feature-flags" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="system-config" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            System Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feature-flags" className="space-y-6">
          <div className="flex justify-end">
            <AddFeatureFlagDialog />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Enable or disable features across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featureFlags.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No feature flags configured. Click &ldquo;Add Feature Flag&rdquo; to create one.
                </div>
              ) : (
                <div className="divide-y dark:divide-slate-700">
                  {featureFlags.map((flag) => (
                    <div key={flag.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {flag.isEnabled ? (
                              <ToggleRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-slate-400" />
                            )}
                            <span className="font-medium text-slate-900 dark:text-white">
                              {flag.name}
                            </span>
                            {flag.isEnabled ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Enabled
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                            {!flag.enabledForAll && flag.isEnabled && (
                              <Badge variant="outline" className="text-amber-600">
                                Per-practice
                              </Badge>
                            )}
                          </div>
                          {flag.description && (
                            <p className="text-sm text-slate-500 mt-1 ml-7">
                              {flag.description}
                            </p>
                          )}
                          {flag._count.Overrides > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-2 ml-7">
                              <Building2 className="h-3 w-3" />
                              {flag._count.Overrides} practice override{flag._count.Overrides !== 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                        <FeatureFlagToggle flag={flag} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-config" className="space-y-6">
          {Object.keys(configsByCategory).length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-slate-500">
                  No system configuration settings. Add settings via the API.
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(configsByCategory).map(([category, categoryConfigs]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 capitalize">
                    <Settings className="h-5 w-5" />
                    {category} Settings
                  </CardTitle>
                  <CardDescription>
                    Configure {category.toLowerCase()} related settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y dark:divide-slate-700">
                    {categoryConfigs.map((config) => (
                      <SystemConfigEditor key={config.id} config={config} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
