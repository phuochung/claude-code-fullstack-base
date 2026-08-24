import { TagModule } from "@/constants/common";

export interface Tag {
    _id: string;
    module: TagModule;
    nameEn: string;
    nameVi: string;
    descriptionEn?: string;
    descriptionVi?: string;
    /**
     * Marks a tag the platform seeds and code depends on, so the UI badges it
     * and hides its delete action. Optional because this backend does not
     * populate it — a product repo that seeds system tags adds the field
     * server-side and the UI lights up on its own.
     */
    systemKey?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TagFormData {
    module: TagModule;
    nameVi: string;
    nameEn: string;
    descriptionVi?: string;
    descriptionEn?: string;
}
