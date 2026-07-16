/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { Sparkles, Check, CreditCard, Gift, AlertTriangle, ShieldCheck, Ticket, Calendar, X, RefreshCw, FileText } from 'lucide-react';

export const BillingUI: React.FC = () => {
  const { theme, user, apiFetch, login } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  
  // Payment Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardError, setCardError] = useState('');
  
  // Active Invoice state for receipt
  const [invoice, setInvoice] = useState<any>(null);

  // Prices
  const basePrice = plan === 'monthly' ? 29 : 199;
  const discountedPrice = discountPercent 
    ? Math.max(0, basePrice - (basePrice * discountPercent) / 100) 
    : basePrice;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    setCouponSuccess('');
    try {
      const response = await apiFetch('/api/student/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      if (response.success) {
        setDiscountPercent(response.discountPercent);
        setCouponSuccess(`Coupon code applied! ${response.discountPercent}% discount active.`);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Invalid promotional coupon code');
      setDiscountPercent(null);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError('');
    setLoading(true);

    if (cardNumber.length < 15) {
      setCardError('Please enter a valid card number');
      setLoading(false);
      return;
    }
    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setCardError('Expiry date must be in MM/YY format');
      setLoading(false);
      return;
    }
    if (cardCvc.length < 3) {
      setCardError('Please enter a valid CVC');
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch('/api/student/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: plan,
          price: discountedPrice,
          couponCode: discountPercent ? couponCode.toUpperCase().trim() : null,
          cardNumber,
          cardExpiry,
          cardCvc,
        }),
      });

      if (response.success) {
        setSuccess(true);
        setInvoice({
          invoiceNo: `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toLocaleDateString(),
          plan: plan === 'monthly' ? 'Monthly Booster Plan' : 'Yearly Platinum Pro',
          amount: discountedPrice,
          couponUsed: discountPercent ? couponCode.toUpperCase().trim() : 'None',
          cardEnding: cardNumber.slice(-4),
        });
        
        // Force refresh user session context
        await login(user?.email || 'student@example.com', 'password123');
      }
    } catch (err: any) {
      setCardError(err.message || 'Payment processor failed to authorize transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your Premium features? This will downgrade your account to the Free tier immediately.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/student/unsubscribe', {
        method: 'POST',
      });
      if (response.success) {
        // Refresh context
        await login(user?.email || 'student@example.com', 'password123');
        alert('Subscription downgraded successfully.');
      }
    } catch (err: any) {
      alert('Failed to cancel subscription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="billing-ui-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      
      {/* Header Block */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> SECURE LAUNCH GATEWAY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Flexible PTE Mastery Subscriptions</h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Gain unlimited access to 22 task type sandboxes, 100+ simulated question banks, state-of-the-art voice calibration engines, and certified mock exams with automatic grading.
        </p>
      </div>

      {/* Account Tier Status Indicator Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        user?.subTier === 'premium'
          ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20'
          : 'bg-gray-900/40 border-gray-800'
      }`}>
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">CURRENT PLATFORM LICENSE</p>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold flex items-center gap-1.5">
              {user?.subTier === 'premium' ? (
                <>
                  <span className="text-emerald-400">Premium Platinum Pro</span> ✨
                </>
              ) : (
                <>
                  <span className="text-gray-400">Standard Free Account</span>
                </>
              )}
            </h2>
          </div>
          {user?.subTier === 'premium' ? (
            <p className="text-xs text-gray-400">
              Unlimited access active. Renewing automatically on <span className="text-emerald-400 font-mono font-bold">August 16, 2026</span>.
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              Limited to 2 practice submissions daily and 1 mini mock exam. Upgrade below to remove all limitations.
            </p>
          )}
        </div>

        {user?.subTier === 'premium' && (
          <button
            onClick={handleCancelSubscription}
            disabled={loading}
            className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Cancel Auto-Renew'}
          </button>
        )}
      </div>

      {success ? (
        /* Purchase Success / Receipt Presentation screen */
        <div className="max-w-2xl mx-auto border rounded-3xl overflow-hidden bg-gray-950 border-gray-850 shadow-2xl">
          <div className="p-8 text-center bg-gradient-to-b from-emerald-500/10 to-transparent space-y-4">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black">Upgrade Successful!</h2>
            <p className="text-xs text-emerald-400 max-w-md mx-auto">
              Your Premium subscription is now fully active. We have dispatched an automated invoice receipt to <span className="font-bold underline">{user?.email}</span>.
            </p>
          </div>

          <div className="p-6 border-t border-dashed border-gray-850 space-y-4 text-xs">
            <h3 className="font-mono font-bold uppercase tracking-widest text-gray-400">INVOICE & RECEIPT #</h3>
            <div className="grid grid-cols-2 gap-y-3 font-mono">
              <div className="text-gray-500">Invoice Reference:</div>
              <div className="text-right text-gray-300 font-bold">{invoice?.invoiceNo}</div>

              <div className="text-gray-500">Date Paid:</div>
              <div className="text-right text-gray-300">{invoice?.date}</div>

              <div className="text-gray-500">Service Plan:</div>
              <div className="text-right text-emerald-400 font-bold">{invoice?.plan}</div>

              <div className="text-gray-500">Coupon Code:</div>
              <div className="text-right text-gray-300">{invoice?.couponUsed}</div>

              <div className="text-gray-500">Amount Charged:</div>
              <div className="text-right text-white font-bold text-sm">${invoice?.amount} USD</div>

              <div className="text-gray-500">Payment Source:</div>
              <div className="text-right text-gray-400">Visa ending in •••• {invoice?.cardEnding}</div>
            </div>

            <div className="pt-4 border-t border-gray-850 flex gap-3">
              <button
                onClick={() => setSuccess(false)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center rounded-xl transition-all cursor-pointer"
              >
                Launch Learning Sandbox
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 rounded-xl transition-all font-bold flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Plan select and credit card form inputs */
        user?.subTier !== 'premium' && (
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left: Pricing details cards */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-sm font-bold font-mono text-gray-400 uppercase tracking-widest">Select Premium License Plan</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                
                {/* Monthly card */}
                <div
                  onClick={() => setPlan('monthly')}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                    plan === 'monthly'
                      ? 'bg-emerald-500/5 border-emerald-500 shadow-xl shadow-emerald-500/5'
                      : 'bg-gray-900/30 border-gray-850 hover:bg-gray-900/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold">Monthly Booster</h4>
                      <p className="text-[10px] text-gray-500 mt-1">Flexible cancel-anytime billing</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${plan === 'monthly' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-600'}`}>
                      {plan === 'monthly' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="mt-8">
                    <span className="text-2xl font-black font-mono">$29</span>
                    <span className="text-xs text-gray-500 font-mono"> / month</span>
                  </div>
                </div>

                {/* Yearly card */}
                <div
                  onClick={() => setPlan('yearly')}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                    plan === 'yearly'
                      ? 'bg-emerald-500/5 border-emerald-500 shadow-xl shadow-emerald-500/5'
                      : 'bg-gray-900/30 border-gray-850 hover:bg-gray-900/50'
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold font-mono text-[8px] uppercase tracking-wider py-1 px-3 rounded-bl-xl">
                    SAVE 45%
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold">Yearly Platinum Pro</h4>
                      <p className="text-[10px] text-gray-500 mt-1">Best value for complete mastery</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${plan === 'yearly' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-600'}`}>
                      {plan === 'yearly' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="mt-8">
                    <span className="text-2xl font-black font-mono">$199</span>
                    <span className="text-xs text-gray-500 font-mono"> / year</span>
                  </div>
                </div>
              </div>

              {/* High-fidelity checklist of features unlocked */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">All Included Core Features:</h4>
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {[
                    'Instant AI Automated Speech Grading',
                    'Comprehensive 22 Task Sandbox Tools',
                    'Full Real-Sim Mock Exam Simulator',
                    'Personalized Study Track On Diagnostics',
                    'Teacher Question Sandbox Integrations',
                    'Active Voice pitch & calibration graphs',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs">
                      <div className="w-4 h-4 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-gray-300">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Payment card checkout container */}
            <div className="lg:col-span-5">
              <form onSubmit={handleSubscribe} className="p-6 rounded-2xl border border-gray-850 bg-gray-950/60 shadow-2xl space-y-5">
                <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Secure SSL Checkout
                </h3>

                {/* Live Checkout Summary */}
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-850 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Selected Option:</span>
                    <span className="text-gray-300 font-bold">{plan === 'monthly' ? 'Monthly Booster' : 'Yearly Platinum'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal Price:</span>
                    <span className="text-gray-300 font-mono">${basePrice}.00 USD</span>
                  </div>
                  {discountPercent && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Discount ({discountPercent}%):</span>
                      <span>-${(basePrice * discountPercent) / 100}.00 USD</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-850 pt-2 font-bold text-sm">
                    <span className="text-white">Amount Charged:</span>
                    <span className="text-emerald-400 font-mono">${discountedPrice.toFixed(2)} USD</span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase text-gray-400">Have a Promotional Code?</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="e.g. FIFTYOFF, LAUNCHPTE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={validateCoupon}
                      className="px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-rose-400">{couponError}</p>}
                  {couponSuccess && <p className="text-[10px] text-emerald-400">{couponSuccess}</p>}
                </div>

                {/* Credit Card Fields */}
                <div className="space-y-4 pt-3 border-t border-gray-850">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase text-gray-400">Cardholder Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Alex Mercer"
                      defaultValue={user?.name || ''}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase text-gray-400">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input
                        required
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono uppercase text-gray-400">Expiry Date</label>
                      <input
                        required
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono uppercase text-gray-400">CVC Code</label>
                      <input
                        required
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                {cardError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{cardError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Secured Funds...
                    </>
                  ) : (
                    <>
                      Authorize & Pay ${discountedPrice.toFixed(2)} USD
                    </>
                  )}
                </button>

                <p className="text-[9px] text-gray-500 text-center leading-normal">
                  Protected by standard 256-bit bank AES encryption. Charges will appear under "PTE Academic Master" on your credit card.
                </p>
              </form>
            </div>

          </div>
        )
      )}
    </div>
  );
};
