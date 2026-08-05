"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  uploadToCloudinary,
  formatBytes,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_BYTES,
} from "@/lib/cloudinary";
import {
  Upload,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
} from "lucide-react";

// --- Lightbox -----------------------------------------------------------------
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Preview"
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// --- Single Image Uploader ----------------------------------------------------
export interface ImageUploaderProps {
  /** Cloudinary URL of the currently uploaded image (empty string = no image) */
  value: string;
  /** Called when a successful upload completes with the new Cloudinary URL */
  onChange: (url: string) => void;
  /** Called when the user removes the image */
  onRemove: () => void;
  /** Slot index for the label */
  index: number;
  /** Disable the uploader (e.g. while the parent form is submitting) */
  disabled?: boolean;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export function ImageUploader({
  value,
  onChange,
  onRemove,
  index,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>(value ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<string>(value); // local blob or Cloudinary URL
  const [dragging, setDragging] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Sync external value changes (e.g. parent resets the form)
  useEffect(() => {
    if (!value) {
      setState("idle");
      setPreview("");
      setProgress(0);
      setErrorMsg("");
    } else {
      setState("done");
      setPreview(value);
    }
  }, [value]);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate type
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Only image files are accepted.");
        setState("error");
        return;
      }
      // Validate size
      if (file.size > MAX_FILE_BYTES) {
        setErrorMsg(`File too large. Max size is 10 MB (got ${formatBytes(file.size)}).`);
        setState("error");
        return;
      }

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setState("uploading");
      setProgress(0);
      setErrorMsg("");

      try {
        const result = await uploadToCloudinary(file, {
          onProgress: setProgress,
          folder: "nammafit/products",
        });

        URL.revokeObjectURL(objectUrl); // free memory
        setPreview(result.secure_url);
        setState("done");
        onChange(result.secure_url);
      } catch (err: unknown) {
        URL.revokeObjectURL(objectUrl);
        const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
        setErrorMsg(msg);
        setState("error");
        setPreview("");
      }
    },
    [onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after removal
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview("");
    setState("idle");
    setProgress(0);
    setErrorMsg("");
    onRemove();
  };

  // -- Render: image already uploaded ----------------------------------------
  if (state === "done" && preview) {
    return (
      <>
        <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-slate-900 aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={`Product image ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium backdrop-blur transition-colors"
            >
              <Eye size={13} />
              View
            </button>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 text-xs font-medium backdrop-blur transition-colors"
              >
                <X size={13} />
                Remove
              </button>
            )}
          </div>

          {/* "Done" badge */}
          <div className="absolute top-2 left-2">
            <CheckCircle2 size={16} className="text-emerald-400 drop-shadow-md" />
          </div>
          {/* Index label */}
          <div className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded-md bg-black/60 text-slate-300 backdrop-blur">
            #{index + 1}
          </div>
        </div>

        {lightboxOpen && (
          <Lightbox src={preview} onClose={() => setLightboxOpen(false)} />
        )}
      </>
    );
  }

  // -- Render: uploading ----------------------------------------------------
  if (state === "uploading" && preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-indigo-500/40 bg-slate-900 aspect-square flex flex-col items-center justify-center gap-2 p-3">
        {/* Blurred preview in background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30"
        />
        <div className="relative z-10 flex flex-col items-center gap-2 w-full px-3">
          <Loader2 size={22} className="text-indigo-400 animate-spin" />
          <p className="text-xs text-slate-300 font-medium">Uploading…</p>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">{progress}%</p>
        </div>
      </div>
    );
  }

  // -- Render: error --------------------------------------------------------
  if (state === "error") {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 aspect-square flex flex-col items-center justify-center gap-2 p-3 text-center">
        <AlertCircle size={22} className="text-rose-400 flex-shrink-0" />
        <p className="text-[11px] text-rose-400 leading-snug">{errorMsg}</p>
        <button
          type="button"
          onClick={() => { setState("idle"); setErrorMsg(""); }}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // -- Render: idle / dropzone -----------------------------------------------
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer group
        ${dragging
          ? "border-indigo-400 bg-indigo-500/10 scale-[1.02]"
          : "border-white/15 bg-white/3 hover:border-indigo-500/50 hover:bg-indigo-500/5"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      aria-label={`Upload image ${index + 1}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
        ${dragging ? "bg-indigo-500/20" : "bg-white/5 group-hover:bg-indigo-500/10"}`}
      >
        <Upload size={18} className={`transition-colors ${dragging ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-400"}`} />
      </div>
      <div className="text-center px-2">
        <p className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
          {dragging ? "Drop to upload" : "Click or drag"}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">JPG, PNG, WebP · max 10 MB</p>
      </div>
      <p className="text-[10px] text-slate-700">Image {index + 1}</p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
      />
    </button>
  );
}

// --- Multi-Image Manager ------------------------------------------------------
export interface MultiImageManagerProps {
  /** Array of current image URLs (Cloudinary links) */
  images: { image_url: string }[];
  onChange: (images: { image_url: string }[]) => void;
  disabled?: boolean;
  /** Max number of images allowed (default: 8) */
  max?: number;
}

export function MultiImageManager({
  images,
  onChange,
  disabled = false,
  max = 8,
}: MultiImageManagerProps) {
  const updateAt = (idx: number, url: string) => {
    const next = [...images];
    next[idx] = { image_url: url };
    onChange(next);
  };

  const removeAt = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const addSlot = () => {
    if (images.length >= max) return;
    onChange([...images, { image_url: "" }]);
  };

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="label-text">Product Images</span>
        <span className="text-[11px] text-slate-600">
          {images.filter(i => i.image_url).length}/{max} uploaded
        </span>
      </div>

      {/* Upload grid */}
      <div className="grid grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <ImageUploader
            key={idx}
            index={idx}
            value={img.image_url}
            onChange={(url) => updateAt(idx, url)}
            onRemove={() => removeAt(idx)}
            disabled={disabled}
          />
        ))}

        {/* "Add image" slot */}
        {images.length < max && (
          <button
            type="button"
            disabled={disabled}
            onClick={addSlot}
            className="aspect-square rounded-xl border-2 border-dashed border-white/8 bg-white/2 flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add another image"
          >
            <ImageIcon size={16} />
            <span className="text-[10px] font-medium">Add more</span>
          </button>
        )}
      </div>

      {/* Helper note */}
      <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-indigo-500/50 flex-shrink-0" />
        Images are uploaded to Cloudinary and the URL is saved automatically.
      </p>
    </div>
  );
}
