import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuoteSettings {
  showLogo: boolean;
  showVehicleDetails: boolean;
  showBankingDetails: boolean;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  font: string;
}

interface AppearanceSettingsFormProps {
  settings: QuoteSettings;
  updateNestedField: (object: 'settings', field: keyof QuoteSettings, value: any) => void;
  updateCompanyLogo: (value: string) => void;
}

const AppearanceSettingsForm: React.FC<AppearanceSettingsFormProps> = ({
  settings,
  updateNestedField,
  updateCompanyLogo,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>Customize how your quote looks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showLogo">Show Company Logo</Label>
            <Switch
              id="showLogo"
              checked={settings.showLogo}
              onCheckedChange={(checked) => updateNestedField('settings', 'showLogo', checked)}
            />
          </div>
          {settings.showLogo && (
            <div className="grid gap-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                onChange={(e) => updateCompanyLogo(e.target.value)}
                placeholder="https://your-company.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL to your company logo, or upload one to your hosting service.
              </p>
            </div>
          )}
        </div>
        {/* Color Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Colors</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateNestedField('settings', 'primaryColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => updateNestedField('settings', 'primaryColor', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => updateNestedField('settings', 'secondaryColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) => updateNestedField('settings', 'secondaryColor', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="textColor"
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => updateNestedField('settings', 'textColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.textColor}
                  onChange={(e) => updateNestedField('settings', 'textColor', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Font Settings */}
        <div className="space-y-2">
          <Label htmlFor="font">Font</Label>
          <Select value={settings.font} onValueChange={(value) => updateNestedField('settings', 'font', value)}>
            <SelectTrigger id="font">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="Tahoma">Tahoma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettingsForm;
