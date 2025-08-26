import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { RootState, AppDispatch } from '@/app/redux/store';
import {
  setCurrentStep,
  updateProfile,
  updateEducation,
  setExperiences,
  addExperience,
  updateExperience,
  removeExperience,
  updatePreference,
  updateSkills,
  updateSelfPR,
  markStepCompleted,
  saveForm,
  resetForm,
  loadFormData,
} from '@/app/redux/formSlice';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useFormPersist = () => {
  const dispatch = useDispatch<AppDispatch>();
  const formState = useSelector((state: RootState) => state.form);
  const { getAuthHeaders, user } = useAuth();

  // Auto-save when form is dirty
  useEffect(() => {
    if (formState.isDirty) {
      const timer = setTimeout(() => {
        saveToLocalStorage();
      }, 3000); // Auto-save after 3 seconds of no activity

      return () => clearTimeout(timer);
    }
  }, [formState]);

  // Save to localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const dataToSave = {
        stepData: formState.stepData,
        completedSteps: formState.completedSteps,
        currentStep: formState.currentStep,
      };
      localStorage.setItem('resumeFormData', JSON.stringify(dataToSave));
      dispatch(saveForm());
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }, [formState, dispatch]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem('resumeFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        dispatch(loadFormData(parsedData.stepData));
        parsedData.completedSteps?.forEach((step: number) => {
          dispatch(markStepCompleted(step));
        });
        if (parsedData.currentStep) {
          dispatch(setCurrentStep(parsedData.currentStep));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load form data:', error);
      return false;
    }
  }, [dispatch]);

  // Save to backend
  const saveToBackend = async () => {
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      // Save profile data
      if (formState.stepData.profile && Object.keys(formState.stepData.profile).length > 0) {
        const profileResponse = await fetch(buildApiUrl(API_CONFIG.endpoints.saveHistory), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email_or_id: user?.email,
            ...formState.stepData.profile,
          }),
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to save profile');
        }
      }

      // Save resume data
      if (formState.stepData.experiences.length > 0 || formState.stepData.skills || formState.stepData.selfPR) {
        const resumeData = {
          email: user?.email,
          experiences: formState.stepData.experiences,
          skill: formState.stepData.skills ? { id: 1, skill: formState.stepData.skills } : undefined,
          profile: formState.stepData.selfPR ? { id: 1, profile: formState.stepData.selfPR } : undefined,
          job: formState.stepData.preference ? {
            id: 1,
            job: formState.stepData.preference.desiredJobTypes?.join(', ') || '',
            desired_industries: formState.stepData.preference.desiredIndustries,
            desired_locations: formState.stepData.preference.desiredLocations,
          } : undefined,
          submittedAt: new Date().toISOString(),
        };

        const resumeResponse = await fetch(buildApiUrl(API_CONFIG.endpoints.saveResume), {
          method: 'POST',
          headers,
          body: JSON.stringify(resumeData),
        });

        if (!resumeResponse.ok) {
          throw new Error('Failed to save resume');
        }
      }

      dispatch(saveForm());
      toast.success('データを保存しました');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to save to backend:', error);
      toast.error('保存に失敗しました');
      return { success: false, error: error.message };
    }
  };

  // Load from backend
  const loadFromBackend = async () => {
    try {
      const headers = getAuthHeaders();

      // Load profile data
      const profileResponse = await fetch(buildApiUrl(API_CONFIG.endpoints.getHistory), {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user?.email }),
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData) {
          dispatch(updateProfile({
            email: profileData.email_or_id,
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            firstNameKana: profileData.first_name_kana,
            lastNameKana: profileData.last_name_kana,
            birthday: profileData.birthday,
            sex: profileData.sex,
            phone: profileData.phone,
            prefecture: profileData.prefecture,
          }));
        }
      }

      // Load resume data
      const resumeResponse = await fetch(buildApiUrl(API_CONFIG.endpoints.getResumeData), {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user?.email }),
      });

      if (resumeResponse.ok) {
        const resumeData = await resumeResponse.json();
        if (resumeData) {
          if (resumeData.experiences) {
            dispatch(setExperiences(resumeData.experiences));
          }
          if (resumeData.skill?.skill) {
            dispatch(updateSkills(resumeData.skill.skill));
          }
          if (resumeData.profile?.profile) {
            dispatch(updateSelfPR(resumeData.profile.profile));
          }
        }
      }

      toast.success('データを読み込みました');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to load from backend:', error);
      toast.error('データの読み込みに失敗しました');
      return { success: false, error: error.message };
    }
  };

  // Navigate between steps
  const goToStep = (step: number) => {
    saveToLocalStorage();
    dispatch(setCurrentStep(step));
  };

  const goToNextStep = () => {
    const nextStep = formState.currentStep + 1;
    dispatch(markStepCompleted(formState.currentStep));
    goToStep(nextStep);
  };

  const goToPreviousStep = () => {
    const previousStep = formState.currentStep - 1;
    if (previousStep >= 1) {
      goToStep(previousStep);
    }
  };

  // Clear all data
  const clearFormData = () => {
    localStorage.removeItem('resumeFormData');
    dispatch(resetForm());
    toast.success('フォームデータをクリアしました');
  };

  return {
    ...formState,
    formState,
    updateProfile: (data: any) => dispatch(updateProfile(data)),
    updateEducation: (data: any) => dispatch(updateEducation(data)),
    setExperiences: (data: any) => dispatch(setExperiences(data)),
    addExperience: (data: any) => dispatch(addExperience(data)),
    updateExperience: (index: number, data: any) => dispatch(updateExperience({ index, data })),
    removeExperience: (index: number) => dispatch(removeExperience(index)),
    updatePreference: (data: any) => dispatch(updatePreference(data)),
    updateSkills: (data: string) => dispatch(updateSkills(data)),
    updateSelfPR: (data: string) => dispatch(updateSelfPR(data)),
    markStepCompleted: (step: number) => dispatch(markStepCompleted(step)),
    goToStep,
    goToNextStep,
    goToPreviousStep,
    saveToLocalStorage,
    loadFromLocalStorage,
    saveToBackend,
    loadFromBackend,
    clearFormData,
  };
};