/**
 * NotificationChannelConfig Component
 * Channel setup for Email, Slack, Webhook, and PagerDuty
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNotificationChannels } from '../../hooks/useNotificationChannels';
import { validateNotificationChannel } from '../../utils/alertRuleValidator';
import type { NotificationChannelType, NotificationChannelFormData } from '../../types/alert';

export const NotificationChannelConfig: React.FC = () => {
  const { channels, createChannel, updateChannel, deleteChannel, toggleChannel, testChannel, isTesting } =
    useNotificationChannels();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<NotificationChannelType>('email');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NotificationChannelFormData>({
    defaultValues: {
      name: '',
      type: 'email',
      config: {},
    },
  });

  const handleEdit = (channel: NotificationChannel) => {
    setEditingId(channel.id);
    setSelectedType(channel.type);
    setValue('name', channel.name);
    setValue('type', channel.type);
    setValue('config', channel.config);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteChannel(id);
    }
  };

  const onSubmit = async (data: NotificationChannelFormData) => {
    const validation = validateNotificationChannel(data);
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    if (editingId) {
      updateChannel({ id: editingId, data }, {
        onSuccess: () => {
          setShowForm(false);
          setEditingId(null);
          reset();
        },
      });
    } else {
      createChannel(data, {
        onSuccess: () => {
          setShowForm(false);
          reset();
        },
      });
    }
  };

  const renderConfigFields = () => {
    switch (selectedType) {
      case 'email':
        return (
          <>
            <div>
              <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-1">
                Recipients (comma-separated) *
              </label>
              <input
                {...register('config.recipients', { required: 'Recipients are required' })}
                id="recipients"
                type="text"
                placeholder="user@example.com, team@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Template *
              </label>
              <input
                {...register('config.subject', { required: 'Subject is required' })}
                id="subject"
                type="text"
                placeholder="Alert: {{ruleName}}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="bodyTemplate" className="block text-sm font-medium text-gray-700 mb-1">
                Body Template *
              </label>
              <textarea
                {...register('config.bodyTemplate', { required: 'Body template is required' })}
                id="bodyTemplate"
                rows={4}
                placeholder="Alert triggered: {{message}}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        );

      case 'slack':
        return (
          <>
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL *
              </label>
              <input
                {...register('config.webhookUrl', { required: 'Webhook URL is required' })}
                id="webhookUrl"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
                Channel (optional)
              </label>
              <input
                {...register('config.channel')}
                id="channel"
                type="text"
                placeholder="#alerts"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="mentions" className="block text-sm font-medium text-gray-700 mb-1">
                Mentions (comma-separated)
              </label>
              <input
                {...register('config.mentions')}
                id="mentions"
                type="text"
                placeholder="@channel, @here, @user"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        );

      case 'webhook':
        return (
          <>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL *
              </label>
              <input
                {...register('config.url', { required: 'URL is required' })}
                id="url"
                type="url"
                placeholder="https://api.example.com/webhook"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
                HTTP Method *
              </label>
              <select
                {...register('config.method', { required: 'Method is required' })}
                id="method"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label htmlFor="bodyTemplate" className="block text-sm font-medium text-gray-700 mb-1">
                Body Template (JSON) *
              </label>
              <textarea
                {...register('config.bodyTemplate', { required: 'Body template is required' })}
                id="bodyTemplate"
                rows={4}
                placeholder='{"alert": "{{message}}", "severity": "{{severity}}"}'
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="authType" className="block text-sm font-medium text-gray-700 mb-1">
                Authentication Type
              </label>
              <select
                {...register('config.authentication.type')}
                id="authType"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="apikey">API Key</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
          </>
        );

      case 'pagerduty':
        return (
          <>
            <div>
              <label htmlFor="integrationKey" className="block text-sm font-medium text-gray-700 mb-1">
                Integration Key *
              </label>
              <input
                {...register('config.integrationKey', { required: 'Integration key is required' })}
                id="integrationKey"
                type="password"
                placeholder="Enter your PagerDuty integration key"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                Default Severity
              </label>
              <select
                {...register('config.severity')}
                id="severity"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                {...register('config.autoResolve')}
                id="autoResolve"
                type="checkbox"
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoResolve" className="ml-2 text-sm text-gray-700">
                Auto-resolve incidents when alerts are resolved
              </label>
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Notification Channels</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            reset();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Channel
        </button>
      </div>

      {/* Channel Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Channel' : 'Add New Channel'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Channel Name *
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                id="name"
                type="text"
                placeholder="e.g., Production Alerts"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Channel Type *
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="type"
                    onChange={(e) => {
                      field.onChange(e);
                      setSelectedType(e.target.value as NotificationChannelType);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                    <option value="pagerduty">PagerDuty</option>
                  </select>
                )}
              />
            </div>

            {renderConfigFields()}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  reset();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update' : 'Create'} Channel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Channels List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {channels.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No notification channels configured. Add your first channel to get started.
          </div>
        ) : (
          channels.map((channel) => (
            <div key={channel.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {channel.type}
                    </span>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      channel.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {channel.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleChannel({ id: channel.id, enabled: !channel.enabled })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    channel.enabled
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {channel.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleEdit(channel)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => testChannel(channel.id)}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isTesting ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={() => handleDelete(channel.id, channel.name)}
                  className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationChannelConfig;
