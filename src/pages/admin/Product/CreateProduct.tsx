import { useMemo, useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createProduct, updateProductImage } from '../../../services/productService';
import { getCategories } from '../../../services/categoryService';
import { http } from '../../../api/axios';
import { getAdminFranchises } from '../../../services/franchiseService';
import ImageUploader from '../../../components/product/ImageUploader';

// ===== TYPES =====
interface Ingredient {
    ingredientId: string;
    quantity: number;
}

interface Franchise {
    franchiseId: string;
    franchiseName: string;
}

interface Variant {
    name: string;
    price: string | number;
    default: boolean;
    ingredients: Ingredient[];
}

interface Category {
    id: string;
    name: string;
}

interface IngredientOption {
    id: string;
    name: string;
}

interface FormData {
    name: string;
    description: string;
    categoryId: string;
    imageUrl: string;
    franchiseId: string;
    variants: Variant[];
}

// ===== INIT =====
const makeVariant = (isDefault = false): Variant => ({
    name: '',
    price: '',
    default: isDefault,
    ingredients: [{ ingredientId: '', quantity: 0 }]
});

const CreateProduct: FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const basePath = useMemo(() => {
        return location.pathname.startsWith('/supplier')
            ? '/supplier/products'
            : '/admin/products';
    }, [location.pathname]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
    const [franchises, setFranchises] = useState<Franchise[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        categoryId: '',
        imageUrl: '',
        franchiseId: '',
        variants: [makeVariant(true)]
    });

    // ===== FETCH CATEGORY =====
    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch((err) => {
                setCategories([]);
                console.error("Lỗi tải danh mục:", err);
            });
    }, []);

    // ===== FETCH FRANCHISE ID =====
    useEffect(() => {
        getAdminFranchises()
            .then((res: any) => {
                console.log("Dữ liệu Franchise:", res);
                const data = Array.isArray(res) ? res : (res?.data || []);
                setFranchises(data);
            })
            .catch((err) => {
                console.error(err);
                setFranchises([]);
            });
    }, []);

    // ===== HANDLE INGREDIENT =====
    const handleLoadIngredients = async (idFromParam?: string) => {
        // Nếu vô tình truyền Event vào, idFromParam sẽ là object, ta phải chặn lại
        if (typeof idFromParam === 'object') {
            console.error("Lỗi: Tham số truyền vào phải là String ID, không phải Event Object!");
            return;
        }

        const targetId = idFromParam || formData.franchiseId;

        if (!targetId || targetId === "" || targetId === "undefined" || isFetching) {
            return;
        }

        setIsFetching(true);
        try {
            const res = await http.get(
                `/api/inventory-service/ingredients/franchise/${targetId}`
            );
            // Kiểm tra xem res.data có phải là mảng không, nếu không thì tìm trong res.data.data
            const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);

            console.log("Dữ liệu nguyên liệu nhận được:", rawList);

            setIngredients(
                rawList.map((item: any) => ({
                    id: item.ingredientId || item.id, // Đảm bảo luôn có ID
                    name: item.ingredientName || item.name
                }))
            );
        } catch (err: any) {
            console.error("Lỗi tải nguyên liệu:", err.response?.data || err.message);
        } finally {
            setIsFetching(false);
        }
    };

    // ===== HANDLER =====
    const handleFieldChange = (e: any) => {
        const { name, value } = e.target;

        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'franchiseId') {
            if (value && typeof value === 'string' && value !== "") {
                handleLoadIngredients(value);
            } else {
                setIngredients([]);
            }
        }
    };

    const handleVariantChange = (index: number, field: keyof Variant, value: any) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.map((v, i) =>
                i === index ? { ...v, [field]: value } : v
            )
        }));
    };

    const setDefaultVariant = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.map((v, i) => ({
                ...v,
                default: i === index
            }))
        }));
    };

    const addVariant = () => {
        setFormData((prev) => ({
            ...prev,
            variants: [...prev.variants, makeVariant(false)]
        }));
    };

    const removeVariant = (index: number) => {
        setFormData((prev) => {
            const next = prev.variants.filter((_, i) => i !== index);
            if (!next.some((v) => v.default)) next[0].default = true;
            return { ...prev, variants: next };
        });
    };

    // ===== INGREDIENT HANDLER =====
    const addIngredient = (vIndex: number) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.map((v, i) =>
                i === vIndex
                    ? {
                        ...v,
                        ingredients: [
                            ...v.ingredients,
                            { ingredientId: '', quantity: 0 }
                        ]
                    }
                    : v
            )
        }));
    };

    const updateIngredient = (vIndex: number, iIndex: number, field: any, value: any) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.map((v, i) => {
                if (i !== vIndex) return v;
                return {
                    ...v,
                    ingredients: v.ingredients.map((ing, idx) =>
                        idx === iIndex ? { ...ing, [field]: value } : ing
                    )
                };
            })
        }));
    };

    const removeIngredient = (vIndex: number, iIndex: number) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.map((v, i) =>
                i === vIndex
                    ? {
                        ...v,
                        ingredients: v.ingredients.filter((_, idx) => idx !== iIndex)
                    }
                    : v
            )
        }));
    };

    // ===== VALIDATE =====
    const validate = () => {
        if (!formData.franchiseId) return 'Chọn franchise';
        if (!formData.name.trim()) return 'Tên sản phẩm bắt buộc';
        if (!formData.categoryId) return 'Chọn category';
        if (!formData.variants.length) return 'Cần ít nhất 1 variant';

        for (const v of formData.variants) {
            if (!v.name || Number(v.price) < 0) return 'Variant không hợp lệ';
            // ❌ Bỏ check ingredients — backend có thể không bắt buộc
        }

        return '';
    };

    // ===== SUBMIT =====
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description?.trim() || "",
                categoryId: formData.categoryId,
                imageUrl: (formData.imageUrl?.trim() || "").replace(/^_+|_+$/g, ''),
                variants: formData.variants.map((v) => ({
                    name: v.name.trim() || "Default Size",
                    price: Number(v.price) || 0,
                    isDefault: Boolean(v.default),
                    ingredients: v.ingredients
                        .filter((ing) => ing.ingredientId && ing.ingredientId !== "")
                        .map((ing) => ({
                            ingredientId: ing.ingredientId,
                            quantity: Number(ing.quantity) || 0,
                        })),
                })),
            };

            console.log("SENDING PAYLOAD:", JSON.stringify(payload));

            const created = await createProduct(payload);
            alert('Tạo sản phẩm thành công!');
            navigate(`${basePath}/${created.id}`);

        } catch (err: any) {
            console.error("FULL ERROR OBJECT:", err);

            if (err.response) {
                console.error("SERVER DATA ERROR:", err.response.data);
                console.error("SERVER STATUS:", err.response.status);
                setError(`Server Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
            } else if (err.request) {
                setError("No response from server. Check your network.");
            } else {
                setError(err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Back button */}
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-black"
            >
                <ArrowLeft size={18} />
                Back
            </button>

            {/* Error */}
            {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded">
                    {error}
                </div>
            )}

            {/* STEP 1 */}
            {!formData.franchiseId && (
                <div className="bg-white p-6 rounded-xl shadow space-y-4">
                    <h2 className="text-xl font-semibold">Select Franchise</h2>

                    <select
                        name="franchiseId"
                        value={formData.franchiseId}
                        onChange={handleFieldChange}
                        className="border p-3 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">-- Choose a Franchise --</option>
                        {Array.isArray(franchises) &&
                            franchises.map((f) => (
                                <option key={f.franchiseId} value={f.franchiseId}>
                                    {f.franchiseName}
                                </option>
                            ))}
                    </select>
                </div>
            )}

            {/* STEP 2 */}
            {formData.franchiseId && (
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* BASIC INFO */}
                    <div className="bg-white p-6 rounded-xl shadow space-y-4">
                        <h2 className="text-xl font-semibold">Product Info</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Product Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleFieldChange}
                                className="border p-3 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Tên sản phẩm..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleFieldChange}
                                className="border p-3 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Mô tả sản phẩm..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleFieldChange}
                                className="border p-3 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Select category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <ImageUploader
                            value={formData.imageUrl}
                            onChange={(url) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    imageUrl: url,
                                }))
                            }
                        />
                    </div>

                    {/* VARIANTS */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Variants</h2>

                        {formData.variants.map((v, i) => (
                            <div
                                key={i}
                                className="bg-white p-5 rounded-xl shadow border space-y-4"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h3 className="font-semibold text-blue-600">
                                        Variant #{i + 1}
                                    </h3>

                                    {formData.variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(i)}
                                            className="text-red-500 text-sm hover:underline"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {/* Name + Price */}
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        className="border p-3 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="Variant name (Size M...)"
                                        value={v.name}
                                        onChange={(e) =>
                                            handleVariantChange(i, "name", e.target.value)
                                        }
                                    />

                                    <input
                                        type="number"
                                        className="border p-3 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="Price"
                                        value={v.price}
                                        onChange={(e) =>
                                            handleVariantChange(i, "price", e.target.value)
                                        }
                                    />
                                </div>

                                {/* Default */}
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={v.default}
                                        onChange={() => setDefaultVariant(i)}
                                    />
                                    Default variant
                                </label>

                                {/* INGREDIENTS */}
                                <div className="bg-gray-50 p-4 rounded space-y-3">
                                    <h4 className="font-medium text-sm">
                                        📦 Ingredients
                                    </h4>

                                    {v.ingredients.map((ing, j) => (
                                        <div key={j} className="flex gap-2">
                                            <select
                                                className="flex-1 border p-2 rounded"
                                                value={ing.ingredientId}
                                                onChange={(e) =>
                                                    updateIngredient(
                                                        i,
                                                        j,
                                                        "ingredientId",
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">Select</option>
                                                {ingredients.map((opt) => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-24 border p-2 rounded"
                                                placeholder="Qty"
                                                value={ing.quantity}
                                                onChange={(e) =>
                                                    updateIngredient(
                                                        i,
                                                        j,
                                                        "quantity",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <button
                                                type="button"
                                                onClick={() => removeIngredient(i, j)}
                                                className="text-red-500"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => addIngredient(i)}
                                        className="text-blue-500 text-sm hover:underline"
                                    >
                                        + Add Ingredient
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={addVariant}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                        >
                            + Variant
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Create Product"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateProduct;
