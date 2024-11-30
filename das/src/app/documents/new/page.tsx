import { DocumentGenerationForm } from './document-generation-form'
import { prisma } from '@/lib/prisma'

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const templates = await prisma.template.findMany({
    orderBy: { name: 'asc' }
  })

  let initialTemplate = null
  const templateId = searchParams?.template as string | undefined;

  if (templateId) {
    initialTemplate = await prisma.template.findUnique({
      where: { id: templateId }
    })
  }

  return (
    <DocumentGenerationForm 
      templates={templates} 
      initialTemplate={initialTemplate}
    />
  )
}
