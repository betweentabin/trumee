

interface StepCardProps {
    stepTitle: string;
    imageSrc: string;
    title: string;
    desc: string;
    showNext: boolean;
}

const StepCard = (
    {
        stepTitle,
        imageSrc,
        title,
        desc,
        showNext
    }: StepCardProps
) => {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="py-1 px-3 bg-[#FF733E] rounded-2xl bg-primary-active text-white text-sm">
                {stepTitle}
            </div>
            <div className="p-4 w-full rounded-xl bg-gray-cool flex flex-col items-center justify-center relative">
                <img src={imageSrc} className="h-24 object-cover" alt="" />
                <div className="absolute -right-6 h-full md:flex flex-col justify-center text-border-gray1 hidden">
                    <svg className="w-4 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            <span className="text-base md:text-lg font-semibold">
                {title}
            </span>
            <span className="text-center text-base font-light">
                {desc}
            </span>
        </div>
    )
}

export default StepCard;