"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { userService } from "@/api/services/user";
import { useToast } from "@/context/ToastContext";
import { ApiException } from "@/api/base";
import { useI18n } from "@/context/I18nContext";
import { PencilIcon } from "@/icons";

interface UserProfile {
  email: string;
  name: string;
  phoneNumber?: string;
}

export default function UserInfoCard() {
  const { isOpen, openModal: openModalBase, closeModal } = useModal();
  const { t } = useI18n();

  const openModal = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        phoneNumber: profile.phoneNumber || '',
      });
    }
    openModalBase();
  };
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
  });

  // Fetch profile data
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getProfile();
      setProfile({
        email: data.email,
        name: data.name,
        phoneNumber: data.phoneNumber || '',
      });
      setFormData({
        name: data.name,
        phoneNumber: data.phoneNumber || '',
      });
    } catch (error) {
      if (error instanceof ApiException) {
        toast.error(error.message || t('profile.messages.loadFailed'));
      } else {
        toast.error(t('profile.messages.loadFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setIsLoading(true) marks the request in flight
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(t('profile.messages.nameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const updateData: { name: string; phoneNumber?: string } = {
        name: formData.name,
      };

      if (formData.phoneNumber?.trim()) {
        updateData.phoneNumber = formData.phoneNumber;
      }

      const updatedProfile = await userService.updateProfile(updateData);

      setProfile({
        email: updatedProfile.email,
        name: updatedProfile.name,
        phoneNumber: updatedProfile.phoneNumber || '',
      });

      window.dispatchEvent(new CustomEvent('userUpdated'));
      toast.success(t('profile.messages.updateSuccess'));
      closeModal();
    } catch (error) {
      if (error instanceof ApiException) {
        toast.error(error.message || t('profile.messages.updateFailed'));
      } else {
        toast.error(t('profile.messages.updateFailed'));
      }
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            {t('profile.personalInfo')}
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t('profile.name')}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {isLoading ? t('common.message.loading') : profile?.name || t('profile.notAvailable')}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t('profile.email')}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {isLoading ? t('common.message.loading') : profile?.email || t('profile.notAvailable')}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t('profile.phone')}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {isLoading ? t('common.message.loading') : profile?.phoneNumber || t('profile.notAvailable')}
              </p>
            </div>
          </div>
        </div>

        <Button size="sm" variant="outline" startIcon={<PencilIcon />} onClick={openModal}>
          {t('profile.edit')}
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {t('profile.modal.title')}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {t('profile.modal.subtitle')}
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[300px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  {t('profile.personalInfo')}
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>{t('profile.name')} <span className="text-error-500">*</span></Label>
                    <Input
                      type="text"
                      name="name"
                      defaultValue={formData.name}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      placeholder={t('profile.modal.namePlaceholder')}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>{t('profile.phone')}</Label>
                    <Input
                      type="text"
                      name="phoneNumber"
                      defaultValue={formData.phoneNumber}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      placeholder={t('profile.modal.phonePlaceholder')}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>{t('profile.email')}</Label>
                    <Input
                      type="text"
                      defaultValue={profile?.email || ''}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('profile.modal.emailNote')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={isSaving}>
                {t('profile.modal.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? t('profile.modal.saving') : t('profile.modal.save')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
