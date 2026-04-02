import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Activity, Loader } from 'lucide-react';
import { getSupplierById, updateSupplier } from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import './SupplierForm.css';

// Interface cho form update
interface UpdateSupplierFormData {
    name: string;
    contactEmail: string;
    phone: string;
    region: string;
    materialType: string;
    taxCode: string;
    address: string;
    status: string;
}

export default function UpdateSupplier() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const actionUser = currentUser?.username ?? 'admin_user';

    const [loading, setLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [successMsg, setSuccessMsg] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');

    const [formData, setFormData] = useState<UpdateSupplierFormData>({
        name: '',
        contactEmail: '',
        phone: '',
        region: '',
        materialType: '',
        taxCode: '',
        address: '',
        status: ''
    });

    useEffect(() => {
        const fetchSupplier = async () => {
            if (!id) return;
            try {
                const data = await getSupplierById(id);
                setFormData({
                    name: data.name || '',
                    contactEmail: data.contactEmail || '',
                    phone: data.phone || '',
                    region: data.region || '',
                    materialType: data.materialType || '',
                    taxCode: data.taxCode || '',
                    address: data.address || '',
                    status: data.status || ''
                });
            } catch (err) {
                setErrorMsg('❌ Failed to load supplier data');
                console.error('Fetch supplier failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSupplier();
    }, [id]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!id) return;
        
        setSuccessMsg('');
        setErrorMsg('');
        setIsSubmitting(true);

        const payload = {
            name: formData.name,
            contactEmail: formData.contactEmail,
            phone: formData.phone,
            region: formData.region,
            materialType: formData.materialType,
            address: formData.address
        };

        try {
            await updateSupplier(id, payload, actionUser);
            setSuccessMsg('✅ Supplier updated successfully');
            setTimeout(() => {
                navigate(`/admin/suppliers`);
            }, 500);

        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : '❌ Update supplier failed');
            setIsSubmitting(false); // Chỉ mở lại nút nếu lưu thất bại
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) {
        return (
            <div className="supplier-form-loading">
                <Loader size={30} className="supplier-spin" />
                <p>Loading supplier data...</p>
            </div>
        );
    }

    const statusClass =
        formData.status === 'APPROVED'
            ? 'status-approved'
            : formData.status === 'PENDING'
            ? 'status-pending'
            : formData.status === 'SUSPENDED'
            ? 'status-suspended'
            : formData.status === 'REJECTED'
            ? 'status-rejected'
            : 'status-default';

    return (
        <div className="supplier-form-page">
            <div className="supplier-form-header">
                <Link
                    to={`/admin/suppliers`}
                    className="supplier-form-back-btn"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div className="supplier-form-title-wrap">
                    <h1 className="supplier-form-title">Update Supplier</h1>
                    <p className="supplier-form-subtitle">Edit supplier information</p>
                </div>
            </div>

            {successMsg && (
                <div className="supplier-alert supplier-alert-success">
                    {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="supplier-alert supplier-alert-error">
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="supplier-form-card">
                <div className="supplier-form-body">
                    <div className="supplier-form-section">
                        <h3 className="supplier-form-section-title">Basic Information</h3>
                        <div className="supplier-form-grid supplier-form-grid-two">
                            <div className="supplier-form-col-span-2">
                                <label className="supplier-form-label">Supplier Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                    className="supplier-input"
                                />
                            </div>

                            <div>
                                <label className="supplier-form-label">Email</label>
                                <input
                                    name="contactEmail"
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                    className="supplier-input"
                                />
                            </div>

                            <div>
                                <label className="supplier-form-label">Phone</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="supplier-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="supplier-form-section">
                        <h3 className="supplier-form-section-title">Business Info</h3>
                        <div className="supplier-form-grid supplier-form-grid-two">
                            <div>
                                <label className="supplier-form-label">Region</label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="supplier-input supplier-select"
                                >
                                    <option value="ASIA">Asia</option>
                                    <option value="EUROPE">Europe</option>
                                    <option value="NORTH_AMERICA">North America</option>
                                    <option value="SOUTH_AMERICA">South America</option>
                                    <option value="AFRICA">Africa</option>
                                    <option value="OCEANIA">Oceania</option>
                                </select>
                            </div>

                            <div>
                                <label className="supplier-form-label">Material Type</label>
                                <input
                                    name="materialType"
                                    value={formData.materialType}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="supplier-input"
                                />
                            </div>

                            <div>
                                <label className="supplier-form-label">Tax Code</label>
                                <input
                                    name="taxCode"
                                    value={formData.taxCode}
                                    readOnly
                                    className="supplier-input supplier-input-readonly"
                                />
                            </div>

                            <div className="supplier-form-col-span-2">
                                <label className="supplier-form-label">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={3}
                                    disabled={isSubmitting}
                                    className="supplier-textarea"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="supplier-form-section">
                        <h3 className="supplier-form-section-title">Account Status</h3>
                        <div className="supplier-status-wrap">
                            <Activity size={16} className="supplier-status-icon" />
                            <input
                                value={formData.status}
                                readOnly
                                className={`supplier-input supplier-input-readonly supplier-status-input ${statusClass}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="supplier-form-footer">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => navigate(`/admin/suppliers/${id}`)}
                        className="supplier-btn supplier-btn-secondary"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="supplier-btn supplier-btn-primary"
                    >
                        {isSubmitting ? (
                            <Loader size={16} className="supplier-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}