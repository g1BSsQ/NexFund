"use client"
import { useWalletList, useWallet } from '@meshsdk/react';
import { checkSignature, generateNonce } from "@meshsdk/core";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation'; // <-- added
import Link from "next/link";
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown } from "lucide-react";
import { Button } from '../ui/button';
import Image from "next/image";

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

          while (!result) {
            try {
              signature = await wallet.signData(nonce, addr);
              result = await checkSignature(nonce, signature, addr);

              if (!result) {
                  console.warn(
                    `Signature verification failed.`
                  );
              }
            } catch (signError) {
              console.error("Error during signing:", signError);
                alert("Failed to sign message. Please try again.");
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
          <Image
            src="/logofull.svg" // Đường dẫn đến file logo trong thư mục public
            alt="DanoFund Logo"
            width={150}
            height={40}
            priority
            className="h-auto"
          />
        </Link>

        <div className="relative">
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
        </div>
      </div>
    </header>
  );
}
