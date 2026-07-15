import api from './axiosInstance';

export const getMyProfile = () => api.get('/api/users/me');

export const updateMyProfile = (data) => api.put('/api/users/me', data);

export const uploadProfileImage = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/users/me/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
