"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, X, Truck, MapPin, Phone, Package, ChevronRight } from "lucide-react";
import api from "@/services/api";

interface Drug {
    id: number;
    name: string;
    category: string;
    unit_price: number;
    quantity: number;
    description: string | null;
}

interface CartItem {
    drug: Drug;
    qty: number;
}

export default function PharmacyPage() {
    const [drugs, setDrugs] = useState<Drug[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [showOrders, setShowOrders] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [delivery, setDelivery] = useState({ address: "", phone: "", note: "" });

    useEffect(() => { fetchDrugs(); fetchOrders(); }, []);

    const fetchDrugs = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/pharmacy/search?q=${search}&category=${category}`);
            setDrugs(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get("/pharmacy/orders/my");
            setOrders(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const timer = setTimeout(fetchDrugs, 300);
        return () => clearTimeout(timer);
    }, [search, category]);

    const addToCart = (drug: Drug) => {
        setCart(prev => {
            const existing = prev.find(c => c.drug.id === drug.id);
            if (existing) return prev.map(c => c.drug.id === drug.id ? { ...c, qty: c.qty + 1 } : c);
            return [...prev, { drug, qty: 1 }];
        });
    };

    const updateQty = (drugId: number, delta: number) => {
        setCart(prev => prev.map(c => {
            if (c.drug.id !== drugId) return c;
            const newQty = c.qty + delta;
            return newQty > 0 ? { ...c, qty: newQty } : c;
        }).filter(c => c.qty > 0));
    };

    const removeFromCart = (drugId: number) => setCart(prev => prev.filter(c => c.drug.id !== drugId));

    const cartTotal = cart.reduce((sum, c) => sum + c.drug.unit_price * c.qty, 0);
    const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

    const placeOrder = async () => {
        if (!delivery.address || !delivery.phone) { alert("Please enter delivery details"); return; }
        setPlacing(true);
        try {
            await api.post("/pharmacy/orders", {
                items: cart.map(c => ({ inventory_item_id: c.drug.id, quantity: c.qty })),
                delivery_address: delivery.address,
                delivery_phone: delivery.phone,
                delivery_note: delivery.note,
                payment_method: "wallet"
            });
            setCart([]); setShowCheckout(false); setShowCart(false);
            setDelivery({ address: "", phone: "", note: "" });
            fetchOrders(); fetchDrugs();
            alert("Order placed successfully!");
        } catch (err: any) {
            alert(err.response?.data?.detail || "Order failed");
        } finally { setPlacing(false); }
    };

    const categories = [...new Set(drugs.map(d => d.category))].filter(Boolean);

    const statusStyle = (s: string) => {
        switch (s) {
            case "pending": return "bg-amber-500/10 text-amber-600";
            case "confirmed": case "processing": return "bg-blue-500/10 text-blue-600";
            case "dispatched": return "bg-indigo-500/10 text-indigo-600";
            case "delivered": return "bg-emerald-500/10 text-emerald-600";
            case "cancelled": return "bg-red-500/10 text-red-600";
            default: return "bg-gray-100 text-gray-500";
        }
    };

    const getCartQty = (drugId: number) => cart.find(c => c.drug.id === drugId)?.qty || 0;

    return (
        <div className="max-w-lg mx-auto pb-8 -mx-1">
            {/* Header */}
            <div className="px-1 pt-1 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Pharmacy</h1>
                        <p className="text-[11px] text-gray-400 mt-0.5">Order medications for delivery</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowOrders(true)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 relative">
                            <Package className="w-[18px] h-[18px]" />
                            {orders.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />}
                        </button>
                        <button onClick={() => setShowCart(true)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 relative">
                            <ShoppingCart className="w-[18px] h-[18px]" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mx-1 mb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Search medications..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 transition text-[13px] placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
                <div className="mx-1 mb-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <button onClick={() => setCategory("")}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition ${!category ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        All
                    </button>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setCategory(category === cat ? "" : cat)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition capitalize ${category === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Drug List */}
            <div className="mx-1 space-y-1.5">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : drugs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700 mb-1">No medications found</p>
                        <p className="text-[11px] text-gray-400">Try a different search</p>
                    </div>
                ) : (
                    drugs.map(drug => {
                        const inCart = getCartQty(drug.id);
                        return (
                            <div key={drug.id} className="bg-white rounded-xl p-3 border border-gray-100/80 hover:border-blue-100 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-semibold text-gray-900 text-[13px] truncate">{drug.name}</p>
                                            <span className="shrink-0 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-semibold rounded capitalize">{drug.category}</span>
                                        </div>
                                        {drug.description && <p className="text-[10px] text-gray-400 truncate">{drug.description}</p>}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <p className="text-[15px] font-bold text-gray-900">₦{drug.unit_price.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-400">{drug.quantity} in stock</p>
                                        </div>
                                    </div>
                                    {inCart > 0 ? (
                                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                            <button onClick={() => updateQty(drug.id, -1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition">
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-[13px] font-bold text-gray-900 w-5 text-center">{inCart}</span>
                                            <button onClick={() => updateQty(drug.id, 1)} className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white active:scale-90 transition">
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addToCart(drug)} className="shrink-0 ml-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold active:scale-95 transition">
                                            Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Floating Cart Bar */}
            {cartCount > 0 && !showCart && (
                <div className="fixed bottom-20 left-3 right-3 z-50">
                    <button onClick={() => setShowCart(true)}
                        className="w-full max-w-lg mx-auto flex items-center justify-between bg-blue-600 text-white rounded-xl px-4 py-3 shadow-lg shadow-blue-200 active:scale-[0.98] transition">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            <span className="text-[13px] font-semibold">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-[13px] font-bold">₦{cartTotal.toLocaleString()} →</span>
                    </button>
                </div>
            )}

            {/* Cart Drawer */}
            {showCart && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] overflow-hidden" onClick={() => setShowCart(false)}>
                    <div className="absolute inset-x-0 bottom-0 sm:relative sm:inset-auto sm:flex sm:items-center sm:justify-center sm:min-h-full sm:p-4">
                        <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white pt-3 pb-2 px-4 border-b border-gray-50 z-10">
                                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">Cart ({cartCount})</h2>
                                    <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg bg-gray-50 text-gray-400"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                {cart.length === 0 ? (
                                    <p className="text-center text-gray-400 text-[12px] py-8">Cart is empty</p>
                                ) : (
                                    <>
                                        {cart.map(c => (
                                            <div key={c.drug.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-gray-900 truncate">{c.drug.name}</p>
                                                    <p className="text-[10px] text-gray-400">₦{c.drug.unit_price.toLocaleString()} × {c.qty}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => updateQty(c.drug.id, -1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-400"><Minus className="w-3 h-3" /></button>
                                                        <span className="text-[12px] font-bold w-4 text-center">{c.qty}</span>
                                                        <button onClick={() => updateQty(c.drug.id, 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-400"><Plus className="w-3 h-3" /></button>
                                                    </div>
                                                    <p className="text-[13px] font-bold text-gray-900 w-16 text-right">₦{(c.drug.unit_price * c.qty).toLocaleString()}</p>
                                                    <button onClick={() => removeFromCart(c.drug.id)} className="p-1 text-gray-300 hover:text-red-400"><X className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <span className="text-[13px] font-semibold text-gray-600">Total</span>
                                            <span className="text-lg font-bold text-gray-900">₦{cartTotal.toLocaleString()}</span>
                                        </div>
                                        <button onClick={() => { setShowCart(false); setShowCheckout(true); }}
                                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition mt-2">
                                            Proceed to Checkout
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Drawer */}
            {showCheckout && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] overflow-hidden" onClick={() => setShowCheckout(false)}>
                    <div className="absolute inset-x-0 bottom-0 sm:relative sm:inset-auto sm:flex sm:items-center sm:justify-center sm:min-h-full sm:p-4">
                        <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md shadow-xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white pt-3 pb-2 px-4 border-b border-gray-50 z-10">
                                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
                                    <button onClick={() => setShowCheckout(false)} className="p-1.5 rounded-lg bg-gray-50 text-gray-400"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Order Summary */}
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Order Summary</p>
                                    {cart.map(c => (
                                        <div key={c.drug.id} className="flex items-center justify-between py-1">
                                            <span className="text-[12px] text-gray-600">{c.drug.name} × {c.qty}</span>
                                            <span className="text-[12px] font-semibold text-gray-900">₦{(c.drug.unit_price * c.qty).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
                                        <span className="text-[13px] font-bold text-gray-900">Total</span>
                                        <span className="text-[15px] font-bold text-blue-600">₦{cartTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Delivery Details */}
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Delivery Details</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Address</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                                <input type="text" placeholder="Enter delivery address..." value={delivery.address}
                                                    onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                                                    className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 text-[13px] placeholder:text-gray-300"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                                <input type="tel" placeholder="Phone number..." value={delivery.phone}
                                                    onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
                                                    className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 text-[13px] placeholder:text-gray-300"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Note (optional)</label>
                                            <textarea rows={2} placeholder="Delivery instructions..." value={delivery.note}
                                                onChange={(e) => setDelivery({ ...delivery, note: e.target.value })}
                                                className="w-full px-3 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 text-[13px] resize-none placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                                    <p className="text-[11px] text-blue-700">Payment will be deducted from your wallet</p>
                                </div>

                                <button onClick={placeOrder} disabled={placing}
                                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-50">
                                    {placing ? "Placing Order..." : `Pay ₦${cartTotal.toLocaleString()} & Order`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Drawer */}
            {showOrders && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] overflow-hidden" onClick={() => setShowOrders(false)}>
                    <div className="absolute inset-x-0 bottom-0 sm:relative sm:inset-auto sm:flex sm:items-center sm:justify-center sm:min-h-full sm:p-4">
                        <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white pt-3 pb-2 px-4 border-b border-gray-50 z-10">
                                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">My Orders</h2>
                                    <button onClick={() => setShowOrders(false)} className="p-1.5 rounded-lg bg-gray-50 text-gray-400"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                {orders.length === 0 ? (
                                    <p className="text-center text-gray-400 text-[12px] py-8">No orders yet</p>
                                ) : (
                                    orders.map(o => (
                                        <div key={o.id} className="bg-gray-50 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[13px] font-semibold text-gray-900">Order #{o.id}</p>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusStyle(o.status)}`}>{o.status.toUpperCase()}</span>
                                            </div>
                                            {o.items.map((item: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between py-0.5">
                                                    <span className="text-[11px] text-gray-500">{item.name} × {item.quantity}</span>
                                                    <span className="text-[11px] text-gray-600 font-medium">₦{(item.unit_price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-200">
                                                <span className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                <span className="text-[13px] font-bold text-gray-900">₦{o.total_amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
