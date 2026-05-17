import React, { useState } from 'react';
import { validateImageFile, uploadToCloudinary } from '../utils/uploadUtils';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [secureUrl, setSecureUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const err = validateImageFile(selected);
    if (err) {
      setValidationError(err);
      setFile(null);
      setPreview('');
      e.target.value = '';
      return;
    }

    setValidationError('');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus('idle');
    setSecureUrl('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      const url = await uploadToCloudinary(file);
      setSecureUrl(url);
      setPreview(url);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-surface shadow-md border rounded-lg p-6 max-w-md w-full mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4 text-center text-primary">Upload Profile Photo</h2>

      <div className="flex flex-col gap-4">
        <div className="p-4 text-center rounded-lg cursor-pointer" style={{ border: '2px dashed var(--border)' }}>
          <label className="cursor-pointer font-medium text-secondary hover:underline" style={{ display: 'block', padding: '1rem' }}>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              style={{ display: 'none' }}
            />
            {file ? file.name : 'Click to select an image'}
          </label>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG ya WebP — max 5MB</p>
        </div>

        {validationError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {validationError}
          </p>
        )}

        {preview && (
          <div className="mt-2 flex flex-col items-center">
            <img
              src={preview}
              alt="Preview"
              className="rounded-lg shadow-sm w-full"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
            />
            {secureUrl && (
              <a href={secureUrl} target="_blank" rel="noreferrer" className="text-xs text-secondary mt-2 underline">
                View uploaded image
              </a>
            )}
          </div>
        )}

        {status === 'success' && <p className="text-sm font-bold text-center text-green-600">Upload completed!</p>}
        {status === 'error' && <p className="text-sm font-bold text-center text-red-600">Upload failed. Please try again.</p>}

        <button
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          className="mt-2 text-white font-bold rounded-md"
          style={{
            backgroundColor: status === 'uploading' ? 'var(--text-light)' : 'var(--primary)',
            padding: '0.75rem',
            border: 'none',
            cursor: (!file || status === 'uploading') ? 'not-allowed' : 'pointer',
            width: '100%',
          }}
        >
          {status === 'uploading' ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>
    </div>
  );
};

export default Upload;
