import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Calendar, CreditCard, UserCog, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Gestão de Alunos",
    description: "Cadastre e gerencie todos os dados dos seus alunos em um único lugar de forma organizada.",
  },
  {
    icon: GraduationCap,
    title: "Formações",
    description: "Crie e organize seus cursos com informações detalhadas sobre duração, preços e categorias.",
  },
  {
    icon: Calendar,
    title: "Turmas",
    description: "Gerencie turmas, horários e vagas disponíveis para cada formação oferecida.",
  },
  {
    icon: CreditCard,
    title: "Pagamentos",
    description: "Controle pagamentos com suporte a até 2 prestações e múltiplos métodos de pagamento.",
  },
  {
    icon: UserCog,
    title: "Usuários",
    description: "Crie contas para administradores e secretários com permissões personalizadas.",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Acompanhe o desempenho do seu centro com relatórios e estatísticas detalhadas.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="max-w-175 text-muted-foreground md:text-lg leading-relaxed">
            Ferramentas poderosas e intuitivas para simplificar a gestão do seu centro de formação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
