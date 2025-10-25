import React, { useState } from 'react';
import { Shield, Lock, Globe, AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ExportButton } from '../common/ExportButton';
import { exportSecurityAuditToPDF } from '../../utils/exportUtils';
import type { ExportFormat } from '../common/ExportButton';

interface TLSConfig {
  enabled: boolean;
  certificatePath: string;
  privateKeyPath: string;
  cipherSuites: string;
}

interface DKIMConfig {
  enabled: boolean;
  domain: string;
  selector: string;
  privateKeyPath: string;
}

interface IPRule {
  id: string;
  ip: string;
  type: 'whitelist' | 'blacklist';
  description: string;
}

const SecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tls' | 'dkim' | 'ip' | 'rate'>('tls');
  const [ipRules, setIPRules] = useState<IPRule[]>([
    { id: '1', ip: '192.168.1.100', type: 'whitelist', description: 'Office IP' },
    { id: '2', ip: '10.0.0.0/8', type: 'blacklist', description: 'Private network range' },
  ]);

  const tlsForm = useForm<TLSConfig>({
    defaultValues: {
      enabled: true,
      certificatePath: '/etc/kumomta/certs/server.crt',
      privateKeyPath: '/etc/kumomta/certs/server.key',
      cipherSuites: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384',
    },
  });

  const dkimForm = useForm<DKIMConfig>({
    defaultValues: {
      enabled: true,
      domain: 'example.com',
      selector: 'default',
      privateKeyPath: '/etc/kumomta/dkim/private.key',
    },
  });

  const handleTLSSubmit = (data: TLSConfig) => {
    console.log('TLS Config:', data);
    // TODO: Implement API call to update TLS configuration
  };

  const handleDKIMSubmit = (data: DKIMConfig) => {
    console.log('DKIM Config:', data);
    // TODO: Implement API call to update DKIM configuration
  };

  const addIPRule = () => {
    const newRule: IPRule = {
      id: Date.now().toString(),
      ip: '',
      type: 'whitelist',
      description: '',
    };
    setIPRules([...ipRules, newRule]);
  };

  const removeIPRule = (id: string) => {
    setIPRules(ipRules.filter(rule => rule.id !== id));
  };

  const handleExport = (format: ExportFormat) => {
    if (format === 'pdf') {
      const tlsConfig = tlsForm.getValues();
      const dkimConfig = dkimForm.getValues();
      exportSecurityAuditToPDF(tlsConfig, dkimConfig, ipRules);
    }
  };

  const tabs = [
    { id: 'tls', label: 'TLS/SSL', icon: Lock },
    { id: 'dkim', label: 'DKIM/SPF', icon: Shield },
    { id: 'ip', label: 'IP Management', icon: Globe },
    { id: 'rate', label: 'Rate Limiting', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure security settings for your KumoMTA server
          </p>
        </div>
        <ExportButton
          onExport={handleExport}
          formats={['pdf']}
          label="Export Audit"
          showDropdown={false}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                `} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TLS/SSL Tab */}
      {activeTab === 'tls' && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={tlsForm.handleSubmit(handleTLSSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">TLS/SSL Configuration</h3>
                <p className="text-sm text-gray-500">Configure TLS encryption for secure email delivery</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  {...tlsForm.register('enabled')}
                  type="checkbox"
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Enabled</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Certificate Path</label>
                <input
                  {...tlsForm.register('certificatePath', { required: 'Certificate path is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="/etc/kumomta/certs/server.crt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Private Key Path</label>
                <input
                  {...tlsForm.register('privateKeyPath', { required: 'Private key path is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="/etc/kumomta/certs/server.key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cipher Suites</label>
                <input
                  {...tlsForm.register('cipherSuites')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384"
                />
                <p className="mt-1 text-sm text-gray-500">Colon-separated list of allowed cipher suites</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save TLS Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DKIM/SPF Tab */}
      {activeTab === 'dkim' && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={dkimForm.handleSubmit(handleDKIMSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">DKIM Configuration</h3>
                <p className="text-sm text-gray-500">Configure DKIM signing for email authentication</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  {...dkimForm.register('enabled')}
                  type="checkbox"
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Enabled</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Domain</label>
                <input
                  {...dkimForm.register('domain', { required: 'Domain is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Selector</label>
                <input
                  {...dkimForm.register('selector', { required: 'Selector is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Private Key Path</label>
                <input
                  {...dkimForm.register('privateKeyPath', { required: 'Private key path is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="/etc/kumomta/dkim/private.key"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">DNS Record Required</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Add the following DNS TXT record to your domain:
                  </p>
                  <code className="mt-2 block text-xs bg-white p-2 rounded border border-blue-200">
                    default._domainkey.example.com TXT "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
                  </code>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save DKIM Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IP Management Tab */}
      {activeTab === 'ip' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">IP Access Control</h3>
                <p className="text-sm text-gray-500">Manage whitelist and blacklist rules</p>
              </div>
              <button
                onClick={addIPRule}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </button>
            </div>

            <div className="space-y-4">
              {ipRules.map(rule => (
                <div key={rule.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    value={rule.ip}
                    onChange={(e) => {
                      setIPRules(ipRules.map(r => r.id === rule.id ? { ...r, ip: e.target.value } : r));
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="192.168.1.100 or 10.0.0.0/8"
                  />
                  <select
                    value={rule.type}
                    onChange={(e) => {
                      setIPRules(ipRules.map(r => r.id === rule.id ? { ...r, type: e.target.value as 'whitelist' | 'blacklist' } : r));
                    }}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="whitelist">Whitelist</option>
                    <option value="blacklist">Blacklist</option>
                  </select>
                  <input
                    type="text"
                    value={rule.description}
                    onChange={(e) => {
                      setIPRules(ipRules.map(r => r.id === rule.id ? { ...r, description: e.target.value } : r));
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Description"
                  />
                  <button
                    onClick={() => removeIPRule(rule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save IP Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limiting Tab */}
      {activeTab === 'rate' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Rate Limiting</h3>
              <p className="text-sm text-gray-500">Configure rate limits for email sending</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Messages Per Hour</label>
                <input
                  type="number"
                  defaultValue="1000"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Recipients Per Message</label>
                <input
                  type="number"
                  defaultValue="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Concurrent Connections</label>
                <input
                  type="number"
                  defaultValue="50"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Throttle Delay (ms)</label>
                <input
                  type="number"
                  defaultValue="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Rate Limits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPage;
