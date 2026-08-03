import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Building2, Briefcase, Calendar, Pencil, Save, X, AlertCircle, Plus, Tag } from 'lucide-react';

const EMPTY_FORM = {
  phone: '', address: '', dateOfBirth: '', gender: '',
  emergencyContact: '', emergencyPhone: '', bio: '', skills: [],
};

function buildForm(emp) {
  return {
    phone: emp.phone || '',
    address: emp.address || '',
    dateOfBirth: emp.dateOfBirth || '',
    gender: emp.gender || '',
    emergencyContact: emp.emergencyContact || '',
    emergencyPhone: emp.emergencyPhone || '',
    bio: emp.bio || '',
    skills: Array.isArray(emp.skills) ? [...emp.skills] : [],
  };
}

function isProfileIncomplete(emp) {
  return !emp.phone;
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${value ? 'text-gray-800' : 'text-gray-300 italic'}`}>{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

function EditField({ label, field, type, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder || ''}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (!user?.employeeId) { setLoading(false); return; }
    api.get('/employees')
      .then((r) => {
        const emp = r.data.find(e => String(e._id) === String(user.employeeId));
        if (!emp) { setLoading(false); return; }
        setEmployee(emp);
        setForm(buildForm(emp));
        if (isProfileIncomplete(emp)) setEditing(true);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [user?.employeeId]);

  function setField(field, value) {
    setForm(p => ({ ...p, [field]: value }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    if (form.skills.includes(s)) { setSkillInput(''); return; }
    setForm(p => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput('');
  }

  function removeSkill(s) {
    setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));
  }

  async function handleSave() {
    if (!form.phone.trim()) { toast.error('Phone number is required'); return; }
    setSaving(true);
    try {
      const updated = { ...employee, ...form };
      await api.put('/employees/' + employee._id, updated);
      setEmployee(updated);
      setEditing(false);
      toast.success('Profile saved successfully!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading profile…</div>;
  if (!employee) return <div className="text-center text-gray-500 mt-20">No employee profile linked to this account.</div>;

  const incomplete = isProfileIncomplete(employee);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>

      {incomplete && !editing && (
        <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Your profile is incomplete. Please add your phone number.</span>
          <button onClick={() => setEditing(true)} className="ml-auto text-xs font-semibold text-amber-700 underline">Complete Profile</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar / summary card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mb-2">
            <span className="text-3xl font-bold text-white">{employee.name.charAt(0)}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">{employee.name}</h2>
          <p className="text-sm text-gray-500">{employee.designation || '—'}</p>
          <p className="text-xs text-gray-400">{employee.department || '—'}</p>
          <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {employee.status || 'Active'}
          </span>
          {employee.bio && (
            <p className="mt-3 text-xs text-gray-500 italic border-t pt-3 w-full text-left">{employee.bio}</p>
          )}
          {employee.skills && employee.skills.length > 0 && (
            <div className="mt-3 border-t pt-3 w-full text-left">
              <p className="text-xs font-semibold text-gray-400 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {employee.skills.map(s => (
                  <span key={s} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
          {!editing && (
            <button onClick={() => setEditing(true)} className="mt-4 w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl py-2 text-sm font-medium transition">
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>

        {/* Details panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Work info (read-only) */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Work Information</h3>
            <p className="text-xs text-gray-400 mb-4">Managed by HR / Admin</p>
            <InfoRow icon={Mail} label="Email" value={employee.email} />
            <InfoRow icon={Building2} label="Department" value={employee.department} />
            <InfoRow icon={Briefcase} label="Designation" value={employee.designation} />
            <InfoRow icon={Calendar} label="Joining Date" value={employee.joiningDate || employee.joinDate} />
          </div>

          {/* Personal info */}
          {!editing ? (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Personal Details</h3>
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <InfoRow icon={Phone} label="Phone" value={employee.phone} />
              <InfoRow icon={MapPin} label="Address" value={employee.address} />
              <InfoRow icon={Calendar} label="Date of Birth" value={employee.dateOfBirth} />
              <InfoRow icon={Briefcase} label="Gender" value={employee.gender} />
              <InfoRow icon={Phone} label="Emergency Contact" value={employee.emergencyContact ? employee.emergencyContact + (employee.emergencyPhone ? ' — ' + employee.emergencyPhone : '') : ''} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-800">Edit Personal Details</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setForm(buildForm(employee)); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60">
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="Phone Number *" field="phone" placeholder="+91 98765 43210" value={form.phone} onChange={setField} />
                <EditField label="Date of Birth" field="dateOfBirth" type="date" value={form.dateOfBirth} onChange={setField} />
                <div className="sm:col-span-2">
                  <EditField label="Home Address" field="address" placeholder="123 Main St, City, State" value={form.address} onChange={setField} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setField('gender', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select…</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <EditField label="Emergency Contact Name" field="emergencyContact" placeholder="Jane Doe" value={form.emergencyContact} onChange={setField} />
                <EditField label="Emergency Contact Phone" field="emergencyPhone" placeholder="+91 91234 56789" value={form.emergencyPhone} onChange={setField} />
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bio / About Me</label>
                  <textarea
                    value={form.bio}
                    onChange={e => setField('bio', e.target.value)}
                    rows={3}
                    placeholder="Tell us a little about yourself…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Skills</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      placeholder="Type a skill and press Enter or +"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="button" onClick={addSkill} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {form.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.skills.map(s => (
                        <span key={s} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          <Tag className="w-3 h-3" />{s}
                          <button type="button" onClick={() => removeSkill(s)} className="ml-0.5 text-indigo-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
