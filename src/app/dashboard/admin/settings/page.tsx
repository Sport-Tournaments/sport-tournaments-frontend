'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Alert, Tabs } from '@/components/ui';
import { useAuthStore } from '@/store';
import { adminService } from '@/services';

interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportEmail: string;
  defaultCurrency: string;
  maxTeamsPerTournament: number;
  minTeamsPerTournament: number;
  registrationFeePercentage: number;
  allowPublicRegistration: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: 'Football Tournament Platform',
    siteDescription: 'Your gateway to football tournaments worldwide',
    contactEmail: 'contact@footbaleu.com',
    supportEmail: 'support@footbaleu.com',
    defaultCurrency: 'EUR',
    maxTeamsPerTournament: 64,
    minTeamsPerTournament: 4,
    registrationFeePercentage: 5,
    allowPublicRegistration: true,
    requireEmailVerification: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    // fetchSettings();
  }, [user, router]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await adminService.updateSettings(settings);
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = [
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'RON', label: 'Romanian Leu (RON)' },
  ];

  const tabs = [
    {
      id: 'general',
      label: 'General',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Site Name"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />
            <Input
              label="Site Description"
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="email"
                label="Contact Email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
              <Input
                type="email"
                label="Support Email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
            <Select
              label="Default Currency"
              options={currencyOptions}
              value={settings.defaultCurrency}
              onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
            />
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Tournament Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Minimum Teams per Tournament"
                value={settings.minTeamsPerTournament}
                onChange={(e) => setSettings({ ...settings, minTeamsPerTournament: parseInt(e.target.value) })}
              />
              <Input
                type="number"
                label="Maximum Teams per Tournament"
                value={settings.maxTeamsPerTournament}
                onChange={(e) => setSettings({ ...settings, maxTeamsPerTournament: parseInt(e.target.value) })}
              />
            </div>
            <Input
              type="number"
              label="Platform Fee Percentage"
              value={settings.registrationFeePercentage}
              onChange={(e) => setSettings({ ...settings, registrationFeePercentage: parseFloat(e.target.value) })}
              helperText="Percentage of entry fee taken as platform fee"
            />
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'registration',
      label: 'Registration',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Registration Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Allow Public Registration</p>
                <p className="text-sm text-gray-500">Allow new users to register on the platform</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowPublicRegistration}
                onChange={(e) => setSettings({ ...settings, allowPublicRegistration: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Require Email Verification</p>
                <p className="text-sm text-gray-500">Require users to verify their email before accessing the platform</p>
              </div>
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
            </label>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Enable Maintenance Mode</p>
                  <p className="text-sm text-gray-500">
                    When enabled, only admins can access the platform. Users will see a maintenance page.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 text-primary rounded"
                />
              </label>
              {settings.maintenanceMode && (
                <Alert variant="warning" className="mt-4">
                  Maintenance mode is currently active. Only administrators can access the platform.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clear Cache</p>
                  <p className="text-sm text-gray-500">Clear all cached data</p>
                </div>
                <Button variant="outline">Clear Cache</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                  <p className="text-sm text-gray-500">Export all platform data as JSON</p>
                </div>
                <Button variant="outline">Export</Button>
              </div>
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                <div>
                  <p className="font-medium text-red-600">Reset Database</p>
                  <p className="text-sm text-gray-500">This will delete all data. Use with caution.</p>
                </div>
                <Button variant="danger">Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="SMTP Host"
              placeholder="smtp.example.com"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="SMTP Port"
                placeholder="587"
              />
              <Select
                label="Encryption"
                options={[
                  { value: 'tls', label: 'TLS' },
                  { value: 'ssl', label: 'SSL' },
                  { value: 'none', label: 'None' },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SMTP Username"
                placeholder="username"
              />
              <Input
                type="password"
                label="SMTP Password"
                placeholder="••••••••"
              />
            </div>
            <Input
              label="From Email"
              type="email"
              placeholder="noreply@footbaleu.com"
            />
            <Input
              label="From Name"
              placeholder="Football Tournament Platform"
            />
            <div className="pt-4">
              <Button variant="outline">Send Test Email</Button>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Platform Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure platform-wide settings
            </p>
          </div>
          <Button variant="primary" onClick={handleSave} isLoading={loading}>
            Save Settings
          </Button>
        </div>

        <Tabs tabs={tabs} defaultTab="general" />
      </div>
    </DashboardLayout>
  );
}
