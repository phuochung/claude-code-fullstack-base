"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/context/I18nContext";
import { ApiException, getApiErrorMessage } from "../api/base";

interface AsyncActionOptions<T> {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void | Promise<void>;
    onError?: (error: unknown) => void;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
}

/**
 * Custom hook for handling async actions with loading state and toast notifications
 * Reduces boilerplate for API calls with consistent error handling
 * 
 * @example
 * const { isLoading, execute } = useAsyncAction();
 * 
 * const handleDelete = async (id: string) => {
 *   await execute(
 *     () => userService.deleteUser(id),
 *     {
 *       successMessage: "User deleted successfully",
 *       onSuccess: () => fetchUsers()
 *     }
 *   );
 * };
 */
export function useAsyncAction() {
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const toast = useToast();

    const execute = useCallback(
        async <T>(
            action: () => Promise<T>,
            options: AsyncActionOptions<T> = {}
        ): Promise<T | undefined> => {
            const {
                successMessage = t("common.message.success"),
                errorMessage = t("common.message.error"),
                onSuccess,
                onError,
                showSuccessToast = true,
                showErrorToast = true,
            } = options;

            setIsLoading(true);
            setError(null);

            try {
                const result = await action();

                // Show success toast
                if (showSuccessToast && successMessage) {
                    toast.success(successMessage);
                }

                // Execute success callback
                if (onSuccess) {
                    await onSuccess(result);
                }

                return result;
            } catch (err) {
                const errorObj = err instanceof Error ? err : new Error(String(err));
                setError(errorObj);

                // API errors speak for themselves (including the backend's
                // field-level validation messages); anything else falls back to
                // the caller's label.
                const message =
                    err instanceof ApiException
                        ? getApiErrorMessage(err) || err.message
                        : errorMessage || errorObj.message || "An error occurred. Please try again.";

                // Show error toast
                if (showErrorToast) {
                    toast.error(message);
                }

                // Execute error callback
                if (onError) {
                    onError(err);
                }

                // Don't re-throw, return undefined to indicate failure
                return undefined;
            } finally {
                setIsLoading(false);
            }
        },
        [toast, t]
    );

    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
    }, []);

    return {
        isLoading,
        error,
        execute,
        reset,
    };
}