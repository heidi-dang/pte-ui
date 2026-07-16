/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGlobalContext } from './ThemeContext';
import { BLOG_POSTS, REVIEWS, FAQS } from '../data/mockData';
import { Shield, BookOpen, Star, Sparkles, Trophy, Check, ArrowRight, Mail, Phone, MapPin, Send, HelpCircle, FileText, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface PublicWebsiteProps {
  currentSection: string;
  onNavigate: (section: string) => void;
  onOpenAuth: (view: 'login' | 'register') => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ currentSection, onNavigate, onOpenAuth }) => {
  const { theme } = useGlobalContext();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submittedContact, setSubmittedContact] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setSubmittedContact(true);
      setTimeout(() => {
        setSubmittedContact(false);
        setContactForm({ name: '', email: '', subject: '', message: '' });
      }, 3000);
    }
  };

  return (
    <div className="pt-20 pb-16">
      {/* 1. HERO / LANDING PAGE */}
      {currentSection === 'landing' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center py-16 lg:py-24">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 mb-6 uppercase">
              <Sparkles className="w-3 h-3" /> Fully Updated for 2026 Pearson Guidelines
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
              Master the PTE Academic <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">With Computerized AI Scoring</span>
            </motion.h1>
            <motion.p variants={itemVariants} className={`text-lg sm:text-xl max-w-2xl mx-auto mb-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              The ultimate high-fidelity practice portal. Train for all 22 tasks, take live-timed full mock exams, and get diagnostic feedback from our native grading engine.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-sm font-semibold tracking-wide bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-500/20"
              >
                Start Free Practice Now <ArrowRight className="ml-2 w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className={`inline-flex items-center justify-center px-8 py-4 rounded-xl text-sm font-semibold tracking-wide border transition-all ${
                  theme === 'dark' ? 'border-gray-800 hover:bg-gray-900 bg-gray-950/40 text-gray-200' : 'border-gray-300 hover:bg-gray-100 bg-white text-gray-800'
                }`}
              >
                View Premium Plans
              </button>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 border-t border-gray-800/60 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">98.4%</p>
                <p className={`text-xs sm:text-sm uppercase font-mono tracking-widest mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Visa Success Rate</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-teal-400">22 / 22</p>
                <p className={`text-xs sm:text-sm uppercase font-mono tracking-widest mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Task Simulator Types</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-sky-400">+/- 3</p>
                <p className={`text-xs sm:text-sm uppercase font-mono tracking-widest mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>AI Scoring Margin</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">14k+</p>
                <p className={`text-xs sm:text-sm uppercase font-mono tracking-widest mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Active Students</p>
              </div>
            </motion.div>
          </div>

          {/* Quick Features Highlight */}
          <div className="py-16 border-t border-gray-800/40">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Standardized Exam Preparation Redefined</h2>
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Everything you need to secure a 79+ on your first attempt.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Pearson-Identical Editor</h3>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Train with the precise interface, timers, warning bells, and audio-player features that match Pearson\'s official exam test centers.
                </p>
              </div>
              <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Acoustic Pronunciation Analysis</h3>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Get graded immediately on speaking tasks with deep diagnostic feedback concerning pitch, oral pauses, and consonant articulation.
                </p>
              </div>
              <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Academic Template Suite</h3>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Master our pre-approved structural layouts for Describe Image, Retell Lecture, and Write Essay that guarantee maximum vocabulary scores.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. FEATURES VIEW */}
      {currentSection === 'features' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Architected for PTE Perfection</h1>
            <p className={`text-base mt-2 max-w-xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Every module, task type, and interface crafted meticulously for Pearson standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 py-12 items-center">
            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Speaking & Writing Section</span>
              <h2 className="text-3xl font-bold tracking-tight mt-4 mb-4">Master Your Intonation and Oral Flow</h2>
              <p className={`text-sm leading-relaxed mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Our speaking engine analyzes your raw audio using spectral waveform diagnostics. It scores you instantly on <strong>Read Aloud</strong>, <strong>Repeat Sentence</strong>, and <strong>Describe Image</strong> using metrics calibrated against thousands of graded speech samples.
              </p>
              <ul className="space-y-3">
                {['Spectral audio wave recording simulation', 'Automatic pronunciation and oral gap tracking', 'Approved pre-baked structural oral templates', 'Scoring indicators for vocabulary & grammar complexity'].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`p-8 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-xs font-mono text-red-400">RECORDING SIMULATOR Active</span>
                </div>
                <span className="text-xs font-mono text-gray-500">Timer: 40s</span>
              </div>
              <div className={`p-4 rounded-xl mb-4 text-xs font-mono leading-relaxed ${theme === 'dark' ? 'bg-gray-950 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                "The Great Barrier Reef is the world\'s largest coral reef system, composed of over two-thousand nine-hundred individual reefs..."
              </div>
              <div className="h-16 flex items-center justify-center gap-1.5 mb-6 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                {[4, 12, 24, 32, 16, 8, 22, 38, 14, 6, 28, 12, 18, 30, 8, 4, 18, 28, 12].map((h, i) => (
                  <span key={i} style={{ height: `${h}px` }} className="w-1 bg-emerald-400 rounded-full"></span>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Score: Content (90) | Fluency (88)</span>
                <span className="text-xs font-bold text-emerald-400">Status: Graded</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. PRICING VIEW */}
      {currentSection === 'pricing' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Flexible, Objective Pricing Plans</h1>
            <p className={`text-base mt-2 max-w-xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Start practicing for free or unlock unlimited access to the 22-task simulated practice suite and mock exams.
            </p>

            {/* Toggle */}
            <div className="flex justify-center items-center gap-3 mt-8">
              <span className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold text-emerald-400' : 'text-gray-400'}`}>Monthly</span>
              <button
                onClick={() => setBillingCycle((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))}
                className="w-12 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 p-1 flex items-center cursor-pointer transition-all duration-300"
              >
                <div className={`w-4 h-4 rounded-full bg-emerald-400 transition-all ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm ${billingCycle === 'annual' ? 'font-semibold text-emerald-400' : 'text-gray-400'}`}>
                Annual <span className="text-xs text-emerald-400 font-mono bg-emerald-400/10 px-1.5 py-0.5 rounded ml-1">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 py-12 max-w-6xl mx-auto">
            {/* Free */}
            <div className={`p-8 rounded-2xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div>
                <h3 className="text-xl font-bold">Standard Explorer</h3>
                <p className="text-xs text-gray-400 mt-1">Perfect for trying out the platform.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold">$0</span>
                  <span className="text-gray-500 text-sm"> / forever</span>
                </div>
                <ul className="space-y-3.5 text-sm mb-8">
                  {['Practice 3 task types daily', 'Basic grammar templates', 'No simulated microphone recording', 'Community study boards'].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => onOpenAuth('register')} className="w-full py-3 rounded-xl text-sm font-semibold border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                Get Started
              </button>
            </div>

            {/* Premium */}
            <div className={`p-8 rounded-2xl border-2 flex flex-col justify-between relative bg-gradient-to-b ${theme === 'dark' ? 'from-gray-900 to-[#121929] border-emerald-500' : 'from-white to-gray-50 border-emerald-500'} shadow-lg`}>
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full tracking-wider shadow">
                MOST POPULAR
              </div>
              <div>
                <h3 className="text-xl font-bold">Premium Academic</h3>
                <p className="text-xs text-emerald-400 mt-1">Our comprehensive 79+ preparation tier.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold">{billingCycle === 'monthly' ? '$39' : '$31'}</span>
                  <span className="text-gray-400 text-sm"> / month</span>
                </div>
                <ul className="space-y-3.5 text-sm mb-8">
                  {['Unlimited practice for all 22 tasks', 'Instant AI phonetic analysis for speaking', 'Comprehensive spelling & grammar corrector', '3 Full-length graded Mock Exams', 'Teacher priority homework grading'].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => onOpenAuth('register')} className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/10">
                Unlock Premium Now
              </button>
            </div>

            {/* VIP */}
            <div className={`p-8 rounded-2xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div>
                <h3 className="text-xl font-bold">VIP 1-on-1 Mentorship</h3>
                <p className="text-xs text-gray-400 mt-1">For students who require active tutoring.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold">{billingCycle === 'monthly' ? '$99' : '$79'}</span>
                  <span className="text-gray-500 text-sm"> / month</span>
                </div>
                <ul className="space-y-3.5 text-sm mb-8">
                  {['All Premium tier access benefits', '2 Private hour lessons with certified tutors', 'Custom study plan formulated weekly', 'Unlimited custom mock evaluations', 'Direct WhatsApp / Slack access channel'].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => onOpenAuth('register')} className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-800 bg-gray-950/20 text-gray-300 hover:bg-gray-900 hover:text-white transition-all">
                Enquire Now
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. ABOUT US */}
      {currentSection === 'about' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Our Mission & Pedagogy</h1>
            <p className={`text-base mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              PTE Academic Master was founded by linguistic researchers and software engineers.
            </p>
          </div>
          <div className={`p-8 rounded-3xl border mb-12 ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-200'} leading-relaxed space-y-6 text-sm text-gray-300`}>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
              Standardized English examinations represent high-stakes milestones for immigrants, post-graduates, and scholars. For years, students spent massive sums on manual tuition, only to receive sparse, subjective evaluation concerning their spoken fluency or essay structures.
            </p>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
              We realized that since Pearson uses an objective machine algorithm to score the real PTE Academic exam, students should prepare using an equally rigorous, computerized feedback engine. Our research focuses on speech analysis, grammar extraction, and contextual word evaluation to mimic actual Pearson guidelines precisely.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-gray-850">
              <div>
                <h4 className="font-bold text-white mb-2">Our Faculty</h4>
                <p className="text-xs text-gray-400">Our faculty includes certified Pearson instructors, former IELTS examiners, and specialists in acoustic phonology.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-2">Our Technology</h4>
                <p className="text-xs text-gray-400">We utilize modern AI micro-modules that isolate vocal pauses, analyze pronunciation errors, and audit spelling ranges.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5. CONTACT US */}
      {currentSection === 'contact' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Contact Our Prep Advisors</h1>
            <p className={`text-base mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Have questions regarding courses, billing, or enterprise options? Drop us a note.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 py-8">
            <div className="md:col-span-2 space-y-6">
              <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Email</h4>
                    <p className="text-xs text-gray-400">support@pteacademicmaster.com</p>
                  </div>
                </div>
              </div>
              <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Phone</h4>
                    <p className="text-xs text-gray-400">+61 (2) 9012 3456</p>
                  </div>
                </div>
              </div>
              <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">HQ Office</h4>
                    <p className="text-xs text-gray-400">George St, Sydney NSW 2000, Australia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`md:col-span-3 p-8 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'}`}>
              {submittedContact ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">Message Sent Successfully!</h3>
                  <p className="text-xs text-gray-400 mt-1">An academic advisor will respond to your query within 12 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Your Full Name</label>
                    <input
                      required
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-1 ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500 focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-1 ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500 focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Subject</label>
                    <input
                      required
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-1 ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500 focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-1 ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white focus:ring-emerald-500 focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                    <Send className="w-4 h-4" /> Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 6. FAQ SECTION */}
      {currentSection === 'faq' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Frequently Answered Queries</h1>
            <p className={`text-base mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Get instant insights on common questions from our academic counselors.
            </p>
          </div>

          <div className="space-y-4 py-8">
            {FAQS.map((faq, index) => (
              <div key={index} className={`rounded-xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center font-bold text-sm"
                >
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>{faq.question}</span>
                  <HelpCircle className={`w-4 h-4 text-emerald-400 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === index && (
                  <div className={`px-6 pb-4 text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} border-t ${theme === 'dark' ? 'border-gray-850' : 'border-gray-100'} pt-3`}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 7. BLOG */}
      {currentSection === 'blog' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">The Academic Gazette</h1>
            <p className={`text-base mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Expert articles, layout templates, and grammar advice authored by our core faculty.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 py-10">
            {BLOG_POSTS.map((post) => (
              <article key={post.id} className={`rounded-2xl border overflow-hidden flex flex-col justify-between ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800 hover:border-emerald-500/40' : 'bg-white border-gray-200 hover:border-emerald-400'} transition-all`}>
                <div className="p-6">
                  <div className="flex gap-4 items-center text-xs text-gray-500 mb-3 font-mono">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{post.title}</h3>
                  <p className={`text-xs leading-relaxed line-clamp-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{post.summary}</p>
                </div>
                <div className={`px-6 py-4 border-t flex justify-between items-center ${theme === 'dark' ? 'border-gray-850' : 'border-gray-100'}`}>
                  <span className="text-xs font-semibold text-emerald-400">By {post.author}</span>
                  <button className="text-xs flex items-center gap-1 hover:text-emerald-400 transition-colors">
                    Read Article <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </motion.div>
      )}

      {/* 8. REVIEWS */}
      {currentSection === 'reviews' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Endorsed by Over 14,000 Graduates</h1>
            <p className={`text-base mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              See how immigrants and post-graduates secured their dream target scores using our mock simulation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 py-10">
            {REVIEWS.map((review) => (
              <div key={review.id} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-emerald-400 stroke-emerald-400" />
                  ))}
                </div>
                <p className={`text-xs leading-relaxed italic mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <img referrerPolicy="no-referrer" src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover border border-emerald-500/20" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{review.name}</h4>
                    <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 font-bold">{review.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 9. TERMS OF SERVICE */}
      {currentSection === 'terms' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
            <p className={`text-base mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Last updated: July 16, 2026. Please read our licensing compliance rules.
            </p>
          </div>

          <div className={`p-8 rounded-3xl border leading-relaxed space-y-6 text-xs ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <div>
              <h3 className="font-bold text-sm text-emerald-400 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> 1. Acceptance of Licensing Terms
              </h3>
              <p>By creating an account or subscribing to our Premium Academic tiers, you agree to comply with our academic honor codes. Users are strictly prohibited from copying questions, ripping simulated speech audios, or attempting to reverse engineer our proprietary phonetic metrics.</p>
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-400 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> 2. Fair Usage Policy
              </h3>
              <p>To preserve server bandwith and computing efficiency for audio processing, Premium plans are subject to an unlimited-yet-fair-usage quota. Automated bot access, scraping, or utilizing shared multi-user login structures is detected by our telemetry and results in immediate suspension.</p>
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-400 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" /> 3. No Pearson Affiliation
              </h3>
              <p>PTE Academic Master is an independent preparatory platform. We are not officially affiliated, endorsed, or associated with Pearson PLC. The scores generated by our simulator serve as diagnostic approximations and do not guarantee final official Pearson test marks.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 10. PRIVACY POLICY */}
      {currentSection === 'privacy' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className={`text-base mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Your voice data and essays remain 100% confidential.
            </p>
          </div>

          <div className={`p-8 rounded-3xl border leading-relaxed space-y-6 text-xs ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <div>
              <h3 className="font-bold text-sm text-emerald-400 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" /> 1. Voice Data Recording Privacy
              </h3>
              <p>When you practice Read Aloud or Retell Lecture, your microphone streams vocal frequencies to our analytical models. These recordings are utilized solely for extracting phonetic metrics, and are never cataloged, sold, or shared with third-party advertising corporations.</p>
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-400 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> 2. Personal Information Encryption
              </h3>
              <p>All user authentication credentials, payment card tokens, and submission histories are protected with standard AES-256 secure socket encryption layers. Our platform holds zero plain-text customer credentials.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
