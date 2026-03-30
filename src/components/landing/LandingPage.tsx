/**
 * ============================================
 * CARECONNECT LANDING PAGE
 * Kerala-Focused Home Nurse Finder
 * ============================================
 */

import { useState, useEffect } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import {
  Search, MapPin, Phone, Shield, Star, Clock, Users, Heart,
  Stethoscope, CheckCircle, ArrowRight, Menu, X,
  Home, Baby, HeartPulse, Activity, BadgeCheck, Camera,
  AlertTriangle, HandHeart, Building2, Send,
  Facebook, Twitter, Instagram, Linkedin
} from 'lucide-react';
import { cn } from '@/utils/cn';
import logo from '@/assets/logo.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const handleLogin = onLogin || onGetStarted;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0');
          // Optional: stop observing once animated
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1, // Trigger when 10% of the element is visible
      rootMargin: '0px 0px -50px 0px' // Slightly trigger before it comes fully into view
    });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const allServices = ['Elderly Care', 'Post-Surgery Care', 'Newborn Care', 'Palliative Care'];

  const keralaPlaces = [
    'Thiruvananthapuram', 'Kazhakoottam', 'Neyyattinkara', 'Attingal', 'Varkala',
    'Kochi', 'Aluva', 'Kakkanad', 'Thrikkakara', 'Edappally', 'Kaloor', 'Fort Kochi',
    'Kozhikode', 'Vadakara', 'Koyilandy', 'Feroke', 'Beypore',
    'Thrissur', 'Guruvayur', 'Chalakudy', 'Irinjalakuda', 'Kunnamkulam',
    'Kollam', 'Karunagappally', 'Punalur', 'Paravur',
    'Alappuzha', 'Cherthala', 'Kayamkulam', 'Haripad', 'Ambalappuzha',
    'Palakkad', 'Ottapalam', 'Shoranur', 'Chittur', 'Mannarkkad',
    'Kottayam', 'Pala', 'Changanassery', 'Ettumanoor', 'Vaikom',
    'Malappuram', 'Manjeri', 'Perinthalmanna', 'Tirur', 'Ponnani',
    'Kannur', 'Thalassery', 'Payyanur', 'Mattannur', 'Iritty',
    'Kasaragod', 'Kanhangad', 'Nileshwar', 'Bekal',
    'Idukki', 'Munnar', 'Thodupuzha', 'Adimali', 'Kattappana',
    'Pathanamthitta', 'Adoor', 'Thiruvalla', 'Pandalam', 'Ranni',
    'Wayanad', 'Kalpetta', 'Sulthan Bathery', 'Mananthavady', 'Vythiri'
  ];

  const filteredServices = allServices.filter(s =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCities = keralaPlaces.filter(c =>
    c.toLowerCase().includes(location.toLowerCase())
  );

  const scrollToReport = () => {
    const el = document.getElementById('report-help');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════════ */}
      {/* NAVIGATION BAR */}
      {/* ══════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity text-left">
              <div className="p-1 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                <img src={logo} alt="CareConnect" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CareConnect</h1>
                <p className="hidden sm:block text-xs text-gray-500 -mt-0.5">Care Assistant Finder</p>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#services" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Services</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#why-us" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Why Us</a>
              <a href="#cities" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Districts</a>
              <button onClick={scrollToReport} className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1">
                <HandHeart className="w-4 h-4" /> Report & Help
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 ml-auto lg:ml-0">
              <Button variant="ghost" size="sm" onClick={handleLogin} className="hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors">Sign In</Button>
              <Button size="sm" onClick={onGetStarted} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 px-6 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
                Get Started
              </Button>
            </div>

            <div className="flex sm:hidden items-center gap-2">
              <Button size="sm" onClick={onGetStarted} className="text-xs px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 font-semibold transition-all">
                Get Started
              </Button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="hidden sm:block lg:hidden p-2 rounded-lg hover:bg-gray-100">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100/50 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-3">
              <a href="#services" className="block py-2 text-gray-600 hover:text-blue-600">Services</a>
              <a href="#how-it-works" className="block py-2 text-gray-600 hover:text-blue-600">How It Works</a>
              <a href="#why-us" className="block py-2 text-gray-600 hover:text-blue-600">Why Us</a>
              <a href="#cities" className="block py-2 text-gray-600 hover:text-blue-600">Districts</a>
              <button onClick={scrollToReport} className="block py-2 text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2">
                <HandHeart className="w-4 h-4" /> Report & Help Homeless
              </button>
              <div className="pt-3 border-t border-gray-100/50 space-y-2">
                <Button variant="outline" className="w-full" onClick={handleLogin}>Sign In</Button>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 font-semibold transition-all" onClick={onGetStarted}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ══════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Soft Depth Background */}
        <div className="absolute inset-0 bg-slate-50"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/4"></div>

        {/* ── Landscape Hero Image Blended Background ── */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[65%] hidden lg:block z-0 pointer-events-none" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%)', maskImage: 'linear-gradient(to right, transparent 0%, black 25%)' }}>
          <img
            src="/src/assets/hero_homecare_landscape.png"
            alt="Compassionate homecare"
            className="w-full h-full object-cover object-[75%_center]"
          />
          <div className="absolute inset-0 bg-blue-900/5 mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div>
                <Badge variant="info" className="mb-6 bg-white shadow-sm border border-blue-100/50 px-3 py-1.5 rounded-full inline-flex items-center">
                  <Shield className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  <span className="text-xs font-semibold tracking-wide uppercase text-gray-700">AI-Powered Verification</span>
                </Badge>
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                  Find Trusted{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-normal">
                    Care Assistant
                  </span>{' '}
                  <br className="hidden lg:block" />
                  Near You
                </h1>
                <p className="mt-5 text-lg text-gray-600 max-w-xl font-medium leading-relaxed">
                  Kerala&apos;s most trusted platform to connect with verified, experienced home care assistants. Serving all 14 districts with background-checked professionals.
                </p>
              </div>

              {/* ── Glassmorphic Premium Search Module ── */}
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white p-3 max-w-xl relative overflow-visible z-20 transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 rounded-3xl -z-10 pointer-events-none"></div>

                {/* Input Row */}
                <div className="flex flex-col sm:flex-row items-center bg-white/70 rounded-2xl p-1 gap-1">
                  {/* Service Input */}
                  <div className="flex-1 w-full relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-colors">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="What service do you need?"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowServiceDropdown(true); setShowCityDropdown(false); }}
                      onFocus={() => { setShowServiceDropdown(true); setShowCityDropdown(false); }}
                      className="w-full pl-15 pr-4 h-14 bg-transparent text-[15px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none rounded-xl"
                    />
                    {showServiceDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Our Services</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto py-2">
                          {filteredServices.length > 0 ? filteredServices.map((service) => (
                            <button
                              key={service}
                              onClick={() => { setSearchQuery(service); setShowServiceDropdown(false); }}
                              className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-4 transition-colors"
                            >
                              <div className="w-9 h-9 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0">
                                {service === 'Elderly Care' && <Home className="w-4 h-4 text-blue-600" />}
                                {service === 'Post-Surgery Care' && <Activity className="w-4 h-4 text-blue-600" />}
                                {service === 'Newborn Care' && <Baby className="w-4 h-4 text-blue-600" />}
                                {service === 'Palliative Care' && <HeartPulse className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-gray-900">{service}</p>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                  {service === 'Elderly Care' && 'Medication & daily living'}
                                  {service === 'Post-Surgery Care' && 'Wound care & rehab'}
                                  {service === 'Newborn Care' && 'Infant health monitoring'}
                                  {service === 'Palliative Care' && 'Comfort & support'}
                                </p>
                              </div>
                            </button>
                          )) : (
                            <div className="px-5 py-4 text-sm text-gray-400 text-center font-medium">No services found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-px h-8 bg-gray-200 shrink-0 hidden sm:block mx-1"></div>

                  {/* Location Input */}
                  <div className="flex-1 w-full relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-colors">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => { setLocation(e.target.value); setShowCityDropdown(true); setShowServiceDropdown(false); }}
                      onFocus={() => { setShowCityDropdown(true); setShowServiceDropdown(false); }}
                      className="w-full pl-15 pr-4 h-14 bg-transparent text-[15px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none rounded-xl"
                    />
                    {showCityDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Kerala Locations</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto py-2">
                          {filteredCities.length > 0 ? filteredCities.map((city) => (
                            <button
                              key={city}
                              onClick={() => { setLocation(city); setShowCityDropdown(false); }}
                              className="w-full text-left px-5 py-2.5 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                            >
                              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="text-[14px] font-medium text-gray-700">{city}</span>
                            </button>
                          )) : (
                            <div className="px-5 py-4 text-sm text-gray-400 text-center font-medium">No locations found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Button */}
                <button
                  className="w-full h-14 mt-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                  onClick={() => { setShowServiceDropdown(false); setShowCityDropdown(false); onGetStarted(); }}
                >
                  <Search className="w-5 h-5" /> Search Care Assistants
                </button>

                {/* Click outside to close dropdowns */}
                {(showServiceDropdown || showCityDropdown) && (
                  <div className="fixed inset-0 z-40" onClick={() => { setShowServiceDropdown(false); setShowCityDropdown(false); }}></div>
                )}
              </div>

              {/* Trust & Report Indicator Box */}
              <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-4 mt-6 inline-block shadow-sm">
                {/* Trust Indicators below search */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2.5">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-700 text-xs font-bold shrink-0 shadow-sm">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-[13px] font-medium text-gray-600"><strong>7,000+</strong> Caregivers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-[13px] font-medium text-gray-600"><strong>4.8/5</strong> Average Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <span className="text-[13px] font-medium text-gray-600"><strong>100%</strong> Verified</span>
                  </div>
                </div>

                <div className="w-full h-px bg-gray-200/60 my-3"></div>

                {/* Report Homeless Link */}
                <button onClick={scrollToReport} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-[13px] sm:text-[14px] transition-all group">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors shrink-0">
                    <HandHeart className="w-4 h-4" />
                  </div>
                  <span className="group-hover:underline">Spot someone in need? Report & Help Homeless</span>
                </button>
              </div>
            </div>

            {/* Right Content — Floating Stat Cards over Blended Background */}
            <div className="relative hidden lg:block h-[500px]">
              {/* Floating Stat Card — Verified */}
              <div className="absolute top-[45%] left-[5%] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-blue-900/10 border border-white p-4 animate-float z-20 animate-fade-in-up delay-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 leading-tight">100% Verified</p>
                    <p className="text-[12px] text-gray-500 font-medium">Background Checked</p>
                  </div>
                </div>
              </div>

              {/* Floating Stat Card — Rating */}
              <div className="absolute bottom-[10%] right-0 lg:-right-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-blue-900/10 border border-white p-4 animate-float z-20 animate-fade-in-up delay-500" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 leading-tight">4.9 Rating</p>
                    <p className="text-[12px] text-gray-500 font-medium">500+ Families</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* HUMANITARIAN INITIATIVE BANNER */}
      {/* ══════════════════════════════════════════════ */}
      <section className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 py-6 sm:py-8 reveal-on-scroll opacity-0" style={{ position: 'relative', zIndex: 10 }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
        }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-white">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border-2 border-white/30">
                <HandHeart className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    🤝 Humanitarian Initiative
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
                  See Someone Homeless? Help Them Get Shelter
                </h3>
                <p className="text-orange-100 text-xs sm:text-sm mt-1 max-w-xl">
                  Take a photo, share location — we&apos;ll alert nearby shelter homes across Kerala instantly. No facial recognition. Privacy-first.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-white/90">
                <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-2">
                  <Camera className="w-4 h-4" />
                  <span className="text-xs font-medium">Photo</span>
                </div>
                <ArrowRight className="w-3 h-3 text-white/50" />
                <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">Location</span>
                </div>
                <ArrowRight className="w-3 h-3 text-white/50" />
                <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-2">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Alert Shelter</span>
                </div>
              </div>

              <button
                onClick={scrollToReport}
                className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base whitespace-nowrap"
              >
                <Camera className="w-5 h-5" />
                Report & Help Now
              </button>
            </div>
          </div>

          <div className="flex sm:hidden items-center justify-center gap-2 mt-4 text-white/90">
            <div className="flex items-center gap-1 bg-white/15 rounded-lg px-2 py-1.5">
              <Camera className="w-3 h-3" />
              <span className="text-[10px] font-medium">Photo</span>
            </div>
            <ArrowRight className="w-2.5 h-2.5 text-white/50" />
            <div className="flex items-center gap-1 bg-white/15 rounded-lg px-2 py-1.5">
              <MapPin className="w-3 h-3" />
              <span className="text-[10px] font-medium">Location</span>
            </div>
            <ArrowRight className="w-2.5 h-2.5 text-white/50" />
            <div className="flex items-center gap-1 bg-white/15 rounded-lg px-2 py-1.5">
              <Building2 className="w-3 h-3" />
              <span className="text-[10px] font-medium">Alert Shelter</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* HOSPITAL PARTNERS - INFINITE SCROLL          */}
      {/* ══════════════════════════════════════════════ */}
      <section className="border-t border-b border-gray-100 bg-gray-50/50 py-8 overflow-hidden reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4 text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
            UPCOMING STATES
          </p>
        </div>

        <div className="relative flex overflow-x-hidden group">
          <div className="py-2 flex animate-marquee">
            {[1, 2].map((groupIndex) => (
              <div key={groupIndex} className="flex flex-none items-center gap-12 sm:gap-24 pr-12 sm:pr-24">
                {['Telangana', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Andhra Pradesh'].map((hospital, idx) => (
                  <div key={`${groupIndex}-${idx}`} className="flex-none flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors cursor-default">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-lg sm:text-2xl font-bold whitespace-nowrap">{hospital}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════ */}
      {/* EMOTIONAL HOOK - CARE YOUR LOVED ONES DESERVE */}
      {/* ══════════════════════════════════════════════ */}
      <section className="py-20 lg:py-32 bg-white overflow-hidden reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-gray-100">
                <img src="/src/assets/family_nurse_care.png" alt="Caring nurse with family" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                  <p className="font-bold text-xl drop-shadow-md">Peace of Mind</p>
                  <p className="text-sm font-medium text-white/90 drop-shadow-md">Knowing your family is in safe hands</p>
                </div>
              </div>
              {/* Decorative background elements */}
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-100 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-orange-100 rounded-full blur-3xl -z-10"></div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1.5 shadow-sm inline-flex items-center">
                <Heart className="w-3.5 h-3.5 mr-1.5 fill-blue-600 text-blue-600" />
                More Than Just Caregivers
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                The care your loved ones <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">truly deserve.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We know that inviting someone into your home requires absolute trust. At CareConnect, we don&apos;t just provide medical assistance; we provide compassionate companions who treat your family like their own.
              </p>

              <div className="space-y-4 pt-2 pb-6">
                {[
                  'Dignified and respectful care for the elderly',
                  'Rigorous behavioural and psychological screening',
                  'Continuous support and regular check-ins'
                ].map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{point}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800 shadow-xl shadow-gray-900/20" onClick={onGetStarted}>
                Find a Caregiver <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* SERVICES SECTION */}
      {/* ══════════════════════════════════════════════ */}
      <section id="services" className="py-16 lg:py-24 reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight">Our Healthcare Services</h2>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              Elderly Care, Post-Surgery Care, Newborn Care &amp; Palliative Care — find specialized nurses for your needs
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} onClick={onGetStarted} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-gray-50 reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight">How CareConnect Works</h2>
            <p className="mt-6 text-lg text-gray-600">Get quality healthcare at home in 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <div className="w-8 h-8 mx-auto -mt-4 mb-4 bg-white rounded-full flex items-center justify-center text-sm font-bold text-blue-600 shadow-md ring-4 ring-gray-50 relative z-10">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-[28px] left-[55%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-transparent z-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* WHY CHOOSE US */}
      {/* ══════════════════════════════════════════════ */}
      <section id="why-us" className="py-16 lg:py-24 reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-8">Why Choose CareConnect?</h2>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                We combine advanced AI technology with human expertise to ensure you get the
                most reliable and trustworthy healthcare professionals at your doorstep.
              </p>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Nurse Verification Process</h3>
                <div className="space-y-6">
                  <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-300" />
                      </div>
                      <h4 className="text-lg font-semibold">Document Authenticity Checks</h4>
                    </div>
                    <p className="text-blue-100 text-sm">AI-powered analysis to verify uploaded certificates and documents are genuine and unaltered</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-amber-300" />
                      </div>
                      <h4 className="text-lg font-semibold">License &amp; Registration Validation</h4>
                    </div>
                    <p className="text-blue-100 text-sm">Cross-verification of nursing licenses, council registrations, and professional qualifications</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-300" />
                      </div>
                      <h4 className="text-lg font-semibold">Identity Confirmation</h4>
                    </div>
                    <p className="text-blue-100 text-sm">Government ID verification including Aadhaar, PAN, and other official identity documents</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* STATS SECTION */}
      {/* ══════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '7,000+', label: 'Verified Nurses' },
              { value: '35,000+', label: 'Happy Families' },
              { value: '14', label: 'Kerala Districts' },
              { value: '4.8/5', label: 'Average Rating' },
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-3xl lg:text-4xl font-bold">{stat.value}</p>
                <p className="text-blue-100 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* KERALA DISTRICTS */}
      {/* ══════════════════════════════════════════════ */}
      <section id="cities" className="py-16 lg:py-24 bg-gray-50 reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight">Available Across Kerala</h2>
            <p className="mt-6 text-lg text-gray-600">Find home nurses across all 14 districts of God&apos;s Own Country</p>
          </div>
          <div className="relative flex overflow-x-hidden group">
            {/* Two identical blocks animating together for a mathematically perfect -50% loop */}
            <div className="py-2 flex animate-marquee">
              {[1, 2].map((groupIndex) => (
                <div key={groupIndex} className="flex flex-none items-center gap-4 px-2">
                  {cities.map((city, index) => (
                    <button
                      key={`${groupIndex}-${index}`}
                      onClick={onGetStarted}
                      className="bg-white rounded-xl p-4 text-center hover:shadow-lg hover:border-green-400 transition-all border border-gray-100 group w-40 flex-none"
                    >
                      <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-medium text-gray-900 text-sm">{city.name}</p>
                      <p className="text-xs text-green-600 font-medium">{city.nurses} nurses</p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* TESTIMONIALS */}
      {/* ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 overflow-hidden reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight">What Families Say</h2>
            <p className="mt-6 text-lg text-gray-600">Real stories from families who found care through CareConnect</p>
          </div>

          {/* Infinite Scroll Container with Edge Fades */}
          <div className="relative max-w-full mx-auto" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-6 px-4">
              {/* First Set */}
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="w-[350px] md:w-[400px] shrink-0 p-6 shadow-md border border-gray-100 bg-white">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn('w-4 h-4', i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">&quot;{testimonial.text}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${testimonial.color} rounded-full flex items-center justify-center text-gray-700 font-bold shrink-0`}>
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 leading-tight">{testimonial.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{testimonial.location}</p>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Duplicated Set for Seamless Loop */}
              {testimonials.map((testimonial, index) => (
                <Card key={`dup-${index}`} className="w-[350px] md:w-[400px] shrink-0 p-6 shadow-md border border-gray-100 bg-white">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn('w-4 h-4', i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">&quot;{testimonial.text}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${testimonial.color} rounded-full flex items-center justify-center text-gray-700 font-bold shrink-0`}>
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 leading-tight">{testimonial.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{testimonial.location}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* REPORT & HELP HOMELESS - DETAILED SECTION */}
      {/* ══════════════════════════════════════════════ */}
      <section id="report-help" className="py-16 lg:py-24 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 reveal-on-scroll opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="warning" className="mb-6 px-4 py-1.5 shadow-sm bg-white/50 backdrop-blur border-orange-200">
              <HandHeart className="w-4 h-4 mr-2" /> Humanitarian Initiative
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              Help the Homeless. <span className="text-orange-600">Save a Life.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Spot someone sleeping on the streets or wandering without shelter?
              Take a photo, share the location, and we&apos;ll alert the nearest shelter homes across Kerala to provide immediate help.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">How It Works</h3>
              <div className="space-y-4">
                {[
                  { icon: Camera, title: 'Capture a Photo', description: 'Take a picture of the person in need (no facial recognition or identity tracking — fully ethical)', color: 'bg-orange-100 text-orange-600', step: '1' },
                  { icon: MapPin, title: 'Share Location', description: 'GPS location is captured automatically (with your consent) to identify the exact spot', color: 'bg-blue-100 text-blue-600', step: '2' },
                  { icon: Send, title: 'Submit Report', description: 'Your report is securely sent to the admin dashboard for review and action', color: 'bg-emerald-100 text-emerald-600', step: '3' },
                  { icon: Building2, title: 'Alert Nearby Shelters', description: 'The system calculates the nearest shelter homes and sends instant alerts to provide rescue', color: 'bg-purple-100 text-purple-600', step: '4' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="relative">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', item.color)}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                        {item.step}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Report Now</h3>
                    <p className="text-orange-100 text-sm">Help someone in need today</p>
                  </div>
                </div>
                <p className="text-orange-50 mb-6">
                  Sign in to submit a report with photo and GPS location. Our admin team will
                  review and immediately alert the nearest shelter homes in Kerala.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold text-base shadow-lg"
                  onClick={onGetStarted}
                >
                  <Camera className="w-5 h-5 mr-2" /> Sign Up to Report & Help
                </Button>
                <p className="text-xs text-orange-200 mt-3 text-center">
                  Already have an account? <button onClick={handleLogin} className="underline text-white font-medium">Sign In</button> to report
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  <h4 className="font-semibold text-gray-900">Privacy & Ethics First</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    'No facial recognition or identity tracking',
                    'Photos are used only for rescue coordination',
                    'GPS data is secured and never shared publicly',
                    'Reports are reviewed by trained admin staff',
                    'Follows privacy-by-design ethical principles',
                  ].map((point, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                  <Building2 className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">50+</p>
                  <p className="text-xs text-gray-500">Shelter Homes</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                  <Heart className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">200+</p>
                  <p className="text-xs text-gray-500">Lives Helped</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                  <MapPin className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">14</p>
                  <p className="text-xs text-gray-500">Districts Covered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* CTA SECTION */}
      {/* ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-600 to-indigo-700 reveal-on-scroll opacity-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Find Your Perfect Home Nurse?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of Kerala families who trust CareConnect for their healthcare needs.
            All nurses are AI-verified and background-checked across all 14 districts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100" onClick={onGetStarted}>
              Find a Nurse Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={onGetStarted}>
              <Phone className="w-4 h-4 mr-2" /> Call Us: +91 9876543210
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-4">Free consultation • No obligation • 24/7 support</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ══════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                  <img src={logo} alt="CareConnect" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-xl font-bold text-white">CareConnect</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Kerala&apos;s most trusted platform for finding verified home nurses.
                AI-powered verification across all 14 districts.
              </p>
              <div className="flex gap-3">
                {[
                  { name: 'facebook', Icon: Facebook },
                  { name: 'twitter', Icon: Twitter },
                  { name: 'instagram', Icon: Instagram },
                  { name: 'linkedin', Icon: Linkedin }
                ].map(({ name, Icon }) => (
                  <a key={name} href="#" aria-label={name} className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <Icon className="w-4 h-4 text-gray-300" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Our Services</h4>
              <ul className="space-y-2 text-sm">
                {['Elderly Care', 'Post-Surgery Care', 'Newborn Care', 'Palliative Care'].map((service) => (
                  <li key={service}><a href="#" className="hover:text-white transition-colors">{service}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {['About Us', 'How It Works', 'Careers', 'Blog', 'Press', 'Contact'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-500" /><span>+91 9876543210 (Toll Free)</span></li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /><span>All 14 Districts, Kerala, India</span></li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /><span>24/7 Customer Support</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© 2025 CareConnect. All rights reserved. AI-Powered Document Verification.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

    </div >
  );
}

/* ─── Sub-components ─── */

function ServiceCard({ icon: Icon, title, description, nurses, onClick }: {
  icon: typeof Stethoscope;
  title: string;
  description: string;
  nurses: string;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <Card className="p-6 hover:shadow-lg transition-all group border-0 shadow-sm h-full">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
          <Icon className="w-7 h-7 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{nurses} nurses available</span>
          <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </Card>
    </div>
  );
}

/* ─── Data ─── */

const services = [
  { icon: Home, title: 'Elderly Care', description: 'Compassionate care for seniors including medication management, mobility support, and daily living assistance', nurses: '2,500+' },
  { icon: Activity, title: 'Post-Surgery Care', description: 'Professional recovery support with wound care, pain management, and rehabilitation assistance', nurses: '1,800+' },
  { icon: Baby, title: 'Newborn Care', description: 'Expert neonatal nurses for infant care, breastfeeding support, and newborn health monitoring', nurses: '1,200+' },
  { icon: HeartPulse, title: 'Palliative Care', description: 'Compassionate end-of-life care focusing on comfort, dignity, and quality of life for patients and families', nurses: '1,500+' },
];

const steps = [
  { icon: Search, title: 'Search', description: 'Enter your location and the type of care you need' },
  { icon: Users, title: 'Compare', description: 'Browse verified nurses with ratings, experience, and reviews' },
  { icon: CheckCircle, title: 'Book', description: 'Select your preferred nurse and schedule a service' },
  { icon: Heart, title: 'Receive Care', description: 'Get quality healthcare at home from verified professionals' },
];

const features = [
  { icon: Shield, title: 'AI Document Verification', description: 'Every nurse document is analyzed using advanced AI to detect forgeries and ensure authenticity' },
  { icon: BadgeCheck, title: '100% Background Checked', description: 'All nurses undergo thorough background verification including police clearance' },
  { icon: Star, title: 'Rated & Reviewed', description: 'Read genuine reviews from families who have used our nursing services' },
  { icon: Clock, title: '24/7 Availability', description: 'Find nurses for emergency care, night shifts, or round-the-clock assistance' },
];

const cities = [
  { name: 'Thiruvananthapuram', nurses: '850+' },
  { name: 'Kochi', nurses: '1,200+' },
  { name: 'Kozhikode', nurses: '720+' },
  { name: 'Thrissur', nurses: '650+' },
  { name: 'Kollam', nurses: '480+' },
  { name: 'Alappuzha', nurses: '390+' },
  { name: 'Palakkad', nurses: '350+' },
  { name: 'Kottayam', nurses: '420+' },
  { name: 'Malappuram', nurses: '510+' },
  { name: 'Kannur', nurses: '440+' },
  { name: 'Kasaragod', nurses: '280+' },
  { name: 'Idukki', nurses: '210+' },
  { name: 'Pathanamthitta', nurses: '300+' },
  { name: 'Wayanad', nurses: '250+' },
];

const testimonials = [
  { text: 'CareConnect helped us find an excellent nurse for my father after his surgery at Medical College Thiruvananthapuram. The AI verification gave us confidence. Highly recommended!', name: 'Lakshmi Nair', location: 'Thiruvananthapuram, Kerala', rating: 5, color: 'bg-blue-100 text-blue-700' },
  { text: 'We needed urgent elderly care for my grandmother in Kochi. Within hours, we had a verified nurse at our doorstep. The service is exceptional and the nurses are so caring.', name: 'Arun Menon', location: 'Kochi, Kerala', rating: 5, color: 'bg-emerald-100 text-emerald-700' },
  { text: 'As an NRI, knowing my parents in Kozhikode are in good hands with a verified nurse gives me peace of mind. CareConnect is a blessing for Kerala families!', name: 'Deepa Krishnan', location: 'Kozhikode, Kerala', rating: 5, color: 'bg-purple-100 text-purple-700' },
];
