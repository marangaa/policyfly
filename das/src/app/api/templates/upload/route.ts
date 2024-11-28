import { NextResponse } from 'next/server'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { writeFile, access, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a ZIP instance from the buffer
    const zip = new PizZip(buffer)
    
    // Create Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    // Get template content to extract variables
    const text = doc.getFullText()
    
    // Extract variables using regex
    const variableRegex = /{{([^{}]+)}}/g
    const variables = new Set<string>()
    let match

    while ((match = variableRegex.exec(text)) !== null) {
      variables.add(match[1].trim())
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'templates')
    await createDirIfNotExists(uploadDir)

    // Save file
    const fileName = `${Date.now()}-${file.name}`
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Save template to database
    const template = await prisma.template.create({
      data: {
        name: file.name,
        category: 'general', // Default category
        filePath: fileName,
        variables: Array.from(variables),
      },
    })

    return NextResponse.json({
      message: 'Template uploaded successfully',
      template: {
        id: template.id,
        name: template.name,
        variables: Array.from(variables),
      },
    })

  } catch (error) {
    console.error('Template upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process template' },
      { status: 500 }
    )
  }
}

// Helper function to create directory if it doesn't exist
async function createDirIfNotExists(dir: string) {
  try {
    await access(dir)
  } catch {
    await mkdir(dir, { recursive: true })
  }
}