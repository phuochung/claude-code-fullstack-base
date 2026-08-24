import { apiClient } from '@/api/base';
import { CustomFieldDefinition, CustomFieldDefinitionFormData } from '@/types/custom-field';

export const customFieldDefinitionService = {
    getDefinitionsByModule: async (module: string): Promise<CustomFieldDefinition[]> => {
        return apiClient.get<CustomFieldDefinition[]>(
            `/admin/custom-field-definitions?module=${encodeURIComponent(module)}`
        );
    },

    getDefinitionById: async (id: string): Promise<CustomFieldDefinition> => {
        return apiClient.get<CustomFieldDefinition>(`/admin/custom-field-definitions/${id}`);
    },

    createDefinition: async (data: CustomFieldDefinitionFormData): Promise<CustomFieldDefinition> => {
        const payload = {
            ...data,
            options: data.options ?? [],
            required: data.required ?? false,
            order: data.order ?? 0,
        };
        return apiClient.post<CustomFieldDefinition>('/admin/custom-field-definitions', payload);
    },

    updateDefinition: async (id: string, data: Partial<CustomFieldDefinitionFormData>): Promise<CustomFieldDefinition> => {
        return apiClient.patch<CustomFieldDefinition>(`/admin/custom-field-definitions/${id}`, data);
    },

    deleteDefinition: async (id: string): Promise<void> => {
        return apiClient.delete<void>(`/admin/custom-field-definitions/${id}`);
    },
};

export default customFieldDefinitionService;
