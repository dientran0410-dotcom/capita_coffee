import { useState } from 'react';
import { Mail, Phone, MapPin, Building, Shield, Save, Edit, Camera } from 'lucide-react';
export function UserProfile() {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: 'John Anderson',
        email: 'john.anderson@capitalcoffee.com',
        phone: '+1 (555) 123-4567',
        role: 'Admin',
        department: 'Operations',
        location: 'New York, NY',
        franchiseId: 'HQ-001',
        permissions: ['Full System Access', 'User Management', 'Financial Reports', 'Compliance Management'],
    });
    const handleSave = () => {
        setIsEditing(false);
        // Mock save - in production, this would update the database
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
        </div>
        <button onClick={() => (isEditing ? handleSave() : setIsEditing(true))} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
          {isEditing ? (<>
              <Save className="w-4 h-4"/>
              Save Changes
            </>) : (<>
              <Edit className="w-4 h-4"/>
              Edit Profile
            </>)}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-white">JA</span>
              </div>
              {isEditing && (<button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50">
                  <Camera className="w-4 h-4 text-gray-600"/>
                </button>)}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">{formData.name}</h2>
            <p className="text-gray-600">{formData.role}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Building className="w-4 h-4"/>
              {formData.department}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400"/>
              <span className="text-gray-600">{formData.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400"/>
              <span className="text-gray-600">{formData.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400"/>
              <span className="text-gray-600">{formData.location}</span>
            </div>
          </div>
        </div>

        {/* Details Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-500"/>
              </div>
            </div>
          </div>

          {/* Franchise Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Franchise Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Franchise ID</label>
                <input type="text" value={formData.franchiseId} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-500">
                  <option>Admin</option>
                  <option>Franchise Owner</option>
                  <option>Supplier</option>
                  <option>Manager</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role Permissions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-amber-600"/>
              <h3 className="text-lg font-semibold text-gray-900">Role Permissions</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {formData.permissions.map((permission, index) => (<div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{permission}</span>
                </div>))}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Last Login</p>
                <p className="text-lg font-semibold text-gray-900">Today, 9:24 AM</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Orders Processed</p>
                <p className="text-lg font-semibold text-gray-900">127 this month</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">Account Since</p>
                <p className="text-lg font-semibold text-gray-900">Jan 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
