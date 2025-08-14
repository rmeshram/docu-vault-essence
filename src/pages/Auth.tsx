import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, Apple, Camera, Sparkles, Shield, Globe, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    navigate('/');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-header relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Branding */}
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-elegant">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-medium">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-white text-4xl font-bold mb-2 tracking-tight">DocuVault AI</h1>
            <p className="text-white/90 text-lg font-medium mb-2">Secure Your Life's Documents with AI</p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Badge className="bg-white/20 text-white border-white/30">
                <Shield className="w-3 h-3 mr-1" />
                Bank-Grade Security
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30">
                <Globe className="w-3 h-3 mr-1" />
                15+ Languages
              </Badge>
            </div>
          </div>

          {/* Auth Form Card */}
          <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-elegant rounded-3xl fade-in">
            <CardHeader className="text-center pb-6">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {isSignUp ? "Create Your Vault" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground text-lg">
                {isSignUp 
                  ? "Join thousands managing documents with AI" 
                  : "Sign in to access your secure document vault"
                }
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name (Sign Up Only) */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="h-14 rounded-2xl border-2 text-base"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-2 text-base"
                      required
                    />
                  </div>
                </div>

                {/* Phone (Sign Up Only) */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-12 h-14 rounded-2xl border-2 text-base"
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="h-14 rounded-2xl border-2 pr-12 text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Sign Up Only) */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="h-14 rounded-2xl border-2 text-base"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}

                {/* Terms and Conditions (Sign Up Only) */}
                {isSignUp && (
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={setAcceptTerms}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline font-medium">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline font-medium">
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                )}

                {/* Forgot Password Link (Sign In Only) */}
                {!isSignUp && (
                  <div className="text-right">
                    <a href="#" className="text-sm text-primary hover:underline font-medium">
                      Forgot your password?
                    </a>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isLoading || (isSignUp && !acceptTerms)}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl text-base shadow-medium hover:shadow-large transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isSignUp ? "Creating Account..." : "Signing In..."}
                    </>
                  ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-white px-4 text-muted-foreground font-medium">Or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-2xl border-2 hover:bg-muted/50 transition-colors">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl border-2 hover:bg-muted/50 transition-colors">
                  <Apple className="w-5 h-5 mr-3" />
                  Apple
                </Button>
              </div>

              {/* AI-Powered Features */}
              {isSignUp && (
                <div className="relative">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-2 border-accent/30 bg-accent/5 hover:bg-accent/10 text-accent-foreground transition-colors"
                  >
                    <Camera className="w-5 h-5 mr-3" />
                    Quick Signup with ID Scan
                    <Badge className="ml-auto bg-accent/20 text-accent text-xs">AI Powered</Badge>
                  </Button>
                </div>
              )}

              {/* Toggle Sign Up/In */}
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary text-base font-medium hover:underline transition-colors"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Create one"
                  }
                </button>
              </div>

              {/* Security Features */}
              <div className="bg-muted/30 rounded-2xl p-4 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-success" />
                  <span className="font-medium text-sm">Your data is protected</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span>256-bit encryption</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span>GDPR compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span>Zero-knowledge</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}