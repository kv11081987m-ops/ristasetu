import React, { useState } from 'react';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
  const [secureUrl, setSecureUrl] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected)); // local selected preview
      setStatus('idle');
      setSecureUrl('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ristasetu_upload');

    try {
      // Sending POST request to Cloudinary API
      const response = await fetch('https://api.cloudinary.com/v1_1/dhzlmcsbu/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Update state with secure URL
      setSecureUrl(data.secure_url);
      setPreview(data.secure_url); // Switch preview to uploaded remote image URL
      setStatus('success');
      
      console.log('Uploaded successfully! Secure URL:', data.secure_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      setStatus('error');
    }
  };

  return (
    <div className="bg-surface shadow-md border rounded-lg p-6 max-w-md w-full mx-auto mt-6" style={{ margin: '1.5rem auto' }}>
      <h2 className="text-xl font-bold mb-4 text-center text-primary">Upload Profile Photo</h2>
      
      <div className="flex flex-col gap-4">
        {/* Modern styled file input via label wrapping */}
        <div className="p-4 text-center rounded-lg cursor-pointer" style={{ border: '2px dashed var(--border)' }}>
          <label className="cursor-pointer font-medium text-secondary hover:underline" style={{ display: 'block', padding: '1rem' }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              style={{ display: 'none' }}
            />
            {file ? file.name : 'Click anywhere inside to select an image'}
          </label>
        </div>

        {/* Local and securely uploaded Image Preview Array */}
        {preview && (
          <div className="mt-4 flex flex-col items-center">
            <img 
              src={preview} 
              alt="Upload Preview" 
              className="rounded-lg shadow-sm" 
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
            />
            {secureUrl && (
              <a href={secureUrl} target="_blank" rel="noreferrer" className="text-xs text-secondary mt-2 underline">
                View uploaded image
              </a>
            )}
          </div>
        )}

        {/* Status Text Area */}
        {status === 'success' && <p className="text-sm font-bold text-center" style={{ color: '#16A34A' }}>Upload completed!</p>}
        {status === 'error' && <p className="text-sm font-bold text-center" style={{ color: '#DC2626' }}>Upload failed. Watch the console logs and try again.</p>}

        {/* Cloudinary Trigger Button */}
        <button
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          className="mt-2 text-white font-bold rounded-md"
          style={{ 
            backgroundColor: status === 'uploading' ? 'var(--text-light)' : 'var(--primary)', 
            padding: '0.75rem', 
            border: 'none', 
            cursor: (!file || status === 'uploading') ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
            width: '100%'
          }}
        >
          {status === 'uploading' ? 'Uploading...' : 'Upload to Cloudinary'}
        </button>
      </div>
    </div>
  );
};

export default Upload;
