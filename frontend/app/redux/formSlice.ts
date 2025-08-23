import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StepFormData {
  // Step 1: Profile
  profile: {
    email?: string;
    firstName?: string;
    lastName?: string;
    firstNameKana?: string;
    lastNameKana?: string;
    birthday?: string;
    sex?: string;
    phone?: string;
    prefecture?: string;
  };
  
  // Step 2: Education
  education: {
    school?: string;
    faculty?: string;
    graduationYear?: string;
    educationType?: string;
  };
  
  // Step 3: Experience
  experiences: Array<{
    id: number;
    company: string;
    periodFrom: string;
    periodTo: string;
    employmentType?: string;
    business: string;
    capital?: string;
    teamSize?: string;
    tasks: string;
    position?: string;
    industry?: string;
  }>;
  
  // Step 4: Preference
  preference: {
    desiredSalary?: string;
    desiredIndustries?: string[];
    desiredJobTypes?: string[];
    desiredLocations?: string[];
    workStyle?: string;
    availableDate?: string;
  };
  
  // Additional data
  skills?: string;
  selfPR?: string;
  certifications?: string[];
}

interface FormState {
  currentStep: number;
  stepData: StepFormData;
  completedSteps: number[];
  isDirty: boolean;
  lastSaved: string | null;
}

const initialState: FormState = {
  currentStep: 1,
  stepData: {
    profile: {},
    education: {},
    experiences: [],
    preference: {},
  },
  completedSteps: [],
  isDirty: false,
  lastSaved: null,
};

const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    
    updateProfile: (state, action: PayloadAction<Partial<StepFormData['profile']>>) => {
      state.stepData.profile = { ...state.stepData.profile, ...action.payload };
      state.isDirty = true;
    },
    
    updateEducation: (state, action: PayloadAction<Partial<StepFormData['education']>>) => {
      state.stepData.education = { ...state.stepData.education, ...action.payload };
      state.isDirty = true;
    },
    
    setExperiences: (state, action: PayloadAction<StepFormData['experiences']>) => {
      state.stepData.experiences = action.payload;
      state.isDirty = true;
    },
    
    addExperience: (state, action: PayloadAction<StepFormData['experiences'][0]>) => {
      state.stepData.experiences.push(action.payload);
      state.isDirty = true;
    },
    
    updateExperience: (state, action: PayloadAction<{ index: number; data: Partial<StepFormData['experiences'][0]> }>) => {
      const { index, data } = action.payload;
      if (state.stepData.experiences[index]) {
        state.stepData.experiences[index] = { ...state.stepData.experiences[index], ...data };
        state.isDirty = true;
      }
    },
    
    removeExperience: (state, action: PayloadAction<number>) => {
      state.stepData.experiences.splice(action.payload, 1);
      state.isDirty = true;
    },
    
    updatePreference: (state, action: PayloadAction<Partial<StepFormData['preference']>>) => {
      state.stepData.preference = { ...state.stepData.preference, ...action.payload };
      state.isDirty = true;
    },
    
    updateSkills: (state, action: PayloadAction<string>) => {
      state.stepData.skills = action.payload;
      state.isDirty = true;
    },
    
    updateSelfPR: (state, action: PayloadAction<string>) => {
      state.stepData.selfPR = action.payload;
      state.isDirty = true;
    },
    
    markStepCompleted: (state, action: PayloadAction<number>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },
    
    saveForm: (state) => {
      state.isDirty = false;
      state.lastSaved = new Date().toISOString();
    },
    
    resetForm: (state) => {
      return initialState;
    },
    
    loadFormData: (state, action: PayloadAction<StepFormData>) => {
      state.stepData = action.payload;
      state.isDirty = false;
    },
    
    updateStepData: (state, action: PayloadAction<{ step: string; data: any }>) => {
      const { step, data } = action.payload;
      switch (step) {
        case 'profile':
          state.stepData.profile = { ...state.stepData.profile, ...data };
          break;
        case 'education':
          state.stepData.education = { ...state.stepData.education, ...data };
          break;
        case 'preference':
          state.stepData.preference = { ...state.stepData.preference, ...data };
          break;
        default:
          break;
      }
      state.isDirty = true;
    },
  },
});

export const {
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
  updateStepData,
} = formSlice.actions;

export default formSlice.reducer;