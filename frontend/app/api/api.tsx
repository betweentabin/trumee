import apiClient from '../../lib/api-client';
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";

const search = async () => {
  try {
    const response = await apiClient.searchSeekers({});
    return response;
  } catch (error) {
    console.error("Search API error:", error);
    return null;
  }
};

export default search;

export const saveHistory = async (data: any, router: any) => {
  try {
    console.log(data, 'ddddd');
    const response = await apiClient.createResume(data);
    if (response) {
      toast.success("履歴が保存されました！ 🎉");
      router.push('/auth/login');
      return response;
    }
  } catch (error) {
    console.error("Save history API error:", error);
    toast.error("履歴の保存に失敗しました 😢");
    return null;
  }
};

export const applyToCompany = async(company: any) => {
  try {
    console.log(company, 'e');
    const response = await apiClient.createApplication({
      company: company.company_id || company.id
    });
    console.log(response, 'res');
    if(response){
      toast.success("応募しました！")
    }
    return response;
  } catch (err) {
    console.error(err);
    toast.error("応募に失敗しました");
    return null;
  }
}
export const cancelApplication = async(applicationId: string) => {
  try {
    console.log(applicationId, 'Canceling application');
    const response = await apiClient.updateApplicationStatus(applicationId, 'cancelled');
    console.log(response, 'res');
    if(response){
      toast.success("応募を取り消しました")
    }
    return response;
  } catch (err) {
    console.error(err);
    toast.error("取り消しに失敗しました");
    return null;
  }
}
export const cancelScout = async(scoutId: string) => {
  try {
    console.log(scoutId, 'Canceling scout');
    const response = await apiClient.delete(`/scouts/${scoutId}/`);
    console.log(response, 'res');
    if(response){
      toast.success("スカウトを取り消しました")
    }
    return response;
  } catch (err) {
    console.error(err);
    toast.error("取り消しに失敗しました");
    return null;
  }
}
export const applyScout = async(scoutId: string) => {
  try {
    console.log(scoutId, 'Responding to scout');
    const response = await apiClient.respondScout(scoutId);
    console.log(response, 'res');
    if(response){
      toast.success("スカウトに返信しました")
    }
    return response;
  } catch (err) {
    console.error(err);
    toast.error("返信に失敗しました");
    return null;
  }
}