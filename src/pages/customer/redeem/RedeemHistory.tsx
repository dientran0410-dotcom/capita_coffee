import { useEffect, useMemo, useState } from "react";
import { toDataURL } from "qrcode";
import {
	ChevronLeft,
	ChevronRight,
	Filter,
	QrCode,
	Search,
	TrendingUp,
	X,
} from "lucide-react";
import { getMyRedemptionHistory } from "../../../services/redemptionService";
import type { CustomerRedemptionResponse } from "../../../types/redemption";

type RedeemStatus =
	| "COMPLETED"
	| "PENDING"
	| "REJECTED"
	| "EXPIRED"
	| "CANCELLED"
	| "CLAIMED"
	| "USED"
	| "DELIVERED"
	| "SHIPPED"
	| "UNKNOWN";

interface RedeemRecord {
	id: string;
	rewardId: number;
	promotionId: number | null;
	reward: string;
	promotion: string;
	code: string;
	points: number;
	createdAt: string;
	expirationDate: string | null;
	qrImage: string | null;
	redeemedAt: string;
	expiresText: string;
	status: RedeemStatus;
	disabled?: boolean;
}

const statusClasses: Record<RedeemStatus, string> = {
	COMPLETED: "bg-emerald-100 text-emerald-700",
	PENDING: "bg-amber-100 text-amber-700",
	REJECTED: "bg-rose-100 text-rose-700",
	EXPIRED: "bg-zinc-100 text-zinc-500",
	CANCELLED: "bg-zinc-200 text-zinc-600",
	CLAIMED: "bg-emerald-100 text-emerald-700",
	USED: "bg-blue-100 text-blue-700",
	DELIVERED: "bg-cyan-100 text-cyan-700",
	SHIPPED: "bg-violet-100 text-violet-700",
	UNKNOWN: "bg-zinc-200 text-zinc-600",
};

const toUiStatus = (value: string | null | undefined): RedeemStatus => {
	const normalized = (value || "").toUpperCase();
	if (normalized in statusClasses) {
		return normalized as RedeemStatus;
	}
	return "UNKNOWN";
};

const formatDate = (value: string | null | undefined) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	});
};

const mapResponseToRecord = (item: CustomerRedemptionResponse): RedeemRecord => {
	const status = toUiStatus(item.status);
	return {
		id: String(item.id),
		rewardId: item.rewardId,
		promotionId: item.promotionId,
		reward: `Reward #${item.rewardId}`,
		promotion: item.promotionId ? `Promotion #${item.promotionId}` : "No promotion",
		code: item.redemptionCode || `RD-${item.id}`,
		points: item.pointsUsed || 0,
		createdAt: item.creationDate,
		expirationDate: item.expirationDate,
		qrImage: item.qrImage,
		redeemedAt: formatDate(item.creationDate),
		expiresText: item.expirationDate ? `Expires: ${formatDate(item.expirationDate)}` : "No expiration",
		status,
		disabled: status === "EXPIRED" || status === "CANCELLED",
	};
};

const normalizeQrImage = (raw: string | null | undefined) => {
	if (!raw) return null;
	const value = raw.trim();
	if (!value) return null;
	if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) {
		return value;
	}
	// Some backends return bare base64; strip whitespace before composing a valid data URL.
	return `data:image/png;base64,${value.replace(/\s+/g, "")}`;
};

