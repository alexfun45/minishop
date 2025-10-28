// components/ImageUpload.tsx
import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  existingImageUrl?: string | null;
  label?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageChange,
  existingImageUrl,
  label = 'Изображение',
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingImageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }
    
    setImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setImagePreview(preview);
      onImageChange(file, preview);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageChange(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageChange(null, null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageChange(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setImagePreview(url);
    setImageFile(null);
    onImageChange(null, url);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {imagePreview ? (
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-32 w-32 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {imageFile ? 'Новое изображение' : 'Текущее изображение'}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm text-amber-600 hover:text-amber-500"
            >
              Выбрать другое изображение
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-amber-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600 justify-center">
              <span className="relative cursor-pointer rounded-md font-medium text-amber-600 hover:text-amber-500">
                Загрузите изображение
              </span>
              <p className="pl-1">или перетащите его сюда</p>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF до 5MB
            </p>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept="image/*"
        onChange={handleFileInputChange}
      />
      
      {/* Поле для URL изображения (альтернатива загрузке файла) */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Или укажите URL изображения
        </label>
        <input
          type="url"
          value={imagePreview && !imageFile ? imagePreview : ''}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
        />
      </div>
    </div>
  );
};