import { SignUp } from '@clerk/clerk-react'
import { motion } from 'framer-motion'

export default function Signup() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-20 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="text-4xl font-bold text-[#C4663A]">राही</span>
          <p className="text-[#8B5E3C] text-sm mt-2">Create your account to start planning</p>
        </div>
        <SignUp
          routing="hash"
          afterSignUpUrl="/"
          appearance={{
            variables: {
              colorPrimary:       '#C4663A',
              colorBackground:    '#FFFFFF',
              colorText:          '#3D2314',
              colorTextSecondary: '#8B5E3C',
              colorInputBackground: '#FAFAF8',
              borderRadius:       '16px',
              fontFamily:         'Inter, sans-serif',
            },
            elements: {
              card:               'shadow-xl border border-[#F0E6DC] rounded-3xl',
              headerTitle:        'text-[#2C1810] font-bold',
              headerSubtitle:     'text-[#8B5E3C]',
              socialButtonsBlockButton: 'border-[#F0E6DC] hover:border-[#C4663A] transition-colors',
              formButtonPrimary:  'bg-[#C4663A] hover:bg-[#A85530]',
              footerActionLink:   'text-[#C4663A] hover:text-[#A85530]',
            }
          }}
        />
      </motion.div>
    </div>
  )
}