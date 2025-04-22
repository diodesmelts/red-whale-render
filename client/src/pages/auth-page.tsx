import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema, insertUserSchema } from "@shared/schema";
import { Trophy, ShieldCheck, Bell } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  
  // Parse URL parameters for potential tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    }
  }, [location]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false
    }
  });
  
  // Register form with extended schema
  const registerForm = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      mascot: "blue-whale",
      agreeToTerms: false,
      notificationSettings: {
        email: true,
        inApp: true
      }
    }
  });
  
  // Handle login submission
  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    setLoginError(null);
    loginMutation.mutate(data, {
      onError: (error) => {
        setLoginError(error.message);
      },
      onSuccess: () => {
        navigate("/");
      }
    });
  };
  
  // Handle register submission
  const onRegisterSubmit = (data: z.infer<typeof insertUserSchema>) => {
    setRegisterError(null);
    registerMutation.mutate(data, {
      onError: (error) => {
        setRegisterError(error.message);
      },
      onSuccess: () => {
        navigate("/");
      }
    });
  };
  
  return (
      <section className="py-16 flex-grow bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Auth form */}
            <div className="w-full md:w-1/3 bg-card rounded-lg shadow-lg p-8 border border-border">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <h2 className="text-2xl font-bold text-primary mb-6">Welcome Back</h2>
                  <p className="text-muted-foreground mb-6">Sign in to continue your competition journey</p>
                  
                  {loginError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <div className="mb-4">
                      <Label htmlFor="username" className="block text-sm font-medium mb-1">Username</Label>
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        {...loginForm.register("username")}
                        className="bg-secondary"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <Label htmlFor="password" className="block text-sm font-medium mb-1">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...loginForm.register("password")}
                          className="bg-secondary pr-10"
                        />
                        <button 
                          type="button" 
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <Checkbox 
                          id="rememberMe" 
                          {...loginForm.register("rememberMe")}
                        />
                        <label htmlFor="rememberMe" className="ml-2 block text-sm text-muted-foreground">
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-sm text-primary hover:text-primary/80">
                        Forgot password?
                      </a>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full shine-btn group relative overflow-hidden"
                      disabled={loginMutation.isPending}
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                      {loginMutation.isPending ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <i className="fas fa-sign-in-alt mr-2"></i> Sign In
                        </span>
                      )}
                    </Button>
                    
                    <div className="mt-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Don't have an account? <a href="#" className="text-primary hover:text-primary/80" onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("register");
                        }}>Register now</a>
                      </p>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <h2 className="text-2xl font-bold text-primary mb-6">Create an Account</h2>
                  <p className="text-muted-foreground mb-6">Join Red Whale Competitions to start winning amazing prizes</p>
                  
                  {registerError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{registerError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="register-username" className="block text-sm font-medium mb-1">Username</Label>
                      <Input
                        id="register-username"
                        placeholder="Choose a username"
                        {...registerForm.register("username")}
                        className="bg-secondary"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="block text-sm font-medium mb-1">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        {...registerForm.register("email")}
                        className="bg-secondary"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="display-name" className="block text-sm font-medium mb-1">Display Name (Optional)</Label>
                      <Input
                        id="display-name"
                        placeholder="How should we call you?"
                        {...registerForm.register("displayName")}
                        className="bg-secondary"
                      />
                      {registerForm.formState.errors.displayName && (
                        <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.displayName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="register-password" className="block text-sm font-medium mb-1">Password</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          {...registerForm.register("password")}
                          className="bg-secondary pr-10"
                        />
                        <button 
                          type="button" 
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password" className="block text-sm font-medium mb-1">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        {...registerForm.register("confirmPassword")}
                        className="bg-secondary"
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <Checkbox 
                          id="agree-terms" 
                          {...registerForm.register("agreeToTerms")}
                        />
                      </div>
                      <label htmlFor="agree-terms" className="ml-2 block text-sm text-muted-foreground">
                        I agree to the <a href="#" className="text-primary hover:text-primary/80">Terms and Conditions</a> and <a href="#" className="text-primary hover:text-primary/80">Privacy Policy</a>
                      </label>
                    </div>
                    {registerForm.formState.errors.agreeToTerms && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.agreeToTerms.message}</p>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full shine-btn group relative overflow-hidden"
                      disabled={registerMutation.isPending}
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                      {registerMutation.isPending ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating account...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <i className="fas fa-user-plus mr-2"></i> Create Account
                        </span>
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm">
                        Already have an account? <a href="#" className="text-primary hover:text-primary/80" onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("login");
                        }}>Sign in</a>
                      </p>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Features */}
            <div className="w-full md:w-2/3 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-8">
                Win Big with <span className="text-primary">Competition</span>Time
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-card rounded-lg p-6 border border-border hover:border-orange-500 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <Trophy className="text-orange-500 h-5 w-5" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg mb-2">Amazing Prizes</h3>
                  <p className="text-muted-foreground">
                    Win exciting prizes from top brands and retailers.
                  </p>
                </div>
                
                {/* Feature 2 */}
                <div className="bg-card rounded-lg p-6 border border-border hover:border-purple-500 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <ShieldCheck className="text-purple-500 h-5 w-5" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg mb-2">Secure & Trusted</h3>
                  <p className="text-muted-foreground">
                    We verify all competitions for legitimacy and safety.
                  </p>
                </div>
                
                {/* Feature 3 */}
                <div className="bg-card rounded-lg p-6 border border-border hover:border-primary transition-all duration-300 group">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <Bell className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg mb-2">Never Miss Out</h3>
                  <p className="text-muted-foreground">
                    Get alerts for new competitions and draw announcements.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Button 
                  size="lg"
                  className="shine-btn group relative overflow-hidden"
                  onClick={() => setActiveTab("register")}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  Create an account to get started <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}
