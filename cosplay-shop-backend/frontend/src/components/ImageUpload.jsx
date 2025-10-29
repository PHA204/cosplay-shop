// Path: frontend/src/components/ImageUpload.jsx

import React, { useState } from 'react';
import { Upload, message, Image, Button, Space, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, LoadingOutlined } from '@ant-design/icons';
import api from '../services/api';

const ImageUpload = ({ value = [], onChange, maxCount = 5 }) => {
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // Handle before upload
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Bạn chỉ có thể upload file ảnh!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Ảnh phải nhỏ hơn 5MB!');
      return false;
    }

    return true;
  };

  // Handle upload
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newImages = [...(value || []), response.data.url];
      onChange?.(newImages);
      
      message.success('Upload ảnh thành công!');
      onSuccess(response.data, file);
    } catch (error) {
      message.error(error.response?.data?.error || 'Upload thất bại!');
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle remove
  const handleRemove = (index) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange?.(newImages);
  };

  // Handle preview
  const handlePreview = (url) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {value?.map((url, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              width: 104,
              height: 104,
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <Image
              src={url}
              width={104}
              height={104}
              style={{ objectFit: 'cover' }}
              preview={false}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                opacity: 0,
                transition: 'opacity 0.3s',
              }}
              className="image-hover-overlay"
            >
              <Button
                type="text"
                icon={<EyeOutlined style={{ color: '#fff' }} />}
                onClick={() => handlePreview(url)}
                size="small"
              />
              <Button
                type="text"
                icon={<DeleteOutlined style={{ color: '#fff' }} />}
                onClick={() => handleRemove(index)}
                size="small"
              />
            </div>
          </div>
        ))}

        {(!value || value.length < maxCount) && (
          <Upload
            customRequest={handleUpload}
            beforeUpload={beforeUpload}
            showUploadList={false}
            accept="image/*"
          >
            <div
              style={{
                width: 104,
                height: 104,
                border: '1px dashed #d9d9d9',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.3s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1890ff'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d9d9d9'}
            >
              {loading ? <LoadingOutlined /> : <PlusOutlined />}
              <div style={{ marginTop: 8, fontSize: 12 }}>Upload</div>
            </div>
          </Upload>
        )}
      </div>

      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
        {value?.length || 0}/{maxCount} ảnh
      </div>

      {/* CSS for hover effect */}
      <style>{`
        .image-hover-overlay:hover {
          opacity: 1 !important;
        }
      `}</style>

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <Image src={previewImage} style={{ width: '100%' }} />
      </Modal>
    </>
  );
};

export default ImageUpload;