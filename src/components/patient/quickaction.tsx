import { Plus, CreditCard, Receipt, Download, Share2, Bell, Gift } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: "Add Funds",
      description: "Top up your wallet",
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: CreditCard,
      label: "Make Payment",
      description: "Pay outstanding bills",
      color: "from-emerald-500 to-green-600",
      bg: "bg-emerald-50",
    },
    {
      icon: Receipt,
      label: "View Invoices",
      description: "All billing documents",
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: Download,
      label: "Download Statements",
      description: "Monthly reports",
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
    },
  ];

  const promotions = [
    { title: "Health Insurance Discount", discount: "15% off", valid: "Until Feb 28" },
    { title: "Referral Bonus", discount: "₦2,000 credit", valid: "Ongoing" },
  ];

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quick Actions</h2>
        <p className="text-gray-600">Common billing tasks</p>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              className="group p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Notifications & Promotions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Active Promotions</h3>
        </div>
        
        <div className="space-y-3">
          {promotions.map((promo, index) => (
            <div
              key={index}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-100"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{promo.title}</h4>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  {promo.discount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{promo.valid}</span>
                <button className="text-purple-600 hover:text-purple-700 font-medium">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Notification Toggle */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Billing Alerts</p>
                <p className="text-sm text-gray-600">Get notified for payments</p>
              </div>
            </div>
            <div className="relative">
              <div className="w-12 h-6 flex items-center bg-blue-300 rounded-full p-1 cursor-pointer">
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}