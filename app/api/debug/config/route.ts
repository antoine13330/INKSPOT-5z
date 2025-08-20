import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const fs = require('fs')
    const path = require('path')
    
    const configPath = path.join(process.cwd(), 'next.config.js')
    const configContent = fs.readFileSync(configPath, 'utf8')
    
    return NextResponse.json({
      success: true,
      config: configContent,
      message: 'Contenu brut du next.config.js'
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Impossible de lire next.config.js',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
