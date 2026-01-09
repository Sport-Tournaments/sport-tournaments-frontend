// UI Components barrel export
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Select } from './Select';
export type { SelectProps } from './Select';

export { default as Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

export { default as Alert } from './Alert';
export type { AlertProps } from './Alert';

export { default as Loading, Spinner, LoadingState, LoadingOverlay, Skeleton, SkeletonCard, SkeletonTable } from './Loading';
export type { SpinnerProps, LoadingOverlayProps, LoadingStateProps, SkeletonProps } from './Loading';

export { default as Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

export { default as Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { default as Dropdown } from './Dropdown';
export type { DropdownProps, DropdownItemType } from './Dropdown';

export { default as Tabs } from './Tabs';
export type { TabsProps, Tab } from './Tabs';

export { default as Toast, ToastContainer } from './Toast';
export type { ToastProps, ToastContainerProps, ToastType } from './Toast';

export { default as FileUpload, FilePreview } from './FileUpload';
export type { FileUploadProps, FilePreviewProps } from './FileUpload';

export { default as DataTable, createSelectionColumn } from './Table';
export type { DataTableProps } from './Table';

// New components for API updates
export { default as ColorPicker } from './ColorPicker';
export { ColorCombinationPicker } from './ColorCombinationPicker';
export { ClubColorBadge, ClubColorStripes } from './ClubColorBadge';
export { ClubColorBanner } from './ClubColorBanner';
export type { ColorPickerProps } from './ColorPicker';

export { default as LocationAutocomplete } from './LocationAutocomplete';
export type { LocationAutocompleteProps } from './LocationAutocomplete';

export { default as InvitationCodeManager } from './InvitationCodeManager';
export type { InvitationCodeManagerProps } from './InvitationCodeManager';

export { RegistrationReviewCard, BulkRegistrationReview } from './RegistrationReview';
export type { RegistrationReviewProps, BulkRegistrationReviewProps } from './RegistrationReview';

export { default as GeolocationFilter, GeolocationFilterCompact } from './GeolocationFilter';
export type { GeolocationFilterProps, GeolocationFilterCompactProps } from './GeolocationFilter';

export { default as AgeGroupsManager } from './AgeGroupsManager';
export type { AgeGroupFormData } from './AgeGroupsManager';
