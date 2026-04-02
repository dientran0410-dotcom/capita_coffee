import { useState } from 'react';
import { Heart, Gift, Star, TrendingUp, Users, Award, Sparkles, ShoppingBag, Calendar, DollarSign, } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export function CustomerLoyalty() {
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const loyaltyStats = [
        { label: 'Total Members', value: '24,567', icon: Users, color: 'bg-blue-100 text-blue-600' },
        { label: 'Active Rewards', value: '18,932', icon: Gift, color: 'bg-green-100 text-green-600' },
        { label: 'Points Redeemed', value: '452K', icon: Star, color: 'bg-purple-100 text-purple-600' },
        { label: 'Avg Engagement', value: '87%', icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
    ];
    const customers = [
        {
            id: 'CUST-001',
            name: 'Emma Wilson',
            email: 'emma.w@email.com',
            tier: 'Gold',
            points: 2850,
            totalSpent: 4250,
            visits: 127,
            lastVisit: '2026-02-24',
            favoriteItems: ['Caramel Latte', 'Blueberry Muffin'],
            nextReward: 'Free Drink',
            pointsToNext: 150,
        },
        {
            id: 'CUST-002',
            name: 'James Rodriguez',
            email: 'james.r@email.com',
            tier: 'Platinum',
            points: 5420,
            totalSpent: 8900,
            visits: 245,
            lastVisit: '2026-02-25',
            favoriteItems: ['Espresso', 'Croissant'],
            nextReward: 'VIP Event Access',
            pointsToNext: 580,
        },
        {
            id: 'CUST-003',
            name: 'Lisa Chen',
            email: 'lisa.c@email.com',
            tier: 'Silver',
            points: 1200,
            totalSpent: 2100,
            visits: 68,
            lastVisit: '2026-02-23',
            favoriteItems: ['Green Tea', 'Almond Cookie'],
            nextReward: 'Free Pastry',
            pointsToNext: 300,
        },
        {
            id: 'CUST-004',
            name: 'Michael Brown',
            email: 'michael.b@email.com',
            tier: 'Bronze',
            points: 450,
            totalSpent: 890,
            visits: 32,
            lastVisit: '2026-02-22',
            favoriteItems: ['Americano'],
            nextReward: 'Free Size Upgrade',
            pointsToNext: 50,
        },
    ];
    const engagementData = [
        { month: 'Jan', members: 21500, active: 18200 },
        { month: 'Feb', members: 22100, active: 18800 },
        { month: 'Mar', members: 22800, active: 19500 },
        { month: 'Apr', members: 23400, active: 20100 },
        { month: 'May', members: 24000, active: 20600 },
        { month: 'Jun', members: 24567, active: 21200 },
    ];
    const redemptionData = [
        { category: 'Free Drinks', count: 4200 },
        { category: 'Discounts', count: 3800 },
        { category: 'Pastries', count: 2900 },
        { category: 'Merchandise', count: 1500 },
        { category: 'VIP Access', count: 800 },
    ];
    const promotions = [
        {
            title: 'Weekend Bonus',
            description: 'Double points on Saturday & Sunday',
            active: true,
            participants: 8542,
            redemptions: 3210,
        },
        {
            title: 'Birthday Special',
            description: 'Free drink on your birthday month',
            active: true,
            participants: 2156,
            redemptions: 892,
        },
        {
            title: 'Referral Reward',
            description: '500 points for each friend referred',
            active: true,
            participants: 4892,
            redemptions: 1567,
        },
    ];
    const getTierColor = (tier) => {
        switch (tier) {
            case 'Platinum':
                return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'Gold':
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'Silver':
                return 'bg-gray-100 text-gray-700 border-gray-300';
            default:
                return 'bg-amber-100 text-amber-700 border-amber-300';
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Loyalty & Experience</h1>
          <p className="text-gray-600 mt-1">Unified rewards and personalized engagement</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
          <Sparkles className="w-4 h-4"/>
          Create Promotion
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loyaltyStats.map((stat, index) => {
            const Icon = stat.icon;
            return (<div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5"/>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>);
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Member Engagement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month"/>
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="members" stroke="#d97706" strokeWidth={2} name="Total Members"/>
              <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} name="Active Members"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Redemption Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Redemptions</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={redemptionData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="category"/>
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="Redemptions"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Promotions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-amber-600"/>
          <h3 className="text-lg font-semibold text-gray-900">Active Promotions</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {promotions.map((promo, index) => (<div key={index} className="p-4 border-2 border-amber-200 bg-amber-50 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{promo.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div className="p-2 bg-white rounded">
                  <p className="text-gray-600 text-xs">Participants</p>
                  <p className="font-semibold text-gray-900">{promo.participants.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-gray-600 text-xs">Redemptions</p>
                  <p className="font-semibold text-gray-900">{promo.redemptions.toLocaleString()}</p>
                </div>
              </div>
            </div>))}
        </div>
      </div>

      {/* Customer Profiles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Customer Profiles</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Search customers..." className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"/>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {customers.map((customer) => (<div key={customer.id} className="p-6 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedCustomer(selectedCustomer === customer.id ? null : customer.id)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {customer.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(customer.tier)}`}>
                      {customer.tier}
                    </span>
                  </div>

                  {selectedCustomer === customer.id && (<div className="mt-4 grid md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                      {/* Points & Rewards */}
                      <div className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-purple-600"/>
                            <p className="text-xs text-purple-700">Points Balance</p>
                          </div>
                          <p className="text-xl font-bold text-gray-900">{customer.points.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="w-4 h-4 text-green-600"/>
                            <p className="text-xs text-green-700">Next Reward</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{customer.nextReward}</p>
                          <p className="text-xs text-gray-600">{customer.pointsToNext} points away</p>
                        </div>
                      </div>

                      {/* Transaction History */}
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-blue-600"/>
                            <p className="text-xs text-blue-700">Total Spent</p>
                          </div>
                          <p className="text-xl font-bold text-gray-900">${customer.totalSpent.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <ShoppingBag className="w-4 h-4 text-amber-600"/>
                            <p className="text-xs text-amber-700">Total Visits</p>
                          </div>
                          <p className="text-xl font-bold text-gray-900">{customer.visits}</p>
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-red-600"/>
                          <p className="text-xs text-gray-700 font-medium">Favorite Items</p>
                        </div>
                        <ul className="space-y-1">
                          {customer.favoriteItems.map((item, idx) => (<li key={idx} className="text-sm text-gray-600">
                              • {item}
                            </li>))}
                        </ul>
                      </div>

                      {/* Last Activity */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-600"/>
                          <p className="text-xs text-gray-700 font-medium">Last Visit</p>
                        </div>
                        <p className="text-sm text-gray-900">{customer.lastVisit}</p>
                        <button className="mt-3 w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg">
                          Send Offer
                        </button>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>))}
        </div>
      </div>

      {/* Cross-Franchise Redemption */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-8 h-8"/>
          <div>
            <h3 className="text-xl font-semibold">Cross-Franchise Redemption</h3>
            <p className="text-amber-100 text-sm">Points earned at any location can be redeemed anywhere</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-amber-100 text-sm mb-1">Total Redemptions</p>
            <p className="text-3xl font-bold">452K</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-amber-100 text-sm mb-1">Active Locations</p>
            <p className="text-3xl font-bold">48</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-amber-100 text-sm mb-1">Member Satisfaction</p>
            <p className="text-3xl font-bold">94%</p>
          </div>
        </div>
      </div>
    </div>);
}
