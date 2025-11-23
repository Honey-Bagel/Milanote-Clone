'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, Upload, ZoomIn, ZoomOut } from 'lucide-react';

interface AvatarUploadCropProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (croppedImageBlob: Blob) => Promise<void>;
	currentAvatarUrl?: string | null;
}

export default function AvatarUploadCrop({
	isOpen,
	onClose,
	onSave,
	currentAvatarUrl,
}: AvatarUploadCropProps) {
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);

	const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
		setCroppedAreaPixels(croppedAreaPixels);
	}, []);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		// Validate file size (5MB limit)
		const MAX_SIZE = 5 * 1024 * 1024; // 5MB
		if (file.size > MAX_SIZE) {
			alert('Image must be smaller than 5MB');
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			setImageSrc(reader.result as string);
			setCrop({ x: 0, y: 0 });
			setZoom(1);
		};
		reader.readAsDataURL(file);
	};

	const createImage = (url: string): Promise<HTMLImageElement> =>
		new Promise((resolve, reject) => {
			const image = new Image();
			image.addEventListener('load', () => resolve(image));
			image.addEventListener('error', (error) => reject(error));
			image.src = url;
		});

	const getCroppedImg = async (
		imageSrc: string,
		pixelCrop: Area
	): Promise<Blob> => {
		const image = await createImage(imageSrc);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		// Set canvas size to desired output size (400x400)
		const targetSize = 400;
		canvas.width = targetSize;
		canvas.height = targetSize;

		// Draw circular clipped image
		ctx.beginPath();
		ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.clip();

		// Draw the cropped image
		ctx.drawImage(
			image,
			pixelCrop.x,
			pixelCrop.y,
			pixelCrop.width,
			pixelCrop.height,
			0,
			0,
			targetSize,
			targetSize
		);

		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Canvas is empty'));
					}
				},
				'image/jpeg',
				0.9
			);
		});
	};

	const handleSave = async () => {
		if (!imageSrc || !croppedAreaPixels) return;

		setUploading(true);
		try {
			const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
			await onSave(croppedImage);
			handleClose();
		} catch (error) {
			console.error('Error cropping image:', error);
			alert('Failed to process image. Please try again.');
		} finally {
			setUploading(false);
		}
	};

	const handleClose = () => {
		setImageSrc(null);
		setCrop({ x: 0, y: 0 });
		setZoom(1);
		setCroppedAreaPixels(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
		onClose();
	};

	const handleRemoveAvatar = async () => {
		const confirmed = window.confirm(
			'Are you sure you want to remove your profile picture?'
		);
		if (!confirmed) return;

		setUploading(true);
		try {
			// Pass empty blob to signal removal
			const emptyBlob = new Blob([], { type: 'image/jpeg' });
			await onSave(emptyBlob);
			handleClose();
		} catch (error) {
			console.error('Error removing avatar:', error);
			alert('Failed to remove avatar. Please try again.');
		} finally {
			setUploading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
			<div
				ref={modalRef}
				className="bg-[var(--background)] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
					<h3 className="text-xl font-bold text-[var(--foreground)]">
						{imageSrc ? 'Crop Profile Picture' : 'Upload Profile Picture'}
					</h3>
					<button
						onClick={handleClose}
						disabled={uploading}
						className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{!imageSrc ? (
						<div className="space-y-4">
							<div
								onClick={() => fileInputRef.current?.click()}
								className="border-2 border-dashed border-[var(--border)] rounded-lg p-12 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--card-hover)] transition-all"
							>
								<Upload className="w-12 h-12 mx-auto mb-4 text-[var(--muted)]" />
								<p className="text-[var(--foreground)] font-medium mb-2">
									Click to upload an image
								</p>
								<p className="text-sm text-[var(--muted)]">
									PNG, JPG, GIF up to 5MB
								</p>
							</div>

							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								className="hidden"
							/>

							{currentAvatarUrl && (
								<div className="pt-4 border-t border-[var(--border)]">
									<button
										onClick={handleRemoveAvatar}
										disabled={uploading}
										className="w-full px-4 py-2 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
									>
										Remove Current Avatar
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="space-y-4">
							{/* Crop Area */}
							<div className="relative bg-[var(--secondary)] rounded-lg overflow-hidden" style={{ height: '400px' }}>
								<Cropper
									image={imageSrc}
									crop={crop}
									zoom={zoom}
									aspect={1}
									cropShape="round"
									showGrid={false}
									onCropChange={setCrop}
									onCropComplete={onCropComplete}
									onZoomChange={setZoom}
								/>
							</div>

							{/* Zoom Controls */}
							<div className="flex items-center gap-4 px-2">
								<ZoomOut className="w-5 h-5 text-[var(--muted)]" />
								<input
									type="range"
									min={1}
									max={3}
									step={0.1}
									value={zoom}
									onChange={(e) => setZoom(Number(e.target.value))}
									className="flex-1 accent-[var(--primary)]"
								/>
								<ZoomIn className="w-5 h-5 text-[var(--muted)]" />
							</div>

							<p className="text-sm text-[var(--muted)] text-center">
								Drag to reposition, scroll or use the slider to zoom
							</p>

							{/* Action Buttons */}
							<div className="flex gap-3 pt-2">
								<button
									onClick={() => {
										setImageSrc(null);
										if (fileInputRef.current) {
											fileInputRef.current.value = '';
										}
									}}
									disabled={uploading}
									className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50"
								>
									Choose Different Image
								</button>
								<button
									onClick={handleSave}
									disabled={uploading}
									className="flex-1 px-4 py-2 bg-[var(--primary)] text-[var(--foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								>
									{uploading ? 'Uploading...' : 'Save Avatar'}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
