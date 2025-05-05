import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Logo size="md" />
            </div>
            <p className="text-muted-foreground mb-4">
              A family-run business offering exciting competition opportunities with prizes ranging from big-ticket items to everyday essentials.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-foreground font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="text-muted-foreground hover:text-primary transition-colors">
                  All Competitions
                </Link>
              </li>
              <li>
                <Link href="/how-to-play" className="text-muted-foreground hover:text-primary transition-colors">
                  How to Play
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/my-wins" className="text-muted-foreground hover:text-primary transition-colors">
                  Winners
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-foreground font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/competitions?category=family" className="text-muted-foreground hover:text-yellow-400 transition-colors">
                  <span className="w-2 h-2 inline-block bg-yellow-400 rounded-full mr-2"></span> Family
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=household" className="text-muted-foreground hover:text-pink-400 transition-colors">
                  <span className="w-2 h-2 inline-block bg-pink-400 rounded-full mr-2"></span> Household
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=cash" className="text-muted-foreground hover:text-green-400 transition-colors">
                  <span className="w-2 h-2 inline-block bg-green-400 rounded-full mr-2"></span> Cash
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=electronics" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="w-2 h-2 inline-block bg-primary rounded-full mr-2"></span> Electronics
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=travel" className="text-muted-foreground hover:text-purple-500 transition-colors">
                  <span className="w-2 h-2 inline-block bg-purple-500 rounded-full mr-2"></span> Travel
                </Link>
              </li>
              <li>
                <Link to="/competitions?category=beauty" className="text-muted-foreground hover:text-rose-500 transition-colors">
                  <span className="w-2 h-2 inline-block bg-rose-500 rounded-full mr-2"></span> Beauty
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-foreground font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Mail className="text-primary h-5 w-5 mt-0.5 mr-3" />
                <span className="text-muted-foreground">support@mobycomps.com</span>
              </li>
              <li className="flex items-start">
                <Phone className="text-primary h-5 w-5 mt-0.5 mr-3" />
                <span className="text-muted-foreground">+44 (0)123 456 7890</span>
              </li>
              <li className="flex items-start">
                <MapPin className="text-primary h-5 w-5 mt-0.5 mr-3" />
                <span className="text-muted-foreground">Devon, United Kingdom</span>
              </li>
            </ul>
            <div className="mt-4">
              <Button className="flex items-center">
                <i className="fas fa-headset mr-2"></i> Live Chat
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-muted-foreground text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} MobyComps. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link href="/terms-conditions" className="text-muted-foreground hover:text-primary text-sm">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary text-sm">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy" className="text-muted-foreground hover:text-primary text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
