import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, RefreshCw } from 'lucide-react';
import ConfigSection from './ConfigSection';
import { configSections } from './configData';
import type { CoreConfig, IntegrationConfig, PerformanceConfig } from '../../types/config';

type ConfigValues = CoreConfig & IntegrationConfig & PerformanceConfig;

const ConfigEditor: React.FC = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting, errors }
  } = useForm<ConfigValues>();

  const onSubmit = async (data: ConfigValues) => {
    try {
      // Split configuration data into separate categories
      const coreConfig: Partial<CoreConfig> = {
        maxConcurrentDeliveries: data.maxConcurrentDeliveries,
        messageRetention: data.messageRetention,
        defaultDomain: data.defaultDomain,
      };

      const integrationConfig: Partial<IntegrationConfig> = {
        webhookUrl: data.webhookUrl,
        apiKey: data.apiKey,
      };

      const performanceConfig: Partial<PerformanceConfig> = {
        connectionPoolSize: data.connectionPoolSize,
        maxRetries: data.maxRetries,
      };

      // Make API calls to save each configuration section
      const { apiService } = await import('../../services/api');

      await Promise.all([
        Object.keys(coreConfig).length > 0 ? apiService.config.updateCore(coreConfig as CoreConfig) : Promise.resolve(),
        Object.keys(integrationConfig).length > 0 ? apiService.config.updateIntegration(integrationConfig as IntegrationConfig) : Promise.resolve(),
        Object.keys(performanceConfig).length > 0 ? apiService.config.updatePerformance(performanceConfig as PerformanceConfig) : Promise.resolve(),
      ]);

      // Success notification would go here
      console.log('Configuration saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to save configuration:', errorMessage, error);
      throw error; // Re-throw to trigger form error state
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your KumoMTA server settings and preferences
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={!isDirty || isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {configSections.map((section) => (
          <ConfigSection
            key={section.id}
            section={section}
            control={control}
            errors={errors}
          />
        ))}
      </form>
    </div>
  );
};

export default ConfigEditor;