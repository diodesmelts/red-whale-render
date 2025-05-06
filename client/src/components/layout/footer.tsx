import { Link } from "wouter";
import { Facebook, Instagram, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { SiteConfig } from "@shared/schema";
import { getImageUrl } from "@/lib/utils";
import CachedImage from "@/components/ui/cached-image";

export function Footer() {
  // Fetch payment cards image URL from site config with reduced refresh rate
  const { data: paymentCardsConfig } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config", "paymentCardsImage"],
    queryFn: async () => {
      const res = await fetch("/api/site-config/paymentCardsImage", {
        credentials: 'include'
      });
      if (!res.ok) return null;
      return res.json();
    },
    // Add longer stale time to reduce unnecessary refetching
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: false,
  });
  return (
    <footer className="bg-[#002147] text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Logo size="md" />
            </div>
            <p className="text-gray-300 mb-4">
              A family-run business offering exciting competition opportunities with prizes ranging from big-ticket items to everyday essentials.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="text-gray-300 hover:text-primary transition-colors">
                  All Competitions
                </Link>
              </li>
              <li>
                <Link href="/how-to-play" className="text-gray-300 hover:text-primary transition-colors">
                  How to Play
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="text-gray-300 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/my-wins" className="text-gray-300 hover:text-primary transition-colors">
                  Winners
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-300 hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/competitions?category=family" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <span className="w-2 h-2 inline-block bg-yellow-400 rounded-full mr-2"></span> Family
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=household" className="text-gray-300 hover:text-pink-400 transition-colors">
                  <span className="w-2 h-2 inline-block bg-pink-400 rounded-full mr-2"></span> Household
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=cash" className="text-gray-300 hover:text-green-400 transition-colors">
                  <span className="w-2 h-2 inline-block bg-green-400 rounded-full mr-2"></span> Cash
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=electronics" className="text-gray-300 hover:text-primary transition-colors">
                  <span className="w-2 h-2 inline-block bg-primary rounded-full mr-2"></span> Electronics
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=travel" className="text-gray-300 hover:text-purple-500 transition-colors">
                  <span className="w-2 h-2 inline-block bg-purple-500 rounded-full mr-2"></span> Travel
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=beauty" className="text-gray-300 hover:text-rose-500 transition-colors">
                  <span className="w-2 h-2 inline-block bg-rose-500 rounded-full mr-2"></span> Beauty
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin className="text-primary h-5 w-5 mt-0.5 mr-3" />
                <span className="text-gray-300">Devon, United Kingdom</span>
              </li>
            </ul>
            <div className="mt-4">
              <Button className="flex items-center">
                <i className="fas fa-headset mr-2"></i> Live Chat
              </Button>
            </div>
            <div className="mt-6">
              <CachedImage 
                src={paymentCardsConfig?.value ? getImageUrl(paymentCardsConfig.value) : "/uploads/payment-cards.png"} 
                alt="Payment methods: Mastercard and Visa" 
                className="h-8"
                fallbackSrc="/uploads/payment-cards.png"
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} MobyComps. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link href="/terms-conditions" className="text-gray-300 hover:text-primary text-sm">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="text-gray-300 hover:text-primary text-sm">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy" className="text-gray-300 hover:text-primary text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
