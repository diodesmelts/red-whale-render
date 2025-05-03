import { Helmet } from "react-helmet";
import { Heart, Home, Award, Gift, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutUs() {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>About Us | MobyComps</title>
      </Helmet>
      
      {/* Hero Section */}
      <section className="relative bg-[#002147] py-20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#bbd665]/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#bbd665]/5 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-5xl font-extrabold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              About <span className="text-[#bbd665]">Moby Comps</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-white/80 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              A family-run business with heart, soul, and a mission to give back.
            </motion.p>
          </div>
        </div>
      </section>
      
      {/* Values Section */}
      <section className="py-20 bg-[#bbd665]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#002147] mb-4">Our Values</h2>
            <p className="text-lg text-[#002147]/80 max-w-3xl mx-auto">
              What makes Moby Comps special is our commitment to our core values.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              {
                icon: <Home className="h-8 w-8 text-[#002147]" />,
                title: "Family-Run",
                description: "Based in Devon, we're a close-knit family bringing competitions with a personal touch."
              },
              {
                icon: <Gift className="h-8 w-8 text-[#002147]" />,
                title: "For Everyone",
                description: "From big-ticket items to everyday essentials that make life better, sunnier, and happier."
              },
              {
                icon: <Heart className="h-8 w-8 text-[#002147]" />,
                title: "Giving Back",
                description: "Monthly charity donations are part of our commitment to the community and our values."
              },
              {
                icon: <Users className="h-8 w-8 text-[#002147]" />,
                title: "Community",
                description: "We believe family and community are everything - it's in our DNA."
              }
            ].map((value, index) => (
              <motion.div 
                key={index}
                className="bg-white/90 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="bg-[#bbd665]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-[#002147] mb-3 text-center">{value.title}</h3>
                <p className="text-[#002147]/80 text-center">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-48 h-48 bg-[#bbd665]/30 rounded-full blur-[30px] z-0"></div>
                <div className="relative z-10 rounded-xl overflow-hidden border-4 border-[#002147] shadow-xl">
                  <div className="aspect-w-4 aspect-h-3">
                    <div className="w-full h-full bg-gradient-to-br from-[#002147] to-[#002147]/60 flex items-center justify-center p-12">
                      <div className="text-center">
                        <div className="text-7xl font-bold text-[#bbd665] mb-4">MC</div>
                        <div className="text-2xl text-white font-medium">Moby Comps</div>
                        <div className="mt-4 text-sm text-white/70">Est. 2024</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-[#002147] mb-6">Our Story</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-[#002147]/80">
                  Moby Comps are a family run business based in Devon. We started with a simple mission: 
                  to create exciting competition opportunities that bring joy to everyone, regardless of budget.
                </p>
                <p className="text-[#002147]/80 mt-4">
                  For us it's not just about the "BIG" prizes but also the smaller everyday items that 
                  can make our lives easier, sunnier, happier. We believe in offering something for everyone.
                </p>
                <p className="text-[#002147]/80 mt-4">
                  We make monthly donations to charity and believe family and community are everything.
                  Giving back is important to us, it's in our DNA.
                </p>
                <div className="mt-8">
                  <div className="inline-block bg-[#bbd665] text-[#002147] px-6 py-3 rounded-lg font-bold text-lg">
                    Thank you for being part of our journey!
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Impact Section */}
      <section className="py-20 bg-[#002147] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Our Impact</h2>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">
              When you enter our competitions, you're helping us make a difference.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 transition-all hover:bg-white/15"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-[#bbd665]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Heart className="h-8 w-8 text-[#bbd665]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Monthly Donations</h3>
                <p className="text-white/80 text-center">
                  Every month, we donate a portion of our profits to charities making a real difference in communities.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 transition-all hover:bg-white/15"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-[#bbd665]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Award className="h-8 w-8 text-[#bbd665]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Creating Winners</h3>
                <p className="text-white/80 text-center">
                  We've changed lives through our prize draws, bringing joy and excitement to our winners.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 transition-all hover:bg-white/15"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-[#bbd665]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-[#bbd665]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Community Focus</h3>
                <p className="text-white/80 text-center">
                  Our business grows with our community, fostering connections and shared experiences.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-[#bbd665]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#002147] mb-6">Join Our Community</h2>
            <p className="text-lg text-[#002147]/80 max-w-3xl mx-auto mb-8">
              Enter competitions, win amazing prizes, and be part of something that gives back.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <a 
                href="/competitions" 
                className="px-8 py-4 bg-[#002147] text-white font-bold rounded-lg text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Browse Competitions
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}