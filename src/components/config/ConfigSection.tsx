import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import type { ConfigSection as ConfigSectionType } from '../../types/config';

interface ConfigSectionProps {
  section: ConfigSectionType;
  control: Control<any>;
  errors: Record<string, any>;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({ section, control, errors }) => {
  const renderField = (field: any) => {
    const error = errors[field.id];

    return (
      <div key={field.id} className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
        <label
          htmlFor={field.id}
          className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
        >
          {field.label}
          <p className="mt-1 text-sm text-gray-500">{field.description}</p>
        </label>
        <div className="mt-1 sm:mt-0 sm:col-span-2">
          <Controller
            name={field.id}
            control={control}
            defaultValue={field.defaultValue}
            rules={field.validation}
            render={({ field: { onChange, value } }) => {
              switch (field.type) {
                case 'boolean':
                  return (
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={onChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  );
                case 'number':
                  return (
                    <input
                      type="number"
                      value={value}
                      onChange={onChange}
                      min={field.validation?.min}
                      max={field.validation?.max}
                      className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    />
                  );
                case 'select':
                  return (
                    <select
                      value={value}
                      onChange={onChange}
                      className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    >
                      {field.validation?.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  );
                case 'array':
                  return (
                    <input
                      type="text"
                      value={Array.isArray(value) ? value.join(', ') : value}
                      onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()))}
                      className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Comma-separated values"
                    />
                  );
                default:
                  return (
                    <input
                      type="text"
                      value={value}
                      onChange={onChange}
                      className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    />
                  );
              }
            }}
          />
          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{error.message}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{section.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{section.description}</p>
        <div className="mt-6 space-y-6">
          {section.fields.map(renderField)}
        </div>
      </div>
    </div>
  );
};

export default ConfigSection;