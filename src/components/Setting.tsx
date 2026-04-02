import { useState } from 'react';
import { Cog, User, Shield, Mail, Save } from 'lucide-react';

export function Settings() {
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState({
        emailNotifications: true,
        twoFactor: false,
        displayName: 'John Doe',
    });

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 900);
    };


    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Update account and preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
          <Save className="w-4 h-4"/>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400"/>
                <input id="display-name" type="text" value={prefs.displayName} onChange={(e) => setPrefs({ ...prefs, displayName: e.target.value })} className="w-full px-3 py-2 border rounded-lg"/>
              </div>
            </div>

            <div>
              <label htmlFor="account-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400"/>
                <input id="account-email" type="email" defaultValue="john.doe@example.com" className="w-full px-3 py-2 border rounded-lg"/>
              </div>
            </div>

            <div>
              <label htmlFor="two-factor" className="block text-sm font-medium text-gray-700 mb-1">Two-factor authentication</label>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400"/>
                <label className="flex items-center gap-2" htmlFor="two-factor">
                  <input id="two-factor" type="checkbox" checked={prefs.twoFactor} onChange={(e) => setPrefs({ ...prefs, twoFactor: e.target.checked })}/>
                  <span className="text-sm">Enable 2FA</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cog className="w-5 h-5 text-gray-400"/>
                <div>
                  <p className="text-sm font-medium">Email notifications</p>
                  <p className="text-xs text-gray-500">Receive updates by email</p>
                </div>
              </div>
              <input type="checkbox" checked={prefs.emailNotifications} onChange={(e) => setPrefs({ ...prefs, emailNotifications: e.target.checked })}/>
            </div>


          </div>
        </div>
      </div>
    </div>);
}
