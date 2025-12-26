import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { SubscriptionRefreshProvider } from "@/hooks/use-subscription-refresh"
import "./globals.css"
import "@/styles/treinix-theme.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Treinix | Sistema de Gestão para Centros de Formação",
  description:
    "Plataforma completa para gestão de centros de formação em Angola. Gerencie alunos, turmas, pagamentos e formações em um único lugar. 3 dias grátis!",
  keywords: [
    "sistema gestão centros formação Angola",
    "software centros profissionais",
    "gestão alunos turmas",
    "sistema pagamentos formação",
    "plataforma educativa Angola",
    "gestão centros treinamento",
    "software escolas profissionais",
    "controle financeiro centro formação",
  ],
  generator: "Dev Angolano",
  applicationName: "Treinix",
  authors: [{ name: "Dev Angolano" }],
  creator: "Dev Angolano",
  publisher: "Treinix",
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_AO",
    url: "https://treinix.vercel.app",
    title: "Treinix | Sistema de Gestão para Centros de Formação",
    description:
      "Plataforma completa para gestão de centros de formação em Angola. Gerencie alunos, turmas, pagamentos e formações em um único lugar. 3 dias grátis!",
    siteName: "Treinix",
    images: [
      {
        url: "/link.png",
        width: 1200,
        height: 630,
        alt: "Treinix - Sistema de Gestão para Centros de Formação",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Treinix | Sistema de Gestão para Centros de Formação",
    description:
      "Plataforma completa para gestão de centros de formação em Angola. 3 dias grátis!",
    images: ["/link.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://treinix.vercel.app",
    languages: {
      "pt-AO": "https://treinix.vercel.app",
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Treinix",
    description:
      "Plataforma completa para gestão de centros de formação em Angola. Gerencie alunos, turmas, pagamentos e formações.",
    url: "https://treinix.vercel.app",
    image: "https://treinix.vercel.app/link.png",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "250",
    },
    author: {
      "@type": "Organization",
      name: "Dev Angolano",
    },
  }

  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <SubscriptionRefreshProvider>
            {children}
          </SubscriptionRefreshProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
