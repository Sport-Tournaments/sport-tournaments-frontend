'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Alert, Loading } from '@/components/ui';
import { registrationService, fileService } from '@/services';
import type { RegistrationDocument, DocumentType } from '@/types';
import { cn } from '@/utils/helpers';

interface DocumentUploadProps {
  registrationId: string;
  documentType: DocumentType;
  existingDocuments?: RegistrationDocument[];
  onUploadSuccess?: (document: RegistrationDocument) => void;
  onDeleteSuccess?: (documentId: string) => void;
  disabled?: boolean;
  className?: string;
}

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({
  registrationId,
  documentType,
  existingDocuments = [],
  onUploadSuccess,
  onDeleteSuccess,
  disabled = false,
  className,
}: DocumentUploadProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Find existing document of this type
  const existingDocument = existingDocuments.find(doc => doc.documentType === documentType);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return t('registration.document.invalidType', 'Invalid file type. Please upload a PDF or image file.');
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('registration.document.tooLarge', 'File is too large. Maximum size is 10MB.');
    }
    return null;
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Show preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      const response = await registrationService.uploadDocument(
        registrationId,
        documentType,
        file
      );

      if (response.data) {
        onUploadSuccess?.(response.data);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || t('registration.document.uploadFailed', 'Failed to upload document'));
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  }, [registrationId, documentType, onUploadSuccess, t]);

  const handleDelete = useCallback(async () => {
    if (!existingDocument) return;

    setDeleting(existingDocument.id);
    setError(null);

    try {
      await registrationService.deleteDocument(registrationId, existingDocument.id);
      onDeleteSuccess?.(existingDocument.id);
      setPreview(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.message || t('registration.document.deleteFailed', 'Failed to delete document'));
    } finally {
      setDeleting(null);
    }
  }, [registrationId, existingDocument, onDeleteSuccess, t]);

  const getDocumentTypeName = (type: DocumentType): string => {
    const names: Record<DocumentType, string> = {
      MEDICAL_DECLARATION: t('registration.document.medicalDeclaration', 'Medical Declaration'),
      PARENTAL_CONSENT: t('registration.document.parentalConsent', 'Parental Consent'),
      INSURANCE: t('registration.document.insurance', 'Insurance Document'),
      ID_DOCUMENT: t('registration.document.idDocument', 'ID Document'),
      OTHER: t('registration.document.other', 'Other Document'),
    };
    return names[type] || type;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <label className="block text-sm font-medium text-gray-900">
        {getDocumentTypeName(documentType)}
      </label>

      {error && (
        <Alert variant="error" className="text-sm">
          {error}
        </Alert>
      )}

      {existingDocument ? (
        // Document already uploaded
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              {existingDocument.mimeType?.startsWith('image/') ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/>
                </svg>
              )}
            </div>
            <div>
              <p className="font-medium text-green-800">
                {existingDocument.fileName}
              </p>
              <p className="text-sm text-green-600">
                {formatFileSize(existingDocument.fileSize)} • {t('registration.document.uploaded', 'Uploaded successfully')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              isLoading={deleting === existingDocument.id}
              disabled={disabled || uploading}
              className="text-red-600 hover:text-red-700"
            >
              {t('common.delete', 'Delete')}
            </Button>
          </div>
        </div>
      ) : (
        // Upload zone
        <div className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-white',
          disabled ? 'border-gray-200 cursor-not-allowed' :
          'border-gray-300 hover:border-primary cursor-pointer'
        )}>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loading size="md" />
              <p className="text-sm text-gray-500">
                {t('registration.document.uploading', 'Uploading...')}
              </p>
            </div>
          ) : preview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={preview} alt="Preview" className="max-h-32 rounded" />
              <p className="text-sm text-gray-500">{t('registration.document.processing', 'Processing...')}</p>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600 mb-1">
                {t('registration.document.dropOrClick', 'Drop file here or click to upload')}
              </p>
              <p className="text-xs text-gray-500">
                {t('registration.document.allowedTypes', 'PDF, JPG, PNG, WebP (max 10MB)')}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
