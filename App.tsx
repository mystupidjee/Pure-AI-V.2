/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory, Creation } from './components/CreationHistory';
import { InfoModal } from './components/InfoModal';
import { bringToLife } from './services/gemini';
import { ArrowUpTrayIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import GooglePayButton from '@google-pay/button-react';
import { initAuth, googleSignIn, logout } from './lib/firebase';
import { User } from 'firebase/auth';
import { getUserCredits, deductCredit, addCredits } from './lib/credits';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (loggedInUser) => {
        setUser(loggedInUser);
        const userCredits = await getUserCredits(loggedInUser.uid);
        setCredits(userCredits);
      },
      () => {
        setUser(null);
        setCredits(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load history from local storage or fetch examples on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      let loadedHistory: Creation[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
          }));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (loadedHistory.length > 0) {
        setHistory(loadedHistory);
      }
    };

    initHistory();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
        try {
            localStorage.setItem('gemini_app_history', JSON.stringify(history));
        } catch (e) {
            console.warn("Local storage full or error saving history", e);
        }
    }
  }, [history]);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (promptText: string, file?: File) => {
    if (!user) {
      alert("Please sign in to start creating.");
      googleSignIn();
      return;
    }

    if (credits === null || credits <= 0) {
      alert("You don't have enough credits! Please purchase more.");
      return;
    }

    setIsGenerating(true);
    // Clear active creation to show loading state
    setActiveCreation(null);

    try {
      // Deduct credit first
      const success = await deductCredit(user.uid);
      if (!success) {
        alert("Could not deduct credit. Please try again.");
        setIsGenerating(false);
        return;
      }
      setCredits(prev => (prev ? prev - 1 : 0));

      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      if (file) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type.toLowerCase();
      }

      const html = await bringToLife(promptText, imageBase64, mimeType);
      
      if (html) {
        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: file ? file.name : 'New Creation',
          html: html,
          // Store the full data URL for easy display
          originalImage: imageBase64 && mimeType ? `data:${mimeType};base64,${imageBase64}` : undefined,
          timestamp: new Date(),
        };
        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);
      }

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Something went wrong while bringing your file to life. Please try again.");
      // optionally refund credit if failed
      if (user) {
        await addCredits(user.uid, 1);
        setCredits(prev => (prev !== null ? prev + 1 : 1));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = event.target?.result as string;
            const parsed = JSON.parse(json);
            
            // Basic validation
            if (parsed.html && parsed.name) {
                const importedCreation: Creation = {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp || Date.now()),
                    id: parsed.id || crypto.randomUUID()
                };
                
                // Add to history if not already there (by ID check)
                setHistory(prev => {
                    const exists = prev.some(c => c.id === importedCreation.id);
                    return exists ? prev : [importedCreation, ...prev];
                });

                // Set as active immediately
                setActiveCreation(importedCreation);
            } else {
                alert("Invalid creation file format.");
            }
        } catch (err) {
            console.error("Import error", err);
            alert("Failed to import creation.");
        }
        // Reset input
        if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const isFocused = !!activeCreation || isGenerating;

  const handlePaymentLoadPaymentData = async (paymentRequest: any) => {
    console.log('load payment data', paymentRequest);
    if (user) {
      await addCredits(user.uid, 10);
      setCredits(prev => (prev !== null ? prev + 10 : 10));
      alert("Successfully purchased 10 credits!");
    } else {
      alert("Please sign in first.");
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('pay error', error);
  };

  return (
    <div className="h-[100dvh] bg-[#05050A] text-zinc-50 selection:bg-purple-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col font-sans">
      
      {/* Background gradients for premium feel */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-[20%] left-[20%] right-[20%] bottom-[20%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPjwvc3ZnPg==')] opacity-30 mix-blend-overlay"></div>
      </div>

      {/* Header / Nav */}
      <div className={`w-full flex justify-between items-center px-6 py-4 absolute top-0 left-0 right-0 z-30 transition-opacity duration-700 ${isFocused ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="text-2xl font-extrabold tracking-tighter text-white flex items-center gap-4">
          <span>Nova<span className="text-purple-400">Forge</span></span>
          <button 
            onClick={() => setIsInfoModalOpen(true)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
            title="App Specifications & Info"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 text-zinc-300 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg shadow-black/50">
              <span className="text-yellow-400">⚡</span>
              <span>{credits !== null ? credits : '...'} Credits</span>
            </div>
          )}
          <GooglePayButton
            environment="TEST"
            buttonColor="default"
            buttonType="buy"
            buttonSizeMode="fill"
            paymentRequest={{
              apiVersion: 2,
              apiVersionMinor: 0,
              allowedPaymentMethods: [
                {
                  type: 'CARD',
                  parameters: {
                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                    allowedCardNetworks: ['MASTERCARD', 'VISA'],
                  },
                  tokenizationSpecification: {
                    type: 'PAYMENT_GATEWAY',
                    parameters: {
                      gateway: 'example',
                      gatewayMerchantId: 'exampleGatewayMerchantId',
                    },
                  },
                },
              ],
              merchantInfo: {
                merchantId: '12345678901234567890',
                merchantName: 'Demo Merchant',
              },
              transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPriceLabel: 'Total',
                totalPrice: '10.00',
                currencyCode: 'USD',
                countryCode: 'US',
              },
            }}
            onLoadPaymentData={handlePaymentLoadPaymentData}
            onError={handlePaymentError}
          />

          {!user ? (
            <button
              onClick={() => googleSignIn()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-md hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 hidden sm:block">{user.email}</span>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 text-sm font-medium border border-zinc-700 hover:bg-zinc-800 rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Centered Content Container */}
      <div 
        className={`
          min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isFocused 
            ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden' 
            : 'opacity-100 scale-100 blur-0'
          }
        `}
      >
        {/* Main Vertical Centering Wrapper */}
        <div className="flex-1 flex flex-col justify-center items-center w-full py-12 md:py-20">
          
          {/* 1. Hero Section */}
          <div className="w-full mb-8 md:mb-16">
              <Hero />
          </div>

          {/* 2. Input Section */}
          <div className="w-full flex justify-center mb-8">
              <InputArea onGenerate={handleGenerate} isGenerating={isGenerating} disabled={isFocused} />
          </div>

        </div>
        
        {/* 3. History Section & Footer - Stays at bottom */}
        <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-6">
            <div className="w-full px-2 md:px-0">
                <CreationHistory history={history} onSelect={handleSelectCreation} />
            </div>
            
            <a 
              href="https://x.com/ammaar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors pb-2"
            >
              Created by @ammaar
            </a>
        </div>
      </div>

      {/* Live Preview - Always mounted for smooth transition */}
      <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isFocused={isFocused}
        onReset={handleReset}
      />

      {/* Subtle Import Button (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
            onClick={handleImportClick}
            className="flex items-center space-x-2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors opacity-60 hover:opacity-100"
            title="Import Artifact"
        >
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">Upload previous artifact</span>
            <ArrowUpTrayIcon className="w-5 h-5" />
        </button>
        <input 
            type="file" 
            ref={importInputRef} 
            onChange={handleImportFile} 
            accept=".json" 
            className="hidden" 
        />
      </div>

      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
    </div>
  );
};

export default App;