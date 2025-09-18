import Image from "next/image";

interface ImageCardWithBgProps {
    src: string;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    width: number;
    height?: number;
    borderRadius: number;
    alt?: string;
}

const ImageCardWithBg = ({
    src,
    left,
    right,
    top,
    bottom,
    width,
    height,
    borderRadius,
    alt
}: ImageCardWithBgProps) => {
    return (
        <div 
            className="absolute z-20 overflow-hidden"
            style={{
                left: left !== undefined ? `${left}%` : undefined,
                right: right !== undefined ? `${right}%` : undefined,
                top: top !== undefined ? `${top}%` : undefined,
                bottom: bottom !== undefined ? `${bottom}%` : undefined,
                width: `${width}%`,
                height: height ? `${height}%` : undefined,
                aspectRatio: 100 / 129,
                borderRadius: `${borderRadius}px`,
            }}
        >
            <Image
                src={src}
                fill={true}
                alt={alt ?? "image card"}
                className="object-cover"
            />
        </div>
    );
}

export default ImageCardWithBg;
