export interface User {
    _id: string;
    email: string;
    name: string;
    role: number;
    /**
     * Optional: the seeded admin is created without one, and the backend simply
     * omits the field. Typing it as required is what let the edit form call
     * `.trim()` on undefined and die before it could save.
     */
    phoneNumber?: string;
    createdAt: string;
    updatedAt: string;
    lastActiveAt?: string;
}

export interface UserFormData {
    email: string;
    name: string;
    /**
     * Omitted by the edit form when the admin did not touch the role picker.
     *
     * The backend enum has six roles and the dashboard only offers two, so a
     * PATCH that always carried `role` could only ever send a value from the
     * short list — which is how editing a SUPPER_ADMIN's name used to be able
     * to demote them. Not sending the field is the fix; the backend's
     * last-admin guard is the safety net behind it.
     */
    role?: number;
    phoneNumber: string;
    password?: string;
}

export interface UserFilters {
    keyword?: string;
    role?: number | '';
    sortBy?: 'name' | 'email' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
