'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

type FormInputs = {
  lastName: string;
  firstName: string;
  companyName: string;
  capital: string;
  phone1: string;
  phone2: string;
  phone3: string;
  email: string;
  homepage: string;
  subscriptions: {
    messageNews: boolean;
    newJobs: boolean;
    matchingReport: boolean;
  };
};

export default function CompanyForm() {
  const {
    register,
    handleSubmit,
    setValue, // to set values after fetching
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: {
      subscriptions: {
        messageNews: false,
        newJobs: true,
        matchingReport: true,
      },
    },
  });

  // Fetch company data and prefill
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://85.131.248.214:9000/api/fetch/companydata/', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const companyData = res.data;

        // Prefill form fields
        setValue('lastName', companyData.last_name || '');
        setValue('firstName', companyData.first_name || '');
        setValue('companyName', companyData.company_name || companyData.companyName || '');
        setValue('capital', companyData.capital || '');
        const phoneParts = (companyData.phone || '').split('-');
        setValue('phone1', phoneParts[0] || '');
        setValue('phone2', phoneParts[1] || '');
        setValue('phone3', phoneParts[2] || '');
        setValue('email', companyData.email || '');
        setValue('homepage', companyData.url || companyData.homepage || '');

        if (companyData.subscriptions) {
          setValue('subscriptions.messageNews', !!companyData.subscriptions.messageNews);
          setValue('subscriptions.newJobs', !!companyData.subscriptions.newJobs);
          setValue('subscriptions.matchingReport', !!companyData.subscriptions.matchingReport);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [setValue]);

  // Submit updated form data
  const onSubmit: SubmitHandler<FormInputs> = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("認証トークンが見つかりません。再ログインしてください。");
        return;
      }
  
      const phone = `${formData.phone1}-${formData.phone2}-${formData.phone3}`;
  
      const payload = {
        role: "company",
  
        last_name: formData.lastName,
        first_name: formData.firstName,
        company_name: formData.companyName,
        capital: formData.capital,
        phone,
        email_or_id: formData.email,
        url: formData.homepage,
        subscriptions: formData.subscriptions,
      };
  
      await axios.post("http://85.131.248.214:9000/api/save/companyinfo/", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      alert("保存しました！");
    } catch (error) {
      console.error("Error updating data:", error);
      alert("更新に失敗しました");
    }
  };

  return (
    <>
     <h1 className="text-3xl">登録情報の管理設定</h1>
     <h2 className="text-xl mt-4 mb-5">登録した情報を編集できます。</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className=" mx-auto bg-white p-6 rounded shadow-md text-sm text-gray-700"
      >
        <h2 className="text-orange-500 font-bold mb-4 text-base">企業情報</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">氏名</label>
            <input
              {...register('lastName', { required: true })}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="山田"
            />
          </div>
          <div className="mt-6">
            <input
              {...register('firstName', { required: true })}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="太郎"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1">会社名</label>
          <input
            {...register('companyName', { required: true })}
            className="w-full border border-gray-300 rounded px-2 py-1"
            placeholder="会社名を入力してください"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">資本金</label>
          <input
            {...register('capital')}
            className="w-full border border-gray-300 rounded px-2 py-1"
            placeholder="資本金を入力してください"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">電話番号</label>
          <div className="flex gap-2">
            <input
              {...register('phone1')}
              className="w-1/3 border border-gray-300 rounded px-2 py-1"
              placeholder="080"
            />
            <input
              {...register('phone2')}
              className="w-1/3 border border-gray-300 rounded px-2 py-1"
              placeholder="1234"
            />
            <input
              {...register('phone3')}
              className="w-1/3 border border-gray-300 rounded px-2 py-1"
              placeholder="5678"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1">メールアドレス/会員ID</label>
          <input
            {...register('email', {
              required: true,
              pattern: /^\S+@\S+$/i,
            })}
            className="w-full border border-gray-300 rounded px-2 py-1"
            placeholder="sample@gmail.com"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1">会社HP・URL</label>
          <input
            {...register('homepage')}
            className="w-full border border-gray-300 rounded px-2 py-1"
            placeholder="https://www."
          />
        </div>

        <div className="mb-6 p-4 border border-orange-300 rounded bg-orange-50">
          <p className="text-orange-500 font-semibold mb-2 text-sm">メールの配信</p>

          <div className="space-y-2 text-xs text-gray-700">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('subscriptions.messageNews')}
                className="accent-orange-500"
              />
              <span>採用者からのメッセージ受信時にニュースを受け取る</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('subscriptions.newJobs')}
                className="accent-orange-500"
                defaultChecked
              />
              <span>新着募集情報を含めた通知メールを受け取る</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('subscriptions.matchingReport')}
                className="accent-orange-500"
                defaultChecked
              />
              <span>マッチング状況レポート通知メールを受け取る</span>
            </label>
          </div>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded"
          >
            保存する →
          </button>
        </div>
      </form>
    </>
  );
}
