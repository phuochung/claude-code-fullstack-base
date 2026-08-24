import { apiClient } from '../base';

export interface UploadFileResponse {
    _id: string;
    url: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    subPath: string;
    createdAt: string;
    updatedAt: string;
}

// Successful uploads remembered per picked File, so a save that fails *after*
// its upload step doesn't upload the same bytes again on retry (each retry used
// to add one more orphan object to the bucket). Keyed by File identity:
// re-picking a file after a page reload is a new File and uploads anew — that
// orphan class is left to the backend's storage cleanup job.
const uploadedFiles = new WeakMap<File, UploadFileResponse>();

export const storageService = {
    uploadFile: async (file: File, path: string = "untitled"): Promise<UploadFileResponse> => {
        const formData = new FormData();
        formData.append("file", file);

        return apiClient.postForm<UploadFileResponse>(
            `/admin/storage/image/upload?path=${encodeURIComponent(path)}`,
            formData
        );
    },

    /** `uploadFile`, but a File that already uploaded returns its first result. */
    uploadFileOnce: async (file: File, path?: string): Promise<UploadFileResponse> => {
        const cached = uploadedFiles.get(file);
        if (cached) return cached;
        const uploaded = await storageService.uploadFile(file, path);
        uploadedFiles.set(file, uploaded);
        return uploaded;
    },
};
