"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function GradientSide() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] items-center justify-center p-8 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className={`mx-auto transition-transform duration-1000 transform ${isLoaded ? "scale-100" : "scale-0"}`}>
          <Image
            src="/images/design-mode/1000092426-removebg-preview.png"
            alt="Team Krishna Arora Logo"
            width={320}
            height={320}
            className="mx-auto filter brightness-0 invert"
            priority
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
