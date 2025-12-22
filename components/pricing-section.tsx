import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Mensal",
    price: "15.000",
    period: "mês",
    description: "Ideal para começar",
    features: [
      "Até 100 alunos",
      "Formações ilimitadas",
      "Gestão de turmas",
      "Sistema de pagamentos",
      "Suporte por email",
    ],
  },
  {
    name: "Trimestral",
    price: "40.000",
    period: "3 meses",
    description: "Mais popular",
    popular: true,
    features: [
      "Até 300 alunos",
      "Formações ilimitadas",
      "Gestão de turmas",
      "Sistema de pagamentos",
      "Suporte prioritário",
      "Relatórios avançados",
    ],
  },
  {
    name: "Anual",
    price: "150.000",
    period: "ano",
    description: "Melhor valor",
    features: [
      "Alunos ilimitados",
      "Formações ilimitadas",
      "Gestão de turmas",
      "Sistema de pagamentos",
      "Suporte 24/7",
      "Relatórios avançados",
      "Treinamento gratuito",
    ],
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance">
            Planos transparentes e acessíveis
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-lg leading-relaxed">
            Escolha o plano ideal para o seu centro de formação. Comece com 3 dias grátis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border-border ${plan.popular ? "border-primary border-2 shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </div>
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="mb-4">{plan.description}</CardDescription>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> Kz/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                  <Link href="/register">Começar Teste Grátis</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
