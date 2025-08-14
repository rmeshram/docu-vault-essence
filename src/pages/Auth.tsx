import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Phone, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(formData.email, formData.password, { name: formData.name });
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (!error) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Header */}
      <div className="bg-gradient-primary h-64 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-4 mx-auto">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                <span className="text-primary font-bold text-xl">D</span>
              </div>
            </div>
            <h1 className="text-white text-2xl font-bold">DocuVault AI</h1>
            <p className="text-white/80 text-sm">AI-Powered Document Management</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="px-6 -mt-20 relative z-10">
        <Card className="bg-card border-0 shadow-large rounded-3xl">
          <CardHeader className="text-center pb-4">
            <h2 className="text-2xl font-bold">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp 
                ? "Join thousands managing documents with AI" 
                : "Sign in to access your documents"
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email/Phone Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 h-12 rounded-xl border-2"
                  />
                </div>
              </div>

              {isSignUp && (
                <>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="h-12 rounded-xl border-2"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone number (optional)"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10 h-12 rounded-xl border-2"
                    />
                  </div>
                </>
              )}

              {/* Password Input */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="h-12 rounded-xl border-2 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {isSignUp && (
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="h-12 rounded-xl border-2"
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-medium rounded-xl uppercase tracking-wide disabled:opacity-50"
              >
                {isLoading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 rounded-xl">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button variant="outline" className="h-12 rounded-xl">
                <Apple className="w-5 h-5 mr-2" />
                Apple
              </Button>
            </div>

            {/* Toggle Sign Up/In */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary text-sm font-medium"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}