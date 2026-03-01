import { api } from '@/components/auth/auth-context';

export interface BackupItem {
    file_name: string;
    file_size: string;
    created_at: string;
    download_link: string;
}

export const backupService = {
    /**
     * Get list of all backups
     */
    async getBackups(): Promise<BackupItem[]> {
        const response = await api.get('/backup');
        return response.data;
    },

    /**
     * Trigger a new backup process
     */
    async createBackup(): Promise<{ message: string }> {
        const response = await api.post('/backup');
        return response.data;
    },

    /**
     * Delete a specific backup
     */
    async deleteBackup(fileName: string): Promise<{ message: string }> {
        const response = await api.delete(`/backup/${fileName}`);
        return response.data;
    },

    /**
     * Restore a backup from server file or uploaded file
     */
    async restoreBackup(fileName?: string, file?: File): Promise<{ message: string }> {
        const formData = new FormData();
        if (fileName) {
            formData.append('file_name', fileName);
        }
        if (file) {
            formData.append('file', file);
        }

        const response = await api.post('/backup/restore', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 300000, // 5 minutes timeout for restoration
        });

        return response.data;
    },

    /**
     * Return the direct download URL for a backup
     */
    getDownloadUrl(fileName: string): string {
        return `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/backup/download/${encodeURIComponent(fileName)}`;
    }
};
