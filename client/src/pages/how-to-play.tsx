
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, Ticket, LineChart, Trophy, 
  CreditCard, Timer, CheckCircle2, User, 
  Mail, ExternalLink, DollarSign, ChevronRight,
  Bell, ShieldCheck
} from "lucide-react";

export default function HowToPlay() {
  return (
    <div>
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary mb-2">
              GETTING STARTED
            </span>
            <h1 className="text-4xl font-bold mb-4">How To<span className="text-primary">Play</span></h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Follow these simple steps to participate and win exciting competitions across multiple platforms
            </p>
            <div className="w-24 h-1 bg-primary mx-auto mb-12 rounded-full"></div>
          </div>
          
          {/* Step by step guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                  <Search className="text-primary h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">1. Browse Competitions</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Start by exploring our wide range of competitions. You can filter by category, price, or drawing date to find the perfect competitions for you:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span className="text-muted-foreground">Browse through our curated collections organized by category</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span className="text-muted-foreground">Use filters to narrow down by prize value, ticket price, or end date</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span className="text-muted-foreground">Check out featured and trending competitions for the most popular options</span>
                </li>
              </ul>
              <Link href="/competitions">
                <Button className="shine-btn group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  Browse Competitions <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border">
              <img 
                src="https://images.unsplash.com/photo-1522199755839-a2bacb67c546?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=350&q=80" 
                alt="Person browsing competitions on a tablet" 
                className="w-full h-auto rounded-lg mb-4"
              />
              <div className="flex justify-between">
                <Card className="w-1/3 mr-2">
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-yellow-400 mb-2"></span>
                    <span className="text-xs font-medium">Family</span>
                  </CardContent>
                </Card>
                <Card className="w-1/3 mx-1">
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-pink-400 mb-2"></span>
                    <span className="text-xs font-medium">Appliances</span>
                  </CardContent>
                </Card>
                <Card className="w-1/3 ml-2">
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-green-400 mb-2"></span>
                    <span className="text-xs font-medium">Cash</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="bg-card p-6 rounded-lg border border-border order-2 md:order-1">
              <div className="flex mb-4">
                <Card className="flex-1 mr-2 shadow-lg">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">TICKETS</div>
                    <div className="flex items-center">
                      <Ticket className="h-4 w-4 text-primary mr-2" />
                      <span className="font-semibold">5</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="flex-1 mx-1 shadow-lg">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">PRICE</div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-400 mr-1" />
                      <span className="font-semibold">£3.50</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="flex-1 ml-2 shadow-lg">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">TOTAL</div>
                    <div className="flex items-center">
                      <span className="font-semibold">£17.50</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 flex items-center justify-center">
                <CreditCard className="h-4 w-4 mr-2" /> Proceed to Payment
              </Button>
              <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3 mr-1 text-green-400" /> Secure payment via Stripe
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                  <Ticket className="text-purple-500 h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">2. Enter & Follow Steps</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Once you've found a competition you'd like to enter, the process is straightforward:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span className="text-muted-foreground">Select the number of tickets you want to purchase (up to the maximum allowed)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span className="text-muted-foreground">Complete a secure payment process via Stripe (credit/debit card or Apple Pay)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span className="text-muted-foreground">Your entry is confirmed immediately after successful payment</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                  <LineChart className="text-primary h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">3. Track Your Entries</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Stay on top of your competition entries through your personal dashboard:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span className="text-muted-foreground">View all your active competitions in one place</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span className="text-muted-foreground">Track countdown timers to know exactly when each competition closes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span className="text-muted-foreground">Receive notifications when competitions are about to end</span>
                </li>
              </ul>
              <Link href="/my-entries">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  View My Entries <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Active Entries</h3>
                <div className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">3 entries</div>
              </div>
              
              <Card className="mb-3 border-l-4 border-l-pink-400">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Ninja Air Fryer</h4>
                    <span className="text-xs bg-pink-400/20 text-pink-400 px-2 py-0.5 rounded">Appliances</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tickets: 2</span>
                    <div className="flex items-center">
                      <Timer className="h-3 w-3 mr-1 text-orange-400" />
                      <span className="text-orange-400">3 days left</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mb-3 border-l-4 border-l-green-400">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">£5,000 Cash Prize</h4>
                    <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded">Cash</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tickets: 5</span>
                    <div className="flex items-center">
                      <Timer className="h-3 w-3 mr-1 text-red-400" />
                      <span className="text-red-400">8 hours left</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="bg-card p-6 rounded-lg border border-border order-2 md:order-1">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-orange-500/80 rounded-full flex items-center justify-center animate-pulse z-10">
                    <Trophy className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute w-full h-full bg-orange-500/20 rounded-full animate-ping"></div>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1513151233558-d860c5398176?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=350&q=80" 
                  alt="Celebration confetti" 
                  className="w-full h-auto rounded-lg opacity-50"
                />
              </div>
              
              <div className="text-center mt-6">
                <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
                <p className="text-muted-foreground text-sm mb-4">You've won the Dyson V11 Vacuum worth £500!</p>
                <Button className="bg-orange-500 hover:bg-orange-600">Claim Your Prize</Button>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mr-4">
                  <Trophy className="text-orange-500 h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">4. Win & Celebrate</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                When you're a lucky winner, here's what happens next:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span className="text-muted-foreground">You'll receive an immediate notification via email and in-app alert</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span className="text-muted-foreground">Follow the simple claim process to verify your identity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span className="text-muted-foreground">Receive your prize directly or coordinate delivery for physical items</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span className="text-muted-foreground">Your win is recorded in your profile for future bragging rights!</span>
                </li>
              </ul>
              <Link href="/my-wins">
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10">
                  View My Wins <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Additional tips section */}
          <div className="bg-card rounded-lg p-8 border border-border mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Additional Tips for Success</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Bell className="text-primary h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">Enable Notifications</h3>
                <p className="text-muted-foreground text-sm">
                  Turn on email and push notifications to never miss a competition closing or winner announcement.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                  <User className="text-yellow-500 h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">Complete Your Profile</h3>
                <p className="text-muted-foreground text-sm">
                  Make sure your profile information is up-to-date to streamline prize delivery when you win.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center mb-4">
                  <Mail className="text-green-400 h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">Subscribe to Updates</h3>
                <p className="text-muted-foreground text-sm">
                  Join our newsletter to receive updates about new competitions and special offers.
                </p>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">How are winners selected?</h3>
                  <p className="text-muted-foreground">
                    Winners are selected randomly through our secure drawing system. Every ticket has an equal chance of winning.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">How long do I have to claim my prize?</h3>
                  <p className="text-muted-foreground">
                    You have 14 days from the announcement to claim your prize. If unclaimed, a new winner may be selected.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Can I enter competitions from outside the UK?</h3>
                  <p className="text-muted-foreground">
                    Most competitions are open to international participants, but some prizes may have delivery restrictions. Check the specific competition details for eligibility.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Are my payment details secure?</h3>
                  <p className="text-muted-foreground">
                    Yes, all payments are processed securely through Stripe, a leading payment processor with bank-level security and encryption.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Ready to start CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Winning?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Now that you know how it works, dive in and start exploring our exciting competitions. Your next big win could be just a ticket away!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/competitions">
                <Button size="lg" className="shine-btn group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  Browse Competitions <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Create Account <User className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


