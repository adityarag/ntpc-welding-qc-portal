import api from '../api/axiosConfig';

export const downloadSecureFile = async (filePath) => {
  try {
    const response = await api.get('/files/download', {
      params: { path: filePath },
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = filePath.split('/').pop() || 'download.pdf';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download file securely:', err);
    throw err;
  }
};