const RedeemHistory = () => {
	const [records, setRecords] = useState<RedeemRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRecord, setSelectedRecord] = useState<RedeemRecord | null>(null);
	const [generatedQr, setGeneratedQr] = useState<string | null>(null);
	const [useServerQr, setUseServerQr] = useState(true);

	useEffect(() => {
		const fetchMyHistory = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getMyRedemptionHistory();
				const list = Array.isArray(data) ? data : [];
				setRecords(list.map(mapResponseToRecord));
			} catch (err) {
				console.error("Failed to fetch customer redemption history", err);
				setError("Cannot load redeem history right now.");
			} finally {
				setLoading(false);
			}
		};

		fetchMyHistory();
	}, []);

	const filteredRecords = useMemo(() => {
		const keyword = searchQuery.trim().toLowerCase();
		if (!keyword) {
			return records;
		}
		return records.filter((record) => {
			return (
				record.code.toLowerCase().includes(keyword) ||
				record.reward.toLowerCase().includes(keyword) ||
				record.promotion.toLowerCase().includes(keyword) ||
				record.status.toLowerCase().includes(keyword)
			);
		});
	}, [records, searchQuery]);

	const totalRedeemed = records.length;
	const lifetimePointsUsed = records.reduce((sum, record) => sum + record.points, 0);
	const thisMonth = new Date();
	const monthlyRedeemed = records.filter((record) => {
		const parsed = new Date(record.createdAt);
		if (Number.isNaN(parsed.getTime())) {
			return false;
		}
		return parsed.getMonth() === thisMonth.getMonth() && parsed.getFullYear() === thisMonth.getFullYear();
	}).length;

	useEffect(() => {
		if (!selectedRecord) {
			setGeneratedQr(null);
			setUseServerQr(true);
			return;
		}

		setUseServerQr(true);
		let isMounted = true;
		const generateQr = async () => {
			try {
				const qr = await toDataURL(selectedRecord.code, {
					width: 320,
					margin: 1,
					color: {
						dark: "#111827",
						light: "#FFFFFF",
					},
				});
				if (isMounted) {
					setGeneratedQr(qr);
				}
			} catch {
				if (isMounted) {
					setGeneratedQr(null);
				}
			}
		};

		void generateQr();
		return () => {
			isMounted = false;
		};
	}, [selectedRecord]);

	return (
		<div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] antialiased">
			<div className="mx-auto w-full max-w-7xl p-8">
				<header className="mb-6 rounded-2xl bg-white px-8 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
					<h2 className="text-2xl font-bold tracking-tight text-zinc-900">Redeem History</h2>
					<p className="mt-1 text-sm text-[#6e7a71]">Track your points redemptions and reward statuses.</p>
				</header>

				<div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
					<div className="flex aspect-video flex-col justify-between rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,107,71,0.03)] md:aspect-auto">
						<div>
							<p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#3e4942]">Total Redeemed</p>
							<h3 className="text-4xl font-extrabold tracking-tighter">{totalRedeemed}</h3>
						</div>
						<div className="flex items-center text-sm font-medium text-[#006b47]">
							<TrendingUp size={16} className="mr-1" />
							<span>+{monthlyRedeemed} this month</span>
						</div>
					</div>

					<div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,107,71,0.03)]">
						<div>
							<p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#3e4942]">Lifetime Points Used</p>
							<h3 className="text-4xl font-extrabold tracking-tighter">{lifetimePointsUsed.toLocaleString()}</h3>
						</div>
						<div className="text-xs font-medium text-[#3e4942]">Based on your redemption history</div>
					</div>

				</div>

				<div className="overflow-hidden rounded-[24px] border border-[#bdcac0]/30 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
					<div className="flex flex-col justify-between gap-4 border-b border-[#edeeef] px-8 py-6 md:flex-row md:items-center">
						<div>
							<h3 className="text-xl font-bold tracking-tight text-[#191c1d]">Detailed Records</h3>
							<p className="text-sm text-[#3e4942]">Manage and track your coffee shop rewards</p>
						</div>
						<div className="flex items-center gap-3">
							<div className="relative">
								<Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7a71]" />
								<input
									type="text"
									placeholder="Search codes..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-xl bg-[#f3f4f5] py-2 pl-10 pr-4 text-sm outline-none ring-0 placeholder:text-[#6e7a71] focus:ring-2 focus:ring-[#006b47]/20 md:w-64"
								/>
							</div>
							<button type="button" className="rounded-xl bg-[#f3f4f5] p-2 text-[#3e4942] transition-colors hover:text-[#006b47]" aria-label="Filter records">
								<Filter size={18} />
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left">
							<thead>
								<tr className="bg-[#f3f4f5]/60">
									<th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-[#3e4942]">Reward & Promotion</th>
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#3e4942]">Redemption Code</th>
									<th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-[#3e4942]">Points</th>
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#3e4942]">Dates</th>
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#3e4942]">Status</th>
									<th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-widest text-[#3e4942]">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#edeeef]">
								{loading && (
									<tr>
										<td colSpan={6} className="px-8 py-8 text-center text-sm text-[#6e7a71]">
											Loading redeem history...
										</td>
									</tr>
								)}
								{!loading && error && (
									<tr>
										<td colSpan={6} className="px-8 py-8 text-center text-sm text-rose-600">
											{error}
										</td>
									</tr>
								)}
								{!loading && !error && filteredRecords.length === 0 && (
									<tr>
										<td colSpan={6} className="px-8 py-8 text-center text-sm text-[#6e7a71]">
											No redemption records found.
										</td>
									</tr>
								)}
								{!loading &&
									!error &&
									filteredRecords.map((record) => (
									<tr
										key={record.id}
										className={`group transition-colors hover:bg-[#f3f4f5]/40 ${record.disabled ? "opacity-60" : ""}`}
									>
										<td className="px-8 py-6">
											<div>
												<p className="font-bold text-[#191c1d] transition-colors group-hover:text-[#006b47]">{record.reward}</p>
												<p className="text-xs text-[#3e4942]">{record.promotion}</p>
											</div>
										</td>
										<td className="px-6 py-6">
											<span className={`rounded px-2 py-1 font-mono text-sm ${record.disabled ? "bg-[#edeeef] text-zinc-400" : "bg-[#edeeef] text-[#3e4942]"}`}>
												{record.code}
											</span>
										</td>
										<td className="px-6 py-6 text-center">
											<span className={`font-bold ${record.disabled ? "text-zinc-400" : "text-[#191c1d]"}`}>{record.points}</span>
										</td>
										<td className="px-6 py-6">
											<p className={`text-xs font-medium ${record.disabled ? "text-zinc-400" : "text-[#191c1d]"}`}>{record.redeemedAt}</p>
											<p className={`text-[10px] ${record.status === "REJECTED" ? "font-medium text-rose-600" : record.disabled ? "text-zinc-400" : "text-[#3e4942]"}`}>
												{record.expiresText}
											</p>
										</td>
										<td className="px-6 py-6">
											<span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClasses[record.status]}`}>
												{record.status}
											</span>
										</td>
										<td className="px-8 py-6 text-right">
											<button
												type="button"
												className={`text-sm font-bold ${record.disabled ? "text-zinc-500" : "text-[#006b47] hover:underline"}`}
												onClick={() => setSelectedRecord(record)}
											>
												Details
											</button>
										</td>
									</tr>
									))}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-between border-t border-[#edeeef] px-8 py-4">
						<p className="text-xs font-medium text-[#3e4942]">Showing {filteredRecords.length} of {records.length} records</p>
						<div className="flex items-center gap-2">
							<button type="button" disabled className="p-2 text-[#3e4942] opacity-30" aria-label="Previous page">
								<ChevronLeft size={16} />
							</button>
							<button type="button" className="h-8 w-8 rounded-lg bg-[#006b47] text-xs font-bold text-white">1</button>
							<button type="button" className="h-8 w-8 rounded-lg text-xs font-bold text-[#3e4942] hover:bg-[#f3f4f5]">2</button>
							<button type="button" className="h-8 w-8 rounded-lg text-xs font-bold text-[#3e4942] hover:bg-[#f3f4f5]">3</button>
							<button type="button" className="p-2 text-[#3e4942] transition-colors hover:text-[#006b47]" aria-label="Next page">
								<ChevronRight size={16} />
							</button>
						</div>
					</div>
				</div>

				{selectedRecord && (
					<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/20 p-6 backdrop-blur-sm">
						<div
							className={`relative w-full overflow-hidden rounded-xl bg-white shadow-[0_20px_40px_rgba(25,28,28,0.06)] ${
								selectedRecord.status === "COMPLETED" ? "max-w-2xl" : "max-w-4xl"
							}`}
						>
							<button
								type="button"
								onClick={() => setSelectedRecord(null)}
								className="absolute right-6 top-6 z-10 rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
								aria-label="Close details"
							>
								<X size={22} />
							</button>

							<div className="flex flex-col md:flex-row">
								{selectedRecord.status !== "COMPLETED" && (
									<div className="flex items-center justify-center border-r border-zinc-200/50 bg-zinc-100 p-12 md:w-1/2">
									<div className="w-full max-w-[280px]">
										<div className="aspect-square rounded-xl bg-white p-6 shadow-sm">
											<div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-[12px] border-emerald-900/5">
												<img
													src={(useServerQr ? normalizeQrImage(selectedRecord.qrImage) : null) || generatedQr || ""}
													alt={`QR ${selectedRecord.code}`}
													className="h-full w-full object-contain p-2"
													onError={() => setUseServerQr(false)}
												/>
											</div>
										</div>

										<div className="mt-10 text-center">
											<span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${statusClasses[selectedRecord.status]}`}>
												<QrCode size={14} />
												Status: {selectedRecord.status}
											</span>
											<p className="mt-4 text-sm font-medium tracking-wide text-zinc-600">Scan at any Capital Coffee location</p>
										</div>
									</div>
									</div>
								)}

								<div className={`flex flex-col justify-between bg-white p-12 ${selectedRecord.status === "COMPLETED" ? "w-full" : "md:w-1/2"}`}>
									<div>
										<header className="mb-12">
											<p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#006b47]">Member Exclusive</p>
											<h3 className="text-4xl font-extrabold leading-tight tracking-tighter text-zinc-900 md:text-5xl">{selectedRecord.reward}</h3>
											<div className="mt-4 h-1 w-12 bg-[#006b47]" />
										</header>

										<div className="space-y-8">
											<div className="flex items-start justify-between">
												<div>
													<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Promotion Status</p>
													<p className="font-semibold text-zinc-800">{selectedRecord.promotion}</p>
												</div>
											</div>

											<div>
												<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Points Used</p>
												<div className="flex items-center gap-2">
													<span className="text-3xl font-extrabold text-[#006b47]">{selectedRecord.points.toLocaleString()}</span>
													<span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">PTS</span>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-8 border-t border-zinc-200/70 pt-4">
												<div>
													<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Redeemed Date</p>
													<p className="font-medium text-zinc-700">{formatDate(selectedRecord.createdAt)}</p>
												</div>
												<div>
													<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Expiration</p>
													<p className="font-medium italic text-zinc-700">
														{selectedRecord.expirationDate ? formatDate(selectedRecord.expirationDate) : "No expiration"}
													</p>
												</div>
											</div>
										</div>
									</div>

									<div className="mt-16" />
								</div>
							</div>
						</div>
						{selectedRecord.status === "COMPLETED" && (
							<div className="mt-4 flex justify-center">
								<span className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${statusClasses[selectedRecord.status]}`}>
									Status: {selectedRecord.status}
								</span>
							</div>
						)}
					</div>
				)}

				<footer className="mt-8 flex w-full items-center justify-center bg-zinc-50 py-8">
					<div className="text-xs font-medium uppercase tracking-widest text-zinc-400">© 2026 Capital Coffee</div>
				</footer>
			</div>
		</div>
	);
};

export default RedeemHistory;
