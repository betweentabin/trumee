import { Controller } from "react-hook-form";
import { TextareaInput as Textarea } from "./input";

const MessageBox = ({
  control,
  errors,
  onSubmit,
  isPending,
}: {
  control: any;
  errors: any;
  onSubmit: () => void;
  isPending: boolean;
}) => {
  return (
    <div className="w-full max-h-[60vh] md:max-h-[400px] flex flex-col bg-white rounded-md shadow-sm">
      <div className="flex flex-col w-full p-4 space-y-3">
        <Controller
          control={control}
          name="message"
          rules={{
            required: "Required",
          }}
          render={({ field: { value, onChange } }) => (
            <Textarea
              value={value}
              onChange={onChange}
              placeholder="入力してください。"
              className="resize-none min-h-[80px] max-h-[150px] w-full px-3 py-2 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-default"
            />
          )}
        />
        <button
          className={`w-full md:w-auto px-6 py-2 rounded-md bg-[#FF733E] text-white font-semibold
            hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
          `}
          disabled={isPending}
          onClick={onSubmit}
          type="button"
        >
          送信
        </button>
      </div>
    </div>
  );
};

export default MessageBox;
