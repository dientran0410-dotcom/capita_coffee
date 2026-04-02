import { useRef, useState, useEffect } from "react";
import type { FC, ChangeEvent, DragEvent } from "react";
import {
    ImagePlus,
    Upload,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { uploadImageToCloudinary } from "../../services/cloundiaryService";

const ACCEPTED_MIME = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
];
const ACCEPTED_EXT = ".jpg,.jpeg,.png,.webp,.gif,.avif";
const MAX_MB = 5;

// ─── Props ───────────────────────────────────────────────────────────────────
export interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    /** Nếu truyền vào, component sẽ gọi callback thay vì tự gọi BE */
    onDelete?: (url: string) => void;
    accentColor?: "orange" | "amber";
    label?: string;
    disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────
const ImageUploader: FC<ImageUploaderProps> = ({
    value,
    onChange,
    onDelete,
    accentColor = "orange",
    label = "Product Image",
    disabled = false,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string>(value);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploadErr, setUploadErr] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [justDone, setJustDone] = useState(false);

    useEffect(() => {
        setPreview(value);
    }, [value]);

    // Accent classes cho 2 màu chủ đề
    const ac =
        accentColor === "amber"
            ? {
                borderHover: "hover:border-amber-400",
                bgHover: "hover:bg-amber-50",
                borderDrag: "border-amber-400",
                bgDrag: "bg-amber-50",
                iconBg: "bg-amber-50",
                icon: "text-amber-500",
                linkText: "text-amber-700",
                badgeBg: "bg-amber-600",
                spinColor: "text-amber-500",
            }
            : {
                borderHover: "hover:border-orange-400",
                bgHover: "hover:bg-orange-50",
                borderDrag: "border-orange-400",
                bgDrag: "bg-orange-50",
                iconBg: "bg-orange-50",
                icon: "text-orange-500",
                linkText: "text-orange-700",
                badgeBg: "bg-orange-600",
                spinColor: "text-orange-500",
            };

    // ── xử lý file được chọn/thả ─────────────────────────────────────────────
    const processFile = async (file: File): Promise<void> => {
        setUploadErr("");
        setJustDone(false);

        if (!ACCEPTED_MIME.includes(file.type)) {
            setUploadErr("Chỉ chấp nhận JPG, PNG, WEBP, GIF hoặc AVIF.");
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            setUploadErr(`Ảnh không được vượt quá ${MAX_MB} MB.`);
            return;
        }

        try {
            setUploading(true);
            const cloudinaryUrl = await uploadImageToCloudinary(file);
            onChange(cloudinaryUrl);
            setPreview(cloudinaryUrl);
            setJustDone(true);
            setTimeout(() => setJustDone(false), 2800);
        } catch (err: any) {
            setUploadErr(err.message || "Upload thất bại.");
            setPreview(value);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) void processFile(file);
        e.target.value = "";
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(false);
        if (busy) return;
        const file = e.dataTransfer.files?.[0];
        if (file) void processFile(file);
    };

    const handleClear = async (): Promise<void> => {
        if (!preview) return;
        setPreview("");
        onChange("");
        setUploadErr("");
        setDeleting(false);
    };

    const busy = uploading || deleting || disabled;

    return (
        <div className="space-y-2.5">
            {/* Label */}
            <label className="block text-sm font-semibold tracking-wide text-gray-700">
                {label}
            </label>

            {/* ── Dropzone ─────────────────────────────────────────────────────── */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!busy) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => !busy && inputRef.current?.click()}
                role="button"
                tabIndex={busy ? -1 : 0}
                onKeyDown={(e) =>
                    e.key === "Enter" && !busy && inputRef.current?.click()
                }
                aria-label="Upload product image"
                className={[
                    "relative flex min-h-52 w-full flex-col items-center justify-center",
                    "overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200",
                    busy ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                    isDragging
                        ? `${ac.borderDrag} ${ac.bgDrag} scale-[1.01] shadow-md`
                        : preview
                            ? "border-gray-200 bg-gray-50"
                            : `border-gray-300 ${ac.borderHover} ${ac.bgHover}`,
                ].join(" ")}
            >
                {/* Có ảnh */}
                {preview && (
                    <>
                        <img
                            src={preview}
                            alt="Product preview"
                            className="h-full max-h-72 w-full object-contain p-3"
                            onError={() => {
                                setPreview("");
                                onChange("");
                            }}
                        />

                        {/* Hover overlay */}
                        {!busy && (
                            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity duration-200 hover:opacity-100">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        inputRef.current?.click();
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-lg transition hover:bg-gray-50"
                                >
                                    <Upload className="h-4 w-4" />
                                    Đổi ảnh
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleClear();
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Xoá ảnh
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Empty state */}
                {!preview && !uploading && (
                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                        <div className={`rounded-2xl ${ac.iconBg} p-4`}>
                            <ImagePlus className={`h-8 w-8 ${ac.icon}`} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-700">
                                Kéo &amp; thả ảnh vào đây
                            </p>
                            <p className="text-xs text-gray-400">
                                hoặc{" "}
                                <span
                                    className={`font-semibold ${ac.linkText} underline underline-offset-2`}
                                >
                                    nhấn để chọn từ thiết bị
                                </span>
                            </p>
                            <p className="mt-1.5 text-[11px] text-gray-400">
                                JPG · PNG · WEBP · GIF · tối đa {MAX_MB} MB
                            </p>
                        </div>
                    </div>
                )}

                {/* Uploading overlay */}
                {uploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90">
                        <div className={`rounded-2xl ${ac.iconBg} p-3`}>
                            <Loader2 className={`h-7 w-7 animate-spin ${ac.spinColor}`} />
                        </div>
                        <p className="text-sm font-semibold text-gray-600">
                            Đang tải ảnh lên…
                        </p>
                        <p className="text-xs text-gray-400">Vui lòng chờ</p>
                    </div>
                )}

                {/* Deleting overlay */}
                {deleting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90">
                        <Loader2 className="h-7 w-7 animate-spin text-red-500" />
                        <p className="text-sm font-semibold text-gray-600">Đang xoá ảnh…</p>
                    </div>
                )}

                {/* Success badge */}
                {justDone && !uploading && (
                    <div
                        className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full ${ac.badgeBg} px-3 py-1 text-xs font-semibold text-white shadow-md`}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Upload thành công
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXT}
                className="hidden"
                onChange={handleFileChange}
                disabled={busy}
                aria-hidden
            />

            {/* URL hiện tại (read-only) */}
            {value && !uploading && (
                <p
                    className="truncate rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 font-mono text-[11px] text-gray-400"
                    title={value}
                >
                    🔗 {value}
                </p>
            )}

            {/* Lỗi */}
            {uploadErr && (
                <p className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {uploadErr}
                </p>
            )}
        </div>
    );
};

export default ImageUploader;
