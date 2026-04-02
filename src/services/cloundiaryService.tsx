const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadImageToCloudinary = (file: File, onProgress: ((progress: number) => void) | null = null): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            reject(
                new Error(
                    'Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET in .env'
                )
            );
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', 'franchise'); // Optional folder

        const xhr = new XMLHttpRequest();

        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });
        }

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.secure_url);
            } else {
                reject(new Error(`Cloudinary upload failed: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () =>
            reject(new Error('Network error during upload'))
        );
        xhr.addEventListener('abort', () =>
            reject(new Error('Upload aborted'))
        );

        xhr.open(
            'POST',
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
        );

        xhr.send(formData);
    });
};
