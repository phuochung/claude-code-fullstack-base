import { CategoryModule } from "@/constants/common";

export interface Category {
    _id: string;
    module: CategoryModule;
    nameEn: string;
    nameVi: string;
    descriptionEn?: string;
    descriptionVi?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryFormData {
    module: CategoryModule;
    nameVi: string;
    nameEn: string;
    descriptionVi?: string;
    descriptionEn?: string;
}
