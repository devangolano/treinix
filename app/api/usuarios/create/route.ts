import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('1️⃣ Criando usuário no Supabase Auth via Admin API...')
    
    // Usar o admin API com a chave de serviço
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    })

    if (authError || !authData?.user) {
      console.error('❌ Erro ao criar usuário no Auth:', authError)
      
      // Mensagens de erro mais amigáveis
      let errorMessage = 'Erro ao criar usuário'
      
      if (authError?.code === 'email_exists' || authError?.message?.includes('already been registered')) {
        errorMessage = 'Este email já está registrado. Use outro email.'
      } else if (authError?.code === 'weak_password') {
        errorMessage = 'A senha é muito fraca. Use uma senha mais forte.'
      } else if (authError?.message) {
        errorMessage = authError.message
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    console.log('✅ Usuário criado no Auth com ID:', authData.user.id)

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
    })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
