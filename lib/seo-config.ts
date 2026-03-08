// SEO Configuration for Formação-Ao
export const SEOConfig = {
  siteName: "Formação-Ao",
  siteUrl: "https://treinix.com",
  locale: "pt_AO",
  titleTemplate: "%s | Formação-Ao",
  defaultTitle: "Formação-Ao | Sistema de Gestão para Centros de Formação",
  description:
    "Plataforma completa para gestão de centros de formação em Angola. Gerencie alunos, turmas, pagamentos e formações em um único lugar. 3 dias grátis!",
  openGraph: {
    type: "website",
    locale: "pt_AO",
    url: "https://treinix.com",
    siteName: "Formação-Ao",
    images: [
      {
        url: "https://treinix.com/link.png",
        width: 1200,
        height: 630,
        alt: "Formação-Ao",
        type: "image/png",
      },
    ],
  },
  twitter: {
    handle: "@FormacaoAO",
    cardType: "summary_large_image",
  },
  keywords: [
    "sistema gestão centros formação Angola",
    "software centros profissionais",
    "gestão alunos turmas",
    "sistema pagamentos formação",
    "plataforma educativa Angola",
    "gestão centros treinamento",
    "software escolas profissionais",
    "controle financeiro centro formação",
    "formação profissional Angola",
    "gestão educacional",
  ],
}

export const structuredData = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Formação-Ao",
    url: "https://treinix.com",
    logo: "https://treinix.com/icon.png",
    description:
      "Plataforma de gestão para centros de formação em Angola",
    sameAs: [
      "https://www.facebook.com/treinix",
      "https://www.instagram.com/treinix",
      "https://twitter.com/FormacaoAO",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "suporte@treinix.com",
    },
  },
  software: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Formação-Ao",
    description:
      "Sistema de gestão para centros de formação profissional",
    url: "https://treinix.com",
    image: "https://treinix.com/link.png",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Teste gratuito por 3 dias",
    },
    author: {
      "@type": "Organization",
      name: "Dev Angolano",
    },
  },
}
