import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { selectCurrentUser, updateUser } from '../redux/authSlice';
import api from '../api/axiosInstance';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const Profile = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      const res = await api.patch('/users/me', data);
      dispatch(updateUser(res.data.user));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-2xl font-display">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl">{user?.name}</h1>
          <Badge variant={user?.role === 'owner' ? 'teal' : 'neutral'} className="mt-1 capitalize">
            {user?.role}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" {...register('name')} />
        <Input label="Phone number" {...register('phone')} />
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
          <p className="text-sm text-ink-500 bg-paper-200 rounded-control px-3 py-2.5">{user?.email}</p>
        </div>

        {error && <p className="text-sm text-danger-500">{error}</p>}
        {saved && <p className="text-sm text-success-500">Saved!</p>}

        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
      </form>
    </div>
  );
};

export default Profile;