import React from 'react';
import adminApi from '../../services/adminApi';
import { imgSrc } from '../../../utils/media';

const ENDPOINT = import.meta.env?.VITE_ADMIN_UPLOAD_ENDPOINT || '/api/admin/uploads';
const CLOUD_PRESET = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export default function BulkImageUploader({
  label = 'Bulk Upload Images',
  value = [],
  onChange,
  folder = '',
  maxFiles = 10
}) {
  const inputId = React.useId();
  const [files, setFiles] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadedUrls, setUploadedUrls] = React.useState(value || []);

  React.useEffect(() => {
    setUploadedUrls(value || []);
  }, [value]);

  const onPick = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + uploadedUrls.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    setFiles(selectedFiles);
  };

  const uploadAll = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file, idx) => {
        formData.append(`files`, file);
      });
      if (folder) formData.append('folder', folder);

      const res = await adminApi.post('/api/admin/uploads/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUrls = res.urls || [];
      const allUrls = [...uploadedUrls, ...newUrls];
      setUploadedUrls(allUrls);
      onChange?.(allUrls);
      setFiles([]);
    } catch (e) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== idx);
    setUploadedUrls(newUrls);
    onChange?.(newUrls);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>

      {/* Upload section */}
      <div className="rounded-lg border border-dashed dark:border-neutral-700 p-4">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          className="sr-only"
        />
        <label htmlFor={inputId} className="cursor-pointer">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-neutral-300">
              Click to select multiple images or drag & drop
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Max {maxFiles} files • Images only
            </div>
          </div>
        </label>

        {files.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-gray-700 dark:text-neutral-300 mb-2">
              {files.length} file(s) selected
            </div>
            <button
              type="button"
              onClick={uploadAll}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload All'}
            </button>
          </div>
        )}
      </div>

      {/* Uploaded images */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Uploaded Images ({uploadedUrls.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {uploadedUrls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={imgSrc(url)}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}