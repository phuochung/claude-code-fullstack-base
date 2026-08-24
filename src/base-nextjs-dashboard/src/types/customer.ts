import { CustomFieldType } from './custom-field';

/**
 * A stored custom field value. The backend keeps these schemaless
 * (`SchemaTypes.Mixed`); the dashboard's form only ever writes strings, but
 * existing documents may hold other JSON primitives.
 */
export type CustomFieldValue = string | number | null;

export interface CustomerCustomFieldValue {
    key: string;
    label: string;
    fieldType: CustomFieldType;
    value: CustomFieldValue;
}

export type CustomerSource = 'web' | 'facebook' | 'zalo' | 'call';

export interface Customer {
    _id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    gender?: 'male' | 'female' | 'other';
    source?: CustomerSource;
    address?: string;
    customFields?: CustomerCustomFieldValue[];
    createdAt: string;
    updatedAt: string;
}

export interface CustomerFormData {
    name: string;
    phoneNumber: string;
    email?: string;
    gender?: 'male' | 'female' | 'other';
    source?: CustomerSource;
    address?: string;
    customFields?: { definitionId: string; value: CustomFieldValue }[];
}
