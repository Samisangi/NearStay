import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Camera, Lock, User } from 'lucide-react';
import { selectCurrentUser, updateUser } from '../redux/authSlice';
import api from '../api/axiosInstance';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const Profile = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const fileRef = useRef();

  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone },
  });
  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, watch,
    formState: { errors: pwdErrors } } = useForm();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [preview, setPreview] = useState(user?.profilePicture || '');
  const [photoFile, setPhotoFile] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError('Only image files allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Image must be under 2MB');
      return;
    }
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
    setProfileError('');
  };

  const onSubmitProfile = async (data) => {
    setSaving(true);
    setProfileError('');
    try {
      const form = new FormData();
      if (data.name) form.append('name', data.name);
      if (data.phone) form.append('phone', data.phone);
      if (photoFile) form.append('profilePicture', photoFile);

      const res = await api.patch('/users/me', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(updateUser(res.data.user));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitPassword = async (data) => {
    setPwdSaving(true);
    setPwdError('');
    try {
      await api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPwdSaved(true);
      resetPwd();
      setTimeout(() => setPwdSaved(false), 2000);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-10 space-y-10">
      {/* Profile info */}
      <section>
        <h1 className="text-2xl mb-6">Profile</h1>

        {/* Avatar upload */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center overflow-hidden text-2xl font-display">
              {preview
                ? <img src={preview} alt="" className="h-full w-full object-cover" />
                : user?.name?.[0]?.toUpperCase()
              }
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-card"
              aria-label="Change photo"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <Badge variant={user?.role === 'owner' ? 'teal' : 'neutral'} className="capitalize mt-1">
              {user?.role}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
          <Input label="Full name" icon={User} {...register('name')} />
          <Input label="Phone number" {...register('phone')} />
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
            <p className="text-sm text-ink-500 bg-paper-200 rounded-control px-3 py-2.5">{user?.email}</p>
          </div>
          {profileError && <p className="text-sm text-danger-500">{profileError}</p>}
          {saved && <p className="text-sm text-success-500">Profile saved!</p>}
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
        </form>
      </section>

      {/* Change password */}
      <section className="border-t border-paper-200 pt-8">
        <h2 className="text-lg mb-4 flex items-center gap-2"><Lock size={18} />Change password</h2>
        <form onSubmit={handlePwd(onSubmitPassword)} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            icon={Lock}
            error={pwdErrors.currentPassword?.message}
            {...regPwd('currentPassword', { required: 'Required' })}
          />
          <Input
            label="New password"
            type="password"
            icon={Lock}
            error={pwdErrors.newPassword?.message}
            {...regPwd('newPassword', {
              required: 'Required',
              minLength: { value: 8, message: 'At least 8 characters' },
              validate: {
                hasUpper: (v) => /[A-Z]/.test(v) || 'Needs an uppercase letter',
                hasNumber: (v) => /[0-9]/.test(v) || 'Needs a number',
                hasSpecial: (v) => /[^A-Za-z0-9]/.test(v) || 'Needs a special character',
              },
            })}
          />
          <Input
            label="Confirm new password"
            type="password"
            icon={Lock}
            error={pwdErrors.confirm?.message}
            {...regPwd('confirm', {
              required: 'Required',
              validate: (v) => v === watch('newPassword') || 'Passwords do not match',
            })}
          />
          {pwdError && <p className="text-sm text-danger-500">{pwdError}</p>}
          {pwdSaved && <p className="text-sm text-success-500">Password changed!</p>}
          <Button type="submit" variant="secondary" disabled={pwdSaving}>
            {pwdSaving ? 'Changing...' : 'Change password'}
          </Button>
        </form>
      </section>
    </div>
  );
};

export default Profile;