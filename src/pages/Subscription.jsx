import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { Check, Star, Crown, Zap, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlanCard = ({ title, price, duration, features, icon: Icon, color, popular, isCurrent }) => (
  <div className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:-translate-y-2 flex flex-col ${popular ? 'border-red-600 scale-105 z-10' : 'border-gray-100 hover:border-red-200'}`}>
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">
        Most Popular
      </div>
    )}
    
    <div className="p-8 text-center flex flex-col items-center">
      <div className={`p-4 rounded-2xl mb-6 ${color}`}>
        <Icon size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <div className="flex items-baseline justify-center gap-1 mb-6">
        <span className="text-4xl font-extrabold text-gray-900">₹{price}</span>
        <span className="text-gray-500 font-medium">/{duration}</span>
      </div>
      
      <div className="w-full space-y-4 mb-8">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-3 text-left">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={12} className="text-green-600 font-bold" />
            </div>
            <span className="text-sm text-gray-600">{feature}</span>
          </div>
        ))}
      </div>
      
      <Button 
        variant={popular ? 'primary' : 'outline'} 
        className={`w-full py-3 rounded-xl font-bold ${isCurrent ? 'bg-green-50 text-green-600 border-green-200 cursor-default hover:bg-green-50' : ''}`}
        disabled={isCurrent}
      >
        {isCurrent ? 'Current Plan' : 'Get Started'}
      </Button>
    </div>
  </div>
);

const Subscription = () => {
  const { userProfile } = useAuthContext();
  const navigate = useNavigate();

  const plans = [
    {
      title: "Basic",
      price: "0",
      duration: "Free",
      icon: Zap,
      color: "bg-gray-400",
      features: [
        "Create profile with 1 photo",
        "View basic matches",
        "Send 5 interests / day",
        "Basic search filters"
      ],
      isCurrent: userProfile?.premiumPlan === 'none' || !userProfile?.isPremium
    },
    {
      title: "Premium Gold",
      price: "1,999",
      duration: "3 Months",
      icon: Star,
      color: "bg-yellow-500",
      popular: true,
      features: [
        "Unlimited interests",
        "View phone numbers",
        "Ad-free experience",
        "Priority in search results",
        "Premium verification badge"
      ],
      isCurrent: userProfile?.premiumPlan === 'gold'
    },
    {
      title: "Royal Platinum",
      price: "4,999",
      duration: "12 Months",
      icon: Crown,
      color: "bg-purple-600",
      features: [
        "Everything in Gold plan",
        "Direct chat with matches",
        "Personalized relationship manager",
        "Profile boost once a week",
        "Exclusive matchmaking events"
      ],
      isCurrent: userProfile?.premiumPlan === 'platinum'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Upgrade Your Search</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Choose the perfect plan to speed up your journey to finding the right life partner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <PlanCard key={idx} {...plan} />
          ))}
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-red-100 rounded-2xl">
              <ShieldCheck size={48} className="text-red-600" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-800 mb-1">100% Secure & Trusted</h4>
              <p className="text-gray-500">Your privacy and security are our top priorities. All payments are processed securely.</p>
            </div>
          </div>
          <Button variant="outline" className="whitespace-nowrap px-8 py-4 rounded-2xl font-bold border-2" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
