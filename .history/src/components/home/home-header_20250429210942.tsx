"use client"
import { useWalletList, useWallet } from '@meshsdk/react';
import { checkSignature, generateNonce } from "@meshsdk/core";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation'; // <-- added
import Link from "next/link";
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown } from "lucide-react";
import { Button } from '../ui/button';

export function HomeHeader() {
  const router = useRouter(); // <-- added
  const { connect, connected, disconnect, name, wallet } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const walletDetailsRef = useRef<HTMLDivElement>(null);
  const wallets = useWalletList();
  
  // Close wallet details popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletDetailsRef.current && !walletDetailsRef.current.contains(event.target as Node)) {
        setShowWalletDetails(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function authenticateUser() {
      if (wallet && connected) {
        try {
          const addr = await wallet.getChangeAddress();
          setWalletAddress(addr);
          const nonce = generateNonce(
            "Welcome to DanoFund - Please sign to authenticate"
          );

          let signature;
          let result = false;
          let retryCount = 0;

          while (!result && retryCount < 3) {
            try {
              signature = await wallet.signData(nonce, addr);
              result = await checkSignature(nonce, signature, addr);

              if (!result) {
                retryCount++;
                if (retryCount < 3) {
                  console.warn(
                    `Signature verification failed. Retrying (${retryCount}/3)...`
                  );
                  alert("Signature verification failed. Please sign again.");
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              }
            } catch (signError) {
              console.error("Error during signing:", signError);
              retryCount++;
              if (retryCount < 3) {
                alert("Failed to sign message. Please try again.");
                await new Promise((resolve) => setTimeout(resolve, 1000));
              } else {
                throw signError;
              }
            }
          }

          if (result) {
            setIsAuthenticated(true);
            console.log("Wallet connected and authenticated successfully!");
            router.push(`/dashboard/${addr}`); // <-- added navigation after auth success
          } else {
            alert(
              "Failed to verify your signature after multiple attempts. Please reconnect your wallet."
            );
            throw new Error(
              "Signature verification failed after multiple attempts"
            );
          }
        } catch (error) {
          console.error("Error authenticating:", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    }

    if (connected) {
      authenticateUser();
    }
  }, [wallet, connected, router]);
  
  const handleConnectWallet = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="w-full px-4 sm:px-6 lg:px-8 py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-primary/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold gradient-text">DanoFund</span>
        </Link>

        <div className="relative">
          {connected && isAuthenticated ? (
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowWalletDetails(!showWalletDetails)}
                className="hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-purple-500 flex-shrink-0"></div>
                <span className="hidden md:inline max-w-[150px] truncate">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : name}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {showWalletDetails && (
                <div 
                  ref={walletDetailsRef}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-md shadow-xl overflow-hidden z-20 border border-primary/10"
                >
                  <div className="p-4 bg-gradient-to-r from-primary to-purple-500 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold">Ví của bạn</div>
                      <div className="text-xs bg-white/20 rounded px-2 py-1">{name}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{formatAda(walletBalance.lovelace)} ₳</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Địa chỉ ví</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded flex-grow truncate">
                          {walletAddress}
                        </div>
                        <button 
                          onClick={copyAddressToClipboard}
                          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Sao chép địa chỉ"
                        >
                          <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={viewInExplorer}
                          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Xem trên explorer"
                        >
                          <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tài sản</div>
                      <div className="max-h-[100px] overflow-auto bg-gray-50 dark:bg-gray-800 rounded p-1">
                        {walletBalance.assets && walletBalance.assets.length > 0 ? (
                          <div className="space-y-1">
                            {walletBalance.assets.slice(0, 5).map((asset: any, index) => (
                              <div key={index} className="text-sm p-1 flex justify-between">
                                <div className="truncate max-w-[180px]">
                                  {asset.unit.slice(0, 8)}...{asset.unit.slice(-4)}
                                </div>
                                <div>{asset.quantity}</div>
                              </div>
                            ))}
                            {walletBalance.assets.length > 5 && (
                              <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-1">
                                +{walletBalance.assets.length - 5} tài sản khác
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm p-2 text-gray-500 dark:text-gray-400">Không tìm thấy tài sản</div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      onClick={disconnect}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Ngắt kết nối ví</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button onClick={handleConnectWallet} variant="outline" className="hover:border-primary hover:text-primary transition-colors">
                <Wallet className="mr-2 h-4 w-4" />
                Kết nối ví
              </Button>
              {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-primary/10 rounded-md shadow-lg z-10">
                  {wallets.map((wallet, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={async () => {
                        await connect(wallet.name);
                        setIsOpen(false);
                      }}
                    >
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-8 h-8 mr-3"
                      />
                      <span>{wallet.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
