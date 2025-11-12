import React, { useState, useCallback, useRef } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  compact?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  }, [onImageUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (compact) {
      return (
          <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleChange}
              />
              <button
                onClick={onButtonClick}
                className="px-4 py-2 bg-[#44A0D1] dark:bg-[#54C1FB] text-white font-semibold rounded-lg shadow-md hover:bg-[#44A0D1]/90 dark:hover:bg-[#54C1FB]/90 focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] focus:ring-opacity-75 transition-transform transform hover:scale-105 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Add Image
            </button>
          </div>
      )
  }

  return (
    <div
      className={`text-center bg-[#CED2D9]/50 dark:bg-[#464D56]/50 rounded-xl border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-[#44A0D1] dark:border-[#54C1FB] bg-[#CED2D9]' : 'border-[#464D56] dark:border-[#CED2D9]'} p-8 md:p-12`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className={`text-[#464D56] dark:text-[#CED2D9] mb-4 h-16 w-16`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-[#464D56] dark:text-[#CED2D9] mb-2">Drag and drop an image here</p>
        <p className="text-[#212428] dark:text-[#E0E5EC] text-sm mb-4">or</p>
        <button
          onClick={onButtonClick}
          className="px-6 py-2 bg-[#44A0D1] dark:bg-[#54C1FB] text-white font-semibold rounded-lg shadow-md hover:bg-[#44A0D1]/90 dark:hover:bg-[#54C1FB]/90 focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] focus:ring-opacity-75 transition-transform transform hover:scale-105"
        >
          Browse File
        </button>
        <p className="text-xs text-[#464D56] dark:text-[#CED2D9] mt-4">PNG, JPG, WEBP accepted</p>
      </div>
    </div>
  );
};