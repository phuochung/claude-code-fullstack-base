export type CustomFieldType = 'text' | 'number' | 'date' | 'select';

export interface CustomFieldDefinition {
    _id: string;
    module: string;
    key: string;
    label: string;
    fieldType: CustomFieldType;
    options: string[];
    required: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface CustomFieldDefinitionFormData {
    module: string;
    key: string;
    label: string;
    fieldType: CustomFieldType;
    options?: string[];
    required?: boolean;
    order?: number;
}
